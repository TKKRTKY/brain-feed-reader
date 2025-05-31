/**
 * トランザクションを処理するユーティリティ関数
 */
export async function withTransaction<T>(
  db: IDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode,
  callback: (tx: IDBTransaction) => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    
    tx.onerror = () => {
      reject(tx.error);
    };

    tx.onabort = () => {
      reject(new Error('Transaction aborted'));
    };

    Promise.resolve(callback(tx))
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        tx.abort();
        reject(error);
      });
  });
}

/**
 * カスタムエラー定義
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(store: string, id: string) {
    super(`Record not found in ${store} with id ${id}`);
    this.name = 'NotFoundError';
  }
}

/**
 * リクエストを処理するヘルパー関数
 */
export function handleRequest<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * データベース接続を管理するヘルパー関数
 */
export function openDatabase(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * キーの範囲を作成するヘルパー関数
 */
export function createKeyRange(value: any, options: {
  type?: 'only' | 'lowerBound' | 'upperBound' | 'bound';
  lower?: any;
  upper?: any;
  lowerOpen?: boolean;
  upperOpen?: boolean;
} = {}): IDBKeyRange | null {
  const { type = 'only', lower, upper, lowerOpen, upperOpen } = options;

  switch (type) {
    case 'only':
      return IDBKeyRange.only(value);
    case 'lowerBound':
      return IDBKeyRange.lowerBound(value, lowerOpen);
    case 'upperBound':
      return IDBKeyRange.upperBound(value, upperOpen);
    case 'bound':
      return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    default:
      return null;
  }
}
