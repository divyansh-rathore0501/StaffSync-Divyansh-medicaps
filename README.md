# StaffSync — Modern Human Resource Management System (HRMS)
> **"Simplifying People. Empowering Teams."**

StaffSync is an enterprise-grade Human Resource Management System built on a modern full-stack JavaScript / TypeScript architecture. It provides role-based access control (RBAC), real-time attendance tracking with schedule grace thresholds, multi-tier leave approval workflows with balance deductions, organizational announcements with broadcast notifications, training catalog enrollment, and CSV audit reports.

---

## 1. System Architecture & Role-Based Access Control (RBAC)

```
                            ┌─────────────────────────────────────────┐
                            │        React 19 + Vite Frontend         │
                            │ (Tailwind CSS, Lucide, Recharts, Context)│
                            └────────────────────┬────────────────────┘
                                                 │ Axios / Fetch + JWT Bearer
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │           Express.js REST API           │
                            │  • Rate-Limiting Shield                 │
                            │  • Authentication (bcryptjs + JWT)       │
                            │  • Role-Based Authorization Guard       │
                            │  • Centralized Error & Audit Handler    │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │       Persistent Data Layer (MERN)      │
                            │ • Embedded Document Store (staffsync_db)│
                            │ • MongoDB / Mongoose ODM Compatibility  │
                            └─────────────────────────────────────────┘
```

### RBAC Permission Matrix

| Capability / Action | Employee | Manager | HR Administrator |
| :--- | :---: | :---: | :---: |
| **Personal Dashboard & Profile** | Read / Edit Self | Read / Edit Self | Full Read / Write |
| **Daily Attendance (Check-in/out)** | Self | Self | Self |
| **Attendance History Audit** | Personal Logs | Direct Team Reports | Organization-wide |
| **Apply for Leave** | Self | Self | Self |
| **Cancel Pending Requests** | Self | Self | Self |
| **Approve / Reject Leave Requests** | ❌ Forbidden | Direct Team Reports | Organization-wide |
| **Employee Directory** | Read-Only Basic | Direct Team Reports | Full CRUD + Deactivate |
| **Company Announcements** | Read-Only | Read-Only | Full CRUD & Broadcast |
| **Training Programs** | View & Enroll Self | View, Create & Assign | Full CRUD & Capacity |
| **Reports & CSV Audits** | ❌ Forbidden | Team Metrics & CSV | Full Org Reports & CSV |

---

## 2. Evaluation Demo Accounts

StaffSync includes 3 pre-seeded demonstration personas ready for instant evaluation. The web dashboard also includes an interactive **"Demo Persona: [HR | Manager | Employee]"** quick switcher in the top navigation bar.

| Role | Email Address | Password | Name & Title |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | `hr@staffsync.com` | `AdminPassword123!` | **Elena Rostova** — VP of Human Resources |
| **Engineering Manager** | `manager@staffsync.com` | `ManagerPassword123!` | **Marcus Sterling** — Director of Engineering |
| **Staff Employee** | `employee@staffsync.com` | `EmployeePassword123!` | **Aiden Vance** — Senior Full-Stack Engineer |

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide Icons, React Router DOM.
- **Backend**: Node.js, Express.js, TypeScript (`tsx`), JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `express-rate-limit`, `cors`.
- **Database**: Persistent document database (`data/staffsync_db.json`) with atomic sync, schema indexing, and MongoDB/Mongoose compatibility.

---

## 4. Key Modules & Business Logic

### A. Attendance Management
- **Workday Schedule**: Standard working hours from 09:30 AM to 06:00 PM (Asia/Kolkata timezone default).
- **Grace Period**: Check-ins recorded after 09:45 AM are flagged as `Late` with recorded arrival timestamps.
- **Half-Day Invariant**: Shifts under 4.0 hours are audited as `Half-Day`.
- **Duplicate Prevention**: A user cannot record more than one check-in per calendar day.

### B. Leave Management
- **Leave Types**: Annual Leave, Sick Leave, Casual Leave, and Unpaid Leave.
- **Duration Calculation**: Inclusive day calculation with date-order validation.
- **Balance Protection**: Prevents submission if the employee's available balance is lower than requested duration.
- **Overlap Shield**: Checks for existing active (`Pending` or `Approved`) requests within the selected date range.
- **Approval Deduction**: When approved, days are deducted from the employee's record.

### C. Training & Development
- Tracks course capacity, instructor credentials, and completion milestones (`Enrolled` → `In-Progress` → `Completed`).

### D. Exportable Audit Datasets
- 1-Click CSV exports for Attendance Logs, Leave Requests, and Employee Rosters.

---

## 5. Running the Application Locally

### Prerequisites
- Node.js version 18.0.0 or higher
- npm or bun

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed the Database
```bash
npm run seed
```

### Step 3: Run Automated Tests
```bash
npm test
```

### Step 4: Start Full-Stack Server
```bash
npm run dev
```
Visit `http://localhost:3000` in your web browser.

---

## 6. REST API Endpoint Reference

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Authenticates credentials, returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated profile |
| `PUT` | `/api/auth/profile` | Authenticated | Updates phone number or password |
| `GET` | `/api/employees` | HR, Manager, Employee | Searches and filters workforce directory |
| `POST` | `/api/employees` | HR Administrator | Enrolls employee with unique ID |
| `PUT` | `/api/employees/:id` | HR Administrator | Updates role, department, or active status |
| `POST` | `/api/attendance/check-in` | Authenticated | Records daily punch-in |
| `POST` | `/api/attendance/check-out` | Authenticated | Records punch-out and calculates hours |
| `GET` | `/api/attendance/history` | Authenticated | Retrieves filtered attendance logs |
| `POST` | `/api/leaves/apply` | Authenticated | Submits leave request with validation |
| `GET` | `/api/leaves` | Authenticated | Retrieves leave requests by role scope |
| `PUT` | `/api/leaves/:id/review` | HR, Manager | Approves or rejects request with feedback |
| `PUT` | `/api/leaves/:id/cancel` | Employee | Cancels self pending request |
| `GET` | `/api/announcements` | Authenticated | Retrieves company announcements |
| `POST` | `/api/announcements` | HR Administrator | Publishes and broadcasts announcement |
| `GET` | `/api/training` | Authenticated | Lists training programs and user status |
| `POST` | `/api/training/:id/enroll` | Authenticated | Enrolls in training program |
| `GET` | `/api/reports/dashboard-stats` | Authenticated | Aggregates role-specific metrics |
| `GET` | `/api/reports/export/attendance`| HR, Manager | Streams complete attendance CSV |
| `GET` | `/api/reports/export/leaves` | HR, Manager | Streams complete leave requests CSV |
| `GET` | `/api/reports/export/employees` | HR, Manager | Streams workforce roster CSV |
