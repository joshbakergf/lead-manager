import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FormField } from '../types';
import { payrixService, PaymentResponse } from '../services/payrixService';
import { fieldRoutesService } from '../services/fieldroutesService';
import { CreditCard, Smartphone, Building } from 'lucide-react';

interface PaymentFieldProps {
  field: FormField;
  value?: any;
  onChange?: (value: any) => void;
  onPaymentSuccess?: (response: PaymentResponse) => void;
  onPaymentFailure?: (error: any) => void;
  disabled?: boolean;
  formData?: Record<string, any>; // All form data for customer creation
}

export const PaymentField: React.FC<PaymentFieldProps> = ({
  field,
  value,
  onChange,
  onPaymentSuccess,
  onPaymentFailure,
  disabled = false,
  formData = {}
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [usePayrix, setUsePayrix] = useState(true);
  const [formValues, setFormValues] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    zip: ''
  });

  // Create stable onChange handlers to prevent re-renders
  const handleCardNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues(prev => ({ ...prev, cardNumber: value }));
  }, []);

  const handleExpiryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues(prev => ({ ...prev, expiry: value }));
  }, []);

  const handleCvvChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues(prev => ({ ...prev, cvv: value }));
  }, []);

  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues(prev => ({ ...prev, zip: value }));
  }, []);
  const cardRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const cvvRef = useRef<HTMLDivElement>(null);
  const zipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (field.type === 'payment-card' && !disabled) {
      // Skip Payrix, use HTML inputs directly
      setUsePayrix(false);
      setIsInitialized(true);
    }
  }, [field, disabled]);

  const initializePaymentFields = async () => {
    try {
      // Add a small delay to ensure DOM elements are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if DOM elements exist
      const cardElement = document.getElementById(`${field.id}-card`);
      const expiryElement = document.getElementById(`${field.id}-expiry`);
      const cvvElement = document.getElementById(`${field.id}-cvv`);
      const zipElement = document.getElementById(`${field.id}-zip`);
      
      console.log('Payment field elements:', {
        card: !!cardElement,
        expiry: !!expiryElement,
        cvv: !!cvvElement,
        zip: !!zipElement
      });
      
      if (!cardElement || !expiryElement || !cvvElement || !zipElement) {
        throw new Error('Payment field elements not found in DOM');
      }
      
      await payrixService.initializePaymentFields(
        {
          cardNumber: { 
            selector: `#${field.id}-card`,
            placeholder: 'Card Number'
          },
          expirationDate: { 
            selector: `#${field.id}-expiry`,
            placeholder: 'MM/YY'
          },
          cvv: { 
            selector: `#${field.id}-cvv`,
            placeholder: 'CVV'
          },
          billingZip: {
            selector: `#${field.id}-zip`,
            placeholder: 'ZIP Code'
          }
        },
        async (response) => {
          try {
            // First, handle Payrix tokenization success
            setError(null);
            onChange?.(response);
            
            // Then, integrate with FieldRoutes
            const token = response.token || response.paymentToken;
            console.log('Payment tokenization successful:', { response, token });
            
            if (token) {
              await handleFieldRoutesIntegration(token);
            }
            
            onPaymentSuccess?.(response);
          } catch (error: any) {
            console.error('FieldRoutes integration error:', error);
            setError(`CRM Integration Error: ${error.message || 'Failed to save to CRM'}`);
          }
          setIsProcessing(false);
        },
        (error) => {
          console.error('Payrix tokenization failed:', error);
          console.log('Payrix tokenization error details:', error);
          console.log('Error type:', typeof error);
          console.log('Error keys:', Object.keys(error || {}));
          
          setIsProcessing(false);
          
          // Better error message extraction
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
            } else {
              errorMessage = JSON.stringify(error);
            }
          }
          
          setError(`Payrix Error: ${errorMessage}`);
          onPaymentFailure?.(error);
        }
      );
      setIsInitialized(true);
    } catch (err: any) {
      console.error('Payment field initialization error:', err);
      setError(err.message || 'Failed to initialize payment fields');
      // Fallback to regular HTML inputs if Payrix fails
      console.log('Falling back to regular HTML inputs');
      setUsePayrix(false);
      setIsInitialized(true);
    }
  };

  const handleFieldRoutesIntegration = async (payrixToken: string) => {
    try {
      console.log('Integrating with FieldRoutes...', { token: payrixToken, formData });
      
      // Find or create customer in FieldRoutes
      const customerResult = await fieldRoutesService.findOrCreateCustomer(formData);
      
      if (!customerResult.success || !customerResult.data?.customerID) {
        throw new Error(customerResult.error || 'Failed to create customer in FieldRoutes');
      }

      const customerID = customerResult.data.customerID;
      console.log('Customer ID:', customerID);

      // Add Payrix token to FieldRoutes customer
      const paymentResult = await fieldRoutesService.addPayrixTokenToCustomer(
        customerID,
        payrixToken,
        {
          fname: formData.firstName || formData.fname,
          lname: formData.lastName || formData.lname,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        }
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to add payment method to FieldRoutes');
      }

      console.log('Successfully integrated with FieldRoutes');
    } catch (error: any) {
      console.error('FieldRoutes integration failed:', error);
      throw error;
    }
  };

  const handlePaymentSubmit = async () => {
    if (!isInitialized || isProcessing) return;

    console.log('Payment submit clicked');
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Processing payment with form values', formValues);
      
      // Basic validation
      if (!formValues.cardNumber || !formValues.expiry || !formValues.cvv || !formValues.zip) {
        throw new Error('Please fill in all payment fields');
      }
      
      // NEW 3-Step Payrix Integration Process
      console.log('Starting 3-step Payrix integration...');
      
      // PREREQUISITE: Create FieldRoutes customer first (needed for Step 3)
      console.log('Creating FieldRoutes customer first...');
      const fieldRoutesCustomerResult = await fieldRoutesService.findOrCreateCustomer(formData);
      
      if (!fieldRoutesCustomerResult.success) {
        throw new Error(`FieldRoutes customer creation failed: ${fieldRoutesCustomerResult.error}`);
      }
      
      const fieldRoutesCustomerID = fieldRoutesCustomerResult.data?.customerID;
      console.log('✅ FieldRoutes customer ready:', fieldRoutesCustomerID);
      
      // Step 1: Create customer in Payrix
      const payrixCustomerResult = await payrixService.createPayrixCustomer(formData, {
        firstName: formData.firstName || formData.fname,
        lastName: formData.lastName || formData.lname,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        address1: formData.address,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip || formValues.zip,
        country: 'USA'
      });
      
      if (!payrixCustomerResult.success) {
        throw new Error(`Step 1 failed: ${payrixCustomerResult.error}`);
      }
      
      console.log('✅ Step 1 completed - Payrix customer created:', payrixCustomerResult.customerId);
      
      // Step 2: Create token in Payrix
      const tokenResult = await payrixService.createPayrixToken(payrixCustomerResult.customerId!, {
        cardNumber: formValues.cardNumber,
        expiry: formValues.expiry, // Should be in MMYY format
        name: `${formData.firstName || formData.fname || 'John'} ${formData.lastName || formData.lname || 'Doe'}`,
        description: `Payment token for ${formData.email || 'customer'}`,
        custom: 'Lead Manager Form Builder',
        omnitoken: `omni_${Date.now()}`
      });
      
      if (!tokenResult.success) {
        throw new Error(`Step 2 failed: ${tokenResult.error}`);
      }
      
      console.log('✅ Step 2 completed - Payrix token created:', tokenResult.tokenId);
      
      // Step 3: Add Payrix token to FieldRoutes customer
      console.log('Step 3: Adding Payrix token to FieldRoutes...');
      const payrixToken = tokenResult.tokenId!;
      
      const step3Result = await fieldRoutesService.addPayrixTokenToCustomer(
        fieldRoutesCustomerID!,
        payrixToken,
        {
          fname: formData.firstName || formData.fname,
          lname: formData.lastName || formData.lname,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip || formValues.zip,
        }
      );
      
      if (!step3Result.success) {
        throw new Error(`Step 3 failed: ${step3Result.error}`);
      }
      
      console.log('✅ Step 3 completed - Payment profile created in FieldRoutes');
      console.log('🎉 3-Step Payrix Integration Complete!');
      
      // Return success response
      const successResponse = {
        success: true,
        token: payrixToken,
        customerID: fieldRoutesCustomerID,
        payrixCustomerId: payrixCustomerResult.customerId,
        method: '3-step-payrix',
        data: formValues
      };
      
      onChange?.(successResponse);
      onPaymentSuccess?.(successResponse);
      
      setIsProcessing(false);
      
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError(error.message || 'Payment processing failed');
      onPaymentFailure?.(error);
      setIsProcessing(false);
    }
  };

  const getFieldIcon = () => {
    switch (field.type) {
      case 'payment-card':
        return <CreditCard size={20} />;
      case 'payment-ach':
        return <Building size={20} />;
      case 'payment-wallet':
        return <Smartphone size={20} />;
      default:
        return <CreditCard size={20} />;
    }
  };

  const renderPaymentCard = () => (
    <div className="payment-card-fields">
      <div className="payment-field-row">
        <div className="payment-field-group">
          <label htmlFor={`${field.id}-card`}>Card Number</label>
          {usePayrix ? (
            <div id={`${field.id}-card`} ref={cardRef} className="payment-input" />
          ) : (
            <input
              key={`${field.id}-card-input`}
              type="text"
              id={`${field.id}-card`}
              placeholder="1234 5678 9012 3456"
              value={formValues.cardNumber}
              onChange={handleCardNumberChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          )}
        </div>
      </div>
      
      <div className="payment-field-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className="payment-field-group" style={{ flex: '1' }}>
          <label htmlFor={`${field.id}-expiry`}>Expiry</label>
          {usePayrix ? (
            <div id={`${field.id}-expiry`} ref={expiryRef} className="payment-input" />
          ) : (
            <input
              key={`${field.id}-expiry-input`}
              type="text"
              id={`${field.id}-expiry`}
              placeholder="MM/YY"
              value={formValues.expiry}
              onChange={handleExpiryChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          )}
        </div>
        
        <div className="payment-field-group" style={{ flex: '1' }}>
          <label htmlFor={`${field.id}-cvv`}>CVV</label>
          {usePayrix ? (
            <div id={`${field.id}-cvv`} ref={cvvRef} className="payment-input" />
          ) : (
            <input
              key={`${field.id}-cvv-input`}
              type="text"
              id={`${field.id}-cvv`}
              placeholder="123"
              value={formValues.cvv}
              onChange={handleCvvChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          )}
        </div>
        
        <div className="payment-field-group" style={{ flex: '1' }}>
          <label htmlFor={`${field.id}-zip`}>ZIP</label>
          {usePayrix ? (
            <div id={`${field.id}-zip`} ref={zipRef} className="payment-input" />
          ) : (
            <input
              key={`${field.id}-zip-input`}
              type="text"
              id={`${field.id}-zip`}
              placeholder="12345"
              value={formValues.zip}
              onChange={handleZipChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          )}
        </div>
      </div>

      <div className="payment-info">
        <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
          Payment information will be saved to FieldRoutes CRM
        </p>
      </div>

      {error && (
        <div className="payment-error" style={{ color: '#f56565', marginTop: '0.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePaymentSubmit}
        disabled={!isInitialized || isProcessing || disabled}
        className="payment-submit-btn"
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#667eea',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: isInitialized && !isProcessing && !disabled ? 'pointer' : 'not-allowed',
          opacity: isInitialized && !isProcessing && !disabled ? 1 : 0.6
        }}
      >
        {isProcessing ? 'Processing...' : 'Save Payment to FieldRoutes'}
      </button>
    </div>
  );

  const renderPaymentACH = () => (
    <div className="payment-ach-fields">
      <div className="payment-field-info">
        <Building size={24} />
        <p>ACH Bank Transfer</p>
        <small>Secure bank account payment</small>
      </div>
      {/* ACH fields would go here */}
    </div>
  );

  const renderPaymentWallet = () => (
    <div className="payment-wallet-fields">
      <div className="payment-wallet-buttons">
        {field.merchantConfig?.enableApplePay && (
          <button className="wallet-btn apple-pay">
            <Smartphone size={20} />
            Apple Pay
          </button>
        )}
        
        {field.merchantConfig?.enableGooglePay && (
          <button className="wallet-btn google-pay">
            <Smartphone size={20} />
            Google Pay
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="payment-field-container">
      <div className="field-header">
        <div className="field-icon">
          {getFieldIcon()}
        </div>
        <div className="field-info">
          <label className="field-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {field.helpText && (
            <small className="field-help">{field.helpText}</small>
          )}
        </div>
      </div>

      <div className="payment-field-content">
        {field.type === 'payment-card' && renderPaymentCard()}
        {field.type === 'payment-ach' && renderPaymentACH()}
        {field.type === 'payment-wallet' && renderPaymentWallet()}
      </div>
    </div>
  );
};