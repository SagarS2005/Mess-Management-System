# 🍽️ Smart College Mess Management Platform

A modern digital platform to manage college hostel mess operations: daily menus, nutritional information, contactless QR meal attendance, meal opt-in/opt-out with cut-off rules, AI demand forecasting, dish voting, photo-proof complaint tracking, and fair monthly billing with **Razorpay UPI payments** & leave rebates.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **PostgreSQL / Neon DB**: Database schema is managed via **Prisma 7**.

---

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
* **Backend URL**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/health`

---

### 3. Run the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
* **Frontend URL**: `http://localhost:5173`

---

## 💳 Razorpay Payment Integration

The platform includes full **Razorpay** payment gateway integration for monthly mess billing:
* **Order Creation**: `POST /api/v1/billing/create-order` initializes an INR order with Razorpay in paise.
* **Cryptographic Verification**: `POST /api/v1/billing/verify-payment` verifies HMAC SHA-256 signatures (`razorpay_order_id|razorpay_payment_id` against `RAZORPAY_KEY_SECRET`).
* **Instant Status Update**: Upon verification, the student's bill is set to `PAID`, saving the payment transaction ID and date.
* **Official PDF Invoice**: Students can download their computer-generated PDF invoice with payment confirmation reference.
* **Dual-Mode (Production & Simulation)**:
  * When you add your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`, the live checkout popup opens for UPI (GPay/PhonePe), Cards, and Netbanking.
  * If keys are left blank in `.env`, the system automatically runs in **simulation mode** so you can still test the entire payment-to-receipt workflow without needing live banking credentials.

---

## 🔑 Demo Test Accounts

The database has been seeded with ready-to-test accounts for each role (Password: `password123` for all):

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@demo.college.edu` | `password123` | View menu & calories, Opt-in/out, Show Contactless QR Badge, Rate dishes, Vote in Sunday Special Poll, File complaints with photo proof, **Pay monthly bill via Razorpay (UPI/Card)**, and download PDF invoice. |
| **Mess Manager** | `manager@demo.college.edu` | `password123` | Counter QR Check-In Terminal (with anti-duplication alert), Live Headcount & Expected diners, Setup daily menus, Food Wastage logger & AI Demand Forecasting. |
| **Warden** | `warden@demo.college.edu` | `password123` | Review student complaints with photo evidence, update resolution status (`IN_PROGRESS`, `RESOLVED`), approve/reject student leave requests. |
| **Accounts** | `accounts@demo.college.edu` | `password123` | Execute monthly billing run (`Total Meals × Rates - Leave Rebates`), review student ledgers, download PDF Invoices. |

*(You can also register new accounts anytime via the "Register" tab on the frontend!)*

---

## 🛠️ Tech Stack & Architecture

### Backend:
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL (Neon Serverless)
- **Payment Gateway**: **Razorpay Node SDK**
- **Authentication**: JWT (JSON Web Tokens) with HttpOnly cookies & Role-Based Access Control
- **File Uploads**: Multer + Cloudinary
- **Libraries**:
  - `qrcode`: Dynamic short-lived QR token generation
  - `simple-statistics`: AI Demand forecasting based on turnout rates
  - `pdfkit`: Automated monthly invoice generation
  - `zod`: Request body data validation

### Frontend:
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS
- **Payment SDK**: Razorpay Checkout (`checkout.razorpay.com`)
- **Charts**: Recharts (Wastage & Turnout trends)
- **QR Engine**: `qrcode.react` & `html5-qrcode`
- **Icons**: Lucide React
- **HTTP Client**: Axios with `/api` proxy
