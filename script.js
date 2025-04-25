
// Cek jika admin (sederhana)
const isAdmin = window.location.href.includes('admin.html');

// Jika di halaman utama, load produk dari localStorage
if (!isAdmin && window.location.pathname.includes('index.html')) {
    const storedProducts = JSON.parse(localStorage.getItem('luxuryStoreProducts'));
    if (storedProducts && storedProducts.length > 0) {
        products = storedProducts;
    }
}

// Simpan pesanan ke localStorage
function saveOrder(customerData) {
    const newOrder = {
        id: Date.now(),
        date: new Date().toISOString(),
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerNotes: customerData.notes,
        products: [...cart],
        totalAmount: calculateTotal(),
        status: 'pending'
    };
    
    // Jika ada alamat, tambahkan ke order
    if (customerData.address) {
        newOrder.shippingAddress = customerData.address;
        newOrder.city = customerData.city;
        newOrder.province = customerData.province;
        newOrder.postalCode = customerData.postal;
    }
    
    // Simpan ke localStorage
    let orders = JSON.parse(localStorage.getItem('luxuryStoreOrders')) || [];
    orders.push(newOrder);
    localStorage.setItem('luxuryStoreOrders', JSON.stringify(orders));
    
    // Kosongkan keranjang
    cart = [];
    updateCartCount();
}
// Data Produk dengan Kategori
const products = [
    {
        id: 1,
        name: "Sepatu Sneakers Premium",
        price: 1250000,
        image: "images/product1.jpg",
        description: "Sepatu sneakers dari kulit asli dengan sol karet yang nyaman",
        category: "fashion",
        type: "physical"
    },
    {
        id: 2,
        name: "Smartwatch Luxe Edition",
        price: 3500000,
        image: "images/product2.jpg",
        description: "Smartwatch dengan layar AMOLED dan fitur kesehatan lengkap",
        category: "electronics",
        type: "physical"
    },
    {
        id: 3,
        name: "Kursi Ergonomis Premium",
        price: 2800000,
        image: "images/product3.jpg",
        description: "Kursi kantor ergonomis dengan material kulit dan penyangga pinggang",
        category: "home",
        type: "physical"
    },
    {
        id: 4,
        name: "E-Book Exclusive Collection",
        price: 250000,
        image: "images/product4.jpg",
        description: "Koleksi 50 e-book bestseller dalam berbagai kategori",
        category: "digital",
        type: "digital"
    },
    {
        id: 5,
        name: "Tas Kulit Eksklusif",
        price: 4500000,
        image: "images/product5.jpg",
        description: "Tas kulit handmade dengan jahitan premium dan finishing sempurna",
        category: "fashion",
        type: "physical"
    },
    {
        id: 6,
        name: "Software Design Bundle",
        price: 1500000,
        image: "images/product6.jpg",
        description: "Paket lengkap software desain grafis dan video editing",
        category: "digital",
        type: "digital"
    },
    {
        id: 7,
        name: "Headphone Noise Cancelling",
        price: 3200000,
        image: "images/product7.jpg",
        description: "Headphone dengan teknologi noise cancelling terbaru",
        category: "electronics",
        type: "physical"
    },
    {
        id: 8,
        name: "Lampu Meja Designer",
        price: 1800000,
        image: "images/product8.jpg",
        description: "Lampu meja desain eksklusif dengan material metal dan marble",
        category: "home",
        type: "physical"
    }
];

// Variabel Global
let cart = [];
let currentCategory = 'all';
let currentSort = 'default';
const whatsappNumber = '6281234567890'; // Ganti dengan nomor WhatsApp Anda

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartModal = document.getElementById('cart-modal');
const customerModal = document.getElementById('customer-modal');
const paymentModal = document.getElementById('payment-modal');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupEventListeners();
    updateCartCount();
    loadProducts();
    
    // Sembunyikan preloader setelah 1.5 detik
    setTimeout(() => {
        document.querySelector('.preloader').classList.add('fade-out');
        setTimeout(() => {
            document.querySelector('.preloader').style.display = 'none';
        }, 500);
    }, 1500);
    if (window.location.search.includes('admin=1')) {
        const adminLogin = confirm('Masuk sebagai admin?');
        if (adminLogin) {
            const password = prompt('Masukkan password admin:');
            if (password === 'luxury123') { // Ganti dengan password yang lebih aman
                localStorage.setItem('luxuryStoreAdminLoggedIn', 'true');
                window.location.href = 'admin.html';
            } else {
                alert('Password salah!');
            }
        }
    }
});

