// Test script to create a payment profile for customer ID 885237
// Run with: node test-payment-profile.js

const testPaymentProfile = async () => {
  const customerID = 885237;
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

  try {
    console.log('Testing payment profile creation...');
    console.log('Customer ID:', customerID);
    console.log('Test token:', testToken);
    console.log('Payment data:', paymentData);

    const response = await fetch('https://goforth.pestroutes.com/api/customer/createPaymentProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
      body: JSON.stringify(paymentData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ SUCCESS: Payment profile created successfully');
      try {
        const jsonResult = JSON.parse(result);
        console.log('Parsed result:', jsonResult);
      } catch (e) {
        console.log('Result is not JSON, raw response:', result);
      }
    } else {
      console.log('❌ FAILED: Payment profile creation failed');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

// Run the test
testPaymentProfile();