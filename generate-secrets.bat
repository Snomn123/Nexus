@echo off
REM Production Security Setup Script for Windows
REM Run this script to generate secure secrets and prepare for production

echo Nexus Production Security Setup
echo ==================================

echo.
echo 1. Generate JWT Secrets (copy these to your .env file):
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

echo.
echo 2. Generate Database Password:
node -e "console.log('DB_PASSWORD=' + require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))"

echo.
echo 3. Generate Redis Password:
node -e "console.log('REDIS_PASSWORD=' + require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))"

echo.
echo Security Checklist for Production:
echo □ Replace all default passwords and secrets
echo □ Set NODE_ENV=production
echo □ Enable HTTPS/SSL certificates
echo □ Configure proper CORS origins
echo □ Set up database connection encryption
echo □ Review all environment variables
echo □ Enable production logging
echo □ Test rate limiting
echo □ Verify input sanitization
echo □ Run security audit: npm audit
echo □ Set up monitoring and alerting

echo.
echo CRITICAL: Never commit .env files to version control!
echo CRITICAL: Use different secrets for each environment!
echo.

pause