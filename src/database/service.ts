import { DatabaseAdapter, DatabaseConfig } from './adapter';
import { DatabaseAdapterFactory } from './factory';
import { validateDatabaseConfig } from '../utils/platform';
import { DatabaseError } from './utils';

/**
 * データベースサービスで扱うエンティティの型定義
 */
export interface Book {
  id: string;
  title: string;
  path: string;
  created_at: number;
  updated_at: number;
}

export interface Highlight {
  id: string;
  book_id: string;
  text: string;
  created_at: number;
}

export interface Note {
  id: string;
  book_id: string;
  content: string;
  created_at: number;
  updated_at: number;
}

/**
 * データベースサービスクラス
 * シングルトンパターンで実装し、アプリケーション全体で一貫したデータアクセスを提供
 */
export class DatabaseService {
  private adapter: DatabaseAdapter;
  private static instance: DatabaseService;

  private constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * データベースサービスのインスタンスを初期化
   */
  static async initialize(config: DatabaseConfig): Promise<DatabaseService> {
    if (!DatabaseService.instance) {
      validateDatabaseConfig(config);
      const adapter = await DatabaseAdapterFactory.create(config);
      DatabaseService.instance = new DatabaseService(adapter);
    }
    return DatabaseService.instance;
  }

  /**
   * Book関連の操作
   */
  async getBook(id: string): Promise<Book> {
    return this.adapter.read<Book>('books', id);
  }

  async saveBook(book: Book): Promise<Book> {
    const now = Date.now();
    const newBook = {
      ...book,
      created_at: book.created_at || now,
      updated_at: now
    };
    return this.adapter.create<Book>('books', newBook);
  }

  async updateBook(id: string, data: Partial<Book>): Promise<Book> {
    const updateData = {
      ...data,
      updated_at: Date.now()
    };
    return this.adapter.update<Book>('books', id, updateData);
  }

  async deleteBook(id: string): Promise<void> {
    return this.adapter.delete('books', id);
  }

  async getAllBooks(): Promise<Book[]> {
    return this.adapter.query<Book>('books', {});
  }

  /**
   * Highlight関連の操作
   */
  async getHighlight(id: string): Promise<Highlight> {
    return this.adapter.read<Highlight>('highlights', id);
  }

  async getHighlights(bookId: string): Promise<Highlight[]> {
    return this.adapter.query<Highlight>('highlights', { book_id: bookId });
  }

  async saveHighlight(highlight: Highlight): Promise<Highlight> {
    const newHighlight = {
      ...highlight,
      created_at: Date.now()
    };
    return this.adapter.create<Highlight>('highlights', newHighlight);
  }

  async saveHighlights(highlights: Highlight[]): Promise<Highlight[]> {
    const now = Date.now();
    const newHighlights = highlights.map(h => ({
      ...h,
      created_at: now
    }));
    return this.adapter.createMany<Highlight>('highlights', newHighlights);
  }

  async deleteHighlight(id: string): Promise<void> {
    return this.adapter.delete('highlights', id);
  }

  /**
   * Note関連の操作
   */
  async getNote(id: string): Promise<Note> {
    return this.adapter.read<Note>('notes', id);
  }

  async getNotes(bookId: string): Promise<Note[]> {
    return this.adapter.query<Note>('notes', { book_id: bookId });
  }

  async saveNote(note: Note): Promise<Note> {
    const now = Date.now();
    const newNote = {
      ...note,
      created_at: note.created_at || now,
      updated_at: now
    };
    return this.adapter.create<Note>('notes', newNote);
  }

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const updateData = {
      ...data,
      updated_at: Date.now()
    };
    return this.adapter.update<Note>('notes', id, updateData);
  }

  async deleteNote(id: string): Promise<void> {
    return this.adapter.delete('notes', id);
  }

  /**
   * トランザクション
   */
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    return this.adapter.transaction(operations);
  }

  /**
   * データベースの終了処理
   */
  close(): void {
    if (this.adapter && typeof (this.adapter as any).close === 'function') {
      (this.adapter as any).close();
    }
  }
}
