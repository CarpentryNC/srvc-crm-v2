# 🔐 Database & Git Security Workflows

## 🗄️ Database Management

### **Daily Backup Strategy**

```bash
# Schema-only backup (daily)
./scripts/backup-db.sh production

# Full backup with data (weekly)
./scripts/backup-db.sh production --full-backup

# Data-only backup (before major changes)
./scripts/backup-db.sh production --include-data
```

### **Safe Migration Workflow**

```bash
# 1. Create and test migration locally
supabase migration new feature_name
# Edit the migration file
supabase db reset --local
supabase db start

# 2. Test migration
./scripts/migrate-db.sh development --dry-run
./scripts/migrate-db.sh development

# 3. Backup before production migration
./scripts/backup-db.sh production --full-backup

# 4. Apply to production
./scripts/migrate-db.sh production
```

### **Emergency Restore Procedure**

```bash
# List available backups
ls -la ./backups/database/

# Restore from backup
./scripts/restore-db.sh ./backups/database/full_production_YYYYMMDD_HHMMSS.sql production
```

## 🌐 Git Repository Management

### **Secure Development Workflow**

```bash
# 1. Create feature branch
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# 2. Regular commits with meaningful messages
git add .
git commit -m "feat: add customer validation logic"

# 3. Sync and backup regularly
./scripts/git-backup.sh

# 4. Create pull request for code review
# (Use GitHub/GitLab interface)

# 5. Deploy after merge
git checkout main
git pull origin main
./scripts/deploy.sh production main
```

### **Automated Backup Schedule**

```bash
# Add to crontab for automated backups
crontab -e

# Daily database backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup-db.sh production

# Weekly full backup on Sundays at 1 AM  
0 1 * * 0 cd /path/to/project && ./scripts/backup-db.sh production --full-backup

# Daily git sync at 6 PM
0 18 * * * cd /path/to/project && ./scripts/git-backup.sh
```

## 🛡️ Security Best Practices

### **Environment Management**

1. **Never commit `.env` files**
2. **Use separate environments**: `development`, `staging`, `production`
3. **Rotate credentials** regularly
4. **Monitor access logs** in Supabase dashboard

### **Database Security**

1. **Row Level Security (RLS)** enabled on all tables
2. **Regular backups** before any changes
3. **Migration testing** in development first
4. **Access control** via Supabase roles

### **Git Security**

1. **Branch protection** rules on main/production branches
2. **Code reviews** required for all changes
3. **Signed commits** (optional but recommended)
4. **Regular backups** to multiple remotes

## ⚡ Quick Commands Reference

```bash
# Database Operations
./scripts/backup-db.sh production --full-backup    # Full backup
./scripts/migrate-db.sh production                 # Apply migrations
./scripts/restore-db.sh backup_file.sql            # Restore database

# Git Operations  
./scripts/git-backup.sh                            # Backup and sync
./scripts/deploy.sh production main                # Deploy to production

# Emergency Procedures
supabase migration repair --status applied         # Fix migration history
git bundle verify backup_file.bundle               # Verify git backup
```

## 📊 Monitoring & Alerts

### **Database Monitoring**

1. **Supabase Dashboard** - Monitor real-time metrics
2. **Backup verification** - Regular restore testing
3. **Performance metrics** - Query performance tracking

### **Git Repository Health**

1. **Commit frequency** - Regular development activity
2. **Branch protection** - Prevent direct main branch commits
3. **Backup integrity** - Verify bundle files periodically

## 🚨 Emergency Contacts & Procedures

### **Database Issues**

1. **Immediate backup** if system is responsive
2. **Check Supabase status** page
3. **Review recent migrations** for potential rollback
4. **Contact Supabase support** if needed

### **Git Repository Issues**

1. **Check all remotes** for latest version
2. **Use git bundle backups** for recovery
3. **Verify data integrity** with `git fsck`
4. **Contact team members** for assistance

---

**Remember**: Test all procedures in development environment first!
