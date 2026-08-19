// test-auth-privacy.js
import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Auth & Privacy API Verification Tests...\n');

  try {
    // 1. Check Status
    console.log('1️⃣ Testing GET /api/auth/status...');
    const statusRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/status',
      method: 'GET'
    });
    console.log('Status Response:', statusRes);
    if (statusRes.status !== 200) throw new Error('Status check failed');

    // 2. Login with Default PIN '1234'
    console.log('\n2️⃣ Testing POST /api/auth/login with default PIN 1234...');
    const loginRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { pin: '1234' });
    console.log('Login Response:', { status: loginRes.status, success: !!loginRes.data.token });
    if (!loginRes.data.token) throw new Error('Login failed to yield token');

    const token = loginRes.data.token;

    // 3. Verify Token
    console.log('\n3️⃣ Testing POST /api/auth/verify with obtained token...');
    const verifyRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token });
    console.log('Verify Response:', verifyRes.data);
    if (!verifyRes.data.valid) throw new Error('Token verification failed');

    // 4. Update Settings
    console.log('\n4️⃣ Testing POST /api/auth/update-settings (privacy mode)...');
    const updateRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/update-settings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { privacyMode: 'privacy', ownerName: 'Subham' });
    console.log('Update Settings Response:', updateRes.data);

    console.log('\n🎉 ALL AUTH & PRIVACY TESTS PASSED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
