# Troubleshooting File Convention

## File Naming Pattern for Easy Cleanup

All temporary files created during troubleshooting sessions should follow this naming convention:

### Pattern: `[PREFIX]_troubleshoot_[DESCRIPTION]_[DATE].[EXT]`

### Examples:
- `debug_troubleshoot_cors_fix_20250912.js`
- `temp_troubleshoot_stripe_test_20250912.env`
- `migration_troubleshoot_calendar_rls_20250912.sql`
- `script_troubleshoot_payment_deploy_20250912.sh`

### Prefixes:
- `debug_` - Debug scripts and test files
- `temp_` - Temporary configuration files
- `migration_` - Temporary migration files
- `script_` - Temporary shell scripts
- `test_` - Test files and samples
- `backup_` - Temporary backup files

### Quick Cleanup Command:
```bash
# Remove all troubleshooting files
find . -name "*troubleshoot*" -type f -delete

# Or list them first to review:
find . -name "*troubleshoot*" -type f
```

### Git Ignore Pattern:
Add to `.gitignore`:
```
*troubleshoot*
```

This convention ensures:
1. Easy identification of temporary files
2. Simple bulk cleanup with find commands
3. Clear dating for file age tracking
4. Descriptive naming for context
