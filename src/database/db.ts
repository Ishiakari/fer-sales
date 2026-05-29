import * as SQLite from 'expo-sqlite';

// Module-level singleton so we only open the DB once per app session
let _db: SQLite.SQLiteDatabase | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (_db) return _db;

  // Open the database (must be async on first open)
  const db = await SQLite.openDatabaseAsync('fersales.db');

  // From here on we use execSync — it calls prepareSync, not prepareAsync,
  // which avoids the Android NullPointerException in the native bridge.
  db.execSync('PRAGMA journal_mode = WAL');
  db.execSync('PRAGMA foreign_keys = ON');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE RESTRICT
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      order_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS product_modifiers (
      modifier_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      extra_price REAL NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE RESTRICT
    )
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS order_item_modifiers (
      order_item_id INTEGER NOT NULL,
      modifier_id INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      PRIMARY KEY (order_item_id, modifier_id),
      FOREIGN KEY (order_item_id) REFERENCES order_items (order_item_id) ON DELETE CASCADE,
      FOREIGN KEY (modifier_id) REFERENCES product_modifiers (modifier_id) ON DELETE RESTRICT
    )
  `);

  _db = db;
  return _db;
};
