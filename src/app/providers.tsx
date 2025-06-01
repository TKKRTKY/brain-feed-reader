"use client";

import { LLMProvider } from '@/contexts/LLMContext';
import { HighlightProvider } from '@/contexts/HighlightContext';
import { NoteProvider } from '@/contexts/NoteContext';
import { StorageProvider } from '@/contexts/StorageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider>
      <LLMProvider>
        <HighlightProvider>
          <NoteProvider>
            {children}
          </NoteProvider>
        </HighlightProvider>
      </LLMProvider>
    </StorageProvider>
  );
}
