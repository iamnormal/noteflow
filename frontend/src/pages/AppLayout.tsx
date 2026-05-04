// src/pages/AppLayout.tsx
import { useEffect } from 'react';
import { useAppStore } from '../store';
import Sidebar from '../components/sidebar/Sidebar';
import NotesList from '../components/notes/NotesList';
import NoteEditor from '../components/editor/NoteEditor';
import TasksView from '../components/tasks/TasksView';
import SearchModal from '../components/ui/SearchModal';
import SettingsModal from '../components/settings/SettingsModal';
import AIChatPanel from '../components/ai/AIChatPanel';
import { authApi } from '../api/client';

export default function AppLayout() {
  const { user, updateUser, setTheme, activeView, activeNoteId, searchOpen, settingsOpen, aiChatOpen } = useAppStore();

  useEffect(() => {
    authApi.me().then(({ data }) => {
      updateUser(data.user);
      if (data.user.theme) setTheme(data.user.theme as 'light' | 'dark');
    }).catch(() => {});
  }, []);

  const showEditor = activeView === 'notes';
  const showTasks = activeView === 'tasks';
  const showTrash = activeView === 'trash';
  const showTemplates = activeView === 'templates';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Note list panel */}
      {(showEditor || showTrash) && (
        <div className="w-[300px] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
          <NotesList />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {showEditor && activeNoteId && <NoteEditor key={activeNoteId} />}
        {showEditor && !activeNoteId && <EmptyState />}
        {showTasks && <TasksView />}
        {showTrash && !activeNoteId && <TrashEmpty />}
        {!showEditor && !showTasks && !showTrash && <EmptyState />}

        {/* AI Chat Side Panel */}
        {aiChatOpen && <AIChatPanel />}
      </div>

      {/* Modals */}
      {searchOpen && <SearchModal />}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}

function EmptyState() {
  const { activeView } = useAppStore();
  return (
    <div className="flex-1 flex items-center justify-center text-center p-8">
      <div>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {activeView === 'notes' ? 'Select a note' : 'Welcome to NoteFlow'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeView === 'notes' ? 'Choose a note from the list or create a new one.' : 'Use the sidebar to navigate.'}
        </p>
      </div>
    </div>
  );
}

function TrashEmpty() {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-8">
      <div>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🗑️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Trash</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Deleted notes appear here. Select one to restore or permanently delete it.</p>
      </div>
    </div>
  );
}
