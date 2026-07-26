@echo off
setlocal
cd /d "%~dp0"

echo === Sync MinIO local -^> VPS (mc mirror) ===
echo Credentials from ..\..\scripts-new\vps.minio.env
echo.

set "ENV_LOCAL=..\..\.env"
set "ENV_VPS=..\..\scripts-new\vps.minio.env"

if not exist "%ENV_VPS%" (
    echo Error: vps.minio.env not found
    echo Create scripts-new\vps.minio.env — see vps.minio.env.example
    pause
    exit /b 1
)

for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_ACCESS_KEY=" "%ENV_LOCAL%"') do set "LOCAL_KEY=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_SECRET_KEY=" "%ENV_LOCAL%"') do set "LOCAL_SECRET=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_BUCKET=" "%ENV_LOCAL%"') do set "MINIO_BUCKET=%%b"

for /f "tokens=1,* delims==" %%a in ('findstr /r "^VPS_MINIO_ENDPOINT=" "%ENV_VPS%"') do set "VPS_HOST=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^VPS_MINIO_ACCESS_KEY=" "%ENV_VPS%"') do set "VPS_KEY=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^VPS_MINIO_SECRET_KEY=" "%ENV_VPS%"') do set "VPS_SECRET=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^VPS_MINIO_BUCKET=" "%ENV_VPS%"') do set "VPS_BUCKET=%%b"

if "%MINIO_BUCKET%"=="" set "MINIO_BUCKET=antiquar-products"
if "%VPS_BUCKET%"=="" set "VPS_BUCKET=%MINIO_BUCKET%"

echo Bucket: %MINIO_BUCKET% -^> %VPS_BUCKET%
echo VPS:    %VPS_HOST%
echo.
set /p CONFIRM=Continue? (y/n): 
if /i not "%CONFIRM%"=="y" exit /b 0

docker run --rm --network container:antiquar-minio --entrypoint=/bin/sh minio/mc -c "mc alias set local http://127.0.0.1:9000 %LOCAL_KEY% %LOCAL_SECRET% && mc alias set vps %VPS_HOST% %VPS_KEY% %VPS_SECRET% && mc mirror --overwrite local/%MINIO_BUCKET% vps/%VPS_BUCKET% && mc anonymous set download vps/%VPS_BUCKET%"
if errorlevel 1 goto :fail

echo.
echo Sync completed. Also run backup-db.bat and restore-db on VPS if needed.
goto :end

:fail
echo Sync failed.
:end
pause
endlocal
