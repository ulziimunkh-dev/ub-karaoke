async function verify() {
    const API_URL = 'http://localhost:3001';

    console.log('--- Testing Status Logic (is_active boolean) ---');

    // 1. Login as sysadmin
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'sysadmin', password: 'sysadmin' })
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    if (!token) {
        console.error('Login failed:', loginData);
        return;
    }
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Get organizations
    const orgsRes = await fetch(`${API_URL}/organizations`, { headers: authHeader });
    const orgs = await orgsRes.json();
    const org1 = orgs.find(o => o.code === 'UBK-GRP');
    console.log(`Org 1: ${org1.name} (ID: ${org1.id}, isActive: ${org1.isActive})`);

    // 3. Get initial active venues
    const venuesRes = await fetch(`${API_URL}/venues`, { headers: authHeader });
    const venues = await venuesRes.json();
    console.log(`Initial active venues: ${venues.length}`);

    // 4. Deactivate Organization 1
    console.log(`Deactivating Organization ${org1.name}...`);
    await fetch(`${API_URL}/organizations/${org1.id}/status`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({ isActive: false })
    });

    // 5. Verify Venues filtering
    const venuesAfterOrgDeactivateRes = await fetch(`${API_URL}/venues`, { headers: authHeader });
    const venuesAfterOrgDeactivate = await venuesAfterOrgDeactivateRes.json();
    const org1Venues = venuesAfterOrgDeactivate.filter(v => v.organizationId === org1.id);
    console.log(`Org 1 active venues: ${org1Venues.length} (Should be 0)`);

    // 6. Reactivate Organization 1
    console.log(`Reactivating Organization ${org1.name}...`);
    await fetch(`${API_URL}/organizations/${org1.id}/status`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({ isActive: true })
    });

    // 7. Deactivate a Venue
    if (venues.length > 0) {
        const venue = venues[0];
        console.log(`Deactivating Venue ${venue.name}...`);
        await fetch(`${API_URL}/venues/${venue.id}/status`, {
            method: 'PATCH',
            headers: authHeader,
            body: JSON.stringify({ isActive: false })
        });

        const venuesAfterVenueDeactivateRes = await fetch(`${API_URL}/venues`, { headers: authHeader });
        const venuesAfterVenueDeactivate = await venuesAfterVenueDeactivateRes.json();
        console.log(`Active venues after Venue deactivate: ${venuesAfterVenueDeactivate.length} (Should be ${venues.length - 1})`);

        // Test includeInactive flag
        const allVenuesRes = await fetch(`${API_URL}/venues?includeInactive=true`, { headers: authHeader });
        const allVenues = await allVenuesRes.json();
        console.log(`Total venues (including inactive): ${allVenues.length}`);
    }

    console.log('Verification finished.');
}

verify().catch(err => console.error(err));
