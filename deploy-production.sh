#!/bin/bash
# Nexus Production Deployment Script
# This script sets up and deploys Nexus in production mode

set -e  # Exit on any error

echo "🚀 Nexus Production Deployment"
echo "=============================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📋 Please create .env.production with your production secrets."
    echo "💡 Run 'npm run generate-secrets' to generate secure secrets."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "🐳 Please start Docker and try again."
    exit 1
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/postgres data/redis data/uploads nginx/ssl

# Set proper permissions
chmod 755 data/postgres data/redis data/uploads
chmod 700 nginx/ssl

# Load environment variables
echo "🔧 Loading production environment..."
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required variables
REQUIRED_VARS=("JWT_SECRET" "JWT_REFRESH_SECRET" "DB_PASSWORD" "REDIS_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        echo "📋 Please update your .env.production file."
        exit 1
    fi
done

# Check if secrets are still default values
if [[ "$JWT_SECRET" == *"REPLACE"* ]] || [[ "$DB_PASSWORD" == *"REPLACE"* ]]; then
    echo "❌ Error: Default secrets detected in .env.production!"
    echo "🔒 Please replace all REPLACE_WITH_* values with actual secrets."
    echo "💡 Run 'npm run generate-secrets' for secure values."
    exit 1
fi

# Build production images
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start production services
echo "🐳 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."

# Check if containers are running
CONTAINERS=("nexus_postgres_prod" "nexus_redis_prod" "nexus_backend_prod" "nexus_frontend_prod" "nexus_nginx_prod")
for container in "${CONTAINERS[@]}"; do
    if ! docker ps | grep -q "$container"; then
        echo "❌ Error: Container $container is not running!"
        docker-compose -f docker-compose.prod.yml logs "$container"
        exit 1
    else
        echo "✅ $container is running"
    fi
done

# Test application endpoints
echo "🔍 Testing application endpoints..."

# Test health endpoint
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

# Test API health endpoint
if curl -f -s http://localhost/api/health > /dev/null; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Display deployment information
echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================"
echo "📱 Application URL: http://localhost"
echo "🔧 API URL: http://localhost/api"
echo "🏥 Health Check: http://localhost/health"
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Next Steps:"
echo "1. 🌐 Set up your domain and SSL certificates"
echo "2. 🔒 Update FRONTEND_URL in .env.production"
echo "3. 📊 Set up monitoring and logging"
echo "4. 💾 Configure automated backups"
echo "5. 🚦 Set up CI/CD pipeline"

echo ""
echo "📚 Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.prod.yml down"
echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "- Update application: git pull && docker-compose -f docker-compose.prod.yml up -d --build"

echo ""
echo "🎯 Your Nexus application is now running in production mode!"