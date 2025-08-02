const express = require('express');
const router = express.Router();
const axios = require('axios');

// FieldRoutes and Payrix API configuration
const FIELDROUTES_BASE_URL = process.env.FIELDROUTES_BASE_URL || 'https://goforth.pestroutes.com';
const FIELDROUTES_AUTH_KEY = process.env.FIELDROUTES_AUTH_KEY;
const FIELDROUTES_AUTH_TOKEN = process.env.FIELDROUTES_AUTH_TOKEN;

const PAYRIX_API_BASE_URL = 'https://payapi.fieldroutes.com';
const PAYRIX_API_KEY = process.env.PAYRIX_API_KEY;

// Process complete lead submission with 4-step API flow
router.post('/submit', async (req, res) => {
  try {
    const { formData, fieldMappings } = req.body;
    console.log('Processing lead submission:', formData);
    console.log('Field mappings:', fieldMappings);
    
    // Map form field IDs to API field names
    const mappedData = {};
    if (fieldMappings && Object.keys(fieldMappings).length > 0) {
      // Use provided field mappings
      Object.entries(formData).forEach(([fieldId, value]) => {
        const apiName = fieldMappings[fieldId];
        if (apiName) {
          mappedData[apiName] = value;
        }
      });
    } else {
      // Fallback: try to detect common field patterns
      Object.entries(formData).forEach(([fieldId, value]) => {
        const lowerLabel = fieldId.toLowerCase();
        if (lowerLabel.includes('firstname') || lowerLabel.includes('first_name') || lowerLabel.includes('fname')) {
          mappedData.firstName = value;
        } else if (lowerLabel.includes('lastname') || lowerLabel.includes('last_name') || lowerLabel.includes('lname')) {
          mappedData.lastName = value;
        } else if (lowerLabel.includes('email')) {
          mappedData.email = value;
        } else if (lowerLabel.includes('phone')) {
          mappedData.phone = value;
        } else if (lowerLabel.includes('address')) {
          mappedData.address = value;
        } else if (lowerLabel.includes('city')) {
          mappedData.city = value;
        } else if (lowerLabel.includes('state')) {
          mappedData.state = value;
        } else if (lowerLabel.includes('zip')) {
          mappedData.zip = value;
        }
        // Store original data as well
        mappedData[fieldId] = value;
      });
    }
    
    console.log('Mapped form data:', mappedData);
    
    // Step 1: Create customer in FieldRoutes
    console.log('Step 1: Creating customer in FieldRoutes...');
    const customerData = {
      fname: mappedData.firstName || mappedData.fname || mappedData.first_name || '',
      lname: mappedData.lastName || mappedData.lname || mappedData.last_name || '',
      email: mappedData.email || '',
      phone: mappedData.phone || '',
      address: mappedData.address || '',
      city: mappedData.city || mappedData.new_field || '', // Handle custom field mappings
      state: mappedData.state || '',
      zip: mappedData.zip || mappedData.zipcode || ''
    };
    
    const fieldRoutesResponse = await axios.post(
      `${FIELDROUTES_BASE_URL}/api/customer/create`,
      customerData,
      {
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': FIELDROUTES_AUTH_KEY,
          'authenticationToken': FIELDROUTES_AUTH_TOKEN
        }
      }
    );
    
    // Handle FieldRoutes API response directly
    const responseData = fieldRoutesResponse.data;
    console.log('Full FieldRoutes response data:', responseData);
    
    // Try different possible response structures
    let fieldRoutesCustomerId = responseData?.customerID || 
                               responseData?.customer_id || 
                               responseData?.id || 
                               responseData?.customerId ||
                               responseData?.result?.customerID ||
                               responseData?.result?.customer_id ||
                               responseData?.result; // FieldRoutes returns customer ID directly in 'result' field
    
    console.log('Extracted customer ID:', fieldRoutesCustomerId);
    
    if (!fieldRoutesCustomerId) {
      console.error('Could not extract customer ID from response:', responseData);
      throw new Error('Failed to get customer ID from FieldRoutes response');
    }
    
    // Check if we have payment information from any of the new field types
    // Also check field mappings to find payment-related fields by their API names
    const paymentFieldTypes = ['credit-card', 'cvv', 'expiry-date'];
    const paymentApiNames = ['cardNumber', 'creditCard', 'cvv', 'expiry', 'expiryDate', 'paymentToken'];
    
    const hasPaymentInfo = Object.keys(mappedData).some(key => 
      // Check for payment-related keywords in field names
      key.includes('credit') || 
      key.includes('card') || 
      key.includes('cvv') || 
      key.includes('expiry') ||
      // Check if the mapped value matches payment API names
      paymentApiNames.includes(key) ||
      // Check if we have actual payment data values
      (mappedData[key] && typeof mappedData[key] === 'string' && (
        key === 'cardNumber' || 
        key === 'creditCard' || 
        key === 'paymentToken' ||
        // Look for credit card number patterns (digits with or without spaces)
        /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(mappedData[key]) ||
        // Look for CVV patterns (3-4 digits)
        /^\d{3,4}$/.test(mappedData[key]) ||
        // Look for expiry patterns (MM/YY or MMYY)
        /^(0[1-9]|1[0-2])\/?\d{2}$/.test(mappedData[key])
      ))
    );
    
    // If no payment info, we're done
    if (!hasPaymentInfo) {
      return res.json({
        success: true,
        data: {
          customerId: fieldRoutesCustomerId,
          message: 'Customer created successfully (no payment info provided)'
        }
      });
    }
    
    // Step 2: Create customer in Payrix
    console.log('Step 2: Creating customer in Payrix...');
    
    // Validate and format phone number for Payrix (5-15 numeric characters required)
    let phoneNumber = customerData.phone || '';
    // Remove non-numeric characters
    phoneNumber = phoneNumber.replace(/\D/g, '');
    // If phone is empty or too short, use a default or skip it
    if (!phoneNumber || phoneNumber.length < 5) {
      phoneNumber = '5555555555'; // Default phone number if none provided
    }
    // Limit to 15 characters max
    phoneNumber = phoneNumber.substring(0, 15);
    
    const payrixCustomerData = {
      merchant: process.env.PAYRIX_MERCHANT_ID,
      first: customerData.fname,
      last: customerData.lname,
      email: customerData.email,
      phone: phoneNumber,
      address1: customerData.address,
      city: customerData.city,
      state: customerData.state,
      zip: customerData.zip,
      country: 'USA',
      inactive: 0,
      frozen: 0
    };
    
    const payrixCustomerResponse = await axios.post(
      `${PAYRIX_API_BASE_URL}/customers`,
      payrixCustomerData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'APIKEY': PAYRIX_API_KEY
        }
      }
    );
    
    // Handle Payrix API response directly
    const payrixResponse = payrixCustomerResponse.data.response;
    if (payrixResponse.errors && payrixResponse.errors.length > 0) {
      const errorMessages = payrixResponse.errors.map(err => `${err.field}: ${err.msg}`).join(', ');
      throw new Error(`Payrix customer creation failed: ${errorMessages}`);
    }
    
    const payrixCustomerId = payrixResponse.data?.[0]?.id;
    console.log('✅ Payrix customer created successfully');
    
    if (!payrixCustomerId) {
      throw new Error('Failed to get customer ID from Payrix response - no customer data returned');
    }
    
    // Step 3: Create token in Payrix
    console.log('Step 3: Creating payment token in Payrix...');
    
    // Extract payment information from mapped data
    let cardNumber = null;
    let cvv = null;
    let expiry = null;
    let cardType = null;
    
    // Look for payment data in mapped fields
    Object.entries(mappedData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Credit card number detection
        if ((key.includes('card') || key.includes('credit') || key === 'cardNumber') && 
            /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value.replace(/\s/g, ''))) {
          cardNumber = value.replace(/\s/g, ''); // Remove spaces
        }
        // CVV detection
        else if ((key.includes('cvv') || key === 'cvv') && /^\d{3,4}$/.test(value)) {
          cvv = value;
        }
        // Expiry detection - check for various field names
        else if ((key.includes('expiry') || key.includes('expire') || key.includes('exp') || key === 'expiry' || key === 'expiryDate' || key === 'expire') && 
                 /^(0[1-9]|1[0-2])\/?\d{2}$/.test(value)) {
          expiry = value.replace('/', ''); // Remove slash for API
          // Convert MM/YY to MMYY format if needed
          if (expiry.length === 4) {
            expiry = expiry.substring(0, 2) + expiry.substring(2);
          }
        }
        // Card type detection
        else if (key.includes('cardtype') || key.includes('card_type') || key.includes('card-type') || key === 'cardType') {
          cardType = parseInt(value) || 2; // Default to Visa if invalid
        }
      }
    });
    
    const tokenData = {
      customer: payrixCustomerId,
      payment: {
        method: cardType || 2, // Use detected card type or default to Visa
        number: cardNumber || "378734493671000", // Use your test card number
        routing: "0"
      },
      expiration: expiry || "0123", // MMYY format
      name: `${customerData.fname} ${customerData.lname}`,
      description: "Lead Manager Token",
      custom: "Lead Manager Token",
      origin: 2,
      entryMode: 2,
      inactive: 0,
      frozen: 0
    };
    
    // Add CVV if we have it (some APIs expect it in the payment object)
    if (cvv) {
      tokenData.cvv = cvv;
    }
    
    // If we already have a token from the payment field, use it
    if (formData.paymentToken) {
      tokenData.omnitoken = formData.paymentToken;
    }
    
    const tokenResponse = await axios.post(
      `${PAYRIX_API_BASE_URL}/tokens`,
      tokenData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'APIKEY': PAYRIX_API_KEY
        }
      }
    );
    
    // Handle Payrix token response directly
    const payrixTokenResponse = tokenResponse.data.response;
    if (payrixTokenResponse.errors && payrixTokenResponse.errors.length > 0) {
      const errorMessages = payrixTokenResponse.errors.map(err => `${err.field}: ${err.msg}`).join(', ');
      throw new Error(`Payrix token creation failed: ${errorMessages}`);
    }
    
    const payrixTokenId = payrixTokenResponse.data?.[0]?.token; // Use 'token' field, not 'id'
    console.log('✅ Payrix token created successfully');
    
    if (!payrixTokenId) {
      throw new Error('Failed to get token value from Payrix response - no token data returned');
    }
    
    // Step 4: Add payment profile to FieldRoutes
    console.log('Step 4: Adding payment profile to FieldRoutes...');
    const paymentProfileData = {
      customerID: fieldRoutesCustomerId,
      merchantID: payrixTokenId, // Use merchantID as per documentation
      paymentMethod: 1, // Credit card
      gateway: "payrix",
      billingFname: customerData.fname,
      billingLname: customerData.lname,
      billingAddress: customerData.address,
      billingCity: customerData.city,
      billingState: customerData.state,
      billingZip: customerData.zip,
      billingCountryID: 'US'
    };
    
    const paymentProfileResponse = await axios.post(
      `${FIELDROUTES_BASE_URL}/api/paymentProfile/create`,
      paymentProfileData,
      {
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': FIELDROUTES_AUTH_KEY,
          'authenticationToken': FIELDROUTES_AUTH_TOKEN
        }
      }
    );
    
    if (!paymentProfileResponse.data.success) {
      throw new Error(paymentProfileResponse.data.error || 'Failed to create payment profile in FieldRoutes');
    }
    
    console.log('Payment profile created successfully');
    
    // Return success response
    res.json({
      success: true,
      data: {
        customerId: fieldRoutesCustomerId,
        payrixCustomerId: payrixCustomerId,
        tokenId: payrixTokenId,
        message: 'Lead submitted successfully with payment information'
      }
    });
    
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process lead submission'
    });
  }
});

module.exports = router;