#!/bin/bash

# CRM Data Backup Script
# Creates timestamped backup with all CRM data
# Usage: ./scripts/backup_crm.sh

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Use supabase db sql for database operations
run_sql() {
    echo "$1" | supabase db sql
}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting CRM Data Backup...${NC}"
echo -e "Timestamp: ${TIMESTAMP}"

# Create backup directory
echo -e "${YELLOW}📁 Creating backup directory...${NC}"
mkdir -p "${BACKUP_PATH}"

# Function to backup a table
backup_table() {
    local table_name=$1
    local file_path="${BACKUP_PATH}/${table_name}_backup.csv"
    
    echo -e "${YELLOW}📋 Backing up ${table_name} table...${NC}"
    
    # Check if table exists and has data
    local count=$(run_sql "SELECT COUNT(*) FROM ${table_name};" | tail -n 1 | tr -d ' ')
    
    if [ "$count" -gt 0 ]; then
        run_sql "\copy (SELECT * FROM ${table_name} ORDER BY created_at) TO '${file_path}' WITH CSV HEADER;"
        echo -e "${GREEN}✅ ${table_name}: ${count} records backed up${NC}"
    else
        echo -e "${YELLOW}⚠️  ${table_name}: No records found${NC}"
        # Create empty file with headers only
        run_sql "\copy (SELECT * FROM ${table_name} LIMIT 0) TO '${file_path}' WITH CSV HEADER;"
    fi
}

# Backup all tables
backup_table "customers"
backup_table "jobs" 
backup_table "quotes"
backup_table "invoices"

# Create backup metadata
echo -e "${YELLOW}📊 Creating backup metadata...${NC}"
psql "${DB_URL}" -c "
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM customers
UNION ALL
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM jobs
UNION ALL
SELECT 
    'quotes' as table_name,
    COUNT(*) as record_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM quotes
UNION ALL
SELECT 
    'invoices' as table_name,
    COUNT(*) as record_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record,
    CURRENT_TIMESTAMP as backup_timestamp
FROM invoices;
" > "${BACKUP_PATH}/backup_metadata.txt"

# Create backup summary file
echo -e "${YELLOW}📝 Creating backup summary...${NC}"
cat > "${BACKUP_PATH}/backup_info.txt" << EOF
CRM Data Backup Summary
======================

Backup Timestamp: ${TIMESTAMP}
Backup Path: ${BACKUP_PATH}
Database URL: ${DB_URL}

Files Created:
- customers_backup.csv
- jobs_backup.csv  
- quotes_backup.csv
- invoices_backup.csv
- backup_metadata.txt
- backup_info.txt

To restore this backup, use:
./scripts/restore_crm.sh ${TIMESTAMP}

Backup completed at: $(date)
EOF

# Calculate total file size
TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${BLUE}📦 Backup location: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}📏 Total size: ${TOTAL_SIZE}${NC}"
echo -e "${BLUE}🔧 To restore: ./scripts/restore_crm.sh ${TIMESTAMP}${NC}"
