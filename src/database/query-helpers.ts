import { createKeyRange, handleRequest } from './utils';

export interface QueryOptions {
  index?: string;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

/**
 * インデックスを使用したクエリ実行
 */
export async function queryByIndex<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange | null,
  options: QueryOptions = {}
): Promise<T[]> {
  const { direction = 'next', limit, offset = 0 } = options;
  const results: T[] = [];
  let count = 0;

  return new Promise((resolve, reject) => {
    let request: IDBRequest;
    
    if (indexName) {
      const index = store.index(indexName);
      request = index.openCursor(range, direction);
    } else {
      request = store.openCursor(range, direction);
    }

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      
      if (!cursor) {
        resolve(results);
        return;
      }

      if (count >= offset) {
        results.push(cursor.value);
        
        if (limit && results.length >= limit) {
          resolve(results);
          return;
        }
      }

      count++;
      cursor.continue();
    };
  });
}

/**
 * 複数のキーによるクエリ実行
 */
export async function queryByMultipleKeys<T>(
  store: IDBObjectStore,
  keys: (string | number)[]
): Promise<T[]> {
  const results: T[] = [];
  
  for (const key of keys) {
    try {
      const result = await handleRequest<T>(store.get(key));
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error);
    }
  }

  return results;
}

/**
 * 指定された条件に一致するレコードを検索
 */
export async function findByField<T>(
  store: IDBObjectStore,
  field: string,
  value: any,
  options: QueryOptions = {}
): Promise<T[]> {
  const index = store.index(field);
  const range = createKeyRange(value);
  return queryByIndex<T>(store, field, range, options);
}

/**
 * 範囲検索の実行
 */
export async function findInRange<T>(
  store: IDBObjectStore,
  field: string,
  lower: any,
  upper: any,
  options: QueryOptions = {}
): Promise<T[]> {
  const index = store.index(field);
  const range = IDBKeyRange.bound(lower, upper);
  return queryByIndex<T>(store, field, range, options);
}

/**
 * 全レコードの取得
 */
export async function getAll<T>(
  store: IDBObjectStore,
  options: QueryOptions = {}
): Promise<T[]> {
  return queryByIndex<T>(store, '', null, options);
}
