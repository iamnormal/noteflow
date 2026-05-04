// src/components/tasks/TasksView.tsx
import { useEffect, useState } from 'react';
import { tasksApi } from '../../api/client';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2, Circle, AlertCircle, ChevronDown, Trash2, Flag, Calendar, Loader2, Square, CheckSquare } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  none: { label: 'None', color: '#9ca3af', icon: '○' },
  low: { label: 'Low', color: '#60a5fa', icon: '▽' },
  medium: { label: 'Medium', color: '#f59e0b', icon: '◈' },
  high: { label: 'High', color: '#ef4444', icon: '⬡' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#6b7280' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  done: { label: 'Done', color: '#10b981' },
};

function formatDue(d?: string) {
  if (!d) return null;
  const date = new Date(d);
  if (isToday(date)) return { text: 'Today', color: 'text-amber-500' };
  if (isTomorrow(date)) return { text: 'Tomorrow', color: 'text-blue-500' };
  if (isPast(date)) return { text: format(date, 'MMM d'), color: 'text-red-500' };
  return { text: format(date, 'MMM d'), color: 'text-gray-500' };
}

export default function TasksView() {
  const { tasksRefresh, triggerTasksRefresh } = useAppStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newPriority, setNewPriority] = useState('none');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const { data } = await tasksApi.list(params);
      setTasks(data.tasks);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus, filterPriority, tasksRefresh]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await tasksApi.create({ title: newTitle, due_date: newDue || undefined, priority: newPriority });
    setNewTitle(''); setNewDue(''); setNewPriority('none'); setShowAddTask(false);
    triggerTasksRefresh();
    toast.success('Task created!');
  };

  const toggleDone = async (task: any) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await tasksApi.update(task.id, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (id: string) => {
    await tasksApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const bulkUpdate = async () => {
    if (!selectedIds.length || !bulkAction) return;
    await tasksApi.bulkUpdate({ ids: selectedIds, updates: { status: bulkAction } });
    triggerTasksRefresh();
    setSelectedIds([]); setBulkAction('');
    toast.success(`Updated ${selectedIds.length} tasks`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-xs text-gray-400">{tasks.filter(t => t.status !== 'done').length} remaining</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none">
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none">
            <option value="">All Priority</option>
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
          <button onClick={() => setShowAddTask(v => !v)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-2 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-100 dark:border-brand-900/30">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-400">{selectedIds.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="text-sm border border-brand-200 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 outline-none">
            <option value="">Change status...</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
          <button onClick={bulkUpdate} className="btn-primary text-xs py-1">Apply</button>
          <button onClick={() => setSelectedIds([])} className="btn-ghost text-xs py-1">Clear</button>
        </div>
      )}

      {/* Add task form */}
      {showAddTask && (
        <form onSubmit={addTask} className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-brand-50/50 dark:bg-brand-900/10">
          <input className="input flex-1 text-sm" placeholder="Task title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus required />
          <input type="date" className="input text-sm w-36" value={newDue} onChange={e => setNewDue(e.target.value)} />
          <select className="input text-sm w-28" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
          <button type="submit" className="btn-primary text-sm py-2">Add</button>
          <button type="button" onClick={() => setShowAddTask(false)} className="btn-ghost text-sm py-2">Cancel</button>
        </form>
      )}

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No tasks yet. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {Object.entries(grouped).map(([status, statusTasks]) => statusTasks.length > 0 && (
              <div key={status}>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[status].color }} />
                  {STATUS_CONFIG[status].label}
                  <span className="ml-1 bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">{statusTasks.length}</span>
                </h2>
                <div className="space-y-1.5">
                  {statusTasks.map(task => {
                    const due = formatDue(task.due_date);
                    const isSelected = selectedIds.includes(task.id);
                    return (
                      <div key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          isSelected ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}>
                        {/* Checkbox for bulk select */}
                        <button onClick={() => toggleSelect(task.id)} className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-brand-500 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-500" /> : <Square className="w-4 h-4" />}
                        </button>

                        {/* Done toggle */}
                        <button onClick={() => toggleDone(task)} className="mt-0.5 flex-shrink-0">
                          {task.status === 'done'
                            ? <CheckCircle2 className="w-5 h-5 text-brand-500" />
                            : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-brand-400 transition-colors" />
                          }
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            {due && (
                              <span className={`flex items-center gap-1 text-xs ${due.color}`}>
                                <Calendar className="w-3 h-3" />{due.text}
                              </span>
                            )}
                            {task.priority !== 'none' && (
                              <span className="text-xs flex items-center gap-1" style={{ color: PRIORITY_CONFIG[task.priority]?.color }}>
                                <Flag className="w-3 h-3" />{PRIORITY_CONFIG[task.priority]?.label}
                              </span>
                            )}
                            {task.note_title && (
                              <span className="text-xs text-gray-400">📝 {task.note_title}</span>
                            )}
                          </div>
                          {/* Subtasks */}
                          {task.subtasks?.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-gray-100 dark:border-gray-800 space-y-1">
                              {task.subtasks.map((sub: any) => (
                                <div key={sub.id} className="flex items-center gap-2 text-xs text-gray-500">
                                  <button onClick={async () => {
                                    await tasksApi.update(sub.id, { status: sub.status === 'done' ? 'todo' : 'done' });
                                    load();
                                  }}>
                                    {sub.status === 'done'
                                      ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                                      : <Circle className="w-3.5 h-3.5 text-gray-300" />
                                    }
                                  </button>
                                  <span className={sub.status === 'done' ? 'line-through' : ''}>{sub.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete */}
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
