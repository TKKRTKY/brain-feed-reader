import { LLMProvider } from '@/contexts/LLMContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <LLMProvider>{children}</LLMProvider>;
}
