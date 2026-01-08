const API_URL = 'http://localhost:5000/api/v1';

async function testFeeApi() {
  try {
    console.log('🔐 Step 1: Logging in with admin credentials...\n');

    // Step 1: Login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@weberacademy.edu',
        password: 'Admin@12345',
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    console.log('✅ Login successful');
    console.log(`   Access Token: ${loginData.data.accessToken.substring(0, 50)}...`);
    console.log(`   User: ${loginData.data.user.email}`);
    console.log(`   School ID: ${loginData.data.user.schoolId}\n`);

    const accessToken = loginData.data.accessToken;

    // Step 2: Call fee structures API
    console.log('📝 Step 2: Calling /api/v1/fees/structure API...\n');

    const feeResponse = await fetch(`${API_URL}/fees/structure?page=0&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const feeData = await feeResponse.json();
    const responseText = JSON.stringify(feeData);

    console.log('✅ API Response received');
    console.log(`   Status: ${feeResponse.status}`);
    console.log(`   Response size: ${responseText.length} bytes`);
    console.log(`   Success: ${feeData.success}`);
    console.log(`   Total records: ${feeData.total}`);
    console.log(`   Data array length: ${feeData.data?.length || 0}`);

    if (feeData.data && feeData.data.length > 0) {
      console.log(`\n📦 First fee structure:`);
      console.log(JSON.stringify(feeData.data[0], null, 2));
    } else {
      console.log('\n⚠️  No fee structures returned!\n');
      console.log('Full response:');
      console.log(JSON.stringify(feeData, null, 2));
    }

  } catch (error: any) {
    console.error('\n❌ Error:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

testFeeApi();
