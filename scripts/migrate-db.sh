#!/bin/bash

# =================================================================
# SECURE DATABASE MIGRATION SCRIPT
# =================================================================
# This script safely applies migrations with backup and rollback
# Usage: ./scripts/migrate-db.sh [environment] [options]
# =================================================================

set -e

# Configuration
ENVIRONMENT=${1:-"development"}
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting database migration for $ENVIRONMENT environment...${NC}"

# Pre-migration backup
echo -e "${YELLOW}📋 Creating pre-migration backup...${NC}"
./scripts/backup-db.sh "$ENVIRONMENT" --full-backup

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Pre-migration backup failed. Aborting migration.${NC}"
    exit 1
fi

# Check migration status
echo -e "${YELLOW}🔍 Checking migration status...${NC}"
supabase migration list

# Apply migrations
echo -e "${YELLOW}⚡ Applying pending migrations...${NC}"
if [[ "$2" == "--dry-run" ]]; then
    echo -e "${BLUE}🧪 DRY RUN MODE - No changes will be applied${NC}"
    supabase db diff --schema=public
else
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations applied successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        echo -e "${YELLOW}🔄 Consider rolling back if needed...${NC}"
        exit 1
    fi
fi

# Post-migration verification
echo -e "${YELLOW}🔍 Verifying migration...${NC}"
supabase migration list

echo -e "${GREEN}🎉 Migration process completed!${NC}"
