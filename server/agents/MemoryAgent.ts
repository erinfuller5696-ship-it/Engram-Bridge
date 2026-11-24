// ============================================================
// Memory Agent
// Handles all Engram AI memory operations
// ============================================================

import { MemoryEntry, AgentStatus } from '../types.js';
import { eventBus } from './EventBus.js';

export class MemoryAgent {
  private memories: Map<string, MemoryEntry> = new Map();
  private status: AgentStatus = {
    name: 'MemoryAgent',
    status: 'idle',
    lastActivity: Date.now(),
    processedCount: 0,
    errorCount: 0,
  };

  constructor() {
    // Listen for memory-related events
    eventBus.subscribe('memory:query', (payload) => {
      this.handleQuery(payload.data as { query: string; limit: number });
    });

    console.log('[MemoryAgent] Initialized — Engram AI Memory connected');
  }

  /**
   * Post a new memory entry (triggers notification)
   */
  post(content: string, tags: string[] = [], source: MemoryEntry['source'] = 'user', metadata?: Record<string, unknown>): MemoryEntry {
    this.setStatus('processing');

    try {
      const entry: MemoryEntry = {
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        content,
        tags,
        timestamp: Date.now(),
        source,
        metadata,
      };

      this.memories.set(entry.id, entry);
      this.status.processedCount++;

      // Publish event — this triggers the Notification Agent
      eventBus.publish('memory:created', entry, 'MemoryAgent');
      eventBus.publish('memory:updated', { action: 'created', entry }, 'MemoryAgent');

      console.log(`[MemoryAgent] Memory posted: ${entry.id} with tags [${tags.join(', ')}]`);
      this.setStatus('idle');
      return entry;
    } catch (err) {
      this.status.errorCount++;
      this.setStatus('error');
      throw err;
    }
  }

  /**
   * Read/query memories
   */
  read(query?: string, limit: number = 20): MemoryEntry[] {
    this.setStatus('processing');

    try {
      let results = Array.from(this.memories.values());

      // Filter by query (search in content and tags)
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (m) =>
            m.content.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Sort by timestamp (newest first)
      results.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results
      results = results.slice(0, limit);

      this.status.processedCount++;
      this.setStatus('idle');
      return results;
    } catch (err) {
      this.status.errorCount++;
      this.setStatus('error');
      throw err;
    }
  }

  /**
   * Get a specific memory by ID
   */
  get(id: string): MemoryEntry | undefined {
    return this.memories.get(id);
  }

  /**
   * Delete a memory
   */
  delete(id: string): boolean {
    const entry = this.memories.get(id);
    if (!entry) return false;

    this.memories.delete(id);
    eventBus.publish('memory:deleted', { id, entry }, 'MemoryAgent');
    return true;
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    const tags = new Set<string>();
    for (const memory of this.memories.values()) {
      memory.tags.forEach((t) => tags.add(t));
    }
    return Array.from(tags);
  }

  /**
   * Get memory count
   */
  getCount(): number {
    return this.memories.size;
  }

  /**
   * Handle query events
   */
  private handleQuery(data: { query: string; limit: number }): MemoryEntry[] {
    return this.read(data.query, data.limit);
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
export const memoryAgent = new MemoryAgent();
