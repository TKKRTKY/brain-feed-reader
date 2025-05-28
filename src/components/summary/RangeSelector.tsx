"use client";

import React, { useState } from 'react';
import { Chapter } from '@/types/epub';

interface RangeSelectorProps {
  chapters: Chapter[];
  currentChapter: number;
  onSubmit: (start: string, end?: string) => void;
}

export default function RangeSelector({
  chapters,
  currentChapter,
  onSubmit,
}: RangeSelectorProps) {
  const [startChapter, setStartChapter] = useState<string>(
    chapters[currentChapter]?.title || chapters[0]?.title || ''
  );
  const [endChapter, setEndChapter] = useState<string>('');
  const [isRange, setIsRange] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(startChapter, isRange ? endChapter : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="isRange"
          checked={isRange}
          onChange={(e) => {
            setIsRange(e.target.checked);
            if (!e.target.checked) {
              setEndChapter('');
            }
          }}
          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="isRange" className="text-sm text-gray-700">
          範囲選択
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isRange ? '開始章' : '章'}
          </label>
          <select
            value={startChapter}
            onChange={(e) => setStartChapter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {chapters.map((chapter, index) => (
              <option key={chapter.href} value={chapter.title}>
                {chapter.title}
              </option>
            ))}
          </select>
        </div>

        {isRange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了章
            </label>
            <select
              value={endChapter}
              onChange={(e) => setEndChapter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">章を選択</option>
              {chapters
                .slice(
                  chapters.findIndex((ch) => ch.title === startChapter)
                )
                .map((chapter) => (
                  <option key={chapter.href} value={chapter.title}>
                    {chapter.title}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        disabled={isRange && !endChapter}
      >
        要約を生成
      </button>
    </form>
  );
}
