// API Base URL
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3005/api' : '/api';

// Data Store (Fetched from Backend)
let db = { vehicles: [], upkeep: [], pemupukan: [], harvesting: [], users: [] };

// Fetch data from Server
const loadData = async () => {
    try {
        const response = await fetch(`${API_URL}/data`);
        if (response.ok) {
            const data = await response.json();
            db.vehicles = data.vehicles;
            db.upkeep = data.upkeep;
            db.pemupukan = data.pemupukan;
            db.harvesting = data.harvesting;
            // Re-render views if they are currently active
            if(document.getElementById('tbody-vehicle')) renderVehicleTable();
            if(document.getElementById('tbody-upkeep')) renderUpkeepTable();
            if(document.getElementById('tbody-pemupukan')) renderPemupukanTable();
            if(document.getElementById('tbody-harvesting')) renderHarvestingTable();
        }
    } catch (error) {
        console.error("Error loading data from backend:", error);
    }
};

const loadUsers = async () => {
    if (currentUser && currentUser.role === 'Admin') {
        try {
            const res = await fetch(`${API_URL}/users`);
            if (res.ok) {
                db.users = await res.json();
                if (document.getElementById('tbody-users')) renderUsersTable();
            }
        } catch (e) { console.error(e); }
    }
}

// Current Session
let currentUser = null;
const checkAuth = () => {
    const savedUser = localStorage.getItem('agrimonitor_user');
    if(savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        applyRBAC();
        document.querySelector('.user-name').innerText = currentUser.username;
        document.getElementById('display-role').innerText = currentUser.role;
        
        // Load data after auth
        loadData();
        if (currentUser.role === 'Admin') loadUsers();
        loadMasterData().then(() => {
            // Navigate based on role
            if(currentUser.role === 'Supir' || currentUser.role === 'Security') {
                navigate('vehicle');
            } else if (currentUser.role === 'Admin') {
                navigate('users');
            } else {
                navigate('dashboard');
            }
        });
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
};

const login = async (username, password, estate) => {
    const errorEl = document.getElementById('login-error');
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        
        if (result.success) {
            errorEl.style.display = 'none';
            currentUser = result.user;
            if (estate) currentUser.estate = estate;
            localStorage.setItem('agrimonitor_user', JSON.stringify(currentUser));
            document.getElementById('login-form').reset();
            checkAuth();
        } else {
            errorEl.innerText = result.message;
            errorEl.style.display = 'block';
        }
    } catch (e) {
        errorEl.innerText = "Gagal terhubung ke server.";
        errorEl.style.display = 'block';
    }
};

const logout = () => {
    localStorage.removeItem('agrimonitor_user');
    currentUser = null;
    checkAuth();
};

// RBAC (Role-Based Access Control) Filter
const applyRBAC = () => {
    if (!currentUser) return;
    const role = currentUser.role;
    const navItems = document.querySelectorAll('.nav-item');
    
    // Default hiding all
    navItems.forEach(item => item.style.display = 'none');
    
    // Unhide based on role
    const showViews = (views) => {
        views.forEach(v => {
            const el = document.querySelector(`.nav-item[data-view="${v}"]`);
            if(el) el.style.display = 'flex';
        });
    };
    
    if (role === 'Admin') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'users', 'master']);
    } else if (role === 'Senior Field Manager' || role === 'Estate Manager' || role === 'Manager' || role === 'Asisten Kepala' || role === 'Division Manager' || role === 'Assistant') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting']);
    } else if (role === 'Askep' || role === 'Office Assistant (OAA)') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Mandor' || role === 'Krani Divisi' || role === 'Krani Mill') {
        showViews(['vehicle', 'pemupukan', 'upkeep', 'harvesting']);
    } else if (role === 'Supir' || role === 'Security') {
        showViews(['vehicle']);
    }
};

// Utilities
const calculateDuration = (start, end) => {
    if (!start || !end) return "-";
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; 
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
};

const getProgressStr = (realized, target) => {
    return Math.round((realized / target) * 100);
};

