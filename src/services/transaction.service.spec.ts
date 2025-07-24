import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { LockService } from './lock.service';
import { testDb } from '../test/setup';
import { transactions } from '../schemas';
import { eq } from 'drizzle-orm';

// Mock the database connection
vi.mock('../database/connection', () => ({
  db: testDb
}));

describe('TransactionService', () => {
  let service: TransactionService;
  let lockService: LockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService, LockService],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    lockService = module.get<LockService>(LockService);
  });

  describe('createTransaction', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        type: 'credit' as const,
        amount: 100.50,
        description: 'Test payment',
        fromAccount: 'acc-123',
        toAccount: 'acc-456'
      };

      const result = await service.createTransaction(transactionData);

      expect(result).toBeDefined();
      expect(result.type).toBe(transactionData.type);
      expect(result.amount).toBe(transactionData.amount);
      expect(result.description).toBe(transactionData.description);
      expect(result.status).toBe('pending');
      expect(result.currency).toBe('USD'); // Default currency
    });

    it('should create transaction with custom currency', async () => {
      const transactionData = {
        type: 'debit' as const,
        amount: 50.25,
        currency: 'EUR'
      };

      const result = await service.createTransaction(transactionData);

      expect(result.currency).toBe('EUR');
    });
  });

  describe('processTransaction', () => {
    it('should successfully process a transaction', async () => {
      // Create a test transaction
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending'
      }).returning();

      const result = await service.processTransaction(transaction[0].id, 'worker-1');

      expect(result).toBe(true);

      // Verify transaction is processed
      const processedTransaction = await testDb.select()
        .from(transactions)
        .where(eq(transactions.id, transaction[0].id));

      expect(processedTransaction[0].status).toBe('completed');
      expect(processedTransaction[0].processedAt).toBeDefined();
      expect(processedTransaction[0].lockedBy).toBeNull();
    });

    it('should fail to process already locked transaction', async () => {
      // Create a locked transaction
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      const result = await service.processTransaction(transaction[0].id, 'worker-2');

      expect(result).toBe(false);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending'
      }).returning();

      const result = await service.getTransactionById(transaction[0].id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(transaction[0].id);
      expect(result?.amount).toBe(100);
    });

    it('should return null for non-existent transaction', async () => {
      const result = await service.getTransactionById(999);
      expect(result).toBeNull();
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      await testDb.insert(transactions).values([
        { type: 'credit', amount: 100, status: 'pending' },
        { type: 'debit', amount: 50, status: 'completed' }
      ]);

      const result = await service.getAllTransactions();

      expect(result).toHaveLength(2);
    });

    it('should filter transactions by status', async () => {
      await testDb.insert(transactions).values([
        { type: 'credit', amount: 100, status: 'pending' },
        { type: 'debit', amount: 50, status: 'completed' }
      ]);

      const result = await service.getAllTransactions('pending');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('cancelTransaction', () => {
    it('should successfully cancel a transaction', async () => {
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending'
      }).returning();

      const result = await service.cancelTransaction(transaction[0].id, 'worker-1');

      expect(result).toBe(true);

      // Verify transaction is cancelled
      const cancelledTransaction = await testDb.select()
        .from(transactions)
        .where(eq(transactions.id, transaction[0].id));

      expect(cancelledTransaction[0].status).toBe('cancelled');
      expect(cancelledTransaction[0].lockedBy).toBeNull();
    });

    it('should fail to cancel already locked transaction', async () => {
      const transaction = await testDb.insert(transactions).values({
        type: 'credit',
        amount: 100,
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      const result = await service.cancelTransaction(transaction[0].id, 'worker-2');

      expect(result).toBe(false);
    });
  });
});