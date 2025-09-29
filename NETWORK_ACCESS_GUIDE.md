# Network Access Configuration Guide

## Current Setup
The Nexus application has been configured to accept connections from other devices on your local network.

### IP Configuration
- **Server IP**: 192.168.1.85
- **Frontend Port**: 3000 
- **Backend API Port**: 5000
- **Database Admin (Adminer)**: 8080

### Access URLs for Other Devices
- **Main Application**: http://192.168.1.85:3000
- **API Endpoint**: http://192.168.1.85:5000/api
- **Database Admin**: http://192.168.1.85:8080

## Configuration Changes Made

### 1. Backend CORS Configuration
Updated `backend/src/server.js` to accept multiple origins:
- http://localhost:3000 (local development)
- http://192.168.1.85:3000 (network access)

### 2. Environment Variables
Updated configuration files:
- `backend/.env` - FRONTEND_URL set to http://192.168.1.85:3000
- `frontend/.env` - API URLs point to http://192.168.1.85:5000
- `docker-compose.yml` - Environment variables use IP instead of localhost

## Potential Issues & Solutions

### 1. Windows Firewall
If other devices still can't connect, you may need to configure Windows Firewall:

```powershell
# Allow inbound connections on ports 3000 and 5000
netsh advfirewall firewall add rule name="Nexus Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Nexus Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="Nexus Adminer" dir=in action=allow protocol=TCP localport=8080
```

### 2. Docker Desktop Settings
Ensure Docker Desktop is configured to accept external connections:
1. Open Docker Desktop Settings
2. Go to "Resources" > "Network"
3. Make sure "Enable network helpers" is checked

### 3. Network Binding
If issues persist, modify docker-compose.yml to explicitly bind to all interfaces:

Change:
```yaml
ports:
  - "3000:80"
  - "5000:5000"
```

To:
```yaml
ports:
  - "0.0.0.0:3000:80"
  - "0.0.0.0:5000:5000"
```

## Testing Network Access

### From Another Device:
1. **Test Frontend**: Navigate to `http://192.168.1.85:3000`
2. **Test API Health**: Visit `http://192.168.1.85:5000/api/health`
3. **Create Account**: Try registering a new user from the other device

### Expected Behavior:
- Frontend loads successfully
- API calls work (registration, login, etc.)
- WebSocket connections establish for real-time features
- No CORS errors in browser console

## Troubleshooting Commands

Check if services are running:
```bash
docker-compose ps
```

View backend logs for CORS errors:
```bash
docker-compose logs backend -f
```

Test API connectivity:
```bash
curl http://192.168.1.85:5000/api/health
```

## Security Considerations

⚠️ **Important**: This configuration allows network access for development/local use. For production deployment:

1. Use proper domain names instead of IP addresses
2. Enable HTTPS/SSL certificates
3. Configure proper firewall rules
4. Set strong passwords for all services
5. Use production-grade environment variables

## Next Steps

If network access still doesn't work:
1. Check Windows Firewall settings
2. Verify Docker Desktop network configuration
3. Ensure router doesn't block internal connections
4. Test with a simple curl command first