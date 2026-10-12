import { drizzle as drizzlePostgres } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { join } from 'path';

const connectionString = process.env.NEXT_PUBLIC_DATABASE_CONNECTION_STRING;
const useLocalSqlite = process.env.USE_LOCAL_SQLITE === '1';
const sqlitePath = process.env.LOCAL_SQLITE_PATH || './dev.sqlite';

function createSqliteDb() {
  const sqliteFile = join(process.cwd(), sqlitePath);
  const client = createClient({ url: `file:${sqliteFile}` });
  const db = drizzleSqlite(client);

  // Initialize SQLite tables if they do not exist
  client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      isMember INTEGER DEFAULT 0,
      credits INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS studyMaterial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      courseType TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Easy',
      courseLayout TEXT,
      createdBy TEXT NOT NULL,
      status TEXT DEFAULT 'Generating',
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ChapterNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      chapterId INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS studyTypeContent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'Generating',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quizAttempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId TEXT NOT NULL,
      userEmail TEXT NOT NULL,
      score INTEGER NOT NULL,
      totalQuestions INTEGER NOT NULL,
      answersJSON TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS study_material_user_idx ON studyMaterial (createdBy);
    CREATE INDEX IF NOT EXISTS study_material_course_idx ON studyMaterial (courseId);
    CREATE INDEX IF NOT EXISTS study_material_deleted_idx ON studyMaterial (deleted_at);
    CREATE INDEX IF NOT EXISTS chapter_notes_course_idx ON ChapterNotes (courseId);
    CREATE INDEX IF NOT EXISTS study_type_content_course_type_idx ON studyTypeContent (courseId, type);
    CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
    CREATE INDEX IF NOT EXISTS quiz_attempts_course_idx ON quizAttempts (courseId);
    CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quizAttempts (userEmail);
  `).catch((err) => {
    // Non-fatal if tables already exist or in-flight
    console.debug('SQLite table init info:', err?.message);
  });

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
