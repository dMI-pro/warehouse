.PHONY: help up down logs restart clean migrate seed

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

seed:
	docker exec antiquar-backend npx prisma db seed

backup:
	docker exec antiquar-db pg_dump -U antiquar_user antiquar_warehouse > backup_$(date +%Y%m%d_%H%M%S).sql

psql:
	docker exec -it antiquar-db psql -U antiquar_user -d antiquar_warehouse