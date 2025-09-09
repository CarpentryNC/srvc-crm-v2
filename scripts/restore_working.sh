#!/bin/bash

# CRM Data Restore Script using Docker exec
# Restores data from backup dump directly to PostgreSQL container
# Usage: ./scripts/restore_working.sh [TIMESTAMP] [--force]

set -e

# Configuration
BACKUP_DIR="./backups"
FORCE_RESTORE=false
POSTGRES_CONTAINER="supabase_db_SRVC_Base_v_1.5"

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
    ls -la "${BACKUP_DIR}" 2>/dev/null | grep ^d | awk '{print $9}' | grep -v "^\.$" | grep -v "^\.\.$" || echo "No backups found"
    exit 1
fi

TIMESTAMP=$1
if [ "$2" = "--force" ]; then
    FORCE_RESTORE=true
fi

BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
BACKUP_FILE="${BACKUP_PATH}/crm_full_backup.sql"

# Validate backup exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Error: Backup file not found at ${BACKUP_FILE}${NC}"
    echo "Available backups:"
    ls -la "${BACKUP_DIR}" 2>/dev/null | grep ^d | awk '{print $9}' | grep -v "^\.$" | grep -v "^\.\.$" || echo "No backups found"
    exit 1
fi

echo -e "${BLUE}🔄 Starting CRM Data Restore...${NC}"
echo -e "Restoring from: ${BACKUP_PATH}"

# Show backup info
if [ -f "${BACKUP_PATH}/backup_summary.txt" ]; then
    echo -e "\n${YELLOW}📋 Backup Information:${NC}"
    cat "${BACKUP_PATH}/backup_summary.txt"
fi

# Check current data
echo -e "\n${YELLOW}📊 Checking current data...${NC}"
docker exec -i "${POSTGRES_CONTAINER}" psql -U postgres -d postgres -c "
SELECT 
    'Current Data' as status,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM jobs) as jobs,
    (SELECT COUNT(*) FROM quotes) as quotes,
    (SELECT COUNT(*) FROM invoices) as invoices;"

# Warning about data deletion
if [ "$FORCE_RESTORE" = false ]; then
    echo -e "\n${RED}⚠️  This restore will RESET the database and replace all data!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${BLUE}Restore cancelled.${NC}"
        exit 0
    fi
fi

# Reset database to clean state
echo -e "\n${YELLOW}🔄 Resetting database to clean state...${NC}"
supabase db reset

# Apply the backup using Docker exec
echo -e "${YELLOW}📥 Applying backup data...${NC}"
docker exec -i "${POSTGRES_CONTAINER}" psql -U postgres -d postgres < "${BACKUP_FILE}"

# Verify restoration
echo -e "\n${YELLOW}✅ Verifying restoration...${NC}"
docker exec -i "${POSTGRES_CONTAINER}" psql -U postgres -d postgres -c "
SELECT 
    'After Restore' as status,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM jobs) as jobs,
    (SELECT COUNT(*) FROM quotes) as quotes,
    (SELECT COUNT(*) FROM invoices) as invoices;"

echo -e "\n${GREEN}✅ Restore completed successfully!${NC}"
echo -e "${BLUE}📦 Restored from: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}🕐 Restore completed at: $(date)${NC}"
echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "   1. Test your CRM application"
echo -e "   2. Verify that all data appears correctly"
echo -e "   3. Create a new user account if needed"
