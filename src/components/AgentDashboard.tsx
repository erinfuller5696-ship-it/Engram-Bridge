import { useEffect } from 'react';
import { useStore } from '../store';
import { Cpu, Activity, CheckCircle, AlertCircle, Clock, Wifi } from 'lucide-react';

export default function AgentDashboard() {
  const { agents, fetchAgents } = useStore();

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500/10 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing': return <Activity className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Cpu className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentDescription = (name: string) => {
    switch (name) {
      case 'MemoryAgent': return 'Handles Engram AI Memory — read, write, search, and subscribe to memory changes';
      case 'NotificationAgent': return 'Manages notification dispatch, queuing, and delivery to connected AI agents';
      case 'BridgeAgent': return 'MCP Protocol translator — routes tool calls between Qwen Vibe AI and ChatGPT';
      default: return 'Agent';
    }
  };

  const getAgentEmoji = (name: string) => {
    switch (name) {
      case 'MemoryAgent': return '🧠';
      case 'NotificationAgent': return '🔔';
      case 'BridgeAgent': return '🌉';
      default: return '🤖';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Agent Dashboard</h2>
            <p className="text-xs text-gray-500">
              {agents.length} agents active • Auto-refreshes every 5s
            </p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Connecting to agents...</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.name}
              className={`border rounded-2xl p-5 ${getStatusBg(agent.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAgentEmoji(agent.name)}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{getAgentDescription(agent.name)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(agent.status)}
                  <span className={`text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{agent.processedCount}</p>
                  <p className="text-[10px] text-gray-500">Processed</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{agent.errorCount}</p>
                  <p className="text-[10px] text-gray-500">Errors</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <p className="text-sm font-bold text-white">
                      {Math.round((Date.now() - agent.lastActivity) / 1000)}s
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500">Last active</p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Architecture Info */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5 mt-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-cyan-400" />
            System Architecture
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span><strong className="text-violet-300">MCP Protocol</strong> — Qwen Vibe AI ↔ Bridge Agent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><strong className="text-emerald-300">Memory Agent</strong> — Engram AI Memory (read/write/search)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span><strong className="text-amber-300">Notification Agent</strong> — Dispatch to ChatGPT & connected agents</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span><strong className="text-cyan-300">Event Bus</strong> — Pub/Sub connecting all agents</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <p className="text-[10px] text-gray-500">
              Flow: Memory Post → Event Bus → Notification Agent → AI Agent Notification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
