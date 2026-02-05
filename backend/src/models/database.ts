import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로덕션: DATA_DIR 환경변수 사용, 개발: 프로젝트 내 data 폴더 사용
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'receipt_record.db');
let db: SqlJsDatabase;

export function getDataDir(): string {
  return dataDir;
}

export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      profile_image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create businesses table
  db.run(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create budget_items table
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      budget_amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  // Create receipts table
  db.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_item_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      image_path TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (budget_item_id) REFERENCES budget_items(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log('Database initialized successfully');
}

function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function getDb(): SqlJsDatabase {
  return db;
}

// Helper functions for query execution
function runQuery(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  db.run(sql, params);
  const changesResult = db.exec('SELECT changes() as changes, last_insert_rowid() as lastId');
  saveDatabase();
  const changes = changesResult[0]?.values[0]?.[0] as number || 0;
  const lastInsertRowid = changesResult[0]?.values[0]?.[1] as number || 0;
  return { changes, lastInsertRowid };
}

function getOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const result: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      result[col] = values[i];
    });
    return result as T;
  }
  stmt.free();
  return undefined;
}

function getAll<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    const values = stmt.get();
    const row: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    results.push(row as T);
  }
  stmt.free();
  return results;
}

// User operations
export const userModel = {
  findByGoogleId: (googleId: string) => {
    return getOne('SELECT * FROM users WHERE google_id = ?', [googleId]);
  },

  findById: (id: number) => {
    return getOne('SELECT * FROM users WHERE id = ?', [id]);
  },

  create: (googleId: string, email: string, name: string, profileImage?: string) => {
    const result = runQuery(
      'INSERT INTO users (google_id, email, name, profile_image) VALUES (?, ?, ?, ?)',
      [googleId, email, name, profileImage || null]
    );
    return result.lastInsertRowid;
  },

  delete: (id: number) => {
    return runQuery('DELETE FROM users WHERE id = ?', [id]);
  }
};

// Business operations
export const businessModel = {
  findByUserId: (userId: number) => {
    return getAll('SELECT * FROM businesses WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },

  findById: (id: number) => {
    return getOne('SELECT * FROM businesses WHERE id = ?', [id]);
  },

  create: (userId: number, name: string) => {
    const result = runQuery('INSERT INTO businesses (user_id, name) VALUES (?, ?)', [userId, name]);
    return result.lastInsertRowid;
  },

  update: (id: number, name: string) => {
    return runQuery('UPDATE businesses SET name = ? WHERE id = ?', [name, id]);
  },

  delete: (id: number) => {
    return runQuery('DELETE FROM businesses WHERE id = ?', [id]);
  }
};

// Budget item operations
export const budgetItemModel = {
  findByBusinessId: (businessId: number) => {
    return getAll('SELECT * FROM budget_items WHERE business_id = ?', [businessId]);
  },

  findById: (id: number) => {
    return getOne('SELECT * FROM budget_items WHERE id = ?', [id]);
  },

  create: (businessId: number, name: string, budgetAmount: number) => {
    const result = runQuery(
      'INSERT INTO budget_items (business_id, name, budget_amount) VALUES (?, ?, ?)',
      [businessId, name, budgetAmount]
    );
    return result.lastInsertRowid;
  },

  update: (id: number, name: string, budgetAmount: number) => {
    return runQuery(
      'UPDATE budget_items SET name = ?, budget_amount = ? WHERE id = ?',
      [name, budgetAmount, id]
    );
  },

  delete: (id: number) => {
    return runQuery('DELETE FROM budget_items WHERE id = ?', [id]);
  },

  deleteByBusinessId: (businessId: number) => {
    return runQuery('DELETE FROM budget_items WHERE business_id = ?', [businessId]);
  }
};

// Receipt operations
export const receiptModel = {
  findByBudgetItemId: (budgetItemId: number) => {
    return getAll('SELECT * FROM receipts WHERE budget_item_id = ? ORDER BY date DESC', [budgetItemId]);
  },

  findByBusinessId: (businessId: number) => {
    return getAll(`
      SELECT r.*, bi.name as item_name 
      FROM receipts r
      JOIN budget_items bi ON r.budget_item_id = bi.id
      WHERE bi.business_id = ?
      ORDER BY r.date DESC
    `, [businessId]);
  },

  findById: (id: number) => {
    return getOne('SELECT * FROM receipts WHERE id = ?', [id]);
  },

  create: (budgetItemId: number, date: string, description: string, amount: number, notes: string | null, imagePath: string) => {
    const result = runQuery(
      'INSERT INTO receipts (budget_item_id, date, description, amount, notes, image_path) VALUES (?, ?, ?, ?, ?, ?)',
      [budgetItemId, date, description, amount, notes, imagePath]
    );
    return result.lastInsertRowid;
  },

  update: (id: number, date: string, description: string, amount: number, notes: string | null) => {
    return runQuery(
      'UPDATE receipts SET date = ?, description = ?, amount = ?, notes = ? WHERE id = ?',
      [date, description, amount, notes, id]
    );
  },

  delete: (id: number) => {
    return runQuery('DELETE FROM receipts WHERE id = ?', [id]);
  },

  getTotalByBudgetItemId: (budgetItemId: number) => {
    const result = getOne<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM receipts WHERE budget_item_id = ?',
      [budgetItemId]
    );
    return result?.total || 0;
  }
};
