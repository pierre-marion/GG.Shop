-- Créer la base de données
CREATE DATABASE IF NOT EXISTS ggshop;
USE ggshop;

-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  role ENUM('visiteur', 'connecté', 'admin') DEFAULT 'connecté',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer un admin par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT INTO users (email, password, username, role) 
VALUES ('admin@ggshop.com', '$2a$10$6hL/9ADuVEcZjJnX6XxP1O1YzLKvB6xZ3hJ0xrFQKzXm8YGqGzKKO', 'Admin', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Afficher les tables
SHOW TABLES;
SELECT * FROM users;
