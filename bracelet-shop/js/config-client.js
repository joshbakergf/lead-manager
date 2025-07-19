// Client-side configuration service using Edge Config API
class ConfigService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Fetch configuration from API
    async getConfig(key = null) {
        const cacheKey = key || 'all';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = key ? `/api/config?key=${key}` : '/api/config';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Config fetch failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Config fetch error:', error);
            return this.getDefaultConfig(key);
        }
    }

    // Get store configuration
    async getStoreConfig() {
        const config = await this.getConfig('storeConfig');
        return config.storeConfig || this.getDefaultStoreConfig();
    }

    // Get feature flags
    async getFeatureFlags() {
        const config = await this.getConfig('featureFlags');
        return config.featureFlags || this.getDefaultFeatureFlags();
    }

    // Get shipping rates
    async getShippingRates() {
        const config = await this.getConfig('shippingRates');
        return config.shippingRates || this.getDefaultShippingRates();
    }

    // Get promotional banner
    async getPromoBanner() {
        const config = await this.getConfig('promoBanner');
        return config.promoBanner || null;
    }

    // Check if maintenance mode is enabled
    async isMaintenanceMode() {
        const flags = await this.getFeatureFlags();
        return flags.maintenanceMode || false;
    }

    // Calculate shipping cost
    async calculateShipping(subtotal, shippingMethod = 'standard', isInternational = false) {
        const storeConfig = await this.getStoreConfig();
        const shippingRates = await this.getShippingRates();
        
        // Check for free shipping threshold
        if (subtotal >= storeConfig.freeShippingThreshold) {
            return 0;
        }
        
        // Get appropriate rate
        const zone = isInternational ? 'international' : 'domestic';
        const rate = shippingRates[zone]?.[shippingMethod] || storeConfig.shippingRate;
        
        return rate;
    }

    // Default configurations
    getDefaultConfig(key) {
        const defaults = {
            storeConfig: this.getDefaultStoreConfig(),
            featureFlags: this.getDefaultFeatureFlags(),
            shippingRates: this.getDefaultShippingRates(),
            promoBanner: null
        };
        
        return key ? { [key]: defaults[key] } : defaults;
    }

    getDefaultStoreConfig() {
        return {
            storeName: 'Handmade Bracelets',
            storeEmail: 'your-email@example.com',
            currency: 'USD',
            currencySymbol: '$',
            shippingRate: 5.00,
            freeShippingThreshold: 50.00,
            taxRate: 0.0,
            businessHours: {
                monday: '9:00 AM - 5:00 PM',
                tuesday: '9:00 AM - 5:00 PM',
                wednesday: '9:00 AM - 5:00 PM',
                thursday: '9:00 AM - 5:00 PM',
                friday: '9:00 AM - 5:00 PM',
                saturday: '10:00 AM - 3:00 PM',
                sunday: 'Closed'
            }
        };
    }

    getDefaultFeatureFlags() {
        return {
            enableStripePayments: true,
            enableEmailOrders: true,
            enableInventoryTracking: true,
            enableProductReviews: false,
            enableWishlist: false,
            maintenanceMode: false
        };
    }

    getDefaultShippingRates() {
        return {
            domestic: {
                standard: 5.00,
                express: 15.00,
                overnight: 25.00
            },
            international: {
                standard: 15.00,
                express: 35.00
            }
        };
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
export const configService = new ConfigService();
window.configService = configService; // Make available globally