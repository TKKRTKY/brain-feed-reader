"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useLLM } from '@/contexts/LLMContext';

interface LLMSettingsProps {
  className?: string;
}

export default function LLMSettings({ className = '' }: LLMSettingsProps) {
  const { config, updateConfig } = useLLM();
  const [textToSummarize, setTextToSummarize] = useState('');

  // 入力テキストが変更されたらtokenの値を更新
  const updateMaxTokens = useCallback((text: string) => {
    const estimatedTokens = Math.ceil(text.length * 1.5);
    const targetTokens = Math.ceil(estimatedTokens * 0.2);
    const dynamicMaxTokens = Math.min(Math.max(targetTokens, 100), 2000);
    updateConfig({ maxTokens: dynamicMaxTokens });
  }, [updateConfig]);

  // BookViewerからテキストを受け取る
  useEffect(() => {
    const handleTextUpdate = (e: CustomEvent<string>) => {
      setTextToSummarize(e.detail);
      updateMaxTokens(e.detail);
    };

    window.addEventListener('textToSummarize', handleTextUpdate as EventListener);
    return () => {
      window.removeEventListener('textToSummarize', handleTextUpdate as EventListener);
    };
  }, [updateMaxTokens]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    updateConfig({ [field]: value });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <details className="bg-white rounded-lg shadow">
        <summary className="px-4 py-2 cursor-pointer hover:bg-gray-50">
          LLM設定
        </summary>
        <div className="px-4 py-4 border-t space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              APIエンドポイント
            </label>
            <input
              type="text"
              value={config.apiEndpoint}
              onChange={handleInputChange('apiEndpoint')}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="http://localhost:11434/api/chat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              モデル名
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={handleInputChange('modelName')}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="llama2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
            </label>
            <input
              type="number"
              value={config.temperature}
              onChange={handleInputChange('temperature')}
              step="0.1"
              min="0"
              max="2"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大トークン数
            </label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={handleInputChange('maxTokens')}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              システムプロンプト
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={handleInputChange('systemPrompt')}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
