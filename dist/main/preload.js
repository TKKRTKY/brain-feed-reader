"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
// レンダラープロセスで使用可能なAPIを定義
exports.api = {
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('store:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
    },
};
// APIをウィンドウオブジェクトに露出
electron_1.contextBridge.exposeInMainWorld('electronAPI', exports.api);
//# sourceMappingURL=preload.js.map