# Bank Appointment System - API Documentation

This document outlines the available API endpoints in the Bank Appointment System.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most administrative endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Banks and Branches

### Get All Banks

Retrieves a list of all banks with their branches.

- **URL**: `/banks`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  [
    {
      "_id": "bank123",
      "name": "Example Bank",
      "branches": [
        {
          "id": "branch456",
          "name": "Downtown Branch",
          "address": "123 Main St"
        }
      ],
      "deals": [
        {
          "type": "Individual",
          "dealTypes": [
            {
              "serviceType": "Personal Loan",
              "description": "Apply for a personal loan"
            }
          ]
        }
      ]
    }
  ]
  ```

### Get Specific Bank

Retrieves details for a specific bank.

- **URL**: `/banks/:bankId`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "_id": "bank123",
    "name": "Example Bank",
    "branches": [...],
    "deals": [...]
  }
  ```

### Get Bank Branch

Retrieves details for a specific branch.

- **URL**: `/getBank/:branch_id`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "bankName": "Example Bank",
    "branch": {
      "id": "branch456",
      "name": "Downtown Branch",
      "address": "123 Main St"
    }
  }
  ```

### Get Bank and Branch Names

Retrieves names for a specific bank and branch.

- **URL**: `/banks/:bankId/branches/:branchId`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "bankName": "Example Bank",
    "branchName": "Downtown Branch",
    "branchAddress": "123 Main St"
  }
  ```

### Get Entity Types

Retrieves supported entity types for a bank.

- **URL**: `/banks/:bankId/entityTypes`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  ["Individual", "Legal Entity"]
  ```

### Get Bank Deals

Retrieves all deals for a bank.

- **URL**: `/banks/:bankId/deals`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  [
    {
      "type": "Individual",
      "requireCompanyName": false,
      "dealTypes": [
        {
          "serviceType": "Personal Loan",
          "description": "Apply for a personal loan",
          "_id": "deal789"
        }
      ]
    }
  ]
  ```

## Appointments

### Get Busy Times

Retrieves busy times for a branch.

- **URL**: `/getBusyTimes/:branchId`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "busyTimes": ["16/04/25/14/30", "16/04/25/15/00"]
  }
  ```

### Get Available Times

Retrieves available time slots for a branch on a specific date.

- **URL**: `/available-times/:bankId/:branchId/:date`
- **Method**: `GET`
- **Authentication**: No
- **Parameters**:
  - `date`: Date in DD/MM/YY format
- **Response**:
  ```json
  {
    "availableTimes": ["16/04/25/09/00", "16/04/25/09/15", "16/04/25/09/30"]
  }
  ```

### Book Appointment

Books a new appointment.

- **URL**: `/appointments/book`
- **Method**: `POST`
- **Authentication**: No
- **Request Body**:
  ```json
  {
    "branchId": "branch456",
    "time": "16/04/25/09/00",
    "userInfo": {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "companyName": "ABC Corp"
    },
    "serviceType": "Account Opening",
    "service": {
      "type": "Account Opening",
      "description": "Open a new bank account"
    },
    "entityType": "Individual"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Appointment booked successfully! Confirmation email sent.",
    "appointment": {
      "_id": "appointment123",
      "customerName": "John Doe",
      "timeSlot": "16/04/25/09/00",
      "status": "scheduled"
    },
    "password": "1234"
  }
  ```

### Get Appointment

Retrieves appointment details.

- **URL**: `/appointments/:id`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "_id": "appointment123",
    "bank": "bank123",
    "branch": "branch456",
    "customerName": "John Doe",
    "phoneNumber": "+1234567890",
    "email": "john@example.com",
    "timeSlot": "16/04/25/09/00",
    "entityType": "Individual",
    "service": {
      "type": "Account Opening",
      "description": "Open a new bank account"
    },
    "status": "scheduled"
  }
  ```

### Delay/Reschedule Appointment

Reschedules an appointment.

- **URL**: `/appointments/:id/delay`
- **Method**: `PUT`
- **Authentication**: Bearer token with appointment password
- **Request Body**:
  ```json
  {
    "newTimeSlot": "16/04/25/10/00",
    "delayMinutes": 60
  }
  ```
- **Response**:
  ```json
  {
    "message": "Appointment time updated successfully",
    "delayMinutes": 60,
    "newTimeSlot": "16/04/25/10/00"
  }
  ```

### Cancel Appointment

Cancels an appointment.

- **URL**: `/appointments/:id`
- **Method**: `DELETE`
- **Authentication**: Bearer token with appointment password
- **Response**:
  ```json
  {
    "message": "Appointment deleted successfully"
  }
  ```

## Branch Management

### Branch Login

Authenticates branch staff.

- **URL**: `/banks/branch-login`
- **Method**: `POST`
- **Authentication**: No
- **Request Body**:
  ```json
  {
    "branchId": "branch456",
    "password": "branch_password"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt_token",
    "bankId": "bank123",
    "branchId": "branch456",
    "branchName": "Downtown Branch",
    "bankName": "Example Bank",
    "role": "branch_admin"
  }
  ```

### Get Branch Dashboard

Retrieves dashboard data for a branch.

- **URL**: `/branch-dashboard`
- **Method**: `GET`
- **Authentication**: Required (branch_admin role)
- **Response**:
  ```json
  {
    "stats": {
      "todayTotal": 10,
      "served": 5,
      "waiting": 3,
      "inProgress": 1,
      "noShows": 1
    },
    "currentQueue": [...],
    "upcomingAppointments": [...],
    "recentActivity": [...],
    "branchInfo": {
      "name": "Downtown Branch",
      "address": "123 Main St",
      "bankName": "Example Bank"
    }
  }
  ```

