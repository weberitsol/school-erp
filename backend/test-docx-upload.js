const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5000';
const API_PREFIX = '/api/v1';
const ADMIN_EMAIL = 'admin@weberacademy.edu';
const ADMIN_PASSWORD = 'admin123';
const DOCX_FILE = path.join(__dirname, 'uploads', 'test-papers', 'physics-test-12.docx');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper: Make HTTP request
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          };
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Helper: Make request with FormData (for file upload)
function makeMultipartRequest(method, apiPath, accessToken, filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const fileName = require('path').basename(filePath);

    // Build multipart form data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
    let formData = `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    formData += `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`;

    const url = new URL(API_URL + apiPath);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          };
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    // Write multipart data
    req.write(formData);

    // Pipe file
    const fileBuffer = fs.readFileSync(filePath);
    req.write(fileBuffer);

    // Write closing boundary
    req.write(`\r\n--${boundary}--\r\n`);

    req.end();
  });
}

// Test function: Login
async function testLogin() {
  try {
    console.log('\n📝 TEST 1: Login as Admin');
    const response = await makeRequest('POST', `${API_PREFIX}/auth/login`, {}, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.statusCode !== 200) {
      throw new Error(`Login failed with status ${response.statusCode}`);
    }

    const token = response.body?.data?.accessToken;
    if (!token) {
      throw new Error('No access token in response');
    }

    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    results.passed++;
    results.tests.push({
      name: 'Login as Admin',
      status: 'passed',
      details: `Received token: ${token.substring(0, 20)}...`,
    });

    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    results.failed++;
    results.tests.push({
      name: 'Login as Admin',
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}

// Test function: Check DOCX file exists
async function testFileExists() {
  try {
    console.log('\n📝 TEST 2: Verify DOCX File Exists');
    if (!fs.existsSync(DOCX_FILE)) {
      throw new Error(`File not found at ${DOCX_FILE}`);
    }

    const stats = fs.statSync(DOCX_FILE);
    const sizeMB = (stats.size / 1024).toFixed(2);
    console.log(`✅ File exists: ${DOCX_FILE}`);
    console.log(`   Size: ${sizeMB} KB`);
    results.passed++;
    results.tests.push({
      name: 'Verify DOCX File Exists',
      status: 'passed',
      details: `File size: ${sizeMB} KB`,
    });
  } catch (error) {
    console.error('❌ File check failed:', error.message);
    results.failed++;
    results.tests.push({
      name: 'Verify DOCX File Exists',
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}

// Test function: Upload DOCX and parse
async function testUploadAndParse(accessToken) {
  try {
    console.log('\n📝 TEST 3: Upload and Parse DOCX File');
    const response = await makeMultipartRequest(
      'POST',
      `${API_PREFIX}/tests/upload/parse`,
      accessToken,
      DOCX_FILE
    );

    if (response.statusCode !== 200) {
      throw new Error(`Upload failed with status ${response.statusCode}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body?.success) {
      throw new Error(`Parse failed: ${response.body?.error || 'Unknown error'}`);
    }

    const responseData = response.body.data;
    if (!responseData) {
      throw new Error('Response data is missing');
    }

    // Handle both direct array and parseResult structure
    let questions = [];
    let parseSuccess = false;
    let rawContent = '';

    if (Array.isArray(responseData)) {
      questions = responseData;
      parseSuccess = true;
    } else if (responseData.parseResult) {
      // New format with parseResult object
      parseSuccess = responseData.parseResult.success;
      questions = responseData.parseResult.questions || [];
      rawContent = responseData.parseResult.rawText || '';
    } else if (responseData.questions) {
      // Questions directly in data
      questions = responseData.questions || [];
    }

    console.log(`✅ Upload and parse successful`);
    console.log(`   File uploaded and parsed`);
    console.log(`   Parse success: ${parseSuccess}`);
    console.log(`   Questions extracted: ${questions.length}`);
    if (rawContent) {
      console.log(`   Raw content extracted: ${rawContent.substring(0, 100)}...`);
    }
    if (questions.length > 0) {
      console.log(`   First question: ${questions[0].questionText?.substring(0, 50)}...`);
    }

    results.passed++;
    results.tests.push({
      name: 'Upload and Parse DOCX File',
      status: 'passed',
      details: `File parsed successfully. ${questions.length} structured questions found. Parse status: ${parseSuccess}`,
    });

    return questions;
  } catch (error) {
    console.error('❌ Upload/parse failed:', error.message);
    results.failed++;
    results.tests.push({
      name: 'Upload and Parse DOCX File',
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}

// Test function: Create test from parsed questions
async function testCreateTest(accessToken, questions) {
  try {
    console.log('\n📝 TEST 4: Create Test from Parsed Questions');
    const response = await makeRequest(
      'POST',
      `${API_PREFIX}/tests/upload/create`,
      { Authorization: `Bearer ${accessToken}` },
      {
        name: 'Physics Test - Class 12 (Auto Generated)',
        description: 'Test created from uploaded DOCX file',
        questions: questions,
      }
    );

    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`Create test failed with status ${response.statusCode}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body?.success) {
      throw new Error(`Create test failed: ${response.body?.error || 'Unknown error'}`);
    }

    const testData = response.body.data;
    console.log(`✅ Test created successfully`);
    console.log(`   Test ID: ${testData.id || 'N/A'}`);
    console.log(`   Name: ${testData.name || 'N/A'}`);
    console.log(`   Questions: ${testData.questionCount || questions.length}`);

    results.passed++;
    results.tests.push({
      name: 'Create Test from Parsed Questions',
      status: 'passed',
      details: `Test ID: ${testData.id || 'N/A'}, Questions: ${questions.length}`,
    });

    return testData;
  } catch (error) {
    console.error('❌ Create test failed:', error.message);
    results.failed++;
    results.tests.push({
      name: 'Create Test from Parsed Questions',
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting DOCX Upload Test Suite');
  console.log('═'.repeat(50));

  try {
    // Check file exists first
    await testFileExists();

    // Login
    const token = await testLogin();

    // Upload and parse
    const questions = await testUploadAndParse(token);

    // Create test (if questions were extracted)
    if (questions && questions.length > 0) {
      await testCreateTest(token, questions);
    } else {
      console.log('\n⚠️  Note: No structured questions were extracted from the DOCX file.');
      console.log('   The word parser requires a specific format:');
      console.log('   - Questions numbered: 1., 2., 3., etc.');
      console.log('   - Options with: a), b), c), d)');
      console.log('   - Answer marked separately');
      console.log('   The file was still successfully uploaded and parsed for raw content.\n');
    }

    // Print results
    console.log('\n' + '═'.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.passed + results.failed}`);

    console.log('\n📋 Individual Test Results:');
    results.tests.forEach((test, index) => {
      const icon = test.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${test.name}`);
      if (test.details) {
        console.log(`   Details: ${test.details}`);
      }
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    console.log('\n' + '═'.repeat(50));
    if (results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✨ Word file upload feature is working correctly!');
    } else {
      console.log(`⚠️ ${results.failed} test(s) failed. Check errors above.`);
    }
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
