const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/category');
const orderRoutes = require('./routes/orders');
const adminOrder = require('./routes/adminOrder');
const paymentRoutes = require('./routes/paymentRoutes');
const productPageROutes = require('./routes/productpage')
const app = express();

console.log('Starting server...');
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended: true}))
app.use(bodyParser.json({limit : '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended:true}));

app.use(
  cors({
    origin: (origin, callback) => {
      // Normalize origins by removing trailing slashes
      const normalizeOrigin = (url) => url?.replace(/\/+$/, '');
      
      const allowedOrigins = [
        normalizeOrigin('http://localhost:3000'), // For local development
        normalizeOrigin('https://cravecrafters-frontend.onrender.com'), // For production
        normalizeOrigin(process.env.FRONTEND_URL), // From Render env variable
      ].filter(Boolean); // Remove undefined/null values

      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization', 'x-auth-token'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);


app.options('*', (req, res) => {
  console.log('Handling OPTIONS:', req.url);
  res.status(204).end();
});


app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

app.use(express.json());


app.use('/', require('./routes/auth'));
app.use('/api/products', productRoutes);
app.use('/', require('./routes/cart')); 
app.use('/api', categoryRoutes);
app.use('/api',productPageROutes);
app.use('/api/payment', paymentRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api',adminOrder);


app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});


// MongoDB
console.log('Connecting to MongoDB:', process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected to mydb'))
  .catch((err) => console.error('MongoDB failed:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
