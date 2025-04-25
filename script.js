// Konfigurasi Supabase
const supabaseUrl = 'https://znehlqzprtwvhscoeoim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let products = [];
let cart = [];
let currentCategory = 'all';
let currentSort = 'default';
const whatsappNumber = '6281234567890';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwvonS2p2ClDmEx4WVU5ny31ktxFzM4-1fHrW-BQnRQNVIOqSuUZWFgT0Rf9EUekBN4/exec';

// DOM Elements
const elements = {
    productGrid: document.getElementById('product-grid'),
    cartModal: document.getElementById('cart-modal'),
    customerModal: document.getElementById('customer-modal'),
    paymentModal: document.getElementById('payment-modal'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    preloader: document.querySelector('.preloader')
};

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoadingState();
        await initializeApp();
    } catch (error) {
        console.error('Initialization error:', error);
        showErrorState();
    }
});

async function initializeApp() {
    await loadProducts();
    renderProducts();
    setupEventListeners();
    updateCartCount();
    setupRealtimeUpdates();
    
    // Hide preloader
    setTimeout(() => {
        elements.preloader.classList.add('fade-out');
        setTimeout(() => {
            elements.preloader.style.display = 'none';
        }, 500);
    }, 1500);
    
    // Admin check
    if (window.location.search.includes('admin=1')) {
        handleAdminLogin();
    }
}

function handleAdminLogin() {
    const adminLogin = confirm('Masuk sebagai admin?');
    if (adminLogin) {
        const password = prompt('Masukkan password admin:');
        if (password === 'luxury123') {
            localStorage.setItem('luxuryStoreAdminLoggedIn', 'true');
            window.location.href = 'admin.html';
        } else {
            alert('Password salah!');
        }
    }
}

// Product Functions
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        products = data || [];
        localStorage.setItem('luxuryStoreProducts', JSON.stringify(products));
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        const storedProducts = JSON.parse(localStorage.getItem('luxuryStoreProducts'));
        if (storedProducts) {
            products = storedProducts;
            showNotification('Menggunakan data offline', 'warning');
        }
        return products || [];
    }
}

function setupRealtimeUpdates() {
    return supabase
        .channel('products')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'products'
        }, async (payload) => {
            await loadProducts();
            renderProducts();
        })
        .subscribe();
}

function sortProducts(products, sortType) {
    const sorted = [...products];
    switch(sortType) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sorted;
    }
}

function renderProducts(productsToRender = products) {
    try {
        // Filter products
        let filteredProducts = currentCategory === 'all' 
            ? [...productsToRender] 
            : productsToRender.filter(product => product.category === currentCategory);
        
        // Sort products
        filteredProducts = sortProducts(filteredProducts, currentSort);
        
        // Clear and render
        elements.productGrid.innerHTML = '';
        
        if (!filteredProducts || filteredProducts.length === 0) {
            showEmptyState();
            return;
        }
        
        filteredProducts.forEach(product => {
            elements.productGrid.appendChild(createProductCard(product));
        });
        
        updateProductCount(filteredProducts.length);
    } catch (error) {
        console.error('Error rendering products:', error);
        showErrorState();
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-badge">${product.type === 'physical' ? 'Fisik' : 'Digital'}</div>
        <div class="product-image-container">
            <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300?text=Gambar+Tidak+Tersedia'">
        </div>
        <div class="product-info">
            <span class="product-category">${product.category?.toUpperCase() || 'UMUM'}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description || 'Tidak ada deskripsi'}</p>
            <div class="product-price">Rp ${product.price?.toLocaleString('id-ID') || '0'}</div>
            <button class="add-to-cart" data-id="${product.id}">
                <i class="fas fa-shopping-bag"></i> Tambah ke Keranjang
            </button>
        </div>
    `;
    return card;
}

// UI State Functions
function showLoadingState() {
    elements.productGrid.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Memuat produk...
        </div>
    `;
}

