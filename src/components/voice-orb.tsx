'use client';

import { useEffect, useRef } from 'react';
import type { OrbState } from '@/lib/types';

const STATE_COLORS: Record<OrbState, string> = {
  idle: '#3b82f6',
  listening: '#22c55e',
  thinking: '#f59e0b',
  speaking: '#a855f7',
  error: '#ef4444',
};

export function VoiceOrb({ state, agentColor }: { state: OrbState; agentColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const color = state === 'idle' ? (agentColor || STATE_COLORS.idle) : STATE_COLORS[state];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    let t = 0;

    function draw() {
      t += 0.02;
      ctx.clearRect(0, 0, size, size);

      // Outer glow
      const glowRadius = state === 'listening' ? 160 : state === 'speaking' ? 150 : 140;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(0.5, color + '15');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Rings
      const ringCount = 4;
      for (let i = 0; i < ringCount; i++) {
        const baseRadius = 50 + i * 22;
        const speed = state === 'thinking' ? 3 : state === 'speaking' ? 1.5 : 0.5;
        const wobble = state === 'listening' ? Math.sin(t * 3 + i) * 8 : Math.sin(t + i) * 3;
        const radius = baseRadius + wobble;
        const alpha = state === 'idle' ? 0.15 + i * 0.05 : 0.3 + i * 0.1;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = state === 'speaking' ? 2.5 : 1.5;

        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const r = radius + Math.sin(a * 3 + t * speed + i * 2) * (state === 'speaking' ? 12 : 5);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Core orb
      ctx.globalAlpha = 1;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
      coreGrad.addColorStop(0, color + 'cc');
      coreGrad.addColorStop(0.7, color + '44');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.fill();

      // Particles
      const particleCount = state === 'idle' ? 12 : state === 'thinking' ? 30 : 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + t * (state === 'thinking' ? 2 : 0.3);
        const dist = 80 + Math.sin(t * 1.5 + i * 0.7) * 40;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const pSize = 1 + Math.sin(t + i) * 0.8;
        ctx.globalAlpha = 0.3 + Math.sin(t + i) * 0.2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [state, color]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]" />
      <div
        className="absolute text-xs font-mono tracking-widest uppercase opacity-60"
        style={{ color }}
      >
        {state === 'idle' ? 'STANDBY' : state === 'listening' ? 'LISTENING' : state === 'thinking' ? 'PROCESSING' : state === 'speaking' ? 'SPEAKING' : 'ERROR'}
      </div>
    </div>
  );
}
