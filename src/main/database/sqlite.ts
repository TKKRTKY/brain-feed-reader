import Database from 'better-sqlite3';

export interface DatabaseConfig {
  filename: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

export class SQLite3Database {
  private db: Database.Database;

  constructor(config: DatabaseConfig) {
    this.db = new Database(config.filename, {
      readonly: config.readonly || false,
      fileMustExist: config.fileMustExist || false
    });
    this.db.pragma('foreign_keys = ON');
  }

  initializeTables(): void {
    // books テーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        filepath TEXT NOT NULL,
        last_opened DATETIME,
        current_chapter TEXT
      );
    `);

    // highlights テーブル
    this.db.exec(`
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
    `);

    // notes テーブル
    this.db.exec(`
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
    `);

    // note_highlights テーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_highlights (
        note_id TEXT NOT NULL,
        highlight_id TEXT NOT NULL,
        PRIMARY KEY (note_id, highlight_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
      );
    `);

    // summaries テーブル
    this.db.exec(`
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
  }

  close(): void {
    this.db.close();
  }

  getDatabase(): Database.Database {
    return this.db;
  }
}
