import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { notesApi } from '@/api/notes';
import toast from 'react-hot-toast';
import { getApiError } from '@/utils/errorHandler';
import type { Note } from '@/types';

const STORY_MARKER = '<!-- story -->';

export default function ChapterStoryPage() {
  const { worldId, entityId } = useParams<{ worldId: string; entityId: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyNoteId = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const { data: entity } = useQuery({
    queryKey: ['entities', worldId, entityId],
    queryFn: () => entitiesApi.get(worldId!, entityId!),
    enabled: !!worldId && !!entityId,
  });

  const { data: notes = [], isSuccess: notesLoaded } = useQuery({
    queryKey: ['notes', worldId, entityId],
    queryFn: () => notesApi.list(worldId!, entityId!),
    enabled: !!worldId && !!entityId,
  });

  useEffect(() => {
    if (entity && entity.entity_type !== 'chapter') {
      navigate(`/worlds/${worldId}/entities/${entityId}`, { replace: true });
    }
  }, [entity, worldId, entityId, navigate]);

  useEffect(() => {
    if (initialized || !notesLoaded || !editorRef.current) return;
    const storyNote = (notes as Note[]).find((n) => n.content.startsWith(STORY_MARKER));
    if (storyNote) {
      storyNoteId.current = storyNote.id;
      editorRef.current.innerHTML = storyNote.content.slice(STORY_MARKER.length);
    }
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setInitialized(true);
  }, [initialized, notesLoaded, notes]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const saveNote = useMutation({
    mutationFn: async (html: string) => {
      const content = STORY_MARKER + html;
      if (storyNoteId.current) {
        return notesApi.update(worldId!, entityId!, storyNoteId.current, { content, is_private: false });
      }
      const note = await notesApi.create(worldId!, entityId!, { content, is_private: false });
      storyNoteId.current = note.id;
      return note;
    },
    onSuccess: () => setSaveStatus('saved'),
    onError: (err) => { toast.error(getApiError(err)); setSaveStatus('idle'); },
  });

  const updateCounts = () => {
    const text = editorRef.current?.innerText || '';
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const scheduleAutoSave = () => {
    updateCounts();
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (editorRef.current) saveNote.mutate(editorRef.current.innerHTML);
    }, 1500);
  };

  const exec = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
    scheduleAutoSave();
  };

  if (!entity) {
    return <div className="animate-pulse bg-slate-200 h-64 rounded-xl m-8" />;
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1 flex-wrap shadow-sm">
        <Link
          to={`/worlds/${worldId}/entities/${entityId}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mr-3 pr-3 border-r border-slate-200"
        >
          <ArrowLeft size={14} />
          <span className="max-w-[180px] truncate">{entity.name}</span>
        </Link>

        <button
          onMouseDown={(e) => exec(e, 'bold')}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
          title="Жирний"
        >
          <Bold size={15} />
        </button>
        <button
          onMouseDown={(e) => exec(e, 'italic')}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
          title="Курсив"
        >
          <Italic size={15} />
        </button>
        <button
          onMouseDown={(e) => exec(e, 'underline')}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
          title="Підкреслення"
        >
          <Underline size={15} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <select
          onChange={(e) => {
            document.execCommand('formatBlock', false, e.target.value);
            scheduleAutoSave();
          }}
          className="text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:outline-none bg-white"
          defaultValue="p"
          title="Формат тексту"
        >
          <option value="p">Звичайний</option>
          <option value="h1">Заголовок 1</option>
          <option value="h2">Заголовок 2</option>
          <option value="h3">Заголовок 3</option>
          <option value="blockquote">Цитата</option>
        </select>

        <select
          onChange={(e) => {
            document.execCommand('fontSize', false, e.target.value);
            scheduleAutoSave();
          }}
          className="text-xs border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:outline-none bg-white"
          defaultValue="3"
          title="Розмір шрифту"
        >
          <option value="2">Малий</option>
          <option value="3">Звичайний</option>
          <option value="4">Великий</option>
          <option value="5">Дуже великий</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          onMouseDown={(e) => exec(e, 'insertUnorderedList')}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
          title="Список"
        >
          <List size={15} />
        </button>
        <button
          onMouseDown={(e) => exec(e, 'insertOrderedList')}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
          title="Нумерований список"
        >
          <ListOrdered size={15} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer" title="Колір тексту">
          A
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => {
              document.execCommand('foreColor', false, e.target.value);
              scheduleAutoSave();
            }}
            className="w-5 h-5 rounded cursor-pointer border border-slate-200 p-0 bg-transparent"
          />
        </label>

        <span className="ml-auto text-xs">
          {saveStatus === 'saving' && <span className="text-amber-500">Зберігається...</span>}
          {saveStatus === 'saved' && <span className="text-emerald-600">Збережено ✓</span>}
        </span>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex justify-center bg-slate-100 py-8 px-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleAutoSave}
          className="w-full max-w-3xl bg-white rounded-lg focus:outline-none font-serif text-base text-slate-800"
          style={{
            minHeight: 'calc(100vh - 16rem)',
            lineHeight: '1.8',
            padding: '3rem 4rem',
            boxShadow: '0 2px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100 px-6 py-2 flex gap-4 text-xs text-slate-400">
        <span>{wordCount} слів</span>
        <span>{charCount} символів</span>
      </div>
    </div>
  );
}
