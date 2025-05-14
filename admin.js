// Add these variables at the top of your file
let currentPage = 1;
const productsPerPage = 8;
let allProducts = [];
let filteredProducts = [];

// ======================
// 1. INISIALISASI GLOBAL
// ======================
const supabase = window.supabase.createClient(
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

// ======================
// 2. FUNGSI UTAMA
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cek session yang ada
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        // Inisialisasi event listeners
        initEventListeners();

        if (session) {
            showAdminPanel();
            loadProducts();
            loadOrders();
        } else {
            showLoginForm();
        }

    } catch (error) {
        console.error('Initialization error:', error);
        showLoginForm();
    }
});
// Fungsi simpan produk yang sudah diperbaiki
async function saveProduct(productData) {
    try {
        const marketplaceLinks = getMarketplaceLinks();

        // Validasi minimal 1 link untuk produk fisik
        if (productData.type === 'fisik' && Object.keys(marketplaceLinks).length === 0) {
            throw new Error('Harap masukkan minimal 1 link marketplace untuk produk fisik');
        }
            
        // Pastikan is_published tidak NULL
        const completeData = {
            ...productData,
            is_published: true, // Langsung set TRUE
            marketplace_links: marketplaceLinks
        };
        
        const { data, error } = await supabase
            .from('products')
            .insert([completeData])
            .select();
    
        if (error) throw error;
    
        console.log('Produk tersimpan:', data[0]);
        return data[0];
    } catch (error) {
        console.error('Error menyimpan produk:', error.message);
        return null;
    }
}
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
            loadOrders();
            
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

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Load data when switching to specific tabs
            if (tabId === 'manage-products') {
                loadProducts();
            } else if (tabId === 'view-orders') {
                loadOrders();
            }
        });
    });
    document.getElementById('product-type').addEventListener('change', function() {
        const mediaField = document.getElementById('media-field-container');
        if (this.value === 'fisik') {
            mediaField.style.display = 'block';
            document.getElementById('product-media').required = true;
        } else {
            mediaField.style.display = 'none';
            document.getElementById('product-media').required = false;
        }
    });
    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Dapatkan semua nilai dari form
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            type: document.getElementById('product-type').value,
            stock: parseInt(document.getElementById('product-stock').value),
            description: document.getElementById('product-description').value.trim(),
            image_url: document.getElementById('product-image').value.trim()
        };

        // Tambahkan berat jika produk fisik
        if (productData.type === 'fisik') {
            productData.media_url = document.getElementById('product-media').value.trim();
        }

        const messageElement = document.getElementById('product-message');
        messageElement.style.display = 'none';

        // Validasi
        if (!productData.name || isNaN(productData.price) || !productData.category || 
            !productData.type || isNaN(productData.stock)) {
            showMessage('Harap isi semua field yang wajib diisi', 'error', messageElement);
            return;
        }

        try {
            // Validasi gambar
            const img = new Image();
            img.src = productData.image_url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('URL gambar tidak valid'));
            });

            // Simpan produk ke Supabase
            const savedProduct = await saveProduct(productData);
            
            if (savedProduct) {
                // Tampilkan ringkasan produk
                showProductSummary(savedProduct);
                showMessage('Produk berhasil ditambahkan!', 'success', messageElement);
                
                // Update preview gambar
                const previewImg = document.getElementById('image-preview');
                previewImg.src = savedProduct.image_url;
                previewImg.style.display = 'block';
            } else {
                throw new Error('Gagal menyimpan produk');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(`Error: ${error.message}`, 'error', messageElement);
        }
    });
    // Fungsi untuk memeriksa dan menampilkan preview gambar
    document.getElementById('product-image').addEventListener('input', function() {
        const imageUrl = this.value.trim();
        const previewImg = document.getElementById('image-preview');
        const imageError = document.getElementById('image-error');
        
        // Reset state
        previewImg.style.display = 'none';
        imageError.style.display = 'none';
        
        if (imageUrl) {
            // Buat gambar baru untuk pengecekan
            const testImage = new Image();
            testImage.onload = function() {
                // Jika gambar berhasil dimuat
                previewImg.src = imageUrl;
                previewImg.style.display = 'block';
                imageError.style.display = 'none';
            };
            testImage.onerror = function() {
                // Jika gambar gagal dimuat
                previewImg.style.display = 'none';
                imageError.style.display = 'block';
                imageError.textContent = 'Gambar tidak dapat dimuat. Pastikan URL valid dan dapat diakses.';
            };
            testImage.src = imageUrl;
        }
    });

    // Fungsi untuk memastikan URL gambar valid sebelum disimpan
    function validateImageUrl(url) {
        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
                return;
            }
            
            const testImage = new Image();
            testImage.onload = function() {
                resolve(true);
            };
            testImage.onerror = function() {
                resolve(false);
            };
            testImage.src = url;
        });
    }

    // Function to show product summary
    function showProductSummary(product) {
        // Sembunyikan placeholder
        const placeholder = document.querySelector('.summary-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        // Tampilkan container ringkasan
        const summaryContent = document.getElementById('summary-content');
        if (!summaryContent) {
            console.error('Element summary-content tidak ditemukan');
            return;
        }
        
        // Isi data produk
        document.getElementById('summary-name').textContent = product.name || '-';
        document.getElementById('summary-price').textContent = product.price ? 'Rp ' + product.price.toLocaleString('id-ID') : '-';
        document.getElementById('summary-category').textContent = product.category || '-';
        document.getElementById('summary-type').textContent = product.type || '-';
        document.getElementById('summary-stock').textContent = product.stock || '0';
        document.getElementById('summary-description').textContent = product.description || 'Tidak ada deskripsi';
        
        // Tambahkan marketplace links ke summary jika ada
        if (product.marketplace_links && Object.keys(product.marketplace_links).length > 0) {
            const marketplaceRow = document.createElement('div');
            marketplaceRow.className = 'detail-row full-width';
            marketplaceRow.innerHTML = '<span class="detail-label">Marketplace:</span><div class="marketplace-links"></div>';

            const linksContainer = marketplaceRow.querySelector('.marketplace-links');
            
            Object.entries(product.marketplace_links).forEach(([marketplace, url]) => {
                let icon, label;
                switch(marketplace) {
                    case 'shopee':
                        icon = '<i class="fab fa-shopify"></i>';
                        label = 'Shopee';
                        break;
                    case 'tokopedia':
                        icon = '<i class="fas fa-store"></i>';
                        label = 'Tokopedia';
                        break;
                    case 'tiktok':
                        icon = '<i class="fab fa-tiktok"></i>';
                        label = 'TikTok Shop';
                        break;
                    default:
                        icon = '<i class="fas fa-link"></i>';
                        label = marketplace;
                }

                linksContainer.innerHTML += `
                    <div class="marketplace-link">
                        ${icon} <a href="${url}" target="_blank">${label}</a>
                    </div>
                `;
            });

            document.querySelector('.summary-details').appendChild(marketplaceRow);
        }

        // Handle gambar produk
        const summaryImage = document.getElementById('summary-image');
        if (summaryImage) {
            summaryImage.src = product.image_url || '';
            summaryImage.onerror = function() {
                this.src = 'https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia';
            };
        }

        // Tambahkan ini di bagian detail produk
        if (product.type === 'fisik' && product.media_url) {
            const mediaRow = document.createElement('div');
            mediaRow.className = 'detail-row';
            mediaRow.innerHTML = `
                <span class="detail-label">Media:</span>
                <span class="detail-value">
                    <a href="${product.media_url}" target="_blank">Lihat Media</a>
                </span>
            `;
            document.querySelector('.summary-details').appendChild(mediaRow);
        }
        
        // Tampilkan ringkasan
        summaryContent.style.display = 'block';
        
        // Set product ID untuk tombol konfirmasi
        const confirmBtn = document.getElementById('confirm-product');
        if (confirmBtn) {
            confirmBtn.dataset.productId = product.id;
        }
    }

    // Confirm product button handler
    document.getElementById('confirm-product').addEventListener('click', () => {
        const productId = document.getElementById('confirm-product').dataset.productId;
        
        // You can add additional confirmation logic here if needed
        alert('Produk telah dikonfirmasi dan disimpan!');
        
        // Reset the form and summary
        document.getElementById('add-product-form').reset();
        document.querySelector('.summary-placeholder').style.display = 'block';
        document.getElementById('summary-content').style.display = 'none';
        document.getElementById('product-message').style.display = 'none';
        
        // Reload products in manage tab
        if (document.querySelector('.tab-btn[data-tab="manage-products"]').classList.contains('active')) {
            loadProducts();
        }
        // Reset form dan pratinjau
        document.getElementById('add-product-form').reset();

        const imagePreview = document.getElementById('image-preview');
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        
        // Reset input URL gambar
        document.getElementById('product-image').value = '';
    });
    // Add event listeners for search and pagination
    document.getElementById('product-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        currentPage = 1;
        
        if (searchTerm) {
            filteredProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm)
            );
        } else {
            filteredProducts = [...allProducts];
        }
        
        renderProducts();
        updateProductCount();
    });

    document.getElementById('reset-search').addEventListener('click', () => {
        document.getElementById('product-search').value = '';
        currentPage = 1;
        filteredProducts = [...allProducts];
        renderProducts();
        updateProductCount();
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage * productsPerPage < filteredProducts.length) {
            currentPage++;
            renderProducts();
        }
    });

   document.querySelectorAll('.marketplace-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const marketplace = this.dataset.marketplace;
            const inputContainer = document.getElementById(`${marketplace}-input`);
            
            if (this.classList.contains('active')) {
                inputContainer.style.display = 'block';
            } else {
                inputContainer.style.display = 'none';
                inputContainer.querySelector('input').value = '';
            }
        });
    });
}
// Modifikasi fungsi untuk mengumpulkan marketplace links
function getMarketplaceLinks() {
    const links = {};
    document.querySelectorAll('.marketplace-btn.active').forEach(btn => {
        const marketplace = btn.dataset.marketplace;
        const url = document.querySelector(`.marketplace-input[data-marketplace="${marketplace}"]`).value;
        if (url) {
            links[marketplace] = url;
        }
    });
    return links;
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

async function loadProducts(searchTerm = '') {
    const container = document.getElementById('admin-product-grid');
    container.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Memuat produk...</div>';
    
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

        allProducts = products || [];
        filteredProducts = [...allProducts];
        
        updateProductCount();
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<div class="error-message">Gagal memuat produk</div>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('admin-product-grid');
    
    if (!products.length) {
        container.innerHTML = '<p class="no-products">Tidak ada produk yang ditemukan</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>Rp ${product.price.toLocaleString('id-ID')}</p>
                <p class="product-description">${product.description || 'Tidak ada deskripsi'}</p>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', btn.dataset.id);
                
                if (!error) loadProducts();
            }
        });
    });

    // Add edit event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showEditModal(btn.dataset.id);
        });
    });
}

