"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { VoiceState, Agent } from "@/lib/types";

interface StatusBarProps {
  state: VoiceState;
  activeAgent: Agent;
  tokensUsed: number;
  lastCommandTime: number | null;
  isListening: boolean;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function StatusBar({
  state,
  activeAgent,
  tokensUsed,
  lastCommandTime,
  isListening,
}: StatusBarProps) {
  const [uptime, setUptime] = useState(0);
  const [startTime] = useState(Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Date.now() - startTime);
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-void-lighter/50">
      <div className="flex items-center gap-4">
        {/* Connection indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isListening ? "#22c55e" : "#ef4444",
            }}
            animate={{ opacity: isListening ? [1, 0.4, 1] : 1 }}
            transition={
              isListening
                ? { duration: 2, repeat: Infinity }
                : undefined
            }
          />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {isListening ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* Uptime */}
        <span className="text-[10px] text-text-muted font-light tracking-wider tabular-nums">
          UP {formatUptime(uptime)}
        </span>
      </div>

      {/* Center - State */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: activeAgent.color }}>
          {activeAgent.name} v1.0
        </span>
      </div>

      {/* Right - Stats */}
      <div className="flex items-center gap-4">
        {lastCommandTime && (
          <span className="text-[10px] text-text-muted tracking-wider">
            LAST CMD: {formatTimeAgo(lastCommandTime)}
          </span>
        )}
        <span className="text-[10px] text-text-muted tracking-wider tabular-nums">
          {tokensUsed.toLocaleString()} TKN
        </span>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: state === "idle" ? "#475569" : activeAgent.color }}
        >
          {state}
        </span>
      </div>
    </div>
  );
}
