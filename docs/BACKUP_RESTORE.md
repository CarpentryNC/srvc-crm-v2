# CRM Backup and Restore Documentation

## Overview

This documentation covers the backup and restore procedures for the SRVC CRM system. The backup/restore system uses Supabase's `db dump` functionality to create complete, timestamped backups of all CRM data.

## Quick Reference

| Action | Command |
|--------|---------|
| Create Backup | `./scripts/backup_dump.sh` |
| List Backups | `ls -la ./backups/` |
| Restore Backup | `./scripts/restore_working.sh [TIMESTAMP]` |
| Force Restore | `./scripts/restore_working.sh [TIMESTAMP] --force` |

## Backup System

### Backup Script: `backup_dump.sh`

**Purpose**: Creates a complete backup of all CRM data with timestamp organization.

**What gets backed up**:
- All customer records
- All jobs, quotes, and invoices
- Database schema (tables, constraints, indexes)
- Metadata and backup information

**Output**:
```
./backups/YYYYMMDD_HHMMSS/
├── crm_full_backup.sql       # Complete database dump
├── customers_dump.sql        # Customers table only
└── backup_summary.txt        # Backup metadata
```

**Usage**:
```bash
# Create a new backup
./scripts/backup_dump.sh

# Example output
📦 Backup location: ./backups/20250909_103745
📏 Total size: 128K
```

### Backup File Details

- **crm_full_backup.sql**: Complete PostgreSQL dump including all data and schema
- **customers_dump.sql**: Customers table only (for selective restore)
- **backup_summary.txt**: Human-readable backup information

## Restore System

### Restore Script: `restore_working.sh`

**Purpose**: Restores CRM data from a timestamped backup.

**What happens during restore**:
1. Database is completely reset to clean state
2. Latest migrations are applied
3. Backup data is imported
4. Data integrity is verified

**Usage**:
```bash
# Interactive restore (asks for confirmation)
./scripts/restore_working.sh 20250909_103745

# Force restore (no confirmation)
./scripts/restore_working.sh 20250909_103745 --force

# List available backups
./scripts/restore_working.sh
```

### Important Restore Notes

⚠️ **DESTRUCTIVE OPERATION**: Restore completely replaces all existing data.

✅ **What's preserved**: Database schema, migrations, authentication system
❌ **What's lost**: All current customer/job/quote/invoice data

## Production Procedures

### Daily Backup Routine

1. **Automated backup** (recommended):
   ```bash
   # Add to crontab for daily backups at 2 AM
   0 2 * * * cd /path/to/crm && ./scripts/backup_dump.sh
   ```

2. **Manual backup before major changes**:
   ```bash
   ./scripts/backup_dump.sh
   ```

### Backup Retention

- **Local Development**: Keep last 10 backups
- **Production**: Recommend keeping 30+ days
- **Before Updates**: Always create backup before system updates

### Cleanup Old Backups

```bash
# Remove backups older than 30 days
find ./backups -type d -name "????????_??????" -mtime +30 -exec rm -rf {} \;
```

## Testing Workflows

### Test 1: Basic Backup/Restore
```bash
# 1. Create backup with current data
./scripts/backup_dump.sh

# 2. Note the timestamp (e.g., 20250909_103745)

# 3. Restore from backup
./scripts/restore_working.sh 20250909_103745 --force

# 4. Verify data integrity in CRM interface
```

### Test 2: Disaster Recovery Simulation
```bash
# 1. Create backup
./scripts/backup_dump.sh

# 2. Simulate data loss
supabase db reset

# 3. Restore from backup
./scripts/restore_working.sh [TIMESTAMP] --force

# 4. Verify full system functionality
```

## Troubleshooting

### Common Issues

**Error: "Backup file not found"**
- Solution: Check timestamp format and verify backup exists in `./backups/`

**Error: "Container not found"**
- Solution: Ensure Supabase is running with `supabase start`

**Error: "Permission denied"**
- Solution: Ensure scripts are executable with `chmod +x scripts/*.sh`

**Warning: "Duplicate key violations"**
- Status: Normal for subscription plans (seeded data), doesn't affect restore

### Verification Steps

After any restore:
1. Check customer count: Should match backup metadata
2. Test CRM login functionality
3. Verify customer data displays correctly
4. Test core CRM operations (view, edit, create)

## File Structure

```
./scripts/
├── backup_dump.sh          # Main backup script
├── restore_working.sh      # Main restore script
├── simple_backup.sh        # Alternative backup (CSV export)
└── simple_restore.sh       # Alternative restore (for CSV)

./backups/
├── 20250909_103745/        # Backup timestamp folder
│   ├── crm_full_backup.sql
│   ├── customers_dump.sql
│   └── backup_summary.txt
└── [other backup folders]
```

## Security Considerations

- **Backup files contain sensitive customer data**
- **Store backups securely** (encrypted, access-controlled)
- **For production**: Use encrypted storage, offsite backups
- **Access control**: Limit who can run restore operations

## Integration with CI/CD

```yaml
# Example GitHub Actions backup job
backup-job:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Create Backup
      run: ./scripts/backup_dump.sh
    - name: Upload Backup
      uses: actions/upload-artifact@v2
      with:
        name: crm-backup-${{ github.run_number }}
        path: ./backups/
```

## Support

For issues with backup/restore procedures:
1. Check this documentation
2. Verify Supabase container status
3. Check backup file permissions and sizes
4. Test with force flag if needed

---

**Last Updated**: September 9, 2025  
**Tested On**: Supabase CLI v2.39.2, PostgreSQL 17.4  
**Status**: ✅ Production Ready
