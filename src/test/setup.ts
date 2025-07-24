import { beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schemas';

let testDb: ReturnType<typeof drizzle>;
let sqlite: Database.Database;

beforeAll(() => {
  sqlite = new Database(':memory:');
  testDb = drizzle(sqlite, { schema });
  
  // Run migrations
  migrate(testDb, { migrationsFolder: './drizzle' });
});

afterAll(() => {
  sqlite?.close();
});

beforeEach(() => {
  // Clean tables before each test
  sqlite.exec('DELETE FROM jobs');
  sqlite.exec('DELETE FROM transactions');
});

export { testDb };