function showEmptyState() {
    elements.productGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            Tidak ada produk yang tersedia
        </div>
    `;
}

function showErrorState() {
    elements.productGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            Gagal memuat produk. Silakan refresh halaman.
        </div>
    `;
}

function updateProductCount(count) {
    document.getElementById('product-count').textContent = count;
}

function showNotification(message, type = 'success') {
    elements.notificationMessage.textContent = message;
    elements.notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('Produk tidak ditemukan', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            type: product.type || 'physical',
            category: product.category || 'general',
            image_url: product.image_url
        });
    }
    
    updateCartCount();
    showNotification(`${product.name} telah ditambahkan ke keranjang`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCartItems();
    updateCartCount();
    
    if (cart.length === 0) {
        elements.cartModal.style.display = 'none';
    }
}

function updateQuantity(productId, isIncrease) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    if (isIncrease) {
        item.quantity += 1;
    } else {
        item.quantity = item.quantity > 1 ? item.quantity - 1 : 1;
    }
    
    renderCartItems();
    updateCartCount();
}

function renderCartItems() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    cartItemsEl.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const product = products.find(p => p.id === item.id) || item;
        cartItemsEl.appendChild(createCartItemElement(item, product, itemTotal));
    });
    
    cartTotalEl.textContent = total.toLocaleString('id-ID');
}

function createCartItemElement(item, product, itemTotal) {
    const cartItemEl = document.createElement('div');
    cartItemEl.className = 'cart-item';
    cartItemEl.setAttribute('data-id', item.id);
    cartItemEl.innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/100'}" 
             alt="${item.name}" 
             class="cart-item-image"
             onerror="this.src='https://via.placeholder.com/100?text=Gambar'">
        <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-category">${item.category?.toUpperCase() || 'UMUM'}</div>
            <div class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
        </div>
        <div class="cart-item-controls">
            <button class="quantity-btn decrease">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn increase">+</button>
            <div class="remove-item"><i class="fas fa-trash"></i> Hapus</div>
        </div>
        <div class="cart-item-total">Rp ${itemTotal.toLocaleString('id-ID')}</div>
    `;
    return cartItemEl;
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

// Checkout Functions
function renderAddressFields() {
    const addressFields = document.getElementById('address-fields');
    addressFields.innerHTML = '';
    
    if (hasPhysicalProducts()) {
        addressFields.innerHTML = `
            <div class="form-group">
                <label for="customer-address">Alamat Lengkap</label>
                <textarea id="customer-address" required></textarea>
            </div>
            <div class="address-group">
                <div class="form-group">
                    <label for="customer-city">Kota/Kabupaten</label>
                    <input type="text" id="customer-city" required>
                </div>
                <div class="form-group">
                    <label for="customer-province">Provinsi</label>
                    <input type="text" id="customer-province" required>
                </div>
            </div>
            <div class="form-group">
                <label for="customer-postal">Kode Pos</label>
                <input type="text" id="customer-postal" required>
            </div>
        `;
    }
}

async function handleCustomerFormSubmit(e) {
    e.preventDefault();
    
    const formData = collectFormData();
    
    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            await saveOrder(formData);
            elements.customerModal.style.display = 'none';
            openPaymentModal();
        } else {
            showNotification('Gagal menyimpan data, silakan coba lagi', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengirim data', 'error');
    }
}

function collectFormData() {
    const formData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        notes: document.getElementById('customer-notes').value,
        orderSummary: generateOrderSummary(),
        totalAmount: calculateTotal()
    };
    
    if (hasPhysicalProducts()) {
        formData.address = document.getElementById('customer-address').value;
        formData.city = document.getElementById('customer-city').value;
        formData.province = document.getElementById('customer-province').value;
        formData.postal = document.getElementById('customer-postal').value;
    }
    
    return formData;
}

async function saveOrder(customerData) {
    const newOrder = createOrderObject(customerData);
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([newOrder])
            .select();
            
        if (error) throw error;
        console.log('Order saved to Supabase:', data);
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        saveOrderToLocalStorage(newOrder);
    }
    
    cart = [];
    updateCartCount();
    showNotification('Pesanan berhasil disimpan!');
}

function createOrderObject(customerData) {
    const order = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_notes: customerData.notes,
        products: cart,
        total_amount: calculateTotal(),
        status: 'pending'
    };
    
    if (hasPhysicalProducts()) {
        order.shipping_address = customerData.address;
        order.city = customerData.city;
        order.province = customerData.province;
        order.postal_code = customerData.postal;
    }
    
    return order;
}

function saveOrderToLocalStorage(order) {
    let orders = JSON.parse(localStorage.getItem('luxuryStoreOrders')) || [];
    orders.push(order);
    localStorage.setItem('luxuryStoreOrders', JSON.stringify(orders));
}

function openPaymentModal() {
    const total = calculateTotal();
    document.getElementById('payment-total').textContent = total.toLocaleString('id-ID');
    
    const orderItemsEl = document.getElementById('order-items');
    orderItemsEl.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span class="order-item-name">${item.name} (${item.quantity}x)</span>
            <span class="order-item-price">Rp ${itemTotal.toLocaleString('id-ID')}</span>
        `;
        orderItemsEl.appendChild(orderItem);
    });
    
    updateWhatsappLink(total);
    elements.paymentModal.style.display = 'block';
}