// Views Templates
const views = {
    dashboard: `
        <div class="animate-fade-in">
            <div class="dashboard-grid">
                <div class="glass-card stat-card">
                    <div class="stat-icon green"><i class="fa-solid fa-truck"></i></div>
                    <div class="stat-details">
                        <h3>Truk Aktif</h3>
                        <p>12 <span style="font-size: 0.8rem; font-weight: normal; color: var(--success);"><i class="fa-solid fa-arrow-up"></i> 2</span></p>
                    </div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-icon orange"><i class="fa-solid fa-seedling"></i></div>
                    <div class="stat-details">
                        <h3>Pupuk Tersalur</h3>
                        <p>75%</p>
                    </div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-icon blue"><i class="fa-solid fa-scale-balanced"></i></div>
                    <div class="stat-details">
                        <h3>Tonase Hari Ini</h3>
                        <p>145 T</p>
                    </div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="stat-details">
                        <h3>Pending Upkeep</h3>
                        <p>3 Blok</p>
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="glass-card">
                    <div class="view-header">
                        <h2>Grafik Tonase TBS / Jam</h2>
                    </div>
                    <canvas id="tonaseChart" height="100"></canvas>
                </div>
                <div class="glass-card">
                    <div class="view-header">
                        <h2>Progress Panen Hari Ini</h2>
                    </div>
                    <div style="margin-top: 20px;">
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Divisi 1</span>
                                <strong>85%</strong>
                            </div>
                            <div class="progress-wrapper"><div class="progress-fill" style="width: 85%"></div></div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Divisi 2</span>
                                <strong>60%</strong>
                            </div>
                            <div class="progress-wrapper"><div class="progress-fill" style="width: 60%; background-color: var(--warning)"></div></div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Divisi 3</span>
                                <strong>40%</strong>
                            </div>
                            <div class="progress-wrapper"><div class="progress-fill" style="width: 40%; background-color: var(--danger)"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    vehicle: `
        <div class="animate-fade-in module-layout">
            <div class="glass-card form-container">
                <h2>Input Pergerakan</h2>
                <form id="form-vehicle" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Plate Truk</label>
                        <select id="v-plate" class="form-control select-truk" required></select>
                    </div>
                    <div class="form-group">
                        <label>Nama Supir</label>
                        <select id="v-driver" class="form-control select-supir" required></select>
                    </div>
                    <div class="form-group">
                        <label>Ritase Ke</label>
                        <input type="number" id="v-ritase" class="form-control" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Pilih Divisi (Opsional)</label>
                        <select class="form-control select-divisi" onchange="filterBlok(this.value, 'v-block')"></select>
                    </div>
                    <div class="form-group">
                        <label>Blok Keberangkatan</label>
                        <select id="v-block" class="form-control select-blok" required></select>
                    </div>
                    <div class="form-group">
                        <label>Jumlah Janjang</label>
                        <input type="number" id="v-janjang" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-save"></i> Simpan Data
                    </button>
                </form>
            </div>
            <div class="glass-card table-wrapper">
                <div class="view-header">
                    <h2>Tabel Monitoring Truk</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Plate Truk</th>
                                <th>Ritase</th>
                                <th>Blok</th>
                                <th>Janjang</th>
                                <th>Berangkat</th>
                                <th>Tiba PKS</th>
                                <th>Durasi</th>
                                <th>Aksi (PKS)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-vehicle"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    upkeep: `
        <div class="animate-fade-in module-layout">
            <div class="glass-card form-container">
                <h2>Input Upkeep</h2>
                <form id="form-upkeep" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Pilih Divisi (Opsional)</label>
                        <select class="form-control select-divisi" onchange="filterBlok(this.value, 'u-block')"></select>
                    </div>
                    <div class="form-group">
                        <label>Blok</label>
                        <select id="u-block" class="form-control select-blok" required></select>
                    </div>
                    <div class="form-group">
                        <label>Jenis Pekerjaan</label>
                        <select id="u-type" class="form-control">
                            <option>Pruning</option>
                            <option>Weeding</option>
                            <option>Spraying</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Target (Ha)</label>
                        <input type="number" step="0.1" id="u-target" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Realisasi (Ha)</label>
                        <input type="number" step="0.1" id="u-realized" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Penanggung Jawab (Mandor)</label>
                        <input type="text" id="u-worker" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-plus"></i> Tambah Upkeep
                    </button>
                </form>
            </div>
            <div class="glass-card table-wrapper">
                <div class="view-header">
                    <h2>Progress Upkeep Harian</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Blok</th>
                                <th>Pekerjaan</th>
                                <th>Target (Ha)</th>
                                <th>Realisasi (Ha)</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-upkeep"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    pemupukan: `
        <div class="animate-fade-in module-layout">
            <div class="glass-card form-container">
                <h2>Buat Rencana Pemupukan</h2>
                <form id="form-pemupukan" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Tanggal Mulai</label>
                        <input type="date" id="p-start" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Pilih Divisi (Opsional)</label>
                        <select class="form-control select-divisi" onchange="filterBlok(this.value, 'p-block')"></select>
                    </div>
                    <div class="form-group">
                        <label>Pilihan Blok</label>
                        <select id="p-block" class="form-control select-blok" required></select>
                    </div>
                    <div class="form-group">
                        <label>Jenis Pupuk</label>
                        <select id="p-plan" class="form-control select-pupuk" required></select>
                    </div>
                    <div class="form-group">
                        <label>Target Total (Kg)</label>
                        <input type="number" id="p-target" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-plus"></i> Buat Rencana
                    </button>
                </form>
            </div>
            <div class="glass-card table-wrapper">
                <div class="view-header">
                    <h2>Monitoring Pemupukan Blok</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mulai</th>
                                <th>Blok</th>
                                <th>Pupuk</th>
                                <th>Target (Kg)</th>
                                <th>Realisasi (Kg)</th>
                                <th>Progress</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-pemupukan"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    harvesting: `
        <div class="animate-fade-in module-layout">
            <div class="glass-card form-container">
                <h2>Data Panen</h2>
                <form id="form-harvesting" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Pilih Divisi (Opsional)</label>
                        <select class="form-control select-divisi" onchange="filterBlok(this.value, 'h-block')"></select>
                    </div>
                    <div class="form-group">
                        <label>Blok</label>
                        <select id="h-block" class="form-control select-blok" required onchange="onHarvestingBlockChange(this.value)"></select>
                    </div>
                    <div class="form-group">
                        <label>Target Janjang</label>
                        <input type="number" id="h-target" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Realisasi Janjang</label>
                        <input type="number" id="h-realized" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>BJR (Berat Janjang Rata-rata)</label>
                        <input type="number" step="0.1" id="h-bjr" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-basket-shopping"></i> Simpan Panen
                    </button>
                </form>
            </div>
            <div class="glass-card table-wrapper">
                <div class="view-header">
                    <h2>Monitoring Hasil Panen</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Blok</th>
                                <th>Target (JJg)</th>
                                <th>Realisasi (JJg)</th>
                                <th>Progress</th>
                                <th>Estimasi Tonase (BJR)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-harvesting"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    tonase: `
        <div class="animate-fade-in glass-card">
            <div class="view-header">
                <h2>Tonase TBS Masuk PKS per Jam</h2>
                <button class="btn btn-primary"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
            </div>
            <div style="height: 400px; width: 100%; margin-top: 20px;">
                <canvas id="tonaseBigChart"></canvas>
            </div>
        </div>
    `,
    master: `
        <div class="animate-fade-in">
            <div class="view-header">
                <h2>Master Data <span class="estate-name-display" style="color:var(--primary); font-weight:bold;"></span></h2>
                <p>Kelola daftar blok, divisi, truk, pupuk, dan supir yang muncul di form.</p>
            </div>
            <div class="master-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top:20px;">
                <!-- Divisi & Blok Hierarchical -->
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Divisi & Blok</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddDivisi()"><i class="fa-solid fa-plus"></i> Tambah Divisi Baru</button>
                    </div>
                    <div id="container-master-divisi" style="margin-top: 25px; display:flex; flex-direction:column; gap:20px;">
                        <!-- Injected JS Divisi Cards -->
                    </div>
                </div>
                <!-- Truk -->
                <div class="glass-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Truk</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddMaster('truk')"><i class="fa-solid fa-plus"></i> Tambah Truk</button>
                    </div>
                    <div id="container-master-truk" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;"></div>
                </div>
                <!-- Supir -->
                <div class="glass-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Supir</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddMaster('supir')"><i class="fa-solid fa-plus"></i> Tambah Supir</button>
                    </div>
                    <div id="container-master-supir" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;"></div>
                </div>
                <!-- Pupuk -->
                <div class="glass-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Jenis Pupuk</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddMaster('pupuk')"><i class="fa-solid fa-plus"></i> Tambah Pupuk</button>
                    </div>
                    <div id="container-master-pupuk"></div>
                </div>
            </div>
        </div>
    `,
    users: `
        <div class="animate-fade-in module-layout">
            <div class="glass-card form-container">
                <h2>Master User Baru</h2>
                <form id="form-user" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="u-username" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Password (Sementara)</label>
                        <input type="text" id="u-password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="u-role" class="form-control" required>
                            <option>Senior Field Manager</option>
                            <option>Manager</option>
                            <option>Askep</option>
                            <option>Office Assistant (OAA)</option>
                            <option>Assistant</option>
                            <option>Krani Divisi</option>
                            <option>Krani Mill</option>
                            <option>Supir</option>
                            <option>Security</option>
                            <option>Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Penempatan Estate</label>
                        <select id="u-estate" class="form-control" required>
                            <option value="" disabled selected>-- Pilih Estate --</option>
                            <option>Semua Estate (Khusus Admin)</option>
                            <option>Bunga Tanjung Estate</option>
                            <option>Sungai Teramang Estate</option>
                            <option>Air Bukik Estate</option>
                            <option>Air Buluh Estate</option>
                            <option>Malin Demang Estate</option>
                            <option>Batu Kuda Estate</option>
                            <option>Sungai Jerinjing Estate</option>
                            <option>Muko Muko Estate</option>
                            <option>Talang Petai Estate</option>
                            <option>Sungai Kiang Estate</option>
                            <option>Tanah Rekah Estate</option>
                            <option>Air Majunto Estate</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                        <i class="fa-solid fa-user-plus"></i> Tambah User
                    </button>
                </form>
            </div>
            <div class="glass-card table-wrapper">
                <div class="view-header">
                    <h2>Daftar User Sistem</h2>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Estate</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-users"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `
};

