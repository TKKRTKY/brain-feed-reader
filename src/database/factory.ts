import { DatabaseAdapter, DatabaseConfig, Platform } from './adapter';
import { IndexedDBAdapter } from './indexed-db-adapter';
import { SQLiteAdapter } from './sqlite-adapter';

/**
 * データベースアダプターを生成するファクトリークラス
 */
export class DatabaseAdapterFactory {
  /**
   * 設定に基づいて適切なデータベースアダプターを生成
   */
  static async create(config: DatabaseConfig): Promise<DatabaseAdapter> {
    switch (config.platform) {
      case 'web':
        if (!config.webConfig) {
          throw new Error('Web configuration is required for web platform');
        }
        return new IndexedDBAdapter(config.webConfig);
      
      case 'electron':
        if (!config.electronConfig) {
          throw new Error('Electron configuration is required for electron platform');
        }
        return new SQLiteAdapter(config.electronConfig);
      
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  /**
   * プラットフォーム固有の設定が正しく提供されているか検証
   */
  private static validateConfig(config: DatabaseConfig): void {
    if (config.platform === 'web' && !config.webConfig) {
      throw new Error('Web configuration is required for web platform');
    }
    if (config.platform === 'electron' && !config.electronConfig) {
      throw new Error('Electron configuration is required for electron platform');
    }
  }
}
