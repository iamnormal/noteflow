// src/components/settings/TemplatesManager.tsx
import { useEffect, useState } from 'react';
import { templatesApi, notesApi } from '../../api/client';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, FileText, Star, X, Save, ExternalLink } from 'lucide-react';
import Modal from '../ui/Modal';

const CATEGORIES = ['general','work','personal','study','dev','finance','health'];
const ICONS = ['📝','📊','🗂️','📅','📔','🔬','✈️','🐛','📚','💡','🎯','💼','🏠','💰'];

export default function TemplatesManager() {
  const { setActiveNoteId, setActiveView, triggerNotesRefresh, setSettingsOpen } = useAppStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await templatesApi.list();
    setTemplates(data.templates);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const useTemplate = async (template: any) => {
    try {
      const { data } = await notesApi.create({
        title: template.title,
        content: template.content,
      });
      setSettingsOpen(false);
      setActiveView('notes');
      setActiveNoteId(data.note.id);
      triggerNotesRefresh();
      toast.success(`Created note from "${template.title}" template`);
    } catch { toast.error('Failed to create note from template'); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await templatesApi.delete(id);
    load();
    toast.success('Template deleted');
  };

  const filtered = filter ? templates.filter(t => t.category === filter) : templates;
  const system = filtered.filter(t => t.is_system);
  const custom = filtered.filter(t => !t.is_system);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Templates</h3>
          <p className="text-xs text-gray-400 mt-0.5">{templates.length} templates · {custom.length} custom</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs py-1.5">
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setFilter('')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${!filter ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${filter === c ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {custom.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Templates</h4>
              <div className="grid grid-cols-2 gap-2">
                {custom.map(t => (
                  <TemplateCard key={t.id} template={t} onUse={() => useTemplate(t)} onEdit={() => setEditTemplate(t)} onDelete={() => deleteTemplate(t.id)} />
                ))}
              </div>
            </div>
          )}
          {system.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System Templates</h4>
              <div className="grid grid-cols-2 gap-2">
                {system.map(t => (
                  <TemplateCard key={t.id} template={t} onUse={() => useTemplate(t)} />
                ))}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No templates in this category</p>
          )}
        </div>
      )}

      {showCreate && <TemplateFormModal onClose={() => setShowCreate(false)} onSaved={() => { load(); setShowCreate(false); }} />}
      {editTemplate && <TemplateFormModal template={editTemplate} onClose={() => setEditTemplate(null)} onSaved={() => { load(); setEditTemplate(null); }} />}
    </div>
  );
}

function TemplateCard({ template, onUse, onEdit, onDelete }: any) {
  return (
    <div className="group relative flex flex-col p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-card-hover transition-all cursor-pointer" onClick={onUse}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl leading-none">{template.icon}</span>
        {template.is_system && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5 truncate">{template.title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 flex-1">{template.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 capitalize">{template.category}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!template.is_system && onEdit && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {!template.is_system && onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onUse(); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-brand-100 dark:hover:bg-brand-900/30 text-gray-400 hover:text-brand-600">
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateFormModal({ template, onClose, onSaved }: any) {
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'general');
  const [icon, setIcon] = useState(template?.icon || '📝');
  const [content, setContent] = useState(template?.content || '');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (template?.id) {
        await templatesApi.update(template.id, { title, description, category, icon, content });
      } else {
        await templatesApi.create({ title, description, category, icon, content });
      }
      toast.success(template?.id ? 'Template updated' : 'Template created');
      onSaved();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} title={template?.id ? 'Edit Template' : 'Create Template'} size="lg">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-8 h-8 text-base flex items-center justify-center rounded-lg border-2 transition-all ${icon === ic ? 'border-brand-500 bg-brand-50' : 'border-gray-200 dark:border-gray-700'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Content (HTML)</label>
          <textarea className="input font-mono text-xs" rows={8} value={content} onChange={e => setContent(e.target.value)}
            placeholder="<h2>Title</h2><p>Content...</p>" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
