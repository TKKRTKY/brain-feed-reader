import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { BookMetadata, Chapter } from '@/types/epub';

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
          <article className="prose prose-lg max-w-none mb-8 overflow-x-auto">
            {chapters[currentChapter] && (
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(content[chapters[currentChapter].href] || '', {
                    allowedTags: [
                      ...sanitizeHtml.defaults.allowedTags,
                      'img',
                      'link',
                      'meta',
                    ],
                    allowedAttributes: {
                      ...sanitizeHtml.defaults.allowedAttributes,
                      img: ['src', 'alt', 'title', 'style'],
                      '*': ['style', 'class'],
                    },
                    allowedStyles: {
                      '*': {
                        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
                        'text-align': [/^left$/, /^right$/, /^center$/],
                        'font-size': [/^\d+(?:px|em|rem|%)$/],
                        'margin': [/^[\d\s]+(?:px|em|rem|%)$/],
                        'padding': [/^[\d\s]+(?:px|em|rem|%)$/],
                      },
                    },
                  }),
                }}
                className="epub-content"
              />
            )}
          </article>
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
