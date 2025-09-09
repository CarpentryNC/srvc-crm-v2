#!/bin/bash

# Simple CRM Data Backup Script using Supabase CLI
# Creates timestamped backup with all CRM data
# Usage: ./scripts/simple_backup.sh

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

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

# Check current data counts
echo -e "${YELLOW}📊 Checking current data...${NC}"
echo "SELECT 
    'Current Data State' as info,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM jobs) as jobs,
    (SELECT COUNT(*) FROM quotes) as quotes,
    (SELECT COUNT(*) FROM invoices) as invoices;" | supabase db sql

# Export customers
echo -e "${YELLOW}📋 Exporting customers...${NC}"
echo "SELECT * FROM customers ORDER BY created_at;" | supabase db sql --csv > "${BACKUP_PATH}/customers_backup.csv"

# Export jobs
echo -e "${YELLOW}📋 Exporting jobs...${NC}"
echo "SELECT * FROM jobs ORDER BY created_at;" | supabase db sql --csv > "${BACKUP_PATH}/jobs_backup.csv"

# Export quotes  
echo -e "${YELLOW}📋 Exporting quotes...${NC}"
echo "SELECT * FROM quotes ORDER BY created_at;" | supabase db sql --csv > "${BACKUP_PATH}/quotes_backup.csv"

# Export invoices
echo -e "${YELLOW}📋 Exporting invoices...${NC}"
echo "SELECT * FROM invoices ORDER BY created_at;" | supabase db sql --csv > "${BACKUP_PATH}/invoices_backup.csv"

# Create backup metadata
echo -e "${YELLOW}📊 Creating backup metadata...${NC}"
echo "SELECT 
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
FROM invoices;" | supabase db sql > "${BACKUP_PATH}/backup_metadata.txt"

# Create backup summary
cat > "${BACKUP_PATH}/backup_info.txt" << EOF
CRM Data Backup Summary
======================

Backup Timestamp: ${TIMESTAMP}
Backup Path: ${BACKUP_PATH}

Files Created:
- customers_backup.csv
- jobs_backup.csv  
- quotes_backup.csv
- invoices_backup.csv
- backup_metadata.txt
- backup_info.txt

To restore this backup, use:
./scripts/simple_restore.sh ${TIMESTAMP}

Backup completed at: $(date)
EOF

# Show file sizes
echo -e "${YELLOW}📏 Checking backup file sizes...${NC}"
for file in customers_backup.csv jobs_backup.csv quotes_backup.csv invoices_backup.csv; do
    if [ -f "${BACKUP_PATH}/${file}" ]; then
        lines=$(wc -l < "${BACKUP_PATH}/${file}")
        size=$(ls -lh "${BACKUP_PATH}/${file}" | awk '{print $5}')
        echo -e "${GREEN}✅ ${file}: ${lines} lines, ${size}${NC}"
    fi
done

TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${BLUE}📦 Backup location: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}📏 Total size: ${TOTAL_SIZE}${NC}"
echo -e "${BLUE}🔧 To restore: ./scripts/simple_restore.sh ${TIMESTAMP}${NC}"
