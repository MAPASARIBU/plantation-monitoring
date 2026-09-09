const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let neonUrl = process.env.DATABASE_URL || '';
const envPath = path.join(__dirname, '.env');
if (!neonUrl && fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const l of lines) {
        if (l.startsWith('DATABASE_URL=')) {
            neonUrl = l.substring('DATABASE_URL='.length).trim();
        }
    }
}
if (!neonUrl) {
    neonUrl = 'postgresql://neondb_owner:npg_U1nisf6eAjaS@ep-misty-fog-aiwhad7s-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
}

const pool = new Pool({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false }
});

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

function getSqliteTables() {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.name));
        });
    });
}

function getSqliteRows(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

async function run() {
    try {
        console.log('Connecting to PostgreSQL Neon DB...');
        const tables = await getSqliteTables();
        console.log('Tables found in SQLite:', tables);

        for (const table of tables) {
            const rows = await getSqliteRows(table);
            if (rows.length === 0) continue;

            // Check if table exists in PostgreSQL
            const checkTable = await pool.query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
                [table]
            );

            if (checkTable.rows.length === 0) {
                console.log(`[SKIP] Table ${table} does not exist in PostgreSQL`);
                continue;
            }

            const pgColumns = checkTable.rows.map(r => r.column_name);
            console.log(`\n--- Syncing ${table} (${rows.length} rows in SQLite) ---`);
            let synced = 0;

            for (const row of rows) {
                const colsToUse = Object.keys(row).filter(k => pgColumns.includes(k) && k !== 'id');
                if (colsToUse.length === 0) continue;

                // 1. water_analysis (unique by mill + date)
                if (table === 'water_analysis' && row.date && row.mill) {
                    const exist = await pool.query('SELECT id FROM water_analysis WHERE date=$1 AND mill=$2', [row.date, row.mill]);
                    if (exist.rows.length > 0) {
                        const updateCols = colsToUse.filter(c => c !== 'date' && c !== 'mill');
                        const setClause = updateCols.map((c, i) => `${c} = $${i + 3}`).join(', ');
                        const uVals = [row.mill, row.date, ...updateCols.map(c => row[c])];
                        await pool.query(`UPDATE water_analysis SET ${setClause} WHERE mill=$1 AND date=$2`, uVals);
                        synced++;
                        continue;
                    }
                }

                // 2. processing_liquid, processing_ffa, water_boiler_hourly (unique by mill + date + time_hour)
                if ((table === 'processing_liquid' || table === 'processing_ffa' || table === 'water_boiler_hourly') && row.date && row.mill && row.time_hour) {
                    const exist = await pool.query(`SELECT id FROM ${table} WHERE date=$1 AND mill=$2 AND time_hour=$3`, [row.date, row.mill, row.time_hour]);
                    if (exist.rows.length > 0) {
                        const updateCols = colsToUse.filter(c => c !== 'date' && c !== 'mill' && c !== 'time_hour');
                        const setClause = updateCols.map((c, i) => `${c} = $${i + 4}`).join(', ');
                        const uVals = [row.mill, row.date, row.time_hour, ...updateCols.map(c => row[c])];
                        await pool.query(`UPDATE ${table} SET ${setClause} WHERE mill=$1 AND date=$2 AND time_hour=$3`, uVals);
                        synced++;
                        continue;
                    }
                }

                // 3. tonase_hourly (unique by mill + date + estate + time_hour)
                if (table === 'tonase_hourly' && row.date && row.mill && row.estate && row.time_hour) {
                    const exist = await pool.query('SELECT id FROM tonase_hourly WHERE date=$1 AND mill=$2 AND estate=$3 AND time_hour=$4', [row.date, row.mill, row.estate, row.time_hour]);
                    if (exist.rows.length > 0) {
                        await pool.query('UPDATE tonase_hourly SET target_kg=$1, realized_kg=$2, realized_trip=$3 WHERE id=$4', [row.target_kg, row.realized_kg, row.realized_trip || 0, exist.rows[0].id]);
                        synced++;
                        continue;
                    }
                }

                // 4. mill_daily_config (unique by mill + date)
                if (table === 'mill_daily_config' && row.date && row.mill) {
                    const exist = await pool.query('SELECT id FROM mill_daily_config WHERE date=$1 AND mill=$2', [row.date, row.mill]);
                    if (exist.rows.length > 0) {
                        await pool.query('UPDATE mill_daily_config SET is_processing=$1, efb_ratio=$2, sisa_kemarin_jjk=$3, is_locked=$4 WHERE id=$5', [row.is_processing, row.efb_ratio, row.sisa_kemarin_jjk, row.is_locked, exist.rows[0].id]);
                        synced++;
                        continue;
                    }
                }

                // 5. Default insert
                const placeholders = colsToUse.map((_, i) => `$${i + 1}`).join(', ');
                const vals = colsToUse.map(k => row[k]);
                try {
                    await pool.query(`INSERT INTO ${table} (${colsToUse.join(', ')}) VALUES (${placeholders})`, vals);
                    synced++;
                } catch(insErr) {
                    // ignore duplicate constraint violations
                }
            }
            console.log(`[DONE] ${table}: synced ${synced} records.`);
        }
        console.log('\n=== ALL VPS DATA SUCCESSFULLY SYNCED TO POSTGRESQL ===\n');
    } catch(err) {
        console.error('Sync error:', err);
    } finally {
        pool.end();
        db.close();
    }
}

run();
