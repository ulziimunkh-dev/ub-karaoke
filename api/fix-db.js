const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

async function run() {
    const adminClient = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: 'postgres',
    });

    try {
        await adminClient.connect();
        // Force disconnect other sessions
        const dbName = 'karaoke_db';
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
        await adminClient.end();

        const dbClient = new Client({
            host: process.env.DATABASE_HOST || 'localhost',
            port: process.env.DATABASE_PORT || 5432,
            user: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: 'karaoke_db',
        });

        await dbClient.connect();

        // Read schema file
        const schemaPath = 'full-schema-final.sql'; // I'll fix this file one last time before running
        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but be careful with functions/triggers (not present here)
        const statements = sql.split(';').filter(s => s.trim() !== '');

        for (let statement of statements) {
            if (statement.trim().toUpperCase().startsWith('BEGIN') || statement.trim().toUpperCase().startsWith('COMMIT')) continue;
            try {
                await dbClient.query(statement + ';');
            } catch (e) {
                console.error(`❌ Error in statement: ${statement.substring(0, 50)}...`);
                console.error(e.message);
            }
        }

        console.log('✅ Manual Schema Applied');

        // Verify venues
        const res = await dbClient.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'venues' AND table_schema = 'public'");
        console.log('📋 Verified Venues Columns:', res.rows.map(r => r.column_name).join(', '));

        await dbClient.end();
    } catch (e) {
        console.error('❌ Master Fix Error:', e);
    }
}

run();
