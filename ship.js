// Initialize Supabase
const supabase = window.supabase.createClient(
    'https://znehlqzprtwvhscoeoim.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZWhscXpwcnR3dmhzY29lb2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjQzNzUsImV4cCI6MjA2MTAwMDM3NX0.XsjXAE-mt7RMIncAJuO6XSdZxhQQv79uCUPPVU9mF2A'
);

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const notificationContainer = document.getElementById('notificationContainer');
const addDataBtn = document.getElementById('addDataBtn');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.add('active');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.remove('active');
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
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 3000);
}

// Switch tabs
function switchTab(tabId) {
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
    
    // Load data for the tab
    loadTabData(tabId);
}

// Load data for specific tab
function loadTabData(tabId) {
    showLoading();
    
    switch(tabId) {
        case 'provinces':
            loadProvinces();
            break;
        case 'cities':
            loadCities();
            break;
        case 'districts':
            loadDistricts();
            break;
        case 'couriers':
            loadCouriers();
            break;
        case 'services':
            loadServices();
            break;
        case 'rates':
            loadRates();
            break;
        case 'dashboard':
            loadDashboardStats();
            break;
        default:
            hideLoading();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get counts for each category
        const [
            { count: provinceCount },
            { count: cityCount },
            { count: courierCount },
            { count: rateCount }
        ] = await Promise.all([
            supabase.from('provinces').select('*', { count: 'exact', head: true }),
            supabase.from('cities').select('*', { count: 'exact', head: true }),
            supabase.from('couriers').select('*', { count: 'exact', head: true }),
            supabase.from('shipping_rates').select('*', { count: 'exact', head: true })
        ]);
        
        // Update UI
        document.getElementById('province-count').textContent = provinceCount || 0;
        document.getElementById('city-count').textContent = cityCount || 0;
        document.getElementById('courier-count').textContent = courierCount || 0;
        document.getElementById('rate-count').textContent = rateCount || 0;
        
    } catch (error) {
        showNotification('Gagal memuat statistik dashboard', 'error');
        console.error('Error loading dashboard stats:', error);
    } finally {
        hideLoading();
    }
}

// Initialize the app
function initApp() {
    // Set default tab
    switchTab('dashboard');
    
    // Add event listeners for nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });
    
    // Floating action button
    addDataBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.nav-item.active').dataset.tab;
        showAddForm(activeTab);
    });
    
    // Load all dropdown data
    loadDropdownData();
}

// Show add form based on active tab
function showAddForm(tabId) {
    // Implement form display logic for each tab
    showNotification(`Membuka form tambah data untuk ${tabId}`, 'success');
}

// Load all dropdown data
function loadDropdownData() {
    // Implement dropdown loading logic
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
