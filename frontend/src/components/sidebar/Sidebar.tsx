// src/components/sidebar/Sidebar.tsx
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { notebooksApi, tagsApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  BookOpen, Search, Settings, Trash2, FileText, CheckSquare,
  ChevronDown, ChevronRight, Plus, Tag, FolderOpen, Sun, Moon,
  Sparkles, Bot, PanelLeftClose, PanelLeftOpen, Hash
} from 'lucide-react';
import NewNotebookModal from './NewNotebookModal';
import NewTagModal from './NewTagModal';

export default function Sidebar() {
  const {
    user, logout, activeView, setActiveView, activeNotebookId, setActiveNotebookId,
    activeTagId, setActiveTagId, sidebarCollapsed, setSidebarCollapsed,
    setSearchOpen, setSettingsOpen, setAiChatOpen, aiChatOpen,
    theme, setTheme, notebooksRefresh, tagsRefresh, triggerNotebooksRefresh, triggerTagsRefresh
  } = useAppStore();

  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [notebooksOpen, setNotebooksOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);

  useEffect(() => {
    notebooksApi.list().then(({ data }) => setNotebooks(data.notebooks)).catch(() => {});
  }, [notebooksRefresh]);

  useEffect(() => {
    tagsApi.list().then(({ data }) => setTags(data.tags)).catch(() => {});
  }, [tagsRefresh]);

  const navItems = [
    { id: 'notes', label: 'All Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  if (sidebarCollapsed) {
    return (
      <div className="w-14 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center py-3 gap-1">
        <button onClick={() => setSidebarCollapsed(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 mb-2">
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <Search className="w-5 h-5" />
        </button>
        {navItems.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => setActiveView(id)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${activeView === id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Icon className="w-5 h-5" />
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setAiChatOpen(!aiChatOpen)} className={`w-9 h-9 flex items-center justify-center rounded-lg ${aiChatOpen ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <Bot className="w-5 h-5" />
        </button>
        <button onClick={() => setSettingsOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-[240px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">NoteFlow</span>
          </div>
          <button onClick={() => setSidebarCollapsed(true)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-auto text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-1 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveView(id)}
              className={`sidebar-item w-full ${activeView === id && !activeNotebookId && !activeTagId ? 'sidebar-item-active' : ''}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-800" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-2">
          {/* Notebooks */}
          <div>
            <div className="flex items-center justify-between py-1 px-1">
              <button onClick={() => setNotebooksOpen(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {notebooksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Notebooks
              </button>
              <button onClick={() => setShowNewNotebook(true)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {notebooksOpen && notebooks.map(nb => (
              <button key={nb.id} onClick={() => setActiveNotebookId(nb.id)}
                className={`sidebar-item w-full ${activeNotebookId === nb.id ? 'sidebar-item-active' : ''}`}>
                <span className="text-base leading-none">{nb.icon}</span>
                <span className="flex-1 truncate">{nb.title}</span>
                <span className="text-xs text-gray-400 dark:text-gray-600">{nb.note_count}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between py-1 px-1 mt-1">
              <button onClick={() => setTagsOpen(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {tagsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Tags
              </button>
              <button onClick={() => setShowNewTag(true)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {tagsOpen && tags.map(tag => (
              <button key={tag.id} onClick={() => setActiveTagId(tag.id)}
                className={`sidebar-item w-full ${activeTagId === tag.id ? 'sidebar-item-active' : ''}`}>
                <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tag.color }} />
                <span className="flex-1 truncate">{tag.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-600">{tag.note_count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
          <button onClick={() => setAiChatOpen(!aiChatOpen)}
            className={`sidebar-item w-full ${aiChatOpen ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' : ''}`}>
            <Bot className="w-4 h-4" />
            <span>AI Assistant</span>
            {aiChatOpen && <span className="ml-auto w-2 h-2 rounded-full bg-brand-500"></span>}
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="sidebar-item w-full">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={() => setSettingsOpen(true)} className="sidebar-item w-full">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.display_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.display_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showNewNotebook && (
        <NewNotebookModal onClose={() => setShowNewNotebook(false)} onCreated={() => { triggerNotebooksRefresh(); setShowNewNotebook(false); }} />
      )}
      {showNewTag && (
        <NewTagModal onClose={() => setShowNewTag(false)} onCreated={() => { triggerTagsRefresh(); setShowNewTag(false); }} />
      )}
    </>
  );
}
