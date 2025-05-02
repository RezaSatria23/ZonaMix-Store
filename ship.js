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

const districtCitySelect = document.getElementById('districtCity');

// Deklarasi variabel baru
const villageDistrictSelect = document.getElementById('villageDistrict');
const villagesNameInput = document.getElementById('villagesName');
const villagesForm = document.getElementById('villagesForm');
const villageCountElement = document.getElementById('village-count');
const villagesTable = document.getElementById('villagesTable').getElementsByTagName('tbody')[0];

// Deklarasi variabel baru
const courierNameInput = document.getElementById('courierName');
const courierTypeInput = document.getElementById('courierType');
const courierPriceInput = document.getElementById('courierPrice');
const couriersForm = document.getElementById('couriersForm');
const couriersTable = document.getElementById('couriersTable').getElementsByTagName('tbody')[0];


// DOM Elements for Rates
const shippingCalculatorForm = document.getElementById('shippingCalculatorForm');
const originProvinceSelect = document.getElementById('originProvince');
const originCitySelect = document.getElementById('originCity');
const destinationProvinceSelect = document.getElementById('destinationProvince');
const destinationCitySelect = document.getElementById('destinationCity');
const courierServiceSelect = document.getElementById('courierService');
const packageWeightInput = document.getElementById('packageWeight');
const shippingResults = document.getElementById('shippingResults');
const ratesResultsBody = document.getElementById('ratesResultsBody');
const originSummary = document.getElementById('originSummary');
const destinationSummary = document.getElementById('destinationSummary');
const weightSummary = document.getElementById('weightSummary');
const ratesHistoryTable = document.getElementById('ratesHistoryTable').getElementsByTagName('tbody')[0];
const refreshHistoryBtn = document.getElementById('refreshHistory');


// Page Titles
const pageTitles = {
    dashboard: 'Dashboard',
    provinces: 'Kelola Provinsi',
    cities: 'Kelola Kota/Kabupaten',
    districts: 'Kelola Kecamatan',
    villages: 'Kelola Kelurahan',
    couriers: 'Kelola Ekspedisi',
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
            case 'villages':
                await loadVillages();
                break;
            case 'couriers':
                await loadCouriers();
                break;
            case 'rates':
                await loadRates();
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
            { count: villageCount },
            { count: courierCount },
            { count: ratesCount}
        ] = await Promise.all([
            supabase.from('provinces').select('*', { count: 'exact', head: true }),
            supabase.from('cities').select('*', { count: 'exact', head: true }),
            supabase.from('districts').select('*', { count: 'exact', head: true }),
            supabase.from('villages').select('*', { count: 'exact', head: true }),
            supabase.from('couriers').select('*', { count: 'exact', head: true }),
            supabase.from('rates').select('*', { count: 'exact', head: true }),
        ]);
        
        document.getElementById('province-count').textContent = provinceCount || 0;
        cityCountElement.textContent = cityCount || 0;
        districtCountElement.textContent = districtCount || 0;
        villageCountElement.textContent = villageCount || 0;
        courierCountElement.textContent = courierCount || 0;
        ratesCountElement.textContent = ratesCount || 0;
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
        // Cek duplikasi
        const { data: existing, error: checkError } = await supabase
            .from('provinces')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existing) {
            showNotification('Provinsi sudah ada', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('provinces')
            .insert([{ name }])
            .select();
            
        if (error) throw error;
        
        showNotification('Provinsi berhasil ditambahkan');
        provinceForm.reset();
        await loadProvinces();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menambahkan provinsi: ' + error.message, 'error');
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
        const { data: cities, error } = await supabase
            .from('cities')
            .select(`
                id,
                name,
                type,
                province_id,
                provinces(name)
            `)
            .order('id', { ascending: true }); // Urutkan berdasarkan ID

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
        showNotification('Gagal memuat data kota/kabupaten', 'error');
    }
}


