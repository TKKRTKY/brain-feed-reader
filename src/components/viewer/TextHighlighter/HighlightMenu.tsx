"use client";

import { useEffect, useRef } from 'react';
import { HighlightMenuProps } from './types';

export default function HighlightMenu({
  highlight,
  summary,
  onShowSummary,
  onDelete
}: HighlightMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuRef.current) return;

    const calcMenuPosition = () => {
      const menu = menuRef.current;
      if (!menu) return;

      const menuHeight = 100;
      const menuWidth = 200;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const rect = menu.parentElement?.getBoundingClientRect();
      
      if (!rect) return;

      // 下に表示するとビューポートからはみ出す場合は上に表示
      if (rect.bottom + menuHeight > viewportHeight) {
        menu.style.bottom = '100%';
        menu.style.top = 'auto';
      } else {
        menu.style.top = '100%';
        menu.style.bottom = 'auto';
      }
      
      // 右に表示するとビューポートからはみ出す場合は左に表示
      if (rect.right + menuWidth > viewportWidth) {
        menu.style.right = '0';
        menu.style.left = 'auto';
      } else {
        menu.style.left = '0';
        menu.style.right = 'auto';
      }
    };

    // メニューの表示位置を最適化
    const observer = new ResizeObserver(calcMenuPosition);
    observer.observe(menuRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="hidden group-hover:block absolute z-50 bg-white rounded-lg shadow-lg border p-1 text-sm min-w-[200px]"
    >
      {highlight.summaryId && summary && (
        <button
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onShowSummary(summary.text);
          }}
        >
          要約を表示
        </button>
      )}
      <button
        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-600"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ハイライトを解除
      </button>
    </div>
  );
}
