// Initialize Supabase
const supabase = window.supabase.createClient(
    'https://znehlqzprtwvhscoeoim.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A'
);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const notificationContainer = document.getElementById('notificationContainer');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const adminSidebar = document.querySelector('.admin-sidebar');
const pageTitle = document.getElementById('pageTitle');

// Form Elements
const provinceForm = document.getElementById('provinceForm');
const provinceNameInput = document.getElementById('provinceName');
const provincesTable = document.getElementById('provincesTable').getElementsByTagName('tbody')[0];

const citiesForm = document.getElementById('citiesForm');
const citiesNameInput = document.getElementById('citiesName');
const citiesTable = document.getElementById('citiesTable').getElementsByTagName('tbody')[0];

const districtsForm = document.getElementById('districtsForm');
const districtsNameInput = document.getElementById('districtsName');
const districtsTable = document.getElementById('districtsTable').getElementsByTagName('tbody')[0];

// Add these new DOM elements at the top
const cityProvinceSelect = document.getElementById('cityProvince');
const cityTypeSelect = document.getElementById('cityType');
const cityCountElement = document.getElementById('city-count');
const districtCountElement = document.getElementById('district-count');
const courierCountElement = document.getElementById('courier-count');

// Page Titles
const pageTitles = {
    dashboard: 'Dashboard',
    provinces: 'Kelola Provinsi',
    cities: 'Kelola Kota/Kabupaten',
    districts: 'Kelola Kecamatan',
    couriers: 'Kelola Ekspedisi',
    services: 'Kelola Layanan',
    rates: 'Kelola Tarif'
};

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        loadingOverlay.style.opacity = '1';
    }, 10);
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
    }, 300);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 3000);
}

// Switch tabs
function switchTab(tabId) {
    // Update page title
    pageTitle.textContent = pageTitles[tabId] || 'Dashboard';
    
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        }
    });
    
    // Close sidebar on mobile
    if (window.innerWidth < 992) {
        adminSidebar.classList.remove('active');
    }
    
    // Load data for the tab
    loadTabData(tabId);
}

// Toggle sidebar
function toggleSidebar() {
    adminSidebar.classList.toggle('active');
}

// Load data for specific tab
async function loadTabData(tabId) {
    showLoading();
    
    try {
        switch(tabId) {
            case 'dashboard':
                await loadDashboardStats();
                break;
            case 'provinces':
                await loadProvinces();
                break;
            case 'cities':
                await loadCities();
                break;
            case 'districts':
                await loadDistricts();
                break;
            default:
                break;
        }
    } catch (error) {
        showNotification(`Gagal memuat data ${tabId}`, 'error');
        console.error(`Error loading ${tabId}:`, error);
    } finally {
        hideLoading();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const [
            { count: provinceCount },
            { count: cityCount },
            { count: districtCount },
            { count: courierCount }
        ] = await Promise.all([
            supabase.from('provinces').select('*', { count: 'exact', head: true }),
            supabase.from('cities').select('*', { count: 'exact', head: true }),
            supabase.from('districts').select('*', { count: 'exact', head: true }),
            supabase.from('couriers').select('*', { count: 'exact', head: true })
        ]);
        
        document.getElementById('province-count').textContent = provinceCount || 0;
        cityCountElement.textContent = cityCount || 0;
        districtCountElement.textContent = districtCount || 0;
        courierCountElement.textContent = courierCount || 0;
    } catch (error) {
        throw error;
    }
}

