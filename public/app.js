// app.js - Next-Gen Futuristic E-Commerce Platform & Relational Intelligence Engine

// ==========================================
// 1. APPLICATION GLOBAL STATE
// ==========================================
const state = {
    currentTab: 'storefront',
    adminSubtab: 'products',
    currentTheme: localStorage.getItem('aether_theme') || 'cyan',
    isDarkMode: localStorage.getItem('aether_dark_mode') !== 'false',
    viewMode: localStorage.getItem('aether_view_mode') || 'grid',
    currentUser: JSON.parse(localStorage.getItem('aether_user') || 'null') || {
        username: 'ecom_admin',
        name: 'System Administrator',
        role: 'ecom_admin',
        roleTitle: 'Administrator',
        roleBadge: 'ecom_admin_role',
        permissions: 'ALL PRIVILEGES ON ecommerce_analytics.*'
    },
    products: [],
    categories: [],
    brands: [],
    customers: [],
    discounts: [],
    orders: [],
    inventory: [],
    cart: JSON.parse(localStorage.getItem('aether_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('aether_wishlist') || '[]'),
    appliedCoupon: JSON.parse(localStorage.getItem('aether_coupon') || 'null'),
    selectedCategory: null,
    searchQuery: '',
    brandFilter: '',
    stockFilter: '',
    sortFilter: 'default',
    maxPrice: 25000,
    predefinedQueries: [],
    lastQueryResult: null,
    checkoutStep: 1,
    selectedDeliveryTier: 'Quantum Drone',
    selectedPayMethod: 'UPI',
    activeDetailProduct: null,
    detailQuantity: 1,
    charts: {}
};

// Category Icon Mapping
const CATEGORY_ICONS = {
    'Electronics': 'fa-laptop',
    'Fashion': 'fa-shirt',
    'Home and Kitchen': 'fa-blender',
    'Books': 'fa-book-open',
    'Sports and Fitness': 'fa-dumbbell',
    'Toys': 'fa-gamepad'
};

// Fallback high-resolution product images
const FALLBACK_IMAGES = {
    1: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    2: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    3: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    4: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    5: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    6: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    7: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    8: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    9: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    10: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    11: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    12: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
    13: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
    14: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
    15: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    16: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'
};

function getProductMainImage(product) {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0];
    }
    return FALLBACK_IMAGES[product.product_id] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
}

// ==========================================
// 2. THEME & DARK/LIGHT MODE ENGINE
// ==========================================
function setAppTheme(themeName) {
    state.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('aether_theme', themeName);

    // Update indicator dot
    const dot = document.getElementById('theme-indicator-dot');
    if (dot) {
        if (themeName === 'cyan') dot.className = 'w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50';
        else if (themeName === 'emerald') dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50';
        else if (themeName === 'gold') dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50';
        else if (themeName === 'crimson') dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50';
    }

    showToast('Theme Updated', `Switched theme accent to ${themeName.toUpperCase()}`, 'fa-palette');
}

function toggleLightDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('mode-icon').className = 'fa-solid fa-moon text-cyan-400';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('mode-icon').className = 'fa-solid fa-sun text-amber-500';
    }
    localStorage.setItem('aether_dark_mode', state.isDarkMode);
    showToast('Mode Switched', state.isDarkMode ? 'Dark Futuristic Glass Active' : 'Clean Apple/Nike Light Mode Active', state.isDarkMode ? 'fa-moon' : 'fa-sun');
}

function initThemeAndMode() {
    setAppTheme(state.currentTheme);
    if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('mode-icon').className = 'fa-solid fa-moon text-cyan-400';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('mode-icon').className = 'fa-solid fa-sun text-amber-500';
    }
}

// ==========================================
// 3. TOAST NOTIFICATION UTILITY
// ==========================================
let toastTimer = null;
function showToast(title, message, icon = 'fa-check') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');

    if (!toast) return;

    if (toastTimer) clearTimeout(toastTimer);

    toastIcon.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    toastTitle.textContent = title;
    toastMsg.textContent = message;

    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    toastTimer = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3800);
}

