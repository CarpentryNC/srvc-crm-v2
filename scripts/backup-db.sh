#!/bin/bash

# =================================================================
# SECURE DATABASE BACKUP SCRIPT
# =================================================================
# This script creates timestamped backups of your Supabase database
# Usage: ./scripts/backup-db.sh [environment]
# Example: ./scripts/backup-db.sh production
# =================================================================

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ENVIRONMENT=${1:-"development"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🔄 Starting database backup for $ENVIRONMENT environment...${NC}"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    exit 1
fi

# Backup schema only
echo -e "${YELLOW}📋 Backing up database schema...${NC}"
SCHEMA_FILE="$BACKUP_DIR/schema_${ENVIRONMENT}_${TIMESTAMP}.sql"
supabase db dump --file "$SCHEMA_FILE" --linked

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema backup completed: $SCHEMA_FILE${NC}"
else
    echo -e "${RED}❌ Schema backup failed${NC}"
    exit 1
fi

# Backup data only (if requested)
if [[ "$2" == "--include-data" ]]; then
    echo -e "${YELLOW}📊 Backing up database data...${NC}"
    DATA_FILE="$BACKUP_DIR/data_${ENVIRONMENT}_${TIMESTAMP}.sql"
    supabase db dump --file "$DATA_FILE" --linked --data-only
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Data backup completed: $DATA_FILE${NC}"
    else
        echo -e "${RED}❌ Data backup failed${NC}"
        exit 1
    fi
fi

# Create a combined backup with both schema and data
if [[ "$2" == "--full-backup" ]]; then
    echo -e "${YELLOW}💾 Creating full database backup...${NC}"
    FULL_FILE="$BACKUP_DIR/full_${ENVIRONMENT}_${TIMESTAMP}.sql"
    supabase db dump --file "$FULL_FILE" --linked
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Full backup completed: $FULL_FILE${NC}"
    else
        echo -e "${RED}❌ Full backup failed${NC}"
        exit 1
    fi
fi

# Cleanup old backups (keep last 10)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
cd "$BACKUP_DIR"
ls -t schema_${ENVIRONMENT}_*.sql | tail -n +11 | xargs -r rm
ls -t data_${ENVIRONMENT}_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
ls -t full_${ENVIRONMENT}_*.sql 2>/dev/null | tail -n +11 | xargs -r rm

echo -e "${GREEN}🎉 Backup process completed successfully!${NC}"
echo -e "${YELLOW}📁 Backups stored in: $BACKUP_DIR${NC}"

# Show backup summary
echo -e "\n${YELLOW}📊 Backup Summary:${NC}"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo "Files created:"
ls -la "$BACKUP_DIR"/*_${ENVIRONMENT}_${TIMESTAMP}.sql 2>/dev/null || echo "No backup files found"
