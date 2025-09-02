# Fasco App API

This is the backend API for Fasco App, built with Node.js, Express, and MongoDB.
**Authentication is handled via sessions (no JWT).**

## Setup

1. **Install dependencies:**

   ```bash
   cd api
   npm install
   ```

2. **Environment variables:**

   - Copy `config.env.example` to `config.env` and fill in your MongoDB URI, Stripe keys, session secret, etc.

3. **Run the server:**
   ```bash
   npm run start_dev
   ```

## Main Endpoints

- `POST /api/v1/auth/register` — Register a new user
- `POST /api/v1/auth/login` — Login (session-based)
- `POST /api/v1/auth/logout` — Logout user
- `GET /api/v1/auth/me` — Get current user profile

- `GET /api/v1/products` — List all products
- `GET /api/v1/products/:id` — Get product details
- `GET /api/v1/collections` — List product collections
- `GET /api/v1/collections/:slug` — Get products in a collection

- `GET /api/v1/cart` — Get current cart
- `POST /api/v1/cart` — Add item to cart
- `PATCH /api/v1/cart/update-cart-item/:sku` — Update cart item quantity
- `DELETE /api/v1/cart/delete-cart-item/:sku` — Remove item from cart
- `POST /api/v1/cart/merge-cart` — Merge guest cart with user cart
- `POST /api/v1/cart/clear` — Clear cart

- `POST /api/v1/order/create-order` — Create an order
- `GET /api/v1/order/:id` — Get order details
- `GET /api/v1/orders` — List user orders

- `POST /api/v1/coupon/apply` — Apply a coupon
- `GET /api/v1/coupon/:code` — Get coupon details

- `POST /api/v1/ai/chat` — AI chat endpoint (product suggestions, support)

- `GET /api/v1/users` — List all users (admin)
- `PATCH /api/v1/users/me` — Update current user profile
- `PATCH /api/v1/users/update-password` — Update user password
- `DELETE /api/v1/users/me` — Delete current user account

## Important Details

- **Session-based authentication:**
  All user sessions are managed via cookies and server-side sessions.
- **Cart expiration:**
  Guest carts expire after a set time (e.g., 10 minutes). User carts persist longer.
- **AI chat integration:**
  The `/ai/chat` endpoint provides product suggestions and support using an AI model from openAi.
- **Coupon usage tracking:**
  Coupons are tracked per user and cart.
- **Order and inventory management:**
  Orders update inventory and support rollback on failure.

## Technologies

- Node.js
- Express
- MongoDB (Mongoose)
- Stripe
- Session-based auth (express-session)
- AI integration (Claude, OpenAI, or similar)

## Suggestions & Future Improvements

- **Email Notifications:** Send order confirmations, and promotional emails.
- **Wishlist & Favorites:** Allow users to save products for later.
- **Product Reviews & Ratings:** Enable feedback and social proof.
- **Inventory Alerts:** Notify users when products are back in stock.
- **Order Tracking:** Let users track their order status and shipment.
- **AI Ordering Assistant:** Enable users to place orders via chat (natural language).
- **Personalized Recommendations:** Use AI to suggest products based on user behavior.
- **AI-powered Search:** Improve search relevance and handle typos or synonyms.
- **Automated Customer Support:** Handle FAQs and support requests via AI chat.
- **Multiple Payment Methods:** Support PayPal, Apple Pay, etc., in addition to Stripe.
- **Saved Cards & Addresses:** Make checkout faster for returning users.
- **Advanced Coupon & Discount Engine:** More flexible promotions and loyalty programs.
