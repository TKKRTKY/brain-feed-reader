import { SQLite3Database } from '../sqlite';
import { SQLite3Adapter } from '../sqlite-adapter';
import { Migrator } from '../migrations';
import migration from '../migrations/001_initial_schema';
import { v4 as uuidv4 } from 'uuid';

interface Book {
  id?: string;
  title: string;
  author?: string;
  filepath: string;
  last_opened?: string;
  current_chapter?: string;
}

interface Highlight {
  id?: string;
  book_id: string;
  chapter_id: string;
  text: string;
  start_offset: number;
  end_offset: number;
  color?: string;
  note?: string;
  created_at: string;
}

interface Note {
  id?: string;
  book_id: string;
  chapter_id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NoteHighlight {
  note_id: string;
  highlight_id: string;
}

interface Summary {
  id?: string;
  book_id: string;
  chapter_id?: string;
  highlight_id?: string;
  content: string;
  created_at: string;
}

describe('データベース操作のテスト', () => {
  let db: SQLite3Database;
  let adapter: SQLite3Adapter;
  let migrator: Migrator;

  beforeEach(() => {
    // インメモリデータベースを使用してテスト
    db = new SQLite3Database({
      filename: ':memory:'
    });
    db.initializeTables(); // テーブルを初期化
    adapter = new SQLite3Adapter(db);
    migrator = new Migrator(db);
  });

  afterEach(() => {
    db.close();
  });

  it('マイグレーションが正常に実行される', async () => {
    await migrator.migrateToLatest([migration]);
    const version = await migrator.getCurrentVersion();
    expect(version).toBe(1);
  });

  it('書籍の作成と取得', async () => {

    const bookData: Book = {
      title: 'テスト書籍',
      author: 'テスト著者',
      filepath: '/path/to/book.epub'
    };

    const created = await adapter.create<Book>('books', bookData);
    expect(created.id).toBeDefined();
    expect(created.title).toBe(bookData.title);

    const retrieved = await adapter.read<Book>('books', created.id);
    expect(retrieved).toEqual({
      ...created,
      last_opened: null,
      current_chapter: null
    });
  });

  it('ハイライトの作成と関連付け', async () => {

    // 書籍の作成
    const book = await adapter.create<Book>('books', {
      title: 'テスト書籍',
      filepath: '/path/to/book.epub'
    });

    // ハイライトの作成
    const highlightData: Highlight = {
      book_id: book.id,
      chapter_id: 'chapter1',
      text: 'テストハイライト',
      start_offset: 0,
      end_offset: 10,
      color: '#ffeb3b',
      created_at: new Date().toISOString()
    };

    const highlight = await adapter.create<Highlight>('highlights', highlightData);
    expect(highlight.id).toBeDefined();
    expect(highlight.book_id).toBe(book.id);

    // 関連付けの確認
    const highlights = await adapter.query<Highlight>('highlights', { book_id: book.id });
    expect(highlights).toHaveLength(1);
    expect(highlights[0].text).toBe(highlightData.text);
  });

  it('ノートの作成とハイライトの関連付け', async () => {

    // 書籍の作成
    const book = await adapter.create<Book>('books', {
      title: 'テスト書籍',
      filepath: '/path/to/book.epub'
    });

    // ハイライトの作成
    const highlight = await adapter.create<Highlight>('highlights', {
      book_id: book.id,
      chapter_id: 'chapter1',
      text: 'テストハイライト',
      start_offset: 0,
      end_offset: 10,
      created_at: new Date().toISOString()
    });

    // ノートの作成
    const noteData: Note = {
      book_id: book.id,
      title: 'テストノート',
      content: 'ノートの内容',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const note = await adapter.create<Note>('notes', noteData);

    // ノートとハイライトの関連付け
    await adapter.createComposite<NoteHighlight>('note_highlights', {
      note_id: note.id,
      highlight_id: highlight.id
    });

    // 関連付けの確認
    const noteHighlights = await adapter.query<NoteHighlight>('note_highlights', { note_id: note.id });
    expect(noteHighlights).toHaveLength(1);
    expect(noteHighlights[0].highlight_id).toBe(highlight.id);
  });

  it('要約の作成と取得', async () => {

    const book = await adapter.create<Book>('books', {
      title: 'テスト書籍',
      filepath: '/path/to/book.epub'
    });

    const summaryData: Summary = {
      book_id: book.id,
      chapter_id: 'chapter1',
      content: 'テスト要約の内容',
      created_at: new Date().toISOString()
    };

    const summary = await adapter.create<Summary>('summaries', summaryData);
    expect(summary.id).toBeDefined();
    expect(summary.content).toBe(summaryData.content);

    const retrieved = await adapter.read<Summary>('summaries', summary.id);
    expect(retrieved).toEqual({
      ...summary,
      highlight_id: null
    });
  });
});
