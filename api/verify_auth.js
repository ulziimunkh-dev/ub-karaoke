const API_URL = 'http://localhost:3001';

async function testLogin(label, payload, shouldSucceed) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (shouldSucceed) {
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ ${label}: Success. Role: ${data.user.role}, Type: ${data.user.userType}`);
            } else {
                console.error(`❌ ${label}: Expected Failure, but Failed with status ${res.status}`);
                // const err = await res.text(); console.log(err);
            }
        } else {
            if (!res.ok) {
                console.log(`✅ ${label}: Failed as expected (${res.status})`);
            } else {
                const data = await res.json();
                console.log(data);
                console.error(`❌ ${label}: Expected Failure, but Succeeded!`);
            }
        }
    } catch (err) {
        console.error(`❌ ${label}: Unexpected Error:`, err.message);
    }
}

async function run() {
    console.log('--- STARTING AUTH VERIFICATION ---');

    // 1. Valid Staff Login
    await testLogin('Staff Login (Valid)', { identifier: 'manager1', password: 'manager', orgCode: 'UBK-GRP' }, true);

    // 2. Staff Login Missing Org Code (Should fail as it falls back to customer lookup)
    await testLogin('Staff Login (No Org Code)', { identifier: 'manager1', password: 'manager' }, false);

    // 3. Valid Customer Login
    await testLogin('Customer Login (Valid)', { identifier: 'bat@gmail.com', password: '123' }, true);

    // 4. Customer Login with Org Code (Should fail as it looks for staff)
    await testLogin('Customer Login (With Org Code)', { identifier: 'bat@gmail.com', password: '123', orgCode: 'UBK-GRP' }, false);

    console.log('--- VERIFICATION COMPLETE ---');
}

run();
