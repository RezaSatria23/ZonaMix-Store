const supabase = window.supabase.createClient(
    'https://znehlqzprtwvhscoeoim.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A'
);

// DOM Elements
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

const notification = document.createElement('div');
notification.className = 'notification';
document.body.appendChild(notification);

// Fungsi Utama
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    setDefaultDates();
    loadAllData();
    setupForms();
});

// Fungsi untuk menampilkan loading
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Fungsi untuk menyembunyikan loading
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Inisialisasi Tab
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Sembunyikan semua konten tab
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Nonaktifkan semua tombol tab
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Tampilkan konten tab yang dipilih
            document.getElementById(tabId).classList.add('active');
            button.classList.add('active');
        });
    });
    
    // Aktifkan tab pertama
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

// Set tanggal default
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rateEffective').value = today;
}

// Load semua data
function loadAllData() {
    showLoading();
    
    Promise.all([
        loadProvinces(),
        loadCities(),
        loadDistricts(),
        loadCouriers(),
        loadServices(),
        loadRates(),
        loadDropdownData()
    ]).finally(() => {
        hideLoading();
    });
}

// Load data untuk dropdown
function loadDropdownData() {
    return Promise.all([
        loadProvincesForDropdown(),
        loadCitiesForDropdown(),
        loadDistrictsForDropdown(),
        loadCouriersForDropdown(),
        loadServicesForDropdown()
    ]);
}

// Setup Form Submit
function setupForms() {
    setupProvinceForm();
    setupCityForm();
    setupDistrictForm();
    setupCourierForm();
    setupServiceForm();
    setupRateForm();
}

// Province Form
function setupProvinceForm() {
    const form = document.getElementById('provinceForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const name = document.getElementById('provinceName').value;
        
        try {
            const { data, error } = await supabase
                .from('provinces')
                .insert([{ name }])
                .select();
                
            if (error) throw error;
            
            showNotification('Provinsi berhasil ditambahkan');
            form.reset();
            await Promise.all([loadProvinces(), loadProvincesForDropdown()]);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding province:', error);
        } finally {
            hideLoading();
        }
    });
}

// City Form
function setupCityForm() {
    const form = document.getElementById('cityForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const province_id = document.getElementById('cityProvince').value;
        const name = document.getElementById('cityName').value;
        const type = document.getElementById('cityType').value;
        
        try {
            const { data, error } = await supabase
                .from('cities')
                .insert([{ province_id, name, type }])
                .select();
                
            if (error) throw error;
            
            showNotification('Kota/Kabupaten berhasil ditambahkan');
            form.reset();
            await Promise.all([loadCities(), loadCitiesForDropdown()]);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding city:', error);
        } finally {
            hideLoading();
        }
    });
}

// District Form
function setupDistrictForm() {
    const form = document.getElementById('districtForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const city_id = document.getElementById('districtCity').value;
        const name = document.getElementById('districtName').value;
        
        try {
            const { data, error } = await supabase
                .from('districts')
                .insert([{ city_id, name }])
                .select();
                
            if (error) throw error;
            
            showNotification('Kecamatan berhasil ditambahkan');
            form.reset();
            await Promise.all([loadDistricts(), loadDistrictsForDropdown()]);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding district:', error);
        } finally {
            hideLoading();
        }
    });
}

// Courier Form
function setupCourierForm() {
    const form = document.getElementById('courierForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const name = document.getElementById('courierName').value;
        const logo_url = document.getElementById('courierLogo').value;
        const is_active = document.getElementById('courierActive').value === 'true';
        
        try {
            const { data, error } = await supabase
                .from('couriers')
                .insert([{ name, logo_url, is_active }])
                .select();
                
            if (error) throw error;
            
            showNotification('Ekspedisi berhasil ditambahkan');
            form.reset();
            await Promise.all([loadCouriers(), loadCouriersForDropdown()]);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding courier:', error);
        } finally {
            hideLoading();
        }
    });
}

// Service Form
function setupServiceForm() {
    const form = document.getElementById('serviceForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const courier_id = document.getElementById('serviceCourier').value;
        const name = document.getElementById('serviceName').value;
        const description = document.getElementById('serviceDesc').value;
        const estimated_delivery = document.getElementById('serviceEstimate').value;
        
        try {
            const { data, error } = await supabase
                .from('courier_services')
                .insert([{ courier_id, name, description, estimated_delivery }])
                .select();
                
            if (error) throw error;
            
            showNotification('Layanan berhasil ditambahkan');
            form.reset();
            await Promise.all([loadServices(), loadServicesForDropdown()]);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding service:', error);
        } finally {
            hideLoading();
        }
    });
}

