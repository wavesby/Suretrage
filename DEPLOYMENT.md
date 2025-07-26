# Deployment Guide

This guide provides instructions for deploying the Sport Arbitrage application to a production environment.

## Architecture Overview

The application consists of two main components:

1. **Frontend**: React application built with Vite
2. **Proxy Server**: Node.js server for web scraping and data processing

These components can be deployed separately or together, depending on your infrastructure.

## Deployment Options

### Option 1: Single Server Deployment

Deploy both the frontend and proxy server on the same server.

#### Requirements

- Node.js 16+ and npm
- PM2 or similar process manager
- Nginx or similar web server (optional but recommended)

#### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sport-arbitrage.git
   cd sport-arbitrage
   ```

2. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

3. Create production environment variables:
   ```bash
   # Create .env file
   cat > .env << EOL
   VITE_PROXY_SERVER=/api  # Use relative path for same-origin requests
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   EOL
   ```

4. Build the frontend:
   ```bash
   npm run build
   ```

5. Install PM2:
   ```bash
   npm install -g pm2
   ```

6. Create PM2 configuration:
   ```bash
   # Create ecosystem.config.js
   cat > ecosystem.config.js << EOL
   module.exports = {
     apps: [
       {
         name: 'sport-arbitrage-proxy',
         script: 'server.js',
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
         env: {
           NODE_ENV: 'production',
           PORT: 3001
         }
       }
     ]
   };
   EOL
   ```

7. Start the proxy server with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

8. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /path/to/sport-arbitrage/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://localhost:3001/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

### Option 2: Separate Deployments

Deploy the frontend and proxy server separately.

#### Frontend Deployment (Static Hosting)

1. Build the frontend:
   ```bash
   VITE_PROXY_SERVER=https://your-proxy-server.com npm run build
   ```

2. Deploy the `dist` directory to any static hosting service:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront
   - Firebase Hosting

#### Proxy Server Deployment

1. Create a new repository for the proxy server:
   ```bash
   mkdir sport-arbitrage-proxy
   cd sport-arbitrage-proxy
   ```

2. Copy the necessary files:
   ```bash
   cp ../sport-arbitrage/server.js .
   cp ../sport-arbitrage/package.json .
   ```

3. Modify package.json to include only the necessary dependencies:
   ```json
   {
     "name": "sport-arbitrage-proxy",
     "version": "1.0.0",
     "main": "server.js",
     "dependencies": {
       "axios": "^1.10.0",
       "cors": "^2.8.5",
       "express": "^4.18.2",
       "node-cron": "^3.0.3",
       "playwright": "^1.42.1"
     },
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

4. Deploy to a Node.js hosting service:
   - Heroku
   - DigitalOcean App Platform
   - AWS Elastic Beanstalk
   - Google Cloud Run
   - Azure App Service

## Security Considerations

1. **CORS Configuration**: Update the CORS settings in `server.js` to only allow requests from your frontend domain:
   ```javascript
   app.use(cors({
     origin: 'https://your-domain.com'
   }));
   ```

2. **Rate Limiting**: Add rate limiting to prevent abuse:
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

3. **API Keys**: Use environment variables for sensitive information:
   ```javascript
   const API_KEY = process.env.API_KEY;
   ```

4. **IP Rotation**: For production use, consider implementing IP rotation to avoid being blocked by bookmakers.

## Monitoring and Maintenance

1. **Logging**: Implement a logging solution:
   ```javascript
   const winston = require('winston');
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     defaultMeta: { service: 'sport-arbitrage' },
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

2. **Error Alerts**: Set up error notifications:
   ```javascript
   process.on('uncaughtException', (error) => {
     logger.error('Uncaught Exception:', error);
     // Send notification (email, Slack, etc.)
   });
   ```

3. **Regular Updates**: Check and update the web scraping selectors regularly as bookmaker websites may change.

## Scaling Considerations

1. **Multiple Instances**: Run multiple proxy server instances behind a load balancer.
2. **Distributed Scraping**: Implement a distributed scraping system for higher volume.
3. **Database Integration**: Store odds data in a database for historical analysis.
4. **Caching Layer**: Implement Redis or similar for more efficient caching.

## Troubleshooting

1. **Scraping Issues**: If scraping stops working, check if the bookmaker website structure has changed.
2. **Performance Problems**: Monitor server resources and increase capacity if needed.
3. **IP Blocking**: If you encounter IP blocks, implement IP rotation or use a proxy service. 