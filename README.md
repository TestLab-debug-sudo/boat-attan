# 🌊 PEACHWAVE – 3D Employee Attendance, Leave & Workforce Management System

> **A real, production-ready, full-stack Workforce & Attendance Management platform engineered with a premium 3D Peach Beach aesthetic, robust MongoDB permanent historical database, muster roll monthly calendars, and Google Sheets-compatible Excel exports.**

---

## 🌟 Key Highlights

- **Interactive 3D Beach Environment**: Built with **Three.js** and **React Three Fiber**. Features procedural undulating ocean waves, a realistic buoyancy-floating 3D boat that rocks with pitch and roll while gently moving across the scene, drifting clouds, golden sunlight, and shoreline palm trees.
- **Permanent MongoDB Historical Database**: 7,670+ real historical attendance documents spanning **2024**, **2025**, and **2026** with compound unique indexes (`employeeId` + `attendanceDate`) to prevent duplicates and enable lightning-fast multi-year queries. Old records are permanently retained and never wiped.
- **Advanced Monthly Attendance Muster Roll**: Direct digital rendition of industrial attendance registers. Features a 1..31 day matrix, automatic month length generation, weekend & holiday shading, and strict color-coded pills:
  - 🟢 **Green (P)**: Present
  - 🔴 **Red (L)**: Approved Leave
  - 🟡 **Yellow (PL)**: Pending Leave *(Never treated as approved)*
  - ⚪ **Grey (A)**: Absent
  - 🔵 **Blue (WFH)**: Work From Home
  - 🟠 **Orange (HD)**: Half Day
  - 🟣 **Purple (WO / H)**: Weekly Off / Official Holiday
- **ExcelJS Export Engine**: 7 distinct formatted Excel (`.xlsx`) downloads styled with peach brand banners, multi-worksheets, conditional cell fills, and 100% Google Sheets compatibility.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication for **ADMIN**, **MANAGER**, and **EMPLOYEE** roles with live demo login buttons.
- **Audit Vault & Manual Overrides**: Tamper-evident logging for all administrative modifications, override reasons, and employee status toggles.
- **Timezone**: Native compliance with `Asia/Kolkata` (IST) for attendance cutoff, punch timestamps, and reports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **3D Graphics** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Analytics & UI** | Recharts, Canvas-Confetti, React Hook Form, Zod |
| **Backend** | Node.js, Express.js, TypeScript (`tsx`), REST API, Socket.IO |
| **Database** | MongoDB 9.0+, Mongoose ODM, Compound Unique Indexes |
| **Spreadsheet Engine** | ExcelJS (`.xlsx` multi-sheet workbooks) |
| **Auth & Security** | JWT, bcryptjs, Role-Based Access Control, Audit Trail |

---

## 🎨 Premium Peach Beach Color Palette

| Token | Hex Code | Usage |
|---|---|---|
| **Primary Peach** | `#FFBFA3` | Brand buttons, calendar header rows, active badges |
| **Light Peach** | `#FFE0D0` | Card gradients, tab backgrounds, subtle borders |
| **Warm Cream** | `#FFF8F2` | Page background, input fields, subtle contrast |
| **Ocean Soft Blue** | `#8EDCE6` | 3D water surface, window tints, ambient glows |
| **Deep Ocean** | `#287D91` | Primary report headers, bold text accents |
| **Coral** | `#FF8A75` | Primary action CTA, alerts, active icons |
| **White** | `#FFFFFF` | Glassmorphic card backdrops, crisp text |
| **Dark Navy** | `#263746` | High-contrast typography, structural headings |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (Tested on Node v26.13.0)
- **MongoDB** running on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Populates 10 staff + 7,670 historical records (2024-2026)
npm run dev      # Starts Express + Socket.IO server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Launches Vite frontend on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

The login screen provides **one-click demo login buttons** for instant evaluation:

