// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;
let quantity = 1;
let currentUser = null;
let productStock = {};

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

// Charger le produit depuis l'API
async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            currentProduct = data.product;
            productStock = data.product.stock || {};
            displayProduct(currentProduct);
            
            // Vérifier si le produit est entièrement en rupture de stock
            if (currentProduct.out_of_stock) {
                showOutOfStockMessage();
            }
        } else {
            console.error('Produit non trouvé');
            // Fallback sur produit par défaut si l'API échoue
            loadFallbackProduct(productId);
        }
    } catch (error) {
        console.error('Erreur chargement produit:', error);
        // Fallback sur produit par défaut si l'API échoue
        loadFallbackProduct(productId);
    }
}

// Produits de secours (si l'API n'est pas encore configurée)
function loadFallbackProduct(productId) {
    const products = {
        1: {
            id: 1,
            name: 'T-shirt à Col Dégradé',
            category: 'T-shirts',
            price: 212,
            old_price: 242,
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
            stock: {
                'Vert Olive': { 'XS': 5, 'S': 10, 'M': 15, 'L': 8, 'XL': 3, 'XXL': 0 },
                'Noir': { 'XS': 2, 'S': 5, 'M': 12, 'L': 10, 'XL': 7, 'XXL': 4 },
                'Bleu Marine': { 'XS': 0, 'S': 8, 'M': 0, 'L': 15, 'XL': 5, 'XXL': 2 }
            }
        }
    };
    
    currentProduct = products[productId] || products[1];
    productStock = currentProduct.stock || {};
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
        if (product.images && product.images[index]) {
            thumb.src = product.images[index];
            thumb.alt = `${product.name} - Vue ${index + 1}`;
        }
    });
    
    // Prix
    document.getElementById('currentPrice').textContent = `$${product.price}`;
    
    if (product.old_price || product.oldPrice) {
        const oldPrice = product.old_price || product.oldPrice;
        document.getElementById('oldPrice').textContent = `$${oldPrice}`;
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
            updateSizesForColor(color.name);
        }
        
        colorOptions.appendChild(button);
    });
    
    document.getElementById('selectedColor').textContent = selectedColor;
}

// Mettre à jour les tailles en fonction de la couleur et du stock
function updateSizesForColor(colorName) {
    const sizeOptions = document.getElementById('sizeOptions');
    const sizes = getAllSizes();
    const colorStock = productStock[colorName] || {};
    
    sizeOptions.innerHTML = '';
    let firstAvailableSize = null;
    
    sizes.forEach((size) => {
        const stockQty = colorStock[size] || 0;
        const isAvailable = stockQty > 0;
        
        const button = document.createElement('button');
        button.className = 'size-option px-6 py-3 rounded-full transition-all border';
        button.dataset.size = size;
        button.textContent = size;
        
        if (!isAvailable) {
            // Taille en rupture de stock - grisée et non cliquable
            button.className += ' bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed';
            button.disabled = true;
            button.title = 'Rupture de stock';
        } else {
            // Taille disponible
            button.className += ' bg-dark-light hover:bg-primary hover:text-white text-gray-300 border-dark-lighter cursor-pointer';
            
            if (!firstAvailableSize) {
                firstAvailableSize = size;
                button.classList.add('bg-primary', 'text-white');
                selectedSize = size;
            }
        }
        
        // Afficher le stock disponible
        if (isAvailable) {
            const stockBadge = document.createElement('span');
            stockBadge.className = 'text-xs ml-1 stock-badge';
            stockBadge.dataset.originalStock = stockQty;
            stockBadge.textContent = `(${stockQty})`;
            button.appendChild(stockBadge);
        }
        
        sizeOptions.appendChild(button);
    });
    
    // Mettre à jour l'affichage de la taille sélectionnée
    if (firstAvailableSize) {
        document.getElementById('selectedSize').textContent = firstAvailableSize;
        checkStockForSelection();
    } else {
        document.getElementById('selectedSize').textContent = 'Aucune disponible';
        document.getElementById('addToCartBtn').disabled = true;
        showNoStockMessage();
    }
}

