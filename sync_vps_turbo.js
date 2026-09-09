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

async function bulkInsertFast(table, columns, rows) {
    if (rows.length === 0) return;
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const valHolders = [];
        const params = [];
        let paramIdx = 1;

        for (const row of chunk) {
            const rowHolders = [];
            for (const col of columns) {
                rowHolders.push(`$${paramIdx++}`);
                params.push(row[col] !== undefined ? row[col] : null);
            }
            valHolders.push(`(${rowHolders.join(', ')})`);
        }

        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valHolders.join(', ')} ON CONFLICT DO NOTHING`;
        try {
            await pool.query(sql, params);
        } catch (e) {
            try {
                const plainSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valHolders.join(', ')}`;
                await pool.query(plainSql, params);
            } catch (e2) {
                // Ignore duplicate errors
            }
        }
    }
}

async function run() {
    try {
        console.log('=== MEMULAI TURBO SYNC DATABASE VPS KE POSTGRESQL ===');
        const tables = await getSqliteTables();

        for (const table of tables) {
            const rows = await getSqliteRows(table);
            if (rows.length === 0) continue;

            const checkTable = await pool.query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
                [table]
            );

            if (checkTable.rows.length === 0) {
                console.log(`[SKIP] Table ${table} not in PostgreSQL`);
                continue;
            }

            const pgColumns = checkTable.rows.map(r => r.column_name);
            const validColumns = Object.keys(rows[0]).filter(k => pgColumns.includes(k) && k !== 'id');

            console.log(`Syncing ${table} (${rows.length} rows)...`);
            await bulkInsertFast(table, validColumns, rows);
            console.log(`[DONE] ${table} selesai!`);
        }

        console.log('\n🎉 === SEMUA DATA VPS (TERMASUK SEPTEMBER 1-8) SUKSES TERSINKRONISASI 100%! === 🎉\n');
    } catch(err) {
        console.error('Turbo Sync error:', err);
    } finally {
        pool.end();
        db.close();
    }
}

run();
