#!/bin/bash
# ===========================================
# HRSmart - Production Deployment Script
# Usage: ./deploy.sh
# ===========================================

set -e  # Exit on error

echo "🚀 HRSmart Production Deployment"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy env.example to .env and configure it."
    exit 1
fi

# Pull latest code (if git repo)
if [ -d .git ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main
fi

# Build and deploy
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend python -c "
from app.core.database import engine
from sqlalchemy import text
import os

migrations_dir = 'migrations'
if os.path.exists(migrations_dir):
    files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    with engine.connect() as conn:
        for f in files:
            print(f'Running migration: {f}')
            with open(os.path.join(migrations_dir, f), 'r') as sql_file:
                conn.execute(text(sql_file.read()))
        conn.commit()
    print('Migrations completed!')
"

# Show status
echo -e "${YELLOW}📊 Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "🌐 Application: https://test.hrsmart.co"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart: docker-compose -f docker-compose.prod.yml restart"

