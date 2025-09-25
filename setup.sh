#!/bin/bash

# Nexus Setup Script
# Automates the initial setup process for new clones

echo "🚀 Setting up Nexus project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if files already exist
if [[ -f ".env.docker" ]]; then
    read -p "⚠️  Environment files already exist. Overwrite? (y/N): " overwrite
    if [[ $overwrite != "y" && $overwrite != "Y" ]]; then
        echo "ℹ️  Skipping environment file setup..."
    else
        echo "📝 Setting up environment files..."
        cp .env.docker.example .env.docker
        cp backend/.env.example backend/.env  
        cp frontend/.env.example frontend/.env
    fi
else
    echo "📝 Setting up environment files..."
    cp .env.docker.example .env.docker
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Run database migrations
echo "🗃️  Running database migrations..."
npm run migrate

echo ""
echo "✅ Setup complete! To start the application:"
echo ""
echo "   1. Start the backend:"
echo "      cd backend && npm run dev"
echo ""  
echo "   2. In a new terminal, start the frontend:"
echo "      cd frontend && npm install && npm start"
echo ""
echo "   3. Access the application at http://localhost:3000"
echo ""
echo "🎉 Happy coding!"