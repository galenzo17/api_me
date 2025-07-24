import { Injectable } from '@nestjs/common';
import { db } from '../database/connection';
import { transactions } from '../schemas';
import { eq, and, desc } from 'drizzle-orm';
import { LockService } from './lock.service';

export interface CreateTransactionDto {
  type: 'debit' | 'credit';
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  fromAccount?: string;
  toAccount?: string;
  metadata?: any;
}

@Injectable()
export class TransactionService {
  constructor(private lockService: LockService) {}

  async createTransaction(data: CreateTransactionDto) {
    const transaction = await db
      .insert(transactions)
      .values({
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'USD',
        description: data.description,
        reference: data.reference,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
        metadata: data.metadata,
      })
      .returning();

    return transaction[0];
  }

  async processTransaction(transactionId: number, workerId: string): Promise<boolean> {
    const lockAcquired = await this.lockService.acquireTransactionLock(transactionId, workerId);
    
    if (!lockAcquired) {
      return false;
    }

    try {
      // Update status to processing
      await db
        .update(transactions)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.lockedBy, workerId)
          )
        )
        .run();

      // Simulate transaction processing logic here
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete the transaction
      await db
        .update(transactions)
        .set({
          status: 'completed',
          processedAt: new Date(),
          updatedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.lockedBy, workerId)
          )
        )
        .run();

      return true;
    } catch (error) {
      // Mark transaction as failed
      await db
        .update(transactions)
        .set({
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error.message,
          updatedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.lockedBy, workerId)
          )
        )
        .run();

      return false;
    }
  }

  async getTransactionById(id: number) {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    return result[0] || null;
  }

  async getAllTransactions(status?: string) {
    let query = db.select().from(transactions);
    
    if (status) {
      query = query.where(eq(transactions.status, status));
    }

    return query.orderBy(desc(transactions.createdAt));
  }

  async cancelTransaction(transactionId: number, workerId: string): Promise<boolean> {
    const lockAcquired = await this.lockService.acquireTransactionLock(transactionId, workerId);
    
    if (!lockAcquired) {
      return false;
    }

    try {
      await db
        .update(transactions)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        })
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.lockedBy, workerId)
          )
        )
        .run();

      return true;
    } catch (error) {
      await this.lockService.releaseTransactionLock(transactionId, workerId);
      return false;
    }
  }
}