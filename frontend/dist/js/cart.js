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
    checkAuth();
    loadCart();
    setupEventListeners();
    updateCartDisplay();
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

// Charger le panier depuis localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Sauvegarder le panier dans localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Afficher le panier
function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    // Mettre à jour le compteur dans le header
    updateCartCount();
    
    if (cart.length === 0) {
        emptyCart.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
    }
    
    emptyCart.classList.add('hidden');
    cartContent.classList.remove('hidden');
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach((item, index) => {
        const itemElement = createCartItemElement(item, index);
        cartItemsContainer.appendChild(itemElement);
    });
    
    updateOrderSummary();
}

// Créer un élément de panier
function createCartItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'bg-dark-light rounded-3xl p-6 flex gap-6 relative';
    
    const itemTotal = item.price * item.quantity;
    
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
                </div>
            </div>
            
            <div class="flex items-center justify-between">
                <div class="text-2xl font-bold text-white">
                    $${item.price}
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="flex items-center bg-dark rounded-full overflow-hidden">
                        <button class="px-4 py-2 hover:bg-dark-lighter transition-colors" onclick="updateQuantity(${index}, -1)">
                            <i class="fas fa-minus text-white"></i>
                        </button>
                        <span class="px-6 text-white font-medium">${item.quantity}</span>
                        <button class="px-4 py-2 hover:bg-dark-lighter transition-colors" onclick="updateQuantity(${index}, 1)">
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
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            removeItem(index);
        } else {
            saveCart();
            updateCartDisplay();
        }
    }
}

// Supprimer un article
function removeItem(index) {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
    }
}

// Mettre à jour le résumé de commande
function updateOrderSummary() {
    let subtotal = 0;
    let itemCount = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
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
        alert('Vous devez être connecté pour passer commande.');
        window.location.href = 'login.html';
        return;
    }
    
    if (cart.length === 0) {
        alert('Votre panier est vide.');
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
    
    // Simulation de la commande
    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn.innerHTML;
    
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
    checkoutBtn.disabled = true;
    
    // Simuler un délai de traitement
    setTimeout(() => {
        // Vider le panier
        cart = [];
        saveCart();
        
        // Afficher un message de succès
        alert(`✅ Commande validée !\n\nMontant total: $${total}\nMerci pour votre achat ${currentUser.username} !`);
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    }, 2000);
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
