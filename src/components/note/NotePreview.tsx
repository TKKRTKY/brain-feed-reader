import React, { useEffect, useState } from 'react';
import { useNotes } from '../../contexts/NoteContext';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface NotePreviewProps {
  content: string;
  className?: string;
}

export const NotePreview: React.FC<NotePreviewProps> = ({
  content,
  className = '',
}) => {
  const { renderMarkdown } = useNotes();
  const [html, setHtml] = useState('');
  const [toc, setToc] = useState<TOCItem[]>([]);

  // Markdownをレンダリング
  useEffect(() => {
    const render = async () => {
      try {
        const rendered = await renderMarkdown(content);
        setHtml(rendered);

        // 目次の生成
        const doc = new DOMParser().parseFromString(rendered, 'text/html');
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const tocItems = headings.map(heading => ({
          id: heading.id || generateId(heading.textContent || ''),
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1)),
        }));
        setToc(tocItems);
      } catch (error) {
        console.error('Failed to render markdown:', error);
      }
    };

    render();
  }, [content, renderMarkdown]);

  // IDの生成（スペースをハイフンに変換し、小文字化）
  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // 目次アイテムのクリックをハンドル
  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 目次アイテムのレンダリング
  const renderTocItem = (item: TOCItem) => {
    const indent = `ml-${(item.level - 1) * 4}`;
    return (
      <div
        key={item.id}
        className={`${indent} cursor-pointer hover:text-blue-600 mb-1`}
        onClick={() => handleTocClick(item.id)}
      >
        {item.text}
      </div>
    );
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* 目次 */}
      {toc.length > 0 && (
        <div className="w-64 p-4 border-r overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">目次</h3>
          {toc.map(renderTocItem)}
        </div>
      )}

      {/* プレビュー */}
      <div
        className="flex-1 p-4 overflow-y-auto prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
