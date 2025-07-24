# API ME

A robust NestJS API with SQLite database, featuring job queue management and transaction processing with pessimistic locking mechanisms.

## Features

🚀 **NestJS Framework** - Modern TypeScript backend framework  
🗄️ **SQLite + Drizzle ORM** - Lightweight database with type-safe ORM  
⚡ **Job Queue System** - Asynchronous job processing with worker management  
💰 **Transaction Processing** - Financial transaction handling with status tracking  
🔒 **Pessimistic Locking** - Concurrency control for safe multi-worker operations  
🧪 **Comprehensive Testing** - Unit and integration tests with Vitest  
🔄 **Database Migrations** - Schema versioning with Drizzle Kit  

## Architecture

```
src/
├── controllers/        # API endpoints
├── services/          # Business logic
├── schemas/           # Database schemas
├── database/          # Database connection
└── test/             # Test utilities
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/galenzo17/api_me.git
cd api_me

# Install dependencies
npm install

# Set up database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create a new job |
| GET | `/jobs` | List all jobs (with optional status filter) |
| GET | `/jobs/:id` | Get job by ID |
| POST | `/jobs/process` | Process next available job |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transactions` | Create a new transaction |
| GET | `/transactions` | List all transactions (with optional status filter) |
| GET | `/transactions/:id` | Get transaction by ID |
| POST | `/transactions/:id/process` | Process specific transaction |
| POST | `/transactions/:id/cancel` | Cancel specific transaction |

## Usage Examples

### Creating a Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Process User Data",
    "description": "Clean and validate user information",
    "priority": 5,
    "payload": {"userId": 123}
  }'
```

### Processing Jobs

```bash
curl -X POST http://localhost:3000/jobs/process \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001"}'
```

### Creating a Transaction

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "credit",
    "amount": 100.50,
    "currency": "USD",
    "description": "Payment received",
    "fromAccount": "acc-123",
    "toAccount": "acc-456"
  }'
```

### Processing a Transaction

```bash
curl -X POST http://localhost:3000/transactions/1/process \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001"}'
```

## Database Schema

### Jobs Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| title | TEXT | Job title |
| description | TEXT | Job description |
| status | TEXT | pending, running, completed, failed |
| priority | INTEGER | Job priority (higher = more important) |
| payload | JSON | Job data payload |
| attempts | INTEGER | Number of processing attempts |
| maxAttempts | INTEGER | Maximum retry attempts |
| lockedAt | TIMESTAMP | When job was locked |
| lockedBy | TEXT | Worker ID that locked the job |
| createdAt | TIMESTAMP | Creation timestamp |
| scheduledAt | TIMESTAMP | When job should run |

### Transactions Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| type | TEXT | debit or credit |
| amount | REAL | Transaction amount |
| currency | TEXT | Currency code (default: USD) |
| status | TEXT | pending, processing, completed, failed, cancelled |
| fromAccount | TEXT | Source account |
| toAccount | TEXT | Destination account |
| lockedAt | TIMESTAMP | When transaction was locked |
| lockedBy | TEXT | Worker ID that locked the transaction |
| createdAt | TIMESTAMP | Creation timestamp |
| processedAt | TIMESTAMP | When transaction was processed |

## Pessimistic Locking

The API implements pessimistic locking to ensure safe concurrent processing:

- **Jobs**: Only one worker can process a job at a time
- **Transactions**: Prevents double-spending and race conditions
- **Automatic Cleanup**: Expired locks are automatically released
- **Lock Timeout**: 30-second timeout prevents deadlocks

## Testing

Run the comprehensive test suite:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

### Test Coverage

- **Unit Tests**: Services (JobService, TransactionService, LockService)
- **Integration Tests**: Controllers (JobController, TransactionController)
- **Database Tests**: In-memory SQLite for isolated testing

## Development

### Available Scripts

```bash
npm run start:dev      # Development server with hot reload
npm run start:debug    # Debug mode
npm run build          # Build for production
npm run start:prod     # Production server

npm run db:generate    # Generate database migrations
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio (database GUI)

npm test              # Run tests in watch mode
npm run test:coverage # Test coverage report
```

### Database Operations

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open database management interface
npm run db:studio
```

## Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```env
PORT=3000
DATABASE_URL=./database.db
LOCK_TIMEOUT_MS=30000
```

### Database Configuration

Database settings are configured in `drizzle.config.ts`:

```typescript
export default {
  schema: './src/schemas/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database.db',
  },
} satisfies Config;
```

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set up production database**:
   ```bash
   npm run db:migrate
   ```

3. **Start production server**:
   ```bash
   npm run start:prod
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add new feature"`
6. Push to branch: `git push origin feature/new-feature`
7. Create a Pull Request

## Technology Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: SQLite with Drizzle ORM
- **Testing**: Vitest with @nestjs/testing
- **Migration**: Drizzle Kit
- **Validation**: NestJS built-in pipes
- **Documentation**: Auto-generated from TypeScript types

## License

MIT License - see LICENSE file for details

## Repository

🔗 **GitHub**: [https://github.com/galenzo17/api_me](https://github.com/galenzo17/api_me)

---

Built with ❤️ using NestJS and TypeScript