#!/bin/bash

# TechOps Dashboard - Automated Docker Deployment Script
# This script automates the complete deployment process for the TechOps Dashboard
# Author: Senior Full-Stack Engineer
# Version: 1.0.0

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="techops-dashboard"
LOG_FILE="${SCRIPT_DIR}/deployment.log"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds

# URLs for health checks
FRONTEND_URL="http://localhost:8080"
BACKEND_URL="http://localhost:8081/api"
HEALTH_URL="http://localhost:8081/api/health"
DB_PORT="5433"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
    log "INFO" "$message"
}

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  TechOps Dashboard Deployment Script"
    echo "=========================================="
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "$BLUE" "🔍 Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("docker")
    else
        # Check if Docker daemon is running
        if ! docker info >/dev/null 2>&1; then
            print_status "$RED" "❌ Docker daemon is not running. Please start Docker."
            exit 1
        fi
        print_status "$GREEN" "✅ Docker is installed and running"
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("docker-compose")
    else
        print_status "$GREEN" "✅ Docker Compose is available"
    fi
    
    # Check Make (optional but recommended)
    if ! command_exists make; then
        print_status "$YELLOW" "⚠️  Make is not installed (optional but recommended)"
    else
        print_status "$GREEN" "✅ Make is available"
    fi
    
    # Check curl for health checks
    if ! command_exists curl; then
        missing_deps+=("curl")
    else
        print_status "$GREEN" "✅ curl is available"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_status "$RED" "❌ Missing dependencies: ${missing_deps[*]}"
        print_status "$YELLOW" "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_status "$GREEN" "✅ All prerequisites met!"
}

