import { createContext, useContext, useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // IndexedDBの初期化
  useEffect(() => {
    const request = indexedDB.open('BrainFeedNotes', 1);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('bookId', 'bookId', { unique: false });
        store.createIndex('chapterId', 'chapterId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result);
    };

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // ノートの作成
  const createNote = async (note: Omit<Note, 'id' | 'lastModified'>): Promise<Note> => {
    if (!db) throw new Error('Database not initialized');

    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      lastModified: Date.now(),
    };

    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');

    return new Promise((resolve, reject) => {
      const request = store.add(newNote);
      request.onerror = () => reject(new Error('Failed to create note'));
      request.onsuccess = () => {
        setNotes(prev => [...prev, newNote]);
        resolve(newNote);
      };
    });
  };

  // ノートの更新
  const updateNote = async (id: string, content: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(new Error('Failed to update note'));
      request.onsuccess = () => {
        const note = request.result;
        if (!note) {
          reject(new Error('Note not found'));
          return;
        }

        note.content = content;
        note.lastModified = Date.now();

        const updateRequest = store.put(note);
        updateRequest.onerror = () => reject(new Error('Failed to save note update'));
        updateRequest.onsuccess = () => {
          setNotes(prev => prev.map(n => n.id === id ? note : n));
          if (currentNote?.id === id) {
            setCurrentNote(note);
          }
          resolve();
        };
      };
    });
  };

  // ノートの削除
  const deleteNote = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(new Error('Failed to delete note'));
      request.onsuccess = () => {
        setNotes(prev => prev.filter(note => note.id !== id));
        if (currentNote?.id === id) {
          setCurrentNote(null);
        }
        resolve();
      };
    });
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
    if (!db) return;

    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to load notes');
    };

    request.onsuccess = () => {
      setNotes(request.result);
    };
  }, [db]);

  const value = {
    notes,
    currentNote,
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    exportNote,
    renderMarkdown,
    isReady: db !== null,
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
