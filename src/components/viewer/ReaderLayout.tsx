import React from 'react';
import { BookMetadata, Chapter } from '@/types/epub';
import ContentView from './ContentView';
import SummarySection from '../summary/SummarySection';

interface ReaderLayoutProps {
  metadata: BookMetadata;
  chapters: Chapter[];
  currentChapter: number;
  content: Record<string, string>;
  onChapterSelect: (href: string) => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
}

const ReaderLayout: React.FC<ReaderLayoutProps> = ({
  metadata,
  chapters,
  currentChapter,
  content,
  onChapterSelect,
  onPreviousChapter,
  onNextChapter,
}) => {
  const renderChapters = (items: Chapter[], level = 0) => {
    return (
      <ul className={`pl-${level * 4} list-none`}>
        {items.map((chapter) => (
          <li key={chapter.href} className="my-2">
            <button
              onClick={() => onChapterSelect(chapter.href)}
              className="text-left hover:text-blue-600 transition-colors"
            >
              {chapter.title}
            </button>
            {chapter.children && renderChapters(chapter.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-[300px] border-r p-4 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{metadata.title}</h1>
          {metadata.creator && (
            <p className="text-gray-600 mb-2">著者: {metadata.creator}</p>
          )}
          {metadata.publisher && (
            <p className="text-gray-600 mb-2">出版社: {metadata.publisher}</p>
          )}
        </div>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">目次</h2>
          {renderChapters(chapters)}
        </div>
      </aside>
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            {chapters[currentChapter]?.title}
          </h2>
          {chapters[currentChapter] && (
            <>
              <ContentView content={content[chapters[currentChapter].href] || ''} />
              <SummarySection
                chapters={chapters}
                currentChapter={currentChapter}
                content={content}
              />
            </>
          )}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={onPreviousChapter}
              disabled={currentChapter === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前の章
            </button>
            <span>
              {currentChapter + 1} / {chapters.length}
            </span>
            <button
              onClick={onNextChapter}
              disabled={currentChapter === chapters.length - 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次の章
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReaderLayout;
