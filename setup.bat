@echo off
REM Nexus Setup Script for Windows
REM Automates the initial setup process for new clones

echo Setting up Nexus project...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if files already exist
if exist ".env.docker" (
    set /p overwrite="Environment files already exist. Overwrite? (y/N): "
    if /i not "%overwrite%"=="y" (
        echo Skipping environment file setup...
        goto skip_env
    )
)

echo Setting up environment files...
copy ".env.docker.example" ".env.docker" >nul
copy "backend\.env.example" "backend\.env" >nul
copy "frontend\.env.example" "frontend\.env" >nul

:skip_env

REM Start Docker services
echo Starting Docker services...
docker-compose up -d postgres redis

REM Wait for PostgreSQL to be ready
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install

REM Run database migrations
echo Running database migrations...
call npm run migrate

echo.
echo Setup complete! To start the application:
echo.
echo    1. Start the backend:
echo       cd backend ^&^& npm run dev
echo.
echo    2. In a new terminal, start the frontend:
echo       cd frontend ^&^& npm install ^&^& npm start
echo.
echo    3. Access the application at http://localhost:3000
echo.
echo Setup completed successfully!
pause