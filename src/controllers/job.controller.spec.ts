import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from '../services/job.service';
import { LockService } from '../services/lock.service';

describe('JobController', () => {
  let controller: JobController;
  let jobService: JobService;

  const mockJobService = {
    createJob: vi.fn(),
    getAllJobs: vi.fn(),
    getJobById: vi.fn(),
    getNextJob: vi.fn(),
    updateJobStatus: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: mockJobService,
        },
        {
          provide: LockService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);
    jobService = module.get<JobService>(JobService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const createJobDto = {
        title: 'Test Job',
        description: 'Test description',
        priority: 5
      };

      const expectedJob = {
        id: 1,
        ...createJobDto,
        status: 'pending',
        createdAt: new Date()
      };

      mockJobService.createJob.mockResolvedValue(expectedJob);

      const result = await controller.createJob(createJobDto);

      expect(mockJobService.createJob).toHaveBeenCalledWith(createJobDto);
      expect(result).toEqual(expectedJob);
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      const expectedJobs = [
        { id: 1, title: 'Job 1', status: 'pending' },
        { id: 2, title: 'Job 2', status: 'completed' }
      ];

      mockJobService.getAllJobs.mockResolvedValue(expectedJobs);

      const result = await controller.getAllJobs();

      expect(mockJobService.getAllJobs).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedJobs);
    });

    it('should return jobs filtered by status', async () => {
      const expectedJobs = [
        { id: 1, title: 'Job 1', status: 'pending' }
      ];

      mockJobService.getAllJobs.mockResolvedValue(expectedJobs);

      const result = await controller.getAllJobs('pending');

      expect(mockJobService.getAllJobs).toHaveBeenCalledWith('pending');
      expect(result).toEqual(expectedJobs);
    });
  });

  describe('getJobById', () => {
    it('should return job by id', async () => {
      const expectedJob = {
        id: 1,
        title: 'Test Job',
        status: 'pending'
      };

      mockJobService.getJobById.mockResolvedValue(expectedJob);

      const result = await controller.getJobById('1');

      expect(mockJobService.getJobById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedJob);
    });
  });

  describe('processNextJob', () => {
    it('should process next available job successfully', async () => {
      const mockJob = {
        id: 1,
        title: 'Test Job',
        status: 'pending'
      };

      mockJobService.getNextJob.mockResolvedValue(mockJob);
      mockJobService.updateJobStatus.mockResolvedValue(undefined);

      const result = await controller.processNextJob('worker-1');

      expect(mockJobService.getNextJob).toHaveBeenCalledWith('worker-1');
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(1, 'running', 'worker-1');
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(1, 'completed', 'worker-1');
      expect(result.message).toBe('Job completed successfully');
      expect(result.job).toEqual(mockJob);
    });

    it('should return message when no jobs available', async () => {
      mockJobService.getNextJob.mockResolvedValue(null);

      const result = await controller.processNextJob('worker-1');

      expect(result.message).toBe('No jobs available');
    });

    it('should handle job processing error', async () => {
      const mockJob = {
        id: 1,
        title: 'Test Job',
        status: 'pending'
      };

      const error = new Error('Processing failed');

      mockJobService.getNextJob.mockResolvedValue(mockJob);
      mockJobService.updateJobStatus
        .mockResolvedValueOnce(undefined) // For 'running' status
        .mockRejectedValueOnce(error); // Simulate error during processing

      await expect(controller.processNextJob('worker-1')).rejects.toThrow('Processing failed');

      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(1, 'failed', 'worker-1', 'Processing failed');
    });
  });
});