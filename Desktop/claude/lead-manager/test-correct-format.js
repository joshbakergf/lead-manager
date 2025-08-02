// Test with the correct FieldRoutes format from the example
// Run with: node test-correct-format.js

const testCorrectFormat = async () => {
  // Step 1: Create a customer
  const customerData = {
    fname: 'Test',
    lname: 'Payment',
    email: `testpayment${Date.now()}@example.com`,
    officeID: 13
  };

  try {
    console.log('=== Step 1: Creating customer ===');
    const customerResponse = await fetch('https://goforth.pestroutes.com/api/customer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
        'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
      },
      body: JSON.stringify(customerData),
    });

    const customerResult = await customerResponse.json();
    console.log('Customer creation:', customerResult.success ? '✅ Success' : '❌ Failed');
    
    if (customerResult.success) {
      const customerID = parseInt(customerResult.result);
      console.log('Customer ID:', customerID);
      
      // Step 2: Create payment profile with correct format
      console.log('\n=== Step 2: Creating payment profile ===');
      
      // Use a properly formatted Payrix token (from the example)
      const paymentProfileData = {
        customerID: customerID,
        autopay: 1,
        paymentMethod: "1", // Credit card
        merchantID: "bc81c20b040b18afc9bc5a0f2880ecab", // From example
        merchantToken: `t1_tok_${Date.now()}_test`, // Simulate Payrix token format
        gateway: "payrix",
        officeID: 13
      };
      
      console.log('Payment profile data:', paymentProfileData);
      
      const paymentResponse = await fetch('https://goforth.pestroutes.com/api/paymentProfile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
          'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
        },
        body: JSON.stringify(paymentProfileData),
      });

      const paymentResult = await paymentResponse.json();
      console.log('Payment profile creation:', paymentResult.success ? '✅ Success' : '❌ Failed');
      console.log('Response:', paymentResult);
      
      // Step 3: Search for payment profiles
      if (paymentResult.success) {
        console.log('\n=== Step 3: Searching payment profiles ===');
        
        const searchUrl = `https://goforth.pestroutes.com/api/paymentProfile/search?` + 
          `includeData=1&customerIDs[]=${customerID}&officeIDs=0`;
        
        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'authenticationKey': 'iouusgn96q5aub1crp4hkq33f41boelmnji7e6nkbvbdvsdnma2k3h96uu3dr5li',
            'authenticationToken': '2cpqqapb4ulfgg87g4a83ikd3n4b3bmdhjtit9nvpt9uaeq1i5uta2f0mpol5smp',
          },
        });
        
        const searchResult = await searchResponse.json();
        console.log('Payment profiles found:', searchResult);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run the test
testCorrectFormat();