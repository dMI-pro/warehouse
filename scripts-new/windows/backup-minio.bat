@echo off
setlocal
cd /d "%~dp0"

set "BACKUP_ROOT=..\..\backups-new\minio"
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"

pushd "%BACKUP_ROOT%"
set "ABS_BACKUP_ROOT=%CD%"
popd

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TIMESTAMP=%%I"
set "BACKUP_FOLDER=minio-backup-%TIMESTAMP%"

echo Creating MinIO backup in %ABS_BACKUP_ROOT%\%BACKUP_FOLDER%...
docker run --rm --volumes-from antiquar-minio -v "%ABS_BACKUP_ROOT%/%BACKUP_FOLDER%":/backup alpine sh -c "for item in /data/*; do [ -d \"$item\" ] || continue; name=$(basename \"$item\"); case \"$name\" in .minio.sys|.*) continue ;; esac; cp -a \"$item\" /backup/; done"

echo Backup created at %ABS_BACKUP_ROOT%\%BACKUP_FOLDER%
pause
