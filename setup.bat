@echo off
REM Setup script for sync-5th-tab application
REM Clears frontend cache, installs dependencies, and runs Prisma migrations

echo ========================================
echo Starting Application Setup
echo ========================================
echo.

REM Step 1: Delete Frontend Cache
echo [1/7] Deleting frontend cache (.nuxt folder)...
if exist "apps\frontend\.nuxt" (
    rmdir /s /q "apps\frontend\.nuxt"
    if errorlevel 1 (
        echo ERROR: Failed to delete .nuxt folder
        pause
        exit /b 1
    )
    echo Frontend cache deleted successfully.
) else (
    echo .nuxt folder not found, skipping...
)
echo.

REM Step 2: Install Frontend Dependencies
echo [2/7] Installing frontend dependencies...
cd apps\frontend
if errorlevel 1 (
    echo ERROR: Failed to change to frontend directory
    pause
    exit /b 1
)
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully.
cd ..\..
echo.

REM Step 3: Install Backend Dependencies
echo [3/7] Installing backend dependencies...
cd apps\backend
if errorlevel 1 (
    echo ERROR: Failed to change to backend directory
    pause
    exit /b 1
)
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    cd ..\..
    pause
    exit /b 1
)
echo Backend dependencies installed successfully.
echo.

REM Step 4: Run Prisma Migrations
echo [4/7] Running Prisma migrate dev...
call npx prisma migrate dev
if errorlevel 1 (
    echo ERROR: Failed to run prisma migrate dev
    cd ..\..
    pause
    exit /b 1
)
echo Prisma migrate dev completed successfully.
echo.

echo [5/7] Running Prisma migrate deploy...
call npx prisma migrate deploy
if errorlevel 1 (
    echo ERROR: Failed to run prisma migrate deploy
    cd ..\..
    pause
    exit /b 1
)
echo Prisma migrate deploy completed successfully.
echo.

REM Step 5: Generate Prisma Client
echo [6/7] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)
echo Prisma client generated successfully.
cd ..\..
echo.

REM Step 6: Start Development Servers
echo [7/7] Starting development servers...
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Starting npm run dev...
echo.

call npm run dev

