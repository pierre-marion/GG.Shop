// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentUser = null;
let products = [];
let currentProduct = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Vérifier l'authentification
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNoAccess();
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
            
            if (currentUser.role !== 'admin') {
                showNoAccess();
                return;
            }
            
            updateAuthUI(currentUser);
            loadProducts();
        } else {
            showNoAccess();
        }
    } catch (error) {
        console.error('Erreur auth:', error);
        showNoAccess();
    }
}

// Mettre à jour l'interface utilisateur
function updateAuthUI(user) {
    document.getElementById('username').textContent = user.username;
    
    const roleSpan = document.getElementById('userRole');
    roleSpan.textContent = user.role;
    roleSpan.className = 'ml-2 px-2 py-1 text-xs rounded-full bg-red-500 text-white';
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Afficher message d'accès refusé
function showNoAccess() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('productsContainer').classList.add('hidden');
    document.getElementById('noAccess').classList.remove('hidden');
}

// Charger tous les produits
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.products;
            
            // Charger les détails de chaque produit
            const detailedProducts = [];
            for (const product of products) {
                const detailResponse = await fetch(`${API_URL}/products/${product.id}`);
                const detailData = await detailResponse.json();
                if (detailData.success) {
                    detailedProducts.push(detailData.product);
                }
            }
            
            products = detailedProducts;
            displayProducts();
        } else {
            console.error('Erreur chargement produits');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
    
    document.getElementById('loading').classList.add('hidden');
    
    if (products.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
    } else {
        document.getElementById('productsContainer').classList.remove('hidden');
    }
}

