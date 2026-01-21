const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

async function run() {
    const host = process.env.DATABASE_HOST || 'localhost';
    const port = parseInt(process.env.DATABASE_PORT || '5432');
    const user = process.env.DATABASE_USER || 'postgres';
    const password = process.env.DATABASE_PASSWORD || 'postgres';
    const dbName = process.env.DATABASE_NAME || 'karaoke_db';

    console.log(`🔌 Connecting to ${host}:${port} as ${user}...`);

    const adminClient = new Client({
        host,
        port,
        user,
        password,
        database: 'postgres',
    });

    try {
        await adminClient.connect();
        // Force disconnect other sessions
        const dbName = process.env.DATABASE_NAME || 'karaoke_db';
        console.log(`🧹 Dropping database ${dbName}...`);
        await adminClient.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = $1
              AND pid <> pg_backend_pid()`,
            [dbName]
        );
        await adminClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await adminClient.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Recreated database: ${dbName}`);
        console.log('🚀 Next Steps:');
        console.log('1. Run "npm run start:dev" in the api directory to let TypeORM create the UUID schema.');
        console.log('2. Once the app starts, run "node full-seed.js" to populate the data.');
        await adminClient.end();
    } catch (e) {
        console.error('❌ Master Fix Error:', e);
    }
}

run();