// ==========================================
// 4. TAB & SUBTAB NAVIGATION
// ==========================================
function switchTab(tabId) {
    state.currentTab = tabId;

    // Update nav-tab classes
    document.querySelectorAll('.nav-tab').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active', 'bg-slate-800/80', 'text-white');
            btn.classList.remove('text-slate-300');
        } else {
            btn.classList.remove('active', 'bg-slate-800/80', 'text-white');
            btn.classList.add('text-slate-300');
        }
    });

    // Toggle views
    const viewMap = {
        'storefront': 'view-storefront',
        'wishlist-view': 'view-wishlist-view',
        'admin-panel': 'view-admin-panel',
        'analytics': 'view-analytics',
        'inventory': 'view-inventory',
        'orders': 'view-orders',
        'sql-studio': 'view-sql-studio',
        'tcl-lab': 'view-tcl-lab',
        'er-diagram': 'view-er-diagram',
        'login': 'view-login'
    };

    Object.entries(viewMap).forEach(([key, viewId]) => {
        const el = document.getElementById(viewId);
        if (el) {
            if (key === tabId) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Tab-specific trigger loads
    if (tabId === 'analytics') loadAnalytics();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'orders') loadOrders();
    if (tabId === 'admin-panel') loadAdminHub();
    if (tabId === 'wishlist-view') renderWishlistView();
}

function switchAdminSubtab(subtab) {
    state.adminSubtab = subtab;
    const tabs = ['products', 'orders', 'coupons'];
    tabs.forEach(t => {
        const pane = document.getElementById(`admin-subtab-${t}`);
        const btn = document.getElementById(`admin-subtab-btn-${t}`);
        if (pane && btn) {
            if (t === subtab) {
                pane.classList.remove('hidden');
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition';
            } else {
                pane.classList.add('hidden');
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition';
            }
        }
    });
}

// ==========================================
// 5. PRODUCT CATALOG & ADVANCED SEARCH
// ==========================================
async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        state.categories = await res.json();
        renderCategoryPills();

        // Also populate add-product modal category dropdown
        const select = document.getElementById('new-prod-category');
        if (select) {
            select.innerHTML = state.categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

function renderCategoryPills() {
    const container = document.getElementById('category-pills');
    if (!container) return;

    let html = `
        <button onclick="setCategoryFilter(null)" class="category-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${state.selectedCategory === null ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'}">
            <i class="fa-solid fa-shapes"></i>
            <span>All Categories</span>
        </button>
    `;

    state.categories.forEach(cat => {
        const isSelected = state.selectedCategory === cat.category_id;
        const icon = CATEGORY_ICONS[cat.category_name] || 'fa-tag';
        html += `
            <button onclick="setCategoryFilter(${cat.category_id})" class="category-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'}">
                <i class="fa-solid ${icon}"></i>
                <span>${cat.category_name}</span>
                <span class="text-[10px] opacity-60 font-mono ml-1">(${cat.product_count})</span>
            </button>
        `;
    });

    container.innerHTML = html;
}

function setCategoryFilter(categoryId) {
    state.selectedCategory = categoryId;
    renderCategoryPills();
    loadProducts();
}

async function loadBrands() {
    try {
        const res = await fetch('/api/brands');
        state.brands = await res.json();
        const select = document.getElementById('brand-filter');
        if (select) {
            let html = '<option value="">All Brands</option>';
            state.brands.forEach(b => {
                html += `<option value="${b}">${b}</option>`;
            });
            select.innerHTML = html;
        }
    } catch (err) {
        console.error('Error loading brands:', err);
    }
}

async function loadProducts() {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('products-empty-state');
    const counter = document.getElementById('catalog-items-counter');

    if (!grid) return;

    // Show shimmering skeleton loading
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="rounded-3xl glass-panel p-5 space-y-4">
            <div class="skeleton h-48 rounded-2xl w-full"></div>
            <div class="skeleton h-4 rounded w-1/3"></div>
            <div class="skeleton h-6 rounded w-3/4"></div>
            <div class="skeleton h-4 rounded w-1/2"></div>
            <div class="skeleton h-10 rounded-xl w-full"></div>
        </div>
    `).join('');

    try {
        const params = new URLSearchParams();
        if (state.selectedCategory) params.append('categoryId', state.selectedCategory);
        if (state.searchQuery) params.append('search', state.searchQuery);
        if (state.brandFilter) params.append('brand', state.brandFilter);
        if (state.stockFilter) params.append('stockFilter', state.stockFilter);
        if (state.sortFilter) params.append('sort', state.sortFilter);
        if (state.maxPrice) params.append('maxPrice', state.maxPrice);

        const res = await fetch(`/api/products?${params.toString()}`);
        state.products = await res.json();

        if (counter) {
            counter.textContent = `${state.products.length} products available`;
        }

        if (state.products.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        renderProducts();
    } catch (err) {
        console.error('Error loading products:', err);
        grid.innerHTML = `<div class="col-span-full p-8 text-center text-rose-400 font-mono">Failed to load product catalog.</div>`;
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const isList = state.viewMode === 'list';
    grid.className = isList ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

    let html = '';
    state.products.forEach(p => {
        const img = getProductMainImage(p);
        const inWishlist = state.wishlist.includes(p.product_id);
        const isLowStock = p.stock_status === 'Low Stock';
        const isOutOfStock = p.stock_status === 'Out of Stock';

        if (isList) {
            // LIST VIEW CARD
            html += `
                <div class="glass-card-interactive p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-6 group">
                    <div class="image-zoom-container rounded-2xl w-full sm:w-44 h-40 bg-slate-900/80 flex items-center justify-center p-3 relative flex-shrink-0">
                        <img src="${img}" alt="${p.product_name}" class="max-h-full object-contain filter drop-shadow-lg">
                        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono font-bold uppercase">
                            ${p.badge || 'PRO'}
                        </span>
                    </div>

                    <div class="flex-1 space-y-1.5 w-full">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">${p.brand || 'Wyntox'} • ${p.category_name}</span>
                            <button onclick="toggleWishlist(${p.product_id})" class="text-sm p-1 transition ${inWishlist ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}">
                                <i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i>
                            </button>
                        </div>
                        <h3 onclick="openProductDetail(${p.product_id})" class="text-base font-bold text-white hover:text-cyan-300 cursor-pointer transition">
                            ${p.product_name}
                        </h3>
                        <p class="text-xs text-slate-400 line-clamp-2">${p.short_description}</p>
                        
                        <div class="flex items-center space-x-2 text-xs">
                            <div class="flex text-amber-400 text-xs">
                                <i class="fa-solid fa-star"></i>
                                <span class="text-slate-200 font-mono font-bold ml-1">${p.rating}</span>
                            </div>
                            <span class="text-slate-500 text-[11px] font-mono">(${p.review_count} reviews)</span>
                        </div>
                    </div>

                    <div class="flex flex-col items-end justify-between h-full space-y-3 w-full sm:w-44 flex-shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-800/80 sm:pl-6">
                        <div class="text-right">
                            <div class="text-xl font-extrabold text-white font-mono">₹${Number(p.unit_price).toLocaleString()}</div>
                            <div class="text-xs text-slate-500 line-through font-mono">₹${Number(p.original_price).toLocaleString()}</div>
                            <div class="text-[10px] font-bold text-cyan-400 font-mono">${p.discount_percentage}% SAVINGS</div>
                        </div>

                        <div class="w-full space-y-2">
                            <button onclick="openProductDetail(${p.product_id})" class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition">
                                Quick Specs
                            </button>
                            <button onclick="addToCart(${p.product_id}, '${p.product_name.replace(/'/g, "\\'")}', ${p.unit_price}); return false;" 
                                    ${isOutOfStock ? 'disabled' : ''} 
                                    class="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}">
                                <i class="fa-solid fa-cart-plus"></i>
                                <span>${isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // GRID VIEW CARD
            html += `
                <div class="glass-card-interactive p-4 rounded-3xl flex flex-col justify-between group relative overflow-hidden">
                    <div class="relative">
                        <!-- Top tags & Wishlist button -->
                        <div class="flex items-center justify-between mb-3 z-10 relative">
                            <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                                ${p.badge || 'PRO'}
                            </span>
                            <button onclick="toggleWishlist(${p.product_id})" title="Save to wishlist" class="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xs transition ${inWishlist ? 'text-rose-500 border-rose-500/40' : 'text-slate-400 hover:text-rose-400'}">
                                <i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i>
                            </button>
                        </div>

                        <!-- Image with zoom -->
                        <div onclick="openProductDetail(${p.product_id})" class="image-zoom-container rounded-2xl h-48 bg-slate-900/80 flex items-center justify-center p-4 cursor-pointer relative">
                            <img src="${img}" alt="${p.product_name}" class="max-h-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300">
                            
                            <!-- Stock Status Overlay Pill -->
                            <div class="absolute bottom-2 left-2">
                                ${isOutOfStock 
                                    ? `<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">Sold Out</span>` 
                                    : isLowStock 
                                        ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold flex items-center space-x-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-dot"></span><span>Only ${p.stock_quantity} left</span></span>`
                                        : `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-mono">In Stock</span>`
                                }
                            </div>
                        </div>

                        <!-- Details -->
                        <div class="mt-3.5 space-y-1.5">
                            <div class="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">${p.brand || 'Wyntox'} • ${p.category_name}</div>
                            <h3 onclick="openProductDetail(${p.product_id})" class="text-sm font-bold text-white group-hover:text-cyan-300 cursor-pointer transition line-clamp-1">
                                ${p.product_name}
                            </h3>
                            
                            <div class="flex items-center space-x-2 text-xs">
                                <div class="flex text-amber-400 text-xs">
                                    <i class="fa-solid fa-star"></i>
                                    <span class="text-slate-200 font-mono font-bold ml-1">${p.rating}</span>
                                </div>
                                <span class="text-slate-500 text-[10px] font-mono">(${p.review_count} reviews)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Price & Quick Actions -->
                    <div class="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                            <div class="text-base font-extrabold text-white font-mono">₹${Number(p.unit_price).toLocaleString()}</div>
                            <div class="flex items-center space-x-1">
                                <span class="text-[11px] text-slate-500 line-through font-mono">₹${Number(p.original_price).toLocaleString()}</span>
                                <span class="text-[9px] text-cyan-400 font-bold font-mono">-${p.discount_percentage}%</span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-1.5">
                            <button onclick="openProductDetail(${p.product_id})" title="Quick View" class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button onclick="addToCart(${p.product_id}, '${p.product_name.replace(/'/g, "\\'")}', ${p.unit_price}); return false;" 
                                    ${isOutOfStock ? 'disabled' : ''} 
                                    title="Add to Cart" 
                                    class="btn-primary p-2.5 rounded-xl text-xs font-bold flex items-center justify-center ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    grid.innerHTML = html;
}

// Live Autocomplete in Header Search
function initLiveSearchAutocomplete() {
    const searchInput = document.getElementById('nav-global-search');
    const dropdown = document.getElementById('search-autocomplete-dropdown');
    const list = document.getElementById('search-suggestions-list');
    const countEl = document.getElementById('search-results-count');

    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        if (val.length < 2) {
            dropdown.classList.add('hidden');
            return;
        }

        const matches = state.products.filter(p => 
            p.product_name.toLowerCase().includes(val) || 
            (p.brand && p.brand.toLowerCase().includes(val)) ||
            (p.category_name && p.category_name.toLowerCase().includes(val))
        ).slice(0, 5);

        if (countEl) countEl.textContent = `${matches.length} matches`;

        if (matches.length === 0) {
            list.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 font-mono">No matching products found.</div>`;
        } else {
            list.innerHTML = matches.map(m => `
                <div onclick="openProductDetail(${m.product_id}); document.getElementById('search-autocomplete-dropdown').classList.add('hidden');" 
                     class="p-2 rounded-xl hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition">
                    <div class="flex items-center space-x-3">
                        <img src="${getProductMainImage(m)}" class="w-10 h-10 object-contain rounded-lg bg-slate-900 p-1">
                        <div>
                            <div class="text-xs font-bold text-white">${m.product_name}</div>
                            <div class="text-[10px] text-cyan-400 font-mono">${m.brand} • ${m.category_name}</div>
                        </div>
                    </div>
                    <span class="text-xs font-extrabold text-white font-mono">₹${Number(m.unit_price).toLocaleString()}</span>
                </div>
            `).join('');
        }

        dropdown.classList.remove('hidden');
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') dropdown.classList.add('hidden');
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Clicking outside closes dropdown
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Trending keyword buttons
    document.querySelectorAll('.search-trend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            searchInput.value = btn.dataset.q;
            state.searchQuery = btn.dataset.q;
            loadProducts();
            dropdown.classList.add('hidden');
        });
    });
}

