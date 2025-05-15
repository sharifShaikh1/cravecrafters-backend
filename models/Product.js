const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{
    url: { type: String, required: true },
    cloudinary_id: { type: String, required: true },
  }],
  image: { type: String, required: true },
  cloudinary_id: { type: String, default: null },
}, { timestamps: true });


productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0].url;
  } else if (!this.image) {
    this.image = '/images/placeholder.png'; 
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);