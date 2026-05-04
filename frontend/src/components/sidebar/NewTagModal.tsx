// src/components/sidebar/NewTagModal.tsx
import { useState } from 'react';
import { tagsApi } from '../../api/client';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#6b7280'];

export default function NewTagModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await tagsApi.create({ name: name.trim(), color });
      toast.success('Tag created!');
      onCreated();
    } catch { toast.error('Failed to create tag'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title="New Tag">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tag Name</label>
          <input className="input" placeholder="work, personal, ideas..." value={name} onChange={e => setName(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
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
            {loading ? 'Creating...' : 'Create Tag'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
