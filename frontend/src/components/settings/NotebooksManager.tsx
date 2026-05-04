// src/components/settings/NotebooksManager.tsx
import { useEffect, useState } from 'react';
import { notebooksApi } from '../../api/client';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
const ICONS  = ['📓','📔','📒','📕','📗','📘','📙','🗒️','📋','🗂️','💼','🎯','🔖','🧠','✏️'];

export default function NotebooksManager() {
  const { triggerNotebooksRefresh } = useAppStore();
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#10b981');
  const [newIcon, setNewIcon] = useState('📓');

  const load = async () => {
    setLoading(true);
    const { data } = await notebooksApi.list();
    setNotebooks(data.notebooks);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (nb: any) => {
    setEditingId(nb.id);
    setEditTitle(nb.title);
    setEditColor(nb.color);
    setEditIcon(nb.icon);
  };

  const saveEdit = async (id: string) => {
    await notebooksApi.update(id, { title: editTitle, color: editColor, icon: editIcon });
    setEditingId(null);
    load();
    triggerNotebooksRefresh();
    toast.success('Notebook updated');
  };

  const deleteNotebook = async (id: string, isDefault: boolean) => {
    if (isDefault) { toast.error("Can't delete the default notebook"); return; }
    if (!confirm('Delete this notebook? Notes will be moved to your default notebook.')) return;
    await notebooksApi.delete(id);
    load();
    triggerNotebooksRefresh();
    toast.success('Notebook deleted');
  };

  const createNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await notebooksApi.create({ title: newTitle.trim(), color: newColor, icon: newIcon });
    setNewTitle(''); setShowAdd(false);
    load();
    triggerNotebooksRefresh();
    toast.success('Notebook created');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Manage Notebooks</h3>
          <p className="text-xs text-gray-400 mt-0.5">{notebooks.length} notebooks</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary text-xs py-1.5">
          <Plus className="w-3.5 h-3.5" /> New Notebook
        </button>
      </div>

      {showAdd && (
        <form onSubmit={createNotebook} className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 mb-4 space-y-3">
          <input className="input text-sm" placeholder="Notebook name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus required />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setNewIcon(ic)}
                  className={`w-8 h-8 text-base flex items-center justify-center rounded-lg border-2 transition-all ${newIcon === ic ? 'border-brand-500 bg-brand-50' : 'border-gray-200 dark:border-gray-700'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs py-1.5">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-1.5">
          {notebooks.map(nb => (
            <div key={nb.id} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
              {editingId === nb.id ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1 flex-wrap">
                    {ICONS.map(ic => (
                      <button key={ic} type="button" onClick={() => setEditIcon(ic)}
                        className={`w-7 h-7 text-sm flex items-center justify-center rounded-lg border transition-all ${editIcon === ic ? 'border-brand-500 bg-brand-50' : 'border-gray-200 dark:border-gray-700'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <input className="input flex-1 text-sm py-1 min-w-[120px]" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${editColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(nb.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-xl leading-none">{nb.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{nb.title}</p>
                    <p className="text-xs text-gray-400">{nb.note_count} notes{nb.is_default ? ' · Default' : ''}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: nb.color }} />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(nb)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!nb.is_default && (
                      <button onClick={() => deleteNotebook(nb.id, nb.is_default)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
