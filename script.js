// ====================
// CONFIGURATION
// ====================

// Use localStorage as primary, MySQL as optional
const USE_MYSQL = true; // Set to false to use only localStorage
const API_BASE_URL = 'http://localhost/ecommerce/backend/api';

// Cart - start with localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ====================
// HELPER FUNCTIONS
// ====================

// Show notification
function showNotification(message, type = 'success') {
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get user ID
function getUserId() {
    return localStorage.getItem('user_id') || 'guest';
}

// ====================
// API FUNCTIONS (MySQL)
// ====================

async function apiCall(endpoint, method = 'GET', data = null) {
    if (!USE_MYSQL) {
        return { success: false, message: 'MySQL disabled' };
    }
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.log(`API ${endpoint} failed, using localStorage fallback`);
        return { success: false, message: 'API offline, using local storage' };
    }
}

// Login with API
async function loginUser(email, password) {
    if (!USE_MYSQL) {
        // Demo login for localStorage mode
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', 'demo_user');
        localStorage.setItem('user_name', 'Demo User');
        updateAuthUI();
        return { success: true, message: 'Demo login successful' };
    }
    
    const result = await apiCall('login.php', 'POST', { email, password });
    
    if (result.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', result.user_id);
        localStorage.setItem('user_name', result.user_name);
        updateAuthUI();
    }
    
    return result;
}

// Register with API
async function registerUser(name, email, password) {
    if (!USE_MYSQL) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', 'new_user_' + Date.now());
        localStorage.setItem('user_name', name);
        updateAuthUI();
        return { success: true, message: 'Demo registration successful' };
    }
    
    const result = await apiCall('register.php', 'POST', { name, email, password });
    
    if (result.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', result.user_id);
        localStorage.setItem('user_name', result.user_name);
        updateAuthUI();
    }
    
    return result;
}

// Logout
function logoutUser() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    updateAuthUI();
    showNotification('Logged out successfully');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// Sync cart to MySQL when logged in
async function syncCartToServer() {
    if (!isLoggedIn() || !USE_MYSQL || cart.length === 0) return;
    
    const user_id = getUserId();
    if (user_id === 'guest') return;
    
    try {
        // Send cart to server
        for (const item of cart) {
            await apiCall('cart.php', 'POST', {
                product_id: item.id,
                quantity: item.quantity
            });
        }
        console.log('Cart synced to server');
    } catch (error) {
        console.log('Cart sync failed:', error);
    }
}

// Load cart from MySQL when logged in
async function loadCartFromServer() {
    if (!isLoggedIn() || !USE_MYSQL) return cart;
    
    try {
        const result = await apiCall('cart.php', 'GET');
        if (result.success && result.data) {
            // Convert server cart format to local format
            const serverCart = result.data.map(item => ({
                id: item.product_id || item.id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity
            }));
            
            // Merge with local cart (server takes priority)
            if (serverCart.length > 0) {
                cart = serverCart;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
            }
        }
    } catch (error) {
        console.log('Failed to load cart from server:', error);
    }
    
    return cart;
}

// ====================
// CART FUNCTIONS (LocalStorage + MySQL)
// ====================

// Update cart count display
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Add to cart (local + optional MySQL)
async function addToCart(productId, productName, productPrice) {
    // Check if already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(productPrice),
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    
    // Try to sync with MySQL if enabled
    if (USE_MYSQL && isLoggedIn()) {
        const result = await apiCall('cart.php', 'POST', {
            product_id: productId,
            quantity: existingItem ? existingItem.quantity : 1
        });
        
        if (!result.success) {
            console.log('Server sync failed, keeping local cart');
        }
    }
    
    // Show notification
    showNotification(`${productName} added to cart!`);
}

// Remove from cart
async function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Remove from server if logged in
    if (USE_MYSQL && isLoggedIn()) {
        await apiCall('cart.php', 'DELETE', { product_id: productId });
    }
    
    // Reload cart page if we're on it
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
    }
}

// Update quantity
async function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        // Update on server
        if (USE_MYSQL && isLoggedIn()) {
            await apiCall('cart.php', 'PUT', {
                product_id: productId,
                quantity: newQuantity
            });
        }
        
        if (window.location.pathname.includes('cart.html')) {
            loadCartPage();
        }
    }
}

// Calculate cart total
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ====================
// CART PAGE FUNCTIONS
// ====================

function loadCartPage() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to your cart!</p>
                <a href="products.html" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        
        if (cartTotalElement) cartTotalElement.textContent = '0.00';
        if (subtotalElement) subtotalElement.textContent = '0.00';
        if (taxElement) taxElement.textContent = '0.00';
        return;
    }
    
    // Build cart items HTML
    let cartHTML = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="cart-item-total">
                    $${itemTotal.toFixed(2)}
                </div>
                
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    
    // Calculate totals
    const subtotal = calculateCartTotal();
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    if (cartTotalElement) cartTotalElement.textContent = total.toFixed(2);
    if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
    if (taxElement) taxElement.textContent = tax.toFixed(2);
}

