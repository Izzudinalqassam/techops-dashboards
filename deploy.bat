@echo off
REM TechOps Dashboard - Automated Docker Deployment Script (Windows)
REM This script automates the complete deployment process for the TechOps Dashboard
REM Author: Senior Full-Stack Engineer
REM Version: 1.0.0

setlocal enabledelayedexpansion

REM Configuration
set "PROJECT_NAME=techops-dashboard"
set "LOG_FILE=%~dp0deployment.log"
set "HEALTH_CHECK_TIMEOUT=300"
set "HEALTH_CHECK_INTERVAL=10"

REM URLs for health checks
set "FRONTEND_URL=http://localhost:8080"
set "BACKEND_URL=http://localhost:8081/api"
set "HEALTH_URL=http://localhost:8081/api/health"
set "DB_PORT=5433"

REM Color codes (limited in Windows CMD)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Initialize log file
echo Deployment started at %date% %time% > "%LOG_FILE%"

REM Print banner
echo.
echo %BLUE%==========================================
echo   TechOps Dashboard Deployment Script
echo ==========================================%NC%
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check prerequisites
echo %BLUE%🔍 Checking prerequisites...%NC%
echo %date% %time% [INFO] Checking prerequisites... >> "%LOG_FILE%"

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker is not installed or not in PATH%NC%
    echo %RED%Please install Docker Desktop and try again.%NC%
    pause
    exit /b 1
)
echo %GREEN%✅ Docker is installed%NC%

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker daemon is not running%NC%
    echo %RED%Please start Docker Desktop and try again.%NC%
    pause
    exit /b 1
)
echo %GREEN%✅ Docker daemon is running%NC%

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo %RED%❌ Docker Compose is not available%NC%
        echo %RED%Please install Docker Compose and try again.%NC%
        pause
        exit /b 1
    )
)
echo %GREEN%✅ Docker Compose is available%NC%

REM Check curl
curl --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠️  curl is not available. Health checks may be limited.%NC%
    set "CURL_AVAILABLE=false"
) else (
    echo %GREEN%✅ curl is available%NC%
    set "CURL_AVAILABLE=true"
)

echo %GREEN%✅ Prerequisites check completed!%NC%
echo.

REM Check port availability
echo %BLUE%🔍 Checking port availability...%NC%
echo %date% %time% [INFO] Checking port availability... >> "%LOG_FILE%"

REM Check if ports are in use (simplified check for Windows)
netstat -an | findstr ":8080 " >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%⚠️  Port 8080 is in use%NC%
)

netstat -an | findstr ":8081 " >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%⚠️  Port 8081 is in use%NC%
)

netstat -an | findstr ":%DB_PORT% " >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%⚠️  Port %DB_PORT% is in use%NC%
)

echo %GREEN%✅ Port check completed%NC%
echo.

REM Validate environment files
echo %BLUE%🔍 Validating environment configuration...%NC%
echo %date% %time% [INFO] Validating environment configuration... >> "%LOG_FILE%"

if not exist ".env.production" (
    echo %RED%❌ Missing environment file: .env.production%NC%
    pause
    exit /b 1
)
echo %GREEN%✅ Found .env.production%NC%

if not exist "backend\.env.production" (
    echo %RED%❌ Missing environment file: backend\.env.production%NC%
    pause
    exit /b 1
)
echo %GREEN%✅ Found backend\.env.production%NC%

REM Check for default/insecure values
findstr /C:"docker_jwt_secret_2024_change_in_production" "backend\.env.production" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%⚠️  WARNING: Using default JWT secret in production!%NC%
    echo %YELLOW%    Please update JWT_SECRET in backend\.env.production%NC%
)

findstr /C:"docker_postgres_2024" "backend\.env.production" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%⚠️  WARNING: Using default database password!%NC%
    echo %YELLOW%    Please update DB_PASSWORD in backend\.env.production%NC%
)

echo %GREEN%✅ Environment validation completed%NC%
echo.

REM Stop existing containers
echo %BLUE%🛑 Stopping existing containers...%NC%
echo %date% %time% [INFO] Stopping existing containers... >> "%LOG_FILE%"

docker-compose down --remove-orphans >nul 2>&1
docker-compose -f docker-compose.dev.yml down --remove-orphans >nul 2>&1
docker container prune -f >nul 2>&1

echo %GREEN%✅ Existing containers stopped%NC%
echo.

REM Build containers
echo %BLUE%🔨 Building Docker containers...%NC%
echo %date% %time% [INFO] Building Docker containers... >> "%LOG_FILE%"
echo This may take several minutes...

