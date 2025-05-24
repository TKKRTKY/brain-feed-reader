import { useState } from 'react';
import { BookMetadata, Chapter } from '@/types/epub';
import ReaderLayout from './ReaderLayout';

interface BookViewerProps {
  metadata: BookMetadata;
  chapters: Chapter[];
  content: Record<string, string>;
  onChapterSelect: (href: string) => void;
}

export const BookViewer = ({
  metadata,
  chapters,
  content,
  onChapterSelect,
}: BookViewerProps) => {
  const [currentChapter, setCurrentChapter] = useState(0);

  const handleChapterSelect = (href: string) => {
    const index = chapters.findIndex(chapter => chapter.href === href);
    if (index !== -1) {
      setCurrentChapter(index);
      onChapterSelect(href);
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      const prevChapter = chapters[currentChapter - 1];
      setCurrentChapter(currentChapter - 1);
      onChapterSelect(prevChapter.href);
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      const nextChapter = chapters[currentChapter + 1];
      setCurrentChapter(currentChapter + 1);
      onChapterSelect(nextChapter.href);
    }
  };

  return (
    <ReaderLayout
      metadata={metadata}
      chapters={chapters}
      currentChapter={currentChapter}
      content={content}
      onChapterSelect={handleChapterSelect}
      onPreviousChapter={handlePreviousChapter}
      onNextChapter={handleNextChapter}
    />
  );
};
