// src/components/ai/AIChatPanel.tsx
import { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/client';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Bot, Send, X, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const STARTERS = [
  'Summarize this note for me',
  'What are the key action items?',
  'Help me improve this content',
  'What questions does this raise?',
];

export default function AIChatPanel() {
  const { setAiChatOpen, activeNoteId } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { data } = await aiApi.chat({
        message: msg,
        note_ids: activeNoteId ? [activeNoteId] : [],
        history: messages.slice(-10),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI unavailable. Check your API key in Settings.');
      setMessages(prev => prev.slice(0, -1));
    } finally { setLoading(false); }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col z-10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
            {activeNoteId && <p className="text-xs text-gray-400">Using current note</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMessages([])} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Clear chat">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setAiChatOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask me anything</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {activeNoteId ? 'I can see the current note' : 'Select a note to give me context'}
            </p>
            <div className="space-y-2">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-500 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask anything..."
            className="input flex-1 text-sm py-2"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg transition-colors flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
