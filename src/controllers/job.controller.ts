import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { JobService, CreateJobDto } from '../services/job.service';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async createJob(@Body() createJobDto: CreateJobDto) {
    return this.jobService.createJob(createJobDto);
  }

  @Get()
  async getAllJobs(@Query('status') status?: string) {
    return this.jobService.getAllJobs(status);
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobService.getJobById(parseInt(id));
  }

  @Post('process')
  async processNextJob(@Body('workerId') workerId: string) {
    const job = await this.jobService.getNextJob(workerId);
    if (!job) {
      return { message: 'No jobs available' };
    }

    try {
      await this.jobService.updateJobStatus(job.id, 'running', workerId);
      
      // Simulate job processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.jobService.updateJobStatus(job.id, 'completed', workerId);
      
      return { message: 'Job completed successfully', job };
    } catch (error) {
      await this.jobService.updateJobStatus(job.id, 'failed', workerId, error.message);
      throw error;
    }
  }
}