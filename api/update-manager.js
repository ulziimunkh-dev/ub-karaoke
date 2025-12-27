const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function updateManager() {
    const client = new Client({
        host: '127.0.0.1',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'karaoke_db',
    });

    try {
        await client.connect();
        const hashedPassword = await bcrypt.hash('manager', 10);

        const res = await client.query(
            "UPDATE staff SET username = 'manager', email = 'manager@ubkaraoke.mn', password = $1 WHERE role = 'manager'",
            [hashedPassword]
        );

        if (res.rowCount > 0) {
            console.log('✅ Manager credentials updated to manager/manager');
        } else {
            console.log('⚠️ No manager found to update. Creating one...');
            // Optional: Insert if not exists, but usually update is enough for a fix
        }

        const checkRes = await client.query("SELECT id, email, username, role FROM staff WHERE role = 'manager'");
        console.table(checkRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
updateManager();
