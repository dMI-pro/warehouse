@echo off
setlocal
cd /d "%~dp0"

set "CONTAINER_NAME=antiquar-db"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^DB_USER=" ..\..\.env') do set "DB_USER=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^DB_NAME=" ..\..\.env') do set "DB_NAME=%%b"
set "BACKUP_DIR=..\..\backups-new\database"

echo Loaded DB_USER: %DB_USER%
echo Loaded DB_NAME: %DB_NAME%
echo Backup directory: %BACKUP_DIR%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set DATE_TIME=%%I

set "FILENAME=%BACKUP_DIR%\backup_%DB_NAME%_%DATE_TIME%.sql"
set "TMPDUMP=/tmp/backup_%DB_NAME%_%DATE_TIME%.sql"

echo Starting backup of %DB_NAME% from container %CONTAINER_NAME%...
echo (pg_dump inside container + docker cp — correct UTF-8)

docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% --no-owner --no-acl -f %TMPDUMP%
if %ERRORLEVEL% neq 0 (
    echo Backup failed! Is container %CONTAINER_NAME% running?
    goto :end
)

docker cp %CONTAINER_NAME%:%TMPDUMP% "%FILENAME%"
if %ERRORLEVEL% neq 0 (
    echo docker cp failed!
    goto :end
)

docker exec %CONTAINER_NAME% rm -f %TMPDUMP%
echo Backup successful! File saved to: %FILENAME%

:end
endlocal
pause
