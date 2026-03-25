"use client";

import { useRef, useEffect, useCallback } from "react";
import type { VoiceState } from "@/lib/types";

interface WaveformProps {
  state: VoiceState;
  color: string;
}

export function Waveform({ state, color }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    phaseRef.current += 0.03;

    const amplitudeMap: Record<VoiceState, number> = {
      idle: 3,
      listening: 15,
      thinking: 8,
      speaking: 20,
    };

    const amplitude = amplitudeMap[state];
    const bars = 64;
    const barWidth = width / bars;
    const gap = 2;

    for (let i = 0; i < bars; i++) {
      const x = i * barWidth;
      const normalizedI = i / bars;

      let barHeight: number;

      if (state === "idle") {
        barHeight =
          Math.sin(normalizedI * Math.PI * 4 + phaseRef.current) *
            amplitude *
            (0.3 + 0.7 * Math.sin(normalizedI * Math.PI)) +
          2;
      } else if (state === "listening") {
        barHeight =
          Math.abs(
            Math.sin(normalizedI * Math.PI * 3 + phaseRef.current * 2) *
              amplitude *
              (0.5 + 0.5 * Math.random())
          ) + 2;
      } else if (state === "thinking") {
        barHeight =
          Math.abs(
            Math.sin(normalizedI * Math.PI * 6 + phaseRef.current * 3)
          ) *
            amplitude *
            (0.4 + 0.6 * Math.sin(phaseRef.current + normalizedI * 10)) +
          2;
      } else {
        barHeight =
          Math.abs(
            Math.sin(normalizedI * Math.PI * 2 + phaseRef.current * 1.5)
          ) *
            amplitude *
            (0.3 + 0.7 * Math.sin(phaseRef.current * 2 + normalizedI * 5)) +
          3;
      }

      const alpha = 0.3 + 0.7 * (barHeight / (amplitude + 5));

      ctx.fillStyle =
        color +
        Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0");
      ctx.fillRect(
        x + gap / 2,
        centerY - barHeight,
        barWidth - gap,
        barHeight * 2
      );
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [state, color]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 opacity-80"
      style={{ maxWidth: "400px" }}
    />
  );
}
