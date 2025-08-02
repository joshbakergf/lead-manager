// Test script to check if customer ID 885237 exists
// Run with: node test-customer-lookup.js

const testCustomerLookup = async () => {
  const customerID = 885237;
  
  try {
    console.log('Testing customer lookup...');
    console.log('Customer ID:', customerID);

    const response = await fetch(`https://goforth.pestroutes.com/api/customer/get?customerID=${customerID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
    });

    console.log('Response status:', response.status);
    
    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ SUCCESS: Customer lookup completed');
      try {
        const jsonResult = JSON.parse(result);
        console.log('Customer exists:', jsonResult.success);
        if (jsonResult.success && jsonResult.result && jsonResult.result.length > 0) {
          console.log('Customer details:', jsonResult.result[0]);
        }
      } catch (e) {
        console.log('Result is not JSON, raw response:', result);
      }
    } else {
      console.log('❌ FAILED: Customer lookup failed');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

// Also test creating a new customer first
const testCreateCustomer = async () => {
  const customerData = {
    fname: 'Test',
    lname: 'Customer',
    email: 'test@example.com',
    phone: '5551234567',
    address: '123 Test St',
    city: 'Test City',
    state: 'NC',
    zip: '12345',
  };

  try {
    console.log('\n=== Testing customer creation ===');
    console.log('Customer data:', customerData);

    const response = await fetch('https://goforth.pestroutes.com/api/customer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
      body: JSON.stringify(customerData),
    });

    console.log('Response status:', response.status);
    
    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ SUCCESS: Customer creation completed');
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success && jsonResult.result && jsonResult.result.length > 0) {
          const newCustomerID = jsonResult.result[0].customerID;
          console.log('New customer ID:', newCustomerID);
          return newCustomerID;
        }
      } catch (e) {
        console.log('Result is not JSON, raw response:', result);
      }
    } else {
      console.log('❌ FAILED: Customer creation failed');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
  return null;
};

// Run the tests
(async () => {
  await testCustomerLookup();
  const newCustomerID = await testCreateCustomer();
  
  if (newCustomerID) {
    console.log(`\n=== Now testing payment profile with new customer ID: ${newCustomerID} ===`);
    // Test payment profile creation with new customer
    const testToken = `test_tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      customerID: newCustomerID,
      creditCardToken: testToken,
      billingFname: 'Test',
      billingLname: 'Customer',
      billingAddress: '123 Test St',
      billingCity: 'Test City',
      billingState: 'NC',
      billingZip: '12345',
    };

    try {
      const response = await fetch('https://goforth.pestroutes.com/api/customer/createPaymentProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
          'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.text();
      console.log('Payment profile response:', result);
      
      try {
        const jsonResult = JSON.parse(result);
        console.log('Payment profile success:', jsonResult.success);
        console.log('Payment profile error:', jsonResult.errorMessage);
      } catch (e) {
        console.log('Result is not JSON');
      }
    } catch (error) {
      console.error('Payment profile error:', error.message);
    }
  }
})();