'use client';

import { useEffect, useState } from 'react';
import type { Agent, OrbState } from '@/lib/types';

export function StatusBar({
  agent,
  state,
  messageCount,
  startTime,
}: {
  agent: Agent;
  state: OrbState;
  messageCount: number;
  startTime: Date;
}) {
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - startTime.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="absolute bottom-4 right-4 font-mono text-[11px] text-slate-500 space-y-1 text-right">
      <div className="flex items-center gap-2 justify-end">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: state === 'error' ? '#ef4444' : '#22c55e',
            boxShadow: `0 0 6px ${state === 'error' ? '#ef4444' : '#22c55e'}`,
          }}
        />
        <span>{state === 'error' ? 'ERROR' : 'ONLINE'}</span>
      </div>
      <div>Agent: {agent.emoji} {agent.name}</div>
      <div>Model: Claude {agent.id === 'coder' ? 'Opus 4' : 'Sonnet 4'}</div>
      <div>Uptime: {uptime}</div>
      <div>Messages: {messageCount}</div>
    </div>
  );
}
