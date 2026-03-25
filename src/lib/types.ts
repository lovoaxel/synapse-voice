export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  wakeWord: string;
  voiceId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  agentId: string;
  timestamp: Date;
}

export const AGENTS: Agent[] = [
  {
    id: 'main',
    name: 'JARVIS',
    emoji: '🎩',
    color: '#3b82f6',
    wakeWord: 'hey jarvis',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
  },
  {
    id: 'coder',
    name: 'CIPHER',
    emoji: '🔐',
    color: '#22c55e',
    wakeWord: 'hey cipher',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
  },
];
