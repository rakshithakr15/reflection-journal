import React, { useState } from 'react';
import { JournalInteraction, ReflectionMode } from '../types';
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  ListFilter,
  Trash2,
  Calendar,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface HistorySidebarProps {
  interactions: JournalInteraction[];
  activeInteractionId: string | null;
  onSelectInteraction: (id: string) => void;
  onNewInteraction: () => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  isLoading: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  interactions,
  activeInteractionId,
  onSelectInteraction,
  onNewInteraction,
  onDeleteInteraction,
  isLoading,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInteractions = interactions.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = filterMode === 'all' || item.category === filterMode;

    return matchesSearch && matchesMode;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this journal reflection?')) {
      setDeletingId(id);
      try {
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return <span className="rounded-md bg-[#EBE5DA] px-1.5 py-0.5 text-[10px] font-medium text-[#6E5D4F] border border-[#DDD3C3]">Summary</span>;
      case 'brainstorm':
        return <span className="rounded-md bg-[#E3E8DF] px-1.5 py-0.5 text-[10px] font-medium text-[#4A5844] border border-[#D1DBCB]">Brainstorm</span>;
      default:
        return <span className="rounded-md bg-[#EAE6D8] px-1.5 py-0.5 text-[10px] font-medium text-[#5A5A58] border border-[#DCD6C5]">Reflection</span>;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#3A3A38]/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="history-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 flex h-full w-80 flex-col border-r border-[#E6E1D3] bg-[#F0EDE5] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header & New Entry Action */}
        <div className="p-4 border-b border-[#E6E1D3] flex flex-col gap-3">
          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNewInteraction();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7D8471] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#6D7462] active:bg-[#5E6454] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Reflection</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9A9A95]" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E6E1D3] bg-[#F9F7F2] py-1.5 pl-9 pr-3 text-xs text-[#3A3A38] placeholder:text-[#9A9A95] focus:border-[#7D8471] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {['all', 'reflection', 'summary', 'brainstorm'].map((mode) => (
              <button
                key={mode}
                id={`sidebar-filter-${mode}`}
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition cursor-pointer whitespace-nowrap ${
                  filterMode === mode
                    ? 'bg-[#7D8471] text-white shadow-xs'
                    : 'bg-[#EAE6D8] text-[#5A5A58] hover:bg-[#E0DACB]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#9A9A95]">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#E6E1D3] border-t-[#7D8471] mb-2" />
              <p>Loading your reflections...</p>
            </div>
          ) : filteredInteractions.length === 0 ? (
            <div className="py-12 text-center px-4">
              <BookOpen className="mx-auto h-8 w-8 text-[#9A9A95]/60 mb-2" />
              <p className="text-xs font-medium text-[#5A5A58]">No reflections found</p>
              <p className="text-[11px] text-[#9A9A95] mt-1">
                {searchQuery ? 'Try a different search query' : 'Begin by writing your first journal entry.'}
              </p>
            </div>
          ) : (
            filteredInteractions.map((item) => {
              const isActive = item.id === activeInteractionId;
              const lastMessage = item.messages[item.messages.length - 1];

              return (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => {
                    onSelectInteraction(item.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex flex-col rounded-xl p-3 text-left transition cursor-pointer border ${
                    isActive
                      ? 'border-[#7D8471] bg-[#EAE6D8] shadow-xs'
                      : 'border-transparent hover:border-[#E6E1D3] hover:bg-[#EAE6D8]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-[#3A3A38] line-clamp-1 flex-1">
                      {item.title || 'Untitled Reflection'}
                    </h3>
                    <span className="text-[10px] text-[#9A9A95] shrink-0">
                      {formatDate(item.updatedAt || item.createdAt)}
                    </span>
                  </div>

                  {lastMessage && (
                    <p className="mt-1 text-[11px] text-[#5A5A58] line-clamp-2 leading-relaxed">
                      {lastMessage.content}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getModeBadge(item.category)}
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#9A9A95]">
                        <MessageSquare className="h-3 w-3" />
                        {item.messages.length}
                      </span>
                    </div>

                    <button
                      id={`delete-history-${item.id}`}
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      title="Delete entry"
                      className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-[#9A9A95] hover:bg-[#FDF4F3] hover:text-[#C85A54] transition focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div className="border-t border-[#E6E1D3] p-3 text-center">
          <p className="text-[11px] text-[#9A9A95]">
            {interactions.length} {interactions.length === 1 ? 'reflection' : 'reflections'} saved
          </p>
        </div>
      </aside>
    </>
  );
};
