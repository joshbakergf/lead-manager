// Test the new API key: e2a939a812a993b301abda5b32705d5f
// Run with: node test-new-api-key.js

const testNewAPIKey = async () => {
  const newApiKey = 'e2a939a812a993b301abda5b32705d5f';
  const merchantId = 'p1_mer_6201d3033649a2e4c1199df';
  
  console.log('Testing NEW API key:', newApiKey);
  console.log('Merchant ID:', merchantId);
  
  // Test 1: Payrix API
  try {
    console.log('\n=== Test 1: Payrix API with new key ===');
    
    const response = await fetch(`https://api.payrix.com/merchants/${merchantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Payrix Response status:', response.status);
    const result = await response.text();
    console.log('Payrix Response:', result);
    
    if (response.ok) {
      console.log('✅ NEW API key works with Payrix!');
    } else {
      console.log('❌ Still issues with Payrix API');
    }
    
  } catch (error) {
    console.error('Payrix error:', error.message);
  }
  
  // Test 2: NMI Gateway
  try {
    console.log('\n=== Test 2: NMI Gateway with new key ===');
    
    const nmiResponse = await fetch('https://secure.nmi.com/api/query.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'security_key': newApiKey,
        'type': 'query',
        'condition': 'pending'
      })
    });
    
    console.log('NMI Response status:', nmiResponse.status);
    const nmiResult = await nmiResponse.text();
    console.log('NMI Response:', nmiResult);
    
    if (nmiResult.includes('error_response')) {
      console.log('❌ NMI key still not recognized');
    } else {
      console.log('✅ NEW API key might work with NMI!');
    }
    
  } catch (error) {
    console.error('NMI error:', error.message);
  }
  
  // Test 3: Try Payrix transaction endpoint
  try {
    console.log('\n=== Test 3: Payrix Transaction Test ===');
    
    const transactionData = {
      merchant: merchantId,
      total: 100,
      type: 'auth'
    };
    
    const response = await fetch('https://api.payrix.com/txns', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    console.log('Transaction Response status:', response.status);
    const result = await response.text();
    console.log('Transaction Response:', result);
    
  } catch (error) {
    console.error('Transaction error:', error.message);
  }
};

testNewAPIKey();