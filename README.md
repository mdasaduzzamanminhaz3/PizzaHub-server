# 🍕 PizzaHub — Backend API

<p align="center">
  A RESTful backend API for PizzaHub, a full-stack pizza ordering and restaurant management platform.
</p>

<p align="center">
  <a href="https://pizzahub-server-olive.vercel.app/">Live API</a> •
  <a href="https://github.com/mdasaduzzamanminhaz3/PizzaHub-server">Backend Repository</a> •
  <a href="https://github.com/mdasaduzzamanminhaz3/PizzaHub">Frontend Repository</a>
</p>

---

## 📌 Project Overview

**PizzaHub Backend** is a RESTful API built with Express.js and MongoDB that powers the PizzaHub pizza ordering and delivery platform.

It handles menu item management, customer orders, vendor operations, user profile management, payment verification, and role-based authorization.

The backend integrates with Better Auth session data to authenticate users and provides middleware for Customer, Vendor, and Admin access control.

The application uses MongoDB for data storage and Stripe for vendor subscription payment verification.

## 🌐 Live Application & Repositories

| Resource | Link |
|---|---|
| Live Backend API | https://pizzahub-server-olive.vercel.app/ |
| Backend GitHub | https://github.com/mdasaduzzamanminhaz3/PizzaHub-server |
| Frontend Website | https://pizza-hub-delta.vercel.app/ |
| Frontend GitHub | https://github.com/mdasaduzzamanminhaz3/PizzaHub |

## ✨ Key Features

### 🔐 Authentication & Authorization
- Better Auth session integration.
- Token-based session verification.
- Authentication middleware.
- Role-based authorization.
- Separate middleware for Customers, Vendors, and Admins.
- Protected API endpoints.
- Unauthorized and forbidden request handling.

### 🍕 Menu Item Management
- Create new menu items.
- Retrieve all menu items.
- Retrieve individual menu item details.
- Update menu item information.
- Delete menu items.
- Filter menu items by vendor.
- Filter by category and approval status.
- Search menu items by name, vendor information, description, and location.
- Count menu items.

### 📦 Order Management
- Create customer orders.
- Retrieve orders.
- Filter orders by customer or vendor.
- Retrieve orders associated with a menu item.
- Cancel customer orders.
- Update order status.
- Accept or reject customer orders.

### 👥 User Management
- Retrieve user information.
- Retrieve all registered users.
- Check vendor premium status.
- Update user profile information.

### 💳 Payment Management
- Stripe integration.
- Retrieve Stripe Checkout Session information.
- Verify completed and paid checkout sessions.
- Prevent duplicate payment verification.
- Store payment transaction information.
- Update vendor premium status after successful payment verification.
- Retrieve payment history.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js 5 | Backend framework |
| JavaScript (ES Modules) | Server-side development |
| MongoDB | NoSQL database |
| MongoDB Native Driver | Database operations |
| Better Auth | Authentication session integration |
| Stripe | Payment verification |
| dotenv | Environment variable management |
| CORS | Cross-origin resource sharing |

## 📂 Project Structure

```text
pizzahub-server/
│
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## 🗄️ Database Structure

The application uses MongoDB as its primary database.

Database name:

```text
pizzahub
```

### Collections

| Collection | Description |
|---|---|
| user | User information and account roles |
| session | Better Auth session information |
| menuItems | Restaurant menu items |
| oreders | Customer order records |
| payments | Vendor subscription payment records |

*Note: The collection name `oreders` reflects the current spelling in the backend source code.*

## 🔑 Authentication Middleware

The backend uses Better Auth session information to verify authenticated requests.

### Token Verification

The `verifyToken` middleware:

1. Reads the Authorization header.
2. Extracts the session token.
3. Searches for the token in the MongoDB session collection.
4. Retrieves the associated user.
5. Attaches the authenticated user to `req.user`.
6. Allows the request to continue when verification succeeds.

Example request header:

```http
Authorization: Bearer YOUR_SESSION_TOKEN
```

### Role-Based Authorization

The backend includes three role-specific middleware functions:

| Middleware | Access |
|---|---|
| `verifyToken` | Authenticated users |
| `verifyCustomer` | Customer accounts |
| `verifyVendor` | Vendor accounts |
| `verifyAdmin` | Admin accounts |

These middleware functions help restrict protected API operations according to user roles.

## 📡 API Documentation

**Base URL:**

```text
https://pizzahub-server-olive.vercel.app
```

### 1. Menu Item APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/menuItems` | Retrieve menu items | Public |
| GET | `/menuItems/count` | Count menu items | Public |
| GET | `/menuItems/:id` | Retrieve a menu item | Public |
| POST | `/menuItem/create` | Create a menu item | Vendor |
| PATCH | `/menuItems/:id` | Update a menu item | Authenticated |
| DELETE | `/menuItems/:id` | Delete a menu item | Authenticated |

