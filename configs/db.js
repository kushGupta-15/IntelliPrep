import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.NEXT_PUBLIC_DATABASE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error('NEXT_PUBLIC_DATABASE_CONNECTION_STRING is not set');
}

const pool = new Pool({ connectionString });

const db = drizzle(pool);

export default db;

