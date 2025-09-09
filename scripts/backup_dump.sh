#!/bin/bash

# CRM Data Backup Script using supabase db dump
# Creates timestamped backup with all CRM data
# Usage: ./scripts/backup_dump.sh

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

# Create full database dump
echo -e "${YELLOW}💾 Creating full database dump...${NC}"
supabase db dump --local --data-only --file "${BACKUP_PATH}/crm_full_backup.sql"

# Create individual table dumps for easier inspection
echo -e "${YELLOW}📋 Creating individual table dumps...${NC}"

# Dump customers table
supabase db dump --local --data-only --schema public -x public.jobs,public.quotes,public.invoices --file "${BACKUP_PATH}/customers_dump.sql"

# Create readable CSV exports using a simple approach
echo -e "${YELLOW}📊 Creating readable data summaries...${NC}"

# Create a summary file
cat > "${BACKUP_PATH}/backup_summary.txt" << EOF
CRM Data Backup Summary
======================

Backup Timestamp: ${TIMESTAMP}
Backup Path: ${BACKUP_PATH}
Backup Method: supabase db dump

Files Created:
- crm_full_backup.sql (Complete database dump)
- customers_dump.sql (Customers table only)
- backup_summary.txt (This file)

To restore this backup:
1. Clear database: supabase db reset
2. Apply backup: supabase db sql < ${BACKUP_PATH}/crm_full_backup.sql

Backup completed at: $(date)
EOF

# Show file information
echo -e "${YELLOW}📏 Checking backup files...${NC}"
for file in crm_full_backup.sql customers_dump.sql backup_summary.txt; do
    if [ -f "${BACKUP_PATH}/${file}" ]; then
        size=$(ls -lh "${BACKUP_PATH}/${file}" | awk '{print $5}')
        echo -e "${GREEN}✅ ${file}: ${size}${NC}"
    fi
done

TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${BLUE}📦 Backup location: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}📏 Total size: ${TOTAL_SIZE}${NC}"
echo -e "\n${YELLOW}💡 Backup Instructions:${NC}"
echo -e "   To restore: supabase db reset && supabase db sql < ${BACKUP_PATH}/crm_full_backup.sql"
echo -e "   Files are located at: ${BACKUP_PATH}"
