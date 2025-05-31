"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preloadDatabase = exports.DatabaseIPC = void 0;
const electron_1 = require("electron");
const sqlite_1 = require("../database/sqlite");
const sqlite_adapter_1 = require("../database/sqlite-adapter");
const path_1 = __importDefault(require("path"));
const electron_2 = require("electron");
class DatabaseIPC {
    constructor() {
        const dbPath = path_1.default.join(electron_2.app.getPath('userData'), 'brain-feed.db');
        this.db = new sqlite_1.SQLite3Database({
            filename: dbPath,
            readonly: false,
            fileMustExist: false
        });
        this.db.initializeTables();
        this.adapter = new sqlite_adapter_1.SQLite3Adapter(this.db);
        this.setupHandlers();
    }
    setupHandlers() {
        electron_1.ipcMain.handle('database-operation', async (_, operation) => {
            try {
                switch (operation.type) {
                    case 'create':
                        return await this.adapter.create(operation.table, operation.data);
                    case 'read':
                        if (!operation.id)
                            throw new Error('ID is required for read operation');
                        return await this.adapter.read(operation.table, operation.id);
                    case 'update':
                        if (!operation.id)
                            throw new Error('ID is required for update operation');
                        return await this.adapter.update(operation.table, operation.id, operation.data);
                    case 'delete':
                        if (!operation.id)
                            throw new Error('ID is required for delete operation');
                        return await this.adapter.delete(operation.table, operation.id);
                    case 'query':
                        return await this.adapter.query(operation.table, operation.filter || {});
                    default:
                        throw new Error(`Unsupported operation type: ${operation.type}`);
                }
            }
            catch (error) {
                console.error('データベース操作エラー:', error);
                throw error;
            }
        });
        // プロセス終了時にデータベース接続を閉じる
        electron_2.app.on('before-quit', () => {
            this.db.close();
        });
    }
}
exports.DatabaseIPC = DatabaseIPC;
// レンダラープロセス用のプリロードスクリプトに追加するコード
exports.preloadDatabase = `
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
//# sourceMappingURL=database.js.map