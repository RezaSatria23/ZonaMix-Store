const supabase = window.supabase.createClient(
    'https://znehlqzprtwvhscoeoim.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A',
);
// Variabel Global
let products = []; // Produk akan diambil dari Supabase
let cart = JSON.parse(localStorage.getItem('luxuryStoreCart')) || [];
let currentCategory = 'all';
let currentSort = 'default';
const whatsappNumber = '6281234567890'; // Ganti dengan nomor WhatsApp Anda

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartCountElement = document.querySelector('.cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const customerModal = document.getElementById('customer-modal');
const paymentModal = document.getElementById('payment-modal');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

async function initializeApp() {
    await loadProducts();
    renderCartItems(); // Render cart saat pertama kali load
}
// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSupabase();
    setupEventListeners();
    updateCartCount();
    renderCartItems();
    // Animasi preloader
    setTimeout(() => {
        const preloader = document.querySelector('.preloader');
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => preloader.style.display = 'none'
        });
    }, 1500);
});

// Load produk dari Supabase
async function loadProductsFromSupabase() {
    try {
        productGrid.innerHTML = `
            <div class="loading-state animate__animated animate__fadeIn">
                <i class="fas fa-spinner fa-spin"></i> Memuat produk...
            </div>
        `;
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        products = data;
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        productGrid.innerHTML = `
            <div class="error-state animate__animated animate__shakeX">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat produk. Silakan refresh halaman.</p>
                <button class="btn-retry" id="retry-load">Coba Lagi</button>
            </div>
        `;
        
        document.getElementById('retry-load').addEventListener('click', loadProductsFromSupabase);
    }
}
// 4. FUNGSI EVENT LISTENER (FIXED)
function setupCartEventListeners() {
    document.addEventListener('click', function(e) {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;
        
        const productId = cartItem.dataset.id;
        
        // Handle Tombol Hapus
        if (e.target.closest('.remove-btn')) {
            removeFromCart(productId);
            return;
        }
        
        // Handle Tombol Kurang Quantity
        if (e.target.classList.contains('decrease')) {
            updateQuantity(productId, false);
            return;
        }
        
        // Handle Tombol Tambah Quantity
        if (e.target.classList.contains('increase')) {
            updateQuantity(productId, true);
            return;
        }
    });
}
// Render Produk dengan Filter dan Sorting
function renderProducts() {

    if (!productGrid) {
        console.error('Product grid element not found!');
        return;
    }

    // Filter produk berdasarkan kategori
    let filteredProducts = currentCategory === 'all' 
        ? [...products] 
        : products.filter(product => product.category === currentCategory);
    
    // Sort produk
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    // Render produk dengan animasi
    productGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state animate__animated animate__fadeIn">
                <i class="fas fa-box-open"></i>
                <p>Tidak ada produk yang tersedia</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card animate__animated animate__fadeInUp';
        productCard.style.animationDelay = `${index * 0.1}s`;
        productCard.innerHTML = `
            ${product.type === 'fisik' ? 
                `<div class="product-badge animate__animated animate__pulse animate__infinite">Fisik</div>` : 
                `<div class="product-badge animate__animated animate__pulse animate__infinite">Digital</div>`}
            <div class="product-image-container">
                <img src="${product.image_url}" alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view" data-id="${product.id}">
                        <i class="fas fa-eye"></i> Quick View
                    </button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category.toUpperCase()}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-shopping-bag"></i> Tambah ke Keranjang
                </button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
    
    // Update product count
    document.getElementById('product-count').textContent = filteredProducts.length;
}

// Fungsi Sorting Produk
function sortProducts(products, sortType) {
    switch(sortType) {
        case 'price-asc':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...products].sort((a, b) => b.price - a.price);
        case 'name-asc':
            return [...products].sort((a, b) => a.name.localeCompare(b.name));
        default:
            return products;
    }
}

// Setup Event Listeners
function setupEventListeners() {
     // Gunakan event delegation untuk handle dynamic elements
     document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (addToCartBtn) {
            const productId = addToCartBtn.dataset.id;
            console.log('Add to cart clicked, ID:', productId); // Debug
            addToCart(productId);
        }
    });
    // Filter kategori
    document.querySelectorAll('.nav-list li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            
            // Update active state dengan animasi
            document.querySelectorAll('.nav-list li a').forEach(item => {
                gsap.to(item, {
                    color: '#2a2a2a',
                    duration: 0.3
                });
                item.classList.remove('active');
            });
            
            gsap.to(link, {
                color: '#d4af37',
                duration: 0.3
            });
            link.classList.add('active');
            
            renderProducts();
        });
    });
    
    // Sorting
    document.getElementById('sort-by').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
    });
    
    // Buka/tutup modal keranjang
    document.querySelector('.cart-icon').addEventListener('click', () => {
        renderCartItems();
        openModal(cartModal);
    });
    
    // Buka/tutup modal lainnya
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Klik di luar modal untuk menutup
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Checkout dari keranjang
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length > 0) {
            closeModal(cartModal);
            openModal(customerModal);
            renderAddressFields();
        } else {
            showNotification('Keranjang belanja kosong');
        }
    });
    
    // Submit form pelanggan
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await processCustomerForm();
    });
    
    // Tambah ke keranjang
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
            const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
            const productId = parseInt(button.getAttribute('data-id'));
            addToCart(productId);
        }
        
        // Tombol tambah/kurangi jumlah
        if (e.target.classList.contains('quantity-btn')) {
            const itemId = parseInt(e.target.closest('.cart-item').getAttribute('data-id'));
            const isIncrease = e.target.classList.contains('increase');
            updateQuantity(itemId, isIncrease);
        }
        
        // Hapus item
        if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const itemId = parseInt(e.target.closest('.cart-item').getAttribute('data-id'));
            removeFromCart(itemId);
        }
        
        // Quick view
        if (e.target.classList.contains('quick-view') || e.target.closest('.quick-view')) {
            const button = e.target.classList.contains('quick-view') ? e.target : e.target.closest('.quick-view');
            const productId = parseInt(button.getAttribute('data-id'));
            showQuickView(productId);
        }
    });
}

// Fungsi untuk menambahkan ke keranjang
function addToCart(productId) {

    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Produk tidak ditemukan', 'error');
        return;
    }

    // Cek apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCart();
    showNotification(`${product.name} ditambahkan ke keranjang`,'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id == productId); // Gunakan == untuk kompatibilitas tipe
    updateCart();
    showNotification('Produk dihapus dari keranjang');
}

function updateQuantity(productId, isIncrease) {
    const itemIndex = cart.findIndex(item => item.id == productId);
    
    if (itemIndex === -1) return;
    
    if (isIncrease) {
        cart[itemIndex].quantity += 1;
    } else {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            removeFromCart(productId);
            return;
        }
    }
    
    updateCart();
}

function renderCartItems() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    cartItemsEl.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;
    
        cartItemsContainer.innerHTML =  cart.map(item => `
            <img src="${item.image_url}" alt="${item.name}" class="cart-item-image" loading="lazy">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-category">${item.category.toUpperCase()}</div>
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
function updateCart() {
    localStorage.setItem('luxuryStoreCart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function updateCartCount() {
    if (!cartCountElement) {
        console.error('Cart count element not found!');
        return;
    }
    
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = count;

    // Animasi jika ada item di keranjang
    if (count > 0) {
        document.querySelector('.cart-count').classList.add('animate__animated', 'animate__bounce');
        setTimeout(() => {
            document.querySelector('.cart-count').classList.remove('animate__animated', 'animate__bounce');
        }, 1000);
    }
}

// Render Address Fields berdasarkan jenis produk
function renderAddressFields() {
    const addressFields = document.getElementById('address-fields');
    addressFields.innerHTML = '';
    
    // Cek apakah ada produk fisik di keranjang
    const hasPhysicalProducts = cart.some(item => item.type === 'physical');
    
    if (hasPhysicalProducts) {
        addressFields.innerHTML = `
            <div class="form-group">
                <label for="customer-address">Alamat Lengkap*</label>
                <textarea id="customer-address" required></textarea>
            </div>
            <div class="address-group">
                <div class="form-group">
                    <label for="customer-city">Kota/Kabupaten*</label>
                    <input type="text" id="customer-city" required>
                </div>
                <div class="form-group">
                    <label for="customer-province">Provinsi*</label>
                    <input type="text" id="customer-province" required>
                </div>
            </div>
            <div class="form-group">
                <label for="customer-postal">Kode Pos*</label>
                <input type="text" id="customer-postal" required>
            </div>
        `;
    }
}

// Proses Form Pelanggan dan Simpan ke Supabase
async function processCustomerForm() {
    const customerData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        notes: document.getElementById('customer-notes').value,
        products: JSON.stringify(cart),
        total_amount: calculateTotal(),
        status: 'pending'
    };
    
    // Jika ada produk fisik, tambahkan alamat
    if (hasPhysicalProducts()) {
        customerData.address = document.getElementById('customer-address').value;
        customerData.city = document.getElementById('customer-city').value;
        customerData.province = document.getElementById('customer-province').value;
        customerData.postal_code = document.getElementById('customer-postal').value;
    }
    
    try {
        // Simpan ke Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([customerData]);
        
        if (error) throw error;
        
        // Berhasil, lanjut ke pembayaran
        closeModal(customerModal);
        openPaymentModal();
        
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Gagal menyimpan data pesanan. Silakan coba lagi.');
    }
}

// Fungsi Pembayaran
function openPaymentModal() {
    const total = calculateTotal();
    document.getElementById('payment-total').textContent = total.toLocaleString('id-ID');
    
    // Render order items
    const orderItemsEl = document.getElementById('order-items');
    orderItemsEl.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item animate__animated animate__fadeIn';
        orderItem.innerHTML = `
            <span class="order-item-name">${item.name} (${item.quantity}x)</span>
            <span class="order-item-price">Rp ${itemTotal.toLocaleString('id-ID')}</span>
        `;
        orderItemsEl.appendChild(orderItem);
    });
    
    // Update WhatsApp link
    const customerName = document.getElementById('customer-name').value || 'Pelanggan';
    const whatsappMessage = `Halo, saya ${customerName}%0A%0ASaya telah melakukan pembayaran sebesar Rp ${total.toLocaleString('id-ID')} untuk pesanan berikut:%0A%0A${generateOrderSummary()}%0A%0ABerikut bukti transfernya:`;
    document.getElementById('whatsapp-btn').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    openModal(paymentModal);
}