**Query Parameters for `/menuItems`:**

| Parameter | Description |
|---|---|
| `vendorId` | Filter by vendor |
| `category` | Filter by category |
| `status` | Filter by approval status |
| `admin` | Admin listing mode |
| `search` | Search across supported menu item fields |
| `name` | Filter by item name |

Example:

```http
GET /menuItems?category=Classic%20Pizzas
```

Search example:

```http
GET /menuItems?search=pepperoni
```

Vendor example:

```http
GET /menuItems?vendorId=VENDOR_ID
```

### 2. Order APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/orders/create` | Create a customer order | Customer |
| GET | `/orders` | Retrieve orders | Authenticated |
| PATCH | `/orders/:id/cancel` | Cancel an order | Customer |
| PATCH | `/orders/:id/status` | Update order status | Vendor |

**Query Parameters for `/orders`:**

| Parameter | Description |
|---|---|
| `vendorId` | Filter by vendor |
| `customerId` | Filter by customer |
| `CustomerId` | Alternative customer ID parameter |
| `customerEmail` | Filter by customer email |
| `menuItemId` | Filter by menu item |

Example:

```http
GET /orders?vendorId=VENDOR_ID
```

Update order status:

```http
PATCH /orders/ORDER_ID/status
```

Request body:

```json
{
  "status": "Accepted"
}
```

Supported order statuses:

- Pending
- Accepted
- Rejected
- Cancelled

### 3. User APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users` | Retrieve all users | Public |
| GET | `/users/:id` | Retrieve user details | Authenticated |
| GET | `/users/:id/premium` | Retrieve premium status | Authenticated |
| PATCH | `/users/:id` | Update user profile | Authenticated |

Example profile update:

```http
PATCH /users/USER_ID
```

Request body:

```json
{
  "name": "John Doe",
  "restaurantName": "Pizza House",
  "phone": "0123456789",
  "address": "Dhaka, Bangladesh",
  "image": "https://example.com/profile.jpg"
}
```

### 4. Payment APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/payments/checkout-verify` | Verify Stripe Checkout payment | Authenticated |
| GET | `/payments` | Retrieve payment records | Authenticated |

Verify payment:

```http
POST /payments/checkout-verify
```

Request body:

```json
{
  "sessionId": "STRIPE_CHECKOUT_SESSION_ID"
}
```

The backend retrieves the Checkout Session from Stripe and checks its payment status before recording a successful payment and updating the vendor's premium status.

Retrieve payment history:

```http
GET /payments?userId=USER_ID
```

### 5. Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check server response |

Example response:

```text
Hello world!
```

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB database
- Git
- Stripe account and API credentials

### 1. Clone the Repository

```bash
git clone https://github.com/mdasaduzzamanminhaz3/PizzaHub-server.git
```

### 2. Navigate to the Project Directory

```bash
cd PizzaHub-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

STRIPE_SECRET_KEY=your_stripe_secret_key
```

Make sure to provide valid credentials.

### 5. Start the Backend Server

The current `package.json` does not define a development start script. You can run the server directly:

```bash
node index.js
```

The server will run at:

```text
http://localhost:5000
```

## 🔗 Frontend Integration

The backend provides API services for the PizzaHub frontend application.

Frontend:

```text
https://pizza-hub-delta.vercel.app/
```

Backend:

```text
https://pizzahub-server-olive.vercel.app/
```

The frontend communicates with the backend using HTTP requests and sends the authentication session token through the Authorization header for protected operations.

## 🔒 Security Considerations

- Session token verification through Better Auth session records.
- Role-based authorization middleware.
- Protected API routes.
- Environment-based secret management.
- Stripe Checkout Session verification.
- Duplicate payment verification prevention.
- Server-side validation of supported order and menu status values.

## 🚀 Deployment

The backend is deployed on **Vercel**.

Live API:

https://pizzahub-server-olive.vercel.app/

## 🔮 Future Improvements

- Centralized error handling middleware.
- More comprehensive request validation.
- Improved API response consistency.
- Pagination for large datasets.
- Enhanced resource ownership validation.
- Automated API testing.
- Improved API documentation with Swagger/OpenAPI.
- Dedicated logging and monitoring.

## 👨‍💻 Developer

**Md Asaduzzaman Minhaz**

- GitHub: [@mdasaduzzamanminhaz3](https://github.com/mdasaduzzamanminhaz3)
- Backend Repository: [PizzaHub-server](https://github.com/mdasaduzzamanminhaz3/PizzaHub-server)

---

<p align="center">
  Built with ❤️ using Node.js, Express.js & MongoDB.
</p>

<p align="center">
  © 2026 PizzaHub. All Rights Reserved.
</p>