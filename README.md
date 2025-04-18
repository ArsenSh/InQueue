# InQueue
A comprehensive bank appointment scheduling and management system


## Features

### Customer Features
- Browse banks and their branches
- Select appointment types based on service needed
- Check available time slots
- Book appointments with email confirmation
- Receive QR code and password for appointment management
- Modify or cancel appointments
- SMS notifications for appointments
- Real-time status updates

### Branch Management Features
- Administrative dashboard
- Appointment overview and management
- Staff window management
- Check-in system for arriving customers
- Real-time queue management
- Appointment history and analytics
- Customizable service types and durations
- Branch settings management

### Window Staff Features
- Personalized window dashboard
- Current customer information view
- Next customer calling functionality
- Service time tracking
- Appointment status management

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email notifications
- Twilio for SMS notifications
- QR code generation

### Frontend
- Vue.js
- Vue Router
- Axios for API communication
- Chart.js for analytics
- Tailwind CSS (assumed from structure)
- Mobile-responsive design

## Getting Started

### Prerequisites
- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm or yarn

### Installation

#### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/bank-appointment-system.git
   cd bank-appointment-system/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/bank-appointments
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   FRONTEND_URL=http://localhost:8080
   ```

5. Start the backend server
   ```bash
   npm start
   ```

#### Frontend Setup
1. Navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables if needed
   - Create `.env.local` file for local development

4. Start the development server
   ```bash
   npm run serve
   ```

5. For production build
   ```bash
   npm run build
   ```

### Database Initialization
The system requires initial bank and branch data. Use the provided script to populate your database:

```bash
cd backend
node insertBanks.js
```

## System Architecture

The application follows a client-server architecture:

1. **Client**: Vue.js frontend that provides different interfaces for customers, branch managers, and window staff.

2. **Server**: Node.js/Express backend that handles:
   - RESTful API endpoints for data operations
   - Authentication and authorization
   - Email and SMS notifications
   - Appointment reminder scheduling
   - Data validation and business logic

3. **Database**: MongoDB stores information about:
   - Banks and branches
   - Appointment details
   - Service types
   - Window configurations
   - User sessions

## API Documentation

The backend exposes the following main API endpoints:

### Bank and Branch Information
- `GET /api/banks` - Get all banks with branches
- `GET /api/banks/:bankId` - Get specific bank
- `GET /api/banks/:bankId/branches/:branchId` - Get branch details

### Appointment Management
- `GET /api/available-times/:bankId/:branchId/:date` - Get available time slots
- `POST /api/appointments/book` - Book a new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/delay` - Reschedule an appointment
- `DELETE /api/appointments/:id` - Cancel an appointment

### Branch Dashboard
- `GET /api/branch-dashboard` - Get branch dashboard data
- `GET /api/branch/:branchId/reports` - Get branch reports and analytics
- `GET /api/branch/:branchId/windows` - Get windows for a branch
- `POST /api/branch/:branchId/checkin` - Process customer check-in

## Deployment

### Backend Deployment
1. Set up a MongoDB database (Atlas or self-hosted)
2. Deploy the Node.js server to your preferred hosting (Heroku, AWS, DigitalOcean)
3. Configure environment variables on your hosting platform

### Frontend Deployment
1. Build the Vue.js application for production
   ```bash
   npm run build
   ```
2. Deploy the contents of the `dist` directory to a static site hosting service
   (Netlify, Vercel, GitHub Pages, or your own server)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Icons provided by [Feather Icons](https://feathericons.com/)
- Email templates adapted from [Sendgrid Templates](https://sendgrid.com/templates)
- QR code functionality using [QRCode.js](https://github.com/davidshimjs/qrcodejs)
