const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    images:[{
      url:{ type: String, required: true},
      cloudinary_id:{type: String, required: true},
    }],
    image: {
      type: String,
      required:true,
    },
  }],
  address: {
    street: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
    contactNo: { type: String }, 
  },
  status: { 
    type: String, 
    enum: ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'cancelled'], 
    default: 'Order Placed' 
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);