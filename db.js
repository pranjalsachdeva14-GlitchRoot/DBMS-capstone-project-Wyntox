// db.js - SQLite Database Initialization and Management for E-Commerce Analytics Platform
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'ecommerce_analytics.db');

function getDatabase() {
    const db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    return db;
}

function initializeDatabase() {
    const db = getDatabase();

    console.log('[DB] Initializing database schema...');

    // Drop tables if existing (in reverse dependency order)
    db.exec(`
        DROP VIEW IF EXISTS v_customer_summary;
        DROP VIEW IF EXISTS v_product_sales;
        DROP VIEW IF EXISTS v_customer_purchases;
        DROP VIEW IF EXISTS v_order_totals;

        DROP TABLE IF EXISTS reviews;
        DROP TABLE IF EXISTS wishlists;
        DROP TABLE IF EXISTS addresses;
        DROP TABLE IF EXISTS product_metadata;

        DROP TABLE IF EXISTS deliveries;
        DROP TABLE IF EXISTS payments;
        DROP TABLE IF EXISTS order_items;
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS discounts;
        DROP TABLE IF EXISTS inventory;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS categories;
        DROP TABLE IF EXISTS customers;
    `);

    // Create Tables with constraints
    db.exec(`
        CREATE TABLE customers (
            customer_id INTEGER NOT NULL PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            city TEXT NOT NULL,
            registration_date TEXT NOT NULL
        );

        CREATE TABLE categories (
            category_id INTEGER NOT NULL PRIMARY KEY,
            category_name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE products (
            product_id INTEGER NOT NULL PRIMARY KEY,
            product_name TEXT NOT NULL UNIQUE,
            category_id INTEGER NOT NULL,
            unit_price REAL NOT NULL CHECK (unit_price > 0),
            FOREIGN KEY (category_id) REFERENCES categories (category_id)
        );

        CREATE TABLE inventory (
            product_id INTEGER NOT NULL PRIMARY KEY,
            stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
            reorder_level INTEGER NOT NULL CHECK (reorder_level >= 0),
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );

        CREATE TABLE discounts (
            discount_id INTEGER NOT NULL PRIMARY KEY,
            discount_code TEXT NOT NULL UNIQUE,
            discount_rate REAL NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 1),
            valid_from TEXT NOT NULL,
            valid_to TEXT NOT NULL CHECK (valid_from <= valid_to)
        );

        CREATE TABLE orders (
            order_id INTEGER NOT NULL PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            discount_id INTEGER NOT NULL,
            order_date TEXT NOT NULL,
            order_status TEXT NOT NULL CHECK (order_status IN ('Placed', 'Shipped', 'Delivered', 'Cancelled')),
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
            FOREIGN KEY (discount_id) REFERENCES discounts (discount_id)
        );

        CREATE TABLE order_items (
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price REAL NOT NULL CHECK (unit_price > 0),
            PRIMARY KEY (order_id, product_id),
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );

        CREATE TABLE payments (
            payment_id INTEGER NOT NULL PRIMARY KEY,
            order_id INTEGER NOT NULL,
            payment_date TEXT NOT NULL,
            payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery')),
            amount REAL NOT NULL CHECK (amount > 0),
            payment_status TEXT NOT NULL CHECK (payment_status IN ('Completed', 'Pending', 'Failed', 'Refunded')),
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
        );

        CREATE TABLE deliveries (
            delivery_id INTEGER NOT NULL PRIMARY KEY,
            order_id INTEGER NOT NULL UNIQUE,
            courier_name TEXT NOT NULL,
            shipped_date TEXT NOT NULL,
            delivered_date TEXT NULL,
            delivery_status TEXT NOT NULL CHECK (delivery_status IN ('In Transit', 'Delivered')),
            CHECK (delivered_date IS NULL OR delivered_date >= shipped_date),
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
        );

        CREATE TABLE reviews (
            review_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            customer_city TEXT,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            title TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL,
            verified_purchase INTEGER DEFAULT 1,
            helpful_votes INTEGER DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );

        CREATE TABLE wishlists (
            wishlist_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            added_at TEXT NOT NULL,
            UNIQUE(customer_id, product_id),
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );

        CREATE TABLE addresses (
            address_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            street TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        );

        CREATE TABLE product_metadata (
            product_id INTEGER NOT NULL PRIMARY KEY,
            brand TEXT NOT NULL,
            original_price REAL NOT NULL,
            short_description TEXT NOT NULL,
            rating REAL DEFAULT 4.8,
            review_count INTEGER DEFAULT 24,
            badge TEXT,
            colors TEXT,
            sizes TEXT,
            specs TEXT,
            images TEXT,
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );
    `);

    console.log('[DB] Inserting seed data...');

    // Seed customers
    db.exec(`
        INSERT INTO customers (customer_id, first_name, last_name, email, phone, city, registration_date) VALUES
        (1, 'Aarav', 'Sharma', 'aarav.sharma@example.com', '9810011001', 'Delhi', '2026-01-10'),
        (2, 'Priya', 'Verma', 'priya.verma@example.com', '9820022002', 'Mumbai', '2026-01-18'),
        (3, 'Rohan', 'Gupta', 'rohan.gupta@example.com', '9830033003', 'Bengaluru', '2026-02-03'),
        (4, 'Ananya', 'Iyer', 'ananya.iyer@example.com', '9840044004', 'Chennai', '2026-02-14'),
        (5, 'Vikram', 'Singh', 'vikram.singh@example.com', '9850055005', 'Gurugram', '2026-03-02'),
        (6, 'Sneha', 'Patel', 'sneha.patel@example.com', '9860066006', 'Pune', '2026-03-19'),
        (7, 'Karan', 'Malhotra', 'karan.malhotra@example.com', '9870077007', 'Delhi', '2026-04-05'),
        (8, 'Neha', 'Reddy', 'neha.reddy@example.com', '9880088008', 'Hyderabad', '2026-04-21'),
        (9, 'Arjun', 'Nair', 'arjun.nair@example.com', '9890099009', 'Bengaluru', '2026-05-08'),
        (10, 'Kavya', 'Joshi', 'kavya.joshi@example.com', '9811010010', 'Jaipur', '2026-05-20'),
        (11, 'Rahul', 'Mehta', 'rahul.mehta@example.com', '9822020020', 'Mumbai', '2026-06-02'),
        (12, 'Divya', 'Banerjee', 'divya.banerjee@example.com', '9833030030', 'Kolkata', '2026-06-25'),
        (13, 'Manish', 'Yadav', 'manish.yadav@example.com', '9844040040', 'Lucknow', '2026-08-10'),
        (14, 'Pooja', 'Kapoor', 'pooja.kapoor@example.com', '9855050050', 'Delhi', '2026-09-15');
    `);

    // Seed categories
    db.exec(`
        INSERT INTO categories (category_id, category_name) VALUES
        (1, 'Electronics'),
        (2, 'Fashion'),
        (3, 'Home and Kitchen'),
        (4, 'Books'),
        (5, 'Sports and Fitness'),
        (6, 'Toys');
    `);

    // Seed products
    db.exec(`
        INSERT INTO products (product_id, product_name, category_id, unit_price) VALUES
        (1, 'Wireless Earbuds', 1, 2499.00),
        (2, 'Smartphone 128GB', 1, 18999.00),
        (3, 'Bluetooth Speaker', 1, 1999.00),
        (4, 'Laptop Backpack', 2, 1299.00),
        (5, 'Cotton T-Shirt', 2, 599.00),
        (6, 'Running Shoes', 5, 2999.00),
        (7, 'Denim Jacket', 2, 2199.00),
        (8, 'Air Fryer', 3, 4499.00),
        (9, 'Mixer Grinder', 3, 3299.00),
        (10, 'Non-stick Cookware Set', 3, 1899.00),
        (11, 'Database System Concepts', 4, 899.00),
        (12, 'Python Programming Guide', 4, 549.00),
        (13, 'Yoga Mat', 5, 799.00),
        (14, 'Dumbbell Set', 5, 1999.00),
        (15, 'Smart Watch', 1, 3999.00),
        (16, 'Table Lamp', 3, 999.00);
    `);

    // Seed inventory
    db.exec(`
        INSERT INTO inventory (product_id, stock_quantity, reorder_level) VALUES
        (1, 120, 20),
        (2, 35, 10),
        (3, 80, 15),
        (4, 60, 15),
        (5, 200, 40),
        (6, 45, 15),
        (7, 18, 20),
        (8, 25, 10),
        (9, 14, 15),
        (10, 40, 10),
        (11, 70, 20),
        (12, 90, 20),
        (13, 150, 30),
        (14, 12, 15),
        (15, 30, 10),
        (16, 55, 10);
    `);

    // Seed discounts
    db.exec(`
        INSERT INTO discounts (discount_id, discount_code, discount_rate, valid_from, valid_to) VALUES
        (1, 'NONE', 0.00, '2000-01-01', '2099-12-31'),
        (2, 'WELCOME10', 0.10, '2026-01-01', '2026-12-31'),
        (3, 'FESTIVE20', 0.20, '2026-10-01', '2026-11-15'),
        (4, 'SAVE15', 0.15, '2026-06-01', '2026-09-30'),
        (5, 'OLDSALE25', 0.25, '2025-11-01', '2025-12-31');
    `);

    // Seed orders
    db.exec(`
        INSERT INTO orders (order_id, customer_id, discount_id, order_date, order_status) VALUES
        (1, 1, 2, '2026-06-05', 'Delivered'),
        (2, 2, 2, '2026-06-12', 'Delivered'),
        (3, 3, 1, '2026-06-20', 'Delivered'),
        (4, 4, 2, '2026-06-28', 'Delivered'),
        (5, 5, 4, '2026-07-03', 'Delivered'),
        (6, 1, 4, '2026-07-09', 'Delivered'),
        (7, 6, 2, '2026-07-15', 'Delivered'),
        (8, 7, 1, '2026-07-22', 'Delivered'),
        (9, 2, 4, '2026-07-30', 'Delivered'),
        (10, 8, 2, '2026-08-04', 'Delivered'),
        (11, 3, 4, '2026-08-11', 'Delivered'),
        (12, 9, 2, '2026-08-18', 'Delivered'),
        (13, 1, 1, '2026-08-25', 'Delivered'),
        (14, 4, 4, '2026-09-02', 'Delivered'),
        (15, 10, 1, '2026-09-09', 'Delivered'),
        (16, 7, 4, '2026-09-16', 'Delivered'),
        (17, 11, 4, '2026-09-23', 'Delivered'),
        (18, 5, 4, '2026-09-29', 'Cancelled'),
        (19, 2, 3, '2026-10-04', 'Delivered'),
        (20, 1, 3, '2026-10-10', 'Delivered'),
        (21, 12, 3, '2026-10-14', 'Delivered'),
        (22, 7, 3, '2026-10-19', 'Delivered'),
        (23, 3, 3, '2026-10-25', 'Delivered'),
        (24, 8, 3, '2026-10-29', 'Cancelled'),
        (25, 4, 3, '2026-11-02', 'Delivered'),
        (26, 11, 3, '2026-11-15', 'Shipped'),
        (27, 6, 2, '2026-11-16', 'Shipped'),
        (28, 1, 1, '2026-11-17', 'Placed'),
        (29, 2, 1, '2026-11-18', 'Placed');
    `);

    // Seed order items
    db.exec(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
        (1, 1, 1, 2499.00),
        (1, 12, 1, 549.00),
        (2, 5, 2, 599.00),
        (2, 7, 1, 2199.00),
        (3, 2, 1, 18999.00),
        (4, 9, 1, 3299.00),
        (4, 10, 1, 1899.00),
        (5, 6, 1, 2999.00),
        (5, 13, 1, 799.00),
        (6, 3, 1, 1999.00),
        (6, 11, 1, 899.00),
        (7, 8, 1, 4499.00),
        (8, 15, 1, 3999.00),
        (8, 5, 1, 599.00),
        (9, 4, 1, 1299.00),
        (9, 13, 2, 799.00),
        (10, 1, 1, 2499.00),
        (10, 3, 1, 1999.00),
        (11, 11, 2, 899.00),
        (11, 12, 1, 549.00),
        (12, 14, 1, 1999.00),
        (13, 1, 1, 2499.00),
        (13, 15, 1, 3999.00),
        (14, 7, 1, 2199.00),
        (14, 5, 3, 599.00),
        (15, 2, 1, 18999.00),
        (16, 6, 1, 2999.00),
        (16, 14, 1, 1999.00),
        (17, 9, 1, 3299.00),
        (18, 8, 1, 4499.00),
        (19, 2, 1, 18999.00),
        (19, 3, 1, 1999.00),
        (20, 8, 1, 4499.00),
        (20, 10, 1, 1899.00),
        (21, 7, 2, 2199.00),
        (22, 15, 1, 3999.00),
        (22, 13, 1, 799.00),
        (23, 1, 1, 2499.00),
        (23, 3, 2, 1999.00),
        (24, 12, 2, 549.00),
        (24, 11, 1, 899.00),
        (25, 15, 1, 3999.00),
        (25, 14, 1, 1999.00),
        (26, 2, 1, 18999.00),
        (27, 5, 2, 599.00),
        (27, 4, 1, 1299.00),
        (28, 14, 1, 1999.00),
        (28, 13, 2, 799.00),
        (29, 6, 1, 2999.00);
    `);

    // Seed payments
    db.exec(`
        INSERT INTO payments (payment_id, order_id, payment_date, payment_method, amount, payment_status) VALUES
        (1, 1, '2026-06-05', 'UPI', 2743.20, 'Completed'),
        (2, 2, '2026-06-12', 'Credit Card', 3057.30, 'Completed'),
        (3, 3, '2026-06-20', 'Credit Card', 18999.00, 'Completed'),
        (4, 4, '2026-06-28', 'UPI', 4678.20, 'Completed'),
        (5, 5, '2026-07-03', 'Debit Card', 3228.30, 'Completed'),
        (6, 6, '2026-07-09', 'UPI', 2463.30, 'Completed'),
        (7, 7, '2026-07-15', 'Net Banking', 4049.10, 'Failed'),
        (8, 7, '2026-07-15', 'Credit Card', 4049.10, 'Completed'),
        (9, 8, '2026-07-22', 'Credit Card', 4598.00, 'Completed'),
        (10, 9, '2026-07-30', 'UPI', 2462.45, 'Completed'),
        (11, 10, '2026-08-04', 'Net Banking', 4048.20, 'Completed'),
        (12, 11, '2026-08-11', 'Debit Card', 1994.95, 'Completed'),
        (13, 12, '2026-08-18', 'UPI', 1799.10, 'Completed'),
        (14, 13, '2026-08-25', 'Credit Card', 6498.00, 'Completed'),
        (15, 14, '2026-09-02', 'UPI', 3396.60, 'Completed'),
        (16, 15, '2026-09-09', 'Credit Card', 18999.00, 'Completed'),
        (17, 16, '2026-09-16', 'Debit Card', 4248.30, 'Completed'),
        (18, 17, '2026-09-23', 'UPI', 2804.15, 'Completed'),
        (19, 18, '2026-09-29', 'UPI', 3824.15, 'Refunded'),
        (20, 19, '2026-10-04', 'UPI', 16798.40, 'Failed'),
        (21, 19, '2026-10-04', 'Credit Card', 16798.40, 'Completed'),
        (22, 20, '2026-10-10', 'Credit Card', 5118.40, 'Completed'),
        (23, 21, '2026-10-14', 'UPI', 3518.40, 'Completed'),
        (24, 22, '2026-10-19', 'Net Banking', 3838.40, 'Completed'),
        (25, 23, '2026-10-25', 'Credit Card', 5197.60, 'Completed'),
        (26, 24, '2026-10-29', 'Debit Card', 1597.60, 'Refunded'),
        (27, 25, '2026-11-02', 'UPI', 4798.40, 'Completed'),
        (28, 26, '2026-11-15', 'Cash on Delivery', 15199.20, 'Pending'),
        (29, 27, '2026-11-16', 'UPI', 2247.30, 'Completed'),
        (30, 28, '2026-11-17', 'Credit Card', 3597.00, 'Completed'),
        (31, 29, '2026-11-18', 'Cash on Delivery', 2999.00, 'Pending');
    `);

    // Seed deliveries
    db.exec(`
        INSERT INTO deliveries (delivery_id, order_id, courier_name, shipped_date, delivered_date, delivery_status) VALUES
        (1, 1, 'Blue Dart', '2026-06-06', '2026-06-08', 'Delivered'),
        (2, 2, 'Delhivery', '2026-06-14', '2026-06-17', 'Delivered'),
        (3, 3, 'Ecom Express', '2026-06-21', '2026-06-25', 'Delivered'),
        (4, 4, 'XpressBees', '2026-06-30', '2026-07-05', 'Delivered'),
        (5, 5, 'Blue Dart', '2026-07-04', '2026-07-06', 'Delivered'),
        (6, 6, 'Delhivery', '2026-07-11', '2026-07-14', 'Delivered'),
        (7, 7, 'Ecom Express', '2026-07-16', '2026-07-20', 'Delivered'),
        (8, 8, 'XpressBees', '2026-07-24', '2026-07-29', 'Delivered'),
        (9, 9, 'Blue Dart', '2026-07-31', '2026-08-02', 'Delivered'),
        (10, 10, 'Delhivery', '2026-08-06', '2026-08-09', 'Delivered'),
        (11, 11, 'Ecom Express', '2026-08-12', '2026-08-16', 'Delivered'),
        (12, 12, 'XpressBees', '2026-08-20', '2026-08-25', 'Delivered'),
        (13, 13, 'Blue Dart', '2026-08-26', '2026-08-28', 'Delivered'),
        (14, 14, 'Delhivery', '2026-09-04', '2026-09-07', 'Delivered'),
        (15, 15, 'Ecom Express', '2026-09-10', '2026-09-14', 'Delivered'),
        (16, 16, 'XpressBees', '2026-09-18', '2026-09-23', 'Delivered'),
        (17, 17, 'Blue Dart', '2026-09-24', '2026-09-26', 'Delivered'),
        (18, 19, 'Delhivery', '2026-10-06', '2026-10-09', 'Delivered'),
        (19, 20, 'Ecom Express', '2026-10-11', '2026-10-15', 'Delivered'),
        (20, 21, 'XpressBees', '2026-10-16', '2026-10-21', 'Delivered'),
        (21, 22, 'Blue Dart', '2026-10-20', '2026-10-22', 'Delivered'),
        (22, 23, 'Delhivery', '2026-10-27', '2026-10-30', 'Delivered'),
        (23, 25, 'Ecom Express', '2026-11-03', '2026-11-07', 'Delivered'),
        (24, 26, 'XpressBees', '2026-11-17', NULL, 'In Transit'),
        (25, 27, 'Blue Dart', '2026-11-17', NULL, 'In Transit');
    `);

    // Run DML Updates & Deletes as in SQL script
    db.exec(`
        UPDATE products
        SET unit_price = 2599.00
        WHERE product_id = 1;

        UPDATE inventory
        SET reorder_level = 25
        WHERE product_id = 8;

        DELETE FROM discounts
        WHERE discount_id = 5
        AND NOT EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.discount_id = discounts.discount_id
        );
    `);

    console.log('[DB] Creating analytical views...');

    // View 1: v_order_totals
    db.exec(`
        CREATE VIEW v_order_totals AS
        SELECT o.order_id,
               o.customer_id,
               o.order_date,
               o.order_status,
               d.discount_code,
               d.discount_rate,
               SUM(oi.quantity * oi.unit_price) AS gross_amount,
               SUM(oi.quantity * oi.unit_price) * (1 - d.discount_rate) AS net_amount
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.order_id
        INNER JOIN discounts d ON d.discount_id = o.discount_id
        GROUP BY o.order_id, o.customer_id, o.order_date, o.order_status, d.discount_code, d.discount_rate;
    `);

    // View 2: v_customer_purchases
    db.exec(`
        CREATE VIEW v_customer_purchases AS
        SELECT c.customer_id,
               c.first_name,
               c.last_name,
               c.city,
               o.order_id,
               o.order_date,
               cat.category_name,
               p.product_id,
               p.product_name,
               oi.quantity,
               oi.unit_price
        FROM customers c
        INNER JOIN orders o ON o.customer_id = c.customer_id
        INNER JOIN order_items oi ON oi.order_id = o.order_id
        INNER JOIN products p ON p.product_id = oi.product_id
        INNER JOIN categories cat ON cat.category_id = p.category_id
        WHERE o.order_status <> 'Cancelled';
    `);

    // View 3: v_product_sales
    db.exec(`
        CREATE VIEW v_product_sales AS
        SELECT product_id,
               product_name,
               category_name,
               SUM(quantity) AS units_sold,
               SUM(quantity * unit_price) AS revenue
        FROM v_customer_purchases
        GROUP BY product_id, product_name, category_name;
    `);

    // View 4: v_customer_summary
    db.exec(`
        CREATE VIEW v_customer_summary AS
        SELECT c.customer_id,
               c.first_name,
               c.last_name,
               c.city,
               COUNT(t.order_id) AS total_orders,
               COALESCE(SUM(t.net_amount), 0) AS total_spent,
               MIN(t.order_date) AS first_order_date,
               MAX(t.order_date) AS last_order_date
        FROM customers c
        LEFT JOIN v_order_totals t ON t.customer_id = c.customer_id AND t.order_status <> 'Cancelled'
        GROUP BY c.customer_id, c.first_name, c.last_name, c.city;
    `);

    console.log('[DB] Creating indexes...');
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders (customer_id, order_date);
        CREATE INDEX IF NOT EXISTS idx_customers_city ON customers (city);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (payment_status);
        CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
    `);

    console.log('[DB] Seeding product metadata, reviews, and customer addresses...');

    // Seed product metadata
    const metadataStmt = db.prepare(`
        INSERT INTO product_metadata (product_id, brand, original_price, short_description, rating, review_count, badge, colors, sizes, specs, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const productsMeta = [
        {
            id: 1,
            brand: 'Wyntox Audio',
            original: 3999.00,
            desc: 'Next-gen true wireless earbuds featuring adaptive hybrid ANC, 11mm graphene drivers, 36h quantum battery, and ultra-low latency gaming mode.',
            rating: 4.8,
            reviews: 142,
            badge: 'BESTSELLER',
            colors: ['Cyber Cyan', 'Matte Obsidian', 'Polar Silver'],
            sizes: ['One Size (3 Tip Sets)'],
            specs: { "Driver": "11mm Dual Graphene", "Battery": "36 Hours with Wireless Case", "Noise Cancellation": "Adaptive Hybrid ANC up to -45dB", "Water Resistance": "IPX7 Waterproof", "Connectivity": "Bluetooth 5.4 LE" },
            images: [
                'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 2,
            brand: 'Nexus Cyber',
            original: 24999.00,
            desc: 'Futuristic 5G flagship phone with 120Hz curved AMOLED, 108MP quantum camera sensor, neural AI processor, and 65W flash warp charging.',
            rating: 4.9,
            reviews: 380,
            badge: 'FLAGSHIP',
            colors: ['Electric Azure', 'Titanium Grey', 'Cosmic Violet'],
            sizes: ['128GB / 8GB RAM', '256GB / 12GB RAM'],
            specs: { "Display": "6.7\" Curved AMOLED 120Hz", "Processor": "Octa-Core Neural Snapdragon 8", "Camera": "108MP OIS Triple Array", "Battery": "5000mAh with 65W Warp Charge", "Network": "Dual 5G Standalone" },
            images: [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 3,
            brand: 'SonicPulse',
            original: 2999.00,
            desc: '360-degree immersive spatial audio speaker with dynamic cyber-RGB ring light, rugged waterproof silicone armor, and 24h play time.',
            rating: 4.7,
            reviews: 98,
            badge: 'TRENDING',
            colors: ['Neon Teal', 'Midnight Black', 'Laser Blue'],
            sizes: ['Compact 20W'],
            specs: { "Output": "20W RMS Spatial Audio", "Battery Life": "24 Hours Continuous", "Waterproof": "IPX7 Submersible", "Lighting": "Interactive RGB Bass Halo", "Weight": "540g" },
            images: [
                'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 4,
            brand: 'Vapor Urban',
            original: 1999.00,
            desc: 'Water-repellent ballistic nylon smart backpack with integrated USB-C passthrough charging port, anti-theft hidden zippers, and ergonomic air-mesh suspension.',
            rating: 4.6,
            reviews: 76,
            badge: 'SALE',
            colors: ['Stealth Charcoal', 'Cyber Heather', 'Tactical Olive'],
            sizes: ['25L Daily Carry', '35L Extended'],
            specs: { "Capacity": "25 Liters", "Laptop Sleeve": "Fits up to 16\" MacBook Pro", "Material": "1680D Ballistic Cordura", "Port": "Integrated USB-C Passthrough" },
            images: [
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 5,
            brand: 'AeroWeave',
            original: 999.00,
            desc: '100% combed organic Supima cotton tee with anti-odor silver thread tech, ultra-soft breathable weave, and tailored minimalist fit.',
            rating: 4.5,
            reviews: 210,
            badge: 'HOT',
            colors: ['Cyber Cyan', 'Deep Slate', 'Pure White', 'Crimson'],
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            specs: { "Fabric": "100% Organic Supima Cotton", "Weight": "220 GSM Heavyweight Soft", "Collar": "Ribbed Lay-Flat Neckline", "Care": "Pre-shrunk, Machine Wash" },
            images: [
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 6,
            brand: 'HyperStride',
            original: 4499.00,
            desc: 'Kinetic energy-return running shoes with carbon-fiber responsive propulsion plate, breathable knit upper, and anti-slip all-weather outsole.',
            rating: 4.9,
            reviews: 315,
            badge: 'BESTSELLER',
            colors: ['Neon Cyber Red', 'Phantom Black', 'Electric Volt'],
            sizes: ['7 UK', '8 UK', '9 UK', '10 UK', '11 UK'],
            specs: { "Plate": "Full-Length Carbon Composite", "Foam": "Supercritical Nitrogen Infused EVA", "Drop": "8mm Heel-to-Toe", "Weight": "215g (Size 9)" },
            images: [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 7,
            brand: 'UrbanCraft',
            original: 3299.00,
            desc: 'Heavyweight premium selvage denim jacket with vintage wash, reinforced matte steel rivets, and structured modern silhouette.',
            rating: 4.7,
            reviews: 64,
            badge: 'NEW',
            colors: ['Classic Indigo', 'Acid Washed', 'Midnight Onyx'],
            sizes: ['S', 'M', 'L', 'XL'],
            specs: { "Denim": "14.5 oz Japanese Ring-Spun Cotton", "Hardware": "Matte Gunmetal Alloy", "Fit": "Relaxed Modern Cut" },
            images: [
                'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 8,
            brand: 'ChefVortex',
            original: 6999.00,
            desc: 'Digital 5.5L rapid air fryer with 360-degree vortex thermal circulation, holographic glass touch control panel, 8 preset modes, and dishwasher-safe basket.',
            rating: 4.8,
            reviews: 158,
            badge: 'POPULAR',
            colors: ['Matte Black & Copper', 'Gloss Titanium'],
            sizes: ['5.5L Family Size'],
            specs: { "Power": "1700W High Efficiency", "Temperature": "80°C - 200°C Precision", "Capacity": "5.5 Liters", "Programs": "8 Intelligent Presets" },
            images: [
                'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 9,
            brand: 'PowerGrind',
            original: 4599.00,
            desc: '750W high-torque copper motor mixer grinder with 3 stainless steel jars, pulse control, and automated thermal overload protection.',
            rating: 4.6,
            reviews: 89,
            badge: 'SALE',
            colors: ['Graphite Silver', 'Crimson Metallic'],
            sizes: ['3-Jar Trio Set'],
            specs: { "Motor": "750W 100% Copper Core", "RPM": "21,000 RPM Max", "Jars": "1.5L Wet, 1.0L Dry, 0.4L Chutney", "Blades": "304 Stainless Steel Laser Cut" },
            images: [
                'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 10,
            brand: 'GourmetChef',
            original: 2999.00,
            desc: '3-piece scratch-resistant granite non-stick induction cookware set with cool-touch ergonomic bakelite handles and tempered glass lids.',
            rating: 4.7,
            reviews: 112,
            badge: 'VALUE BUNDLE',
            colors: ['Granite Grey', 'Ruby Red'],
            sizes: ['3-Piece Set (Pan, Kadai, Tawa)'],
            specs: { "Coating": "5-Layer German Greblon Non-Stick", "Base": "Turbo Induction Compatible", "Lids": "Steam-Vent Tempered Glass" },
            images: [
                'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 11,
            brand: 'McGraw Hill Academic',
            original: 1299.00,
            desc: 'Authoritative international textbook on relational database architectures, BCNF normalization proofs, concurrency control, ACID transactions, and query optimization.',
            rating: 4.9,
            reviews: 420,
            badge: 'CAPSTONE ESSENTIAL',
            colors: ['Academic Edition'],
            sizes: ['Paperback (7th Edition)', 'Hardcover Collector'],
            specs: { "Authors": "Silberschatz, Korth, Sudarshan", "Pages": "1376 Pages", "Coverage": "SQL DDL/DML, BCNF, ACID, Indexing, Window Functions" },
            images: [
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 12,
            brand: 'TechPress',
            original: 799.00,
            desc: 'Modern hands-on programming handbook covering Python backend REST APIs, asynchronous pipelines, database connectivity, and fullstack automation.',
            rating: 4.8,
            reviews: 330,
            badge: 'STUDENT CHOICE',
            colors: ['Standard Edition'],
            sizes: ['Paperback (600 Pages)'],
            specs: { "Language": "Python 3.12+", "Level": "Beginner to Advanced", "Format": "Full Color Code Listings" },
            images: [
                'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 13,
            brand: 'ZenFlex',
            original: 1299.00,
            desc: '6mm high-density eco-friendly TPE alignment yoga mat with dual non-slip textured grip, laser engraved alignment lines, and free carry strap.',
            rating: 4.7,
            reviews: 140,
            badge: 'ECO-FRIENDLY',
            colors: ['Ocean Teal', 'Lavender Lilac', 'Slate Grey'],
            sizes: ['183cm x 61cm (6mm Thick)'],
            specs: { "Material": "Non-Toxic Biodegradable TPE", "Thickness": "6mm Cushioning", "Grip": "Double-Sided Non-Slip Texture" },
            images: [
                'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 14,
            brand: 'IronForge',
            original: 2999.00,
            desc: 'Rubber-encased hexagonal dumbbell pair with knurled ergonomic chrome handle, roll-prevention hex architecture, and floor-safe coating.',
            rating: 4.8,
            reviews: 92,
            badge: 'BEST VALUE',
            colors: ['Matte Black Hex'],
            sizes: ['Pair of 5kg (10kg Total)', 'Pair of 7.5kg (15kg Total)'],
            specs: { "Core": "Solid Cast Iron", "Coating": "Heavy Duty Virgin Rubber", "Handle": "Ergonomic Knurled Steel" },
            images: [
                'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 15,
            brand: 'ChronoTech',
            original: 5999.00,
            desc: 'Futuristic aerospace titanium smartwatch with AMOLED sapphire glass display, SpO2 & ECG bio-sensors, Bluetooth calls, and 14-day quantum battery.',
            rating: 4.9,
            reviews: 275,
            badge: 'FUTURISTIC',
            colors: ['Cyber Cyan', 'Titanium Black', 'Silver Frost'],
            sizes: ['46mm Titanium Chassis'],
            specs: { "Display": "1.43\" Ultra AMOLED 466x466", "Chassis": "Grade 5 Aerospace Titanium", "Battery": "14 Days Quantum Saver Mode", "Sensors": "Heart Rate, SpO2, Sleep, ECG", "Water Resistance": "5ATM (50m Submersible)" },
            images: [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80'
            ]
        },
        {
            id: 16,
            brand: 'LuminaGlow',
            original: 1599.00,
            desc: 'Minimalist magnetic levitating LED bedside table lamp with stepless touch dimming, warm/cool dual-temperature mode, and 15W Qi wireless charging pad.',
            rating: 4.6,
            reviews: 88,
            badge: 'MODERN HOME',
            colors: ['Nordic White', 'Onyx Black', 'Walnut Wood'],
            sizes: ['Standard 15W Wireless Bedside'],
            specs: { "Illumination": "3000K-6000K Stepless CCT", "Charging Pad": "15W Fast Qi Wireless Base", "Switch": "Magnetic Sphere Touch Controller" },
            images: [
                'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'
            ]
        }
    ];

    for (const m of productsMeta) {
        metadataStmt.run(
            m.id,
            m.brand,
            m.original,
            m.desc,
            m.rating,
            m.reviews,
            m.badge,
            JSON.stringify(m.colors),
            JSON.stringify(m.sizes),
            JSON.stringify(m.specs),
            JSON.stringify(m.images)
        );
    }

    // Seed customer reviews
    const reviewStmt = db.prepare(`
        INSERT INTO reviews (product_id, customer_name, customer_city, rating, title, comment, created_at, verified_purchase, helpful_votes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const initialReviews = [
        { pid: 1, name: 'Aarav Sharma', city: 'Delhi', rating: 5, title: 'Incredible audio & ANC!', comment: 'The hybrid noise cancellation is sublime. Tested on my Delhi metro commute and all train clatter disappeared. Highly recommended.', date: '2026-06-10', verified: 1, helpful: 24 },
        { pid: 1, name: 'Priya Verma', city: 'Mumbai', rating: 5, title: 'Best earbuds in this price segment', comment: 'Battery easily lasts 3-4 days with the charging case. Sound profile has deep punchy sub-bass without overpowering vocals.', date: '2026-07-02', verified: 1, helpful: 18 },
        { pid: 2, name: 'Rohan Gupta', city: 'Bengaluru', rating: 5, title: 'Flawless 120Hz display & flagship speed', comment: 'The AMOLED screen is buttery smooth. Camera in night mode captured sharp details. Battery charges 0 to 100% in 35 minutes.', date: '2026-07-15', verified: 1, helpful: 42 },
        { pid: 2, name: 'Ananya Iyer', city: 'Chennai', rating: 5, title: 'Superb build quality', comment: 'Looks like a 50k smartphone. Lightweight, premium curved glass back, zero lag even with heavy multitasking.', date: '2026-08-01', verified: 1, helpful: 15 },
        { pid: 3, name: 'Vikram Singh', city: 'Gurugram', rating: 5, title: 'Booming sound and sick RGB glow!', comment: 'Took this on a road trip. The 360-degree sound projection filled our camp, and it survived splashes near the river perfectly.', date: '2026-07-20', verified: 1, helpful: 12 },
        { pid: 6, name: 'Arjun Nair', city: 'Bengaluru', rating: 5, title: 'Carbon plate makes a noticeable difference', comment: 'Shaved 40 seconds off my 5K run! The rebound from the carbon plate gives an effortless spring forward. Very breathable knit.', date: '2026-08-14', verified: 1, helpful: 31 },
        { pid: 8, name: 'Sneha Patel', city: 'Pune', rating: 5, title: 'Crispy fries with zero oil guilt', comment: 'We use this daily for paneer tikka, samosas, and roasted veggies. Clean up is easy because the basket is truly non-stick.', date: '2026-08-25', verified: 1, helpful: 29 },
        { pid: 11, name: 'Rahul Mehta', city: 'Mumbai', rating: 5, title: 'The Bible of Relational DBMS & BCNF', comment: 'Essential textbook for our DBMS capstone course. Chapter on Boyce-Codd Normal Form and ACID transaction atomicity is unmatched.', date: '2026-09-12', verified: 1, helpful: 50 },
        { pid: 15, name: 'Neha Reddy', city: 'Hyderabad', rating: 5, title: 'Futuristic look with outstanding battery', comment: 'The titanium finish looks very high-end. Always-on display is bright even in direct sunlight. SpO2 and heart tracking match my medical monitor.', date: '2026-09-28', verified: 1, helpful: 22 }
    ];

    for (const r of initialReviews) {
        reviewStmt.run(r.pid, r.name, r.city, r.rating, r.title, r.comment, r.date, r.verified, r.helpful);
    }

    // Seed customer default addresses
    const addrStmt = db.prepare(`
        INSERT INTO addresses (customer_id, title, street, city, state, pincode, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const customerAddresses = [
        { cid: 1, title: 'Home', street: '42 Cyber Enclave, Saket', city: 'Delhi', state: 'Delhi', pincode: '110017', def: 1 },
        { cid: 2, title: 'Residence', street: '104 Marine Drive Heights', city: 'Mumbai', state: 'Maharashtra', pincode: '400020', def: 1 },
        { cid: 3, title: 'Apartment', street: '88 Indiranagar 100ft Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', def: 1 },
        { cid: 4, title: 'Home', street: '15 Anna Nagar 3rd Avenue', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', def: 1 },
        { cid: 5, title: 'Tech Hub Office', street: 'Tower B, Cyber City DLF Phase 2', city: 'Gurugram', state: 'Haryana', pincode: '122002', def: 1 }
    ];

    for (const a of customerAddresses) {
        addrStmt.run(a.cid, a.title, a.street, a.city, a.state, a.pincode, a.def);
    }

    console.log('[DB] Database successfully initialized with all tables, constraints, views, and seed data!');
    return db;
}

module.exports = {
    getDatabase,
    initializeDatabase,
    DB_PATH
};

if (require.main === module) {
    initializeDatabase();
}
