import { drizzle as drizzlePostgres } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';

const connectionString = process.env.NEXT_PUBLIC_DATABASE_CONNECTION_STRING;
const useLocalSqlite = process.env.USE_LOCAL_SQLITE === '1';
const sqlitePath = process.env.LOCAL_SQLITE_PATH || './dev.sqlite';

function createSqliteDb() {
  const sqliteFile = join(process.cwd(), sqlitePath);
  const sqliteClient = new Database(sqliteFile);
  const db = drizzleSqlite(sqliteClient);

  sqliteClient.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      isMember INTEGER DEFAULT 0,
      credits INTEGER DEFAULT 5
    );
  `);

  sqliteClient.exec(`
    CREATE TABLE IF NOT EXISTS studyMaterial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      courseType TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Easy',
      courseLayout TEXT,
      createdBy TEXT NOT NULL,
      status TEXT DEFAULT 'Generating'
    );
  `);

  sqliteClient.exec(`
    CREATE TABLE IF NOT EXISTS ChapterNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      chapterId INTEGER NOT NULL,
      notes TEXT
    );
  `);

  sqliteClient.exec(`
    CREATE TABLE IF NOT EXISTS studyTypeContent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'Generating'
    );
  `);

  return db;
}

let db;

if (useLocalSqlite) {
  console.warn('USE_LOCAL_SQLITE=1 enabled — using local SQLite fallback database.');
  db = createSqliteDb();
} else if (!connectionString) {
  console.warn('No database connection string found; falling back to local SQLite.');
  db = createSqliteDb();
} else {
  try {
    const pool = new Pool({ connectionString });
    db = drizzlePostgres(pool);
  } catch (error) {
    console.warn('Failed to initialize Neon database, falling back to local SQLite:', error?.message || error);
    db = createSqliteDb();
  }
}

export default db;

