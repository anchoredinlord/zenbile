ree shipping on orders over 500 ETB  ·  Shop local Ethiopian products# ዘንቢል Zenbil — Ethiopian Multi-Vendor Online Marketplace

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.159-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack multi-vendor online marketplace where independent Ethiopian shops register, upload products, and receive orders from customers — all through one unified platform.

> Built as a serious portfolio project demonstrating full-stack software engineering skills including system design, database architecture, REST API development, frontend development, authentication, and professional Git practices.

---

## Live Demo

> Deployment coming soon — local setup instructions below.

---

## Quick Start: Run Both Servers Locally

Already set up (dependencies installed, migrations applied, `.env` configured)? Launch the full stack in two terminals. Each server watches for file changes and auto-reloads on save, so you usually start them once and leave them running while you work.

### Terminal 1 — Backend (FastAPI on port 8000)

```bash
cd backend
venv/bin/uvicorn app.main:app --reload --port 8000
```

On success:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

Confirm the API is healthy:

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok","app":"Gabaa","environment":"development"}
```

Interactive API documentation (available when `DEBUG=True`):

- Swagger UI → http://localhost:8000/api/docs
- ReDoc → http://localhost:8000/api/redoc

> **Start from the `backend/` directory.** uvicorn resolves the app path `app.main:app` relative to the current working directory. Running it from the project root raises `ModuleNotFoundError: No module named 'app'` — see [Troubleshooting](#troubleshooting).

### Terminal 2 — Frontend (Vite + React on port 5173)

```bash
cd frontend
npm run dev
```

On success:

```
VITE v5.4.21  ready in 642 ms
➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. The frontend calls the backend at `http://localhost:8000`; CORS is already enabled for `localhost:5173` and `127.0.0.1:5173` in `app/main.py`.

### What to expect while developing

- Both servers reload on save — no manual restart after edits.
- The backend serves uploaded images at `http://localhost:8000/uploads/...` (mounted via `StaticFiles`).
- Alembic migrations are **not** applied automatically at startup. After creating or editing a migration, run `alembic upgrade head` manually from the `backend/` directory.
- New environment variables require a backend restart (the `--reload` watcher reloads code, not the process environment).

### Running both servers from one shell (background mode)

If you prefer a single terminal, run each server in the background and check their output as needed:

```bash
# From project root
backend/venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend &
cd frontend && npm run dev &
```

> Note: `--app-dir backend` lets uvicorn find the `app` package when you start it from the project root.

---

## Screenshots

### Customer Homepage — Products Grouped by Category
Products from different sellers are organized by category so customers find what they need quickly.

### Seller Dashboard — Order Management
Sellers see incoming orders, confirm availability, and update fulfillment status step by step.

### Admin Dashboard — Seller Approval
Admins review seller applications, approve or reject them, and manage product categories.

### Product Detail with Star Ratings
Verified buyers leave star ratings and reviews. Only customers who purchased and received a product can review it.

### Order Tracking with Progress Bar
Customers track their order through 5 stages: Pending → Confirmed → Preparing → Ready → Completed.

---

## What Problem This Solves

Many Ethiopian small businesses sell through Telegram channels and WhatsApp groups. This creates problems:

- Customers cannot search or compare products easily
- Sellers have no organized way to manage orders
- No order tracking or fulfillment workflow
- No central trust layer between buyers and sellers

Zenbil gives these sellers a professional storefront with real order management, while keeping the familiar Telegram-based promotion workflow for customer acquisition.

---

## Features

### For Customers
- Browse products from multiple shops in one marketplace
- Search by name, filter by category, price range
- Products grouped by category on the homepage
- Add products from different shops to one cart
- Checkout with pickup or delivery option
- Order tracking with real-time progress updates
- Leave star ratings and reviews (verified buyers only)
- View order history

### For Sellers
- Register a shop with a specific shop type (Electronics, Clothing, Shoes, etc.)
- Wait for admin approval before going live
- Upload products with up to 5 photos each
- Set prices, stock, sizes, and colors
- Receive incoming orders in a dashboard
- Add messages to customers when updating order status
- Manage shop profile and details

