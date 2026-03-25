export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  wakeWord: string;
  greeting: string;
}

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
  agentId?: string;
}

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "jarvis",
    name: "Jarvis",
    emoji: "\u{1F3A9}",
    color: "#3b82f6",
    wakeWord: "hey jarvis",
    greeting: "At your service, sir.",
  },
  {
    id: "cipher",
    name: "CIPHER",
    emoji: "\u{1F510}",
    color: "#22c55e",
    wakeWord: "hey cipher",
    greeting: "CIPHER online. Awaiting your command.",
  },
];
