import React, { createContext, useContext, useState, useEffect } from 'react';
import { DatabaseAdapter } from '../database/adapter';
import { PlatformDetector, PlatformInfo } from '../lib/platform/detector';
import { createStorageProvider } from '../lib/storage/provider';

interface StorageContextValue {
  adapter: DatabaseAdapter | null;
  platform: PlatformInfo;
  isInitialized: boolean;
  error: Error | null;
}

const StorageContext = createContext<StorageContextValue>({
  adapter: null,
  platform: PlatformDetector.detect(),
  isInitialized: false,
  error: null
});

interface StorageProviderProps {
  children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [state, setState] = useState<StorageContextValue>({
    adapter: null,
    platform: PlatformDetector.detect(),
    isInitialized: false,
    error: null
  });

  useEffect(() => {
    initializeStorage();
  }, []);

  async function initializeStorage() {
    try {
      const provider = await createStorageProvider(state.platform);
      setState(prev => ({
        ...prev,
        adapter: provider.getAdapter(),
        isInitialized: true
      }));
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      }));
    }
  }

  return (
    <StorageContext.Provider value={state}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export default StorageContext;
