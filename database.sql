-- إنشاء قاعدة البيانات (إذا لم تكن موجودة)
CREATE DATABASE IF NOT EXISTS meta_invoice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE meta_invoice_db;

-- 1. جدول الشركات (العملاء المشتركين معك)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE, -- الرقم الضريبي
    country_code CHAR(2) NOT NULL, -- 'EG' or 'SA'
    api_secret VARCHAR(255), -- مفتاح سري للربط
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. جدول الفواتير (الأرشيف القانوني)
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    internal_id VARCHAR(100) NOT NULL, -- رقم الفاتورة عند العميل
    gov_uuid VARCHAR(255), -- الرقم المرجعي الحكومي
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'submitted', 'rejected') DEFAULT 'pending',
    gov_response JSON, -- تخزين رد الحكومة كاملاً
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. سجل الأمان (Audit Logs) - هام للاعتماد
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- إدخال شركة تجريبية فوراً للتجربة
INSERT INTO companies (name, tax_id, country_code, api_secret) 
VALUES ('شركة ميتا سوفت للتجربة', '100-200-300', 'EG', 'secret_key_123')
ON DUPLICATE KEY UPDATE name=name;