async function showEditModal(productId) {
    try {
        const marketplaceLinks = product.marketplace_links || {};
        // Fetch product data
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;



        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="edit-product-modal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2><i class="fas fa-edit"></i> Edit Produk</h2>
                    <form id="edit-product-form" data-id="${product.id}">
                        <div class="form-group">
                            <label>Nama Produk</label>
                            <input type="text" id="edit-product-name" value="${product.name}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Harga (Rp)</label>
                                <input type="number" id="edit-product-price" value="${product.price}" required>
                            </div>
                            <div class="form-group">
                                <label>Kategori</label>
                                <select id="edit-product-category" required>
                                    <option value="fashion" ${product.category === 'fashion' ? 'selected' : ''}>Fashion</option>
                                    <option value="aksesoris" ${product.category === 'aksesoris' ? 'selected' : ''}>Aksesoris</option>
                                    <option value="template" ${product.category === 'template' ? 'selected' : ''}>Template</option>
                                    <option value="snack" ${product.category === 'snack' ? 'selected' : ''}>Aneka Sncak</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select id="edit-product-type" required>
                                    <option value="fisik" ${product.type === 'Fisik' ? 'selected' : ''}>Fisik</option>
                                    <option value="digital" ${product.type === 'Digital' ? 'selected' : ''}>Digital</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Stok Tersedia</label>
                                <input type="number" id="edit-product-stock" min="0" value="${product.stock}" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Deskripsi Produk</label>
                            <textarea id="edit-product-description" rows="4">${product.description || ''}</textarea>
                        </div>

                        <div class="form-group" id="edit-media-field-container" style="${product.type === 'fisik' ? 'display: block;' : 'display: none;'}">
                            <label>Pilih Marketplace (Minimal 1)</label>
                            <div class="marketplace-options">
                                <div class="marketplace-btn ${marketplaceLinks.shopee ? 'active' : ''}" data-marketplace="shopee">
                                    <i class="fab fa-shopify"></i>
                                    <span>Shopee</span>
                                    <input type="hidden" name="edit-marketplace" value="shopee">
                                </div>
                                
                                <div class="marketplace-btn ${marketplaceLinks.tokopedia ? 'active' : ''}" data-marketplace="tokopedia">
                                    <i class="fas fa-store"></i>
                                    <span>Tokopedia</span>
                                    <input type="hidden" name="edit-marketplace" value="tokopedia">
                                </div>
                                
                                <div class="marketplace-btn ${marketplaceLinks.tiktok ? 'active' : ''}" data-marketplace="tiktok">
                                    <i class="fab fa-tiktok"></i>
                                    <span>TikTok Shop</span>
                                    <input type="hidden" name="edit-marketplace" value="tiktok">
                                </div>
                            </div>
                            
                            <!-- Input containers -->
                            <div id="edit-shopee-input" class="marketplace-input-container" style="${marketplaceLinks.shopee ? 'display: block;' : 'display: none;'}">
                                <div class="marketplace-input-group">
                                    <i class="fab fa-shopify"></i>
                                    <input type="url" class="marketplace-input" placeholder="https://shopee.co.id/product-link" 
                                        data-marketplace="shopee" value="${marketplaceLinks.shopee || ''}">
                                </div>
                            </div>
                            
                            <!-- Similar for Tokopedia and TikTok -->
                        </div>
                        
                        <div class="form-group">
                            <label>Gambar Produk (URL)</label>
                            <input type="url" id="edit-product-image" value="${product.image_url}" required>
                        </div>
                        
                        <button type="submit" class="btn-submit">
                            <i class="fas fa-save"></i> Simpan Perubahan
                        </button>
                        
                        <div id="edit-product-message" class="message"></div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('edit-product-modal');
        modal.style.display = 'flex';

        // Close modal when clicking X or outside
        document.querySelector('#edit-product-modal .close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Toggle field berat berdasarkan jenis produk
        document.getElementById('edit-product-type').addEventListener('change', function() {
            const mediaField = document.getElementById('edit-media-field-container');
            if (this.value === 'fisik') {
                mediaField.style.display = 'block';
                document.getElementById('edit-product-media').required = true;
            } else {
                mediaField.style.display = 'none';
                document.getElementById('edit-product-media').required = false;
            }
        });

        // Handle form submission
        document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = e.target.dataset.id;
            const name = document.getElementById('edit-product-name').value.trim();
            const price = parseFloat(document.getElementById('edit-product-price').value);
            const category = document.getElementById('edit-product-category').value;
            const type = document.getElementById('edit-product-type').value;
            const stock = parseInt(document.getElementById('edit-product-stock').value);
            const media_url = type === 'fisik' ? document.getElementById('edit-product-media').value.trim() : null;
            const description = document.getElementById('edit-product-description').value.trim();
            const image_url = document.getElementById('edit-product-image').value.trim();
            const messageElement = document.getElementById('edit-product-message');

            try {
                const { data, error } = await supabase
                    .from('products')
                    .update({ 
                        name, 
                        price, 
                        category,
                        type,
                        stock,
                        media_url,
                        description, 
                        image_url 
                    })
                    .eq('id', id)
                    .select();

                if (error) throw error;

                // Update local product data
                const updatedProduct = data[0];
                const productIndex = allProducts.findIndex(p => p.id == id);
                if (productIndex !== -1) {
                    allProducts[productIndex] = updatedProduct;
                }
                
                const filteredIndex = filteredProducts.findIndex(p => p.id == id);
                if (filteredIndex !== -1) {
                    filteredProducts[filteredIndex] = updatedProduct;
                }

                // Show success message
                messageElement.textContent = 'Produk berhasil diperbarui!';
                messageElement.className = 'message success';
                messageElement.style.display = 'block';
                
                // Re-render products
                renderProducts();
                
                // Close modal after 1 second
                setTimeout(() => {
                    modal.remove();
                }, 1000);
                
            } catch (error) {
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.className = 'message error';
                messageElement.style.display = 'block';
            }
        });

    } catch (error) {
        console.error('Error showing edit modal:', error);
        alert('Gagal memuat data produk');
    }
    // Di dalam showEditModal, setelah modal ditampilkan:
    document.querySelectorAll('#edit-media-field-container .marketplace-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const marketplace = this.dataset.marketplace;
            const inputContainer = document.getElementById(`edit-${marketplace}-input`);
            
            if (this.classList.contains('active')) {
                inputContainer.style.display = 'block';
            } else {
                inputContainer.style.display = 'none';
                inputContainer.querySelector('input').value = '';
            }
        });
    });
}

