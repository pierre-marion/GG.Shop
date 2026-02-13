// Test de la route panier
const db = require('./config/database');

async function testCart() {
  try {
    console.log('🔍 Test de la base de données...\n');
    
    // Vérifier les utilisateurs
    const [users] = await db.query('SELECT id, username, email FROM users LIMIT 5');
    console.log('👥 Utilisateurs:', users);
    
    // Vérifier le panier
    const [cartItems] = await db.query(`
      SELECT 
        ci.*,
        p.name,
        p.price,
        p.image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LIMIT 10
    `);
    console.log('\n🛒 Articles dans les paniers:', cartItems);
    
    if (cartItems.length === 0) {
      console.log('\n⚠️ PROBLÈME: Aucun article dans les paniers!');
    } else {
      console.log('\n✅ Il y a', cartItems.length, 'article(s) dans les paniers');
    }
    
    // Vérifier les produits
    const [products] = await db.query('SELECT id, name, price FROM products LIMIT 5');
    console.log('\n📦 Produits disponibles:', products);
    
    // Vérifier le stock
    const [stock] = await db.query('SELECT * FROM product_stock LIMIT 10');
    console.log('\n📊 Stock disponible:', stock);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testCart();
