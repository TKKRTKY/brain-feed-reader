import { IndexedDBAdapter } from './indexed-db-adapter';
import { DB_CONFIG } from './indexed-db';

// シングルトンインスタンスとしてデータベースを管理
let dbInstance: IndexedDBAdapter | null = null;

/**
 * データベースインスタンスの取得
 */
export async function getDatabase(): Promise<IndexedDBAdapter> {
  if (!dbInstance) {
    dbInstance = new IndexedDBAdapter(DB_CONFIG);
    await dbInstance.initialize();
  }
  return dbInstance;
}

/**
 * データベース接続のクリーンアップ
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// データベースの初期化時のエラーハンドリング
window.addEventListener('unload', () => {
  closeDatabase();
});
