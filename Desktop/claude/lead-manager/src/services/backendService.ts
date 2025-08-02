// Backend API Service
// Handles all API calls through our backend proxy

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://lead-manager-backend-388701133207.us-central1.run.app';

export interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BackendService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BACKEND_URL;
  }

  // Submit lead with complete 4-step process
  async submitLead(formData: any): Promise<BackendResponse> {
    try {
      console.log('Submitting lead to backend:', formData);
      
      const response = await fetch(`${this.baseUrl}/api/leads/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData })
      });

      const result = await response.json();
      console.log('Backend response:', result);
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`
        };
      }

      return result;
    } catch (error: any) {
      console.error('Backend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to backend'
      };
    }
  }

  // Submit lead with field mappings
  async submitLeadWithMappings(formData: any, fieldMappings: Record<string, string>): Promise<BackendResponse> {
    try {
      console.log('Submitting lead to backend with mappings:', { formData, fieldMappings });
      
      const response = await fetch(`${this.baseUrl}/api/leads/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData, fieldMappings })
      });

      const result = await response.json();
      console.log('Backend response:', result);
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`
        };
      }

      return result;
    } catch (error: any) {
      console.error('Backend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to backend'
      };
    }
  }

  // Direct FieldRoutes API calls (if needed)
  async createFieldRoutesCustomer(customerData: any): Promise<BackendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fieldroutes/customer/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create customer'
      };
    }
  }

  // Direct Payrix API calls (if needed)
  async createPayrixCustomer(customerData: any): Promise<BackendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payrix/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create Payrix customer'
      };
    }
  }

  async createPayrixToken(tokenData: any): Promise<BackendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payrix/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData)
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create token'
      };
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Export a default instance
export const backendService = new BackendService();