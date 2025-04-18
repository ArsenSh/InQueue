# Bank Appointment System - Deployment Guide

This guide provides instructions for deploying the Bank Appointment System to production environments.

## Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- Git
- A hosting service for the backend (Heroku, DigitalOcean, AWS, etc.)
- A hosting service for the frontend (Netlify, Vercel, AWS S3, etc.)
- Domain name (optional)

## Backend Deployment

### Option 1: Heroku Deployment

1. **Create a Heroku account and install the Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   cd backend
   heroku create bank-appointment-api
   ```

3. **Add MongoDB Add-on or connect to MongoDB Atlas**
   ```bash
   # For Heroku MongoDB add-on
   heroku addons:create mongolab:sandbox
   
   # Or manually set the MongoDB URI for Atlas
   heroku config:set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bank-appointments
   ```

4. **Set other environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   heroku config:set EMAIL_USER=your_email@gmail.com
   heroku config:set EMAIL_PASSWORD=your_email_password
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set TWILIO_ACCOUNT_SID=your_twilio_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_twilio_token
   heroku config:set TWILIO_PHONE_NUMBER=your_twilio_phone
   ```

5. **Deploy the backend to Heroku**
   ```bash
   git subtree push --prefix backend heroku main
   ```

6. **Populate the database**
   ```bash
   heroku run node insertBanks.js
   ```

### Option 2: DigitalOcean Deployment

1. **Create a Droplet on DigitalOcean**
   - Choose Ubuntu 20.04 or newer
   - Select appropriate plan (2GB RAM minimum recommended)
   - Add SSH keys for secure access

2. **SSH into your Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js and npm**
   ```bash
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install and configure MongoDB**
   ```bash
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

5. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/bank-appointment-system.git
   cd bank-appointment-system/backend
   ```

6. **Install dependencies**
   ```bash
   npm install
   ```

7. **Create environment variables file**
   ```bash
   nano .env
   ```
   
   Add the following configuration:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/bank-appointments
   JWT_SECRET=your_secure_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   FRONTEND_URL=https://your-frontend-domain.com
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```

8. **Set up process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name bank-api
   pm2 startup
   pm2 save
   ```

9. **Set up Nginx as a reverse proxy**
   ```bash
   sudo apt-get install -y nginx
   sudo nano /etc/nginx/sites-available/bank-api
   ```
   
   Add the following configuration:
   ```nginx
   server {
     listen 80;
     server_name api.yourdomain.com;
     
     location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

10. **Enable the site and restart Nginx**
    ```bash
    sudo ln -s /etc/nginx/sites-available/bank-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Populate the database**
    ```bash
    node insertBanks.js
    ```

12. **Set up SSL with Let's Encrypt**
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d api.yourdomain.com
    ```

### Option 3: AWS Deployment

1. **Create an EC2 instance**
   - Choose Amazon Linux 2 or Ubuntu
   - t2.micro for testing, t2.small or larger for production
   - Configure security group to allow HTTP (80), HTTPS (443), and SSH (22)

2. **Set up MongoDB**
   Either install MongoDB on the EC2 instance or use MongoDB Atlas.

3. **Deploy using the same steps as the DigitalOcean deployment**
   - SSH into your EC2 instance
   - Clone the repository
   - Install dependencies
   - Set up environment variables
   - Use PM2 for process management
   - Configure Nginx
   - Set up SSL

## Frontend Deployment

### Option 1: Netlify Deployment

1. **Create a production build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

3. **Initialize Netlify site**
   ```bash
   netlify init
   ```
   
   - Select "Create & configure a new site"
   - Follow the prompts to choose team and site name

4. **Configure environment variables**
   - Set the API URL (backend URL) in the Netlify dashboard
   - Go to Site settings > Build & deploy > Environment variables
   - Add `VUE_APP_API_URL=https://api.yourdomain.com`

5. **Deploy the site**
   ```bash
   netlify deploy --prod
   ```

6. **Configure redirects for SPA routing**
   Create a `_redirects` file in the `public` directory with:
   ```
   /* /index.html 200
   ```

### Option 2: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure Vercel**
   Create a `vercel.json` file in the frontend directory:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "build": {
       "env": {
         "VUE_APP_API_URL": "https://api.yourdomain.com"
       }
     }
   }
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   
   For production:
   ```bash
   vercel --prod
   ```

### Option 3: Traditional Web Hosting

