# 🗄️ Database Workflow & Management Guide

## 📋 **Overview**

This guide covers the complete database workflow for the SRVC CRM, including migrations, backups, and maintenance procedures.

## 🏗️ **Database Architecture**

### **Core Tables**
- **`customers`** - Customer profiles and contact information
- **`jobs`** - Service jobs and tracking
- **`quotes`** - Quote generation and management
- **`invoices`** - Invoice creation and payment tracking
- **`subscription_plans`** - SaaS subscription tiers
- **`user_subscriptions`** - User subscription management

### **Security Features**
- **Row Level Security (RLS)** - Users can only access their own data
- **Foreign Key Constraints** - Data integrity enforcement
- **Type Safety** - PostgreSQL type checking
- **Audit Trails** - Created/updated timestamps

## 🔄 **Migration Workflow**

### **Creating New Migrations**

1. **Create Migration File**
```bash
# Generate new migration
supabase migration new <migration_name>

# Example
supabase migration new add_customer_notes_field
```

2. **Write Migration SQL**
```sql
-- Example migration: 20240908000000_add_customer_notes_field.sql

-- Add new column
ALTER TABLE customers 
ADD COLUMN notes TEXT;

-- Update RLS policy if needed
DROP POLICY IF EXISTS "Users can access own customers" ON customers;
CREATE POLICY "Users can access own customers" 
  ON customers FOR ALL 
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON COLUMN customers.notes IS 'Internal notes about the customer';
```

3. **Test Migration Locally**
```bash
# Apply migration to local database
supabase db push

# Verify changes
supabase db inspect --table customers
```

### **Safe Migration Process**

#### **Step 1: Backup Before Migration**
```bash
# Automatic backup before migration
./scripts/backup-db.sh production

# Manual backup with custom name
./scripts/backup-db.sh production migration_backup_$(date +%Y%m%d_%H%M%S)
```

#### **Step 2: Test in Staging**
```bash
# Deploy to staging first
supabase db push --project-ref staging-project-id

# Test application functionality
npm run build
npm run test
```

#### **Step 3: Deploy to Production**
```bash
# Deploy with safety checks
./scripts/deploy.sh production main

# Or manual deployment
supabase db push --project-ref production-project-id
```

## 🔧 **Database Management Commands**

### **Inspection & Monitoring**
```bash
# Check table structure
supabase db inspect --table customers

# View all tables
supabase db inspect

# Check database status
supabase status

# View logs
supabase logs
```

### **Schema Management**
```bash
# Generate schema diff
supabase db diff

# Reset local database (DANGER!)
supabase db reset

# Pull remote schema changes
supabase db pull
```

### **Data Management**
```bash
# Seed development data
supabase db seed

# Export data
supabase db dump --data-only > data_export.sql

# Import data
psql -h localhost -p 54322 -d postgres -U postgres < data_export.sql
```

## 📊 **Backup & Recovery**

### **Automated Backup Strategy**

#### **Daily Backups**
```bash
# Set up cron job for daily backups
0 2 * * * cd /path/to/project && ./scripts/backup-db.sh production
```

#### **Backup Types**
1. **Schema Only** - Structure without data
2. **Data Only** - Data without structure  
3. **Full Backup** - Complete database dump
4. **Incremental** - Changes since last backup

### **Manual Backup Commands**
```bash
# Full backup with timestamp
./scripts/backup-db.sh production

# Schema only backup
./scripts/backup-db.sh production --schema-only

# Data only backup  
./scripts/backup-db.sh production --data-only

# Custom backup location
./scripts/backup-db.sh production --output ./custom/backup/location
```

### **Recovery Procedures**

#### **Complete Database Restore**
```bash
# 1. Stop application
# 2. Restore from backup
./scripts/restore-db.sh ./backups/database/backup_20240908_120000.sql

# 3. Verify data integrity
supabase db inspect

# 4. Restart application
```

#### **Partial Data Recovery**
```sql
-- Restore specific table from backup
-- 1. Create temporary table
CREATE TABLE customers_backup AS SELECT * FROM customers WHERE false;

-- 2. Import backup data
\copy customers_backup FROM 'backup_customers.csv' CSV HEADER;

-- 3. Merge data as needed
INSERT INTO customers SELECT * FROM customers_backup WHERE ...;
```

## 🛡️ **Security & Access Control**

### **Row Level Security (RLS) Patterns**

#### **User Data Isolation**
```sql
-- Standard user data policy
CREATE POLICY "users_own_data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

#### **Admin Access**
```sql
-- Admin can see all data
CREATE POLICY "admin_full_access" ON table_name
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
```

#### **Shared Data**
```sql
-- Publicly readable data
CREATE POLICY "public_read" ON subscription_plans
  FOR SELECT USING (is_active = true);
