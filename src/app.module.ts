import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobController } from './controllers/job.controller';
import { TransactionController } from './controllers/transaction.controller';
import { MonitorController } from './controllers/monitor.controller';
import { JobService } from './services/job.service';
import { TransactionService } from './services/transaction.service';
import { LockService } from './services/lock.service';

@Module({
  imports: [],
  controllers: [AppController, JobController, TransactionController, MonitorController],
  providers: [AppService, JobService, TransactionService, LockService],
})
export class AppModule {}