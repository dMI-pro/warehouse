.PHONY: help up down logs restart clean migrate seed backup restore prisma-generate prisma-deploy env-refresh minio-backup minio-restore db-url

help:
	@echo "Available commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - Show logs"
	@echo "  make restart   - Restart all services"
	@echo "  make clean     - Stop and remove all containers, volumes"
	@echo "  make migrate   - Run database migrations"
	@echo "  make seed      - Seed database with initial data"
	@echo "  make backup    - Backup database"
	@echo "  make restore FILE=path.sql - Restore database from backup"
	@echo "  make prisma-generate - Run Prisma generate in backend"
	@echo "  make prisma-deploy   - Run Prisma migrate deploy in backend"
	@echo "  make env-refresh     - Recreate containers to apply .env changes"
	@echo "  make minio-backup    - Backup MinIO bucket to ./minio_backup"
	@echo "  make minio-restore   - Restore MinIO bucket from ./minio_backup"
	@echo "  make db-url          - Show DATABASE_URL inside backend"

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

migrate:
	docker exec antiquar-backend npx prisma migrate dev
# 	docker exec -it antiquar-backend npx prisma migrate dev --name add_warehouse_comittee_and_product_fields для запуска из папки warehouse


seed:
	docker exec antiquar-backend npx prisma db seed

backup:
	docker exec antiquar-db pg_dump -U antiquar --clean --if-exists antiquar_db | Out-File -FilePath backup_no_bom.sql -Encoding ASCII

psql:
	docker exec -it antiquar-db psql -U antiquar -d antiquar_db
	# VPS: docker exec -it antiquar-db psql -U nachalnik_db -d antiquar_db

restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backup.sql"; exit 1; fi
	docker cp "$(FILE)" antiquar-db:/tmp/restore.sql
	docker exec antiquar-db bash -lc "psql -U antiquar -d antiquar_db -f /tmp/restore.sql"

prisma-generate:
	docker exec antiquar-backend npx prisma generate

prisma-deploy:
	docker exec antiquar-backend npx prisma migrate deploy

env-refresh:
	docker-compose down
	docker-compose up -d

db-url:
	docker exec antiquar-backend printenv DATABASE_URL

minio-backup:
	docker run --rm --network container:antiquar-minio -v "$(CURDIR)/minio_backup":/backup minio/mc sh -lc "mc alias set local http://localhost:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD && mc mirror local/antiquar-products /backup/antiquar-products"

minio-restore:
	docker run --rm --network container:antiquar-minio -v "$(CURDIR)/minio_backup":/backup minio/mc sh -lc "mc alias set local http://localhost:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD && mc mirror /backup/antiquar-products local/antiquar-products"
