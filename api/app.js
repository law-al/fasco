const express = require('express');
// const morgan = require('morgan');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const cors = require('cors');

// ==========================================
// ROUTES
// ==========================================
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const productsRouter = require('./routes/productsRoute');
const cartRouter = require('./routes/cartRoute');
const couponRouter = require('./routes/couponRoute');
const chatRouter = require('./routes/chatRoute');

const CustomError = require('./utils/CustomError');

const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(
  cors({
    origin: 'http://localhost:3000', // your frontend URL
    credentials: true,
  })
);

app.use(express.json());
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

// ==========================================
// ROUTE MIDDLEWARE
// ==========================================
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/coupon', couponRouter);
app.use('/api/v1/chat', chatRouter);

// ==========================================
// UNHANDLED ROUTES
// ==========================================
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
