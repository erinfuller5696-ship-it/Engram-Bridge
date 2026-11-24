// ============================================================
// MCP Server — Engram Memory ↔ Notification Bridge
// Main entry point: MCP Protocol + REST API for React UI
// ============================================================

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { bridgeAgent } from './agents/BridgeAgent.js';
import { memoryAgent } from './agents/MemoryAgent.js';
import { notificationAgent } from './agents/NotificationAgent.js';
import { eventBus } from './agents/EventBus.js';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// ============================================================
// 1. MCP SERVER (stdio transport for Claude/Qwen integration)
// ============================================================

const mcpServer = new Server(
  {
    name: 'engram-notification-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register available tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'engram_post',
      description: 'Post a new memory to Engram AI Memory. This will automatically notify connected AI agents (Qwen Vibe, ChatGPT) about the new memory.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          content: { type: 'string', description: 'The memory content to store' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
          source: { type: 'string', enum: ['qwen', 'user', 'system'], description: 'Source of the memory' },
        },
        required: ['content'],
      },
    },
    {
      name: 'engram_read',
      description: 'Read recent memories from Engram AI Memory',
      inputSchema: {
        type: 'object' as const,
        properties: {
          limit: { type: 'number', description: 'Maximum number of memories to return (default: 20)' },
        },
      },
    },
    {
      name: 'engram_search',
      description: 'Search memories in Engram AI Memory by content or tags',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
    {
      name: 'engram_delete',
      description: 'Delete a memory from Engram AI Memory',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Memory ID to delete' },
        },
        required: ['id'],
      },
    },
    {
      name: 'engram_tags',
      description: 'List all tags used in Engram AI Memory',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'engram_stats',
      description: 'Get statistics about Engram AI Memory',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'notification_send',
      description: 'Send a custom notification to connected AI agents',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Notification title' },
          message: { type: 'string', description: 'Notification message' },
        },
        required: ['title', 'message'],
      },
    },
    {
      name: 'notification_list',
      description: 'List recent notifications',
      inputSchema: {
        type: 'object' as const,
        properties: {
          limit: { type: 'number', description: 'Max notifications to return' },
          unreadOnly: { type: 'boolean', description: 'Show only unread notifications' },
        },
      },
    },
    {
      name: 'notification_unread_count',
      description: 'Get count of unread notifications',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'notification_mark_read',
      description: 'Mark a notification as read',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Notification ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'notification_mark_all_read',
      description: 'Mark all notifications as read',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'agent_status',
      description: 'Get status of all agents in the system',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'event_history',
      description: 'View recent events in the system event bus',
      inputSchema: {
        type: 'object' as const,
        properties: {
          limit: { type: 'number', description: 'Max events to return' },
        },
      },
    },
  ],
}));

// Handle tool calls
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return bridgeAgent.handleToolCall(name, (args || {}) as Record<string, unknown>);
});

// ============================================================
// 2. REST API + WebSocket SERVER (for React frontend)
// ============================================================

const API_PORT = parseInt(process.env.API_PORT || '3001', 10);
const app = express();
app.use(express.json());

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// === REST API Routes ===

// Memory endpoints
app.get('/api/memories', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const query = req.query.q as string | undefined;
  const memories = memoryAgent.read(query, limit);
  res.json({ memories, total: memoryAgent.getCount() });
});

app.post('/api/memories', (req, res) => {
  const { content, tags, source } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  const entry = memoryAgent.post(content, tags || [], source || 'user');
  res.status(201).json(entry);
});

app.delete('/api/memories/:id', (req, res) => {
  const deleted = memoryAgent.delete(req.params.id);
  if (deleted) res.json({ success: true });
  else res.status(404).json({ error: 'Memory not found' });
});

app.get('/api/memories/tags', (req, res) => {
  res.json({ tags: memoryAgent.getTags() });
});

// Notification endpoints
app.get('/api/notifications', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const unreadOnly = req.query.unreadOnly === 'true';
  const notifications = notificationAgent.getAll(limit, unreadOnly);
  res.json({ notifications, unreadCount: notificationAgent.getUnreadCount() });
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
  const notif = notificationAgent.send(title, message, type || 'system');
  res.status(201).json(notif);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const marked = notificationAgent.markRead(req.params.id);
  res.json({ success: marked });
});

app.put('/api/notifications/read-all', (req, res) => {
  notificationAgent.markAllRead();
  res.json({ success: true });
});

// Agent status endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [memoryAgent.getStatus(), notificationAgent.getStatus(), bridgeAgent.getStatus()],
    channels: eventBus.getChannels(),
    eventHistory: eventBus.getHistory(20),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'engram-notification-bridge',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Create HTTP + WebSocket server
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// WebSocket connections for real-time updates
const wsClients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[API] WebSocket client connected (${wsClients.size} total)`);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      memories: memoryAgent.read(undefined, 10),
      notifications: notificationAgent.getAll(10),
      agents: [memoryAgent.getStatus(), notificationAgent.getStatus(), bridgeAgent.getStatus()],
    },
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[API] WebSocket client disconnected (${wsClients.size} total)`);
  });
});

// Broadcast to all WebSocket clients
function broadcast(type: string, data: unknown): void {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Subscribe to events and broadcast to WebSocket clients
eventBus.subscribe('memory:created', (payload) => broadcast('memory_created', payload.data));
eventBus.subscribe('memory:deleted', (payload) => broadcast('memory_deleted', payload.data));
eventBus.subscribe('notification:sent', (payload) => broadcast('notification', payload.data));
eventBus.subscribe('notification:in_app', (payload) => broadcast('notification', payload.data));

// ============================================================
// 3. START SERVERS
// ============================================================

async function main() {
  // Start REST API + WebSocket server
  httpServer.listen(API_PORT, () => {
    console.log(`\n🚀 Engram Memory ↔ Notification Bridge`);
    console.log(`📡 REST API + WebSocket: http://localhost:${API_PORT}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${API_PORT}/ws`);
    console.log(`\n🤖 Agents Online:`);
    console.log(`   • MemoryAgent — Engram AI Memory operations`);
    console.log(`   • NotificationAgent — Dispatch & queue management`);
    console.log(`   • BridgeAgent — MCP Protocol translation`);
    console.log(`\n📋 MCP Tools Available:`);
    console.log(`   • engram_post, engram_read, engram_search, engram_delete`);
    console.log(`   • engram_tags, engram_stats`);
    console.log(`   • notification_send, notification_list, notification_unread_count`);
    console.log(`   • agent_status, event_history`);
    console.log(`\n⏳ Waiting for MCP stdio connection...`);
  });

  // Start MCP stdio server
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.log(`[MCP] Server connected via stdio`);
}

main().catch(console.error);
