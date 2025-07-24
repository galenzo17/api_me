import { Injectable } from '@nestjs/common';
import { db } from '../database/connection';
import { jobs, transactions } from '../schemas';
import { eq, and, isNull, sql, or } from 'drizzle-orm';

@Injectable()
export class LockService {
  private readonly lockTimeout = 30000; // 30 seconds

  async acquireJobLock(jobId: number, workerId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() - this.lockTimeout);

    try {
      const result = db
        .update(jobs)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          updatedAt: now,
        })
        .where(
          and(
            eq(jobs.id, jobId),
            eq(jobs.status, 'pending'),
            or(
              isNull(jobs.lockedAt),
              sql`${jobs.lockedAt} < ${lockExpiry.getTime() / 1000}`
            )
          )
        )
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error('Error acquiring job lock:', error);
      return false;
    }
  }

  async releaseJobLock(jobId: number, workerId: string): Promise<boolean> {
    try {
      const result = db
        .update(jobs)
        .set({
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobs.id, jobId),
            eq(jobs.lockedBy, workerId)
          )
        )
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error('Error releasing job lock:', error);
      return false;
    }
  }

  async acquireTransactionLock(transactionId: number, workerId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() - this.lockTimeout);

    try {
      const result = db
        .update(transactions)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          updatedAt: now,
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.status, 'pending'),
            or(
              isNull(transactions.lockedAt),
              sql`${transactions.lockedAt} < ${lockExpiry.getTime() / 1000}`
            )
          )
        )
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error('Error acquiring transaction lock:', error);
      return false;
    }
  }

  async releaseTransactionLock(transactionId: number, workerId: string): Promise<boolean> {
    try {
      const result = db
        .update(transactions)
        .set({
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.lockedBy, workerId)
          )
        )
        .run();

      return result.changes > 0;
    } catch (error) {
      console.error('Error releasing transaction lock:', error);
      return false;
    }
  }

  async cleanupExpiredLocks(): Promise<void> {
    const lockExpiry = new Date(Date.now() - this.lockTimeout);
    const expiryTimestamp = lockExpiry.getTime() / 1000;

    try {
      // Clean up expired job locks
      db
        .update(jobs)
        .set({
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            sql`${jobs.lockedAt} < ${expiryTimestamp}`,
            sql`${jobs.lockedAt} IS NOT NULL`
          )
        )
        .run();

      // Clean up expired transaction locks
      db
        .update(transactions)
        .set({
          lockedAt: null,
          lockedBy: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            sql`${transactions.lockedAt} < ${expiryTimestamp}`,
            sql`${transactions.lockedAt} IS NOT NULL`
          )
        )
        .run();
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
    }
  }
}