### Get Branch Reports

Retrieves reports and analytics for a branch.

- **URL**: `/branch/:branchId/reports`
- **Method**: `GET`
- **Authentication**: Required (branch_admin role)
- **Query Parameters**:
  - `timeRange`: "today", "yesterday", "week", "month", "custom"
  - `date`: Required if timeRange is "custom", format: YYYY-MM-DD
- **Response**:
  ```json
  {
    "summary": {
      "totalClients": 15,
      "avgWaitTime": 12,
      "avgServiceTime": 18,
      "completionRate": 85
    },
    "windowsTable": [...],
    "queueTraffic": {...},
    "serviceDistribution": {...}
  }
  ```

### Get Branch Windows

Retrieves window information for a branch.

- **URL**: `/branch/:branchId/windows`
- **Method**: `GET`
- **Authentication**: Required (branch_admin role)
- **Response**:
  ```json
  [
    {
      "number": 1,
      "dealTypes": ["Personal Loan", "Account Opening"],
      "status": "active",
      "currentAppointment": null,
      "staff": {
        "firstName": "John",
        "lastName": "Smith"
      }
    }
  ]
  ```

### Add Window

Adds a new window to a branch.

- **URL**: `/branch/:branchId/windows`
- **Method**: `POST`
- **Authentication**: Required (branch_admin role)
- **Request Body**:
  ```json
  {
    "windowNumber": 2,
    "dealTypes": ["Personal Loan", "Account Opening"],
    "staff": {
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
  ```
- **Response**:
  ```json
  [
    {
      "number": 1,
      "dealTypes": [...],
      "status": "active",
      "staff": {...}
    },
    {
      "number": 2,
      "dealTypes": ["Personal Loan", "Account Opening"],
      "status": "inactive",
      "currentAppointment": null,
      "staff": {
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  ]
  ```

### Update Window

Updates window properties.

- **URL**: `/branch/:branchId/windows/:windowNumber`
- **Method**: `PUT`
- **Authentication**: Required (branch_admin role)
- **Request Body**:
  ```json
  {
    "status": "active",
    "dealTypes": ["Personal Loan", "Account Opening"],
    "staff": {
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
  ```
- **Response**:
  ```json
  {
    "number": 2,
    "dealTypes": ["Personal Loan", "Account Opening"],
    "status": "active",
    "currentAppointment": null,
    "staff": {
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
  ```

## Check-In System

### Check-In

Processes customer check-in.

- **URL**: `/branch/:branchId/checkin`
- **Method**: `POST`
- **Authentication**: Required (checkin_staff role)
- **Request Body**:
  ```json
  {
    "code": "1234"
  }
  ```
  or
  ```json
  {
    "appointmentId": "appointment123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Check-in successful",
    "appointment": {
      "_id": "appointment123",
      "customerName": "John Doe",
      "timeSlot": "16/04/25/09/00",
      "status": "checked-in",
      "checkinTime": "2025-04-16T09:05:00.000Z"
    }
  }
  ```

### Get Appointment By Code

Retrieves an appointment using the password code.

- **URL**: `/appointment-by-code/:code`
- **Method**: `GET`
- **Authentication**: No
- **Response**:
  ```json
  {
    "appointment": {
      "_id": "appointment123",
      "customerName": "John Doe",
      "timeSlot": "16/04/25/09/00",
      "status": "scheduled"
    }
  }
  ```

## Window Management

### Update Appointment Status

Updates the status of an appointment.

- **URL**: `/appointments/:id/status`
- **Method**: `PUT`
- **Authentication**: Required (window_staff role)
- **Request Body**:
  ```json
  {
    "status": "in-progress",
    "windowNumber": 1
  }
  ```
- **Response**:
  ```json
  {
    "message": "Appointment updated",
    "appointment": {
      "_id": "appointment123",
      "status": "in-progress",
      "windowNumber": 1,
      "serviceStartTime": "2025-04-16T09:10:00.000Z"
    }
  }
  ```

### Notify Client

Sends notification to client to proceed to a window.

- **URL**: `/appointments/:id/notify`
- **Method**: `POST`
- **Authentication**: Required (window_staff role)
- **Request Body**:
  ```json
  {
    "message": "Please proceed to Window 1 for your service.",
    "windowNumber": 1,
    "notificationType": "both"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Notification sent successfully",
    "results": {
      "email": { "sent": true },
      "sms": { "sent": true }
    }
  }
  ```

## Security Endpoints

### Change Branch Password

Changes branch password.

- **URL**: `/banks/branch-password-update`
- **Method**: `POST`
- **Authentication**: Required (branch_admin role)
- **Request Body**:
  ```json
  {
    "branchId": "branch456",
    "currentPassword": "old_password",
    "newPassword": "new_password"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Branch password updated successfully"
  }
  ```

### Change Window Password

Changes window password.

- **URL**: `/banks/window-password-update`
- **Method**: `POST`
- **Authentication**: Required (branch_admin role)
- **Request Body**:
  ```json
  {
    "branchId": "branch456",
    "windowNumber": 1,
    "currentPassword": "old_password",
    "newPassword": "new_password"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Window 1 password updated successfully"
  }
  ```

### Change Check-In Password

Changes check-in terminal password.

- **URL**: `/banks/checkin-password-update`
- **Method**: `POST`
- **Authentication**: Required (branch_admin role)
- **Request Body**:
  ```json
  {
    "branchId": "branch456",
    "currentPassword": "old_password",
    "newPassword": "new_password"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Check-in password updated successfully"
  }
  ```
