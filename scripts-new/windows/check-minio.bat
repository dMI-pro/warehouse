@echo off
chcp 65001 >nul
echo ========================================
echo  MinIO Check Script (Warehouse)
echo ========================================
echo.

echo [1/3] Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    goto :end
)
echo Docker OK.

echo [2/3] MinIO container:
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr /i "minio"
echo.

echo [3/3] Bucket contents via volumes-from antiquar-minio...
docker run --rm --volumes-from antiquar-minio alpine sh -c "echo '=== /data ==='; ls -la /data/; echo '=== antiquar-products ==='; ls -la /data/antiquar-products/ 2>/dev/null || echo 'bucket folder not found'; echo files:; find /data/antiquar-products -type f 2>/dev/null | wc -l"

:end
echo.
pause
