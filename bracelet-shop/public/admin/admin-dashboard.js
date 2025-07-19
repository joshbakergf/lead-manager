// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    loadProducts();
    loadOrders();
    updateStats();
});

// Authentication check
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = parseInt(localStorage.getItem('adminLoginTime'));
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (isLoggedIn !== 'true' || currentTime - loginTime > sessionDuration) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = './login.html';
        return;
    }
}

// Default products data
const defaultProducts = [
    {
        id: 1,
        name: "Rainbow Dream",
        description: "A beautiful bracelet with colorful rainbow beads that sparkle in the light",
        price: 15.00,
        emoji: "🌈",
        stock: 10
    },
    {
        id: 2,
        name: "Ocean Waves",
        description: "Cool blue and white beads that remind you of ocean waves",
        price: 12.00,
        emoji: "🌊",
        stock: 8
    },
    {
        id: 3,
        name: "Sunset Glow",
        description: "Warm orange, pink, and yellow beads like a beautiful sunset",
        price: 14.00,
        emoji: "🌅",
        stock: 12
    },
    {
        id: 4,
        name: "Forest Magic",
        description: "Green and brown earth tones with tiny flower charms",
        price: 16.00,
        emoji: "🌸",
        stock: 6
    },
    {
        id: 5,
        name: "Starry Night",
        description: "Dark blue and silver beads with star charms that twinkle",
        price: 18.00,
        emoji: "⭐",
        stock: 15
    },
    {
        id: 6,
        name: "Pretty in Pink",
        description: "Soft pink and rose gold beads perfect for any occasion",
        price: 13.00,
        emoji: "💖",
        stock: 20
    }
];

// Initialize data if not exists
function initializeDashboard() {
    if (!localStorage.getItem('braceletProducts')) {
        localStorage.setItem('braceletProducts', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('braceletOrders')) {
        localStorage.setItem('braceletOrders', JSON.stringify([]));
    }
    if (!localStorage.getItem('storeSettings')) {
        const defaultSettings = {
            storeName: 'Handmade Bracelets',
            storeEmail: 'your-email@example.com',
            currency: 'USD'
        };
        localStorage.setItem('storeSettings', JSON.stringify(defaultSettings));
    }
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        orders: 'Orders',
        analytics: 'Analytics',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[sectionName];
}

// Navigation event listeners
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        showSection(section);
    });
});

// Logout function
function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'login.html';
}

