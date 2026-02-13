// Configuration API
const API_URL = 'http://localhost:3000/api';

// Produits disponibles (à remplacer par un appel API plus tard)
const products = {
    1: {
        id: 1,
        name: 'T-shirt à Col Dégradé',
        category: 'T-shirts',
        price: 212,
        oldPrice: 242,
        discount: '-20%',
        rating: 4.5,
        description: 'Ce T-shirt à col dégradé combine style et confort pour un look décontracté mais élégant. Fabriqué avec des matériaux de haute qualité, il offre une respirabilité exceptionnelle et une durabilité longue durée.',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
            'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'
        ],
        colors: [
            { name: 'Vert Olive', value: 'bg-green-700' },
            { name: 'Noir', value: 'bg-gray-800' },
            { name: 'Bleu Marine', value: 'bg-blue-900' }
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    2: {
        id: 2,
        name: 'Jean Skinny Fit',
        category: 'Jeans',
        price: 240,
        oldPrice: 260,
        discount: '-20%',
        rating: 3.5,
        description: 'Jean skinny fit parfait pour un look moderne. Coupe ajustée qui met en valeur votre silhouette tout en restant confortable grâce à son tissu extensible.',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
        images: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
            'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800',
            'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800',
            'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'
        ],
        colors: [
            { name: 'Bleu Denim', value: 'bg-blue-600' },
            { name: 'Noir', value: 'bg-gray-900' },
            { name: 'Gris', value: 'bg-gray-500' }
        ],
        sizes: ['28', '30', '32', '34', '36', '38']
    },
    3: {
        id: 3,
        name: 'Chemise à Carreaux',
        category: 'Chemises',
        price: 180,
        oldPrice: null,
        discount: null,
        rating: 4.5,
        description: 'Chemise à carreaux classique pour un style décontracté-chic. Parfaite pour le bureau ou une sortie décontractée. Tissu doux et respirant pour un confort optimal.',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
        images: [
            'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            'https://images.unsplash.com/photo-1596755095238-043a2b4d1e57?w=800'
        ],
        colors: [
            { name: 'Rouge & Noir', value: 'bg-red-700' },
            { name: 'Bleu & Blanc', value: 'bg-blue-600' },
            { name: 'Vert & Noir', value: 'bg-green-700' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    4: {
        id: 4,
        name: 'T-shirt à Manches Rayé',
        category: 'T-shirts',
        price: 130,
        oldPrice: 160,
        discount: '-30%',
        rating: 4.5,
        description: 'T-shirt rayé tendance avec manches longues. Design moderne et confortable, idéal pour la mi-saison. Matière douce au toucher.',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
        images: [
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
            'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800'
        ],
        colors: [
            { name: 'Noir & Blanc', value: 'bg-gray-800' },
            { name: 'Bleu & Blanc', value: 'bg-blue-600' },
            { name: 'Rouge & Blanc', value: 'bg-red-600' }
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL']
    }
};

// Variables globales
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;
let quantity = 1;
let currentUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProduct();
    setupEventListeners();
});

// Vérifier l'authentification
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateAuthUI(data.user);
                checkPurchasePermission(data.user.role);
            } else {
                document.getElementById('guestButtons').classList.remove('hidden');
                document.getElementById('userButtons').classList.add('hidden');
                setVisitorMode();
            }
        } catch (error) {
            console.error('Erreur auth:', error);
            setVisitorMode();
        }
    } else {
        document.getElementById('guestButtons').classList.remove('hidden');
        document.getElementById('userButtons').classList.add('hidden');
        setVisitorMode();
    }
}

// Mettre à jour l'interface utilisateur
function updateAuthUI(user) {
    document.getElementById('guestButtons').classList.add('hidden');
    document.getElementById('userButtons').classList.remove('hidden');
    document.getElementById('username').textContent = user.username;
    
    const roleSpan = document.getElementById('userRole');
    roleSpan.textContent = user.role;
    
    if (user.role === 'admin') {
        roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-red-500 text-white';
    } else if (user.role === 'connecté') {
        roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-green-500 text-white';
    } else {
        roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-gray-500 text-white';
    }
}

// Mode visiteur
function setVisitorMode() {
    currentUser = { role: 'visiteur' };
    checkPurchasePermission('visiteur');
}

// Vérifier les permissions d'achat
function checkPurchasePermission(role) {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const roleMessage = document.getElementById('roleMessage');
    const roleMessageText = document.getElementById('roleMessageText');
    
    if (role === 'visiteur') {
        addToCartBtn.disabled = true;
        roleMessage.classList.remove('hidden');
        roleMessageText.innerHTML = 'Vous devez être <a href="login.html" class="underline font-semibold">connecté</a> pour acheter ce produit.';
    } else if (role === 'connecté' || role === 'admin') {
        addToCartBtn.disabled = false;
        roleMessage.classList.add('hidden');
    }
}

// Charger le produit
function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;
    
    currentProduct = products[productId];
    
    if (!currentProduct) {
        currentProduct = products[1];
    }
    
    displayProduct(currentProduct);
}

