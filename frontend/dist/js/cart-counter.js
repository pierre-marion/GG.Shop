// Script pour mettre à jour le compteur du panier sur toutes les pages
(function() {
    function updateCartCounter() {
        const cartCountElement = document.getElementById('cartCount');
        if (!cartCountElement) return;
        
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalItems > 0) {
            cartCountElement.textContent = totalItems;
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    }
    
    // Mettre à jour au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCartCounter);
    } else {
        updateCartCounter();
    }
    
    // Mettre à jour quand le localStorage change (dans les autres onglets)
    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            updateCartCounter();
        }
    });
})();
