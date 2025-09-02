# Fasco App Client

This is the frontend for Fasco App, built with Nuxt 3, Vue, and Tailwind CSS.
It features a modern e-commerce UI, cart and checkout flows, session-based authentication, Stripe integration, and an AI-powered chat assistant.

---

## Features

- Product browsing, search, and filtering
- Cart management and checkout with Stripe
- Session-based user authentication
- AI-powered chat assistant for support and product recommendations
- Coupon application and order history

## AI Chat Usage

- The chat box allows users to ask questions, get product suggestions, and receive support.
- Messages are sent to the backend AI endpoint and responses are rendered in the chat UI.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
NUXT_API_BASE_URL=http://localhost:5000
NUXT_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

---

## Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

### Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

---
