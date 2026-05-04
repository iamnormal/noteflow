// src/components/ai/AIEditMenu.tsx
import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { aiApi } from '../../api/client';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, ChevronDown } from 'lucide-react';

const AI_ACTIONS = [
  { value: 'improve', label: '✨ Improve writing' },
  { value: 'shorter', label: '📏 Make shorter' },
  { value: 'longer', label: '📝 Make longer' },
  { value: 'fix_grammar', label: '✅ Fix grammar' },
  { value: 'professional', label: '💼 Professional tone' },
  { value: 'casual', label: '😊 Casual tone' },
  { value: 'summarize', label: '📋 Summarize' },
  { value: 'continue', label: '➡️ Continue writing' },
];

export default function AIEditMenu({ editor }: { editor: Editor }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const applyAction = async (action: string) => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text.trim()) return;
    setLoading(true);
    setOpen(false);
    try {
      const { data } = await aiApi.edit({ text, action });
      editor.chain().focus().deleteSelection().insertContent(data.result).run();
      toast.success('AI edit applied!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI unavailable');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5">
      {loading ? (
        <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-brand-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying AI...
        </span>
      ) : (
        <div className="relative">
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 hover:bg-brand-100 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI Edit
            <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              {AI_ACTIONS.map(a => (
                <button key={a.value} onClick={() => applyAction(a.value)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