docker-compose build --no-cache
if errorlevel 1 (
    echo %RED%❌ Failed to build containers%NC%
    echo Check the output above for errors.
    pause
    exit /b 1
)

echo %GREEN%✅ Containers built successfully%NC%
echo.

REM Start services
echo %BLUE%🚀 Starting services...%NC%
echo %date% %time% [INFO] Starting services... >> "%LOG_FILE%"

docker-compose up -d
if errorlevel 1 (
    echo %RED%❌ Failed to start services%NC%
    echo Check the output above for errors.
    pause
    exit /b 1
)

echo %GREEN%✅ Services started successfully%NC%
echo.

REM Wait for database
echo %BLUE%⏳ Waiting for database to be ready...%NC%
echo %date% %time% [INFO] Waiting for database... >> "%LOG_FILE%"

set /a "attempt=1"
set /a "max_attempts=30"

:wait_db_loop
if !attempt! gtr !max_attempts! (
    echo %RED%❌ Database failed to become ready within timeout%NC%
    goto cleanup_failure
)

docker-compose exec -T postgres pg_isready -U postgres -d dashboard >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%✅ Database is ready%NC%
    goto db_ready
)

echo %YELLOW%⏳ Database not ready yet (attempt !attempt!/!max_attempts!)...%NC%
timeout /t 5 /nobreak >nul
set /a "attempt+=1"
goto wait_db_loop

:db_ready
echo.

REM Health checks
echo %BLUE%🏥 Performing health checks...%NC%
echo %date% %time% [INFO] Performing health checks... >> "%LOG_FILE%"

if "%CURL_AVAILABLE%"=="true" (
    set /a "health_attempt=1"
    set /a "max_health_attempts=30"
    
    :health_loop
    if !health_attempt! gtr !max_health_attempts! (
        echo %RED%❌ Backend health check failed%NC%
        goto show_status_with_warning
    )
    
    curl -s "%HEALTH_URL%" >nul 2>&1
    if not errorlevel 1 (
        echo %GREEN%✅ Backend health check passed%NC%
        goto health_success
    )
    
    echo %YELLOW%⏳ Waiting for backend to be healthy (attempt !health_attempt!/!max_health_attempts!)...%NC%
    timeout /t 10 /nobreak >nul
    set /a "health_attempt+=1"
    goto health_loop
    
    :health_success
    REM Check frontend
    curl -s "%FRONTEND_URL%" >nul 2>&1
    if not errorlevel 1 (
        echo %GREEN%✅ Frontend is accessible%NC%
    ) else (
        echo %YELLOW%⚠️  Frontend may not be fully ready yet%NC%
    )
) else (
    echo %YELLOW%⚠️  Skipping automated health checks (curl not available)%NC%
    echo Please manually verify the application is working by visiting:
    echo   %FRONTEND_URL%
    echo   %HEALTH_URL%
)

echo.
goto show_success_status

:show_status_with_warning
echo %YELLOW%⚠️  Health checks failed, but services are running%NC%
echo Please check the application manually.
echo.
goto show_status

:show_success_status
echo %GREEN%🎉 Deployment completed successfully!%NC%
echo.

:show_status
REM Show deployment status
echo %BLUE%📊 Deployment Status:%NC%
echo.
echo Container Status:
docker-compose ps
echo.
echo %GREEN%Access URLs:%NC%
echo   Frontend:  %FRONTEND_URL%
echo   Backend:   %BACKEND_URL%
echo   Health:    %HEALTH_URL%
echo   Database:  localhost:%DB_PORT%
echo.
echo %GREEN%Useful Commands:%NC%
echo   View logs:     docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart:       docker-compose restart
echo   Shell access:  docker-compose exec app sh
echo.
echo %GREEN%Make Commands (if available):%NC%
echo   make logs      - View logs
echo   make status    - Show status
echo   make health    - Health check
echo   make down      - Stop services
echo   make restart   - Restart services
echo.
echo %GREEN%🚀 TechOps Dashboard is now running!%NC%
echo %GREEN%📖 Check the logs with: docker-compose logs -f%NC%
echo %GREEN%📋 Deployment log saved to: %LOG_FILE%%NC%
echo.
goto end

:cleanup_failure
echo %RED%💥 Deployment failed. Cleaning up...%NC%
echo %date% %time% [ERROR] Deployment failed >> "%LOG_FILE%"
docker-compose down --remove-orphans >nul 2>&1
echo %YELLOW%🧹 Cleanup completed. Check logs for details: %LOG_FILE%%NC%
echo.
pause
exit /b 1

:end
echo Press any key to exit...
pause >nul
exit /b 0