// Rate Form
function setupRateForm() {
    const form = document.getElementById('rateForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const courier_service_id = document.getElementById('rateService').value;
        const origin_district_id = document.getElementById('rateOrigin').value;
        const destination_district_id = document.getElementById('rateDestination').value;
        const min_weight = parseFloat(document.getElementById('rateMinWeight').value);
        const max_weight = parseFloat(document.getElementById('rateMaxWeight').value);
        const price = parseFloat(document.getElementById('ratePrice').value);
        const effective_date = document.getElementById('rateEffective').value;
        const expiry_date = document.getElementById('rateExpiry').value || null;
        
        // Validasi
        if (origin_district_id === destination_district_id) {
            showNotification('Asal dan tujuan tidak boleh sama', 'error');
            hideLoading();
            return;
        }
        
        if (min_weight >= max_weight) {
            showNotification('Berat maksimal harus lebih besar dari berat minimal', 'error');
            hideLoading();
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('shipping_rates')
                .insert([{ 
                    courier_service_id, 
                    origin_district_id, 
                    destination_district_id,
                    min_weight,
                    max_weight,
                    price,
                    effective_date,
                    expiry_date
                }])
                .select();
                
            if (error) throw error;
            
            showNotification('Tarif berhasil ditambahkan');
            form.reset();
            document.getElementById('rateEffective').valueAsDate = new Date();
            await loadRates();
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            console.error('Error adding rate:', error);
        } finally {
            hideLoading();
        }
    });
}

