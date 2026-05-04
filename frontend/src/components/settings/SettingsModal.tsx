// src/components/settings/SettingsModal.tsx
import { useState } from 'react';
import { useAppStore } from '../../store';
import { authApi } from '../../api/client';
import toast from 'react-hot-toast';
import {
  X, User, Palette, Bot, Lock, Bell, BookOpen,
  Save, Eye, EyeOff, Sun, Moon, Monitor, Check
} from 'lucide-react';
import TagsManager from './TagsManager';
import NotebooksManager from './NotebooksManager';
import TemplatesManager from './TemplatesManager';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'ai', label: 'AI & API Keys', icon: Bot },
  { id: 'notebooks', label: 'Notebooks', icon: BookOpen },
  { id: 'tags', label: 'Tags', icon: Bell },
  { id: 'templates', label: 'Templates', icon: BookOpen },
  { id: 'security', label: 'Security', icon: Lock },
];

export default function SettingsModal() {
  const { setSettingsOpen, settingsTab, setSettingsTab, user, updateUser, theme, setTheme } = useAppStore();
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
      <div className="relative w-full max-w-3xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex overflow-hidden animate-scale-in">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 p-3 flex flex-col">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 px-3 py-2 mb-1">Settings</h2>
          <nav className="space-y-0.5 flex-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setSettingsTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${settingsTab === id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </nav>
          <button onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 mt-2">
            <X className="w-4 h-4" /> Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {settingsTab === 'account' && <AccountTab />}
          {settingsTab === 'appearance' && <AppearanceTab />}
          {settingsTab === 'ai' && <AITab />}
          {settingsTab === 'notebooks' && <NotebooksManager />}
          {settingsTab === 'tags' && <TagsManager />}
          {settingsTab === 'templates' && <TemplatesManager />}
          {settingsTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, children }: any) {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{title}</h3>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

function AccountTab() {
  const { user, updateUser } = useAppStore();
  const [name, setName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateMe({ display_name: name });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SettingsSection title="Profile" description="Your public display information">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.display_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user?.display_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full">{user?.plan} plan</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
          </div>
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}

function AppearanceTab() {
  const { user, updateUser, theme, setTheme } = useAppStore();
  const [font, setFont] = useState(user?.font_family || 'Plus Jakarta Sans');
  const [width, setWidth] = useState(user?.editor_width || 'medium');
  const [saving, setSaving] = useState(false);

  const FONTS = ['Plus Jakarta Sans', 'Georgia', 'Merriweather', 'Lato', 'Nunito', 'Roboto Slab', 'Source Serif 4'];
  const WIDTHS = [{ v: 'narrow', l: 'Narrow', sub: '640px' }, { v: 'medium', l: 'Medium', sub: '768px' }, { v: 'wide', l: 'Wide', sub: '1024px' }];

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateMe({ font_family: font, editor_width: width, theme });
      updateUser(data.user);
      toast.success('Appearance saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SettingsSection title="Theme" description="Choose your preferred color scheme">
        <div className="grid grid-cols-3 gap-3">
          {[{ v: 'light', l: 'Light', icon: Sun }, { v: 'dark', l: 'Dark', icon: Moon }].map(({ v, l, icon: Icon }) => (
            <button key={v} onClick={() => { setTheme(v as any); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === v ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <Icon className={`w-5 h-5 ${theme === v ? 'text-brand-600' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${theme === v ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'}`}>{l}</span>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Editor Font" description="Font used in the note editor">
        <div className="space-y-2">
          {FONTS.map(f => (
            <button key={f} onClick={() => setFont(f)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${font === f ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <span className="text-sm" style={{ fontFamily: f }}>{f}</span>
              {font === f && <Check className="w-4 h-4 text-brand-500" />}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Editor Width" description="Width of the note editor content area">
        <div className="flex gap-3">
          {WIDTHS.map(({ v, l, sub }) => (
            <button key={v} onClick={() => setWidth(v)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${width === v ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <span className={`text-sm font-medium ${width === v ? 'text-brand-700 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>{l}</span>
              <span className="text-xs text-gray-400">{sub}</span>
            </button>
          ))}
        </div>
      </SettingsSection>

      <div className="p-6">
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Appearance'}
        </button>
      </div>
    </div>
  );
}

function AITab() {
  const { user, updateUser } = useAppStore();
  const [openaiKey, setOpenaiKey] = useState(user?.openai_api_key ? '••••••••••••' : '');
  const [claudeKey, setClaudeKey] = useState(user?.anthropic_api_key ? '••••••••••••' : '');
  const [provider, setProvider] = useState(user?.ai_provider || 'openai');
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showClaude, setShowClaude] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updates: any = { ai_provider: provider };
    if (!openaiKey.includes('•')) updates.openai_api_key = openaiKey;
    if (!claudeKey.includes('•')) updates.anthropic_api_key = claudeKey;
    try {
      const { data } = await authApi.updateMe(updates);
      updateUser(data.user);
      toast.success('AI settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SettingsSection title="AI Provider" description="Choose which AI service to use for all AI features">
        <div className="space-y-2">
          {[{ v: 'openai', l: 'OpenAI (GPT-4o mini)', desc: 'Fast and capable, great for most tasks' },
            { v: 'anthropic', l: 'Anthropic Claude', desc: 'Excellent for long-form writing and analysis' }].map(opt => (
            <button key={opt.v} onClick={() => setProvider(opt.v)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${provider === opt.v ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${provider === opt.v ? 'border-brand-500 bg-brand-500' : 'border-gray-400'}`}>
                {provider === opt.v && <div className="w-full h-full rounded-full bg-white scale-50 block" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.l}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="OpenAI API Key" description="Required for AI features when using OpenAI provider">
        <div className="relative">
          <input
            type={showOpenAI ? 'text' : 'password'}
            className="input pr-10"
            placeholder="sk-proj-..."
            value={openaiKey}
            onFocus={() => { if (openaiKey.includes('•')) setOpenaiKey(''); }}
            onChange={e => setOpenaiKey(e.target.value)}
          />
          <button type="button" onClick={() => setShowOpenAI(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Get your key at <span className="text-brand-500">platform.openai.com</span></p>
      </SettingsSection>

      <SettingsSection title="Anthropic API Key" description="Required for AI features when using Claude provider">
        <div className="relative">
          <input
            type={showClaude ? 'text' : 'password'}
            className="input pr-10"
            placeholder="sk-ant-..."
            value={claudeKey}
            onFocus={() => { if (claudeKey.includes('•')) setClaudeKey(''); }}
            onChange={e => setClaudeKey(e.target.value)}
          />
          <button type="button" onClick={() => setShowClaude(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showClaude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Get your key at <span className="text-brand-500">console.anthropic.com</span></p>
      </SettingsSection>

      <div className="p-6">
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save AI Settings'}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) { toast.error('Passwords do not match'); return; }
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: newPwd });
      toast.success('Password changed!');
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <SettingsSection title="Change Password" description="Update your account password">
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
            <input type="password" className="input" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New Password</label>
            <input type="password" className="input" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm New Password</label>
            <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Lock className="w-4 h-4" />{saving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </SettingsSection>
    </div>
  );
}
