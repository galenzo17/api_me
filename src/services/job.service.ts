import { Injectable } from '@nestjs/common';
import { db } from '../database/connection';
import { jobs } from '../schemas';
import { eq, and, isNotNull, desc, asc } from 'drizzle-orm';
import { LockService } from './lock.service';

export interface CreateJobDto {
  title: string;
  description?: string;
  payload?: any;
  priority?: number;
  maxAttempts?: number;
  scheduledAt?: Date;
}

@Injectable()
export class JobService {
  constructor(private lockService: LockService) {}

  async createJob(data: CreateJobDto) {
    const job = await db
      .insert(jobs)
      .values({
        title: data.title,
        description: data.description,
        payload: data.payload,
        priority: data.priority || 1,
        maxAttempts: data.maxAttempts || 3,
        scheduledAt: data.scheduledAt,
      })
      .returning();

    return job[0];
  }

  async getNextJob(workerId: string) {
    const availableJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'pending'),
          isNotNull(jobs.scheduledAt) ? eq(jobs.scheduledAt, new Date()) : undefined
        )
      )
      .orderBy(desc(jobs.priority), asc(jobs.createdAt))
      .limit(10);

    for (const job of availableJobs) {
      const lockAcquired = await this.lockService.acquireJobLock(job.id, workerId);
      if (lockAcquired) {
        return job;
      }
    }

    return null;
  }

  async updateJobStatus(jobId: number, status: string, workerId: string, errorMessage?: string) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'running') {
      updateData.attempts = db.select({ attempts: jobs.attempts }).from(jobs).where(eq(jobs.id, jobId))[0]?.attempts + 1 || 1;
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.lockedAt = null;
      updateData.lockedBy = null;
    } else if (status === 'failed') {
      updateData.failedAt = new Date();
      updateData.errorMessage = errorMessage;
      updateData.lockedAt = null;
      updateData.lockedBy = null;
    }

    return db
      .update(jobs)
      .set(updateData)
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.lockedBy, workerId)
        )
      )
      .run();
  }

  async getJobById(id: number) {
    const result = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    return result[0] || null;
  }

  async getAllJobs(status?: string) {
    let query = db.select().from(jobs);
    
    if (status) {
      query = query.where(eq(jobs.status, status));
    }

    return query.orderBy(desc(jobs.createdAt));
  }
}