// Render Produk dengan Filter dan Sorting
// Fungsi untuk menampilkan produk
function renderProducts(products) {
  const container = document.getElementById('product-grid');
  
  if (!products.length) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-box-open"></i>
        <p>Belum ada produk tersedia</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <img src="${product.image_url}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-meta">
          <span class="price">Rp ${product.price.toLocaleString('id-ID')}</span>
          <span class="category">${product.category}</span>
        </div>
        <button class="add-to-cart" data-id="${product.id}">
          <i class="fas fa-shopping-cart"></i> Tambah ke Keranjang
        </button>
      </div>
    </div>
  `).join('');
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
    // Filter kategori
    document.querySelectorAll('.nav-list li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.nav-list li a').forEach(item => {
                item.classList.remove('active');
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
        cartModal.style.display = 'block';
    });
    
    // Buka/tutup modal lainnya
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            cartModal.style.display = 'none';
            customerModal.style.display = 'none';
            paymentModal.style.display = 'none';
        });
    });
    
    // Klik di luar modal untuk menutup
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === customerModal) customerModal.style.display = 'none';
        if (e.target === paymentModal) paymentModal.style.display = 'none';
    });
    
    // Checkout dari keranjang
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length > 0) {
            cartModal.style.display = 'none';
            customerModal.style.display = 'block';
            renderAddressFields();
        }
    });
    
    // Submit form pelanggan
    document.getElementById('customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        customerModal.style.display = 'none';
        openPaymentModal();
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
    });
}

// Fungsi Keranjang
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            type: product.type,
            category: product.category
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
        renderCartItems();
        updateCartCount();
    }
}

function renderCartItems() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    cartItemsEl.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.setAttribute('data-id', item.id);
        cartItemEl.innerHTML = `
            <img src="${products.find(p => p.id === item.id).image}" alt="${item.name}" class="cart-item-image">
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

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
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

// Fungsi Pembayaran
function openPaymentModal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('payment-total').textContent = total.toLocaleString('id-ID');
    
    // Render order items
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
    
    // Update WhatsApp link
    const customerName = document.getElementById('customer-name').value || 'Pelanggan';
    const whatsappMessage = `Halo, saya ${customerName}%0A%0ASaya telah melakukan pembayaran sebesar Rp ${total.toLocaleString('id-ID')} untuk pesanan berikut:%0A%0A${generateOrderSummary()}%0A%0ABerikut bukti transfernya:`;
    document.getElementById('whatsapp-btn').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    paymentModal.style.display = 'block';
}

function generateOrderSummary() {
    return cart.map(item => {
        return `- ${item.name} (${item.quantity}x) : Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
}

// Fungsi Notifikasi
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
// Tambahkan di bagian atas script.js
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwvonS2p2ClDmEx4WVU5ny31ktxFzM4-1fHrW-BQnRQNVIOqSuUZWFgT0Rf9EUekBN4/exec'; // Ganti dengan URL web app Anda

// Modifikasi form submit handler
document.getElementById('customer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Kumpulkan data form
    const formData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        notes: document.getElementById('customer-notes').value,
        orderSummary: generateOrderSummary(),
        totalAmount: calculateTotal()
    };
    
    // Jika ada produk fisik, tambahkan alamat
    if (hasPhysicalProducts()) {
        formData.address = document.getElementById('customer-address').value;
        formData.city = document.getElementById('customer-city').value;
        formData.province = document.getElementById('customer-province').value;
        formData.postal = document.getElementById('customer-postal').value;
    }
    
    try {
        // Kirim ke Google Sheets
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            customerModal.style.display = 'none';
            openPaymentModal();
        } else {
            showNotification('Gagal menyimpan data, silakan coba lagi');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengirim data');
    }
});

function hasPhysicalProducts() {
    return cart.some(item => item.type === 'physical');
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}
// Fungsi untuk memuat produk dari Supabase
async function loadProducts() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (error) throw error;
  
      renderProducts(products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      document.getElementById('product-grid').innerHTML = `
        <div class="error-message">
          Gagal memuat produk. Silakan refresh halaman.
        </div>
      `;
    }
  }