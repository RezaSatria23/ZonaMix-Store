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
    setupCartEventListeners(); 
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
// Panggil inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  loadProvinces();
  setupAddressFormListeners();
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
    document.getElementById('cart-items').addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const productId = target.dataset.id;
        const action = target.dataset.action;

        if (action === 'increase' || action === 'decrease') {
        updateQuantity(productId, action);
        } else if (action === 'remove') {
        removeFromCart(productId);
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
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
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
        // Di dalam fungsi renderProducts(), perbaiki menjadi:
        productCard.querySelector('.view-detail').addEventListener('click', () => {
            const productId = parseInt(productCard.querySelector('.view-detail').getAttribute('data-id'));
            const product = products.find(p => p.id === productId);
            if (product) {
                showProductModal(product);
            }
        });

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
            renderAddressFields(); // Ini akan merender form alamat jika ada produk fisik
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
        
       // Tombol tambah/kurangi quantity
        if (e.target.closest('.quantity-btn')) {
            const button = e.target.closest('.quantity-btn');
            const cartItem = button.closest('.cart-item');
            
            if (!cartItem || !cartItem.dataset.id) {
                console.error('Struktur DOM tidak valid');
                return;
            }
            
            const productId = cartItem.dataset.id; // JANGAN parse ke number
            const isIncrease = button.classList.contains('increase');
            
            updateQuantity(productId, isIncrease);
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
    renderCartItems();
    updateCartCount();
    showNotification('Produk dihapus dari keranjang');
}

// Fungsi untuk update quantity (versi sederhana)
function updateQuantity(productId, isIncrease) {
    // productId harus tetap sebagai string
    if (typeof productId !== 'string') {
        console.error('ID produk harus string/UUID');
        return;
    }

    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) {
        console.error('Produk tidak ditemukan di keranjang. ID:', productId);
        console.log('Isi keranjang:', cart);
        showNotification('Produk tidak ditemukan di keranjang', 'error');
        return;
    }

    const updatedCart = [...cart];
    
    if (isIncrease) {
        updatedCart[itemIndex].quantity += 1;
    } else {
        if (updatedCart[itemIndex].quantity > 1) {
            updatedCart[itemIndex].quantity -= 1;
        } else {
            if (confirm('Hapus produk dari keranjang?')) {
                updatedCart.splice(itemIndex, 1);
            } else {
                return;
            }
        }
    }

    cart = updatedCart;
    renderCartItems();
    updateCartCount();
}
// Fungsi untuk update quantity produk
function updateCartItem(productId, action) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) return;

    if (action === 'increase') {
        cart[itemIndex].quantity += 1;
    } else if (action === 'decrease') {
        if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
        } else {
        if (confirm('Hapus produk dari keranjang?')) {
            cart.splice(itemIndex, 1);
        } else {
            return;
        }
        }
    }
    // Simpan dan update tampilan
    renderCartItems();
    updateCartCount();
}

