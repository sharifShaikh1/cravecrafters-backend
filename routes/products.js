const express = require('express');
const router = express.Router();
const { cloudinary } = require('../config/cloudinary');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const mongoose = require('mongoose');

router.post('/', [auth, admin], async (req, res) => {
  try {
    console.log('[Products Route] Creating product with body:', req.body);
    console.log('[Products Route] User from token:', req.user);

    const { name, price, description, stock, category, images } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }
    const parsedStock = Number(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Valid stock quantity is required' });
    }
    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    let imageUrls = [];
    let cloudinaryIds = [];
    if (images && Array.isArray(images)) {
      for (let img of images) {
        if (img && typeof img === 'string' && img.startsWith('data:image/')) {
          console.log('[Products Route] Uploading image to Cloudinary:', img.substring(0, 30));
          const uploadResponse = await cloudinary.uploader.upload(img, {
            folder: 'ecommerce',
            timeout: 60000,
          });
          imageUrls.push(uploadResponse.secure_url);
          cloudinaryIds.push(uploadResponse.public_id);
          console.log('[Products Route] Image uploaded successfully:', uploadResponse.secure_url);
        } else {
          return res.status(400).json({ message: 'Invalid image format in array' });
        }
      }
    } else {
      console.log('[Products Route] No images provided or not an array');
      return res.status(400).json({ message: 'At least one image is required as an array' });
    }

    const product = new Product({
      name: name.trim(),
      price: parsedPrice,
      description: description.trim(),
      stock: parsedStock,
      category,
      images: imageUrls.map((url, index) => ({ url, cloudinary_id: cloudinaryIds[index] })),
      image: imageUrls[0] || '/images/placeholder.png',
      cloudinary_id: cloudinaryIds[0] || null,
    });

    await product.save();
    console.log('[Products Route] Product created:', product);
    res.status(201).json(product);
  } catch (err) {
    console.error('[Products Route] Error creating product:', {
      name: err.name,
      message: err.message || 'No message provided',
      stack: err.stack,
    });
    res.status(500).json({ message: 'Server error', error: err.message || 'Unknown error' });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('[Products Route] Fetching all products');
    const products = await Product.find().populate('category', 'name');
    console.log('[Products Route] Products fetched:', products);
    res.status(200).json(products);
  } catch (err) {
    console.error('[Products Route] Error fetching products:', {
      name: err.name,
      message: err.message || 'No message provided',
      stack: err.stack,
    });
    res.status(500).json({ message: 'Server error', error: err.message || 'Unknown error' });
  }
});

router.put('/:id', [auth, admin], async (req, res) => {
  try {
    console.log('[Products Route] Updating product with ID:', req.params.id, 'with body:', req.body);
    const { name, price, description, stock, category, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }
    const parsedStock = Number(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Valid stock quantity is required' });
    }
    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    // Handle image updates
    let newImageUrls = [];
    let newCloudinaryIds = [];
    if (images && Array.isArray(images)) {
      for (let img of images) {
        if (img && typeof img === 'string' && img.startsWith('data:image/')) {
          console.log('[Products Route] Uploading new image to Cloudinary:', img.substring(0, 30));
          const uploadResponse = await cloudinary.uploader.upload(img, {
            folder: 'ecommerce',
            timeout: 60000,
          });
          newImageUrls.push(uploadResponse.secure_url);
          newCloudinaryIds.push(uploadResponse.public_id);
          console.log('[Products Route] New image uploaded successfully:', uploadResponse.secure_url);
        }
      }
    }

    // Delete old images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (let image of product.images) {
        if (image.cloudinary_id) {
          console.log('[Products Route] Deleting old image from Cloudinary:', image.cloudinary_id);
          await cloudinary.uploader.destroy(image.cloudinary_id);
        }
      }
    } else if (product.cloudinary_id) {
      console.log('[Products Route] Deleting old image from Cloudinary:', product.cloudinary_id);
      await cloudinary.uploader.destroy(product.cloudinary_id);
    }

    // Update product
    product.name = name.trim();
    product.price = parsedPrice;
    product.description = description.trim();
    product.stock = parsedStock;
    product.category = category;
    product.images = newImageUrls.length > 0 ? newImageUrls.map((url, index) => ({ url, cloudinary_id: newCloudinaryIds[index] })) : product.images;
    product.image = newImageUrls[0] || product.image;
    product.cloudinary_id = newCloudinaryIds[0] || product.cloudinary_id;

    await product.save();
    console.log('[Products Route] Product updated:', product);
    res.status(200).json(product);
  } catch (err) {
    console.error('[Products Route] Error updating product:', {
      name: err.name,
      message: err.message || 'No message provided',
      stack: err.stack,
    });
    res.status(500).json({ message: 'Server error', error: err.message || 'Unknown error' });
  }
});

router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    console.log('[Products Route] Deleting product with ID:', req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      for (let image of product.images) {
        if (image.cloudinary_id) {
          console.log('[Products Route] Deleting image from Cloudinary:', image.cloudinary_id);
          await cloudinary.uploader.destroy(image.cloudinary_id);
        } else {
          console.warn('[Products Route] No cloudinary_id found for image:', image);
        }
      }
    } else if (product.cloudinary_id) {
      console.log('[Products Route] Deleting image from Cloudinary:', product.cloudinary_id);
      await cloudinary.uploader.destroy(product.cloudinary_id);
    } else {
      console.warn('[Products Route] No images or cloudinary_id found for deletion');
    }

    await product.deleteOne();
    console.log('[Products Route] Product deleted:', req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('[Products Route] Error deleting product:', {
      name: err.name,
      message: err.message || 'No message provided',
      stack: err.stack,
    });
    res.status(500).json({ message: 'Server error', error: err.message || 'Unknown error' });
  }
});

module.exports = router;