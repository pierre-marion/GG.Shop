// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let cart = [];
let currentUser = null;
let promoApplied = false;
let promoDiscount = 0;

// Codes promo disponibles
const promoCodes = {
    'GGSHOP10': { discount: 10, type: 'percent' },
    'SAVE20': { discount: 20, type: 'percent' },
    'FIRST50': { discount: 50, type: 'fixed' }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Initialisation du panier...');
    checkAuth();
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
                checkCheckoutPermission(data.user.role);
                
                // Charger le panier depuis l'API
                await loadCartFromAPI();
                console.log('📦 Panier chargé depuis API, articles:', cart.length);
                
                // Mettre à jour l'affichage après chargement
                updateCartDisplay();
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
    checkCheckoutPermission('visiteur');
}

// Vérifier les permissions de checkout
function checkCheckoutPermission(role) {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const roleWarning = document.getElementById('roleWarning');
    const roleWarningText = document.getElementById('roleWarningText');
    
    if (role === 'visiteur') {
        checkoutBtn.disabled = true;
        roleWarning.classList.remove('hidden');
        roleWarningText.innerHTML = 'Vous devez être <a href="login.html" class="underline font-semibold">connecté</a> pour passer commande.';
    } else if (role === 'connecté' || role === 'admin') {
        checkoutBtn.disabled = false;
        roleWarning.classList.add('hidden');
    }
}

// Charger le panier depuis l'API
async function loadCartFromAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ Pas de token, impossible de charger le panier');
        return;
    }
    
    console.log('🔄 Chargement du panier depuis l\'API...');
    
    try {
        const response = await fetch(`${API_URL}/products/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Réponse API panier:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📦 Données panier:', data);
            
            if (data.success) {
                // Convertir le format API vers le format local
                cart = data.cart.map(item => ({
                    id: item.product_id,
                    cartItemId: item.id,
                    name: item.name,
                    image: item.image,
                    color: item.color_name,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                    availableStock: item.available_stock,
                    stockAvailable: item.stock_available
                }));
                
                console.log('✅ Panier converti:', cart);
                
                // Synchroniser avec localStorage pour compatibilité
                localStorage.setItem('cart', JSON.stringify(cart));
            }
        }
    } catch (error) {
        console.error('❌ Erreur chargement panier API:', error);
    }
}

// Charger le panier depuis localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        
        // Vérifier le stock pour chaque article
        if (currentUser && currentUser.role !== 'visiteur') {
            verifyCartStock();
        }
    }
}

// Vérifier le stock pour tous les articles du panier
async function verifyCartStock() {
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        
        try {
            const response = await fetch(`${API_URL}/products/check-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: item.id,
                    colorName: item.color,
                    size: item.size,
                    quantity: item.quantity
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                cart[i].stockAvailable = data.available;
                cart[i].availableStock = data.currentStock || 0;
                
                // Ajuster la quantité si nécessaire
                if (!data.available && data.currentStock > 0) {
                    cart[i].quantity = data.currentStock;
                }
            }
        } catch (error) {
            console.error('Erreur vérification stock:', error);
        }
    }
    
    saveCart();
}

// Sauvegarder le panier dans localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Afficher le panier
function updateCartDisplay() {
    console.log('🎨 updateCartDisplay() appelé, cart.length:', cart.length);
    console.log('🎨 Contenu du panier:', cart);
    
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    console.log('🎨 Éléments DOM:', {
        cartItemsContainer: !!cartItemsContainer,
        emptyCart: !!emptyCart,
        cartContent: !!cartContent
    });
    
    // Mettre à jour le compteur dans le header
    updateCartCount();
    
    if (cart.length === 0) {
        console.log('⚠️ Panier vide, affichage du message');
        emptyCart.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
    }
    
    console.log('✅ Panier non vide, affichage des articles');
    emptyCart.classList.add('hidden');
    cartContent.classList.remove('hidden');
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((item, index) => {
        console.log(`🔨 Création élément ${index}:`, item);
        const itemElement = createCartItemElement(item, index);
        cartItemsContainer.appendChild(itemElement);
    });
    
    updateOrderSummary();
    console.log('✅ updateCartDisplay() terminé');
}

