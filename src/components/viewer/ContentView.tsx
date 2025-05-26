"use client";

import React from 'react';
import sanitizeHtml from 'sanitize-html';

interface ContentViewProps {
  content: string;
  className?: string;
}

export default function ContentView({ content, className = '' }: ContentViewProps) {
  return (
    <article className={`prose prose-lg max-w-none mb-8 overflow-x-auto ${className}`}>
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(content, {
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
    </article>
  );
}