// Fungsi Bantuan
function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function hasPhysicalProducts() {
    return cart.some(item => item.type === 'physical');
}

function generateOrderSummary() {
    return cart.map(item => {
        return `- ${item.name} (${item.quantity}x) : Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notificationMessage.textContent = message;
    notification.classList.add('show', 'animate__animated', 'animate__fadeInUp');
    
    setTimeout(() => {
        notification.classList.remove('animate__fadeInUp');
        notification.classList.add('animate__fadeOutDown');
        setTimeout(() => {
            notification.classList.remove('show', 'animate__fadeOutDown');
        }, 500);
    }, 3000);
}

function openModal(modal) {
    modal.style.display = 'block';
    gsap.fromTo(modal.querySelector('.modal-content'), 
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 }
    );
}

function closeModal(modal) {
    gsap.to(modal.querySelector('.modal-content'), {
        y: -20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => modal.style.display = 'none'
    });
}

function closeAllModals() {
    closeModal(cartModal);
    closeModal(customerModal);
    closeModal(paymentModal);
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.classList.add('animate__animated', 'animate__rubberBand');
    setTimeout(() => {
        cartIcon.classList.remove('animate__animated', 'animate__rubberBand');
    }, 1000);
}

function createCartBubble(productId) {
    const bubble = document.createElement('div');
    bubble.className = 'cart-bubble animate__animated animate__bounceIn';
    bubble.innerHTML = '<i class="fas fa-plus"></i>';
    document.body.appendChild(bubble);
    
    // Posisikan bubble
    const button = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
    const buttonRect = button.getBoundingClientRect();
    const cartRect = document.querySelector('.cart-icon').getBoundingClientRect();
    
    gsap.fromTo(bubble, 
        { 
            left: buttonRect.left + buttonRect.width/2, 
            top: buttonRect.top, 
            opacity: 1,
            scale: 0.5
        },
        { 
            left: cartRect.left + cartRect.width/2, 
            top: cartRect.top, 
            opacity: 0, 
            scale: 1.2,
            duration: 1, 
            ease: "power2.out",
            onComplete: () => bubble.remove()
        }
    );
}

// Quick View Product
function showQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quickViewModal = document.createElement('div');
    quickViewModal.className = 'quick-view-modal';
    quickViewModal.innerHTML = `
        <div class="quick-view-content animate__animated animate__fadeInUp">
            <span class="close-quick-view">&times;</span>
            <div class="quick-view-image">
                <img src="${product.image_url}" alt="${product.name}" loading="lazy">
            </div>
            <div class="quick-view-details">
                <h3>${product.name}</h3>
                <div class="quick-view-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                <div class="quick-view-category">${product.category.toUpperCase()} • ${product.type === 'physical' ? 'Produk Fisik' : 'Produk Digital'}</div>
                <p class="quick-view-description">${product.description}</p>
                <button class="add-to-cart quick-view-add" data-id="${product.id}">
                    <i class="fas fa-shopping-bag"></i> Tambah ke Keranjang
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(quickViewModal);
    
    // Close button
    quickViewModal.querySelector('.close-quick-view').addEventListener('click', () => {
        gsap.to(quickViewModal.querySelector('.quick-view-content'), {
            y: 20,
            opacity: 0,
            duration: 0.3,
            onComplete: () => quickViewModal.remove()
        });
    });
    
    // Click outside to close
    quickViewModal.addEventListener('click', (e) => {
        if (e.target === quickViewModal) {
            gsap.to(quickViewModal.querySelector('.quick-view-content'), {
                y: 20,
                opacity: 0,
                duration: 0.3,
                onComplete: () => quickViewModal.remove()
            });
        }
    });
    
    // Add to cart button
    quickViewModal.querySelector('.quick-view-add').addEventListener('click', () => {
        addToCart(productId);
        gsap.to(quickViewModal.querySelector('.quick-view-content'), {
            y: 20,
            opacity: 0,
            duration: 0.3,
            onComplete: () => quickViewModal.remove()
        });
    });
}