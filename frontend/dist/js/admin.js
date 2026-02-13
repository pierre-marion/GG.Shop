// Configuration API
const API_URL = 'http://localhost:3000/api';

// Variables globales
let currentUser = null;
let products = [];
let currentTab = 'list';
let productToDelete = null;
let editingProductId = null;

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
            await loadProducts();
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('tabContent').classList.remove('hidden');
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
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Afficher message d'accès refusé
function showNoAccess() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('tabContent').classList.add('hidden');
    document.getElementById('noAccess').classList.remove('hidden');
}

// Changer d'onglet
function switchTab(tab) {
    currentTab = tab;
    
    // Mettre à jour les styles des onglets
    ['list', 'add', 'stock'].forEach(t => {
        const tabBtn = document.getElementById(`tab-${t}`);
        const content = document.getElementById(`content-${t}`);
        
        if (t === tab) {
            tabBtn.className = 'tab-active flex-1 py-4 px-6 font-semibold transition-colors';
            content.classList.remove('hidden');
        } else {
            tabBtn.className = 'tab-inactive flex-1 py-4 px-6 font-semibold transition-colors';
            content.classList.add('hidden');
        }
    });
    
    // Réinitialiser le formulaire si on va sur "add"
    if (tab === 'add' && editingProductId) {
        cancelForm();
    }
}

// Charger tous les produits
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.success) {
            // Charger les détails de chaque produit
            const detailedProducts = [];
            for (const product of data.products) {
                const detailResponse = await fetch(`${API_URL}/products/${product.id}`);
                const detailData = await detailResponse.json();
                if (detailData.success) {
                    detailedProducts.push(detailData.product);
                }
            }
            
            products = detailedProducts;
            displayProductsList();
            displayStockList();
            updateProductCount();
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur lors du chargement des produits');
    }
}

