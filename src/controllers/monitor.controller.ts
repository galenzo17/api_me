import { Controller, Get } from '@nestjs/common';
import { db } from '../database/connection';
import { jobs, transactions } from '../schemas';
import { eq, sql, isNotNull } from 'drizzle-orm';

@Controller('monitor')
export class MonitorController {
  
  @Get('status')
  async getSystemStatus() {
    try {
      // Get job statistics
      const jobStats = await db
        .select({
          status: jobs.status,
          count: sql<number>`count(*)`.as('count')
        })
        .from(jobs)
        .groupBy(jobs.status);

      // Get transaction statistics
      const transactionStats = await db
        .select({
          status: transactions.status,
          count: sql<number>`count(*)`.as('count')
        })
        .from(transactions)
        .groupBy(transactions.status);

      // Get active locks
      const activeLocks = await db
        .select({
          type: sql<string>`'job'`.as('type'),
          id: jobs.id,
          lockedBy: jobs.lockedBy,
          lockedAt: jobs.lockedAt,
          title: jobs.title
        })
        .from(jobs)
        .where(isNotNull(jobs.lockedBy))
        .unionAll(
          db
            .select({
              type: sql<string>`'transaction'`.as('type'),
              id: transactions.id,
              lockedBy: transactions.lockedBy,
              lockedAt: transactions.lockedAt,
              title: sql<string>`'$' || ${transactions.amount} || ' ' || ${transactions.type}`.as('title')
            })
            .from(transactions)
            .where(isNotNull(transactions.lockedBy))
        );

      // Calculate totals
      const totalJobs = jobStats.reduce((sum, stat) => sum + stat.count, 0);
      const totalTransactions = transactionStats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        timestamp: new Date().toISOString(),
        jobs: {
          total: totalJobs,
          byStatus: jobStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
          }, {} as Record<string, number>)
        },
        transactions: {
          total: totalTransactions,
          byStatus: transactionStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
          }, {} as Record<string, number>)
        },
        activeLocks: {
          count: activeLocks.length,
          locks: activeLocks
        }
      };
    } catch (error) {
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  @Get('jobs/locked')
  async getLockedJobs() {
    try {
      const lockedJobs = await db
        .select()
        .from(jobs)
        .where(isNotNull(jobs.lockedBy));

      return {
        count: lockedJobs.length,
        jobs: lockedJobs
      };
    } catch (error) {
      throw new Error(`Failed to get locked jobs: ${error.message}`);
    }
  }

  @Get('transactions/locked')
  async getLockedTransactions() {
    try {
      const lockedTransactions = await db
        .select()
        .from(transactions)
        .where(isNotNull(transactions.lockedBy));

      return {
        count: lockedTransactions.length,
        transactions: lockedTransactions
      };
    } catch (error) {
      throw new Error(`Failed to get locked transactions: ${error.message}`);
    }
  }

  @Get('workers')
  async getActiveWorkers() {
    try {
      // Get unique workers from jobs
      const jobWorkers = await db
        .select({
          workerId: jobs.lockedBy,
          type: sql<string>`'job'`.as('type'),
          count: sql<number>`count(*)`.as('count')
        })
        .from(jobs)
        .where(isNotNull(jobs.lockedBy))
        .groupBy(jobs.lockedBy);

      // Get unique workers from transactions
      const transactionWorkers = await db
        .select({
          workerId: transactions.lockedBy,
          type: sql<string>`'transaction'`.as('type'),
          count: sql<number>`count(*)`.as('count')
        })
        .from(transactions)
        .where(isNotNull(transactions.lockedBy))
        .groupBy(transactions.lockedBy);

      // Combine and aggregate worker stats
      const allWorkers = [...jobWorkers, ...transactionWorkers];
      const workerStats = allWorkers.reduce((acc, worker) => {
        if (!acc[worker.workerId]) {
          acc[worker.workerId] = { jobs: 0, transactions: 0, total: 0 };
        }
        if (worker.type === 'job') {
          acc[worker.workerId].jobs = worker.count;
        } else {
          acc[worker.workerId].transactions = worker.count;
        }
        acc[worker.workerId].total = acc[worker.workerId].jobs + acc[worker.workerId].transactions;
        return acc;
      }, {} as Record<string, { jobs: number; transactions: number; total: number }>);

      return {
        activeWorkers: Object.keys(workerStats).length,
        workers: workerStats
      };
    } catch (error) {
      throw new Error(`Failed to get active workers: ${error.message}`);
    }
  }
}