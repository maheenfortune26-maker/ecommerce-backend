🛒 Shoply — Node.js eCommerce Platform

A full-stack eCommerce platform built with Node.js, Express, MongoDB, and a custom dark-themed frontend. Production-ready REST API with JWT authentication, product management, cart, and order processing.

🌐 Live Demo: https://ecommerce-backend-is9mcpago-case22.vercel.app

✨ Features
🔐 JWT Authentication with HTTP-only cookies
🛍️ Product browsing with search, filter & sort
🛒 Cart management with stock validation
📦 Order placement and tracking
⭐ Product reviews and ratings
👑 Admin panel for product & order management
🎨 Beautiful dark frontend — no framework, pure HTML/CSS/JS
☁️ Deployed on Vercel
🚀 Tech Stack
Layer	Technology
Runtime	Node.js
Framework	Express.js
Database	MongoDB + Mongoose
Auth	JWT (HTTP-only cookies)
Password Hashing	bcryptjs
Validation	validator.js
Frontend	HTML, CSS, JavaScript
Deployment	Vercel
📁 Folder Structure (MVC)
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
├── public/
│   ├── index.html           # Main HTML — all pages in one file
│   ├── style.css            # Dark theme UI styles
│   └── app.js               # Frontend logic + API calls
├── .env.example
├── server.js                # Entry point
└── package.json
⚙️ Setup
1. Clone & Install
bash
git clone https://github.com/maheenfortune26-maker/ecommerce-backend
cd ecommerce-backend
npm install
2. Configure Environment
bash
cp .env.example .env

Edit .env with your values:

PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ecommerce
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=development
3. Run
bash
# Development (with nodemon)
npm run dev

# Production
npm start
4. Open in Browser
http://localhost:5000
🔌 API Routes
Auth — /api/v1/auth
Method	Route	Access	Description
POST	/register	Public	Register new user
POST	/login	Public	Login, sets JWT cookie
POST	/logout	Private	Clear token cookie
GET	/me	Private	Get logged-in user profile
PUT	/me/update	Private	Update name/email
PUT	/password/update	Private	Change password
Products — /api/v1/products
Method	Route	Access	Description
GET	/	Public	List all products (search, filter, paginate)
GET	/:id	Public	Get single product
POST	/	Admin	Create product
PUT	/:id	Admin	Update product
DELETE	/:id	Admin	Delete product
POST	/:id/review	Private	Add/update review

Query Parameters for GET /products:

Param	Description
keyword	Search by name (regex)
category	Filter by category
minPrice / maxPrice	Price range
rating	Minimum rating
page	Page number (default: 1)
limit	Results per page (default: 8)
Orders — /api/v1/orders
Method	Route	Access	Description
POST	/	Private	Place new order
GET	/my	Private	Get my orders
GET	/:id	Private	Get single order
GET	/admin/all	Admin	Get all orders
PUT	/admin/:id	Admin	Update order status
DELETE	/admin/:id	Admin	Delete order

Order Statuses: processing → shipped → delivered | cancelled

Stock is deducted automatically when status changes to shipped

Cart — /api/v1/cart
Method	Route	Access	Description
GET	/	Private	View cart with subtotals
POST	/	Private	Add item to cart
PUT	/:productId	Private	Update item quantity
DELETE	/:productId	Private	Remove single item
DELETE	/clear	Private	Clear entire cart

Quantity is automatically capped at available stock

🖥️ Frontend

Built with vanilla HTML, CSS and JavaScript — no frameworks needed.

Page	Description
🏠 Home	Product grid with search, filter by category, sort by price/rating
🔍 Product Detail	Full product info, stock status, reviews, add to cart
🛒 Cart	Manage items, update quantities, order summary with tax & shipping
📦 Orders	Full order history with status badges
🔐 Login / Register	JWT-based auth, token stored in localStorage
✅ Checkout	Shipping form, payment method selection, order placement

The frontend is served directly by Express from the public/ folder — no separate deployment needed.

🔐 Authentication Flow
User registers → password hashed with bcrypt (10 rounds)
JWT token generated → stored in HTTP-only cookie (prevents XSS)
Protected routes → isAuthenticated middleware verifies token
Admin routes → authorizeRoles("admin") checks user role
🧠 Key Design Decisions
catchAsync wrapper — eliminates try/catch in every controller
ErrorHandler class — standardized error responses across the app
select: false on password — never returned in queries by default
Stock cap on cart — quantity cannot exceed product stock
Stock deduction on ship — reduces inventory when order is shipped
Regex search — case-insensitive product name search
Static frontend — served by Express, no separate frontend server
🧪 Test with Thunder Client / Postman

Base URL: http://localhost:5000/api/v1

Health check:

GET /api/v1/health
☁️ Deployment

Deployed on Vercel with environment variables configured in the Vercel dashboard.

Live: https://ecommerce-backend-is9mcpago-case22.vercel.app

👩‍💻 Author

Maheen Khan — BSCS Student @ IIUI
DevWeekends Fellowship — Week 4 Assignment