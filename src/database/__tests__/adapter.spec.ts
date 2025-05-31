import { DatabaseService } from '../service';
import { getDatabaseConfig } from '../../utils/platform';
import { DatabaseError, NotFoundError } from '../utils';

describe('DatabaseAdapter', () => {
  let db: DatabaseService;

  beforeAll(async () => {
    const config = getDatabaseConfig();
    db = await DatabaseService.initialize(config);
  });

  afterAll(() => {
    db.close();
  });

  describe('基本CRUD操作', () => {
    it('本の作成と取得', async () => {
      const book = await db.saveBook({
        id: 'test-1',
        title: 'Test Book',
        path: '/path/to/book',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const retrieved = await db.getBook('test-1');
      expect(retrieved).toEqual(book);
    });

    it('本の更新', async () => {
      const book = await db.saveBook({
        id: 'test-2',
        title: 'Original Title',
        path: '/path/to/book',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const updated = await db.updateBook('test-2', {
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.updated_at).toBeGreaterThan(book.updated_at);
    });

    it('本の削除', async () => {
      await db.saveBook({
        id: 'test-3',
        title: 'Book to Delete',
        path: '/path/to/book',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      await db.deleteBook('test-3');

      await expect(db.getBook('test-3')).rejects.toThrow(NotFoundError);
    });
  });

  describe('関連データの操作', () => {
    it('ハイライトの追加と取得', async () => {
      const book = await db.saveBook({
        id: 'test-4',
        title: 'Book with Highlights',
        path: '/path/to/book',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const highlight = await db.saveHighlight({
        id: 'hl-1',
        book_id: book.id,
        text: 'Test highlight',
        created_at: Date.now()
      });

      const highlights = await db.getHighlights(book.id);
      expect(highlights).toContainEqual(highlight);
    });

    it('ノートの追加と取得', async () => {
      const book = await db.saveBook({
        id: 'test-5',
        title: 'Book with Notes',
        path: '/path/to/book',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const note = await db.saveNote({
        id: 'note-1',
        book_id: book.id,
        content: 'Test note',
        created_at: Date.now(),
        updated_at: Date.now()
      });

      const notes = await db.getNotes(book.id);
      expect(notes).toContainEqual(note);
    });
  });

  describe('エラー処理', () => {
    it('存在しないレコードの取得', async () => {
      await expect(db.getBook('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('存在しないレコードの更新', async () => {
      await expect(db.updateBook('non-existent', { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
    });

    it('存在しないレコードの削除', async () => {
      await expect(db.deleteBook('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('トランザクション', () => {
    it('複数の操作を一つのトランザクションで実行', async () => {
      await db.transaction(async () => {
        const book = await db.saveBook({
          id: 'test-6',
          title: 'Transaction Test Book',
          path: '/path/to/book',
          created_at: Date.now(),
          updated_at: Date.now()
        });

        const highlight = await db.saveHighlight({
          id: 'hl-2',
          book_id: book.id,
          text: 'Transaction test highlight',
          created_at: Date.now()
        });

        const note = await db.saveNote({
          id: 'note-2',
          book_id: book.id,
          content: 'Transaction test note',
          created_at: Date.now(),
          updated_at: Date.now()
        });

        return { book, highlight, note };
      });

      const book = await db.getBook('test-6');
      expect(book).toBeTruthy();
      
      const highlights = await db.getHighlights('test-6');
      expect(highlights).toHaveLength(1);
      
      const notes = await db.getNotes('test-6');
      expect(notes).toHaveLength(1);
    });
  });
});
