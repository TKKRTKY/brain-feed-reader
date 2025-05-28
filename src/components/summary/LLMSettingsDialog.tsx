"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLLM } from '@/contexts/LLMContext';

interface LLMSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationErrors {
  apiEndpoint?: string;
  apiKey?: string;
}

export default function LLMSettingsDialog({
  isOpen,
  onClose,
}: LLMSettingsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { config, updateConfig } = useLLM();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showApiKey, setShowApiKey] = useState(false);

  // Escキーでダイアログを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ダイアログ外のクリックで閉じる
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  // フォーカス制御
  useEffect(() => {
    if (isOpen) {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

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
    
    if (field === 'apiEndpoint') {
      const error = validateUrl(value as string);
      setErrors((prev: ValidationErrors) => ({ ...prev, apiEndpoint: error }));
    }
    
    updateConfig({ [field]: value });
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-6 transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex justify-between items-center">
          <h2 id="dialog-title" className="text-xl font-semibold">
            LLM設定
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
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

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