function resetAllFilters() {
    state.selectedCategory = null;
    state.searchQuery = '';
    state.brandFilter = '';
    state.stockFilter = '';
    state.sortFilter = 'default';
    state.maxPrice = 25000;

    const searchInput = document.getElementById('store-search');
    if (searchInput) searchInput.value = '';
    const brandFilter = document.getElementById('brand-filter');
    if (brandFilter) brandFilter.value = '';
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) stockFilter.value = '';
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) sortFilter.value = 'default';
    const priceRange = document.getElementById('price-range');
    if (priceRange) priceRange.value = 25000;
    const priceLabel = document.getElementById('price-range-label');
    if (priceLabel) priceLabel.textContent = '₹25,000';

    renderCategoryPills();
    loadProducts();
    showToast('Filters Cleared', 'Displaying full product catalog.', 'fa-filter-circle-xmark');
}

// Smart Recommendations Strip
async function loadSmartRecommendations() {
    const row = document.getElementById('smart-recommendations-row');
    if (!row) return;

    try {
        const res = await fetch('/api/recommendations');
        const data = await res.json();
        const items = [...data.topRated, ...data.trending].slice(0, 4);

        row.innerHTML = items.map(p => `
            <div onclick="openProductDetail(${p.product_id})" class="glass-card-interactive p-4 rounded-2xl cursor-pointer space-y-2 group">
                <div class="h-32 rounded-xl bg-slate-900/80 flex items-center justify-center p-3 relative">
                    <img src="${p.image || getProductMainImage(p)}" alt="${p.product_name}" class="max-h-full object-contain filter drop-shadow">
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold">
                        ${p.badge || 'POPULAR'}
                    </span>
                </div>
                <div>
                    <div class="text-[9px] text-cyan-400 font-mono uppercase font-bold">${p.brand || 'Wyntox'}</div>
                    <div class="text-xs font-bold text-white group-hover:text-cyan-300 truncate">${p.product_name}</div>
                    <div class="text-sm font-extrabold text-white font-mono mt-1">₹${Number(p.unit_price).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading recommendations:', err);
    }
}

// Flash Sale Countdown Timer
function initFlashSaleTimer() {
    let secondsLeft = 8 * 3600 + 42 * 60 + 19;
    setInterval(() => {
        if (secondsLeft > 0) secondsLeft--;
        const h = Math.floor(secondsLeft / 3600);
        const m = Math.floor((secondsLeft % 3600) / 60);
        const s = secondsLeft % 60;

        const hEl = document.getElementById('flash-hours');
        const mEl = document.getElementById('flash-mins');
        const sEl = document.getElementById('flash-secs');

        if (hEl) hEl.textContent = String(h).padStart(2, '0');
        if (mEl) mEl.textContent = String(m).padStart(2, '0');
        if (sEl) sEl.textContent = String(s).padStart(2, '0');
    }, 1000);
}

// Newsletter Subscription
function handleNewsletter(e) {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    showToast('Subscribed!', `Welcome to the Neural Network, ${email}! Check inbox for exclusive 15% voucher.`, 'fa-envelope-open-text');
    e.target.reset();
}

// ==========================================
// 6. PRODUCT DETAILS MODAL (WITH ZOOM & REVIEWS)
// ==========================================
async function openProductDetail(productId) {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    try {
        const res = await fetch(`/api/products/${productId}`);
        const p = await res.json();
        state.activeDetailProduct = p;
        state.detailQuantity = 1;

        // Set Images & Thumbnails
        const mainImg = document.getElementById('detail-main-image');
        const badge = document.getElementById('detail-badge');
        const thumbsRow = document.getElementById('detail-thumbnails-row');

        const images = (p.images && p.images.length > 0) ? p.images : [getProductMainImage(p)];
        mainImg.src = images[0];
        badge.textContent = p.badge || 'PRO SPEC';

        thumbsRow.innerHTML = images.map((imgUrl, idx) => `
            <img src="${imgUrl}" onclick="switchDetailMainImage('${imgUrl}')" class="w-14 h-14 object-contain rounded-xl bg-slate-900 border ${idx === 0 ? 'border-cyan-400' : 'border-slate-800'} p-1.5 cursor-pointer hover:border-cyan-400 transition">
        `).join('');

        // Texts
        document.getElementById('detail-brand').textContent = `${p.brand || 'Wyntox'} • ${p.category_name}`;
        document.getElementById('detail-title').textContent = p.product_name;
        document.getElementById('detail-rating-text').textContent = `(${p.rating}★ • ${p.review_count} verified reviews)`;
        document.getElementById('detail-unit-price').textContent = `₹${Number(p.unit_price).toLocaleString()}`;
        document.getElementById('detail-orig-price').textContent = `₹${Number(p.original_price).toLocaleString()}`;
        document.getElementById('detail-discount-tag').textContent = `${p.discount_percentage}% OFF`;
        document.getElementById('detail-desc').textContent = p.short_description;
        document.getElementById('detail-qty').textContent = '1';

        // Stars
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(p.rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
            else if (i - 0.5 <= p.rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            else starsHtml += '<i class="fa-regular fa-star"></i>';
        }
        document.getElementById('detail-stars').innerHTML = starsHtml;

        // Color variants
        const colorsList = document.getElementById('detail-colors-list');
        if (p.colors && p.colors.length > 0) {
            colorsList.innerHTML = p.colors.map((c, idx) => `
                <button onclick="selectDetailColor(this)" class="px-3 py-1.5 rounded-xl text-xs font-semibold border ${idx === 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-900 text-slate-400 border-slate-700'}">
                    ${c}
                </button>
            `).join('');
        }

        // Stock status badge
        const stockBadge = document.getElementById('detail-stock-badge');
        if (p.stock_status === 'Out of Stock') {
            stockBadge.innerHTML = `<span class="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">Sold Out</span>`;
        } else if (p.stock_status === 'Low Stock') {
            stockBadge.innerHTML = `<span class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center space-x-1.5"><span class="w-2 h-2 rounded-full bg-amber-400 pulse-dot"></span><span>Low Stock (${p.stock_quantity} left)</span></span>`;
        } else {
            stockBadge.innerHTML = `<span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">In Stock (${p.stock_quantity} units)</span>`;
        }

        // Hook Add to cart & Buy now
        const btnAdd = document.getElementById('btn-detail-add-cart');
        const btnBuy = document.getElementById('btn-detail-buy-now');
        const btnWish = document.getElementById('btn-detail-wishlist');

        btnAdd.onclick = () => {
            addToCart(p.product_id, p.product_name, p.unit_price, state.detailQuantity);
            closeProductDetailModal();
        };

        btnBuy.onclick = () => {
            addToCart(p.product_id, p.product_name, p.unit_price, state.detailQuantity);
            closeProductDetailModal();
            openMultiStepCheckout();
        };

        const inWish = state.wishlist.includes(p.product_id);
        btnWish.className = `p-3.5 rounded-xl bg-slate-900 border border-slate-700 transition ${inWish ? 'text-rose-500 border-rose-500/40' : 'text-slate-300 hover:text-rose-400'}`;
        btnWish.onclick = () => {
            toggleWishlist(p.product_id);
            const nowInWish = state.wishlist.includes(p.product_id);
            btnWish.className = `p-3.5 rounded-xl bg-slate-900 border border-slate-700 transition ${nowInWish ? 'text-rose-500 border-rose-500/40' : 'text-slate-300 hover:text-rose-400'}`;
        };

        // Render Specifications Tab
        renderDetailSpecs(p.specs);

        // Render Reviews Tab
        renderDetailReviews(p.reviews);

        // Switch to specs subtab initially
        switchDetailTab('specs');

        modal.classList.remove('hidden');
    } catch (err) {
        console.error('Error opening product details:', err);
    }
}

function closeProductDetailModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) modal.classList.add('hidden');
}

function switchDetailMainImage(imgUrl) {
    document.getElementById('detail-main-image').src = imgUrl;
}

function selectDetailColor(btn) {
    document.querySelectorAll('#detail-colors-list button').forEach(b => {
        b.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-900 text-slate-400 border-slate-700';
    });
    btn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold border bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
}

function adjustDetailQty(delta) {
    if (!state.activeDetailProduct) return;
    const max = state.activeDetailProduct.stock_quantity || 99;
    state.detailQuantity = Math.max(1, Math.min(max, state.detailQuantity + delta));
    document.getElementById('detail-qty').textContent = state.detailQuantity;
}

