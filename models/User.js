const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  username: { type: String, sparse: true }, // Remove unique here, we'll handle it with partial index
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' },
    contactNo: { type: String, default: '' },
  },
});

// Partial index for username to enforce uniqueness only when username is provided
userSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { username: { $exists: true, $ne: null } } });

module.exports = mongoose.model('User', userSchema);