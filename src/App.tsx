import { useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import MemoryPanel from './components/MemoryPanel';
import NotificationPanel from './components/NotificationPanel';
import AgentDashboard from './components/AgentDashboard';

export default function App() {
  const { activePanel, connectWebSocket, fetchMemories, fetchNotifications, fetchAgents } = useStore();

  useEffect(() => {
    // Initialize
    connectWebSocket();
    fetchMemories();
    fetchNotifications();
    fetchAgents();
  }, [connectWebSocket, fetchMemories, fetchNotifications, fetchAgents]);

  const renderPanel = () => {
    switch (activePanel) {
      case 'chat': return <ChatInterface />;
      case 'memories': return <MemoryPanel />;
      case 'notifications': return <NotificationPanel />;
      case 'agents': return <AgentDashboard />;
      default: return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {renderPanel()}
      </main>
    </div>
  );
}
