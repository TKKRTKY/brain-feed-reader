"use client";

import React, { useEffect, useState } from 'react';
import { HighlightElementProps } from './types';
import { useHighlightStyle } from './hooks/useHighlightStyle';
import HighlightMenu from './HighlightMenu';

export default function HighlightElement({
  highlight,
  isSelected,
  containerRef,
  onSelect,
  onShowSummary,
  onDelete,
}: HighlightElementProps) {
  const { className, hasBottomBorder } = useHighlightStyle({
    isSelected,
    hasSummary: !!highlight.summaryId
  });
  const [rects, setRects] = useState<DOMRect[]>([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updatePosition = () => {
      const content = containerRef.current!.querySelector('[data-content="true"]')!;
      const range = document.createRange();
      const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentOffset = 0;
      let startContainer: Node | null = null;
      let endContainer: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent?.length || 0;

        if (currentOffset + nodeLength > highlight.startOffset && !startContainer) {
          startContainer = node;
          startOffset = highlight.startOffset - currentOffset;
        }

        if (currentOffset + nodeLength >= highlight.endOffset && !endContainer) {
          endContainer = node;
          endOffset = highlight.endOffset - currentOffset;
          break;
        }

        currentOffset += nodeLength;
      }

      if (startContainer && endContainer) {
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer, endOffset);
        setRects(Array.from(range.getClientRects()));
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [highlight, containerRef]);

  return (
    <>
      {rects.map((rect, index) => {
        const containerRect = containerRef.current!.querySelector('[data-content="true"]')!.getBoundingClientRect();
        return (
          <div
            key={`${highlight.id}-${index}`}
            className={className}
            style={{
              top: `${rect.top - containerRect.top}px`,
              left: `${rect.left - containerRect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              pointerEvents: 'auto',
              cursor: 'pointer',
              borderBottom: hasBottomBorder ? '2px solid #60A5FA' : undefined,
            }}
            onClick={(e) => {
              if (e.altKey && isSelected) {
                onDelete();
              } else {
                onSelect(highlight.id);
              }
            }}
          >
            <HighlightMenu
              highlight={highlight}
              onShowSummary={onShowSummary}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </>
  );
}
