# Visitor Pass Management System (VPM)

A MERN application for managing visitor registration, appointments, digital passes, and secure check-in/check-out. This repository follows the assignment's core entities: Users, Visitors, Appointments, Passes, and CheckLogs.

## Roles and workflow

- **Admin:** manages user accounts and views system information.
- **Employee/Host:** registers a visitor and appointment in one submission. The logged-in employee is assigned as host. The employee workflow can approve the appointment and issue a pass to reduce visitor waiting time.
- **Security/Frontdesk:** views issued passes and records check-in/check-out. Security users can also access the combined issuance workflow.
- **Visitor:** receives the pass by email when SMTP is configured; the pass includes a QR code and PDF attachment.

The combined endpoint creates/reuses the visitor, creates an approved appointment, generates a unique pass and QR code, and attempts email delivery. Email failures are recorded separately so they do not discard the created pass.

## Stack

- Frontend: React, React Router, Axios (Create React App)
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Authentication: JWT and bcrypt password hashing
- Passes: `qrcode` for QR data URLs and `pdfkit` for PDF output
- Email: Nodemailer over configured SMTP

## Project structure

```text
visitor-pass-management-system/
├── backend/
│   ├── controllers/
│   ├── middleware/        # JWT authentication and role checks
│   ├── models/
│   ├── routes/
│   ├── scripts/           # initial admin seed
│   ├── services/          # PDF and email services
│   ├── server.js
│   └── databaseConnection.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        └── services/api.js
```

## Setup

### 1. Requirements

Install Node.js and npm, and have access to a MongoDB database (local or Atlas).

### 2. Backend configuration

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set `URL`, a strong `JWT_SECRET`, admin seed values, and SMTP values. Do not commit `.env`.

Create the first admin user:

```bash
npm run seed:admin
```

Start the backend:

```bash
npm run dev
```

The API defaults to `http://localhost:4000`. Health check: `GET http://localhost:4000/api/health`.

### 3. Frontend

In another terminal:

```bash
cd frontend
npm install
npm start
```

The React app defaults to `http://localhost:3000`. To use a deployed/different backend, define `REACT_APP_API_URL` in the frontend environment without the `/api` suffix, for example `REACT_APP_API_URL=http://localhost:4000`.

## Main API endpoints

All endpoints except login and health require `Authorization: Bearer <JWT>` unless stated otherwise. Role permissions are enforced by backend middleware.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT | Public |
| GET | `/api/auth/me` | Current user | Authenticated |
| POST | `/api/users` | Create user | Admin |
| GET | `/api/users` | List users | Admin |
| GET/PUT/DELETE | `/api/users/:id` | Read/update/delete user | Admin |
| POST | `/api/visits/register-and-issue` | Register visitor + appointment + pass; attempt email delivery | Admin, Employee, Security |
| GET | `/api/visitors` | List visitors | Admin, Employee, Security |
| GET | `/api/appointments` | List appointments | Admin, Employee, Security |
| PUT | `/api/appointments/:id/status` | Update appointment status | Authenticated roles with appointment access |
| GET | `/api/passes` | List passes | Admin, Employee, Security |
| GET | `/api/passes/:id/pdf` | Download a pass PDF by pass ID or pass number | Admin, Employee, Security |
| PUT | `/api/passes/:id/status` | Update pass status | Admin, Security |
| POST | `/api/check-logs` | Record validated check-in/check-out | Admin, Security |
| GET | `/api/check-logs` | List check logs | Admin, Security |
| GET | `/api/dashboard/stats` | Live database counts | Authenticated |

### Combined registration request

`POST /api/visits/register-and-issue`

```json
{
  "visitor": {
    "name": "John Kumar",
    "email": "john@example.com",
    "phone": "9876543210",
    "photo": ""
  },
  "appointment": {
    "purpose": "Project discussion",
    "appointmentDate": "2026-10-15",
    "appointmentTime": "10:30"
  }
}
```

The backend takes the host identity from the verified JWT, not from a user-supplied host ID. `emailStatus` indicates whether delivery was sent, failed, not configured, or skipped because no visitor email was provided.

## Email configuration

Email is only sent when `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` are configured. Use credentials from your email provider; never put credentials in source code or commit them. Without SMTP configuration, pass creation still succeeds and the API returns an email status explaining why delivery was skipped.

## Important implementation notes

- The first administrator is created through the seed script; public registration is not exposed.
- Passwords are hashed using bcrypt and are not returned in user API responses.
- The QR code encodes a pass number and appointment ID. The backend must still validate pass status and validity before recording check-in/out; do not trust the QR payload alone.
- PDF passes are generated on demand and emailed as attachments. No generated PDF files are stored on the server filesystem.
- Visitor photo is currently accepted as a URL/string; actual multipart photo upload/storage remains a future improvement.
- The current UI records check-in/check-out through the API workflow; a camera-based QR scanner UI, SMS integration, exports, and automated email retry queue remain future improvements.
- The check-in/check-out API is `POST /api/check-logs` with `{ "pass": "<pass MongoDB ID>", "action": "check-in" }` or `action: "check-out"`.

## Suggested test sequence

1. Configure `.env`, install backend dependencies, and run `npm run seed:admin`.
2. Start backend and frontend.
3. Log in with the seeded admin credentials.
4. Create an Employee user from the Users page.
5. Log in as that employee and submit the combined visitor/appointment form.
6. Check the pass number, QR code, PDF download, and returned email status.
7. Log in as Security to test check-in and check-out through the check-log API.

## Future improvements

- Camera-based QR scanner page and pass validation UX.
- Actual visitor photo upload to object storage.
- Background queue and retry policy for email delivery.
- SMS notifications, filtering, report export, and audit trails.
- Automated tests for role permissions and the end-to-end issuance workflow.