// Product Management
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-data">No products found. Add your first product! 💍</div>';
        return;
    }
    
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-admin-card';
        
        // Determine what to show for the product image
        let imageDisplay = '';
        if (product.image) {
            imageDisplay = `<img src="${product.image}" class="product-image-display" alt="${product.name}">`;
        } else if (product.emoji) {
            imageDisplay = `<div class="product-emoji">${product.emoji}</div>`;
        } else {
            imageDisplay = `<div class="product-emoji">📷</div>`;
        }
        
        productCard.innerHTML = `
            <div class="product-admin-header">
                <div class="product-admin-image">
                    ${imageDisplay}
                </div>
                <div class="product-admin-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <p><strong>Stock:</strong> ${product.stock} items</p>
                </div>
            </div>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

function showAddProductForm() {
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    clearImagePreview();
    document.getElementById('product-modal').style.display = 'block';
}

function editProduct(productId) {
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    const product = products.find(p => p.id === productId);
    
    if (product) {
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-emoji').value = product.emoji || '';
        document.getElementById('product-stock').value = product.stock;
        
        // Show current image if exists
        if (product.image) {
            showCurrentImage(product.image);
        } else {
            clearImagePreview();
        }
        
        document.getElementById('product-modal').style.display = 'block';
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        let products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
        const productToDelete = products.find(p => p.id === productId);
        
        // Delete image from blob storage if it exists
        if (productToDelete && productToDelete.image && !productToDelete.image.startsWith('data:')) {
            try {
                // Extract pathname from blob URL for deletion
                const url = new URL(productToDelete.image);
                const pathname = url.pathname;
                await blobService.deleteImage(pathname);
            } catch (error) {
                console.error('Failed to delete image from blob storage:', error);
            }
        }
        
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('braceletProducts', JSON.stringify(products));
        loadProducts();
        updateStats();
    }
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Product form submission
document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    const productId = document.getElementById('product-id').value;
    
    // Handle image upload
    const imageFile = document.getElementById('product-image').files[0];
    let imageData = null;
    
    // If editing and there's an existing image, preserve it unless new one is uploaded
    if (productId) {
        const existingProduct = products.find(p => p.id === parseInt(productId));
        imageData = existingProduct?.image || null;
    }
    
    // If new image is uploaded, upload to Vercel Blob
    if (imageFile) {
        try {
            imageData = await uploadImageToBlob(imageFile);
        } catch (error) {
            alert('Failed to upload image. Please try again.');
            throw error;
        }
    }
    
    // Check if image should be removed
    if (document.getElementById('product-form').getAttribute('data-remove-image') === 'true') {
        imageData = null;
        document.getElementById('product-form').removeAttribute('data-remove-image');
    }
    
    const productData = {
        id: productId ? parseInt(productId) : Date.now(),
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        emoji: document.getElementById('product-emoji').value,
        stock: parseInt(document.getElementById('product-stock').value),
        image: imageData
    };
    
    if (productId) {
        // Edit existing product
        const index = products.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            products[index] = productData;
        }
    } else {
        // Add new product
        products.push(productData);
    }
    
    localStorage.setItem('braceletProducts', JSON.stringify(products));
    loadProducts();
    updateStats();
    closeProductModal();
    
    // Update main site products
    updateMainSiteProducts();
});

// Order Management
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    const ordersList = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-data">No orders yet 📝</div>';
        return;
    }
    
    ordersList.innerHTML = '';
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const paymentStatusClass = order.paymentStatus === 'paid' ? 'status-completed' : 'status-pending';
        const paymentStatusText = order.paymentStatus === 'paid' ? 'PAID' : 'PENDING';
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
                <div class="order-status ${paymentStatusClass}">${paymentStatusText}</div>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Phone:</strong> ${order.customerPhone || 'Not provided'}</p>
                <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Payment:</strong> <span class="${paymentStatusClass}">${paymentStatusText}</span></p>
                ${order.billingAddress && order.billingAddress.street !== 'N/A' ? `
                    <div style="margin-top: 1rem;">
                        <strong>Billing Address:</strong><br>
                        ${order.billingAddress.street}<br>
                        ${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zip}<br>
                        ${order.billingAddress.country}
                    </div>
                ` : ''}
                ${order.shippingAddress && order.shippingAddress.street !== 'N/A' ? `
                    <div style="margin-top: 1rem;">
                        <strong>Shipping Address:</strong><br>
                        ${order.shippingAddress.street}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                        ${order.shippingAddress.country}
                    </div>
                ` : ''}
                <div style="margin-top: 1rem;">
                    <strong>Items:</strong>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        ${order.items.map(item => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
                    </ul>
                </div>
                <div style="margin-top: 1rem;">
                    ${order.paymentStatus !== 'paid' ? 
                        `<button onclick="markAsPaid(${order.id})" class="primary-btn" style="margin-right: 0.5rem;">Mark as Paid</button>` : 
                        ''
                    }
                    <button onclick="updateOrderStatus(${order.id}, 'completed')" class="secondary-btn" style="margin-right: 0.5rem;">Mark Completed</button>
                    <button onclick="updateOrderStatus(${order.id}, 'cancelled')" class="danger-btn">Cancel Order</button>
                </div>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('braceletOrders', JSON.stringify(orders));
        loadOrders();
        updateStats();
    }
}

function markAsPaid(orderId) {
    let orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].paymentStatus = 'paid';
        orders[orderIndex].status = 'paid';
        localStorage.setItem('braceletOrders', JSON.stringify(orders));
        loadOrders();
        updateStats();
    }
}

function filterOrders() {
    const filter = document.getElementById('order-filter').value;
    const orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    
    let filteredOrders = orders;
    if (filter !== 'all') {
        filteredOrders = orders.filter(order => order.status === filter);
    }
    
    // Update the display with filtered orders
    displayFilteredOrders(filteredOrders);
}

function displayFilteredOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-data">No orders found 📝</div>';
        return;
    }
    
    ordersList.innerHTML = '';
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Phone:</strong> ${order.customerPhone || 'Not provided'}</p>
                <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <div style="margin-top: 1rem;">
                    <strong>Items:</strong>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        ${order.items.map(item => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
                    </ul>
                </div>
                <div style="margin-top: 1rem;">
                    <button onclick="updateOrderStatus(${order.id}, 'completed')" class="secondary-btn" style="margin-right: 0.5rem;">Mark Completed</button>
                    <button onclick="updateOrderStatus(${order.id}, 'cancelled')" class="danger-btn">Cancel Order</button>
                </div>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

// Statistics
function updateStats() {
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    const orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    
    // Update product count
    document.getElementById('total-products').textContent = products.length;
    
    // Update order count
    document.getElementById('total-orders').textContent = orders.length;
    
    // Calculate total revenue (paid orders)
    const totalRevenue = orders
        .filter(order => order.paymentStatus === 'paid')
        .reduce((sum, order) => sum + order.total, 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    
    // Count pending orders
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    document.getElementById('pending-orders').textContent = pendingOrders;
    
    // Update recent orders
    const recentOrders = orders.slice(-5).reverse();
    const recentOrdersDiv = document.getElementById('recent-orders');
    
    if (recentOrders.length === 0) {
        recentOrdersDiv.innerHTML = '<p class="no-data">No orders yet 📝</p>';
    } else {
        recentOrdersDiv.innerHTML = recentOrders.map(order => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <strong>Order #${order.id}</strong> - ${order.customerName} - $${order.total.toFixed(2)}
                <span class="order-status status-${order.status}" style="margin-left: 1rem;">${order.status.toUpperCase()}</span>
            </div>
        `).join('');
    }
}

