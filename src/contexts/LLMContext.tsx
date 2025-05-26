"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LLMConfig {
  apiEndpoint: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface LLMContextType {
  config: LLMConfig;
  updateConfig: (newConfig: Partial<LLMConfig>) => void;
}

const defaultConfig: LLMConfig = {
  apiEndpoint: 'http://localhost:11434/api/generate',
  modelName: 'qwen3:4b',
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: '以下のテキストを簡潔に要約してください。日本語の自然な文章で出力してください。プロンプトの解釈やthinkタグなどのメタ情報は含めないでください。',
};

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export function LLMProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LLMConfig>(() => {
    // 環境変数から初期設定を読み込む
    return {
      apiEndpoint: process.env.NEXT_PUBLIC_LLM_API_ENDPOINT || defaultConfig.apiEndpoint,
      modelName: process.env.NEXT_PUBLIC_LLM_MODEL_NAME || defaultConfig.modelName,
      temperature: Number(process.env.NEXT_PUBLIC_LLM_TEMPERATURE) || defaultConfig.temperature,
      maxTokens: Number(process.env.NEXT_PUBLIC_LLM_MAX_TOKENS) || defaultConfig.maxTokens,
      systemPrompt: process.env.NEXT_PUBLIC_LLM_SYSTEM_PROMPT || defaultConfig.systemPrompt,
    };
  });

  const updateConfig = (newConfig: Partial<LLMConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <LLMContext.Provider value={{ config, updateConfig }}>
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
