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
   git clone https
