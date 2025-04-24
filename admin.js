// ======================
// 1. INISIALISASI GLOBAL
// ======================
let supabase; // Variabel global

// ======================
// 2. FUNGSI UTAMA
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inisialisasi Supabase
        supabase = supabase.createClient(
            'https://znehlqzprtwvhscoeoim.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A',
            {
                auth: {
                    flowType: 'pkce',
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    persistSession: true,
                    storage: localStorage
                }
            }
        );

        // Cek session yang ada
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        // Inisialisasi event listeners
        initEventListeners();

        if (session) {
            showAdminPanel();
            loadProducts();
        } else {
            showLoginForm();
        }

    } catch (error) {
        console.error('Initialization error:', error);
        showLoginForm();
    }
});

// ======================
// 3. FUNGSI BANTUAN
// ======================
function initEventListeners() {
    // Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        const errorElement = document.getElementById('login-error');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            showAdminPanel();
            loadProducts();
            
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    });

    // Logout Button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) showLoginForm();
    });
}

function showLoginForm() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('admin-content').style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
}

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
    }
}

function renderProducts(products) {
    const container = document.getElementById('admin-product-grid');
    
    if (!products.length) {
        container.innerHTML = '<p class="no-products">Tidak ada produk</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Rp ${product.price.toLocaleString('id-ID')}</p>
            <button class="delete-btn" data-id="${product.id}">
                <i class="fas fa-trash"></i> Hapus
            </button>
        </div>
    `).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Hapus produk ini?')) {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', btn.dataset.id);
                
                if (!error) loadProducts();
            }
        });
    });
}