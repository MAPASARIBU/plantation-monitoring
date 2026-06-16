const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors());
app.use(express.json());
// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname)));

// Fallback route to serve index.html for frontend routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Database Setup
let pool;

if (process.env.DATABASE_URL) {
    console.log("Using PostgreSQL Database (Production)");
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    console.log("Using SQLite Database (Local Development)");
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));
    
    pool = {
        query: (sql, params) => {
            return new Promise((resolve, reject) => {
                const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
                const hasReturning = sql.toUpperCase().includes('RETURNING ID');
                
                // Convert PostgreSQL $1, $2 to SQLite ?
                let sqliteSql = sql.replace(/\$\d+/g, '?');
                
                if (isInsert || sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE') || sql.trim().toUpperCase().startsWith('CREATE') || sql.trim().toUpperCase().startsWith('ALTER')) {
                    if (hasReturning) {
                        sqliteSql = sqliteSql.replace(/RETURNING\s+id/i, '');
                    }
                    db.run(sqliteSql, params || [], function(err) {
                        if (err) return reject(err);
                        if (hasReturning) {
                            resolve({ rows: [{ id: this.lastID }] });
                        } else {
                            resolve({ rows: [] });
                        }
                    });
                } else {
                    db.all(sqliteSql, params || [], (err, rows) => {
                        if (err) return reject(err);
                        resolve({ rows: rows || [] });
                    });
                }
            });
        },
        connect: (cb) => {
            cb(null, null, () => {});
        }
    };
}