function estimateDelivery() {
    const input = document.getElementById('pincode-input');
    const result = document.getElementById('delivery-estimate-result');
    const val = input.value.trim();

    if (val.length < 5) {
        result.textContent = 'Please enter a valid 6-digit postal pincode.';
        result.className = 'text-[11px] text-rose-400 font-mono';
        result.classList.remove('hidden');
        return;
    }

    result.textContent = `⚡ Quantum Drone Delivery available to ${val}! Estimated delivery today within 3 hours.`;
    result.className = 'text-[11px] text-emerald-400 font-mono';
    result.classList.remove('hidden');
}

function switchDetailTab(tab) {
    const paneSpecs = document.getElementById('pane-specs');
    const paneReviews = document.getElementById('pane-reviews');
    const tabBtnSpecs = document.getElementById('tab-btn-specs');
    const tabBtnReviews = document.getElementById('tab-btn-reviews');

    if (tab === 'specs') {
        paneSpecs.classList.remove('hidden');
        paneReviews.classList.add('hidden');
        tabBtnSpecs.className = 'text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-2 transition';
        tabBtnReviews.className = 'text-xs font-bold text-slate-400 hover:text-white pb-2 transition';
    } else {
        paneSpecs.classList.add('hidden');
        paneReviews.classList.remove('hidden');
        tabBtnSpecs.className = 'text-xs font-bold text-slate-400 hover:text-white pb-2 transition';
        tabBtnReviews.className = 'text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 pb-2 transition';
    }
}

function renderDetailSpecs(specs) {
    const container = document.getElementById('detail-specs-grid');
    if (!container) return;

    if (!specs || Object.keys(specs).length === 0) {
        container.innerHTML = `<div class="p-3 text-slate-400">Standard specifications apply.</div>`;
        return;
    }

    container.innerHTML = Object.entries(specs).map(([key, val]) => `
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
            <span class="text-slate-400 font-mono text-[11px]">${key}</span>
            <span class="text-white font-bold text-[11px] text-right font-mono">${val}</span>
        </div>
    `).join('');
}

function renderDetailReviews(reviews) {
    const list = document.getElementById('detail-reviews-list');
    const tabCount = document.getElementById('detail-review-tab-count');
    if (!list) return;

    if (tabCount) tabCount.textContent = (reviews && reviews.length) || 0;

    if (!reviews || reviews.length === 0) {
        list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-mono">No reviews yet. Be the first to share your thoughts!</div>`;
        return;
    }

    list.innerHTML = reviews.map(r => `
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-white">${r.customer_name}</span>
                    ${r.verified_purchase ? '<span class="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Verified Buyer</span>' : ''}
                </div>
                <span class="text-[10px] text-slate-500 font-mono">${r.created_at}</span>
            </div>
            <div class="flex text-amber-400 text-xs">
                ${Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
            </div>
            <div class="text-xs font-bold text-slate-200">${r.title}</div>
            <p class="text-xs text-slate-400 leading-relaxed">${r.comment}</p>
        </div>
    `).join('');
}

async function submitProductReview() {
    if (!state.activeDetailProduct) return;
    const pid = state.activeDetailProduct.product_id;
    const name = document.getElementById('review-input-name').value.trim();
    const title = document.getElementById('review-input-title').value.trim();
    const rating = document.getElementById('review-input-rating').value;
    const comment = document.getElementById('review-input-comment').value.trim();

    if (!name || !title || !comment) {
        showToast('Review Incomplete', 'Please fill in your name, title, and review comments.', 'fa-triangle-exclamation');
        return;
    }

    try {
        const res = await fetch(`/api/products/${pid}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name, rating, title, comment })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Review Submitted', 'Thank you! Your verified review has been published.', 'fa-star');
            // Refresh modal product details
            openProductDetail(pid);
        } else {
            showToast('Submission Failed', data.error || 'Could not submit review.', 'fa-triangle-exclamation');
        }
    } catch (err) {
        console.error('Error submitting review:', err);
    }
}

// ==========================================
// 7. SHOPPING CART ENGINE & PERSISTENCE
// ==========================================
function addToCart(productId, productName, unitPrice, quantity = 1) {
    const existing = state.cart.find(it => it.product_id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        const prod = state.products.find(p => p.product_id === productId);
        state.cart.push({
            product_id: productId,
            product_name: productName,
            unit_price: Number(unitPrice),
            quantity: quantity,
            image: prod ? getProductMainImage(prod) : FALLBACK_IMAGES[productId] || ''
        });
    }

    saveCart();
    renderCart();
    showToast('Added to Cart', `${productName} (${quantity} unit${quantity > 1 ? 's' : ''}) added!`, 'fa-cart-plus');
}

function updateCartQuantity(productId, delta) {
    const item = state.cart.find(it => it.product_id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(it => it.product_id !== productId);
    }

    saveCart();
    renderCart();
}

function removeCartItem(productId) {
    state.cart = state.cart.filter(it => it.product_id !== productId);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('aether_cart', JSON.stringify(state.cart));
    updateCartBadges();
}

function updateCartBadges() {
    const totalCount = state.cart.reduce((sum, it) => sum + it.quantity, 0);
    const badge = document.getElementById('cart-badge');
    const drawerCount = document.getElementById('drawer-cart-count');

    if (badge) badge.textContent = totalCount;
    if (drawerCount) drawerCount.textContent = `${totalCount} item${totalCount !== 1 ? 's' : ''}`;
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount-amount');
    const totalEl = document.getElementById('cart-total');

    if (!list) return;

    if (state.cart.length === 0) {
        list.innerHTML = `
            <div class="py-16 text-center space-y-3">
                <div class="w-16 h-16 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-slate-500 text-2xl">
                    <i class="fa-solid fa-cart-shopping"></i>
                </div>
                <div class="text-sm font-bold text-white">Your cart is currently empty</div>
                <p class="text-xs text-slate-400 max-w-xs mx-auto">Explore high-performance audio, fashion, and tech in our catalog.</p>
                <button onclick="toggleCartDrawer(false); switchTab('storefront');" class="btn-primary px-4 py-2 rounded-xl text-xs font-semibold">
                    Start Shopping
                </button>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = '₹0.00';
        if (discountEl) discountEl.textContent = '-₹0.00';
        if (totalEl) totalEl.textContent = '₹0.00';
        updateCartBadges();
        return;
    }

    let subtotal = 0;
    list.innerHTML = state.cart.map(it => {
        const lineTotal = it.quantity * it.unit_price;
        subtotal += lineTotal;
        return `
            <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
                <img src="${it.image || FALLBACK_IMAGES[it.product_id] || ''}" class="w-14 h-14 object-contain rounded-xl bg-slate-950 p-1 flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${it.product_name}</h4>
                    <div class="text-[11px] text-cyan-400 font-mono">₹${it.unit_price.toLocaleString()}</div>
                    <div class="flex items-center space-x-2 mt-1">
                        <button onclick="updateCartQuantity(${it.product_id}, -1)" class="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">-</button>
                        <span class="text-xs font-mono font-bold text-white">${it.quantity}</span>
                        <button onclick="updateCartQuantity(${it.product_id}, 1)" class="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">+</button>
                    </div>
                </div>
                <div class="text-right flex flex-col justify-between items-end h-14">
                    <button onclick="removeCartItem(${it.product_id})" class="text-slate-500 hover:text-rose-400 text-xs">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <div class="text-xs font-mono font-bold text-white">₹${lineTotal.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');

    // Calculations
    let discountAmount = 0;
    if (state.appliedCoupon) {
        discountAmount = subtotal * state.appliedCoupon.discount_rate;
    }
    const finalTotal = subtotal - discountAmount;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (discountEl) discountEl.textContent = `-₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    updateCartBadges();
}

function toggleCartDrawer(open) {
    const container = document.getElementById('cart-drawer-container');
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');

    if (!container || !drawer) return;

    if (open) {
        renderCart();
        container.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
        }, 10);
    } else {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('translate-x-full');
        setTimeout(() => {
            container.classList.add('hidden');
        }, 300);
    }
}

async function handleApplyCoupon() {
    const code = document.getElementById('checkout-coupon').value.trim();
    const msgEl = document.getElementById('coupon-status-msg');

    if (!code) {
        showToast('Coupon Error', 'Please enter a coupon code.', 'fa-triangle-exclamation');
        return;
    }

    try {
        const res = await fetch('/api/discounts/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.valid) {
            state.appliedCoupon = data.discount;
            localStorage.setItem('aether_coupon', JSON.stringify(data.discount));
            msgEl.textContent = data.message;
            msgEl.className = 'text-[11px] text-emerald-400 font-mono block';
            renderCart();
            showToast('Coupon Applied!', data.message, 'fa-tag');
        } else {
            state.appliedCoupon = null;
            localStorage.removeItem('aether_coupon');
            msgEl.textContent = data.message || 'Invalid coupon code';
            msgEl.className = 'text-[11px] text-rose-400 font-mono block';
            renderCart();
        }
    } catch (err) {
        console.error('Coupon validation error:', err);
    }
}

// ==========================================
// 8. WISHLIST MANAGEMENT
// ==========================================
async function toggleWishlist(productId) {
    const customerId = state.currentUser ? (state.currentUser.customer_id || 1) : 1;
    const inWishlist = state.wishlist.includes(productId);

    if (inWishlist) {
        state.wishlist = state.wishlist.filter(id => id !== productId);
    } else {
        state.wishlist.push(productId);
    }

    localStorage.setItem('aether_wishlist', JSON.stringify(state.wishlist));
    updateWishlistBadges();

    // Call backend API
    try {
        await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: customerId, product_id: productId })
        });
    } catch (e){}

    renderProducts();
    if (state.currentTab === 'wishlist-view') renderWishlistView();

    showToast(
        inWishlist ? 'Removed from Wishlist' : 'Saved to Wishlist',
        inWishlist ? 'Product removed from your saved list.' : 'Product saved for easy checkout later!',
        inWishlist ? 'fa-heart-crack' : 'fa-heart'
    );
}

