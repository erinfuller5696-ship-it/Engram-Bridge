// ============================================================
// Notification Agent
// Manages notification dispatch, queuing, and delivery
// ============================================================

import { Notification, AgentStatus, MemoryEntry } from '../types.js';
import { eventBus } from './EventBus.js';

export class NotificationAgent {
  private notifications: Notification[] = [];
  private queue: Notification[] = [];
  private status: AgentStatus = {
    name: 'NotificationAgent',
    status: 'idle',
    lastActivity: Date.now(),
    processedCount: 0,
    errorCount: 0,
  };
  private webhookUrls: string[] = [];
  private maxNotifications = 500;

  constructor() {
    // Subscribe to memory events — auto-notify when memories are posted
    eventBus.subscribe('memory:created', (payload) => {
      this.handleMemoryCreated(payload.data as MemoryEntry);
    });

    eventBus.subscribe('memory:deleted', (payload) => {
      this.handleMemoryDeleted(payload.data as { id: string; entry: MemoryEntry });
    });

    // Process notification queue every 100ms
    setInterval(() => this.processQueue(), 100);

    console.log('[NotificationAgent] Initialized — watching for memory events');
  }

  /**
   * Handle new memory creation — generate notification
   */
  private handleMemoryCreated(entry: MemoryEntry): void {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'memory_created',
      title: '🧠 New Memory Stored',
      message: `"${entry.content.slice(0, 100)}${entry.content.length > 100 ? '...' : ''}"`,
      timestamp: Date.now(),
      read: false,
      relatedMemoryId: entry.id,
      channel: 'in_app',
    };

    this.enqueue(notification);
    console.log(`[NotificationAgent] Memory created notification queued: ${notification.id}`);
  }

  /**
   * Handle memory deletion
   */
  private handleMemoryDeleted(data: { id: string; entry: MemoryEntry }): void {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: 'system',
      title: '🗑️ Memory Removed',
      message: `Memory "${data.entry.content.slice(0, 80)}" was removed`,
      timestamp: Date.now(),
      read: false,
      relatedMemoryId: data.id,
      channel: 'in_app',
    };

    this.enqueue(notification);
  }

  /**
   * Send a custom notification
   */
  send(title: string, message: string, type: Notification['type'] = 'system', channel: Notification['channel'] = 'in_app'): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      channel,
    };

    this.enqueue(notification);
    return notification;
  }

  /**
   * Add notification to queue
   */
  private enqueue(notification: Notification): void {
    this.queue.push(notification);
    this.status.processedCount++;
    eventBus.publish('notification:queued', notification, 'NotificationAgent');
  }

  /**
   * Process the notification queue
   */
  private processQueue(): void {
    if (this.queue.length === 0) return;

    this.setStatus('processing');

    while (this.queue.length > 0) {
      const notification = this.queue.shift()!;

      // Store notification
      this.notifications.push(notification);
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(-this.maxNotifications);
      }

      // Dispatch via channels
      this.dispatch(notification);

      // Publish event
      eventBus.publish('notification:sent', notification, 'NotificationAgent');
    }

    this.setStatus('idle');
  }

  /**
   * Dispatch notification through all configured channels
   */
  private dispatch(notification: Notification): void {
    // In-app notification (always)
    this.dispatchInApp(notification);

    // Webhook notifications
    if (notification.channel === 'webhook' || this.webhookUrls.length > 0) {
      this.dispatchWebhook(notification);
    }

    console.log(`[NotificationAgent] Dispatched: ${notification.title} via ${notification.channel}`);
  }

  /**
   * In-app dispatch (stored in memory, available via API)
   */
  private dispatchInApp(notification: Notification): void {
    // Already stored in this.notifications
    eventBus.publish('notification:in_app', notification, 'NotificationAgent');
  }

  /**
   * Webhook dispatch
   */
  private async dispatchWebhook(notification: Notification): Promise<void> {
    for (const url of this.webhookUrls) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification),
        });
      } catch (err) {
        console.error(`[NotificationAgent] Webhook failed for ${url}:`, err);
        this.status.errorCount++;
      }
    }
  }

  /**
   * Get all notifications
   */
  getAll(limit: number = 50, unreadOnly: boolean = false): Notification[] {
    let results = [...this.notifications];
    if (unreadOnly) {
      results = results.filter((n) => !n.read);
    }
    results.sort((a, b) => b.timestamp - a.timestamp);
    return results.slice(0, limit);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      eventBus.publish('notification:read', notif, 'NotificationAgent');
      return true;
    }
    return false;
  }

  /**
   * Mark all as read
   */
  markAllRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    eventBus.publish('notification:all_read', { count: this.notifications.length }, 'NotificationAgent');
  }

  /**
   * Add webhook URL
   */
  addWebhook(url: string): void {
    if (!this.webhookUrls.includes(url)) {
      this.webhookUrls.push(url);
      console.log(`[NotificationAgent] Webhook added: ${url}`);
    }
  }

  /**
   * Remove webhook URL
   */
  removeWebhook(url: string): void {
    this.webhookUrls = this.webhookUrls.filter((u) => u !== url);
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return { ...this.status, lastActivity: Date.now() };
  }

  private setStatus(status: AgentStatus['status']): void {
    this.status.status = status;
    this.status.lastActivity = Date.now();
  }
}

// Singleton instance
export const notificationAgent = new NotificationAgent();
