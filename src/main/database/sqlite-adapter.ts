import { v4 as uuidv4 } from 'uuid';
import { SQLite3Database } from './sqlite';
import type Database from 'better-sqlite3';

export interface DatabaseAdapter {
  create<T extends Record<string, any>>(table: string, data: T): Promise<T & { id: string }>;
  createComposite<T extends Record<string, any>>(table: string, data: T): Promise<T>;
  read<T extends Record<string, any>>(table: string, id: string): Promise<T>;
  update<T extends Record<string, any>>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  query<T extends Record<string, any>>(table: string, filter: Record<string, any>): Promise<T[]>;
  transaction<T>(operations: () => Promise<T>): Promise<T>;
}

export class SQLite3Adapter implements DatabaseAdapter {
  private db: SQLite3Database;

  constructor(db: SQLite3Database) {
    this.db = db;
  }

  async create<T extends Record<string, any>>(table: string, data: T): Promise<T & { id: string }> {
    if (table === 'note_highlights') {
      throw new Error('Use createComposite for note_highlights table');
    }

    const dataWithId = { ...data, id: data.id || uuidv4() };
    const fields = Object.keys(dataWithId);
    const values = fields.map(field => dataWithId[field as keyof typeof dataWithId]);
    const placeholders = fields.map(() => '?').join(', ');

    const stmt = this.db.getDatabase().prepare(`
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders})
    `);

    try {
      stmt.run(...values);
      return dataWithId as T & { id: string };
    } catch (error: any) {
      throw new Error(`Failed to create record in ${table}: ${error.message}`);
    }
  }

  async createComposite<T extends Record<string, any>>(table: string, data: T): Promise<T> {
    const fields = Object.keys(data);
    const values = fields.map(field => data[field as keyof T]);
    const placeholders = fields.map(() => '?').join(', ');

    const stmt = this.db.getDatabase().prepare(`
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders})
    `);

    try {
      stmt.run(...values);
      return data;
    } catch (error: any) {
      throw new Error(`Failed to create record in ${table}: ${error.message}`);
    }
  }

  async read<T extends Record<string, any>>(table: string, id: string): Promise<T> {
    const stmt = this.db.getDatabase().prepare(`
      SELECT * FROM ${table} WHERE id = ?
    `);

    try {
      const result = stmt.get(id) as T;
      if (!result) {
        throw new Error(`Record not found in ${table} with id ${id}`);
      }
      return result;
    } catch (error: any) {
      throw new Error(`Failed to read record from ${table}: ${error.message}`);
    }
  }

  async update<T extends Record<string, any>>(table: string, id: string, data: Partial<T>): Promise<T> {
    const fields = Object.keys(data);
    const values = fields.map(field => data[field as keyof T]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = this.db.getDatabase().prepare(`
      UPDATE ${table}
      SET ${setClause}
      WHERE id = ?
    `);

    try {
      const result = stmt.run(...values, id);
      if (result.changes === 0) {
        throw new Error(`Record not found in ${table} with id ${id}`);
      }
      return this.read<T>(table, id);
    } catch (error: any) {
      throw new Error(`Failed to update record in ${table}: ${error.message}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    const stmt = this.db.getDatabase().prepare(`
      DELETE FROM ${table} WHERE id = ?
    `);

    try {
      const result = stmt.run(id);
      if (result.changes === 0) {
        throw new Error(`Record not found in ${table} with id ${id}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete record from ${table}: ${error.message}`);
    }
  }

  async query<T extends Record<string, any>>(table: string, filter: Record<string, any>): Promise<T[]> {
    const fields = Object.keys(filter);
    const values = fields.map(field => filter[field]);
    const whereClause = fields.map(field => `${field} = ?`).join(' AND ');

    const stmt = this.db.getDatabase().prepare(`
      SELECT * FROM ${table}
      ${fields.length > 0 ? `WHERE ${whereClause}` : ''}
    `);

    try {
      return stmt.all(...values) as T[];
    } catch (error: any) {
      throw new Error(`Failed to query records from ${table}: ${error.message}`);
    }
  }

  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    const db = this.db.getDatabase();
    
    try {
      db.prepare('BEGIN').run();
      const result = await operations();
      db.prepare('COMMIT').run();
      return result;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  }
}
