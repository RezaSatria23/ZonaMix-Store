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
        const { count: provinceCount } = await supabase
            .from('provinces')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('province-count').textContent = provinceCount || 0;
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
        const { data, error } = await supabase
            .from('cities')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        citiesTable.innerHTML = '';
        
        data.forEach(city => {
            const row = citiesTable.insertRow();
            row.innerHTML = `
                <td>${city.id}</td>
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
        
        // Add event listeners to action buttons
        addCityActionListeners();
    } catch (error) {
        throw error;
    }
}

async function addCity() {
    const name = citiesNameInput.value.trim();
    
    if (!name) {
        showNotification('Nama kota/kabupaten tidak boleh kosong', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('cities')
            .insert([{ name }])
            .select();
            
        if (error) throw error;
        
        showNotification('Kota/Kabupaten berhasil ditambahkan');
        citiesForm.reset();
        await loadCities();
    } catch (error) {
        showNotification('Gagal menambahkan kota/kabupaten: ' + error.message, 'error');
        console.error('Error adding city:', error);
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
    const newName = prompt('Masukkan nama kota/kabupaten baru:');
    if (!newName) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('cities')
            .update({ name: newName })
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Kota/Kabupaten berhasil diperbarui');
        await loadCities();
    } catch (error) {
        showNotification('Gagal memperbarui kota/kabupaten: ' + error.message, 'error');
        console.error('Error updating city:', error);
    } finally {
        hideLoading();
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);