// Supabase Configuration
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartIcon = document.getElementById('cartIcon');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutOverlay = document.getElementById('checkoutOverlay');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const dynamicFields = document.getElementById('dynamicFields');
const shippingMethodContainer = document.getElementById('shippingMethodContainer');
const summaryItems = document.getElementById('summaryItems');
const summaryTotal = document.getElementById('summaryTotal');
const successModal = document.getElementById('successModal');
const closeSuccess = document.getElementById('closeSuccess');

// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading animation after 1.5 seconds
    setTimeout(() => {
        document.querySelector('.loading-animation').style.opacity = '0';
        setTimeout(() => {
            document.querySelector('.loading-animation').style.display = 'none';
        }, 500);
    }, 1500);

    // Load products from Supabase
    loadProducts();
    
    // Initialize cart
    updateCart();
    
    // Hero slider animation
    initHeroSlider();
    
    // Event listeners
    setupEventListeners();
});

// Load products from Supabase
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');
        
        if (error) throw error;
        
        products = data;
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error.message);
        // Display error message to user
        productGrid.innerHTML = `<div class="error-message">Failed to load products. Please try again later.</div>`;
    }
}

// Display products in the grid
function displayProducts(products) {
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}">
                ${product.discount ? `<span class="product-badge">${product.discount}% OFF</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    Rp ${product.price.toLocaleString()}
                    ${product.original_price ? `<span class="original">Rp ${product.original_price.toLocaleString()}</span>` : ''}
                </div>
                <div class="product-rating">
                    ${getRatingStars(product.rating)}
                    <span class="count">(${product.review_count})</span>
                </div>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
    
    // Add event listeners to add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            addToCart(productId);
        });
    });
}

// Get rating stars HTML
function getRatingStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Add to cart function
function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    
    if (!product) return;
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            type: product.type || 'physical', // default to physical if type not specified
            quantity: 1
        });
    }
    
    // Update cart in localStorage and UI
    updateCart();
    
    // Show success animation
    showAddToCartAnimation();
}

// Show add to cart animation
function showAddToCartAnimation() {
    const cartIcon = document.querySelector('.cart-icon');
    const animation = document.createElement('div');
    animation.className = 'add-to-cart-animation';
    animation.innerHTML = '<i class="fas fa-cart-plus"></i>';
    document.body.appendChild(animation);
    
    // Position animation
    const rect = cartIcon.getBoundingClientRect();
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top + rect.height / 2}px`;
    
    // Animate to cart
    setTimeout(() => {
        animation.style.transform = 'translate(-50%, -50%) scale(1.5)';
        animation.style.opacity = '0';
    }, 100);
    
    // Remove after animation
    setTimeout(() => {
        animation.remove();
    }, 1000);
}

// Update cart in UI and localStorage
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart sidebar
    updateCartSidebar();
}

// Update cart sidebar
function updateCartSidebar() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        cartTotal.textContent = 'Rp 0';
        checkoutBtn.disabled = true;
        return;
    }
    
    checkoutBtn.disabled = false;
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-img">
                <img src="${item.image_url}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">Rp ${item.price.toLocaleString()}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
        
        total += item.price * item.quantity;
    });
    
    // Update total
    cartTotal.textContent = `Rp ${total.toLocaleString()}`;
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            updateCartItemQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            updateCartItemQuantity(productId, 1);
        });
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(productId, change) {
    const item = cart.find(item => item.id == productId);
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
    }
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    updateCart();
}

// Initialize hero slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Start slider
    showSlide(0);
    setInterval(nextSlide, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Cart icon click
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close cart
    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        openCheckoutModal();
    });
    
    // Close checkout modal
    closeCheckout.addEventListener('click', closeCheckoutModal);
    checkoutOverlay.addEventListener('click', closeCheckoutModal);
    
    // Form submission
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processOrder();
    });
    
    // Close success modal
    closeSuccess.addEventListener('click', () => {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// Open checkout modal
function openCheckoutModal() {
    // Update order summary
    updateOrderSummary();
    
    // Check if there are physical products in cart
    const hasPhysicalProducts = cart.some(item => item.type === 'physical');
    const hasDigitalProducts = cart.some(item => item.type === 'digital');
    
    // Show/hide shipping method based on product types
    shippingMethodContainer.style.display = hasPhysicalProducts ? 'block' : 'none';
    
    // Generate dynamic fields based on product types
    dynamicFields.innerHTML = '';
    
    if (hasDigitalProducts) {
        const digitalField = document.createElement('div');
        digitalField.className = 'form-group';
        digitalField.innerHTML = `
            <label for="email">Email Address (for digital products)</label>
            <input type="email" id="email" name="email" ${hasPhysicalProducts ? '' : 'required'}>
        `;
        dynamicFields.appendChild(digitalField);
    }
    
    if (hasPhysicalProducts) {
        const addressField = document.createElement('div');
        addressField.className = 'form-group';
        addressField.innerHTML = `
            <label for="address">Full Address (for physical products)</label>
            <textarea id="address" name="address" rows="3" required></textarea>
        `;
        dynamicFields.appendChild(addressField);
    }
    
    // Show modal
    checkoutModal.classList.add('active');
    checkoutOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close checkout modal
function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
    checkoutOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Update order summary in checkout
function updateOrderSummary() {
    summaryItems.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        summaryItem.innerHTML = `
            <span class="summary-item-name">${item.name} x${item.quantity}</span>
            <span class="summary-item-price">Rp ${itemTotal.toLocaleString()}</span>
        `;
        summaryItems.appendChild(summaryItem);
    });
    
    // Check if shipping is needed
    const hasPhysicalProducts = cart.some(item => item.type === 'physical');
    const shippingCost = hasPhysicalProducts ? 15000 : 0;
    
    if (hasPhysicalProducts) {
        const shippingItem = document.createElement('div');
        shippingItem.className = 'summary-item';
        shippingItem.innerHTML = `
            <span class="summary-item-name">Shipping</span>
            <span class="summary-item-price">Rp ${shippingCost.toLocaleString()}</span>
        `;
        summaryItems.appendChild(shippingItem);
    }
    
    const total = subtotal + shippingCost;
    summaryTotal.textContent = `Rp ${total.toLocaleString()}`;
}

// Process order
function processOrder() {
    // In a real app, you would send this data to your backend
    const formData = new FormData(checkoutForm);
    const orderData = {
        customer: {
            name: formData.get('fullName'),
            whatsapp: formData.get('whatsapp'),
            notes: formData.get('notes'),
            email: formData.get('email'),
            address: formData.get('address')
        },
        items: cart,
        shipping: formData.get('shipping'),
        payment: formData.get('payment'),
        total: cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    };
    
    console.log('Order data:', orderData);
    
    // Simulate processing
    setTimeout(() => {
        closeCheckoutModal();
        showSuccessModal();
        
        // Clear cart
        cart = [];
        updateCart();
    }, 1500);
}

// Show success modal
function showSuccessModal() {
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Category filtering
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const category = card.getAttribute('data-category');
        filterProductsByCategory(category);
    });
});

// Filter products by category
function filterProductsByCategory(category) {
    if (category === 'all') {
        displayProducts(products);
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
    );
    
    displayProducts(filteredProducts);
}