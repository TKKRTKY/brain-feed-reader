import { app, BrowserWindow, ipcMain } from 'electron';
import serve from 'electron-serve';
import Store from 'electron-store';
import * as path from 'path';
import { DatabaseIPC } from './ipc/database';

// 環境変数の設定は削除し、アプリケーション起動時に判定
const isDev = process.env.NODE_ENV === 'development';
const loadURL = serve({ directory: 'out' });

interface StoreSchema {
  settings?: {
    theme?: 'light' | 'dark';
    fontSize?: number;
  };
}

// TypeScriptの型エラーを回避するためにanyを使用
const store = new Store<StoreSchema>({
  name: 'brain-feed-reader',
  defaults: {
    settings: {
      theme: 'light',
      fontSize: 16
    }
  }
}) as any;

interface ElectronConfig {
  appName: string;
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
}

interface RenderProcessGoneDetails {
  reason: string;
  exitCode: number;
}

const config: ElectronConfig = {
  appName: 'Brain Feed Reader',
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
  }
};

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    ...config.window,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  });

  if (isDev) {
    const port = process.env.PORT || 3000;
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
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
  mainWindow.webContents.on('render-process-gone', (event, details: RenderProcessGoneDetails) => {
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
app.whenReady().then(() => {
  // データベースIPCの初期化
  new DatabaseIPC();
  
  createWindow();

  // macOS向けのドック動作の最適化
  app.on('activate', () => {
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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC通信のセットアップ
ipcMain.handle('store:get', async (_, key: keyof StoreSchema) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (_, key: keyof StoreSchema, value: StoreSchema[keyof StoreSchema]) => {
  store.set(key, value);
  return true;
});
