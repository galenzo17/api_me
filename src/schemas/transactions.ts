import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['debit', 'credit'] }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  description: text('description'),
  reference: text('reference'),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
    .notNull()
    .default('pending'),
  fromAccount: text('from_account'),
  toAccount: text('to_account'),
  metadata: text('metadata', { mode: 'json' }),
  lockedAt: integer('locked_at', { mode: 'timestamp' }),
  lockedBy: text('locked_by'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
  failedAt: integer('failed_at', { mode: 'timestamp' }),
  errorMessage: text('error_message'),
});