"use client";

import { motion } from "framer-motion";
import type { VoiceState } from "@/lib/types";

interface VoiceOrbProps {
  state: VoiceState;
  color: string;
}

const stateConfig = {
  idle: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 0.8, 0.6],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
  listening: {
    scale: [1, 1.15, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" as const },
  },
  thinking: {
    rotate: [0, 360],
    scale: [0.95, 1.05, 0.95],
    opacity: [0.7, 1, 0.7],
    transition: {
      rotate: { duration: 2, repeat: Infinity, ease: "linear" as const },
      scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
      opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
    },
  },
  speaking: {
    scale: [1, 1.08, 0.96, 1.04, 1],
    opacity: [0.8, 1, 0.85, 0.95, 0.8],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const stateColors: Record<VoiceState, string> = {
  idle: "#3b82f6",
  listening: "#22c55e",
  thinking: "#f59e0b",
  speaking: "#a855f7",
};

const stateLabels: Record<VoiceState, string> = {
  idle: "STANDBY",
  listening: "LISTENING",
  thinking: "PROCESSING",
  speaking: "SPEAKING",
};

export function VoiceOrb({ state, color }: VoiceOrbProps) {
  const glowColor = state === "idle" ? color : stateColors[state];
  const animation = stateConfig[state];

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Outer rings */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Ring 3 - outermost */}
        <motion.div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${glowColor}15` }}
          animate={
            state === "listening"
              ? { scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }
              : { scale: 1, opacity: 0.3 }
          }
          transition={
            state === "listening"
              ? { duration: 2, repeat: Infinity, ease: "easeOut" }
              : { duration: 0.5 }
          }
        />

        {/* Ring 2 */}
        <motion.div
          className="absolute inset-3 rounded-full border"
          style={{ borderColor: `${glowColor}25` }}
          animate={
            state === "listening"
              ? { scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }
              : { scale: 1, opacity: 0.4 }
          }
          transition={
            state === "listening"
              ? { duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }
              : { duration: 0.5 }
          }
        />

        {/* Ring 1 - inner */}
        <motion.div
          className="absolute inset-6 rounded-full border"
          style={{ borderColor: `${glowColor}40` }}
          animate={
            state === "thinking"
              ? { rotate: [0, 360] }
              : { rotate: 0 }
          }
          transition={
            state === "thinking"
              ? { duration: 3, repeat: Infinity, ease: "linear" }
              : { duration: 0.5 }
          }
        />

        {/* Main orb */}
        <motion.div
          className="relative w-28 h-28 rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${glowColor}60, ${glowColor}20, transparent)`,
            boxShadow: `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20, 0 0 100px ${glowColor}10, inset 0 0 30px ${glowColor}20`,
          }}
          animate={animation}
        >
          {/* Inner highlight */}
          <div
            className="absolute inset-3 rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${glowColor}30, transparent 70%)`,
            }}
          />

          {/* Core dot */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: glowColor }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* State label */}
      <motion.div
        className="text-xs tracking-[0.3em] font-medium"
        style={{ color: glowColor }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {stateLabels[state]}
      </motion.div>
    </div>
  );
}
