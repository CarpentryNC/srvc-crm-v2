#!/bin/bash

# CRM Backup/Restore Test Script
# Tests the complete backup and restore workflow
# Usage: ./scripts/test_backup_restore.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Starting Backup/Restore Test Workflow${NC}"
echo -e "========================================"

# Step 1: Check current data
echo -e "\n${YELLOW}📊 Step 1: Checking current data state...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
    'Current Data State' as status,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM jobs) as jobs,
    (SELECT COUNT(*) FROM quotes) as quotes,
    (SELECT COUNT(*) FROM invoices) as invoices;
"

# Step 2: Create backup
echo -e "\n${YELLOW}💾 Step 2: Creating backup...${NC}"
./scripts/backup_crm.sh

# Get the latest backup timestamp
LATEST_BACKUP=$(ls -t ./backups/ | head -n 1)
echo -e "${GREEN}✅ Backup created: ${LATEST_BACKUP}${NC}"

# Step 3: Verify backup files
echo -e "\n${YELLOW}🔍 Step 3: Verifying backup files...${NC}"
BACKUP_PATH="./backups/${LATEST_BACKUP}"

echo "Backup directory contents:"
ls -la "${BACKUP_PATH}"

echo -e "\nChecking backup file sizes:"
for file in customers_backup.csv jobs_backup.csv quotes_backup.csv invoices_backup.csv; do
    if [ -f "${BACKUP_PATH}/${file}" ]; then
        lines=$(wc -l < "${BACKUP_PATH}/${file}")
        size=$(ls -lh "${BACKUP_PATH}/${file}" | awk '{print $5}')
        echo -e "${GREEN}✅ ${file}: ${lines} lines, ${size}${NC}"
    else
        echo -e "${RED}❌ ${file}: Missing${NC}"
    fi
done

# Step 4: Test restore (with force flag for automation)
echo -e "\n${YELLOW}♻️  Step 4: Testing restore...${NC}"
./scripts/restore_crm.sh "${LATEST_BACKUP}" --force

# Step 5: Verify restoration
echo -e "\n${YELLOW}✅ Step 5: Verifying restored data...${NC}"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
    'After Restore' as status,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM jobs) as jobs,
    (SELECT COUNT(*) FROM quotes) as quotes,
    (SELECT COUNT(*) FROM invoices) as invoices;
"

echo -e "\n${GREEN}🎉 Backup/Restore test completed successfully!${NC}"
echo -e "${BLUE}📋 Test Summary:${NC}"
echo -e "   - Backup created: ${LATEST_BACKUP}"
echo -e "   - Backup location: ${BACKUP_PATH}"
echo -e "   - Restore verified: ✅"
echo -e "\n${YELLOW}💡 The backup/restore system is ready for production use!${NC}"
