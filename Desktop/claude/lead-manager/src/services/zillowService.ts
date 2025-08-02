import { PropertyData, ZillowConnection } from '../types';

// Cache for property data to reduce API calls
const propertyCache = new Map<string, { data: PropertyData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Mock data for development/testing
const MOCK_PROPERTIES: PropertyData[] = [
  {
    zpid: '123456',
    address: '1104 W 5th Ave',
    city: 'Gastonia',
    state: 'NC',
    zipCode: '28052',
    sqft: 884,
    lotSize: 7200,
    bedrooms: 3,
    bathrooms: 1,
    yearBuilt: 1955,
    propertyType: 'Single Family',
    zestimate: 165000,
    rentEstimate: 1200,
    taxAssessedValue: 145000,
    latitude: 35.2621,
    longitude: -81.1875,
    imageUrl: 'https://photos.zillowstatic.com/fp/example.jpg'
  },
  {
    zpid: '789101',
    address: '123 Main St',
    city: 'Charlotte',
    state: 'NC',
    zipCode: '28202',
    sqft: 2200,
    lotSize: 10500,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 2005,
    propertyType: 'Single Family',
    zestimate: 425000,
    rentEstimate: 2800,
    taxAssessedValue: 385000,
    latitude: 35.2271,
    longitude: -80.8431,
    imageUrl: 'https://photos.zillowstatic.com/fp/example2.jpg'
  }
];

export class ZillowService {
  private connection: ZillowConnection | null = null;
  private requestCount = 0;
  private resetDate: Date;

  constructor(connection?: ZillowConnection) {
    this.connection = connection || null;
    this.resetDate = new Date();
    this.resetDate.setMonth(this.resetDate.getMonth() + 1);
  }

  setConnection(connection: ZillowConnection) {
    this.connection = connection;
  }

  private checkRateLimit(): boolean {
    if (!this.connection) return true;
    
    // Reset counter if we're in a new month
    const now = new Date();
    if (now > this.resetDate) {
      this.requestCount = 0;
      this.resetDate = new Date();
      this.resetDate.setMonth(this.resetDate.getMonth() + 1);
    }

    return this.requestCount < this.connection.rateLimit;
  }

  async searchProperties(query: string): Promise<PropertyData[]> {
    // Check cache first
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = propertyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return [cached.data];
    }

    // For development, use mock data
    if (!this.connection || !this.connection.isActive) {
      // Filter mock data based on query
      const results = MOCK_PROPERTIES.filter(prop => 
        prop.address.toLowerCase().includes(query.toLowerCase()) ||
        prop.city.toLowerCase().includes(query.toLowerCase()) ||
        prop.zipCode.includes(query)
      );
      return results;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for Zillow API');
    }

    try {
      this.requestCount++;
      
      // RapidAPI integration
      const response = await fetch(`${this.connection.apiUrl}/propertyExtendedSearch`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': this.connection.apiKey,
          'X-RapidAPI-Host': new URL(this.connection.apiUrl).hostname
        },
        body: JSON.stringify({
          location: query,
          home_type: 'Houses',
          sort: 'Relevance'
        })
      });

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to our PropertyData format
      const properties: PropertyData[] = data.props?.map((prop: any) => ({
        zpid: prop.zpid,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zipCode: prop.zipcode,
        sqft: prop.livingArea,
        lotSize: prop.lotAreaValue,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        yearBuilt: prop.yearBuilt,
        propertyType: prop.propertyType,
        zestimate: prop.zestimate,
        rentEstimate: prop.rentZestimate,
        taxAssessedValue: prop.taxAssessedValue,
        latitude: prop.latitude,
        longitude: prop.longitude,
        imageUrl: prop.imgSrc
      })) || [];

      // Cache results
      properties.forEach(prop => {
        const key = `search:${prop.address.toLowerCase()}`;
        propertyCache.set(key, { data: prop, timestamp: Date.now() });
      });

      return properties;
    } catch (error) {
      console.error('Zillow search error:', error);
      // Fallback to mock data on error
      return MOCK_PROPERTIES;
    }
  }

  async getPropertyDetails(zpid: string): Promise<PropertyData | null> {
    // Check cache
    const cacheKey = `details:${zpid}`;
    const cached = propertyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // For development, use mock data
    if (!this.connection || !this.connection.isActive) {
      return MOCK_PROPERTIES.find(p => p.zpid === zpid) || null;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for Zillow API');
    }

    try {
      this.requestCount++;
      
      const response = await fetch(`${this.connection.apiUrl}/property`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.connection.apiKey,
          'X-RapidAPI-Host': new URL(this.connection.apiUrl).hostname
        },
        params: { zpid } as any
      });

      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform to PropertyData
      const property: PropertyData = {
        zpid: data.zpid,
        address: data.address.streetAddress,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipcode,
        sqft: data.livingArea,
        lotSize: data.lotAreaValue,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        yearBuilt: data.yearBuilt,
        propertyType: data.homeType,
        zestimate: data.zestimate,
        rentEstimate: data.rentZestimate,
        taxAssessedValue: data.taxAssessedValue,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrl: data.imgSrc
      };

      // Cache result
      propertyCache.set(cacheKey, { data: property, timestamp: Date.now() });

      return property;
    } catch (error) {
      console.error('Zillow details error:', error);
      return null;
    }
  }

  getRemainingRequests(): number {
    if (!this.connection) return 0;
    return Math.max(0, this.connection.rateLimit - this.requestCount);
  }

  clearCache() {
    propertyCache.clear();
  }
}

// Singleton instance
export const zillowService = new ZillowService();