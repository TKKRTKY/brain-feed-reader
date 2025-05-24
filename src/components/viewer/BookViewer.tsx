import { BookMetadata, Chapter } from '@/types/epub';

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
    <div className="max-w-4xl mx-auto p-6">
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
  );
};
