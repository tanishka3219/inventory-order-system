# StockVibe | Enterprise Inventory & Order Management System

StockVibe is a complete, production-ready, full-stack Inventory and Order Management System designed for modern enterprises. It provides a real-time responsive dashboard, role-based user access controls (RBAC), multi-item order checkouts, transactional stock locks, and comprehensive action auditing.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[React SPA - Vite / Nginx]
    API[FastAPI Server - Uvicorn]
    DB[(PostgreSQL Database)]

    Client -->|REST APIs + JWT Auth| API
    API -->|SQLAlchemy ORM / ACID Transactions| DB
    API -->|Write-ahead| Logs[Audit Log Trail]
```

### Key Security & Integrity Features:
- **ACID Transactions:** Order creation uses row locks (`WITH FOR UPDATE` in SQLAlchemy) to prevent race conditions during parallel checkout attempts.
- **Role-Based Access Control (RBAC):** Restricts inventory changes (Create, Update, Delete) to `admin` and `manager` roles, and limits system logs viewing to `admin`.
- **Action Auditing:** Auto-logs metadata changes on products, orders, customers, and logins.

---

## 📦 Project Structure

```
inventory-management-system/
├── backend/
│   ├── app/
│   │   ├── routes/          # API Route Controllers
│   │   ├── auth.py          # JWT, Passlib Cryptography & Role Checks
│   │   ├── config.py        # Settings Loader (Pydantic)
│   │   ├── database.py      # SQLAlchemy Session Initialization
│   │   ├── main.py          # FastAPI Root & Seed Init
│   │   ├── models.py        # Database Schema Entities
│   │   ├── schemas.py       # Pydantic Request/Response Models
│   │   └── crud.py          # Core Database Transactions
│   ├── tests/               # Pytest Unit & Integration Suite
│   ├── Dockerfile           # Backend Docker Image Configuration
│   └── requirements.txt     # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Panels (Sidebar, Navbar, Cards)
│   │   ├── context/         # Global Context Providers (Auth, Theme, etc.)
│   │   ├── pages/           # Application Router Views
│   │   ├── services/        # Axios Core API Client
│   │   ├── App.jsx          # Route Layout Bindings
│   │   ├── index.css        # Tailwind Entry & Utility Classes
│   │   └── main.jsx         # SPA Bootloader
│   ├── Dockerfile           # Multi-stage Production Build (Nginx)
│   ├── nginx.conf           # Client Redirects for React Router
│   ├── tailwind.config.js   # Custom Palette & Dark Mode Config
│   └── package.json         # NPM Dependencies
├── docker-compose.yml       # Production Compose Orchestrator
├── README.md                # System Documentation
└── .env.example             # Env Config Templates
```

---

## ⚙️ Environment Variables

### Backend & Database (`.env`)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection URI | `postgresql://postgres:postgres@localhost:5432/inventory_db` |
| `SECRET_KEY` | Key to sign JWT tokens | `supersecretkeychangeinproduction123` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token Expiry Duration | `60` |

### Frontend (`frontend/.env` or `docker-compose.yml`)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Endpoint of backend API server | `http://localhost:8000` |

---

## 🚀 Quick Start (Docker Compose)

The entire application is containerized and ready to run with one command:

```bash
# Build images and start containers (Frontend, Backend, Postgres)
docker-compose up --build
```

- **React Frontend:** Open `http://localhost` (Port 80)
- **FastAPI OpenAPI UI:** Open `http://localhost:8000/docs`
- **Database Engine:** Bound to `localhost:5432`

### 🔑 Default Credentials:
On startup, the system automatically seeds a default administrator account:
- **Email:** `admin@inventory.com`
- **Password:** `admin123`

*(Note: You can register custom staff or managers profiles on the client register page)*

---

## 🔧 Local Development (Manual Setup)

### 1. Database Setup
Ensure you have a PostgreSQL server running locally, and create a database:
```sql
CREATE DATABASE inventory_db;
```

### 2. Backend Installation
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Copy `.env.example` as `.env` and fill values, then run uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

We use `pytest` with a configured SQLite in-memory database to test the backend API flow without affecting your development database.

To run the tests inside the Docker container environment:
```bash
docker-compose exec backend pytest
```

To run tests locally:
```bash
cd backend
pytest -v
```

---

## 📡 API Reference Documentation

### Authentication APIs
- `POST /api/auth/register` - Create user profiles
- `POST /api/auth/login-json` - Sign in using JSON body parameters (returns JWT)
- `GET /api/auth/me` - Get profile properties of current active token

### Products (Inventory) APIs
- `GET /api/products` - List products (includes `search` query, `low_stock` boolean flag, and `skip`/`limit` pagination)
- `POST /api/products` - Register a catalog item (Admin/Manager role)
- `GET /api/products/{id}` - Fetch single item details
- `PUT /api/products/{id}` - Modify product price or quantities (Admin/Manager role)
- `DELETE /api/products/{id}` - Remove a catalog product (Admin/Manager role)

### Customers APIs
- `GET /api/customers` - Fetch customer roster
- `POST /api/customers` - Register client emails & numbers (Admin/Manager role)
- `DELETE /api/customers/{id}` - Remove customer account (Admin/Manager role)

### Orders APIs
- `GET /api/orders` - View sales histories
- `POST /api/orders` - Submit new invoice checkout (updates stock levels)
- `PUT /api/orders/{id}/status` - Transition order states (e.g. Completed -> Cancelled)
- `DELETE /api/orders/{id}` - Delete order and restore stock levels (Admin/Manager role)

### Dashboard Metrics
- `GET /api/dashboard/stats` - Pull system-wide aggregates and low-stock product warnings

---

## ☁️ Deployment Instructions

### Backend (Render / Railway)
1. Set up a PostgreSQL database instance on your cloud provider.
2. Deploy the `backend/` folder. Use Nixpacks (on Railway) or python env (on Render).
3. Configure environment variables (`DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`).
4. Set the Build Command: `pip install -r backend/requirements.txt` and Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`.

### Frontend (Vercel / Netlify)
1. Deploy the `frontend/` folder.
2. Configure Build Command: `npm install && npm run build` and Publish Directory: `dist` or `frontend/dist`.
3. Add the Environment Variable `VITE_API_URL` pointing to your deployed Backend URL.
4. **SPA Redirection Routing:** Vercel utilizes `vercel.json` and Netlify uses `netlify.toml` (both provided in the repository) to handle React Router client-side path mappings cleanly without throwing 404s.
