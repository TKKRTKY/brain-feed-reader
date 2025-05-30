import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NoteEditor } from './NoteEditor';
import { useNotes } from '@/contexts/NoteContext';
import { Resizable } from 're-resizable';
import { Chapter } from '@/types/epub';
import { Summary } from '@/contexts/HighlightContext';

interface Position {
  x: number;
  y: number;
}

interface NoteDialogProps {
  bookId: string;
  chapters: Chapter[];
  onClose?: () => void;
  defaultPosition?: Position;
  defaultSize?: { width: number; height: number };
}

export const NoteDialog: React.FC<NoteDialogProps> = ({
  bookId,
  chapters,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 600, height: 400 },
}) => {
  const { notes, createNote, updateNote, setCurrentNote, isReady, renderMarkdown } = useNotes();
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const dragStartPos = useRef<Position | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const generateTemplateContent = async (chapters: Chapter[]): Promise<string> => {
    let content = '# 読書メモ\n\n## 概要\n\n\n## 重要なポイント\n\n\n## 目次構造\n\n';

    const processChapter = (chapter: Chapter, level: number): string => {
      const indent = '  '.repeat(level);
      // ネストレベルに応じたマークダウンのインデント
      let chapterContent = `${'  '.repeat(level)}* ${chapter.title}\n`;

      if (chapter.children && chapter.children.length > 0) {
        chapter.children.forEach(child => {
          chapterContent += processChapter(child, level + 1);
        });
      }

      return chapterContent;
    };

    // 目次をテンプレートに追加
    chapters.forEach(chapter => {
      content += processChapter(chapter, 0);
    });

    content += '\n## チャプターごとのメモ\n\n';

    const processChapterDetails = (chapter: Chapter, level: number): string => {
      const heading = '#'.repeat(level + 2); // 基本レベルは2から開始
      let chapterContent = `${heading} ${chapter.title}\n\n`;

      // 要約セクションをチャプタータイトルの直下に配置し、プレースホルダーを追加
      chapterContent += `> このチャプターの要約:\n> \n\n`;

      chapterContent += '### 重要な引用\n\n\n';
      chapterContent += '### メモ\n\n\n';

      if (chapter.children && chapter.children.length > 0) {
        chapter.children.forEach(child => {
          chapterContent += processChapterDetails(child, level + 1);
        });
      }

      return chapterContent;
    };

    chapters.forEach(chapter => {
      content += processChapterDetails(chapter, 0);
    });

    content += '\n## 全体を通しての感想\n\n\n';
    content += '## アクションアイテム\n\n\n';
    content += '## 関連する本や記事\n\n\n';

    return content;
  };

  // 初期ノートの作成または既存ノートの読み込み
  useEffect(() => {
    const loadNote = async () => {
      const existingNote = notes.find(note => note.bookId === bookId);
      if (existingNote) {
        setCurrentNoteId(existingNote.id);
        setCurrentNote(existingNote);
      } else {
        try {
          // テンプレートの基本構造を生成
          const content = await generateTemplateContent(chapters);
          
          const newNote = await createNote({
            title: "読書メモ",
            content,
            bookId
          });
          setCurrentNoteId(newNote.id);
          setCurrentNote(newNote);
        } catch (error) {
          console.error('Failed to create note:', error);
        }
      }
    };

    // LoadNoteと要約イベント監視の設定
    if (isReady) {
      loadNote();
    }
  }, [bookId, chapters, notes, createNote, setCurrentNote, isReady]);

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <p className="text-gray-700">読書メモを準備中...</p>
        </div>
      </div>
    );
  }

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  // ドラッグ中
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartPos.current) return;

    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;

    // 画面外に出ないように制限
    const maxX = window.innerWidth - (dialogRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (dialogRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging]);

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartPos.current = null;
  }, []);

  // マウスイベントの設定
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!currentNoteId) return null;

  return (
    <Resizable
      defaultSize={defaultSize}
      minWidth={400}
      minHeight={300}
      className="fixed bg-white rounded-lg shadow-xl border"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      enable={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
    >
      <div
        ref={dialogRef}
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {/* ヘッダー部分 */}
        <div
          className="p-2 border-b bg-gray-100 flex items-center cursor-move select-none"
          onMouseDown={handleMouseDown}
          onWheel={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold flex-grow">読書メモ</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded no-drag"
          >
            ✕
          </button>
        </div>

        {/* エディタ部分 */}
        <div 
          className="flex-1 overflow-auto"
          onWheel={e => e.stopPropagation()}
        >
          <NoteEditor
            noteId={currentNoteId}
            initialContent={notes.find(n => n.id === currentNoteId)?.content || ''}
            chapters={chapters}
            className="no-drag"
          />
        </div>
      </div>
    </Resizable>
  );
};
