import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TransactionService, CreateTransactionDto } from '../services/transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(createTransactionDto);
  }

  @Get()
  async getAllTransactions(@Query('status') status?: string) {
    return this.transactionService.getAllTransactions(status);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.transactionService.getTransactionById(parseInt(id));
  }

  @Post(':id/process')
  async processTransaction(@Param('id') id: string, @Body('workerId') workerId: string) {
    const success = await this.transactionService.processTransaction(parseInt(id), workerId);
    return { success, message: success ? 'Transaction processed successfully' : 'Failed to process transaction' };
  }

  @Post(':id/cancel')
  async cancelTransaction(@Param('id') id: string, @Body('workerId') workerId: string) {
    const success = await this.transactionService.cancelTransaction(parseInt(id), workerId);
    return { success, message: success ? 'Transaction cancelled successfully' : 'Failed to cancel transaction' };
  }
}