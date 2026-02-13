// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentUser = null;
let cartItems = [];
let itemToDelete = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCartBadge();
});

// Vérifier l'authentification
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotLoggedIn();
        updateAuthButtons(null);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthButtons(currentUser);
            await loadCart();
        } else {
            showNotLoggedIn();
            updateAuthButtons(null);
        }
    } catch (error) {
        console.error('Erreur auth:', error);
        showNotLoggedIn();
        updateAuthButtons(null);
    }
}

// Mettre à jour les boutons d'authentification
function updateAuthButtons(user) {
    const authButtons = document.getElementById('authButtons');
    
    if (!user) {
        authButtons.innerHTML = `
            <a href="login.html" class="text-white hover:text-primary transition-colors duration-300">
                <i class="fas fa-user mr-2"></i>Connexion
            </a>
            <a href="register.html" class="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-all duration-300">
                S'inscrire
            </a>
        `;
    } else {
        const roleColor = user.role === 'admin' ? 'bg-red-500' : user.role === 'connecté' ? 'bg-blue-500' : 'bg-gray-500';
        
        authButtons.innerHTML = `
            <div class="text-white">
                <i class="fas fa-user-circle mr-2"></i>
                <span class="font-medium">${user.username}</span>
                <span class="ml-2 px-2 py-1 text-xs rounded-full ${roleColor}">${user.role}</span>
            </div>
            ${user.role === 'admin' ? '<a href="admin.html" class="text-primary hover:text-primary-dark transition-colors"><i class="fas fa-cog mr-1"></i>Admin</a>' : ''}
            <button onclick="logout()" class="text-red-400 hover:text-red-300 transition-colors">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Afficher message non connecté
function showNotLoggedIn() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('notLoggedIn').classList.remove('hidden');
}

// Charger le panier
async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('📦 Réponse API panier:', data);
        console.log('📊 Nombre d\'articles:', data.cart ? data.cart.length : 0);
        
        if (data.success) {
            cartItems = data.cart;
            console.log('✅ Articles chargés:', cartItems);
            
            // Sauvegarder dans localStorage
            saveCartToLocalStorage();
            
            document.getElementById('loading').classList.add('hidden');
            
            if (cartItems.length === 0) {
                console.log('⚠️ Panier vide - affichage message');
                document.getElementById('emptyCart').classList.remove('hidden');
                document.getElementById('cartContent').classList.add('hidden');
            } else {
                console.log('✅ Affichage du panier avec', cartItems.length, 'article(s)');
                document.getElementById('emptyCart').classList.add('hidden');
                document.getElementById('cartContent').classList.remove('hidden');
                displayCart();
                updateSummary();
                checkStockAvailability();
            }
        } else {
            console.error('❌ Erreur API:', data.message);
            showError('Erreur lors du chargement du panier');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur serveur');
    }
}

// Afficher le panier
function displayCart() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';
    
    cartItems.forEach(item => {
        const itemCard = createCartItemCard(item);
        container.appendChild(itemCard);
    });
}

// Créer une carte d'article
function createCartItemCard(item) {
    const div = document.createElement('div');
    const stockAvailable = item.stock_available;
    const stockClass = stockAvailable ? 'border-dark-lighter' : 'border-red-500';
    
    div.className = `bg-dark-light rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-2 ${stockClass}`;
    
    div.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="w-full md:w-32 h-32 object-cover rounded-xl">
        
        <div class="flex-1">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-white">${item.name}</h3>
                <button onclick="openDeleteModal(${item.id})" class="text-red-400 hover:text-red-300 transition-colors">
                    <i class="fas fa-trash text-xl"></i>
                </button>
            </div>
            
            <div class="space-y-2 mb-4">
                <p class="text-gray-400 text-sm">
                    <i class="fas fa-palette mr-2"></i>Couleur: <span class="text-white font-medium">${item.color_name}</span>
                </p>
                <p class="text-gray-400 text-sm">
                    <i class="fas fa-ruler mr-2"></i>Taille: <span class="text-white font-medium">${item.size}</span>
                </p>
                ${!stockAvailable ? `
                    <div class="bg-red-500/20 border border-red-500 text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Stock insuffisant (${item.available_stock} disponible${item.available_stock > 1 ? 's' : ''})</span>
                    </div>
                ` : item.available_stock < 5 ? `
                    <div class="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i class="fas fa-info-circle"></i>
                        <span>Plus que ${item.available_stock} en stock</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" 
                            class="bg-dark hover:bg-dark-lighter text-white w-10 h-10 rounded-lg transition-all duration-300 flex items-center justify-center"
                            ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    
                    <input type="number" 
                           value="${item.quantity}" 
                           min="1" 
                           max="${item.max_quantity}"
                           onchange="updateQuantity(${item.id}, this.value)"
                           class="bg-dark text-white text-center w-16 h-10 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none">
                    
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" 
                            class="bg-dark hover:bg-dark-lighter text-white w-10 h-10 rounded-lg transition-all duration-300 flex items-center justify-center"
                            ${item.quantity >= item.max_quantity ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="text-right">
                    <p class="text-gray-400 text-sm">Prix unitaire: ${item.price}€</p>
                    <p class="text-2xl font-bold text-primary">${(item.price * item.quantity).toFixed(2)}€</p>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Mettre à jour la quantité
async function updateQuantity(cartItemId, newQuantity) {
    const quantity = parseInt(newQuantity);
    
    if (quantity < 1) {
        openDeleteModal(cartItemId);
        return;
    }
    
    const item = cartItems.find(i => i.id === cartItemId);
    if (!item) return;
    
    if (quantity > item.max_quantity) {
        showNotification('error', `Maximum ${item.max_quantity} disponible(s)`);
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/cart/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadCart();
            saveCartToLocalStorage();
            showNotification('success', 'Quantité mise à jour');
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Ouvrir le modal de suppression
function openDeleteModal(cartItemId) {
    itemToDelete = cartItemId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// Annuler la suppression
function cancelDelete() {
    itemToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

// Confirmer la suppression
async function confirmDelete() {
    if (!itemToDelete) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/cart/${itemToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            cancelDelete();
            await loadCart();
            saveCartToLocalStorage();
            updateCartBadge();
            showNotification('success', 'Article retiré du panier');
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Mettre à jour le récapitulatif
function updateSummary() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('subtotal').textContent = subtotal.toFixed(2) + '€';
    document.getElementById('total').textContent = subtotal.toFixed(2) + '€';
}

// Vérifier la disponibilité du stock
function checkStockAvailability() {
    const hasStockIssues = cartItems.some(item => !item.stock_available);
    const warningsContainer = document.getElementById('stockWarnings');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (hasStockIssues) {
        warningsContainer.classList.remove('hidden');
        warningsContainer.innerHTML = `
            <div class="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Attention :</strong> Certains articles n'ont plus assez de stock. Veuillez ajuster les quantités ou retirer ces articles.
            </div>
        `;
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        warningsContainer.classList.add('hidden');
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Passer la commande
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (checkoutBtn.disabled) return;
            
            const hasStockIssues = cartItems.some(item => !item.stock_available);
            
            if (hasStockIssues) {
                showNotification('error', 'Veuillez résoudre les problèmes de stock avant de continuer');
                return;
            }
            
            if (cartItems.length === 0) {
                showNotification('error', 'Votre panier est vide');
                return;
            }
            
            // Désactiver le bouton pendant le traitement
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/products/checkout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Vider le panier après validation
                    cartItems = [];
                    clearCartFromLocalStorage();
                    updateCartBadge();
                    
                    showNotification('success', 'Commande validée ! Stock mis à jour.');
                    
                    setTimeout(() => {
                        document.getElementById('successModal').classList.remove('hidden');
                    }, 1000);
                } else {
                    showNotification('error', data.message || 'Erreur lors de la commande');
                    
                    // Recharger le panier pour afficher les stocks à jour
                    if (data.stockIssues) {
                        await loadCart();
                    }
                    
                    // Réactiver le bouton
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerHTML = '<i class="fas fa-lock"></i><span>Passer la commande</span>';
                }
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('error', 'Erreur serveur lors de la commande');
                
                // Réactiver le bouton
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="fas fa-lock"></i><span>Passer la commande</span>';
            }
        });
    }
});

// Fermer le modal de succès
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    window.location.href = 'index.html';
}

// Mettre à jour le badge du panier
async function updateCartBadge() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const totalItems = data.cart.reduce((sum, item) => sum + item.quantity, 0);
            const badge = document.getElementById('cartBadge');
            
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Afficher une notification
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white font-semibold animate-fade-in`;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Afficher une erreur
function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    const container = document.getElementById('cartContent');
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="text-center py-20">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <p class="text-gray-400">${message}</p>
        </div>
    `;
}

// Sauvegarder le panier dans localStorage
function saveCartToLocalStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        localStorage.setItem('cartLastUpdate', new Date().toISOString());
    } catch (error) {
        console.error('Erreur sauvegarde localStorage:', error);
    }
}

// Charger le panier depuis localStorage (en cas de problème serveur)
function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            return JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Erreur chargement localStorage:', error);
    }
    return [];
}

// Vider le panier du localStorage
function clearCartFromLocalStorage() {
    try {
        localStorage.removeItem('cart');
        localStorage.removeItem('cartLastUpdate');
    } catch (error) {
        console.error('Erreur nettoyage localStorage:', error);
    }
}
