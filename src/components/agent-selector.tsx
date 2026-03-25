"use client";

import { motion } from "framer-motion";
import type { Agent } from "@/lib/types";

interface AgentSelectorProps {
  agents: Agent[];
  activeAgent: Agent;
  onSelect: (agent: Agent) => void;
}

export function AgentSelector({
  agents,
  activeAgent,
  onSelect,
}: AgentSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {agents.map((agent) => {
        const isActive = agent.id === activeAgent.id;
        return (
          <motion.button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className="relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            style={{
              color: isActive ? agent.color : "#94a3b8",
              backgroundColor: isActive ? `${agent.color}15` : "transparent",
              border: `1px solid ${isActive ? `${agent.color}40` : "#1e1e3a"}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-1.5">{agent.emoji}</span>
            {agent.name}
            {isActive && (
              <motion.div
                className="absolute -bottom-px left-1/2 -translate-x-1/2 h-px w-8"
                style={{ backgroundColor: agent.color }}
                layoutId="activeAgent"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
