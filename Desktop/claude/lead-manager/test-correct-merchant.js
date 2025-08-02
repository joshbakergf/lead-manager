// Test with correct merchant ID: 2a16bd420c2238b047cece90488f49df
// Run with: node test-correct-merchant.js

const testCorrectMerchant = async () => {
  // Test 1: Try the Payrix API with correct merchant ID
  try {
    console.log('=== Testing Payrix API with correct merchant ID ===');
    const merchantId = '2a16bd420c2238b047cece90488f49df';
    const apiKey = 'e2a939a812a993b301abda5b32705d5f';
    
    console.log('Merchant ID:', merchantId);
    console.log('API Key:', apiKey.substring(0, 8) + '...');
    
    // Try different Payrix endpoints
    const endpoints = [
      { url: `https://api.payrix.com/merchants/${merchantId}`, method: 'GET' },
      { url: 'https://api.payrix.com/txns', method: 'POST', body: { merchant: merchantId, total: 100, type: 'auth' } }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint.method} ${endpoint.url}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      try {
        const response = await fetch(endpoint.url, options);
        console.log('Status:', response.status);
        const result = await response.text();
        console.log('Response:', result.substring(0, 200) + '...');
      } catch (error) {
        console.error('Request error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  // Test 2: Create FieldRoutes payment profile with correct merchant ID
  console.log('\n=== Testing FieldRoutes with correct merchant ID ===');
  
  try {
    // First create a customer
    const customerResponse = await fetch('https://goforth.pestroutes.com/api/customer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
      body: JSON.stringify({
        fname: 'Merchant',
        lname: 'Test',
        email: `merchant${Date.now()}@test.com`,
        officeID: 13
      }),
    });
    
    const customerResult = await customerResponse.json();
    
    if (customerResult.success) {
      const customerID = parseInt(customerResult.result);
      console.log('Customer created:', customerID);
      
      // Create payment profile with correct merchant ID
      const paymentData = {
        customerID: customerID,
        autopay: 1,
        paymentMethod: "1",
        merchantID: "2a16bd420c2238b047cece90488f49df", // Correct merchant ID
        merchantToken: `t1_tok_${Date.now()}_test`,
        gateway: "payrix",
        officeID: 13
      };
      
      console.log('Creating payment profile with:', paymentData);
      
      const paymentResponse = await fetch('https://goforth.pestroutes.com/api/paymentProfile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
          'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
        },
        body: JSON.stringify(paymentData),
      });
      
      const paymentResult = await paymentResponse.json();
      console.log('Payment profile result:', paymentResult.success ? '✅ Success' : '❌ Failed');
      console.log('Error:', paymentResult.errorMessage || 'None');
    }
    
  } catch (error) {
    console.error('FieldRoutes test error:', error.message);
  }
};

testCorrectMerchant();