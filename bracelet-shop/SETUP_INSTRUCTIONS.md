# Bracelet Shop Setup Instructions 💍

## 🚀 Quick Start
Your bracelet shop is ready to use! Here's what you need to configure:

## 📧 Email Configuration
1. **Update email addresses** in the following files:
   - `script.js` line 438: Replace `your-email@example.com` with your actual email
   - `index.html`: Replace `[Daughter's Name]` with your daughter's actual name

## 💳 Stripe Payment Setup
To accept real credit card payments:

1. **Create a Stripe Account**:
   - Go to [stripe.com](https://stripe.com) and sign up
   - Complete account verification

2. **Get API Keys**:
   - In Stripe Dashboard, go to "Developers" → "API keys"
   - Copy your "Publishable key" (starts with `pk_`)

3. **Update the Code**:
   - Open `script.js` 
   - Find line 76: `const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');`
   - Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key

4. **For Production**:
   - You'll need a server to handle payment processing securely
   - Consider using Stripe Checkout or Payment Links for easier setup
   - Current implementation is for demo/testing purposes

## 🎯 Features Included

### ✅ Customer Features:
- Browse beautiful product gallery
- Shopping cart functionality
- Two payment options:
  - Credit card payments via Stripe
  - Email orders for manual processing
- Mobile-responsive design
- Real product photos

### ✅ Admin Features:
- Secure admin login (`admin` / `bracelet123`)
- Product management (add, edit, delete)
- Photo upload capabilities
- Order tracking with payment status
- Inventory management
- Sales analytics
- Data export/import

## 🔧 Admin Access
- **Login URL**: Open `admin/login.html`
- **Username**: `admin`
- **Password**: `bracelet123`
- **Change Password**: Update credentials in `admin/admin-login.js`

## 📱 How to Launch
1. Open `index.html` in your web browser for the customer site
2. Open `admin/login.html` for the admin dashboard
3. Test the shopping experience!

## 🔒 Security Notes
- Current setup uses browser localStorage for data
- For production, consider:
  - Real database instead of localStorage
  - Server-side payment processing
  - HTTPS hosting
  - Stronger admin authentication

## 💡 Customization
- **Colors**: Edit `styles.css` and `admin/admin-styles.css`
- **Products**: Use the admin panel to manage inventory
- **Business Info**: Update contact details throughout the files

## 📞 Support
- The admin link is discretely placed in the footer of the main site
- Email notifications will open your default email client
- All orders are automatically tracked in the admin dashboard

Your bracelet business is ready to go! 🎉