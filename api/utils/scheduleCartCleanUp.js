const cron = require('node-cron');
const { cleanupExpiredGuestCarts } = require('../controllers/cartController');

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

module.exports = scheduleCartCleanUp;
