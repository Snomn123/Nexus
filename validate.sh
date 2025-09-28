#!/bin/bash

# Nexus Project Validation Script
# Checks if the project is properly set up for git clone and build

echo "Validating Nexus project setup..."

# Check required files
echo "📁 Checking required files..."

required_files=(
    "README.md"
    "docker-compose.yml"
    "backend/schema.sql" 
    "backend/package.json"
    "backend/.env.example"
    "frontend/package.json"
    "frontend/.env.example"
    "frontend/public/index.html"
    "frontend/public/manifest.json"
    ".env.docker.example"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -eq 0 ]]; then
    echo "All required files present"
else
    echo "❌ Missing files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi

# Check migrations directory
echo "🗃️  Checking migrations..."
if [[ -d "backend/src/migrations" ]]; then
    migration_count=$(find backend/src/migrations -name "*.sql" | wc -l)
    echo "Found $migration_count migration files"
else
    echo "❌ Migrations directory not found"
fi

# Check if schema.sql contains required tables  
echo "📊 Validating database schema..."
if [[ -f "backend/schema.sql" ]]; then
    required_tables=("users" "servers" "channels" "messages" "direct_messages")
    missing_tables=()
    
    for table in "${required_tables[@]}"; do
        if ! grep -q "CREATE TABLE.*$table" backend/schema.sql; then
            missing_tables+=("$table")
        fi
    done
    
    if [[ ${#missing_tables[@]} -eq 0 ]]; then
        echo "All required database tables present in schema"
    else
        echo "Missing database tables in schema:"
        for table in "${missing_tables[@]}"; do
            echo "   - $table"
        done
    fi
else
    echo "❌ Database schema file not found"
fi

# Check package.json files have required scripts
echo "📦 Checking package.json scripts..."

# Backend scripts
if [[ -f "backend/package.json" ]]; then
    if grep -q '"migrate"' backend/package.json; then
        echo "Backend migration scripts present"
    else
        echo "Backend migration scripts missing"
    fi
fi

# Frontend scripts  
if [[ -f "frontend/package.json" ]]; then
    if grep -q '"start"' frontend/package.json && grep -q '"build"' frontend/package.json; then
        echo "Frontend build scripts present"
    else
        echo "Frontend build scripts missing"
    fi
fi

# Check Docker configuration
echo "🐳 Checking Docker configuration..."
if [[ -f "docker-compose.yml" ]]; then
    if grep -q "postgres" docker-compose.yml && grep -q "redis" docker-compose.yml; then
        echo "✅ Docker services configured"
    else
        echo "⚠️  Docker services incomplete"
    fi
fi

echo ""
echo "🎯 Validation complete!"
echo ""
echo "To test the full setup:"
echo "1. Run: docker-compose up -d postgres redis"
echo "2. Run: cd backend && npm install && npm run migrate"  
echo "3. Run: cd frontend && npm install && npm start"
echo ""