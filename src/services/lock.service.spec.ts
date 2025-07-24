import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { LockService } from './lock.service';
import { testDb } from '../test/setup';
import { jobs, transactions } from '../schemas';
import { eq } from 'drizzle-orm';

// Mock the database connection
vi.mock('../database/connection', () => ({
  db: testDb
}));

describe('LockService', () => {
  let service: LockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LockService],
    }).compile();

    service = module.get<LockService>(LockService);
  });

  describe('acquireJobLock', () => {
    it('should acquire lock for available job', async () => {
      // Create a test job
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending'
      }).returning();

      const result = await service.acquireJobLock(job[0].id, 'worker-1');
      
      expect(result).toBe(true);

      // Verify job is locked
      const lockedJob = await testDb.select().from(jobs).where(eq(jobs.id, job[0].id));
      expect(lockedJob[0].lockedBy).toBe('worker-1');
      expect(lockedJob[0].lockedAt).toBeDefined();
    });

    it('should fail to acquire lock for already locked job', async () => {
      // Create and lock a job
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      const result = await service.acquireJobLock(job[0].id, 'worker-2');
      
      expect(result).toBe(false);
    });
  });

  describe('releaseJobLock', () => {
    it('should release job lock', async () => {
      // Create a locked job
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      const result = await service.releaseJobLock(job[0].id, 'worker-1');
      
      expect(result).toBe(true);

      // Verify job is unlocked
      const unlockedJob = await testDb.select().from(jobs).where(eq(jobs.id, job[0].id));
      expect(unlockedJob[0].lockedBy).toBeNull();
      expect(unlockedJob[0].lockedAt).toBeNull();
    });
  });

  describe('acquireTransactionLock', () => {
    it('should acquire lock for available transaction', async () => {
      // Create a test transaction
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending'
      }).returning();

      const result = await service.acquireTransactionLock(transaction[0].id, 'worker-1');
      
      expect(result).toBe(true);

      // Verify transaction is locked
      const lockedTransaction = await testDb.select().from(transactions).where(eq(transactions.id, transaction[0].id));
      expect(lockedTransaction[0].lockedBy).toBe('worker-1');
      expect(lockedTransaction[0].lockedAt).toBeDefined();
    });
  });

  describe('cleanupExpiredLocks', () => {
    it('should clean up expired locks', async () => {
      const expiredTime = new Date(Date.now() - 60000); // 1 minute ago
      
      // Create expired locked job
      const job = await testDb.insert(jobs).values({
        title: 'Expired Job',
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: expiredTime
      }).returning();

      await service.cleanupExpiredLocks();

      // Verify lock is cleaned up
      const cleanedJob = await testDb.select().from(jobs).where(eq(jobs.id, job[0].id));
      expect(cleanedJob[0].lockedBy).toBeNull();
      expect(cleanedJob[0].lockedAt).toBeNull();
    });
  });
});