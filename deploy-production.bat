@echo off
REM Nexus Production Depecho Building production images...oyment Script for Windows
REM This script sets up and deploys Nexus in production mode

echo Nexus Production Deployment
echo ==============================

REM Check if .env.production exists
if not exist ".env.production" (
    echo Error: .env.production file not found!
    echo Please create .env.production with your production secrets.
    echo Run 'npm run generate-secrets' to generate secure secrets.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Create data directories
echo Creating data directories...
if not exist "data" mkdir data
if not exist "data\postgres" mkdir data\postgres
if not exist "data\redis" mkdir data\redis
if not exist "data\uploads" mkdir data\uploads
if not exist "nginx" mkdir nginx
if not exist "nginx\ssl" mkdir nginx\ssl

REM Build production images
echo Building production images...
docker-compose -f docker-compose.prod.yml build --no-cache

if errorlevel 1 (
    echo Error: Failed to build production images!
    pause
    exit /b 1
)

REM Start production services
echo Starting production services...
docker-compose -f docker-compose.prod.yml up -d

if errorlevel 1 (
    echo Error: Failed to start production services!
    pause
    exit /b 1
)

REM Wait for services to be ready
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Test application endpoints
echo Testing application endpoints...

REM Test health endpoint
curl -f -s http://localhost/health >nul 2>&1
if errorlevel 1 (
    echo Application health check failed
    echo Checking logs...
    docker-compose -f docker-compose.prod.yml logs nginx
    pause
    exit /b 1
) else (
    echo Application health check passed
)

REM Test API health endpoint
curl -f -s http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    echo API health check failed
    echo Checking logs...
    docker-compose -f docker-compose.prod.yml logs backend
    pause
    exit /b 1
) else (
    echo API health check passed
)

REM Display deployment information
echo.
echo DEPLOYMENT SUCCESSFUL!
echo ========================
echo Application URL: http://localhost
echo API URL: http://localhost/api
echo Health Check: http://localhost/health
echo.
echo Container Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo Next Steps:
echo 1. Set up your domain and SSL certificates
echo 2. Update FRONTEND_URL in .env.production
echo 3. Set up monitoring and logging
echo 4. Configure automated backups
echo 5. Set up CI/CD pipeline

echo.
echo Useful Commands:
echo - View logs: docker-compose -f docker-compose.prod.yml logs -f
echo - Stop services: docker-compose -f docker-compose.prod.yml down
echo - Restart services: docker-compose -f docker-compose.prod.yml restart
echo - Update: git pull ^&^& docker-compose -f docker-compose.prod.yml up -d --build

echo.
echo Your Nexus application is now running in production mode!
echo.

pause