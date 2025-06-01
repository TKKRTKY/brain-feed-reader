import { PlatformInfo } from '../platform/detector';

export class StorageError extends Error {
  constructor(
    message: string,
    public originalError: Error | null,
    public platform: PlatformInfo
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageInitializationError extends StorageError {
  constructor(message: string, originalError: Error | null, platform: PlatformInfo) {
    super(`初期化エラー: ${message}`, originalError, platform);
    this.name = 'StorageInitializationError';
  }
}

export class StorageMigrationError extends StorageError {
  constructor(message: string, originalError: Error | null, platform: PlatformInfo) {
    super(`マイグレーションエラー: ${message}`, originalError, platform);
    this.name = 'StorageMigrationError';
  }
}

export class StorageOperationError extends StorageError {
  constructor(
    operation: string,
    message: string,
    originalError: Error | null,
    platform: PlatformInfo
  ) {
    super(`操作エラー [${operation}]: ${message}`, originalError, platform);
    this.name = 'StorageOperationError';
  }
}
