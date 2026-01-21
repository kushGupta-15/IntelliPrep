import { sql } from 'drizzle-orm';
import db from './db.js';

// Wake up the database
async function wakeUpDatabase() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log('Database is awake!', result);
  } catch (error) {
    console.error('Error waking up database:', error);
  }
}

wakeUpDatabase();