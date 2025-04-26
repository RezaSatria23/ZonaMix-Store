// Konfigurasi Supabase
const supabaseUrl = 'https://znehlqzprtwvhscoeoim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Variabel Global
let products = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('luxuryStoreCart')) || [];
let currentCategory = 'all';
let currentSort = 'default';
const whatsappNumber = '6281234567890';


// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartModal = document.getElementById('cart-modal');
const customerModal = document.getElementById('customer-modal');
const paymentModal = document.getElementById('payment-modal');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const sortSelect = document.getElementById('sort-by');
const categoryLinks = document.querySelectorAll('.nav-list li a');
const searchInput = document.getElementById('search-input');
const cartIcon = document.getElementById('cart-icon');

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Set tahun di footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        await loadProducts();
        renderProducts(products);
        setupEventListeners();
        updateCartCount();
        setupRealtimeUpdates();
        
        // Sembunyikan preloader
        setTimeout(() => {
            document.querySelector('.preloader').classList.add('fade-out');
            setTimeout(() => {
                document.querySelector('.preloader').style.display = 'none';
            }, 500);
        }, 1500);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showErrorState();
    }
});

// Fungsi untuk memuat produk dari Supabase
async function loadProducts() {
    try {
        let { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        products = data || [];
        filteredProducts = [...products];
        localStorage.setItem('luxuryStoreProducts', JSON.stringify(products));
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        const storedProducts = JSON.parse(localStorage.getItem('luxuryStoreProducts')) || [];
        products = storedProducts;
        filteredProducts = [...products];
        showNotification('Menggunakan data offline', 'warning');
        return products;
    }
}

function showLoadingState() {
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i> Memuat produk...
            </div>
        `;
    }
}

function hideLoadingState() {
    const loadingElement = document.querySelector('.loading-state');
    if (loadingElement) loadingElement.remove();
}

function showErrorState() {
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                Gagal memuat produk. Silakan refresh halaman.
            </div>
        `;
    }
}

function setupRealtimeUpdates() {
    const channel = supabase
        .channel('products')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'products'
        }, async (payload) => {
            console.log('Change received:', payload);
            await loadProducts();
            renderProducts(products);
        })
        .subscribe();

    return channel;
}

function renderProducts(productsToRender) {
    if (!productGrid) return;
    
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                Tidak ada produk yang tersedia
            </div>
        `;
        return;
    }
    
    productGrid.innerHTML = '';
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            ${product.is_featured ? `<div class="product-badge featured">Featured</div>` : ''}
            ${product.stock <= 0 ? `<div class="product-badge out-of-stock">Habis</div>` : ''}
            <div class="product-image-container">
                <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                     alt="${product.name}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300?text=Gambar+Tidak+Tersedia'">
                ${product.stock <= 0 ? `<div class="sold-out-overlay">Habis</div>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category?.toUpperCase() || 'UMUM'}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || 'Tidak ada deskripsi'}</p>
                <div class="product-price">Rp ${product.price?.toLocaleString('id-ID') || '0'}</div>
                <button class="add-to-cart" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-bag"></i> ${product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
    
    // Update product count
    updateProductCount(productsToRender.length);
}

function updateProductCount(count) {
    const productCountElement = document.getElementById('product-count');
    if (productCountElement) {
        productCountElement.textContent = count;
    }
}

function filterProducts() {
    // Filter berdasarkan kategori
    filteredProducts = currentCategory === 'all' 
        ? [...products] 
        : products.filter(product => product.category === currentCategory);
    
    // Filter berdasarkan pencarian
    if (searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort produk
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    renderProducts(filteredProducts);
}


function sortProducts(products, sortType) {
    if (!Array.isArray(products)) return [];
    
    const sortedProducts = [...products];
    
    switch(sortType) {
        case 'price-asc':
            return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-desc':
            return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'name-asc':
            return sortedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        default:
            return sortedProducts;
    }
}

function setupEventListeners() {
    // Filter kategori
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category') || 'all';
            
            // Update active state
            categoryLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            
            filterProducts();
        });
    });
    
    // Sorting
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterProducts();
        });
    }
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterProducts();
        }, 300));
    }

    // Buka/tutup modal keranjang
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            renderCartItems();
            if (cartModal) cartModal.style.display = 'block';
        });
    }
    
    // Tutup modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Klik di luar modal untuk menutup
    window.addEventListener('click', (e) => {
        if (e.target === cartModal || e.target === customerModal || e.target === paymentModal) {
            closeAllModals();
        }
    });
    
    // Checkout dari keranjang
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                closeAllModals();
                if (customerModal) customerModal.style.display = 'block';
                renderAddressFields();
            }
        });
    }
    
    // Submit form pelanggan
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCustomerFormSubmit();
        });
    }
    
    // Event delegation untuk tombol tambah ke keranjang
    document.addEventListener('click', (e) => {
        // Tambah ke keranjang
        if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
            const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
            const productId = parseInt(button.getAttribute('data-id'));
            addToCart(productId);
        }
        
        // Tombol quantity
        if (e.target.classList.contains('quantity-btn')) {
            const cartItem = e.target.closest('.cart-item');
            if (cartItem) {
                const itemId = parseInt(cartItem.getAttribute('data-id'));
                const isIncrease = e.target.classList.contains('increase');
                updateQuantity(itemId, isIncrease);
            }
        }
        
        // Hapus item
        if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const cartItem = e.target.closest('.cart-item');
            if (cartItem) {
                const itemId = parseInt(cartItem.getAttribute('data-id'));
                removeFromCart(itemId);
            }
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

function closeAllModals() {
    if (cartModal) cartModal.style.display = 'none';
    if (customerModal) customerModal.style.display = 'none';
    if (paymentModal) paymentModal.style.display = 'none';
}

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
    
    saveCart();
    updateCartCount();
    showNotification(`${product.name} telah ditambahkan ke keranjang`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartItems();
    updateCartCount();
    
    if (cart.length === 0 && cartModal) {
        cartModal.style.display = 'none';
    }
}

function updateQuantity(productId, isIncrease) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (isIncrease) {
            item.quantity += 1;
        } else {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                removeFromCart(productId);
                return;
            }
        }
        saveCart();
        renderCartItems();
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('luxuryStoreCart', JSON.stringify(cart));
}

