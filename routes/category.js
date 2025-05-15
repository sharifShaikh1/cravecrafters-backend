const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/categories', [auth, admin], async (req, res) => {
  try {
    console.log('[Categories Route] POST /categories hit with body:', req.body);
    console.log('[Categories Route] User from token:', req.user);
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name: name.trim() });
    await category.save();
    console.log('[Categories Route] Category created:', category);
    res.status(201).json(category);
  } catch (err) {
    console.error('[Categories Route] Error creating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/categories', async (req, res) => { // Changed from '/' to '/categories'
  try {
    console.log('[Categories Route] GET /categories hit');
    const categories = await Category.find();
    console.log('[Categories Route] Categories fetched:', categories);
    res.json(categories);
  } catch (err) {
    console.error('[Categories Route] Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;