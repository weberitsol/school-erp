const API_URL = 'http://localhost:5000/api/v1';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true, message: 'PASSED' });
  } catch (error: any) {
    results.push({ name, passed: false, message: error.message });
  }
}

async function main() {
  let accessToken: string;
  let schoolId: string;

  try {
    // 1. Login
    await test('Login with admin credentials', async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@weberacademy.edu',
          password: 'Admin@12345',
        }),
      });
      if (!res.ok) throw new Error(`Login failed: ${res.status}`);
      const data = await res.json();
      accessToken = data.data.accessToken;
      schoolId = data.data.user.schoolId;
    });

    // 2. Get fee structures
    await test('Get fee structures (paginated)', async () => {
      const res = await fetch(`${API_URL}/fees/structure?page=0&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('API returned success:false');
      if (data.data.length === 0) throw new Error('No fee structures returned');
      if (data.total === 0) throw new Error('Total count is 0');
    });

    // 3. Get specific fee structure
    let feeStructureId: string;
    await test('Get single fee structure by ID', async () => {
      const res = await fetch(`${API_URL}/fees/structure?limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      feeStructureId = data.data[0].id;

      const res2 = await fetch(`${API_URL}/fees/structure/${feeStructureId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res2.ok) throw new Error(`Failed: ${res2.status}`);
      const data2 = await res2.json();
      if (!data2.data) throw new Error('No data returned');
    });

    // 4. Update fee structure
    await test('Update fee structure', async () => {
      const res = await fetch(`${API_URL}/fees/structure/${feeStructureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
    });

    // 5. Get pending dues
    await test('Get pending dues', async () => {
      const res = await fetch(`${API_URL}/fees/dues`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('API returned success:false');
    });

    // 6. Get payment report
    await test('Get payment report', async () => {
      const dateFrom = new Date('2024-01-01').toISOString();
      const dateTo = new Date().toISOString();
      const res = await fetch(
        `${API_URL}/fees/report?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
    });

    // 7. Get invoices
    await test('Get invoices', async () => {
      const res = await fetch(`${API_URL}/invoices?page=0&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
    });

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('Finance API Integration Test Results');
    console.log('='.repeat(60) + '\n');

    let passed = 0;
    let failed = 0;

    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (!result.passed) {
        console.log(`   └─ ${result.message}`);
        failed++;
      } else {
        passed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60) + '\n');

    if (failed === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
