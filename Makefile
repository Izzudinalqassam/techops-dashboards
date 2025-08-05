# TechOps Dashboard - Docker Management Makefile
# This Makefile provides convenient commands for Docker operations

.PHONY: help build up down logs clean dev prod restart status health backup restore

# Default target
help:
	@echo "TechOps Dashboard - Docker Commands"
	@echo "==================================="
	@echo ""
	@echo "Production Commands:"
	@echo "  make build     - Build production containers"
	@echo "  make up        - Start production services"
	@echo "  make down      - Stop production services"
	@echo "  make prod      - Build and start production (build + up)"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev       - Start development environment with hot reload"
	@echo "  make dev-down  - Stop development environment"
	@echo "  make dev-logs  - View development logs"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-only   - Start only PostgreSQL and Redis"
	@echo "  make db-shell  - Connect to PostgreSQL shell"
	@echo "  make backup    - Backup database"
	@echo "  make restore   - Restore database from backup"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make logs      - View production logs"
	@echo "  make status    - Show container status"
	@echo "  make health    - Check application health"
	@echo "  make restart   - Restart production services"
	@echo "  make clean     - Clean up containers and volumes"
	@echo "  make reset     - Complete reset (clean + build + up)"
	@echo ""
	@echo "Access URLs:"
	@echo "  Production:  http://localhost:8080 (Frontend), http://localhost:8081/api (Backend)"
	@echo "  Development: http://localhost:5173 (Frontend), http://localhost:3001/api (Backend)"
	@echo "  Database:    localhost:5433 (PostgreSQL), localhost:6380 (Redis)"

# Production Commands
build:
	@echo "Building production containers..."
	docker-compose build --no-cache

up:
	@echo "Starting production services..."
	docker-compose up -d
	@echo "Services started! Access at:"
	@echo "  Frontend: http://localhost:8080"
	@echo "  Backend:  http://localhost:8081/api"
	@echo "  Health:   http://localhost:8081/api/health"

down:
	@echo "Stopping production services..."
	docker-compose down

prod: build up
	@echo "Production environment ready!"

# Development Commands
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "Development environment started! Access at:"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:3001/api"
	@echo "  Health:   http://localhost:3001/api/health"

dev-down:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	@echo "Showing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Database Commands
db-only:
	@echo "Starting only database services..."
	docker-compose up postgres redis -d
	@echo "Database services started!"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  Redis:      localhost:6380"

db-shell:
	@echo "Connecting to PostgreSQL shell..."
	docker-compose exec postgres psql -U postgres -d dashboard

backup:
	@echo "Creating database backup..."
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres dashboard > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

restore:
	@echo "Available backups:"
	@ls -la backups/*.sql 2>/dev/null || echo "No backups found"
	@echo "To restore, run: docker-compose exec -T postgres psql -U postgres dashboard < backups/your_backup.sql"

# Utility Commands
logs:
	@echo "Showing production logs..."
	docker-compose logs -f

status:
	@echo "Container Status:"
	docker-compose ps
	@echo ""
	@echo "Resource Usage:"
	docker stats --no-stream

health:
	@echo "Checking application health..."
	@echo "Production Health Check:"
	@curl -s http://localhost:8081/api/health | python -m json.tool 2>/dev/null || echo "Production not running"
	@echo ""
	@echo "Development Health Check:"
	@curl -s http://localhost:3001/api/health | python -m json.tool 2>/dev/null || echo "Development not running"

restart:
	@echo "Restarting production services..."
	docker-compose restart

clean:
	@echo "Cleaning up containers and images..."
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup complete!"

reset: clean build up
	@echo "Complete reset finished!"

# Advanced Commands
shell:
	@echo "Opening shell in production app container..."
	docker-compose exec app sh

dev-shell:
	@echo "Opening shell in development app container..."
	docker-compose -f docker-compose.dev.yml exec app-dev sh

rebuild:
	@echo "Rebuilding and restarting production app..."
	docker-compose up --build app -d

dev-rebuild:
	@echo "Rebuilding and restarting development app..."
	docker-compose -f docker-compose.dev.yml up --build app-dev -d

# Monitoring
monitor:
	@echo "Starting monitoring dashboard..."
	@echo "Press Ctrl+C to stop"
	watch -n 2 'docker stats --no-stream && echo "" && docker-compose ps'

# Network inspection
network:
	@echo "Docker Networks:"
	docker network ls | grep techops
	@echo ""
	@echo "Network Details:"
	docker network inspect techops-dashboards_techops-network 2>/dev/null || echo "Production network not found"
	docker network inspect techops-dashboards_techops-dev-network 2>/dev/null || echo "Development network not found"