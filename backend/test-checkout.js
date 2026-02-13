// Test de la commande et de la décrémentation du stock
const db = require('./config/database');

async function testCheckout() {
  const connection = await db.getConnection();
  
  try {
    console.log('🧪 Test de la logique de checkout...\n');
    
    const userId = 2; // AirZoma
    
    // Vérifier le stock AVANT
    console.log('📊 Stock AVANT la commande:');
    const [stockBefore] = await connection.query(`
      SELECT product_id, color_name, size, quantity 
      FROM product_stock 
      WHERE product_id = 1
    `);
    console.table(stockBefore);
    
    // Vérifier le panier
    console.log('\n🛒 Articles dans le panier:');
    const [cartItems] = await connection.query(`
      SELECT ci.*, p.name, p.price, ps.quantity as available_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_stock ps ON ps.product_id = ci.product_id 
        AND ps.color_name = ci.color_name 
        AND ps.size = ci.size
      WHERE ci.user_id = ?
    `, [userId]);
    console.table(cartItems);
    
    if (cartItems.length === 0) {
      console.log('⚠️ Le panier est vide, rien à commander');
      return;
    }
    
    // Simuler le checkout
    console.log('\n💳 Simulation du checkout...');
    
    await connection.beginTransaction();
    
    // Calculer le total
    const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    console.log(`💰 Total: ${totalAmount.toFixed(2)}€`);
    
    // Créer la commande
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount, 'completed']
    );
    console.log(`✅ Commande créée: ID ${orderResult.insertId}`);
    
    // Ajouter les articles et décrémenter le stock
    for (const item of cartItems) {
      console.log(`\n  📦 Traitement: ${item.name} - ${item.color_name} - ${item.size}`);
      console.log(`     Quantité commandée: ${item.quantity}`);
      console.log(`     Stock disponible: ${item.available_stock}`);
      
      // Insérer dans order_items
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, color_name, size, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderResult.insertId, item.product_id, item.name, item.color_name, item.size, item.quantity, item.price, item.price * item.quantity]
      );
      
      // Décrémenter le stock
      const [updateResult] = await connection.query(
        'UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ? AND color_name = ? AND size = ?',
        [item.quantity, item.product_id, item.color_name, item.size]
      );
      console.log(`     ✅ Stock décrémenté (affectedRows: ${updateResult.affectedRows})`);
    }
    
    // Vider le panier
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    console.log('\n🗑️ Panier vidé');
    
    await connection.commit();
    console.log('✅ Transaction validée!');
    
    // Vérifier le stock APRÈS
    console.log('\n📊 Stock APRÈS la commande:');
    const [stockAfter] = await connection.query(`
      SELECT product_id, color_name, size, quantity 
      FROM product_stock 
      WHERE product_id = 1
    `);
    console.table(stockAfter);
    
    console.log('\n✅ Test terminé avec succès!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

testCheckout();
