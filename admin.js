const ADMIN_PASSWORD = "R3z@Sh0p"; // Ganti dengan password kuat

function checkAuth() {
  const savedPassword = localStorage.getItem('adminPassword');
  if (savedPassword !== ADMIN_PASSWORD) {
    const password = prompt("Masukkan password admin:");
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminPassword', password);
    } else {
      window.location.href = "/"; // Redirect ke homepage
    }
  }
}

// Panggil saat halaman admin load
checkAuth();

document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Hapus active dari semua tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Tambahkan active ke tab yang diklik
            const tabId = button.getAttribute('data-tab');
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Form tambah produk
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault()
      
        const productData = {
          name: document.getElementById('product-name').value,
          price: parseInt(document.getElementById('product-price').value),
          category: document.getElementById('product-category').value,
          type: document.getElementById('product-type').value,
          description: document.getElementById('product-description').value,
          image_url: document.getElementById('product-image').value
        }
      
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
      
        if (error) {
          console.error('Error:', error)
          alert('Gagal menambahkan produk!')
        } else {
          alert('Produk berhasil ditambahkan!')
          document.getElementById('add-product-form').reset()
        }
      })
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        });
    }
});
// Fungsi untuk render produk
function renderProducts(searchTerm = '') {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const productGrid = document.getElementById('admin-product-grid');
    
    productGrid.innerHTML = '';
    
    const filteredProducts = searchTerm 
        ? products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : products;
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p class="no-products">Tidak ada produk yang ditemukan</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="admin-product-image">
            <div class="admin-product-info">
                <h3>${product.name}</h3>
                <p>Rp ${parseInt(product.price).toLocaleString('id-ID')}</p>
                <p>Kategori: ${product.category}</p>
                <button class="btn-delete" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
    
    // Event listener untuk tombol hapus
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            deleteProduct(productId);
        });
    });
}

// Fungsi hapus produk
function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products = products.filter(product => product.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    }
}

// Event listener untuk pencarian
document.getElementById('product-search').addEventListener('input', function() {
    renderProducts(this.value);
});

// Panggil pertama kali
renderProducts();