const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ==================== ROUTES SPÉCIFIQUES (AVANT /:id) ====================

// Récupérer tous les produits avec informations de stock
router.get('/', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.*,
        CASE 
          WHEN SUM(ps.quantity) > 0 THEN false
          ELSE true 
        END as out_of_stock
      FROM products p
      LEFT JOIN product_stock ps ON p.id = ps.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES PANIER ====================

// Récupérer le panier de l'utilisateur
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🛒 GET /cart pour user_id:', userId);
    
    const [cartItems] = await db.query(`
      SELECT 
        ci.*,
        p.name,
        p.price,
        p.image,
        ps.quantity as available_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_stock ps ON ps.product_id = ci.product_id 
        AND ps.color_name = ci.color_name 
        AND ps.size = ci.size
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);
    
    console.log(`✅ Panier récupéré: ${cartItems.length} article(s)`);
    
    // Vérifier si les articles ont encore du stock disponible
    const cartWithAvailability = cartItems.map(item => ({
      ...item,
      stock_available: item.available_stock >= item.quantity,
      max_quantity: item.available_stock
    }));
    
    res.json({ success: true, cart: cartWithAvailability });
  } catch (error) {
    console.error('❌ Erreur récupération panier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Vérifier la disponibilité du stock
router.post('/check-stock', async (req, res) => {
  try {
    const { productId, colorName, size, quantity } = req.body;
    
    const [stock] = await db.query(
      'SELECT quantity FROM product_stock WHERE product_id = ? AND color_name = ? AND size = ?',
      [productId, colorName, size]
    );
    
    if (stock.length === 0) {
      return res.json({ available: false, currentStock: 0 });
    }
    
    const currentStock = stock[0].quantity;
    res.json({ 
      available: currentStock >= quantity,
      currentStock 
    });
  } catch (error) {
    console.error('Erreur vérification stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES PRODUITS ====================

// Récupérer un produit avec ses détails (images, couleurs, stock)
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Récupérer le produit
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }
    
    const product = products[0];
    
    // Récupérer les images
    const [images] = await db.query(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );
    product.images = images.map(img => img.image_url);
    
    // Récupérer les couleurs
    const [colors] = await db.query(
      'SELECT color_name, color_class FROM product_colors WHERE product_id = ?',
      [productId]
    );
    product.colors = colors.map(c => ({ name: c.color_name, value: c.color_class }));
    
    // Récupérer le stock par couleur et taille
    const [stock] = await db.query(
      'SELECT color_name, size, quantity FROM product_stock WHERE product_id = ?',
      [productId]
    );
    
    // Organiser le stock par couleur
    product.stock = {};
    stock.forEach(s => {
      if (!product.stock[s.color_name]) {
        product.stock[s.color_name] = {};
      }
      product.stock[s.color_name][s.size] = s.quantity;
    });
    
    // Vérifier si le produit est complètement en rupture de stock
    const totalStock = stock.reduce((sum, s) => sum + s.quantity, 0);
    product.out_of_stock = totalStock === 0;
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Ajouter au panier (avec vérification de stock)
router.post('/cart/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, colorName, size, quantity } = req.body;
    
    // Vérifier le stock disponible
    const [stock] = await db.query(
      'SELECT quantity FROM product_stock WHERE product_id = ? AND color_name = ? AND size = ?',
      [productId, colorName, size]
    );
    
    if (stock.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock non disponible',
        availableStock: 0
      });
    }
    
    if (stock[0].quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Stock insuffisant. Seulement ${stock[0].quantity} disponible(s)`,
        availableStock: stock[0].quantity
      });
    }
    
    // Vérifier si l'article existe déjà dans le panier
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND color_name = ? AND size = ?',
      [userId, productId, colorName, size]
    );
    
    if (existing.length > 0) {
      // Mettre à jour la quantité
      const newQuantity = existing[0].quantity + quantity;
      
      if (newQuantity > stock[0].quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuffisant. Vous avez déjà ${existing[0].quantity} article(s) dans votre panier. Maximum disponible: ${stock[0].quantity}`,
          availableStock: stock[0].quantity,
          currentInCart: existing[0].quantity
        });
      }
      
      await db.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existing[0].id]
      );
    } else {
      // Ajouter au panier
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, color_name, size, quantity) VALUES (?, ?, ?, ?, ?)',
        [userId, productId, colorName, size, quantity]
      );
    }
    
    res.json({ success: true, message: 'Article ajouté au panier' });
  } catch (error) {
    console.error('Erreur ajout panier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour la quantité dans le panier
router.put('/cart/:cartItemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.cartItemId;
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantité invalide' });
    }
    
    // Récupérer l'article du panier
    const [cartItem] = await db.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    );
    
    if (cartItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé dans le panier' });
    }
    
    // Vérifier le stock
    const [stock] = await db.query(
      'SELECT quantity FROM product_stock WHERE product_id = ? AND color_name = ? AND size = ?',
      [cartItem[0].product_id, cartItem[0].color_name, cartItem[0].size]
    );
    
    if (stock.length === 0 || stock[0].quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock insuffisant',
        availableStock: stock.length > 0 ? stock[0].quantity : 0
      });
    }
    
    // Mettre à jour
    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, cartItemId]
    );
    
    res.json({ success: true, message: 'Quantité mise à jour' });
  } catch (error) {
    console.error('Erreur mise à jour panier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer du panier
router.delete('/cart/:cartItemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.cartItemId;
    
    await db.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    );
    
    res.json({ success: true, message: 'Article supprimé du panier' });
  } catch (error) {
    console.error('Erreur suppression panier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes admin - Gestion du stock
router.post('/stock/update', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { productId, colorName, size, quantity } = req.body;
    
    // Insérer ou mettre à jour le stock
    await db.query(`
      INSERT INTO product_stock (product_id, color_name, size, quantity)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
    `, [productId, colorName, size, quantity]);
    
    res.json({ success: true, message: 'Stock mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes admin - Ajouter ou retirer du stock
router.post('/stock/adjust', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { productId, colorName, size, adjustment } = req.body;
    
    // Récupérer le stock actuel
    const [currentStock] = await db.query(
      'SELECT quantity FROM product_stock WHERE product_id = ? AND color_name = ? AND size = ?',
      [productId, colorName, size]
    );
    
    if (currentStock.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    const newQuantity = Math.max(0, currentStock[0].quantity + adjustment);
    
    await db.query(
      'UPDATE product_stock SET quantity = ? WHERE product_id = ? AND color_name = ? AND size = ?',
      [newQuantity, productId, colorName, size]
    );
    
    res.json({ 
      success: true, 
      message: adjustment > 0 ? 'Stock ajouté' : 'Stock retiré',
      newQuantity 
    });
  } catch (error) {
    console.error('Erreur ajustement stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route de commande - Finaliser l'achat et décrémenter le stock
router.post('/checkout', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    
    // Récupérer tous les articles du panier
    const [cartItems] = await connection.query(`
      SELECT 
        ci.*,
        p.name,
        p.price,
        ps.quantity as available_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_stock ps ON ps.product_id = ci.product_id 
        AND ps.color_name = ci.color_name 
        AND ps.size = ci.size
      WHERE ci.user_id = ?
    `, [userId]);
    
    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Votre panier est vide' 
      });
    }
    
    // Vérifier que tout le stock est disponible
    const stockIssues = [];
    for (const item of cartItems) {
      if (!item.available_stock || item.available_stock < item.quantity) {
        stockIssues.push({
          product: item.name,
          color: item.color_name,
          size: item.size,
          requested: item.quantity,
          available: item.available_stock || 0
        });
      }
    }
    
    if (stockIssues.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Stock insuffisant pour certains articles',
        stockIssues 
      });
    }
    
    // Calculer le total de la commande
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Créer la commande
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount, 'completed']
    );
    
    const orderId = orderResult.insertId;
    
    // Ajouter les articles à order_items et décrémenter le stock
    for (const item of cartItems) {
      // Insérer dans order_items
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, color_name, size, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.color_name, item.size, item.quantity, item.price, item.price * item.quantity]
      );
      
      // Décrémenter le stock
      await connection.query(
        'UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ? AND color_name = ? AND size = ?',
        [item.quantity, item.product_id, item.color_name, item.size]
      );
    }
    
    // Vider le panier de l'utilisateur
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Commande validée avec succès',
      orderId: orderId,
      orderSummary: {
        items: cartItems.length,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: totalAmount.toFixed(2)
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur checkout:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la commande' });
  } finally {
    connection.release();
  }
});

// Récupérer l'historique des commandes de l'utilisateur
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) as items_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les détails d'une commande
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    
    // Récupérer la commande
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    const order = orders[0];
    
    // Récupérer les articles de la commande
    const [items] = await db.query(`
      SELECT 
        oi.*,
        p.image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `, [orderId]);
    
    order.items = items;
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Erreur récupération détails commande:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Admin - Récupérer toutes les commandes
router.get('/admin/orders', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.user_id,
        u.username,
        u.email,
        o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) as items_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Erreur récupération commandes admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Routes admin - Créer un produit complet
router.post('/create', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { name, category, price, old_price, discount, description, rating, image, images, colors, sizes } = req.body;
    
    // Insérer le produit
    const [result] = await connection.query(`
      INSERT INTO products (name, category, price, old_price, discount, description, rating, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, category, price, old_price, discount, description, rating || 5, image]);
    
    const productId = result.insertId;
    
    // Insérer les images supplémentaires
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await connection.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
          [productId, images[i], i]
        );
      }
    }
    
    // Insérer les couleurs
    if (colors && colors.length > 0) {
      for (const color of colors) {
        await connection.query(
          'INSERT INTO product_colors (product_id, color_name, color_class) VALUES (?, ?, ?)',
          [productId, color.name, color.class]
        );
      }
    }
    
    // Insérer le stock pour chaque combinaison couleur/taille
    if (colors && colors.length > 0 && sizes && sizes.length > 0) {
      for (const color of colors) {
        for (const size of sizes) {
          await connection.query(
            'INSERT INTO product_stock (product_id, color_name, size, quantity) VALUES (?, ?, ?, ?)',
            [productId, color.name, size.name, size.stock]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Produit créé', productId });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur création produit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// Routes admin - Mettre à jour un produit
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const productId = req.params.id;
    const { name, category, price, old_price, discount, description, rating, image, images, colors, sizes } = req.body;
    
    // Mettre à jour le produit
    await connection.query(`
      UPDATE products 
      SET name = ?, category = ?, price = ?, old_price = ?, discount = ?, description = ?, rating = ?, image = ?
      WHERE id = ?
    `, [name, category, price, old_price, discount, description, rating || 5, image, productId]);
    
    // Supprimer et réinsérer les images
    await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await connection.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
          [productId, images[i], i]
        );
      }
    }
    
    // Supprimer et réinsérer les couleurs
    await connection.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);
    if (colors && colors.length > 0) {
      for (const color of colors) {
        await connection.query(
          'INSERT INTO product_colors (product_id, color_name, color_class) VALUES (?, ?, ?)',
          [productId, color.name, color.class]
        );
      }
    }
    
    // Mettre à jour le stock (garder les quantités existantes pour les combinaisons qui existent)
    // Supprimer les anciennes combinaisons qui n'existent plus
    await connection.query('DELETE FROM product_stock WHERE product_id = ?', [productId]);
    
    // Réinsérer avec les nouvelles tailles
    if (colors && colors.length > 0 && sizes && sizes.length > 0) {
      for (const color of colors) {
        for (const size of sizes) {
          await connection.query(
            'INSERT INTO product_stock (product_id, color_name, size, quantity) VALUES (?, ?, ?, ?)',
            [productId, color.name, size.name, size.stock]
          );
        }
      }
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Produit mis à jour' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// Routes admin - Supprimer un produit
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const productId = req.params.id;
    
    // Supprimer les entrées liées (cascade)
    await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await connection.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);
    await connection.query('DELETE FROM product_stock WHERE product_id = ?', [productId]);
    await connection.query('DELETE FROM cart_items WHERE product_id = ?', [productId]);
    
    // Supprimer le produit
    await connection.query('DELETE FROM products WHERE id = ?', [productId]);
    
    await connection.commit();
    
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

module.exports = router;
