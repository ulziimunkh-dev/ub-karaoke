const { Client } = require('pg');

async function syncTz() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgres',
        database: 'karaoke_db',
    });

    try {
        await client.connect();

        console.log('--- Current Settings ---');
        const before = await client.query('SHOW timezone;');
        console.log('Timezone Before:', before.rows[0].TimeZone);

        console.log('Setting system-wide timezone to Asia/Ulaanbaatar...');
        await client.query("ALTER SYSTEM SET timezone TO 'Asia/Ulaanbaatar';");
        await client.query("SELECT pg_reload_conf();");

        // We might need to reconnect to see the session change, or just check the setting again
        const after = await client.query("SELECT setting FROM pg_settings WHERE name = 'TimeZone';");
        console.log('--- New Settings ---');
        console.log('Timezone After (Internal):', after.rows[0].setting);

        const now = await client.query('SELECT now();');
        console.log('Database Current Time (Local):', now.rows[0].now);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

syncTz();
