const http = require('http');

const data = JSON.stringify({
    identifier: 'sysadmin',
    password: 'sysadmin'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Body:', body);
        if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed!');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(data);
req.end();
