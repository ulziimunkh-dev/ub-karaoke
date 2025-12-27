const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function inspect() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: 'postgres',
    });

    try {
        await client.connect();

        const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
        console.log('Databases:', dbs.rows.map(r => r.datname).join(', '));

        for (const db of dbs.rows) {
            const dbName = db.datname;
            const dbClient = new Client({
                host: process.env.DATABASE_HOST || 'localhost',
                port: process.env.DATABASE_PORT || 5432,
                user: process.env.DATABASE_USER || 'postgres',
                password: process.env.DATABASE_PASSWORD || 'postgres',
                database: dbName,
            });

            try {
                await dbClient.connect();
                const tablesResult = await dbClient.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
                const tableNames = tablesResult.rows.map(r => r.tablename);
                console.log(`Tables in ${dbName}:`, tableNames.join(', '));

                for (const tableName of tableNames) {
                    const countResult = await dbClient.query(`SELECT count(*) FROM "${tableName}"`);
                    console.log(`  - ${tableName}: ${countResult.rows[0].count} rows`);
                }
            } catch (e) {
                console.log(`Could not connect to ${dbName}:`, e.message);
            } finally {
                await dbClient.end();
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

inspect();
