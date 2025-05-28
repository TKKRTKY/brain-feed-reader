"use client";

import React, { useEffect, useRef, useState } from 'react';

interface ResizablePaneProps {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  position: 'left' | 'right';
  children: React.ReactNode;
  onResize?: (width: number) => void;
  storageKey: string;
}

export default function ResizablePane({
  minWidth,
  maxWidth,
  defaultWidth,
  position,
  children,
  onResize,
  storageKey,
}: ResizablePaneProps) {
  // 永続化された幅を取得、なければデフォルト値を使用
  const [width, setWidth] = useState(() => {
    const savedWidth = localStorage.getItem(storageKey);
    return savedWidth ? Number(savedWidth) : defaultWidth;
  });
  const [isDragging, setIsDragging] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // ドラッグ開始時の処理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  // ドラッグ中の処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const delta = position === 'left' 
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;
      
      const newWidth = Math.min(
        Math.max(startWidthRef.current + delta, minWidth),
        maxWidth
      );

      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // 幅を永続化
        localStorage.setItem(storageKey, width.toString());
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, width, onResize, position, storageKey]);

  // ダブルクリックでデフォルトサイズに戻す
  const handleDoubleClick = () => {
    setWidth(defaultWidth);
    onResize?.(defaultWidth);
    localStorage.setItem(storageKey, defaultWidth.toString());
  };

  return (
    <div
      ref={paneRef}
      className="relative h-full"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`absolute top-0 ${
          position === 'left' ? 'right-0' : 'left-0'
        } w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
          isDragging ? 'bg-blue-500' : 'bg-gray-200'
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}
