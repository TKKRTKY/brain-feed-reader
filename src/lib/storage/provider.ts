import { DatabaseAdapter, WebDatabaseConfig, ElectronDatabaseConfig } from '../../database/adapter';
import { IndexedDBAdapter } from '../../database/indexed-db-adapter';
import { PlatformInfo } from '../platform/detector';

export interface StorageProvider {
  initialize(): Promise<void>;
  getAdapter(): DatabaseAdapter;
  migrate(): Promise<void>;
  backup(): Promise<void>;
}

export class WebStorageProvider implements StorageProvider {
  private adapter: IndexedDBAdapter;

  constructor(config: WebDatabaseConfig) {
    this.adapter = new IndexedDBAdapter(config);
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  getAdapter(): DatabaseAdapter {
    return this.adapter;
  }

  async migrate(): Promise<void> {
    // IndexedDBの場合、マイグレーションはアダプター初期化時に自動的に実行される
    return Promise.resolve();
  }

  async backup(): Promise<void> {
    // Webプラットフォームではバックアップはサポートされていない
    return Promise.resolve();
  }
}

export class DesktopStorageProvider implements StorageProvider {
  private adapter!: DatabaseAdapter;
  private config: ElectronDatabaseConfig;
  private sqliteAdapter: any;

  constructor(config: ElectronDatabaseConfig) {
    this.config = config;
  }

  private async loadSQLiteAdapter() {
    if (!this.sqliteAdapter) {
      const module = await import('../../database/sqlite-adapter');
      this.sqliteAdapter = module.SQLiteAdapter;
    }
    return this.sqliteAdapter;
  }

  async initialize(): Promise<void> {
    const SQLiteAdapter = await this.loadSQLiteAdapter();
    this.adapter = new SQLiteAdapter(this.config);
  }

  getAdapter(): DatabaseAdapter {
    return this.adapter;
  }

  async migrate(): Promise<void> {
    // SQLiteの場合、マイグレーションはアダプター初期化時に自動的に実行される
    return Promise.resolve();
  }

  async backup(): Promise<void> {
    // TODO: SQLiteのバックアップ機能を実装
    return Promise.resolve();
  }
}

export async function createStorageProvider(platform: PlatformInfo): Promise<StorageProvider> {
  const provider = platform.type === 'web'
    ? new WebStorageProvider({
        name: 'brain-feed-reader',
        version: 1
      })
    : new DesktopStorageProvider({
        filename: 'brain-feed.db',
        options: {
          verbose: process.env.NODE_ENV === 'development'
        }
      });
  
  await provider.initialize();
  return provider;
}
