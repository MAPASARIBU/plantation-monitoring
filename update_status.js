const { Pool } = require('pg'); 
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'plantation_db', password: 'password', port: 5432 }); 
async function run() { 
    try { await pool.query("ALTER TABLE harvesting_daily ADD COLUMN realized_ha REAL DEFAULT 0"); } catch(e) { console.log(e); }
    console.log('Done'); 
    pool.end(); 
} 
run();
