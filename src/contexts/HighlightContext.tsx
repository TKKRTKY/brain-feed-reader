"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Highlight {
  id: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  timestamp: number;
  summaryId?: string;
  pageIndex: number;
}

export interface Summary {
  id: string;
  text: string;
  highlightIds: string[];
  timestamp: number;
  pageIndex: number;
}

interface HighlightContextType {
  highlights: Highlight[];
  addHighlight: (highlight: Omit<Highlight, "id" | "timestamp" | "pageIndex">, pageIndex: number) => void;
  removeHighlight: (id: string) => void;
  selectedHighlightId: string | null;
  setSelectedHighlightId: (id: string | null) => void;
  getHighlightById: (id: string) => Highlight | undefined;
  updateHighlightSummary: (highlightId: string, summaryId: string) => void;
  addSummary: (summary: Omit<Summary, "id" | "timestamp">) => string;
  summaries: Summary[];
  getHighlightsByPage: (pageIndex: number) => Highlight[];
  getSummariesByPage: (pageIndex: number) => Summary[];
  clearHighlights: () => void;
  clearSummaries: () => void;
}

const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);

  // LocalStorageからデータを読み込む
  useEffect(() => {
    const savedHighlights = localStorage.getItem('highlights');
    const savedSummaries = localStorage.getItem('summaries');
    if (savedHighlights) {
      try {
        setHighlights(JSON.parse(savedHighlights));
      } catch (error) {
        console.error('Failed to parse saved highlights:', error);
      }
    }
    if (savedSummaries) {
      try {
        setSummaries(JSON.parse(savedSummaries));
      } catch (error) {
        console.error('Failed to parse saved summaries:', error);
      }
    }
  }, []);

  // データをLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('highlights', JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem('summaries', JSON.stringify(summaries));
  }, [summaries]);

  const addHighlight = (
    highlight: Omit<Highlight, "id" | "timestamp" | "pageIndex">,
    pageIndex: number
  ) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      pageIndex: pageIndex,
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    if (selectedHighlightId === id) {
      setSelectedHighlightId(null);
    }
  };

  const getHighlightById = (id: string) => {
    return highlights.find(h => h.id === id);
  };

  const updateHighlightSummary = (highlightId: string, summaryId: string) => {
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, summaryId } : h
    ));
  };

  const addSummary = (summary: Omit<Summary, "id" | "timestamp">) => {
    const newSummary: Summary = {
      ...summary,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setSummaries(prev => [...prev, newSummary]);
    return newSummary.id;
  };

  const getHighlightsByPage = (pageIndex: number) => {
    return highlights.filter(h => h.pageIndex === pageIndex);
  };

  const getSummariesByPage = (pageIndex: number) => {
    return summaries.filter(s => s.pageIndex === pageIndex);
  };

  return (
    <HighlightContext.Provider
      value={{
        highlights,
        addHighlight,
        removeHighlight,
        selectedHighlightId,
        setSelectedHighlightId,
        getHighlightById,
        updateHighlightSummary,
        addSummary,
        summaries,
        getHighlightsByPage,
        getSummariesByPage,
        clearHighlights: () => setHighlights([]),
        clearSummaries: () => setSummaries([]),
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  const context = useContext(HighlightContext);
  if (context === undefined) {
    throw new Error('useHighlight must be used within a HighlightProvider');
  }
  return context;
}
