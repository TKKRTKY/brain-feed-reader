"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = require("../sqlite");
const sqlite_adapter_1 = require("../sqlite-adapter");
const migrations_1 = require("../migrations");
const _001_initial_schema_1 = __importDefault(require("../migrations/001_initial_schema"));
describe('データベース操作のテスト', () => {
    let db;
    let adapter;
    let migrator;
    beforeEach(() => {
        // インメモリデータベースを使用してテスト
        db = new sqlite_1.SQLite3Database({
            filename: ':memory:'
        });
        db.initializeTables(); // テーブルを初期化
        adapter = new sqlite_adapter_1.SQLite3Adapter(db);
        migrator = new migrations_1.Migrator(db);
    });
    afterEach(() => {
        db.close();
    });
    it('マイグレーションが正常に実行される', async () => {
        await migrator.migrateToLatest([_001_initial_schema_1.default]);
        const version = await migrator.getCurrentVersion();
        expect(version).toBe(1);
    });
    it('書籍の作成と取得', async () => {
        const bookData = {
            title: 'テスト書籍',
            author: 'テスト著者',
            filepath: '/path/to/book.epub'
        };
        const created = await adapter.create('books', bookData);
        expect(created.id).toBeDefined();
        expect(created.title).toBe(bookData.title);
        const retrieved = await adapter.read('books', created.id);
        expect(retrieved).toEqual(Object.assign(Object.assign({}, created), { last_opened: null, current_chapter: null }));
    });
    it('ハイライトの作成と関連付け', async () => {
        // 書籍の作成
        const book = await adapter.create('books', {
            title: 'テスト書籍',
            filepath: '/path/to/book.epub'
        });
        // ハイライトの作成
        const highlightData = {
            book_id: book.id,
            chapter_id: 'chapter1',
            text: 'テストハイライト',
            start_offset: 0,
            end_offset: 10,
            color: '#ffeb3b',
            created_at: new Date().toISOString()
        };
        const highlight = await adapter.create('highlights', highlightData);
        expect(highlight.id).toBeDefined();
        expect(highlight.book_id).toBe(book.id);
        // 関連付けの確認
        const highlights = await adapter.query('highlights', { book_id: book.id });
        expect(highlights).toHaveLength(1);
        expect(highlights[0].text).toBe(highlightData.text);
    });
    it('ノートの作成とハイライトの関連付け', async () => {
        // 書籍の作成
        const book = await adapter.create('books', {
            title: 'テスト書籍',
            filepath: '/path/to/book.epub'
        });
        // ハイライトの作成
        const highlight = await adapter.create('highlights', {
            book_id: book.id,
            chapter_id: 'chapter1',
            text: 'テストハイライト',
            start_offset: 0,
            end_offset: 10,
            created_at: new Date().toISOString()
        });
        // ノートの作成
        const noteData = {
            book_id: book.id,
            title: 'テストノート',
            content: 'ノートの内容',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const note = await adapter.create('notes', noteData);
        // ノートとハイライトの関連付け
        await adapter.createComposite('note_highlights', {
            note_id: note.id,
            highlight_id: highlight.id
        });
        // 関連付けの確認
        const noteHighlights = await adapter.query('note_highlights', { note_id: note.id });
        expect(noteHighlights).toHaveLength(1);
        expect(noteHighlights[0].highlight_id).toBe(highlight.id);
    });
    it('要約の作成と取得', async () => {
        const book = await adapter.create('books', {
            title: 'テスト書籍',
            filepath: '/path/to/book.epub'
        });
        const summaryData = {
            book_id: book.id,
            chapter_id: 'chapter1',
            content: 'テスト要約の内容',
            created_at: new Date().toISOString()
        };
        const summary = await adapter.create('summaries', summaryData);
        expect(summary.id).toBeDefined();
        expect(summary.content).toBe(summaryData.content);
        const retrieved = await adapter.read('summaries', summary.id);
        expect(retrieved).toEqual(Object.assign(Object.assign({}, summary), { highlight_id: null }));
    });
});
//# sourceMappingURL=database.spec.js.map