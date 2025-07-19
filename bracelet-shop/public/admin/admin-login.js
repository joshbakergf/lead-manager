// Simple authentication (for demo purposes)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'bracelet123'
};

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Store login session
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', Date.now().toString());
        
        // Redirect to dashboard
        window.location.href = './dashboard.html';
    } else {
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true') {
    const loginTime = parseInt(localStorage.getItem('adminLoginTime'));
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (currentTime - loginTime < sessionDuration) {
        window.location.href = './dashboard.html';
    } else {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
    }
}