// Afficher les produits
function displayProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Créer une carte produit
function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'bg-dark-light rounded-3xl p-6 shadow-xl';
    
    // Calculer le stock total
    let totalStock = 0;
    if (product.stock) {
        Object.values(product.stock).forEach(colorStock => {
            Object.values(colorStock).forEach(qty => {
                totalStock += qty;
            });
        });
    }
    
    const outOfStock = totalStock === 0;
    
    div.innerHTML = `
        <div class="flex gap-6">
            <div class="w-40 h-40 bg-dark rounded-2xl overflow-hidden flex-shrink-0">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            </div>
            
            <div class="flex-1">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-2xl font-bold text-white mb-2">${product.name}</h3>
                        <p class="text-gray-400 text-sm">${product.category} - $${product.price}</p>
                    </div>
                    
                    <div class="text-right">
                        ${outOfStock ? 
                            '<span class="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold"><i class="fas fa-ban mr-2"></i>Rupture de stock</span>' :
                            `<span class="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">${totalStock} articles</span>`
                        }
                    </div>
                </div>
                
                <div id="stock-${product.id}" class="space-y-3">
                    ${generateStockDisplay(product)}
                </div>
                
                <div class="mt-6">
                    <button onclick="openStockModal(${product.id})" class="btn-primary">
                        <i class="fas fa-edit mr-2"></i>Modifier le stock
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Générer l'affichage du stock
function generateStockDisplay(product) {
    if (!product.stock || Object.keys(product.stock).length === 0) {
        return '<p class="text-gray-500 text-sm">Aucun stock configuré</p>';
    }
    
    let html = '';
    
    Object.entries(product.stock).forEach(([color, sizes]) => {
        const colorTotal = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
        
        html += `
            <div class="bg-dark rounded-xl p-4">
                <h4 class="text-white font-semibold mb-3">
                    <i class="fas fa-palette text-primary mr-2"></i>${color}
                    <span class="text-sm text-gray-400 ml-2">(${colorTotal} articles)</span>
                </h4>
                <div class="grid grid-cols-6 gap-2">
                    ${Object.entries(sizes).map(([size, qty]) => `
                        <div class="bg-dark-light rounded-lg p-2 text-center">
                            <div class="text-xs text-gray-400">${size}</div>
                            <div class="text-sm font-bold ${qty === 0 ? 'text-red-400' : qty < 5 ? 'text-yellow-400' : 'text-green-400'}">
                                ${qty}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Ouvrir le modal de modification du stock
function openStockModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="bg-dark rounded-2xl p-6 mb-6">
            <div class="flex items-center gap-4">
                <img src="${currentProduct.image}" alt="${currentProduct.name}" class="w-20 h-20 rounded-lg object-cover">
                <div>
                    <h3 class="text-xl font-bold text-white">${currentProduct.name}</h3>
                    <p class="text-gray-400">${currentProduct.category}</p>
                </div>
            </div>
        </div>
        
        <div class="space-y-6">
            ${generateStockEditForm(currentProduct)}
        </div>
    `;
    
    document.getElementById('stockModal').classList.remove('hidden');
}

// Générer le formulaire d'édition du stock
function generateStockEditForm(product) {
    if (!product.stock || Object.keys(product.stock).length === 0) {
        return '<p class="text-gray-500">Aucun stock à modifier</p>';
    }
    
    let html = '';
    
    Object.entries(product.stock).forEach(([color, sizes]) => {
        html += `
            <div class="bg-dark rounded-2xl p-6">
                <h4 class="text-white font-semibold mb-4 flex items-center">
                    <i class="fas fa-palette text-primary mr-2"></i>${color}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${Object.entries(sizes).map(([size, qty]) => `
                        <div class="bg-dark-light rounded-xl p-4">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-white font-medium">Taille ${size}</span>
                                <span class="text-sm ${qty === 0 ? 'text-red-400' : qty < 5 ? 'text-yellow-400' : 'text-green-400'}">
                                    Stock actuel: ${qty}
                                </span>
                            </div>
                            
                            <div class="flex gap-2">
                                <button onclick="adjustStock(${product.id}, '${color}', '${size}', -5)" 
                                        class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-minus mr-1"></i>5
                                </button>
                                <button onclick="adjustStock(${product.id}, '${color}', '${size}', -1)" 
                                        class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-minus mr-1"></i>1
                                </button>
                                <button onclick="adjustStock(${product.id}, '${color}', '${size}', 1)" 
                                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-plus mr-1"></i>1
                                </button>
                                <button onclick="adjustStock(${product.id}, '${color}', '${size}', 5)" 
                                        class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-plus mr-1"></i>5
                                </button>
                            </div>
                            
                            <div class="mt-3">
                                <input type="number" 
                                       id="stock-${product.id}-${color}-${size}" 
                                       value="${qty}"
                                       min="0"
                                       class="w-full bg-dark text-white px-4 py-2 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none">
                                <button onclick="setStock(${product.id}, '${color}', '${size}')" 
                                        class="w-full mt-2 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-save mr-2"></i>Définir
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Ajuster le stock (ajouter ou retirer)
async function adjustStock(productId, colorName, size, adjustment) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/stock/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                colorName,
                size,
                adjustment
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour l'affichage
            const input = document.getElementById(`stock-${productId}-${colorName}-${size}`);
            if (input) {
                input.value = data.newQuantity;
            }
            
            // Recharger les produits
            await loadProducts();
            
            // Rouvrir le modal avec les nouvelles données
            openStockModal(productId);
            
            showNotification('success', `Stock ${adjustment > 0 ? 'ajouté' : 'retiré'} avec succès`);
        } else {
            showNotification('error', data.message || 'Erreur lors de la modification du stock');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Définir le stock à une valeur spécifique
async function setStock(productId, colorName, size) {
    const input = document.getElementById(`stock-${productId}-${colorName}-${size}`);
    if (!input) return;
    
    const quantity = parseInt(input.value);
    if (isNaN(quantity) || quantity < 0) {
        showNotification('error', 'Quantité invalide');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/stock/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                colorName,
                size,
                quantity
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recharger les produits
            await loadProducts();
            
            // Rouvrir le modal avec les nouvelles données
            openStockModal(productId);
            
            showNotification('success', 'Stock mis à jour avec succès');
        } else {
            showNotification('error', data.message || 'Erreur lors de la mise à jour du stock');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Fermer le modal
function closeModal() {
    document.getElementById('stockModal').classList.add('hidden');
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
