// src/store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string; email: string; display_name: string; avatar_url?: string;
  plan: string; theme: string; font_family: string; editor_width: string;
  ai_provider: string; sidebar_collapsed: boolean;
  openai_api_key?: string; anthropic_api_key?: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;

  // Navigation
  activeView: string;
  setActiveView: (view: string) => void;
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
  activeTagId: string | null;
  setActiveTagId: (id: string | null) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  settingsTab: string;
  setSettingsTab: (tab: string) => void;
  aiChatOpen: boolean;
  setAiChatOpen: (v: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;

  // Data refresh triggers
  notesRefresh: number;
  triggerNotesRefresh: () => void;
  tasksRefresh: number;
  triggerTasksRefresh: () => void;
  notebooksRefresh: number;
  triggerNotebooksRefresh: () => void;
  tagsRefresh: number;
  triggerTagsRefresh: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('noteflow_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('noteflow_token');
        set({ user: null, token: null, activeNoteId: null, activeNotebookId: null, activeTagId: null });
      },
      updateUser: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : null })),

      activeView: 'notes',
      setActiveView: (view) => set({ activeView: view, activeNoteId: null }),
      activeNotebookId: null,
      setActiveNotebookId: (id) => set({ activeNotebookId: id, activeTagId: null, activeView: 'notes' }),
      activeTagId: null,
      setActiveTagId: (id) => set({ activeTagId: id, activeNotebookId: null, activeView: 'notes' }),
      activeNoteId: null,
      setActiveNoteId: (id) => set({ activeNoteId: id }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      searchOpen: false,
      setSearchOpen: (v) => set({ searchOpen: v }),
      settingsOpen: false,
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      settingsTab: 'account',
      setSettingsTab: (tab) => set({ settingsTab: tab }),
      aiChatOpen: false,
      setAiChatOpen: (v) => set({ aiChatOpen: v }),
      theme: 'light',
      setTheme: (t) => {
        set({ theme: t });
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },

      notesRefresh: 0,
      triggerNotesRefresh: () => set((s) => ({ notesRefresh: s.notesRefresh + 1 })),
      tasksRefresh: 0,
      triggerTasksRefresh: () => set((s) => ({ tasksRefresh: s.tasksRefresh + 1 })),
      notebooksRefresh: 0,
      triggerNotebooksRefresh: () => set((s) => ({ notebooksRefresh: s.notebooksRefresh + 1 })),
      tagsRefresh: 0,
      triggerTagsRefresh: () => set((s) => ({ tagsRefresh: s.tagsRefresh + 1 })),
    }),
    {
      name: 'noteflow-store',
      partialize: (s) => ({ token: s.token, user: s.user, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
