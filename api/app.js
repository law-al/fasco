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
      ttl: 24 * 60 * 60, // 24 hours
      touchAfter: 24 * 3600, // Only update session once per 24 hours unless data changes
    }),
    cookie: { maxAge: +process.env.GUEST_SESSION_MAX_AGE },
    rolling: true, // Reset expiration on each request
  })
);

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