// Render Functions
const renderVehicleTable = () => {
    const tbody = document.getElementById('tbody-vehicle');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    [...db.vehicles].reverse().forEach(v => {
        const tDepart = v.timedepart || v.timeDepart;
        const tArrive = v.timearrive || v.timeArrive;
        const duration = calculateDuration(tDepart, tArrive);
        const actionBtn = (!tArrive && currentUser.role !== 'Senior Field Manager') ? 
            `<button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="setArrival(${v.id})">Tiba di PKS</button>` : 
            (!tArrive ? `<span class="status-badge" style="background:#f59e0b">Di Perjalanan</span>` : `<span class="status-badge status-done">Selesai</span>`);
            
        tbody.innerHTML += `
            <tr>
                <td><strong>${v.plate}</strong><br><small>${v.driver}</small></td>
                <td>${v.ritase}</td>
                <td>${v.block}</td>
                <td>${v.janjang}</td>
                <td>${tDepart}</td>
                <td>${tArrive || '-'}</td>
                <td><strong>${duration}</strong></td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
};

const renderUpkeepTable = () => {
    const tbody = document.getElementById('tbody-upkeep');
    if (!tbody) return;
    tbody.innerHTML = '';
    [...db.upkeep].reverse().forEach(u => {
        const pct = getProgressStr(u.realized, u.target);
        const status = pct >= 100 ? '<span class="status-badge status-done">Selesai</span>' : '<span class="status-badge status-progress">In Progress</span>';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.block}</strong></td>
                <td>${u.type}<br><small>${u.worker}</small></td>
                <td>${u.target}</td>
                <td>${u.realized}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="progress-wrapper" style="width: 100px; margin:0;"><div class="progress-fill" style="width: ${pct}%"></div></div>
                        <small>${pct}%</small>
                    </div>
                </td>
                <td>${status}</td>
            </tr>
        `;
    });
};

const renderPemupukanTable = () => {
    const tbody = document.getElementById('tbody-pemupukan');
    if (!tbody) return;
    tbody.innerHTML = '';
    [...db.pemupukan].reverse().forEach(p => {
        const tKg = p.targetkg || p.targetKg || 0;
        const rKg = p.realizedkg || p.realizedKg || 0;
        const sDate = p.startdate || p.startDate;
        const pct = getProgressStr(rKg, tKg);
        let actionBtn = '-';
        if (currentUser.role !== 'Senior Field Manager') {
            const riwayatBtn = `<button class="btn" style="padding: 2px 6px; font-size: 0.7rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="viewPemupukanHistory(${p.id}, '${p.block}', '${p.plan}')"><i class="fa-solid fa-clock-rotate-left"></i> Riwayat</button>`;
            
            if (p.status === 'Selesai') {
                actionBtn = `
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <span class="status-badge status-done" style="text-align:center;">Selesai</span>
                        ${riwayatBtn}
                    </div>
                `;
            } else {
                actionBtn = `
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <button class="btn btn-primary" style="padding: 2px 6px; font-size: 0.7rem;" onclick="openAddRealizationModal(${p.id}, '${p.block}', '${p.plan}', '${sDate}')"><i class="fa-solid fa-plus"></i> Tambah</button>
                        ${riwayatBtn}
                        <button class="btn btn-logout" style="padding: 2px 6px; font-size: 0.7rem; background: #ef4444; color: white; border-radius: 4px;" onclick="closePemupukan(${p.id}, '${p.block}')"><i class="fa-solid fa-check"></i> Tutup</button>
                    </div>
                `;
            }
        }
            
        tbody.innerHTML += `
            <tr>
                <td>${sDate || '-'}</td>
                <td><strong>${p.block}</strong></td>
                <td>${p.plan}</td>
                <td>${tKg}</td>
                <td>${rKg}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="progress-wrapper" style="width: 100px; margin:0;"><div class="progress-fill" style="width: ${pct}%"></div></div>
                        <strong>${pct}%</strong>
                    </div>
                </td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
};

const renderHarvestingTable = () => {
    const tbody = document.getElementById('tbody-harvesting');
    if (!tbody) return;
    tbody.innerHTML = '';
    [...db.harvesting].reverse().forEach(h => {
        const pct = getProgressStr(h.realizedJanjang, h.targetJanjang);
        const tonase = (h.realizedJanjang * h.bjr) / 1000;
        tbody.innerHTML += `
            <tr>
                <td><strong>${h.block}</strong></td>
                <td>${h.targetJanjang}</td>
                <td>${h.realizedJanjang}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="progress-wrapper" style="width: 100px; margin:0;"><div class="progress-fill" style="width: ${pct}%; background-color: var(--secondary-color)"></div></div>
                        <small>${pct}%</small>
                    </div>
                </td>
                <td>${tonase.toFixed(2)} Ton</td>
            </tr>
        `;
    });
};

const renderUsersTable = () => {
    const tbody = document.getElementById('tbody-users');
    if (!tbody) return;
    tbody.innerHTML = '';
    [...db.users].forEach(u => {
        const deleteBtn = (u.username !== 'admin' && currentUser.role !== 'Senior Field Manager') ? 
            `<button class="btn btn-logout" style="padding: 4px 8px; font-size: 0.8rem; color: #ef4444;" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>` : '-';
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.username}</strong></td>
                <td><span class="status-badge" style="background: rgba(0,0,0,0.1)">${u.role}</span></td>
                <td><small>${u.estate || '-'}</small></td>
                <td>${deleteBtn}</td>
            </tr>
        `;
    });
};

