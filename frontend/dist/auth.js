// Classe pour gérer l'authentification
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = this.loadUser();
  }

  loadUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async register(email, password, username) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getRole() {
    return this.user?.role || 'visiteur';
  }

  canPurchase() {
    const role = this.getRole();
    return role === 'connecté' || role === 'admin';
  }

  isAdmin() {
    return this.getRole() === 'admin';
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchProducts() {
    try {
      const headers = this.isAuthenticated() 
        ? this.getAuthHeaders() 
        : { 'Content-Type': 'application/json' };

      const response = await fetch('http://localhost:3000/api/products', {
        headers
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      throw error;
    }
  }

  async purchase(productId) {
    if (!this.canPurchase()) {
      throw new Error('Vous devez être connecté pour acheter');
    }

    try {
      const response = await fetch('http://localhost:3000/api/purchase', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'achat');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}

// Instance globale
const auth = new AuthManager();
