"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrator = void 0;
class Migrator {
    constructor(db) {
        this.db = db;
        this.initializeMigrationsTable();
    }
    initializeMigrationsTable() {
        this.db.getDatabase().exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME NOT NULL
      );
    `);
    }
    async getCurrentVersion() {
        const result = this.db.getDatabase().prepare(`
      SELECT MAX(version) as version FROM migrations
    `).get();
        return result.version || 0;
    }
    async migrateToLatest(migrations) {
        const currentVersion = await this.getCurrentVersion();
        const sortedMigrations = migrations.sort((a, b) => a.version - b.version);
        for (const migration of sortedMigrations) {
            if (migration.version > currentVersion) {
                await this.applyMigration(migration);
            }
        }
    }
    async rollback(migrations, targetVersion) {
        const currentVersion = await this.getCurrentVersion();
        const sortedMigrations = migrations
            .sort((a, b) => b.version - a.version); // 降順でソート
        for (const migration of sortedMigrations) {
            if (migration.version <= currentVersion && migration.version > targetVersion) {
                await this.revertMigration(migration);
            }
        }
    }
    async applyMigration(migration) {
        const db = this.db.getDatabase();
        try {
            db.prepare('BEGIN').run();
            await migration.up();
            db.prepare(`
        INSERT INTO migrations (version, applied_at)
        VALUES (?, datetime('now'))
      `).run(migration.version);
            db.prepare('COMMIT').run();
            console.log(`マイグレーション適用成功: バージョン ${migration.version}`);
        }
        catch (error) {
            db.prepare('ROLLBACK').run();
            console.error(`マイグレーション適用失敗: バージョン ${migration.version}`, error);
            throw error;
        }
    }
    async revertMigration(migration) {
        const db = this.db.getDatabase();
        try {
            db.prepare('BEGIN').run();
            await migration.down();
            db.prepare(`
        DELETE FROM migrations
        WHERE version = ?
      `).run(migration.version);
            db.prepare('COMMIT').run();
            console.log(`マイグレーション取り消し成功: バージョン ${migration.version}`);
        }
        catch (error) {
            db.prepare('ROLLBACK').run();
            console.error(`マイグレーション取り消し失敗: バージョン ${migration.version}`, error);
            throw error;
        }
    }
}
exports.Migrator = Migrator;
//# sourceMappingURL=index.js.map