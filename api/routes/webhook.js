const express = require('express');
const router = express.Router();
const { createWebhook } = require('../controllers/orderController');

router.post('/stripe', express.raw({ type: 'application/json' }), createWebhook);

module.exports = router;
