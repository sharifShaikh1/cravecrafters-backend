const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/me', auth, async (req, res) => {
  try {
    console.log('GET /api/users/me for user:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in GET /api/users/me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { address } = req.body;
    console.log('PUT /api/users/me:', { userId: req.user.id, address });

    if (!address || !address.street || address.street.trim() === '') {
      return res.status(400).json({ message: 'Street address is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.address = {
      street: address.street.trim(),
      city: address.city?.trim() || '',
      state: address.state?.trim() || '',
      zip: address.zip?.trim() || '',
      country: address.country?.trim() || '',
    };

    await user.save();
    console.log('User updated:', user);
    res.json({
      email: user.email,
      address: user.address,
    });
  } catch (err) {
    console.error('Error in PUT /api/users/me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;