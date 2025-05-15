const express = require('express');
const router = express.Router();
const Product = require('../models/Product');


router.get('/products/:id', async (req, res) => {
  try {
    console.log('[Product Route] GET /products/:id hit for ID:', req.params.id);
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('[Product Route] Product fetched:', product);
    res.json(product);
  } catch (err) {
    console.error('[Product Route] Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;