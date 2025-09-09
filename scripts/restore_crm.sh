#!/bin/bash

# CRM Data Restore Script
# Restores data from timestamped backup
# Usage: ./scripts/restore_crm.sh [TIMESTAMP] [--force]

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
FORCE_RESTORE=false

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Backup timestamp required${NC}"
    echo "Usage: $0 [TIMESTAMP] [--force]"
    echo "Available backups:"
    ls -la "${BACKUP_DIR}" 2>/dev/null || echo "No backups found"
    exit 1
fi

TIMESTAMP=$1
if [ "$2" = "--force" ]; then
    FORCE_RESTORE=true
fi

BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

# Validate backup exists
if [ ! -d "${BACKUP_PATH}" ]; then
    echo -e "${RED}❌ Error: Backup not found at ${BACKUP_PATH}${NC}"
    echo "Available backups:"
    ls -la "${BACKUP_DIR}" 2>/dev/null || echo "No backups found"
    exit 1
fi

echo -e "${BLUE}🔄 Starting CRM Data Restore...${NC}"
echo -e "Restoring from: ${BACKUP_PATH}"

# Check for existing data
check_existing_data() {
    local table_name=$1
    local count=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM ${table_name};" 2>/dev/null || echo "0")
    count=$(echo $count | tr -d ' ')  # Remove whitespace
    echo $count
}

# Warn about existing data
EXISTING_CUSTOMERS=$(check_existing_data "customers")
EXISTING_JOBS=$(check_existing_data "jobs") 
EXISTING_QUOTES=$(check_existing_data "quotes")
EXISTING_INVOICES=$(check_existing_data "invoices")

if [ "$EXISTING_CUSTOMERS" -gt 0 ] || [ "$EXISTING_JOBS" -gt 0 ] || [ "$EXISTING_QUOTES" -gt 0 ] || [ "$EXISTING_INVOICES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Existing data found:${NC}"
    echo -e "   Customers: ${EXISTING_CUSTOMERS}"
    echo -e "   Jobs: ${EXISTING_JOBS}"
    echo -e "   Quotes: ${EXISTING_QUOTES}" 
    echo -e "   Invoices: ${EXISTING_INVOICES}"
    
    if [ "$FORCE_RESTORE" = false ]; then
        echo -e "${RED}This restore will DELETE all existing data!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${BLUE}Restore cancelled.${NC}"
            exit 0
        fi
    fi
fi

# Function to restore a table
restore_table() {
    local table_name=$1
    local file_path="${BACKUP_PATH}/${table_name}_backup.csv"
    
    if [ ! -f "${file_path}" ]; then
        echo -e "${YELLOW}⚠️  ${table_name}: Backup file not found, skipping${NC}"
        return
    fi
    
    echo -e "${YELLOW}📋 Restoring ${table_name} table...${NC}"
    
    # Clear existing data
    psql "${DB_URL}" -c "DELETE FROM ${table_name};"
    
    # Count records in backup file (subtract 1 for header)
    local backup_count=$(($(wc -l < "${file_path}") - 1))
    
    if [ "$backup_count" -gt 0 ]; then
        # Restore data
        psql "${DB_URL}" -c "\copy ${table_name} FROM '${file_path}' WITH CSV HEADER;"
        
        # Verify restore
        local restored_count=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM ${table_name};" | tr -d ' ')
        
        if [ "$restored_count" -eq "$backup_count" ]; then
            echo -e "${GREEN}✅ ${table_name}: ${restored_count} records restored${NC}"
        else
            echo -e "${RED}❌ ${table_name}: Expected ${backup_count}, got ${restored_count} records${NC}"
        fi
    else
        echo -e "${YELLOW}📋 ${table_name}: No records to restore${NC}"
    fi
}

# Clear and restore all tables
echo -e "${YELLOW}🗑️  Clearing existing data...${NC}"

# Restore in dependency order (customers first, then related tables)
restore_table "customers"
restore_table "jobs"
restore_table "quotes" 
restore_table "invoices"

# Reset sequences to prevent ID conflicts
echo -e "${YELLOW}🔧 Resetting ID sequences...${NC}"
psql "${DB_URL}" -c "
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM customers;
SELECT setval(pg_get_serial_sequence('jobs', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM jobs;
SELECT setval(pg_get_serial_sequence('quotes', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM quotes;
SELECT setval(pg_get_serial_sequence('invoices', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM invoices;
"

# Show backup metadata if available
if [ -f "${BACKUP_PATH}/backup_metadata.txt" ]; then
    echo -e "${BLUE}📊 Original backup metadata:${NC}"
    cat "${BACKUP_PATH}/backup_metadata.txt"
fi

# Verify restore integrity
echo -e "${YELLOW}🔍 Verifying restore integrity...${NC}"
psql "${DB_URL}" -c "
SELECT 
    'customers' as table_name,
    COUNT(*) as restored_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record
FROM customers
UNION ALL
SELECT 
    'jobs' as table_name,
    COUNT(*) as restored_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record
FROM jobs
UNION ALL
SELECT 
    'quotes' as table_name,
    COUNT(*) as restored_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record
FROM quotes
UNION ALL
SELECT 
    'invoices' as table_name,
    COUNT(*) as restored_count,
    COALESCE(MIN(created_at)::text, 'N/A') as earliest_record,
    COALESCE(MAX(created_at)::text, 'N/A') as latest_record
FROM invoices;
"

echo -e "${GREEN}✅ Restore completed successfully!${NC}"
echo -e "${BLUE}📦 Restored from: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}🕐 Restore completed at: $(date)${NC}"