// Load Data Functions
async function loadProvinces() {
    try {
        const { data, error } = await supabase
            .from('provinces')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#provincesTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(province => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${province.id}</td>
                <td>${province.name}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${province.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${province.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addProvinceActionListeners();
    } catch (error) {
        console.error('Error loading provinces:', error);
        showNotification('Gagal memuat data provinsi', 'error');
    }
}

async function loadCities() {
    try {
        const { data, error } = await supabase
            .from('cities')
            .select(`
                id,
                name,
                type,
                province_id,
                provinces ( name )
            `)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#citiesTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(city => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${city.id}</td>
                <td>${city.name}</td>
                <td>${city.type === 'kabupaten' ? 'Kabupaten' : 'Kota'}</td>
                <td>${city.provinces.name}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${city.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${city.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addCityActionListeners();
    } catch (error) {
        console.error('Error loading cities:', error);
        showNotification('Gagal memuat data kota/kabupaten', 'error');
    }
}

async function loadDistricts() {
    try {
        const { data, error } = await supabase
            .from('districts')
            .select(`
                id,
                name,
                city_id,
                cities ( name )
            `)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#districtsTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(district => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${district.id}</td>
                <td>${district.name}</td>
                <td>${district.cities.name}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${district.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${district.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addDistrictActionListeners();
    } catch (error) {
        console.error('Error loading districts:', error);
        showNotification('Gagal memuat data kecamatan', 'error');
    }
}

async function loadCouriers() {
    try {
        const { data, error } = await supabase
            .from('couriers')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#couriersTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(courier => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${courier.id}</td>
                <td>${courier.name}</td>
                <td>
                    <span class="status-badge ${courier.is_active ? 'active' : 'inactive'}">
                        ${courier.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" data-id="${courier.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${courier.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addCourierActionListeners();
    } catch (error) {
        console.error('Error loading couriers:', error);
        showNotification('Gagal memuat data ekspedisi', 'error');
    }
}

async function loadServices() {
    try {
        const { data, error } = await supabase
            .from('courier_services')
            .select(`
                id,
                name,
                estimated_delivery,
                courier_id,
                couriers ( name )
            `)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#servicesTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${service.id}</td>
                <td>${service.name}</td>
                <td>${service.couriers.name}</td>
                <td>${service.estimated_delivery || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${service.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${service.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addServiceActionListeners();
    } catch (error) {
        console.error('Error loading services:', error);
        showNotification('Gagal memuat data layanan', 'error');
    }
}

async function loadRates() {
    try {
        const { data, error } = await supabase
            .from('shipping_rates')
            .select(`
                id,
                price,
                min_weight,
                max_weight,
                effective_date,
                expiry_date,
                courier_service_id,
                origin_district_id,
                destination_district_id,
                courier_services ( 
                    name,
                    couriers ( name )
                ),
                origin_district:districts ( name, cities ( name ) ),
                destination_district:districts ( name, cities ( name ) )
            `)
            .order('effective_date', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#ratesTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(rate => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rate.id}</td>
                <td>${rate.courier_services.couriers.name}</td>
                <td>${rate.courier_services.name}</td>
                <td>
                    ${rate.origin_district.name}, ${rate.origin_district.cities.name} → 
                    ${rate.destination_district.name}, ${rate.destination_district.cities.name}
                </td>
                <td>${rate.min_weight} - ${rate.max_weight} kg</td>
                <td>Rp${rate.price.toLocaleString('id-ID')}</td>
                <td>
                    ${new Date(rate.effective_date).toLocaleDateString('id-ID')}
                    ${rate.expiry_date ? ' - ' + new Date(rate.expiry_date).toLocaleDateString('id-ID') : ''}
                </td>
                <td>
                    <button class="action-btn edit-btn" data-id="${rate.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${rate.id}">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        addRateActionListeners();
    } catch (error) {
        console.error('Error loading rates:', error);
        showNotification('Gagal memuat data tarif', 'error');
    }
}

// Load Data for Dropdowns
async function loadProvincesForDropdown() {
    try {
        const { data, error } = await supabase
            .from('provinces')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const dropdown = document.getElementById('cityProvince');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Provinsi</option>';
            data.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id;
                option.textContent = province.name;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading provinces for dropdown:', error);
    }
}

async function loadCitiesForDropdown() {
    try {
        const { data, error } = await supabase
            .from('cities')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const dropdown = document.getElementById('districtCity');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
            data.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading cities for dropdown:', error);
    }
}

async function loadDistrictsForDropdown() {
    try {
        const { data, error } = await supabase
            .from('districts')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const dropdowns = [
            document.getElementById('rateOrigin'),
            document.getElementById('rateDestination')
        ];
        
        dropdowns.forEach(dropdown => {
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Pilih Kecamatan</option>';
                data.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.id;
                    option.textContent = district.name;
                    dropdown.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading districts for dropdown:', error);
    }
}

async function loadCouriersForDropdown() {
    try {
        const { data, error } = await supabase
            .from('couriers')
            .select('id, name')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const dropdown = document.getElementById('serviceCourier');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Ekspedisi</option>';
            data.forEach(courier => {
                const option = document.createElement('option');
                option.value = courier.id;
                option.textContent = courier.name;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading couriers for dropdown:', error);
    }
}

async function loadServicesForDropdown() {
    try {
        const { data, error } = await supabase
            .from('courier_services')
            .select('id, name, couriers ( name )')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        const dropdown = document.getElementById('rateService');
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Layanan</option>';
            data.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.couriers.name} - ${service.name}`;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading services for dropdown:', error);
    }
}

// Action Listeners for Edit/Delete
function addProvinceActionListeners() {
    document.querySelectorAll('#provincesTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for province ID: ' + id);
        });
    });
    
    document.querySelectorAll('#provincesTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus provinsi ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('provinces')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Provinsi berhasil dihapus');
                    await Promise.all([loadProvinces(), loadProvincesForDropdown()]);
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting province:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}

function addCityActionListeners() {
    document.querySelectorAll('#citiesTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for city ID: ' + id);
        });
    });
    
    document.querySelectorAll('#citiesTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus kota/kabupaten ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('cities')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Kota/Kabupaten berhasil dihapus');
                    await Promise.all([loadCities(), loadCitiesForDropdown()]);
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting city:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}

function addDistrictActionListeners() {
    document.querySelectorAll('#districtsTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for district ID: ' + id);
        });
    });
    
    document.querySelectorAll('#districtsTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus kecamatan ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('districts')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Kecamatan berhasil dihapus');
                    await Promise.all([loadDistricts(), loadDistrictsForDropdown()]);
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting district:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}

function addCourierActionListeners() {
    document.querySelectorAll('#couriersTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for courier ID: ' + id);
        });
    });
    
    document.querySelectorAll('#couriersTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus ekspedisi ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('couriers')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Ekspedisi berhasil dihapus');
                    await Promise.all([loadCouriers(), loadCouriersForDropdown()]);
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting courier:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}

function addServiceActionListeners() {
    document.querySelectorAll('#servicesTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for service ID: ' + id);
        });
    });
    
    document.querySelectorAll('#servicesTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('courier_services')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Layanan berhasil dihapus');
                    await Promise.all([loadServices(), loadServicesForDropdown()]);
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting service:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}

function addRateActionListeners() {
    document.querySelectorAll('#ratesTable .edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            // Implement edit functionality
            alert('Edit functionality for rate ID: ' + id);
        });
    });
    
    document.querySelectorAll('#ratesTable .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus tarif ini?')) {
                showLoading();
                try {
                    const { error } = await supabase
                        .from('shipping_rates')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    showNotification('Tarif berhasil dihapus');
                    await loadRates();
                } catch (error) {
                    showNotification('Error: ' + error.message, 'error');
                    console.error('Error deleting rate:', error);
                } finally {
                    hideLoading();
                }
            }
        });
    });
}