"use client";

import React, { useState } from 'react';
import { useHighlight } from '@/contexts/HighlightContext';
import { useLLM } from '@/contexts/LLMContext';
import CustomDialog from '@/components/dialog/CustomDialog';
import { TextHighlighterProps } from './types';
import { useHighlightPosition } from './hooks/useHighlightPosition';
import HighlightElement from './HighlightElement';

function HighlightToolbar({ 
  position, 
  onHighlight, 
  onCancel 
}: {
  position: { x: number; y: number } | null;
  onHighlight: () => void;
  onCancel: () => void;
}) {
  if (!position) return null;

  // ウィンドウの寸法を取得
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  // ツールバーの寸法を計算
  const toolbarHeight = 50;
  const toolbarWidth = 200;
  
  // 位置を調整
  let adjustedY = position.y - 40;
  let adjustedX = position.x;
  
  // 上端のチェック
  if (adjustedY < 10) {
    adjustedY = position.y + 20;
  }
  
  // 下端のチェック
  if (adjustedY + toolbarHeight > windowHeight) {
    adjustedY = windowHeight - toolbarHeight - 10;
  }
  
  // 左端のチェック
  if (adjustedX - toolbarWidth/2 < 10) {
    adjustedX = toolbarWidth/2 + 10;
  }
  
  // 右端のチェック
  if (adjustedX + toolbarWidth/2 > windowWidth) {
    adjustedX = windowWidth - toolbarWidth/2 - 10;
  }

  return (
    <div
      className="fixed z-50 bg-white shadow-lg rounded-lg p-2 flex gap-2"
      style={{
        top: `${adjustedY}px`,
        left: `${adjustedX}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onClick={onHighlight}
        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
      >
        ハイライト
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
      >
        キャンセル
      </button>
    </div>
  );
}

export default function TextHighlighter({ containerRef, pageIndex }: TextHighlighterProps) {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    content: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    content: '',
  });

  const { config: { summaryMode } } = useLLM();
  const { 
    getHighlightsByPage,
    getSummariesByPage,
    addHighlight,
    removeHighlight,
    selectedHighlightId,
    setSelectedHighlightId
  } = useHighlight();

  const summaries = getSummariesByPage(pageIndex);
  const highlights = getHighlightsByPage(pageIndex);

  const {
    toolbarPosition,
    currentSelection,
    clearSelection
  } = useHighlightPosition({
    containerRef,
    pageIndex,
    summaryMode,
    addHighlight,
  });

  const handleHighlight = () => {
    if (!currentSelection) return;

    addHighlight({
      startOffset: currentSelection.start,
      endOffset: currentSelection.end,
      selectedText: currentSelection.text,
    }, pageIndex);

    clearSelection();
  };

  return (
    <>
      <CustomDialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        content={dialog.content}
        type={dialog.type}
      />
      <div
        className="highlight-overlay"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      >
        {highlights.map(highlight => (
          <HighlightElement
            key={highlight.id}
            highlight={highlight}
            isSelected={selectedHighlightId === highlight.id}
            containerRef={containerRef}
            onSelect={setSelectedHighlightId}
            onShowSummary={(text) => {
              setDialog({
                isOpen: true,
                type: 'alert',
                title: '要約',
                content: text,
              });
            }}
            onDelete={() => {
              setDialog({
                isOpen: true,
                type: 'confirm',
                title: 'ハイライトの削除',
                content: 'このハイライトを削除しますか？',
                onConfirm: () => {
                  setSelectedHighlightId(null);
                  window.getSelection()?.removeAllRanges();
                  removeHighlight(highlight.id);
                },
              });
            }}
          />
        ))}
      </div>
      {summaryMode === 'chapter' && (
        <HighlightToolbar
          position={toolbarPosition}
          onHighlight={handleHighlight}
          onCancel={clearSelection}
        />
      )}
    </>
  );
}
