#!/bin/bash
# Oracle Cloud Backend Update Script - Updates backend with GitHub Pages CORS

set -e

ORACLE_IP="132.145.59.91"
ORACLE_USER="ubuntu"

echo "Nexus Oracle Cloud Backend Update"
echo "================================"
echo "Target: $ORACLE_USER@$ORACLE_IP"
echo

# Check if we can reach the server
echo "[INFO] Checking Oracle Cloud server connectivity..."
if ! nc -z $ORACLE_IP 22 2>/dev/null; then
    echo "[ERROR] Cannot reach Oracle Cloud server on port 22"
    echo "Make sure:"
    echo "1. Server is running"
    echo "2. SSH port 22 is open"
    echo "3. IP address is correct: $ORACLE_IP"
    exit 1
fi
echo "[SUCCESS] Oracle Cloud server is reachable"

echo
echo "[INFO] Updating backend environment and restarting services..."
echo "This will:"
echo "1. Update the CORS configuration for GitHub Pages"
echo "2. Restart the backend service" 
echo "3. Verify the API is responding"
echo

# Connect to Oracle Cloud and update backend
ssh -o StrictHostKeyChecking=no $ORACLE_USER@$ORACLE_IP << 'EOF'
    echo "[INFO] Connected to Oracle Cloud server"
    
    # Navigate to backend directory
    cd /opt/nexus/backend || { echo "[ERROR] Backend directory not found"; exit 1; }
    
    # Update environment with GitHub Pages CORS
    echo "[INFO] Updating environment configuration..."
    cat > .env << 'ENVEOF'
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
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
ENVEOF
    
    echo "[SUCCESS] Environment updated with GitHub Pages CORS"
    
    # Restart PM2 processes
    echo "[INFO] Restarting backend services..."
    pm2 restart all || {
        echo "[INFO] Starting backend for first time..."
        pm2 start src/server.js --name "nexus-backend"
    }
    
    echo "[SUCCESS] Backend services restarted"
    
    # Wait for services to start
    sleep 3
    
    # Check API health
    echo "[INFO] Checking API health..."
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "[SUCCESS] API is responding on port 5000"
    else
        echo "[WARNING] API health check failed - may still be starting"
    fi
    
    # Show PM2 status
    echo "[INFO] Backend service status:"
    pm2 list
    
EOF

echo
echo "[SUCCESS] Oracle Cloud backend updated!"
echo
echo "Updated configuration:"
echo "  CORS: https://snomn123.github.io"  
echo "  API:  http://$ORACLE_IP/api"
echo
echo "Test the connection:"
echo "  curl http://$ORACLE_IP/api/health"
echo
echo "Your GitHub Pages frontend should now connect successfully!"