const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes et middleware
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const { authenticateToken, requireRole } = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GG.Shop API is running' });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des produits et du panier
app.use('/api/products', productsRoutes);

// Route pour les produits (ancienne - à garder pour compatibilité)
app.get('/api/products-legacy', authenticateToken, (req, res) => {
  const products = [
    { id: 1, name: 'Prediction Pack Premium', price: 49.99, category: 'esports' },
    { id: 2, name: 'Analyse Match CS2', price: 29.99, category: 'csgo' },
    { id: 3, name: 'Pack LoL Championship', price: 79.99, category: 'lol' }
  ];

  res.json({
    products,
    userRole: req.user.role,
    canPurchase: req.user.role === 'connecté' || req.user.role === 'admin'
  });
});

// Route d'achat (seulement pour les utilisateurs connectés et admin)
app.post('/api/purchase', authenticateToken, requireRole('connecté', 'admin'), (req, res) => {
  const { productId } = req.body;
  
  res.json({
    success: true,
    message: 'Achat réussi',
    productId,
    user: req.user.username,
    role: req.user.role
  });
});

// Route admin seulement
app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({
    message: 'Liste des utilisateurs (route admin)',
    users: [
      { id: 1, username: 'Admin', role: 'admin' }
    ]
  });
});

// Toutes les autres routes renvoient index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
