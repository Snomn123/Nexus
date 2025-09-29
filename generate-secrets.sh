#!/bin/bash
# Production Security Setup Script
# Run this script to generate secure secrets and prepare for production

echo "Nexus Production Security Setup"
echo "=================================="

# Generate strong JWT secrets
echo ""
echo "1. Generate JWT Secrets (copy these to your .env file):"
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"

echo ""
echo "2. Generate Database Password:"
echo "DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))")"

echo ""
echo "3. Generate Redis Password:"
echo "REDIS_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))")"

echo ""
echo "Security Checklist for Production:"
echo "□ Replace all default passwords and secrets"
echo "□ Set NODE_ENV=production"
echo "□ Enable HTTPS/SSL certificates"
echo "□ Configure proper CORS origins"
echo "□ Set up database connection encryption"
echo "□ Review all environment variables"
echo "□ Enable production logging"
echo "□ Test rate limiting"
echo "□ Verify input sanitization"
echo "□ Run security audit: npm audit"
echo "□ Set up monitoring and alerting"

echo ""
echo "CRITICAL: Never commit .env files to version control!"
echo "CRITICAL: Use different secrets for each environment!"
echo ""