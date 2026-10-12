import 'dotenv/config';
import db from '../configs/db.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 Running database migration for Phase 2...');
  
  const statements = [
    'ALTER TABLE "studyMaterial" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;',
    'ALTER TABLE "studyMaterial" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW();',
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW();',
    'ALTER TABLE "ChapterNotes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW();',
    'ALTER TABLE "studyTypeContent" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW();',
    'CREATE INDEX IF NOT EXISTS "study_material_user_idx" ON "studyMaterial" ("createdBy");',
    'CREATE INDEX IF NOT EXISTS "study_material_course_idx" ON "studyMaterial" ("courseId");',
    'CREATE INDEX IF NOT EXISTS "study_material_deleted_idx" ON "studyMaterial" ("deleted_at");',
    'CREATE INDEX IF NOT EXISTS "chapter_notes_course_idx" ON "ChapterNotes" ("courseId");',
    'CREATE INDEX IF NOT EXISTS "study_type_content_course_type_idx" ON "studyTypeContent" ("courseId", "type");',
    'CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");'
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

  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
