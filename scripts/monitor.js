#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:3000';
const REFRESH_INTERVAL = 2000; // 2 seconds

class MonitorDashboard {
  constructor() {
    this.isRunning = true;
  }

  clearScreen() {
    process.stdout.write('\x1Bc');
  }

  formatTimestamp() {
    return new Date().toLocaleTimeString();
  }

  drawHeader() {
    const timestamp = this.formatTimestamp();
    console.log('═'.repeat(80).cyan);
    console.log(`🔍 CONCURRENCY MONITOR DASHBOARD`.bold.white.bgBlue + ` - ${timestamp}`.gray);
    console.log('═'.repeat(80).cyan);
    console.log('');
  }

  drawJobsSection(jobStats) {
    console.log('📋 JOBS STATUS'.bold.yellow);
    console.log('─'.repeat(40).gray);
    
    const statusColors = {
      pending: 'yellow',
      running: 'blue',
      completed: 'green',
      failed: 'red'
    };

    Object.entries(jobStats.byStatus || {}).forEach(([status, count]) => {
      const color = statusColors[status] || 'white';
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`  ${status.padEnd(10)} | ${String(count).padStart(3)} ${bar[color]}`);
    });
    
    console.log(`  ${'TOTAL'.padEnd(10)} | ${String(jobStats.total).padStart(3).bold}`);
    console.log('');
  }

  drawTransactionsSection(txStats) {
    console.log('💰 TRANSACTIONS STATUS'.bold.yellow);
    console.log('─'.repeat(40).gray);
    
    const statusColors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray'
    };

    Object.entries(txStats.byStatus || {}).forEach(([status, count]) => {
      const color = statusColors[status] || 'white';
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`  ${status.padEnd(10)} | ${String(count).padStart(3)} ${bar[color]}`);
    });
    
    console.log(`  ${'TOTAL'.padEnd(10)} | ${String(txStats.total).padStart(3).bold}`);
    console.log('');
  }

  drawLocksSection(locks) {
    console.log('🔒 ACTIVE LOCKS'.bold.yellow);
    console.log('─'.repeat(60).gray);
    
    if (locks.count === 0) {
      console.log('  No active locks'.gray);
    } else {
      console.log(`  Total active locks: ${locks.count}`.bold);
      console.log('');
      
      const locksByWorker = locks.locks.reduce((acc, lock) => {
        if (!acc[lock.lockedBy]) {
          acc[lock.lockedBy] = { jobs: [], transactions: [] };
        }
        acc[lock.lockedBy][lock.type + 's'].push(lock);
        return acc;
      }, {});

      Object.entries(locksByWorker).forEach(([workerId, workerLocks]) => {
        console.log(`  👤 ${workerId}`.cyan);
        
        if (workerLocks.jobs.length > 0) {
          workerLocks.jobs.forEach(job => {
            const elapsed = Math.round((Date.now() - new Date(job.lockedAt).getTime()) / 1000);
            console.log(`    🔒 Job ${job.id}: ${job.title.substring(0, 30)}... (${elapsed}s)`.green);
          });
        }
        
        if (workerLocks.transactions.length > 0) {
          workerLocks.transactions.forEach(tx => {
            const elapsed = Math.round((Date.now() - new Date(tx.lockedAt).getTime()) / 1000);
            console.log(`    💎 Transaction ${tx.id}: ${tx.title} (${elapsed}s)`.blue);
          });
        }
      });
    }
    console.log('');
  }

  drawWorkersSection(workers) {
    console.log('👥 ACTIVE WORKERS'.bold.yellow);
    console.log('─'.repeat(50).gray);
    
    if (workers.activeWorkers === 0) {
      console.log('  No active workers'.gray);
    } else {
      console.log(`  Active workers: ${workers.activeWorkers}`.bold);
      console.log('');
      
      Object.entries(workers.workers).forEach(([workerId, stats]) => {
        const totalBar = '█'.repeat(Math.min(stats.total, 10));
        console.log(`  ${workerId.padEnd(12)} | Jobs: ${String(stats.jobs).padStart(2).green} | Tx: ${String(stats.transactions).padStart(2).blue} | Total: ${String(stats.total).padStart(2)} ${totalBar.magenta}`);
      });
    }
    console.log('');
  }

  drawFooter() {
    console.log('─'.repeat(80).gray);
    console.log('Press Ctrl+C to exit | Refreshes every 2 seconds'.gray);
  }

  async fetchSystemStatus() {
    try {
      const response = await axios.get(`${API_BASE}/monitor/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch system status: ${error.message}`);
    }
  }

  async render() {
    try {
      const status = await this.fetchSystemStatus();
      
      this.clearScreen();
      this.drawHeader();
      this.drawJobsSection(status.jobs);
      this.drawTransactionsSection(status.transactions);
      this.drawLocksSection(status.activeLocks);
      this.drawWorkersSection(await this.fetchWorkers());
      this.drawFooter();
      
    } catch (error) {
      console.error('❌ Monitor error:'.red, error.message);
    }
  }

  async fetchWorkers() {
    try {
      const response = await axios.get(`${API_BASE}/monitor/workers`);
      return response.data;
    } catch (error) {
      return { activeWorkers: 0, workers: {} };
    }
  }

  async start() {
    console.log('🚀 Starting Concurrency Monitor...'.cyan);
    console.log('Waiting for API...'.yellow);
    
    // Initial render
    await this.render();
    
    // Set up refresh interval
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.render();
      }
    }, REFRESH_INTERVAL);

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      this.isRunning = false;
      clearInterval(interval);
      console.log('\n\n👋 Monitor stopped.'.yellow);
      process.exit(0);
    });
  }
}

async function main() {
  const monitor = new MonitorDashboard();
  await monitor.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Monitor startup error:', error.message);
    process.exit(1);
  });
}