function updateWishlistBadges() {
    const badge = document.getElementById('wishlist-badge');
    const sideCount = document.getElementById('sidebar-wishlist-count');
    if (badge) badge.textContent = state.wishlist.length;
    if (sideCount) sideCount.textContent = state.wishlist.length;
}

function renderWishlistView() {
    const grid = document.getElementById('wishlist-cards-grid');
    const empty = document.getElementById('wishlist-empty-state');
    if (!grid) return;

    if (state.wishlist.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');

    const wishlistProducts = state.products.filter(p => state.wishlist.includes(p.product_id));

    grid.innerHTML = wishlistProducts.map(p => `
        <div class="glass-card-interactive p-4 rounded-3xl flex flex-col justify-between space-y-4">
            <div class="image-zoom-container rounded-2xl h-44 bg-slate-900/80 flex items-center justify-center p-3 relative">
                <img src="${getProductMainImage(p)}" class="max-h-full object-contain filter drop-shadow-md">
                <button onclick="toggleWishlist(${p.product_id})" class="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-rose-500 hover:text-white transition">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="space-y-1">
                <div class="text-[10px] font-mono text-cyan-400 font-bold uppercase">${p.brand || 'Wyntox'} • ${p.category_name}</div>
                <h4 class="text-sm font-bold text-white">${p.product_name}</h4>
                <div class="text-base font-extrabold text-white font-mono">₹${Number(p.unit_price).toLocaleString()}</div>
            </div>
            <button onclick="addToCart(${p.product_id}, '${p.product_name.replace(/'/g, "\\'")}', ${p.unit_price}); toggleWishlist(${p.product_id});" class="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Move to Cart</span>
            </button>
        </div>
    `).join('');
}

// ==========================================
// 9. MULTI-STEP CHECKOUT & ORDER SUBMISSION
// ==========================================
function openMultiStepCheckout() {
    toggleCartDrawer(false);
    if (state.cart.length === 0) {
        showToast('Cart Empty', 'Please add products before checking out.', 'fa-triangle-exclamation');
        return;
    }

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('hidden');

    populateCheckoutCustomers();
    goToCheckoutStep(1);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
}

function goToCheckoutStep(step) {
    state.checkoutStep = step;

    for (let i = 1; i <= 4; i++) {
        const stepPane = document.getElementById(`checkout-step-${i}`);
        const pill = document.getElementById(`checkout-step-pill-${i}`);
        if (stepPane && pill) {
            if (i === step) {
                stepPane.classList.remove('hidden');
                pill.className = 'py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold font-mono';
            } else if (i < step) {
                stepPane.classList.add('hidden');
                pill.className = 'py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-mono';
            } else {
                stepPane.classList.add('hidden');
                pill.className = 'py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 font-bold font-mono';
            }
        }
    }

    // Step 4 final summary update
    if (step === 4) {
        const selectCust = document.getElementById('checkout-customer-select');
        const selectedText = selectCust ? selectCust.options[selectCust.selectedIndex].text : 'Aarav Sharma';
        
        let subtotal = state.cart.reduce((s, it) => s + (it.quantity * it.unit_price), 0);
        let disc = state.appliedCoupon ? subtotal * state.appliedCoupon.discount_rate : 0;
        let finalAmt = subtotal - disc;

        document.getElementById('review-customer-name').textContent = selectedText;
        document.getElementById('review-courier').textContent = state.selectedDeliveryTier;
        document.getElementById('review-payment-method').textContent = state.selectedPayMethod;
        document.getElementById('review-items-count').textContent = `${state.cart.reduce((s, it) => s + it.quantity, 0)} items`;
        document.getElementById('review-final-amount').textContent = `₹${finalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
}

function populateCheckoutCustomers() {
    const select = document.getElementById('checkout-customer-select');
    if (!select) return;

    select.innerHTML = state.customers.map(c => `
        <option value="${c.customer_id}" data-city="${c.city}">${c.first_name} ${c.last_name} (${c.email} • ${c.city})</option>
    `).join('');

    handleCheckoutCustomerChange();
}

function handleCheckoutCustomerChange() {
    const select = document.getElementById('checkout-customer-select');
    if (!select || !select.selectedOptions[0]) return;
    const city = select.selectedOptions[0].dataset.city || 'Delhi';
    document.getElementById('checkout-city').value = city;
}

function selectPayMethod(method) {
    state.selectedPayMethod = method;
    const methods = ['UPI', 'CreditCard', 'NetBanking', 'COD'];
    methods.forEach(m => {
        const btn = document.getElementById(`pay-method-btn-${m}`);
        if (btn) {
            if ((m === 'CreditCard' && method === 'Credit Card') ||
                (m === 'NetBanking' && method === 'Net Banking') ||
                (m === 'COD' && method === 'Cash on Delivery') ||
                (m === 'UPI' && method === 'UPI')) {
                btn.className = 'p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition';
            } else {
                btn.className = 'p-3 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:text-white font-bold transition';
            }
        }
    });

    const upiPane = document.getElementById('pay-panel-UPI');
    const cardPane = document.getElementById('pay-panel-CreditCard');

    if (method === 'UPI') {
        if (upiPane) upiPane.classList.remove('hidden');
        if (cardPane) cardPane.classList.add('hidden');
    } else if (method === 'Credit Card') {
        if (upiPane) upiPane.classList.add('hidden');
        if (cardPane) cardPane.classList.remove('hidden');
    } else {
        if (upiPane) upiPane.classList.add('hidden');
        if (cardPane) cardPane.classList.add('hidden');
    }
}

async function executeFinalOrderSubmission() {
    const select = document.getElementById('checkout-customer-select');
    const customerId = select ? Number(select.value) : 1;

    const payload = {
        customer_id: customerId,
        items: state.cart.map(it => ({ product_id: it.product_id, quantity: it.quantity })),
        discount_code: state.appliedCoupon ? state.appliedCoupon.discount_code : 'NONE',
        payment_method: state.selectedPayMethod,
        courier_name: state.selectedDeliveryTier
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
            // Confetti Blast Celebration!
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }

            // Hide step 4, show success pane
            document.getElementById('checkout-step-4').classList.add('hidden');
            const successPane = document.getElementById('checkout-success-pane');
            successPane.classList.remove('hidden');

            document.getElementById('success-order-id').textContent = `#${result.order_id}`;
            document.getElementById('success-courier').textContent = `${result.delivery.courier} (Tracking #${result.delivery.delivery_id})`;

            // Clear Cart
            state.cart = [];
            state.appliedCoupon = null;
            localStorage.removeItem('aether_cart');
            localStorage.removeItem('aether_coupon');
            updateCartBadges();

            // Refresh products & inventory
            loadProducts();
            showToast('Order Authorized!', result.message, 'fa-check');
        } else {
            showToast('Transaction Failed', result.error || 'Could not place order', 'fa-triangle-exclamation');
        }
    } catch (err) {
        console.error('Final order execution error:', err);
        showToast('Error', 'Internal order submission error.', 'fa-triangle-exclamation');
    }
}

