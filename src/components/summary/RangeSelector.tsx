"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [startChapter, setStartChapter] = useState(chapters[currentChapter]?.title || '');
  const [endChapter, setEndChapter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setStartChapter(chapters[currentChapter]?.title || '');
  }, [currentChapter, chapters]);

  const handleInputChange = (value: string, isStart: boolean) => {
    if (isStart) {
      setStartChapter(value);
    } else {
      setEndChapter(value);
    }

    // サジェストの更新
    const filtered = chapters
      .map(ch => ch.title)
      .filter(title => 
        title.toLowerCase().includes(value.toLowerCase())
      );
    setSuggestions(filtered);
    setIsDropdownOpen(true);
  };

  const handleSuggestionClick = (title: string, isStart: boolean) => {
    if (isStart) {
      setStartChapter(title);
    } else {
      setEndChapter(title);
    }
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRangeMode) {
      onSubmit(startChapter, endChapter);
    } else {
      onSubmit(startChapter);
    }
  };

  const presets = [
    { label: '現在の章', value: chapters[currentChapter]?.title || '' },
    { label: '次の章', value: chapters[currentChapter + 1]?.title || '' },
    { label: '前の章', value: chapters[currentChapter - 1]?.title || '' },
  ].filter(preset => preset.value);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center">
          <input
            type="radio"
            checked={!isRangeMode}
            onChange={() => setIsRangeMode(false)}
            className="mr-2"
          />
          単一の章
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={isRangeMode}
            onChange={() => setIsRangeMode(true)}
            className="mr-2"
          />
          章の範囲
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setStartChapter(preset.value);
              setIsRangeMode(false);
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={startChapter}
            onChange={(e) => handleInputChange(e.target.value, true)}
            placeholder="章を入力または選択"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          {isDropdownOpen && suggestions.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleSuggestionClick(title, true)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>

        {isRangeMode && (
          <div className="relative">
            <input
              type="text"
              value={endChapter}
              onChange={(e) => handleInputChange(e.target.value, false)}
              placeholder="終了章を入力または選択"
              className="w-full px-4 py-2 border rounded-lg"
              required={isRangeMode}
            />
            {isDropdownOpen && suggestions.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                {suggestions.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleSuggestionClick(title, false)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
      >
        要約を生成
      </button>
    </form>
  );
}
