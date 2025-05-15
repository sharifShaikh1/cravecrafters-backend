const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

console.log('Loading cartRoutes.js...');

// Get Cart
router.get('/api/cart', auth, async (req, res) => {
  console.log('GET /api/cart request received for user:', req.user?.id);
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.productId', 'name price stock image');
    console.log('Raw populated cart data:', cart ? JSON.stringify(cart.toObject(), null, 2) : 'No cart');
    if (!cart) {
      console.log('No cart found, creating new cart for user:', req.user.id);
      const newCart = new Cart({ user: req.user.id, items: [] });
      await newCart.save();
      console.log('New cart created:', JSON.stringify(newCart.toObject(), null, 2));
      return res.json(newCart);
    }
    console.log('Cart fetched successfully:', JSON.stringify(cart.toObject(), null, 2));
    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add to Cart (POST)
router.post('/api/cart', auth, async (req, res) => {
  console.log('POST /api/cart request received:', req.body);
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) {
      console.log('Invalid input:', { productId, quantity });
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      console.log('Insufficient stock for product:', productId, 'Stock:', product.stock);
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('No cart found, creating new cart for user:', req.user.id);
      cart = new Cart({ user: req.user.id, items: [] });
    }
    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      if (cart.items[itemIndex].quantity > product.stock) {
        console.log('Quantity exceeds stock limit:', productId);
        return res.status(400).json({ message: 'Total quantity exceeds stock' });
      }
    } else {
      cart.items.push({ productId, quantity });
    }
    await cart.save();
    console.log('Cart updated successfully (POST):', JSON.stringify(cart.toObject(), null, 2));
    res.json(cart);
  } catch (err) {
    console.error('Error adding to cart:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Cart Quantity (PUT)
router.put('/api/cart/update', auth, async (req, res) => {
  console.log('PUT /api/cart/update request received:', req.body);
  try {
    const { productId, quantity } = req.body;
    console.log('Received productId:', productId, 'type:', typeof productId, 'quantity:', quantity);
    if (!productId || typeof quantity !== 'number' || quantity < 0) {
      console.log('Invalid input for update:', { productId, quantity });
      return res.status(400).json({ message: 'Invalid product ID or quantity', details: { productId, quantity } });
    }
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found for update:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }
    if (quantity > product.stock) {
      console.log('Quantity exceeds stock for product:', productId, 'Stock:', product.stock);
      return res.status(400).json({ message: 'Quantity exceeds stock' });
    }
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('Cart not found for user:', req.user.id);
      return res.status(404).json({ message: 'Cart not found' });
    }
    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex > -1) {
      if (quantity === 0) cart.items.splice(itemIndex, 1);
      else cart.items[itemIndex].quantity = quantity;
    } else if (quantity > 0) {
      cart.items.push({ productId, quantity });
    }
    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.productId', 'name price stock image');
    console.log('Cart updated successfully (PUT):', JSON.stringify(updatedCart.toObject(), null, 2));
    res.json(updatedCart);
  } catch (err) {
    console.error('Error updating cart:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Clear Cart (DELETE)
router.delete('/api/cart', auth, async (req, res) => {
  console.log('DELETE /api/cart request received for user:', req.user.id);
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('Cart not found for user:', req.user.id);
      return res.status(404).json({ message: 'Cart not found' });
    }
    cart.items = [];
    await cart.save();
    console.log('Cart cleared successfully for user:', req.user.id);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;