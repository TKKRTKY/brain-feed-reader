import { Platform, DatabaseConfig } from '../database/adapter';

/**
 * 現在のプラットフォームを判定
 */
export function getPlatform(): Platform {
  // Electron環境かどうかをprocess.typeで判定
  if (typeof process !== 'undefined' && process.type === 'renderer') {
    return 'electron';
  }
  return 'web';
}

/**
 * プラットフォームに応じたデータベース設定を取得
 */
export function getDatabaseConfig(): DatabaseConfig {
  const platform = getPlatform();
  const config: DatabaseConfig = {
    platform,
    webConfig: platform === 'web' ? {
      name: 'brain-feed-reader',
      version: 1
    } : undefined,
    electronConfig: platform === 'electron' ? {
      filename: 'brain-feed.db',
      options: {
        // SQLite3の設定オプション
        verbose: process.env.NODE_ENV === 'development',
        fileMustExist: false
      }
    } : undefined
  };

  return config;
}

/**
 * データベース設定の検証
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.platform) {
    throw new Error('Platform must be specified in database config');
  }

  if (config.platform === 'web' && !config.webConfig) {
    throw new Error('Web configuration is required for web platform');
  }

  if (config.platform === 'electron' && !config.electronConfig) {
    throw new Error('Electron configuration is required for electron platform');
  }
}
