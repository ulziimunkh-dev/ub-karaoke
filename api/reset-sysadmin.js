const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function resetSysadmin() {
    const client = new Client({
        host: '127.0.0.1',
        port: process.env.DATABASE_PORT || 5432,
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'karaoke_db',
    });

    try {
        await client.connect();
        const hashedPassword = await bcrypt.hash('sysadmin', 10);

        const res = await client.query(
            "UPDATE staff SET username = 'sysadmin', email = 'sysadmin@ubkaraoke.mn', password = $1 WHERE role = 'sysadmin'",
            [hashedPassword]
        );

        if (res.rowCount > 0) {
            console.log('✅ Sysadmin credentials reset to sysadmin/sysadmin');
        } else {
            console.log('⚠️ No sysadmin found to update.');
        }

        const checkRes = await client.query("SELECT id, email, username, role FROM staff WHERE role = 'sysadmin'");
        console.table(checkRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
resetSysadmin();
