const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function inspect() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: 'karaoke_db',
    });

    try {
        await client.connect();
        const res = await client.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position");
        const tables = {};
        res.rows.forEach(row => {
            if (!tables[row.table_name]) tables[row.table_name] = [];
            tables[row.table_name].push(row.column_name);
        });
        console.log(JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

inspect();
