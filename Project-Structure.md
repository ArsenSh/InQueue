# Bank Appointment System - Project Structure

This document outlines the recommended project structure for organizing the codebase on GitHub.

## Repository Structure

```
bank-appointment-system/
├── README.md                   # Project overview and setup instructions
├── LICENSE                     # License information
├── .gitignore                  # Git ignore file
├── backend/                    # Node.js/Express backend
│   ├── server.js               # Main server entry point
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Example environment variables
│   ├── config/                 # Configuration files
│   │   └── db.js               # Database connection
│   ├── models/                 # Mongoose models
│   │   ├── Bank.js             # Bank model (includes branches)
│   │   └── Appointment.js      # Appointment model
│   ├── routes/                 # API routes
│   │   └── bankRoutes.js       # Bank and appointment routes
│   ├── utils/                  # Utility functions
│   │   ├── email.js            # Email sending functionality
│   │   ├── reminderScheduler.js # Appointment reminder scheduler
│   │   ├── timeSlotUtils.js    # Time slot calculations
│   │   └── sms.js              # SMS notification functionality
│   ├── templates/              # Email templates
│   │   ├── appointment-confirmation.html
│   │   ├── appointment-reminder.html
│   │   └── contact-us.html
│   ├── insertBanks.js          # Script to populate the database
│   └── public/                 # Public assets
│       └── logos/              # Bank logo files
│
├── frontend/                   # Vue.js frontend
│   ├── babel.config.js         # Babel configuration
│   ├── jsconfig.json           # JavaScript configuration
│   ├── vue.config.js           # Vue CLI configuration
│   ├── package.json            # Frontend dependencies
│   ├── public/                 # Public assets
│   │   ├── index.html          # HTML entry point
│   │   ├── custom_favicon.ico  # Favicon
│   │   └── logos/              # Bank logo files
│   └── src/                    # Source code
│       ├── App.vue             # Root component
│       ├── main.js             # JavaScript entry point
│       ├── router.js           # Vue Router configuration
│       ├── assets/             # Static assets
│       │   └── logo.png        # Application logo
│       ├── components/         # Vue components
│       │   ├── HomePage.vue
│       │   ├── AppointmentPage.vue
│       │   ├── ManageAppointmentPage.vue
│       │   ├── AboutUsPage.vue
│       │   ├── ContactUsPage.vue
│       │   ├── PrivacyPolicyPage.vue
│       │   ├── TermsOfServicePage.vue
│       │   ├── BranchDashboard.vue
│       │   ├── BranchAppointments.vue
│       │   ├── BranchLogin.vue
│       │   ├── ReportsComponent.vue
│       │   └── BranchSettings.vue
│       ├── views/              # Page views
│       │   ├── CheckInView.vue
│       │   └── WindowWorkerView.vue
│       ├── services/           # API services
│       │   └── api.js          # Axios API wrapper
│       └── utils/              # Frontend utilities
│           ├── appointmentDistributor.js
│           └── timeSlotUtils.js
│
└── docs/                       # Documentation
    ├── api-documentation.md    # API endpoints documentation
    ├── deployment-guide.md     # Deployment instructions
    └── screenshots/            # Application screenshots
```

## Key Files and Their Purposes

### Backend

- **server.js**: The main entry point for the Express.js server, sets up routes, middleware, and connects to the database.
- **models/**: Contains Mongoose schemas for the database models:
  - **Bank.js**: Defines the schema for banks, including branches, their locations, and service types.
  - **Appointment.js**: Defines the schema for appointments, including customer details and time slots.
- **routes/**: Contains API route definitions:
  - **bankRoutes.js**: Routes for bank information, branch details, and appointments.
- **utils/**: Utility functions:
  - **email.js**: Functions for sending appointment confirmations and reminders.
  - **reminderScheduler.js**: Cron job that sends appointment reminders.
  - **sms.js**: Functions for sending SMS notifications.
  - **timeSlotUtils.js**: Helper functions for managing time slots.
- **templates/**: HTML email templates for customer communications.
- **insertBanks.js**: Script to populate the database with initial bank and branch data.

### Frontend

- **src/router.js**: Defines the application routes and navigation guards.
- **src/services/api.js**: Axios configuration for making API calls to the backend.
- **src/components/**: Vue components:
  - **Customer-facing pages**: HomePage, AppointmentPage, ManageAppointmentPage, etc.
  - **Branch management pages**: BranchDashboard, BranchAppointments, ReportsComponent, etc.
- **src/views/**: Larger view components:
  - **CheckInView.vue**: Interface for branch staff to check in customers.
  - **WindowWorkerView.vue**: Interface for window staff serving customers.
