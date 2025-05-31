import { DatabaseAdapter, ElectronDatabaseConfig } from './adapter';
import { DatabaseError, NotFoundError } from './utils';
import Database from 'better-sqlite3';

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(config: ElectronDatabaseConfig) {
    this.db = new Database(config.filename, config.options);
    this.setupDatabase();
  }

  /**
   * データベースのセットアップ
   */
  private setupDatabase(): void {
    // テーブルの作成
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_highlights_book_id ON highlights(book_id);
      CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
    `);
  }

  /**
   * 基本CRUD操作
   */
  async create<T extends { id: string }>(table: string, data: T): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const stmt = this.db.prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    );
    
    try {
      stmt.run(...values);
      return data;
    } catch (error) {
      throw new DatabaseError(`Failed to create record in ${table}: ${error}`);
    }
  }

  async read<T>(table: string, id: string): Promise<T> {
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
    const result = stmt.get(id) as T;
    
    if (!result) {
      throw new NotFoundError(table, id);
    }
    
    return result;
  }

  async update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T> {
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`)
      .join(', ');
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    const stmt = this.db.prepare(
      `UPDATE ${table} SET ${updates} WHERE id = ?`
    );
    
    try {
      const result = stmt.run(...values, id);
      if (result.changes === 0) {
        throw new NotFoundError(table, id);
      }
      
      return this.read<T>(table, id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update record in ${table}: ${error}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new NotFoundError(table, id);
    }
  }

  /**
   * クエリと検索
   */
  async query<T>(table: string, filter: object): Promise<T[]> {
    const conditions = Object.entries(filter)
      .map(([key]) => `${key} = ?`)
      .join(' AND ');
    
    const values = Object.values(filter);
    const query = conditions
      ? `SELECT * FROM ${table} WHERE ${conditions}`
      : `SELECT * FROM ${table}`;
    
    const stmt = this.db.prepare(query);
    return stmt.all(...values) as T[];
  }

  async findOne<T>(table: string, filter: object): Promise<T | null> {
    const results = await this.query<T>(table, filter);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * トランザクション
   */
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    return this.db.transaction(async () => {
      return operations();
    })();
  }

  /**
   * バッチ操作
   */
  async createMany<T extends { id: string }>(table: string, items: T[]): Promise<T[]> {
    if (items.length === 0) return [];

    const columns = Object.keys(items[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = this.db.prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    );

    return this.db.transaction(() => {
      for (const item of items) {
        stmt.run(...Object.values(item));
      }
      return items;
    })();
  }

  async updateMany<T extends { id: string }>(
    table: string,
    items: { id: string; data: Partial<T> }[]
  ): Promise<T[]> {
    return this.db.transaction(async () => {
      const updated: T[] = [];
      for (const { id, data } of items) {
        const result = await this.update<T>(table, id, data);
        updated.push(result);
      }
      return updated;
    })();
  }

  async deleteMany(table: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(', ');
    const stmt = this.db.prepare(
      `DELETE FROM ${table} WHERE id IN (${placeholders})`
    );
    
    stmt.run(...ids);
  }

  /**
   * データベースの終了処理
   */
  close(): void {
    this.db.close();
  }
}