async function addCity() {
    const provinceId = cityProvinceSelect.value;
    const name = citiesNameInput.value.trim();
    const type = cityTypeSelect.value;
    
    if (!provinceId || !name || !type) {
        showNotification('Harap lengkapi semua field!', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Cek duplikasi
        const { data: existing, error: checkError } = await supabase
            .from('cities')
            .select('id')
            .eq('province_id', provinceId)
            .eq('name', name)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existing) {
            showNotification('Kota/Kabupaten sudah ada di provinsi ini!', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('cities')
            .insert([{ 
                name, 
                type, 
                province_id: provinceId 
            }])
            .select();
            
        if (error) throw error;
        
        showNotification('Data berhasil ditambahkan!');
        citiesForm.reset();
        await loadCities();
    } catch (error) {
        showNotification('Gagal menambahkan data: ' + error.message, 'error');
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
            .select(`
                id,
                name,
                city_id,
                cities(name, type)
            `)
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        districtsTable.innerHTML = '';
        
        data.forEach(district => {
            const row = districtsTable.insertRow();
            row.innerHTML = `
                <td>${district.id}</td>
                <td>${district.cities?.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${district.cities?.name || '-'}</td>
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
        
        addDistrictActionListeners();
    } catch (error) {
        showNotification('Gagal memuat data kecamatan', 'error');
    }
}

// Fungsi untuk memuat dropdown kota/kabupaten
async function loadCityDropdown() {
    try {
        const { data: cities, error } = await supabase
            .from('cities')
            .select('id, name, type')
            .order('name', { ascending: true });

        if (error) throw error;

        districtCitySelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = `${city.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${city.name}`;
            districtCitySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Gagal memuat daftar kota:', error);
        showNotification('Gagal memuat daftar kota/kabupaten', 'error');
    }
}

async function addDistrict() {
    const cityId = districtCitySelect.value;
    const name = districtsNameInput.value.trim();
    
    if (!cityId) {
        showNotification('Harap pilih kota/kabupaten terlebih dahulu', 'error');
        return;
    }
    
    if (!name) {
        showNotification('Nama kecamatan tidak boleh kosong', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Cek duplikasi
        const { data: existing, error: checkError } = await supabase
            .from('districts')
            .select('id')
            .eq('city_id', cityId)
            .eq('name', name)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existing) {
            showNotification('Kecamatan sudah ada di kota/kabupaten ini!', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('districts')
            .insert([{ 
                name,
                city_id: cityId 
            }])
            .select();
            
        if (error) throw error;
        
        showNotification('Kecamatan berhasil ditambahkan');
        districtsForm.reset();
        await loadDistricts();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menambahkan kecamatan: ' + error.message, 'error');
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
    try {
        // Ambil data kecamatan yang akan diedit
        const { data: districtData, error: fetchError } = await supabase
            .from('districts')
            .select('name, city_id, cities(name, type)')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Ambil daftar kota untuk dropdown
        const { data: citiesData, error: citiesError } = await supabase
            .from('cities')
            .select('id, name, type')
            .order('name', { ascending: true });
        
        if (citiesError) throw citiesError;
        
        // Buat form dialog
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Kecamatan</h3>
                <div class="form-group">
                    <label for="editDistrictCity">Kota/Kabupaten</label>
                    <select id="editDistrictCity" class="form-control">
                        ${citiesData.map(city => 
                            `<option value="${city.id}" ${city.id === districtData.city_id ? 'selected' : ''}>
                                ${city.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${city.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editDistrictName">Nama Kecamatan</label>
                    <input type="text" id="editDistrictName" class="form-control" value="${districtData.name}">
                </div>
                <div class="dialog-buttons">
                    <button type="button" id="cancelEditDistrict" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="button" id="saveEditDistrict" class="btn btn-primary">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners untuk dialog
        document.getElementById('cancelEditDistrict').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('saveEditDistrict').addEventListener('click', async () => {
            const newCityId = document.getElementById('editDistrictCity').value;
            const newName = document.getElementById('editDistrictName').value.trim();
            
            if (!newName) {
                showNotification('Nama kecamatan tidak boleh kosong', 'error');
                return;
            }
            
            showLoading();
            
            try {
                // Cek duplikasi
                const { data: existing, error: checkError } = await supabase
                    .from('districts')
                    .select('id')
                    .eq('city_id', newCityId)
                    .eq('name', newName)
                    .neq('id', id)
                    .maybeSingle();

                if (checkError) throw checkError;
                
                if (existing) {
                    showNotification('Kecamatan sudah ada di kota/kabupaten ini!', 'error');
                    return;
                }

                const { error } = await supabase
                    .from('districts')
                    .update({ 
                        name: newName,
                        city_id: newCityId
                    })
                    .eq('id', id);
                
                if (error) throw error;
                
                showNotification('Kecamatan berhasil diperbarui');
                await loadDistricts();
            } catch (error) {
                showNotification('Gagal memperbarui kecamatan', 'error');
            } finally {
                hideLoading();
                dialog.remove();
            }
        });
    } catch (error) {
        showNotification('Gagal mempersiapkan form edit', 'error');
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
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menghapus kecamatan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Fungsi untuk memuat dropdown kecamatan
async function loadDistrictDropdown() {
    try {
        const { data: districts, error } = await supabase
            .from('districts')
            .select('id, name, cities(name)')
            .order('name', { ascending: true });

        if (error) throw error;

        villageDistrictSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';

        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.id;
            option.textContent = `${district.name} (${district.cities?.name || '-'})`;
            villageDistrictSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Gagal memuat daftar kecamatan:', error);
        showNotification('Gagal memuat daftar kecamatan', 'error');
    }
}

// Fungsi untuk menambahkan kelurahan
async function addVillage() {
    const districtId = villageDistrictSelect.value;
    const name = villagesNameInput.value.trim();
    
    if (!districtId) {
        showNotification('Harap pilih kecamatan terlebih dahulu', 'error');
        return;
    }
    
    if (!name) {
        showNotification('Nama kelurahan tidak boleh kosong', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Cek duplikasi
        const { data: existing, error: checkError } = await supabase
            .from('villages')
            .select('id')
            .eq('district_id', districtId)
            .eq('name', name)
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existing) {
            showNotification('Kelurahan sudah ada di kecamatan ini!', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('villages')
            .insert([{ 
                name,
                district_id: districtId 
            }])
            .select();
            
        if (error) throw error;
        
        showNotification('Kelurahan berhasil ditambahkan');
        villagesForm.reset();
        await loadVillages();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menambahkan kelurahan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function addVillageActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await editVillage(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteVillage(id);
        });
    });
}

// Fungsi untuk memuat data kelurahan
async function loadVillages() {
    try {
        const { data, error } = await supabase
            .from('villages')
            .select(`
                id,
                name,
                district_id,
                districts(name, cities(name))
            `)
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        villagesTable.innerHTML = '';
        
        data.forEach(village => {
            const row = villagesTable.insertRow();
            row.innerHTML = `
                <td>${village.id}</td>
                <td>${village.districts?.name || '-'} (${village.districts?.cities?.name || '-'})</td>
                <td>${village.name}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${village.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" data-id="${village.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
        
        addVillageActionListeners();
    } catch (error) {
        showNotification('Gagal memuat data kelurahan', 'error');
    }
}

// Fungsi untuk mengedit kelurahan
async function editVillage(id) {
    try {
        // Ambil data kelurahan yang akan diedit
        const { data: villageData, error: fetchError } = await supabase
            .from('villages')
            .select('name, district_id, districts(name, cities(name))')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Ambil daftar kecamatan untuk dropdown
        const { data: districtsData, error: districtsError } = await supabase
            .from('districts')
            .select('id, name, cities(name)')
            .order('name', { ascending: true });
        
        if (districtsError) throw districtsError;
        
        // Buat form dialog
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Kelurahan</h3>
                <div class="form-group">
                    <label for="editVillageDistrict">Kecamatan</label>
                    <select id="editVillageDistrict" class="form-control">
                        ${districtsData.map(district => 
                            `<option value="${district.id}" ${district.id === villageData.district_id ? 'selected' : ''}>
                                ${district.name} (${district.cities?.name || '-'})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editVillageName">Nama Kelurahan</label>
                    <input type="text" id="editVillageName" class="form-control" value="${villageData.name}">
                </div>
                <div class="dialog-buttons">
                    <button type="button" id="cancelEditVillage" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="button" id="saveEditVillage" class="btn btn-primary">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners untuk dialog
        document.getElementById('cancelEditVillage').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('saveEditVillage').addEventListener('click', async () => {
            const newDistrictId = document.getElementById('editVillageDistrict').value;
            const newName = document.getElementById('editVillageName').value.trim();
            
            if (!newName) {
                showNotification('Nama kelurahan tidak boleh kosong', 'error');
                return;
            }
            
            showLoading();
            
            try {
                // Cek duplikasi
                const { data: existing, error: checkError } = await supabase
                    .from('villages')
                    .select('id')
                    .eq('district_id', newDistrictId)
                    .eq('name', newName)
                    .neq('id', id)
                    .maybeSingle();

                if (checkError) throw checkError;
                
                if (existing) {
                    showNotification('Kelurahan sudah ada di kecamatan ini!', 'error');
                    return;
                }

                const { error } = await supabase
                    .from('villages')
                    .update({ 
                        name: newName,
                        district_id: newDistrictId
                    })
                    .eq('id', id);
                
                if (error) throw error;
                
                showNotification('Kelurahan berhasil diperbarui');
                await loadVillages();
            } catch (error) {
                showNotification('Gagal memperbarui kelurahan', 'error');
            } finally {
                hideLoading();
                dialog.remove();
            }
        });
    } catch (error) {
        showNotification('Gagal mempersiapkan form edit', 'error');
    }
}

// Fungsi untuk menghapus kelurahan
async function deleteVillage(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kelurahan ini?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('villages')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Kelurahan berhasil dihapus');
        await loadVillages();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menghapus kelurahan: ' + error.message, 'error');
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

villagesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addVillage();
});

couriersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCourier();
});

function addCourierActionListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await editCourier(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            await deleteCourier(id);
        });
    });
}

// Fungsi untuk menambahkan ekspedisi
async function addCourier() {
    const name = courierNameInput.value.trim();
    const code = document.getElementById('courierCode').value.trim();
    const type = courierTypeInput.value.trim();
    const price = courierPriceInput.value;
    
    if (!name || !code || !type || !price) {
        showNotification('Semua field harus diisi', 'error');
        return;
    }
    
    if (price <= 0) {
        showNotification('Harga harus lebih dari 0', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Cek duplikasi kode ekspedisi
        const { data: existingCode, error: codeError } = await supabase
            .from('couriers')
            .select('id')
            .eq('code', code)
            .maybeSingle();

        if (codeError) throw codeError;
        
        if (existingCode) {
            showNotification('Kode ekspedisi sudah digunakan', 'error');
            return;
        }

        // Cek duplikasi nama ekspedisi
        const { data: existingName, error: nameError } = await supabase
            .from('couriers')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (nameError) throw nameError;
        
        if (existingName) {
            showNotification('Nama ekspedisi sudah ada', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('couriers')
            .insert([{ 
                name,
                code,
                type,
                price: parseFloat(price)
            }])
            .select();
            
        if (error) throw error;
        
        showNotification('Ekspedisi berhasil ditambahkan');
        couriersForm.reset();
        await loadCouriers();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menambahkan ekspedisi: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Fungsi untuk memuat data ekspedisi
async function loadCouriers() {
    try {
        const { data, error } = await supabase
            .from('couriers')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        couriersTable.innerHTML = '';
        
        data.forEach(courier => {
            const row = couriersTable.insertRow();
            row.innerHTML = `
                <td>${courier.id}</td>
                <td>${courier.code}</td>
                <td>${courier.name}</td>
                <td>${courier.type}</td>
                <td>${formatCurrency(courier.price)}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${courier.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action btn-delete" data-id="${courier.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
        });
        
        addCourierActionListeners();
    } catch (error) {
        showNotification('Gagal memuat data ekspedisi', 'error');
    }
}


async function editCourier(id) {
    try {
        // Ambil data ekspedisi yang akan diedit
        const { data: courierData, error: fetchError } = await supabase
            .from('couriers')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Buat form dialog
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Ekspedisi</h3>
                <div class="form-group">
                    <label for="editCourierName">Nama Ekspedisi</label>
                    <input type="text" id="editCourierName" class="form-control" value="${courierData.name}">
                </div>
                <div class="form-group">
                    <label for="editCourierCode">Kode</label>
                    <input type="text" id="editCourierCode" class="form-control" value="${courierData.code}">
                </div>
                <div class="form-group">
                    <label for="editCourierType">Jenis Pengiriman</label>
                    <input type="text" id="editCourierType" class="form-control" value="${courierData.type}">
                </div>
                <div class="form-group">
                    <label for="editCourierPrice">Harga</label>
                    <input type="number" id="editCourierPrice" class="form-control" value="${courierData.price}">
                </div>
                <div class="dialog-buttons">
                    <button type="button" id="cancelEditCourier" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="button" id="saveEditCourier" class="btn btn-primary">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners untuk dialog
        document.getElementById('cancelEditCourier').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('saveEditCourier').addEventListener('click', async () => {
            const newName = document.getElementById('editCourierName').value.trim();
            const newCode = document.getElementById('editCourierCode').value.trim();
            const newType = document.getElementById('editCourierType').value.trim();
            const newPrice = document.getElementById('editCourierPrice').value;
            
            if (!newName || !newCode || !newType || !newPrice) {
                showNotification('Semua field harus diisi', 'error');
                return;
            }
            
            if (newPrice <= 0) {
                showNotification('Harga harus lebih dari 0', 'error');
                return;
            }
            
            showLoading();
            
            try {
                // Cek duplikasi kode (kecuali untuk data saat ini)
                const { data: existingCode, error: codeError } = await supabase
                    .from('couriers')
                    .select('id')
                    .eq('code', newCode)
                    .neq('id', id)
                    .maybeSingle();

                if (codeError) throw codeError;
                
                if (existingCode) {
                    showNotification('Kode ekspedisi sudah digunakan', 'error');
                    return;
                }

                // Cek duplikasi nama (kecuali untuk data saat ini)
                const { data: existingName, error: nameError } = await supabase
                    .from('couriers')
                    .select('id')
                    .eq('name', newName)
                    .neq('id', id)
                    .maybeSingle();

                if (nameError) throw nameError;
                
                if (existingName) {
                    showNotification('Nama ekspedisi sudah ada', 'error');
                    return;
                }

                const { error } = await supabase
                    .from('couriers')
                    .update({ 
                        name: newName,
                        code: newCode,
                        type: newType,
                        price: parseFloat(newPrice)
                    })
                    .eq('id', id);
                
                if (error) throw error;
                
                showNotification('Ekspedisi berhasil diperbarui');
                await loadCouriers();
            } catch (error) {
                showNotification('Gagal memperbarui ekspedisi', 'error');
            } finally {
                hideLoading();
                dialog.remove();
            }
        });
    } catch (error) {
        showNotification('Gagal mempersiapkan form edit', 'error');
    }
}

async function deleteCourier(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus ekspedisi ini?')) return;
    
    showLoading();
    
    try {
        const { error } = await supabase
            .from('couriers')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Ekspedisi berhasil dihapus');
        await loadCouriers();
        await loadDashboardStats();
    } catch (error) {
        showNotification('Gagal menghapus ekspedisi: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Fungsi helper untuk format mata uang
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// ========== INITIALIZE APP ========== //
function initApp() {
    // Set default tab
    switchTab('dashboard');
    
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
document.addEventListener('DOMContentLoaded', () => {
    // Load dropdown provinsi ketika menu kota/kab diakses
    document.querySelector('[data-tab="cities"]').addEventListener('click', loadProvinceDropdown);
    
    // Form submission
    document.getElementById('citiesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCity();
    });
});

document.querySelector('[data-tab="districts"]').addEventListener('click', async () => {
    await loadCityDropdown();
    await loadDistricts();
});

// Event listener untuk tab villages
document.querySelector('[data-tab="villages"]').addEventListener('click', async () => {
    await loadDistrictDropdown();
    await loadVillages();
});

// Event listener untuk tab couriers
document.querySelector('[data-tab="couriers"]').addEventListener('click', loadCouriers);

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

// Fungsi untuk mengupdate display_id di semua tabel
async function updateDisplayIds(tableName) {
    try {
        // Dapatkan semua data diurutkan berdasarkan created_at
        const { data: allData, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: true });
        
        if (fetchError) throw fetchError;
        
        // Update display_id secara berurutan
        const updates = allData.map((item, index) => {
            return supabase
                .from(tableName)
                .update({ display_id: index + 1 })
                .eq('id', item.id);
        });
        
        await Promise.all(updates);
    } catch (error) {
        console.error(`Error updating display_id for ${tableName}:`, error);
    }
}

// Load Provinces for Shipping Calculator
async function loadProvincesForCalculator() {
    try {
        const { data: provinces, error } = await supabase
            .from('provinces')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        // Clear and populate both province selects
        [originProvinceSelect, destinationProvinceSelect].forEach(select => {
            select.innerHTML = '<option value="">Pilih Provinsi</option>';
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id;
                option.textContent = province.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        showNotification('Gagal memuat daftar provinsi', 'error');
    }
}

// Load Cities based on selected Province
async function loadCitiesForCalculator(provinceId, targetSelect) {
    try {
        if (!provinceId) {
            targetSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
            targetSelect.disabled = true;
            return;
        }

        const { data: cities, error } = await supabase
            .from('cities')
            .select('id, name, type')
            .eq('province_id', provinceId)
            .order('name', { ascending: true });

        if (error) throw error;

        targetSelect.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = `${city.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${city.name}`;
            targetSelect.appendChild(option);
        });
        targetSelect.disabled = false;
    } catch (error) {
        showNotification('Gagal memuat daftar kota', 'error');
    }
}

// Load Courier Services
async function loadCourierServices() {
    try {
        const { data: couriers, error } = await supabase
            .from('couriers')
            .select('id, name, code, type, price')
            .order('name', { ascending: true });

        if (error) throw error;

        courierServiceSelect.innerHTML = '<option value="">Pilih Ekspedisi</option>';
        couriers.forEach(courier => {
            const option = document.createElement('option');
            option.value = courier.id;
            option.textContent = `${courier.name} (${courier.type})`;
            courierServiceSelect.appendChild(option);
        });
    } catch (error) {
        showNotification('Gagal memuat daftar ekspedisi', 'error');
    }
}

// Calculate Shipping Rates
async function calculateShippingRates() {
    const originCityId = originCitySelect.value;
    const destinationCityId = destinationCitySelect.value;
    const courierId = courierServiceSelect.value;
    const weight = parseFloat(packageWeightInput.value);

    if (!originCityId || !destinationCityId || !courierId || !weight || weight <= 0) {
        showNotification('Harap lengkapi semua field dengan benar', 'error');
        return;
    }

    showLoading();

    try {
        // Get origin and destination data
        const [{ data: originData }, { data: destinationData }, { data: courierData }] = await Promise.all([
            supabase
                .from('cities')
                .select('name, type, provinces(name)')
                .eq('id', originCityId)
                .single(),
            supabase
                .from('cities')
                .select('name, type, provinces(name)')
                .eq('id', destinationCityId)
                .single(),
            supabase
                .from('couriers')
                .select('*')
                .eq('id', courierId)
                .single()
        ]);

        // Calculate shipping cost
        const baseCost = courierData.price;
        let totalCost = baseCost * weight;
        
        // Apply additional rules (example: additional cost for different provinces)
        if (originData.provinces.id !== destinationData.provinces.id) {
            totalCost += 5000; // Additional cost for inter-province shipping
        }

        // Display results
        originSummary.textContent = `${originData.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${originData.name}, ${originData.provinces.name}`;
        destinationSummary.textContent = `${destinationData.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${destinationData.name}, ${destinationData.provinces.name}`;
        weightSummary.textContent = `${weight} kg`;

        ratesResultsBody.innerHTML = `
            <tr>
                <td>${courierData.name}</td>
                <td>${courierData.type}</td>
                <td>2-3 hari</td>
                <td>${formatCurrency(totalCost)}</td>
                <td>
                    <button class="btn-action btn-save" data-cost="${totalCost}">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </td>
            </tr>
        `;

        // Add event listener to save button
        document.querySelector('.btn-save').addEventListener('click', async () => {
            await saveShippingCalculation(
                originCityId,
                destinationCityId,
                courierId,
                weight,
                totalCost,
                `${originData.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${originData.name}, ${originData.provinces.name}`,
                `${destinationData.type === 'kabupaten' ? 'Kab.' : 'Kota'} ${destinationData.name}, ${destinationData.provinces.name}`,
                courierData.name
            );
        });

        shippingResults.style.display = 'block';
    } catch (error) {
        showNotification('Gagal menghitung ongkir: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Save Shipping Calculation to History
async function saveShippingCalculation(
    originCityId, 
    destinationCityId, 
    courierId, 
    weight, 
    cost,
    originText,
    destinationText,
    courierText
) {
    try {
        const { error } = await supabase
            .from('shipping_history')
            .insert([{
                origin_city_id: originCityId,
                destination_city_id: destinationCityId,
                courier_id: courierId,
                weight: weight,
                cost: cost,
                origin_text: originText,
                destination_text: destinationText,
                courier_text: courierText
            }]);

        if (error) throw error;

        showNotification('Perhitungan berhasil disimpan');
        await loadShippingHistory();
    } catch (error) {
        showNotification('Gagal menyimpan perhitungan: ' + error.message, 'error');
    }
}

// Load Shipping History
async function loadShippingHistory() {
    try {
        const { data: history, error } = await supabase
            .from('shipping_history')
            .select('*')
            .order('created_at', { descending: true })
            .limit(50);

        if (error) throw error;

        ratesHistoryTable.innerHTML = '';

        history.forEach(item => {
            const row = ratesHistoryTable.insertRow();
            row.innerHTML = `
                <td>${new Date(item.created_at).toLocaleString()}</td>
                <td>${item.origin_text}</td>
                <td>${item.destination_text}</td>
                <td>${item.courier_text}</td>
                <td>${item.weight} kg</td>
                <td>${formatCurrency(item.cost)}</td>
                <td>
                    <button class="btn-action btn-history" data-id="${item.id}">
                        <i class="fas fa-redo"></i> Gunakan Lagi
                    </button>
                </td>
            `;
        });

        // Add event listeners to history buttons
        document.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const historyId = e.currentTarget.dataset.id;
                await useHistoryItem(historyId);
            });
        });
    } catch (error) {
        showNotification('Gagal memuat riwayat perhitungan', 'error');
    }
}

// Use History Item
async function useHistoryItem(historyId) {
    try {
        const { data: historyItem, error } = await supabase
            .from('shipping_history')
            .select('*')
            .eq('id', historyId)
            .single();

        if (error) throw error;

        // Set origin province and city
        const { data: originCity, error: originError } = await supabase
            .from('cities')
            .select('province_id')
            .eq('id', historyItem.origin_city_id)
            .single();

        if (originError) throw originError;

        originProvinceSelect.value = originCity.province_id;
        await loadCitiesForCalculator(originCity.province_id, originCitySelect);
        
        // Wait for cities to load
        setTimeout(() => {
            originCitySelect.value = historyItem.origin_city_id;
        }, 500);

        // Set destination province and city
        const { data: destinationCity, error: destinationError } = await supabase
            .from('cities')
            .select('province_id')
            .eq('id', historyItem.destination_city_id)
            .single();

        if (destinationError) throw destinationError;

        destinationProvinceSelect.value = destinationCity.province_id;
        await loadCitiesForCalculator(destinationCity.province_id, destinationCitySelect);
        
        setTimeout(() => {
            destinationCitySelect.value = historyItem.destination_city_id;
        }, 500);

        // Set courier and weight
        courierServiceSelect.value = historyItem.courier_id;
        packageWeightInput.value = historyItem.weight;

        showNotification('Data riwayat telah dimuat. Klik "Hitung Ongkir" untuk menghitung ulang.');
    } catch (error) {
        showNotification('Gagal memuat data riwayat', 'error');
    }
}

// Initialize Rates Tab
function initRatesTab() {
    if (!window.ratesTabInitialized) {
        // Load initial data
        loadProvincesForCalculator();
        loadCourierServices();
        loadShippingHistory();

        // Event listeners for province changes
        originProvinceSelect.addEventListener('change', async (e) => {
            await loadCitiesForCalculator(e.target.value, originCitySelect);
        });

        destinationProvinceSelect.addEventListener('change', async (e) => {
            await loadCitiesForCalculator(e.target.value, destinationCitySelect);
        });

        // Form submission
        shippingCalculatorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await calculateShippingRates();
        });

        // Refresh history button
        refreshHistoryBtn.addEventListener('click', loadShippingHistory);
        
        window.ratesTabInitialized = true;
    }
}
