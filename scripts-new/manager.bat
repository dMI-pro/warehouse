@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo        Warehouse Scripts (Windows)
echo ==========================================
echo.
echo  1. Backup Database (local)
echo  2. Backup MinIO (local)
echo  3. Sync MinIO -^> VPS
echo  4. Check MinIO
echo  5. Fix MinIO public policy (local)
echo.
echo  VPS: ssh warehouse-vps and run ./scripts-new/manager.sh
echo  Mac: use manager.sh / pull-prod-to-local.sh for prod -^> local
echo  0. Exit
echo.
set /p choice=Select: 

if "%choice%"=="1" call "%~dp0windows\backup-db.bat" & goto menu
if "%choice%"=="2" call "%~dp0windows\backup-minio.bat" & goto menu
if "%choice%"=="3" call "%~dp0windows\sync-minio-to-vps.bat" & goto menu
if "%choice%"=="4" call "%~dp0windows\check-minio.bat" & goto menu
if "%choice%"=="5" call "%~dp0windows\fix-minio-public.bat" & goto menu
if "%choice%"=="0" exit /b 0

echo Invalid option.
pause
goto menu
