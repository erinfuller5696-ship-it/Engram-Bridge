import { useStore } from '../store';
import { Brain, MessageSquare, Bell, Cpu, Zap } from 'lucide-react';

export default function Sidebar() {
  const { activePanel, setActivePanel, unreadCount, wsConnected } = useStore();

  const items = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat', badge: 0 },
    { id: 'memories' as const, icon: Brain, label: 'Memories', badge: 0 },
    { id: 'notifications' as const, icon: Bell, label: 'Alerts', badge: unreadCount },
    { id: 'agents' as const, icon: Cpu, label: 'Agents', badge: 0 },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Engram Bridge</h1>
            <p className="text-[10px] text-gray-500">MCP Plugin v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activePanel === item.id
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">
            {wsConnected ? 'WebSocket Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="px-3 py-1">
          <p className="text-[10px] text-gray-600">Qwen Vibe AI ↔ ChatGPT</p>
          <p className="text-[10px] text-gray-600">Engram Memory Bridge</p>
        </div>
      </div>
    </div>
  );
}
