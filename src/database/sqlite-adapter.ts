import { DatabaseAdapter, ElectronDatabaseConfig } from './adapter';
import { DatabaseError, NotFoundError } from './utils';

export class SQLiteAdapter implements DatabaseAdapter {
  private config: ElectronDatabaseConfig;

  constructor(config: ElectronDatabaseConfig) {
    this.config = config;
  }

  private async callIPC<T>(type: string, table: string, data?: any): Promise<T> {
    // @ts-ignore
    if (!window.database) {
      throw new Error('Database bridge is not available');
    }

    try {
      // @ts-ignore
      return await window.database[type](table, data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError(`Database operation failed: ${error}`);
    }
  }

  async create<T extends { id: string }>(table: string, data: T): Promise<T> {
    return await this.callIPC<T>('create', table, data);
  }

  async read<T>(table: string, id: string): Promise<T> {
    return this.callIPC<T>('read', table, id);
  }

  async update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T> {
    return this.callIPC<T>('update', table, { id, data });
  }

  async delete(table: string, id: string): Promise<void> {
    return this.callIPC<void>('delete', table, id);
  }

  async query<T>(table: string, filter: object): Promise<T[]> {
    return this.callIPC<T[]>('query', table, filter);
  }

  // 以下のメソッドはIPC通信を介して実装する必要がある場合のみ使用
  findOne<T>(table: string, filter: object): Promise<T | null> {
    return this.query<T>(table, filter).then(results => results[0] || null);
  }

  transaction<T>(_operations: () => Promise<T>): Promise<T> {
    throw new Error('Transactions are not supported in the Web environment');
  }

  createMany<T extends { id: string }>(table: string, items: T[]): Promise<T[]> {
    return Promise.all(items.map(item => this.create(table, item)));
  }

  updateMany<T extends { id: string }>(
    table: string,
    items: { id: string; data: Partial<T> }[]
  ): Promise<T[]> {
    return Promise.all(
      items.map(({ id, data }) => this.update(table, id, data))
    );
  }

  deleteMany(table: string, ids: string[]): Promise<void> {
    return Promise.all(ids.map(id => this.delete(table, id))).then(() => {});
  }

  execute(_query: string, _params: any[] = []): Promise<any> {
    throw new Error('Direct query execution is not supported in the Web environment');
  }

  close(): void {
    // 実際のデータベースのクローズはメインプロセスで処理
  }
}