function renderCartItems() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    cartItemsEl.innerHTML = '';
    
    let total = 0;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="empty-cart animate__animated animate__fadeIn">
                <p>Keranjang belanja kosong</p>
            </div>
        `;
        cartTotalEl.textContent = '0';
        return;
    }
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item animate__animated animate__fadeIn';
        cartItemEl.dataset.id = item.id;
        cartItemEl.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
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
    const hasPhysicalProducts = cart.some(item => item.type === 'fisik');

    // Cek apakah ada produk digital di keranjang
    const hasDigitalProducts = cart.some(item => item.type === 'digital');

    // Hitung subtotal produk
    const subtotal = calculateTotal();
    document.getElementById('subtotal').value = subtotal;
    document.getElementById('subtotal-display').textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
    
    if (hasPhysicalProducts) {
        addressFields.innerHTML = `
            <div class="form-group">
                <label for="province">Provinsi*</label>
                <select id="province" class="form-control" required>
                    <option value="">Memuat provinsi...</option>
                </select>
            </div>

            <div class="form-group">
                <label for="regency">Kabupaten/Kota*</label>
                <select id="regency" class="form-control" required disabled>
                    <option value="">Pilih provinsi terlebih dahulu</option>
                </select>
            </div>

            <div class="form-group">
                <label for="district">Kecamatan*</label>
                <select id="district" class="form-control" required disabled>
                    <option value="">Pilih kabupaten terlebih dahulu</option>
                </select>
            </div>

            <div class="form-group">
                <label for="village">Kelurahan*</label>
                <select id="village" class="form-control" required disabled>
                    <option value="">Pilih kecamatan terlebih dahulu</option>
                </select>
            </div>

            <div class="form-group">
                <label for="postal_code">Kode Pos*</label>
                <input type="text" id="postal_code" class="form-control" required 
                       placeholder="Pilih kelurahan terlebih dahulu">
                <small class="text-muted" id="postal-code-help">Kode pos akan otomatis terisi jika tersedia</small>
            </div>

            <div id="shipping-options" class="shipping-options-container"></div>
            <div id="shipping-cost-container" style="display: none;">
                <div class="cost-row">
                    <span>Ongkos Kirim:</span>
                    <span id="shipping-cost-display">Rp 0</span>
                    <input type="hidden" id="shipping-cost" value="0">
                </div>
            </div>
        `;
        
        loadProvinces();
        setupAddressFormListeners();
    }
    
    if (hasDigitalProducts) {
        addressFields.innerHTML += `
            <div class="form-group">
                <label for="customer-email-digital">Email* (untuk produk digital)</label>
                <input type="email" id="customer-email-digital" ${hasPhysicalProducts ? '' : 'required'}>
                <small>Link produk digital akan dikirim ke email ini</small>
            </div>
        `;
    }
    updateOrderTotal();
}

// Proses Form Pelanggan dan Simpan ke Supabase
async function processCustomerForm() {
    // Validasi dasar
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    
    if (!name || !phone) {
        showNotification('Nama dan nomor WhatsApp harus diisi', 'error');
        return;
    }

    // Tambahkan data pengiriman
    if (selectedShipping) {
        orderData.shipping = {
        province: document.getElementById('province').selectedOptions[0].text,
        city: document.getElementById('city').selectedOptions[0].text,
        service: selectedShipping.service,
        cost: selectedShipping.cost,
        etd: selectedShipping.etd,
        insurance: document.getElementById('insurance-checkbox').checked
        };
    }

    const orderData = {
        name,
        phone,
        products: JSON.stringify(cart),
        total_amount: calculateTotal(),
        status: 'pending',
        notes: document.getElementById('customer-notes').value || '',
        created_at: new Date().toISOString()
    };

    // Tambahkan data alamat jika ada produk fisik
    if (cart.some(item => item.type === 'fisik')) {
        orderData.address = document.getElementById('customer-address').value;
        orderData.city = document.getElementById('customer-city').value;
        orderData.province = document.getElementById('customer-province').value;
        orderData.postal_code = document.getElementById('customer-postal').value;
        
        // Validasi alamat
        if (!orderData.address || !orderData.city || !orderData.province || !orderData.postal_code) {
            showNotification('Alamat lengkap harus diisi untuk produk fisik', 'error');
            return;
        }
    }

    // Tambahkan email khusus jika ada produk digital
    if (cart.some(item => item.type === 'digital')) {
        const digitalEmail = document.getElementById('customer-email-digital')?.value;
        
        // Hanya wajib jika tidak ada produk fisik
        if (!cart.some(item => item.type === 'fisik') && !digitalEmail) {
            showNotification('Email harus diisi untuk produk digital', 'error');
            return;
        }
        
        if (digitalEmail) {
            orderData.digital_email = digitalEmail;
        }
    }

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData]);
        
        if (error) throw error;
        
        // Lanjut ke pembayaran
        closeModal(customerModal);
        openPaymentModal();
        
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Gagal menyimpan pesanan. Silakan coba lagi.', 'error');
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
                <img src="${product.image_url}" alt="${product.name}">
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
// Konfigurasi API
const WILAYAH_API = "https://www.emsifa.com/api-wilayah-indonesia/api";

// Fungsi untuk memuat provinsi
async function loadProvinces() {
    const provinceSelect = document.getElementById('province');
    
    // Pastikan elemen ada
    if (!provinceSelect) {
        return;
    }
    
    try {
        provinceSelect.innerHTML = '<option value="">Memuat provinsi...</option>';
        
        const response = await fetch(`${WILAYAH_API}/provinces.json`);
        if (!response.ok) throw new Error("Gagal memuat provinsi");
        
        const provinces = await response.json();
        
        // Kosongkan dan isi dropdown
        provinceSelect.innerHTML = '<option value="">Pilih Provinsi</option>';
        
        provinces.forEach(province => {
            const option = new Option(province.name, province.id);
            provinceSelect.add(option);
        });
        
    } catch (error) {
        console.error("Error:", error);
        
        showNotification('Gagal memuat daftar provinsi', 'error');
    }
}
// Fungsi untuk memuat kabupaten/kota
async function loadRegencies(provinceId) {
  const regencySelect = document.getElementById('regency');
  
  try {
    regencySelect.disabled = true;
    regencySelect.innerHTML = '<option value="">Memuat kabupaten...</option>';
    
    const response = await fetch(`${WILAYAH_API}/regencies/${provinceId}.json`);
    if (!response.ok) throw new Error("Gagal memuat kabupaten");
    
    const regencies = await response.json();
    
    regencySelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    
    regencies.forEach(regency => {
      const option = new Option(regency.name, regency.id);
      regencySelect.add(option);
    });
    
    regencySelect.disabled = false;
    
  } catch (error) {
    console.error("Error:", error);
    regencySelect.innerHTML = '<option value="">Gagal memuat kabupaten</option>';
  }
}

// Fungsi untuk memuat kecamatan
async function loadDistricts(regencyId) {
  const districtSelect = document.getElementById('district');
  
  try {
    districtSelect.disabled = true;
    districtSelect.innerHTML = '<option value="">Memuat kecamatan...</option>';
    
    const response = await fetch(`${WILAYAH_API}/districts/${regencyId}.json`);
    if (!response.ok) throw new Error("Gagal memuat kecamatan");
    
    const districts = await response.json();
    
    districtSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
    
    districts.forEach(district => {
      const option = new Option(district.name, district.id);
      districtSelect.add(option);
    });
    
    districtSelect.disabled = false;
    
  } catch (error) {
    console.error("Error:", error);
    districtSelect.innerHTML = '<option value="">Gagal memuat kecamatan</option>';
  }
}

// Fungsi untuk memuat kelurahan dan kode pos
async function loadVillages(districtId) {
    const villageSelect = document.getElementById('village');
    const postalCodeInput = document.getElementById('postal_code');
    
    if (!villageSelect || !postalCodeInput) {
        console.error('Elemen village atau postal_code tidak ditemukan');
        return;
    }
    
    try {
        villageSelect.disabled = true;
        villageSelect.innerHTML = '<option value="">Memuat kelurahan...</option>';
        postalCodeInput.value = '';
        postalCodeInput.placeholder = 'Pilih kelurahan terlebih dahulu';
        
        const response = await fetch(`${WILAYAH_API}/villages/${districtId}.json`);
        if (!response.ok) throw new Error("Gagal memuat kelurahan");
        
        const villages = await response.json();
        
        villageSelect.innerHTML = '<option value="">Pilih Kelurahan</option>';
        
        // Hitung berapa kelurahan yang punya kode pos
        const villagesWithPostalCode = villages.filter(v => v.postal_code).length;
        
        villages.forEach(village => {
            const hasPostalCode = village.postal_code && village.postal_code.trim() !== '';
            const displayText = hasPostalCode 
                ? `${village.name} (${village.postal_code})` 
                : `${village.name}`;
            
            const option = new Option(displayText, village.id);
            option.dataset.postal = hasPostalCode ? village.postal_code : '';
            option.style.color = hasPostalCode ? '' : '#999'; // Warna abu untuk yang tidak punya kode pos
            villageSelect.add(option);
        });
        
        // Tampilkan notifikasi jika banyak kelurahan tanpa kode pos
        if (villagesWithPostalCode === 0) {
            postalCodeInput.readOnly = false;
            postalCodeInput.placeholder = 'Masukkan kode pos manual';
        } else {
            postalCodeInput.readOnly = true;
        }
        
        villageSelect.disabled = false;
        
    } catch (error) {
        console.error("Error:", error);
        villageSelect.innerHTML = '<option value="">Gagal memuat kelurahan</option>';
        showNotification('Gagal memuat data kelurahan', 'error');
    }
}

function getCartItems() {
    return cart;
}

// Fungsi untuk menghitung ongkir
async function calculateShipping() {
    try {
        const cartItems = getCartItems();
        let totalWeight = 0;
        
        // Hitung total berat hanya untuk produk fisik
        cartItems.forEach(item => {
            if (item.type === 'fisik') {
                totalWeight += (item.weight || 500) * item.quantity;
            }
        });

        // Jika tidak ada produk fisik, set ongkir 0
        if (totalWeight === 0) {
            document.getElementById('shipping-cost').value = 0;
            document.getElementById('shipping-cost-display').textContent = 'Rp 0';
            document.getElementById('shipping-cost-container').style.display = 'none';
            updateOrderTotal();
            return;
        }

        const city = document.getElementById('regency').value;
        if (!city) {
            showNotification('Silakan pilih kota tujuan terlebih dahulu', 'error');
            return;
        }

        // Gunakan API RajaOngkir
        const response = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'key': 'UYAVNGwHd0aca6b1808c712ctUAix4js' // Ganti dengan API key Anda
            },
            body: `origin=${SHOP_ORIGIN_CITY_ID}&destination=${city}&weight=${totalWeight}&courier=jne`
        });

        const data = await response.json();
        
        if (!data.rajaongkir || !data.rajaongkir.results) {
            throw new Error('Invalid API response');
        }

        const shippingOptions = data.rajaongkir.results[0]?.costs || [];
        
        if (shippingOptions.length > 0) {
            const shippingCost = shippingOptions[0].cost[0].value;
            document.getElementById('shipping-cost').value = shippingCost;
            document.getElementById('shipping-cost-display').textContent = 'Rp ' + shippingCost.toLocaleString('id-ID');
            document.getElementById('shipping-cost-container').style.display = 'block';
            updateOrderTotal();
            
            // Tampilkan opsi pengiriman jika ada lebih dari 1 opsi
            if (shippingOptions.length > 1) {
                renderShippingOptions(shippingOptions);
            }
        } else {
            // Default shipping cost jika tidak ada opsi
            document.getElementById('shipping-cost').value = 15000;
            document.getElementById('shipping-cost-display').textContent = 'Rp 15.000';
            document.getElementById('shipping-cost-container').style.display = 'block';
            updateOrderTotal();
            showNotification('Layanan pengiriman tidak tersedia, menggunakan tarif default Rp15.000', 'warning');
        }

    } catch (error) {
        console.error('Error calculating shipping:', error);
        // Fallback ke ongkir flat 15rb jika error
        document.getElementById('shipping-cost').value = 15000;
        document.getElementById('shipping-cost-display').textContent = 'Rp 15.000';
        document.getElementById('shipping-cost-container').style.display = 'block';
        updateOrderTotal();
        showNotification('Gagal menghitung ongkir. Menggunakan tarif default Rp15.000', 'error');
    }
}

function updateOrderTotal() {
    const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
    let shippingCost = 0;
    
    // Hanya hitung ongkir jika ada produk fisik
    if (cart.some(item => item.type === 'fisik')) {
        shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
    }
    
    const total = subtotal + shippingCost;
    
    document.getElementById('total-amount').value = total;
    document.getElementById('order-total-display').textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// Fungsi untuk menampilkan opsi pengiriman
function renderShippingOptions(costs) {
    const shippingOptions = document.getElementById('shipping-options');
    shippingOptions.innerHTML = '';
    
    if (!costs || costs.length === 0) {
        shippingOptions.innerHTML = `
            <div class="shipping-not-available">
                <i class="fas fa-truck"></i>
                <p>Layanan pengiriman tidak tersedia untuk alamat ini</p>
                <small>Silakan coba alamat lain atau hubungi kami</small>
            </div>
        `;
        return;
    }
    
    // Kelompokkan berdasarkan kurir
    const couriers = {
        jne: { name: 'JNE', options: [] },
        jnt: { name: 'JNT', options: [] },
        lainnya: { name: 'Lainnya', options: [] }
    };
    
    costs.forEach(cost => {
        if (!cost.service || !cost.cost || cost.cost.length === 0) return;
        
        const courierKey = cost.service.toLowerCase().includes('jne') ? 'jne' :
                         cost.service.toLowerCase().includes('jnt') ? 'jnt' : 'lainnya';
        
        couriers[courierKey].options.push(cost);
    });
    
    // Buat tampilan untuk masing-masing kurir
    for (const [key, courier] of Object.entries(couriers)) {
        if (courier.options.length === 0) continue;
        
        const courierSection = document.createElement('div');
        courierSection.className = 'courier-section';
        courierSection.innerHTML = `
            <h5 class="courier-name">${courier.name}</h5>
            <div class="courier-options" id="${key}-options"></div>
        `;
        
        shippingOptions.appendChild(courierSection);
        
        const optionsContainer = document.getElementById(`${key}-options`);
        
        courier.options.forEach(cost => {
            cost.cost.forEach(priceDetail => {
                const option = document.createElement('div');
                option.className = 'shipping-option';
                option.innerHTML = `
                    <input type="radio" name="shipping" id="shipping-${key}-${cost.service.toLowerCase()}" 
                           value="${cost.service}" data-cost="${priceDetail.value}" data-etd="${priceDetail.etd}">
                    <label for="shipping-${key}-${cost.service.toLowerCase()}">
                        <span class="service-name">${cost.service.toUpperCase()}</span>
                        <span class="service-price">Rp ${priceDetail.value.toLocaleString('id-ID')}</span>
                        <span class="service-etd">${priceDetail.etd} hari</span>
                    </label>
                `;
                
                option.querySelector('input').addEventListener('change', function() {
                    selectedShipping = {
                        service: cost.service,
                        cost: priceDetail.value,
                        etd: priceDetail.etd
                    };
                    updateOrderSummary();
                });
                
                optionsContainer.appendChild(option);
            });
        });
    }
    
    // Otomatis pilih opsi pertama
    const firstOption = shippingOptions.querySelector('input[type="radio"]');
    if (firstOption) {
        firstOption.checked = true;
        const event = new Event('change');
        firstOption.dispatchEvent(event);
    }
}

function calculateTotalWeight() {
    return cart.reduce((total, item) => {
        return total + (item.weight || 500) * item.quantity;
    }, 0);
}

// Update ringkasan pesanan setelah memilih pengiriman
function updateOrderSummary() {
  const selectedShipping = document.querySelector('input[name="shipping"]:checked');
  const shippingCost = selectedShipping ? parseInt(selectedShipping.dataset.cost) : 0;
  const subtotal = calculateTotal();
  const total = subtotal + shippingCost;
  
  document.getElementById('subtotal-amount').textContent = subtotal.toLocaleString('id-ID');
  document.getElementById('shipping-amount').textContent = shippingCost.toLocaleString('id-ID');
  document.getElementById('total-amount').textContent = total.toLocaleString('id-ID');
}

// Inisialisasi event listeners untuk form alamat
function setupAddressFormListeners() {
    const provinceSelect = document.getElementById('province');
    const regencySelect = document.getElementById('regency');
    const districtSelect = document.getElementById('district');
    const villageSelect = document.getElementById('village');
    const postalCodeInput = document.getElementById('postal_code');
    
    if (!provinceSelect || !regencySelect || !districtSelect || !villageSelect || !postalCodeInput) {
        return;
    }
    
     // Provinsi
     provinceSelect.addEventListener('change', function() {
        if (this.value) {
            loadRegencies(this.value);
            resetDependentFields('province');
            postalCodeInput.value = '';
            document.getElementById('shipping-cost-container').style.display = 'none';
        }
    });
    
    // Kabupaten/Kota
    regencySelect.addEventListener('change', function() {
        if (this.value) {
            loadDistricts(this.value);
            resetDependentFields('regency');
            postalCodeInput.value = '';
            document.getElementById('shipping-cost-container').style.display = 'none';
        }
    });
    
    // Kecamatan
    districtSelect.addEventListener('change', function() {
        if (this.value) {
            loadVillages(this.value);
            resetDependentFields('district');
            postalCodeInput.value = '';
            document.getElementById('shipping-cost-container').style.display = 'none';
        }
    });
    
    // Kelurahan - Update kode pos saat dipilih
    villageSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const postalCode = selectedOption.dataset.postal || '';
        const postalCodeInput = document.getElementById('postal_code');
        
        postalCodeInput.value = postalCode;
        
        if (postalCode) {
            postalCodeInput.readOnly = true;
            // Hitung ongkir setelah memilih kelurahan
            calculateShipping();
        } else {
            postalCodeInput.readOnly = false;
            postalCodeInput.placeholder = 'Masukkan kode pos manual';
            showNotification('Kode pos tidak tersedia untuk kelurahan ini. Silakan masukkan manual lalu tekan Enter.', 'warning');
            
            // Hitung ongkir saat tekan Enter di input kode pos
            postalCodeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    calculateShipping();
                }
            });
        }
    });
}

// Reset field yang tergantung
function resetDependentFields(fieldName) {
    const fields = {
        'province': ['regency', 'district', 'village'],
        'regency': ['district', 'village'],
        'district': ['village']
    };

    if (fields[fieldName]) {
        fields[fieldName].forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
                element.disabled = true;
                element.innerHTML = `<option value="">Pilih ${field === 'regency' ? 'Kabupaten/Kota' : 
                                    field === 'district' ? 'Kecamatan' : 'Kelurahan'}</option>`;
            }
        });
    }
    
    // Reset shipping options
    const shippingOptions = document.getElementById('shipping-options');
    if (shippingOptions) {
        shippingOptions.innerHTML = '';
    }
    
    // Reset kode pos
    const postalCode = document.getElementById('postal_code');
    if (postalCode) {
        postalCode.value = '';
    }
}
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification show animate__animated animate__fadeInUp ${type}`;
    
    // Auto hide setelah 5 detik
    setTimeout(() => {
        notification.classList.remove('animate__fadeInUp');
        notification.classList.add('animate__fadeOutDown');
        setTimeout(() => {
            notification.classList.remove('show', 'animate__fadeOutDown');
        }, 500);
    }, 5000);
}

