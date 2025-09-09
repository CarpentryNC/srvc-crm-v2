#!/bin/bash

# =================================================================
# GIT SECURITY CONFIGURATION SCRIPT
# =================================================================
# This script configures Git with security best practices
# Usage: ./scripts/setup-git-security.sh
# =================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Setting up Git security configuration...${NC}"

# Configure Git user (if not already set)
if [[ -z $(git config user.name) ]]; then
    echo -e "${YELLOW}📝 Git user not configured. Please enter your details:${NC}"
    read -p "Enter your name: " GIT_NAME
    read -p "Enter your email: " GIT_EMAIL
    
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
    echo -e "${GREEN}✅ Git user configured${NC}"
fi

# Security configurations
echo -e "${YELLOW}🔒 Applying security configurations...${NC}"

# Prevent pushing to master/main accidentally
git config branch.main.pushRemote no-pushing
git config branch.master.pushRemote no-pushing

# Always verify SSL certificates
git config --global http.sslVerify true

# Use credential helper for secure storage
if [[ "$OSTYPE" == "darwin"* ]]; then
    git config --global credential.helper osxkeychain
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    git config --global credential.helper cache --timeout=3600
fi

# Set up commit signing (optional)
read -p "Do you want to set up GPG commit signing? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🔑 Setting up GPG signing...${NC}"
    echo "Please follow these steps:"
    echo "1. Generate GPG key: gpg --gen-key"
    echo "2. List keys: gpg --list-secret-keys --keyid-format LONG"
    echo "3. Add key to Git: git config --global user.signingkey [KEY_ID]"
    echo "4. Enable signing: git config --global commit.gpgsign true"
fi

# Configure push behavior
git config --global push.default simple
git config --global pull.rebase true

# Set up useful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# Configure merge behavior
git config --global merge.ff false
git config --global merge.conflictstyle diff3

# Set up git hooks path
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to prevent sensitive data commits

# Check for environment files
if git diff --cached --name-only | grep -E "\.(env|key|pem|cert)$"; then
    echo "Error: Attempting to commit sensitive files"
    echo "Please remove these files from staging:"
    git diff --cached --name-only | grep -E "\.(env|key|pem|cert)$"
    exit 1
fi

# Check for TODO/FIXME in code
if git diff --cached | grep -E "(TODO|FIXME|XXX)"; then
    echo "Warning: Found TODO/FIXME comments in staged changes"
    read -p "Continue with commit? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
EOF

chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✅ Git security configuration completed!${NC}"
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "- Branch protection configured"
echo "- SSL verification enabled"
echo "- Credential helper configured"
echo "- Useful aliases added"
echo "- Pre-commit hooks installed"
echo "- Merge behavior optimized"
