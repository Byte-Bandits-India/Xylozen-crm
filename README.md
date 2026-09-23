# Xylozen CRM

A unified, comprehensive Customer Relationship Management (CRM) & Operations Platform developed for Byte Bandits.

---

## 📁 Repository Structure

```
.
├── dashBoard/             # Frontend application (React / Vite / TypeScript / Tailwind / Lucide Icons)
├── Dashboard-Backend/     # Backend API (Node.js / Express / TypeScript / Prisma ORM)
├── docker-compose.yml     # Multi-container orchestration (Backend + Database + Frontend services)
├── Makefile               # Convenient build and dev commands
├── EC2-CUTOVER-RUNBOOK.md # Production EC2 Deployment & Cutover Guide
└── SERVER_ARCHITECTURE_AND_DEPLOYMENT_GUIDE.md # Server Architecture & Operations
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm** or **yarn**
- **Docker & Docker Compose** (optional, for containerized deployment)
- **PostgreSQL / MySQL** database instance

---

### Backend Setup (`Dashboard-Backend`)

1. Navigate to the backend folder:
   ```bash
   cd Dashboard-Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp deploy/.env.backend.example .env
   # Update database connection strings, JWT secret, SMTP settings, etc.
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   # or npx prisma db push
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup (`dashBoard`)

1. Navigate to the frontend folder:
   ```bash
   cd dashBoard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Ensure VITE_API_BASE_URL points to your backend instance
   ```
4. Start frontend development server:
   ```bash
   npm run dev
   ```

---

## 🐳 Docker Deployment

To spin up the entire stack using Docker Compose:

```bash
docker compose up -d --build
```

---

## 📄 License & Ownership
Copyright © Byte Bandits India. All rights reserved.
