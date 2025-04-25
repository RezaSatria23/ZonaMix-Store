// 1. KONFIGURASI SUPABASE
const SUPABASE_CONFIG = {
    url: 'https://znehlqzprtwvhscoeoim.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A',
    table: 'products'
};

// 2. INISIALISASI SUPABASE
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// 3. STATE APLIKASI
let appState = {
    products: [],
    isLoading: true,
    error: null
};

// 4. ELEMEN UTAMA
const UI = {
    productGrid: document.getElementById('product-grid'),
    preloader: document.querySelector('.preloader'),
    cartIcon: document.querySelector('.cart-icon'),
    notification: document.getElementById('notification')
};

// 5. FUNGSI UTAMA
async function initApp() {
    console.log('[App] Initializing application...');
    
    try {
        // Step 1: Load produk
        console.log('[App] Loading products...');
        await loadProducts();
        
        // Step 2: Render UI
        console.log('[App] Rendering products...');
        renderProductList();
        
    } catch (error) {
        console.error('[App] Initialization failed:', error);
        appState.error = error;
        showErrorUI();
        
    } finally {
        // Step 3: Sembunyikan preloader
        console.log('[App] Hiding preloader...');
        hidePreloader();
    }
}

// 6. FUNGSI LOAD PRODUK
async function loadProducts() {
    console.log('[Products] Attempting to load from Supabase...');
    
    try {
        // Coba ambil dari Supabase
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.table)
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }

        console.log('[Products] Data received:', data);
        
        if (!data || data.length === 0) {
            console.warn('[Products] No published products found');
            throw new Error('No published products available');
        }
        
        appState.products = data;
        saveToLocalStorage('products', data);
        
    } catch (error) {
        console.warn('[Products] Fallback to localStorage...');
        
        // Fallback 1: Coba dari localStorage
        const localProducts = getFromLocalStorage('products');
        if (localProducts && localProducts.length > 0) {
            console.log('[Products] Using localStorage data');
            appState.products = localProducts;
            showNotification('Using cached data', 'warning');
            return;
        }
        
        // Fallback 2: Data dummy
        console.warn('[Products] Using dummy data');
        appState.products = getDummyProducts();
        showNotification('Using demo products', 'error');
        throw error; // Tetap lempar error untuk penanganan UI
    }
}

// 7. FUNGSI RENDER PRODUK
function renderProductList() {
    console.log('[Render] Rendering product list...');
    
    if (!UI.productGrid) {
        console.error('[Render] Product grid element not found!');
        return;
    }

    // Clear existing content
    UI.productGrid.innerHTML = '';

    if (!appState.products || appState.products.length === 0) {
        console.warn('[Render] No products to display');
        UI.productGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                No products available
            </div>
        `;
        return;
    }

    // Render each product
    appState.products.forEach(product => {
        if (!product.id) {
            console.warn('[Render] Invalid product:', product);
            return;
        }
        
        const productCard = createProductCard(product);
        UI.productGrid.appendChild(productCard);
    });

    console.log(`[Render] Displayed ${appState.products.length} products`);
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/300?text=Image+Not+Available'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name || 'No Name'}</h3>
            <p class="product-description">${product.description || 'No description available'}</p>
            <div class="product-price">Rp ${product.price ? product.price.toLocaleString('id-ID') : '0'}</div>
            <button class="add-to-cart" data-id="${product.id}">
                <i class="fas fa-shopping-bag"></i> Add to Cart
            </button>
        </div>
    `;
    return card;
}

// 8. FUNGSI UI HELPER
function hidePreloader() {
    console.log('[UI] Hiding preloader...');
    if (!UI.preloader) return;

    UI.preloader.style.opacity = '0';
    setTimeout(() => {
        UI.preloader.style.display = 'none';
    }, 500);
}

function showNotification(message, type = 'info') {
    console.log(`[UI] Notification: ${message}`);
    if (!UI.notification) return;

    UI.notification.textContent = message;
    UI.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        UI.notification.classList.remove('show');
    }, 3000);
}

function showErrorUI() {
    console.error('[UI] Showing error state');
    if (!UI.productGrid) return;

    UI.productGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            Failed to load products. Please refresh the page.
            ${appState.error ? `<div class="error-detail">${appState.error.message}</div>` : ''}
        </div>
    `;
}

// 9. LOCALSTORAGE HELPER
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(`luxury_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage save failed:', e);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(`luxury_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('LocalStorage read failed:', e);
        return null;
    }
}

// 10. DATA DUMMY
function getDummyProducts() {
    return [
        {
            id: 1,
            name: "Premium Watch",
            description: "Luxury wristwatch with leather strap",
            price: 2500000,
            image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
            is_published: true
        },
        {
            id: 2,
            name: "Designer Handbag",
            description: "Elegant leather handbag",
            price: 3500000,
            image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300",
            is_published: true
        }
    ];
}

// 11. EVENT LISTENERS
function setupEventListeners() {
    // Contoh event listener untuk tombol add to cart
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart')) {
            const button = e.target.closest('.add-to-cart');
            const productId = parseInt(button.dataset.id);
            addToCart(productId);
        }
    });
}

function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    showNotification(`Added ${product.name} to cart`);
    // Implement cart logic here
}

// 12. JALANKAN APLIKASI
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM fully loaded');
    setupEventListeners();
    initApp();
});