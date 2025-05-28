import { useState, useEffect } from 'react';
import { UseHighlightPositionProps, Position, Selection } from '../types';

export function useHighlightPosition({
  containerRef,
  pageIndex,
  summaryMode,
  addHighlight,
}: UseHighlightPositionProps) {
  const [toolbarPosition, setToolbarPosition] = useState<Position | null>(null);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(null);

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

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
    setCurrentSelection(null);
  };

  return {
    toolbarPosition,
    currentSelection,
    clearSelection,
  };
}
