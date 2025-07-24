import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../schemas';

const sqlite = new Database('./database.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });