"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
// レンダラープロセスで使用可能なAPIを定義
exports.api = {
    database: {
        create: (table, data) => electron_1.ipcRenderer.invoke('database-operation', { type: 'create', table, data }),
        read: (table, id) => electron_1.ipcRenderer.invoke('database-operation', { type: 'read', table, id }),
        update: (table, id, data) => electron_1.ipcRenderer.invoke('database-operation', { type: 'update', table, id, data }),
        delete: (table, id) => electron_1.ipcRenderer.invoke('database-operation', { type: 'delete', table, id }),
        query: (table, filter) => electron_1.ipcRenderer.invoke('database-operation', { type: 'query', table, filter })
    },
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('store:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
    },
};
// APIをウィンドウオブジェクトに露出
electron_1.contextBridge.exposeInMainWorld('electronAPI', exports.api);
//# sourceMappingURL=preload.js.map