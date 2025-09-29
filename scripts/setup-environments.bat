@echo off
REM Environment Setup Script for Windows - Configures production environments

echo Nexus Environment Setup
echo ======================

if "%1"=="production" goto setup_production
if "%1"=="prod" goto setup_production
if "%1"=="" goto setup_development
goto usage

:setup_production
echo [INFO] Setting up PRODUCTION environments...

REM Setup backend production environment
echo [INFO] Setting up backend environment for: production
cd backend
(
echo NODE_ENV=production
echo PORT=5000  
echo FRONTEND_URL=https://snomn123.github.io
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=nexus
echo DB_USER=nexus_user
echo DB_PASSWORD=nexus123
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo JWT_SECRET=your-jwt-secret-here
echo JWT_REFRESH_SECRET=your-refresh-secret-here
) > .env.production
cd ..
echo [SUCCESS] Backend production environment created

REM Setup frontend production environment  
echo [INFO] Setting up frontend environment for: production
cd frontend
(
echo # Production environment variables for GitHub Pages deployment
echo REACT_APP_API_URL=http://132.145.59.91/api
echo REACT_APP_SOCKET_URL=http://132.145.59.91
echo REACT_APP_ENV=production
echo GENERATE_SOURCEMAP=false
echo CI=false
) > .env.production
cd ..
echo [SUCCESS] Frontend production environment created

echo [SUCCESS] Production environments configured!
echo.
echo Backend configured for GitHub Pages CORS:
echo   FRONTEND_URL=https://snomn123.github.io
echo.
echo Frontend configured for Oracle Cloud API:
echo   REACT_APP_API_URL=http://132.145.59.91/api
echo   REACT_APP_SOCKET_URL=http://132.145.59.91
echo.
echo Next steps:
echo 1. Commit these environment files
echo 2. Push to trigger GitHub Pages deployment  
echo 3. Update Oracle Cloud backend with update script
goto end

:setup_development
echo [INFO] Setting up DEVELOPMENT environments...
if not exist backend\.env copy backend\.env.example backend\.env
if not exist frontend\.env copy frontend\.env.example frontend\.env
echo [SUCCESS] Development environments configured!
echo.
echo Both backend and frontend configured for local development
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
goto end

:usage
echo Invalid argument. Use: production^|development
echo Usage: %0 [production^|development]
echo   production  - Setup for GitHub Pages + Oracle Cloud deployment
echo   development - Setup for local development (default)
exit /b 1

:end