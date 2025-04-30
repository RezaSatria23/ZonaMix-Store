const supabase = window.supabase.createClient(
    'https://znehlqzprtwvhscoeoim.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A',
);


// Fungsi Utama
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi tab
    initTabs();
    
    // Set tanggal default untuk form tarif
    document.getElementById('rateEffective').valueAsDate = new Date();
    
    // Load data untuk dropdown
    loadProvincesForDropdown();
    loadCouriersForDropdown();
    
    // Load data tabel
    loadProvinces();
    loadCities();
    loadDistricts();
    loadCouriers();
    loadServices();
    loadRates();
    
    // Setup form submit
    setupForms();
});

// Ganti fungsi initTabs() yang ada dengan ini:
// Alternatif initTabs
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Sembunyikan semua konten tab
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Tampilkan konten tab yang dipilih
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.style.display = 'block';
            }
            
            // Update status aktif tab
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            btn.classList.add('active');
        });
    });
    
    // Aktifkan tab pertama
    const firstTab = document.querySelector('.tab-btn');
    if (firstTab) firstTab.click();
}

// Form Setup
function setupForms() {
    // Province Form
    document.getElementById('provinceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('provinceName').value;
        
        const { data, error } = await supabase
            .from('provinces')
            .insert([{ name }])
            .select();
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Provinsi berhasil ditambahkan');
            document.getElementById('provinceForm').reset();
            loadProvinces();
            loadProvincesForDropdown();
        }
    });
    
    // City Form
    document.getElementById('cityForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const province_id = document.getElementById('cityProvince').value;
        const name = document.getElementById('cityName').value;
        const type = document.getElementById('cityType').value;
        
        const { data, error } = await supabase
            .from('cities')
            .insert([{ province_id, name, type }])
            .select();
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Kota/Kabupaten berhasil ditambahkan');
            document.getElementById('cityForm').reset();
            loadCities();
            loadCitiesForDropdown();
        }
    });
    
    // District Form
    document.getElementById('districtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const city_id = document.getElementById('districtCity').value;
        const name = document.getElementById('districtName').value;
        
        const { data, error } = await supabase
            .from('districts')
            .insert([{ city_id, name }])
            .select();
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Kecamatan berhasil ditambahkan');
            document.getElementById('districtForm').reset();
            loadDistricts();
            loadDistrictsForDropdown();
        }
    });
    
    // Courier Form
    document.getElementById('courierForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('courierName').value;
        const logo_url = document.getElementById('courierLogo').value;
        const is_active = document.getElementById('courierActive').value === 'true';
        
        const { data, error } = await supabase
            .from('couriers')
            .insert([{ name, logo_url, is_active }])
            .select();
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Ekspedisi berhasil ditambahkan');
            document.getElementById('courierForm').reset();
            loadCouriers();
            loadCouriersForDropdown();
        }
    });
    
    // Service Form
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const courier_id = document.getElementById('serviceCourier').value;
        const name = document.getElementById('serviceName').value;
        const description = document.getElementById('serviceDesc').value;
        const estimated_delivery = document.getElementById('serviceEstimate').value;
        
        const { data, error } = await supabase
            .from('courier_services')
            .insert([{ courier_id, name, description, estimated_delivery }])
            .select();
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Layanan berhasil ditambahkan');
            document.getElementById('serviceForm').reset();
            loadServices();
            loadServicesForDropdown();
        }
    });
    
    // Rate Form
    document.getElementById('rateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const courier_service_id = document.getElementById('rateService').value;
        const origin_district_id = document.getElementById('rateOrigin').value;
        const destination_district_id = document.getElementById('rateDestination').value;
        const min_weight = document.getElementById('rateMinWeight').value;
        const max_weight = document.getElementById('rateMaxWeight').value;
        const price = document.getElementById('ratePrice').value;
        const effective_date = document.getElementById('rateEffective').value;
        const expiry_date = document.getElementById('rateExpiry').value || null;
        
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
            
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Tarif berhasil ditambahkan');
            document.getElementById('rateForm').reset();
            document.getElementById('rateEffective').valueAsDate = new Date();
            loadRates();
        }
    });
}

// Load Data Functions
async function loadProvinces() {
    const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading provinces:', error);
        return;
    }
    
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
    
    // Add event listeners for edit/delete buttons
    addProvinceActionListeners();
}

async function loadCities() {
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
    
    if (error) {
        console.error('Error loading cities:', error);
        return;
    }
    
    const tbody = document.querySelector('#citiesTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(city => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${city.id}</td>
            <td>${city.name}</td>
            <td>${city.type}</td>
            <td>${city.provinces.name}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${city.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${city.id}">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners for edit/delete buttons
    addCityActionListeners();
}

async function loadDistricts() {
    const { data, error } = await supabase
        .from('districts')
        .select(`
            id,
            name,
            city_id,
            cities ( name )
        `)
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading districts:', error);
        return;
    }
    
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
    
    // Add event listeners for edit/delete buttons
    addDistrictActionListeners();
}

async function loadCouriers() {
    const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading couriers:', error);
        return;
    }
    
    const tbody = document.querySelector('#couriersTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(courier => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${courier.id}</td>
            <td>${courier.name}</td>
            <td>${courier.is_active ? 'Aktif' : 'Tidak Aktif'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${courier.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${courier.id}">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners for edit/delete buttons
    addCourierActionListeners();
}

async function loadServices() {
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
    
    if (error) {
        console.error('Error loading services:', error);
        return;
    }
    
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
    
    // Add event listeners for edit/delete buttons
    addServiceActionListeners();
}

async function loadRates() {
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
    
    if (error) {
        console.error('Error loading rates:', error);
        return;
    }
    
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
    
    // Add event listeners for edit/delete buttons
    addRateActionListeners();
}

// Load Data for Dropdowns
async function loadProvincesForDropdown() {
    const { data, error } = await supabase
        .from('provinces')
        .select('id, name')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading provinces for dropdown:', error);
        return;
    }
    
    const dropdowns = [
        document.getElementById('cityProvince'),
        // Add other dropdowns that need provinces if any
    ];
    
    dropdowns.forEach(dropdown => {
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Provinsi</option>';
            data.forEach(province => {
                const option = document.createElement('option');
                option.value = province.id;
                option.textContent = province.name;
                dropdown.appendChild(option);
            });
        }
    });
}

async function loadCitiesForDropdown() {
    const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading cities for dropdown:', error);
        return;
    }
    
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
}

async function loadDistrictsForDropdown() {
    const { data, error } = await supabase
        .from('districts')
        .select('id, name')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading districts for dropdown:', error);
        return;
    }
    
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
}

async function loadCouriersForDropdown() {
    const { data, error } = await supabase
        .from('couriers')
        .select('id, name')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading couriers for dropdown:', error);
        return;
    }
    
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
}

async function loadServicesForDropdown() {
    const { data, error } = await supabase
        .from('courier_services')
        .select('id, name, couriers ( name )')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading services for dropdown:', error);
        return;
    }
    
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
                const { error } = await supabase
                    .from('provinces')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    alert('Error: ' + error.message);
                } else {
                    alert('Provinsi berhasil dihapus');
                    loadProvinces();
                    loadProvincesForDropdown();
                }
            }
        });
    });
}

// Similar functions for other tables (addCityActionListeners, addDistrictActionListeners, etc.)
// Implement these following the same pattern as addProvinceActionListeners

// Note: For production use, you should add proper error handling, loading states, 
// and potentially implement edit functionality for all tables.