'use client';

import { AGENTS, type Agent } from '@/lib/types';

export function AgentSelector({
  activeAgent,
  onSelect,
}: {
  activeAgent: Agent;
  onSelect: (agent: Agent) => void;
}) {
  return (
    <div className="flex gap-2">
      {AGENTS.map((agent) => {
        const isActive = agent.id === activeAgent.id;
        return (
          <button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm transition-all duration-300"
            style={{
              background: isActive ? agent.color + '25' : 'transparent',
              border: `1px solid ${isActive ? agent.color : '#334155'}`,
              color: isActive ? agent.color : '#64748b',
              boxShadow: isActive ? `0 0 20px ${agent.color}20` : 'none',
            }}
          >
            <span>{agent.emoji}</span>
            <span>{agent.name}</span>
            {isActive && (
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: agent.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
