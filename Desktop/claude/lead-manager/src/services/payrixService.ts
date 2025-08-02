// Payrix Payment Service - 3-Step Integration
// Step 1: Create customer in Payrix
// Step 2: Create token in Payrix (TBD)
// Step 3: Add info to FieldRoutes (TBD)

export interface PayrixConfig {
  merchantId: string;
  environment: 'sandbox' | 'production';
  enableApplePay?: boolean;
  enableGooglePay?: boolean;
  enableACH?: boolean;
}

export interface PaymentFieldConfig {
  cardNumber?: { selector: string; placeholder?: string };
  expirationDate?: { selector: string; placeholder?: string };
  cvv?: { selector: string; placeholder?: string };
  billingZip?: { selector: string; placeholder?: string };
}

export interface PaymentRequest {
  amount: string;
  currency?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  billing?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  token?: string;
  transactionId?: string;
  error?: string;
}

export interface PayrixCustomer {
  id?: string;
  merchant: string;
  first: string;
  last: string;
  company?: string;
  email: string;
  fax?: string;
  phone: string;
  country: string;
  zip: string;
  state: string;
  city: string;
  address2?: string;
  address1: string;
  inactive: number;
  frozen: number;
}

export interface PayrixToken {
  id?: string;
  customer: string;
  payment: {
    method: number;
    number: string;
    routing: string;
  };
  expiration: string;
  name: string;
  description: string;
  custom: string;
  origin: number;
  entryMode: number;
  omnitoken: string;
  inactive: number;
  frozen: number;
}

export class PayrixService {
  private config: PayrixConfig;
  private isScriptLoaded = false;
  
  // Constants for new 3-step process
  private static readonly PAYRIX_API_BASE_URL = 'https://payapi.fieldroutes.com';
  private static readonly API_KEY = import.meta.env.VITE_PAYRIX_API_KEY || 'e2a939a812a993b301abda5b32705d5f';
  private static readonly MERCHANT_ID = import.meta.env.VITE_PAYRIX_MERCHANT_ID || '2a16bd420c2238b047cece90488f49df';

  constructor(config: PayrixConfig) {
    this.config = config;
  }

