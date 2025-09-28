# Production Deployment Guide

## Pre-Deployment Setup

### Generate Production Secrets
```bash
# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('DB_PASSWORD=' + require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))"
node -e "console.log('REDIS_PASSWORD=' + require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20))"
```

### 2. **Create Production Environment File**
Create `.env.production` in the root directory:

```bash
# Copy the template
cp backend/.env.production.example .env.production

# Edit with your generated secrets
# CRITICAL: Never commit this file to Git!
```

### 3. **Update Configuration**
Update these values in `.env.production`:
- `FRONTEND_URL=https://your-domain.com`
- `JWT_SECRET=` (your generated secret)
- `JWT_REFRESH_SECRET=` (your generated secret)  
- `DB_PASSWORD=` (your generated password)
- `REDIS_PASSWORD=` (your generated password)

## Docker Production Deployment

### Local Production Test
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up --build

# Access at: http://localhost
```

### Server Deployment with SSL
```bash
# 1. Set up SSL certificates (Let's Encrypt recommended)
mkdir -p nginx/ssl
# Copy your SSL certificates to nginx/ssl/

# 2. Update nginx configuration
# Uncomment HTTPS server block in nginx/nginx.prod.conf
# Update server_name with your domain

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verify deployment
curl https://your-domain.com/health
```

## ☁️ Cloud Deployment Options

### **AWS ECS Deployment**
```bash
# 1. Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t nexus-backend -f backend/Dockerfile.prod backend/
docker tag nexus-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/nexus-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/nexus-backend:latest

docker build -t nexus-frontend -f frontend/Dockerfile.prod frontend/
docker tag nexus-frontend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/nexus-frontend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/nexus-frontend:latest

# 2. Deploy using ECS service definitions
```

### **DigitalOcean App Platform**
```bash
# 1. Create app.yaml configuration
# 2. Connect GitHub repository
# 3. Set environment variables in DO dashboard
# 4. Deploy with automatic SSL
```

### **Railway/Render Deployment**
```bash
# 1. Connect GitHub repository
# 2. Set environment variables
# 3. Configure build settings
# 4. Deploy with automatic SSL
```

## 🔒 Production Security Checklist

- [ ] **SSL/HTTPS enabled**
- [ ] **Strong secrets generated and set**
- [ ] **Database connection encrypted**
- [ ] **Redis password protected** 
- [ ] **CORS origins restricted to your domain**
- [ ] **Rate limiting configured**
- [ ] **Security headers enabled**
- [ ] **No debug/development features enabled**
- [ ] **Environment variables secured**
- [ ] **Container security hardened**

## 📊 Monitoring & Maintenance

### **Health Checks**
```bash
# Application health
curl https://your-domain.com/health

# API health
curl https://your-domain.com/api/health

# Database connectivity
docker exec nexus_postgres_prod pg_isready

# Redis connectivity  
docker exec nexus_redis_prod redis-cli ping
```

### **Log Monitoring**
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx access logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### **Performance Monitoring**
- Set up application performance monitoring (APM)
- Configure log aggregation (ELK stack, CloudWatch, etc.)
- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- Monitor resource usage (CPU, memory, disk)

## 🚨 Backup Strategy

### **Database Backups**
```bash
# Create backup
docker exec nexus_postgres_prod pg_dump -U nexus_user -d nexus > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i nexus_postgres_prod psql -U nexus_user -d nexus < backup_file.sql
```

### **File Uploads Backup**
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz ./data/uploads/
```

## 📈 Scaling Considerations

### **Horizontal Scaling**
- Use load balancer (nginx, ALB, CloudFlare)
- Scale backend containers with Docker Swarm/Kubernetes
- Implement Redis Cluster for session storage
- Use read replicas for database

### **Performance Optimization**
- Enable Redis caching for frequent queries
- Implement CDN for static assets
- Use connection pooling for database
- Optimize SQL queries and add indexes

## 🎯 Post-Deployment Tasks

1. **Test all functionality**
2. **Set up monitoring alerts** 
3. **Configure automated backups**
4. **Document deployment process**
5. **Set up CI/CD pipeline**
6. **Plan disaster recovery**

---

## 🎉 Your Nexus Application is Production-Ready!

With this production setup, you have:
- ✅ **Enterprise-grade security**
- ✅ **Scalable architecture** 
- ✅ **High availability**
- ✅ **Monitoring & logging**
- ✅ **SSL termination**
- ✅ **Container orchestration**