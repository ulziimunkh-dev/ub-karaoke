const { execSync } = require('child_process');

function run(cmd) {
    console.log(`\n🚀 Running: ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ Failed: ${cmd}`);
    }
}

run('node fix-db.js');
console.log('⏳ Waiting 3s...');
execSync('powershell "Start-Sleep -s 3"');
run('node full-seed.js');
console.log('⏳ Waiting 3s...');
execSync('powershell "Start-Sleep -s 3"');
run('node -e "require(\'dotenv\').config(); const { Client } = require(\'pg\'); const client = new Client({ host: \'127.0.0.1\', port: 5432, user: \'postgres\', password: \'postgres\', database: \'karaoke_db\' }); async function run() { await client.connect(); const s = await client.query(\'SELECT count(*) FROM staff\'); const u = await client.query(\'SELECT count(*) FROM users\'); const v = await client.query(\'SELECT count(*) FROM venues\'); console.log(\'FINAL COUNTS -> Staff:\', s.rows[0].count, \'Users:\', u.rows[0].count, \'Venues:\', v.rows[0].count); await client.end(); } run();"');
