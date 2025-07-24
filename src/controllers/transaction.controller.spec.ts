import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../services/transaction.service';
import { LockService } from '../services/lock.service';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;

  const mockTransactionService = {
    createTransaction: vi.fn(),
    getAllTransactions: vi.fn(),
    getTransactionById: vi.fn(),
    processTransaction: vi.fn(),
    cancelTransaction: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: LockService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a new transaction', async () => {
      const createTransactionDto = {
        type: 'credit' as const,
        amount: 100.50,
        description: 'Test payment'
      };

      const expectedTransaction = {
        id: 1,
        ...createTransactionDto,
        status: 'pending',
        createdAt: new Date()
      };

      mockTransactionService.createTransaction.mockResolvedValue(expectedTransaction);

      const result = await controller.createTransaction(createTransactionDto);

      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(createTransactionDto);
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      const expectedTransactions = [
        { id: 1, type: 'credit', amount: 100, status: 'pending' },
        { id: 2, type: 'debit', amount: 50, status: 'completed' }
      ];

      mockTransactionService.getAllTransactions.mockResolvedValue(expectedTransactions);

      const result = await controller.getAllTransactions();

      expect(mockTransactionService.getAllTransactions).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedTransactions);
    });

    it('should return transactions filtered by status', async () => {
      const expectedTransactions = [
        { id: 1, type: 'credit', amount: 100, status: 'pending' }
      ];

      mockTransactionService.getAllTransactions.mockResolvedValue(expectedTransactions);

      const result = await controller.getAllTransactions('pending');

      expect(mockTransactionService.getAllTransactions).toHaveBeenCalledWith('pending');
      expect(result).toEqual(expectedTransactions);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      const expectedTransaction = {
        id: 1,
        type: 'credit',
        amount: 100,
        status: 'pending'
      };

      mockTransactionService.getTransactionById.mockResolvedValue(expectedTransaction);

      const result = await controller.getTransactionById('1');

      expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('processTransaction', () => {
    it('should process transaction successfully', async () => {
      mockTransactionService.processTransaction.mockResolvedValue(true);

      const result = await controller.processTransaction('1', 'worker-1');

      expect(mockTransactionService.processTransaction).toHaveBeenCalledWith(1, 'worker-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Transaction processed successfully');
    });

    it('should handle failed transaction processing', async () => {
      mockTransactionService.processTransaction.mockResolvedValue(false);

      const result = await controller.processTransaction('1', 'worker-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to process transaction');
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully', async () => {
      mockTransactionService.cancelTransaction.mockResolvedValue(true);

      const result = await controller.cancelTransaction('1', 'worker-1');

      expect(mockTransactionService.cancelTransaction).toHaveBeenCalledWith(1, 'worker-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Transaction cancelled successfully');
    });

    it('should handle failed transaction cancellation', async () => {
      mockTransactionService.cancelTransaction.mockResolvedValue(false);

      const result = await controller.cancelTransaction('1', 'worker-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to cancel transaction');
    });
  });
});