// ==========================================
// 10. HOLOGRAPHIC AUTHENTICATION & PERSONAS
// ==========================================
function switchAuthTab(subtab) {
    const tabs = ['signin', 'register', 'roles'];
    tabs.forEach(t => {
        const pane = document.getElementById(`auth-pane-${t}`);
        const btn = document.getElementById(`auth-tab-btn-${t}`);
        if (pane && btn) {
            if (t === subtab) {
                pane.classList.remove('hidden');
                btn.className = 'flex-1 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition';
            } else {
                pane.classList.add('hidden');
                btn.className = 'flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition';
            }
        }
    });
}

async function quickAuthAs(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    switchAuthTab('signin');
    await handleLoginSubmit(new Event('submit'));
}

function handleBiometricQuickLogin() {
    showToast('Biometric Scanned', 'Touch ID verified. Authenticating session as Administrator...', 'fa-fingerprint');
    setTimeout(() => {
        quickAuthAs('ecom_admin', 'Admin@2026');
    }, 600);
}

async function handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errEl = document.getElementById('login-error-msg');

    if (!username) return;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            state.currentUser = data.user;
            localStorage.setItem('aether_user', JSON.stringify(data.user));
            updateHeaderAuthDisplay();
            if (errEl) errEl.classList.add('hidden');
            showToast('Authentication Success', data.message, 'fa-user-check');
            switchTab('storefront');
        } else {
            if (errEl) {
                errEl.textContent = data.error || 'Authentication rejected.';
                errEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Login error:', err);
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const first_name = document.getElementById('reg-first-name').value.trim();
    const last_name = document.getElementById('reg-last-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const city = document.getElementById('reg-city').value.trim();
    const errEl = document.getElementById('register-error-msg');

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email, phone, city })
        });
        const data = await res.json();

        if (data.success) {
            state.currentUser = data.user;
            localStorage.setItem('aether_user', JSON.stringify(data.user));
            updateHeaderAuthDisplay();
            showToast('Account Created!', data.message, 'fa-user-plus');
            switchTab('storefront');
            loadCustomers();
        } else {
            if (errEl) {
                errEl.textContent = data.error || 'Registration failed.';
                errEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Registration error:', err);
    }
}

function updateHeaderAuthDisplay() {
    const user = state.currentUser;
    if (!user) return;

    const avatar = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const roleBadge = document.getElementById('nav-user-role-badge');
    const sideLabel = document.getElementById('sidebar-login-label');

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
    if (avatar) avatar.textContent = initials;
    if (nameEl) nameEl.textContent = user.name || user.username;
    if (roleBadge) roleBadge.textContent = user.roleBadge || user.role;
    if (sideLabel) sideLabel.textContent = `${user.roleTitle || 'User'} (${user.username.split('@')[0]})`;
}

// ==========================================
// 11. ADMIN MANAGEMENT HUB
// ==========================================
async function loadAdminHub() {
    renderAdminProductsTable();
    renderAdminOrdersTable();
    renderAdminCouponsTable();
}

function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-table-body');
    if (!tbody) return;

    tbody.innerHTML = state.products.map(p => `
        <tr class="hover:bg-slate-900/60 transition">
            <td class="p-3 font-mono text-cyan-400">#${p.product_id}</td>
            <td class="p-3 font-bold text-white">${p.product_name}</td>
            <td class="p-3 text-slate-300">${p.category_name}</td>
            <td class="p-3 font-mono font-bold text-white">₹${Number(p.unit_price).toLocaleString()}</td>
            <td class="p-3 font-mono ${p.stock_quantity <= p.reorder_level ? 'text-amber-400 font-bold' : 'text-slate-300'}">
                ${p.stock_quantity} units
            </td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono">${p.badge || 'PRO'}</span>
            </td>
            <td class="p-3 text-right space-x-2">
                <button onclick="editProductInline(${p.product_id})" class="text-slate-400 hover:text-cyan-400 text-xs p-1" title="Edit Price/Stock">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteProductAdmin(${p.product_id})" class="text-slate-400 hover:text-rose-400 text-xs p-1" title="Delete Product">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function editProductInline(productId) {
    const prod = state.products.find(p => p.product_id === productId);
    if (!prod) return;

    const newPrice = prompt(`Enter new unit price (₹) for "${prod.product_name}":`, prod.unit_price);
    if (newPrice === null) return;
    const newStock = prompt(`Enter new stock quantity for "${prod.product_name}":`, prod.stock_quantity);
    if (newStock === null) return;

    try {
        const res = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit_price: Number(newPrice), stock_quantity: Number(newStock) })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Product Updated', data.message, 'fa-check');
            await loadProducts();
            renderAdminProductsTable();
        } else {
            showToast('Error', data.error, 'fa-triangle-exclamation');
        }
    } catch (e){}
}

async function deleteProductAdmin(productId) {
    if (!confirm(`Are you sure you want to delete product #${productId}?`)) return;

    try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Deleted', data.message, 'fa-trash-can');
            await loadProducts();
            renderAdminProductsTable();
        } else {
            showToast('Referential Integrity Notice', data.error, 'fa-shield-halved');
        }
    } catch (e){}
}

