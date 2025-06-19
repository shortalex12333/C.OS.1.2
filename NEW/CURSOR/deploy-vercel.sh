#!/bin/bash
# FILE: deploy-vercel.sh
# EXACT VERCEL DEPLOYMENT SCRIPT
# Run: chmod +x deploy-vercel.sh && ./deploy-vercel.sh

set -e

echo "🔥 CELESTE7 VERCEL DEPLOYMENT"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if logged in
echo -e "${YELLOW}Checking Vercel login...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Run tests before deployment
echo -e "${YELLOW}Running tests...${NC}"
if [ -f "test-basic.js" ]; then
    npm test -- test-basic.js
    if [ $? -ne 0 ]; then
        echo -e "${RED}Tests failed! Deployment aborted.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No test-basic.js found, skipping tests${NC}"
fi

# Deploy to preview first
echo -e "${YELLOW}Deploying to preview...${NC}"
PREVIEW_URL=$(vercel --confirm 2>&1 | grep -o 'https://[^[:space:]]*\.vercel\.app')

if [ -z "$PREVIEW_URL" ]; then
    echo -e "${RED}Preview deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Preview deployed: $PREVIEW_URL${NC}"

# Test preview deployment
echo -e "${YELLOW}Testing preview deployment...${NC}"
sleep 5  # Wait for deployment to be ready

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL/health" || echo "000")
if [ "$HEALTH_CHECK" != "200" ]; then
    echo -e "${RED}Preview health check failed (HTTP $HEALTH_CHECK)${NC}"
    echo "Fix issues before production deployment"
    exit 1
fi

echo -e "${GREEN}Preview health check passed${NC}"

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"

# Core variables
vercel env add SUPABASE_URL production <<< "https://pgufsrpztgprsbfgnlai.supabase.co"
vercel env add SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndWZzcnB6dGdwcnNiZmdubGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDUxMDAsImV4cCI6MjA2NDAyMTEwMH0.49ZVghZgkn1l8tYsrY-EfWCkxvzvkH5cCyi-_O-OBZ0"
vercel env add HUGGINGFACE_API_KEY production
vercel env add N8N_WEBHOOK_URL production <<< "https://ventruk.app.n8n.cloud/webhook/c7/text-chat"

# Optional variables
vercel env add ALLOWED_ORIGINS production <<< "*"
vercel env add ENABLE_MONITORING production <<< "true"
vercel env add NODE_ENV production <<< "production"

echo -e "${GREEN}Environment variables set${NC}"

# Confirm production deployment
echo -e "${YELLOW}Ready for production deployment?${NC}"
echo "Preview URL: $PREVIEW_URL"
echo "This will deploy to your production domain."
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy to production
echo -e "${YELLOW}Deploying to production...${NC}"
PROD_URL=$(vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*\.vercel\.app')

if [ -z "$PROD_URL" ]; then
    echo -e "${RED}Production deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Production deployed: $PROD_URL${NC}"

# Test production deployment
echo -e "${YELLOW}Testing production deployment...${NC}"
sleep 10  # Wait longer for production

PROD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health" || echo "000")
if [ "$PROD_HEALTH" != "200" ]; then
    echo -e "${RED}Production health check failed (HTTP $PROD_HEALTH)${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    vercel rollback "$PROD_URL"
    exit 1
fi

# Test API endpoint
API_TEST=$(curl -s -X POST "$PROD_URL/api/analyze" \
    -H "Content-Type: application/json" \
    -d '{"userId":"deploy_test","message":"test message","sessionId":"deploy_session"}' \
    -w "%{http_code}" -o /dev/null || echo "000")

if [ "$API_TEST" != "200" ]; then
    echo -e "${RED}API test failed (HTTP $API_TEST)${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    vercel rollback "$PROD_URL"
    exit 1
fi

echo -e "${GREEN}All tests passed!${NC}"

# Final output
echo ""
echo "🚀 DEPLOYMENT SUCCESSFUL!"
echo "================================"
echo "Production URL: $PROD_URL"
echo "Health Check: $PROD_URL/health"
echo "API Endpoint: $PROD_URL/api/analyze"
echo ""
echo "Next steps:"
echo "1. Update n8n webhook URL to: $PROD_URL/api/analyze"
echo "2. Update frontend API URL to: $PROD_URL"
echo "3. Monitor logs: vercel logs $PROD_URL"
echo ""
echo -e "${GREEN}CELESTE7 is live and ready to destroy mediocrity! 💀${NC}"

# Save deployment info
echo "$PROD_URL" > .last-deployment
echo "Deployment URL saved to .last-deployment"