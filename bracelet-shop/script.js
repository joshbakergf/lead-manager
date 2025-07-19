// Load products from admin or use defaults
let products = [];

// Default product data (fallback)
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

// Load products from localStorage (updated by admin) or use defaults
function loadProducts() {
    const adminProducts = localStorage.getItem('braceletProducts');
    products = adminProducts ? JSON.parse(adminProducts) : defaultProducts;
}

// Shopping cart
let cart = [];

// DOM elements
const productGrid = document.querySelector('.product-grid');
const cartModal = document.getElementById('cart-modal');
const cartCount = document.getElementById('cart-count');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const orderForm = document.getElementById('order-form');
const paymentModal = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');

// Stripe configuration
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE'); // Replace with your actual Stripe publishable key
const elements = stripe.elements();

// Create card element
const cardElement = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
    },
});

// Mount card element
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('card-element')) {
        cardElement.mount('#card-element');
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    displayProducts();
    updateCartDisplay();
});

// Display products
function displayProducts() {
    productGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Determine what to show for the product image
        let imageDisplay = '';
        if (product.image) {
            imageDisplay = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">`;
        } else if (product.emoji) {
            imageDisplay = `<div class="product-image">${product.emoji}</div>`;
        } else {
            imageDisplay = `<div class="product-image">💍</div>`;
        }
        
        productCard.innerHTML = `
            ${imageDisplay}
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">$${product.price.toFixed(2)}</div>
            ${product.stock && product.stock > 0 ? 
                `<button class="add-to-cart" onclick="addToCart(${product.id})">
                    Add to Cart 💖
                </button>
                <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">${product.stock} in stock</p>` :
                `<button class="add-to-cart" disabled style="background: #ccc; cursor: not-allowed;">
                    Out of Stock
                </button>`
            }
        `;
        productGrid.appendChild(productCard);
    });
}

// Add item to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    
    // Show a cute animation
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Added! ✨';
    button.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 1000);
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    displayCartItems();
}

// Update cart display
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = totalPrice.toFixed(2);
}

// Toggle cart modal
function toggleCart() {
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';
    } else {
        cartModal.style.display = 'block';
        displayCartItems();
    }
}

// Display cart items
function displayCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty 😊</p>';
        return;
    }
    
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                $${item.price.toFixed(2)} x ${item.quantity}
            </div>
            <div>
                <button onclick="removeFromCart(${item.id})" style="background: #e91e63; color: white; border: none; padding: 5px 10px; border-radius: 15px; cursor: pointer;">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty! 😊');
        return;
    }
    
    let orderDetails = 'Items in cart:\n';
    cart.forEach(item => {
        orderDetails += `• ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    orderDetails += `\nTotal: $${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}`;
    
    document.getElementById('order-details').value = orderDetails;
    toggleCart();
    
    // Scroll to contact form
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// Handle form submission
orderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const orderDetails = document.getElementById('order-details').value;
    
    // Save order to admin system
    saveOrderToAdmin(name, email, phone, cart);
    
    // Create mailto link
    const subject = `Bracelet Order from ${name}`;
    const body = `Hi! I'd like to place an order for bracelets.

Name: ${name}
Email: ${email}
Phone: ${phone}

Order Details:
${orderDetails}

Please let me know the total cost and how to pay. Thank you! 💖`;
    
    const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    alert('Thank you for your order! Your email client should open now. If it doesn\'t, please copy the order details and email them to [your-email@example.com] 💕');
    
    // Clear form and cart
    orderForm.reset();
    cart = [];
    updateCartDisplay();
});


// Payment functions
function proceedToPayment() {
    if (cart.length === 0) {
        alert('Your cart is empty! 😊');
        return;
    }
    
    // Hide cart modal and show payment modal
    cartModal.style.display = 'none';
    paymentModal.style.display = 'block';
    
    // Populate order summary
    displayOrderSummary();
}

function closePaymentModal() {
    paymentModal.style.display = 'none';
}

function displayOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let summaryHTML = '<h4>Order Summary</h4>';
    cart.forEach(item => {
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    summaryHTML += `
        <div class="order-total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
}

// Handle payment form submission
paymentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const buttonText = document.getElementById('payment-btn-text');
    const spinner = document.getElementById('payment-spinner');
    
    // Disable submit button and show spinner
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'inline';
    
    try {
        // Get customer details
        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;
        const customerPhone = document.getElementById('customer-phone').value;
        
        // Get address data
        const { billingAddress, shippingAddress } = getAddressData();
        
        // Calculate total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Create payment intent (this would normally be done on your server)
        // For demo purposes, we'll simulate the payment
        const {token, error} = await stripe.createToken(cardElement);
        
        if (error) {
            document.getElementById('card-errors').textContent = error.message;
            throw error;
        }
        
        // Simulate payment processing
        await simulatePaymentProcessing(token, customerName, customerEmail, customerPhone, total);
        
        // Payment successful
        alert('Payment successful! 🎉 You will receive a confirmation email shortly.');
        
        // Save order to admin system
        saveOrderToAdminWithAddresses(customerName, customerEmail, customerPhone, cart, 'paid', billingAddress, shippingAddress);
        
        // Send email notification
        await sendOrderNotificationWithAddresses(customerName, customerEmail, customerPhone, cart, total, billingAddress, shippingAddress);
        
        // Clear cart and close modal
        cart = [];
        updateCartDisplay();
        closePaymentModal();
        
    } catch (error) {
        console.error('Payment error:', error);
        document.getElementById('card-errors').textContent = 'Payment failed. Please try again.';
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});

// Simulate payment processing (replace with actual Stripe payment intent)
async function simulatePaymentProcessing(token, name, email, phone, amount) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Payment processed:', {
                token: token.id,
                amount: amount * 100, // Stripe expects cents
                customer: { name, email, phone }
            });
            resolve();
        }, 2000);
    });
}

// Send email notification with addresses
async function sendOrderNotificationWithAddresses(customerName, customerEmail, customerPhone, cartItems, total, billingAddress, shippingAddress) {
    try {
        // Prepare email content
        let orderDetails = 'New Order Received!\n\n';
        orderDetails += `Customer: ${customerName}\n`;
        orderDetails += `Email: ${customerEmail}\n`;
        orderDetails += `Phone: ${customerPhone}\n\n`;
        
        orderDetails += 'Billing Address:\n';
        orderDetails += `${billingAddress.street}\n`;
        orderDetails += `${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}\n`;
        orderDetails += `${billingAddress.country}\n\n`;
        
        orderDetails += 'Shipping Address:\n';
        orderDetails += `${shippingAddress.street}\n`;
        orderDetails += `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}\n`;
        orderDetails += `${shippingAddress.country}\n\n`;
        
        orderDetails += 'Items ordered:\n';
        cartItems.forEach(item => {
            orderDetails += `• ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        orderDetails += `\nTotal: $${total.toFixed(2)}\n`;
        orderDetails += `Payment Status: PAID\n`;
        orderDetails += `Order Date: ${new Date().toLocaleString()}\n`;
        
        // Create mailto link for notification
        const subject = `New Bracelet Order from ${customerName}`;
        const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(orderDetails)}`;
        
        // Open email client (this is a fallback - in production you'd use a proper email service)
        setTimeout(() => {
            window.open(mailtoLink, '_blank');
        }, 1000);
        
        // Store notification for admin dashboard
        const notifications = JSON.parse(localStorage.getItem('orderNotifications') || '[]');
        notifications.push({
            id: Date.now(),
            customerName,
            customerEmail,
            total,
            date: new Date().toISOString(),
            status: 'sent'
        });
        localStorage.setItem('orderNotifications', JSON.stringify(notifications));
        
    } catch (error) {
        console.error('Email notification error:', error);
    }
}

// Fallback for email orders without addresses (keep original function)
async function sendOrderNotification(customerName, customerEmail, customerPhone, cartItems, total) {
    return sendOrderNotificationWithAddresses(customerName, customerEmail, customerPhone, cartItems, total, 
        { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A', country: 'N/A' },
        { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A', country: 'N/A' }
    );
}

// Save order with addresses
function saveOrderToAdminWithAddresses(customerName, customerEmail, customerPhone, cartItems, paymentStatus = 'pending', billingAddress, shippingAddress) {
    const orders = JSON.parse(localStorage.getItem('braceletOrders') || '[]');
    
    const order = {
        id: Date.now(),
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        billingAddress: billingAddress,
        shippingAddress: shippingAddress,
        date: new Date().toISOString(),
        status: paymentStatus === 'paid' ? 'paid' : 'pending',
        paymentStatus: paymentStatus,
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    orders.push(order);
    localStorage.setItem('braceletOrders', JSON.stringify(orders));
}

// Update saveOrderToAdmin to handle payment status (fallback for email orders)
function saveOrderToAdmin(customerName, customerEmail, customerPhone, cartItems, paymentStatus = 'pending') {
    return saveOrderToAdminWithAddresses(customerName, customerEmail, customerPhone, cartItems, paymentStatus,
        { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A', country: 'N/A' },
        { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A', country: 'N/A' }
    );
}

// Shipping address toggle function
function toggleShippingAddress() {
    const sameAsBilling = document.getElementById('same-as-billing').checked;
    const shippingFields = document.getElementById('shipping-fields');
    const shippingInputs = shippingFields.querySelectorAll('input, select');
    
    if (sameAsBilling) {
        shippingFields.classList.add('hidden');
        // Remove required attribute when hidden
        shippingInputs.forEach(input => {
            input.removeAttribute('required');
        });
    } else {
        shippingFields.classList.remove('hidden');
        // Add required attribute when visible
        shippingInputs.forEach(input => {
            if (input.id !== 'shipping-country') {
                input.setAttribute('required', 'required');
            }
        });
    }
}

// Helper function to get address data
function getAddressData() {
    const sameAsBilling = document.getElementById('same-as-billing').checked;
    
    const billingAddress = {
        street: document.getElementById('billing-street').value,
        city: document.getElementById('billing-city').value,
        state: document.getElementById('billing-state').value,
        zip: document.getElementById('billing-zip').value,
        country: document.getElementById('billing-country').value
    };
    
    let shippingAddress;
    if (sameAsBilling) {
        shippingAddress = { ...billingAddress };
    } else {
        shippingAddress = {
            street: document.getElementById('shipping-street').value,
            city: document.getElementById('shipping-city').value,
            state: document.getElementById('shipping-state').value,
            zip: document.getElementById('shipping-zip').value,
            country: document.getElementById('shipping-country').value
        };
    }
    
    return { billingAddress, shippingAddress };
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
    if (event.target === paymentModal) {
        paymentModal.style.display = 'none';
    }
}

// Add some fun animations
document.addEventListener('DOMContentLoaded', function() {
    // Add sparkle effect to product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Make functions available globally for onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.proceedToPayment = proceedToPayment;
window.closePaymentModal = closePaymentModal;
window.toggleShippingAddress = toggleShippingAddress;