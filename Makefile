.PHONY: help setup dev up down logs build migrate seed studio clean

# Cores
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m

help: ## Mostra esta ajuda
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Configura o projeto pela primeira vez
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

dev: ## Inicia em modo desenvolvimento (sem nginx)
	docker compose up -d postgres redis api frontend worker
	@echo "$(GREEN)Serviços iniciados!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "API:      http://localhost:3001"

up: ## Inicia todos os containers
	docker compose up -d

down: ## Para todos os containers
	docker compose down

logs: ## Mostra logs de todos os containers
	docker compose logs -f

logs-api: ## Mostra logs da API
	docker compose logs -f api

logs-worker: ## Mostra logs do Worker
	docker compose logs -f worker

build: ## Reconstrói as imagens
	docker compose build --no-cache

migrate: ## Executa migrations do Prisma
	docker compose exec api npx prisma migrate dev

migrate-deploy: ## Executa migrations em produção
	docker compose exec api npx prisma migrate deploy

seed: ## Popula banco com dados de teste
	docker compose exec api npm run db:seed

studio: ## Abre Prisma Studio
	docker compose exec api npx prisma studio

shell-api: ## Acessa shell do container da API
	docker compose exec api sh

shell-db: ## Acessa psql do PostgreSQL
	docker compose exec postgres psql -U clinica -d clinica_db

clean: ## Remove containers, volumes e imagens
	docker compose down -v --rmi local
	@echo "$(GREEN)Limpeza concluída!$(NC)"

restart: down up ## Reinicia todos os containers

prod: ## Inicia em modo produção (com nginx)
	docker compose --profile production up -d

deploy: ## Deploy na VPS
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh
