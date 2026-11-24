// Shared types for React frontend
export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
  source: 'qwen' | 'user' | 'system';
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: 'memory_created' | 'memory_updated' | 'memory_tagged' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  relatedMemoryId?: string;
  channel: 'websocket' | 'webhook' | 'in_app';
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'processing' | 'error' | 'offline';
  lastActivity: number;
  processedCount: number;
  errorCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
}

export interface WsMessage {
  type: string;
  data: unknown;
  timestamp: number;
}
