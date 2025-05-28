"use client";

import React, { useState, useEffect } from 'react';
import { Chapter } from '@/types/epub';
import RangeSelector from './RangeSelector';
import LLMSettingsDialog from './LLMSettingsDialog';
import { useLLM } from '@/contexts/LLMContext';
import { useHighlight } from '@/contexts/HighlightContext';

interface SummarySectionProps {
  chapters: Chapter[];
  currentChapter: number;
  content: Record<string, string>;
  className?: string;
}

interface SummaryState {
  isLoading: boolean;
  error: string | null;
  summary: string | null;
}

type SummaryMode = 'chapter' | 'highlight';

export default function SummarySection({
  chapters,
  currentChapter,
  content,
  className = '',
}: SummarySectionProps) {
  const [summaryState, setSummaryState] = useState<SummaryState>({
    isLoading: false,
    error: null,
    summary: null,
  });
  const { config } = useLLM();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('chapter');
  const {
    highlights,
    selectedHighlightId,
    setSelectedHighlightId,
    updateHighlightSummary,
    addSummary,
    getSummariesByPage,
    getHighlightsByPage
  } = useHighlight();

  const handleSummaryRequest = async (start: string, end?: string) => {
    setSummaryState({ isLoading: true, error: null, summary: null });

    try {
      // 選択された範囲のテキストを取得
      let textToSummarize = '';
      const startIdx = chapters.findIndex(ch => ch.title === start);
      const endIdx = end 
        ? chapters.findIndex(ch => ch.title === end)
        : startIdx;

      if (startIdx === -1 || endIdx === -1) {
        throw new Error('指定された章が見つかりません');
      }

      // 選択された範囲のテキストを結合
      for (let i = startIdx; i <= endIdx; i++) {
        const chapter = chapters[i];
        textToSummarize += content[chapter.href] + '\n\n';
      }

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text: textToSummarize,
          range: {
            type: end ? 'range' : 'chapter',
            start,
            end,
          },
          config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '要約の生成に失敗しました');
      }

      const data = await response.json();
      setSummaryState({
        isLoading: false,
        error: null,
        summary: data.summary,
      });

      // 要約を保存
      addSummary({
        text: data.summary,
        highlightIds: [],
        pageIndex: currentChapter,
      });
    } catch (error) {
      setSummaryState({
        isLoading: false,
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        summary: null,
      });
    }
  };

  const handleHighlightSummary = async () => {
    if (!selectedHighlightId) return;
    
    const highlight = highlights.find(h => h.id === selectedHighlightId);
    if (!highlight) return;

    setSummaryState({ isLoading: true, error: null, summary: null });

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text: highlight.selectedText,
          range: {
            type: 'highlight',
            start: highlight.id,
          },
          config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '要約の生成に失敗しました');
      }

      const data = await response.json();

      // 要約を保存
      const summaryId = addSummary({
        text: data.summary,
        highlightIds: [highlight.id],
        pageIndex: highlight.pageIndex,
      });

      // ハイライトと要約を関連付け
      updateHighlightSummary(highlight.id, summaryId);

      setSummaryState({
        isLoading: false,
        error: null,
        summary: data.summary,
      });

      // 選択状態をリセット
      setSelectedHighlightId(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      setSummaryState({
        isLoading: false,
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        summary: null,
      });
    }
  };

  // 現在のページの要約とハイライトを取得
  const pageSummaries = getSummariesByPage(currentChapter);
  const pageHighlights = getHighlightsByPage(currentChapter);

  return (
    <div className={`mt-8 border-t pt-4 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">要約</h3>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setSummaryMode('chapter')}
              className={`px-3 py-1 ${
                summaryMode === 'chapter'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              章
            </button>
            <button
              onClick={() => setSummaryMode('highlight')}
              className={`px-3 py-1 ${
                summaryMode === 'highlight'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              ハイライト
            </button>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="LLM設定"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <LLMSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>

      {summaryMode === 'chapter' ? (
        <RangeSelector
          chapters={chapters}
          currentChapter={currentChapter}
          onSubmit={handleSummaryRequest}
        />
      ) : (
        <div className="mb-4">
          {selectedHighlightId ? (
            <button
              onClick={handleHighlightSummary}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              選択中のハイライトを要約
            </button>
          ) : (
            <div className="text-gray-500 text-center py-2">
              テキストをハイライトして選択してください
            </div>
          )}
        </div>
      )}

      {/* 現在のページの要約を表示 */}
      <div className="mt-8">
        <h4 className="text-lg font-medium mb-4">このページの要約</h4>
        {pageSummaries.length > 0 ? (
          <div className="space-y-4">
            {pageSummaries.map(summary => {
              const relatedHighlights = pageHighlights.filter(h => 
                h.summaryId === summary.id
              );
              return (
                <div key={summary.id} className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{summary.text}</pre>
                  {relatedHighlights.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                      <p>関連ハイライト:</p>
                      <ul className="list-disc list-inside">
                        {relatedHighlights.map(h => (
                          <li key={h.id} className="truncate">
                            {h.selectedText}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            このページの要約はまだありません
          </div>
        )}
      </div>

      {summaryState.isLoading && (
        <div className="mt-4 text-gray-600">
          要約を生成中...
        </div>
      )}
      {summaryState.error && (
        <div className="mt-4 text-red-600">
          エラー: {summaryState.error}
        </div>
      )}
  {summaryState.summary && currentChapter === (summaryMode === 'highlight' ? 
    highlights.find(h => h.id === selectedHighlightId)?.pageIndex :
    currentChapter) && (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium mb-2">新しい要約:</h4>
      <pre className="whitespace-pre-wrap">{summaryState.summary}</pre>
    </div>
  )}
    </div>
  );
}
