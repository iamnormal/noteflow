// src/components/notes/NotesList.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../../store';
import { notesApi } from '../../api/client';
import { Plus, SortDesc, Pin, Trash2, RotateCcw, X } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

function formatDate(d: string) {
  const date = new Date(d);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function NotesList() {
  const { activeNotebookId, activeTagId, activeNoteId, setActiveNoteId, activeView, notesRefresh, triggerNotesRefresh } = useAppStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at');

  const isTrash = activeView === 'trash';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { sort: sortBy, deleted: isTrash ? 'true' : 'false' };
      if (activeNotebookId) params.notebook_id = activeNotebookId;
      if (activeTagId) params.tag_id = activeTagId;
      const { data } = await notesApi.list(params);
      setNotes(data.notes);
    } finally { setLoading(false); }
  }, [activeNotebookId, activeTagId, isTrash, sortBy, notesRefresh]);

  useEffect(() => { load(); }, [load]);

  const createNote = async () => {
    try {
      const { data } = await notesApi.create({
        title: 'Untitled',
        notebook_id: activeNotebookId,
      });
      triggerNotesRefresh();
      setActiveNoteId(data.note.id);
    } catch { toast.error('Failed to create note'); }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notesApi.delete(id);
    triggerNotesRefresh();
    if (activeNoteId === id) setActiveNoteId(null);
    toast.success('Moved to trash');
  };

  const restoreNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notesApi.restore(id);
    triggerNotesRefresh();
    toast.success('Note restored');
  };

  const permanentDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    await notesApi.permanentDelete(id);
    triggerNotesRefresh();
    if (activeNoteId === id) setActiveNoteId(null);
    toast.success('Permanently deleted');
  };

  const listTitle = isTrash ? 'Trash' : activeNotebookId ? 'Notebook' : activeTagId ? 'Tagged Notes' : 'All Notes';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{listTitle}</h2>
        <div className="flex items-center gap-1">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer pr-1">
            <option value="updated_at">Modified</option>
            <option value="created_at">Created</option>
            <option value="title">Title</option>
          </select>
          {!isTrash && (
            <button onClick={createNote} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto">
        {loading && notes.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>
        )}
        {!loading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-gray-400 dark:text-gray-600">
              {isTrash ? 'Trash is empty' : 'No notes yet. Click + to create one.'}
            </p>
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} onClick={() => setActiveNoteId(note.id)}
            className={`group px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-gray-800/50 transition-all ${
              activeNoteId === note.id
                ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {note.pinned && <Pin className="w-3 h-3 text-brand-500 flex-shrink-0" />}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {note.title || 'Untitled'}
                  </span>
                </div>
                {note.content_text && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {note.content_text.slice(0, 120)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400 dark:text-gray-600">{formatDate(note.updated_at)}</span>
                  {note.notebook_icon && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-0.5">
                      <span>{note.notebook_icon}</span>
                      <span className="truncate max-w-[80px]">{note.notebook_title}</span>
                    </span>
                  )}
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((t: any) => (
                        <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: t.color + '20', color: t.color }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!isTrash && (
                  <button onClick={e => deleteNote(note.id, e)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isTrash && (
                  <>
                    <button onClick={e => restoreNote(note.id, e)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-brand-100 text-gray-400 hover:text-brand-600 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => permanentDelete(note.id, e)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
