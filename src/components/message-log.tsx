"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, Agent } from "@/lib/types";

interface MessageLogProps {
  messages: Message[];
  agents: Agent[];
}

export function MessageLog({ messages, agents }: MessageLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted text-xs tracking-wider">
          AWAITING VOICE INPUT...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => {
          const agent = agents.find((a) => a.id === msg.agentId);
          const isUser = msg.role === "user";
          const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${
                  isUser
                    ? "bg-void-lighter text-text-primary"
                    : "border border-void-lighter"
                }`}
                style={
                  !isUser && agent
                    ? { borderColor: `${agent.color}30` }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  {!isUser && agent && (
                    <span
                      className="font-semibold text-[10px] uppercase tracking-wider"
                      style={{ color: agent.color }}
                    >
                      {agent.emoji} {agent.name}
                    </span>
                  )}
                  {isUser && (
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-text-secondary">
                      YOU
                    </span>
                  )}
                  <span className="text-text-muted text-[10px]">{time}</span>
                </div>
                <p className="leading-relaxed text-text-secondary whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
