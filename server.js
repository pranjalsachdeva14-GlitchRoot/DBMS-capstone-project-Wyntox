// server.js - Fullstack E-Commerce & Analytics Platform Server
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { getDatabase, initializeDatabase, DB_PATH } = require('./db');
const predefinedQueries = require('./queries');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure database is initialized on startup
let db;
try {
    db = getDatabase();
    // Quick test if tables exist
    const test = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='customers';").get();
    if (!test || test.count === 0) {
        db = initializeDatabase();
    }
} catch (err) {
    console.log('[Server] Initializing fresh database...');
    db = initializeDatabase();
}

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role'
    });
    res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON payload: ' + err.message));
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS for all requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role'
        });
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = req.method;

    console.log(`[HTTP] ${method} ${pathname}`);

    try {
        // --- API ROUTES ---

        // Health Check
        if (pathname === '/api/health' && method === 'GET') {
            return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
        }

        // --- AUTHENTICATION & ROLE-BASED ACCESS CONTROL (DCL) ---

        // User Login
        if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseJsonBody(req);
            const username = (body.username || '').trim();
            const password = (body.password || '').trim();

            if (!username) {
                return sendJson(res, 400, { error: 'Username or email is required.' });
            }

            // 1. Check DCL Staff Accounts (from syllabus specification)
            if (username === 'ecom_admin' && (password === 'Admin@2026' || password === 'admin')) {
                return sendJson(res, 200, {
                    success: true,
                    user: {
                        username: 'ecom_admin',
                        name: 'System Administrator',
                        role: 'ecom_admin',
                        roleTitle: 'Administrator',
                        roleBadge: 'ecom_admin_role',
                        permissions: 'ALL PRIVILEGES ON ecommerce_analytics.*'
                    },
                    message: 'Welcome back, Administrator!'
                });
            }

            if (username === 'ecom_analyst' && (password === 'Analyst@2026' || password === 'analyst')) {
                return sendJson(res, 200, {
                    success: true,
                    user: {
                        username: 'ecom_analyst',
                        name: 'Lead Data Analyst',
                        role: 'ecom_analyst',
                        roleTitle: 'Data Analyst',
                        roleBadge: 'ecom_analyst_role',
                        permissions: 'SELECT ON ecommerce_analytics.*'
                    },
                    message: 'Welcome back, Data Analyst!'
                });
            }

            if (username === 'ecom_support' && (password === 'Support@2026' || password === 'support')) {
                return sendJson(res, 200, {
                    success: true,
                    user: {
                        username: 'ecom_support',
                        name: 'Support Specialist',
                        role: 'ecom_support',
                        roleTitle: 'Customer Support',
                        roleBadge: 'ecom_support_role',
                        permissions: 'SELECT on customers/orders/payments, SELECT/UPDATE on deliveries'
                    },
                    message: 'Welcome back, Support Specialist!'
                });
            }

            // 2. Check Customer Accounts in Database
            const customer = db.prepare(`
                SELECT customer_id, first_name, last_name, email, phone, city, registration_date
                FROM customers
                WHERE LOWER(email) = LOWER(?) OR phone = ? OR LOWER(first_name || ' ' || last_name) = LOWER(?);
            `).get(username, username, username);

            if (customer) {
                // If customer account, allow login (default customer password or any password for testing convenience)
                return sendJson(res, 200, {
                    success: true,
                    user: {
                        customer_id: customer.customer_id,
                        username: customer.email,
                        name: `${customer.first_name} ${customer.last_name}`,
                        email: customer.email,
                        phone: customer.phone,
                        city: customer.city,
                        role: 'customer',
                        roleTitle: 'Customer',
                        roleBadge: 'Shopper',
                        permissions: 'Personal Order Placement & History'
                    },
                    message: `Welcome back, ${customer.first_name}!`
                });
            }

            return sendJson(res, 401, {
                error: 'Invalid username/email or password.',
                hint: 'Try: ecom_admin (Admin@2026), ecom_analyst (Analyst@2026), ecom_support (Support@2026), or aarav.sharma@example.com (any password)'
            });
        }

        // Customer Registration
        if (pathname === '/api/auth/register' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { first_name, last_name, email, phone, city } = body;

            if (!first_name || !last_name || !email || !phone || !city) {
                return sendJson(res, 400, { error: 'All fields (first_name, last_name, email, phone, city) are required.' });
            }

            // Check if email already exists
            const existingEmail = db.prepare('SELECT 1 FROM customers WHERE LOWER(email) = LOWER(?);').get(email);
            if (existingEmail) {
                return sendJson(res, 400, { error: `Email address '${email}' is already registered.` });
            }

            // Check if phone already exists
            const existingPhone = db.prepare('SELECT 1 FROM customers WHERE phone = ?;').get(phone);
            if (existingPhone) {
                return sendJson(res, 400, { error: `Phone number '${phone}' is already registered.` });
            }

            const maxId = db.prepare('SELECT MAX(customer_id) as maxId FROM customers;').get();
            const newId = (maxId.maxId || 0) + 1;
            const regDate = new Date().toISOString().split('T')[0];

            db.prepare(`
                INSERT INTO customers (customer_id, first_name, last_name, email, phone, city, registration_date)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            `).run(newId, first_name, last_name, email, phone, city, regDate);

            const newCustomer = db.prepare('SELECT * FROM customers WHERE customer_id = ?;').get(newId);

            return sendJson(res, 201, {
                success: true,
                user: {
                    customer_id: newCustomer.customer_id,
                    username: newCustomer.email,
                    name: `${newCustomer.first_name} ${newCustomer.last_name}`,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    city: newCustomer.city,
                    role: 'customer',
                    roleTitle: 'Customer',
                    roleBadge: 'Shopper',
                    permissions: 'Personal Order Placement & History'
                },
                message: `Account created successfully! Welcome, ${newCustomer.first_name}.`
            });
        }

        // Database Reset
        if (pathname === '/api/database/reset' && method === 'POST') {
            db = initializeDatabase();
            return sendJson(res, 200, { success: true, message: 'Database reset to original seed data!' });
        }

        // Schema & BCNF Information
        if (pathname === '/api/schema' && method === 'GET') {
            const tables = [
                { name: 'customers', pk: 'customer_id', fks: [], uqs: ['email', 'phone'], checks: [] },
                { name: 'categories', pk: 'category_id', fks: [], uqs: ['category_name'], checks: [] },
                { name: 'products', pk: 'product_id', fks: ['category_id -> categories.category_id'], uqs: ['product_name'], checks: ['unit_price > 0'] },
                { name: 'inventory', pk: 'product_id', fks: ['product_id -> products.product_id'], uqs: [], checks: ['stock_quantity >= 0', 'reorder_level >= 0'] },
                { name: 'discounts', pk: 'discount_id', fks: [], uqs: ['discount_code'], checks: ['discount_rate BETWEEN 0 AND 1', 'valid_from <= valid_to'] },
                { name: 'orders', pk: 'order_id', fks: ['customer_id -> customers.customer_id', 'discount_id -> discounts.discount_id'], uqs: [], checks: ["order_status IN ('Placed','Shipped','Delivered','Cancelled')"] },
                { name: 'order_items', pk: '(order_id, product_id)', fks: ['order_id -> orders.order_id', 'product_id -> products.product_id'], uqs: [], checks: ['quantity > 0', 'unit_price > 0'] },
                { name: 'payments', pk: 'payment_id', fks: ['order_id -> orders.order_id'], uqs: [], checks: ['amount > 0', 'payment_method ENUM', 'payment_status ENUM'] },
                { name: 'deliveries', pk: 'delivery_id', fks: ['order_id -> orders.order_id (UNIQUE)'], uqs: ['order_id'], checks: ['delivered_date IS NULL OR delivered_date >= shipped_date'] }
            ];

            const views = ['v_order_totals', 'v_customer_purchases', 'v_product_sales', 'v_customer_summary'];
            const indexes = ['idx_orders_order_date', 'idx_orders_customer_date', 'idx_customers_city', 'idx_payments_status', 'idx_order_items_product'];

            return sendJson(res, 200, {
                databaseName: 'ecommerce_analytics',
                normalForm: 'Boyce-Codd Normal Form (BCNF)',
                tables,
                views,
                indexes,
                normalizationProof: {
                    '1NF': 'All attributes contain atomic values; composite order line items decomposed into discrete order_items rows.',
                    '2NF': 'Eliminated partial key dependencies by using single surrogate PKs, or composite PK (order_id, product_id) where quantity and unit_price depend strictly on both components.',
                    '3NF': 'Eliminated all transitive dependencies (e.g., category_name depends strictly on category_id, not on product_id; customer city depends strictly on customer_id).',
                    'BCNF': 'For every non-trivial functional dependency X -> Y across all tables, X is a superkey (e.g. email in customers, discount_code in discounts, order_id in payments & deliveries).'
                }
            });
        }

        // Product Catalog (with category, inventory, metadata, reviews, and advanced filtering)
        if (pathname === '/api/products' && method === 'GET') {
            let sql = `
                SELECT p.product_id,
                       p.product_name,
                       p.unit_price,
                       p.category_id,
                       c.category_name,
                       i.stock_quantity,
                       i.reorder_level,
                       CASE
                           WHEN i.stock_quantity = 0 THEN 'Out of Stock'
                           WHEN i.stock_quantity <= i.reorder_level THEN 'Low Stock'
                           ELSE 'In Stock'
                       END AS stock_status,
                       COALESCE(s.units_sold, 0) AS units_sold,
                       COALESCE(s.revenue, 0) AS revenue,
                       COALESCE(m.brand, 'OmniTech') AS brand,
                       COALESCE(m.original_price, ROUND(p.unit_price * 1.35, 2)) AS original_price,
                       COALESCE(m.short_description, 'Next-generation high performance product engineered for premium reliability.') AS short_description,
                       COALESCE(m.rating, 4.8) AS rating,
                       COALESCE(m.review_count, 28) AS review_count,
                       COALESCE(m.badge, 'FEATURED') AS badge,
                       m.colors,
                       m.sizes,
                       m.specs,
                       m.images
                FROM products p
                INNER JOIN categories c ON c.category_id = p.category_id
                INNER JOIN inventory i ON i.product_id = p.product_id
                LEFT JOIN v_product_sales s ON s.product_id = p.product_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                WHERE 1=1
            `;
            const params = [];

            if (query.categoryId) {
                sql += ` AND p.category_id = ?`;
                params.push(Number(query.categoryId));
            }
            if (query.search) {
                sql += ` AND (p.product_name LIKE ? OR c.category_name LIKE ? OR m.brand LIKE ? OR m.short_description LIKE ?)`;
                const s = `%${query.search}%`;
                params.push(s, s, s, s);
            }
            if (query.brand) {
                sql += ` AND LOWER(m.brand) = LOWER(?)`;
                params.push(query.brand);
            }
            if (query.minPrice) {
                sql += ` AND p.unit_price >= ?`;
                params.push(Number(query.minPrice));
            }
            if (query.maxPrice) {
                sql += ` AND p.unit_price <= ?`;
                params.push(Number(query.maxPrice));
            }
            if (query.minRating) {
                sql += ` AND COALESCE(m.rating, 4.5) >= ?`;
                params.push(Number(query.minRating));
            }
            if (query.stockFilter) {
                if (query.stockFilter === 'low') {
                    sql += ` AND i.stock_quantity <= i.reorder_level`;
                } else if (query.stockFilter === 'out') {
                    sql += ` AND i.stock_quantity = 0`;
                } else if (query.stockFilter === 'in') {
                    sql += ` AND i.stock_quantity > i.reorder_level`;
                }
            }

            // Sorting
            const sort = query.sort || 'default';
            if (sort === 'price_asc') {
                sql += ` ORDER BY p.unit_price ASC`;
            } else if (sort === 'price_desc') {
                sql += ` ORDER BY p.unit_price DESC`;
            } else if (sort === 'best_selling') {
                sql += ` ORDER BY units_sold DESC, p.product_id ASC`;
            } else if (sort === 'rating') {
                sql += ` ORDER BY rating DESC, review_count DESC`;
            } else if (sort === 'newest') {
                sql += ` ORDER BY p.product_id DESC`;
            } else {
                sql += ` ORDER BY p.product_id ASC`;
            }

            const products = db.prepare(sql).all(...params).map(prod => {
                let parsedColors = ['Default'];
                let parsedSizes = [];
                let parsedSpecs = {};
                let parsedImages = [];
                try { if (prod.colors) parsedColors = JSON.parse(prod.colors); } catch(e){}
                try { if (prod.sizes) parsedSizes = JSON.parse(prod.sizes); } catch(e){}
                try { if (prod.specs) parsedSpecs = JSON.parse(prod.specs); } catch(e){}
                try { if (prod.images) parsedImages = JSON.parse(prod.images); } catch(e){}
                return {
                    ...prod,
                    colors: parsedColors,
                    sizes: parsedSizes,
                    specs: parsedSpecs,
                    images: parsedImages,
                    discount_percentage: Math.round(((prod.original_price - prod.unit_price) / prod.original_price) * 100)
                };
            });

            return sendJson(res, 200, products);
        }

        // Distinct Brands List
        if (pathname === '/api/brands' && method === 'GET') {
            const brands = db.prepare(`SELECT DISTINCT brand FROM product_metadata WHERE brand IS NOT NULL ORDER BY brand ASC;`).all().map(b => b.brand);
            return sendJson(res, 200, brands);
        }

        // Single Product Detail
        const singleProductMatch = pathname.match(/^\/api\/products\/(\d+)$/);
        if (singleProductMatch && method === 'GET') {
            const prodId = Number(singleProductMatch[1]);
            const prod = db.prepare(`
                SELECT p.product_id,
                       p.product_name,
                       p.unit_price,
                       p.category_id,
                       c.category_name,
                       i.stock_quantity,
                       i.reorder_level,
                       CASE
                           WHEN i.stock_quantity = 0 THEN 'Out of Stock'
                           WHEN i.stock_quantity <= i.reorder_level THEN 'Low Stock'
                           ELSE 'In Stock'
                       END AS stock_status,
                       COALESCE(s.units_sold, 0) AS units_sold,
                       COALESCE(s.revenue, 0) AS revenue,
                       COALESCE(m.brand, 'OmniTech') AS brand,
                       COALESCE(m.original_price, ROUND(p.unit_price * 1.35, 2)) AS original_price,
                       COALESCE(m.short_description, 'Next-generation high performance product engineered for premium reliability.') AS short_description,
                       COALESCE(m.rating, 4.8) AS rating,
                       COALESCE(m.review_count, 28) AS review_count,
                       COALESCE(m.badge, 'FEATURED') AS badge,
                       m.colors,
                       m.sizes,
                       m.specs,
                       m.images
                FROM products p
                INNER JOIN categories c ON c.category_id = p.category_id
                INNER JOIN inventory i ON i.product_id = p.product_id
                LEFT JOIN v_product_sales s ON s.product_id = p.product_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                WHERE p.product_id = ?;
            `).get(prodId);

            if (!prod) {
                return sendJson(res, 404, { error: 'Product not found' });
            }

            let parsedColors = ['Default'];
            let parsedSizes = [];
            let parsedSpecs = {};
            let parsedImages = [];
            try { if (prod.colors) parsedColors = JSON.parse(prod.colors); } catch(e){}
            try { if (prod.sizes) parsedSizes = JSON.parse(prod.sizes); } catch(e){}
            try { if (prod.specs) parsedSpecs = JSON.parse(prod.specs); } catch(e){}
            try { if (prod.images) parsedImages = JSON.parse(prod.images); } catch(e){}

            // Fetch reviews
            const reviews = db.prepare(`
                SELECT review_id, customer_name, customer_city, rating, title, comment, created_at, verified_purchase, helpful_votes
                FROM reviews
                WHERE product_id = ?
                ORDER BY review_id DESC;
            `).all(prodId);

            // Related products in same category
            const related = db.prepare(`
                SELECT p.product_id, p.product_name, p.unit_price, c.category_name, COALESCE(m.rating, 4.8) as rating, m.images
                FROM products p
                INNER JOIN categories c ON c.category_id = p.category_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                WHERE p.category_id = ? AND p.product_id <> ?
                LIMIT 4;
            `).all(prod.category_id, prodId).map(r => {
                let imgs = [];
                try { if (r.images) imgs = JSON.parse(r.images); } catch(e){}
                return { ...r, image: imgs[0] || '' };
            });

            return sendJson(res, 200, {
                ...prod,
                colors: parsedColors,
                sizes: parsedSizes,
                specs: parsedSpecs,
                images: parsedImages,
                discount_percentage: Math.round(((prod.original_price - prod.unit_price) / prod.original_price) * 100),
                reviews,
                related
            });
        }

        // Add New Product (Admin)
        if (pathname === '/api/products' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { product_name, category_id, unit_price, stock_quantity, reorder_level, brand, short_description, badge, images } = body;

            if (!product_name || !category_id || !unit_price) {
                return sendJson(res, 400, { error: 'product_name, category_id, and unit_price are required.' });
            }

            db.exec('BEGIN TRANSACTION;');
            try {
                const maxId = db.prepare('SELECT MAX(product_id) as maxId FROM products;').get().maxId || 0;
                const newProductId = maxId + 1;

                db.prepare(`
                    INSERT INTO products (product_id, product_name, category_id, unit_price)
                    VALUES (?, ?, ?, ?);
                `).run(newProductId, product_name, Number(category_id), Number(unit_price));

                db.prepare(`
                    INSERT INTO inventory (product_id, stock_quantity, reorder_level)
                    VALUES (?, ?, ?);
                `).run(newProductId, Number(stock_quantity) || 50, Number(reorder_level) || 10);

                const brandName = brand || 'Wyntox Prime';
                const origPrice = Number((Number(unit_price) * 1.3).toFixed(2));
                const imgArray = Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'];

                db.prepare(`
                    INSERT INTO product_metadata (product_id, brand, original_price, short_description, rating, review_count, badge, colors, sizes, specs, images)
                    VALUES (?, ?, ?, ?, 5.0, 1, ?, '["Standard"]', '["Default"]', '{}', ?);
                `).run(newProductId, brandName, origPrice, short_description || 'High-performance futuristic hardware.', badge || 'NEW', JSON.stringify(imgArray));

                db.exec('COMMIT;');
                return sendJson(res, 201, { success: true, product_id: newProductId, message: `Product "${product_name}" created successfully!` });
            } catch (err) {
                db.exec('ROLLBACK;');
                return sendJson(res, 400, { error: err.message });
            }
        }

        // Update Product (Admin)
        if (singleProductMatch && method === 'PUT') {
            const prodId = Number(singleProductMatch[1]);
            const body = await parseJsonBody(req);
            const { product_name, unit_price, stock_quantity, reorder_level, category_id, brand, badge } = body;

            db.exec('BEGIN TRANSACTION;');
            try {
                if (product_name || unit_price || category_id) {
                    const current = db.prepare('SELECT * FROM products WHERE product_id = ?;').get(prodId);
                    if (!current) throw new Error('Product not found');

                    db.prepare(`
                        UPDATE products
                        SET product_name = COALESCE(?, product_name),
                            unit_price = COALESCE(?, unit_price),
                            category_id = COALESCE(?, category_id)
                        WHERE product_id = ?;
                    `).run(product_name || null, unit_price !== undefined ? Number(unit_price) : null, category_id ? Number(category_id) : null, prodId);
                }

                if (stock_quantity !== undefined || reorder_level !== undefined) {
                    db.prepare(`
                        UPDATE inventory
                        SET stock_quantity = COALESCE(?, stock_quantity),
                            reorder_level = COALESCE(?, reorder_level)
                        WHERE product_id = ?;
                    `).run(stock_quantity !== undefined ? Number(stock_quantity) : null, reorder_level !== undefined ? Number(reorder_level) : null, prodId);
                }

                if (brand || badge) {
                    db.prepare(`
                        UPDATE product_metadata
                        SET brand = COALESCE(?, brand),
                            badge = COALESCE(?, badge)
                        WHERE product_id = ?;
                    `).run(brand || null, badge || null, prodId);
                }

                db.exec('COMMIT;');
                return sendJson(res, 200, { success: true, message: `Product #${prodId} updated successfully!` });
            } catch (err) {
                db.exec('ROLLBACK;');
                return sendJson(res, 400, { error: err.message });
            }
        }

        // Delete Product (Admin)
        if (singleProductMatch && method === 'DELETE') {
            const prodId = Number(singleProductMatch[1]);
            // Check if product has orders
            const orderCheck = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?;').get(prodId);
            if (orderCheck && orderCheck.count > 0) {
                return sendJson(res, 400, { error: `Cannot delete Product #${prodId}: It is associated with ${orderCheck.count} historical order line items (Referential Integrity Constraint).` });
            }

            db.exec('BEGIN TRANSACTION;');
            try {
                db.prepare('DELETE FROM reviews WHERE product_id = ?;').run(prodId);
                db.prepare('DELETE FROM wishlists WHERE product_id = ?;').run(prodId);
                db.prepare('DELETE FROM product_metadata WHERE product_id = ?;').run(prodId);
                db.prepare('DELETE FROM inventory WHERE product_id = ?;').run(prodId);
                db.prepare('DELETE FROM products WHERE product_id = ?;').run(prodId);
                db.exec('COMMIT;');
                return sendJson(res, 200, { success: true, message: `Product #${prodId} safely deleted.` });
            } catch (err) {
                db.exec('ROLLBACK;');
                return sendJson(res, 400, { error: err.message });
            }
        }

        // Product Reviews (GET / POST)
        const reviewsMatch = pathname.match(/^\/api\/products\/(\d+)\/reviews$/);
        if (reviewsMatch && method === 'GET') {
            const prodId = Number(reviewsMatch[1]);
            const reviews = db.prepare(`SELECT * FROM reviews WHERE product_id = ? ORDER BY review_id DESC;`).all(prodId);
            return sendJson(res, 200, reviews);
        }

        if (reviewsMatch && method === 'POST') {
            const prodId = Number(reviewsMatch[1]);
            const body = await parseJsonBody(req);
            const { customer_name, customer_city, rating, title, comment } = body;

            if (!customer_name || !rating || !title || !comment) {
                return sendJson(res, 400, { error: 'customer_name, rating, title, and comment are required.' });
            }

            const today = new Date().toISOString().split('T')[0];
            db.prepare(`
                INSERT INTO reviews (product_id, customer_name, customer_city, rating, title, comment, created_at, verified_purchase, helpful_votes)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0);
            `).run(prodId, customer_name, customer_city || 'Verified Buyer', Number(rating), title, comment, today);

            // Recompute average rating and review count
            const avgStats = db.prepare(`SELECT AVG(rating) as avgRating, COUNT(*) as countReviews FROM reviews WHERE product_id = ?;`).get(prodId);
            if (avgStats) {
                db.prepare(`
                    UPDATE product_metadata
                    SET rating = ROUND(?, 1), review_count = ?
                    WHERE product_id = ?;
                `).run(avgStats.avgRating || rating, avgStats.countReviews || 1, prodId);
            }

            return sendJson(res, 201, { success: true, message: 'Review submitted successfully!' });
        }

        // Wishlist API (GET, POST, DELETE)
        if (pathname === '/api/wishlist' && method === 'GET') {
            const customerId = Number(query.customer_id) || 1;
            const wishlistItems = db.prepare(`
                SELECT w.wishlist_id, w.product_id, w.added_at, p.product_name, p.unit_price, c.category_name, i.stock_quantity,
                       COALESCE(m.brand, 'Wyntox') as brand, COALESCE(m.rating, 4.8) as rating, m.images
                FROM wishlists w
                INNER JOIN products p ON p.product_id = w.product_id
                INNER JOIN categories c ON c.category_id = p.category_id
                INNER JOIN inventory i ON i.product_id = p.product_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                WHERE w.customer_id = ?
                ORDER BY w.wishlist_id DESC;
            `).all(customerId).map(item => {
                let imgs = [];
                try { if (item.images) imgs = JSON.parse(item.images); } catch(e){}
                return { ...item, image: imgs[0] || '' };
            });
            return sendJson(res, 200, wishlistItems);
        }

        if (pathname === '/api/wishlist' && method === 'POST') {
            const body = await parseJsonBody(req);
            const customerId = Number(body.customer_id) || 1;
            const productId = Number(body.product_id);

            if (!productId) return sendJson(res, 400, { error: 'product_id is required' });

            const existing = db.prepare('SELECT wishlist_id FROM wishlists WHERE customer_id = ? AND product_id = ?;').get(customerId, productId);
            if (existing) {
                db.prepare('DELETE FROM wishlists WHERE wishlist_id = ?;').run(existing.wishlist_id);
                return sendJson(res, 200, { inWishlist: false, message: 'Product removed from wishlist.' });
            } else {
                const today = new Date().toISOString().split('T')[0];
                db.prepare('INSERT INTO wishlists (customer_id, product_id, added_at) VALUES (?, ?, ?);').run(customerId, productId, today);
                return sendJson(res, 201, { inWishlist: true, message: 'Product saved to your wishlist!' });
            }
        }

        // Customer Addresses API
        if (pathname === '/api/user/addresses' && method === 'GET') {
            const customerId = Number(query.customer_id) || 1;
            const addrs = db.prepare('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, address_id ASC;').all(customerId);
            return sendJson(res, 200, addrs);
        }

        if (pathname === '/api/user/addresses' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { customer_id, title, street, city, state, pincode, is_default } = body;
            if (!customer_id || !title || !street || !city || !state || !pincode) {
                return sendJson(res, 400, { error: 'All address fields are required.' });
            }
            if (is_default) {
                db.prepare('UPDATE addresses SET is_default = 0 WHERE customer_id = ?;').run(customer_id);
            }
            db.prepare(`
                INSERT INTO addresses (customer_id, title, street, city, state, pincode, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            `).run(customer_id, title, street, city, state, pincode, is_default ? 1 : 0);
            return sendJson(res, 201, { success: true, message: 'Address added successfully.' });
        }

        // Smart Recommendations API
        if (pathname === '/api/recommendations' && method === 'GET') {
            const topRated = db.prepare(`
                SELECT p.product_id, p.product_name, p.unit_price, c.category_name, m.brand, m.rating, m.badge, m.images
                FROM products p
                INNER JOIN categories c ON c.category_id = p.category_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                ORDER BY COALESCE(m.rating, 0) DESC, p.product_id ASC
                LIMIT 4;
            `).all().map(p => {
                let imgs = [];
                try { if (p.images) imgs = JSON.parse(p.images); } catch(e){}
                return { ...p, image: imgs[0] || '' };
            });

            const trending = db.prepare(`
                SELECT p.product_id, p.product_name, p.unit_price, c.category_name, m.brand, COALESCE(s.units_sold, 0) as units_sold, m.images
                FROM products p
                INNER JOIN categories c ON c.category_id = p.category_id
                LEFT JOIN v_product_sales s ON s.product_id = p.product_id
                LEFT JOIN product_metadata m ON m.product_id = p.product_id
                ORDER BY units_sold DESC
                LIMIT 4;
            `).all().map(p => {
                let imgs = [];
                try { if (p.images) imgs = JSON.parse(p.images); } catch(e){}
                return { ...p, image: imgs[0] || '' };
            });

            return sendJson(res, 200, { topRated, trending });
        }

        // Create Coupon (Admin)
        if (pathname === '/api/coupons' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { discount_code, discount_rate, valid_from, valid_to } = body;
            if (!discount_code || discount_rate === undefined || !valid_from || !valid_to) {
                return sendJson(res, 400, { error: 'discount_code, discount_rate (0-1), valid_from, valid_to are required.' });
            }
            const maxId = db.prepare('SELECT MAX(discount_id) as maxId FROM discounts;').get().maxId || 0;
            const newDiscountId = maxId + 1;
            db.prepare(`
                INSERT INTO discounts (discount_id, discount_code, discount_rate, valid_from, valid_to)
                VALUES (?, ?, ?, ?, ?);
            `).run(newDiscountId, discount_code.toUpperCase().trim(), Number(discount_rate), valid_from, valid_to);
            return sendJson(res, 201, { success: true, discount_id: newDiscountId, message: `Coupon ${discount_code} created!` });
        }

        // Categories List
        if (pathname === '/api/categories' && method === 'GET') {
            const categories = db.prepare(`
                SELECT c.category_id,
                       c.category_name,
                       COUNT(p.product_id) AS product_count
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.category_id
                GROUP BY c.category_id, c.category_name
                ORDER BY c.category_id ASC;
            `).all();
            return sendJson(res, 200, categories);
        }

        // Discounts List & Validation
        if (pathname === '/api/discounts' && method === 'GET') {
            const discounts = db.prepare(`
                SELECT d.discount_id,
                       d.discount_code,
                       d.discount_rate,
                       d.valid_from,
                       d.valid_to,
                       COUNT(o.order_id) AS usage_count
                FROM discounts d
                LEFT JOIN orders o ON o.discount_id = d.discount_id
                GROUP BY d.discount_id, d.discount_code, d.discount_rate
                ORDER BY d.discount_id ASC;
            `).all();
            return sendJson(res, 200, discounts);
        }

        if (pathname === '/api/discounts/validate' && method === 'POST') {
            const body = await parseJsonBody(req);
            const code = (body.code || '').trim().toUpperCase();
            const today = body.date || new Date().toISOString().split('T')[0];

            if (!code) {
                return sendJson(res, 400, { valid: false, message: 'Please enter a coupon code.' });
            }

            const discount = db.prepare(`SELECT * FROM discounts WHERE UPPER(discount_code) = ?;`).get(code);

            if (!discount) {
                return sendJson(res, 404, { valid: false, message: `Discount code '${code}' does not exist.` });
            }

            const isValid = today >= discount.valid_from && today <= discount.valid_to;
            if (!isValid) {
                return sendJson(res, 400, {
                    valid: false,
                    discount,
                    message: `Discount code '${code}' expired or not yet valid for date ${today} (valid from ${discount.valid_from} to ${discount.valid_to}).`
                });
            }

            return sendJson(res, 200, {
                valid: true,
                discount,
                message: `Coupon '${discount.discount_code}' applied: ${(discount.discount_rate * 100).toFixed(0)}% OFF!`
            });
        }

        // Customers List & Add
        if (pathname === '/api/customers' && method === 'GET') {
            const customers = db.prepare(`
                SELECT c.customer_id,
                       c.first_name,
                       c.last_name,
                       c.email,
                       c.phone,
                       c.city,
                       c.registration_date,
                       COALESCE(s.total_orders, 0) AS total_orders,
                       COALESCE(s.total_spent, 0) AS total_spent,
                       s.first_order_date,
                       s.last_order_date
                FROM customers c
                LEFT JOIN v_customer_summary s ON s.customer_id = c.customer_id
                ORDER BY c.customer_id ASC;
            `).all();
            return sendJson(res, 200, customers);
        }

        if (pathname === '/api/customers' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { first_name, last_name, email, phone, city } = body;

            if (!first_name || !last_name || !email || !phone || !city) {
                return sendJson(res, 400, { error: 'All fields (first_name, last_name, email, phone, city) are required.' });
            }

            const maxId = db.prepare(`SELECT MAX(customer_id) as maxId FROM customers;`).get();
            const newId = (maxId.maxId || 0) + 1;
            const regDate = new Date().toISOString().split('T')[0];

            try {
                db.prepare(`
                    INSERT INTO customers (customer_id, first_name, last_name, email, phone, city, registration_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                `).run(newId, first_name, last_name, email, phone, city, regDate);

                const newCustomer = db.prepare(`SELECT * FROM customers WHERE customer_id = ?;`).get(newId);
                return sendJson(res, 201, { success: true, customer: newCustomer });
            } catch (err) {
                return sendJson(res, 400, { error: err.message });
            }
        }

        // Orders List
        if (pathname === '/api/orders' && method === 'GET') {
            const orders = db.prepare(`
                SELECT o.order_id,
                       o.order_date,
                       o.order_status,
                       c.customer_id,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       c.city,
                       d.discount_code,
                       d.discount_rate,
                       t.gross_amount,
                       t.net_amount,
                       p.payment_id,
                       p.payment_method,
                       p.payment_status,
                       del.delivery_id,
                       del.courier_name,
                       del.delivery_status,
                       del.shipped_date,
                       del.delivered_date,
                       COUNT(oi.product_id) AS items_count
                FROM orders o
                INNER JOIN customers c ON c.customer_id = o.customer_id
                INNER JOIN discounts d ON d.discount_id = o.discount_id
                INNER JOIN v_order_totals t ON t.order_id = o.order_id
                LEFT JOIN payments p ON p.order_id = o.order_id
                LEFT JOIN deliveries del ON del.order_id = o.order_id
                LEFT JOIN order_items oi ON oi.order_id = o.order_id
                GROUP BY o.order_id
                ORDER BY o.order_id DESC;
            `).all();
            return sendJson(res, 200, orders);
        }

        // Order Detail by ID
        const orderIdMatch = pathname.match(/^\/api\/orders\/(\d+)$/);
        if (orderIdMatch && method === 'GET') {
            const orderId = Number(orderIdMatch[1]);
            const orderHeader = db.prepare(`
                SELECT o.order_id,
                       o.order_date,
                       o.order_status,
                       c.customer_id,
                       c.first_name,
                       c.last_name,
                       c.email,
                       c.phone,
                       c.city,
                       d.discount_id,
                       d.discount_code,
                       d.discount_rate,
                       t.gross_amount,
                       t.net_amount
                FROM orders o
                INNER JOIN customers c ON c.customer_id = o.customer_id
                INNER JOIN discounts d ON d.discount_id = o.discount_id
                INNER JOIN v_order_totals t ON t.order_id = o.order_id
                WHERE o.order_id = ?;
            `).get(orderId);

            if (!orderHeader) {
                return sendJson(res, 404, { error: 'Order not found' });
            }

            const items = db.prepare(`
                SELECT oi.product_id,
                       p.product_name,
                       cat.category_name,
                       oi.quantity,
                       oi.unit_price,
                       (oi.quantity * oi.unit_price) AS line_total
                FROM order_items oi
                INNER JOIN products p ON p.product_id = oi.product_id
                INNER JOIN categories cat ON cat.category_id = p.category_id
                WHERE oi.order_id = ?;
            `).all(orderId);

            const payments = db.prepare(`
                SELECT payment_id, payment_date, payment_method, amount, payment_status
                FROM payments
                WHERE order_id = ?
                ORDER BY payment_id ASC;
            `).all(orderId);

            const delivery = db.prepare(`
                SELECT delivery_id, courier_name, shipped_date, delivered_date, delivery_status
                FROM deliveries
                WHERE order_id = ?;
            `).get(orderId);

            return sendJson(res, 200, {
                order: orderHeader,
                items,
                payments,
                delivery
            });
        }

        // Update Order Status
        const orderStatusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
        if (orderStatusMatch && method === 'PUT') {
            const orderId = Number(orderStatusMatch[1]);
            const body = await parseJsonBody(req);
            const { status } = body;

            if (!['Placed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
                return sendJson(res, 400, { error: 'Invalid order status. Must be Placed, Shipped, Delivered, or Cancelled.' });
            }

            db.prepare(`UPDATE orders SET order_status = ? WHERE order_id = ?;`).run(status, orderId);

            // If marked delivered, update delivery if exists
            if (status === 'Delivered') {
                const today = new Date().toISOString().split('T')[0];
                db.prepare(`UPDATE deliveries SET delivery_status = 'Delivered', delivered_date = ? WHERE order_id = ?;`).run(today, orderId);
            }

            return sendJson(res, 200, { success: true, message: `Order #${orderId} status updated to ${status}.` });
        }

        // Transactional Order Placement (Full Checkout)
        if (pathname === '/api/orders' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { customer_id, items, discount_code, payment_method, courier_name } = body;

            if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
                return sendJson(res, 400, { error: 'customer_id and non-empty items array are required.' });
            }

            // Begin Transaction
            db.exec('BEGIN TRANSACTION;');

            try {
                // Verify Customer
                const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?;').get(customer_id);
                if (!customer) {
                    throw new Error(`Customer ID ${customer_id} does not exist.`);
                }

                // Verify and Resolve Discount
                let discountId = 1; // Default 'NONE' (0%)
                let discountRate = 0.0;
                const orderDate = new Date().toISOString().split('T')[0];

                if (discount_code && discount_code !== 'NONE') {
                    const discount = db.prepare('SELECT * FROM discounts WHERE UPPER(discount_code) = ?;').get(discount_code.trim().toUpperCase());
                    if (!discount) {
                        throw new Error(`Discount coupon '${discount_code}' not found.`);
                    }
                    if (orderDate < discount.valid_from || orderDate > discount.valid_to) {
                        throw new Error(`Discount coupon '${discount_code}' is expired or not valid on ${orderDate}.`);
                    }
                    discountId = discount.discount_id;
                    discountRate = discount.discount_rate;
                }

                // Verify stock and compute total
                let grossAmount = 0;
                const verifiedItems = [];

                for (const it of items) {
                    const prod = db.prepare('SELECT p.*, i.stock_quantity FROM products p INNER JOIN inventory i ON i.product_id = p.product_id WHERE p.product_id = ?;').get(it.product_id);
                    if (!prod) {
                        throw new Error(`Product ID ${it.product_id} not found.`);
                    }
                    const qty = Number(it.quantity) || 1;
                    if (qty <= 0) {
                        throw new Error(`Invalid quantity for product ${prod.product_name}.`);
                    }
                    if (prod.stock_quantity < qty) {
                        throw new Error(`Insufficient stock for "${prod.product_name}". Available: ${prod.stock_quantity}, requested: ${qty}.`);
                    }

                    verifiedItems.push({
                        product_id: prod.product_id,
                        product_name: prod.product_name,
                        quantity: qty,
                        unit_price: prod.unit_price
                    });
                    grossAmount += qty * prod.unit_price;
                }

                const netAmount = Number((grossAmount * (1 - discountRate)).toFixed(2));

                // Generate new Order ID
                const maxOrderId = db.prepare('SELECT MAX(order_id) as maxId FROM orders;').get();
                const newOrderId = (maxOrderId.maxId || 0) + 1;

                // Insert into orders
                db.prepare(`
                    INSERT INTO orders (order_id, customer_id, discount_id, order_date, order_status)
                    VALUES (?, ?, ?, ?, 'Placed');
                `).run(newOrderId, customer_id, discountId, orderDate);

                // Insert order_items and decrement inventory
                const insertItemStmt = db.prepare(`
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                    VALUES (?, ?, ?, ?);
                `);
                const updateStockStmt = db.prepare(`
                    UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ?;
                `);

                for (const item of verifiedItems) {
                    insertItemStmt.run(newOrderId, item.product_id, item.quantity, item.unit_price);
                    updateStockStmt.run(item.quantity, item.product_id);
                }

                // Generate Payment record
                const maxPaymentId = db.prepare('SELECT MAX(payment_id) as maxId FROM payments;').get();
                const newPaymentId = (maxPaymentId.maxId || 0) + 1;
                const payMethod = payment_method || 'UPI';
                const payStatus = payMethod === 'Cash on Delivery' ? 'Pending' : 'Completed';

                db.prepare(`
                    INSERT INTO payments (payment_id, order_id, payment_date, payment_method, amount, payment_status)
                    VALUES (?, ?, ?, ?, ?, ?);
                `).run(newPaymentId, newOrderId, orderDate, payMethod, netAmount, payStatus);

                // Generate Delivery record
                const maxDeliveryId = db.prepare('SELECT MAX(delivery_id) as maxId FROM deliveries;').get();
                const newDeliveryId = (maxDeliveryId.maxId || 0) + 1;
                const courier = courier_name || 'Blue Dart';

                db.prepare(`
                    INSERT INTO deliveries (delivery_id, order_id, courier_name, shipped_date, delivered_date, delivery_status)
                    VALUES (?, ?, ?, ?, NULL, 'In Transit');
                `).run(newDeliveryId, newOrderId, courier, orderDate);

                // Commit Transaction
                db.exec('COMMIT;');

                return sendJson(res, 201, {
                    success: true,
                    order_id: newOrderId,
                    customer: `${customer.first_name} ${customer.last_name}`,
                    gross_amount: grossAmount,
                    discount_rate: discountRate,
                    net_amount: netAmount,
                    payment: {
                        payment_id: newPaymentId,
                        method: payMethod,
                        status: payStatus,
                        amount: netAmount
                    },
                    delivery: {
                        delivery_id: newDeliveryId,
                        courier: courier,
                        status: 'In Transit'
                    },
                    message: `Order #${newOrderId} successfully placed with transaction commit!`
                });

            } catch (err) {
                db.exec('ROLLBACK;');
                return sendJson(res, 400, { success: false, error: err.message });
            }
        }

        // Inventory Management
        if (pathname === '/api/inventory' && method === 'GET') {
            const inventory = db.prepare(`
                SELECT i.product_id,
                       p.product_name,
                       c.category_name,
                       p.unit_price,
                       i.stock_quantity,
                       i.reorder_level,
                       COALESCE(s.units_sold, 0) AS units_sold,
                       COALESCE(s.revenue, 0) AS revenue,
                       CASE
                           WHEN i.stock_quantity <= i.reorder_level THEN 1
                           ELSE 0
                       END AS is_low_stock
                FROM inventory i
                INNER JOIN products p ON p.product_id = i.product_id
                INNER JOIN categories c ON c.category_id = p.category_id
                LEFT JOIN v_product_sales s ON s.product_id = p.product_id
                ORDER BY is_low_stock DESC, s.units_sold DESC;
            `).all();
            return sendJson(res, 200, inventory);
        }

        const invProductMatch = pathname.match(/^\/api\/inventory\/(\d+)$/);
        if (invProductMatch && method === 'PUT') {
            const productId = Number(invProductMatch[1]);
            const body = await parseJsonBody(req);
            const { stock_quantity, reorder_level } = body;

            if (stock_quantity === undefined || reorder_level === undefined) {
                return sendJson(res, 400, { error: 'Both stock_quantity and reorder_level are required.' });
            }
            if (stock_quantity < 0 || reorder_level < 0) {
                return sendJson(res, 400, { error: 'Stock quantity and reorder level must be >= 0.' });
            }

            db.prepare(`
                UPDATE inventory SET stock_quantity = ?, reorder_level = ? WHERE product_id = ?;
            `).run(stock_quantity, reorder_level, productId);

            return sendJson(res, 200, { success: true, message: `Inventory updated for product #${productId}.` });
        }

        // 1-Click Restock All Low-Stock Items
        if (pathname === '/api/inventory/restock' && method === 'POST') {
            const body = await parseJsonBody(req);
            const addedUnits = Number(body.units) || 50;

            const lowStockItems = db.prepare(`
                SELECT product_id, stock_quantity, reorder_level FROM inventory WHERE stock_quantity <= reorder_level;
            `).all();

            db.exec('BEGIN TRANSACTION;');
            try {
                const updateStmt = db.prepare(`UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE product_id = ?;`);
                for (const item of lowStockItems) {
                    updateStmt.run(addedUnits, item.product_id);
                }
                db.exec('COMMIT;');
                return sendJson(res, 200, {
                    success: true,
                    restockedCount: lowStockItems.length,
                    message: `Restocked ${lowStockItems.length} low-stock products (+${addedUnits} units each)!`
                });
            } catch (err) {
                db.exec('ROLLBACK;');
                return sendJson(res, 500, { error: err.message });
            }
        }

        // Payments List
        if (pathname === '/api/payments' && method === 'GET') {
            const payments = db.prepare(`
                SELECT p.payment_id,
                       p.order_id,
                       p.payment_date,
                       p.payment_method,
                       p.amount,
                       p.payment_status,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       c.city,
                       t.net_amount AS order_net_amount,
                       ROUND(p.amount - t.net_amount, 2) AS variance
                FROM payments p
                INNER JOIN orders o ON o.order_id = p.order_id
                INNER JOIN customers c ON c.customer_id = o.customer_id
                INNER JOIN v_order_totals t ON t.order_id = o.order_id
                ORDER BY p.payment_id DESC;
            `).all();
            return sendJson(res, 200, payments);
        }

        // Deliveries List
        if (pathname === '/api/deliveries' && method === 'GET') {
            const deliveries = db.prepare(`
                SELECT d.delivery_id,
                       d.order_id,
                       d.courier_name,
                       d.shipped_date,
                       d.delivered_date,
                       d.delivery_status,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       c.city
                FROM deliveries d
                INNER JOIN orders o ON o.order_id = d.order_id
                INNER JOIN customers c ON c.customer_id = o.customer_id
                ORDER BY d.delivery_id DESC;
            `).all();
            return sendJson(res, 200, deliveries);
        }

        const markDeliveredMatch = pathname.match(/^\/api\/deliveries\/(\d+)\/deliver$/);
        if (markDeliveredMatch && method === 'PUT') {
            const deliveryId = Number(markDeliveredMatch[1]);
            const today = new Date().toISOString().split('T')[0];

            const del = db.prepare('SELECT * FROM deliveries WHERE delivery_id = ?;').get(deliveryId);
            if (!del) return sendJson(res, 404, { error: 'Delivery record not found' });

            db.prepare(`
                UPDATE deliveries SET delivery_status = 'Delivered', delivered_date = ? WHERE delivery_id = ?;
            `).run(today, deliveryId);

            db.prepare(`UPDATE orders SET order_status = 'Delivered' WHERE order_id = ?;`).run(del.order_id);

            return sendJson(res, 200, { success: true, message: `Delivery #${deliveryId} and Order #${del.order_id} marked as Delivered!` });
        }

        // Analytics KPI Overview
        if (pathname === '/api/analytics/kpi' && method === 'GET') {
            const grossRev = db.prepare(`SELECT SUM(oi.quantity * oi.unit_price) AS gross FROM orders o INNER JOIN order_items oi ON oi.order_id = o.order_id WHERE o.order_status <> 'Cancelled';`).get();
            const netRev = db.prepare(`SELECT SUM(net_amount) AS net FROM v_order_totals WHERE order_status <> 'Cancelled';`).get();
            const orderCounts = db.prepare(`SELECT COUNT(*) as total_orders, SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END) as delivered, SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled, SUM(CASE WHEN order_status = 'In Transit' OR order_status = 'Shipped' THEN 1 ELSE 0 END) as in_transit FROM orders;`).get();
            const customerCounts = db.prepare(`SELECT COUNT(*) as total_customers, SUM(CASE WHEN total_orders > 0 THEN 1 ELSE 0 END) as active_customers FROM v_customer_summary;`).get();
            const lowStockCount = db.prepare(`SELECT COUNT(*) as low_stock FROM inventory WHERE stock_quantity <= reorder_level;`).get();
            const paymentStats = db.prepare(`SELECT COUNT(*) as total_payments, SUM(CASE WHEN payment_status = 'Completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN payment_status = 'Failed' THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending FROM payments;`).get();

            return sendJson(res, 200, {
                grossRevenue: grossRev.gross || 0,
                netRevenue: netRev.net || 0,
                orders: orderCounts,
                customers: customerCounts,
                lowStockCount: lowStockCount.low_stock || 0,
                payments: paymentStats
            });
        }

        // Analytics Charts Data
        if (pathname === '/api/analytics/charts' && method === 'GET') {
            const categorySales = db.prepare(`SELECT category_name, SUM(units_sold) AS units_sold, SUM(revenue) AS revenue FROM v_product_sales GROUP BY category_name ORDER BY revenue DESC;`).all();
            const paymentMethods = db.prepare(`SELECT payment_method, COUNT(*) AS completed_payments, SUM(amount) AS total_collected FROM payments WHERE payment_status = 'Completed' GROUP BY payment_method ORDER BY total_collected DESC;`).all();
            const courierStats = db.prepare(`SELECT courier_name, delivery_status, COUNT(*) AS total FROM deliveries GROUP BY courier_name, delivery_status ORDER BY courier_name;`).all();
            const citySales = db.prepare(`
                WITH city_sales AS (
                    SELECT c.city, COUNT(t.order_id) AS orders_placed, SUM(t.net_amount) AS revenue
                    FROM customers c
                    INNER JOIN v_order_totals t ON t.customer_id = c.customer_id
                    WHERE t.order_status <> 'Cancelled'
                    GROUP BY c.city
                )
                SELECT city, orders_placed, ROUND(revenue, 2) AS revenue, DENSE_RANK() OVER (ORDER BY revenue DESC) AS city_rank
                FROM city_sales
                ORDER BY city_rank, city;
            `).all();
            const cumulativeRev = db.prepare(`
                SELECT order_id, order_date, net_amount, ROUND(SUM(net_amount) OVER (ORDER BY order_date, order_id), 2) AS cumulative_revenue
                FROM v_order_totals
                WHERE order_status <> 'Cancelled'
                ORDER BY order_date, order_id;
            `).all();

            return sendJson(res, 200, {
                categorySales,
                paymentMethods,
                courierStats,
                citySales,
                cumulativeRev
            });
        }

        // Predefined Capstone Queries Catalog
        if (pathname === '/api/query/predefined' && method === 'GET') {
            return sendJson(res, 200, predefinedQueries);
        }

        // Raw SQL Query Runner
        if (pathname === '/api/query/run' && method === 'POST') {
            const body = await parseJsonBody(req);
            const rawSql = (body.sql || '').trim();

            if (!rawSql) {
                return sendJson(res, 400, { error: 'SQL query cannot be empty.' });
            }

            const startTime = performance.now();

            try {
                // If it's a multi-statement script or DDL/DML, execute
                if (rawSql.includes(';') && (rawSql.toUpperCase().includes('INSERT') || rawSql.toUpperCase().includes('UPDATE') || rawSql.toUpperCase().includes('DELETE') || rawSql.toUpperCase().includes('DROP') || rawSql.toUpperCase().includes('CREATE'))) {
                    db.exec(rawSql);
                    const duration = (performance.now() - startTime).toFixed(2);
                    return sendJson(res, 200, {
                        isDml: true,
                        executionTimeMs: duration,
                        message: 'SQL statements executed successfully.'
                    });
                }

                // If single SELECT / WITH / EXPLAIN query
                const stmt = db.prepare(rawSql);
                const rows = stmt.all();
                const duration = (performance.now() - startTime).toFixed(2);
                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

                return sendJson(res, 200, {
                    columns,
                    rows,
                    rowCount: rows.length,
                    executionTimeMs: duration
                });
            } catch (err) {
                const duration = (performance.now() - startTime).toFixed(2);
                return sendJson(res, 400, {
                    error: err.message,
                    executionTimeMs: duration
                });
            }
        }

        // Interactive TCL Transaction Demonstration
        if (pathname === '/api/transaction/simulate' && method === 'POST') {
            const logs = [];

            // Step 1: Initial inventory check
            const initialStock11 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 11;').get().stock_quantity;
            const initialStock14 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 14;').get().stock_quantity;
            logs.push({ step: '1. Initial State', description: `Product #11 stock: ${initialStock11}, Product #14 stock: ${initialStock14}` });

            // Step 2: Start Transaction
            db.exec('BEGIN TRANSACTION;');
            logs.push({ step: '2. START TRANSACTION', description: 'Transaction started (ACID atomicity engaged).' });

            // Step 3: Insert Order 31 for Customer 12
            const testOrderId = 999;
            // Clean up any test order 999
            db.prepare('DELETE FROM order_items WHERE order_id = ?;').run(testOrderId);
            db.prepare('DELETE FROM payments WHERE order_id = ?;').run(testOrderId);
            db.prepare('DELETE FROM orders WHERE order_id = ?;').run(testOrderId);

            db.prepare(`INSERT INTO orders (order_id, customer_id, discount_id, order_date, order_status) VALUES (?, 12, 1, '2026-11-20', 'Placed');`).run(testOrderId);
            db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, 11, 1, 899.00);`).run(testOrderId);
            db.prepare(`UPDATE inventory SET stock_quantity = stock_quantity - 1 WHERE product_id = 11;`).run();

            const postItem11Stock = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 11;').get().stock_quantity;
            logs.push({ step: '3. Added Item 11 & Decremented Stock', description: `Item 11 added. Product #11 stock reduced to ${postItem11Stock}.` });

            // Step 4: SAVEPOINT
            db.exec('SAVEPOINT after_book_item;');
            logs.push({ step: '4. SAVEPOINT after_book_item', description: 'Savepoint checkpoint created.' });

            // Step 5: Add Item 14 (3 units)
            db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, 14, 3, 1999.00);`).run(testOrderId);
            db.prepare(`UPDATE inventory SET stock_quantity = stock_quantity - 3 WHERE product_id = 14;`).run();

            const intermediateStock14 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 14;').get().stock_quantity;
            logs.push({ step: '5. Added Item 14 & Decremented Stock', description: `Item 14 added (3 units). Product #14 stock temporarily reduced to ${intermediateStock14}.` });

            // Step 6: ROLLBACK TO SAVEPOINT
            db.exec('ROLLBACK TO SAVEPOINT after_book_item;');
            const rolledBackStock14 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 14;').get().stock_quantity;
            logs.push({ step: '6. ROLLBACK TO SAVEPOINT after_book_item', description: `Rollback triggered! Item 14 removed and Product #14 stock restored to ${rolledBackStock14}!` });

            // Step 7: Complete Payment & COMMIT
            const maxPaymentId = db.prepare('SELECT MAX(payment_id) as maxId FROM payments;').get().maxId + 1;
            db.prepare(`INSERT INTO payments (payment_id, order_id, payment_date, payment_method, amount, payment_status) VALUES (?, ?, '2026-11-20', 'Credit Card', 899.00, 'Completed');`).run(maxPaymentId, testOrderId);
            db.exec('COMMIT;');
            logs.push({ step: '7. Payment & COMMIT', description: 'Payment recorded for ₹899.00 and transaction committed to permanent storage.' });

            // Final verification
            const finalOrderItems = db.prepare('SELECT product_id, quantity, unit_price FROM order_items WHERE order_id = ?;').all(testOrderId);
            const finalStock11 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 11;').get().stock_quantity;
            const finalStock14 = db.prepare('SELECT stock_quantity FROM inventory WHERE product_id = 14;').get().stock_quantity;

            return sendJson(res, 200, {
                success: true,
                testOrderId,
                logs,
                finalOrderItems,
                finalStock: {
                    product_11: finalStock11,
                    product_14: finalStock14
                }
            });
        }

        // --- STATIC FILE SERVING ---
        let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

        // Security check: ensure filePath is inside PUBLIC_DIR
        if (!filePath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            return res.end('Access Denied');
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                // If not found, serve index.html for SPA routing fallback
                fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, spaContent) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        return res.end('404 Not Found');
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(spaContent);
                });
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });

    } catch (serverError) {
        console.error('[Server Error]', serverError);
        return sendJson(res, 500, { error: 'Internal Server Error: ' + serverError.message });
    }
});

server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 E-Commerce Analytics Platform running at: http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`================================================================`);
});
