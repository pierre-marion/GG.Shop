# Système d'Authentification GG.Shop

## 🔐 Système de Rôles

Le site dispose de 3 rôles différents :

### 1. **Visiteur** (non connecté)
- ✅ Peut voir les produits
- ❌ Ne peut PAS acheter

### 2. **Connecté** (utilisateur enregistré)
- ✅ Peut voir les produits
- ✅ **Peut acheter les produits**
- S'obtient automatiquement lors de l'inscription

### 3. **Admin**
- ✅ Peut voir les produits
- ✅ Peut acheter les produits
- ✅ Accès aux routes admin (ex: `/api/admin/users`)

## 🚀 Démarrage

### 1. Lancer le backend
```bash
cd backend
npm start
```

Le serveur démarre sur http://localhost:3000

### 2. Ouvrir le site
Ouvrez http://localhost:3000 dans votre navigateur

## 📝 Tester le Système

### Compte Admin (pré-créé)
- **Email:** admin@ggshop.com
- **Mot de passe:** admin123
- **Rôle:** admin

### Créer un nouveau compte utilisateur
1. Cliquez sur "S'inscrire" dans le header
2. Remplissez le formulaire
3. Vous obtiendrez automatiquement le rôle **"connecté"**
4. Vous pourrez acheter des produits

### Tester en tant que Visiteur
- Déconnectez-vous si vous êtes connecté
- Vous aurez le rôle "visiteur"
- Vous pourrez voir les produits mais pas acheter

## 🔧 Routes API

### Authentification
- `POST /api/auth/register` - Inscription (crée un utilisateur avec rôle "connecté")
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Obtenir l'utilisateur actuel

### Produits
- `GET /api/products` - Liste des produits (tous les rôles)
  - Les visiteurs peuvent voir mais pas acheter
  - Les connectés peuvent voir ET acheter

### Achat
- `POST /api/purchase` - Acheter un produit
  - **Requiert:** rôle "connecté" ou "admin"
  - **Visiteurs:** accès refusé

### Admin
- `GET /api/admin/users` - Liste des utilisateurs
  - **Requiert:** rôle "admin" uniquement

## 💾 Stockage

Actuellement, les utilisateurs sont stockés **en mémoire** (dans un tableau).

⚠️ **Important:** Les données sont perdues au redémarrage du serveur.

### Pour une vraie application:
Remplacez le stockage en mémoire par une base de données (MongoDB, PostgreSQL, etc.)

## 🔑 Tokens JWT

- Les tokens sont stockés dans le `localStorage` du navigateur
- Durée de validité: 24 heures
- Le token est envoyé dans le header `Authorization: Bearer <token>`

## 📁 Structure des Fichiers

```
backend/
├── .env                    # Configuration (JWT_SECRET)
├── server.js              # Serveur principal
├── routes/
│   └── auth.js           # Routes d'authentification
└── middleware/
    └── auth.js           # Middleware de vérification

frontend/dist/
├── index.html            # Page principale (avec auth UI)
├── login.html           # Page de connexion
├── register.html        # Page d'inscription
└── auth.js             # Gestionnaire d'authentification JS
```

## 🎨 Interface Utilisateur

Le header affiche:
- **Visiteur:** Boutons "Connexion" et "S'inscrire"
- **Connecté/Admin:** 
  - Nom d'utilisateur
  - Badge de rôle (bleu pour "connecté", rouge pour "admin")
  - Bouton de déconnexion

## 🛡️ Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT sécurisés
- Middleware de vérification des rôles
- Validation des entrées

## ⚠️ Notes Importantes

1. Changez la clé `JWT_SECRET` dans le fichier `.env` pour la production
2. Utilisez HTTPS en production
3. Implémentez une vraie base de données
4. Ajoutez des validations supplémentaires
5. Gérez la limite de tentatives de connexion
