# 💰 Personal Finance Tracker

A full-stack application to **track your income and expenses** with secure **authentication**, **role-based access**, and **real-time analytics**.

---

## 🧰 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js, Tailwind CSS               |
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL                          |
| Cache     | Redis                               |
| Charts    | Chart.js / Recharts                 |
| Auth      | JWT + RBAC                          |
---
## 🚀 Features

- 🔐 User authentication (JWT)
- 👥 Role-based access (admin/user)
- 💸 Income and expense tracking
- 📊 Chart-based analytics
- ⚡ Redis caching for performance
- 📱 Responsive and modern UI

---

## 🏁 Getting Started

### 📦 Clone the Repository

```bash
git clone https://github.com/devesh88888/Personal-Finance-Tracker-frontend
cd Personal-Finance-Tracker-frontend
```

---

## 🛠️ Backend Setup (`/backend`)
git clone https://github.com/devesh88888/Personal-Finance-Tracker-backend
cd Personal-Finance-Tracker-backend

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/finance_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

### 3. Create PostgreSQL Tables

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Start the Backend Server

```bash
npm run dev
```

API runs at: `http://localhost:5000`

---

## 📡 API Routes

### 🔐 Auth

| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | `/api/auth/register`  | Register new user  |
| POST   | `/api/auth/login`     | Login & get token  |

### 💰 Transactions

| Method | Endpoint                | Description             |
|--------|-------------------------|-------------------------|
| GET    | `/api/transactions`     | Fetch user transactions |
| POST   | `/api/transactions`     | Add a new transaction   |
| PUT    | `/api/transactions/:id` | Update a transaction    |
| DELETE | `/api/transactions/:id` | Delete a transaction    |

> 🔐 All transaction routes require JWT in `Authorization: Bearer <token>` header.

---



Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start Frontend Server

```bash
npm run dev
```

Runs at: [http://localhost:3000](http://localhost:3000)

---

## 📈 Dashboard Analytics

- Total income and expenses
- Category-wise charts
- Weekly/monthly trends
- Income vs Expense visualizations

---

## 🔐 Auth & RBAC

- JWT authentication system
- Role-based access control for admin/user separation
- Secure protected routes

---