window.setArrival = async (id) => {
    const now = new Date();
    const timeArrive = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
        const response = await fetch(`${API_URL}/vehicles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeArrive })
        });
        if(response.ok) {
            await loadData();
        }
    } catch (e) {
        console.error(e);
    }
};

window.openAddRealizationModal = (id, block, plan, startDate) => {
    const today = new Date().toISOString().split('T')[0];
    const html = `
        <div class="modal-overlay" id="modal-add">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Realisasi Blok ${block}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-add').remove()">&times;</button>
                </div>
                <div class="form-group">
                    <label>Tanggal Pekerjaan</label>
                    <input type="date" id="m-date" class="form-control" value="${today}" min="${startDate}">
                </div>
                <div class="form-group">
                    <label>Jumlah Pupuk (Kg)</label>
                    <input type="number" id="m-kg" class="form-control" placeholder="Contoh: 250">
                </div>
                <div class="form-group">
                    <label>Jumlah Manpower (Orang)</label>
                    <input type="number" id="m-mp" class="form-control" placeholder="Contoh: 5">
                </div>
                <button class="btn btn-primary btn-block" onclick="submitRealization(${id}, '${startDate}')">Simpan Data</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.submitRealization = async (id, startDate) => {
    const dateAdded = document.getElementById('m-date').value;
    const kg = parseFloat(document.getElementById('m-kg').value);
    const mp = parseInt(document.getElementById('m-mp').value) || 0;
    if(!dateAdded || dateAdded < startDate) {
        alert('Tanggal tidak valid! Tidak boleh lebih awal dari ' + startDate);
        return;
    }
    if(isNaN(kg) || kg <= 0) {
        alert('Jumlah Kg tidak valid!');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/pemupukan/${id}/add`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ additionalKg: kg, dateAdded, manpower: mp })
        });
        if(response.ok) {
            document.getElementById('modal-add').remove();
            await loadData();
        }
    } catch(e) { console.error(e); }
};

window.viewPemupukanHistory = async (id, block, plan) => {
    try {
        const res = await fetch(`${API_URL}/pemupukan/${id}/history`);
        const data = await res.json();
        
        let rows = '';
        if(data.length === 0) {
            rows = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat</td></tr>';
        } else {
            data.forEach(h => {
                const dAdded = h.dateadded || h.dateAdded;
                const aKg = h.addedkg || h.addedKg;
                const prestasi = (h.manpower && h.manpower > 0) ? (aKg / h.manpower).toFixed(1) + ' Kg/HK' : '-';
                rows += `<tr><td>${dAdded}</td><td><strong>+ ${aKg} Kg</strong></td><td>${h.manpower || 0} Org <br><small style="color:gray;">${prestasi}</small></td></tr>`;
            });
        }
        
        const html = `
            <div class="modal-overlay" id="modal-history">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Riwayat Blok ${block} <span style="font-size:0.8rem; font-weight:normal;">(${plan})</span></h3>
                        <button class="modal-close" onclick="document.getElementById('modal-history').remove()">&times;</button>
                    </div>
                    <table class="history-table">
                        <thead><tr><th>Tanggal</th><th>Penambahan</th><th>Manpower (Prestasi)</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    } catch(e) { console.error(e); }
};

window.closePemupukan = async (id, block) => {
    if(!confirm(`Yakin ingin menutup pekerjaan pemupukan untuk Blok ${block}?\\nAnda tidak akan bisa menambahkan realisasi lagi setelah ditutup.`)) return;
    
    try {
        const response = await fetch(`${API_URL}/pemupukan/${id}/close`, { method: 'PUT' });
        if(response.ok) await loadData();
    } catch (e) { console.error(e); }
};

window.deleteUser = async (id) => {
    if(confirm('Yakin ingin menghapus user ini?')) {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
            if(res.ok) await loadUsers();
        } catch(e) { console.error(e); }
    }
};

const bindForms = () => {
    const formVehicle = document.getElementById('form-vehicle');
    if(formVehicle) formVehicle.onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const autoTimeDepart = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const payload = {
            plate: document.getElementById('v-plate').value,
            driver: document.getElementById('v-driver').value,
            ritase: document.getElementById('v-ritase').value,
            block: document.getElementById('v-block').value,
            janjang: document.getElementById('v-janjang').value,
            timeDepart: autoTimeDepart,
            timeArrive: ""
        };
        try {
            await fetch(`${API_URL}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formVehicle.reset();
            await loadData();
        } catch (e) { console.error(e); }
    };

    const formUpkeep = document.getElementById('form-upkeep');
    if(formUpkeep) formUpkeep.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            block: document.getElementById('u-block').value,
            type: document.getElementById('u-type').value,
            target: parseFloat(document.getElementById('u-target').value),
            realized: parseFloat(document.getElementById('u-realized').value),
            worker: document.getElementById('u-worker').value
        };
        try {
            await fetch(`${API_URL}/upkeep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formUpkeep.reset();
            await loadData();
        } catch (e) { console.error(e); }
    };

    const formPemupukan = document.getElementById('form-pemupukan');
    if(formPemupukan) formPemupukan.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            startDate: document.getElementById('p-start').value,
            block: document.getElementById('p-block').value,
            plan: document.getElementById('p-plan').value,
            targetKg: parseFloat(document.getElementById('p-target').value)
        };
        try {
            await fetch(`${API_URL}/pemupukan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formPemupukan.reset();
            await loadData();
        } catch (e) { console.error(e); }
    };
    
    const formHarvesting = document.getElementById('form-harvesting');
    if(formHarvesting) formHarvesting.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            block: document.getElementById('h-block').value,
            targetJanjang: parseFloat(document.getElementById('h-target').value),
            realizedJanjang: parseFloat(document.getElementById('h-realized').value),
            bjr: parseFloat(document.getElementById('h-bjr').value)
        };
        try {
            await fetch(`${API_URL}/harvesting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formHarvesting.reset();
            await loadData();
        } catch (e) { console.error(e); }
    };

    const formUser = document.getElementById('form-user');
    if(formUser) formUser.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('u-username').value,
            password: document.getElementById('u-password').value,
            role: document.getElementById('u-role').value,
            estate: document.getElementById('u-estate').value
        };
        try {
            await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formUser.reset();
            await loadUsers();
        } catch (e) { console.error(e); }
    };
};

