"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = require("../sqlite");
const migration = {
    version: 1,
    async up() {
        const db = new sqlite_1.SQLite3Database({
            filename: 'brain-feed.db',
            readonly: false,
            fileMustExist: false
        });
        // テーブルの作成
        db.getDatabase().exec(`
      -- books テーブル
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        filepath TEXT NOT NULL,
        last_opened DATETIME,
        current_chapter TEXT
      );

      -- highlights テーブル
      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        text TEXT NOT NULL,
        start_offset INTEGER NOT NULL,
        end_offset INTEGER NOT NULL,
        color TEXT,
        note TEXT,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      -- notes テーブル
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        chapter_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      -- note_highlights テーブル
      CREATE TABLE IF NOT EXISTS note_highlights (
        note_id TEXT NOT NULL,
        highlight_id TEXT NOT NULL,
        PRIMARY KEY (note_id, highlight_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
      );

      -- summaries テーブル
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        chapter_id TEXT,
        highlight_id TEXT,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
      );
    `);
        db.close();
    },
    async down() {
        const db = new sqlite_1.SQLite3Database({
            filename: 'brain-feed.db',
            readonly: false,
            fileMustExist: true
        });
        // テーブルの削除（依存関係を考慮した順序）
        db.getDatabase().exec(`
      DROP TABLE IF EXISTS summaries;
      DROP TABLE IF EXISTS note_highlights;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS highlights;
      DROP TABLE IF EXISTS books;
    `);
        db.close();
    }
};
exports.default = migration;
//# sourceMappingURL=001_initial_schema.js.map