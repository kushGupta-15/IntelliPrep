import 'dotenv/config';
import db from '../configs/db.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 Running database migration for Phase 3...');

  const statements = [
    `CREATE TABLE IF NOT EXISTS "quizAttempts" (
      "id" SERIAL PRIMARY KEY,
      "courseId" VARCHAR NOT NULL,
      "userEmail" VARCHAR NOT NULL,
      "score" INTEGER NOT NULL,
      "totalQuestions" INTEGER NOT NULL,
      "answersJSON" JSON,
      "created_at" TIMESTAMP DEFAULT NOW()
    );`,
    'CREATE INDEX IF NOT EXISTS "quiz_attempts_course_idx" ON "quizAttempts" ("courseId");',
    'CREATE INDEX IF NOT EXISTS "quiz_attempts_user_idx" ON "quizAttempts" ("userEmail");'
  ];

  for (const statement of statements) {
    try {
      console.log('Executing:', statement);
      await db.execute(sql.raw(statement));
      console.log('✅ OK');
    } catch (err) {
      console.warn('⚠️ Statement warning:', err.message);
    }
  }

  console.log('🎉 Phase 3 migration completed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
