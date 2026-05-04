// src/components/ui/SearchModal.tsx
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import { searchApi } from '../../api/client';
import { Search, FileText, CheckSquare, X, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function SearchModal() {
  const { setSearchOpen, setActiveNoteId, setActiveView } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ notes: any[]; tasks: any[] }>({ notes: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults({ notes: [], tasks: [] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchApi.search(query);
        setResults(data);
      } finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const openNote = (id: string) => {
    setActiveNoteId(id);
    setActiveView('notes');
    setSearchOpen(false);
  };

  const hasResults = results.notes.length > 0 || results.tasks.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, tasks, tags..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-base"
          />
          {loading && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              Type to search your notes and tasks
            </div>
          )}

          {query.length >= 2 && !hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results found for "{query}"
            </div>
          )}

          {results.notes.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</p>
              {results.notes.map(note => (
                <button key={note.id} onClick={() => openNote(note.id)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{note.title || 'Untitled'}</p>
                    {note.content_text && (
                      <p className="text-xs text-gray-400 truncate">{note.content_text.slice(0, 80)}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{format(new Date(note.updated_at), 'MMM d')}</span>
                </button>
              ))}
            </div>
          )}

          {results.tasks.length > 0 && (
            <div className="py-2 border-t border-gray-50 dark:border-gray-800">
              <p className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tasks</p>
              {results.tasks.map(task => (
                <button key={task.id} onClick={() => { setActiveView('tasks'); setSearchOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                  <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">{task.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'done' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {task.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">↵</kbd> to open</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