// Checkout function
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const total = calculateCartTotal();
    const tax = total * 0.08;
    const finalTotal = total + tax;
    
    const confirmation = confirm(
        `PROCEED TO CHECKOUT?\n\n` +
        `Items: ${cart.length}\n` +
        `Subtotal: $${total.toFixed(2)}\n` +
        `Tax (8%): $${tax.toFixed(2)}\n` +
        `Total: $${finalTotal.toFixed(2)}\n\n` +
        `Click OK to confirm order.`
    );
    
    if (confirmation) {
        if (USE_MYSQL && isLoggedIn()) {
            // Process with MySQL backend
            const shippingAddress = prompt('Enter shipping address:', '123 Main St, City, Country');
            if (!shippingAddress) {
                alert('Shipping address is required!');
                return;
            }
            
            try {
                const result = await apiCall('checkout.php', 'POST', {
                    shipping_address: shippingAddress,
                    payment_method: 'COD'
                });
                
                if (result.success) {
                    showNotification(`Order #${result.order_number} placed successfully!`, 'success');
                    cart = [];
                    localStorage.removeItem('cart');
                    updateCartCount();
                    loadCartPage();
                } else {
                    alert('Checkout failed: ' + result.message);
                }
            } catch (error) {
                alert('Checkout error. Using local checkout...');
                processLocalCheckout();
            }
        } else {
            // Local checkout
            processLocalCheckout();
        }
    }
}

function processLocalCheckout() {
    const total = calculateCartTotal();
    const orderNumber = 'LOCAL-' + Date.now();
    
    alert(
        `ORDER PLACED SUCCESSFULLY!\n\n` +
        `Order #: ${orderNumber}\n` +
        `Total Items: ${cart.length}\n` +
        `Total Amount: $${total.toFixed(2)}\n\n` +
        `Thank you for shopping with us!\n` +
        `(This is a demo - no real transaction occurred)`
    );
    
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    loadCartPage();
}

// ====================
// AUTH UI FUNCTIONS
// ====================

function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('user_name');
    
    // Update all login buttons
    document.querySelectorAll('.login-btn, .auth-btn').forEach(btn => {
        if (btn.textContent.includes('Login') || btn.textContent.includes('Sign In')) {
            if (isLoggedIn) {
                btn.innerHTML = `<i class="fas fa-user"></i> ${userName || 'Account'}`;
                btn.onclick = () => {
                    if (confirm('Are you sure you want to logout?')) {
                        logoutUser();
                    }
                };
            } else {
                btn.innerHTML = '<i class="fas fa-user"></i> Login';
                btn.href = 'login.html';
                btn.onclick = null;
            }
        }
    });
    
    // Update navigation
    const navLoginLinks = document.querySelectorAll('nav a[href="login.html"]');
    navLoginLinks.forEach(link => {
        if (isLoggedIn) {
            link.innerHTML = `<i class="fas fa-user"></i> ${userName || 'Account'}`;
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                if (confirm('Logout?')) logoutUser();
            };
        } else {
            link.innerHTML = '<i class="fas fa-user"></i> Login';
            link.href = 'login.html';
            link.onclick = null;
        }
    });
}

// ====================
// PRODUCT FUNCTIONS
// ====================

async function loadProducts(category = null, search = '') {
    const container = document.getElementById('products-container') || 
                     document.getElementById('featured-products');
    if (!container) return;
    
    // Show loading
    container.innerHTML = '<div class="loading">Loading products...</div>';
    
    if (USE_MYSQL) {
        try {
            let url = 'products.php';
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (search) params.append('search', search);
            
            if (params.toString()) url += '?' + params.toString();
            
            const result = await apiCall(url);
            
            if (result.success && result.data) {
                displayProducts(result.data, container);
                return;
            }
        } catch (error) {
            console.log('Failed to load from server, using demo data');
        }
    }
    
    // Fallback to demo products
    const demoProducts = getDemoProducts(category);
    displayProducts(demoProducts, container);
}

function getDemoProducts(category = null) {
    const allProducts = [
        { id: 1, name: "Wireless Headphones", price: 49.99, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop", description: "Premium noise-cancelling headphones" },
        { id: 2, name: "Smart Watch", price: 89.99, category: "Electronics", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop", description: "Fitness tracker with heart rate monitor" },
        { id: 3, name: "Laptop Backpack", price: 29.99, category: "Fashion", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop", description: "Waterproof backpack with USB port" },
        { id: 4, name: "Bluetooth Speaker", price: 39.99, category: "Electronics", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&h=200&fit=crop", description: "Portable speaker with 10-hour battery" },
        { id: 5, name: "Running Shoes", price: 59.99, category: "Sports", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop", description: "Comfortable running shoes" },
        { id: 6, name: "Coffee Maker", price: 79.99, category: "Home", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop", description: "Automatic coffee machine" }
    ];
    
    if (category) {
        return allProducts.filter(p => p.category === category);
    }
    
    return allProducts;
}

function displayProducts(products, container) {
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">$${product.price}</div>
                <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// ====================
// MOBILE MENU
// ====================

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// ====================
// INITIALIZATION
// ====================

async function initializeApp() {
    // Setup mobile menu
    setupMobileMenu();
    
    // Update cart count
    updateCartCount();
    
    // Update auth UI
    updateAuthUI();
    
    // Load cart from server if logged in
    if (USE_MYSQL && isLoggedIn()) {
        await loadCartFromServer();
    }
    
    // Load cart page if on cart page
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
    }
    
    // Load products if on products page
    if (window.location.pathname.includes('products.html') || 
        window.location.pathname.includes('index.html')) {
        loadProducts();
    }
    
    // Setup search if available
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadProducts(null, e.target.value);
        });
    }
    
    // Setup category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            loadProducts(e.target.value || null);
        });
    }
}

