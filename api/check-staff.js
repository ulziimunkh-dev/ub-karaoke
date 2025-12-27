const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function checkStaff() {
    const client = new Client({
        host: '127.0.0.1',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'karaoke_db',
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, email, username, role FROM staff');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
checkStaff();
