const express = require('express');
const axios = require('axios');
const router = express.Router();

// Payrix API configuration
const PAYRIX_API_BASE_URL = 'https://payapi.fieldroutes.com';
const PAYRIX_API_KEY = process.env.PAYRIX_API_KEY;
const PAYRIX_MERCHANT_ID = process.env.PAYRIX_MERCHANT_ID;

// Create customer in Payrix
router.post('/customers', async (req, res) => {
  try {
    console.log('Creating Payrix customer:', req.body);
    
    // Ensure merchant ID is set
    const customerData = {
      ...req.body,
      merchant: req.body.merchant || PAYRIX_MERCHANT_ID
    };
    
    const response = await axios.post(`${PAYRIX_API_BASE_URL}/customers`, customerData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'APIKEY': PAYRIX_API_KEY
      }
    });
    
    console.log('Payrix customer created:', response.data);
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Payrix customer creation error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Create token in Payrix
router.post('/tokens', async (req, res) => {
  try {
    console.log('Creating Payrix token:', req.body);
    
    const response = await axios.post(`${PAYRIX_API_BASE_URL}/tokens`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'APIKEY': PAYRIX_API_KEY
      }
    });
    
    console.log('Payrix token created:', response.data);
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Payrix token creation error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get customer
router.get('/customers/:customerId', async (req, res) => {
  try {
    const response = await axios.get(`${PAYRIX_API_BASE_URL}/customers/${req.params.customerId}`, {
      headers: {
        'Accept': 'application/json',
        'APIKEY': PAYRIX_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Payrix get customer error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get token
router.get('/tokens/:tokenId', async (req, res) => {
  try {
    const response = await axios.get(`${PAYRIX_API_BASE_URL}/tokens/${req.params.tokenId}`, {
      headers: {
        'Accept': 'application/json',
        'APIKEY': PAYRIX_API_KEY
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Payrix get token error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;