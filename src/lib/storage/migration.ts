import { DatabaseAdapter } from '../../database/adapter';
import { PlatformInfo } from '../platform/detector';
import { StorageMigrationError } from './errors';

export interface Migration {
  version: number;
  up: (adapter: DatabaseAdapter) => Promise<void>;
  down: (adapter: DatabaseAdapter) => Promise<void>;
}

export interface MigrationManager {
  getCurrentVersion(): Promise<number>;
  getMigrations(): Promise<Migration[]>;
  shouldMigrate(): Promise<boolean>;
  migrate(): Promise<void>;
}

export class StorageMigrationManager implements MigrationManager {
  constructor(
    private adapter: DatabaseAdapter,
    private platform: PlatformInfo,
    private migrations: Migration[] = []
  ) {}

  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.adapter.query<{ version: number }>('schema_versions', {});
      return result.length > 0 ? result[0].version : 0;
    } catch (error) {
      // schema_versionsテーブルが存在しない場合は作成
      await this.createVersionTable();
      return 0;
    }
  }

  getMigrations(): Promise<Migration[]> {
    return Promise.resolve(this.migrations.sort((a, b) => a.version - b.version));
  }

  async shouldMigrate(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    const latestVersion = this.migrations.reduce((max, migration) => 
      Math.max(max, migration.version), 0);
    return currentVersion < latestVersion;
  }

  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = await this.getMigrations();
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      return;
    }

    try {
      await this.adapter.transaction(async () => {
        for (const migration of pendingMigrations) {
          await migration.up(this.adapter);
          await this.updateVersion(migration.version);
        }
      });
    } catch (error) {
      throw new StorageMigrationError(
        `マイグレーション実行中にエラーが発生しました`,
        error instanceof Error ? error : null,
        this.platform
      );
    }
  }

  private async createVersionTable(): Promise<void> {
    try {
      if (this.platform.storageType === 'sqlite') {
        await this.adapter.transaction(async () => {
          await this.adapter.execute(`
            CREATE TABLE IF NOT EXISTS schema_versions (
              version INTEGER PRIMARY KEY,
              applied_at INTEGER NOT NULL
            )
          `);
        });
      } else {
        // IndexedDBの場合は、アダプターのcreateメソッドを使用
        await this.adapter.create('schema_versions', {
          id: '1',
          version: 0,
          applied_at: Date.now()
        });
      }
    } catch (error) {
      throw new StorageMigrationError(
        'バージョン管理テーブルの作成に失敗しました',
        error instanceof Error ? error : null,
        this.platform
      );
    }
  }

  private async updateVersion(version: number): Promise<void> {
    try {
      await this.adapter.transaction(async () => {
        if (this.platform.storageType === 'sqlite') {
          await this.adapter.execute(`
            INSERT INTO schema_versions (version, applied_at)
            VALUES (?, ?)
          `, [version, Date.now()]);
        } else {
          await this.adapter.create('schema_versions', {
            id: version.toString(),
            version,
            applied_at: Date.now()
          });
        }
      });
    } catch (error) {
      throw new StorageMigrationError(
        'バージョン情報の更新に失敗しました',
        error instanceof Error ? error : null,
        this.platform
      );
    }
  }
}
