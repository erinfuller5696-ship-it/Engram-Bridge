// ============================================================
// Event Bus Agent
// Internal pub/sub system connecting all agents
// ============================================================

import { EventBusPayload, Subscription } from '../types.js';

export class EventBus {
  private subscriptions: Map<string, Set<Subscription>> = new Map();
  private history: EventBusPayload[] = [];
  private maxHistory = 1000;

  /**
   * Subscribe to events on a channel
   */
  subscribe(channel: string, callback: (payload: EventBusPayload) => void, filter?: string): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const subscription: Subscription = { id, channel, filter, callback };

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(subscription);

    console.log(`[EventBus] New subscription: ${channel} (${id})`);
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [channel, subs] of this.subscriptions) {
      for (const sub of subs) {
        if (sub.id === subscriptionId) {
          subs.delete(sub);
          console.log(`[EventBus] Unsubscribed: ${subscriptionId}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Publish an event to all subscribers on a channel
   */
  publish(channel: string, data: unknown, source: string = 'system'): void {
    const payload: EventBusPayload = {
      event: channel,
      data,
      timestamp: Date.now(),
      source,
    };

    // Store in history
    this.history.push(payload);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Notify subscribers
    const subs = this.subscriptions.get(channel);
    if (subs) {
      for (const sub of subs) {
        try {
          // Apply filter if specified
          if (sub.filter) {
            const dataStr = JSON.stringify(data);
            if (!dataStr.includes(sub.filter)) continue;
          }
          sub.callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in subscription ${sub.id}:`, err);
        }
      }
    }

    console.log(`[EventBus] Published: ${channel} from ${source} (${subs?.size || 0} subscribers)`);
  }

  /**
   * Get event history
   */
  getHistory(limit: number = 50): EventBusPayload[] {
    return this.history.slice(-limit);
  }

  /**
   * Get subscription count for a channel
   */
  getSubscriberCount(channel: string): number {
    return this.subscriptions.get(channel)?.size || 0;
  }

  /**
   * Get all active channels
   */
  getChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    console.log('[EventBus] All subscriptions cleared');
  }
}

// Singleton instance
export const eventBus = new EventBus();