// ====================
// GLOBAL EXPORTS
// ====================

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.loadCartPage = loadCartPage;
window.checkout = checkout;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.loadProducts = loadProducts;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);

// ====================
// BUY NOW FUNCTIONALITY
// ====================

async function buyNow(productId, productName, productPrice) {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        const loginFirst = confirm("Please login to continue with Buy Now.\n\nClick OK to login, Cancel to continue as guest.");
        if (loginFirst) {
            window.location.href = "login.html";
            return;
        }
    }
    
    // Create a temporary cart with just this product
    const tempCart = [{
        id: productId,
        name: productName,
        price: parseFloat(productPrice),
        quantity: 1
    }];
    
    // Calculate totals
    const subtotal = productPrice;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    // Show quick checkout modal
    showQuickCheckoutModal(productId, productName, productPrice, subtotal, tax, total);
}

function showQuickCheckoutModal(productId, productName, productPrice, subtotal, tax, total) {
    // Create modal HTML
    const modalHTML = `
        <div class="quick-checkout-modal" id="quickCheckoutModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; justify-content: center; align-items: center;">
            <div class="quick-checkout-content" style="background: white; padding: 2rem; border-radius: 10px; width: 90%; max-width: 500px; position: relative;">
                <button onclick="closeQuickCheckout()" style="position: absolute; right: 20px; top: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                
                <h2 style="color: #2d3436; margin-bottom: 1.5rem;">
                    <i class="fas fa-bolt" style="color: #ff9800;"></i> Quick Checkout
                </h2>
                
                <div class="order-summary" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: #2d3436;">Order Summary</h3>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Product:</span>
                        <span><strong>${productName}</strong></span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Price:</span>
                        <span>$${productPrice.toFixed(2)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Tax (8%):</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                    
                    <hr style="margin: 1rem 0;">
                    
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                        <span>Total:</span>
                        <span style="color: #e74c3c;">$${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="shipping-form" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: #2d3436;">Shipping Details</h3>
                    
                    <input type="text" id="quickName" placeholder="Full Name" required 
                           style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 5px;">
                    
                    <textarea id="quickAddress" placeholder="Shipping Address" required rows="3"
                              style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 5px;"></textarea>
                    
                    <input type="tel" id="quickPhone" placeholder="Phone Number" required 
                           style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 5px;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: #2d3436;">Payment Method</h3>
                    
                    <div style="display: flex; gap: 1rem;">
                        <label style="flex: 1; padding: 1rem; border: 2px solid #ddd; border-radius: 5px; cursor: pointer; text-align: center;">
                            <input type="radio" name="paymentMethod" value="cod" checked> 
                            <i class="fas fa-money-bill-wave"></i> COD
                        </label>
                        
                        <label style="flex: 1; padding: 1rem; border: 2px solid #ddd; border-radius: 5px; cursor: pointer; text-align: center;">
                            <input type="radio" name="paymentMethod" value="card">
                            <i class="fas fa-credit-card"></i> Card
                        </label>
                    </div>
                </div>
                
                <button onclick="processQuickCheckout(${productId})" 
                        style="width: 100%; padding: 1rem; background: #3498db; color: white; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer;">
                    <i class="fas fa-lock"></i> Place Order
                </button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeQuickCheckout() {
    const modal = document.getElementById('quickCheckoutModal');
    if (modal) {
        modal.remove();
    }
}

async function processQuickCheckout(productId) {
    // Get form values
    const name = document.getElementById('quickName').value;
    const address = document.getElementById('quickAddress').value;
    const phone = document.getElementById('quickPhone').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Validate
    if (!name || !address || !phone) {
        alert('Please fill all shipping details');
        return;
    }
    
    // Generate order number
    const orderNumber = 'ORD-' + Date.now();
    
    // Close modal
    closeQuickCheckout();
    
    // Show success
    alert(
        `✅ ORDER PLACED!\n\n` +
        `Order #: ${orderNumber}\n` +
        `Thank you for your purchase!\n\n` +
        `We'll deliver your order to:\n${address}\n\n` +
        `Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}`
    );
    
    // Also add to cart (optional)
    addToCart(productId, 
              document.querySelector(`[onclick*="${productId}"]`).getAttribute('data-name') || 'Product', 
              parseFloat(document.querySelector(`[onclick*="${productId}"]`).getAttribute('data-price') || 0));
}

// Make functions global
window.buyNow = buyNow;
window.closeQuickCheckout = closeQuickCheckout;
window.processQuickCheckout = processQuickCheckout;