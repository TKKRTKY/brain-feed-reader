import { RefObject } from 'react';

export interface TextHighlighterProps {
  containerRef: RefObject<HTMLDivElement>;
  pageIndex: number;
}

export interface HighlightMenuProps {
  highlight: {
    id: string;
    summaryId?: string;
  };
  summary?: {
    id: string;
    text: string;
  };
  onShowSummary: (text: string) => void;
  onDelete: () => void;
}

export interface HighlightElementProps {
  highlight: {
    id: string;
    startOffset: number;
    endOffset: number;
    summaryId?: string;
  };
  isSelected: boolean;
  containerRef: RefObject<HTMLDivElement>;
  onSelect: (id: string) => void;
  onShowSummary: (text: string) => void;
  onDelete: () => void;
}

export interface UseHighlightPositionProps {
  containerRef: RefObject<HTMLDivElement>;
  pageIndex: number;
  summaryMode: 'chapter' | 'highlight';
  addHighlight: (highlight: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
  }, pageIndex: number) => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface Selection {
  text: string;
  start: number;
  end: number;
}