// Créer un élément de panier
function createCartItemElement(item, index) {
    const div = document.createElement('div');
    const itemTotal = item.price * item.quantity;
    
    // Vérifier si le stock est insuffisant
    const hasStockIssue = item.stockAvailable === false || 
                          (item.availableStock !== undefined && item.quantity > item.availableStock);
    
    let stockWarning = '';
    if (hasStockIssue) {
        if (item.availableStock === 0) {
            stockWarning = `
                <div class="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Rupture de stock - Cet article ne peut pas être commandé
                </div>
            `;
        } else {
            stockWarning = `
                <div class="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Stock limité : seulement ${item.availableStock} disponible(s)
                </div>
            `;
        }
    }
    
    div.className = 'bg-dark-light rounded-3xl p-6 flex gap-6 relative';
    if (hasStockIssue && item.availableStock === 0) {
        div.className += ' opacity-60';
    }
    
    div.innerHTML = `
        <button class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors" onclick="removeItem(${index})">
            <i class="fas fa-trash-alt"></i>
        </button>
        
        <div class="w-32 h-32 bg-dark rounded-2xl overflow-hidden flex-shrink-0">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        </div>
        
        <div class="flex-1 space-y-3">
            <div>
                <h3 class="text-xl font-semibold text-white mb-2">${item.name}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                    <p>Couleur: <span class="text-white">${item.color}</span></p>
                    <p>Taille: <span class="text-white">${item.size}</span></p>
                    ${item.availableStock !== undefined ? `<p>Stock: <span class="text-primary">${item.availableStock} dispo</span></p>` : ''}
                </div>
            </div>
            
            ${stockWarning}
            
            <div class="flex items-center justify-between">
                <div class="text-2xl font-bold text-white">
                    $${item.price}
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="flex items-center bg-dark rounded-full overflow-hidden">
                        <button class="px-4 py-2 hover:bg-dark-lighter transition-colors ${item.availableStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                onclick="updateQuantity(${index}, -1)"
                                ${item.availableStock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus text-white"></i>
                        </button>
                        <span class="px-6 text-white font-medium">${item.quantity}</span>
                        <button class="px-4 py-2 hover:bg-dark-lighter transition-colors ${item.availableStock !== undefined && item.quantity >= item.availableStock ? 'opacity-50 cursor-not-allowed' : ''}" 
                                onclick="updateQuantity(${index}, 1)"
                                ${item.availableStock !== undefined && item.quantity >= item.availableStock ? 'disabled' : ''}>
                            <i class="fas fa-plus text-white"></i>
                        </button>
                    </div>
                    
                    <div class="text-xl font-bold text-primary min-w-[80px] text-right">
                        $${itemTotal}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Mettre à jour la quantité d'un article
async function updateQuantity(index, change) {
    if (cart[index]) {
        const newQuantity = cart[index].quantity + change;
        
        if (newQuantity <= 0) {
            removeItem(index);
            return;
        }
        
        // Vérifier le stock disponible
        if (cart[index].availableStock !== undefined && newQuantity > cart[index].availableStock) {
            showPopup(`Stock insuffisant. Seulement ${cart[index].availableStock} article(s) disponible(s).`, 'warning');
            return;
        }
        
        cart[index].quantity = newQuantity;
        
        // Mettre à jour via l'API si connecté
        const token = localStorage.getItem('token');
        if (token && cart[index].cartItemId) {
            try {
                const response = await fetch(`${API_URL}/products/cart/${cart[index].cartItemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    showPopup(data.message || 'Erreur lors de la mise à jour', 'error');
                    
                    // Recharger le panier pour synchroniser
                    await loadCartFromAPI();
                    updateCartDisplay();
                    return;
                }
            } catch (error) {
                console.error('Erreur mise à jour panier API:', error);
            }
        }
        
        saveCart();
        updateCartDisplay();
    }
}

