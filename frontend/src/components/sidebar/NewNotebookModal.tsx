// src/components/sidebar/NewNotebookModal.tsx
import { useState } from 'react';
import { notebooksApi } from '../../api/client';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { BookOpen } from 'lucide-react';

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
const ICONS = ['📓','📔','📒','📕','📗','📘','📙','🗒️','📋','🗂️','💼','🎯'];

export function NewNotebookModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('📓');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await notebooksApi.create({ title: title.trim(), color, icon });
      toast.success('Notebook created!');
      onCreated();
    } catch { toast.error('Failed to create notebook'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title="New Notebook">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input className="input" placeholder="My Notebook" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 text-lg flex items-center justify-center rounded-lg border-2 transition-all ${icon === ic ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Notebook'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default NewNotebookModal;
