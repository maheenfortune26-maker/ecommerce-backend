# 🛒 Node.js eCommerce Backend

A production-style REST API backend for an eCommerce platform built with **Node.js**, **Express**, and **MongoDB**. Covers user authentication, product management, cart, and order processing.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (HTTP-only cookies) |
| Password Hashing | bcryptjs |
| Validation | validator.js |

---

## 📁 Folder Structure (MVC)

```
ecommerce-backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Register, login, logout, profile
│   ├── productController.js # CRUD + search/filter/pagination/reviews
│   ├── orderController.js   # Place, view, update orders
│   └── cartController.js    # Add, update, remove cart items
├── middleware/
│   ├── auth.js              # isAuthenticated + authorizeRoles
│   └── errorHandler.js      # ErrorHandler class + catchAsync wrapper
├── models/
│   ├── User.js              # User schema with bcrypt + JWT methods
│   ├── Product.js           # Product schema with reviews subdoc
│   └── Order.js             # Order schema with shipping + payment
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── cartRoutes.js
├── .env.example             # Environment variable template
├── package.json
└── server.js                # Entry point
```

---

## ⚙️ Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd ecommerce-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` with your values:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecommerce
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=development
```

### 3. Run
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## 🔌 API Routes

### Auth — `/api/v1/auth`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, sets JWT cookie |
| POST | `/logout` | Private | Clear token cookie |
| GET | `/me` | Private | Get logged-in user profile |
| PUT | `/me/update` | Private | Update name/email |
| PUT | `/password/update` | Private | Change password |

---

### Products — `/api/v1/products`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List all products (search, filter, paginate) |
| GET | `/:id` | Public | Get single product |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/review` | Private | Add/update review |

**Query Parameters for GET /products:**
- `keyword` — search by name (regex)
- `category` — filter by category
- `minPrice` / `maxPrice` — price range
- `rating` — minimum rating
- `page` — page number (default: 1)
- `limit` — results per page (default: 8)

---

### Orders — `/api/v1/orders`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/` | Private | Place new order |
| GET | `/my` | Private | Get my orders |
| GET | `/:id` | Private | Get single order |
| GET | `/admin/all` | Admin | Get all orders |
| PUT | `/admin/:id` | Admin | Update order status |
| DELETE | `/admin/:id` | Admin | Delete order |

**Order Statuses:** `processing` → `shipped` → `delivered` | `cancelled`
> Stock is deducted automatically when status changes to `shipped`

---

### Cart — `/api/v1/cart`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | View cart with subtotals |
| POST | `/` | Private | Add item to cart |
| PUT | `/:productId` | Private | Update item quantity |
| DELETE | `/:productId` | Private | Remove single item |
| DELETE | `/clear` | Private | Clear entire cart |

> Quantity is automatically capped at available stock

---

## 🔐 Authentication Flow

1. User registers → password hashed with **bcrypt** (10 rounds)
2. JWT token generated → stored in **HTTP-only cookie** (prevents XSS)
3. Protected routes → `isAuthenticated` middleware verifies token
4. Admin routes → `authorizeRoles("admin")` checks user role

---

## 🧠 Key Design Decisions

- **`catchAsync` wrapper** — eliminates try/catch in every controller
- **`ErrorHandler` class** — standardized error responses across the app
- **`select: false` on password** — never returned in queries by default
- **Stock cap on cart** — quantity cannot exceed product stock
- **Stock deduction on ship** — reduces inventory when order is shipped
- **Regex search** — case-insensitive product name search

---

## 🧪 Test with Postman / Thunder Client

Import base URL: `http://localhost:5000/api/v1`

Health check: `GET /health`