// Charts
const initDashboardChart = () => {
    const ctx = document.getElementById('tonaseChart');
    if(!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'],
            datasets: [{
                label: 'Tonase Masuk (T)',
                data: [15, 25, 30, 20, 10, 45],
                borderColor: '#0d8b4e',
                backgroundColor: 'rgba(13, 139, 78, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
};

const initBigTonaseChart = () => {
    const ctx = document.getElementById('tonaseBigChart');
    if(!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [{
                label: 'Realisasi Tonase Masuk',
                data: [5, 15, 25, 30, 20, 10, 45, 30, 25, 10],
                backgroundColor: '#f7a01d',
                borderRadius: 4
            }, {
                label: 'Target Tonase',
                data: [10, 20, 20, 20, 20, 15, 20, 20, 20, 15],
                backgroundColor: 'rgba(203, 213, 225, 0.5)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Komparasi Target vs Realisasi Tonase Per Jam' }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
};

// Navigation
const navigate = (viewId) => {
    const container = document.getElementById('view-container');
    const title = document.getElementById('page-title');
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if(activeNav) activeNav.classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        vehicle: 'Vehicle Motion Monitoring',
        upkeep: 'Upkeep Monitoring',
        pemupukan: 'Pemupukan Monitoring',
        tonase: 'Tonase Monitoring',
        harvesting: 'Harvesting Monitoring',
        users: 'Master User Management'
    };
    const baseTitle = titles[viewId] || 'Dashboard';
    title.innerText = currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)'
        ? `${baseTitle} - ${currentUser.estate}`
        : baseTitle;
    container.innerHTML = views[viewId] || views.dashboard;
    populateSelects();
    
    if(viewId === 'dashboard') initDashboardChart();
    if(viewId === 'vehicle') { renderVehicleTable(); bindForms(); }
    if(viewId === 'upkeep') { renderUpkeepTable(); bindForms(); }
    if(viewId === 'pemupukan') { renderPemupukanTable(); bindForms(); }
    if(viewId === 'harvesting') { renderHarvestingTable(); bindForms(); }
    if(viewId === 'tonase') initBigTonaseChart();
    if(viewId === 'users') { renderUsersTable(); bindForms(); }
    if(viewId === 'master') { renderMasterTables(); }
    
    // Read-only logic for Senior Field Manager
    if (currentUser && currentUser.role === 'Senior Field Manager') {
        const forms = container.querySelectorAll('.form-container');
        forms.forEach(f => f.style.display = 'none');
        const layouts = container.querySelectorAll('.module-layout');
        layouts.forEach(l => l.style.gridTemplateColumns = '1fr');
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth
    checkAuth();
    
    // Login Form Listener
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const estateEl = document.getElementById('login-estate');
            const estate = estateEl ? estateEl.value : null;
            login(username, password, estate);
        });
    }

    // Logout Button Listener
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
    
    // Nav Click Listener
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            navigate(view);
            if(window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('open');
            }
        });
    });
    
    // Mobile Toggle Listener
    const mobileToggle = document.getElementById('mobile-toggle');
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }
});

let masterData = { divisi: [], blok: [], truk: [], pupuk: [], supir: [] };

window.loadMasterData = async () => {
    if (!currentUser || !currentUser.estate) return;
    try {
        const res = await fetch(`${API_URL}/master/${encodeURIComponent(currentUser.estate)}`);
        const data = await res.json();
        masterData = data;
        renderMasterTables();
    } catch (e) {
        console.error("Gagal load master data", e);
    }
};

window.currentSelectedDivisi = window.currentSelectedDivisi || null;
window.currentSelectedTruk = window.currentSelectedTruk || null;
window.currentSelectedSupir = window.currentSelectedSupir || null;
window.currentSelectedPupuk = window.currentSelectedPupuk || null;

