import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { LockService } from './lock.service';
import { testDb } from '../test/setup';
import { jobs } from '../schemas';
import { eq } from 'drizzle-orm';

// Mock the database connection
vi.mock('../database/connection', () => ({
  db: testDb
}));

describe('JobService', () => {
  let service: JobService;
  let lockService: LockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobService, LockService],
    }).compile();

    service = module.get<JobService>(JobService);
    lockService = module.get<LockService>(LockService);
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const jobData = {
        title: 'Test Job',
        description: 'Test description',
        priority: 5
      };

      const result = await service.createJob(jobData);

      expect(result).toBeDefined();
      expect(result.title).toBe(jobData.title);
      expect(result.description).toBe(jobData.description);
      expect(result.priority).toBe(jobData.priority);
      expect(result.status).toBe('pending');
    });

    it('should create job with default values', async () => {
      const jobData = {
        title: 'Simple Job'
      };

      const result = await service.createJob(jobData);

      expect(result.priority).toBe(1);
      expect(result.maxAttempts).toBe(3);
      expect(result.status).toBe('pending');
    });
  });

  describe('getNextJob', () => {
    it('should return and lock next available job', async () => {
      // Create test jobs with different priorities
      await testDb.insert(jobs).values([
        { title: 'Low Priority', priority: 1, status: 'pending' },
        { title: 'High Priority', priority: 10, status: 'pending' }
      ]);

      const result = await service.getNextJob('worker-1');

      expect(result).toBeDefined();
      expect(result?.title).toBe('High Priority'); // Should get highest priority first
      expect(result?.lockedBy).toBe('worker-1');
    });

    it('should return null when no jobs available', async () => {
      const result = await service.getNextJob('worker-1');
      expect(result).toBeNull();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to completed', async () => {
      // Create and lock a job
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      await service.updateJobStatus(job[0].id, 'completed', 'worker-1');

      const updatedJob = await testDb.select().from(jobs).where(eq(jobs.id, job[0].id));
      expect(updatedJob[0].status).toBe('completed');
      expect(updatedJob[0].completedAt).toBeDefined();
      expect(updatedJob[0].lockedBy).toBeNull();
    });

    it('should update job status to failed with error message', async () => {
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending',
        lockedBy: 'worker-1',
        lockedAt: new Date()
      }).returning();

      const errorMessage = 'Something went wrong';
      await service.updateJobStatus(job[0].id, 'failed', 'worker-1', errorMessage);

      const updatedJob = await testDb.select().from(jobs).where(eq(jobs.id, job[0].id));
      expect(updatedJob[0].status).toBe('failed');
      expect(updatedJob[0].errorMessage).toBe(errorMessage);
      expect(updatedJob[0].failedAt).toBeDefined();
    });
  });

  describe('getJobById', () => {
    it('should return job by id', async () => {
      const job = await testDb.insert(jobs).values({
        title: 'Test Job',
        status: 'pending'
      }).returning();

      const result = await service.getJobById(job[0].id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(job[0].id);
      expect(result?.title).toBe('Test Job');
    });

    it('should return null for non-existent job', async () => {
      const result = await service.getJobById(999);
      expect(result).toBeNull();
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      await testDb.insert(jobs).values([
        { title: 'Job 1', status: 'pending' },
        { title: 'Job 2', status: 'completed' }
      ]);

      const result = await service.getAllJobs();

      expect(result).toHaveLength(2);
    });

    it('should filter jobs by status', async () => {
      await testDb.insert(jobs).values([
        { title: 'Job 1', status: 'pending' },
        { title: 'Job 2', status: 'completed' }
      ]);

      const result = await service.getAllJobs('pending');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });
});