const db = require('./config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Début du seeding de la base de données...\n');

    // 1. Insérer des produits
    console.log('📦 Insertion des produits...');
    
    const products = [
      {
        name: 'T-shirt à Col Dégradé',
        category: 'T-shirts',
        price: 212,
        old_price: 242,
        discount: '-20%',
        rating: 4.5,
        description: 'Ce T-shirt à col dégradé combine style et confort pour un look décontracté mais élégant. Fabriqué avec des matériaux de haute qualité, il offre une respirabilité exceptionnelle et une durabilité longue durée.',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'
      },
      {
        name: 'Jean Skinny Fit',
        category: 'Jeans',
        price: 240,
        old_price: 260,
        discount: '-20%',
        rating: 3.5,
        description: 'Jean skinny fit parfait pour un look moderne. Coupe ajustée qui met en valeur votre silhouette tout en restant confortable grâce à son tissu extensible.',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'
      },
      {
        name: 'Chemise à Carreaux',
        category: 'Chemises',
        price: 180,
        old_price: null,
        discount: null,
        rating: 4.5,
        description: 'Chemise à carreaux classique pour un style décontracté-chic. Parfaite pour le bureau ou une sortie décontractée. Tissu doux et respirant pour un confort optimal.',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800'
      },
      {
        name: 'T-shirt à Manches Rayé',
        category: 'T-shirts',
        price: 130,
        old_price: 160,
        discount: '-30%',
        rating: 4.5,
        description: 'T-shirt rayé tendance avec manches longues. Design moderne et confortable, idéal pour la mi-saison. Matière douce au toucher.',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
      },
      {
        name: 'Hoodie Premium Noir',
        category: 'Sweats',
        price: 290,
        old_price: null,
        discount: null,
        rating: 5.0,
        description: 'Hoodie premium en coton ultra-confortable. Parfait pour un style streetwear décontracté. Coupe moderne et finitions de qualité.',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'
      },
      {
        name: 'Veste en Jean',
        category: 'Vestes',
        price: 350,
        old_price: 400,
        discount: '-12%',
        rating: 4.0,
        description: 'Veste en jean classique indémodable. Coupe ajustée et confortable, idéale pour toutes les saisons. Denim de haute qualité.',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'
      }
    ];

    for (const product of products) {
      const [result] = await db.query(
        `INSERT INTO products (name, category, price, old_price, discount, rating, description, image) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.name, product.category, product.price, product.old_price, product.discount, product.rating, product.description, product.image]
      );
      console.log(`✅ Produit ajouté: ${product.name} (ID: ${result.insertId})`);
    }

    // 2. Insérer les images des produits
    console.log('\n🖼️  Insertion des images...');
    
    const productImages = [
      // T-shirt à Col Dégradé (ID: 1)
      { productId: 1, images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'
      ]},
      // Jean Skinny Fit (ID: 2)
      { productId: 2, images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
        'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800',
        'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'
      ]},
      // Chemise à Carreaux (ID: 3)
      { productId: 3, images: [
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
        'https://images.unsplash.com/photo-1596755095238-043a2b4d1e57?w=800'
      ]},
      // T-shirt à Manches Rayé (ID: 4)
      { productId: 4, images: [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
        'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800'
      ]},
      // Hoodie Premium Noir (ID: 5)
      { productId: 5, images: [
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'
      ]},
      // Veste en Jean (ID: 6)
      { productId: 6, images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800'
      ]}
    ];

    for (const item of productImages) {
      for (let i = 0; i < item.images.length; i++) {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
          [item.productId, item.images[i], i]
        );
      }
    }
    console.log('✅ Images ajoutées pour tous les produits');

    // 3. Insérer les couleurs
    console.log('\n🎨 Insertion des couleurs...');
    
    const productColors = [
      // T-shirt à Col Dégradé
      { productId: 1, colors: [
        { name: 'Vert Olive', class: 'bg-green-700' },
        { name: 'Noir', class: 'bg-gray-800' },
        { name: 'Bleu Marine', class: 'bg-blue-900' }
      ]},
      // Jean Skinny Fit
      { productId: 2, colors: [
        { name: 'Bleu Denim', class: 'bg-blue-600' },
        { name: 'Noir', class: 'bg-gray-900' },
        { name: 'Gris', class: 'bg-gray-500' }
      ]},
      // Chemise à Carreaux
      { productId: 3, colors: [
        { name: 'Rouge & Noir', class: 'bg-red-700' },
        { name: 'Bleu & Blanc', class: 'bg-blue-600' },
        { name: 'Vert & Noir', class: 'bg-green-700' }
      ]},
      // T-shirt à Manches Rayé
      { productId: 4, colors: [
        { name: 'Noir & Blanc', class: 'bg-gray-800' },
        { name: 'Bleu & Blanc', class: 'bg-blue-600' },
        { name: 'Rouge & Blanc', class: 'bg-red-600' }
      ]},
      // Hoodie Premium Noir
      { productId: 5, colors: [
        { name: 'Noir', class: 'bg-gray-900' },
        { name: 'Gris Foncé', class: 'bg-gray-700' },
        { name: 'Navy', class: 'bg-blue-900' }
      ]},
      // Veste en Jean
      { productId: 6, colors: [
        { name: 'Bleu Classique', class: 'bg-blue-600' },
        { name: 'Noir Délavé', class: 'bg-gray-800' }
      ]}
    ];

    for (const item of productColors) {
      for (const color of item.colors) {
        await db.query(
          'INSERT INTO product_colors (product_id, color_name, color_class) VALUES (?, ?, ?)',
          [item.productId, color.name, color.class]
        );
      }
    }
    console.log('✅ Couleurs ajoutées pour tous les produits');

    // 4. Insérer le stock
    console.log('\n📊 Insertion du stock...');
    
    const stockData = [
      // T-shirt à Col Dégradé - Stock varié
      { productId: 1, color: 'Vert Olive', sizes: { XS: 5, S: 10, M: 15, L: 8, XL: 3, XXL: 0 }},
      { productId: 1, color: 'Noir', sizes: { XS: 2, S: 5, M: 12, L: 10, XL: 7, XXL: 4 }},
      { productId: 1, color: 'Bleu Marine', sizes: { XS: 0, S: 8, M: 0, L: 15, XL: 5, XXL: 2 }},
      
      // Jean Skinny Fit - Tailles différentes
      { productId: 2, color: 'Bleu Denim', sizes: { '28': 6, '30': 12, '32': 15, '34': 10, '36': 5, '38': 2 }},
      { productId: 2, color: 'Noir', sizes: { '28': 3, '30': 8, '32': 10, '34': 12, '36': 8, '38': 0 }},
      { productId: 2, color: 'Gris', sizes: { '28': 0, '30': 5, '32': 7, '34': 8, '36': 3, '38': 1 }},
      
      // Chemise à Carreaux - Bon stock
      { productId: 3, color: 'Rouge & Noir', sizes: { S: 20, M: 25, L: 20, XL: 15, XXL: 10 }},
      { productId: 3, color: 'Bleu & Blanc', sizes: { S: 15, M: 20, L: 18, XL: 12, XXL: 8 }},
      { productId: 3, color: 'Vert & Noir', sizes: { S: 10, M: 15, L: 15, XL: 10, XXL: 5 }},
      
      // T-shirt à Manches Rayé - Stock limité
      { productId: 4, color: 'Noir & Blanc', sizes: { XS: 3, S: 5, M: 8, L: 6, XL: 2 }},
      { productId: 4, color: 'Bleu & Blanc', sizes: { XS: 2, S: 4, M: 6, L: 5, XL: 1 }},
      { productId: 4, color: 'Rouge & Blanc', sizes: { XS: 1, S: 3, M: 0, L: 4, XL: 0 }},
      
      // Hoodie Premium - Stock premium
      { productId: 5, color: 'Noir', sizes: { S: 15, M: 20, L: 18, XL: 12, XXL: 8 }},
      { productId: 5, color: 'Gris Foncé', sizes: { S: 10, M: 15, L: 12, XL: 8, XXL: 5 }},
      { productId: 5, color: 'Navy', sizes: { S: 8, M: 12, L: 10, XL: 6, XXL: 3 }},
      
      // Veste en Jean - Stock variable
      { productId: 6, color: 'Bleu Classique', sizes: { S: 5, M: 8, L: 10, XL: 6, XXL: 2 }},
      { productId: 6, color: 'Noir Délavé', sizes: { S: 3, M: 5, L: 7, XL: 4, XXL: 0 }}
    ];

    for (const item of stockData) {
      for (const [size, quantity] of Object.entries(item.sizes)) {
        await db.query(
          'INSERT INTO product_stock (product_id, color_name, size, quantity) VALUES (?, ?, ?, ?)',
          [item.productId, item.color, size, quantity]
        );
      }
    }
    console.log('✅ Stock ajouté pour tous les produits');

    // Afficher un résumé
    console.log('\n📈 Résumé du seeding:');
    const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
    const [stockCount] = await db.query('SELECT COUNT(*) as count FROM product_stock');
    const [totalStock] = await db.query('SELECT SUM(quantity) as total FROM product_stock');
    
    console.log(`   - Produits: ${productCount[0].count}`);
    console.log(`   - Entrées de stock: ${stockCount[0].count}`);
    console.log(`   - Articles en stock total: ${totalStock[0].total}`);

    console.log('\n✅ Seeding terminé avec succès!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

// Exécuter le seeding
seedDatabase();
