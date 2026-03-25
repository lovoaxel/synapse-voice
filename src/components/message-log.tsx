'use client';

import type { Message } from '@/lib/types';
import { useEffect, useRef } from 'react';

export function MessageLog({ messages, agentColor }: { messages: Message[]; agentColor: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm">
        Conversation will appear here...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className="max-w-[80%] px-4 py-2.5 rounded-2xl font-mono text-sm backdrop-blur-md"
            style={{
              background:
                msg.role === 'user'
                  ? '#3b82f620'
                  : agentColor + '15',
              border: `1px solid ${msg.role === 'user' ? '#3b82f630' : agentColor + '30'}`,
              color: '#e2e8f0',
            }}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
            <p className="text-[10px] mt-1 opacity-40">
              {msg.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
