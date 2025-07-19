# Vercel Edge Config Setup Guide 🚀

## What is Edge Config?

Vercel Edge Config is a global data store that enables you to read configuration at the edge without sacrificing performance. Perfect for:
- Feature flags
- A/B testing
- Configuration management
- Dynamic pricing
- Store hours and information

## 🛠 Setup Steps

### 1. Create Edge Config Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to "Storage" → "Create Database"
3. Select "Edge Config"
4. Name it (e.g., "bracelet-shop-config")
5. Create the store

### 2. Get Connection String

After creation, you'll get:
- **Edge Config URL**: `https://edge-config.vercel.com/ecfg_xxxxx`
- **Token**: For read access

### 3. Update Environment Variables

In `.env.local`:
```bash
EDGE_CONFIG="https://edge-config.vercel.com/ecfg_mkncuwuw5pgupfha57gw87myj9fr"
EDGE_CONFIG_TOKEN="030ade7f-351b-4e31-84d7-4519d576561d"
```

In Vercel Dashboard (Environment Variables):
- Add the same variables for production

### 4. Configure Edge Config Data

In Vercel Dashboard → Your Edge Config Store → "Items":

Add these configuration items:

#### Store Configuration
```json
{
  "key": "storeConfig",
  "value": {
    "storeName": "Sarah's Handmade Bracelets",
    "storeEmail": "orders@sarahsbracelets.com",
    "currency": "USD",
    "currencySymbol": "$",
    "shippingRate": 5.00,
    "freeShippingThreshold": 50.00,
    "taxRate": 0.06,
    "businessHours": {
      "monday": "9:00 AM - 5:00 PM",
      "tuesday": "9:00 AM - 5:00 PM",
      "wednesday": "9:00 AM - 5:00 PM",
      "thursday": "9:00 AM - 5:00 PM",
      "friday": "9:00 AM - 6:00 PM",
      "saturday": "10:00 AM - 3:00 PM",
      "sunday": "Closed"
    }
  }
}
```

#### Feature Flags
```json
{
  "key": "featureFlags",
  "value": {
    "enableStripePayments": true,
    "enableEmailOrders": true,
    "enableInventoryTracking": true,
    "enableProductReviews": false,
    "enableWishlist": false,
    "maintenanceMode": false
  }
}
```

#### Shipping Rates
```json
{
  "key": "shippingRates",
  "value": {
    "domestic": {
      "standard": 5.00,
      "express": 15.00,
      "overnight": 25.00
    },
    "international": {
      "standard": 15.00,
      "express": 35.00
    }
  }
}
```

#### Promotional Banner (Optional)
```json
{
  "key": "promoBanner",
  "value": {
    "enabled": true,
    "message": "🎉 Free shipping on orders over $50!",
    "backgroundColor": "#667eea",
    "textColor": "#ffffff",
    "link": "/products",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

## 📝 Usage in Your App

### Frontend Usage

```javascript
// Get store configuration
const storeConfig = await configService.getStoreConfig();
console.log('Store name:', storeConfig.storeName);

// Check feature flags
const features = await configService.getFeatureFlags();
if (features.enableStripePayments) {
    // Show Stripe payment option
}

// Calculate shipping
const shipping = await configService.calculateShipping(cartTotal);

// Check maintenance mode
if (await configService.isMaintenanceMode()) {
    // Show maintenance page
}
```

### Update Store Information Dynamically

```javascript
// Display business hours
const config = await configService.getStoreConfig();
const today = new Date().toLocaleLowerCase();
const hours = config.businessHours[today];
document.getElementById('hours-today').textContent = hours;
```

### Show Promotional Banner

```javascript
const promo = await configService.getPromoBanner();
if (promo && promo.enabled) {
    const banner = document.createElement('div');
    banner.style.backgroundColor = promo.backgroundColor;
    banner.style.color = promo.textColor;
    banner.textContent = promo.message;
    document.body.prepend(banner);
}
```

## 🎯 Benefits

1. **No Redeployment**: Update configuration without deploying
2. **Instant Updates**: Changes propagate globally in seconds
3. **Performance**: Cached at edge for fast reads
4. **Version Control**: Track configuration changes
5. **Environment Specific**: Different configs for dev/staging/prod

## 🔧 Advanced Features

### A/B Testing
```json
{
  "key": "experiments",
  "value": {
    "newCheckoutFlow": {
      "enabled": true,
      "percentage": 50
    }
  }
}
```

### Dynamic Pricing
```json
{
  "key": "pricingRules",
  "value": {
    "discounts": {
      "SUMMER2025": {
        "type": "percentage",
        "value": 15,
        "validUntil": "2025-08-31"
      }
    }
  }
}
```

### Regional Configuration
```json
{
  "key": "regionalConfig",
  "value": {
    "US": {
      "currency": "USD",
      "taxRate": 0.06
    },
    "CA": {
      "currency": "CAD",
      "taxRate": 0.13
    }
  }
}
```

## 🚀 Deploy

```bash
npm install
git add .
git commit -m "Add Edge Config integration"
git push
```

Your bracelet shop now has dynamic configuration management! 🎉
