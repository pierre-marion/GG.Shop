// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let allProducts = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    checkAuth();
});

// Vérifier l'authentification pour l'affichage
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
                updateAuthUI(data.user);
            }
        } catch (error) {
            console.error('Erreur auth:', error);
        }
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
        
        // Ajouter lien admin dans la navigation
        const nav = document.querySelector('nav');
        if (nav && !document.getElementById('adminLink')) {
            const adminLink = document.createElement('a');
            adminLink.id = 'adminLink';
            adminLink.href = 'admin.html';
            adminLink.className = 'navbar-link text-primary';
            adminLink.innerHTML = '<i class="fas fa-cog mr-1"></i>Admin';
            nav.appendChild(adminLink);
        }
    } else if (user.role === 'connecté') {
        roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-green-500 text-white';
    } else {
        roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-gray-500 text-white';
    }
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });
}

// Charger les produits depuis l'API
async function loadProducts() {
    const productsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    
    if (!productsGrid) {
        console.error('Conteneur de produits introuvable');
        return;
    }
    
    // Afficher un loader
    productsGrid.innerHTML = `
        <div class="col-span-full text-center py-20">
            <i class="fas fa-spinner fa-spin text-6xl text-primary mb-4"></i>
            <p class="text-gray-400">Chargement des produits...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.success && data.products.length > 0) {
            allProducts = data.products;
            displayProducts(data.products);
        } else {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-box-open text-8xl text-gray-600 mb-6"></i>
                    <h2 class="text-2xl font-bold text-white mb-4">Aucun produit disponible</h2>
                    <p class="text-gray-400">Les produits seront bientôt disponibles !</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <i class="fas fa-exclamation-triangle text-8xl text-red-500 mb-6"></i>
                <h2 class="text-2xl font-bold text-white mb-4">Erreur de chargement</h2>
                <p class="text-gray-400 mb-6">Impossible de charger les produits. Vérifiez que le serveur est démarré.</p>
                <button onclick="loadProducts()" class="btn-primary">
                    <i class="fas fa-redo mr-2"></i>Réessayer
                </button>
            </div>
        `;
    }
}

// Afficher les produits
function displayProducts(products) {
    const productsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    // Limiter à 4 produits pour la page d'accueil
    const displayedProducts = products.slice(0, 4);
    
    displayedProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Si moins de 4 produits, ajouter des cartes vides pour garder l'alignement
    const remaining = 4 - displayedProducts.length;
    for (let i = 0; i < remaining; i++) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'hidden lg:block';
        productsGrid.appendChild(emptyCard);
    }
}

// Créer une carte produit
function createProductCard(product) {
    const card = document.createElement('a');
    card.href = `product-detail.html?id=${product.id}`;
    card.className = 'product-card block group';
    
    // Calculer les étoiles
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star-rating text-sm"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star-rating text-sm"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star-rating text-sm"></i>';
    }
    
    // Badge de rupture de stock
    let stockBadge = '';
    if (product.out_of_stock) {
        stockBadge = `
            <div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                RUPTURE
            </div>
        `;
    }
    
    // Prix et réduction
    let priceHTML = `<span class="text-2xl font-bold">$${product.price}</span>`;
    if (product.old_price) {
        priceHTML += `
            <span class="text-gray-400 line-through">$${product.old_price}</span>
            <span class="text-primary text-sm bg-primary/20 px-2 py-1 rounded-full">${product.discount}</span>
        `;
    }
    
    card.innerHTML = `
        <div class="relative bg-gray-200 h-64 flex items-center justify-center rounded-t-3xl overflow-hidden">
            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
            ${stockBadge}
        </div>
        <div class="p-5 space-y-3">
            <h3 class="font-semibold text-lg text-white group-hover:text-primary transition-colors">${product.name}</h3>
            <div class="flex items-center gap-1">
                ${starsHTML}
                <span class="text-sm text-gray-400 ml-1">${product.rating}/5</span>
            </div>
            <div class="flex items-center gap-3">
                ${priceHTML}
            </div>
        </div>
    `;
    
    return card;
}

// Mettre à jour le compteur du panier
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
}

// Mettre à jour le compteur au chargement
updateCartCounter();