// Initialize Tables & Seed Data
async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            estate TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS vehicles (
            id SERIAL PRIMARY KEY,
            plate TEXT, driver TEXT, ritase INTEGER, block TEXT,
            janjang INTEGER, timeDepart TEXT, timeArrive TEXT, date TEXT, estate TEXT
        )`);
        try { await pool.query("ALTER TABLE vehicles ADD COLUMN date TEXT"); } catch(e) {}
        try { await pool.query("ALTER TABLE vehicles ADD COLUMN estate TEXT"); } catch(e) {}
        try { await pool.query("ALTER TABLE vehicles ADD COLUMN divisi TEXT"); } catch(e) {}
        try { await pool.query("ALTER TABLE users ADD COLUMN estate TEXT"); } catch(e) {}
        
        await pool.query(`CREATE TABLE IF NOT EXISTS upkeep (
            id SERIAL PRIMARY KEY,
            block TEXT, type TEXT, target REAL, realized REAL, worker TEXT
        )`);
        try { await pool.query("ALTER TABLE upkeep ADD COLUMN status TEXT DEFAULT 'Aktif'"); } catch(e) {}
        try { await pool.query("ALTER TABLE upkeep ADD COLUMN targetWorkers INTEGER DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE upkeep ADD COLUMN realizedWorkers INTEGER DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE upkeep ADD COLUMN startDate TEXT"); } catch(e) {}
        try { await pool.query("ALTER TABLE upkeep ADD COLUMN estate TEXT DEFAULT 'Bunga Tanjung Estate'"); } catch(e) {}

        await pool.query(`CREATE TABLE IF NOT EXISTS upkeep_history (
            id SERIAL PRIMARY KEY,
            upkeep_id INTEGER, dateAdded TEXT, addedHa REAL, worker TEXT
        )`);
        try { await pool.query("ALTER TABLE upkeep_history ADD COLUMN workers INTEGER DEFAULT 0"); } catch(e) {}

        await pool.query(`CREATE TABLE IF NOT EXISTS pemupukan (
            id SERIAL PRIMARY KEY,
            startDate TEXT,
            block TEXT, plan TEXT, targetKg REAL, realizedKg REAL, status TEXT DEFAULT 'Aktif',
            estate TEXT DEFAULT 'Bunga Tanjung Estate',
            targetHa REAL DEFAULT 0,
            targetWorkers INTEGER DEFAULT 0,
            realizedHa REAL DEFAULT 0,
            realizedWorkers INTEGER DEFAULT 0
        )`);
        try { await pool.query("ALTER TABLE pemupukan ADD COLUMN estate TEXT DEFAULT 'Bunga Tanjung Estate'"); } catch(e) {}
        try { await pool.query("ALTER TABLE pemupukan ADD COLUMN targetHa REAL DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE pemupukan ADD COLUMN targetWorkers INTEGER DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE pemupukan ADD COLUMN realizedHa REAL DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE pemupukan ADD COLUMN realizedWorkers INTEGER DEFAULT 0"); } catch(e) {}

        await pool.query(`CREATE TABLE IF NOT EXISTS pemupukan_history (
            id SERIAL PRIMARY KEY,
            pemupukan_id INTEGER, dateAdded TEXT, addedKg REAL, manpower INTEGER DEFAULT 0
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS harvesting_monthly (
            id SERIAL PRIMARY KEY,
            estate TEXT, divisi TEXT, month TEXT, target_kg REAL
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS harvesting_daily (
            id SERIAL PRIMARY KEY,
            date TEXT, estate TEXT, divisi TEXT, block TEXT, 
            akp REAL, est_janjang REAL, est_kg REAL, plan_pemanen INTEGER, mandor TEXT, pusingan TEXT,
            realized_janjang REAL DEFAULT 0, realized_pemanen INTEGER DEFAULT 0, realized_kg REAL DEFAULT 0, status TEXT DEFAULT 'Draft'
        )`);
        try { await pool.query("ALTER TABLE harvesting_daily ADD COLUMN pusingan TEXT"); } catch(e) {}
        try { await pool.query("ALTER TABLE harvesting_daily ADD COLUMN realized_ha REAL DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE harvesting_daily ADD COLUMN allocated_trucks TEXT DEFAULT '[]'"); } catch(e) {}
        try { await pool.query("ALTER TABLE harvesting_daily ADD COLUMN ritase_list TEXT DEFAULT '[]'"); } catch(e) {}
        try { await pool.query("ALTER TABLE harvesting_daily ALTER COLUMN akp TYPE TEXT USING akp::TEXT"); } catch(e) {}


        await pool.query(`CREATE TABLE IF NOT EXISTS master_divisi (id SERIAL PRIMARY KEY, estate TEXT, name TEXT)`);
        // Added divisi column because it's used in bulk insert checking
        await pool.query(`CREATE TABLE IF NOT EXISTS master_blok (id SERIAL PRIMARY KEY, estate TEXT, name TEXT, bjr REAL DEFAULT 0, divisi TEXT, gross_area REAL DEFAULT 0, sph REAL DEFAULT 0, total_stand REAL DEFAULT 0)`);
        try { await pool.query("ALTER TABLE master_blok ADD COLUMN gross_area REAL DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE master_blok ADD COLUMN sph REAL DEFAULT 0"); } catch(e) {}
        try { await pool.query("ALTER TABLE master_blok ADD COLUMN total_stand REAL DEFAULT 0"); } catch(e) {}
        await pool.query(`CREATE TABLE IF NOT EXISTS master_truk (id SERIAL PRIMARY KEY, estate TEXT, plate_number TEXT, supir TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS master_supir (id SERIAL PRIMARY KEY, estate TEXT, name TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS master_supply_chain (id SERIAL PRIMARY KEY, mill TEXT, estate TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS tonase_hourly (
            id SERIAL PRIMARY KEY,
            date TEXT,
            mill TEXT,
            estate TEXT,
            time_hour TEXT,
            target_kg REAL DEFAULT 0,
            realized_kg REAL DEFAULT 0
        )`);
        try { await pool.query("ALTER TABLE tonase_hourly ADD COLUMN realized_trip INTEGER DEFAULT 0"); } catch(e) {}

        await pool.query(`CREATE TABLE IF NOT EXISTS lf_received_daily (
            id SERIAL PRIMARY KEY,
            date TEXT,
            mill TEXT,
            estate TEXT,
            actual_lf_tonase REAL DEFAULT 0,
            actual_ffb_tonase REAL DEFAULT 0
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS efb_transport_daily (
            id SERIAL PRIMARY KEY,
            date TEXT,
            mill TEXT,
            estate TEXT,
            tonase REAL DEFAULT 0,
            trip INTEGER DEFAULT 0,
            target REAL DEFAULT 0
        )`);
        try { await pool.query("ALTER TABLE efb_transport_daily ADD COLUMN target REAL DEFAULT 0"); } catch(e) {}
        await pool.query(`CREATE TABLE IF NOT EXISTS despatch_daily (
            id SERIAL PRIMARY KEY,
            date TEXT,
            mill TEXT,
            product TEXT,
            trip INTEGER DEFAULT 0,
            tonase REAL DEFAULT 0
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS mill_daily_config (
            id SERIAL PRIMARY KEY,
            date TEXT,
            mill TEXT,
            is_processing INTEGER DEFAULT 0,
            efb_ratio REAL DEFAULT 0,
            sisa_kemarin_jjk REAL DEFAULT 0,
            is_locked INTEGER DEFAULT 0
        )`);


        try {
            await pool.query(`ALTER TABLE master_truk ADD COLUMN supir TEXT`);
        } catch (e) {
            // Ignore if column already exists
        }

        // Seed Users
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            const seedUsers = [
                ['admin', 'admin123', 'Admin'],
                ['SFM', 'SFM123', 'Senior Field Manager'],
                ['MGR', 'MGR123', 'Manager'],
                ['ASK', 'ASK123', 'Askep'],
                ['AST', 'AST123', 'Assistant'],
                ['KRND', 'KRND123', 'Krani Divisi'],
                ['SPR', 'SPR123', 'Supir'],
                ['SCR', 'SCR123', 'Security'],
                ['KRNM', 'KRNM123', 'Krani Mill'],
                ['MDR', 'MDR123', 'Mandor']
            ];
            for (let user of seedUsers) {
                await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', user);
            }
        }
        
        // Auto-fix null estates for previously seeded users
        await pool.query("UPDATE users SET estate = 'Semua Estate (Khusus Admin)' WHERE role IN ('Senior Field Manager') AND (estate IS NULL OR estate = '')");
        await pool.query("UPDATE users SET estate = 'Bunga Tanjung Estate' WHERE role NOT IN ('Admin', 'Senior Field Manager') AND (estate IS NULL OR estate = '')");
        
        // Auto-fix typo Maling Demang
        const tablesWithEstate = ['users', 'vehicles', 'upkeep', 'pemupukan', 'harvesting_monthly', 'harvesting_daily', 'master_divisi', 'master_blok', 'master_truk', 'master_supir', 'master_supply_chain', 'tonase_hourly'];
        for (let t of tablesWithEstate) {
            try { await pool.query(`UPDATE ${t} SET estate = 'Malin Deman Estate' WHERE estate LIKE '%Maling Demang%' OR estate LIKE '%Malin Demang%'`); } catch(e) {}
        }
        try { await pool.query(`UPDATE users SET estate = REPLACE(estate, 'Maling Demang Estate', 'Malin Deman Estate')`); } catch(e) {}
        try { await pool.query(`UPDATE users SET estate = REPLACE(estate, 'Malin Demang Estate', 'Malin Deman Estate')`); } catch(e) {}
        

        // Seed Default Data
        const vCount = await pool.query('SELECT COUNT(*) FROM vehicles');
        if (parseInt(vCount.rows[0].count) === 0) {
            await pool.query(`INSERT INTO vehicles (plate, driver, ritase, block, janjang, timeDepart, timeArrive) VALUES 
                ('BK 1234 XY', 'Budi', 1, 'A01', 450, '08:00', '08:45'),
                ('BK 5678 ZA', 'Anto', 2, 'B12', 380, '09:15', '')`);
        }

        const uCount = await pool.query('SELECT COUNT(*) FROM upkeep');
        if (parseInt(uCount.rows[0].count) === 0) {
            await pool.query(`INSERT INTO upkeep (block, type, target, realized, worker) VALUES 
                ('A01', 'Pruning', 15, 10, 'Mandor Joko'),
                ('C05', 'Weeding', 20, 20, 'Mandor Supri')`);
        }

        const pCount = await pool.query('SELECT COUNT(*) FROM pemupukan');
        if (parseInt(pCount.rows[0].count) === 0) {
            await pool.query(`INSERT INTO pemupukan (startDate, block, plan, targetKg, realizedKg) VALUES 
                ('2026-05-30', 'B12', 'Urea Tahap 1', 500, 250),
                ('2026-05-30', 'D04', 'MOP Tahap 2', 300, 300)`);
        }

        const hCount = await pool.query('SELECT COUNT(*) FROM harvesting');
        if (parseInt(hCount.rows[0].count) === 0) {
            await pool.query(`INSERT INTO harvesting (block, targetJanjang, realizedJanjang, bjr) VALUES 
                ('A01', 1000, 850, 18.5),
                ('B12', 800, 200, 19.2)`);
        }
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Ensure connection works before init
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.message);
    } else {
        console.log('Connected to PostgreSQL database.');
        release();
        initDB();
    }
});

// --- API ENDPOINTS ---

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query('SELECT id, username, role, estate FROM users WHERE LOWER(username) = LOWER($1) AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// USERS MANAGEMENT
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role, estate FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role, estate } = req.body;
        const result = await pool.query('INSERT INTO users (username, password, role, estate) VALUES ($1,$2,$3,$4) RETURNING id', [username, password, role, estate]);
        res.json({ id: result.rows[0].id, username, role, estate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { role, estate, password } = req.body;
        
        let sql = 'UPDATE users SET role = $1, estate = $2 WHERE id = $3';
        let params = [role, estate, id];
        
        if (password && password.trim() !== '') {
            sql = 'UPDATE users SET role = $1, estate = $2, password = $3 WHERE id = $4';
            params = [role, estate, password, id];
        }
        
        await pool.query(sql, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    try {
        const id = req.params.id;
        const { oldPassword, newPassword } = req.body;
        
        const userCheck = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        
        if (userCheck.rows[0].password !== oldPassword) {
            return res.status(401).json({ success: false, message: 'Password lama salah!' });
        }
        
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, id]);
        res.json({ success: true, message: 'Password berhasil diubah' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MASTER DATA
app.get('/api/master/:estate', async (req, res) => {
    try {
        const estate = req.params.estate;
        let divisi, blok, truk, pupuk, supir;
        if (estate === 'Semua Estate (Khusus Admin)') {
            divisi = await pool.query('SELECT * FROM master_divisi');
            blok = await pool.query('SELECT * FROM master_blok');
            truk = await pool.query('SELECT * FROM master_truk');
            pupuk = await pool.query('SELECT * FROM master_pupuk');
            supir = await pool.query('SELECT * FROM master_supir');
        } else {
            divisi = await pool.query('SELECT * FROM master_divisi WHERE estate = $1', [estate]);
            blok = await pool.query('SELECT * FROM master_blok WHERE estate = $1', [estate]);
            truk = await pool.query('SELECT * FROM master_truk WHERE estate = $1', [estate]);
            pupuk = await pool.query('SELECT * FROM master_pupuk WHERE estate = $1', [estate]);
            supir = await pool.query('SELECT * FROM master_supir WHERE estate = $1', [estate]);
        }
        
        let supply_chain = { rows: [] };
        if (estate.endsWith('Mill')) {
            supply_chain = await pool.query('SELECT * FROM master_supply_chain WHERE mill = $1', [estate]);
        }
        
        res.json({
            divisi: divisi.rows,
            blok: blok.rows,
            truk: truk.rows,
            pupuk: pupuk.rows,
            supir: supir.rows,
            supply_chain: supply_chain.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const { estate, name, bjr, plate_number, supir, divisi } = req.body;
        let table = `master_${type}`;
        let val = type === 'truk' ? plate_number : name;
        let col = type === 'truk' ? 'plate_number' : 'name';
        
        let checkSql = `SELECT * FROM ${table} WHERE estate = $1 AND ${col} = $2`;
        let checkParams = [estate, val];
        if(type === 'blok') {
            checkSql += ` AND divisi = $3`;
            checkParams.push(divisi);
        }
        
        const existing = await pool.query(checkSql, checkParams);
        if(existing.rows.length > 0) return res.status(400).json({error: 'Data sudah ada!'});
        
        let sql = '';
        let params = [];
        
        if (type === 'divisi') { sql = 'INSERT INTO master_divisi (estate, name) VALUES ($1,$2) RETURNING id'; params = [estate, name]; }
        else if (type === 'blok') { sql = 'INSERT INTO master_blok (estate, name, bjr, divisi, gross_area, sph, total_stand) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id'; params = [estate, name, bjr || 0, divisi || '', req.body.gross_area || 0, req.body.sph || 0, req.body.total_stand || 0]; }
        else if (type === 'truk') { sql = 'INSERT INTO master_truk (estate, plate_number, supir) VALUES ($1,$2,$3) RETURNING id'; params = [estate, plate_number, supir || '']; }
        else if (type === 'pupuk') { sql = 'INSERT INTO master_pupuk (estate, name) VALUES ($1,$2) RETURNING id'; params = [estate, name]; }
        else if (type === 'supir') { sql = 'INSERT INTO master_supir (estate, name) VALUES ($1,$2) RETURNING id'; params = [estate, name]; }
        else return res.status(400).json({error: 'Invalid type'});

        const result = await pool.query(sql, params);
        res.json({ id: result.rows[0].id, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/blok/bulk', async (req, res) => {
    try {
        const { estate, divisi, bloks } = req.body;
        if (!Array.isArray(bloks)) return res.status(400).json({error: "Invalid payload"});
        
        const existing = await pool.query(`SELECT name FROM master_blok WHERE estate = $1 AND divisi = $2`, [estate, divisi]);
        const existingSet = new Set(existing.rows.map(e => e.name));
        const toInsert = bloks.filter(b => !existingSet.has(b.name));
        
        if (toInsert.length === 0) return res.json({ success: true, inserted: 0 });
        
        let valuesStr = [];
        let params = [];
        let paramIndex = 1;
        
        toInsert.forEach(b => {
            valuesStr.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
            params.push(estate, b.name, b.bjr || 0, divisi, b.gross_area || 0, b.sph || 0, b.total_stand || 0);
            paramIndex += 7;
        });
        
        await pool.query(`INSERT INTO master_blok (estate, name, bjr, divisi, gross_area, sph, total_stand) VALUES ${valuesStr.join(',')}`, params);
        res.json({ success: true, inserted: toInsert.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/truk/bulk', async (req, res) => {
    try {
        const { estate, items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({error: "Invalid payload"});
        
        const existing = await pool.query(`SELECT plate_number FROM master_truk WHERE estate = $1`, [estate]);
        const existingSet = new Set(existing.rows.map(e => e.plate_number));
        const toInsert = items.filter(b => b && b.plate_number && b.plate_number.trim() !== '' && !existingSet.has(b.plate_number.trim()));
        
        if (toInsert.length === 0) return res.json({ success: true, inserted: 0 });
        
        let valuesStr = [];
        let params = [];
        let paramIndex = 1;
        
        toInsert.forEach(b => {
            valuesStr.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2})`);
            params.push(estate, b.plate_number.trim(), (b.supir || '').trim());
            paramIndex += 3;
        });
        
        await pool.query(`INSERT INTO master_truk (estate, plate_number, supir) VALUES ${valuesStr.join(',')}`, params);
        res.json({ success: true, inserted: toInsert.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/supir/bulk', async (req, res) => {
    try {
        const { estate, items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({error: "Invalid payload"});
        
        const existing = await pool.query(`SELECT name FROM master_supir WHERE estate = $1`, [estate]);
        const existingSet = new Set(existing.rows.map(e => e.name));
        const toInsert = items.filter(b => b.trim() !== '' && !existingSet.has(b.trim()));
        
        if (toInsert.length === 0) return res.json({ success: true, inserted: 0 });
        
        let valuesStr = [];
        let params = [];
        let paramIndex = 1;
        
        toInsert.forEach(b => {
            valuesStr.push(`($${paramIndex}, $${paramIndex+1})`);
            params.push(estate, b.trim());
            paramIndex += 2;
        });
        
        await pool.query(`INSERT INTO master_supir (estate, name) VALUES ${valuesStr.join(',')}`, params);
        res.json({ success: true, inserted: toInsert.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/pupuk/bulk', async (req, res) => {
    try {
        const { estate, items } = req.body;
        if (!Array.isArray(items)) return res.status(400).json({error: "Invalid payload"});
        
        const existing = await pool.query(`SELECT name FROM master_pupuk WHERE estate = $1`, [estate]);
        const existingSet = new Set(existing.rows.map(e => e.name));
        const toInsert = items.filter(b => b.trim() !== '' && !existingSet.has(b.trim()));
        
        if (toInsert.length === 0) return res.json({ success: true, inserted: 0 });
        
        let valuesStr = [];
        let params = [];
        let paramIndex = 1;
        
        toInsert.forEach(b => {
            valuesStr.push(`($${paramIndex}, $${paramIndex+1})`);
            params.push(estate, b.trim());
            paramIndex += 2;
        });
        
        await pool.query(`INSERT INTO master_pupuk (estate, name) VALUES ${valuesStr.join(',')}`, params);
        res.json({ success: true, inserted: toInsert.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/master/:type/:id', async (req, res) => {
    try {
        const type = req.params.type;
        const id = req.params.id;
        let table = `master_${type}`;
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/master/:type/:id', async (req, res) => {
    try {
        const type = req.params.type;
        const id = req.params.id;
        const { name, plate_number, supir, bjr } = req.body;
        let table = `master_${type}`;
        
        let sql, params;
        if (type === 'blok') {
            const { name, bjr, gross_area, sph, total_stand } = req.body;
            sql = 'UPDATE master_blok SET name = $1, bjr = $2, gross_area = $3, sph = $4, total_stand = $5 WHERE id = $6';
            params = [name, bjr || 0, gross_area || 0, sph || 0, total_stand || 0, id];
        } else if (type === 'truk') {
            sql = `UPDATE master_truk SET plate_number = $1, supir = $2 WHERE id = $3`;
            params = [plate_number, supir, id];
        } else {
            sql = `UPDATE ${table} SET name = $1 WHERE id = $2`;
            params = [name, id];
        }
        
        await pool.query(sql, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/supply_chain/save', async (req, res) => {
    try {
        const { mill, estates } = req.body;
        await pool.query('BEGIN');
        await pool.query('DELETE FROM master_supply_chain WHERE mill = $1', [mill]);
        for (const est of estates) {
            await pool.query('INSERT INTO master_supply_chain (mill, estate) VALUES ($1, $2)', [mill, est]);
        }
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// ALL DATA
app.get('/api/data', async (req, res) => {
    try {
        const vehicles = await pool.query('SELECT * FROM vehicles');
        const upkeep = await pool.query('SELECT * FROM upkeep');
        const pemupukan = await pool.query('SELECT * FROM pemupukan');
        const harvesting_monthly = await pool.query('SELECT * FROM harvesting_monthly');
        const harvesting_daily = await pool.query('SELECT * FROM harvesting_daily');
        
        res.json({
            vehicles: vehicles.rows,
            upkeep: upkeep.rows,
            pemupukan: pemupukan.rows,
            harvesting_monthly: harvesting_monthly.rows,
            harvesting_daily: harvesting_daily.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// VEHICLES
app.post('/api/vehicles', async (req, res) => {
    try {
        const { plate, driver, ritase, block, janjang, timeDepart, timeArrive, date, estate, divisi } = req.body;
        const result = await pool.query(
            'INSERT INTO vehicles (plate, driver, ritase, block, janjang, timeDepart, timeArrive, date, estate, divisi) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
            [plate, driver, ritase, block, janjang, timeDepart, timeArrive, date, estate, divisi]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/vehicles/:id', async (req, res) => {
    try {
        const { timeArrive } = req.body;
        await pool.query('UPDATE vehicles SET timeArrive = $1 WHERE id = $2', [timeArrive, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPKEEP
app.post('/api/upkeep', async (req, res) => {
    try {
        const { block, type, target, worker, targetWorkers, startDate, estate } = req.body;
        const result = await pool.query(
            'INSERT INTO upkeep (block, type, target, realized, worker, status, targetWorkers, startDate, estate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
            [block, type, target, 0, worker, 'Aktif', targetWorkers || 0, startDate || '', estate || 'Bunga Tanjung Estate']
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/upkeep/:id/add', async (req, res) => {
    const client = await pool.connect();
    try {
        const { additionalHa, dateAdded, worker, workers } = req.body;
        await client.query('BEGIN');
        await client.query('UPDATE upkeep SET realized = realized + $1, realizedWorkers = COALESCE(realizedWorkers, 0) + $3 WHERE id = $2', [additionalHa, req.params.id, workers || 0]);
        await client.query(
            'INSERT INTO upkeep_history (upkeep_id, dateAdded, addedHa, worker, workers) VALUES ($1,$2,$3,$4,$5)',
            [req.params.id, dateAdded, additionalHa, worker || '', workers || 0]
        );
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


app.get('/api/upkeep/monthly', async (req, res) => {
    try {
        const { estate, month } = req.query; // month like '2026-06'
        if(!month) return res.status(400).json({ error: 'Month parameter required' });
        
        let queryStr = 'SELECT * FROM upkeep WHERE startDate LIKE $1';
        let params = [`${month}%`];
        
        if (estate && estate !== 'ALL') {
            queryStr += ' AND estate = $2';
            params.push(estate);
        }
        
        const upkeepRes = await pool.query(queryStr, params);
        
        // Fetch history for these upkeeps
        const historyRes = await pool.query('SELECT h.* FROM upkeep_history h JOIN upkeep u ON h.upkeep_id = u.id WHERE h.dateAdded LIKE $1', [`${month}%`]);
        
        res.json({
            plan: upkeepRes.rows,
            actual: historyRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/upkeep/:id/history', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM upkeep_history WHERE upkeep_id = $1 ORDER BY dateAdded DESC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/upkeep/:id/close', async (req, res) => {
    try {
        await pool.query('UPDATE upkeep SET status = $1 WHERE id = $2', ['Selesai', req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PEMUPUKAN
app.post('/api/pemupukan', async (req, res) => {
    try {
        const { startDate, block, plan, targetKg, estate, targetHa, targetWorkers } = req.body;
        const result = await pool.query(
            'INSERT INTO pemupukan (startDate, block, plan, targetKg, realizedKg, status, estate, targetHa, targetWorkers, realizedHa, realizedWorkers) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
            [startDate, block, plan, targetKg, 0, 'Aktif', estate || 'Bunga Tanjung Estate', targetHa || 0, targetWorkers || 0, 0, 0]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/pemupukan/:id/add', async (req, res) => {
    const client = await pool.connect();
    try {
        const { realizedKg, realizedHa, realizedWorkers } = req.body;
        await client.query('BEGIN');
        // Because it's a one-time daily plan, we OVERWRITE the realization instead of adding
        await client.query('UPDATE pemupukan SET realizedKg = $1, realizedHa = $2, realizedWorkers = $3, status = $4 WHERE id = $5', [realizedKg || 0, realizedHa || 0, realizedWorkers || 0, 'Selesai', req.params.id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/pemupukan/:id/history', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pemupukan_history WHERE pemupukan_id = $1 ORDER BY dateAdded DESC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/pemupukan/:id/close', async (req, res) => {
    try {
        await pool.query('UPDATE pemupukan SET status = $1 WHERE id = $2', ['Selesai', req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pemupukan/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM pemupukan_history WHERE pemupukan_id = $1', [req.params.id]);
        await client.query('DELETE FROM pemupukan WHERE id = $1', [req.params.id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// HARVESTING
app.get('/api/harvesting/:estate', async (req, res) => {
    try {
        const estate = req.params.estate;
        const monthly = await pool.query('SELECT * FROM harvesting_monthly WHERE estate = $1', [estate]);
        const daily = await pool.query('SELECT * FROM harvesting_daily WHERE estate = $1 ORDER BY date DESC', [estate]);
        res.json({ monthly: monthly.rows, daily: daily.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/harvesting/monthly', async (req, res) => {
    try {
        const { estate, divisi, month, target_kg } = req.body;
        // Check if exists
        const check = await pool.query('SELECT id FROM harvesting_monthly WHERE estate = $1 AND divisi = $2 AND month = $3', [estate, divisi, month]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: `Rencana bulanan untuk Divisi ${divisi} pada bulan tersebut sudah ada!` });
        }

        const result = await pool.query(
            'INSERT INTO harvesting_monthly (estate, divisi, month, target_kg) VALUES ($1,$2,$3,$4) RETURNING id',
            [estate, divisi, month, target_kg]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/harvesting/monthly/:id', async (req, res) => {
    try {
        const { target_kg } = req.body;
        await pool.query('UPDATE harvesting_monthly SET target_kg = $1 WHERE id = $2', [target_kg, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/harvesting/daily', async (req, res) => {
    try {
        const { date, estate, divisi, block, akp, est_janjang, est_kg, plan_pemanen, mandor, pusingan, allocated_trucks } = req.body;
        const result = await pool.query(
            'INSERT INTO harvesting_daily (date, estate, divisi, block, akp, est_janjang, est_kg, plan_pemanen, mandor, pusingan, realized_janjang, realized_pemanen, realized_kg, status, allocated_trucks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,0,0,$11,$12) RETURNING id',
            [date, estate, divisi, block, akp, est_janjang, est_kg, plan_pemanen, mandor, pusingan, 'Open', allocated_trucks || '[]']
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/harvesting/daily/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM harvesting_daily WHERE id = $1', [req.params.id]);
        pushUpdate('harvesting_daily');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/harvesting/daily/:id/realization', async (req, res) => {
    try {
        const { realized_janjang, realized_pemanen, realized_kg, realized_ha, status, ritase_list } = req.body;
        const newStatus = status || 'Closed';
        await pool.query(
            'UPDATE harvesting_daily SET realized_janjang = $1, realized_pemanen = $2, realized_kg = $3, realized_ha = $4, status = $5, ritase_list = COALESCE($6, ritase_list) WHERE id = $7',
            [realized_janjang, realized_pemanen, realized_kg, realized_ha, newStatus, ritase_list, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TONASE HOURLY
app.get('/api/tonase/:mill/:date', async (req, res) => {
    try {
        const { mill, date } = req.params;
        const result = await pool.query('SELECT * FROM tonase_hourly WHERE mill = $1 AND date = $2', [mill, date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TONASE MONTHLY
app.get('/api/tonase/:mill/month/:month', async (req, res) => {
    try {
        const { mill, month } = req.params;
        // month format: YYYY-MM
        const result = await pool.query("SELECT * FROM tonase_hourly WHERE mill = $1 AND date LIKE $2 || '%'", [mill, month]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tonase/plan', async (req, res) => {
    try {
        const { date, mill, entries } = req.body;
        
        // Deduplicate entries (take LAST occurrence) to bypass client-side cache bugs
        const uniqueMap = new Map();
        for (let item of entries) {
            const key = `${item.estate}_${item.time_hour}`;
            uniqueMap.set(key, item); // Overwrites, so last wins
        }
        const uniqueEntries = Array.from(uniqueMap.values());
        
        for (let item of uniqueEntries) {
            const check = await pool.query('SELECT id FROM tonase_hourly WHERE date=$1 AND mill=$2 AND estate=$3 AND time_hour=$4', [date, mill, item.estate, item.time_hour]);
            if (check.rows.length > 0) {
                await pool.query('UPDATE tonase_hourly SET target_kg=$1 WHERE date=$2 AND mill=$3 AND estate=$4 AND time_hour=$5', [item.target_kg || 0, date, mill, item.estate, item.time_hour]);
            } else {
                await pool.query('INSERT INTO tonase_hourly (date, mill, estate, time_hour, target_kg) VALUES ($1,$2,$3,$4,$5)', [date, mill, item.estate, item.time_hour, item.target_kg || 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tonase/realization', async (req, res) => {
    try {
        const { date, mill, entries } = req.body;
        
        // Deduplicate entries (take LAST occurrence) to bypass client-side cache bugs
        const uniqueMap = new Map();
        for (let item of entries) {
            const key = `${item.estate}_${item.time_hour}`;
            uniqueMap.set(key, item); // Overwrites, so last wins
        }
        const uniqueEntries = Array.from(uniqueMap.values());
        
        for (let item of uniqueEntries) {
            const check = await pool.query('SELECT id FROM tonase_hourly WHERE date=$1 AND mill=$2 AND estate=$3 AND time_hour=$4', [date, mill, item.estate, item.time_hour]);
            if (check.rows.length > 0) {
                await pool.query('UPDATE tonase_hourly SET realized_kg=$1, realized_trip=$2 WHERE date=$3 AND mill=$4 AND estate=$5 AND time_hour=$6', [item.realized_kg || 0, item.realized_trip || 0, date, mill, item.estate, item.time_hour]);
            } else {
                await pool.query('INSERT INTO tonase_hourly (date, mill, estate, time_hour, realized_kg, realized_trip) VALUES ($1,$2,$3,$4,$5,$6)', [date, mill, item.estate, item.time_hour, item.realized_kg || 0, item.realized_trip || 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DAILY MONITORING ROUTES
app.get('/api/daily-monitor/:mill/:date', async (req, res) => {
    try {
        const { mill, date } = req.params;
        const month = date.substring(0, 7);
        const lf = await pool.query('SELECT * FROM lf_received_daily WHERE mill=$1 AND date=$2', [mill, date]);
        const efb = await pool.query('SELECT * FROM efb_transport_daily WHERE mill=$1 AND date=$2', [mill, date]);
        const despatch = await pool.query('SELECT * FROM despatch_daily WHERE mill=$1 AND date=$2', [mill, date]);
        const config = await pool.query('SELECT * FROM mill_daily_config WHERE mill=$1 AND date=$2', [mill, date]);
        
        const efb_mtd = await pool.query("SELECT estate, SUM(tonase) as tonase_mtd, SUM(target) as target_mtd FROM efb_transport_daily WHERE mill=$1 AND date LIKE $2 || '%' AND date <= $3 GROUP BY estate", [mill, month, date]);
        
        res.json({
            lf: lf.rows,
            efb: efb.rows,
            efb_mtd: efb_mtd.rows,
            despatch: despatch.rows,
            config: config.rows[0] || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/daily-monitor/lf', async (req, res) => {
    try {
        const { date, mill, entries } = req.body;
        for (let item of entries) {
            const check = await pool.query('SELECT id FROM lf_received_daily WHERE date=$1 AND mill=$2 AND estate=$3', [date, mill, item.estate]);
            if (check.rows.length > 0) {
                await pool.query('UPDATE lf_received_daily SET actual_lf_tonase=$1, actual_ffb_tonase=$2 WHERE date=$3 AND mill=$4 AND estate=$5', [item.actual_lf_tonase || 0, item.actual_ffb_tonase || 0, date, mill, item.estate]);
            } else {
                await pool.query('INSERT INTO lf_received_daily (date, mill, estate, actual_lf_tonase, actual_ffb_tonase) VALUES ($1,$2,$3,$4,$5)', [date, mill, item.estate, item.actual_lf_tonase || 0, item.actual_ffb_tonase || 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/daily-monitor/efb', async (req, res) => {
    try {
        const { date, mill, entries } = req.body;
        for (let item of entries) {
            const check = await pool.query('SELECT * FROM efb_transport_daily WHERE date=$1 AND mill=$2 AND estate=$3', [date, mill, item.estate]);
            if (check.rows.length > 0) {
                const e = check.rows[0];
                const newTonase = item.tonase !== undefined ? item.tonase : e.tonase;
                const newTrip = item.trip !== undefined ? item.trip : e.trip;
                const newTarget = item.target !== undefined ? item.target : e.target;
                await pool.query('UPDATE efb_transport_daily SET tonase=$1, trip=$2, target=$3 WHERE date=$4 AND mill=$5 AND estate=$6', [newTonase, newTrip, newTarget, date, mill, item.estate]);
            } else {
                await pool.query('INSERT INTO efb_transport_daily (date, mill, estate, tonase, trip, target) VALUES ($1,$2,$3,$4,$5,$6)', [date, mill, item.estate, item.tonase || 0, item.trip || 0, item.target || 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error("EFB SAVE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/daily-monitor/despatch', async (req, res) => {
    try {
        const { date, mill, entries } = req.body;
        for (let item of entries) {
            const check = await pool.query('SELECT id FROM despatch_daily WHERE date=$1 AND mill=$2 AND product=$3', [date, mill, item.product]);
            if (check.rows.length > 0) {
                await pool.query('UPDATE despatch_daily SET trip=$1, tonase=$2 WHERE date=$3 AND mill=$4 AND product=$5', [item.trip || 0, item.tonase || 0, date, mill, item.product]);
            } else {
                await pool.query('INSERT INTO despatch_daily (date, mill, product, trip, tonase) VALUES ($1,$2,$3,$4,$5)', [date, mill, item.product, item.trip || 0, item.tonase || 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/daily-monitor/config', async (req, res) => {
    try {
        const { date, mill, is_processing, efb_ratio, sisa_kemarin_jjk, is_locked } = req.body;
        const check = await pool.query('SELECT id FROM mill_daily_config WHERE date=$1 AND mill=$2', [date, mill]);
        if (check.rows.length > 0) {
            let query = 'UPDATE mill_daily_config SET is_processing=$1, efb_ratio=$2, sisa_kemarin_jjk=$3';
            let params = [is_processing || 0, efb_ratio || 0, sisa_kemarin_jjk || 0];
            if (is_locked !== undefined) {
                query += ', is_locked=$4';
                params.push(is_locked ? 1 : 0);
                params.push(date, mill);
                query += ' WHERE date=$5 AND mill=$6';
            } else {
                params.push(date, mill);
                query += ' WHERE date=$4 AND mill=$5';
            }
            await pool.query(query, params);
        } else {
            await pool.query('INSERT INTO mill_daily_config (date, mill, is_processing, efb_ratio, sisa_kemarin_jjk, is_locked) VALUES ($1,$2,$3,$4,$5,$6)', [date, mill, is_processing || 0, efb_ratio || 0, sisa_kemarin_jjk || 0, is_locked ? 1 : 0]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