async function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('/api/orders');
        state.orders = await res.json();

        tbody.innerHTML = state.orders.map(o => `
            <tr class="hover:bg-slate-900/60 transition">
                <td class="p-3 font-mono text-cyan-400">#${o.order_id}</td>
                <td class="p-3 font-bold text-white">${o.customer_name}</td>
                <td class="p-3 font-mono text-slate-400 text-xs">${o.order_date}</td>
                <td class="p-3 font-mono font-bold text-white">₹${Number(o.net_amount).toLocaleString()}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        o.order_status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                        o.order_status === 'Shipped' ? 'bg-cyan-500/20 text-cyan-300' :
                        o.order_status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-amber-500/20 text-amber-300'
                    }">${o.order_status}</span>
                </td>
                <td class="p-3 text-slate-300 text-xs font-mono">${o.courier_name || 'Blue Dart'}</td>
                <td class="p-3 text-right">
                    <select onchange="updateOrderStatusAdmin(${o.order_id}, this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300">
                        <option value="Placed" ${o.order_status === 'Placed' ? 'selected' : ''}>Placed</option>
                        <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (e){}
}

async function updateOrderStatusAdmin(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Order Updated', data.message, 'fa-truck-fast');
            renderAdminOrdersTable();
        }
    } catch (e){}
}

async function renderAdminCouponsTable() {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('/api/discounts');
        const coupons = await res.json();

        tbody.innerHTML = coupons.map(c => `
            <tr class="hover:bg-slate-900/60 transition">
                <td class="p-3 font-mono text-cyan-400">#${c.discount_id}</td>
                <td class="p-3 font-bold font-mono text-white text-xs">${c.discount_code}</td>
                <td class="p-3 font-mono text-cyan-300 font-bold">${Math.round(c.discount_rate * 100)}% OFF</td>
                <td class="p-3 font-mono text-slate-400 text-xs">${c.valid_from}</td>
                <td class="p-3 font-mono text-slate-400 text-xs">${c.valid_to}</td>
                <td class="p-3 font-mono text-white text-xs">${c.usage_count} orders</td>
            </tr>
        `).join('');
    } catch (e){}
}

function openAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}
function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

async function handleCreateProduct(e) {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const category_id = document.getElementById('new-prod-category').value;
    const brand = document.getElementById('new-prod-brand').value.trim();
    const unit_price = document.getElementById('new-prod-price').value;
    const stock_quantity = document.getElementById('new-prod-stock').value;
    const reorder_level = document.getElementById('new-prod-reorder').value;
    const desc = document.getElementById('new-prod-desc').value.trim();
    const img = document.getElementById('new-prod-image').value.trim();

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: name,
                category_id,
                brand,
                unit_price,
                stock_quantity,
                reorder_level,
                short_description: desc,
                images: img ? [img] : []
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Product Created', data.message, 'fa-check');
            closeAddProductModal();
            await loadProducts();
            renderAdminProductsTable();
        } else {
            showToast('Error', data.error, 'fa-triangle-exclamation');
        }
    } catch (e){}
}

function openAddCouponModal() {
    document.getElementById('add-coupon-modal').classList.remove('hidden');
}
function closeAddCouponModal() {
    document.getElementById('add-coupon-modal').classList.add('hidden');
}

async function handleCreateCoupon(e) {
    e.preventDefault();
    const discount_code = document.getElementById('new-coupon-code').value.trim().toUpperCase();
    const discount_rate = document.getElementById('new-coupon-rate').value;
    const valid_from = document.getElementById('new-coupon-from').value;
    const valid_to = document.getElementById('new-coupon-to').value;

    try {
        const res = await fetch('/api/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discount_code, discount_rate, valid_from, valid_to })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Coupon Created', data.message, 'fa-ticket');
            closeAddCouponModal();
            renderAdminCouponsTable();
        } else {
            showToast('Error', data.error, 'fa-triangle-exclamation');
        }
    } catch (e){}
}

// ==========================================
// 12. ANALYTICS & BI CHARTS ENGINE
// ==========================================
async function loadAnalytics() {
    try {
        // KPI Overview
        const kpiRes = await fetch('/api/analytics/kpi');
        const kpis = await kpiRes.json();

        document.getElementById('kpi-gross-rev').textContent = `₹${Number(kpis.grossRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('kpi-net-rev').textContent = `₹${Number(kpis.netRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('kpi-orders-count').textContent = kpis.orders.total_orders;
        document.getElementById('kpi-customers-count').textContent = kpis.customers.total_customers;

        // Charts
        const chartsRes = await fetch('/api/analytics/charts');
        const chartsData = await chartsRes.json();

        renderCharts(chartsData);
    } catch (err) {
        console.error('Analytics load error:', err);
    }
}

function renderCharts(data) {
    if (typeof Chart === 'undefined') return;

    // Chart 1: Category Sales Bar Chart
    const ctx1 = document.getElementById('chart-category-sales');
    if (ctx1) {
        if (state.charts.category) state.charts.category.destroy();
        state.charts.category = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: data.categorySales.map(c => c.category_name),
                datasets: [{
                    label: 'Revenue (₹)',
                    data: data.categorySales.map(c => c.revenue),
                    backgroundColor: 'rgba(6, 182, 212, 0.7)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
            }
        });
    }

    // Chart 2: Payment Methods Doughnut
    const ctx2 = document.getElementById('chart-payment-methods');
    if (ctx2) {
        if (state.charts.payments) state.charts.payments.destroy();
        state.charts.payments = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: data.paymentMethods.map(p => p.payment_method),
                datasets: [{
                    data: data.paymentMethods.map(p => p.total_collected),
                    backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }

    // Chart 3: Cumulative Running Revenue
    const ctx3 = document.getElementById('chart-cumulative-rev');
    if (ctx3) {
        if (state.charts.cumulative) state.charts.cumulative.destroy();
        state.charts.cumulative = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: data.cumulativeRev.map(r => r.order_date),
                datasets: [{
                    label: 'Running Revenue (₹)',
                    data: data.cumulativeRev.map(r => r.cumulative_revenue),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 9 } } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
            }
        });
    }

    // Chart 4: City Sales
    const ctx4 = document.getElementById('chart-city-sales');
    if (ctx4) {
        if (state.charts.city) state.charts.city.destroy();
        state.charts.city = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: data.citySales.map(c => c.city),
                datasets: [{
                    label: 'City Orders',
                    data: data.citySales.map(c => c.orders_placed),
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
            }
        });
    }
}

// ==========================================
// 13. INVENTORY & STOCK MANAGEMENT
// ==========================================
async function loadInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('/api/inventory');
        state.inventory = await res.json();

        tbody.innerHTML = state.inventory.map(item => {
            const isLow = item.stock_quantity <= item.reorder_level;
            return `
                <tr class="hover:bg-slate-900/60 transition">
                    <td class="p-3 font-mono text-cyan-400">#${item.product_id}</td>
                    <td class="p-3 font-bold text-white">${item.product_name}</td>
                    <td class="p-3 text-slate-400">${item.category_name}</td>
                    <td class="p-3 font-mono font-bold ${isLow ? 'text-amber-400' : 'text-white'}">
                        ${item.stock_quantity} units
                    </td>
                    <td class="p-3 font-mono text-slate-400">${item.reorder_level}</td>
                    <td class="p-3">
                        ${isLow 
                            ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">Low Stock Warning</span>` 
                            : `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">Optimal Stock</span>`
                        }
                    </td>
                    <td class="p-3 text-right">
                        <button onclick="quickRestockSingle(${item.product_id})" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono transition">
                            +25 Units
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Badge update
        const lowCount = state.inventory.filter(i => i.stock_quantity <= i.reorder_level).length;
        const lowBadge = document.getElementById('low-stock-count-badge');
        if (lowBadge) {
            lowBadge.textContent = lowCount;
            if (lowCount > 0) lowBadge.classList.remove('hidden');
            else lowBadge.classList.add('hidden');
        }
    } catch (e){}
}

async function quickRestockSingle(productId) {
    const item = state.inventory.find(i => i.product_id === productId);
    if (!item) return;

    try {
        const res = await fetch(`/api/inventory/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stock_quantity: item.stock_quantity + 25,
                reorder_level: item.reorder_level
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Stock Replenished', `Added +25 units to ${item.product_name}!`, 'fa-box');
            loadInventory();
            loadProducts();
        }
    } catch (e){}
}

async function handleRestockAllLowItems() {
    try {
        const res = await fetch('/api/inventory/restock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ units: 50 })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Bulk Restock Complete', data.message, 'fa-truck-ramp-box');
            loadInventory();
            loadProducts();
        }
    } catch (e){}
}

// ==========================================
// 14. ORDERS & LOGISTICS TRACKING
// ==========================================
async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('/api/orders');
        state.orders = await res.json();

        const filter = document.getElementById('order-status-filter').value;
        const filtered = filter === 'ALL' ? state.orders : state.orders.filter(o => o.order_status === filter);

        tbody.innerHTML = filtered.map(o => `
            <tr class="hover:bg-slate-900/60 transition">
                <td class="p-3 font-mono text-cyan-400 font-bold">#${o.order_id}</td>
                <td class="p-3">
                    <div class="font-bold text-white text-xs">${o.customer_name}</div>
                    <div class="text-[10px] text-slate-500 font-mono">${o.city}</div>
                </td>
                <td class="p-3 font-mono text-slate-300 text-xs">${o.order_date}</td>
                <td class="p-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        o.order_status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        o.order_status === 'Shipped' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        o.order_status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }">${o.order_status}</span>
                </td>
                <td class="p-3 font-mono font-bold text-white">₹${Number(o.net_amount).toLocaleString()}</td>
                <td class="p-3 font-mono text-xs text-slate-300">
                    <i class="fa-solid fa-truck-fast text-cyan-400 mr-1"></i>${o.courier_name || 'Blue Dart'}
                </td>
                <td class="p-3 text-right">
                    ${o.order_status === 'Shipped' || o.order_status === 'Placed' 
                        ? `<button onclick="markDelivered(${o.order_id})" class="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold transition">Mark Delivered</button>`
                        : `<span class="text-[11px] text-slate-500 font-mono">Settled</span>`
                    }
                </td>
            </tr>
        `).join('');
    } catch (e){}
}

async function markDelivered(orderId) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Delivered' })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Delivered!', data.message, 'fa-truck-ramp-box');
            loadOrders();
        }
    } catch (e){}
}

// ==========================================
// 15. CAPSTONE SQL QUERY STUDIO
// ==========================================
async function loadPredefinedQueries() {
    try {
        const res = await fetch('/api/query/predefined');
        state.predefinedQueries = await res.json();

        const select = document.getElementById('predefined-queries-select');
        if (select) {
            select.innerHTML = '<option value="">-- Choose from 38 Pre-Loaded Capstone Queries --</option>' +
                state.predefinedQueries.map((q, idx) => `
                    <option value="${idx}">Query #${idx + 1}: ${q.title} (${q.category})</option>
                `).join('');

            select.addEventListener('change', (e) => {
                const idx = e.target.value;
                if (idx !== '') {
                    const q = state.predefinedQueries[idx];
                    document.getElementById('sql-editor').value = q.sql;
                }
            });
        }
    } catch (e){}
}

async function runSqlQuery() {
    const sql = document.getElementById('sql-editor').value.trim();
    if (!sql) return;

    const resMeta = document.getElementById('query-result-meta');
    const timeEl = document.getElementById('query-exec-time');
    const container = document.getElementById('query-results-container');

    resMeta.textContent = 'Executing query against SQLite BCNF database...';

    try {
        const res = await fetch('/api/query/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql })
        });
        const result = await res.json();

        timeEl.textContent = `${result.executionTimeMs} ms`;

        if (result.error) {
            resMeta.textContent = 'Query execution failed.';
            container.innerHTML = `<div class="p-6 text-rose-400 font-mono text-xs">${result.error}</div>`;
            return;
        }

        if (result.isDml) {
            resMeta.textContent = result.message;
            container.innerHTML = `<div class="p-6 text-emerald-400 font-mono text-xs"><i class="fa-solid fa-check mr-2"></i>${result.message}</div>`;
            return;
        }

        state.lastQueryResult = result;
        resMeta.textContent = `Returned ${result.rowCount} row${result.rowCount !== 1 ? 's' : ''}.`;

        if (result.rowCount === 0) {
            container.innerHTML = `<div class="p-6 text-slate-400 font-mono text-xs">Query returned 0 rows.</div>`;
            return;
        }

        let tableHtml = `<table class="w-full text-left data-table font-mono text-xs"><thead><tr>`;
        result.columns.forEach(col => {
            tableHtml += `<th class="p-3">${col}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        result.rows.forEach(row => {
            tableHtml += `<tr class="hover:bg-slate-900/60">`;
            result.columns.forEach(col => {
                tableHtml += `<td class="p-3">${row[col] !== null ? row[col] : '<span class="text-slate-600">NULL</span>'}</td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;

        container.innerHTML = tableHtml;
    } catch (err) {
        console.error('SQL Runner error:', err);
    }
}

function exportQueryResults(format) {
    if (!state.lastQueryResult || !state.lastQueryResult.rows || state.lastQueryResult.rows.length === 0) {
        showToast('Export Error', 'No active query results to export.', 'fa-triangle-exclamation');
        return;
    }

    const rows = state.lastQueryResult.rows;
    let content = '';
    let mime = 'text/plain';
    let filename = `wyntox_query_export_${Date.now()}.${format}`;

    if (format === 'csv') {
        const cols = state.lastQueryResult.columns;
        content = cols.join(',') + '\n';
        rows.forEach(r => {
            content += cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        mime = 'text/csv';
    } else {
        content = JSON.stringify(rows, null, 2);
        mime = 'application/json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export Complete', `Downloaded ${filename}`, 'fa-download');
}

// ==========================================
// 16. TCL ACID SIMULATOR
// ==========================================
async function runTclSimulation() {
    const container = document.getElementById('tcl-steps-container');
    if (!container) return;

    container.innerHTML = `<div class="p-4 text-cyan-400 font-mono animate-pulse">Running transactional atomicity simulation...</div>`;

    try {
        const res = await fetch('/api/transaction/simulate', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            let html = '';
            data.logs.forEach(step => {
                html += `
                    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <div class="font-bold text-cyan-300">${step.step}</div>
                        <div class="text-slate-400 text-xs">${step.description}</div>
                    </div>
                `;
            });

            html += `
                <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1">
                    <div class="font-bold"><i class="fa-solid fa-check-circle mr-1.5"></i>TCL Verification Successful</div>
                    <div>Order #${data.testOrderId} persisted with single book item. Dumbbell stock restored to ${data.finalStock.product_14} upon savepoint rollback.</div>
                </div>
            `;

            container.innerHTML = html;
            showToast('TCL Simulator Done', 'ACID Savepoint & Rollback successfully verified!', 'fa-shield-halved');
        }
    } catch (e){}
}

// ==========================================
// 17. ER MODEL & BCNF INSPECTOR
// ==========================================
async function renderERDiagram() {
    const grid = document.getElementById('schema-tables-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/schema');
        const schema = await res.json();

        grid.innerHTML = schema.tables.map(tbl => `
            <div class="p-5 rounded-2xl glass-panel space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span class="font-bold text-white font-mono text-sm">${tbl.name}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">BCNF Entity</span>
                </div>
                <div class="space-y-1.5 font-mono text-xs">
                    <div class="text-amber-400 flex items-center space-x-1.5">
                        <span class="text-[9px] bg-amber-500/20 px-1 rounded font-bold">PK</span>
                        <span>${tbl.pk}</span>
                    </div>
                    ${tbl.fks.map(fk => `
                        <div class="text-cyan-400 flex items-center space-x-1.5 text-[11px]">
                            <span class="text-[9px] bg-cyan-500/20 px-1 rounded font-bold">FK</span>
                            <span>${fk}</span>
                        </div>
                    `).join('')}
                    ${tbl.uqs.map(uq => `
                        <div class="text-purple-400 flex items-center space-x-1.5 text-[11px]">
                            <span class="text-[9px] bg-purple-500/20 px-1 rounded font-bold">UQ</span>
                            <span>${uq}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (e){}
}

// Customers loader
async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        state.customers = await res.json();
    } catch (e){}
}

// ==========================================
// 18. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    initThemeAndMode();
    updateHeaderAuthDisplay();
    updateCartBadges();
    updateWishlistBadges();
    initFlashSaleTimer();

    // Setup tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Theme & Mode buttons
    const btnToggleMode = document.getElementById('btn-toggle-mode');
    if (btnToggleMode) btnToggleMode.addEventListener('click', toggleLightDarkMode);

    const btnOpenCart = document.getElementById('btn-open-cart');
    if (btnOpenCart) btnOpenCart.addEventListener('click', () => toggleCartDrawer(true));

    const btnOpenWish = document.getElementById('btn-open-wishlist');
    if (btnOpenWish) btnOpenWish.addEventListener('click', () => switchTab('wishlist-view'));

    const btnHeaderAuth = document.getElementById('btn-header-auth');
    if (btnHeaderAuth) btnHeaderAuth.addEventListener('click', () => switchTab('login'));

    // DB Reset button
    const btnResetDb = document.getElementById('btn-reset-db');
    if (btnResetDb) {
        btnResetDb.addEventListener('click', async () => {
            if (!confirm('Reset SQLite database to original capstone seed state?')) return;
            const res = await fetch('/api/database/reset', { method: 'POST' });
            const data = await res.json();
            showToast('Database Reset', data.message, 'fa-arrow-rotate-right');
            loadProducts();
            loadCategories();
            loadCustomers();
        });
    }

    // Catalog Filter Controls
    const storeSearch = document.getElementById('store-search');
    if (storeSearch) {
        storeSearch.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim();
            loadProducts();
        });
    }

    const brandFilter = document.getElementById('brand-filter');
    if (brandFilter) {
        brandFilter.addEventListener('change', (e) => {
            state.brandFilter = e.target.value;
            loadProducts();
        });
    }

    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', (e) => {
            state.stockFilter = e.target.value;
            loadProducts();
        });
    }

    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            state.sortFilter = e.target.value;
            loadProducts();
        });
    }

    const priceRange = document.getElementById('price-range');
    const priceLabel = document.getElementById('price-range-label');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            state.maxPrice = Number(e.target.value);
            if (priceLabel) priceLabel.textContent = `₹${state.maxPrice.toLocaleString()}`;
            loadProducts();
        });
    }

    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) btnResetFilters.addEventListener('click', resetAllFilters);

    // View Mode buttons
    const btnGrid = document.getElementById('btn-view-grid');
    const btnList = document.getElementById('btn-view-list');
    if (btnGrid && btnList) {
        btnGrid.addEventListener('click', () => {
            state.viewMode = 'grid';
            localStorage.setItem('aether_view_mode', 'grid');
            btnGrid.className = 'p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs transition';
            btnList.className = 'p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition';
            renderProducts();
        });
        btnList.addEventListener('click', () => {
            state.viewMode = 'list';
            localStorage.setItem('aether_view_mode', 'list');
            btnList.className = 'p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs transition';
            btnGrid.className = 'p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition';
            renderProducts();
        });
    }

    // SQL Studio buttons
    const btnRunQuery = document.getElementById('btn-run-query');
    if (btnRunQuery) btnRunQuery.addEventListener('click', runSqlQuery);

    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) btnExportCsv.addEventListener('click', () => exportQueryResults('csv'));

    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) btnExportJson.addEventListener('click', () => exportQueryResults('json'));

    // TCL Lab
    const btnRunTcl = document.getElementById('btn-run-tcl-sim');
    if (btnRunTcl) btnRunTcl.addEventListener('click', runTclSimulation);

    // Bulk restock
    const btnRestockAll = document.getElementById('btn-restock-all');
    if (btnRestockAll) btnRestockAll.addEventListener('click', handleRestockAllLowItems);

    // Order status filter in orders tab
    const orderStatusFilter = document.getElementById('order-status-filter');
    if (orderStatusFilter) orderStatusFilter.addEventListener('change', loadOrders);

    // Setup live search autocomplete
    initLiveSearchAutocomplete();

    // Initial Data Loads
    await loadCategories();
    await loadBrands();
    await loadCustomers();
    await loadProducts();
    await loadPredefinedQueries();
    await loadSmartRecommendations();
    renderERDiagram();
});
