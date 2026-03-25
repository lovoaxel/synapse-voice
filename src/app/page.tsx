'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceOrb } from '@/components/voice-orb';
import { Waveform } from '@/components/waveform';
import { AgentSelector } from '@/components/agent-selector';
import { MessageLog } from '@/components/message-log';
import { StatusBar } from '@/components/status-bar';
import { AGENTS, type Agent, type Message, type OrbState } from '@/lib/types';
import { playActivation, playDeactivation, playError, playStartup } from '@/lib/sounds';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [state, setState] = useState<OrbState>('idle');
  const [agent, setAgent] = useState<Agent>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const startTime = useRef(new Date());

  const [conversationMode, setConversationMode] = useState(false);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const addMessage = useCallback((role: 'user' | 'agent', text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, text, agentId: agent.id, timestamp: new Date() },
    ]);
  }, [agent.id]);

  // Enter conversation mode — stays listening for 10s after each response
  const enterConversationMode = useCallback(() => {
    setConversationMode(true);
    if (conversationTimerRef.current) clearTimeout(conversationTimerRef.current);
    conversationTimerRef.current = setTimeout(() => {
      setConversationMode(false);
      playDeactivation();
      setState('idle');
      startWakeWordListener();
    }, 10000); // 10s of silence = exit conversation
  }, []);

  // Build context from recent messages for the agent
  const buildContext = useCallback((newMessage: string) => {
    const recent = messages.slice(-8); // Last 4 exchanges
    if (recent.length === 0) return newMessage;
    const history = recent.map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.text}`).join('\n');
    return `[Contexto de conversación reciente]\n${history}\n\nUsuario: ${newMessage}`;
  }, [messages]);

  // Send to agent API
  const sendToAgent = useCallback(async (text: string) => {
    setState('thinking');
    addMessage('user', text);

    // Check for exit phrases
    const lower = text.toLowerCase();
    if (lower.includes('eso es todo') || lower.includes('gracias') || lower.includes('adiós') || lower.includes('hasta luego')) {
      setConversationMode(false);
      if (conversationTimerRef.current) clearTimeout(conversationTimerRef.current);
    }

    try {
      // Send with conversation context
      const messageWithContext = conversationMode ? buildContext(text) : text;
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageWithContext, agentId: agent.id }),
      });
      const data = await res.json();
      const reply = data.text || data.error || 'Sin respuesta';
      addMessage('agent', reply);

      // TTS
      setState('speaking');
      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply.substring(0, 500), voiceId: agent.voiceId }),
        });
        if (ttsRes.ok) {
          const audioBlob = await ttsRes.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            // CONVERSATION MODE: keep listening instead of going back to wake word
            enterConversationMode();
            setState('listening');
            setTranscript('Escuchando...');
            startRecording();
          };
          audio.play();
          return;
        }
      } catch {
        // TTS failed, fall back to browser speech
        const utterance = new SpeechSynthesisUtterance(reply.substring(0, 300));
        utterance.lang = 'es-MX';
        utterance.onend = () => {
          enterConversationMode();
          setState('listening');
          startRecording();
        };
        speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      playError();
      addMessage('agent', 'Error de conexión con el agente.');
      setState('error');
      setTimeout(() => { setState('idle'); startWakeWordListener(); }, 2000);
    }
  }, [agent, addMessage, conversationMode, buildContext, enterConversationMode]);

  // Transcribe audio blob
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState('thinking');
    setTranscript('Transcribiendo...');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text && data.text.trim()) {
        setTranscript(data.text);
        await sendToAgent(data.text);
      } else {
        setTranscript('');
        setState('idle');
        startWakeWordListener();
      }
    } catch {
      playError();
      setState('error');
      setTimeout(() => { setState('idle'); startWakeWordListener(); }, 2000);
    }
  }, [sendToAgent]);

  // Start recording after wake word
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    playActivation();
    setState('listening');
    setTranscript('Escuchando...');
    audioChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (blob.size > 1000) {
        transcribeAudio(blob);
      } else {
        setState('idle');
        startWakeWordListener();
      }
    };

    mediaRecorder.start(250);

    // Silence detection
    const checkSilence = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
      const avg = sum / data.length;

      if (avg < 2) {
        // Silence detected
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            mediaRecorder.stop();
          }, 2000);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    };

    const silenceInterval = setInterval(checkSilence, 200);
    // Safety: stop after 30s max
    const maxTimer = setTimeout(() => { clearInterval(silenceInterval); mediaRecorder.stop(); }, 30000);
    mediaRecorder.addEventListener('stop', () => { clearInterval(silenceInterval); clearTimeout(maxTimer); });
  }, [transcribeAudio]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function startWakeWordListener() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX';
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.toLowerCase().trim();

      // Check all agent wake words
      for (const a of AGENTS) {
        if (text.includes(a.wakeWord) || text.includes(a.wakeWord.replace('hey ', ''))) {
          recognition.stop();
          if (a.id !== agent.id) setAgent(a);
          startRecording();
          return;
        }
      }
    };

    recognition.onerror = () => {
      setTimeout(startWakeWordListener, 1000);
    };

    recognition.onend = () => {
      if (state === 'idle') setTimeout(startWakeWordListener, 500);
    };

    try { recognition.start(); } catch {}
  }

  // Initialize
  const initialize = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      source.connect(analyserNode);
      analyserRef.current = analyserNode;
      setAnalyser(analyserNode);

      playStartup();
      setInitialized(true);
      setState('idle');
      startWakeWordListener();
    } catch {
      playError();
      setState('error');
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!initialized) {
    return (
      <div className="h-screen bg-[#050510] flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-mono font-bold text-slate-200 tracking-tight">
            SYNAPSE <span style={{ color: agent.color }}>AI</span>
          </h1>
          <p className="text-slate-500 font-mono text-sm mt-2">Voice Interface System v2.0</p>
        </div>
        <button
          onClick={initialize}
          className="px-8 py-3 rounded-full font-mono text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
          style={{
            border: `1px solid ${agent.color}`,
            color: agent.color,
            boxShadow: `0 0 30px ${agent.color}20`,
          }}
        >
          Initialize System
        </button>
        <p className="text-slate-600 font-mono text-xs">Requires microphone access • Chrome recommended</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-[#050510] flex flex-col overflow-hidden relative"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.emoji}</span>
          <span className="font-mono font-bold text-lg" style={{ color: agent.color }}>
            {agent.name}
          </span>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
          />
        </div>
        <AgentSelector activeAgent={agent} onSelect={(a) => { setAgent(a); }} />
      </div>

      {/* Orb */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        <VoiceOrb state={state} agentColor={agent.color} />
        {transcript && (
          <p className="font-mono text-sm text-slate-400 mt-4 max-w-md text-center animate-pulse">
            {transcript}
          </p>
        )}
        <Waveform analyser={analyser} color={agent.color} />
      </div>

      {/* Message log */}
      <div className="h-[30vh] px-6 pb-4 flex flex-col">
        <div className="flex-1 rounded-2xl p-4 backdrop-blur-md overflow-hidden flex flex-col"
          style={{ background: '#0f172a80', border: '1px solid #1e293b' }}>
          <MessageLog messages={messages} agentColor={agent.color} />
        </div>
      </div>

      {/* Status */}
      <StatusBar agent={agent} state={state} messageCount={messages.length} startTime={startTime.current} />

      {/* Instruction */}
      {state === 'idle' && !conversationMode && (
        <div className="absolute bottom-4 left-4 font-mono text-[11px] text-slate-600">
          Say &quot;{agent.wakeWord}&quot; to activate
        </div>
      )}
      {conversationMode && (
        <div className="absolute bottom-4 left-4 font-mono text-[11px] animate-pulse" style={{ color: agent.color }}>
          🔄 Conversación activa — sigue hablando o di &quot;eso es todo&quot;
        </div>
      )}
    </div>
  );
}