// Supprimer un article
async function removeItem(index) {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
        const item = cart[index];
        
        // Supprimer via l'API si connecté
        const token = localStorage.getItem('token');
        if (token && item.cartItemId) {
            try {
                await fetch(`${API_URL}/products/cart/${item.cartItemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Erreur suppression panier API:', error);
            }
        }
        
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
    }
}

// Mettre à jour le résumé de commande
function updateOrderSummary() {
    let subtotal = 0;
    let itemCount = 0;
    let hasStockIssues = false;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
        
        if (item.availableStock !== undefined && item.availableStock === 0) {
            hasStockIssues = true;
        }
    });
    
    let discount = 0;
    if (promoApplied) {
        discount = promoDiscount;
    }
    
    const total = subtotal - discount;
    
    document.getElementById('itemCount').textContent = itemCount;
    document.getElementById('subtotal').textContent = `$${subtotal}`;
    document.getElementById('discount').textContent = discount > 0 ? `-$${discount}` : '$0';
    document.getElementById('total').textContent = `$${total}`;
    
    // Désactiver le checkout si problème de stock
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (hasStockIssues && currentUser && currentUser.role !== 'visiteur') {
        checkoutBtn.disabled = true;
        checkoutBtn.title = 'Certains articles ne sont plus disponibles';
    } else if (currentUser && currentUser.role !== 'visiteur') {
        checkoutBtn.disabled = false;
        checkoutBtn.title = '';
    }
}

// Mettre à jour le compteur du panier
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
}

// Configuration des événements
function setupEventListeners() {
    // Appliquer code promo
    document.getElementById('applyPromo').addEventListener('click', applyPromoCode);
    
    document.getElementById('promoCode').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromoCode();
        }
    });
    
    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

// Appliquer un code promo
function applyPromoCode() {
    const promoInput = document.getElementById('promoCode');
    const promoCode = promoInput.value.trim().toUpperCase();
    const promoMessage = document.getElementById('promoMessage');
    
    if (!promoCode) {
        showPromoMessage('Veuillez entrer un code promo', 'error');
        return;
    }
    
    if (promoApplied) {
        showPromoMessage('Un code promo est déjà appliqué', 'error');
        return;
    }
    
    if (promoCodes[promoCode]) {
        const promo = promoCodes[promoCode];
        promoApplied = true;
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (promo.type === 'percent') {
            promoDiscount = Math.floor(subtotal * promo.discount / 100);
            showPromoMessage(`Code promo appliqué ! -${promo.discount}%`, 'success');
        } else {
            promoDiscount = promo.discount;
            showPromoMessage(`Code promo appliqué ! -$${promo.discount}`, 'success');
        }
        
        promoInput.disabled = true;
        document.getElementById('applyPromo').textContent = 'Appliqué';
        document.getElementById('applyPromo').disabled = true;
        
        updateOrderSummary();
    } else {
        showPromoMessage('Code promo invalide', 'error');
    }
}

// Afficher message promo
function showPromoMessage(message, type) {
    const promoMessage = document.getElementById('promoMessage');
    promoMessage.textContent = message;
    promoMessage.classList.remove('hidden');
    
    if (type === 'success') {
        promoMessage.className = 'text-sm text-green-500';
    } else {
        promoMessage.className = 'text-sm text-red-500';
    }
    
    setTimeout(() => {
        if (type === 'error') {
            promoMessage.classList.add('hidden');
        }
    }, 3000);
}

// Gérer le checkout
async function handleCheckout() {
    if (!currentUser || currentUser.role === 'visiteur') {
        showPopup('Vous devez être connecté pour passer commande.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    if (cart.length === 0) {
        showPopup('Votre panier est vide.', 'warning');
        return;
    }
    
    // Vérifier une dernière fois le stock
    let hasStockIssues = false;
    for (const item of cart) {
        if (item.availableStock !== undefined && item.availableStock < item.quantity) {
            hasStockIssues = true;
            break;
        }
    }
    
    if (hasStockIssues) {
        showPopup('Certains articles de votre panier ne sont plus disponibles en quantité suffisante. Veuillez vérifier votre panier.', 'warning');
        await verifyCartStock();
        updateCartDisplay();
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - promoDiscount;
    
    const orderData = {
        items: cart,
        subtotal: subtotal,
        discount: promoDiscount,
        total: total,
        user: currentUser
    };
    
    console.log('Commande:', orderData);
    
    // Appeler l'API de checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn.innerHTML;
    
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
    checkoutBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/checkout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Commande validée, vidage du panier...');
            
            // Vider le panier complètement
            cart = [];
            localStorage.removeItem('cart');
            localStorage.removeItem('cartLastUpdate');
            
            // Sauvegarder le panier vide
            saveCart();
            updateCartCount();
            
            console.log('🗑️ Panier vidé, cart:', cart);
            console.log('🗑️ localStorage cart:', localStorage.getItem('cart'));
            
            // Afficher un message de succès
            showPopup(`✅ Commande validée !\n\nCommande #${data.orderId}\nMontant total: ${data.orderSummary.total}€\nMerci pour votre achat ${currentUser.username} !`, 'success');
            
            // Rediriger vers la page d'accueil après 3 secondes
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            // Afficher l'erreur
            showPopup(`❌ Erreur: ${data.message}`, 'error');
            
            // Si problème de stock, recharger le panier
            if (data.stockIssues) {
                await loadCartFromAPI();
                await verifyCartStock();
                updateCartDisplay();
            }
            
            // Réactiver le bouton
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    } catch (error) {
        console.error('Erreur checkout:', error);
        showPopup('❌ Erreur serveur lors de la commande', 'error');
        
        // Réactiver le bouton
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
    }
}

// Fonction globale pour ajouter au panier (appelée depuis product-detail.js)
function addToCart(product) {
    // Vérifier si le produit existe déjà
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === product.color && 
        item.size === product.size
    );
    
    if (existingIndex >= 0) {
        cart[existingIndex].quantity += product.quantity;
    } else {
        cart.push(product);
    }
    
    saveCart();
    updateCartCount();
}
