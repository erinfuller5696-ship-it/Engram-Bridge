import { create } from 'zustand';
import { MemoryEntry, Notification, AgentStatus, ChatMessage, WsMessage } from './types';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';

interface AppState {
  // Data
  memories: MemoryEntry[];
  notifications: Notification[];
  agents: AgentStatus[];
  chatMessages: ChatMessage[];
  unreadCount: number;

  // UI State
  activePanel: 'chat' | 'memories' | 'notifications' | 'agents';
  wsConnected: boolean;
  isLoading: boolean;

  // Actions
  setActivePanel: (panel: AppState['activePanel']) => void;
  postMemory: (content: string, tags: string[]) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  sendChatMessage: (content: string) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  fetchMemories: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  connectWebSocket: () => void;
}

let ws: WebSocket | null = null;

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  memories: [],
  notifications: [],
  agents: [],
  chatMessages: [
    {
      id: 'welcome',
      role: 'system',
      content: '🧠 Engram Memory Bridge connected. Post memories and get notified!',
      timestamp: Date.now(),
    },
  ],
  unreadCount: 0,
  activePanel: 'chat',
  wsConnected: false,
  isLoading: false,

  setActivePanel: (panel) => set({ activePanel: panel }),

  postMemory: async (content, tags) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tags, source: 'user' }),
      });
      if (res.ok) {
        await get().fetchMemories();
        await get().fetchNotifications();
        // Add to chat
        const msg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `✅ Memory stored: "${content.slice(0, 80)}" — Notifications dispatched to connected AI agents.`,
          timestamp: Date.now(),
          agent: 'MemoryAgent',
        };
        set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
      }
    } catch (err) {
      console.error('Failed to post memory:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMemory: async (id) => {
    try {
      await fetch(`${API_BASE}/api/memories/${id}`, { method: 'DELETE' });
      await get().fetchMemories();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  },

  sendChatMessage: (content) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Check if it's a memory post command
    const memoryMatch = content.match(/^\/mem(?:ory)?\s+(.+?)(?:\s+#(.+))?$/i);
    const notifyMatch = content.match(/^\/notify\s+(.+?)\s*[-—|]\s*(.+)$/i);
    const statusMatch = content.match(/^\/status$/i);
    const helpMatch = content.match(/^\/help$/i);

    let response: ChatMessage;

    if (memoryMatch) {
      const memContent = memoryMatch[1];
      const tags = memoryMatch[2] ? memoryMatch[2].split(/\s+/) : [];
      get().postMemory(memContent, tags);
      response = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🧠 Posting to Engram Memory...`,
        timestamp: Date.now(),
        agent: 'BridgeAgent',
      };
    } else if (notifyMatch) {
      const title = notifyMatch[1];
      const message = notifyMatch[2];
      fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });
      response = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🔔 Notification sent: "${title}" — All connected agents have been notified.`,
        timestamp: Date.now(),
        agent: 'NotificationAgent',
      };
    } else if (statusMatch) {
      response = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🤖 All agents online. Memories: ${get().memories.length} | Unread notifications: ${get().unreadCount}`,
        timestamp: Date.now(),
        agent: 'BridgeAgent',
      };
    } else if (helpMatch) {
      response = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `📖 Commands:\n• /memory <text> #tag1 #tag2 — Store a memory\n• /notify <title> - <message> — Send notification\n• /status — Check system status\n• /help — Show this help\n\nOr just type naturally to chat!`,
        timestamp: Date.now(),
        agent: 'BridgeAgent',
      };
    } else {
      // Auto-store as memory
      get().postMemory(content, ['chat']);
      response = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `🧠 Stored as memory. All AI agents have been notified of this new entry in Engram.`,
        timestamp: Date.now(),
        agent: 'MemoryAgent',
      };
    }

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg, response],
    }));
  },

  markNotificationRead: async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT' });
      await get().fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'PUT' });
      await get().fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  },

  fetchMemories: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/memories`);
      const data = await res.json();
      set({ memories: data.memories });
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      const data = await res.json();
      set({ notifications: data.notifications, unreadCount: data.unreadCount });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  fetchAgents: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`);
      const data = await res.json();
      set({ agents: data.agents });
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  },

  connectWebSocket: () => {
    if (ws) return;

    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected');
        set({ wsConnected: true });
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'memory_created':
              get().fetchMemories();
              break;
            case 'notification':
              get().fetchNotifications();
              break;
            case 'init':
              const initData = msg.data as { memories: MemoryEntry[]; notifications: Notification[]; agents: AgentStatus[] };
              set({
                memories: initData.memories,
                notifications: initData.notifications,
                agents: initData.agents,
                unreadCount: initData.notifications.filter((n: Notification) => !n.read).length,
              });
              break;
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        set({ wsConnected: false });
        ws = null;
        // Reconnect after 3s
        setTimeout(() => get().connectWebSocket(), 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        set({ wsConnected: false });
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      set({ wsConnected: false });
    }
  },
}));
