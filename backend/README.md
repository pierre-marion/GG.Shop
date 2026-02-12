# GG.Shop - Backend Express + MySQL

Backend API avec authentification JWT et gestion des rôles.

## 🎯 Système de rôles

- **Visiteur** : Peut consulter les produits
- **Connecté** : Peut acheter des produits
- **Admin** : Accès complet

## 🚀 Installation

### 1. Installer XAMPP ou WAMP
Télécharger et installer [XAMPP](https://www.apachefriends.org/) ou WAMP pour avoir MySQL + phpMyAdmin.

### 2. Créer la base de données
1. Démarrer **Apache** et **MySQL** dans XAMPP/WAMP
2. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
3. Importer le fichier `database.sql` ou copier/coller le contenu dans l'onglet SQL

### 3. Installer les dépendances Node.js
```bash
cd backend
npm install
```

### 4. Configurer les variables d'environnement
Le fichier `.env` est déjà configuré pour XAMPP/WAMP par défaut :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ggshop
```

### 5. Lancer le serveur
```bash
npm start
```

Le serveur démarre sur : http://localhost:3000

## 🔑 Compte admin par défaut

- **Email** : admin@ggshop.com
- **Mot de passe** : admin123

## 📡 Routes API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

### Produits
- `GET /api/products` - Liste des produits (authentifié)
- `POST /api/purchase` - Acheter un produit (connecté/admin)

### Admin
- `GET /api/admin/users` - Liste des utilisateurs (admin uniquement)

## 🛠️ Gérer la base de données

Utilise phpMyAdmin pour :
- Voir tous les utilisateurs
- Modifier les rôles
- Supprimer des comptes
- Consulter les logs

URL : http://localhost/phpmyadmin

## 📦 Dépendances

- express
- mysql2
- bcryptjs
- jsonwebtoken
- cors
- dotenv
