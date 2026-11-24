import { useEffect } from 'react';
import { useStore } from '../store';
import { Brain, Trash2, Tag, Clock, Search } from 'lucide-react';
import { useState } from 'react';

export default function MemoryPanel() {
  const { memories, fetchMemories, deleteMemory } = useStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const filtered = search
    ? memories.filter(
        (m) =>
          m.content.toLowerCase().includes(search.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : memories;

  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags)));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Engram Memories</h2>
            <p className="text-xs text-gray-500">{memories.length} memories stored • {allTags.length} tags</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearch(tag)}
                className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No memories yet</p>
            <p className="text-gray-600 text-xs mt-1">Post from the chat to create memories</p>
          </div>
        ) : (
          filtered.map((memory) => (
            <div
              key={memory.id}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-200 leading-relaxed">{memory.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">
                        {new Date(memory.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      memory.source === 'qwen' ? 'bg-violet-500/20 text-violet-400' :
                      memory.source === 'system' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {memory.source}
                    </span>
                  </div>
                  {memory.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="w-3 h-3 text-gray-500" />
                      {memory.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-emerald-400">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMemory(memory.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
