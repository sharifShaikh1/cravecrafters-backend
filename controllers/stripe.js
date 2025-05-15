{/*const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'missing_key');
const Order = require('../models/Order');

exports.createCheckoutSession = async ({ userId, items, address, productId }) => {
  console.log('Creating checkout session:', { userId, productId, items });

  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'missing_key') {
      throw new Error('STRIPE_SECRET_KEY not defined in environment');
    }

    const line_items = items.map((item) => {
      const product = item.productId;
      if (!product || !product._id || !product.name || !product.price) {
        throw new Error('Invalid product data');
      }

      let image = product.image;
      if (image && !image.startsWith('http')) {
        image = `http://localhost:5000${image.startsWith('/') ? '' : '/'}${image}`;
      }
      if (!image || !/^https?:\/\//.test(image)) {
        image = undefined;
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: image ? [image] : undefined,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:3000/orders?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cart',
      metadata: { userId, productId },
      shipping_address_collection: { allowed_countries: ['US', 'IN'] },
      billing_address_collection: 'required',
    });

    const order = new Order({
      userId,
      items: items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      total: items.reduce((sum, item) => sum + item.quantity * item.productId.price, 0),
      address,
      paymentStatus: 'pending',
    });

    await order.save();
    console.log('Order saved:', order);

    return { url: session.url, orderId: order._id };
  } catch (err) {
    console.error('Error in createCheckoutSession:', err.message, err.stack);
    throw err;
  }
};
*/}