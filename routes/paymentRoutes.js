const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product'); // Add Product model

router.post('/create-checkout-session', auth, async (req, res) => {
  console.log('Creating session for user:', req.user.id, 'Time:', new Date().toISOString());
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.productId', 'name price stock images');
    if (!cart || !cart.items.length) {
      console.log('Cart empty:', req.user.id);
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const lineItems = cart.items.map(item => {
      if (!item.productId?.price || !item.productId?.name) throw new Error('Invalid product');
      const amount = Math.max(Math.round(item.productId.price * 100), 5000);
      console.log(`Product: ${item.productId.name}, Price: ${item.productId.price}, Adjusted: ${amount}`);
      return {
        price_data: { currency: 'inr', product_data: { name: item.productId.name }, unit_amount: amount },
        quantity: item.quantity,
      };
    });

    if (!lineItems.length) return res.status(400).json({ message: 'No items' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://cravecrafters-frontend.onrender.com/';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/orders?session_id={CHECKOUT_SESSION_ID}`, // Key line
      cancel_url: `${frontendUrl}/cart`,
      metadata: { user_id: req.user.id },
    });

    console.log('Session created, URL:', session.url, 'ID:', session.id);
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Session error:', err.message, err.stack);
    res.status(500).json({ message: 'Session failed', error: err.message });
  }
});

router.get('/success', auth, async (req, res) => {
  console.log('SUCCESS HIT for session_id:', req.query.session_id, 'User:', req.user.id, 'Time:', new Date().toISOString());
  try {
    const { session_id } = req.query;
    if (!session_id) {
      console.log('No session_id');
      return res.status(400).json({ message: 'Session ID missing' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Stripe session:', session.payment_status, 'Metadata:', session.metadata);
    const userId = session.metadata.user_id;
    if (!userId || userId !== req.user.id) {
      console.log('User mismatch:', { userId, reqUser: req.user.id });
      return res.status(400).json({ message: 'User mismatch' });
    }

    if (session.payment_status === 'paid') {
      console.log('Payment confirmed:', userId);
      const cart = await Cart.findOne({ user: userId }).populate('items.productId');
      if (!cart || !cart.items.length) {
        console.log('Cart issue:', { cart, userId });
        return res.status(400).json({ message: 'Cart empty' });
      }

      const user = await User.findById(userId);
      if (!user?.address?.street) {
        console.log('Address issue:', { userId, address: user?.address });
        return res.status(400).json({ message: 'Update address' });
      }

      // Update stock before saving order
      const stockUpdatePromises = cart.items.map(async (item) => {
        const product = await Product.findById(item.productId._id);
        if (!product) throw new Error(`Product ${item.productId._id} not found`);
        const newStock = product.stock - item.quantity;
        if (newStock < 0) throw new Error(`Insufficient stock for ${item.productId.name}`);
        console.log(`Updating stock for ${item.productId._id}: ${product.stock} -> ${newStock}`);
        product.stock = newStock;
        await product.save();
        console.log(`Stock updated for ${item.productId._id}:`, product.stock);
      });
      await Promise.all(stockUpdatePromises);

      const order = new Order({
        user: userId,
        items: cart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price,
          image: item.productId.images?.[0]?.url || item.productId.image,
        })),
        address: user.address,
      });
      await order.save();
      console.log('Order saved:', order._id);

      cart.items = [];
      await cart.save();
      console.log('Cart cleared:', cart._id);

      res.json({ message: 'Order done', redirectUrl: `${process.env.FRONTEND_URL}/orders?success=true` });
    } else {
      console.log('Payment not paid:', session.payment_status);
      res.json({ message: 'Payment failed', redirectUrl: `${process.env.FRONTEND_URL}/cart?cancelled=true` });
    }
  } catch (err) {
    console.error('Success error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