1. **Create a production build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to your web hosting**
   - Upload the contents of the `dist` directory to your web hosting service
   - This can be done via FTP, SFTP, or the hosting provider's file manager

3. **Configure server for SPA routing**
   For Apache, create a `.htaccess` file in the root directory:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
   
   For Nginx, add to your server block:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## CI/CD Pipeline (Optional)

You can set up a CI/CD pipeline using GitHub Actions to automate the deployment process.

1. **Create a GitHub Actions workflow file**
   Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy Bank Appointment System

   on:
     push:
       branches: [ main ]

   jobs:
     deploy-backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Set up Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
         - name: Install dependencies
           working-directory: ./backend
           run: npm ci
         - name: Deploy to Heroku
           uses: akhileshns/heroku-deploy@v3.12.12
           with:
             heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
             heroku_app_name: "bank-appointment-api"
             heroku_email: ${{ secrets.HEROKU_EMAIL }}
             appdir: "backend"

     deploy-frontend:
       runs-on: ubuntu-latest
       needs: deploy-backend
       steps:
         - uses: actions/checkout@v2
         - name: Set up Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
         - name: Install dependencies
           working-directory: ./frontend
           run: npm ci
         - name: Build
           working-directory: ./frontend
           run: npm run build
         - name: Deploy to Netlify
           uses: nwtgck/actions-netlify@v1.2
           with:
             publish-dir: './frontend/dist'
             production-branch: main
             github-token: ${{ secrets.GITHUB_TOKEN }}
             deploy-message: "Deploy from GitHub Actions"
           env:
             NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
             NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
   ```

2. **Add secrets to GitHub repository**
   - Go to your GitHub repository
   - Navigate to Settings > Secrets > Actions
   - Add the necessary secrets for Heroku and Netlify deployment

## Database Backup

It's important to set up regular backups of your MongoDB database.

### MongoDB Atlas Backups

If using MongoDB Atlas:
1. Navigate to your cluster
2. Go to "Backup" tab
3. Configure backup policy (frequency, retention period)

### Self-Hosted MongoDB Backups

For self-hosted MongoDB, set up a cron job to run regular backups:

```bash
# Create a backup script
cat > /usr/local/bin/mongodb-backup.sh << 'EOL'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --out "$BACKUP_DIR/backup-$TIMESTAMP"

# Keep only the last 7 backups
ls -dt $BACKUP_DIR/backup-* | tail -n +8 | xargs rm -rf
EOL

# Make it executable
chmod +x /usr/local/bin/mongodb-backup.sh

# Add to crontab to run daily at 1 AM
(crontab -l 2>/dev/null; echo "0 1 * * * /usr/local/bin/mongodb-backup.sh") | crontab -
```

## Health Monitoring

Consider setting up monitoring for your production deployment.

### Option 1: PM2 Monitoring

PM2 offers basic monitoring:
```bash
pm2 monitor
```

### Option 2: UptimeRobot

1. Create an account on UptimeRobot.com
2. Add monitors for your API endpoints and frontend

### Option 3: New Relic or Datadog

For more comprehensive monitoring, consider professional monitoring services like New Relic or Datadog.

## Security Considerations

1. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

2. **Implement rate limiting** (already included in the backend)

3. **Set up proper CORS configuration** (already included in the backend)

4. **Use HTTPS everywhere**

5. **Regularly rotate secrets and credentials**

6. **Validate all inputs on the server** (already implemented in the models)

7. **Implement proper error logging** (consider adding a service like Sentry)

## Troubleshooting

### Common Issues and Solutions

1. **MongoDB Connection Issues**
   - Check if MongoDB is running: `systemctl status mongodb`
   - Verify connection string in .env file
   - Check network connectivity and firewall settings

2. **Node.js Application Won't Start**
   - Check logs: `pm2 logs bank-api`
   - Verify all required environment variables are set
   - Check for syntax errors in the code

3. **Email Sending Issues**
   - Verify email credentials
   - For Gmail, ensure "Less secure app access" is enabled or use app passwords
   - Check for rate limiting on the email provider

4. **Frontend Routing Issues**
   - Ensure proper redirect rules are in place
   - Verify that the Vue Router configuration matches the backend API routes
   - Check browser console for errors

5. **CORS Issues**
   - Verify that the backend CORS configuration includes your frontend domain
   - Check that the frontend is using the correct protocol (http/https)
   - Inspect network requests in browser developer tools
