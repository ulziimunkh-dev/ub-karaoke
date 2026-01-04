const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function verify() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: 'karaoke_db',
    });

    try {
        await client.connect();

        const tables = ['organizations', 'staff', 'users', 'venues', 'rooms'];

        for (const table of tables) {
            console.log(`\n--- Table: ${table} ---`);
            const res = await client.query(`SELECT id, created_by, updated_by FROM "${table}" LIMIT 5`);
            console.table(res.rows);

            const check = await client.query(`SELECT count(*) FROM "${table}" WHERE created_by IS NULL OR updated_by IS NULL`);
            if (parseInt(check.rows[0].count) === 0) {
                console.log(`✅ All records in ${table} have audit columns populated.`);
            } else {
                console.log(`⚠️  ${check.rows[0].count} records in ${table} are missing audit data.`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

verify();
