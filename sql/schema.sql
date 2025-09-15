CREATE DATABASE IF NOT EXISTS `laundry` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `laundry`;

-- USERS (customers)
CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(191) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- DELIVERY STAFF
CREATE TABLE IF NOT EXISTS delivery_staff (
  staff_id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(191) UNIQUE,
  status ENUM('active','inactive','on-duty') DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  admin_id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ADDRESSES (per user)
CREATE TABLE IF NOT EXISTS addresses (
  address_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  label VARCHAR(50),
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  order_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  staff_id CHAR(36),
  pickup_address_id CHAR(36) NOT NULL,
  delivery_address_id CHAR(36) NOT NULL,
  items JSON NOT NULL,
  pickup_time DATETIME NOT NULL,
  delivery_time DATETIME,
  status ENUM('pending','picked','ironing','out-for-delivery','delivered','cancelled') DEFAULT 'pending',
  price_total DECIMAL(10,2) DEFAULT 0,
  payment_option ENUM('cod','online') DEFAULT 'cod',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ord_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ord_staff FOREIGN KEY (staff_id) REFERENCES delivery_staff(staff_id) ON DELETE SET NULL,
  CONSTRAINT fk_ord_pickup FOREIGN KEY (pickup_address_id) REFERENCES addresses(address_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ord_delivery FOREIGN KEY (delivery_address_id) REFERENCES addresses(address_id) ON DELETE RESTRICT,
  INDEX idx_user (user_id),
  INDEX idx_staff (staff_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ORDER STATUS TIMELINE
CREATE TABLE IF NOT EXISTS order_status_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  status ENUM('pending','picked','ironing','out-for-delivery','delivered','cancelled') NOT NULL,
  note VARCHAR(255),
  staff_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ose_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- OTP STORE (email based; can also hold phone if needed)
CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subject_type ENUM('user','staff') NOT NULL,
  email VARCHAR(191),
  phone_number VARCHAR(20),
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT DEFAULT 0,
  sent_count TINYINT DEFAULT 1,
  ip VARCHAR(45),
  consumed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone_number)
) ENGINE=InnoDB;

-- REFRESH TOKENS (optional; JWT refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  subject_type ENUM('user','staff','admin') NOT NULL,
  subject_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subject (subject_type, subject_id)
) ENGINE=InnoDB;

-- OPTIONAL: seed admin (change email/pass!)
INSERT INTO admins (admin_id, name, email, password_hash)
VALUES (
  UUID(), 'Super Admin', 'admin@example.com',
  -- bcrypt hash for password: Admin@123 (change in prod!)
  '$2b$10$wz7c2qGUGe3q9Xf1n9Y4qOPO5oYp7lJk4CQu3K3S2iIhF7zT36cFC'
) ON DUPLICATE KEY UPDATE email=email;