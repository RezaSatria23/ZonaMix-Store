// Inisialisasi Supabase
const supabaseUrl = 'https://your-project-id.supabase.co'; // GANTI DENGAN URL ANDA
const supabaseKey = 'your-anon-key'; // GANTI DENGAN ANON KEY ANDA
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginForm = document.getElementById('login-form');
const adminEmail = document.getElementById('admin-email');
const adminPassword = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const adminContent = document.getElementById('admin-content');
const logoutBtn = document.getElementById('logout-btn');

// Fungsi untuk cek status login
async function checkAuthStatus() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
        // User sudah login
        showAdminPanel();
    } else {
        // User belum login
        showLoginForm();
    }
}

// Tampilkan form login
function showLoginForm() {
    loginContainer.style.display = 'flex';
    adminContent.style.display = 'none';
    loginError.style.display = 'none';
}

// Tampilkan admin panel
function showAdminPanel() {
    loginContainer.style.display = 'none';
    adminContent.style.display = 'block';
    loadProducts(); // Muat data produk setelah login
}

// Fungsi untuk handle login
async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.message;
        loginError.style.display = 'block';
        return false;
    }
}

// Fungsi untuk handle logout
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    }
    showLoginForm();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    if (!email || !password) {
        loginError.textContent = 'Email dan password wajib diisi!';
        loginError.style.display = 'block';
        return;
    }

    const loginSuccess = await handleLogin(email, password);
    
    if (loginSuccess) {
        showAdminPanel();
    }
});

logoutBtn.addEventListener('click', async () => {
    await handleLogout();
});

// Fungsi untuk load produk (contoh)
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Gagal memuat produk: ' + error.message);
    }
}

// Fungsi untuk render produk (contoh)
function renderProducts(products) {
    const productGrid = document.getElementById('admin-product-grid');
    
    if (!products || products.length === 0) {
        productGrid.innerHTML = '<p class="no-products">Tidak ada produk ditemukan</p>';
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Rp ${product.price.toLocaleString('id-ID')}</p>
            <button class="delete-btn" data-id="${product.id}">
                <i class="fas fa-trash"></i> Hapus
            </button>
        </div>
    `).join('');

    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
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
}