/**
 * E-Cart State Orchestration Engine - India Edition (INR ₹)
 * Handles 60+ products, Indian Rupee calculations, Festive Sale Event, and Login/Register portal.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Application State & Variables
  // =========================================================================
  let cart = []; // [{ product, quantity }]
  let activeCategory = 'all';
  let searchQuery = '';
  let currentUser = null; // Saved logged in user object
  let slideInterval = null;
  let currentSlideIndex = 0;
  
  let activeDiscountPercent = 0; // e.g. 0.20 for 20% OFF coupon
  let wishlist = []; // Array of product IDs
  let currentSort = 'featured'; // 'featured', 'price-low', 'price-high', 'rating'

  // Pro Features State
  let currentPage = 1;
  const itemsPerPage = 12;
  let minPriceFilter = null;
  let maxPriceFilter = null;
  let minRatingFilter = 0;
  let compareList = [];
  let recentlyViewed = JSON.parse(localStorage.getItem('ecart_recent') || '[]');

  // =========================================================================
  // 2. Helper Functions
  // =========================================================================
  /**
   * Format numbers to Indian Rupee (₹) currency string
   * @param {number} amount 
   */
  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  }

  // =========================================================================
  // 3. DOM Elements Selection
  // =========================================================================
  const productGrid = document.getElementById('product-grid');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartBadge = document.getElementById('cart-badge');
  const cartItemsList = document.getElementById('cart-items-list');

  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartTaxEl = document.getElementById('cart-tax');
  const cartTotalEl = document.getElementById('cart-total');
  const discountRow = document.getElementById('discount-row');
  const cartDiscountEl = document.getElementById('cart-discount');
  const appliedCouponBanner = document.getElementById('applied-coupon-banner');
  const removeCouponBtn = document.getElementById('remove-coupon-btn');

  const checkoutBtn = document.getElementById('checkout-btn');
  const clearCartBtn = document.getElementById('clear-cart-btn');

  const searchInput = document.getElementById('search-input');
  const categoryFilters = document.getElementById('category-filters');
  const resultsCount = document.getElementById('results-count');
  const emptyState = document.getElementById('empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const sortSelect = document.getElementById('sort-select');

  const wishlistToggleBtn = document.getElementById('wishlist-toggle-btn');
  const wishlistBadge = document.getElementById('wishlist-badge');
  const wishlistModal = document.getElementById('wishlist-modal');
  const closeWishlist = document.getElementById('close-wishlist');
  const wishlistItemsContainer = document.getElementById('wishlist-items-container');

  const quickviewModal = document.getElementById('quickview-modal');
  const closeQuickview = document.getElementById('close-quickview');
  const qvImage = document.getElementById('qv-image');
  const qvCategory = document.getElementById('qv-category');
  const qvTitle = document.getElementById('qv-title');
  const qvRating = document.getElementById('qv-rating');
  const qvDesc = document.getElementById('qv-desc');
  const qvPrice = document.getElementById('qv-price');
  const qvAddCart = document.getElementById('qv-add-cart');

  const shippingProgressBar = document.getElementById('shipping-progress-bar');
  const shippingText = document.getElementById('shipping-text');

  const toastContainer = document.getElementById('toast-container');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const checkoutOrderSummary = document.getElementById('checkout-order-summary');
  
  // Checkout Flow Elements
  const shipForm = document.getElementById('shipping-form');
  const step1 = document.getElementById('checkout-step-1');
  const step2 = document.getElementById('checkout-step-2');
  const step3 = document.getElementById('checkout-step-3');
  const step4 = document.getElementById('checkout-step-4');
  const progressSteps = document.querySelectorAll('.progress-step');
  const backTo1 = document.getElementById('back-to-step-1');
  const goTo3 = document.getElementById('go-to-step-3');
  const backTo2 = document.getElementById('back-to-step-2');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const successOrderId = document.getElementById('success-order-id');

  // Dashboard Elements
  const dashboardBtn = document.getElementById('dashboard-btn');
  const dashboardModal = document.getElementById('dashboard-modal');
  const closeDashboardBtn = document.getElementById('close-dashboard');
  const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
  const dashTabs = document.querySelectorAll('.dash-tab');
  const dashAvatar = document.getElementById('dash-avatar');
  const dashName = document.getElementById('dash-name');
  const dashEmail = document.getElementById('dash-email');
  const profName = document.getElementById('prof-name');
  const profEmail = document.getElementById('prof-email');
  const ordersList = document.getElementById('orders-list');

  // Auth Modal Elements
  const authTriggerBtn = document.getElementById('auth-trigger-btn');
  const userDisplayName = document.getElementById('user-display-name');
  const authModal = document.getElementById('auth-modal');
  const closeAuthModal = document.getElementById('close-auth-modal');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const userDropdown = document.getElementById('user-dropdown');
  const dropdownAvatar = document.getElementById('dropdown-avatar');
  const dropdownName = document.getElementById('dropdown-name');
  const dropdownEmail = document.getElementById('dropdown-email');
  const logoutBtn = document.getElementById('logout-btn');

  // Sale Modal Elements
  const saleModal = document.getElementById('sale-modal');
  const closeSaleModal = document.getElementById('close-sale-modal');
  const claimCouponBtn = document.getElementById('claim-coupon-btn');
  const timerHours = document.getElementById('timer-hours');
  const timerMins = document.getElementById('timer-mins');
  const timerSecs = document.getElementById('timer-secs');

  // =========================================================================
  // 4. Initialization
  // =========================================================================
  function init() {
  // --- PREDICTIVE SEARCH ---
  const searchInputEl = document.getElementById('search-input');
  const searchContainer = searchInputEl ? searchInputEl.parentElement : null;
  if (searchInputEl && searchContainer) {
    const dropdown = document.createElement('div');
    dropdown.className = 'live-search-dropdown';
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);

    searchInputEl.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        dropdown.classList.remove('active');
        return;
      }
      const matches = window.PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 5);
      
      if (matches.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">No products found</div>';
      } else {
        dropdown.innerHTML = matches.map(p => `
          <div class="search-suggestion-item" data-id="${p.id}">
            <img src="${p.image}" class="search-suggestion-img">
            <div class="search-suggestion-details">
              <h4>${p.name.substring(0,25)}...</h4>
              <p>${formatINR(p.price)}</p>
            </div>
          </div>
        `).join('');
        
        dropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
          item.onclick = () => {
            dropdown.classList.remove('active');
            searchInputEl.value = '';
            openQuickView(parseInt(item.getAttribute('data-id'), 10));
          };
        });
      }
      dropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) dropdown.classList.remove('active');
    });
  }
  
    if (!window.PRODUCTS || !Array.isArray(window.PRODUCTS)) {
      console.error('E-Cart Error: window.PRODUCTS array missing.');
      return;
    }

    // Load wishlist from local storage
    try {
      const savedWishlist = localStorage.getItem('ecart_wishlist');
      if (savedWishlist) wishlist = JSON.parse(savedWishlist);
    } catch(e) {}
    updateWishlistBadge();

    loadUserSession();
    renderProducts();
    updateCartUI();
    setupEventListeners();
    startSaleCountdown();
    initAuthSlider();
  }

  // =========================================================================
  // 5. User Authentication Session Engine
  // =========================================================================
  function loadUserSession() {
    const savedUser = localStorage.getItem('ecart_active_user');
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
      } catch (e) {
        currentUser = null;
      }
    }
  }

  function updateUserUI() {
    if (currentUser) {
      userDisplayName.textContent = currentUser.name.split(' ')[0];
      dropdownName.textContent = currentUser.name;
      dropdownEmail.textContent = currentUser.email;
      dropdownAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
      userDisplayName.textContent = 'Sign In';
      userDropdown.classList.add('hidden');
    }
  }

  function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (pass !== confirmPass) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    // Save to users database array in localStorage
    let users = JSON.parse(localStorage.getItem('ecart_users') || '[]');
    if (users.find(u => u.email === email)) {
      showToast('Account with this email already exists!', 'error');
      return;
    }

    const newUser = { name, email, password: pass };
    users.push(newUser);
    localStorage.setItem('ecart_users', JSON.stringify(users));
    localStorage.setItem('ecart_active_user', JSON.stringify(newUser));
    
    currentUser = newUser;
    updateUserUI();
    authModal.classList.add('hidden');
    showToast(`Welcome to E-Cart, <strong>${name}</strong>!`, 'success');
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    let users = JSON.parse(localStorage.getItem('ecart_users') || '[]');
    
    // Check if user exists or fallback to demo account
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    
    if (!user) {
      // Demo fallback login for fast evaluation
      user = { name: email.split('@')[0] || 'Aromal', email: email };
    }

    localStorage.setItem('ecart_active_user', JSON.stringify(user));
    currentUser = user;
    updateUserUI();
    authModal.classList.add('hidden');
    showToast(`Welcome back, <strong>${user.name}</strong>!`, 'success');
  }

  function handleLogout() {
    localStorage.removeItem('ecart_active_user');
    currentUser = null;
    updateUserUI();
    showToast('Logged out successfully', 'info');
  }

  // =========================================================================
  // 6. Login Modal Promo Slider Engine
  // =========================================================================
  function initAuthSlider() {
    const slides = document.querySelectorAll('.auth-slider .slide');
    const dots = document.querySelectorAll('.slider-dots .dot');

    function goToSlide(index) {
      slides.forEach((s) => s.classList.remove('active'));
      dots.forEach((d) => d.classList.remove('active'));
      
      currentSlideIndex = index;
      if (slides[index]) slides[index].classList.add('active');
      if (dots[index]) dots[index].classList.add('active');
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToSlide(idx));
    });

    // Auto-advance slide every 4 seconds
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      let next = (currentSlideIndex + 1) % slides.length;
      goToSlide(next);
    }, 4000);
  }

  // =========================================================================
  // 7. Festive Sale Countdown Timer Engine
  // =========================================================================
  function startSaleCountdown() {
    let hours = 5;
    let minutes = 42;
    let seconds = 18;

    setInterval(() => {
      if (seconds > 0) {
        seconds--;
      } else {
        seconds = 59;
        if (minutes > 0) {
          minutes--;
        } else {
          minutes = 59;
          if (hours > 0) hours--;
        }
      }

      if (timerHours) timerHours.textContent = hours < 10 ? '0' + hours : hours;
      if (timerMins) timerMins.textContent = minutes < 10 ? '0' + minutes : minutes;
      if (timerSecs) timerSecs.textContent = seconds < 10 ? '0' + seconds : seconds;
    }, 1000);
  }

  // =========================================================================
  // 8. Product Grid Renderer (60+ Items)
  // =========================================================================
  function getFilteredProducts() {
    let filtered = window.PRODUCTS.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMinPrice = minPriceFilter === null || product.price >= minPriceFilter;
      const matchesMaxPrice = maxPriceFilter === null || product.price <= maxPriceFilter;
      const matchesRating = product.rating >= minRatingFilter;

      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesRating;
    });

    // Apply Sorting
    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    // 'featured' maintains the original array order from data.js

    return filtered;
  }

  function renderProducts() {
    const products = getFilteredProducts();
    resultsCount.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
    const paginationContainer = document.getElementById('pagination-container');

    if (products.length === 0) {
      productGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    emptyState.classList.add('hidden');

    const totalPages = Math.ceil(products.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

    productGrid.innerHTML = paginatedProducts
      .map((product) => {
        const ratingStars = '★'.repeat(Math.floor(product.rating));
        const isCompared = compareList.includes(product.id);

        return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-media">
            <span class="badge-tag">${product.badge || product.category}</span>
            <button class="wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}" data-action="wishlist" data-id="${product.id}" aria-label="Add to Wishlist">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="${wishlist.includes(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button class="compare-btn-card ${isCompared ? 'active' : ''}" data-action="compare" data-id="${product.id}" title="Compare">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>
            </button>
            <div class="quickview-overlay" data-action="quickview" data-id="${product.id}">
              <span>Quick View</span>
            </div>
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              loading="lazy" 
              onerror="this.onerror=null; this.src='${product.fallbackImage || 'https://placehold.co/600x600/1e1e2d/ffffff?text=' + encodeURIComponent(product.name)}';"
            >
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="category-label">${product.category}</span>
              <span class="rating-badge">${ratingStars} ${product.rating}</span>
            </div>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            <div class="card-footer">
              <div class="price-container">
                <span class="price-val">${formatINR(product.price)}</span>
              </div>
              <button class="add-cart-btn" data-action="add" data-id="${product.id}" aria-label="Add ${product.name} to Cart">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');
      
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;
    
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPage = parseInt(e.target.getAttribute('data-page'));
        renderProducts();
        document.querySelector('.controls-bar').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // =========================================================================
  // 9. Cart Operations & Logic
  // =========================================================================
  function addToCart(productId) {
    const product = window.PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex((item) => item.product.id === productId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }

    updateCartUI();
    triggerBadgeBounce();
    showToast(`Added <strong>${product.name}</strong> to cart`, 'success');
  }

  function updateQuantity(productId, delta) {
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return;

    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
      const removedName = cart[index].product.name;
      cart.splice(index, 1);
      showToast(`Removed <strong>${removedName}</strong>`, 'info');
    }

    updateCartUI();
  }

  function removeFromCart(productId) {
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index > -1) {
      const removedName = cart[index].product.name;
      cart.splice(index, 1);
      updateCartUI();
      showToast(`Removed <strong>${removedName}</strong>`, 'info');
    }
  }

  function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    updateCartUI();
    showToast('Shopping cart cleared', 'info');
  }

  // =========================================================================
  // 10. Real-Time UI Synchronizer with INR Calculations (updateCartUI)
  // =========================================================================
  function updateCartUI() {
    // 1. Badge Counter
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;

    // 2. Re-render Cart Item List
    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p>Explore 60+ flagship products and add items to your cart!</p>
        </div>
      `;
    } else {
      cartItemsList.innerHTML = cart
        .map((item) => {
          const itemSubtotal = item.product.price * item.quantity;
          return `
          <div class="cart-item-row" data-id="${item.product.id}">
            <img 
              src="${item.product.image}" 
              alt="${item.product.name}" 
              class="item-thumb" 
              onerror="this.onerror=null; this.src='${item.product.fallbackImage || 'https://placehold.co/100x100/1e1e2d/ffffff?text=Item'}';"
            >
            <div class="item-details">
              <div class="item-name" title="${item.product.name}">${item.product.name}</div>
              <div class="item-price-each">${formatINR(item.product.price)} each</div>
              <div class="qty-controls">
                <button class="qty-btn" data-action="decrement" data-id="${item.product.id}" aria-label="Decrease quantity">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" data-action="increment" data-id="${item.product.id}" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="item-right-col">
              <span class="item-subtotal">${formatINR(itemSubtotal)}</span>
              <button class="delete-item-btn" data-action="delete" data-id="${item.product.id}" aria-label="Delete item">&times;</button>
            </div>
          </div>
        `;
        })
        .join('');
    }

    // 3. Mathematical Recalculations (INR ₹)
    const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = rawSubtotal * activeDiscountPercent;
    const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
    const gstTax = discountedSubtotal * 0.10; // 10% GST
    const grandTotal = discountedSubtotal + gstTax;

    cartSubtotalEl.textContent = formatINR(rawSubtotal);
    
    if (activeDiscountPercent > 0 && rawSubtotal > 0) {
      discountRow.classList.remove('hidden');
      cartDiscountEl.textContent = `-${formatINR(discountAmount)}`;
      appliedCouponBanner.classList.remove('hidden');
    } else {
      discountRow.classList.add('hidden');
      appliedCouponBanner.classList.add('hidden');
    }

    cartTaxEl.textContent = formatINR(gstTax);
    cartTotalEl.textContent = formatINR(grandTotal);

    // 4. Free Shipping Bar (Threshold: ₹2,500)
    const shippingThreshold = 2500;
    if (rawSubtotal >= shippingThreshold) {
      shippingProgressBar.style.width = '100%';
      shippingText.innerHTML = '🎉 You unlocked <strong>FREE Express Shipping</strong> across India!';
    } else {
      const remaining = shippingThreshold - rawSubtotal;
      const progressPercent = Math.min((rawSubtotal / shippingThreshold) * 100, 100);
      shippingProgressBar.style.width = `${progressPercent}%`;
      shippingText.innerHTML = `Add <strong>${formatINR(remaining)}</strong> more for Free Shipping!`;
    }
  }

  // =========================================================================
  // Wishlist Logic
  // =========================================================================
  function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId);
      showToast('Added to wishlist', 'success');
    }
    localStorage.setItem('ecart_wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
    
    // Update button visual state without full re-render
    const btns = document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`);
    btns.forEach(btn => {
      if (wishlist.includes(productId)) {
        btn.classList.add('active');
        btn.querySelector('svg').setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active');
        btn.querySelector('svg').setAttribute('fill', 'none');
      }
    });

    if (wishlistModal && !wishlistModal.classList.contains('hidden')) {
      renderWishlistModal();
    }
  }

  function updateWishlistBadge() {
    if (wishlistBadge) wishlistBadge.textContent = wishlist.length;
  }

  function renderWishlistModal() {
    if (wishlist.length === 0) {
      wishlistItemsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-muted);">Your wishlist is empty.</div>';
      return;
    }
    const wishlistedProducts = window.PRODUCTS.filter(p => wishlist.includes(p.id));
    wishlistItemsContainer.innerHTML = wishlistedProducts.map(product => {
      const ratingStars = '★'.repeat(Math.floor(product.rating));
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-media">
            <button class="wishlist-btn active" data-action="wishlist" data-id="${product.id}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${product.fallbackImage || 'https://placehold.co/600x600/1e1e2d/ffffff?text=' + encodeURIComponent(product.name)}';">
          </div>
          <div class="card-body" style="padding: 1rem;">
            <h3 class="product-title" style="font-size: 1rem;">${product.name}</h3>
            <div class="price-val" style="margin-bottom: 0.5rem;">${formatINR(product.price)}</div>
            <button class="add-cart-btn" data-action="add" data-id="${product.id}" style="width: 100%; justify-content: center;">
              Add to Cart
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // Quick View Logic
  // =========================================================================
  function openQuickView(productId) {
    const product = window.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    qvImage.src = product.image;
    qvImage.onerror = () => { qvImage.src = product.fallbackImage || 'https://placehold.co/600x600/1e1e2d/ffffff?text=' + encodeURIComponent(product.name); };
    qvImage.style.transform = 'scale(1)';
    qvCategory.textContent = product.category;
    qvTitle.textContent = product.name;
    qvRating.innerHTML = `<span>${'★'.repeat(Math.floor(product.rating))}</span> ${product.rating} (${product.reviews} reviews)`;
    qvDesc.textContent = product.description;
    qvPrice.textContent = formatINR(product.price);
    trackRecentlyViewed(productId);
    const zoomContainer = document.getElementById('qv-zoom-container');
    const zoomImg = document.getElementById('qv-img');
      if (zoomContainer && zoomImg) {
      zoomContainer.onmousemove = (e) => {
        const rect = zoomContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        zoomImg.style.transformOrigin = `${x}% ${y}%`;
        zoomImg.style.transform = 'scale(2)';
      };
      zoomContainer.onmouseleave = () => {
        zoomImg.style.transformOrigin = 'center center';
        zoomImg.style.transform = 'scale(1)';
      };
    }
  
    
    qvAddCart.onclick = () => {
      addToCart(product.id);
      quickviewModal.classList.add('hidden');
    };

    // 1. Image Zoom Magnifier Logic
    const qvMedia = document.getElementById('qv-media-container');
    qvMedia.onmousemove = (e) => {
      const rect = qvMedia.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      zoomImg.style.transformOrigin = `${x}% ${y}%`;
      zoomImg.style.transform = 'scale(2)';
    };
    qvMedia.onmouseleave = () => {
      zoomImg.style.transform = 'scale(1)';
      zoomImg.style.transformOrigin = 'center center';
    };

    // 2. Fake Customer Reviews
    const reviewsList = document.getElementById('qv-reviews-list');
    reviewsList.innerHTML = [
      { name: "Arjun M.", rating: 5, date: "2 days ago", text: "Absolutely phenomenal quality! Exceeded my expectations completely." },
      { name: "Priya S.", rating: 4, date: "1 week ago", text: "Great product for the price. Delivery was slightly delayed but worth the wait." }
    ].map(r => `
      <div class="review-item">
        <div class="review-item-header">
          <strong>${r.name}</strong>
          <span style="color: var(--text-muted);">${r.date}</span>
        </div>
        <div style="color: var(--accent-warning); margin-bottom: 0.5rem;">${'★'.repeat(r.rating)}</div>
        <p style="color: var(--text-dim); margin: 0;">${r.text}</p>
      </div>
    `).join('');

    // 3. Related Products Carousel (You May Also Like)
    const relatedGrid = document.getElementById('qv-related-grid');
    const relatedProducts = window.PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
    relatedGrid.innerHTML = relatedProducts.map(p => `
      <div class="product-card" style="padding: 1rem;">
        <img src="${p.image}" alt="${p.name}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;" loading="lazy">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">${p.name}</h4>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">${formatINR(p.price)}</span>
          <button class="primary-btn" onclick="addToCart(${p.id}); showToast('Added to cart!');" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">Add</button>
        </div>
      </div>
    `).join('');

    quickviewModal.classList.remove('hidden');
  }

  // =========================================================================
  // User Dashboard Engine
  // =========================================================================
  function openDashboard() {
    if (!currentUser) return;
    
    dashName.textContent = currentUser.name;
    dashEmail.textContent = currentUser.email;
    dashAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    
    profName.textContent = currentUser.name;
    profEmail.textContent = currentUser.email;

    renderOrderHistory();
    dashboardModal.classList.remove('hidden');
    userDropdown.classList.add('hidden'); // close dropdown
  }

  function renderOrderHistory() {
    const orders = JSON.parse(localStorage.getItem('ecart_orders_' + currentUser.email) || '[]');
    
    if (orders.length === 0) {
      ordersList.innerHTML = '<div class="empty-orders" style="padding: 2rem; text-align: center; color: var(--text-muted);">No past orders found.</div>';
      return;
    }

    ordersList.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <span class="order-id">#${order.id}</span>
            <span class="order-date">${order.date}</span>
          </div>
          <div class="order-total">${formatINR(order.total)}</div>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item-line">
              <span>${item.qty}x ${item.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 11. Event Listeners & Modals Control
  // =========================================================================
  function setupEventListeners() {
    // Cart Drawer Toggles
    cartToggleBtn.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
    });

    closeCartBtn.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });

    cartOverlay.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });

    // Auth Trigger & User Dropdown
    authTriggerBtn.addEventListener('click', () => {
      if (currentUser) {
        userDropdown.classList.toggle('hidden');
      } else {
        authModal.classList.remove('hidden');
      }
    });

    closeAuthModal.addEventListener('click', () => {
      authModal.classList.add('hidden');
    });

    logoutBtn.addEventListener('click', handleLogout);

    // Auth Modal Tabs (Sign In / Register)
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
    });

    // Auth Form Submits
    formLogin.addEventListener('submit', handleLogin);
    formRegister.addEventListener('submit', handleRegister);

    // Sale Modal Coupon Claim
    closeSaleModal.addEventListener('click', () => {
      saleModal.classList.add('hidden');
    });

    claimCouponBtn.addEventListener('click', () => {
      activeDiscountPercent = 0.20;
      updateCartUI();
      saleModal.classList.add('hidden');
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      showToast('🎉 Flat 20% ECART20 Coupon Applied!', 'success');
    });

    removeCouponBtn.addEventListener('click', () => {
      activeDiscountPercent = 0;
      updateCartUI();
      showToast('Coupon code removed', 'info');
    });

    // Modals Close Handlers
    if(closeWishlist) closeWishlist.addEventListener('click', () => wishlistModal.classList.add('hidden'));
    if(closeQuickview) closeQuickview.addEventListener('click', () => quickviewModal.classList.add('hidden'));
    
    // Toggle Wishlist Modal
    if(wishlistToggleBtn) wishlistToggleBtn.addEventListener('click', () => {
      renderWishlistModal();
      wishlistModal.classList.remove('hidden');
    });

    // Product Grid Event Delegation
    productGrid.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-action="add"]');
      const wishlistBtn = e.target.closest('[data-action="wishlist"]');
      const quickviewBtn = e.target.closest('[data-action="quickview"]');
      const compareBtn = e.target.closest('[data-action="compare"]');
      
      if (addBtn) {
        const productId = parseInt(addBtn.getAttribute('data-id'), 10);
        addToCart(productId);
      } else if (wishlistBtn) {
        const productId = parseInt(wishlistBtn.getAttribute('data-id'), 10);
        toggleWishlist(productId);
      } else if (quickviewBtn) {
        const productId = parseInt(quickviewBtn.getAttribute('data-id'), 10);
        openQuickView(productId);
      } else if (compareBtn) {
        const productId = parseInt(compareBtn.getAttribute('data-id'), 10);
        toggleCompare(productId);
      }
    });

    // Wishlist Modal Event Delegation
    if (wishlistItemsContainer) {
      wishlistItemsContainer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-action="add"]');
        const wishlistBtn = e.target.closest('[data-action="wishlist"]');
        
        if (addBtn) {
          const productId = parseInt(addBtn.getAttribute('data-id'), 10);
          addToCart(productId);
        } else if (wishlistBtn) {
          const productId = parseInt(wishlistBtn.getAttribute('data-id'), 10);
          toggleWishlist(productId);
        }
      });
    }

    // Cart Items List Event Delegation
    cartItemsList.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-action]');
      if (!targetBtn) return;

      const action = targetBtn.getAttribute('data-action');
      const productId = parseInt(targetBtn.getAttribute('data-id'), 10);

      if (action === 'increment') {
        updateQuantity(productId, 1);
      } else if (action === 'decrement') {
        updateQuantity(productId, -1);
      } else if (action === 'delete') {
        removeFromCart(productId);
      }
    });

    clearCartBtn.addEventListener('click', clearCart);
    checkoutBtn.addEventListener('click', openCheckoutModal);
    
    // Checkout Flow listeners
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.add('hidden'));
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => checkoutModal.classList.add('hidden'));
    
    if (shipForm) shipForm.addEventListener('submit', (e) => { e.preventDefault(); goToCheckoutStep(2); });
    if (backTo1) backTo1.addEventListener('click', () => goToCheckoutStep(1));
    if (goTo3) goTo3.addEventListener('click', () => goToCheckoutStep(3));
    if (backTo2) backTo2.addEventListener('click', () => goToCheckoutStep(2));
    if (placeOrderBtn) placeOrderBtn.addEventListener('click', finalizeOrder);

    // Dashboard Listeners
    if (dashboardBtn) dashboardBtn.addEventListener('click', openDashboard);
    if (closeDashboardBtn) closeDashboardBtn.addEventListener('click', () => dashboardModal.classList.add('hidden'));
    
    dashNavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        dashNavBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const tabId = e.target.getAttribute('data-tab');
        dashTabs.forEach(t => t.classList.add('hidden'));
        document.getElementById('dash-tab-' + tabId).classList.remove('hidden');
      });
    });

    // Search & Category Filters
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });

    categoryFilters.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      activeCategory = chip.getAttribute('data-category');
      
      // Clear active search query when switching category chips
      searchQuery = '';
      if (searchInput) searchInput.value = '';

      renderProducts();
    });

    resetFiltersBtn.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      activeCategory = 'all';
      currentSort = 'featured';
      if(sortSelect) sortSelect.value = 'featured';
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      document.querySelector('.filter-chip[data-category="all"]').classList.add('active');
      renderProducts();
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
      });
    }
  }

  // =========================================================================
  // 12. Checkout Flow Engine
  // =========================================================================
  let currentOrderTotal = 0;
  let currentOrderItems = [];

  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast('Your cart is empty! Add items before checkout.', 'error');
      return;
    }
    
    if (!currentUser) {
      showToast('Please sign in to proceed with checkout.', 'info');
      authModal.classList.remove('hidden');
      return;
    }

    // Pre-fill user data
    document.getElementById('ship-name').value = currentUser.name;

    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    
    // Reset modal to step 1
    goToCheckoutStep(1);
    checkoutModal.classList.remove('hidden');
  }

  function goToCheckoutStep(stepNumber) {
    [step1, step2, step3, step4].forEach(s => {
      if(s) s.classList.add('hidden');
    });
    
    if(progressSteps) {
      progressSteps.forEach(p => {
        if (parseInt(p.getAttribute('data-step')) <= stepNumber) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    }

    if (stepNumber === 1) step1.classList.remove('hidden');
    else if (stepNumber === 2) step2.classList.remove('hidden');
    else if (stepNumber === 3) {
      step3.classList.remove('hidden');
      renderOrderReview();
    }
    else if (stepNumber === 4) step4.classList.remove('hidden');
  }

  function renderOrderReview() {
    const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = rawSubtotal * activeDiscountPercent;
    const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
    const gstTax = discountedSubtotal * 0.10;
    currentOrderTotal = discountedSubtotal + gstTax;
    currentOrderItems = [...cart];
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const address = `${document.getElementById('ship-address').value}, ${document.getElementById('ship-city').value} - ${document.getElementById('ship-pin').value}`;
    const payment = document.querySelector('input[name="payment"]:checked').value.toUpperCase();

    if(checkoutOrderSummary) {
      checkoutOrderSummary.innerHTML = `
        <div class="summary-line"><span>Shipping To:</span> <strong>${address}</strong></div>
        <div class="summary-line"><span>Payment:</span> <strong>${payment}</strong></div>
        <div style="margin: 1rem 0; border-top: 1px dashed rgba(255,255,255,0.1);"></div>
        <div class="summary-line"><span>Total Items:</span> <strong>${itemCount}</strong></div>
        <div class="summary-line"><span>Subtotal:</span> <strong>${formatINR(rawSubtotal)}</strong></div>
        ${activeDiscountPercent > 0 ? `<div class="summary-line" style="color: var(--accent-secondary);"><span>Discount:</span> <strong>-${formatINR(discountAmount)}</strong></div>` : ''}
        <div class="summary-line"><span>GST (10%):</span> <strong>${formatINR(gstTax)}</strong></div>
        <div class="summary-line" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
          <span>Grand Total:</span> <strong style="color: var(--accent-secondary); font-size: 1.05rem;">${formatINR(currentOrderTotal)}</strong>
        </div>
      `;
    }
  }

  function finalizeOrder() {
    const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
    if (successOrderId) successOrderId.textContent = '#' + orderId;
    
    // Save to order history
    const orders = JSON.parse(localStorage.getItem('ecart_orders_' + currentUser.email) || '[]');
    orders.unshift({
      id: orderId,
      date: new Date().toLocaleDateString('en-IN'),
      total: currentOrderTotal,
      items: currentOrderItems.map(i => ({ name: i.product.name, qty: i.quantity }))
    });
    localStorage.setItem('ecart_orders_' + currentUser.email, JSON.stringify(orders));

    cart = [];
    activeDiscountPercent = 0;
    updateCartUI();
    goToCheckoutStep(4);
    if (window.confetti) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }

  function triggerBadgeBounce() {
    cartBadge.classList.remove('bounce');
    void cartBadge.offsetWidth;
    cartBadge.classList.add('bounce');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Theme Toggle Logic
    function initTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    if (!themeBtn) return;
    
    const savedTheme = localStorage.getItem('ecart_theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      moonIcon.style.display = 'none'; // Moon icon represents "switch to dark mode"
      sunIcon.style.display = 'block'; // Sun icon represents "switch to light mode"
    } else {
      document.documentElement.removeAttribute('data-theme');
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    }

    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('ecart_theme', 'light');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('ecart_theme', 'dark');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
      }
    });
  }

  // Newsletter Logic
  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    const successMsg = document.getElementById('newsletter-success');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      successMsg.classList.remove('hidden');
      if (window.confetti) {
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.8 } });
      }
    });
  }

  // =========================================================================
  // Pro Features Logic
  // =========================================================================
  
  function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('hero-slider-dots');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    if (!slides.length) return;

    let currentIndex = 0;
    
    dotsContainer.innerHTML = Array.from(slides).map((_, i) => `<div class="slider-indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('');
    const dots = dotsContainer.querySelectorAll('.slider-indicator');

    function goToSlide(index) {
      slides[currentIndex].classList.remove('active');
      dots[currentIndex].classList.remove('active');
      currentIndex = (index + slides.length) % slides.length;
      slides[currentIndex].classList.add('active');
      dots[currentIndex].classList.add('active');
    }

    if (prevBtn) prevBtn.onclick = () => goToSlide(currentIndex - 1);
    if (nextBtn) nextBtn.onclick = () => goToSlide(currentIndex + 1);

    dots.forEach(dot => {
      dot.onclick = () => goToSlide(parseInt(dot.getAttribute('data-index')));
    });

    setInterval(() => goToSlide(currentIndex + 1), 6000);
  }

  function initAdvancedFilters() {
    const filterBtn = document.getElementById('advanced-filter-btn');
    const filterDrawer = document.getElementById('filter-drawer');
    const closeFilter = document.getElementById('close-filter-btn');
    const applyBtn = document.getElementById('apply-filters-btn');
    const clearBtn = document.getElementById('clear-advanced-filters-btn');

    if (filterBtn && filterDrawer) {
      filterBtn.onclick = () => filterDrawer.classList.add('open');
      if(closeFilter) closeFilter.onclick = () => filterDrawer.classList.remove('open');
      
      if(applyBtn) applyBtn.onclick = () => {
        const minP = document.getElementById('min-price').value;
        const maxP = document.getElementById('max-price').value;
        const ratingInput = document.querySelector('input[name="rating-filter"]:checked');
        const rating = ratingInput ? ratingInput.value : 0;
        
        minPriceFilter = minP ? parseFloat(minP) : null;
        maxPriceFilter = maxP ? parseFloat(maxP) : null;
        minRatingFilter = parseFloat(rating);
        currentPage = 1;
        renderProducts();
        filterDrawer.classList.remove('open');
      };

      if(clearBtn) clearBtn.onclick = () => {
        document.getElementById('min-price').value = '';
        document.getElementById('max-price').value = '';
        document.querySelector('input[name="rating-filter"][value="0"]').checked = true;
        minPriceFilter = null;
        maxPriceFilter = null;
        minRatingFilter = 0;
        currentPage = 1;
        renderProducts();
        filterDrawer.classList.remove('open');
      };
    }
  }

  function trackRecentlyViewed(productId) {
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    recentlyViewed.unshift(productId);
    if (recentlyViewed.length > 5) recentlyViewed.pop();
    localStorage.setItem('ecart_recent', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  }

  function renderRecentlyViewed() {
    const sec = document.getElementById('recently-viewed-section');
    const grid = document.getElementById('recently-viewed-grid');
    if (!sec || !grid) return;

    if (recentlyViewed.length === 0) {
      sec.style.display = 'none';
      return;
    }

    sec.style.display = 'block';
    const recentProducts = recentlyViewed.map(id => window.PRODUCTS.find(p => p.id === id)).filter(Boolean);
    
    grid.innerHTML = recentProducts.map(product => `
      <div class="product-card recent-item-card" data-id="${product.id}" style="padding: 1rem; cursor: pointer;">
        <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 8px; margin-bottom: 0.5rem;" loading="lazy">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h4>
        <div style="font-weight: 600; color: var(--accent-secondary);">${formatINR(product.price)}</div>
      </div>
    `).join('');
  }

  function toggleCompare(productId) {
    if (compareList.includes(productId)) {
      compareList = compareList.filter(id => id !== productId);
      showToast('Removed from comparison', 'info');
    } else {
      if (compareList.length >= 4) {
        showToast('You can compare up to 4 items max', 'warning');
        return;
      }
      compareList.push(productId);
      showToast('Added to comparison', 'success');
    }
    renderProducts();
    renderCompareBar();
  }

  function renderCompareBar() {
    const bar = document.getElementById('compare-bar');
    const count = document.getElementById('compare-count');
    const items = document.getElementById('compare-items');
    if(!bar) return;
    
    if (compareList.length === 0) {
      bar.classList.remove('show');
      return;
    }
    
    bar.classList.add('show');
    count.textContent = compareList.length;
    
    items.innerHTML = compareList.map(id => {
      const p = window.PRODUCTS.find(x => x.id === id);
      return `<div class="compare-item-chip">${p.name.substring(0,12)}... <span class="remove-compare" data-id="${id}">&times;</span></div>`;
    }).join('');

    items.querySelectorAll('.remove-compare').forEach(btn => {
      btn.onclick = (e) => toggleCompare(parseInt(e.target.getAttribute('data-id')));
    });
  }

  function renderCompareModal() {
    const table = document.getElementById('compare-table');
    const productsToCompare = compareList.map(id => window.PRODUCTS.find(p => p.id === id)).filter(Boolean);
    
    if (productsToCompare.length === 0) return;

    let thead = '<tr><th>Feature</th>' + productsToCompare.map(p => `<th>
      <img src="${p.image}" alt="${p.name}" style="height: 100px; width: 100px; object-fit: contain; margin-bottom: 8px;"><br>
      <strong>${p.name}</strong><br>
      <span style="color: var(--accent-secondary); font-size: 1.1rem;">${formatINR(p.price)}</span><br>
      <button class="primary-btn compare-modal-add-cart-btn" data-id="${p.id}" style="padding: 6px 12px; margin-top: 8px;">Add to Cart</button>
    </th>`).join('') + '</tr>';
    
    let rows = '';
    const features = [
      { key: 'rating', label: 'Rating' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' }
    ];

    features.forEach(f => {
      rows += `<tr><td><strong>${f.label}</strong></td>` + productsToCompare.map(p => `<td>${
        f.key === 'rating' ? '★'.repeat(Math.floor(p.rating)) + ' (' + p.reviews + ')' : p[f.key]
      }</td>`).join('') + `</tr>`;
    });

    table.innerHTML = thead + rows;
  }

  function initMegaMenu() {
    document.querySelectorAll('.mega-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = e.target.getAttribute('data-cat');
        const btn = document.querySelector(`.filter-chip[data-category="${cat}"]`);
        if (btn) btn.click();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      initTheme();
      initNewsletter();
      initHeroSlider();
      initAdvancedFilters();
      renderRecentlyViewed();
      initMegaMenu();
      
      const compareBtn = document.getElementById('compare-btn');
      const compareModal = document.getElementById('compare-modal');
      const closeCompare = document.getElementById('close-compare-modal');
      const clearCompare = document.getElementById('clear-compare-btn');
      if (compareBtn) compareBtn.onclick = () => { renderCompareModal(); compareModal.classList.remove('hidden'); };
      if (closeCompare) closeCompare.onclick = () => compareModal.classList.add('hidden');
      if (clearCompare) clearCompare.onclick = () => { compareList = []; renderProducts(); renderCompareBar(); };

      const recentGrid = document.getElementById('recently-viewed-grid');
      if (recentGrid) {
        recentGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.recent-item-card');
          if (card) {
            const productId = parseInt(card.getAttribute('data-id'), 10);
            openQuickView(productId);
          }
        });
      }
      
      const compareTable = document.getElementById('compare-table');
      if (compareTable) {
        compareTable.addEventListener('click', (e) => {
          const btn = e.target.closest('.compare-modal-add-cart-btn');
          if (btn) {
            const productId = parseInt(btn.getAttribute('data-id'), 10);
            addToCart(productId);
            const closeBtn = document.getElementById('close-compare-modal');
            if (closeBtn) closeBtn.click();
          }
        });
      }
    });
  } else {
    init();
    initTheme();
    initNewsletter();
    initHeroSlider();
    initAdvancedFilters();
    renderRecentlyViewed();
    initMegaMenu();
    
    const compareBtn = document.getElementById('compare-btn');
    const compareModal = document.getElementById('compare-modal');
    const closeCompare = document.getElementById('close-compare-modal');
    const clearCompare = document.getElementById('clear-compare-btn');
    if (compareBtn) compareBtn.onclick = () => { renderCompareModal(); compareModal.classList.remove('hidden'); };
    if (closeCompare) closeCompare.onclick = () => compareModal.classList.add('hidden');
    if (clearCompare) clearCompare.onclick = () => { compareList = []; renderProducts(); renderCompareBar(); };

    const recentGrid = document.getElementById('recently-viewed-grid');
    if (recentGrid) {
      recentGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.recent-item-card');
        if (card) {
          const productId = parseInt(card.getAttribute('data-id'), 10);
          openQuickView(productId);
        }
      });
    }
    
    const compareTable = document.getElementById('compare-table');
    if (compareTable) {
      compareTable.addEventListener('click', (e) => {
        const btn = e.target.closest('.compare-modal-add-cart-btn');
        if (btn) {
          const productId = parseInt(btn.getAttribute('data-id'), 10);
          addToCart(productId);
          const closeBtn = document.getElementById('close-compare-modal');
          if (closeBtn) closeBtn.click();
        }
      });
    }
  }
})();
