"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "@/components/voice-orb";
import { Waveform } from "@/components/waveform";
import { AgentSelector } from "@/components/agent-selector";
import { MessageLog } from "@/components/message-log";
import { StatusBar } from "@/components/status-bar";
import { useVoice } from "@/hooks/use-voice";
import { useAgent } from "@/hooks/use-agent";
import { useTTS } from "@/hooks/use-tts";
import { DEFAULT_AGENTS } from "@/lib/types";
import type { VoiceState, Agent } from "@/lib/types";

export default function Home() {
  const [agents] = useState(DEFAULT_AGENTS);
  const [activeAgent, setActiveAgent] = useState<Agent>(DEFAULT_AGENTS[1]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [activated, setActivated] = useState(false);

  // Load saved agent preference
  useEffect(() => {
    const saved = localStorage.getItem("cipher-voice-agent");
    if (saved) {
      const found = DEFAULT_AGENTS.find((a) => a.id === saved);
      if (found) setActiveAgent(found);
    }
  }, []);

  const { messages, tokensUsed, lastCommandTime, sendMessage } = useAgent();
  const { speak } = useTTS();

  const handleTranscription = useCallback(
    async (text: string) => {
      const response = await sendMessage(text, activeAgent.id);
      setVoiceState("speaking");
      await speak(response);
      setVoiceState("idle");
    },
    [activeAgent.id, sendMessage, speak]
  );

  const handleStateChange = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  const { isListening, startListening, stopListening } = useVoice({
    activeAgent,
    onTranscription: handleTranscription,
    onStateChange: handleStateChange,
  });

  const handleAgentSelect = useCallback((agent: Agent) => {
    setActiveAgent(agent);
    localStorage.setItem("cipher-voice-agent", agent.id);
  }, []);

  const handleActivate = useCallback(() => {
    setActivated(true);
    startListening();
  }, [startListening]);

  // Keyboard shortcut: Space to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (!activated) {
          handleActivate();
        } else if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activated, isListening, handleActivate, startListening, stopListening]);

  const orbColor = activeAgent.color;

  return (
    <div className="h-full flex flex-col grid-bg scanlines relative overflow-hidden">
      {/* Status bar */}
      <StatusBar
        state={voiceState}
        activeAgent={activeAgent}
        tokensUsed={tokensUsed}
        lastCommandTime={lastCommandTime}
        isListening={isListening}
      />

      {/* Agent selector */}
      <div className="flex justify-center py-3">
        <AgentSelector
          agents={agents}
          activeAgent={activeAgent}
          onSelect={handleAgentSelect}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <AnimatePresence mode="wait">
          {!activated ? (
            <motion.div
              key="activate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8"
            >
              <VoiceOrb state="idle" color={orbColor} />
              <motion.button
                onClick={handleActivate}
                className="px-6 py-2.5 rounded-full text-xs font-medium tracking-wider border cursor-pointer"
                style={{
                  color: orbColor,
                  borderColor: `${orbColor}40`,
                  backgroundColor: `${orbColor}08`,
                }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: `${orbColor}15`,
                }}
                whileTap={{ scale: 0.95 }}
              >
                INITIALIZE SYSTEM
              </motion.button>
              <p className="text-text-muted text-[10px] tracking-wider">
                PRESS SPACE OR CLICK TO ACTIVATE
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 w-full max-w-2xl flex-1 min-h-0"
            >
              {/* Orb + Waveform */}
              <div className="flex flex-col items-center gap-4 py-4 shrink-0">
                <VoiceOrb state={voiceState} color={orbColor} />
                <Waveform state={voiceState} color={orbColor} />
              </div>

              {/* Wake word hint */}
              <motion.p
                className="text-[10px] text-text-muted tracking-wider shrink-0"
                animate={{ opacity: voiceState === "idle" ? [0.3, 0.7, 0.3] : 0 }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                SAY &quot;{activeAgent.wakeWord.toUpperCase()}&quot; TO BEGIN
              </motion.p>

              {/* Message log */}
              <div className="flex-1 w-full min-h-0 border-t border-void-lighter/30">
                <div className="h-full flex flex-col">
                  <MessageLog messages={messages} agents={agents} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom status */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-void-lighter/30">
        <span className="text-[10px] text-text-muted tracking-wider">
          CIPHER VOICE v1.0.0
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted">
            GROQ WHISPER + OPENCLAW
          </span>
          {isListening && (
            <motion.button
              onClick={stopListening}
              className="text-[10px] text-red-500/60 hover:text-red-500 tracking-wider cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              [STOP]
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