window.renderMasterTables = () => {
    const estateDisplays = document.querySelectorAll('.estate-name-display');
    estateDisplays.forEach(el => el.innerText = currentUser.estate);
    
    const containerDiv = document.getElementById('container-master-divisi');
    if(containerDiv) {
        let options = `<option value="">-- Pilih Divisi --</option>`;
        masterData.divisi.forEach(d => {
            options += `<option value="${d.name}" ${window.currentSelectedDivisi === d.name ? 'selected' : ''}>${d.name}</option>`;
        });
        
        let html = `
            <div style="margin-bottom: 20px;">
                <label style="font-weight:bold; display:block; margin-bottom:8px;">Pilih Divisi untuk Mengelola Blok:</label>
                <select id="select-divisi-view" class="form-control" style="max-width: 300px;" onchange="selectDivisi(this.value)">
                    ${options}
                </select>
            </div>
            <div id="divisi-selected-content"></div>
        `;
        containerDiv.innerHTML = html;
        
        if (window.currentSelectedDivisi) {
            renderSelectedDivisi();
        }
    }
    
    const cTruk = document.getElementById('container-master-truk');
    if (cTruk) {
        let opts = `<option value="">-- Pilih Truk --</option>`;
        masterData.truk.forEach(t => opts += `<option value="${t.plate_number}" ${window.currentSelectedTruk === t.plate_number ? 'selected' : ''}>${t.plate_number}</option>`);
        cTruk.innerHTML = `
            <label style="font-weight:bold; display:block; margin-bottom:8px;">Pilih Truk untuk Dikelola:</label>
            <select id="select-truk-view" class="form-control" style="max-width: 300px;" onchange="selectTruk(this.value)">${opts}</select>
            <div id="truk-selected-content" style="margin-top: 15px;"></div>
        `;
        if (window.currentSelectedTruk) renderSelectedTruk();
    }

    const cSupir = document.getElementById('container-master-supir');
    if (cSupir) {
        let opts = `<option value="">-- Pilih Supir --</option>`;
        masterData.supir.forEach(s => opts += `<option value="${s.name}" ${window.currentSelectedSupir === s.name ? 'selected' : ''}>${s.name}</option>`);
        cSupir.innerHTML = `
            <label style="font-weight:bold; display:block; margin-bottom:8px;">Pilih Supir untuk Dikelola:</label>
            <select id="select-supir-view" class="form-control" style="max-width: 300px;" onchange="selectSupir(this.value)">${opts}</select>
            <div id="supir-selected-content" style="margin-top: 15px;"></div>
        `;
        if (window.currentSelectedSupir) renderSelectedSupir();
    }
    
    const cPupuk = document.getElementById('container-master-pupuk');
    if (cPupuk) {
        let opts = `<option value="">-- Pilih Pupuk --</option>`;
        masterData.pupuk.forEach(p => opts += `<option value="${p.name}" ${window.currentSelectedPupuk === p.name ? 'selected' : ''}>${p.name}</option>`);
        cPupuk.innerHTML = `
            <label style="font-weight:bold; display:block; margin-bottom:8px; margin-top:15px;">Pilih Pupuk untuk Dikelola:</label>
            <select id="select-pupuk-view" class="form-control" style="max-width: 300px;" onchange="selectPupuk(this.value)">${opts}</select>
            <div id="pupuk-selected-content" style="margin-top: 15px;"></div>
        `;
        if (window.currentSelectedPupuk) renderSelectedPupuk();
    }
};

window.selectDivisi = (divisiName) => {
    window.currentSelectedDivisi = divisiName;
    renderSelectedDivisi();
};

