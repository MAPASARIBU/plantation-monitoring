const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

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
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

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
            janjang INTEGER, timeDepart TEXT, timeArrive TEXT
        )`);
        
        await pool.query(`CREATE TABLE IF NOT EXISTS upkeep (
            id SERIAL PRIMARY KEY,
            block TEXT, type TEXT, target REAL, realized REAL, worker TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS pemupukan (
            id SERIAL PRIMARY KEY,
            startDate TEXT,
            block TEXT, plan TEXT, targetKg REAL, realizedKg REAL, status TEXT DEFAULT 'Aktif'
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS pemupukan_history (
            id SERIAL PRIMARY KEY,
            pemupukan_id INTEGER, dateAdded TEXT, addedKg REAL, manpower INTEGER DEFAULT 0
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS harvesting (
            id SERIAL PRIMARY KEY,
            block TEXT, targetJanjang REAL, realizedJanjang REAL, bjr REAL
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS master_divisi (id SERIAL PRIMARY KEY, estate TEXT, name TEXT)`);
        // Added divisi column because it's used in bulk insert checking
        await pool.query(`CREATE TABLE IF NOT EXISTS master_blok (id SERIAL PRIMARY KEY, estate TEXT, name TEXT, bjr REAL DEFAULT 0, divisi TEXT)`); 
        await pool.query(`CREATE TABLE IF NOT EXISTS master_truk (id SERIAL PRIMARY KEY, estate TEXT, plate_number TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS master_pupuk (id SERIAL PRIMARY KEY, estate TEXT, name TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS master_supir (id SERIAL PRIMARY KEY, estate TEXT, name TEXT)`);

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
                ['KRNM', 'KRNM123', 'Krani Mill']
            ];
            for (let user of seedUsers) {
                await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', user);
            }
        }

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
        const divisi = await pool.query('SELECT * FROM master_divisi WHERE estate = $1', [estate]);
        const blok = await pool.query('SELECT * FROM master_blok WHERE estate = $1', [estate]);
        const truk = await pool.query('SELECT * FROM master_truk WHERE estate = $1', [estate]);
        const pupuk = await pool.query('SELECT * FROM master_pupuk WHERE estate = $1', [estate]);
        const supir = await pool.query('SELECT * FROM master_supir WHERE estate = $1', [estate]);
        
        res.json({
            divisi: divisi.rows,
            blok: blok.rows,
            truk: truk.rows,
            pupuk: pupuk.rows,
            supir: supir.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const { estate, name, bjr, plate_number, divisi } = req.body;
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
        else if (type === 'blok') { sql = 'INSERT INTO master_blok (estate, name, bjr, divisi) VALUES ($1,$2,$3,$4) RETURNING id'; params = [estate, name, bjr || 0, divisi || '']; }
        else if (type === 'truk') { sql = 'INSERT INTO master_truk (estate, plate_number) VALUES ($1,$2) RETURNING id'; params = [estate, plate_number]; }
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
            valuesStr.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3})`);
            params.push(estate, b.name, b.bjr || 0, divisi);
            paramIndex += 4;
        });
        
        await pool.query(`INSERT INTO master_blok (estate, name, bjr, divisi) VALUES ${valuesStr.join(',')}`, params);
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
        const { name, plate_number, bjr } = req.body;
        let table = `master_${type}`;
        
        let sql, params;
        if (type === 'blok') {
            sql = 'UPDATE master_blok SET name = $1, bjr = $2 WHERE id = $3';
            params = [name, bjr, id];
        } else if (type === 'truk') {
            sql = `UPDATE master_truk SET plate_number = $1 WHERE id = $2`;
            params = [plate_number, id];
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

// ALL DATA
app.get('/api/data', async (req, res) => {
    try {
        const vehicles = await pool.query('SELECT * FROM vehicles');
        const upkeep = await pool.query('SELECT * FROM upkeep');
        const pemupukan = await pool.query('SELECT * FROM pemupukan');
        const harvesting = await pool.query('SELECT * FROM harvesting');
        
        res.json({
            vehicles: vehicles.rows,
            upkeep: upkeep.rows,
            pemupukan: pemupukan.rows,
            harvesting: harvesting.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// VEHICLES
app.post('/api/vehicles', async (req, res) => {
    try {
        const { plate, driver, ritase, block, janjang, timeDepart, timeArrive } = req.body;
        const result = await pool.query(
            'INSERT INTO vehicles (plate, driver, ritase, block, janjang, timeDepart, timeArrive) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
            [plate, driver, ritase, block, janjang, timeDepart, timeArrive]
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
        const { block, type, target, realized, worker } = req.body;
        const result = await pool.query(
            'INSERT INTO upkeep (block, type, target, realized, worker) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [block, type, target, realized, worker]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PEMUPUKAN
app.post('/api/pemupukan', async (req, res) => {
    try {
        const { startDate, block, plan, targetKg } = req.body;
        const result = await pool.query(
            'INSERT INTO pemupukan (startDate, block, plan, targetKg, realizedKg, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [startDate, block, plan, targetKg, 0, 'Aktif']
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/pemupukan/:id/add', async (req, res) => {
    const client = await pool.connect();
    try {
        const { additionalKg, dateAdded, manpower } = req.body;
        await client.query('BEGIN');
        await client.query('UPDATE pemupukan SET realizedKg = realizedKg + $1 WHERE id = $2', [additionalKg, req.params.id]);
        await client.query(
            'INSERT INTO pemupukan_history (pemupukan_id, dateAdded, addedKg, manpower) VALUES ($1,$2,$3,$4)',
            [req.params.id, dateAdded, additionalKg, manpower || 0]
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

// HARVESTING
app.post('/api/harvesting', async (req, res) => {
    try {
        const { block, targetJanjang, realizedJanjang, bjr } = req.body;
        const result = await pool.query(
            'INSERT INTO harvesting (block, targetJanjang, realizedJanjang, bjr) VALUES ($1,$2,$3,$4) RETURNING id',
            [block, targetJanjang, realizedJanjang, bjr]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
