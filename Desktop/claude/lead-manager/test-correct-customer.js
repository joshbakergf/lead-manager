// Test script with correct customer ID 858237
// Run with: node test-correct-customer.js

const testWithCorrectCustomer = async () => {
  const customerID = 858237; // Corrected customer ID
  
  // First check if this customer exists
  try {
    console.log('=== Testing customer lookup for ID 858237 ===');
    
    const lookupResponse = await fetch(`https://goforth.pestroutes.com/api/customer/get?customerID=${customerID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
    });

    const lookupResult = await lookupResponse.text();
    console.log('Customer lookup response:', lookupResult);
    
    const lookupJson = JSON.parse(lookupResult);
    console.log('Customer exists:', lookupJson.success);
    console.log('Customer count:', lookupJson.count);
    
    if (lookupJson.success && lookupJson.count > 0) {
      console.log('✅ Customer 858237 exists, proceeding with payment profile test...');
      
      // Now test payment profile creation
      const testToken = `test_tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        customerID: customerID,
        creditCardToken: testToken,
        billingFname: 'Test',
        billingLname: 'Customer',
        billingAddress: '123 Test St',
        billingCity: 'Test City',
        billingState: 'NC',
        billingZip: '12345',
      };

      console.log('\n=== Testing payment profile creation ===');
      console.log('Payment data:', paymentData);

      const paymentResponse = await fetch('https://goforth.pestroutes.com/api/customer/createPaymentProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
          'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
        },
        body: JSON.stringify(paymentData),
      });

      const paymentResult = await paymentResponse.text();
      console.log('Payment profile response:', paymentResult);
      
      const paymentJson = JSON.parse(paymentResult);
      console.log('Payment profile success:', paymentJson.success);
      console.log('Payment profile error:', paymentJson.errorMessage);
      
      if (paymentJson.success) {
        console.log('✅ SUCCESS: Payment profile created successfully!');
      } else {
        console.log('❌ FAILED: Payment profile creation failed');
        console.log('Error details:', paymentJson.errorMessage);
      }
      
    } else {
      console.log('❌ Customer 858237 does not exist');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

// Run the test
testWithCorrectCustomer();