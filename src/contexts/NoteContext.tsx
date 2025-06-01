import { createContext, useContext, useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useStorage } from './StorageContext';
import { DatabaseError } from '../database/utils';

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  chapterId?: string;
  bookId: string;
  templateId?: string;
}

interface NoteContextType {
  notes: Note[];
  currentNote: Note | null;
  createNote: (note: Omit<Note, 'id' | 'lastModified'>) => Promise<Note>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  exportNote: (id: string) => Promise<void>;
  renderMarkdown: (content: string) => Promise<string>;
  isReady: boolean;
  error: Error | null;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { adapter, isInitialized } = useStorage();

  // ノートの作成
  const createNote = async (note: Omit<Note, 'id' | 'lastModified'>): Promise<Note> => {
    if (!adapter) throw new Error('ストレージが初期化されていません');

    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      lastModified: Date.now(),
    };

    try {
      await adapter.create('notes', newNote);
      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new DatabaseError(`ノートの作成に失敗しました: ${message}`);
    }
  };

  // ノートの更新
  const updateNote = async (id: string, content: string): Promise<void> => {
    if (!adapter) throw new Error('ストレージが初期化されていません');

    try {
      const note = await adapter.read<Note>('notes', id);
      const updatedNote = {
        ...note,
        content,
        lastModified: Date.now()
      };

      await adapter.update('notes', id, updatedNote);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      if (currentNote?.id === id) {
        setCurrentNote(updatedNote);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new DatabaseError(`ノートの更新に失敗しました: ${message}`);
    }
  };

  // ノートの削除
  const deleteNote = async (id: string): Promise<void> => {
    if (!adapter) throw new Error('ストレージが初期化されていません');

    try {
      await adapter.delete('notes', id);
      setNotes(prev => prev.filter(note => note.id !== id));
      if (currentNote?.id === id) {
        setCurrentNote(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new DatabaseError(`ノートの削除に失敗しました: ${message}`);
    }
  };

  // Markdownのエクスポート
  const exportNote = async (id: string): Promise<void> => {
    const note = notes.find(n => n.id === id);
    if (!note) throw new Error('Note not found');

    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Markdownのレンダリング
  const renderMarkdown = async (content: string): Promise<string> => {
    const html = await marked(content);
    return DOMPurify.sanitize(html);
  };

  // 初期データの読み込み
  useEffect(() => {
    if (!adapter || !isInitialized) return;

    const loadNotes = async () => {
      try {
        const loadedNotes = await adapter.query<Note>('notes', {});
        setNotes(loadedNotes);
        setError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : '不明なエラー';
        const dbError = new DatabaseError(`ノートの読み込みに失敗しました: ${message}`);
        setError(dbError);
        console.error(dbError);
      }
    };

    loadNotes();
  }, [adapter, isInitialized]);

  const value = {
    notes,
    currentNote,
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    exportNote,
    renderMarkdown,
    isReady: isInitialized && !error,
    error
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