### For Admins
- Review and approve or reject seller applications
- Suspend sellers when necessary
- Manage product categories
- Monitor platform activity

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│              Tailwind CSS + React Router             │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/JSON (Axios)
                      │ Authorization: Bearer <JWT>
┌─────────────────────▼───────────────────────────────┐
│                FastAPI Backend                       │
│   Pydantic validation → Services → SQLAlchemy ORM   │
│   JWT Authentication + Role-based Authorization     │
└─────────────────────┬───────────────────────────────┘
                      │ SQL via psycopg2
┌─────────────────────▼───────────────────────────────┐
│              PostgreSQL Database                     │
│   11 tables · Migrations via Alembic                 │
└─────────────────────────────────────────────────────┘
```

### Database Schema (11 tables)

```
users ──────────────── seller_profiles ── shops
  │                                         │
  │                              ┌──────────┤
  │                         products    categories
  │                              │
  │                         product_images
  │
  ├── carts ── cart_items
  │
  └── orders ── order_items ── seller_orders
                      │
                   reviews
```

### Key Technical Decisions

**Why separate `orders` and `seller_orders`?**
When a customer buys from 3 shops in one cart, we create 1 `order` for the customer and 3 `seller_orders`. Each seller sees and manages only their own fulfillment. This is a real-world multi-tenant design pattern.

**Why store `price_cents` as Integer?**
Floating-point arithmetic causes rounding errors with money. Storing `85000` (= 850.00 ETB) as an integer prevents financial calculation bugs. This is industry standard practice.

**Why lock price at order time?**
`order_items` stores `unit_price_cents` and `product_name` at the moment of purchase. Even if a seller changes the price later, all past orders remain accurate. This is critical for dispute resolution.

**How is overselling prevented?**
During checkout, product rows are locked with `SELECT FOR UPDATE` before stock is deducted. This prevents two customers from both buying the last item in a race condition.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | Python 3.14 | Backend |
| Framework | FastAPI | REST API |
| Validation | Pydantic v2 | Request/response validation |
| ORM | SQLAlchemy 2.1 | Database access |
| Migrations | Alembic | Database version control |
| Database | PostgreSQL 18 | Primary data store |
| Auth | JWT (python-jose) | Authentication tokens |
| Passwords | bcrypt | Secure password hashing |
| Frontend | React 18 | UI |
| Styling | Tailwind CSS 3 | Design system |
| Build tool | Vite | Frontend bundler |
| HTTP client | Axios | API calls from React |
| Testing | Pytest | Backend unit tests |

---

## Project Structure

```
zenbil/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # Route handlers (auth, sellers, products, orders, reviews)
│   │   ├── core/                # Config, security, JWT, dependencies
│   │   ├── db/                  # Database connection and session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   └── main.py              # FastAPI app entry point
│   ├── alembic/                 # Database migrations
│   │   └── versions/            # Migration history
│   ├── tests/                   # Pytest test suite
│   ├── .env.example             # Environment variable template
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/          # Reusable UI components
│       ├── context/             # React Context (Auth, Cart)
│       ├── pages/               # Page components
│       └── utils/               # API client (api.js)
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository

```bash
git clone https://github.com/anchoredinlord/zenbile.git
cd zenbile
```

### 2. Set up the database

```sql
CREATE USER zenbil_user WITH PASSWORD 'yourpassword';
CREATE DATABASE zenbil_db OWNER zenbil_user;
GRANT ALL PRIVILEGES ON DATABASE zenbil_db TO zenbil_user;
```

### 3. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
DATABASE_URL=postgresql+psycopg2://zenbil_user:yourpassword@localhost:5432/zenbil_db
SECRET_KEY=your-generated-secret-key
```

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Run database migrations:
```bash
alembic upgrade head
```

Start the backend server:
```bash
venv/bin/uvicorn app.main:app --reload --port 8000
```

API documentation: `http://localhost:8000/api/docs`

