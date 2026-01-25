const { Client } = require('pg');

async function checkTz() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgres',
        database: 'karaoke_db',
    });

    try {
        await client.connect();
        const res = await client.query('SHOW timezone;');
        console.log('Database Timezone:', res.rows[0].TimeZone);

        const now = await client.query('SELECT now();');
        console.log('Database Current Time (SELECT now()):', now.rows[0].now);
    } catch (err) {
        console.error('Error connecting to database:', err);
    } finally {
        await client.end();
    }
}

checkTz();
