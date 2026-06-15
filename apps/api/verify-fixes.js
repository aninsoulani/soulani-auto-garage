const http = require('http');

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1${path}`,
      method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 'ERROR', error: err.message });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function verify() {
  console.log('--- Post-Fix API Verification ---');
  
  // 1. Check vehicles API with type=SALE
  const vehiclesRes = await makeRequest('/vehicles?type=SALE');
  console.log(`\n[GET /vehicles?type=SALE] Status: ${vehiclesRes.status}`);
  if (vehiclesRes.status === 200) {
    const raw = JSON.parse(vehiclesRes.body);
    const payload = raw.data; // Interceptor unwrapping
    const items = payload.data || []; // Service unwrapping
    console.log(`Count returned: ${items.length}`);
    const types = new Set(items.map(v => v.type));
    console.log(`Types included: ${Array.from(types).join(', ')}`);
  }

  // 2. Throttling check on GET /vehicles (make 6 fast requests to ensure it passes)
  let passed = 0;
  for (let i = 0; i < 6; i++) {
    const res = await makeRequest('/vehicles?limit=1');
    if (res.status === 200) passed++;
  }
  console.log(`\n[Throttling] GET /vehicles x6 -> Successful requests: ${passed}/6`);

  // 3. Analytics API check
  const analyticsRes = await makeRequest('/analytics/vehicles/1/track-view', 'POST');
  console.log(`\n[POST /analytics/vehicles/1/track-view] Status: ${analyticsRes.status}`);

  // 4. Leads API check
  const leadPayload = JSON.stringify({
    vehicleId: 1,
    name: "Test",
    phone: "08123456789",
    type: "MAKE_OFFER",
    offeredPrice: 100
  });

  let leadStatuses = [];
  for (let i = 0; i < 6; i++) {
    const res = await makeRequest('/leads', 'POST', leadPayload);
    leadStatuses.push(res.status);
  }
  console.log(`\n[Throttling] POST /leads x6 -> Statuses: ${leadStatuses.join(', ')}`);
}

verify();
