"use client";

import { useEffect } from 'react';
import { NoteEditor } from '@/components/note/NoteEditor';
import { TemplateGenerator } from '@/components/note/TemplateGenerator';
import { useNotes } from '@/contexts/NoteContext';
import { Chapter } from '@/types/epub';

const sampleChapters: Chapter[] = [
  {
    id: "chapter-1",
    href: "#chapter-1",
    title: "第1章 はじめに",
    level: 1,
    children: [
      { id: "chapter-1-1", href: "#chapter-1-1", title: "1.1 背景", level: 2 },
      { id: "chapter-1-2", href: "#chapter-1-2", title: "1.2 目的", level: 2 }
    ]
  },
  {
    id: "chapter-2",
    href: "#chapter-2",
    title: "第2章 本論",
    level: 1,
    children: [
      { id: "chapter-2-1", href: "#chapter-2-1", title: "2.1 方法", level: 2 },
      { id: "chapter-2-2", href: "#chapter-2-2", title: "2.2 結果", level: 2 }
    ]
  }
];

export default function NotePage() {
  const { notes, currentNote, createNote, setCurrentNote } = useNotes();

  useEffect(() => {
    // 初期ノートがない場合は作成
    if (notes.length === 0) {
      createNote({
        title: "サンプルノート",
        content: "# サンプルノート\n\nここにメモを書いていきます。",
        bookId: "sample-book"
      }).then(note => setCurrentNote(note));
    } else if (!currentNote) {
      setCurrentNote(notes[0]);
    }
  }, [notes, currentNote, createNote, setCurrentNote]);

  const handleGenerate = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setCurrentNote(note);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">読書メモ</h1>
        <TemplateGenerator
          chapters={sampleChapters}
          bookId="sample-book"
          onGenerate={handleGenerate}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {currentNote ? (
          <NoteEditor
            noteId={currentNote.id}
            initialContent={currentNote.content}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">
            ノートを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
