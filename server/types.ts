// ============================================================
// MCP Plugin: Engram Memory → Notification Bridge
// Shared Types
// ============================================================

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

export interface EventBusPayload {
  event: string;
  data: unknown;
  timestamp: number;
  source: string;
}

export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
}

export interface Subscription {
  id: string;
  channel: string;
  filter?: string;
  callback: (payload: EventBusPayload) => void;
}
