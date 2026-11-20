# WYNTOX — Next-Gen Futuristic E-Commerce Platform & Relational Intelligence Engine

A DBMS Capstone Fullstack Application implementing the **E-Commerce Order & Customer Analytics System** using normalized relational schema (BCNF), multi-table joins, subqueries, set operations, window functions, common table expressions (CTEs), ACID transactions (TCL), role-based access control (DCL), and an ultra-modern futuristic luxury storefront experience comparable to Apple, Nike, and Tesla digital platforms.

---

## 🚀 Live Demo & Server Quickstart

```bash
# Navigate to project directory
cd C:\Users\soman\.gemini\antigravity\scratch\ecommerce-analytics-platform

# Initialize or reset database (with BCNF schema, seed catalog, metadata, reviews, and addresses)
node db.js

# Start server
node server.js

# Open in your browser:
http://localhost:3000
```

---

## 🌟 Futuristic UI/UX & Design System Upgrades

### 1. 🎨 Multi-Theme Engine & Light/Dark Mode (Non-Default Palette)
- **Default Theme — Cyber Neon Cyan:** Crisp, high-tech cyan/electric azure accents (`#00f2fe`, `#06b6d4`, glowing neon cyan outlines).
- **Emerald Matrix:** Matrix-inspired neon green highlights (`#00ff88`, `#10b981`).
- **Solar Gold:** Cyber amber and quantum gold accents (`#ffd700`, `#f59e0b`).
- **Crimson Nova:** Neon scarlet & laser rose accents (`#ff0055`, `#f43f5e`).
- **Full Dark & Light Mode Toggle:** Smooth animated transition between obsidian cyber glassmorphism and pristine minimalist Apple/Nike light aesthetics.

### 2. 🔐 Unique Holographic Authentication & Passkey Experience
- **Holographic ID Terminal:** Animated scanning laser line, glassmorphic card container, and biometric touch ID / quantum passkey simulation.
- **DCL Staff Roles (1-Click Quick Demo Switcher):**
  - **Administrator:** `ecom_admin` (`Admin@2026`) — `ALL PRIVILEGES`
  - **Data Analyst:** `ecom_analyst` (`Analyst@2026`) — `SELECT ON ALL TABLES`
  - **Support Specialist:** `ecom_support` (`Support@2026`) — Orders & Deliveries
  - **Shopper Account:** `aarav.sharma@example.com` (`password`)
- **Customer Registration:** Instant validation, city selector, avatar generation.

### 3. 🛍️ Next-Gen Storefront & Interactive Catalog
- **Live Announcement Bar:** High-tech ticker with flash discount codes (`SAVE15`, `WELCOME10`), quantum drone delivery notices, and ACID atomicity guarantees.
- **Hero Section:** 3D floating glassmorphic banner, live metric counters, and interactive #1 Bestseller Spotlight Card.
- **Flash Sale Countdown:** Real-time countdown timer (`HH:MM:SS`) with active discount pills.
- **Category Explorer:** High-tech interactive cards for Electronics, Fashion, Home & Kitchen, Books, Sports & Fitness, and Toys.
- **Advanced Catalog Toolbar:**
  - Live search with instant autocomplete popup and keyboard shortcut (`⌘K` / `Ctrl+K`).
  - Brand filter dropdown (`Aether Audio`, `Nexus Cyber`, `SonicPulse`, `Vapor Urban`, `HyperStride`, `McGraw Hill`, etc.).
  - Price Range Slider (Live updates from ₹500 to ₹25,000).
  - Stock level filter (In Stock, Low Stock Warning).
  - Sort Options (Best Selling, Highest Rated, Price Low-to-High, Price High-to-Low, Newest).
  - View Switcher: Grid View vs. List View!

### 4. 🔍 Interactive Product Details Modal & Verified Reviews
- Multi-image gallery with clickable thumbnail selector and hover zoom.
- Brand name, original MSRP, discounted unit price, and discount percentage savings badge.
- Color variant selectors with visual feedback.
- Size variant selectors.
- Quantity adjuster with stock boundary checks.
- Pincode Delivery Estimator with instant transit time response.
- Technical Specifications tab (BCNF attributes, dimensions, materials).
- Customer Reviews tab with star ratings breakdown and an interactive **"Write a Verified Review"** form.

### 5. 🛒 Persistent Shopping Cart & Saved Wishlist
- Slide-over glassmorphic Cart Drawer with live subtotal, discount deductions, and free drone shipping calculations.
- Coupon Code validation engine (`WELCOME10` for 10% off, `SAVE15` for 15% off).
- Saved Wishlist View with 1-click "Move to Cart" or "Remove".
- Complete persistence in `localStorage`.

### 6. 💳 Multi-Step Encrypted Checkout Flow (Sandbox Gateway)
- **Step 1:** Customer Information & Delivery Address selector.
- **Step 2:** Delivery Tier selector (Quantum Drone Same-Day, Blue Dart Express, Delhivery Standard).
- **Step 3:** Payment Gateway Sandbox (UPI with interactive dynamic QR code simulation, Credit Card with live interactive card preview & CVV check, Net Banking, Pay on Delivery).
- **Step 4:** Transaction Review & Authorization.
- **Order Confirmation:** Confetti celebration blast, Order ID, Tracking courier link, and Printable Receipt invoice!

### 7. 🛠️ Administrative Management Hub
- **Product Catalog Management:** Add new products atomically, inline price and stock adjustment, and safe deletion with referential integrity constraint validation.
- **Order Logistics:** Filter orders by status, 1-click status transitions (`Placed` → `Shipped` → `Delivered`), and courier tracking.
- **Coupon Manager:** Create custom promotional vouchers with discount rates and valid date ranges.
- **1-Click Restock:** Atomically replenish +50 units to all low-stock items.

### 8. 📐 Complete DBMS Capstone Syllabus Coverage
- **38 Pre-Loaded Syllabus Queries:** Joins, subqueries (nested & correlated), set operations (`UNION`, `INTERSECT`, `EXCEPT`), window functions (`RANK`, `DENSE_RANK`, `ROW_NUMBER`, `PARTITION BY`, `SUM OVER`), and CTEs.
- **SQL Query Studio:** Interactive code runner with sub-millisecond execution benchmarks and 1-click export to CSV / JSON.
- **TCL Transaction ACID Simulator:** Step-by-step visual demonstration of `SAVEPOINT`, `ROLLBACK TO SAVEPOINT`, and `COMMIT`.
- **BCNF Relational Schema Inspector:** Interactive entity table cards with Primary Keys (PK), Foreign Keys (FK), Unique constraints (UQ), and CHECK constraints.
- **Analytics & BI Charts:** Interactive Chart.js charts for category revenue, payment distributions, running revenue, and city sales leaderboards.

---

## 💻 Tech Stack

- **Backend:** Node.js (v26.7.0) with native built-in `node:sqlite` (`DatabaseSync`), native `node:http`, and RESTful API endpoints. Zero external npm dependencies required!
- **Database:** Normalized relational database adhering strictly to **Boyce-Codd Normal Form (BCNF)** with SQLite 3.50.4.
- **Frontend:** Single Page Application (SPA) styled with **Tailwind CSS**, **Chart.js**, Canvas Confetti, FontAwesome 6, and custom futuristic CSS glassmorphism.