function renderCartItems() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    if (!cartItemsEl || !cartTotalEl) return;
    
    cartItemsEl.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const product = products.find(p => p.id === item.id) || item;
        
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
        cartItemsEl.appendChild(cartItemEl);
    });
    
    cartTotalEl.textContent = total.toLocaleString('id-ID');
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

function renderAddressFields() {
    const addressFields = document.getElementById('address-fields');
    if (!addressFields) return;
    
    const hasPhysicalProducts = cart.some(item => item.type === 'physical');
    
    if (hasPhysicalProducts) {
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
    } else {
        addressFields.innerHTML = '';
    }
}

async function handleCustomerFormSubmit() {
    const customerName = document.getElementById('customer-name')?.value;
    const customerEmail = document.getElementById('customer-email')?.value;
    const customerPhone = document.getElementById('customer-phone')?.value;
    const customerNotes = document.getElementById('customer-notes')?.value;
    
    if (!customerName || !customerPhone) {
        showNotification('Nama dan nomor telepon wajib diisi', 'error');
        return;
    }
    
    const customerData = {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        notes: customerNotes
    };
    
    if (hasPhysicalProducts()) {
        customerData.address = document.getElementById('customer-address')?.value;
        customerData.city = document.getElementById('customer-city')?.value;
        customerData.province = document.getElementById('customer-province')?.value;
        customerData.postal = document.getElementById('customer-postal')?.value;
        
        if (!customerData.address || !customerData.city || !customerData.province) {
            showNotification('Alamat lengkap wajib diisi untuk produk fisik', 'error');
            return;
        }
    }
    
    try {
        // Simpan ke Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                customer_name: customerData.name,
                customer_email: customerData.email,
                customer_phone: customerData.phone,
                customer_notes: customerData.notes,
                shipping_address: customerData.address,
                city: customerData.city,
                province: customerData.province,
                postal_code: customerData.postal,
                products: cart,
                total_amount: calculateTotal(),
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        closeAllModals();
        openPaymentModal();
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Gagal menyimpan pesanan. Silakan coba lagi.', 'error');
    }
}

function openPaymentModal() {
    const total = calculateTotal();
    const paymentTotalEl = document.getElementById('payment-total');
    const orderItemsEl = document.getElementById('order-items');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    
    if (!paymentTotalEl || !orderItemsEl || !whatsappBtn) return;
    
    paymentTotalEl.textContent = total.toLocaleString('id-ID');
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
    
    const customerName = document.getElementById('customer-name')?.value || 'Pelanggan';
    const whatsappMessage = generateWhatsAppMessage(customerName, total);
    whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    if (paymentModal) paymentModal.style.display = 'block';
}

function generateWhatsAppMessage(customerName, total) {
    let message = `Halo, saya ${customerName}%0A%0ASaya telah melakukan pembayaran sebesar Rp ${total.toLocaleString('id-ID')} untuk pesanan berikut:%0A%0A`;
    
    message += cart.map(item => {
        return `- ${item.name} (${item.quantity}x) : Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
    
    message += '%0A%0ABerikut bukti transfernya:';
    return message;
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function hasPhysicalProducts() {
    return cart.some(item => item.type === 'physical');
}

function showNotification(message, type = 'success') {
    if (!notification || !notificationMessage) return;
    
    notificationMessage.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function checkAdminAccess() {
    if (window.location.search.includes('admin=1')) {
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
}