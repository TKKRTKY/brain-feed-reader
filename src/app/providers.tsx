"use client";

import { LLMProvider } from '@/contexts/LLMContext';
import { HighlightProvider } from '@/contexts/HighlightContext';
import { NoteProvider } from '@/contexts/NoteContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LLMProvider>
      <HighlightProvider>
        <NoteProvider>
          {children}
        </NoteProvider>
      </HighlightProvider>
    </LLMProvider>
  );
}
