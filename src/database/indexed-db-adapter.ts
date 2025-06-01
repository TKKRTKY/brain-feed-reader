import { DatabaseAdapter, WebDatabaseConfig } from './adapter';
import { DatabaseError, NotFoundError } from './utils';

export interface StoreIndex {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export interface DBConfig extends WebDatabaseConfig {
  stores: Record<string, string>;
  indexes?: Record<string, StoreIndex[]>;
}

export class IndexedDBAdapter implements DatabaseAdapter {
  private db: IDBDatabase | null = null;
  private config: DBConfig;

  constructor(config: WebDatabaseConfig) {
    this.config = {
      ...config,
      stores: {
        books: 'id',
        highlights: 'id',
        notes: 'id'
      },
      indexes: {
        highlights: [
          { name: 'bookId', keyPath: 'bookId' }
        ],
        notes: [
          { name: 'bookId', keyPath: 'bookId' }
        ]
      }
    };
  }

  /**
   * データベースの初期化
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      const request = indexedDB.open(this.config.name, this.config.version);
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.handleUpgrade(db);
      };

      this.db = await new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error: unknown) {
      throw new DatabaseError(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 基本CRUD操作
   */
  async create<T extends { id: string }>(table: string, data: T): Promise<T> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      await this.request(store.add(data));
      return data;
    });
  }

  async read<T>(table: string, id: string): Promise<T> {
    return this.withTransaction([table], 'readonly', async (tx) => {
      const store = tx.objectStore(table);
      const result = await this.request<T>(store.get(id));
      if (!result) throw new NotFoundError(table, id);
      return result;
    });
  }

  async update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      const existing = await this.request<T>(store.get(id));
      if (!existing) throw new NotFoundError(table, id);
      
      const updated = { ...existing, ...data };
      await this.request(store.put(updated));
      return updated;
    });
  }

  async delete(table: string, id: string): Promise<void> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      await this.request(store.delete(id));
    });
  }

  /**
   * クエリと検索
   */
  async query<T>(table: string, filter: object): Promise<T[]> {
    return this.withTransaction([table], 'readonly', async (tx) => {
      const store = tx.objectStore(table);
      const entries: T[] = [];
      
      // フィルタの条件に基づいてクエリを実行
      for (const [key, value] of Object.entries(filter)) {
        if (store.indexNames.contains(key)) {
          const index = store.index(key);
          return new Promise((resolve, reject) => {
            const request = index.openCursor(value);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const cursor = request.result;
              if (cursor) {
                entries.push(cursor.value);
                cursor.continue();
              } else {
                resolve(entries);
              }
            };
          });
        }
      }
      
      // フィルタが指定されていない場合は全件取得
      return this.request<T[]>(store.getAll());
    });
  }

  async findOne<T>(table: string, filter: object): Promise<T | null> {
    const results = await this.query<T>(table, filter);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * トランザクション
   */
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    if (!this.db) throw new DatabaseError('Database not initialized');
    return operations();
  }

  /**
   * バッチ操作
   */
  async createMany<T extends { id: string }>(table: string, items: T[]): Promise<T[]> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      for (const item of items) {
        await this.request(store.add(item));
      }
      return items;
    });
  }

  async updateMany<T extends { id: string }>(
    table: string,
    items: { id: string; data: Partial<T> }[]
  ): Promise<T[]> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      const updated: T[] = [];
      
      for (const { id, data } of items) {
        const existing = await this.request<T>(store.get(id));
        if (!existing) throw new NotFoundError(table, id);
        
        const updatedItem = { ...existing, ...data };
        await this.request(store.put(updatedItem));
        updated.push(updatedItem);
      }
      
      return updated;
    });
  }

  async deleteMany(table: string, ids: string[]): Promise<void> {
    return this.withTransaction([table], 'readwrite', async (tx) => {
      const store = tx.objectStore(table);
      for (const id of ids) {
        await this.request(store.delete(id));
      }
    });
  }

  /**
   * ユーティリティメソッド
   */
  private async withTransaction<T>(
    storeNames: string[],
    mode: IDBTransactionMode,
    operation: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) throw new DatabaseError('Failed to initialize database');

    const tx = this.db.transaction(storeNames, mode);
    const result = await operation(tx);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return result;
  }

  private request<T>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private handleUpgrade(db: IDBDatabase): void {
    const { stores, indexes } = this.config;

    for (const [storeName, keyPath] of Object.entries(stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath });
        
        // インデックスの作成
        const storeIndexes = indexes?.[storeName];
        if (storeIndexes) {
          for (const index of storeIndexes) {
            store.createIndex(index.name, index.keyPath, index.options);
          }
        }
      }
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async execute(query: string, params: any[] = []): Promise<any> {
    // IndexedDBはSQLをサポートしていないため、基本的なCRUD操作のみをサポート
    const operation = query.trim().split(' ')[0].toUpperCase();
    const table = query.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i)?.[1];

    if (!table) {
      throw new DatabaseError('無効なクエリ: テーブル名が見つかりません');
    }

    switch (operation) {
      case 'SELECT':
        return this.handleSelect(query, params);
      case 'INSERT':
        return this.handleInsert(table, params);
      case 'UPDATE':
        return this.handleUpdate(table, query, params);
      case 'DELETE':
        return this.handleDelete(table, query, params);
      case 'CREATE':
        if (query.includes('CREATE TABLE')) {
          // テーブル作成は初期化時に処理されるため、何もしない
          return Promise.resolve();
        }
        break;
      default:
        throw new DatabaseError(`未サポートの操作です: ${operation}`);
    }
  }

  private async handleSelect(query: string, params: any[]): Promise<any[]> {
    const table = query.match(/FROM\s+(\w+)/i)?.[1];
    if (!table) {
      throw new DatabaseError('無効なSELECTクエリ');
    }
    return this.query(table, {});
  }

  private async handleInsert(table: string, params: any[]): Promise<any> {
    if (params.length < 2) {
      throw new DatabaseError('INSERTに必要なパラメータが不足しています');
    }
    const data = {
      id: params[0],
      ...params[1]
    };
    return this.create(table, data);
  }

  private async handleUpdate(table: string, query: string, params: any[]): Promise<any> {
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch || params.length < 2) {
      throw new DatabaseError('無効なUPDATEクエリ');
    }
    const id = params[params.length - 1];
    const data = params[0];
    return this.update(table, id, data);
  }

  private async handleDelete(table: string, query: string, params: any[]): Promise<void> {
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch || params.length < 1) {
      throw new DatabaseError('無効なDELETEクエリ');
    }
    const id = params[0];
    return this.delete(table, id);
  }
}
