const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/admin/orders', [auth, admin], async (req, res) => {
  try {
    console.log('[AdminOrder Route] GET /admin/orders hit');
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.productId', 'name price image description')
      .sort({ createdAt: -1 });

  
    const populatedOrders = orders.map(order => {
      const transformedOrder = order.toObject();
      transformedOrder.items = transformedOrder.items.map(item => {
        console.log('Item before mapping:', item); 
        return {
          ...item, 
          product: item.productId
            ? {
                name: item.productId.name || 'Unknown',
                price: item.productId.price || item.price, 
                image: item.productId.image || item.image,
                description: item.productId.description || ''
              }
            : {
                name: 'Unknown',
                price: item.price,
                image: item.image,
                description: ''
              }
        };
      });
      return transformedOrder;
    });

    console.log('[AdminOrder Route] Orders fetched:', populatedOrders);
    res.json(populatedOrders);
  } catch (err) {
    console.error('[AdminOrder Route] Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/orders/:id', [auth, admin], async (req, res) => {
  try {
    console.log('[AdminOrder Route] PUT /admin/orders/:id hit for ID:', req.params.id, 'with body:', req.body);
    const { status } = req.body;
    if (!['Order Placed', 'Processing', 'Shipped', 'Delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    console.log('[AdminOrder Route] Order updated:', order);
    res.json(order);
  } catch (err) {
    console.error('[AdminOrder Route] Error updating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;