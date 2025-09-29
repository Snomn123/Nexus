#!/bin/bash
# Environment Setup Script - Configures both local and production environments

set -e

print_status() {
    echo "[INFO] $1"
}

print_success() {
    echo "[SUCCESS] $1"
}

print_error() {
    echo "[ERROR] $1"
}

# Function to setup backend environment
setup_backend_env() {
    local env_type=$1
    print_status "Setting up backend environment for: $env_type"
    
    cd backend
    
    if [ "$env_type" = "production" ]; then
        cat > .env.production << EOF
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://snomn123.github.io
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus
DB_USER=nexus_user
DB_PASSWORD=nexus123
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
EOF
        print_success "Backend production environment created"
    else
        if [ ! -f .env ]; then
            cp .env.example .env
            print_success "Backend development environment created from example"
        else
            print_status "Backend development environment already exists"
        fi
    fi
    
    cd ..
}

# Function to setup frontend environment
setup_frontend_env() {
    local env_type=$1
    print_status "Setting up frontend environment for: $env_type"
    
    cd frontend
    
    if [ "$env_type" = "production" ]; then
        cat > .env.production << EOF
# Production environment variables for GitHub Pages deployment
REACT_APP_API_URL=http://132.145.59.91/api
REACT_APP_SOCKET_URL=http://132.145.59.91
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
CI=false
EOF
        print_success "Frontend production environment created"
    else
        if [ ! -f .env ]; then
            cp .env.example .env
            print_success "Frontend development environment created from example"
        else
            print_status "Frontend development environment already exists"
        fi
    fi
    
    cd ..
}

# Main script logic
echo "Nexus Environment Setup"
echo "======================"

# Check if we're setting up for production or development
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    print_status "Setting up PRODUCTION environments..."
    setup_backend_env "production"
    setup_frontend_env "production"
    
    print_success "Production environments configured!"
    echo
    echo "Backend configured for GitHub Pages CORS:"
    echo "  FRONTEND_URL=https://snomn123.github.io"
    echo
    echo "Frontend configured for Oracle Cloud API:"
    echo "  REACT_APP_API_URL=http://132.145.59.91/api"
    echo "  REACT_APP_SOCKET_URL=http://132.145.59.91"
    
elif [ "$1" = "development" ] || [ "$1" = "dev" ] || [ -z "$1" ]; then
    print_status "Setting up DEVELOPMENT environments..."
    setup_backend_env "development"
    setup_frontend_env "development"
    
    print_success "Development environments configured!"
    echo
    echo "Both backend and frontend configured for local development"
    echo "Backend: http://localhost:5000"
    echo "Frontend: http://localhost:3000"
    
else
    print_error "Invalid argument. Use: production|prod|development|dev"
    echo "Usage: $0 [production|development]"
    echo "  production  - Setup for GitHub Pages + Oracle Cloud deployment"
    echo "  development - Setup for local development (default)"
    exit 1
fi

echo
echo "Next steps:"
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    echo "1. Commit these environment files"
    echo "2. Push to trigger GitHub Pages deployment"
    echo "3. Update Oracle Cloud backend with: ./scripts/update-oracle-backend.sh"
else
    echo "1. Start backend: cd backend && npm run dev"
    echo "2. Start frontend: cd frontend && npm start"
fi