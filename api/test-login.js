const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:3001/auth/login', {
            identifier: 'sysadmin',
            password: 'sysadmin'
        });
        console.log('✅ Login successful!');
        console.log('User:', response.data.user);
        console.log('Token exists:', !!response.data.access_token);
    } catch (error) {
        console.error('❌ Login failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
