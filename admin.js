// ======================
// 1. INISIALISASI SUPABASE
// ======================
// Tunggu sampai DOM dan semua resources siap
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Pastikan Supabase SDK sudah terload
    if (typeof supabase === 'undefined') {
        console.error('Supabase SDK belum terload!');
        return;
    }

    // 2. Inisialisasi Client
    const supabaseUrl = 'https://znehlqzprtwvhscoeoim.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A';
    
    const sb = supabase.createClient(supabaseUrl, supabaseKey, {
        auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true,
            storage: localStorage
        }
    });

    // 3. Ekspos variabel supabase ke global scope
    window.supabase = sb;

    // 4. Test Koneksi
    try {
        const { data, error } = await sb.auth.getUser();
        if (error) throw error;
        
        console.log('Supabase terhubung!', data.user);
        initAuth(); // Lanjutkan inisialisasi
    } catch (error) {
        console.error('Koneksi gagal:', error);
    }
});
  
  // ======================
  // 3. FUNGSI AUTH UTAMA
  // ======================
  
  // Fungsi initAuth yang diperbaiki
 async function initAuth() {
    try {
        // Gunakan window.supabase di sini
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
            showAdminPanel();
            loadProducts();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Auth error:', error);
        showLoginForm();
    }
}
// Handle verifikasi email dari link
async function handleEmailVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const token = urlParams.get('token');
  
  if (type === 'signup' && token) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        type: 'signup',
        token_hash: token
      });
      
      if (error) throw error;
      
      verifyMessage.textContent = 'Email berhasil diverifikasi! Silakan login.';
      verifyMessage.style.display = 'block';
      
      // Bersihkan URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } catch (error) {
      verifyMessage.textContent = `Verifikasi gagal: ${error.message}`;
      verifyMessage.style.color = 'red';
      verifyMessage.style.display = 'block';
    }
  }
}

// Fungsi login
async function handleLogin(email, password) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Handle email not verified
      if (error.message.includes('Email not confirmed')) {
        await resendVerificationEmail(email);
        throw new Error('Email belum diverifikasi. Cek inbox Anda untuk link verifikasi!');
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Login error:', error);
    showError(error.message);
    return false;
  }
}

// Fungsi logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    showLoginForm();
  } catch (error) {
    showError(`Logout gagal: ${error.message}`);
  }
}

// Kirim ulang email verifikasi
async function resendVerificationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin + '/admin.html'
      }
    });
    if (error) throw error;
  } catch (error) {
    console.error('Resend error:', error);
  }
}

// ======================
// 4. FUNGSI TAMPILAN UI
// ======================
function showLoginForm() {
  loginContainer.style.display = 'flex';
  adminContent.style.display = 'none';
  clearError();
}

function showAdminPanel() {
  loginContainer.style.display = 'none';
  adminContent.style.display = 'block';
  loadProducts(); // Muat data produk
}

function showError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function clearError() {
  loginError.textContent = '';
  loginError.style.display = 'none';
}

// ======================
// 5. EVENT LISTENERS
// ======================
document.addEventListener('DOMContentLoaded', initAuth);

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  
  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email || !password) {
    showError('Email dan password wajib diisi!');
    return;
  }

  const loginSuccess = await handleLogin(email, password);
  if (loginSuccess) {
    showAdminPanel();
  }
});

logoutBtn.addEventListener('click', handleLogout);

// ======================
// 6. FUNGSI PRODUK (Contoh)
// ======================
async function loadProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderProducts(products || []);
  } catch (error) {
    console.error('Load products error:', error);
    showError(`Gagal memuat produk: ${error.message}`);
  }
}

function renderProducts(products) {
  const productGrid = document.getElementById('admin-product-grid');
  
  if (!products.length) {
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
      if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', btn.dataset.id);
          
          if (error) throw error;
          loadProducts();
        } catch (error) {
          showError(`Gagal menghapus produk: ${error.message}`);
        }
      }
    });
  });
}

// ======================
// 7. PANTAU PERUBAHAN SESSION
// ======================
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  switch (event) {
    case 'SIGNED_IN':
      showAdminPanel();
      break;
    case 'SIGNED_OUT':
      showLoginForm();
      break;
    case 'USER_UPDATED':
      // Handle user update
      break;
  }
});