window.renderSelectedDivisi = () => {
    const contentDiv = document.getElementById('divisi-selected-content');
    if (!contentDiv) return;
    
    const divisiName = window.currentSelectedDivisi;
    if (!divisiName) {
        contentDiv.innerHTML = '';
        return;
    }
    
    const d = masterData.divisi.find(x => x.name === divisiName);
    if (!d) return; 
    
    const bloks = masterData.blok.filter(b => b.divisi === d.name);
    const blokRows = bloks.map(b => `<tr><td>${b.name}</td><td>${b.bjr}</td><td style="width:120px; text-align:right;"><button type="button" class="btn btn-primary" style="padding:2px 6px; font-size:0.7rem; margin-right:5px;" onclick="editMasterBlok(${b.id}, '${b.name}', ${b.bjr})">Edit</button><button type="button" class="btn btn-logout" style="padding:2px 6px; font-size:0.7rem;" onclick="deleteMaster('blok', ${b.id})">Hapus</button></td></tr>`).join('');
    
    const safeDivName = d.name.replace(/['"\\n\\r]/g, ' ');
    contentDiv.innerHTML = `
        <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1; margin-bottom: 20px;">
            <strong style="font-size:1.1rem; margin-right: 20px;">${d.name}</strong>
            <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="editMaster('divisi', ${d.id}, '${safeDivName}')"><i class="fa-solid fa-pen"></i> Edit Divisi</button>
            <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.8rem;" onclick="deleteMaster('divisi', ${d.id})"><i class="fa-solid fa-trash"></i> Hapus Divisi</button>
        </div>
        
        <h4>Daftar Blok di ${d.name}</h4>
        <div style="margin: 15px 0; display:flex; gap:10px;">
            <form onsubmit="addBlokToDivisi(event, '${d.name}')" style="display:flex; gap:10px;">
                <input type="text" id="mb-name-${d.name.replace(/\s+/g, '-')}" class="form-control" placeholder="Nama Blok Baru" required style="width: 150px;">
                <input type="number" step="0.1" id="mb-bjr-${d.name.replace(/\s+/g, '-')}" class="form-control" placeholder="BJR" required style="width: 100px;">
                <button type="submit" class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;"><i class="fa-solid fa-plus"></i> Blok</button>
            </form>
            
            <div style="display:flex; gap:10px;">
                <input type="text" id="bulk-paste-${d.name.replace(/\s+/g, '-')}" class="form-control" placeholder="Paste data excel di sini (Blok\tBJR)" style="width: 250px;">
                <button type="button" class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="addBlokBulk('${d.name}')"><i class="fa-solid fa-paste"></i> Paste</button>
            </div>
        </div>
        <table class="data-table" style="font-size:0.85rem;">
            <thead><tr><th>Nama Blok</th><th>BJR (Kg)</th><th>Aksi</th></tr></thead>
            <tbody>${blokRows || '<tr><td colspan="3" style="text-align:center;">Belum ada blok di divisi ini.</td></tr>'}</tbody>
        </table>
    `;
};

window.selectTruk = (trukPlate) => {
    window.currentSelectedTruk = trukPlate;
    renderSelectedTruk();
};

window.renderSelectedTruk = () => {
    const contentDiv = document.getElementById('truk-selected-content');
    if (!contentDiv) return;
    const trukPlate = window.currentSelectedTruk;
    if (!trukPlate) {
        contentDiv.innerHTML = '';
        return;
    }
    const t = masterData.truk.find(x => x.plate_number === trukPlate);
    if(t) {
        const safeName = t.plate_number.replace(/['"\\n\\r]/g, ' ');
        contentDiv.innerHTML = `
            <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1;">
                <strong style="font-size:1.1rem; margin-right: 20px;">${safeName}</strong>
                <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="editMaster('truk', ${t.id}, '${safeName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.8rem;" onclick="deleteMaster('truk', ${t.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
            </div>
        `;
    }
};

window.selectSupir = (supirName) => {
    window.currentSelectedSupir = supirName;
    renderSelectedSupir();
};

window.renderSelectedSupir = () => {
    const contentDiv = document.getElementById('supir-selected-content');
    if (!contentDiv) return;
    const supirName = window.currentSelectedSupir;
    if (!supirName) {
        contentDiv.innerHTML = '';
        return;
    }
    const s = masterData.supir.find(x => x.name === supirName);
    if(s) {
        const safeName = s.name.replace(/['"\\n\\r]/g, ' ');
        contentDiv.innerHTML = `
            <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1;">
                <strong style="font-size:1.1rem; margin-right: 20px;">${safeName}</strong>
                <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="editMaster('supir', ${s.id}, '${safeName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.8rem;" onclick="deleteMaster('supir', ${s.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
            </div>
        `;
    }
};

window.selectPupuk = (pupukName) => {
    window.currentSelectedPupuk = pupukName;
    renderSelectedPupuk();
};

window.renderSelectedPupuk = () => {
    const contentDiv = document.getElementById('pupuk-selected-content');
    if (!contentDiv) return;
    const pupukName = window.currentSelectedPupuk;
    if (!pupukName) {
        contentDiv.innerHTML = '';
        return;
    }
    const p = masterData.pupuk.find(x => x.name === pupukName);
    if(p) {
        const safeName = p.name.replace(/['"\\n\\r]/g, ' ');
        contentDiv.innerHTML = `
            <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1;">
                <strong style="font-size:1.1rem; margin-right: 20px;">${safeName}</strong>
                <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="editMaster('pupuk', ${p.id}, '${safeName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.8rem;" onclick="deleteMaster('pupuk', ${p.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
            </div>
        `;
    }
};

window.promptAddMaster = async (type) => {
    if (!currentUser.estate) return;

    let titleStr = type === 'truk' ? 'Truk' : (type === 'supir' ? 'Supir' : 'Jenis Pupuk');
    let placeholderStr = type === 'truk' ? 'Plat Nomor (misal: BD 1234 N)' : (type === 'supir' ? 'Nama Supir' : 'Jenis Pupuk (ex: Urea)');
    
    const html = `
        <div class="modal-overlay" id="modal-add-master-${type}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Master ${titleStr}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-add-master-${type}').remove()">&times;</button>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 1: Tambah Satu per Satu</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="m-single-${type}" class="form-control" placeholder="${placeholderStr}">
                        <button type="button" class="btn btn-primary" style="white-space:nowrap; padding: 4px 15px;" onclick="addMasterSingle('${type}')">+ Tambah</button>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 2: Tambah Banyak Sekaligus (Paste dari Excel - 1 Kolom):</label>
                    <textarea id="m-bulk-${type}" class="form-control" rows="5" placeholder="Paste daftar di sini..."></textarea>
                    <button type="button" class="btn btn-primary" style="margin-top: 8px; font-size: 0.85rem; padding: 6px 15px;" onclick="addMasterBulk('${type}')"><i class="fa-solid fa-paste"></i> Simpan Hasil Paste Excel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.addMasterSingle = async (type) => {
    const val = document.getElementById(`m-single-${type}`).value;
    if(!val || !val.trim()) return;
    
    let payload = { estate: currentUser.estate };
    if (type === 'truk') payload.plate_number = val.trim();
    else payload.name = val.trim();
    
    try {
        const res = await fetch(`${API_URL}/master/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById(`modal-add-master-${type}`).remove();
            await loadMasterData();
            if (type === 'truk') selectTruk(payload.plate_number);
            else if (type === 'supir') selectSupir(payload.name);
            else if (type === 'pupuk') selectPupuk(payload.name);
        } else {
            alert(data.error || 'Gagal menambahkan data');
        }
    } catch (e) {
        console.error(e);
    }
};

window.addMasterBulk = async (type) => {
    const text = document.getElementById(`m-bulk-${type}`).value;
    if(!text || !text.trim()) return;
    
    const items = text.split(/[\n\t,]+/).map(l => l.trim()).filter(l => l !== '');
    if(items.length === 0) return;
    
    try {
        const res = await fetch(`${API_URL}/master/${type}/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, items })
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Berhasil menambahkan ${data.inserted} data.`);
            document.getElementById(`modal-add-master-${type}`).remove();
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan data');
        }
    } catch (e) {
        console.error(e);
    }
};

window.promptAddDivisi = async () => {
    const divisiName = prompt("Masukkan Nama Divisi Baru (ex: Divisi 1):");
    if (!divisiName || !divisiName.trim()) return;
    
    try {
        const res = await fetch(`${API_URL}/master/divisi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, name: divisiName.trim() })
        });
        const data = await res.json();
        if (res.ok) {
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan Divisi');
        }
    } catch(err) { console.error(err); }
};

window.addBlokBulk = async (divisiName) => {
    const text = document.getElementById(`bulk-paste-${divisiName.replace(/\s+/g, '-')}`).value;
    if (!text || !text.trim()) return;
    
    const rows = text.trim().split('\n');
    let bloks = [];
    
    for (let r of rows) {
        const cols = r.split('\t');
        if (cols.length >= 2) {
            const bName = cols[0].trim();
            const bBjr = parseFloat(cols[1].trim().replace(',', '.'));
            if (bName && !isNaN(bBjr)) {
                bloks.push({ name: bName, bjr: bBjr });
            }
        }
    }
    
    if (bloks.length === 0) {
        alert("Tidak ada data valid yang bisa dibaca. Pastikan Anda melakukan copy dari 2 kolom di Excel (Blok & BJR)");
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/master/blok/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, divisi: divisiName, bloks })
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Berhasil menyimpan ${data.inserted} blok baru dari hasil copy-paste.`);
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan data paste.');
        }
    } catch(e) { console.error(e); }
};

window.addBlokToDivisi = async (e, divisiName) => {
    e.preventDefault();
    if (!currentUser.estate) return;
    
    const safeDivName = divisiName.replace(/\s+/g, '-');
    const bName = document.getElementById(`mb-name-${safeDivName}`).value;
    const bBjr = parseFloat(document.getElementById(`mb-bjr-${safeDivName}`).value);
    
    let payload = { estate: currentUser.estate, divisi: divisiName, name: bName, bjr: bBjr };
    try {
        const res = await fetch(`${API_URL}/master/blok`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            await loadMasterData();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menambahkan blok');
        }
    } catch(err) { console.error(err); }
};

window.editMasterBlok = async (id, currentName, currentBjr) => {
    const newName = prompt("Nama Blok baru:", currentName);
    if (newName === null || newName.trim() === '') return;
    
    const newBjr = prompt("Nilai BJR (Kg) baru:", currentBjr);
    if (newBjr === null || newBjr.trim() === '') return;
    
    const parsedBjr = parseFloat(newBjr.replace(',', '.'));
    if (isNaN(parsedBjr)) { alert("Nilai BJR harus berupa angka!"); return; }

    try {
        const res = await fetch(`${API_URL}/master/blok/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, bjr: parsedBjr })
        });
        if (res.ok) await loadMasterData();
    } catch(err) { console.error(err); }
};

window.editBjr = async (id, currentBjr) => {
    const newBjr = prompt("Masukkan nilai BJR baru:", currentBjr);
    if (newBjr === null || newBjr.trim() === '') return;
    
    const parsedBjr = parseFloat(newBjr);
    if (isNaN(parsedBjr)) { alert("Nilai BJR harus berupa angka!"); return; }

    try {
        const res = await fetch(`${API_URL}/master/blok/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bjr: parsedBjr })
        });
        if (res.ok) await loadMasterData();
    } catch(err) { console.error(err); }
};

window.addMaster = async (e, type) => {
    e.preventDefault();
    if (!currentUser.estate) { alert('User tidak memiliki estate!'); return; }
    
    let payload = { estate: currentUser.estate };
    if (type === 'divisi') payload.name = document.getElementById('md-name').value;
    else if (type === 'truk') payload.plate_number = document.getElementById('mt-plate').value;
    else if (type === 'supir') payload.name = document.getElementById('ms-name').value;
    else if (type === 'pupuk') payload.name = document.getElementById('mp-name').value;

    try {
        const res = await fetch(`${API_URL}/master/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            e.target.reset();
            await loadMasterData();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menambahkan data');
        }
    } catch(err) { console.error(err); }
};

window.editMaster = async (type, id, currentName) => {
    const newName = prompt(`Masukkan nilai baru untuk ${type}:`, currentName);
    if (newName === null || newName.trim() === '') return;
    
    let payload = {};
    if (type === 'truk') payload.plate_number = newName;
    else payload.name = newName;

    try {
        const res = await fetch(`${API_URL}/master/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) await loadMasterData();
    } catch(err) { console.error(err); }
};

window.onHarvestingBlockChange = (blokName) => {
    const blok = masterData.blok.find(b => b.name === blokName);
    if(blok) document.getElementById('h-bjr').value = blok.bjr;
};

window.filterBlok = (divisiName, targetId) => {
    const elBlok = document.getElementById(targetId);
    if (!elBlok) return;
    
    let filteredBloks = masterData.blok;
    if (divisiName) {
        filteredBloks = masterData.blok.filter(b => b.divisi === divisiName);
    }
    
    const blokOpts = `<option value="" disabled selected>-- Pilih Blok --</option>` + 
        filteredBloks.map(b => `<option value="${b.name}" data-bjr="${b.bjr}">${b.name}</option>`).join('');
    elBlok.innerHTML = blokOpts;
    
    if (targetId === 'h-block') {
        onHarvestingBlockChange('');
    }
};

window.populateSelects = () => {
    const elDivisi = document.querySelectorAll('.select-divisi');
    const divisiOpts = `<option value="">-- Semua Divisi --</option>` + 
        masterData.divisi.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    elDivisi.forEach(el => el.innerHTML = divisiOpts);

    const elBlok = document.querySelectorAll('.select-blok');
    const blokOpts = `<option value="" disabled selected>-- Pilih Blok --</option>` + 
        masterData.blok.map(b => `<option value="${b.name}" data-bjr="${b.bjr}">${b.name}</option>`).join('');
    elBlok.forEach(el => el.innerHTML = blokOpts);
    
    const elTruk = document.querySelectorAll('.select-truk');
    const trukOpts = `<option value="" disabled selected>-- Pilih Truk --</option>` + masterData.truk.map(t => `<option value="${t.plate_number}">${t.plate_number}</option>`).join('');
    elTruk.forEach(el => el.innerHTML = trukOpts);

    const elPupuk = document.querySelectorAll('.select-pupuk');
    const pupukOpts = `<option value="" disabled selected>-- Pilih Pupuk --</option>` + masterData.pupuk.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    elPupuk.forEach(el => el.innerHTML = pupukOpts);

    const elSupir = document.querySelectorAll('.select-supir');
    const supirOpts = `<option value="" disabled selected>-- Pilih Supir --</option>` + masterData.supir.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    elSupir.forEach(el => el.innerHTML = supirOpts);

    const hBjr = document.getElementById('h-bjr');
    if(hBjr && currentUser) {
        if(currentUser.role !== 'Askep' && currentUser.role !== 'Office Assistant (OAA)' && currentUser.role !== 'Admin') {
            hBjr.readOnly = true;
            hBjr.style.backgroundColor = '#f1f5f9';
        } else {
            hBjr.readOnly = false;
            hBjr.style.backgroundColor = '';
        }
    }
};

window.deleteMaster = async (type, id) => {
    if(!confirm('Hapus data ini?')) return;
    try {
        const res = await fetch(`${API_URL}/master/${type}/${id}`, { method: 'DELETE' });
        if (res.ok) await loadMasterData();
    } catch(err) { console.error(err); }
};
