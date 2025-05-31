import { contextBridge, ipcRenderer } from 'electron';

interface DatabaseAPI {
  create: (table: string, data: any) => Promise<any>;
  read: (table: string, id: string) => Promise<any>;
  update: (table: string, id: string, data: any) => Promise<any>;
  delete: (table: string, id: string) => Promise<void>;
  query: (table: string, filter: Record<string, any>) => Promise<any[]>;
}

interface StoreSchema {
  settings?: {
    theme?: 'light' | 'dark';
    fontSize?: number;
  };
}

// レンダラープロセスで使用可能なAPIを定義
export const api = {
  database: {
    create: (table: string, data: any) =>
      ipcRenderer.invoke('database-operation', { type: 'create', table, data }),
    read: (table: string, id: string) =>
      ipcRenderer.invoke('database-operation', { type: 'read', table, id }),
    update: (table: string, id: string, data: any) =>
      ipcRenderer.invoke('database-operation', { type: 'update', table, id, data }),
    delete: (table: string, id: string) =>
      ipcRenderer.invoke('database-operation', { type: 'delete', table, id }),
    query: (table: string, filter: Record<string, any>) =>
      ipcRenderer.invoke('database-operation', { type: 'query', table, filter })
  },
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
    database: DatabaseAPI;
  }
}
