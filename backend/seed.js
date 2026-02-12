const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('ℹ️  Un admin existe déjà');
      process.exit(0);
    }

    // Créer un utilisateur admin par défaut
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      email: 'admin@ggshop.com',
      password: hashedPassword,
      username: 'Admin',
      role: 'admin'
    });

    await admin.save();
    
    console.log('✅ Admin créé avec succès!');
    console.log('📧 Email: admin@ggshop.com');
    console.log('🔑 Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

seedAdmin();