// Afficher la liste des produits
function displayProductsList() {
    const container = document.getElementById('productsList');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-box-open text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Aucun produit. Créez-en un !</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-dark rounded-2xl p-6 flex gap-6 items-center hover:bg-dark-lighter transition-colors';
        
        const totalStock = calculateTotalStock(product);
        
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="w-24 h-24 rounded-lg object-cover">
            
            <div class="flex-1">
                <h3 class="text-xl font-bold text-white mb-2">${product.name}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span><i class="fas fa-tag mr-1"></i>${product.category}</span>
                    <span><i class="fas fa-dollar-sign mr-1"></i>${product.price}</span>
                    <span><i class="fas fa-star text-yellow-400 mr-1"></i>${product.rating}/5</span>
                    <span class="${totalStock === 0 ? 'text-red-400' : totalStock < 10 ? 'text-yellow-400' : 'text-green-400'}">
                        <i class="fas fa-boxes mr-1"></i>${totalStock} en stock
                    </span>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button onclick="editProduct(${product.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="openDeleteModal(${product.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Afficher la liste pour gérer le stock
function displayStockList() {
    const container = document.getElementById('stockList');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-box-open text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Aucun produit disponible</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-dark rounded-2xl p-6';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex gap-4">
                    <img src="${product.image}" alt="${product.name}" class="w-16 h-16 rounded-lg object-cover">
                    <div>
                        <h3 class="text-xl font-bold text-white">${product.name}</h3>
                        <p class="text-gray-400 text-sm">${product.category}</p>
                    </div>
                </div>
                <button onclick="toggleStockDetails(${product.id})" class="text-primary hover:text-primary-dark">
                    <i class="fas fa-chevron-down" id="chevron-${product.id}"></i>
                </button>
            </div>
            
            <div id="stock-details-${product.id}" class="hidden space-y-4">
                ${generateStockEditor(product)}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Générer l'éditeur de stock
function generateStockEditor(product) {
    if (!product.stock || Object.keys(product.stock).length === 0) {
        return '<p class="text-gray-500 text-sm">Aucun stock configuré</p>';
    }
    
    let html = '';
    
    Object.entries(product.stock).forEach(([color, sizes]) => {
        html += `
            <div class="bg-dark-light rounded-xl p-4">
                <h4 class="text-white font-semibold mb-3">
                    <i class="fas fa-palette text-primary mr-2"></i>${color}
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    ${Object.entries(sizes).map(([size, qty]) => `
                        <div class="bg-dark rounded-lg p-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-white text-sm font-medium">${size}</span>
                                <span class="text-xs ${qty === 0 ? 'text-red-400' : qty < 5 ? 'text-yellow-400' : 'text-green-400'}">
                                    ${qty}
                                </span>
                            </div>
                            <div class="flex gap-1">
                                <button onclick="adjustStockQuick(${product.id}, '${color}', '${size}', -1)" 
                                        class="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 rounded text-xs">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" value="${qty}" min="0" 
                                       onchange="updateStockValue(${product.id}, '${color}', '${size}', this.value)"
                                       class="w-16 bg-dark text-white text-center py-1 rounded text-xs border border-dark-lighter focus:border-primary focus:outline-none">
                                <button onclick="adjustStockQuick(${product.id}, '${color}', '${size}', 1)" 
                                        class="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs">
                                    <i class="fas fa-plus"></i>
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

// Toggle détails du stock
function toggleStockDetails(productId) {
    const details = document.getElementById(`stock-details-${productId}`);
    const chevron = document.getElementById(`chevron-${productId}`);
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        chevron.className = 'fas fa-chevron-up';
    } else {
        details.classList.add('hidden');
        chevron.className = 'fas fa-chevron-down';
    }
}

// Ajuster le stock rapidement
async function adjustStockQuick(productId, colorName, size, adjustment) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/stock/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, colorName, size, adjustment })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadProducts();
            showNotification('success', 'Stock mis à jour');
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Mettre à jour la valeur du stock
async function updateStockValue(productId, colorName, size, value) {
    const quantity = parseInt(value);
    if (isNaN(quantity) || quantity < 0) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/stock/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, colorName, size, quantity })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadProducts();
            showNotification('success', 'Stock mis à jour');
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
}

// Calculer le stock total
function calculateTotalStock(product) {
    let total = 0;
    if (product.stock) {
        Object.values(product.stock).forEach(colorStock => {
            Object.values(colorStock).forEach(qty => {
                total += qty;
            });
        });
    }
    return total;
}

// Mettre à jour le compteur de produits
function updateProductCount() {
    document.getElementById('productCount').textContent = `(${products.length})`;
}

// Ajouter un champ couleur
function addColorField() {
    const container = document.getElementById('colorsContainer');
    const div = document.createElement('div');
    div.className = 'flex gap-3';
    div.innerHTML = `
        <input type="text" placeholder="Nom couleur (ex: Noir)" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-name">
        <input type="text" placeholder="Classe CSS (ex: bg-gray-900)" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-class">
        <button type="button" onclick="removeColor(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// Supprimer un champ couleur
function removeColor(button) {
    const container = document.getElementById('colorsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        showNotification('error', 'Au moins une couleur est requise');
    }
}

// Ajouter un champ taille
function addSizeField() {
    const container = document.getElementById('sizesContainer');
    const div = document.createElement('div');
    div.className = 'flex gap-3';
    div.innerHTML = `
        <input type="text" placeholder="Taille (ex: M)" class="w-24 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-name">
        <input type="number" placeholder="Stock" min="0" value="0" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-stock">
        <button type="button" onclick="removeSize(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// Supprimer un champ taille
function removeSize(button) {
    const container = document.getElementById('sizesContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        showNotification('error', 'Au moins une taille est requise');
    }
}

// Soumettre le formulaire
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les données du formulaire
    const formData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        old_price: document.getElementById('productOldPrice').value ? parseFloat(document.getElementById('productOldPrice').value) : null,
        discount: document.getElementById('productDiscount').value.trim() || null,
        description: document.getElementById('productDescription').value.trim(),
        rating: parseFloat(document.getElementById('productRating').value),
        image: document.getElementById('productImage').value.trim()
    };
    
    // Images supplémentaires
    const imagesText = document.getElementById('productImages').value.trim();
    const images = imagesText ? imagesText.split('\n').filter(url => url.trim()) : [];
    
    // Couleurs
    const colors = [];
    const colorDivs = document.querySelectorAll('#colorsContainer > div');
    colorDivs.forEach(div => {
        const name = div.querySelector('.color-name').value.trim();
        const cssClass = div.querySelector('.color-class').value.trim();
        if (name && cssClass) {
            colors.push({ name, class: cssClass });
        }
    });
    
    if (colors.length === 0) {
        showNotification('error', 'Au moins une couleur est requise');
        return;
    }
    
    // Tailles et stock
    const sizes = [];
    const sizeDivs = document.querySelectorAll('#sizesContainer > div');
    sizeDivs.forEach(div => {
        const name = div.querySelector('.size-name').value.trim();
        const stock = parseInt(div.querySelector('.size-stock').value);
        if (name) {
            sizes.push({ name, stock: stock || 0 });
        }
    });
    
    if (sizes.length === 0) {
        showNotification('error', 'Au moins une taille est requise');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        let response;
        
        if (editingProductId) {
            // Mise à jour d'un produit existant
            response = await fetch(`${API_URL}/products/${editingProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, images, colors, sizes })
            });
        } else {
            // Création d'un nouveau produit
            response = await fetch(`${API_URL}/products/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, images, colors, sizes })
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', editingProductId ? 'Produit mis à jour' : 'Produit créé avec succès');
            await loadProducts();
            cancelForm();
            switchTab('list');
        } else {
            showNotification('error', data.message || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
    }
});

// Modifier un produit
async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    // Remplir le formulaire
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOldPrice').value = product.old_price || '';
    document.getElementById('productDiscount').value = product.discount || '';
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productRating').value = product.rating;
    document.getElementById('productImage').value = product.image;
    
    // Images
    if (product.images && product.images.length > 0) {
        document.getElementById('productImages').value = product.images.join('\n');
    }
    
    // Couleurs
    const colorsContainer = document.getElementById('colorsContainer');
    colorsContainer.innerHTML = '';
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'flex gap-3';
            div.innerHTML = `
                <input type="text" placeholder="Nom couleur" value="${color.name}" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-name">
                <input type="text" placeholder="Classe CSS" value="${color.value}" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-class">
                <button type="button" onclick="removeColor(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            colorsContainer.appendChild(div);
        });
    }
    
    // Tailles (récupérer toutes les tailles uniques du stock)
    const sizesContainer = document.getElementById('sizesContainer');
    sizesContainer.innerHTML = '';
    const allSizes = new Set();
    if (product.stock) {
        Object.values(product.stock).forEach(colorStock => {
            Object.keys(colorStock).forEach(size => allSizes.add(size));
        });
    }
    
    allSizes.forEach(size => {
        const div = document.createElement('div');
        div.className = 'flex gap-3';
        div.innerHTML = `
            <input type="text" placeholder="Taille" value="${size}" class="w-24 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-name">
            <input type="number" placeholder="Stock" value="0" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-stock">
            <button type="button" onclick="removeSize(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
                <i class="fas fa-trash"></i>
            </button>
        `;
        sizesContainer.appendChild(div);
    });
    
    // Changer les textes
    document.getElementById('formTitle').textContent = 'Modifier le Produit';
    document.getElementById('submitText').textContent = 'Mettre à Jour';
    
    switchTab('add');
}

// Annuler le formulaire
function cancelForm() {
    document.getElementById('productForm').reset();
    editingProductId = null;
    document.getElementById('productId').value = '';
    document.getElementById('formTitle').textContent = 'Ajouter un Produit';
    document.getElementById('submitText').textContent = 'Créer le Produit';
    
    // Réinitialiser les couleurs et tailles
    document.getElementById('colorsContainer').innerHTML = `
        <div class="flex gap-3">
            <input type="text" placeholder="Nom couleur (ex: Noir)" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-name">
            <input type="text" placeholder="Classe CSS (ex: bg-gray-900)" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none color-class">
            <button type="button" onclick="removeColor(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    document.getElementById('sizesContainer').innerHTML = `
        <div class="flex gap-3">
            <input type="text" placeholder="Taille (ex: M)" class="w-24 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-name">
            <input type="number" placeholder="Stock" min="0" value="0" class="flex-1 bg-dark text-white px-4 py-3 rounded-lg border border-dark-lighter focus:border-primary focus:outline-none size-stock">
            <button type="button" onclick="removeSize(this)" class="bg-red-600 hover:bg-red-700 text-white px-4 rounded-lg">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    switchTab('list');
}

// Ouvrir le modal de suppression
function openDeleteModal(productId) {
    productToDelete = productId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// Fermer le modal de suppression
function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

// Confirmer la suppression
async function confirmDelete() {
    if (!productToDelete) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${productToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('success', 'Produit supprimé');
            await loadProducts();
            closeDeleteModal();
        } else {
            showNotification('error', data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', 'Erreur serveur');
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
