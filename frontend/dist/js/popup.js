// Système de popup moderne pour remplacer alert()

function showPopup(message, type = 'info') {
    // Supprimer les popups existantes
    const existing = document.querySelectorAll('.custom-popup');
    existing.forEach(popup => popup.remove());

    // Créer la popup
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    
    // Définir l'icône selon le type
    let icon = '';
    let bgColor = '';
    let iconColor = '';
    
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            bgColor = 'bg-green-500/20';
            iconColor = 'text-green-400';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            bgColor = 'bg-red-500/20';
            iconColor = 'text-red-400';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            bgColor = 'bg-yellow-500/20';
            iconColor = 'text-yellow-400';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            bgColor = 'bg-blue-500/20';
            iconColor = 'text-blue-400';
    }
    
    popup.innerHTML = `
        <div class="popup-backdrop"></div>
        <div class="popup-content ${bgColor}">
            <div class="popup-icon ${iconColor}">
                ${icon}
            </div>
            <div class="popup-message">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <button class="popup-close" onclick="this.closest('.custom-popup').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Animation d'entrée
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
    
    // Fermer au clic sur le backdrop
    popup.querySelector('.popup-backdrop').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });
}

// Fonction de confirmation (remplace confirm())
function showConfirm(message, onConfirm) {
    const popup = document.createElement('div');
    popup.className = 'custom-popup confirm-popup';
    
    popup.innerHTML = `
        <div class="popup-backdrop"></div>
        <div class="popup-content bg-dark-light">
            <div class="popup-icon text-yellow-400">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="popup-message">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <div class="popup-buttons">
                <button class="popup-btn popup-btn-cancel">
                    <i class="fas fa-times mr-2"></i>Annuler
                </button>
                <button class="popup-btn popup-btn-confirm">
                    <i class="fas fa-check mr-2"></i>Confirmer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Gestion des boutons
    popup.querySelector('.popup-btn-cancel').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });
    
    popup.querySelector('.popup-btn-confirm').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
        if (onConfirm) onConfirm();
    });
    
    // Fermer au clic sur le backdrop
    popup.querySelector('.popup-backdrop').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });
}
