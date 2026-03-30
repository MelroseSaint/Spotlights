@echo off
REM Cleanup script for InThaSpotlight
REM Run this from the project directory: cleanup.bat

cd /d "%~dp0"

echo Deleting old Convex backend files...
del /q convex\posts.ts 2>nul
del /q convex\follows.ts 2>nul
del /q convex\auth.ts 2>nul
del /q convex\auth.config.ts 2>nul
del /q convex\config.ts 2>nul
del /q convex\db.ts 2>nul
del /q convex\subscriptions.ts 2>nul
del /q convex\admin.ts 2>nul
del /q convex\users.ts 2>nul

REM Delete the nested Spotlight-main directory if it exists (leftover duplicate)
if exist "Spotlight-main" (
    echo Deleting nested duplicate directory...
    rmdir /s /q "Spotlight-main"
)

echo.
echo Cleanup complete!
echo.
echo Next steps:
echo 1. Run: pnpm install
echo 2. Run: pnpm dev
echo 3. In a separate terminal, run: npx convex dev
echo.
pause
