// Test complete workflow: create customer, then add payment profile
// Run with: node test-full-workflow.js

const testFullWorkflow = async () => {
  // Step 1: Create a new customer
  const customerData = {
    fname: 'John',
    lname: 'Doe',
    email: `test${Date.now()}@example.com`, // Unique email
    phone: '5551234567',
    address: '123 Main St',
    city: 'Charlotte',
    state: 'NC',
    zip: '28205',
  };

  try {
    console.log('=== Step 1: Creating new customer ===');
    console.log('Customer data:', customerData);

    const customerResponse = await fetch('https://goforth.pestroutes.com/api/customer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
      body: JSON.stringify(customerData),
    });

    const customerResult = await customerResponse.text();
    console.log('Customer creation response:', customerResult);
    
    const customerJson = JSON.parse(customerResult);
    
    if (customerJson.success) {
      const newCustomerID = customerJson.result; // Result is a string with the customer ID
      console.log('✅ Customer created successfully with ID:', newCustomerID);
      
      // Step 2: Create payment profile for the new customer
      console.log('\n=== Step 2: Creating payment profile ===');
      
      const testToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentData = {
        customerID: parseInt(newCustomerID), // Convert to number
        creditCardToken: testToken,
        billingFname: customerData.fname,
        billingLname: customerData.lname,
        billingAddress: customerData.address,
        billingCity: customerData.city,
        billingState: customerData.state,
        billingZip: customerData.zip,
      };

      console.log('Payment profile data:', paymentData);

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
      
      if (paymentJson.success) {
        console.log('✅ SUCCESS: Payment profile created successfully!');
        console.log('Payment profile result:', paymentJson.result);
      } else {
        console.log('❌ FAILED: Payment profile creation failed');
        console.log('Error message:', paymentJson.errorMessage);
        console.log('Full response:', paymentJson);
      }
      
      return { customerID: newCustomerID, paymentSuccess: paymentJson.success };
      
    } else {
      console.log('❌ Failed to create customer');
      console.log('Error:', customerJson.errorMessage);
      return null;
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return null;
  }
};

// Run the test
testFullWorkflow().then(result => {
  if (result) {
    console.log('\n=== Final Results ===');
    console.log('Customer ID:', result.customerID);
    console.log('Payment Profile Success:', result.paymentSuccess);
  } else {
    console.log('\n=== Test Failed ===');
  }
});