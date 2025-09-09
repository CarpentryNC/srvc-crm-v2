#!/bin/bash

# =================================================================
# GIT BACKUP AND SYNC SCRIPT
# =================================================================
# This script creates local backups and syncs with remote repos
# Usage: ./scripts/git-backup.sh
# =================================================================

set -e

BACKUP_DIR="./backups/git"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Starting Git backup and sync...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if git repo exists
if [[ ! -d ".git" ]]; then
    echo -e "${RED}❌ Not a Git repository${NC}"
    exit 1
fi

# Create bundle backup
echo -e "${YELLOW}📦 Creating Git bundle backup...${NC}"
BUNDLE_FILE="$BACKUP_DIR/repo_backup_${TIMESTAMP}.bundle"
git bundle create "$BUNDLE_FILE" --all

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git bundle created: $BUNDLE_FILE${NC}"
else
    echo -e "${RED}❌ Git bundle creation failed${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected:${NC}"
    git status --short
    
    read -p "Do you want to commit these changes? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}💬 Enter commit message: ${NC}"
        read -r COMMIT_MESSAGE
        git add .
        git commit -m "$COMMIT_MESSAGE"
    fi
fi

# Push to remote repositories
echo -e "${YELLOW}🌐 Syncing with remote repositories...${NC}"
REMOTES=$(git remote)

for remote in $REMOTES; do
    echo -e "${YELLOW}📤 Pushing to $remote...${NC}"
    git push "$remote" --all
    git push "$remote" --tags
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully synced with $remote${NC}"
    else
        echo -e "${RED}❌ Failed to sync with $remote${NC}"
    fi
done

# Cleanup old bundles (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
cd "$BACKUP_DIR"
ls -t repo_backup_*.bundle | tail -n +6 | xargs -r rm

echo -e "${GREEN}🎉 Git backup and sync completed!${NC}"

# Show backup summary
echo -e "\n${YELLOW}📊 Backup Summary:${NC}"
echo "Bundle file: $BUNDLE_FILE"
echo "Remotes synced: $REMOTES"
echo "Timestamp: $TIMESTAMP"