  // Step 1: Create customer in Payrix
  async createPayrixCustomer(formData: any, billingInfo: any): Promise<{ success: boolean; customerId?: string; customer?: PayrixCustomer; error?: string }> {
    try {
      console.log('Step 1: Creating Payrix customer with:', { formData, billingInfo });
      
      const customerPayload: PayrixCustomer = {
        merchant: PayrixService.MERCHANT_ID,
        first: formData.firstName || billingInfo.firstName || formData.first_name || 'John',
        last: formData.lastName || billingInfo.lastName || formData.last_name || 'Doe', 
        company: formData.company || billingInfo.company || 'Doe Enterprises',
        email: formData.email || billingInfo.email || 'somename@email.com',
        fax: formData.fax || billingInfo.fax || '+11234567845',
        phone: formData.phone || billingInfo.phone || '+11324567845',
        country: billingInfo.country || 'USA',
        zip: billingInfo.zip || billingInfo.zipCode || '75001',
        state: billingInfo.state || 'TX',
        city: billingInfo.city || 'Shelbyville',
        address2: billingInfo.address2 || billingInfo.apartment || 'Apt 4B',
        address1: billingInfo.address1 || billingInfo.address || '456 Secondary Ave',
        inactive: 0,
        frozen: 0
      };

      console.log('Payrix customer payload:', customerPayload);
      
      const response = await fetch(`${PayrixService.PAYRIX_API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'APIKEY': PayrixService.API_KEY
        },
        body: JSON.stringify(customerPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payrix customer creation failed:', response.status, errorText);
        return { success: false, error: `Customer creation failed (${response.status}): ${errorText}` };
      }

      const customerData = await response.json();
      console.log('Payrix customer created successfully:', customerData);

      return { 
        success: true, 
        customerId: customerData.id || customerData.customer_id,
        customer: customerData
      };
      
    } catch (error) {
      console.error('Payrix customer creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Step 2: Create token in Payrix
  async createPayrixToken(customerId: string, paymentData: any): Promise<{ success: boolean; tokenId?: string; token?: PayrixToken; error?: string }> {
    try {
      console.log('Step 2: Creating Payrix token for customer:', customerId);
      
      const tokenPayload: PayrixToken = {
        customer: customerId,
        payment: {
          method: 1, // Credit card method
          number: paymentData.cardNumber || "378734493671000", // Use provided card number or sample
          routing: "0"
        },
        expiration: paymentData.expiry || "0123", // Format: MMYY
        name: paymentData.name || "test",
        description: paymentData.description || "Payment Token",
        custom: paymentData.custom || "Form Builder Token",
        origin: 2,
        entryMode: 2,
        omnitoken: paymentData.omnitoken || "123",
        inactive: 0,
        frozen: 0
      };

      console.log('Payrix token payload:', tokenPayload);
      
      const response = await fetch(`${PayrixService.PAYRIX_API_BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'APIKEY': PayrixService.API_KEY
        },
        body: JSON.stringify(tokenPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payrix token creation failed:', response.status, errorText);
        return { success: false, error: `Token creation failed (${response.status}): ${errorText}` };
      }

      const tokenData = await response.json();
      console.log('Payrix token created successfully:', tokenData);

      return { 
        success: true, 
        tokenId: tokenData.id || tokenData.token_id,
        token: tokenData
      };
      
    } catch (error) {
      console.error('Payrix token creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Load Payrix script dynamically
  async loadPayrixScript(): Promise<void> {
    if (this.isScriptLoaded) return;

    console.log('Loading Payrix script...');
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://api.payrix.com/payFieldsScript?spa=1';
      script.onload = () => {
        console.log('Payrix script loaded successfully');
        this.isScriptLoaded = true;
        setTimeout(() => {
          console.log('PayFields available:', !!(window as any).PayFields);
          resolve();
        }, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Payrix script');
        reject(new Error('Failed to load Payrix script'));
      };
      document.head.appendChild(script);
    });
  }


  // Initialize payment fields
  async initializePaymentFields(
    fieldConfig: PaymentFieldConfig,
    onSuccess: (response: PaymentResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    await this.loadPayrixScript();

    // Access PayFields from window object (loaded by script)
    const PayFields = (window as any).PayFields;
    
    console.log('PayFields object:', PayFields);
    console.log('Merchant ID:', this.config.merchantId);
    
    if (!PayFields) {
      throw new Error('Payrix PayFields not available');
    }

    // Try multiple configuration approaches
    console.log('Trying different PayFields configurations...');
    
    // Approach 1: Basic merchant config (sandbox mode)
    console.log('Approach 1: Sandbox merchant config');
    PayFields.config = {
      merchant: this.config.merchantId,
    };
    
    console.log('Basic config set:', PayFields.config);
    
    // Try to initialize and see what happens
    console.log('Testing basic initialization...');
    
    console.log('Final config:', PayFields.config);

    // Setup fields array
    PayFields.fields = [
      { type: 'number', element: fieldConfig.cardNumber?.selector },
      { type: 'expiration', element: fieldConfig.expirationDate?.selector },
      { type: 'cvv', element: fieldConfig.cvv?.selector },
      { type: 'zip', element: fieldConfig.billingZip?.selector }
    ].filter(field => field.element);

    // Set button element (required by Payrix)
    PayFields.button = {
      element: '.payment-submit-btn'
    };

    // Custom styling
    PayFields.customizations = {
      style: {
        base: {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: 'rgba(45, 55, 72, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.75rem',
          padding: '1rem',
        },
        focus: {
          borderColor: '#667eea',
          backgroundColor: 'rgba(45, 55, 72, 0.8)',
          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
        },
        invalid: {
          borderColor: '#f56565',
          color: '#f56565',
        },
      },
      placeholders: {
        number: fieldConfig.cardNumber?.placeholder || 'Card Number',
        expiration: fieldConfig.expirationDate?.placeholder || 'MM/YY',
        cvv: fieldConfig.cvv?.placeholder || 'CVV',
        zip: fieldConfig.billingZip?.placeholder || 'ZIP Code'
      }
    };

    // Set up callbacks
    PayFields.onSuccess = (response: any) => {
      console.log('Payrix success response:', response);
      onSuccess({
        success: true,
        token: response.token || response.paymentToken,
        transactionId: response.transactionId,
      });
    };

    PayFields.onFailure = (error: any) => {
      console.error('Payrix failure response:', error);
      console.log('Payrix failure error details:', error);
      console.log('Payrix failure error type:', typeof error);
      console.log('Payrix failure error keys:', Object.keys(error || {}));
      
      let errorMessage = 'Tokenization failed';
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (error.errors && Array.isArray(error.errors)) {
          errorMessage = error.errors.map(e => e.msg || e.message).join(', ');
        } else if (error.responseText) {
          errorMessage = error.responseText;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      onFailure({
        success: false,
        error: errorMessage,
      });
    };

    // Initialize
    PayFields.ready();
  }

  // Submit payment
  async submitPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const PayFields = (window as any).PayFields;
    
    if (!PayFields) {
      throw new Error('Payrix PayFields not initialized');
    }

    try {
      // Set transaction details
      PayFields.setTransaction({
        type: 'sale',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || 'USD',
      });

      // Set customer info if provided
      if (paymentRequest.customer) {
        PayFields.setCustomer(paymentRequest.customer);
      }

      // Set billing info if provided
      if (paymentRequest.billing) {
        PayFields.setBilling(paymentRequest.billing);
      }

      // Submit payment
      const response = await PayFields.submit();
      
      return {
        success: true,
        token: response.token,
        transactionId: response.transactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment submission failed',
      };
    }
  }

  // Clear payment fields
  clearFields(): void {
    const PayFields = (window as any).PayFields;
    if (PayFields) {
      PayFields.clearFields();
    }
  }
}

// Create a singleton instance with environment-specific config
// Note: In production, these values should come from environment variables
export const payrixService = new PayrixService({
  merchantId: process.env.REACT_APP_PAYRIX_MERCHANT_ID || '2a16bd420c2238b047cece90488f49df', // Your actual merchant ID
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  enableApplePay: true,
  enableGooglePay: true,
  enableACH: true,
});