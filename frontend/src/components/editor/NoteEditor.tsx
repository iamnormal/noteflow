// src/components/editor/NoteEditor.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store';
import { notesApi, aiApi, attachmentsApi, tagsApi, notebooksApi } from '../../api/client';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import toast from 'react-hot-toast';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Minus, Pin,
  Tag, BookOpen, Bell, Sparkles, Upload, MoreHorizontal, Clock, Hash,
  Highlighter, Table as TableIcon, CheckSquare, Loader2, ChevronDown,
  RotateCcw, History, FileText, X, Save
} from 'lucide-react';
import { format } from 'date-fns';
import AIEditMenu from '../ai/AIEditMenu';

export default function NoteEditor() {
  const { activeNoteId, triggerNotesRefresh, user } = useAppStore();
  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allNotebooks, setAllNotebooks] = useState<any[]>([]);
  const [noteTags, setNoteTags] = useState<any[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showNotebookPicker, setShowNotebookPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const saveTimerRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing… type / for commands' }),
      Underline, TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList, TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-600 underline' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
    ],
    onUpdate: ({ editor }) => { scheduleSave(editor.getHTML()); },
  });

  // Load note
  useEffect(() => {
    if (!activeNoteId) return;
    notesApi.get(activeNoteId).then(({ data }) => {
      setNote(data.note);
      setTitle(data.note.title || '');
      setNoteTags(data.note.tags || []);
      if (editor && data.note.content !== undefined) {
        editor.commands.setContent(data.note.content || '');
      }
    }).catch(() => toast.error('Failed to load note'));
    tagsApi.list().then(({ data }) => setAllTags(data.tags));
    notebooksApi.list().then(({ data }) => setAllNotebooks(data.notebooks));
  }, [activeNoteId, editor]);

  const scheduleSave = useCallback((content: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!activeNoteId) return;
      setSaving(true);
      try {
        await notesApi.update(activeNoteId, { content, title });
      } finally { setSaving(false); }
    }, 1000);
  }, [activeNoteId, title]);

  const saveTitle = async (newTitle: string) => {
    setTitle(newTitle);
    if (!activeNoteId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      await notesApi.update(activeNoteId, { title: newTitle, content: editor?.getHTML() });
      setSaving(false);
      triggerNotesRefresh();
    }, 800);
  };

  const togglePin = async () => {
    await notesApi.update(activeNoteId!, { pinned: !note.pinned });
    setNote((n: any) => ({ ...n, pinned: !n.pinned }));
    triggerNotesRefresh();
    toast.success(note.pinned ? 'Unpinned' : 'Pinned to top');
  };

  const toggleTag = async (tag: any) => {
    const has = noteTags.some(t => t.id === tag.id);
    const newTags = has ? noteTags.filter(t => t.id !== tag.id) : [...noteTags, tag];
    setNoteTags(newTags);
    await notesApi.update(activeNoteId!, { tag_ids: newTags.map(t => t.id) });
    triggerNotesRefresh();
  };

  const changeNotebook = async (nbId: string) => {
    await notesApi.update(activeNoteId!, { notebook_id: nbId });
    const nb = allNotebooks.find(n => n.id === nbId);
    setNote((n: any) => ({ ...n, notebook_id: nbId, notebook_title: nb?.title }));
    setShowNotebookPicker(false);
    triggerNotesRefresh();
    toast.success('Moved to ' + nb?.title);
  };

  const summarize = async () => {
    setSummarizing(true);
    try {
      const { data } = await aiApi.summarize(activeNoteId!);
      setNote((n: any) => ({ ...n, ai_summary: data.summary }));
      toast.success('Summary generated!');
    } catch (err: any) { toast.error(err.response?.data?.error || 'AI error'); }
    finally { setSummarizing(false); }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fd = new FormData();
    fd.append('note_id', activeNoteId!);
    Array.from(files).forEach(f => fd.append('files', f));
    try {
      const { data } = await attachmentsApi.upload(fd);
      // Insert images inline
      data.attachments.forEach((att: any) => {
        if (att.mime_type?.startsWith('image/')) {
          editor?.chain().focus().setImage({ src: att.url, alt: att.original_name }).run();
        }
      });
      toast.success(`${data.attachments.length} file(s) uploaded`);
    } catch { toast.error('Upload failed'); }
  };

  const loadHistory = async () => {
    const { data } = await notesApi.versions(activeNoteId!);
    setVersions(data.versions);
    setShowHistory(true);
  };

  if (!note) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  );

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 h-12 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Notebook picker */}
        <div className="relative">
          <button onClick={() => setShowNotebookPicker(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span>{allNotebooks.find(n => n.id === note.notebook_id)?.icon || '📓'}</span>
            <span className="max-w-[100px] truncate">{note.notebook_title || 'Inbox'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showNotebookPicker && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1 overflow-hidden">
              {allNotebooks.map(nb => (
                <button key={nb.id} onClick={() => changeNotebook(nb.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                  <span>{nb.icon}</span><span>{nb.title}</span>
                  {nb.id === note.notebook_id && <span className="ml-auto text-brand-500">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Format buttons */}
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Code">
          <Code className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} active={editor?.isActive('highlight')} title="Highlight">
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleTaskList().run()} active={editor?.isActive('taskList')} title="Task List">
          <CheckSquare className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
          <TableIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <label className="btn-ghost px-2 py-1 text-xs cursor-pointer" title="Attach file">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" multiple className="hidden" onChange={uploadFile} />
          </label>
          <ToolbarBtn onClick={togglePin} active={note.pinned} title={note.pinned ? 'Unpin' : 'Pin'}>
            <Pin className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <button onClick={summarize} disabled={summarizing}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-colors">
            {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Summary</span>
          </button>
          <ToolbarBtn onClick={loadHistory} title="Version history">
            <History className="w-3.5 h-3.5" />
          </ToolbarBtn>
          {saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
        </div>
      </div>

      {/* Bubble menu for selected text */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <AIEditMenu editor={editor} />
        </BubbleMenu>
      )}

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto py-8 px-8 ${user?.editor_width === 'narrow' ? 'max-w-2xl' : user?.editor_width === 'wide' ? 'max-w-5xl' : 'max-w-3xl'}`}>
          {/* Title */}
          <input
            value={title}
            onChange={e => saveTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-3xl font-bold text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700 bg-transparent border-none outline-none mb-1 resize-none"
          />

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{format(new Date(note.created_at), 'MMM d, yyyy')} · {wordCount} words</span>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {noteTags.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.color + '20', color: t.color }}>
                  #{t.name}
                  <button onClick={() => toggleTag(t)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button onClick={() => setShowTagPicker(v => !v)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 transition-colors">
                <Hash className="w-3 h-3" /><span>Add tag</span>
              </button>
            </div>

            {/* Tag picker */}
            {showTagPicker && (
              <div className="relative">
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1 max-h-48 overflow-y-auto">
                  {allTags.map(tag => (
                    <button key={tag.id} onClick={() => toggleTag(tag)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                      <span>{tag.name}</span>
                      {noteTags.some(t => t.id === tag.id) && <span className="ml-auto text-brand-500 text-xs">✓</span>}
                    </button>
                  ))}
                  {allTags.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No tags yet</p>}
                </div>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {note.ai_summary && (
            <div className="mb-6 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">AI Summary</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.ai_summary}</p>
            </div>
          )}

          {/* Editor */}
          <EditorContent editor={editor} className="tiptap prose dark:prose-invert max-w-none" />
        </div>
      </div>

      {/* Version history panel */}
      {showHistory && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Version History</h3>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {versions.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No versions yet</p>}
            {versions.map((v, i) => (
              <button key={v.id} onClick={async () => {
                const { data } = await notesApi.getVersion(activeNoteId!, v.id);
                editor?.commands.setContent(data.version.content || '');
                toast.success('Version restored');
                setShowHistory(false);
              }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{i === 0 ? 'Latest' : format(new Date(v.created_at), 'MMM d, h:mm a')}</p>
                <p className="text-xs text-gray-500">{format(new Date(v.created_at), 'MMM d, yyyy · h:mm a')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({ onClick, active, title, children }: { onClick: () => void, active?: boolean, title?: string, children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${active ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'}`}>
      {children}
    </button>
  );
}
