.PHONY: up down build restart logs ps clean migrate seed backend-logs frontend-logs mysql-logs shell-backend

up: ## Build (if needed) and start the whole stack in the background
	docker compose up -d --build

down: ## Stop and remove the stack (keeps volumes)
	docker compose down

build: ## Rebuild images without starting
	docker compose build

restart: down up ## Restart the whole stack

logs: ## Tail logs for every service
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend

mysql-logs:
	docker compose logs -f mysql

ps: ## Show running services
	docker compose ps

migrate: ## Run Prisma migrations against the running backend
	docker compose exec backend npx prisma migrate deploy

seed: ## Run the Prisma seed script
	docker compose exec backend npx prisma db seed

shell-backend: ## Open a shell in the backend container
	docker compose exec backend sh

clean: ## Stop the stack and remove volumes (DESTROYS local DB/uploads data)
	docker compose down -v
