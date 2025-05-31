"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_serve_1 = __importDefault(require("electron-serve"));
const electron_store_1 = __importDefault(require("electron-store"));
const path = __importStar(require("path"));
const database_1 = require("./ipc/database");
// 環境変数の設定は削除し、アプリケーション起動時に判定
const isDev = process.env.NODE_ENV === 'development';
const loadURL = (0, electron_serve_1.default)({ directory: 'out' });
// TypeScriptの型エラーを回避するためにanyを使用
const store = new electron_store_1.default({
    name: 'brain-feed-reader',
    defaults: {
        settings: {
            theme: 'light',
            fontSize: 16
        }
    }
});
const config = {
    appName: 'Brain Feed Reader',
    window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600
    }
};
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow(Object.assign(Object.assign({}, config.window), { webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true
        } }));
    if (isDev) {
        const port = process.env.PORT || 3000;
        mainWindow.loadURL(`http://localhost:${port}`);
        mainWindow.webContents.openDevTools();
    }
    else {
        loadURL(mainWindow);
    }
    // エラーハンドリング
    mainWindow.on('unresponsive', () => {
        console.error('Window became unresponsive! Attempting to recover...');
        if (mainWindow) {
            mainWindow.destroy();
            createWindow();
        }
    });
    // クラッシュハンドリング
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('Renderer process gone:', details);
        if (mainWindow) {
            mainWindow.destroy();
            createWindow();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// アプリケーションの初期化
electron_1.app.whenReady().then(() => {
    // データベースIPCの初期化
    new database_1.DatabaseIPC();
    createWindow();
    // macOS向けのドック動作の最適化
    electron_1.app.on('activate', () => {
        if (!mainWindow) {
            createWindow();
        }
    });
});
// グローバルエラーハンドリング
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
// アプリケーションのクリーンアップ
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC通信のセットアップ
electron_1.ipcMain.handle('store:get', async (_, key) => {
    return store.get(key);
});
electron_1.ipcMain.handle('store:set', async (_, key, value) => {
    store.set(key, value);
    return true;
});
//# sourceMappingURL=index.js.map