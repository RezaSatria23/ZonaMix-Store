// Inisialisasi Supabase
const supabaseUrl = 'https://your-project.supabase.co'; // GANTI DENGAN URL ANDA
const supabaseKey = 'your-anon-key'; // GANTI DENGAN KEY ANDA
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginContainer = document.getElementById('login-container');
const loginForm = document.getElementById('login-form');
const adminContent = document.getElementById('admin-content');
const logoutBtn = document.getElementById('logout-btn');

// Tab Management
const tabContents = document.querySelectorAll('.tab-content');
const tabButtons = document.querySelectorAll('.tab-btn');

// Fungsi untuk inisialisasi
async function initAdmin() {
    // Cek apakah user sudah login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // Jika sudah login, tampilkan admin content
        showAdminContent();
    } else {
        // Jika belum, tampilkan form login
        showLoginForm();
    }
}

// Tampilkan form login
function showLoginForm() {
    loginContainer.style.display = 'flex';
    adminContent.style.display = 'none';
}

// Tampilkan admin content
function showAdminContent() {
    loginContainer.style.display = 'none';
    adminContent.style.display = 'block';
    loadProducts(); // Muat produk saat pertama kali login
}

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    } else {
        showAdminContent();
    }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoginForm();
});

// Tab Navigation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Hapus active dari semua tab
        tabButtons.forEach(btn => btn.style.borderBottom = 'none');
        tabContents.forEach(content => content.style.display = 'none');
        
        // Tambahkan active ke tab yang diklik
        const tabId = button.getAttribute('data-tab');
        button.style.borderBottom = '3px solid var(--secondary)';
        document.getElementById(tabId).style.display = 'block';
    });
});

// Form Tambah Produk
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formMessage = document.getElementById('form-message');
    formMessage.style.display = 'none';
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseInt(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        type: document.getElementById('product-type').value,
        description: document.getElementById('product-description').value,
        image_url: document.getElementById('product-image').value
    };
    
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
        
        if (error) throw error;
        
        formMessage.textContent = 'Produk berhasil ditambahkan!';
        formMessage.style.color = 'green';
        formMessage.style.display = 'block';
        
        // Reset form
        e.target.reset();
        
        // Reload daftar produk
        loadProducts();
        
    } catch (error) {
        formMessage.textContent = 'Gagal menambahkan produk: ' + error.message;
        formMessage.style.color = 'red';
        formMessage.style.display = 'block';
        console.error('Error:', error);
    }
});

// Fungsi untuk memuat produk
async function loadProducts(searchTerm = '') {
    const productGrid = document.getElementById('admin-product-grid');
    productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;"><i class="fas fa-spinner fa-spin"></i> Memuat produk...</p>';
    
    try {
        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }
        
        const { data: products, error } = await query;
        
        if (error) throw error;
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Tidak ada produk ditemukan</p>';
            return;
        }
        
        productGrid.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.style.background = 'white';
            productCard.style.borderRadius = '8px';
            productCard.style.overflow = 'hidden';
            productCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            
            productCard.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 15px;">
                    <h3 style="margin-top: 0;">${product.name}</h3>
                    <p><strong>Rp ${product.price.toLocaleString('id-ID')}</strong></p>
                    <p>Kategori: ${product.category}</p>
                    <button class="delete-product" data-id="${product.id}" style="width: 100%; padding: 8px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            `;
            
            productGrid.appendChild(productCard);
        });
        
        // Tambahkan event listener untuk tombol hapus
        document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.getAttribute('data-id');
                if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                    const { error } = await supabase
                        .from('products')
                        .delete()
                        .eq('id', productId);
                    
                    if (error) {
                        alert('Gagal menghapus produk: ' + error.message);
                    } else {
                        loadProducts();
                    }
                }
            });
        });
        
    } catch (error) {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: red;">Gagal memuat produk: ' + error.message + '</p>';
        console.error('Error:', error);
    }
}

// Pencarian Produk
document.getElementById('product-search').addEventListener('input', (e) => {
    loadProducts(e.target.value);
});

// Inisialisasi Admin Panel
initAdmin();