function updateWhatsappLink(total) {
    const customerName = document.getElementById('customer-name').value || 'Pelanggan';
    const whatsappMessage = `Halo, saya ${customerName}%0A%0ASaya telah melakukan pembayaran sebesar Rp ${total.toLocaleString('id-ID')} untuk pesanan berikut:%0A%0A${generateOrderSummary()}%0A%0ABerikut bukti transfernya:`;
    document.getElementById('whatsapp-btn').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
}

function generateOrderSummary() {
    return cart.map(item => {
        return `- ${item.name} (${item.quantity}x) : Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function hasPhysicalProducts() {
    return cart.some(item => item.type === 'physical');
}

// Event Listeners
function setupEventListeners() {
    // Category filter
    document.querySelectorAll('.nav-list li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            updateActiveCategory(link);
            renderProducts();
        });
    });
    
    // Sorting
    document.getElementById('sort-by').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
    });
    
    // Cart modal
    document.querySelector('.cart-icon').addEventListener('click', () => {
        renderCartItems();
        elements.cartModal.style.display = 'block';
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Outside click to close modals
    window.addEventListener('click', (e) => {
        if (e.target === elements.cartModal || 
            e.target === elements.customerModal || 
            e.target === elements.paymentModal) {
            closeAllModals();
        }
    });
    
    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length > 0) {
            elements.cartModal.style.display = 'none';
            elements.customerModal.style.display = 'block';
            renderAddressFields();
        }
    });
    
    // Form submission
    document.getElementById('customer-form').addEventListener('submit', handleCustomerFormSubmit);
    
    // Delegated events
    document.addEventListener('click', handleDelegatedEvents);
}

function updateActiveCategory(activeLink) {
    document.querySelectorAll('.nav-list li a').forEach(item => {
        item.classList.remove('active');
    });
    activeLink.classList.add('active');
}

function closeAllModals() {
    elements.cartModal.style.display = 'none';
    elements.customerModal.style.display = 'none';
    elements.paymentModal.style.display = 'none';
}

function handleDelegatedEvents(e) {
    // Add to cart
    if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
        const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
        const productId = parseInt(button.getAttribute('data-id'));
        addToCart(productId);
    }
    
    // Quantity buttons
    if (e.target.classList.contains('quantity-btn')) {
        const itemId = parseInt(e.target.closest('.cart-item').getAttribute('data-id'));
        const isIncrease = e.target.classList.contains('increase');
        updateQuantity(itemId, isIncrease);
    }
    
    // Remove item
    if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
        const itemId = parseInt(e.target.closest('.cart-item').getAttribute('data-id'));
        removeFromCart(itemId);
    }
}