// ========== PROVINCE FUNCTIONS ========== //
async function loadProvinces() {
    try {
        const { data, error } = await supabase
            .from('provinces')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        provincesTable.innerHTML = '';
        
        data.forEach(province => {
            const row = provincesTable.insertRow();
            row.innerHTML = `
                <td>${province.id}</td>
                <td>${province.name}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${province.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" data-id="${province.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
        
        // Add event listeners to action buttons
        addProvinceActionListeners();
    } catch (error) {
        throw error;
    }
}

async function addProvince() {
    const name = provinceNameInput.value.trim();
    
    if (!name) {
        showNotification('Nama provinsi tidak boleh kosong', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('provinces')
            .insert([{ name }])
            .select();
            
        if (error) throw error;
        
        showNotification('Provinsi berhasil ditambahkan');
        provinceForm.reset();
        await loadProvinces();
        await loadDashboardStats(); // Update dashboard count
    } catch (error) {
        showNotification('Gagal menambahkan provinsi: ' + error.message, 'error');
        console.error('Error adding province:', error);
    } finally {
        hideLoading();
    }
}


// Add function to load provinces dropdown
async function loadProvinceDropdown() {
    try {
        const { data: provinces, error } = await supabase
            .from('provinces')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        const provinceSelect = document.getElementById('cityProvince');
        provinceSelect.innerHTML = '<option value="">Pilih Provinsi</option>';

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });

        console.log('Dropdown provinsi berhasil dimuat:', provinces);
    } catch (error) {
        console.error('Gagal memuat dropdown provinsi:', error);
        showNotification('Gagal memuat daftar provinsi', 'error');
    }
}

function addProvinceActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await editProvince(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteProvince(id);
        });
    });
}

async function editProvince(id) {
    const newName = prompt('Masukkan nama provinsi baru:');
    if (!newName) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('provinces')
            .update({ name: newName })
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Provinsi berhasil diperbarui');
        await loadProvinces();
    } catch (error) {
        showNotification('Gagal memperbarui provinsi: ' + error.message, 'error');
        console.error('Error updating province:', error);
    } finally {
        hideLoading();
    }
}

async function deleteProvince(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus provinsi ini?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('provinces')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Provinsi berhasil dihapus');
        await loadProvinces();
        await loadDashboardStats(); // Update dashboard count
    } catch (error) {
        showNotification('Gagal menghapus provinsi: ' + error.message, 'error');
        console.error('Error deleting province:', error);
    } finally {
        hideLoading();
    }
}

// ========== CITY FUNCTIONS ========== //
async function loadCities() {
    try {
        showLoading();
        const { data: cities, error } = await supabase
            .from('cities')
            .select(`
                id,
                name,
                type,
                province_id,
                provinces(name)
            `)
            .order('name', { ascending: true });

        if (error) throw error;

        citiesTable.innerHTML = '';

        cities.forEach(city => {
            const row = citiesTable.insertRow();
            row.innerHTML = `
                <td>${city.id}</td>
                <td>${city.type === 'kabupaten' ? 'Kabupaten' : 'Kota'}</td>
                <td>${city.provinces?.name || '-'}</td>
                <td>${city.name}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${city.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" data-id="${city.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });

        addCityActionListeners();

    } catch (error) {
        console.error('Error loading cities:', error);
        showNotification('Gagal memuat data kota/kabupaten', 'error');
    } finally {
        hideLoading();
    }
}

async function addCity() {
    const provinceId = cityProvinceSelect.value;
    const name = citiesNameInput.value.trim();
    const type = cityTypeSelect.value; // Menggunakan variabel yang sudah didefinisikan

    // Validasi input
    if (!provinceId) {
        showNotification('Harap pilih provinsi terlebih dahulu', 'error');
        cityProvinceSelect.focus();
        return;
    }

    if (!name) {
        showNotification('Nama kota/kabupaten tidak boleh kosong', 'error');
        citiesNameInput.focus();
        return;
    }

    if (!type) {
        showNotification('Harap pilih jenis kota/kabupaten', 'error');
        cityTypeSelect.focus();
        return;
    }

    showLoading();

    try {
        const { data, error } = await supabase
            .from('cities')
            .insert([{
                name,
                type,
                province_id: provinceId
            }])
            .select();

        if (error) throw error;

        showNotification('Kota/Kabupaten berhasil ditambahkan');
        citiesForm.reset();
        await loadCities();
        await loadDashboardStats();
    } catch (error) {
        console.error('Error adding city:', error);
        showNotification(`Gagal menambahkan: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function addCityActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await editCity(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteCity(id);
        });
    });
}

async function editCity(id) {
    try {
        // Ambil data kota/kabupaten yang akan diedit
        const { data: cityData, error: fetchError } = await supabase
            .from('cities')
            .select('name, type, province_id, provinces(name)')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Ambil daftar provinsi untuk dropdown
        const { data: provincesData, error: provincesError } = await supabase
            .from('provinces')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (provincesError) throw provincesError;
        
        // Buat form dialog
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Kota/Kabupaten</h3>
                <div class="form-group">
                    <label for="editCityName">Nama</label>
                    <input type="text" id="editCityName" class="form-control" value="${cityData.name}">
                </div>
                <div class="form-group">
                    <label for="editCityType">Jenis</label>
                    <select id="editCityType" class="form-control">
                        <option value="kabupaten" ${cityData.type === 'kabupaten' ? 'selected' : ''}>Kabupaten</option>
                        <option value="kota" ${cityData.type === 'kota' ? 'selected' : ''}>Kota</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editCityProvince">Provinsi</label>
                    <select id="editCityProvince" class="form-control">
                        ${provincesData.map(province => 
                            `<option value="${province.id}" ${province.id === cityData.province_id ? 'selected' : ''}>
                                ${province.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="dialog-buttons">
                    <button type="button" id="cancelEditCity" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="button" id="saveEditCity" class="btn btn-primary">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners untuk dialog
        document.getElementById('cancelEditCity').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('saveEditCity').addEventListener('click', async () => {
            const newName = document.getElementById('editCityName').value.trim();
            const newType = document.getElementById('editCityType').value;
            const newProvinceId = document.getElementById('editCityProvince').value;
            
            if (!newName) {
                showNotification('Nama kota/kabupaten tidak boleh kosong', 'error');
                return;
            }
            
            showLoading();
            
            try {
                const { error } = await supabase
                    .from('cities')
                    .update({ 
                        name: newName,
                        type: newType,
                        province_id: newProvinceId
                    })
                    .eq('id', id);
                
                if (error) throw error;
                
                showNotification('Kota/Kabupaten berhasil diperbarui');
                await loadCities();
            } catch (error) {
                console.error('Error updating city:', error);
                showNotification('Gagal memperbarui kota/kabupaten', 'error');
            } finally {
                hideLoading();
                dialog.remove();
            }
        });
    } catch (error) {
        console.error('Error preparing edit:', error);
        showNotification('Gagal mempersiapkan form edit', 'error');
    }
}

async function deleteCity(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kota/kabupaten ini?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('cities')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Kota/Kabupaten berhasil dihapus');
        await loadCities();
    } catch (error) {
        showNotification('Gagal menghapus kota/kabupaten: ' + error.message, 'error');
        console.error('Error deleting city:', error);
    } finally {
        hideLoading();
    }
}

// ========== DISTRICT FUNCTIONS ========== //
async function loadDistricts() {
    try {
        const { data, error } = await supabase
            .from('districts')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        districtsTable.innerHTML = '';
        
        data.forEach(district => {
            const row = districtsTable.insertRow();
            row.innerHTML = `
                <td>${district.id}</td>
                <td>${district.name}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${district.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" data-id="${district.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
        
        // Add event listeners to action buttons
        addDistrictActionListeners();
    } catch (error) {
        throw error;
    }
}

async function addDistrict() {
    const name = districtsNameInput.value.trim();
    
    if (!name) {
        showNotification('Nama kecamatan tidak boleh kosong', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('districts')
            .insert([{ name }])
            .select();
            
        if (error) throw error;
        
        showNotification('Kecamatan berhasil ditambahkan');
        districtsForm.reset();
        await loadDistricts();
    } catch (error) {
        showNotification('Gagal menambahkan kecamatan: ' + error.message, 'error');
        console.error('Error adding district:', error);
    } finally {
        hideLoading();
    }
}

function addDistrictActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await editDistrict(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteDistrict(id);
        });
    });
}

async function editDistrict(id) {
    const newName = prompt('Masukkan nama kecamatan baru:');
    if (!newName) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('districts')
            .update({ name: newName })
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Kecamatan berhasil diperbarui');
        await loadDistricts();
    } catch (error) {
        showNotification('Gagal memperbarui kecamatan: ' + error.message, 'error');
        console.error('Error updating district:', error);
    } finally {
        hideLoading();
    }
}

async function deleteDistrict(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kecamatan ini?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('districts')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Kecamatan berhasil dihapus');
        await loadDistricts();
    } catch (error) {
        showNotification('Gagal menghapus kecamatan: ' + error.message, 'error');
        console.error('Error deleting district:', error);
    } finally {
        hideLoading();
    }
}

// ========== FORM EVENT LISTENERS ========== //
provinceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addProvince();
});

citiesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCity();
});

districtsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDistrict();
});

// ========== INITIALIZE APP ========== //
function initApp() {
    // Set default tab
    switchTab('dashboard');
    
    // Add event listeners for nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });
    
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    mobileMenuToggle.addEventListener('click', toggleSidebar);
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && 
            !e.target.closest('.admin-sidebar') && 
            !e.target.closest('#mobileMenuToggle')) {
            adminSidebar.classList.remove('active');
        }
    });
    
    // Load provinces dropdown when cities tab is activated
    document.getElementById('cities').addEventListener('click', loadProvincesForDropdown);
}
document.addEventListener('DOMContentLoaded', () => {
    // Load dropdown provinsi ketika menu kota/kab diakses
    document.querySelector('[data-tab="cities"]').addEventListener('click', loadProvinceDropdown);
    
    // Form submission
    document.getElementById('citiesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCity();
    });
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Tambahkan CSS untuk edit dialog
const style = document.createElement('style');
style.textContent = `
.edit-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.edit-dialog .dialog-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.edit-dialog h3 {
    margin-bottom: 20px;
    color: var(--dark);
}

.edit-dialog .form-group {
    margin-bottom: 15px;
}

.edit-dialog .dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}
`;
document.head.appendChild(style);