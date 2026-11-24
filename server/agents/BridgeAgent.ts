// ============================================================
// Bridge Agent
// MCP Protocol handler — translates MCP calls to agent actions
// ============================================================

import { AgentStatus, McpToolResult } from '../types.js';
import { eventBus } from './EventBus.js';
import { memoryAgent } from './MemoryAgent.js';
import { notificationAgent } from './NotificationAgent.js';

export class BridgeAgent {
  private status: AgentStatus = {
    name: 'BridgeAgent',
    status: 'idle',
    lastActivity: Date.now(),
    processedCount: 0,
    errorCount: 0,
  };

  constructor() {
    console.log('[BridgeAgent] Initialized — MCP Protocol Bridge active');
  }

  /**
   * Handle MCP tool call — route to appropriate agent
   */
  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<McpToolResult> {
    this.setStatus('processing');
    this.status.processedCount++;

    try {
      switch (toolName) {
        // === Memory Tools ===
        case 'engram_post':
          return this.handleEngramPost(args);
        case 'engram_read':
          return this.handleEngramRead(args);
        case 'engram_search':
          return this.handleEngramSearch(args);
        case 'engram_delete':
          return this.handleEngramDelete(args);
        case 'engram_tags':
          return this.handleEngramTags();
        case 'engram_stats':
          return this.handleEngramStats();

        // === Notification Tools ===
        case 'notification_send':
          return this.handleNotificationSend(args);
        case 'notification_list':
          return this.handleNotificationList(args);
        case 'notification_unread_count':
          return this.handleUnreadCount();
        case 'notification_mark_read':
          return this.handleMarkRead(args);
        case 'notification_mark_all_read':
          return this.handleMarkAllRead();

        // === Agent Tools ===
        case 'agent_status':
          return this.handleAgentStatus();
        case 'event_history':
          return this.handleEventHistory(args);

        default:
          return this.errorResult(`Unknown tool: ${toolName}`);
      }
    } catch (err) {
      this.status.errorCount++;
      this.setStatus('error');
      return this.errorResult(`Error executing ${toolName}: ${err}`);
    } finally {
      this.setStatus('idle');
    }
  }

  // === Memory Tool Handlers ===

  private handleEngramPost(args: Record<string, unknown>): McpToolResult {
    const content = args.content as string;
    const tags = (args.tags as string[]) || [];
    const source = (args.source as 'qwen' | 'user' | 'system') || 'user';

    if (!content) {
      return this.errorResult('Content is required for engram_post');
    }

    const entry = memoryAgent.post(content, tags, source);
    return this.successResult(
      `✅ Memory stored successfully!\n` +
      `ID: ${entry.id}\n` +
      `Content: "${entry.content}"\n` +
      `Tags: [${entry.tags.join(', ')}]\n` +
      `Notifications sent to connected AI agents.`
    );
  }

  private handleEngramRead(args: Record<string, unknown>): McpToolResult {
    const limit = (args.limit as number) || 20;
    const memories = memoryAgent.read(undefined, limit);

    if (memories.length === 0) {
      return this.successResult('📭 No memories found. Post something to Engram AI Memory!');
    }

    const formatted = memories
      .map(
        (m) =>
          `• [${new Date(m.timestamp).toISOString()}] (${m.source}) "${m.content.slice(0, 120)}" ${m.tags.length ? `#${m.tags.join(' #')}` : ''}`
      )
      .join('\n');

    return this.successResult(`🧠 Engram Memories (${memories.length}):\n${formatted}`);
  }

  private handleEngramSearch(args: Record<string, unknown>): McpToolResult {
    const query = args.query as string;
    if (!query) return this.errorResult('Query is required for engram_search');

    const memories = memoryAgent.read(query, 20);
    if (memories.length === 0) {
      return this.successResult(`🔍 No memories matching "${query}"`);
    }

    const formatted = memories
      .map(
        (m) =>
          `• [${new Date(m.timestamp).toISOString()}] "${m.content.slice(0, 120)}" ${m.tags.length ? `#${m.tags.join(' #')}` : ''}`
      )
      .join('\n');

    return this.successResult(`🔍 Search results for "${query}" (${memories.length}):\n${formatted}`);
  }

