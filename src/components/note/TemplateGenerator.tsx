import React, { useState, useCallback } from 'react';
import { useNotes } from '../../contexts/NoteContext';

import { Chapter } from '@/types/epub';
import { useLLM } from '@/contexts/LLMContext';

interface TemplateGeneratorProps {
  chapters: Chapter[];
  bookId: string;
  onGenerate: (noteId: string) => void;
}

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({
  chapters,
  bookId,
  onGenerate,
}) => {
  const { createNote } = useNotes();
  const [isGenerating, setIsGenerating] = useState(false);

  const { generateSummary } = useLLM();

  const generateTemplate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // テンプレートの基本構造を生成
      const content = await generateTemplateContent(chapters);

      // 各チャプターの要約を生成
      const updatedContent = await generateChapterSummaries(content, chapters);

      // ノートを作成
      const note = await createNote({
        title: '読書メモ',
        content: updatedContent,
        bookId,
      });

      onGenerate(note.id);
    } catch (error) {
      console.error('Failed to generate template:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [chapters, bookId, createNote, onGenerate, generateSummary, isGenerating]);

  // チャプターごとの要約を生成
  const generateChapterSummaries = async (content: string, chapters: Chapter[]): Promise<string> => {
    let updatedContent = content;

    const processChapter = async (chapter: Chapter): Promise<void> => {
      try {
        const summary = await generateSummary(chapter.title);
        const summaryPlaceholder = `### ${chapter.title} - 要約\n\n`;
        const newSummary = `### ${chapter.title} - 要約\n\n${summary}\n\n`;
        updatedContent = updatedContent.replace(summaryPlaceholder, newSummary);

        if (chapter.children) {
          for (const child of chapter.children) {
            await processChapter(child);
          }
        }
      } catch (error) {
        console.error(`Failed to generate summary for ${chapter.title}:`, error);
      }
    };

    for (const chapter of chapters) {
      await processChapter(chapter);
    }

    return updatedContent;
  };

  // 目次構造からテンプレートを生成
  const generateTemplateContent = async (chapters: Chapter[]): Promise<string> => {
    let content = '# 読書メモ\n\n## 概要\n\n\n## 重要なポイント\n\n\n## 目次構造\n\n';

    const processChapter = (chapter: Chapter, level: number): string => {
      const indent = '  '.repeat(level);
      let chapterContent = `${indent}- ${chapter.title}\n`;

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
      chapterContent += `### ${chapter.title} - 要約\n\n`;
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
      content += processChapterDetails(chapter, 1);
    });

    content += '\n## 全体を通しての感想\n\n\n';
    content += '## アクションアイテム\n\n\n';
    content += '## 関連する本や記事\n\n\n';

    return content;
  };

  return (
    <button
      onClick={generateTemplate}
      disabled={isGenerating}
      className={`
        px-4 py-2 rounded
        ${isGenerating
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      {isGenerating ? '生成中...' : 'テンプレートを生成'}
    </button>
  );
};