// Settings
document.getElementById('store-settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const settings = {
        storeName: document.getElementById('store-name').value,
        storeEmail: document.getElementById('store-email').value,
        currency: document.getElementById('currency').value
    };
    
    localStorage.setItem('storeSettings', JSON.stringify(settings));
    alert('Settings saved successfully! 💾');
});

// Data management functions
function exportAllData() {
    const data = {
        products: JSON.parse(localStorage.getItem('braceletProducts') || '[]'),
        orders: JSON.parse(localStorage.getItem('braceletOrders') || '[]'),
        settings: JSON.parse(localStorage.getItem('storeSettings') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `bracelet-shop-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.products) localStorage.setItem('braceletProducts', JSON.stringify(data.products));
                    if (data.orders) localStorage.setItem('braceletOrders', JSON.stringify(data.orders));
                    if (data.settings) localStorage.setItem('storeSettings', JSON.stringify(data.settings));
                    
                    alert('Data imported successfully! 📥');
                    location.reload();
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        localStorage.removeItem('braceletProducts');
        localStorage.removeItem('braceletOrders');
        localStorage.removeItem('storeSettings');
        alert('All data cleared! 🗑️');
        location.reload();
    }
}

// Update main site products (for integration)
function updateMainSiteProducts() {
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    localStorage.setItem('mainSiteProducts', JSON.stringify(products));
}

// Export data function
function exportData() {
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `products-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Add sample order function for testing
function addSampleOrder() {
    const orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    const products = JSON.parse(localStorage.getItem('braceletProducts') || '[]');
    
    const sampleOrder = {
        id: Date.now(),
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '555-123-4567',
        date: new Date().toISOString(),
        status: 'pending',
        items: [
            { ...products[0], quantity: 2 },
            { ...products[1], quantity: 1 }
        ],
        total: (products[0].price * 2) + products[1].price
    };
    
    orders.push(sampleOrder);
    localStorage.setItem('braceletOrders', JSON.stringify(orders));
    loadOrders();
    updateStats();
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
    const settings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
    if (settings.storeName) document.getElementById('store-name').value = settings.storeName;
    if (settings.storeEmail) document.getElementById('store-email').value = settings.storeEmail;
    if (settings.currency) document.getElementById('currency').value = settings.currency;
});

// Image handling functions
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('preview-img');
    const previewContainer = document.getElementById('image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Clear any existing current image display
            const currentImageDiv = document.querySelector('.current-image');
            if (currentImageDiv) {
                currentImageDiv.remove();
            }
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

function clearImagePreview() {
    const preview = document.getElementById('preview-img');
    const fileInput = document.getElementById('product-image');
    preview.style.display = 'none';
    preview.src = '';
    fileInput.value = '';
    
    // Remove current image display
    const currentImageDiv = document.querySelector('.current-image');
    if (currentImageDiv) {
        currentImageDiv.remove();
    }
}

function showCurrentImage(imageData) {
    clearImagePreview();
    
    const previewContainer = document.getElementById('image-preview');
    const currentImageDiv = document.createElement('div');
    currentImageDiv.className = 'current-image';
    currentImageDiv.innerHTML = `
        <p><strong>Current Image:</strong></p>
        <img src="${imageData}" alt="Current product image">
        <br>
        <button type="button" class="remove-image-btn" onclick="removeCurrentImage()">Remove Image</button>
        <p><small>Upload a new image to replace this one</small></p>
    `;
    previewContainer.appendChild(currentImageDiv);
}

function removeCurrentImage() {
    const currentImageDiv = document.querySelector('.current-image');
    if (currentImageDiv) {
        currentImageDiv.remove();
    }
    
    // Mark image for removal by setting a flag
    document.getElementById('product-form').setAttribute('data-remove-image', 'true');
}

// Updated to use Vercel Blob instead of base64
async function uploadImageToBlob(file) {
    try {
        const filename = file.name;
        const result = await blobService.uploadImage(file, filename);
        return result.url;
    } catch (error) {
        console.error('Blob upload failed, falling back to base64:', error);
        // Fallback to base64 if blob upload fails
        return convertImageToBase64(file);
    }
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Make functions available globally for onclick handlers
window.showSection = showSection;
window.logout = logout;
window.showAddProductForm = showAddProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeProductModal = closeProductModal;
window.updateOrderStatus = updateOrderStatus;
window.markAsPaid = markAsPaid;
window.filterOrders = filterOrders;
window.exportData = exportData;
window.exportAllData = exportAllData;
window.importData = importData;
window.clearAllData = clearAllData;
window.previewImage = previewImage;
window.removeCurrentImage = removeCurrentImage;

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}