const cron = require('node-cron');
const { cleanupExpiredGuestCarts } = require('../controllers/cartController');
const { checkExpiredDeals } = require('../controllers/productController');

const scheduleCartCleanUp = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Starting expired guest cart cleanup...');
      await cleanupExpiredGuestCarts();
      console.log('Expired guest cart cleanup completed successfully');
    } catch (error) {
      console.error('Error during cart cleanup:', error);
    }

    console.log('Cart cleanup scheduler initialized');
  });
};

const scheduleExpiredDealsCleanUp = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Starting expired deals cleanup...');
      await checkExpiredDeals();
      console.log('Expired deals cleanup completed successfully');
    } catch (error) {
      console.error('Error during cart cleanup:', error);
    }

    console.log('Deals cleanup scheduler initialized');
  });
};

module.exports = { scheduleCartCleanUp, scheduleExpiredDealsCleanUp };
