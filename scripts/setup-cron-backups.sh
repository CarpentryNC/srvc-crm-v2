#!/bin/bash

# 🕒 CRM Backup Automation Setup
# This script sets up automated cron jobs for database and git backups

set -e

PROJECT_PATH="/Users/ncme/VS Code/SRVC Base v 1.5"
CRON_FILE="/tmp/crm_crontab"

echo "🔧 Setting up automated backup cron jobs..."

# Get current crontab (if any)
crontab -l 2>/dev/null > "$CRON_FILE" || echo "# CRM Backup Automation" > "$CRON_FILE"

# Check if our jobs already exist
if grep -q "CRM Database Backup" "$CRON_FILE" 2>/dev/null; then
    echo "⚠️  CRM backup jobs already exist in crontab"
    echo "📋 Current cron jobs:"
    crontab -l | grep -A5 -B5 "CRM"
    echo ""
    read -p "Do you want to replace existing CRM backup jobs? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "❌ Setup cancelled"
        rm -f "$CRON_FILE"
        exit 0
    fi
    # Remove existing CRM jobs
    grep -v "CRM Database Backup\|CRM Git Backup\|backup-db.sh\|git-backup.sh" "$CRON_FILE" > "${CRON_FILE}.tmp" || true
    mv "${CRON_FILE}.tmp" "$CRON_FILE"
fi

# Add CRM backup jobs
cat >> "$CRON_FILE" << EOF

# CRM Database Backup - Daily at 2 AM
0 2 * * * cd "$PROJECT_PATH" && ./scripts/backup-db.sh development >> logs/backup.log 2>&1

# CRM Git Backup - Daily at 6 PM  
0 18 * * * cd "$PROJECT_PATH" && ./scripts/git-backup.sh >> logs/backup.log 2>&1

# CRM Weekly Full Backup - Sundays at 1 AM
0 1 * * 0 cd "$PROJECT_PATH" && ./scripts/backup-db.sh development --full >> logs/backup.log 2>&1

EOF

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_PATH/logs"

# Install the new crontab
crontab "$CRON_FILE"

# Cleanup
rm -f "$CRON_FILE"

echo "✅ Cron jobs successfully installed!"
echo ""
echo "📅 Scheduled backup jobs:"
echo "   🗄️  Database backup: Daily at 2:00 AM"
echo "   🌐 Git backup: Daily at 6:00 PM"
echo "   📦 Full backup: Sundays at 1:00 AM"
echo ""
echo "📁 Backup logs will be stored in: $PROJECT_PATH/logs/backup.log"
echo ""
echo "🔍 To view current cron jobs:"
echo "   crontab -l"
echo ""
echo "📊 To monitor backup logs:"
echo "   tail -f logs/backup.log"
echo ""
echo "⚠️  Important: Make sure your Mac doesn't sleep during backup times!"
echo "   System Preferences > Energy Saver > Prevent computer from sleeping"
