"use client";

import React, { useState, useEffect } from 'react';
import { BookMetadata, Chapter } from '@/types/epub';
import ContentView from './ContentView';
import SummarySection from '../summary/SummarySection';
import ResizablePane from './ResizablePane';

interface ReaderLayoutProps {
  metadata: BookMetadata;
  chapters: Chapter[];
  currentChapter: number;
  content: Record<string, string>;
  onChapterSelect: (href: string) => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
}

interface LayoutState {
  leftPaneWidth: number;
  rightPaneWidth: number;
}

const DEFAULT_LEFT_WIDTH = 250;
const DEFAULT_RIGHT_WIDTH = 500;
const MIN_LEFT_PANE_WIDTH = 200;
const MAX_LEFT_PANE_WIDTH = 400;
const MIN_RIGHT_PANE_WIDTH = 300;
const MAX_RIGHT_PANE_WIDTH = 800;

const ReaderLayout = ({
  metadata,
  chapters,
  currentChapter,
  content,
  onChapterSelect,
  onPreviousChapter,
  onNextChapter,
}: ReaderLayoutProps) => {
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

  // レイアウトの状態管理
  const [layout, setLayout] = useState<LayoutState>({
    leftPaneWidth: DEFAULT_LEFT_WIDTH,
    rightPaneWidth: DEFAULT_RIGHT_WIDTH,
  });

  const handleLeftPaneResize = (width: number) => {
    setLayout(prev => ({ ...prev, leftPaneWidth: width }));
  };

  const handleRightPaneResize = (width: number) => {
    setLayout(prev => ({ ...prev, rightPaneWidth: width }));
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      <ResizablePane
        position="left"
        minWidth={MIN_LEFT_PANE_WIDTH}
        maxWidth={MAX_LEFT_PANE_WIDTH}
        defaultWidth={DEFAULT_LEFT_WIDTH}
        onResize={handleLeftPaneResize}
        storageKey="reader-left-pane-width"
      >
        <div className="h-full border-r p-4 overflow-y-auto">
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
        </div>
      </ResizablePane>

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-bold mb-6">
            {chapters[currentChapter]?.title}
          </h2>
          {chapters[currentChapter] && (
            <ContentView content={content[chapters[currentChapter].href] || ''} />
          )}
          <div className="flex justify-between items-center py-8 border-t">
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

      <ResizablePane
        position="right"
        minWidth={MIN_RIGHT_PANE_WIDTH}
        maxWidth={MAX_RIGHT_PANE_WIDTH}
        defaultWidth={DEFAULT_RIGHT_WIDTH}
        onResize={handleRightPaneResize}
        storageKey="reader-right-pane-width"
      >
        <div className="h-full border-l p-8 overflow-y-auto">
          <SummarySection
            chapters={chapters}
            currentChapter={currentChapter}
            content={content}
          />
        </div>
      </ResizablePane>
    </div>
  );
};

export default ReaderLayout;
