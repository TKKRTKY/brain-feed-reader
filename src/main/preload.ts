import { contextBridge, ipcRenderer } from 'electron';

interface StoreSchema {
  settings?: {
    theme?: 'light' | 'dark';
    fontSize?: number;
  };
}

// レンダラープロセスで使用可能なAPIを定義
export const api = {
  store: {
    get: <K extends keyof StoreSchema>(key: K) => 
      ipcRenderer.invoke('store:get', key) as Promise<StoreSchema[K]>,
    set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]) => 
      ipcRenderer.invoke('store:set', key, value),
  },
};

// APIをウィンドウオブジェクトに露出
contextBridge.exposeInMainWorld('electronAPI', api);

// TypeScript用の型定義
declare global {
  interface Window {
    electronAPI: typeof api;
  }
}
