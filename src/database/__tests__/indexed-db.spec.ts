import { IndexedDBAdapter } from '../indexed-db-adapter';
import { DBConfig, Book, Highlight } from '../indexed-db';
import { NotFoundError } from '../utils';

describe('IndexedDBAdapter', () => {
  let db: IndexedDBAdapter;
  const TEST_CONFIG: DBConfig = {
    name: 'TestDB',
    version: 1,
    stores: {
      books: 'id',
      highlights: 'id'
    }
  };

  beforeEach(async () => {
    // テスト用のIndexedDBを初期化
    db = new IndexedDBAdapter(TEST_CONFIG);
    await db.initialize();
  });

  afterEach(() => {
    // テスト後にデータベースをクローズ
    db.close();
    // テストデータベースを削除
    indexedDB.deleteDatabase(TEST_CONFIG.name);
  });

  describe('CRUD Operations', () => {
    const testBook: Book = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Test Author',
      filepath: '/test/path'
    };

    it('should create a new record', async () => {
      const created = await db.create('books', testBook);
      expect(created).toEqual(testBook);
    });

    it('should read an existing record', async () => {
      await db.create('books', testBook);
      const retrieved = await db.read('books', testBook.id);
      expect(retrieved).toEqual(testBook);
    });

    it('should throw NotFoundError when reading non-existent record', async () => {
      await expect(db.read('books', 'non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should update an existing record', async () => {
      await db.create('books', testBook);
      const updated = await db.update<Book>('books', testBook.id, {
        title: 'Updated Title'
      });
      expect(updated.title).toBe('Updated Title');
      expect(updated.author).toBe(testBook.author);
    });

    it('should delete an existing record', async () => {
      await db.create('books', testBook);
      await db.delete('books', testBook.id);
      await expect(db.read('books', testBook.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Query Operations', () => {
    const testHighlights: Highlight[] = [
      {
        id: 'highlight-1',
        bookId: 'book-1',
        chapterId: 'chapter-1',
        text: 'Test highlight 1',
        startOffset: 0,
        endOffset: 10,
        createdAt: new Date('2025-01-01')
      },
      {
        id: 'highlight-2',
        bookId: 'book-1',
        chapterId: 'chapter-2',
        text: 'Test highlight 2',
        startOffset: 0,
        endOffset: 10,
        createdAt: new Date('2025-01-02')
      },
      {
        id: 'highlight-3',
        bookId: 'book-2',
        chapterId: 'chapter-1',
        text: 'Test highlight 3',
        startOffset: 0,
        endOffset: 10,
        createdAt: new Date('2025-01-03')
      }
    ];

    beforeEach(async () => {
      // テストデータを作成
      for (const highlight of testHighlights) {
        await db.create('highlights', highlight);
      }
    });

    it('should query by index', async () => {
      const results = await db.query<Highlight>('highlights', {
        index: 'by_book',
        value: 'book-1'
      });
      expect(results).toHaveLength(2);
      expect(results.map((h: Highlight) => h.bookId)).toEqual(['book-1', 'book-1']);
    });

    it('should query with limit and offset', async () => {
      const results = await db.query<Highlight>('highlights', {
        limit: 2,
        offset: 1
      });
      expect(results).toHaveLength(2);
      const typedResults = results as Highlight[];
      expect(typedResults[0].id).toBe('highlight-2');
    });

    it('should query in reverse order', async () => {
      const results = await db.query<Highlight>('highlights', {
        direction: 'prev'
      });
      const typedResults = results as Highlight[];
      expect(typedResults[0].id).toBe('highlight-3');
    });
  });

  describe('Transaction Operations', () => {
    it('should handle successful transaction', async () => {
      const result = await db.transaction(async () => {
        const book = await db.create('books', {
          id: 'book-tx-1',
          title: 'Transaction Test Book',
          filepath: '/test/path'
        });
        const highlight = await db.create('highlights', {
          id: 'highlight-tx-1',
          bookId: book.id,
          chapterId: 'chapter-1',
          text: 'Test highlight',
          startOffset: 0,
          endOffset: 10,
          createdAt: new Date()
        });
        return { book, highlight };
      });

      expect(result.book.id).toBe('book-tx-1');
      expect(result.highlight.bookId).toBe('book-tx-1');
    });

    it('should handle failed transaction', async () => {
      await expect(db.transaction(async () => {
        await db.create('books', {
          id: 'book-tx-2',
          title: 'Transaction Test Book',
          filepath: '/test/path'
        });
        // 意図的にエラーを発生させる
        throw new Error('Transaction test error');
      })).rejects.toThrow('Transaction test error');
    });
  });
});
