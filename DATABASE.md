# 🍕 LA SANGUCHERÍA POS - Database Documentation

## 📋 Overview

This document provides comprehensive documentation for the database system of La Sanguchería POS, built with TypeORM and PostgreSQL following Onion Architecture principles.

## 🏗️ Architecture

### Onion Architecture Pattern
- **Domain Layer**: Pure business logic without database dependencies
- **Infrastructure Layer**: Database persistence with `.schema.ts` entities
- **Clear Separation**: Domain entities remain clean of ORM decorators

### Technology Stack
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Framework**: NestJS
- **Caching**: Redis (production)
- **Connection Pooling**: Built-in TypeORM pooling

## 📁 Project Structure

```
src/shared/infrastructure/database/
├── ormconfig.ts                 # TypeORM CLI configuration
├── database.config.ts           # NestJS database configuration
├── database.module.ts           # Main database module
├── helpers/
│   └── migration.helper.ts      # Reusable migration utilities
├── services/
│   └── materialized-views.service.ts  # Views management
├── seeds/
│   ├── seed-runner.ts          # Seed execution engine
│   ├── 01-users.seed.ts        # User seed data
│   ├── 02-products.seed.ts     # Product seed data
│   └── 03-customers.seed.ts    # Customer seed data
└── scripts/
    ├── run-seeds.ts            # Execute all seeds
    ├── rollback-seeds.ts       # Rollback seeds
    └── refresh-views.ts        # Refresh materialized views
```

### Module Structure
```
src/modules/{module}/infrastructure/persistence/
├── entities/
│   └── {entity}.schema.ts      # TypeORM persistence entities
├── repositories/
│   └── {entity}.repository.ts  # Repository implementations
└── mappers/
    └── {entity}.mapper.ts      # Domain <-> Persistence mapping
```

## 🗄️ Database Schema

### Core Tables

#### Users (`users`)
- **Purpose**: System user authentication and authorization
- **Key Fields**: `id`, `email`, `username`, `role`, `is_active`
- **Indexes**: Email (unique), Username (unique), Role
- **Audit**: Full audit trail with created/updated timestamps

#### Products (`products`)
- **Purpose**: Menu items and inventory management
- **Key Fields**: `id`, `sku`, `name`, `category`, `price`, `is_active`
- **Indexes**: SKU (unique), Name (GIN text search), Category, Price
- **Features**: Metadata JSONB, soft delete support

#### Customers (`customers`)
- **Purpose**: Customer relationship management
- **Key Fields**: `id`, `name`, `email`, `phone`, `loyalty_tier`
- **Indexes**: Email (unique), Phone, Loyalty tier, Name (GIN text search)
- **Features**: Address JSONB, preferences JSONB, loyalty points

#### Orders (`orders`)
- **Purpose**: Order management and tracking
- **Key Fields**: `id`, `customer_id`, `status`, `type`, `total`
- **Indexes**: Customer FK, Status, Order date, Type
- **Relations**: One-to-many with order_items, one-to-one with invoices

#### Order Items (`order_items`)
- **Purpose**: Individual items within orders
- **Key Fields**: `order_id`, `product_id`, `quantity`, `unit_price`
- **Indexes**: Order FK, Product FK, Compound (order + product)

#### Invoices (`invoices`)
- **Purpose**: Financial record of completed orders
- **Key Fields**: `id`, `order_id`, `invoice_number`, `status`, `total`
- **Indexes**: Order FK (unique), Invoice number (unique), Status

#### Payments (`payments`)
- **Purpose**: Payment transaction records
- **Key Fields**: `id`, `invoice_id`, `method`, `amount`, `status`
- **Indexes**: Invoice FK, Payment method, Status, Transaction date

### Materialized Views

#### `sales_summary_daily`
- **Purpose**: Daily sales analytics and reporting
- **Refreshed**: Every hour
- **Key Metrics**: Total orders, revenue, customers, payment methods
- **Indexes**: Date (unique), performance optimizations

#### `product_performance`
- **Purpose**: Product popularity and revenue analysis
- **Refreshed**: Every hour
- **Key Metrics**: Sales quantity, revenue, customer reach
- **Indexes**: Product ID (unique), Category

#### `customer_analytics`
- **Purpose**: Customer behavior and loyalty insights
- **Refreshed**: Every hour
- **Key Metrics**: Total spent, order frequency, loyalty metrics
- **Indexes**: Customer ID (unique), Loyalty tier

#### `hourly_performance`
- **Purpose**: Time-based performance analysis
- **Refreshed**: Every 30 minutes (critical)
- **Key Metrics**: Hourly and daily patterns, peak times
- **Indexes**: Hour and day of week compound

## 🚀 Getting Started

### Environment Configuration

Create `.env` file with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lasangucheria_pos
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_SCHEMA=public

