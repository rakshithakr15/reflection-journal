import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { JournalInteraction, ReflectionMode, ChatMessage } from '../types';
import {
  Send,
  Sparkles,
  Edit2,
  Check,
  X,
  Copy,
  CheckCheck,
  BrainCircuit,
  FileText,
  Lightbulb,
  PanelLeft,
} from 'lucide-react';

interface JournalEditorProps {
  interaction: JournalInteraction | null;
  onSendMessage: (prompt: string, mode: ReflectionMode) => Promise<boolean>;
  onUpdateTitle: (title: string) => Promise<void>;
  isProcessing: boolean;
  onToggleSidebarMobile: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  interaction,
  onSendMessage,
  onUpdateTitle,
  isProcessing,
  onToggleSidebarMobile,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [currentMode, setCurrentMode] = useState<ReflectionMode>(
    interaction?.category || 'reflection'
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (interaction) {
      setCurrentMode(interaction.category);
      setEditedTitle(interaction.title);
    } else {
      setEditedTitle('New Reflection');
    }
  }, [interaction?.id, interaction?.title, interaction?.category]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction?.messages?.length, isProcessing]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isProcessing) return;

    const textToSubmit = inputPrompt.trim();
    // Do NOT clear inputPrompt yet! We only clear if onSendMessage succeeds
    const success = await onSendMessage(textToSubmit, currentMode);
    if (success) {
      setInputPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    await onUpdateTitle(editedTitle.trim());
    setIsEditingTitle(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickStarters = [
    {
      title: 'Untangle a Complex Decision',
      text: 'I am wrestling with a choice between two paths and need help clarifying my priorities and values.',
      mode: 'reflection' as ReflectionMode,
    },
    {
      title: 'Decompress & Reflect on Today',
      text: 'Today felt overwhelming with competing priorities. I want to reflect on what went well and what drained my energy.',
      mode: 'reflection' as ReflectionMode,
    },
    {
      title: 'Synthesize My Raw Notes',
      text: 'Here are my messy notes and thoughts from this week. Please organize them into key themes and action steps.',
      mode: 'summary' as ReflectionMode,
    },
    {
      title: 'Creative Project Brainstorm',
      text: 'I am starting a new creative initiative. Help me brainstorm 5 unique angles and potential bottlenecks.',
      mode: 'brainstorm' as ReflectionMode,
    },
  ];

  return (
    <div id="journal-editor-container" className="flex flex-1 flex-col h-full bg-[#F9F7F2] relative overflow-hidden">
      {/* Workspace Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E6E1D3] px-4 sm:px-6 bg-[#F9F7F2]/90 backdrop-blur-xs z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            id="mobile-toggle-sidebar-btn"
            onClick={onToggleSidebarMobile}
            aria-label="Toggle history menu"
            className="md:hidden rounded-lg p-1.5 text-[#5A5A58] hover:bg-[#EAE6D8] transition"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                id="edit-title-input"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="w-full rounded-lg border border-[#E6E1D3] bg-white px-2.5 py-1 text-sm font-semibold text-[#3A3A38] focus:border-[#7D8471] focus:outline-none"
                autoFocus
              />
              <button
                id="save-title-btn"
                onClick={handleSaveTitle}
                className="rounded-lg p-1.5 text-[#7D8471] hover:bg-[#EAE6D8] transition"
                title="Save Title"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                id="cancel-title-btn"
                onClick={() => setIsEditingTitle(false)}
                className="rounded-lg p-1.5 text-[#9A9A95] hover:bg-[#EAE6D8] transition"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h2
                id="interaction-title-heading"
                className="text-sm sm:text-base font-semibold text-[#3A3A38] truncate"
              >
                {interaction?.title || 'New Reflection Session'}
              </h2>
              {interaction && (
                <button
                  id="start-edit-title-btn"
                  onClick={() => {
                    setEditedTitle(interaction.title);
                    setIsEditingTitle(true);
                  }}
                  className="rounded-md p-1 text-[#9A9A95] hover:bg-[#EAE6D8] hover:text-[#5A5A58] transition"
                  title="Rename session"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center rounded-xl bg-[#F0EDE5] p-1 border border-[#E6E1D3]">
          <button
            id="mode-tab-reflection"
            onClick={() => setCurrentMode('reflection')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              currentMode === 'reflection'
                ? 'bg-white text-[#3A3A38] shadow-xs'
                : 'text-[#5A5A58] hover:text-[#3A3A38]'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-[#7D8471]" />
            <span className="hidden sm:inline">Reflect</span>
          </button>
          <button
            id="mode-tab-summary"
            onClick={() => setCurrentMode('summary')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              currentMode === 'summary'
                ? 'bg-white text-[#3A3A38] shadow-xs'
                : 'text-[#5A5A58] hover:text-[#3A3A38]'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#9C7A5B]" />
            <span className="hidden sm:inline">Summarize</span>
          </button>
          <button
            id="mode-tab-brainstorm"
            onClick={() => setCurrentMode('brainstorm')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              currentMode === 'brainstorm'
                ? 'bg-white text-[#3A3A38] shadow-xs'
                : 'text-[#5A5A58] hover:text-[#3A3A38]'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-[#617A60]" />
            <span className="hidden sm:inline">Brainstorm</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {(!interaction || interaction.messages.length === 0) && (
          <div className="mx-auto max-w-2xl py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#7D8471] border border-[#E6E1D3] mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#3A3A38]">What is on your mind today?</h3>
            <p className="mt-1.5 text-sm text-[#5A5A58] max-w-md mx-auto leading-relaxed">
              Write down your raw thoughts, a challenge, or a daily recap. Gemini 3.6 Flash will provide grounded reflections, structured summaries, or creative perspectives.
            </p>

            {/* Quick Starters */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {quickStarters.map((starter, idx) => (
                <button
                  key={idx}
                  id={`quick-starter-${idx}`}
                  onClick={() => {
                    setInputPrompt(starter.text);
                    setCurrentMode(starter.mode);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-xl border border-[#E6E1D3] bg-[#F0EDE5]/60 p-3.5 text-left hover:border-[#DCD6C5] hover:bg-[#EAE6D8]/80 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#3A3A38] group-hover:text-black">
                      {starter.title}
                    </span>
                    <span className="text-[10px] text-[#9A9A95] capitalize">{starter.mode}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#5A5A58] line-clamp-2 leading-relaxed">
                    {starter.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render Interaction Messages */}
        {interaction &&
          interaction.messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#7D8471] text-white'
                      : 'bg-white border border-[#E6E1D3] text-[#3A3A38]'
                  }`}
                >
                  {/* Bubble Header */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-[#E6E1D3]/40 text-xs">
                    <span className={`font-medium ${isUser ? 'text-[#EAE6D8]' : 'text-[#5A5A58] flex items-center gap-1.5'}`}>
                      {!isUser && <Sparkles className="h-3.5 w-3.5 text-[#7D8471]" />}
                      {isUser ? 'Your Reflection' : 'Gemini 3.6 Flash'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${isUser ? 'text-[#EAE6D8]/80' : 'text-[#9A9A95]'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && (
                        <button
                          id={`copy-msg-${msg.id}`}
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="rounded p-1 text-[#9A9A95] hover:text-[#3A3A38] transition"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <CheckCheck className="h-3.5 w-3.5 text-[#7D8471]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bubble Body */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-white font-normal leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none text-[#3A3A38] leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E6E1D3] bg-[#F0EDE5] p-4 text-xs text-[#5A5A58] shadow-xs">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#7D8471]" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#7D8471]" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#7D8471]" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">Gemini is synthesizing your reflection...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E6E1D3] bg-[#F9F7F2] p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex flex-col gap-2">
          <div className="relative rounded-2xl border border-[#E6E1D3] bg-white shadow-xs focus-within:border-[#7D8471] focus-within:ring-1 focus-within:ring-[#7D8471] transition">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              rows={3}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentMode === 'summary'
                  ? 'Paste raw journal notes or thoughts to summarize...'
                  : currentMode === 'brainstorm'
                  ? 'Pose a challenge, idea, or scenario to brainstorm...'
                  : 'Write your thoughts, feelings, or reflections freely...'
              }
              disabled={isProcessing}
              className="w-full resize-none rounded-2xl border-none bg-transparent p-3.5 text-sm text-[#3A3A38] placeholder:text-[#9A9A95] focus:outline-none disabled:opacity-50 leading-relaxed"
            />

            <div className="flex items-center justify-between border-t border-[#E6E1D3]/60 px-3.5 py-2 bg-[#FAF8F5] rounded-b-2xl">
              <div className="flex items-center gap-2 text-[11px] text-[#9A9A95]">
                <span>{inputPrompt.length} chars</span>
                <span>•</span>
                <span className="hidden sm:inline">Press Cmd+Enter to submit</span>
              </div>

              <button
                id="send-reflection-btn"
                type="submit"
                disabled={!inputPrompt.trim() || isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7D8471] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#6D7462] active:bg-[#5E6454] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <span>Send & Reflect</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
