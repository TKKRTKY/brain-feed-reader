"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useLLM } from '@/contexts/LLMContext';

interface LLMSettingsProps {
  className?: string;
}

interface ValidationErrors {
  apiEndpoint?: string;
  apiKey?: string;
}

export default function LLMSettings({ className = '' }: LLMSettingsProps) {
  const { config, updateConfig } = useLLM();
  const [textToSummarize, setTextToSummarize] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showApiKey, setShowApiKey] = useState(false);

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

  const validateUrl = (url: string): string | undefined => {
    if (!url) return 'URLを入力してください';
    try {
      new URL(url);
      return undefined;
    } catch {
      return '有効なURLを入力してください';
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    
    // フィールドに応じたバリデーション
    if (field === 'apiEndpoint') {
      const error = validateUrl(value as string);
      setErrors(prev => ({ ...prev, apiEndpoint: error }));
    }
    
    updateConfig({ [field]: value });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <details className="bg-white rounded-lg shadow">
        <summary className="px-4 py-2 cursor-pointer hover:bg-gray-50">
          LLM設定
        </summary>
        <div className="px-4 py-4 border-t space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              ℹ️ OpenAI APIを使用する場合は、エンドポイントに https://api.openai.com/v1/chat/completions を設定し、
              APIキーを入力してください。
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              APIエンドポイント
            </label>
            <input
              type="text"
              value={config.apiEndpoint}
              onChange={handleInputChange('apiEndpoint')}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.apiEndpoint ? 'border-red-500' : ''
              }`}
              placeholder="http://localhost:11434/api/chat"
            />
            {errors.apiEndpoint && (
              <p className="text-red-500 text-sm mt-1">{errors.apiEndpoint}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              APIキー
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={handleInputChange('apiKey')}
                className="w-full px-3 py-2 border rounded-md pr-10"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? "非表示" : "表示"}
              </button>
            </div>
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
