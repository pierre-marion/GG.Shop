// Test de l'API panier avec un token
const jwt = require('jsonwebtoken');

// Générer un token pour l'utilisateur 2 (AirZoma)
const token = jwt.sign(
  { id: 2, email: 'nathancurassier@gmail.com', role: 'connecté', username: 'AirZoma' },
  process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_12345',
  { expiresIn: '24h' }
);

console.log('🔑 Token JWT généré:');
console.log(token);
console.log('\n📝 Pour tester dans le navigateur, utilisez ce token dans localStorage:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\n🧪 Ou testez avec curl:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/products/cart`);

process.exit(0);
