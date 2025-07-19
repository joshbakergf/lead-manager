// Vercel Edge Config integration
import { get, getAll, has } from '@vercel/edge-config';

// Edge Config can be used to store:
// - Feature flags
// - Store configuration (business hours, shipping rates, etc.)
// - Product categories
// - Promotional banners
// - Any configuration that needs to be updated without redeployment

export class EdgeConfigService {
    // Get store configuration
    async getStoreConfig() {
        try {
            const config = await get('storeConfig');
            return config || {
                storeName: 'Handmade Bracelets',
                storeEmail: 'your-email@example.com',
                currency: 'USD',
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
        } catch (error) {
            console.error('Edge Config error:', error);
            return this.getDefaultConfig();
        }
    }

    // Get promotional banner
    async getPromoBanner() {
        try {
            const promo = await get('promoBanner');
            return promo || null;
        } catch (error) {
            console.error('Edge Config error:', error);
            return null;
        }
    }

    // Get feature flags
    async getFeatureFlags() {
        try {
            const flags = await get('featureFlags');
            return flags || {
                enableStripePayments: true,
                enableEmailOrders: true,
                enableInventoryTracking: true,
                enableProductReviews: false,
                enableWishlist: false,
                maintenanceMode: false
            };
        } catch (error) {
            console.error('Edge Config error:', error);
            return this.getDefaultFeatureFlags();
        }
    }

    // Get shipping zones and rates
    async getShippingRates() {
        try {
            const shipping = await get('shippingRates');
            return shipping || {
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
        } catch (error) {
            console.error('Edge Config error:', error);
            return this.getDefaultShippingRates();
        }
    }

    // Get all configuration at once
    async getAllConfig() {
        try {
            const allConfig = await getAll();
            return allConfig || {};
        } catch (error) {
            console.error('Edge Config error:', error);
            return {};
        }
    }

    // Check if a specific key exists
    async hasConfig(key) {
        try {
            return await has(key);
        } catch (error) {
            console.error('Edge Config error:', error);
            return false;
        }
    }

    // Default configurations (fallback)
    getDefaultConfig() {
        return {
            storeName: 'Handmade Bracelets',
            storeEmail: 'your-email@example.com',
            currency: 'USD',
            shippingRate: 5.00,
            freeShippingThreshold: 50.00,
            taxRate: 0.0
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
}

// Export singleton instance
export const edgeConfig = new EdgeConfigService();