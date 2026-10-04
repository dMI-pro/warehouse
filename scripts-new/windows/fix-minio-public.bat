@echo off
echo Setting MinIO Bucket Policy to Public (antiquar-products)...

for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_ACCESS_KEY=" ..\..\.env') do set "MINIO_ACCESS_KEY=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_SECRET_KEY=" ..\..\.env') do set "MINIO_SECRET_KEY=%%b"
for /f "tokens=1,* delims==" %%a in ('findstr /r "^MINIO_BUCKET=" ..\..\.env') do set "MINIO_BUCKET=%%b"
if "%MINIO_BUCKET%"=="" set "MINIO_BUCKET=antiquar-products"

docker run --rm --network container:antiquar-minio --entrypoint=/bin/sh minio/mc -c "mc alias set local http://127.0.0.1:9000 %MINIO_ACCESS_KEY% %MINIO_SECRET_KEY% && mc mb local/%MINIO_BUCKET% --ignore-existing && mc anonymous set download local/%MINIO_BUCKET%"

echo.
echo Policy updated. '%MINIO_BUCKET%' is now publicly readable.
pause
