# Vercel Blob Storage Setup Guide 🚀

## Overview
Your bracelet shop now supports Vercel Blob storage for better image management, replacing the previous base64 localStorage approach.

## 📋 Setup Steps

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com) and sign up
- Connect your GitHub account

### 2. Get Blob Storage Token
1. **Visit Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Go to Storage**: Click "Storage" in the sidebar
3. **Create Blob Store**: Click "Create Database" → "Blob"
4. **Copy Token**: Copy your `BLOB_READ_WRITE_TOKEN`

### 3. Configure Environment Variables

#### For Local Development:
Update `.env.local`:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxxxx
```

#### For Production (Vercel):
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add: `BLOB_READ_WRITE_TOKEN` with your token value

### 4. Install Dependencies
```bash
npm install @vercel/blob
```

### 5. Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Add Vercel Blob storage"
git push

# Deploy (automatic if connected to GitHub)
# Or manually: vercel --prod
```

## 🎯 Features Enabled

### ✅ **Image Upload**
- **High-quality storage** instead of base64
- **Automatic optimization** by Vercel
- **Global CDN** for fast loading
- **5MB file size limit** with validation

### ✅ **Image Management**
- **Automatic cleanup** when products deleted
- **Unique filenames** prevent conflicts
- **Public access** URLs for easy sharing
- **Fallback support** to base64 if upload fails

### ✅ **Performance Benefits**
- **Faster page loads** (no large base64 data)
- **Better browser caching** with CDN
- **Reduced localStorage** usage
- **Scalable storage** solution

## 🔧 API Endpoints

### Upload Image: `/api/upload-image.js`
```javascript
// POST /api/upload-image
FormData: {
  file: <image-file>,
  filename: 'product-image.jpg'
}

// Response:
{
  url: 'https://xxxx.public.blob.vercel-storage.com/products/123-image.jpg',
  pathname: 'products/123-image.jpg',
  size: 125943
}
```

### Delete Image: `/api/delete-image.js`
```javascript
// POST /api/delete-image
{
  pathname: 'products/123-image.jpg'
}

// Response:
{
  success: true,
  deletedAt: '2025-01-19T...'
}
```

## 🛠 File Structure
```
bracelet-shop/
├── api/
│   ├── upload-image.js     # Vercel Edge Function
│   └── delete-image.js     # Vercel Edge Function
├── admin/
│   ├── blob-service.js     # Client service
│   └── admin-dashboard.js  # Updated with blob support
├── .env.local              # Environment variables
├── package.json            # Dependencies
└── VERCEL_SETUP.md        # This guide
```

## 📱 How It Works

### **For Admins:**
1. **Upload photos** through admin panel
2. **Images stored** in Vercel Blob (not browser)
3. **Fast loading** from global CDN
4. **Automatic cleanup** when products deleted

### **For Customers:**
1. **Fast image loading** from CDN
2. **High-quality photos** without compression
3. **Better browsing** experience
4. **Mobile optimized** delivery

## 🔄 Migration Path

### **Existing Products:**
- Base64 images still work (backward compatible)
- New uploads use Blob storage
- Gradually migrate existing images by re-uploading

### **Development vs Production:**
- **Local**: Falls back to base64 if no token
- **Production**: Uses Vercel Blob seamlessly

## 💡 Benefits Over Base64

| Feature | Base64 | Vercel Blob |
|---------|--------|-------------|
| **Storage** | Browser localStorage | Cloud storage |
| **Size Limit** | ~2-10MB browser limit | Virtually unlimited |
| **Performance** | Slow page loads | Fast CDN delivery |
| **Caching** | Poor | Excellent |
| **SEO** | Bad for image search | Great for SEO |
| **Mobile** | Heavy bandwidth | Optimized delivery |

## 🚨 Important Notes

1. **Token Security**: Keep your `BLOB_READ_WRITE_TOKEN` secret
2. **File Validation**: Only images allowed, 5MB max
3. **Cleanup**: Deleted products automatically remove images
4. **Fallback**: System gracefully falls back to base64 if needed
5. **Cost**: Vercel Blob has generous free tier, then pay-per-use

## 🎉 Ready to Use!
Your bracelet shop now has professional-grade image storage! Upload high-quality photos and enjoy faster, more reliable image delivery for your customers.