# Connection Pool
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis Cache (Production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Environment
NODE_ENV=development
```

### Database Setup

1. **Create Database**:
```bash
createdb lasangucheria_pos
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Run Migrations**:
```bash
npm run migration:run
```

4. **Seed Data**:
```bash
npm run db:seed
```

5. **Refresh Views**:
```bash
npm run views:refresh
```

## 📜 Available Scripts

### Migration Commands
```bash
# Generate new migration
npm run migration:generate src/shared/infrastructure/database/migrations/MigrationName

# Create empty migration
npm run migration:create src/shared/infrastructure/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Drop entire schema (DANGEROUS)
npm run migration:drop
```

### Database Management
```bash
# Run all seeds
npm run db:seed

# Rollback seeds
npm run db:seed:rollback

# Full database refresh (drop + migrate + seed)
npm run db:refresh

# Reset database (revert + run + seed)
npm run db:reset

# Sync schema (development only)
npm run schema:sync

# View schema log
npm run schema:log

# Execute custom query
npm run query "SELECT COUNT(*) FROM products;"

# Clear query cache
npm run cache:clear
```

### View Management
```bash
# Refresh all materialized views
npm run views:refresh
```

## 🔧 Development Guidelines

### Creating Entities

1. **Domain Entity** (Pure business logic):
```typescript
// src/modules/products/domain/entities/product.entity.ts
export class Product {
  constructor(
    private readonly id: ProductId,
    private readonly sku: string,
    private name: string,
    // ... domain properties
  ) {}
  
  // Business methods only, no ORM decorators
}
```

2. **Persistence Entity** (Infrastructure):
```typescript
// src/modules/products/infrastructure/persistence/entities/product.schema.ts
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('products')
@Index(['name'], { type: 'gin', parser: 'gin_trgm_ops' })
export class ProductEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;
  
  // ... TypeORM decorators and mappings
}
```

### Writing Migrations

Use the `MigrationHelper` for common operations:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationHelper } from '../helpers/migration.helper';

export class CreateProductsTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const helper = new MigrationHelper(queryRunner);
    
    // Add audit columns with triggers
    await helper.addAuditColumns('products');
    
    // Create text search index
    await helper.createGinTextSearchIndex({
      tableName: 'products',
      columnNames: ['name', 'description']
    });
    
    // Add soft delete
    await helper.addSoftDeleteColumn('products');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

### Seed Development

Follow the `Seed` interface:

```typescript
import { DataSource } from 'typeorm';
import { Seed } from './seed-runner';

export class ProductsSeed implements Seed {
  name = 'ProductsSeed';
  priority = 2; // Execution order

  async run(dataSource: DataSource): Promise<void> {
    // Implementation with idempotency checks
  }

  async rollback(dataSource: DataSource): Promise<void> {
    // Cleanup implementation
  }
}
```

## 📊 Performance Optimization

### Indexing Strategy

1. **Primary Keys**: UUID with B-tree indexes
2. **Foreign Keys**: Automatic indexing for referential integrity
3. **Text Search**: GIN indexes with pg_trgm for fuzzy search
4. **Partial Indexes**: For soft delete and status filtering
5. **Compound Indexes**: For common query patterns

### Query Optimization

1. **Materialized Views**: Pre-computed aggregations
2. **Connection Pooling**: Optimal connection reuse
3. **Query Cache**: Redis caching in production
4. **Pagination**: Cursor-based for large datasets

### Monitoring

1. **Query Performance**: Built-in logging in development
2. **Connection Health**: Health checks and monitoring
3. **View Refresh**: Automated scheduling and alerts

## 🔒 Security Best Practices

### Data Protection
- Row-level security (RLS) ready infrastructure
- Encrypted sensitive data storage
- Audit trails for all modifications
- Secure connection with SSL in production

### Access Control
- Role-based permissions
- Connection string encryption
- Environment-specific configurations
- Database user privilege limitations

## 🚀 Production Deployment

### Prerequisites
- PostgreSQL 14+ with required extensions
- Redis for caching and sessions
- Proper backup strategy
- Monitoring and alerting setup

### Performance Settings
```bash
# PostgreSQL Configuration Recommendations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 80MB
max_wal_size = 1GB
```

### Backup Strategy
```bash
# Daily automated backups
pg_dump --format=custom --no-privileges --no-owner \
        --host=$DB_HOST --port=$DB_PORT \
        --username=$DB_USER $DB_NAME > backup_$(date +%Y%m%d).sql

# Point-in-time recovery setup
# Ensure WAL archiving is configured
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
   - Check `DB_POOL_MAX` configuration
   - Monitor long-running queries
   - Verify connection cleanup in repositories

2. **Migration Failures**
   - Run migrations in transaction-safe environment
   - Check for naming conflicts
   - Verify user permissions

3. **Performance Issues**
   - Analyze slow query log
   - Check index usage with `EXPLAIN ANALYZE`
   - Monitor materialized view refresh times

4. **Seed Data Issues**
   - Verify foreign key dependencies
   - Check for duplicate key violations
   - Ensure proper rollback implementation

### Debugging Commands

```bash
# Check database connections
SELECT * FROM pg_stat_activity WHERE datname = 'lasangucheria_pos';

# View table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size 
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check materialized view status
SELECT * FROM pg_matviews;

# Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM products WHERE name ILIKE '%sandwich%';
```

## 📈 Monitoring and Maintenance

### Regular Tasks
- **Daily**: Backup verification
- **Weekly**: Index maintenance and statistics update
- **Monthly**: Performance review and optimization
- **Quarterly**: Capacity planning and scaling review

### Health Checks
The system includes automated health checks for:
- Database connectivity
- Connection pool status
- Materialized view freshness
- Query performance metrics

---

## 📞 Support

For database-related issues or questions:
- Check this documentation first
- Review logs in the application
- Verify environment configuration
- Contact the development team with specific error messages and context

---

*Last updated: January 2024*
*Version: 1.0.0*