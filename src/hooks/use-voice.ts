"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VoiceState, Agent } from "@/lib/types";

interface UseVoiceOptions {
  activeAgent: Agent;
  onTranscription: (text: string) => void;
  onStateChange: (state: VoiceState) => void;
}

interface UseVoiceReturn {
  state: VoiceState;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  analyserNode: AnalyserNode | null;
}

export function useVoice({
  activeAgent,
  onTranscription,
  onStateChange,
}: UseVoiceOptions): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const updateState = useCallback(
    (newState: VoiceState) => {
      setState(newState);
      onStateChange(newState);
    },
    [onStateChange]
  );

  const sendAudioForTranscription = useCallback(
    async (audioBlob: Blob) => {
      updateState("thinking");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Transcription failed");

        const { text } = await response.json();
        if (text && text.trim()) {
          onTranscription(text.trim());
        } else {
          updateState("idle");
        }
      } catch (error) {
        console.error("Transcription error:", error);
        updateState("idle");
      }
    },
    [onTranscription, updateState]
  );

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    isRecordingRef.current = false;
  }, []);

  const detectSilence = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    const check = () => {
      if (!isRecordingRef.current) return;

      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms < 0.01) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, 2000);
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      if (isRecordingRef.current) {
        requestAnimationFrame(check);
      }
    };

    check();
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (audioBlob.size > 0) {
          sendAudioForTranscription(audioBlob);
        } else {
          updateState("idle");
        }
      };

      mediaRecorder.start(250);
      isRecordingRef.current = true;
      updateState("listening");
      detectSilence();
    } catch (error) {
      console.error("Recording error:", error);
      updateState("idle");
    }
  }, [sendAudioForTranscription, updateState, detectSilence]);

  const startListening = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.error("Speech recognition not supported");
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.toLowerCase().trim();

      const wakeWords = ["hey cipher", "hey jarvis"];
      const detected = wakeWords.some((w) => transcript.includes(w));

      if (detected) {
        recognition.stop();
        startRecording();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (isListening && !isRecordingRef.current && state === "idle") {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    updateState("idle");
  }, [isListening, state, startRecording, updateState]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopRecording();
    updateState("idle");
  }, [stopRecording, updateState]);

  // Restart listening after processing completes
  useEffect(() => {
    if (state === "idle" && isListening && !recognitionRef.current) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Keep activeAgent reference fresh for wake word matching
  useEffect(() => {
    void activeAgent;
  }, [activeAgent]);

  return {
    state,
    isListening,
    startListening,
    stopListening,
    analyserNode: analyserRef.current,
  };
}
