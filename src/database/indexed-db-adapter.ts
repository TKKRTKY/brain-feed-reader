import { DBConfig, STORE_INDEXES, StoreIndex } from './indexed-db';
import { DatabaseError, NotFoundError, withTransaction, openDatabase } from './utils';
import { QueryOptions, queryByIndex, findByField, getAll } from './query-helpers';

export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private config: DBConfig;

  constructor(config: DBConfig) {
    this.config = config;
  }

  /**
   * データベースの初期化
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to initialize database: ${errorMessage}`);
    }
  }

  /**
   * レコードの作成
   */
  async create<T extends { id: string }>(store: string, data: T): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return withTransaction(this.db, [store], 'readwrite', async (tx) => {
      const objectStore = tx.objectStore(store);
      await new Promise<void>((resolve, reject) => {
        const request = objectStore.add(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      return data;
    });
  }

  /**
   * レコードの読み取り
   */
  async read<T>(store: string, id: string): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return withTransaction(this.db, [store], 'readonly', async (tx) => {
      const objectStore = tx.objectStore(store);
      const result = await new Promise<T>((resolve, reject) => {
        const request = objectStore.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      if (!result) {
        throw new NotFoundError(store, id);
      }

      return result;
    });
  }

  /**
   * レコードの更新
   */
  async update<T extends { id: string }>(store: string, id: string, data: Partial<T>): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return withTransaction(this.db, [store], 'readwrite', async (tx) => {
      const objectStore = tx.objectStore(store);
      const existing = await new Promise<T>((resolve, reject) => {
        const request = objectStore.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      if (!existing) {
        throw new NotFoundError(store, id);
      }

      const updated = { ...existing, ...data };
      await new Promise<void>((resolve, reject) => {
        const request = objectStore.put(updated);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      return updated;
    });
  }

  /**
   * レコードの削除
   */
  async delete(store: string, id: string): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return withTransaction(this.db, [store], 'readwrite', async (tx) => {
      const objectStore = tx.objectStore(store);
      await new Promise<void>((resolve, reject) => {
        const request = objectStore.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    });
  }

  /**
   * クエリの実行
   */
  async query<T>(store: string, options: {
    index?: string;
    value?: any;
    range?: { lower: any; upper: any };
    limit?: number;
    offset?: number;
    direction?: IDBCursorDirection;
  }): Promise<T[]> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return withTransaction(this.db, [store], 'readonly', async (tx) => {
      const objectStore = tx.objectStore(store);
      const queryOptions: QueryOptions = {
        direction: options.direction,
        limit: options.limit,
        offset: options.offset
      };

      if (options.index && options.value !== undefined) {
        return findByField(objectStore, options.index, options.value, queryOptions);
      }

      if (options.range) {
        const { lower, upper } = options.range;
        const range = IDBKeyRange.bound(lower, upper);
        return queryByIndex(objectStore, options.index || '', range, queryOptions);
      }

      return getAll(objectStore, queryOptions);
    });
  }

  /**
   * トランザクションの実行
   */
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return operations();
  }

  /**
   * データベースのクローズ
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * アップグレードハンドラー
   */
  private handleUpgrade(db: IDBDatabase): void {
    const stores = this.config.stores;

    for (const [storeName, keyPath] of Object.entries(stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath });
        
        // インデックスの作成
        const indexes = STORE_INDEXES[storeName];
        if (indexes) {
          for (const index of indexes) {
            store.createIndex(index.name, index.keyPath, index.options);
          }
        }
      }
    }
  }
}