// Inisialisasi Banner Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.banner-slide');
const dotsContainer = document.querySelector('.banner-dots');

// Buat dots untuk banner
slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('banner-dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
        goToSlide(index);
    });
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.banner-dot');

function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = (index + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// Navigasi banner
document.querySelector('.banner-prev').addEventListener('click', () => {
    goToSlide(currentSlide - 1);
});

document.querySelector('.banner-next').addEventListener('click', () => {
    goToSlide(currentSlide + 1);
});

// Auto slide banner
let slideInterval = setInterval(() => {
    goToSlide(currentSlide + 1);
}, 5000);

// Hentikan auto slide saat hover
const banner = document.querySelector('.hero-banner');
banner.addEventListener('mouseenter', () => {
    clearInterval(slideInterval);
});

banner.addEventListener('mouseleave', () => {
    slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
});

// Fungsi untuk menampilkan modal produk
function showProductModal(product) {
    const modal = document.getElementById('product-modal');
    
    // Isi data produk ke modal
    document.getElementById('modal-product-image').src = product.image_url || 'https://via.placeholder.com/500';
    document.getElementById('modal-product-image').alt = product.name;
    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-category').textContent = product.category;
    document.getElementById('modal-product-price').textContent = `Rp ${product.price.toLocaleString('id-ID')}`;
    document.getElementById('modal-product-description').textContent = product.description;
    
    // Isi spesifikasi produk (diasumsikan ada field specs di database)
    const specsList = document.getElementById('modal-product-specs');
    specsList.innerHTML = '';
    
    // Jika tidak ada spesifikasi, tampilkan pesan default
    if (!product.specs || product.specs.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Tidak ada spesifikasi tambahan';
        specsList.appendChild(li);
    } else {
        product.specs.forEach(spec => {
            const li = document.createElement('li');
            li.textContent = spec;
            specsList.appendChild(li);
        });
    }
    
    // Set badge produk berdasarkan type
    const badge = document.getElementById('modal-product-badge');
    badge.textContent = product.type === 'fisik' ? 'Produk Fisik' : 'Produk Digital';
    badge.style.display = 'block';
    
    // Set WhatsApp button
    const whatsappBtn = document.getElementById('whatsapp-contact');
    const whatsappNumber = document.getElementById('whatsapp-number');
    whatsappNumber.textContent = formatPhoneNumber(whatsappNumber); // Gunakan nomor default dari variabel
    
    const message = `Halo, saya tertarik dengan produk ${product.name} (ID: ${product.id}) di Luxury Store. Bisa dibantu?`;
    whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Tambahkan event listener untuk tombol tambah ke keranjang
    const addToCartBtn = document.getElementById('modal-add-to-cart');
    addToCartBtn.setAttribute('data-id', product.id);
    addToCartBtn.onclick = function() {
        addToCart(product.id);
        showNotification(`${product.name} ditambahkan ke keranjang`, 'success');
        closeModal(modal);
    };
    
    // Kontrol kuantitas
    const minusBtn = modal.querySelector('.quantity-btn.minus');
    const plusBtn = modal.querySelector('.quantity-btn.plus');
    const quantityInput = modal.querySelector('.quantity-value');
    
    minusBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });
    
    plusBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        quantityInput.value = value + 1;
    });
    
    // Tampilkan modal
    openModal(modal);
}

function formatPhoneNumber(number) {
    // Hilangkan semua karakter non-digit
    const cleaned = ('' + number).replace(/\D/g, '');
    
    // Cek jika nomor dimulai dengan 0
    if (cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // Cek jika nomor dimulai dengan 62
    else if (cleaned.startsWith('62')) {
        const localNumber = cleaned.substring(2);
        return '0' + localNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // Format internasional
    else {
        return '+' + cleaned.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
}