const http = require('http');

async function makeRequest(i) {
  return new Promise((resolve) => {
    http.get('http://localhost:3001/api/v1/vehicles?type=SALE', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          reqNum: i,
          status: res.statusCode,
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({ reqNum: i, status: 'ERROR', error: err.message });
    });
  });
}

async function testThrottling() {
  console.log('--- Testing API Throttling ---');
  for (let i = 1; i <= 6; i++) {
    const res = await makeRequest(i);
    console.log(`Request ${i}: Status ${res.status}`);
    if (res.status === 429) {
      console.log(`  Body: ${res.body}`);
    } else if (res.status === 200) {
      const json = JSON.parse(res.body);
      console.log(`  Payload data length: ${json.data?.length}`);
    }
  }
}

testThrottling();
