#!/bin/bash

# =================================================================
# SECURE GIT DEPLOYMENT SCRIPT
# =================================================================
# This script manages safe deployments with proper Git workflow
# Usage: ./scripts/deploy.sh [environment] [branch]
# =================================================================

set -e

ENVIRONMENT=${1:-"development"}
BRANCH=${2:-"main"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting deployment to $ENVIRONMENT from branch $BRANCH...${NC}"

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}❌ Working directory is not clean. Please commit or stash changes.${NC}"
    git status --short
    exit 1
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    echo -e "${YELLOW}⚠️  Switching from $CURRENT_BRANCH to $BRANCH${NC}"
    git checkout "$BRANCH"
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin "$BRANCH"

# Run tests (if they exist)
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    npm test
fi

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Deployment aborted.${NC}"
    exit 1
fi

# Database backup before migration (if in production)
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}📋 Creating pre-deployment database backup...${NC}"
    ./scripts/backup-db.sh production --full-backup
fi

# Run database migrations
echo -e "${YELLOW}⚡ Running database migrations...${NC}"
./scripts/migrate-db.sh "$ENVIRONMENT"

# Tag the deployment
TAG="deploy-${ENVIRONMENT}-${TIMESTAMP}"
echo -e "${YELLOW}🏷️  Creating deployment tag: $TAG${NC}"
git tag -a "$TAG" -m "Deployment to $ENVIRONMENT on $TIMESTAMP"
git push origin "$TAG"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "Environment: $ENVIRONMENT"
echo "Branch: $BRANCH"
echo "Tag: $TAG"
echo "Timestamp: $TIMESTAMP"