### 4. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Application: `http://localhost:5173`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register as customer |
| POST | `/api/v1/auth/login` | Login, receive JWT |
| GET | `/api/v1/auth/me` | Get current user profile |
| PUT | `/api/v1/auth/me` | Update profile |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/products/` | Browse products (search, filter, paginate) |
| GET | `/api/v1/products/{id}` | Get single product |
| GET | `/api/v1/products/categories` | List categories |
| POST | `/api/v1/products/` | Create product (seller) |
| PUT | `/api/v1/products/{id}` | Update product (seller) |
| POST | `/api/v1/products/{id}/images` | Upload image (seller) |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/orders/cart` | View cart |
| POST | `/api/v1/orders/cart/items` | Add to cart |
| POST | `/api/v1/orders/checkout` | Place order |
| GET | `/api/v1/orders/my` | Customer order history |
| GET | `/api/v1/orders/seller` | Seller incoming orders |
| PUT | `/api/v1/orders/seller/{id}/status` | Update fulfillment status |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/reviews/products/{id}` | Get product reviews |
| POST | `/api/v1/reviews/products/{id}` | Submit review (verified buyers only) |

### Sellers & Shops
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/sellers/register` | Register as seller |
| GET | `/api/v1/sellers/shops/{slug}` | Public shop page |
| GET | `/api/v1/sellers/shop-types` | List all shop types |
| GET | `/api/v1/sellers/by-type/{type}` | Shops by type |
| PUT | `/api/v1/sellers/admin/{id}/review` | Approve/reject seller (admin) |

---

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Current test coverage: authentication, registration, login, JWT validation, role-based access.

---

## Environment Variables

See `backend/.env.example`. Never commit `.env` to git.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret (generate with `secrets.token_hex(32)`) |
| `ALGORITHM` | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (default: 60) |
| `UPLOAD_DIR` | Directory for product images |
| `MAX_UPLOAD_SIZE_MB` | Maximum upload size (default: 5) |

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'app'` when starting the backend

uvicorn resolves the app path (`app.main:app`) relative to the current working directory. You must start the server from the `backend/` directory:

```bash
# Wrong — run from the project root
venv/bin/uvicorn app.main:app --reload --port 8000   # → ModuleNotFoundError

# Right — run from backend/
cd backend
venv/bin/uvicorn app.main:app --reload --port 8000
```

Alternatively, keep the project root as your working directory and point uvicorn at the backend with `--app-dir backend`.

### Frontend cannot reach the backend

1. Confirm the backend is running and healthy: `curl http://127.0.0.1:8000/api/health`.
2. The backend allows CORS from `http://localhost:5173` and `http://127.0.0.1:5173`. If you serve the frontend from another origin, add it to the `origins` list in `app/main.py`.
3. Check the browser console for CORS errors — they confirm the backend is reachable but rejecting the origin.

### `uvicorn: command not found`

Use the project's virtualenv directly (`backend/venv/bin/uvicorn ...`) or activate it first:

```bash
source backend/venv/bin/activate
```

### Port 8000 or 5173 already in use

Either stop the process holding the port, or run on a different one. Remember that a non-default frontend port must be added to the backend CORS `origins` list:

```bash
venv/bin/uvicorn app.main:app --reload --port 8001   # backend
npm run dev -- --port 5174                            # frontend
```

---

## Planned Features

- [ ] Telebirr / CBE Birr payment integration
- [ ] Real-time order notifications (WebSockets)
- [ ] AI-powered product description generator
- [ ] Delivery tracking integration
- [ ] Seller analytics dashboard with revenue charts
- [ ] Mobile app (React Native)
- [ ] Telegram bot for order notifications

---

## What I Learned Building This

- Designing a multi-tenant database schema where sellers manage only their own data
- Preventing race conditions in stock management using PostgreSQL row-level locking
- Separating database models from API schemas to control what data is exposed
- Building role-based authorization with FastAPI dependencies
- Managing database migrations professionally with Alembic
- Structuring a React application with Context API for global state

---

## Author

**DAMOZE MOTUMA**
GitHub: [@anchoredinlord](https://github.com/anchoredinlord)

---

*Built with FastAPI + PostgreSQL + React as a portfolio project demonstrating full-stack software engineering.*
