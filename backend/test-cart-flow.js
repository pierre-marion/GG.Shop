// Test complet du flux panier
const jwt = require('jsonwebtoken');
const db = require('./config/database');

async function testFullCartFlow() {
  try {
    console.log('🧪 Test complet du flux panier\n');
    
    const userId = 2; // AirZoma
    
    // 1. Vérifier que le panier est vide
    console.log('📋 Étape 1: Vérifier le panier initial');
    let [cartItems] = await db.query('SELECT * FROM cart_items WHERE user_id = ?', [userId]);
    console.log(`   Panier: ${cartItems.length} article(s)`);
    console.table(cartItems);
    
    // 2. Vérifier les produits disponibles
    console.log('\n📦 Étape 2: Vérifier les produits disponibles');
    const [products] = await db.query('SELECT id, name, price FROM products');
    console.table(products);
    
    // 3. Vérifier le stock disponible
    console.log('\n📊 Étape 3: Vérifier le stock');
    const [stock] = await db.query('SELECT * FROM product_stock WHERE quantity > 0');
    console.table(stock);
    
    // 4. Simuler un ajout au panier
    if (stock.length > 0) {
      const item = stock[0];
      console.log(`\n➕ Étape 4: Simuler ajout au panier`);
      console.log(`   Produit: ${item.product_id}, Couleur: ${item.color_name}, Taille: ${item.size}`);
      
      await db.query(`
        INSERT INTO cart_items (user_id, product_id, color_name, size, quantity)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `, [userId, item.product_id, item.color_name, item.size, 1]);
      
      console.log('   ✅ Article ajouté au panier');
    }
    
    // 5. Vérifier le panier après ajout
    console.log('\n📋 Étape 5: Vérifier le panier après ajout');
    [cartItems] = await db.query(`
      SELECT ci.*, p.name, p.price, p.image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [userId]);
    console.log(`   Panier: ${cartItems.length} article(s)`);
    console.table(cartItems);
    
    // 6. Générer un token pour tester l'API
    console.log('\n🔑 Étape 6: Token pour tester l\'API');
    const token = jwt.sign(
      { id: userId, email: 'nathancurassier@gmail.com', role: 'connecté', username: 'AirZoma' },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_12345',
      { expiresIn: '24h' }
    );
    console.log('\n📝 Pour tester dans le navigateur:');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log('\n🧪 Ou testez l\'API:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/products/cart`);
    
    console.log('\n✅ Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

testFullCartFlow();
