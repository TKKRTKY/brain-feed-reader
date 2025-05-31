import { ipcMain } from 'electron';
import { SQLite3Database } from '../database/sqlite';
import { SQLite3Adapter } from '../database/sqlite-adapter';
import path from 'path';
import { app } from 'electron';

interface DatabaseOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'query';
  table: string;
  data?: any;
  id?: string;
  filter?: Record<string, any>;
}

export class DatabaseIPC {
  private adapter: SQLite3Adapter;
  private db: SQLite3Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'brain-feed.db');
    this.db = new SQLite3Database({
      filename: dbPath,
      readonly: false,
      fileMustExist: false
    });
    this.db.initializeTables();
    this.adapter = new SQLite3Adapter(this.db);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    ipcMain.handle('database-operation', async (_, operation: DatabaseOperation) => {
      try {
        switch (operation.type) {
          case 'create':
            return await this.adapter.create(operation.table, operation.data);
          
          case 'read':
            if (!operation.id) throw new Error('ID is required for read operation');
            return await this.adapter.read(operation.table, operation.id);
          
          case 'update':
            if (!operation.id) throw new Error('ID is required for update operation');
            return await this.adapter.update(operation.table, operation.id, operation.data);
          
          case 'delete':
            if (!operation.id) throw new Error('ID is required for delete operation');
            return await this.adapter.delete(operation.table, operation.id);
          
          case 'query':
            return await this.adapter.query(operation.table, operation.filter || {});
          
          default:
            throw new Error(`Unsupported operation type: ${operation.type}`);
        }
      } catch (error: any) {
        console.error('データベース操作エラー:', error);
        throw error;
      }
    });

    // プロセス終了時にデータベース接続を閉じる
    app.on('before-quit', () => {
      this.db.close();
    });
  }
}

// レンダラープロセス用のプリロードスクリプトに追加するコード
export const preloadDatabase = `
const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('database', {
  create: (table, data) => 
    ipcRenderer.invoke('database-operation', { type: 'create', table, data }),
  
  read: (table, id) => 
    ipcRenderer.invoke('database-operation', { type: 'read', table, id }),
  
  update: (table, id, data) => 
    ipcRenderer.invoke('database-operation', { type: 'update', table, id, data }),
  
  delete: (table, id) => 
    ipcRenderer.invoke('database-operation', { type: 'delete', table, id }),
  
  query: (table, filter) => 
    ipcRenderer.invoke('database-operation', { type: 'query', table, filter })
});
`;
