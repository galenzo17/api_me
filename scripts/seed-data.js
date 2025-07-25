#!/usr/bin/env node

const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');

// Connect to database
const sqlite = new Database('./database.db');
const db = drizzle(sqlite);

console.log('🌱 Seeding test data for concurrency simulation...\n');

// Clear existing data
console.log('🧹 Clearing existing data...');
sqlite.exec('DELETE FROM jobs');
sqlite.exec('DELETE FROM transactions');

// Create jobs for simulation
console.log('📝 Creating jobs...');
const jobs = [
  { title: 'Process User Registration', description: 'Validate and create user account', priority: 10 },
  { title: 'Send Welcome Email', description: 'Send welcome email to new user', priority: 8 },
  { title: 'Generate Report', description: 'Monthly analytics report', priority: 5 },
  { title: 'Backup Database', description: 'Create daily database backup', priority: 3 },
  { title: 'Process Payment', description: 'Handle credit card payment', priority: 9 },
  { title: 'Update Inventory', description: 'Sync inventory with warehouse', priority: 7 },
  { title: 'Send Newsletter', description: 'Weekly newsletter to subscribers', priority: 4 },
  { title: 'Cleanup Temp Files', description: 'Remove temporary files older than 7 days', priority: 2 },
  { title: 'Process Refund', description: 'Handle customer refund request', priority: 8 },
  { title: 'Generate Invoice', description: 'Create monthly invoice', priority: 6 }
];

for (const job of jobs) {
  const result = sqlite.prepare(`
    INSERT INTO jobs (title, description, priority, status, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', unixepoch(), unixepoch())
  `).run(job.title, job.description, job.priority);
  console.log(`  ✅ Job ${result.lastInsertRowid}: ${job.title} (Priority: ${job.priority})`);
}

// Create transactions for simulation
console.log('\n💰 Creating transactions...');
const transactions = [
  { type: 'credit', amount: 100.50, description: 'Payment from customer A', fromAccount: 'ext-001', toAccount: 'acc-main' },
  { type: 'debit', amount: 50.25, description: 'Refund to customer B', fromAccount: 'acc-main', toAccount: 'ext-002' },
  { type: 'credit', amount: 200.00, description: 'Subscription payment', fromAccount: 'ext-003', toAccount: 'acc-main' },
  { type: 'debit', amount: 75.80, description: 'Withdrawal request', fromAccount: 'acc-main', toAccount: 'ext-004' },
  { type: 'credit', amount: 150.30, description: 'Product purchase', fromAccount: 'ext-005', toAccount: 'acc-main' },
  { type: 'debit', amount: 25.00, description: 'Service fee', fromAccount: 'acc-main', toAccount: 'acc-fees' },
  { type: 'credit', amount: 300.75, description: 'Large order payment', fromAccount: 'ext-006', toAccount: 'acc-main' },
  { type: 'debit', amount: 120.45, description: 'Vendor payment', fromAccount: 'acc-main', toAccount: 'ext-007' }
];

for (const tx of transactions) {
  const result = sqlite.prepare(`
    INSERT INTO transactions (type, amount, description, from_account, to_account, status, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', 'USD', unixepoch(), unixepoch())
  `).run(tx.type, tx.amount, tx.description, tx.fromAccount, tx.toAccount);
  console.log(`  ✅ Transaction ${result.lastInsertRowid}: ${tx.type} $${tx.amount} - ${tx.description}`);
}

console.log('\n✨ Test data seeded successfully!');
console.log(`📊 Created ${jobs.length} jobs and ${transactions.length} transactions`);

sqlite.close();