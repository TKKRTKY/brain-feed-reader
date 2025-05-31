"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLite3Adapter = void 0;
const uuid_1 = require("uuid");
class SQLite3Adapter {
    constructor(db) {
        this.db = db;
    }
    async create(table, data) {
        if (table === 'note_highlights') {
            throw new Error('Use createComposite for note_highlights table');
        }
        const dataWithId = Object.assign(Object.assign({}, data), { id: data.id || (0, uuid_1.v4)() });
        const fields = Object.keys(dataWithId);
        const values = fields.map(field => dataWithId[field]);
        const placeholders = fields.map(() => '?').join(', ');
        const stmt = this.db.getDatabase().prepare(`
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders})
    `);
        try {
            stmt.run(...values);
            return dataWithId;
        }
        catch (error) {
            throw new Error(`Failed to create record in ${table}: ${error.message}`);
        }
    }
    async createComposite(table, data) {
        const fields = Object.keys(data);
        const values = fields.map(field => data[field]);
        const placeholders = fields.map(() => '?').join(', ');
        const stmt = this.db.getDatabase().prepare(`
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders})
    `);
        try {
            stmt.run(...values);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create record in ${table}: ${error.message}`);
        }
    }
    async read(table, id) {
        const stmt = this.db.getDatabase().prepare(`
      SELECT * FROM ${table} WHERE id = ?
    `);
        try {
            const result = stmt.get(id);
            if (!result) {
                throw new Error(`Record not found in ${table} with id ${id}`);
            }
            return result;
        }
        catch (error) {
            throw new Error(`Failed to read record from ${table}: ${error.message}`);
        }
    }
    async update(table, id, data) {
        const fields = Object.keys(data);
        const values = fields.map(field => data[field]);
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
            return this.read(table, id);
        }
        catch (error) {
            throw new Error(`Failed to update record in ${table}: ${error.message}`);
        }
    }
    async delete(table, id) {
        const stmt = this.db.getDatabase().prepare(`
      DELETE FROM ${table} WHERE id = ?
    `);
        try {
            const result = stmt.run(id);
            if (result.changes === 0) {
                throw new Error(`Record not found in ${table} with id ${id}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete record from ${table}: ${error.message}`);
        }
    }
    async query(table, filter) {
        const fields = Object.keys(filter);
        const values = fields.map(field => filter[field]);
        const whereClause = fields.map(field => `${field} = ?`).join(' AND ');
        const stmt = this.db.getDatabase().prepare(`
      SELECT * FROM ${table}
      ${fields.length > 0 ? `WHERE ${whereClause}` : ''}
    `);
        try {
            return stmt.all(...values);
        }
        catch (error) {
            throw new Error(`Failed to query records from ${table}: ${error.message}`);
        }
    }
    async transaction(operations) {
        const db = this.db.getDatabase();
        try {
            db.prepare('BEGIN').run();
            const result = await operations();
            db.prepare('COMMIT').run();
            return result;
        }
        catch (error) {
            db.prepare('ROLLBACK').run();
            throw error;
        }
    }
}
exports.SQLite3Adapter = SQLite3Adapter;
//# sourceMappingURL=sqlite-adapter.js.map