async function loadOrders() {
    const statusFilter = document.getElementById('order-status').value;
    const dateFilter = document.getElementById('order-date').value;
    
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = `<tr><td colspan="8" class="loading-orders"><i class="fas fa-spinner fa-spin"></i> Memuat pesanan...</td></tr>`;
    
    try {
        let query = supabase
            .from('orders')
            .select(`
                id,
                customer_name,
                customer_email,
                customer_phone,
                customer_address,
                customer_notes,
                total_amount,
                status,
                created_at,
                order_items:order_items(
                    product:products(
                        name,
                        category
                    ),
                    quantity
                )
            `)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setDate(endDate.getDate() + 1);
            
            query = query.gte('created_at', startDate.toISOString())
                         .lt('created_at', endDate.toISOString());
        }

        const { data: orders, error } = await query;

        if (error) throw error;

        renderOrders(orders || []);
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="error-message">Error memuat pesanan</td></tr>`;
    }
}

function renderOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-orders">Tidak ada pesanan</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const hasDigitalProduct = order.order_items.some(item => item.product.category === 'digital');
        const address = hasDigitalProduct ? 'DGT' : order.customer_address || '-';
        
        return `
            <tr>
                <td>${formatDateTime(order.created_at)}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>${address}</td>
                <td>${order.customer_notes || '-'}</td>
                <td>Rp ${order.total_amount.toLocaleString('id-ID')}</td>
                <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                <td class="order-actions">
                    <select class="status-select" data-order-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Belum Bayar</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Proses</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Dikirim</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Selesai</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Batal</option>
                    </select>
                    <button class="update-status-btn" data-order-id="${order.id}">Update</button>
                </td>
            </tr>
        `;
    }).join('');

    // Add event listeners for status updates
    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const orderId = btn.dataset.orderId;
            const statusSelect = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
            const newStatus = statusSelect.value;

            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: newStatus })
                    .eq('id', orderId);

                if (error) throw error;

                // Reload orders to show updated status
                loadOrders();
                
            } catch (error) {
                console.error('Error updating order status:', error);
                alert('Gagal mengupdate status pesanan');
            }
        });
    });
}
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get status text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Belum Bayar',
        'paid': 'Proses',
        'shipped': 'Dikirim',
        'completed': 'Selesai',
        'cancelled': 'Batal'
    };
    return statusMap[status] || status;
}
// Add event listeners for filters and refresh button
document.getElementById('order-status').addEventListener('change', loadOrders);
document.getElementById('order-date').addEventListener('change', loadOrders);
document.getElementById('refresh-orders').addEventListener('click', loadOrders);
loadOrders();
function renderProducts() {
    const container = document.getElementById('admin-product-grid');
    const startIdx = (currentPage - 1) * productsPerPage;
    const endIdx = startIdx + productsPerPage;
    const productsToDisplay = filteredProducts.slice(startIdx, endIdx);
    
    if (!productsToDisplay.length) {
        container.innerHTML = '<div class="no-products">Tidak ada produk yang ditemukan</div>';
        return;
    }

    container.innerHTML = productsToDisplay.map(product => `
        <div class="product-management-card" data-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}" class="product-card-image">
            <div class="product-card-body">
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-card-meta">
                    <span class="product-card-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                    <span class="product-card-category">${product.category}</span>
                </div>
                <div class="product-card-stock">
                    Stok: ${product.stock} | Terjual: 0
                </div>
                <div class="product-card-actions">
                    <button class="edit-product-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-product-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            showEditModal(productId);
        });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            deleteProduct(productId);
        });
    });

    // Add click event to view product details
    document.querySelectorAll('.product-management-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Only if not clicking on a button
            if (!e.target.closest('button')) {
                const productId = card.dataset.id;
                showProductDetails(productId);
            }
        });
    });

    updatePaginationControls();
}

