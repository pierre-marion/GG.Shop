// Réinitialiser le stock et ajouter des produits de test
const db = require('./config/database');

async function resetStock() {
  try {
    console.log('🔄 Réinitialisation du stock...\n');
    
    // Remettre du stock pour les produits existants
    await db.query(`
      UPDATE product_stock 
      SET quantity = 10 
      WHERE product_id = 1 AND color_name = 'NWAAAAAR'
    `);
    
    await db.query(`
      UPDATE product_stock 
      SET quantity = 20 
      WHERE product_id = 2
    `);
    
    console.log('✅ Stock réinitialisé!');
    
    // Afficher le stock actuel
    const [stock] = await db.query('SELECT * FROM product_stock ORDER BY product_id, color_name, size');
    console.log('\n📊 Stock actuel:');
    console.table(stock);
    
    // Vider les paniers pour recommencer proprement
    await db.query('DELETE FROM cart_items');
    console.log('\n🗑️ Tous les paniers vidés');
    
    // Vider les commandes de test
    await db.query('DELETE FROM orders');
    console.log('🗑️ Commandes de test supprimées');
    
    console.log('\n✅ Base de données prête pour les tests!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetStock();
