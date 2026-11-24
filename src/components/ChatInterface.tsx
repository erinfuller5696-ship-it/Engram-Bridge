import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Send, Brain, Sparkles } from 'lucide-react';

export default function ChatInterface() {
  const { chatMessages, sendChatMessage, isLoading } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Engram Chat</h2>
            <p className="text-xs text-gray-500">Post memories • Notify AI agents • Type /help for commands</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
                  : 'bg-gray-800 border border-gray-700 text-gray-200'
              }`}
            >
              {msg.agent && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-medium">{msg.agent}</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-violet-200' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or /memory <text> #tags..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setInput('/memory ')}
            className="text-[10px] px-2 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-violet-300 transition-colors"
          >
            /memory
          </button>
          <button
            type="button"
            onClick={() => setInput('/notify ')}
            className="text-[10px] px-2 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-violet-300 transition-colors"
          >
            /notify
          </button>
          <button
            type="button"
            onClick={() => setInput('/status')}
            className="text-[10px] px-2 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-violet-300 transition-colors"
          >
            /status
          </button>
          <button
            type="button"
            onClick={() => setInput('/help')}
            className="text-[10px] px-2 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-violet-300 transition-colors"
          >
            /help
          </button>
        </div>
      </form>
    </div>
  );
}
