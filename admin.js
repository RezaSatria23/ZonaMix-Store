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
        });
    });

    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const description = document.getElementById('product-description').value.trim();
        const image_url = document.getElementById('product-image').value.trim();
        const stock = parseInt(document.getElementById('product-stock').value);
        const messageElement = document.getElementById('product-message');

        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{ 
                    name, 
                    price, 
                    category,
                    description, 
                    image_url,
                    stock
                }])
                .select();

            if (error) throw error;

            // Clear form
            e.target.reset();
            
            // Show success message
            messageElement.textContent = 'Produk berhasil ditambahkan!';
            messageElement.className = 'message success';
            messageElement.style.display = 'block';
            
            // Reload products
            loadProducts();
            
            // Hide message after 3 seconds
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 3000);
            
            } catch (error) {
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.className = 'message error';
                messageElement.style.display = 'block';
            }
    });

    // Product Search
    document.getElementById('search-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const searchTerm = document.getElementById('product-search').value.trim();
        loadProducts(searchTerm);
    });

    // Order Filters
    document.getElementById('order-status-filter').addEventListener('change', () => {
        loadOrders();
    });

    document.getElementById('order-date-filter').addEventListener('change', () => {
        loadOrders();
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

async function loadProducts(searchTerm = '') {
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

        renderProducts(products || []);
    } catch (error) {
        console.error('Error loading products:', error);
        const container = document.getElementById('admin-product-grid');
        container.innerHTML = '<p class="no-products">Error memuat produk</p>';
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
        // Fetch product data
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="edit-modal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Edit Produk</h2>
                    <form id="edit-product-form" data-id="${product.id}">
                        <div class="form-group">
                            <label>Nama Produk</label>
                            <input type="text" id="edit-product-name" value="${product.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Harga</label>
                            <input type="number" id="edit-product-price" value="${product.price}" required>
                        </div>
                        <div class="form-group">
                            <label>Deskripsi</label>
                            <textarea id="edit-product-description" rows="3">${product.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Gambar Produk (URL)</label>
                            <input type="url" id="edit-product-image" value="${product.image_url}" required>
                        </div>
                        <button type="submit">Simpan Perubahan</button>
                        <div id="edit-product-message" class="message"></div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        document.getElementById('edit-modal').style.display = 'flex';

        // Close modal when clicking X
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('edit-modal').remove();
        });

        // Close modal when clicking outside
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('edit-modal')) {
                document.getElementById('edit-modal').remove();
            }
        });

        // Handle form submission
        document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = e.target.getAttribute('data-id');
            const name = document.getElementById('edit-product-name').value.trim();
            const price = parseFloat(document.getElementById('edit-product-price').value);
            const description = document.getElementById('edit-product-description').value.trim();
            const image_url = document.getElementById('edit-product-image').value.trim();
            const messageElement = document.getElementById('edit-product-message');

            try {
                const { data, error } = await supabase
                    .from('products')
                    .update({ name, price, description, image_url })
                    .eq('id', id)
                    .select();

                if (error) throw error;

                // Show success message
                messageElement.textContent = 'Produk berhasil diperbarui!';
                messageElement.style.backgroundColor = '#e8f5e9';
                messageElement.style.color = '#2e7d32';
                messageElement.style.display = 'block';
                
                // Reload products
                loadProducts();
                
                // Close modal after 1 second
                setTimeout(() => {
                    document.getElementById('edit-modal').remove();
                }, 1000);
                
            } catch (error) {
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.style.backgroundColor = '#ffebee';
                messageElement.style.color = '#c62828';
                messageElement.style.display = 'block';
            }
        });

    } catch (error) {
        console.error('Error showing edit modal:', error);
    }
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