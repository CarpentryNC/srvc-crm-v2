#!/bin/bash

# =================================================================
# DATABASE RESTORE SCRIPT
# =================================================================
# This script restores database from backup files
# Usage: ./scripts/restore-db.sh [backup_file] [environment]
# =================================================================

set -e

BACKUP_FILE="$1"
ENVIRONMENT=${2:-"development"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "$BACKUP_FILE" ]]; then
    echo -e "${RED}❌ Please specify a backup file to restore${NC}"
    echo "Usage: ./scripts/restore-db.sh [backup_file] [environment]"
    echo ""
    echo "Available backups:"
    ls -la ./backups/database/*.sql 2>/dev/null || echo "No backup files found"
    exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will restore the database from backup${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Create a backup before restore
echo -e "${YELLOW}📋 Creating backup before restore...${NC}"
./scripts/backup-db.sh "$ENVIRONMENT" --full-backup

# Restore database
echo -e "${YELLOW}🔄 Restoring database from $BACKUP_FILE...${NC}"
supabase db reset --linked

# Apply the backup
psql -h db.lrvzqxyqrrjusvwazaak.supabase.co -U postgres -d postgres -f "$BACKUP_FILE"

echo -e "${GREEN}✅ Database restored successfully!${NC}"
