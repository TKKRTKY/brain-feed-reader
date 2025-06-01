/**
 * データベースアダプターのインターフェース定義
 */
export interface DatabaseAdapter {
  // 基本CRUD操作
  create<T extends { id: string }>(table: string, data: T): Promise<T>;
  read<T>(table: string, id: string): Promise<T>;
  update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;

  // クエリと検索
  query<T>(table: string, filter: object): Promise<T[]>;
  findOne<T>(table: string, filter: object): Promise<T | null>;
  
  // トランザクション
  transaction<T>(operations: () => Promise<T>): Promise<T>;
  
  // バッチ操作
  createMany<T extends { id: string }>(table: string, items: T[]): Promise<T[]>;
  updateMany<T extends { id: string }>(table: string, items: { id: string; data: Partial<T> }[]): Promise<T[]>;
  deleteMany(table: string, ids: string[]): Promise<void>;
  
  // SQL実行
  execute(query: string, params?: any[]): Promise<any>;
}

/**
 * データベース設定の型定義
 */
export interface DatabaseConfig {
  platform: Platform;
  webConfig?: WebDatabaseConfig;
  electronConfig?: ElectronDatabaseConfig;
}

export type Platform = 'web' | 'electron';

export interface WebDatabaseConfig {
  name: string;
  version: number;
}

export interface ElectronDatabaseConfig {
  filename: string;
  options?: any;
}