```

### **Database Security Checklist**
- ✅ **RLS Enabled** on all tables
- ✅ **Foreign Keys** enforce relationships
- ✅ **Input Validation** via application layer
- ✅ **API Keys** properly scoped
- ✅ **Backup Encryption** (Supabase handles this)
- ✅ **Access Logging** enabled

## 🚨 **Troubleshooting Common Issues**

### **Migration Failures**
```bash
# Check migration status
supabase migration list

# Fix failed migration
supabase migration repair <migration_id>

# Rollback migration (manual)
# Create reverse migration file
```

### **Connection Issues**
```bash
# Test database connection
supabase db ping

# Check connection string
echo $SUPABASE_DB_URL

# Verify project status
supabase projects list
```

### **Performance Issues**
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
```

### **Data Integrity Issues**
```sql
-- Check for orphaned records
SELECT j.* FROM jobs j 
LEFT JOIN customers c ON j.customer_id = c.id 
WHERE c.id IS NULL;

-- Fix foreign key violations
DELETE FROM jobs WHERE customer_id NOT IN (SELECT id FROM customers);
```

## 📈 **Performance Optimization**

### **Database Indexes**
```sql
-- Essential indexes for CRM performance
CREATE INDEX CONCURRENTLY idx_customers_email ON customers(email);
CREATE INDEX CONCURRENTLY idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX CONCURRENTLY idx_quotes_created_at ON quotes(created_at);
CREATE INDEX CONCURRENTLY idx_invoices_due_date ON invoices(due_date);
```

### **Query Optimization**
```sql
-- Use EXPLAIN ANALYZE for query planning
EXPLAIN ANALYZE SELECT * FROM jobs 
WHERE user_id = auth.uid() AND status = 'pending';

-- Optimize with proper indexes and conditions
```

### **Connection Pooling**
- **Supabase** handles connection pooling automatically
- **Application Level** - Use connection pooling in production
- **Monitor** connection usage via Supabase dashboard

## 🔄 **Environment Management**

### **Development Setup**
```bash
# Start local Supabase
supabase start

# Apply all migrations
supabase db push

# Seed test data
supabase db seed
```

### **Staging Environment**
```bash
# Deploy to staging
supabase link --project-ref staging-project-id
supabase db push

# Run integration tests
npm run test:integration
```

### **Production Deployment**
```bash
# Pre-deployment checklist
# ✅ Staging tests pass
# ✅ Database backup complete  
# ✅ Migration tested
# ✅ Rollback plan ready

# Deploy with safety script
./scripts/deploy.sh production main
```

## 📋 **Maintenance Schedule**

### **Daily Tasks**
- ✅ **Automated Backups** - 2 AM daily
- ✅ **Performance Monitoring** - Via Supabase dashboard
- ✅ **Error Log Review** - Check for issues

### **Weekly Tasks**
- ✅ **Full Database Backup** - Sunday 1 AM
- ✅ **Index Usage Analysis** - Optimize as needed
- ✅ **Storage Usage Review** - Monitor growth

### **Monthly Tasks**
- ✅ **Backup Retention Cleanup** - Remove old backups
- ✅ **Security Review** - Check access patterns
- ✅ **Performance Tuning** - Optimize slow queries

## 🎯 **Best Practices**

### **Migration Guidelines**
1. **Always backup** before migrations
2. **Test in staging** first
3. **Make reversible changes** when possible
4. **Document breaking changes**
5. **Use descriptive migration names**

### **Data Management**
1. **Validate inputs** at application layer
2. **Use transactions** for multi-table operations
3. **Monitor query performance**
4. **Regular data cleanup**
5. **Archive old data** as needed

### **Security Practices**
1. **Principle of least privilege**
2. **Regular access reviews**
3. **Monitor for suspicious activity**
4. **Keep Supabase updated**
5. **Secure backup storage**

---

## 🚨 **Emergency Procedures**

### **Database Corruption**
1. **Stop application** immediately
2. **Assess damage** scope
3. **Restore from backup**
4. **Verify data integrity**
5. **Resume operations**

### **Performance Crisis**
1. **Identify bottleneck** queries
2. **Add emergency indexes**
3. **Scale database** if needed
4. **Monitor recovery**

### **Security Incident**
1. **Change all credentials**
2. **Review access logs**
3. **Assess data exposure**
4. **Implement fixes**
5. **Document incident**

**For urgent database issues, check Supabase status page and contact their support team.**
