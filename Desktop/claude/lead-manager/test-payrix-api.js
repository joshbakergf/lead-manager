// Test Payrix API key directly
// Run with: node test-payrix-api.js

const testPayrixAPI = async () => {
  const apiKey = 'c768cb4b495d4cb89723f776ab93d6e4';
  const merchantId = 'p1_mer_6201d3033649a2e4c1199df';
  
  console.log('Testing Payrix API key:', apiKey);
  console.log('Testing Merchant ID:', merchantId);
  
  // Test 1: Try to get merchant info
  try {
    console.log('\n=== Test 1: Get Merchant Info ===');
    
    const response = await fetch(`https://api.payrix.com/merchants/${merchantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Merchant info retrieved successfully');
    } else {
      console.log('❌ Failed to get merchant info');
    }
    
  } catch (error) {
    console.error('Error getting merchant info:', error.message);
  }
  
  // Test 2: Try different API endpoints
  try {
    console.log('\n=== Test 2: Test Root API ===');
    
    const response = await fetch('https://api.payrix.com/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Root API Response status:', response.status);
    const result = await response.text();
    console.log('Root API Response:', result);
    
  } catch (error) {
    console.error('Error with root API:', error.message);
  }
  
  // Test 3: Try to create a test transaction
  try {
    console.log('\n=== Test 3: Test Transaction Creation ===');
    
    const transactionData = {
      merchant: merchantId,
      total: 100, // $1.00 in cents
      type: 'auth'
    };
    
    const response = await fetch('https://api.payrix.com/txns', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    console.log('Transaction Response status:', response.status);
    const result = await response.text();
    console.log('Transaction Response:', result);
    
  } catch (error) {
    console.error('Error creating transaction:', error.message);
  }
};

// Run the test
testPayrixAPI();