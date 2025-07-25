#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:3000';
const WORKER_COUNT = 5;
const SIMULATION_DURATION = 30000; // 30 seconds
const POLL_INTERVAL = 1000; // 1 second

// Worker colors for visual distinction
const workerColors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

class WorkerSimulator {
  constructor(workerId, color) {
    this.workerId = workerId;
    this.color = color;
    this.jobsProcessed = 0;
    this.transactionsProcessed = 0;
    this.isRunning = true;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${this.workerId}]`;
    
    switch (type) {
      case 'success':
        console.log(`${prefix} ✅ ${message}`[this.color]);
        break;
      case 'error':
        console.log(`${prefix} ❌ ${message}`[this.color]);
        break;
      case 'lock':
        console.log(`${prefix} 🔒 ${message}`[this.color]);
        break;
      case 'unlock':
        console.log(`${prefix} 🔓 ${message}`[this.color]);
        break;
      default:
        console.log(`${prefix} ℹ️  ${message}`[this.color]);
    }
  }

  async processJobs() {
    while (this.isRunning) {
      try {
        const response = await axios.post(`${API_BASE}/jobs/process`, {
          workerId: this.workerId
        });

        if (response.data.message === 'No jobs available') {
          this.log('No jobs available, waiting...', 'info');
        } else {
          this.log(`Acquired job: ${response.data.job.title}`, 'lock');
          this.log(`Processing job ID ${response.data.job.id}...`, 'info');
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
          
          this.jobsProcessed++;
          this.log(`Completed job: ${response.data.job.title}`, 'success');
        }
      } catch (error) {
        this.log(`Job processing error: ${error.message}`, 'error');
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  async processTransactions() {
    while (this.isRunning) {
      try {
        // Get pending transactions
        const listResponse = await axios.get(`${API_BASE}/transactions?status=pending`);
        const pendingTransactions = listResponse.data;

        if (pendingTransactions.length > 0) {
          // Try to process the first available transaction
          const transaction = pendingTransactions[Math.floor(Math.random() * pendingTransactions.length)];
          
          try {
            const response = await axios.post(`${API_BASE}/transactions/${transaction.id}/process`, {
              workerId: this.workerId
            });

            if (response.data.success) {
              this.log(`Acquired transaction: ${transaction.type} $${transaction.amount}`, 'lock');
              this.transactionsProcessed++;
              this.log(`Processed transaction ID ${transaction.id}`, 'success');
            } else {
              this.log(`Failed to acquire transaction ${transaction.id} (already locked)`, 'info');
            }
          } catch (error) {
            this.log(`Transaction ${transaction.id} processing failed: ${error.response?.data?.message || error.message}`, 'error');
          }
        } else {
          this.log('No pending transactions, waiting...', 'info');
        }
      } catch (error) {
        this.log(`Transaction list error: ${error.message}`, 'error');
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL + Math.random() * 1000));
    }
  }

  async start() {
    this.log(`Starting worker simulation...`, 'info');
    
    // Run both job and transaction processing concurrently
    Promise.all([
      this.processJobs(),
      this.processTransactions()
    ]);
  }

  stop() {
    this.isRunning = false;
    this.log(`Stopping worker. Processed ${this.jobsProcessed} jobs and ${this.transactionsProcessed} transactions.`, 'info');
  }
}

async function waitForAPI() {
  console.log('🔍 Checking API availability...'.cyan);
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      await axios.get(`${API_BASE}/`);
      console.log('✅ API is ready!'.green);
      return true;
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for API... (${attempts}/${maxAttempts})`.yellow);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('❌ API not available after 30 seconds. Make sure the server is running with: npm run start:dev'.red);
  return false;
}

async function showInitialStats() {
  try {
    const [jobsResponse, transactionsResponse] = await Promise.all([
      axios.get(`${API_BASE}/jobs`),
      axios.get(`${API_BASE}/transactions`)
    ]);

    console.log('\n📊 Initial State:'.bold);
    console.log(`   Jobs: ${jobsResponse.data.length} total`.cyan);
    console.log(`   Pending Jobs: ${jobsResponse.data.filter(j => j.status === 'pending').length}`.cyan);
    console.log(`   Transactions: ${transactionsResponse.data.length} total`.cyan);
    console.log(`   Pending Transactions: ${transactionsResponse.data.filter(t => t.status === 'pending').length}`.cyan);
    console.log('');
  } catch (error) {
    console.log('⚠️  Could not fetch initial stats'.yellow);
  }
}

async function showFinalStats() {
  try {
    const [jobsResponse, transactionsResponse] = await Promise.all([
      axios.get(`${API_BASE}/jobs`),
      axios.get(`${API_BASE}/transactions`)
    ]);

    console.log('\n📈 Final Results:'.bold);
    console.log(`   Completed Jobs: ${jobsResponse.data.filter(j => j.status === 'completed').length}`.green);
    console.log(`   Failed Jobs: ${jobsResponse.data.filter(j => j.status === 'failed').length}`.red);
    console.log(`   Completed Transactions: ${transactionsResponse.data.filter(t => t.status === 'completed').length}`.green);
    console.log(`   Failed Transactions: ${transactionsResponse.data.filter(t => t.status === 'failed').length}`.red);
  } catch (error) {
    console.log('⚠️  Could not fetch final stats'.yellow);
  }
}

async function main() {
  console.log('🚀 Starting Concurrency Simulation'.bold.rainbow);
  console.log(`👥 Workers: ${WORKER_COUNT}`.cyan);
  console.log(`⏱️  Duration: ${SIMULATION_DURATION / 1000} seconds`.cyan);
  console.log(`🔄 Poll Interval: ${POLL_INTERVAL}ms`.cyan);
  console.log('─'.repeat(60));

  // Wait for API to be ready
  if (!(await waitForAPI())) {
    process.exit(1);
  }

  await showInitialStats();

  // Create and start workers
  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    const workerId = `WORKER-${String(i + 1).padStart(2, '0')}`;
    const color = workerColors[i % workerColors.length];
    const worker = new WorkerSimulator(workerId, color);
    workers.push(worker);
    worker.start();
  }

  // Run simulation for specified duration
  setTimeout(async () => {
    console.log('\n🛑 Stopping simulation...'.bold.red);
    
    // Stop all workers
    workers.forEach(worker => worker.stop());
    
    // Wait a bit for final operations
    setTimeout(async () => {
      await showFinalStats();
      console.log('\n✨ Simulation completed!'.bold.green);
      process.exit(0);
    }, 2000);
    
  }, SIMULATION_DURATION);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, stopping simulation...'.bold.red);
    workers.forEach(worker => worker.stop());
    await showFinalStats();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Simulation error:', error.message);
    process.exit(1);
  });
}