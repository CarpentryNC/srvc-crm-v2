# Git Workflow for SRVC CRM v2

## 🌿 Branch Structure

### Main Branches
- **`main`** - Production-ready code. Protected branch that automatically deploys to production
- **`development`** - Integration branch for features. Used for staging and testing before production

### Working Branches
- **`feature/feature-name`** - Individual feature development
- **`hotfix/fix-name`** - Critical production fixes
- **`bugfix/bug-name`** - Non-critical bug fixes

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start from development branch
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/new-feature-name

# Make your changes and commit
git add .
git commit -m "feat: Add new feature description"

# Push feature branch
git push -u origin feature/new-feature-name
```

### 2. Code Review & Integration
```bash
# Create Pull Request from feature branch to development
# After PR approval and merge, clean up
git checkout development
git pull origin development
git branch -d feature/new-feature-name
git push origin --delete feature/new-feature-name
```

### 3. Production Release
```bash
# When development is stable and tested
# Create PR from development to main
# After approval and merge, main auto-deploys to production
```

## 🚨 Hotfix Workflow
```bash
# For critical production fixes
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make fix and commit
git add .
git commit -m "hotfix: Critical production fix"

# Push and create PR to main
git push -u origin hotfix/critical-fix
# Also merge back to development to keep branches in sync
```

## 📋 Commit Message Convention

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
git commit -m "feat(customers): Add CSV import functionality"
git commit -m "fix(invoices): Resolve partial payment calculation"
git commit -m "docs: Update API documentation"
git commit -m "hotfix: Fix critical payment processing bug"
```

## 🛡️ Branch Protection Rules

### Main Branch (`main`)
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes that create files larger than 100MB
- ❌ Allow force pushes
- ❌ Allow deletions

### Development Branch (`development`)
- ✅ Require pull request reviews (optional for maintainers)
- ✅ Require status checks to pass
- ❌ Allow force pushes (with caution)

## 🔄 Deployment Pipeline

### Automatic Deployments
- **`main` branch** → Production (Netlify auto-deploy)
- **`development` branch** → Staging environment (future)

### Manual Deployments
- **Supabase Functions**: Deploy manually via CLI
- **Database Migrations**: Apply via `supabase db push`

## 🔧 Local Development Setup

### Initial Setup
```bash
# Clone repository
git clone https://github.com/CarpentryNC/srvc-crm-v2.git
cd srvc-crm-v2

# Set up development branch
git checkout development
git pull origin development

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys
```

### Daily Workflow
```bash
# Start development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/your-feature

# Development...
npm run dev

# Commit and push
git add .
git commit -m "feat: Your feature description"
git push -u origin feature/your-feature
```

## 🧪 Testing Before Merge

### Development Branch Testing
- Local development server
- Unit tests: `npm test`
- Build verification: `npm run build`
- TypeScript compilation: `npm run type-check`

### Main Branch (Production) Testing
- Full staging environment testing
- Database migration testing
- End-to-end testing
- Performance testing

## 📊 Current Branch Status

```bash
# Check current setup
git branch -vv
# * development 979d5b5 [origin/development] latest changes
#   main        979d5b5 [origin/main] latest changes

# Remote branches
git branch -r
# origin/development
# origin/main
```

## 🚀 Quick Commands

```bash
# Switch to development
git checkout development

# Update development from remote
git pull origin development

# Create new feature branch
git checkout -b feature/feature-name

# Push new branch with tracking
git push -u origin feature/feature-name

# Quick commit all changes
git add . && git commit -m "commit message"

# Clean up merged branches
git branch --merged | grep -v main | grep -v development | xargs -n 1 git branch -d
```

## 📋 Pre-commit Checklist

- [ ] Code compiles without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] TypeScript has no errors
- [ ] Database migrations tested locally
- [ ] Environment variables documented
- [ ] Documentation updated if needed
- [ ] Commit message follows convention
- [ ] Feature branch is up to date with development

---

**Next Steps:**
1. Set up branch protection rules on GitHub
2. Configure staging environment for development branch
3. Set up automated testing pipeline
4. Create PR templates for better code review process