// Récupérer toutes les tailles possibles
function getAllSizes() {
    const allSizes = new Set();
    
    Object.values(productStock).forEach(colorStock => {
        Object.keys(colorStock).forEach(size => allSizes.add(size));
    });
    
    if (allSizes.size === 0) {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
    
    // Trier les tailles dans l'ordre standard
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];
    return Array.from(allSizes).sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

// Vérifier le stock pour la sélection actuelle
function checkStockForSelection() {
    if (!selectedColor || !selectedSize) return;
    
    const stockQty = (productStock[selectedColor] && productStock[selectedColor][selectedSize]) || 0;
    const addToCartBtn = document.getElementById('addToCartBtn');
    const increaseBtn = document.getElementById('increaseQty');
    
    if (stockQty === 0) {
        addToCartBtn.disabled = true;
        showNoStockMessage();
    } else {
        if (currentUser && currentUser.role !== 'visiteur') {
            addToCartBtn.disabled = false;
        }
        hideNoStockMessage();
        
        // Limiter la quantité max au stock disponible
        if (quantity > stockQty) {
            quantity = stockQty;
            document.getElementById('quantity').textContent = quantity;
        }
        
        // Désactiver le bouton + si on atteint le stock max
        increaseBtn.disabled = quantity >= stockQty;
    }
    
    // Mettre à jour l'affichage du stock restant
    updateStockDisplay();
}

// Mettre à jour l'affichage du stock restant pour la taille sélectionnée
function updateStockDisplay() {
    if (!selectedSize) return;
    
    const sizeButtons = document.querySelectorAll('.size-option');
    sizeButtons.forEach(button => {
        const size = button.dataset.size;
        const stockBadge = button.querySelector('.stock-badge');
        
        if (stockBadge) {
            const originalStock = parseInt(stockBadge.dataset.originalStock);
            
            // Toujours afficher le stock disponible total
            stockBadge.textContent = `(${originalStock})`;
            
            if (size === selectedSize) {
                // Changer la couleur selon le stock disponible par rapport à la quantité
                if (originalStock === 0) {
                    stockBadge.className = 'text-xs ml-1 stock-badge text-red-400';
                } else if (originalStock <= quantity) {
                    stockBadge.className = 'text-xs ml-1 stock-badge text-orange-400';
                } else if (originalStock < 5) {
                    stockBadge.className = 'text-xs ml-1 stock-badge text-yellow-400';
                } else {
                    stockBadge.className = 'text-xs ml-1 stock-badge text-green-400';
                }
            } else {
                // Pour les autres tailles, couleur par défaut
                stockBadge.className = 'text-xs ml-1 stock-badge';
            }
        }
    });
}

// Afficher message de rupture de stock
function showNoStockMessage() {
    const roleMessage = document.getElementById('roleMessage');
    const roleMessageText = document.getElementById('roleMessageText');
    
    roleMessage.classList.remove('hidden', 'bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-400');
    roleMessage.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
    roleMessageText.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Cette combinaison couleur/taille est en rupture de stock';
}

// Afficher message produit complet en rupture
function showOutOfStockMessage() {
    const roleMessage = document.getElementById('roleMessage');
    const roleMessageText = document.getElementById('roleMessageText');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    roleMessage.classList.remove('hidden', 'bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-400');
    roleMessage.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
    roleMessageText.innerHTML = '<i class="fas fa-ban mr-2"></i>Ce produit est entièrement en rupture de stock';
    addToCartBtn.disabled = true;
}

// Cacher message de rupture de stock
function hideNoStockMessage() {
    const roleMessage = document.getElementById('roleMessage');
    
    if (currentUser && currentUser.role === 'visiteur') {
        // Remettre le message de connexion
        roleMessage.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-400');
        roleMessage.classList.add('bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-400');
        checkPurchasePermission('visiteur');
    } else {
        roleMessage.classList.add('hidden');
    }
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
            
            // Mettre à jour les tailles disponibles pour cette couleur
            updateSizesForColor(selectedColor);
        }
    });
    
    // Sélection de taille
    document.getElementById('sizeOptions').addEventListener('click', (e) => {
        if (e.target.classList.contains('size-option') && !e.target.disabled) {
            document.querySelectorAll('.size-option:not([disabled])').forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('bg-dark-light', 'text-gray-300');
            });
            e.target.classList.remove('bg-dark-light', 'text-gray-300');
            e.target.classList.add('bg-primary', 'text-white');
            selectedSize = e.target.dataset.size;
            document.getElementById('selectedSize').textContent = selectedSize;
            
            // Réinitialiser la quantité et vérifier le stock
            quantity = 1;
            document.getElementById('quantity').textContent = quantity;
            checkStockForSelection();
        }
    });
    
    // Quantité
    document.getElementById('decreaseQty').addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            document.getElementById('quantity').textContent = quantity;
            checkStockForSelection();
        }
    });
    
    document.getElementById('increaseQty').addEventListener('click', () => {
        const stockQty = (productStock[selectedColor] && productStock[selectedColor][selectedSize]) || 0;
        if (quantity < stockQty) {
            quantity++;
            document.getElementById('quantity').textContent = quantity;
            checkStockForSelection();
        }
    });
    
    // Miniatures
    document.querySelectorAll('.thumbnail-img').forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            if (currentProduct && currentProduct.images && currentProduct.images[index]) {
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
        showPopup('Vous devez être connecté pour acheter ce produit.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Vérifier le stock une dernière fois
    const stockQty = (productStock[selectedColor] && productStock[selectedColor][selectedSize]) || 0;
    if (quantity > stockQty) {
        showPopup(`Stock insuffisant. Seulement ${stockQty} article(s) disponible(s).`, 'warning');
        return;
    }
    
    if (quantity <= 0) {
        showPopup('Veuillez sélectionner une quantité valide.', 'warning');
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
    
    // Essayer d'ajouter via l'API si connecté
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/products/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: currentProduct.id,
                    colorName: selectedColor,
                    size: selectedSize,
                    quantity: quantity
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                showPopup(data.message || 'Erreur lors de l\'ajout au panier', 'error');
                return;
            }
            
            console.log('✅ Produit ajouté au panier via API');
        } catch (error) {
            console.error('Erreur API panier:', error);
            showPopup('Erreur lors de l\'ajout au panier', 'error');
            return;
        }
    }
    
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
