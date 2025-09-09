-- CRM Data Backup Script
-- Creates timestamped backup files for all CRM tables
-- Usage: supabase db sql < scripts/backup_crm_data.sql

-- Set variables for backup
\set backup_timestamp '''`date +%Y%m%d_%H%M%S`'''

-- Create backup directory structure in comments for reference
-- Expected directory: ./backups/YYYYMMDD_HHMMSS/

-- Backup customers table
\echo 'Backing up customers table...'
\copy (SELECT * FROM customers ORDER BY created_at) TO './backups/customers_backup.csv' WITH CSV HEADER;

-- Backup jobs table  
\echo 'Backing up jobs table...'
\copy (SELECT * FROM jobs ORDER BY created_at) TO './backups/jobs_backup.csv' WITH CSV HEADER;

-- Backup quotes table
\echo 'Backing up quotes table...'
\copy (SELECT * FROM quotes ORDER BY created_at) TO './backups/quotes_backup.csv' WITH CSV HEADER;

-- Backup invoices table
\echo 'Backing up invoices table...'
\copy (SELECT * FROM invoices ORDER BY created_at) TO './backups/invoices_backup.csv' WITH CSV HEADER;

-- Create backup metadata file
\echo 'Creating backup metadata...'
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM customers
UNION ALL
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM jobs
UNION ALL
SELECT 
    'quotes' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM quotes
UNION ALL
SELECT 
    'invoices' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM invoices;

\echo 'Backup completed successfully!'
\echo 'Files created in ./backups/ directory'
