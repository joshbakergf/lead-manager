const express = require('express');
const axios = require('axios');
const router = express.Router();

// FieldRoutes API configuration
const FIELDROUTES_BASE_URL = process.env.FIELDROUTES_BASE_URL || 'https://api.fieldroutes.com';
const FIELDROUTES_AUTH_KEY = process.env.FIELDROUTES_AUTH_KEY;
const FIELDROUTES_AUTH_TOKEN = process.env.FIELDROUTES_AUTH_TOKEN;

// Helper function to make FieldRoutes API requests
async function makeFieldRoutesRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${FIELDROUTES_BASE_URL}/api${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': FIELDROUTES_AUTH_KEY,
        'authenticationToken': FIELDROUTES_AUTH_TOKEN
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    console.log('FieldRoutes API request:', { endpoint, method, data });
    const response = await axios(config);
    
    console.log('FieldRoutes raw response:', response.data);
    
    return {
      success: true,
      data: response.data,
      rawResponse: response.data // Keep raw response for debugging
    };
  } catch (error) {
    console.error('FieldRoutes API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Create customer
router.post('/customer/create', async (req, res) => {
  try {
    const result = await makeFieldRoutesRequest('/customer/create', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search customers
router.get('/customer/search', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const result = await makeFieldRoutesRequest(`/customer/search?${queryParams}`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer
router.get('/customer/get/:customerId', async (req, res) => {
  try {
    const result = await makeFieldRoutesRequest(`/customer/get?customerID=${req.params.customerId}`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer
router.post('/customer/update', async (req, res) => {
  try {
    const result = await makeFieldRoutesRequest('/customer/update', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create payment profile
router.post('/customer/createPaymentProfile', async (req, res) => {
  try {
    const result = await makeFieldRoutesRequest('/paymentProfile/create', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update payment profile
router.post('/customer/updatePaymentProfile', async (req, res) => {
  try {
    const result = await makeFieldRoutesRequest('/customer/updatePaymentProfile', 'POST', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;