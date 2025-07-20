# Deployment Guide

## Overview

This guide covers deployment procedures for the Classified Ads Platform, including environment setup, build process, and production deployment strategies.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **PostgreSQL**: 13.x or higher
- **Memory**: Minimum 2GB RAM for production
- **Storage**: 10GB+ for application and uploads

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/classified_ads

# Server Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secure-session-secret-key

# File Upload Configuration
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png

# Performance Configuration
CACHE_TTL=300000
MAX_REQUEST_SIZE=10mb

# Security Configuration
CORS_ORIGIN=https://yourdomain.com
SECURE_COOKIES=true
```

## Development Deployment

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd classified-ads-platform

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

### Development Environment Variables

```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/classified_ads_dev
SESSION_SECRET=dev-secret-key
PORT=5000
```

## Production Deployment

### 1. Build Process

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Verify build output
ls -la dist/
```

### 2. Database Setup

```bash
# Create production database
createdb classified_ads_production

# Run migrations
npm run db:push
```

### 3. Environment Configuration

Production `.env` file:

```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@db_host:5432/classified_ads_production
SESSION_SECRET=super-secure-production-secret-with-at-least-32-characters
PORT=5000
UPLOAD_MAX_SIZE=5242880
CACHE_TTL=300000
```

### 4. Start Production Server

```bash
# Start the production server
npm start

# Or with process manager (recommended)
pm2 start dist/index.js --name "classified-ads"
```

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/classified_ads
      - SESSION_SECRET=your-production-secret
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=classified_ads
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Cloud Deployment Options

### 1. Replit Deployment

```bash
# Deploy on Replit (automatic)
# Configure environment variables in Replit secrets
# Set up domain in Replit deployments
```

### 2. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

### 3. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### 4. DigitalOcean App Platform

```yaml
# app.yaml
name: classified-ads-platform
services:
- name: web
  source_dir: /
  github:
    repo: your-username/classified-ads-platform
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}

databases:
- name: db
  engine: PG
  version: "15"
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Ensure indexes are in place
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_fields_category ON category_custom_fields(category_id);
```

### 2. Application Optimization

```javascript
// PM2 ecosystem file (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'classified-ads',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=460'
  }]
};
```

### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files
    location /uploads {
        alias /path/to/app/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Application
    location / {
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
}
```

## Monitoring & Maintenance

### 1. Health Checks

```javascript
// Add to server/index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 2. Logging

```javascript
// Production logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 3. Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="classified_ads_production"

# Create backup
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

## Security Checklist

- [ ] Environment variables properly configured
- [ ] Database connections using SSL
- [ ] Session secrets are cryptographically secure
- [ ] HTTPS enabled with valid certificates
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] File upload restrictions in place
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] Regular security updates applied

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   pg_isready -h localhost -p 5432
   
   # Verify connection string
   psql $DATABASE_URL
   ```

2. **File Upload Issues**
   ```bash
   # Check upload directory permissions
   ls -la uploads/
   chmod 755 uploads/
   ```

3. **Memory Issues**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Restart if necessary
   pm2 restart all
   ```

4. **Performance Issues**
   ```bash
   # Check database performance
   EXPLAIN ANALYZE SELECT * FROM categories WHERE parent_id = 1;
   
   # Monitor cache hit rates
   # Check application logs
   ```

## Post-Deployment Verification

```bash
# Verify application is running
curl http://localhost:5000/health

# Test API endpoints
curl http://localhost:5000/api/auth/me

# Check database connectivity
npm run db:push --dry-run

# Verify file uploads work
# Test admin panel functionality
# Confirm email notifications (if implemented)
```

## Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Database maintenance and optimization

### Update Process

```bash
# 1. Backup database
./backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Install updates
npm ci

# 4. Build application
npm run build

# 5. Run migrations
npm run db:push

# 6. Restart services
pm2 restart all

# 7. Verify deployment
curl http://localhost:5000/health
```

This deployment guide ensures a professional, scalable, and maintainable production deployment of the Classified Ads Platform.