| Role | Email | Password | Linked Staff Member |
|---|---|---|---|
| **ADMIN** | `admin@peachwave.com` | `Admin@1234` | System Administrator |
| **MANAGER** | `manager@peachwave.com` | `Manager@1234` | Vikram Singh (`PW-1005`) |
| **EMPLOYEE** | `rajesh@peachwave.com` | `Employee@1234` | Rajesh Sharma (`PW-1001`) |

*All 10 sample employees have pre-provisioned portal accounts (`<employeeId>@peachwave.com` or `PW-XXXX` / `Employee@1234`).*

---

## 👥 10 Sample Employees Directory

| ID | Name | Role / Rank | Department | Contact |
|---|---|---|---|---|
| **PW-1001** | Rajesh Sharma | Senior Supervisor | Operations | +91-98765-10001 |
| **PW-1002** | Priya Patel | Lead Software Engineer | Technology | +91-98765-10002 |
| **PW-1003** | Arun Kumar | Senior Plant Operator | Manufacturing | +91-98765-10003 |
| **PW-1004** | Ananya Iyer | QA Specialist | Quality Control | +91-98765-10004 |
| **PW-1005** | Vikram Singh | Production Manager | Manufacturing | +91-98765-10005 |
| **PW-1006** | Sneha Reddy | HR Specialist | Human Resources | +91-98765-10006 |
| **PW-1007** | Mohammed Farooq | Maintenance Tech | Maintenance | +91-98765-10007 |
| **PW-1008** | Neha Verma | UI/UX Designer | Technology | +91-98765-10008 |
| **PW-1009** | Suresh Nair | Logistics Coordinator | Supply Chain | +91-98765-10009 |
| **PW-1010** | Kavita Joshi | Financial Analyst | Finance | +91-98765-10010 |

---

## 📊 Available Excel (.xlsx) Downloads

All 7 reports can be generated directly from the **Reports & Downloads** page or via REST API:

1. **Daily Attendance Register** (`/api/export/daily?date=YYYY-MM-DD`): All employees, check-in, check-out, working hours, punch remarks.
2. **Monthly Muster Roll Calendar** (`/api/export/monthly?year=YYYY&month=MM`): Exact 1..31 day calendar muster roll with status abbreviations and conditional colors.
3. **Yearly Attendance Compendium** (`/api/export/yearly?year=YYYY`): Multi-worksheet annual audit file.
4. **Employee-wise Dossier** (`/api/export/employee/:id`): Individual employee punch history and leave balance logs.
5. **Leave Management Report** (`/api/export/leaves`): Complete ledger of leave requests, categories, and manager decisions.
6. **Complete Historical Archive** (`/api/export/history`): Entire MongoDB historical database dump.
7. **Custom Date Range Report** (`/api/export/custom-range?startDate=...&endDate=...`): Arbitrary window audit report.

---

## 📡 API Reference Overview

- `POST /api/auth/login` – User authentication
- `POST /api/auth/demo-login?role=ADMIN|MANAGER|EMPLOYEE` – Rapid demo login
- `GET /api/dashboard/stats` – Dashboard KPIs, trends, and charts
- `GET /api/attendance/today` – Real-time attendance roster
- `POST /api/attendance/check-in` – Employee daily punch-in
- `POST /api/attendance/check-out` – Employee daily punch-out
- `POST /api/attendance/manual-correct` – Admin override with audit record
- `GET /api/attendance/monthly-calendar` – Muster roll calendar matrix
- `GET /api/leaves` – List leave requests
- `POST /api/leaves/apply` – Submit leave request
- `PATCH /api/leaves/:id/status` – Manager approval / rejection with auto-attendance sync
- `GET /api/historical` – Query MongoDB multi-year records
- `GET /api/settings` – Operational policies, cutoff time, holiday schedule

---

*PEACHWAVE System — Crafted with ❤️ by the Senior Full-Stack Engineering Team.*

