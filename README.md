# QueueLess — Universal Smart Queue & Crowd Management Platform

QueueLess is an enterprise, multi-sector queue optimization and crowd intelligence platform designed to eliminate physical waiting lines, prevent overcrowding, and dynamically recommend counter staffing for:

- **Hospitals & Medical Centers**
- **Banks & Financial Institutions**
- **Universities & Educational Campuses**
- **Government Offices & Municipal Centers**
- **Public Service Centers & Utilities**

---

## 1. Architecture Overview

QueueLess connects two client applications to a shared Google Cloud Firestore database:
- **`mobile/`**: Visitor Android application built with React Native, Expo, and TypeScript.
- **`admin/`**: Institution Admin web dashboard built with React, Vite, TypeScript, and Tailwind CSS.
- **`firebase/`**: Firestore security rules, indexing policies, and Cloud Functions API callables.
- **`shared/`**: Common TypeScript contracts, models, multi-sector presets, and mathematical algorithms.
- **`tests/`**: Unit and integration test suites.
- **`docs/`**: Comprehensive architectural, database schema, and API specifications.

```
QueueLess/
├── mobile/             # Member 1 — Visitor Android App (Expo / React Native)
├── admin/              # Member 2 — Institution Admin Dashboard (React / Vite)
├── firebase/           # Member 3 — Backend, Rules, & Cloud Functions
├── shared/             # Member 4 — Types, Contracts, & Queue Algorithms
├── tests/              # Member 4 — QA, Unit & Integration Tests
└── docs/               # System Architecture, DB Schema & API Contracts
```

---

## 2. Four-Member Team Responsibilities

| Team Member | Domain | Key Responsibilities | Feature Branch |
| :--- | :--- | :--- | :--- |
| **Member 1** | Mobile Application | Visitor Android app, institution discovery, digital token generation, live queue tracker, QR code ticket presentation, and push alerts. | `feature/mobile-app` |
| **Member 2** | Admin Dashboard | Multi-branch management, counter assignment, real-time ticket dispatcher, crowd occupancy heatmap, overcrowding alerts, and analytics. | `feature/admin-dashboard` |
| **Member 3** | Backend & Security | Firebase Authentication, Cloud Firestore schema, Firestore Security Rules (RBAC + Tenant Isolation), and Cloud Functions endpoints. | `feature/firebase-backend` |
| **Member 4** | Algorithms & QA | Smart arrival slot calculations, wait-time estimation, crowd density thresholds, staffing recommendations, and automated tests. | `feature/algorithms-qa` |

---

## 3. Quick Start & Execution Commands

### Prerequisites
- Node.js v18+ (Node v20+ recommended)
- npm v10+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` templates and insert your Firebase project details:
```bash
cp .env.example .env.local
cp admin/.env.example admin/.env.local
cp mobile/.env.example mobile/.env.local
```

### 3. Run Admin Web Dashboard (Member 2)
```bash
npm run dev:admin
# Runs Vite server on http://localhost:5173
```

### 4. Run Visitor Mobile App (Member 1)
```bash
npm run dev:mobile
# Starts Expo development server
```

### 5. Run Firebase Emulators (Member 3)
```bash
npm run emulators
# Starts Firestore (8080), Auth (9099), Functions (5001), and UI (4000)
```

### 6. Run Algorithm & Integration Tests (Member 4)
```bash
npm test
```

---

## 4. Documentation Index

- [System Architecture](file:///Users/simrankumari/Queueless/docs/ARCHITECTURE.md)
- [Database Schema](file:///Users/simrankumari/Queueless/docs/DATABASE_SCHEMA.md)
- [API Contract](file:///Users/simrankumari/Queueless/docs/API_CONTRACT.md)
- [Development Guide](file:///Users/simrankumari/Queueless/docs/DEVELOPMENT_GUIDE.md)

---

## 5. Security & Isolation Note

QueueLess enforces strict multi-tenant isolation. All records feature `institutionId` and (where appropriate) `branchId`. Unrestricted Firestore test-mode rules are explicitly prohibited.