  private handleEngramDelete(args: Record<string, unknown>): McpToolResult {
    const id = args.id as string;
    if (!id) return this.errorResult('ID is required for engram_delete');

    const deleted = memoryAgent.delete(id);
    if (deleted) {
      return this.successResult(`🗑️ Memory ${id} deleted. Notification dispatched.`);
    }
    return this.errorResult(`Memory ${id} not found`);
  }

  private handleEngramTags(): McpToolResult {
    const tags = memoryAgent.getTags();
    if (tags.length === 0) {
      return this.successResult('🏷️ No tags yet. Add tags when posting memories!');
    }
    return this.successResult(`🏷️ Tags: ${tags.map((t) => `#${t}`).join(', ')}`);
  }

  private handleEngramStats(): McpToolResult {
    const count = memoryAgent.getCount();
    const tags = memoryAgent.getTags();
    return this.successResult(
      `📊 Engram Stats:\n` +
      `• Total memories: ${count}\n` +
      `• Unique tags: ${tags.length}\n` +
      `• Tags: ${tags.join(', ') || 'none'}`
    );
  }

  // === Notification Tool Handlers ===

  private handleNotificationSend(args: Record<string, unknown>): McpToolResult {
    const title = args.title as string;
    const message = args.message as string;
    if (!title || !message) return this.errorResult('Title and message are required');

    const notif = notificationAgent.send(title, message);
    return this.successResult(`🔔 Notification sent: "${notif.title}" — ${notif.message}`);
  }

  private handleNotificationList(args: Record<string, unknown>): McpToolResult {
    const limit = (args.limit as number) || 20;
    const unreadOnly = (args.unreadOnly as boolean) || false;
    const notifications = notificationAgent.getAll(limit, unreadOnly);

    if (notifications.length === 0) {
      return this.successResult('📭 No notifications yet.');
    }

    const formatted = notifications
      .map(
        (n) =>
          `${n.read ? '✓' : '●'} [${new Date(n.timestamp).toLocaleTimeString()}] ${n.title}: ${n.message}`
      )
      .join('\n');

    return this.successResult(`🔔 Notifications (${notifications.length}):\n${formatted}`);
  }

  private handleUnreadCount(): McpToolResult {
    const count = notificationAgent.getUnreadCount();
    return this.successResult(`📬 Unread notifications: ${count}`);
  }

  private handleMarkRead(args: Record<string, unknown>): McpToolResult {
    const id = args.id as string;
    if (!id) return this.errorResult('ID is required');

    const marked = notificationAgent.markRead(id);
    return this.successResult(marked ? `✅ Notification ${id} marked as read` : `❌ Notification ${id} not found`);
  }

  private handleMarkAllRead(): McpToolResult {
    notificationAgent.markAllRead();
    return this.successResult('✅ All notifications marked as read');
  }

  // === Agent/Debug Tool Handlers ===

  private handleAgentStatus(): McpToolResult {
    const agents = [memoryAgent.getStatus(), notificationAgent.getStatus(), this.getStatus()];
    const formatted = agents
      .map(
        (a) =>
          `• ${a.name}: ${a.status === 'idle' ? '🟢' : a.status === 'processing' ? '🟡' : '🔴'} ${a.status} | Processed: ${a.processedCount} | Errors: ${a.errorCount}`
      )
      .join('\n');

    return this.successResult(`🤖 Agent Status:\n${formatted}\n\n📡 EventBus channels: ${eventBus.getChannels().join(', ') || 'none'}`);
  }

  private handleEventHistory(args: Record<string, unknown>): McpToolResult {
    const limit = (args.limit as number) || 20;
    const history = eventBus.getHistory(limit);

    if (history.length === 0) {
      return this.successResult('📋 No events yet.');
    }

    const formatted = history
      .map(
        (e) =>
          `• [${new Date(e.timestamp).toLocaleTimeString()}] ${e.event} (from ${e.source})`
      )
      .join('\n');

    return this.successResult(`📋 Recent Events (${history.length}):\n${formatted}`);
  }

  // === Helpers ===

  private successResult(text: string): McpToolResult {
    return { content: [{ type: 'text', text }] };
  }

  private errorResult(text: string): McpToolResult {
    return { content: [{ type: 'text', text }], isError: true };
  }

  getStatus(): AgentStatus {
    return { ...this.status, lastActivity: Date.now() };
  }

  private setStatus(status: AgentStatus['status']): void {
    this.status.status = status;
    this.status.lastActivity = Date.now();
  }
}

// Singleton instance
export const bridgeAgent = new BridgeAgent();
