"use client";

import { LLMProvider } from '@/contexts/LLMContext';
import { HighlightProvider } from '@/contexts/HighlightContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LLMProvider>
      <HighlightProvider>
        {children}
      </HighlightProvider>
    </LLMProvider>
  );
}
