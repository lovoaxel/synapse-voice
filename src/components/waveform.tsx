'use client';

import { useEffect, useRef } from 'react';

export function Waveform({ analyser, color }: { analyser: AnalyserNode | null; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 100;

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);
        const w = canvas!.width;
        const h = canvas!.height;

        ctx.beginPath();
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 2;

        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * w;
          const y = (data[i] / 255) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Mirror with lower opacity
        ctx.beginPath();
        ctx.strokeStyle = color + '30';
        ctx.lineWidth = 1;
        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * w;
          const y = h - (data[i] / 255) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Ambient line when no audio
        const w = canvas!.width;
        const h = canvas!.height;
        const t = Date.now() / 1000;
        ctx.beginPath();
        ctx.strokeStyle = color + '20';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + t) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [analyser, color]);

  return <canvas ref={canvasRef} className="w-full h-[50px] opacity-80" />;
}