# Check if ports are available
check_ports() {
    print_status "$BLUE" "🔍 Checking port availability..."
    
    local ports=("8080" "8081" "$DB_PORT")
    local busy_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            busy_ports+=("$port")
        fi
    done
    
    if [ ${#busy_ports[@]} -ne 0 ]; then
        print_status "$YELLOW" "⚠️  The following ports are in use: ${busy_ports[*]}"
        print_status "$YELLOW" "The deployment will attempt to stop existing containers first."
    else
        print_status "$GREEN" "✅ All required ports are available"
    fi
}

# Validate environment files
validate_environment() {
    print_status "$BLUE" "🔍 Validating environment configuration..."
    
    local env_files=(
        ".env.production"
        "backend/.env.production"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ ! -f "$env_file" ]; then
            print_status "$RED" "❌ Missing environment file: $env_file"
            exit 1
        else
            print_status "$GREEN" "✅ Found $env_file"
        fi
    done
    
    # Check for default/insecure values in production
    if grep -q "docker_jwt_secret_2024_change_in_production" backend/.env.production; then
        print_status "$YELLOW" "⚠️  WARNING: Using default JWT secret in production environment!"
        print_status "$YELLOW" "    Please update JWT_SECRET in backend/.env.production for security."
    fi
    
    if grep -q "docker_postgres_2024" backend/.env.production; then
        print_status "$YELLOW" "⚠️  WARNING: Using default database password!"
        print_status "$YELLOW" "    Please update DB_PASSWORD in backend/.env.production for security."
    fi
}

# Stop existing containers
stop_existing() {
    print_status "$BLUE" "🛑 Stopping existing containers..."
    
    # Stop both production and development containers
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    # Remove any orphaned containers
    docker container prune -f >/dev/null 2>&1 || true
    
    print_status "$GREEN" "✅ Existing containers stopped"
}

# Build containers
build_containers() {
    print_status "$BLUE" "🔨 Building Docker containers..."
    
    # Build with no cache to ensure fresh build
    if docker-compose build --no-cache; then
        print_status "$GREEN" "✅ Containers built successfully"
    else
        print_status "$RED" "❌ Failed to build containers"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "$BLUE" "🚀 Starting services..."
    
    if docker-compose up -d; then
        print_status "$GREEN" "✅ Services started successfully"
    else
        print_status "$RED" "❌ Failed to start services"
        exit 1
    fi
}

# Wait for database to be ready
wait_for_database() {
    print_status "$BLUE" "⏳ Waiting for database to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U postgres -d dashboard >/dev/null 2>&1; then
            print_status "$GREEN" "✅ Database is ready"
            return 0
        fi
        
        print_status "$YELLOW" "⏳ Database not ready yet (attempt $attempt/$max_attempts)..."
        sleep 5
        ((attempt++))
    done
    
    print_status "$RED" "❌ Database failed to become ready within timeout"
    return 1
}

# Health check function
perform_health_check() {
    print_status "$BLUE" "🏥 Performing health checks..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + HEALTH_CHECK_TIMEOUT))
    
    # Wait for backend health check
    while [ $(date +%s) -lt $end_time ]; do
        if curl -s "$HEALTH_URL" >/dev/null 2>&1; then
            print_status "$GREEN" "✅ Backend health check passed"
            break
        fi
        print_status "$YELLOW" "⏳ Waiting for backend to be healthy..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    # Final health check
    if ! curl -s "$HEALTH_URL" >/dev/null 2>&1; then
        print_status "$RED" "❌ Backend health check failed"
        return 1
    fi
    
    # Check frontend accessibility
    if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
        print_status "$GREEN" "✅ Frontend is accessible"
    else
        print_status "$YELLOW" "⚠️  Frontend may not be fully ready yet"
    fi
    
    return 0
}

# Show deployment status
show_status() {
    print_status "$BLUE" "📊 Deployment Status:"
    
    echo -e "${GREEN}Container Status:${NC}"
    docker-compose ps
    
    echo -e "\n${GREEN}Access URLs:${NC}"
    echo -e "  Frontend:  ${FRONTEND_URL}"
    echo -e "  Backend:   ${BACKEND_URL}"
    echo -e "  Health:    ${HEALTH_URL}"
    echo -e "  Database:  localhost:${DB_PORT}"
    
    echo -e "\n${GREEN}Useful Commands:${NC}"
    echo -e "  View logs:     docker-compose logs -f"
    echo -e "  Stop services: docker-compose down"
    echo -e "  Restart:       docker-compose restart"
    echo -e "  Shell access:  docker-compose exec app sh"
    
    if command_exists make; then
        echo -e "\n${GREEN}Make Commands:${NC}"
        echo -e "  make logs      - View logs"
        echo -e "  make status    - Show status"
        echo -e "  make health    - Health check"
        echo -e "  make down      - Stop services"
        echo -e "  make restart   - Restart services"
    fi
}

# Cleanup on failure
cleanup_on_failure() {
    print_status "$RED" "💥 Deployment failed. Cleaning up..."
    docker-compose down --remove-orphans 2>/dev/null || true
    print_status "$YELLOW" "🧹 Cleanup completed. Check logs for details: $LOG_FILE"
}

# Main deployment function
main() {
    # Initialize log file
    echo "Deployment started at $(date)" > "$LOG_FILE"
    
    print_banner
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    # Run deployment steps
    check_prerequisites
    check_ports
    validate_environment
    stop_existing
    build_containers
    start_services
    wait_for_database
    
    # Perform health checks
    if perform_health_check; then
        print_status "$GREEN" "🎉 Deployment completed successfully!"
        show_status
        
        echo -e "\n${GREEN}🚀 TechOps Dashboard is now running!${NC}"
        echo -e "${GREEN}📖 Check the logs with: docker-compose logs -f${NC}"
        echo -e "${GREEN}📋 Deployment log saved to: $LOG_FILE${NC}"
    else
        print_status "$RED" "❌ Health checks failed. Deployment may have issues."
        print_status "$YELLOW" "📋 Check logs with: docker-compose logs"
        exit 1
    fi
    
    # Remove trap
    trap - ERR
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi