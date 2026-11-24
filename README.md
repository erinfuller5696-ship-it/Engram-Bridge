# 🧠 Engram Memory ↔ Notification Bridge

## MCP Plugin for Qwen Vibe AI + ChatGPT

A multi-agent MCP (Model Context Protocol) plugin that connects **Qwen Vibe AI ChatGPT** to an **Engram AI Memory** system with automatic notifications. When you post something to Engram memory, all connected AI agents get notified instantly.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP SERVER (Plugin)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Memory Agent │  │ Notify Agent │  │ Bridge Agent │      │
│  │              │  │              │  │              │      │
│  │ • Post       │──│ • Dispatch   │──│ • MCP Proto  │      │
│  │ • Read       │  │ • Queue      │  │ • Auth       │      │
│  │ • Subscribe  │  │ • Templates  │  │ • Routing    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └────────────┬────┴──────────────────┘               │
│                      │                                       │
│              ┌───────▼───────┐                              │
│              │ Event Bus     │                              │
│              │ (Pub/Sub)     │                              │
│              └───────┬───────┘                              │
└──────────────────────┼──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌─────────┐ ┌──────────┐
   │ Engram AI  │ │ Qwen    │ │ ChatGPT  │
   │ Memory     │ │ Vibe AI │ │ (MCP)    │
   │ (Storage)  │ │ (Chat)  │ │          │
   └────────────┘ └─────────┘ └──────────┘
```

### Agents

| Agent | Role |
|-------|------|
| **MemoryAgent** | Handles all Engram AI Memory operations — read, write, search, delete, tag |
| **NotificationAgent** | Manages notification dispatch, queuing, delivery confirmation |
| **BridgeAgent** | Translates MCP protocol calls into agent actions, handles routing |
| **EventBus** | Internal pub/sub system connecting all agents in real-time |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the MCP Server (Backend)

```bash
# Development (with hot reload)
npm run server

# Production
npm run build:server
npm run start:server
```

### 3. Start the React UI (Frontend)

```bash
npm run dev
```

### 4. Connect to MCP Client

Add to your Claude Desktop / Qwen config (`mcp-config.json`):

```json
{
  "mcpServers": {
    "engram-notification-bridge": {
      "command": "node",
      "args": ["dist/server/index.js"],
      "env": {
        "API_PORT": "3001"
      }
    }
  }
}
```

---

## 🛠️ MCP Tools

### Memory Tools
| Tool | Description |
|------|-------------|
| `engram_post` | Post a new memory to Engram AI (auto-notifies agents) |
| `engram_read` | Read recent memories |
| `engram_search` | Search memories by content or tags |
| `engram_delete` | Delete a memory |
| `engram_tags` | List all tags |
| `engram_stats` | Get memory statistics |

### Notification Tools
| Tool | Description |
|------|-------------|
| `notification_send` | Send a custom notification |
| `notification_list` | List recent notifications |
| `notification_unread_count` | Get unread count |
| `notification_mark_read` | Mark notification as read |
| `notification_mark_all_read` | Mark all as read |

### System Tools
| Tool | Description |
|------|-------------|
| `agent_status` | Get status of all agents |
| `event_history` | View event bus history |

---

## 💬 Chat Commands (React UI)

| Command | Description |
|---------|-------------|
| `/memory <text> #tag1 #tag2` | Store a memory with tags |
| `/notify <title> - <message>` | Send a notification |
| `/status` | Check system status |
| `/help` | Show available commands |

Any message without a command is automatically stored as a memory!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | List memories |
| POST | `/api/memories` | Create memory |
| DELETE | `/api/memories/:id` | Delete memory |
| GET | `/api/memories/tags` | List tags |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications` | Create notification |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/agents` | Agent status |
| GET | `/api/health` | Health check |
| WS | `/ws` | Real-time WebSocket updates |

---

## 🔄 Event Flow

```
User/AI posts memory
       │
       ▼
┌──────────────┐
│ BridgeAgent  │ ← MCP Protocol call
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ MemoryAgent  │ → Stores in Engram
└──────┬───────┘
       │ publishes 'memory:created'
       ▼
┌──────────────┐
│  Event Bus   │ → Pub/Sub routing
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ NotificationAgent│ → Dispatches to all channels
└──────┬───────────┘
       │
       ├──→ WebSocket (React UI)
       ├──→ Webhook (external services)
       └──→ In-App (stored for retrieval)
```

---

## 📁 Project Structure

```
├── server/                    # MCP Server (Node.js)
│   ├── index.ts              # Main entry: MCP + REST + WebSocket
│   ├── types.ts              # Shared types
│   └── agents/
│       ├── EventBus.ts       # Pub/Sub event system
│       ├── MemoryAgent.ts    # Engram memory operations
│       ├── NotificationAgent.ts  # Notification dispatch
│       └── BridgeAgent.ts    # MCP protocol bridge
│
├── src/                       # React Frontend
│   ├── App.tsx               # Main app component
│   ├── store.ts              # Zustand state management
│   ├── types.ts              # Frontend types
│   └── components/
│       ├── Sidebar.tsx       # Navigation sidebar
│       ├── ChatInterface.tsx # Chat UI
│       ├── MemoryPanel.tsx   # Memory browser
│       ├── NotificationPanel.tsx  # Notification center
│       └── AgentDashboard.tsx     # Agent status monitor
│
├── mcp-config.json           # MCP client configuration
├── tsconfig.json             # Frontend TypeScript config
├── tsconfig.server.json      # Server TypeScript config
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3001` | REST API + WebSocket port |

### Webhook Integration

Add webhook URLs to receive notifications externally:

```typescript
import { notificationAgent } from './server/agents/NotificationAgent.js';
notificationAgent.addWebhook('https://your-service.com/webhook');
```

---

## License

MIT
