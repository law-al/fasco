const express = require('express');
// const morgan = require('morgan');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const productsRouter = require('./routes/productsRoute');
const cartRouter = require('./routes/cartRoute');
const couponRouter = require('./routes/couponRoute');
const chatRouter = require('./routes/chatRoute');
const orderRouter = require('./routes/orderRoute');
const webHookRouter = require('./routes/webhook');

// Version 2 Route
const authRouterV2 = require('./routes/authRouteV2');

const CustomError = require('./utils/CustomError');
const Cart = require('./models/cartModel');

const app = express();

/* ------------------------------
   Middlewares
--------------------------------*/
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// To use webhooks, evade the express.json
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next(); // Skip parsing JSON
  } else {
    express.json()(req, res, next);
  }
});

app.use(cookieParser());

// app.use(morgan('dev'));

app.use(
  session({
    secret: 'Lawal',
    resave: false,
    saveUninitialized: false,
    store: mongoStore.create({
      mongoUrl: process.env.DB_URI,
      dbName: 'fasco',
      collectionName: 'sessions',
      autoRemove: 'native',
      autoRemoveInterval: 10,
      touchAfter: 24 * 3600, // Save to DB after 24 hours or when session is modified
    }),
    cookie: { maxAge: +process.env.GUEST_SESSION_MAX_AGE },
    rolling: true, // Reset cookie expiration on each request, !not on every session changes
  })
);

/**
 * SESSION & COOKIE LIFECYCLE:
 *
 * INITIAL STATE:
 * - Cookie starts with GUEST_SESSION_MAX_AGE (e.g., 4 hours)
 *
 * ON EVERY REQUEST (due to rolling: true):
 * - Cookie expiration automatically extends by maxAge duration
 * - Cart expiration needs manual sync to match cookie timing
 *
 * USER STATUS CHANGES:
 * - Guest → User login: cookie.maxAge changes to USER_SESSION_MAX_AGE (e.g., 7 days)
 * - User → Logout: cookie.maxAge resets to GUEST_SESSION_MAX_AGE
 *
 * SYNCHRONIZATION REQUIREMENT:
 * - Cart.expiresAt must match cookie expiration time
 * - Both must update together on every request to prevent:
 *   • Orphaned carts (cart expires before session)
 *   • Lost inventory (session expires before cart cleanup)
 */
// check if session has a guest and guest cart, update the the cart expiration on every request due to "rolling: true"

app.use(async (req, res, next) => {
  if (req.session.guest && req.session.guest.cart) {
    try {
      await Cart.findByIdAndUpdate(req.session.guest.cart._id, {
        expiresAt: new Date(Date.now() + Number(process.env.GUEST_SESSION_MAX_AGE)),
      });

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

/* ------------------------------
   Routes
--------------------------------*/
// Version 1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/coupon', couponRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/webhooks', webHookRouter);

// Version 2
app.use('/api/v2/auth', authRouterV2);

/* ------------------------------
   Unhandled Routes
--------------------------------*/
app.use((req, res, next) => {
  next(new CustomError(`can't find ${req.originalUrl} on server`, 404));
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
    err,
  });
});

module.exports = app;
