#!/bin/bash
# Nexus Discord Clone - Oracle Cloud Setup
# Installs backend dependencies and configures services

set -e  # Exit on any error

echo "Starting Nexus Discord Backend Setup..."
echo "Estimated time: 3-5 minutes"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root! Run as ubuntu user."
    exit 1
fi

print_status "Updating system packages..."
sudo apt update -y

print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

print_status "Verifying Node.js installation..."
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is not supported. Requires Node.js 18+"
    exit 1
fi
print_success "Node.js $NODE_VERSION installed successfully"

print_status "Installing PostgreSQL and Redis..."
sudo apt install -y postgresql postgresql-contrib redis-server

print_status "Installing Nginx and PM2..."
sudo apt install -y nginx
sudo npm install -g pm2

print_status "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE nexus;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER nexus_user WITH PASSWORD 'nexus123';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nexus TO nexus_user;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER nexus_user CREATEDB;" 2>/dev/null || true

print_status "Cloning Nexus repository..."
cd ~
rm -rf Nexus 2>/dev/null || true
git clone https://github.com/Snomn123/Nexus.git
cd Nexus/backend

print_status "Installing Node.js dependencies..."
npm install

print_status "Creating environment configuration..."
cat > .env.production << EOF
NODE_ENV=production
PORT=5000
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

print_status "Running database migrations..."
npm run migrate || print_error "Migrations failed - continuing anyway"

print_status "Starting backend with PM2..."
pm2 stop nexus 2>/dev/null || true
pm2 delete nexus 2>/dev/null || true
pm2 start src/server.js --name nexus --env production
pm2 save
pm2 startup | grep -v "PM2" | sudo bash || true

print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/nexus > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:5000/api/health;
    }
    
    location / {
        return 200 'Nexus API Server Running';
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

print_status "Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

print_status "Starting services..."
sudo systemctl enable postgresql redis-server nginx
sudo systemctl start postgresql redis-server nginx

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "YOUR-ORACLE-IP")

print_success "Setup complete"
echo
echo "Nexus Discord Backend is now running"
echo
echo "API URL: http://$SERVER_IP/api"
echo "Health Check: http://$SERVER_IP/health"
echo
echo "Next steps:"
echo "1. Update frontend/.env.production with:"
echo "   REACT_APP_API_URL=http://$SERVER_IP/api"
echo "2. Commit and push your frontend changes"
echo "3. Test application functionality"
echo
echo "Useful commands:"
echo "  pm2 status          - Check backend status"
echo "  pm2 logs nexus      - View backend logs"
echo "  pm2 restart nexus   - Restart backend"
echo
print_success "Setup completed successfully"