function updateProductCount() {
    document.getElementById('total-products').textContent = filteredProducts.length;
    document.getElementById('page-info').textContent = `Halaman ${currentPage} dari ${Math.ceil(filteredProducts.length / productsPerPage)}`;
}

function updatePaginationControls() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage * productsPerPage >= filteredProducts.length;
    
    document.getElementById('page-info').textContent = `Halaman ${currentPage} dari ${Math.ceil(filteredProducts.length / productsPerPage)}`;
}

function showProductDetails(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    const modalHTML = `
        <div class="modal" id="product-details-modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2><i class="fas fa-info-circle"></i> Detail Produk</h2>
                
                <div class="product-details-container">
                    <div class="product-details-image">
                        <img src="${product.image_url}" alt="${product.name}">
                    </div>
                    <div class="product-details-info">
                        <h3>${product.name}</h3>
                        <div class="product-details-meta">
                            <span class="price">Rp ${product.price.toLocaleString('id-ID')}</span>
                            <span class="category">${product.category}</span>
                            <span class="stock">Stok: ${product.stock}</span>
                        </div>
                        <div class="product-details-description">
                            <h4>Deskripsi:</h4>
                            <p>${product.description || 'Tidak ada deskripsi'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (product.type === 'fisik' && product.media_url) {
        modalHTML += `
            <div class="product-details-media">
                <h4>Media:</h4>
                <a href="${product.media_url}" target="_blank">Lihat Media</a>
            </div>
        `;
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('product-details-modal');
    modal.style.display = 'flex';

    // Close modal when clicking X or outside
    document.querySelector('#product-details-modal .close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Function to delete a product
async function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        // Remove from local arrays
        allProducts = allProducts.filter(p => p.id != productId);
        filteredProducts = filteredProducts.filter(p => p.id != productId);
        
        // Re-render products
        renderProducts();
        updateProductCount();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Gagal menghapus produk');
    }
}