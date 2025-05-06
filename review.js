// reviews.js - Handle product reviews functionality

// Initialize review tab
function initReviewTab() {
    const reviewTab = document.querySelector('.product-tab[data-tab="reviews"]');
    if (reviewTab) {
        reviewTab.addEventListener('click', switchProductTab);
    }
}

// Switch between product tabs
function switchProductTab(e) {
    e.preventDefault();
    const tabName = this.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.product-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    this.classList.add('active');
    
    // Update active content
    document.querySelectorAll('.product-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load reviews if needed
    if (tabName === 'reviews') {
        loadProductReviews(this.dataset.productId);
    }
}

// Load product reviews from Supabase
async function loadProductReviews(productId) {
    try {
        const reviewsContainer = document.getElementById('product-reviews');
        reviewsContainer.innerHTML = '<div class="loading-reviews">Memuat ulasan...</div>';
        
        const { data: reviews, error } = await supabase
            .from('product_reviews')
            .select('*, user_id(username, avatar_url)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderReviews(reviews, reviewsContainer);
        updateReviewCount(reviews.length);
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('product-reviews').innerHTML = 
            '<div class="error-loading">Gagal memuat ulasan</div>';
    }
}

// Render reviews to the DOM
function renderReviews(reviews, container) {
    if (reviews.length === 0) {
        container.innerHTML = '<div class="no-reviews">Belum ada ulasan untuk produk ini</div>';
        return;
    }
    
    container.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';
        reviewEl.innerHTML = `
            <div class="review-user">
                <img src="${review.user_id.avatar_url || 'default-avatar.jpg'}" 
                     alt="${review.user_id.username}" 
                     class="user-avatar">
                <div>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                    <div class="review-date">
                        ${new Date(review.created_at).toLocaleDateString('id-ID')}
                    </div>
                </div>
            </div>
            <div class="review-comment">${review.comment || ''}</div>
        `;
        container.appendChild(reviewEl);
    });
    
    // Add review form if user is logged in
    addReviewForm(container);
}

// Add review submission form
function addReviewForm(container) {
    if (isUserLoggedIn()) { // Implement this function based on your auth system
        const form = document.createElement('div');
        form.className = 'review-form';
        form.innerHTML = `
            <h4>Tulis Ulasan Anda</h4>
            <div class="rating-input">
                <span class="star" data-rating="1">☆</span>
                <span class="star" data-rating="2">☆</span>
                <span class="star" data-rating="3">☆</span>
                <span class="star" data-rating="4">☆</span>
                <span class="star" data-rating="5">☆</span>
                <input type="hidden" id="review-rating" value="0">
            </div>
            <textarea id="review-comment" placeholder="Bagaimana pengalaman Anda dengan produk ini?"></textarea>
            <button id="submit-review" class="btn-submit">Kirim Ulasan</button>
        `;
        container.appendChild(form);
        
        initStarRating();
        document.getElementById('submit-review').addEventListener('click', submitReview);
    }
}

// Initialize star rating interaction
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            document.getElementById('review-rating').value = rating;
            
            stars.forEach((s, index) => {
                s.textContent = index < rating ? '★' : '☆';
            });
        });
    });
}

// Submit new review
async function submitReview() {
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value.trim();
    const productId = document.querySelector('.product-tab[data-tab="reviews"]').dataset.productId;
    
    if (rating === 0) {
        showNotification('Harap beri rating terlebih dahulu', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('product_reviews')
            .insert([{
                product_id: productId,
                rating,
                comment,
                user_id: getCurrentUserId() // Implement this function
            }]);
        
        if (error) throw error;
        
        showNotification('Ulasan berhasil dikirim');
        loadProductReviews(productId);
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Gagal mengirim ulasan', 'error');
    }
}

// Update review count in tab
function updateReviewCount(count) {
    const reviewTab = document.querySelector('.product-tab[data-tab="reviews"]');
    if (reviewTab) {
        reviewTab.textContent = `Ulasan (${count})`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initReviewTab);