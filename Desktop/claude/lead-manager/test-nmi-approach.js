// Test NMI Gateway approach since FieldRoutes mentioned nmiTokenizationKey
// Based on the original PHP code that used nmiServiceProvider

const testNMIApproach = async () => {
  console.log('=== Testing NMI Gateway Approach ===');
  
  // The original FieldRoutes code mentioned:
  // nmiTokenizationKey and nmiServiceProvider
  // This suggests they use NMI Gateway, not Payrix directly
  
  console.log('Original FieldRoutes integration clues:');
  console.log('- nmiTokenizationKey (mentioned in PHP)');
  console.log('- nmiServiceProvider (mentioned in PHP)');
  console.log('- Payrix might be the processor, but NMI is the gateway');
  
  // Test if we can access NMI's API with our credentials
  try {
    console.log('\n=== Testing NMI Gateway API ===');
    
    // NMI uses different endpoints
    const nmiResponse = await fetch('https://secure.nmi.com/api/query.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'security_key': 'c768cb4b495d4cb89723f776ab93d6e4', // Try our key with NMI
        'type': 'query',
        'condition': 'pending'
      })
    });
    
    console.log('NMI Response status:', nmiResponse.status);
    const nmiResult = await nmiResponse.text();
    console.log('NMI Response:', nmiResult);
    
  } catch (error) {
    console.error('NMI test error:', error.message);
  }
  
  // Check if the key might be for a different service
  console.log('\n=== Key Analysis ===');
  console.log('API Key length:', 'c768cb4b495d4cb89723f776ab93d6e4'.length);
  console.log('API Key format: 32 character hex string');
  console.log('This looks like a standard API key format');
  
  console.log('\n=== Recommendations ===');
  console.log('1. Check if this is a sandbox vs production key');
  console.log('2. Verify the merchant account is active');
  console.log('3. Check if NMI Gateway is the actual payment processor');
  console.log('4. Look for Payrix dashboard access with merchant ID:', 'p1_mer_6201d3033649a2e4c1199df');
  console.log('5. Contact Payrix support to verify credentials');
};

testNMIApproach();