"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LLMConfig {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  summaryMode: 'chapter' | 'highlight';
}

interface LLMContextType {
  config: LLMConfig;
  updateConfig: (newConfig: Partial<LLMConfig>) => void;
  generateSummary: (text: string) => Promise<string>;
}

const defaultConfig: LLMConfig = {
  apiEndpoint: 'http://localhost:11434/api/generate',
  apiKey: '',
  modelName: 'qwen3:4b',
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: '以下のテキストを簡潔に要約してください。日本語の自然な文章で出力してください。プロンプトの解釈やthinkタグなどのメタ情報は含めないでください。',
  summaryMode: 'chapter',
};

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export function LLMProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LLMConfig>(() => {
    // LocalStorageから設定を読み込む
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('llmConfig');
      if (savedConfig) {
        try {
          return JSON.parse(savedConfig);
        } catch (e) {
          console.error('Failed to parse saved config:', e);
        }
      }
    }
    
    // 環境変数からの読み込みをフォールバックとして使用
    return {
      apiEndpoint: process.env.NEXT_PUBLIC_LLM_API_ENDPOINT || defaultConfig.apiEndpoint,
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || defaultConfig.apiKey,
      modelName: process.env.NEXT_PUBLIC_LLM_MODEL_NAME || defaultConfig.modelName,
      temperature: Number(process.env.NEXT_PUBLIC_LLM_TEMPERATURE) || defaultConfig.temperature,
      maxTokens: Number(process.env.NEXT_PUBLIC_LLM_MAX_TOKENS) || defaultConfig.maxTokens,
      systemPrompt: process.env.NEXT_PUBLIC_LLM_SYSTEM_PROMPT || defaultConfig.systemPrompt,
      summaryMode: 'chapter',
    };
  });

  const updateConfig = (newConfig: Partial<LLMConfig>) => {
    setConfig(prev => {
      const updatedConfig = { ...prev, ...newConfig };
      // LocalStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('llmConfig', JSON.stringify(updatedConfig));
      }
      return updatedConfig;
    });
  };

  const generateSummary = async (text: string): Promise<string> => {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: text }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    return data.message || data.choices?.[0]?.message?.content || '';
  };

  return (
    <LLMContext.Provider value={{ config, updateConfig, generateSummary }}>
      {children}
    </LLMContext.Provider>
  );
}

export function useLLM() {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useLLM must be used within a LLMProvider');
  }
  return context;
}
