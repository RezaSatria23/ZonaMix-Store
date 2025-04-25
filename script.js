// Konfigurasi Supabase
const supabaseUrl = 'https://znehlqzprtwvhscoeoim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Debugging flag
const DEBUG_MODE = true;

// Variabel Global
let products = [];
let cart = [];

// DOM Elements
const elements = {
    productGrid: document.getElementById('product-grid'),
    cartModal: document.getElementById('cart-modal'),
    preloader: document.querySelector('.preloader'),
    notification: document.getElementById('notification')
};

// 1. FUNGSI INISIALISASI
async function initializeApp() {
    if (DEBUG_MODE) console.log("Memulai inisialisasi aplikasi...");
    
    try {
        // Langsung tampilkan loading state
        showLoadingState();
        
        // Step 1: Load produk dari Supabase
        const productsLoaded = await loadProducts();
        if (DEBUG_MODE) console.log("Produk yang dimuat:", productsLoaded);
        
        if (!productsLoaded || productsLoaded.length === 0) {
            showEmptyState();
            return;
        }
        
        // Step 2: Render produk ke UI
        renderProducts();
        
        // Step 3: Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error("Error inisialisasi:", error);
        showErrorState();
    } finally {
        // Sembunyikan preloader setelah semua proses selesai
        hidePreloader();
    }
}

// 2. FUNGSI LOAD PRODUK (DENGAN DEBUGGING)
async function loadProducts() {
    if (DEBUG_MODE) console.log("Memulai load produk dari Supabase...");
    
    try {
        // Coba ambil data dari Supabase
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (DEBUG_MODE) console.log("Response dari Supabase:", data);
        
        products = data || [];
        
        // Simpan ke localStorage sebagai fallback
        localStorage.setItem('luxuryStoreProducts', JSON.stringify(products));
        
        return products;
        
    } catch (error) {
        console.error("Gagal memuat produk:", error);
        
        // Fallback 1: Coba dari localStorage
        const storedProducts = JSON.parse(localStorage.getItem('luxuryStoreProducts'));
        if (storedProducts && storedProducts.length > 0) {
            if (DEBUG_MODE) console.log("Menggunakan produk dari localStorage");
            products = storedProducts;
            showNotification('Menggunakan data offline', 'warning');
            return products;
        }
        
        // Fallback 2: Data dummy jika semua gagal
        if (DEBUG_MODE) console.log("Menggunakan data dummy");
        products = getDummyProducts();
        showNotification('Menggunakan data dummy', 'error');
        return products;
    }
}

// 3. FUNGSI RENDER PRODUK (DENGAN VALIDASI)
function renderProducts() {
    if (!elements.productGrid) {
        console.error("Element product-grid tidak ditemukan!");
        return;
    }

    if (!products || products.length === 0) {
        showEmptyState();
        return;
    }

    try {
        elements.productGrid.innerHTML = '';
        
        products.forEach(product => {
            if (!product.id || !product.name) {
                console.warn("Produk tidak valid:", product);
                return;
            }
            
            const productCard = createProductCard(product);
            elements.productGrid.appendChild(productCard);
        });
        
    } catch (error) {
        console.error("Error rendering products:", error);
        showErrorState();
    }
}

// 4. FUNGSI BANTUAN
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300?text=Gambar+Tidak+Tersedia'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description || 'Tidak ada deskripsi'}</p>
            <div class="product-price">Rp ${formatPrice(product.price)}</div>
            <button class="add-to-cart" data-id="${product.id}">
                <i class="fas fa-shopping-bag"></i> Tambah ke Keranjang
            </button>
        </div>
    `;
    return card;
}

function formatPrice(price) {
    return price ? price.toLocaleString('id-ID') : '0';
}

// 5. FUNGSI STATE UI
function showLoadingState() {
    if (!elements.productGrid) return;
    elements.productGrid.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Memuat produk...
        </div>
    `;
}

function showEmptyState() {
    if (!elements.productGrid) return;
    elements.productGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            Tidak ada produk yang tersedia
        </div>
    `;
}

function showErrorState() {
    if (!elements.productGrid) return;
    elements.productGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            Gagal memuat produk. Silakan refresh halaman.
        </div>
    `;
}

function hidePreloader() {
    if (!elements.preloader) return;
    
    elements.preloader.classList.add('fade-out');
    setTimeout(() => {
        elements.preloader.style.display = 'none';
    }, 500);
}

function showNotification(message, type = 'success') {
    if (!elements.notification) return;
    
    const notification = elements.notification;
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 6. DATA DUMMY UNTUK FALLBACK
function getDummyProducts() {
    return [
        {
            id: 1,
            name: "Produk Contoh 1",
            description: "Ini adalah produk contoh",
            price: 100000,
            image_url: "https://via.placeholder.com/300",
            is_published: true
        },
        {
            id: 2,
            name: "Produk Contoh 2",
            description: "Ini adalah produk contoh kedua",
            price: 150000,
            image_url: "https://via.placeholder.com/300",
            is_published: true
        }
    ];
}

// 7. EVENT LISTENERS DASAR
function setupEventListeners() {
    // Contoh event listener sederhana
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            addToCart(productId);
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    showNotification(`${product.name} ditambahkan ke keranjang`);
}

// 8. JALANKAN APLIKASI
document.addEventListener('DOMContentLoaded', initializeApp);