// src/components/settings/TagsManager.tsx
import { useEffect, useState } from 'react';
import { tagsApi } from '../../api/client';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Check, X, Hash } from 'lucide-react';

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#6b7280'];

export default function TagsManager() {
  const { triggerTagsRefresh } = useAppStore();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#10b981');
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await tagsApi.list();
    setTags(data.tags);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (tag: any) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = async (id: string) => {
    await tagsApi.update(id, { name: editName, color: editColor });
    setEditingId(null);
    load();
    triggerTagsRefresh();
    toast.success('Tag updated');
  };

  const deleteTag = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all notes.')) return;
    await tagsApi.delete(id);
    load();
    triggerTagsRefresh();
    toast.success('Tag deleted');
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await tagsApi.create({ name: newName.trim(), color: newColor });
    setNewName(''); setShowAdd(false);
    load();
    triggerTagsRefresh();
    toast.success('Tag created');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Manage Tags</h3>
          <p className="text-xs text-gray-400 mt-0.5">{tags.length} tags total</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="btn-primary text-xs py-1.5">
          <Plus className="w-3.5 h-3.5" /> New Tag
        </button>
      </div>

      {showAdd && (
        <form onSubmit={createTag} className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 mb-4">
          <input className="input flex-1 text-sm py-1.5" placeholder="Tag name..." value={newName} onChange={e => setNewName(e.target.value)} autoFocus required />
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button type="submit" className="btn-primary text-xs py-1.5">Create</button>
          <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs py-1.5"><X className="w-3.5 h-3.5" /></button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No tags yet. Create your first tag above.</div>
      ) : (
        <div className="space-y-1.5">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
              {editingId === tag.id ? (
                <>
                  <input className="input flex-1 text-sm py-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <div className="flex gap-1">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditColor(c)}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${editColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button onClick={() => saveEdit(tag.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{tag.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">{tag.note_count} notes</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(tag)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteTag(tag.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
