"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useHighlight } from '@/contexts/HighlightContext';
import { useLLM } from '@/contexts/LLMContext';
import CustomDialog from '../dialog/CustomDialog';

interface TextHighlighterProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageIndex: number;
}

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
  
  // ツールバーの寸法を計算（おおよその値）
  const toolbarHeight = 50;
  const toolbarWidth = 200;
  
  // 位置を調整
  let adjustedY = position.y - 40;
  let adjustedX = position.x;
  
  // 上端のチェック
  if (adjustedY < 10) {
    adjustedY = position.y + 20; // 選択範囲の下に表示
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setToolbarPosition(null);
        setCurrentSelection(null);
        return;
      }

      const content = containerRef.current.querySelector('[data-content="true"]');
      if (!content) return;

      // コンテンツ内の選択かチェック
      const isNodeInContent = (node: Node | null): boolean => {
        while (node) {
          if (node === content) return true;
          node = node.parentNode;
        }
        return false;
      };

      const isValidSelection = isNodeInContent(selection.anchorNode) && isNodeInContent(selection.focusNode);
      if (!isValidSelection) {
        setToolbarPosition(null);
        setCurrentSelection(null);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setToolbarPosition(null);
        setCurrentSelection(null);
        return;
      }

      const range = selection.getRangeAt(0);

      // オフセットを計算
      let offset = 0;
      let startOffset = -1;
      let endOffset = -1;

      const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_TEXT,
        null
      );

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent?.length || 0;

        if (node === range.startContainer) {
          startOffset = offset + range.startOffset;
        }

        if (node === range.endContainer) {
          endOffset = offset + range.endOffset;
          break;
        }

        offset += nodeLength;
      }

      if (startOffset >= 0 && endOffset >= 0) {
        if (summaryMode === 'highlight') {
          // ハイライトモードの場合は直接ハイライトを作成
          addHighlight({
            startOffset,
            endOffset,
            selectedText,
          }, pageIndex);
          selection.removeAllRanges();
          setToolbarPosition(null);
          setCurrentSelection(null);
        } else {
          // 通常モードの場合はツールバーを表示
          const rect = range.getBoundingClientRect();
          setToolbarPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top + window.scrollY
          });
          setCurrentSelection({
            text: selectedText,
            start: startOffset,
            end: endOffset
          });
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [containerRef, summaryMode, addHighlight, pageIndex]);

  useEffect(() => {
    if (!containerRef.current || !overlayRef.current) return;

    const updateHighlightPositions = () => {
      const existingHighlights = overlayRef.current!.querySelectorAll('[data-highlight-id]');
      existingHighlights.forEach(el => el.remove());

      highlights.forEach(highlight => {
        const range = document.createRange();
        const walker = document.createTreeWalker(
          containerRef.current!.querySelector('[data-content="true"]')!,
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
          const rects = range.getClientRects();
          const containerRect = containerRef.current!.querySelector('[data-content="true"]')!.getBoundingClientRect();

          Array.from(rects).forEach((rect) => {
            const highlightElement = document.createElement('div');
            const menu = document.createElement('div');
            menu.className = 'hidden group-hover:block absolute z-50 bg-white rounded-lg shadow-lg border p-1 text-sm min-w-[200px]';
            
            const calcMenuPosition = () => {
              const menuHeight = 100;
              const menuWidth = 200;
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              const rect = highlightElement.getBoundingClientRect();
              
              if (rect.bottom + menuHeight > viewportHeight) {
                menu.style.bottom = '100%';
                menu.style.top = 'auto';
              } else {
                menu.style.top = '100%';
                menu.style.bottom = 'auto';
              }
              
              if (rect.right + menuWidth > viewportWidth) {
                menu.style.right = '0';
                menu.style.left = 'auto';
              } else {
                menu.style.left = '0';
                menu.style.right = 'auto';
              }
            };
            
            highlightElement.addEventListener('mouseenter', calcMenuPosition);

            if (highlight.summaryId) {
              const summary = summaries.find(s => s.id === highlight.summaryId);
              if (summary) {
                const viewSummaryBtn = document.createElement('button');
                viewSummaryBtn.className = 'w-full text-left px-3 py-2 hover:bg-gray-100 rounded';
                viewSummaryBtn.textContent = '要約を表示';
                viewSummaryBtn.onclick = (e) => {
                  e.stopPropagation();
                  setDialog({
                    isOpen: true,
                    type: 'alert',
                    title: '要約',
                    content: summary.text,
                  });
                };
                menu.appendChild(viewSummaryBtn);
              }
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-600';
            removeBtn.textContent = 'ハイライトを解除';
            removeBtn.onclick = (e) => {
              e.stopPropagation();
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
            };
            menu.appendChild(removeBtn);

            highlightElement.className = `absolute group ${
              selectedHighlightId === highlight.id 
                ? highlight.summaryId
                  ? 'bg-green-300/50 ring-2 ring-green-400'
                  : 'bg-yellow-300/50 ring-2 ring-yellow-400'
                : highlight.summaryId 
                  ? 'bg-green-200/50 hover:bg-green-300/50' 
                  : 'bg-yellow-100/50 hover:bg-yellow-200/50'
            }`;
            
            if (highlight.summaryId) {
              highlightElement.style.borderBottom = '2px solid #60A5FA';
            }

            highlightElement.appendChild(menu);
            highlightElement.setAttribute('data-highlight-id', highlight.id);
            highlightElement.style.position = 'absolute';
            highlightElement.style.top = `${rect.top - containerRect.top}px`;
            highlightElement.style.left = `${rect.left - containerRect.left}px`;
            highlightElement.style.width = `${rect.width}px`;
            highlightElement.style.height = `${rect.height}px`;
            highlightElement.style.pointerEvents = 'auto';
            highlightElement.style.cursor = 'pointer';

            highlightElement.onclick = (e) => {
              if (selectedHighlightId === highlight.id && e.altKey) {
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
                return;
              }
              setSelectedHighlightId(highlight.id);
            };

            overlayRef.current!.appendChild(highlightElement);
          });
        }
      });
    };

    updateHighlightPositions();
    window.addEventListener('resize', updateHighlightPositions);
    return () => window.removeEventListener('resize', updateHighlightPositions);
  }, [highlights, containerRef, selectedHighlightId, removeHighlight]);

  const handleHighlight = () => {
    if (!currentSelection) return;

    addHighlight({
      startOffset: currentSelection.start,
      endOffset: currentSelection.end,
      selectedText: currentSelection.text,
    }, pageIndex);

    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
    setCurrentSelection(null);
  };

  const handleCancel = () => {
    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
    setCurrentSelection(null);
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
        ref={overlayRef}
        className="highlight-overlay"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      />
      {summaryMode === 'chapter' && (
        <HighlightToolbar
          position={toolbarPosition}
          onHighlight={handleHighlight}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