// Afficher le produit
function displayProduct(product) {
    // Titre de la page
    document.getElementById('pageTitle').textContent = `${product.name} - GG.SHOP`;
    
    // Breadcrumb
    document.getElementById('breadcrumbCategory').textContent = product.category;
    document.getElementById('breadcrumbProduct').textContent = product.name;
    
    // Nom du produit
    document.getElementById('productName').textContent = product.name;
    
    // Description
    document.getElementById('productDescription').textContent = product.description;
    
    // Images
    document.getElementById('mainImage').src = product.image;
    document.getElementById('mainImage').alt = product.name;
    
    const thumbnails = document.querySelectorAll('.thumbnail-img img');
    thumbnails.forEach((thumb, index) => {
        if (product.images[index]) {
            thumb.src = product.images[index];
            thumb.alt = `${product.name} - Vue ${index + 1}`;
        }
    });
    
    // Prix
    document.getElementById('currentPrice').textContent = `$${product.price}`;
    
    if (product.oldPrice) {
        document.getElementById('oldPrice').textContent = `$${product.oldPrice}`;
        document.getElementById('oldPrice').classList.remove('hidden');
    } else {
        document.getElementById('oldPrice').classList.add('hidden');
    }
    
    if (product.discount) {
        document.getElementById('discount').textContent = product.discount;
        document.getElementById('discount').classList.remove('hidden');
    } else {
        document.getElementById('discount').classList.add('hidden');
    }
    
    // Rating
    displayRating(product.rating);
    
    // Couleurs
    displayColors(product.colors);
    
    // Tailles
    displaySizes(product.sizes);
}

// Afficher les étoiles de notation
function displayRating(rating) {
    const starsContainer = document.getElementById('starsContainer');
    const ratingText = document.getElementById('ratingText');
    
    starsContainer.innerHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        starsContainer.innerHTML += '<i class="fas fa-star text-yellow-400"></i>';
    }
    
    if (hasHalfStar) {
        starsContainer.innerHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsContainer.innerHTML += '<i class="far fa-star text-yellow-400"></i>';
    }
    
    ratingText.textContent = `${rating}/5`;
}

// Afficher les couleurs
function displayColors(colors) {
    const colorOptions = document.getElementById('colorOptions');
    colorOptions.innerHTML = '';
    
    colors.forEach((color, index) => {
        const button = document.createElement('button');
        button.className = `color-option w-12 h-12 rounded-full ${color.value} border-2 border-transparent hover:border-white transition-all`;
        button.dataset.color = color.name;
        
        if (index === 0) {
            button.classList.add('ring-2', 'ring-white');
            selectedColor = color.name;
        }
        
        colorOptions.appendChild(button);
    });
    
    document.getElementById('selectedColor').textContent = selectedColor;
}

// Afficher les tailles
function displaySizes(sizes) {
    const sizeOptions = document.getElementById('sizeOptions');
    sizeOptions.innerHTML = '';
    
    sizes.forEach((size, index) => {
        const button = document.createElement('button');
        button.className = 'size-option px-6 py-3 rounded-full bg-dark-light hover:bg-primary hover:text-white text-gray-300 transition-all border border-dark-lighter';
        button.dataset.size = size;
        button.textContent = size;
        
        if (index === 3 || (sizes.length < 4 && index === 0)) {
            button.classList.add('bg-primary', 'text-white');
            selectedSize = size;
        }
        
        sizeOptions.appendChild(button);
    });
    
    document.getElementById('selectedSize').textContent = selectedSize;
}

// Configuration des événements
function setupEventListeners() {
    // Sélection de couleur
    document.getElementById('colorOptions').addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.classList.remove('ring-2', 'ring-white');
            });
            e.target.classList.add('ring-2', 'ring-white');
            selectedColor = e.target.dataset.color;
            document.getElementById('selectedColor').textContent = selectedColor;
        }
    });
    
    // Sélection de taille
    document.getElementById('sizeOptions').addEventListener('click', (e) => {
        if (e.target.classList.contains('size-option')) {
            document.querySelectorAll('.size-option').forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
            });
            e.target.classList.add('bg-primary', 'text-white');
            selectedSize = e.target.dataset.size;
            document.getElementById('selectedSize').textContent = selectedSize;
        }
    });
    
    // Quantité
    document.getElementById('decreaseQty').addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            document.getElementById('quantity').textContent = quantity;
        }
    });
    
    document.getElementById('increaseQty').addEventListener('click', () => {
        quantity++;
        document.getElementById('quantity').textContent = quantity;
    });
    
    // Miniatures
    document.querySelectorAll('.thumbnail-img').forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            if (currentProduct && currentProduct.images[index]) {
                document.getElementById('mainImage').src = currentProduct.images[index];
            }
        });
    });
    
    // Ajouter au panier
    document.getElementById('addToCartBtn').addEventListener('click', handleAddToCart);
    
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

// Gérer l'ajout au panier
async function handleAddToCart() {
    if (!currentUser || currentUser.role === 'visiteur') {
        alert('Vous devez être connecté pour acheter ce produit.');
        window.location.href = 'login.html';
        return;
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        image: currentProduct.image,
        color: selectedColor,
        size: selectedSize,
        quantity: quantity,
        price: currentProduct.price
    };
    
    // Récupérer le panier existant
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Vérifier si le produit existe déjà avec les mêmes options
    const existingIndex = cart.findIndex(item => 
        item.id === cartItem.id && 
        item.color === cartItem.color && 
        item.size === cartItem.size
    );
    
    if (existingIndex >= 0) {
        cart[existingIndex].quantity += cartItem.quantity;
    } else {
        cart.push(cartItem);
    }
    
    // Sauvegarder le panier
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Animation de succès
    const btn = document.getElementById('addToCartBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-2"></i>Ajouté !';
    btn.classList.add('bg-green-600');
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-green-600');
        
        // Redirection vers le panier
        if (confirm('Produit ajouté au panier ! Voulez-vous consulter votre panier ?')) {
            window.location.href = 'cart.html';
        }
    }, 1500);
}
