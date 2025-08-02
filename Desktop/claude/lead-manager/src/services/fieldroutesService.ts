// FieldRoutes API Service
// Integrates with FieldRoutes CRM for customer and payment management

export interface FieldRoutesConfig {
  baseUrl: string;
  authenticationKey: string;
  authenticationToken: string;
}

export interface FieldRoutesCustomer {
  customerID?: number;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  // Additional optional fields from API
  companyName?: string;
  homePhone?: string;
  workPhone?: string;
  mobilePhone?: string;
}

export interface FieldRoutesPaymentProfile {
  customerID: number;
  creditCardToken?: string;
  creditCardTokenID?: string;
  // Billing address fields
  billingFname?: string;
  billingLname?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountryID?: string;
}

export interface FieldRoutesResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class FieldRoutesService {
  private config: FieldRoutesConfig;

  constructor(config: FieldRoutesConfig) {
    this.config = config;
  }

  // Make authenticated request to FieldRoutes API
  private async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<FieldRoutesResponse<T>> {
    try {
      const url = `${this.config.baseUrl}/api${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'authenticationKey': this.config.authenticationKey,
        'authenticationToken': this.config.authenticationToken,
      };

      const requestConfig: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestConfig.body = JSON.stringify(data);
      }

      console.log('Making FieldRoutes API request:', { url, method, data });
      
      const response = await fetch(url, requestConfig);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.error('FieldRoutes API error:', response.status, response.statusText);
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      const result = await response.json();
      console.log('FieldRoutes API response:', result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('FieldRoutes API request failed:', error);
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }

  // Search for customers
  async searchCustomers(searchParams: {
    email?: string;
    phone?: string;
    fname?: string;
    lname?: string;
  }): Promise<FieldRoutesResponse<FieldRoutesCustomer[]>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return this.makeRequest(`/customer/search?${queryParams.toString()}`);
  }

  // Create a new customer
  async createCustomer(customerData: FieldRoutesCustomer): Promise<FieldRoutesResponse<{ customerID: number }>> {
    console.log('FieldRoutes createCustomer called with:', customerData);
    const response = await this.makeRequest('/customer/create', 'POST', customerData);
    console.log('FieldRoutes createCustomer response:', response);
    return response;
  }

  // Get customer details
  async getCustomer(customerID: number): Promise<FieldRoutesResponse<FieldRoutesCustomer>> {
    return this.makeRequest(`/customer/get?customerID=${customerID}`);
  }

  // Update customer
  async updateCustomer(customerID: number, customerData: Partial<FieldRoutesCustomer>): Promise<FieldRoutesResponse> {
    return this.makeRequest('/customer/update', 'POST', {
      customerID,
      ...customerData,
    });
  }

  // Create payment profile for customer
  async createPaymentProfile(paymentData: FieldRoutesPaymentProfile): Promise<FieldRoutesResponse> {
    return this.makeRequest('/customer/createPaymentProfile', 'POST', paymentData);
  }

  // Update payment profile billing information
  async updatePaymentProfile(paymentData: FieldRoutesPaymentProfile): Promise<FieldRoutesResponse> {
    return this.makeRequest('/customer/updatePaymentProfile', 'POST', paymentData);
  }

  // Find or create customer based on form data
  async findOrCreateCustomer(formData: any): Promise<FieldRoutesResponse<{ customerID: number }>> {
    try {
      // First, try to find existing customer by email or phone
      let searchResult;
      
      if (formData.email) {
        searchResult = await this.searchCustomers({ email: formData.email });
      } else if (formData.phone) {
        searchResult = await this.searchCustomers({ phone: formData.phone });
      }

      // If customer found, return existing customerID
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        return {
          success: true,
          data: { customerID: searchResult.data[0].customerID! },
        };
      }

      // If no customer found, create new one
      const customerData: FieldRoutesCustomer = {
        fname: formData.firstName || formData.fname,
        lname: formData.lastName || formData.lname,
        email: formData.email,
        phone: formData.phone || formData.mobilePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      };

      return this.createCustomer(customerData);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to find or create customer',
      };
    }
  }

  // Step 3: Add Payrix token to FieldRoutes customer (final step of 3-step process)
  async addPayrixTokenToCustomer(
    customerID: number,
    payrixToken: string,
    billingInfo?: {
      fname?: string;
      lname?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
    },
    officeID: number = 13 // Default office ID
  ): Promise<FieldRoutesResponse> {
    console.log('Step 3: Adding Payrix token to FieldRoutes customer:', { customerID, payrixToken });
    
    // Step 3 parameters as specified:
    // customerID = FieldRoutes customer ID (created before Payrix process)
    // merchantID = token from Step 2 (Payrix token)
    // paymentMethod = 1 (credit card)
    const paymentData = {
      customerID: customerID,
      merchantID: payrixToken, // This is the token from Step 2
      paymentMethod: 1, // 1 for credit card (not a string)
      
      // Additional fields to maintain compatibility
      autopay: 1,
      gateway: "payrix",
      officeID: officeID,
      
      // Add billing information if provided
      ...(billingInfo && {
        billingAddress1: billingInfo.address,
        billingCity: billingInfo.city,
        billingState: billingInfo.state,
        billingZip: billingInfo.zip,
      }),
    };
    
    console.log('Step 3 payload:', paymentData);

    // Use the correct endpoint
    return this.makeRequest('/paymentProfile/create', 'POST', paymentData);
  }
}

// Create singleton instance with environment config
export const fieldRoutesService = new FieldRoutesService({
  baseUrl: process.env.REACT_APP_FIELDROUTES_BASE_URL || 'https://goforth.pestroutes.com',
  authenticationKey: process.env.REACT_APP_FIELDROUTES_AUTH_KEY || 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
  authenticationToken: process.env.REACT_APP_FIELDROUTES_AUTH_TOKEN || '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
});