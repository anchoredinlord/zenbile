# ዘንቢል Zenbil — Ethiopian Multi-Vendor Online Marketplace

A full-stack multi-vendor marketplace where independent Ethiopian shops can register, upload products, and receive orders from customers through one website.

---

## What it does

- **Customers** browse products from multiple shops, add to cart, and checkout
- **Sellers** register their shop, upload products with photos, and manage orders
- **Admins** approve sellers, manage categories, and oversee the platform
- **Multi-seller orders** — one checkout can include products from different shops, each seller fulfills their own portion independently

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Frontend | React, Tailwind CSS, Vite |
| Auth | JWT (JSON Web Tokens) |
| File storage | Local uploads (product images) |

---

## Features

### Customer
- Browse and search products
- Filter by category, price
- Shopping cart
- Checkout with pickup or delivery
- Order tracking with progress bar
- Order history

### Seller
- Register shop (pending admin approval)
- Add/edit/delete products
- Upload up to 5 product images
- Manage incoming orders
- Update order fulfillment status with customer messages
- Edit shop profile

### Admin
- Approve/reject/suspend sellers
- Manage product categories
- Platform statistics

---

## Project Structure

```
zenbil/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/endpoints/ # Route handlers
│   │   ├── core/             # Auth, security, config
│   │   ├── db/               # Database connection
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── alembic/              # Database migrations
│   ├── tests/                # Pytest tests
│   ├── .env.example          # Environment variable template
│   └── requirements.txt
│
└── frontend/                 # React application
    └── src/
        ├── components/       # Reusable UI components
        ├── context/          # Auth and Cart state
        ├── pages/            # Page components
        └── utils/            # API client
```

---

## Setup and Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Copy the environment template and fill in your values:
```bash
cp .env.example .env
```

Required variables in `.env`:
```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/zenbil_db
SECRET_KEY=your-secret-key-here
```

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Run database migrations:
```bash
alembic upgrade head
```

Start the backend:
```bash
venv/bin/uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/api/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

---

## Database Setup

```sql
CREATE USER zenbil_user WITH PASSWORD 'yourpassword';
CREATE DATABASE zenbil_db OWNER zenbil_user;
GRANT ALL PRIVILEGES ON DATABASE zenbil_db TO zenbil_user;
```

---

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/v1/auth/register | Register customer |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/products/ | Browse products |
| POST | /api/v1/sellers/register | Register as seller |
| POST | /api/v1/orders/checkout | Place order |
| GET | /api/v1/orders/seller | Seller incoming orders |
| PUT | /api/v1/sellers/admin/{id}/review | Admin approve seller |

Full documentation: `http://localhost:8000/api/docs`

---

## Environment Variables

See `.env.example` for all required variables. Never commit `.env` to git.

---

Built with FastAPI + React as a portfolio and business project.
