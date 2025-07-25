import { Injectable, Logger } from '@nestjs/common';
import { db } from '../database/connection';
import { jobs, transactions } from '../schemas';
import { eq, and, isNull, sql, or } from 'drizzle-orm';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);
  private readonly lockTimeout = 30000; // 30 seconds

  async acquireJobLock(jobId: number, workerId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() - this.lockTimeout);

    try {
      this.logger.debug(`🔒 [${workerId}] Attempting to acquire lock for job ${jobId}`);
      
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

      const acquired = result.changes > 0;
      if (acquired) {
        this.logger.log(`🔐 [${workerId}] ✅ ACQUIRED lock for job ${jobId}`);
      } else {
        this.logger.debug(`🔒 [${workerId}] ❌ FAILED to acquire lock for job ${jobId} (already locked or not pending)`);
      }
      
      return acquired;
    } catch (error) {
      this.logger.error(`🔒 [${workerId}] ERROR acquiring job lock for ${jobId}: ${error.message}`);
      return false;
    }
  }

  async releaseJobLock(jobId: number, workerId: string): Promise<boolean> {
    try {
      this.logger.debug(`🔓 [${workerId}] Releasing lock for job ${jobId}`);
      
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

      const released = result.changes > 0;
      if (released) {
        this.logger.log(`🔓 [${workerId}] ✅ RELEASED lock for job ${jobId}`);
      } else {
        this.logger.warn(`🔓 [${workerId}] ❌ FAILED to release lock for job ${jobId} (not owned by worker)`);
      }
      
      return released;
    } catch (error) {
      this.logger.error(`🔓 [${workerId}] ERROR releasing job lock for ${jobId}: ${error.message}`);
      return false;
    }
  }

  async acquireTransactionLock(transactionId: number, workerId: string): Promise<boolean> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() - this.lockTimeout);

    try {
      this.logger.debug(`💰 [${workerId}] Attempting to acquire lock for transaction ${transactionId}`);
      
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

      const acquired = result.changes > 0;
      if (acquired) {
        this.logger.log(`💎 [${workerId}] ✅ ACQUIRED lock for transaction ${transactionId}`);
      } else {
        this.logger.debug(`💰 [${workerId}] ❌ FAILED to acquire lock for transaction ${transactionId} (already locked or not pending)`);
      }
      
      return acquired;
    } catch (error) {
      this.logger.error(`💰 [${workerId}] ERROR acquiring transaction lock for ${transactionId}: ${error.message}`);
      return false;
    }
  }

  async releaseTransactionLock(transactionId: number, workerId: string): Promise<boolean> {
    try {
      this.logger.debug(`💸 [${workerId}] Releasing lock for transaction ${transactionId}`);
      
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

      const released = result.changes > 0;
      if (released) {
        this.logger.log(`💸 [${workerId}] ✅ RELEASED lock for transaction ${transactionId}`);
      } else {
        this.logger.warn(`💸 [${workerId}] ❌ FAILED to release lock for transaction ${transactionId} (not owned by worker)`);
      }
      
      return released;
    } catch (error) {
      this.logger.error(`💸 [${workerId}] ERROR releasing transaction lock for ${transactionId}: ${error.message}`);
      return false;
    }
  }

  async cleanupExpiredLocks(): Promise<void> {
    const lockExpiry = new Date(Date.now() - this.lockTimeout);
    const expiryTimestamp = lockExpiry.getTime() / 1000;

    try {
      this.logger.debug(`🧹 Cleaning up locks expired before ${lockExpiry.toISOString()}`);
      
      // Clean up expired job locks
      const jobResult = db
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
      const transactionResult = db
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

      if (jobResult.changes > 0 || transactionResult.changes > 0) {
        this.logger.log(`🧹 ✅ Cleaned up ${jobResult.changes} expired job locks and ${transactionResult.changes} expired transaction locks`);
      }
    } catch (error) {
      this.logger.error(`🧹 ERROR cleaning up expired locks: ${error.message}`);
    }
  }
}