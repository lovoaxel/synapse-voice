"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/lib/types";

interface UseAgentReturn {
  messages: Message[];
  isProcessing: boolean;
  tokensUsed: number;
  lastCommandTime: number | null;
  sendMessage: (text: string, agentId: string) => Promise<string>;
  clearMessages: () => void;
}

export function useAgent(): UseAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [lastCommandTime, setLastCommandTime] = useState<number | null>(null);

  const sendMessage = useCallback(
    async (text: string, agentId: string): Promise<string> => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: Date.now(),
        agentId,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);
      setLastCommandTime(Date.now());

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, agentId }),
        });

        if (!response.ok) throw new Error("Agent request failed");

        const { response: agentResponse } = await response.json();

        const agentMessage: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: agentResponse,
          timestamp: Date.now(),
          agentId,
        };

        setMessages((prev) => [...prev, agentMessage]);
        setTokensUsed((prev) => prev + Math.ceil(text.length / 4) + Math.ceil(agentResponse.length / 4));

        return agentResponse;
      } catch (error) {
        console.error("Agent error:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: "Connection failed. Agent may be offline.",
          timestamp: Date.now(),
          agentId,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return errorMessage.content;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTokensUsed(0);
  }, []);

  return {
    messages,
    isProcessing,
    tokensUsed,
    lastCommandTime,
    sendMessage,
    clearMessages,
  };
}
