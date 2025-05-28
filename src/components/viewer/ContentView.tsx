"use client";

import React, { useRef } from 'react';
import sanitizeHtml from 'sanitize-html';
import TextHighlighter from './TextHighlighter';

interface ContentViewProps {
  content: string;
  className?: string;
  pageIndex: number;
}

export default function ContentView({ content, className = '', pageIndex }: ContentViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // HTMLをサニタイズ
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'img', 'a', 'strong', 'em', 'blockquote', 'code', 'pre'],
    allowedAttributes: {
      '*': ['style', 'class', 'id', 'data-content'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'title']
    }
  });

  return (
    <article className={`prose prose-lg max-w-none mb-8 overflow-x-auto ${className}`}>
      <div className="relative">
        <div 
          ref={containerRef} 
          className="content-container"
          style={{ position: 'relative' }}
        >
          <div 
            data-content="true"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          <TextHighlighter containerRef={containerRef} pageIndex={pageIndex} />
        </div>
      </div>
    </article>
  );
}
