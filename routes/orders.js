const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/orders for user:', req.user.id, 'Time:', new Date().toISOString());
    const orders = await Order.find({ user: req.user.id })
      .populate('items.productId', 'name price image description') // Changed from items.product to items.productId
      .sort({ createdAt: -1 });
    console.log('Orders fetched:', orders);
    res.json(orders);
  } catch (err) {
    console.error('Error in GET /api/orders:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/cancel/:orderId', auth, async (req, res) => {
  try {
    console.log('PUT /cancel/:orderId for user:', req.user.id, 'Order ID:', req.params.orderId);
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Current order status:', order.status);
    if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    await order.save();
    console.log('Order updated successfully, new status:', order.status);
    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error('Error cancelling order:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
    });
    res.status(500).json({ message: 'Error cancelling order', error: err.message });
  }
});

module.exports = router;