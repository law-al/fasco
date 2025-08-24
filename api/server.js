require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const { scheduleCartCleanUp, scheduleExpiredDealsCleanUp } = require('./utils/cronJobs');

process.on('unhandledRejection', err => {
  console.log(err.message);
  console.log('Unhandled rejection occured! Shutting down!!!');

  process.exit(1);
});

process.on('uncaughtException', err => {
  console.log(err.message);
  console.log('Unhandled rejection occured! Shutting down!!!');

  process.exit(1);
});

const app = require('./app');

const port = process.env.PORT || 8000;

const connectDb = async () => {
  await mongoose.connect(process.env.DB_URI);
  console.log('DB connected');
};

app.listen(port, async () => {
  await connectDb();
  await scheduleCartCleanUp(); //cron service
  await scheduleExpiredDealsCleanUp();
  console.log('server started');
});
