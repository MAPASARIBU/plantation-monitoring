// API Base URL
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3005/api' : '/api';

window.getLocalDate = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

// Disable DataLabels globally so it only shows where explicitly enabled
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels.display = false;
}

// Data Store (Fetched from Backend)
let db = { vehicles: [], upkeep: [], pemupukan: [], harvesting_monthly: [], harvesting_daily: [], users: [] };

// Fetch data from Server
const loadData = async () => {
    try {
        const response = await fetch(`${API_URL}/data`);
        if (response.ok) {
            const data = await response.json();
            db.vehicles = data.vehicles;
            db.upkeep = data.upkeep;
            db.pemupukan = data.pemupukan;
            db.harvesting_monthly = data.harvesting_monthly || [];
            db.harvesting_daily = data.harvesting_daily || [];
            // Re-render views if they are currently active
            if(document.getElementById('tbody-vehicle')) renderVehicleTable();
            if(document.getElementById('tbody-upkeep')) renderUpkeepTable();
            if(document.getElementById('tbody-pemupukan')) renderPemupukanTable();
            if(document.getElementById('tbody-harvesting-daily')) renderHarvestingTable();
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
        
        // Setup Header Estate Dropdown
        const dropdownContainer = document.getElementById('header-estate-dropdown-container');
        const dropdown = document.getElementById('header-estate-dropdown');
        if (dropdownContainer && dropdown) {
            if (currentUser.assignedEstates && (currentUser.assignedEstates.length > 1 || currentUser.assignedEstates.includes('ALL'))) {
                dropdownContainer.style.display = 'block';
                let optionsHtml = '';
                
                const allEstatesList = ['Bunga Tanjung Estate', 'Sungai Teramang Estate', 'Air Bukik Estate', 'Air Buluh Estate', 'Malin Demang Estate', 'Batu Kuda Estate', 'Sungai Jerinjing Estate', 'Muko Muko Estate', 'Talang Petai Estate', 'Sungai Kiang Estate', 'Tanah Rekah Estate', 'Air Majunto Estate', 'Small Holder', 'Bunga Tanjung Mill', 'Muko Muko Mill'];
                
                const listToRender = currentUser.assignedEstates.includes('ALL') ? allEstatesList : currentUser.assignedEstates;
                
                if (currentUser.assignedEstates.includes('ALL')) {
                    optionsHtml += `<option value="Semua Estate (Khusus Admin)" ${currentUser.estate === 'Semua Estate (Khusus Admin)' ? 'selected' : ''}>Semua Estate</option>`;
                }
                
                listToRender.forEach(est => {
                    optionsHtml += `<option value="${est}" ${currentUser.estate === est ? 'selected' : ''}>${est}</option>`;
                });
                
                dropdown.innerHTML = optionsHtml;
            } else {
                dropdownContainer.style.display = 'none';
            }
        }
        
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
            const dbUser = result.user;
            
            // Validasi penempatan (kecuali Admin, -, atau Semua Estate)
            let assignedEstates = [];
            if (dbUser.estate === 'Semua Estate (Khusus Admin)' || dbUser.role === 'Admin') {
                assignedEstates = ['ALL'];
            } else if (dbUser.estate && dbUser.estate !== '-') {
                assignedEstates = dbUser.estate.split(',').map(e => e.trim());
            }
            
            if (dbUser.role !== 'Admin' && dbUser.estate !== '-' && dbUser.estate !== 'Semua Estate (Khusus Admin)' && !assignedEstates.includes(estate)) {
                errorEl.innerText = `Akses ditolak! Anda tidak diizinkan masuk ke ${estate}. Anda terdaftar di: ${dbUser.estate}`;
                errorEl.style.display = 'block';
                return;
            }
            
            errorEl.style.display = 'none';
            dbUser.assignedEstates = assignedEstates;
            currentUser = dbUser;
            if (estate) currentUser.estate = estate;
            localStorage.setItem('agrimonitor_user', JSON.stringify(currentUser));
            document.getElementById('login-form').reset();
            checkAuth();
        } else {
            errorEl.innerText = result.error || result.message || 'Gagal login';
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
window.changeActiveEstate = (estate) => {
    if (currentUser) {
        currentUser.estate = estate;
        localStorage.setItem('agrimonitor_user', JSON.stringify(currentUser));
        const activeNav = document.querySelector('.nav-item.active');
        const currentViewId = activeNav ? activeNav.getAttribute('data-view') : 'dashboard';
        navigate(currentViewId);
        loadData();
    }
};

window.toggleEstateUI = (roleId, dropdownId, containerId, labelId) => {
    const roleEl = document.getElementById(roleId);
    const dropdownEl = document.getElementById(dropdownId);
    const containerEl = document.getElementById(containerId);
    const labelEl = document.getElementById(labelId);
    if (!roleEl || !dropdownEl || !containerEl || !labelEl) return;
    
    const multiRoles = ['Admin', 'Senior Field Manager', 'Manager', 'Manager Mill'];
    if (multiRoles.includes(roleEl.value)) {
        dropdownEl.style.display = 'none';
        dropdownEl.removeAttribute('required');
        containerEl.style.display = 'flex';
        labelEl.innerText = 'Penempatan Estate / Mill (Bisa Pilih Banyak)';
    } else {
        dropdownEl.style.display = 'block';
        dropdownEl.setAttribute('required', 'required');
        containerEl.style.display = 'none';
        labelEl.innerText = 'Penempatan Estate / Mill';
    }
};

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
    } else if (role === 'Manager Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master']);
    } else if (role === 'Askep' || role === 'Office Assistant (OAA)') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Office Assistant Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master']);
    } else if (role === 'Mandor' || role === 'Krani Divisi') {
        showViews(['vehicle', 'pemupukan', 'upkeep', 'harvesting']);
    } else if (role === 'Krani Mill') {
        showViews(['tonase']);
    } else if (role === 'Supir') {
        showViews(['vehicle', 'harvesting']);
    } else if (role === 'Security' || role === 'Security Mill') {
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
                        <p id="dashboard-truk-aktif-value">0</p>
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
                        <p id="dashboard-tonase-today-value">0 T</p>
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
                    <div style="height: 8cm; width: 100%;">
                        <canvas id="tonaseChart"></canvas>
                    </div>
                </div>
                <div class="glass-card">
                    <div class="view-header">
                        <h2>Progress Panen Hari Ini</h2>
                    </div>
                    <div id="dashboard-progress-panen-container" style="margin-top: 20px;">
                        <p style="color:var(--text-secondary); text-align:center;">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    vehicle: `
        <div id="vehicle-module-layout" class="animate-fade-in" style="padding-top: 10px;">
            <div id="modal-vehicle-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Input Pergerakan</h3><button type="button" class="modal-close" onclick="document.getElementById('modal-vehicle-input').style.display='none';">&times;</button></div>
                <h2>Input Pergerakan</h2>
                <form id="form-vehicle" style="margin-top: 20px;">
                    <div class="form-group">
                        <label>Plate Truk</label>
                        <select id="v-plate" class="form-control select-truk" required></select>
                    </div>
                    <div class="form-group">
                        <label>Nama Supir</label>
                        <input type="text" id="v-driver" class="form-control" readonly style="background-color: #f1f5f9;" placeholder="Terisi otomatis dari Truk" required>
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
        </div>
            <div class="glass-card table-wrapper" style="width: 100%;">
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Tabel Monitoring Truk</h2>
                    <div style="display:flex; gap: 10px;">
                        <button type="button" class="btn btn-primary" id="btn-input-vehicle" onclick="document.getElementById('modal-vehicle-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Pergerakan</button>
                        <button type="button" class="btn" style="background-color: white; color: var(--text-primary); border: 2px solid var(--danger); font-weight: bold; padding: 6px 15px;" onclick="promptHistoricalVehicle()">Historical</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Plate Truk</th>
                                <th>Asal Estate</th>
                                <th>Divisi</th>
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
        <div class="animate-fade-in" style="padding-top: 10px;">
            <div id="modal-upkeep-input" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in">
                    <div class="modal-header">
                        <h3>Input Upkeep</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-upkeep-input').style.display='none';">&times;</button>
                    </div>
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
                            <label>Target HK (Orang)</label>
                            <input type="number" id="u-workers" class="form-control" required>
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
            </div>
            <div class="glass-card table-wrapper" style="width: 100%;">
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Progress Upkeep Harian</h2>
                    <button type="button" class="btn btn-primary" id="btn-input-upkeep" onclick="document.getElementById('modal-upkeep-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Upkeep</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Blok</th>
                                <th>Tanggal Mulai</th>
                                <th>Pekerjaan</th>
                                <th>Target (Ha)</th>
                                <th>Target HK</th>
                                <th>Realisasi (Ha)</th>
                                <th>Progress</th>
                                <th style="text-align:center;">Aksi / Status</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-upkeep"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    pemupukan: `
        <div class="animate-fade-in" style="padding-top: 10px;">
            <div id="modal-pemupukan-input" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in">
                    <div class="modal-header">
                        <h3>Buat Rencana Pemupukan</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-pemupukan-input').style.display='none';">&times;</button>
                    </div>
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
            </div>
            <div class="glass-card table-wrapper" style="width: 100%;">
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Monitoring Pemupukan Blok</h2>
                    <button type="button" class="btn btn-primary" id="btn-input-pemupukan" onclick="document.getElementById('modal-pemupukan-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Pemupukan</button>
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
        <div class="animate-fade-in" style="padding-top: 10px;">
            <div id="modal-harvesting-monthly-input" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in">
                    <div class="modal-header">
                        <h3>Rencana Panen Bulanan</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-harvesting-monthly-input').style.display='none';">&times;</button>
                    </div>
                    <form id="form-harvesting-monthly" style="margin-top: 15px;">
                        <div class="form-group">
                            <label>Pilih Divisi</label>
                            <select id="hm-divisi" class="form-control select-divisi" required onchange="checkMonthlyPlan()"></select>
                        </div>
                        <div class="form-group">
                            <label>Bulan Rencana</label>
                            <select id="hm-month" class="form-control select-month" required onchange="checkMonthlyPlan()"></select>
                        </div>
                        <div class="form-group">
                            <label>Target Panen (Kg)</label>
                            <input type="number" id="hm-target" class="form-control" required>
                        </div>
                        <button type="submit" id="btn-hm-submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                            <i class="fa-solid fa-calendar-days"></i> Simpan Rencana Bulanan
                        </button>
                    </form>
                </div>
            </div>

            <div id="modal-harvesting-daily-input" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in">
                    <div class="modal-header">
                        <h3>Rencana Panen Harian</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-harvesting-daily-input').style.display='none';">&times;</button>
                    </div>
                    <form id="form-harvesting-daily" style="margin-top: 15px;">
                        <div class="form-group">
                            <label>Tanggal Rencana</label>
                            <input type="date" id="hd-date" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Pilih Divisi</label>
                            <select id="hd-divisi" class="form-control select-divisi" required onchange="filterBlok(this.value, 'hd-block')"></select>
                        </div>
                        <div class="form-group">
                            <label>Blok</label>
                            <select id="hd-block" class="form-control select-blok" required onchange="calcHarvestingEstimate()"></select>
                        </div>
                        <div class="form-group">
                            <label>Angka Kerapatan Panen (AKP %)</label>
                            <input type="number" step="0.1" id="hd-akp" class="form-control" required oninput="calcHarvestingEstimate()">
                        </div>
                        <div class="form-group">
                            <label>Pusingan Panen</label>
                            <input type="number" id="hd-pusingan" class="form-control" required>
                        </div>
                        <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.85rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                                <span style="white-space:nowrap;">Est Ttl JJG:</span>
                                <strong id="hd-est-janjang" style="text-align:right; word-break:break-all; margin-left:10px; font-size:1rem;">0</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="white-space:nowrap;">Est Ttl Kg:</span>
                                <strong id="hd-est-kg" style="text-align:right; word-break:break-all; margin-left:10px; font-size:1rem;">0 Kg</strong>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Rencana Alokasi Pemanen</label>
                            <input type="number" id="hd-pemanen" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Alokasi Truk Divisi</label>
                            <button type="button" class="btn btn-primary" style="background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1; width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;" onclick="openTruckSelectionModal()">
                                <span id="btn-truck-text">-- Pilih Truk --</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Mandor / Pengawas</label>
                            <input type="text" id="hd-mandor" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                            <i class="fa-solid fa-clipboard-list"></i> Buat Rencana Harian
                        </button>
                    </form>
                </div>
            </div>
            
            <div class="glass-card table-wrapper" style="width: 100%;">
                <div class="view-header" style="margin-bottom: 5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <h2>Monitoring Panen Harian</h2>
                        <div style="display:flex; gap: 10px;">
                            <button type="button" class="btn btn-primary btn-sm" id="btn-input-hm" onclick="document.getElementById('modal-harvesting-monthly-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Rencana Bulanan</button>
                            <button type="button" class="btn btn-primary btn-sm" id="btn-input-hd" onclick="document.getElementById('modal-harvesting-daily-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Rencana Harian</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="openMonthlyRealization()"><i class="fa-solid fa-chart-pie"></i> Realisasi Bulanan</button>
                        </div>
                    </div>
                </div>
                <h4 id="monitoring-month-year" style="margin-top: 0; margin-bottom: 5px; color: var(--text-secondary); font-weight: 500;"></h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px;">* Keterangan: Hvr = Harvester</p>
                <div class="table-container" style="margin-bottom: 30px;">
                    <table class="data-table table-compact">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Div</th>
                                <th>Blok</th>
                                <th>Round</th>
                                <th>Mandor</th>
                                <th>Plan<br>(Jjg)</th>
                                <th>Plan<br>(Kg)</th>
                                <th>Hvr</th>
                                <th>Act<br>(Jjg)</th>
                                <th>Act<br>(Hvr)</th>
                                <th>Act<br>(Kg)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-harvesting-daily"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    tonase: `
        <div class="animate-fade-in module-layout" id="tonase-layout" style="grid-template-columns: 1fr;">
            
            <!-- Table Monitoring -->
            <div class="glass-card table-wrapper">
                <div class="view-header" style="align-items: flex-start;">
                    <h2 style="margin-top: 10px;">Tabel Monitoring FFB Received</h2>
                    <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-primary btn-tonase-action" style="display:none;" onclick="openTonaseModal('plan')">
                                <i class="fa-solid fa-plus"></i> Input Plan
                            </button>
                            <button class="btn btn-tonase-action" style="display:none; background-color: #f7a01d; color: white;" onclick="openTonaseModal('realization')">
                                <i class="fa-solid fa-plus"></i> Input Realisasi
                            </button>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="date" id="monitor-tonase-date" class="form-control" onchange="renderTonaseMonitorTable()">
                            <select id="monitor-tonase-hour" class="form-control" onchange="renderTonaseMonitorTable()">
                                <option value="06:00">06:00</option>
                                <option value="07:00">07:00</option>
                                <option value="08:00">08:00</option>
                                <option value="09:00">09:00</option>
                                <option value="10:00">10:00</option>
                                <option value="11:00">11:00</option>
                                <option value="12:00">12:00</option>
                                <option value="13:00">13:00</option>
                                <option value="14:00">14:00</option>
                                <option value="15:00">15:00</option>
                                <option value="16:00">16:00</option>
                                <option value="17:00">17:00</option>
                                <option value="18:00">18:00</option>
                                <option value="19:00">19:00</option>
                                <option value="20:00">20:00</option>
                                <option value="21:00">21:00</option>
                                <option value="22:00">22:00</option>
                                <option value="23:00">23:00</option>
                                <option value="24:00">24:00</option>
                            </select>
                            <button class="btn btn-primary" onclick="renderTonaseMonitorTable()">
                                <i class="fa-solid fa-rotate-right"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>
                <div id="tonase-monitor-table-container" style="overflow-x: auto; margin-top: 20px;">
                    <div style="text-align:center; padding: 20px; color:#64748b;">Memuat tabel...</div>
                </div>
            </div>
            
            <div class="glass-card table-wrapper" style="margin-top: 20px;">
                <div class="view-header">
                    <h2>Tonase TBS Masuk PKS per Jam</h2>
                    <div>
                        <button class="btn btn-primary" onclick="openHistoricalModal()">
                            <i class="fa-solid fa-clock-rotate-left"></i> Historical
                        </button>
                    </div>
                </div>
                <div style="height: 400px; width: 100%; margin-top: 20px;">
                    <canvas id="tonaseBigChart"></canvas>
                </div>
            </div>
            
            <!-- Modal Historical -->
            <div class="modal-overlay" id="historical-modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="max-width: 95%; width: 1000px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Historical Tonase</h2>
                        <button type="button" class="modal-close" onclick="document.getElementById('historical-modal').style.display = 'none'">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
                            <label>Pilih Tanggal:</label>
                            <input type="date" id="historical-date" class="form-control">
                            <label>Estate:</label>
                            <select id="historical-estate" class="form-control" onchange="loadHistoricalChartData()">
                                <option value="ALL">All Estate (Gabungan)</option>
                            </select>
                            <button class="btn btn-primary" onclick="loadHistoricalChartData()">OK</button>
                        </div>
                        <div style="height: 300px; width: 100%;">
                            <canvas id="historicalChartCanvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Tonase -->
            <div class="modal-overlay" id="tonase-modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="max-width: 95%; width: 1200px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 id="tonase-form-title">Input Tonase</h2>
                        <button type="button" class="modal-close" onclick="document.getElementById('tonase-modal').style.display = 'none'">&times;</button>
                    </div>
                    
                    <form id="form-tonase" style="margin-top: 15px;" onsubmit="event.preventDefault(); saveTonaseData();">
                        <div class="form-group" style="display: flex; gap: 15px; max-width: 600px; margin-bottom: 15px;">
                            <div style="flex:1;">
                                <label>Tanggal</label>
                                <input type="date" id="t-date" class="form-control" required onchange="loadTonaseInputData()">
                            </div>
                            <div style="flex:1;" id="container-plan-mode" style="display:none;">
                                <label>Mode Input (Plan)</label>
                                <select id="t-plan-mode" class="form-control" onchange="loadTonaseInputData()">
                                    <option value="single">Opsi 1 (Manual 1 per 1 Jam)</option>
                                    <option value="grid">Opsi 2 (19 Baris + Copy-Paste)</option>
                                </select>
                            </div>
                            <div style="flex:1;" id="container-t-hour">
                                <label>Jam</label>
                                <select id="t-hour" class="form-control" onchange="loadTonaseInputData()">
                                    <option value="" disabled selected>-- Pilih Jam --</option>
                                    <option>06:00</option>
                                    <option>07:00</option>
                                    <option>08:00</option>
                                    <option>09:00</option>
                                    <option>10:00</option>
                                    <option>11:00</option>
                                    <option>12:00</option>
                                    <option>13:00</option>
                                    <option>14:00</option>
                                    <option>15:00</option>
                                    <option>16:00</option>
                                    <option>17:00</option>
                                    <option>18:00</option>
                                    <option>19:00</option>
                                    <option>20:00</option>
                                    <option>21:00</option>
                                    <option>22:00</option>
                                    <option>23:00</option>
                                    <option>24:00</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="tonase-estate-list" style="margin-top: 15px; overflow-x: auto; max-height: 50vh; overflow-y: auto;">
                            <!-- Injected JS -->
                            <div style="text-align:center; padding: 20px; color:#64748b;">Pilih Tanggal terlebih dahulu untuk memunculkan daftar.</div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: right;">
                            <button type="button" id="t-btn-reset" class="btn" style="background-color: #ef4444; color: white; margin-right: 10px;" onclick="resetTonaseInputs()"><i class="fa-solid fa-rotate-left"></i> Reset ke 0</button>
                            <button type="button" class="btn" style="background-color: #e2e8f0; color: #333; margin-right: 10px;" onclick="document.getElementById('tonase-modal').style.display='none'">Batal</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fa-solid fa-save"></i> <span id="t-btn-label">Simpan</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal Historical Tonase Monitor -->
            <div class="modal-overlay" id="historical-tonase-monitor-modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="max-width: 95%; width: 1000px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Historical Tabel Monitoring FFB</h2>
                        <button type="button" class="modal-close" onclick="document.getElementById('historical-tonase-monitor-modal').style.display = 'none'">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
                            <label>Pilih Tanggal:</label>
                            <input type="date" id="historical-monitor-date" class="form-control">
                            <button class="btn btn-primary" onclick="renderTonaseMonitorTable(true)">OK</button>
                        </div>
                        <div id="historical-tonase-monitor-container" style="overflow-x: auto;">
                            <div style="text-align:center; padding: 20px; color:#64748b;">Pilih Tanggal untuk memunculkan tabel.</div>
                        </div>
                    </div>
                </div>
            </div>

            
            
            <!-- Prime Time Chart -->
            <div class="glass-card table-wrapper" style="margin-top: 20px;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <h2 style="margin:0;">Prime Time Monitoring</h2>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <label style="font-weight: bold; font-size: 0.9em; color: var(--text-secondary);">Estate:</label>
                        <select id="prime-estate" class="form-control" style="width: auto; min-width: 200px;" onchange="loadPrimeTimeChart()">
                            <option value="ALL">All Estate (Gabungan)</option>
                        </select>
                    </div>
                </div>
                <div style="height: 400px; width: 100%; margin-top: 20px;">
                    <canvas id="primeTimeChart"></canvas>
                </div>
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
                <div class="glass-card master-estate-card" style="grid-column: 1 / -1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Divisi & Blok</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddDivisi()"><i class="fa-solid fa-plus"></i> Tambah Divisi Baru</button>
                    </div>
                    <div id="container-master-divisi" style="margin-top: 25px; display:flex; flex-direction:column; gap:20px;">
                        <!-- Injected JS Divisi Cards -->
                    </div>
                </div>
                <!-- Truk -->
                <div class="glass-card master-estate-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Truk & Supir</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddMaster('truk')"><i class="fa-solid fa-plus"></i> Tambah Truk & Supir</button>
                    </div>
                    <div id="container-master-truk" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; width: 100%;"></div>
                </div>
                <!-- Pupuk -->
                <div class="glass-card master-estate-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Jenis Pupuk</h3>
                        <button type="button" class="btn btn-primary" onclick="promptAddMaster('pupuk')"><i class="fa-solid fa-plus"></i> Tambah Pupuk</button>
                    </div>
                    <div id="container-master-pupuk"></div>
                </div>
                <!-- Supply Chain -->
                <div class="glass-card master-mill-card" id="card-master-supply-chain" style="display:none; grid-column: 1 / -1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Master Supply Chain</h3>
                        <button type="button" class="btn btn-primary" onclick="saveSupplyChain()"><i class="fa-solid fa-save"></i> Simpan</button>
                    </div>
                    <div id="container-master-supply-chain" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-top: 15px; width: 100%;"></div>
                </div>
            </div>
        </div>
    `,
    users: `
        <div class="animate-fade-in" style="padding-top: 10px;">
            <div id="modal-user-input" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in">
                    <div class="modal-header">
                        <h3>Tambah User Baru</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-user-input').style.display='none';">&times;</button>
                    </div>
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
                            <select id="u-role" class="form-control" required onchange="window.toggleEstateUI('u-role', 'u-estate-dropdown', 'u-estate-container', 'u-estate-label')">
                                <option>Senior Field Manager</option>
                                <option>Manager</option>
                                <option>Manager Mill</option>
                                <option>Askep</option>
                                <option>Office Assistant (OAA)</option>
                                <option>Office Assistant Mill</option>
                                <option>Assistant</option>
                                <option>Mandor</option>
                                <option>Krani Divisi</option>
                                <option>Krani Mill</option>
                                <option>Supir</option>
                                <option>Security</option>
                                <option>Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label id="u-estate-label">Penempatan Estate / Mill (Bisa Pilih Banyak)</label>
                            <select id="u-estate-dropdown" class="form-control" style="display: none;">
                                <option value="" disabled selected>-- Pilih Estate / Mill --</option>
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
                                <option>Small Holder</option>
                                <option>Bunga Tanjung Mill</option>
                                <option>Muko Muko Mill</option>
                            </select>
                            <div id="u-estate-container" class="form-control" style="height: 150px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--surface-color);">
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Semua Estate (Khusus Admin)"> Semua Estate (Khusus Admin)</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Bunga Tanjung Estate"> Bunga Tanjung Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Sungai Teramang Estate"> Sungai Teramang Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Air Bukik Estate"> Air Bukik Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Air Buluh Estate"> Air Buluh Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Malin Demang Estate"> Malin Demang Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Batu Kuda Estate"> Batu Kuda Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Sungai Jerinjing Estate"> Sungai Jerinjing Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Muko Muko Estate"> Muko Muko Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Talang Petai Estate"> Talang Petai Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Sungai Kiang Estate"> Sungai Kiang Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Tanah Rekah Estate"> Tanah Rekah Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Air Majunto Estate"> Air Majunto Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Small Holder"> Small Holder</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Bunga Tanjung Mill"> Bunga Tanjung Mill</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Muko Muko Mill"> Muko Muko Mill</label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                            <i class="fa-solid fa-user-plus"></i> Tambah User
                        </button>
                    </form>
                </div>
            </div>
            <div class="glass-card table-wrapper" style="width: 100%;">
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Daftar User Sistem</h2>
                    <button type="button" class="btn btn-primary" id="btn-input-user" onclick="document.getElementById('modal-user-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Tambah User</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>ESTATE-MILL</th>
                                <th style="width: 80px; text-align: center;">Aksi</th>
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
    
    const today = window.getLocalDate();
    let todaysVehicles = db.vehicles.filter(v => v.date === today);
    
    if (currentUser.estate && currentUser.estate.endsWith('Mill')) {
        const allowedEstates = (masterData.supply_chain || []).map(sc => sc.estate);
        todaysVehicles = todaysVehicles.filter(v => allowedEstates.includes(v.estate));
    } else if (currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        todaysVehicles = todaysVehicles.filter(v => v.estate === currentUser.estate);
    }
    
    const btnInput = document.getElementById('btn-input-vehicle');
    if (btnInput) {
        if (currentUser.role.includes('Security') || currentUser.role === 'Security Mill' || currentUser.role === 'Manager' || currentUser.role === 'Manager Mill') {
            btnInput.style.display = 'none';
        } else {
            btnInput.style.display = 'flex';
        }
    }

    const inTransit = [];
    const arrived = [];
    [...todaysVehicles].reverse().forEach(v => {
        const tArrive = v.timearrive || v.timeArrive;
        if (!tArrive) inTransit.push(v);
        else arrived.push(v);
    });

    const renderRow = (v) => {
        const tDepart = v.timedepart || v.timeDepart;
        const tArrive = v.timearrive || v.timeArrive;
        const duration = calculateDuration(tDepart, tArrive);
        const canClickArrive = (currentUser.role.includes('Security') || currentUser.role === 'Security Mill' || currentUser.role === 'Admin');
        const actionBtn = (!tArrive && canClickArrive) ? 
            `<button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="setArrival(${v.id})">Tiba di PKS</button>` : 
            (!tArrive ? `<span class="status-badge" style="background:#f59e0b">Di Perjalanan</span>` : `<span class="status-badge status-done">Selesai</span>`);
            
        return `
            <tr>
                <td><strong>${v.plate}</strong><br><small>${v.driver}</small></td>
                <td><strong>${getEstateCode(v.estate)}</strong></td>
                <td>${v.divisi || '-'}</td>
                <td>${v.ritase}</td>
                <td>${v.block}</td>
                <td>${v.janjang}</td>
                <td>${tDepart}</td>
                <td>${tArrive || '-'}</td>
                <td><strong>${duration}</strong></td>
                <td>${actionBtn}</td>
            </tr>
        `;
    };

    inTransit.forEach(v => tbody.innerHTML += renderRow(v));

    if (arrived.length > 0) {
        tbody.innerHTML += `<tr><td colspan="8" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List truk sudah tiba di Mill</td></tr>`;
        arrived.forEach(v => tbody.innerHTML += renderRow(v));
    }
};

const renderUpkeepTable = () => {
    const tbody = document.getElementById('tbody-upkeep');
    if (!tbody) return;
    tbody.innerHTML = '';
    let allUpkeep = [...db.upkeep].reverse();
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        allUpkeep = allUpkeep.filter(u => !u.estate || u.estate === currentUser.estate);
    }
    const aktif = allUpkeep.filter(u => u.status !== 'Selesai');
    const selesai = allUpkeep.filter(u => u.status === 'Selesai');
    
    const btnInput = document.getElementById('btn-input-upkeep');
    if (btnInput) {
        if (currentUser.role.includes('Security') || currentUser.role.includes('Manager')) {
            btnInput.style.display = 'none';
        } else {
            btnInput.style.display = 'flex';
        }
    }
    
    const renderRow = (u) => {
        const pct = getProgressStr(u.realized, u.target);
        
        let actionBtn = '';
        const safeType = u.type ? u.type.replace(/['"\n\r]/g, ' ') : '';
        
        if (u.status === 'Selesai') {
            actionBtn = `<span class="status-badge status-done" style="margin-right: 5px;">Selesai</span>`;
        } else if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            actionBtn = `
                <div style="display:flex; flex-direction:column; gap:5px; align-items:center;">
                    <div style="display:flex; gap:5px;">
                        <button type="button" class="btn" style="padding: 2px 6px; font-size: 0.7rem; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="promptAddUpkeepProgress(${u.id}, '${u.block}', '${safeType}', ${u.target}, ${u.realized})"><i class="fa-solid fa-plus"></i> Progress</button>
                    </div>
                    <button type="button" class="btn" style="padding: 2px 6px; font-size: 0.7rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; width:100%; justify-content:center;" onclick="closeUpkeep(${u.id}, '${u.block}')"><i class="fa-solid fa-check"></i> Selesai</button>
                </div>
            `;
        } else {
            actionBtn = '-';
        }
        
        return `
            <tr>
                <td><strong><a href="#" style="color: var(--primary-color); text-decoration: underline; cursor: pointer;" onclick="viewUpkeepHistory(${u.id}, '${u.block}', '${safeType}'); return false;">${u.block}</a></strong></td>
                <td>${u.startdate || '-'}</td>
                <td>${u.type}<br><small>${u.worker}</small></td>
                <td>${u.target}</td>
                <td>${u.targetworkers || 0} Orang</td>
                <td>${u.realized}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="progress-wrapper" style="width: 100px; margin:0;"><div class="progress-fill" style="width: ${pct}%"></div></div>
                        <small>${pct}%</small>
                    </div>
                </td>
                <td style="text-align:center;">${actionBtn}</td>
            </tr>
        `;
    };

    aktif.forEach(u => tbody.innerHTML += renderRow(u));

    if (selesai.length > 0) {
        tbody.innerHTML += `<tr><td colspan="8" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>`;
        selesai.forEach(u => tbody.innerHTML += renderRow(u));
    }
};

const renderPemupukanTable = () => {
    const tbody = document.getElementById('tbody-pemupukan');
    if (!tbody) return;
    tbody.innerHTML = '';
    let allPemupukan = [...db.pemupukan].reverse();
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        allPemupukan = allPemupukan.filter(p => !p.estate || p.estate === currentUser.estate);
    }
    const aktif = allPemupukan.filter(p => p.status !== 'Selesai');
    const selesai = allPemupukan.filter(p => p.status === 'Selesai');

    const btnInput = document.getElementById('btn-input-pemupukan');
    if (btnInput) {
        if (currentUser.role.includes('Security') || currentUser.role.includes('Manager')) {
            btnInput.style.display = 'none';
        } else {
            btnInput.style.display = 'flex';
        }
    }

    const renderRow = (p) => {
        const tKg = p.targetkg || p.targetKg || 0;
        const rKg = p.realizedkg || p.realizedKg || 0;
        const sDate = p.startdate || p.startDate;
        const pct = getProgressStr(rKg, tKg);
        let actionBtn = '-';
        if (p.status === 'Selesai') {
            actionBtn = `
                <div style="display:flex; flex-direction:column; gap:3px;">
                    <span class="status-badge status-done" style="text-align:center;">Selesai</span>
                </div>
            `;
        } else if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            actionBtn = `
                <div style="display:flex; flex-direction:column; gap:3px;">
                    <button class="btn btn-primary" style="padding: 2px 6px; font-size: 0.7rem;" onclick="openAddRealizationModal(${p.id}, '${p.block}', '${p.plan}', '${sDate}')"><i class="fa-solid fa-plus"></i> Tambah</button>
                    <button class="btn btn-logout" style="padding: 2px 6px; font-size: 0.7rem; background: #ef4444; color: white; border-radius: 4px;" onclick="closePemupukan(${p.id}, '${p.block}')"><i class="fa-solid fa-check"></i> Tutup</button>
                </div>
            `;
        }
            
        return `
            <tr>
                <td>${sDate || '-'}</td>
                <td><strong><a href="#" style="color: var(--primary-color); text-decoration: underline; cursor: pointer;" onclick="viewPemupukanHistory(${p.id}, '${p.block}', '${p.plan}'); return false;">${p.block}</a></strong></td>
                <td>${p.plan}</td>
                <td>${tKg}</td>
                <td>${rKg}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="progress-wrapper" style="width: 100px; margin:0;"><div class="progress-fill" style="width: ${pct}%"></div></div>
                        <strong>${pct}%</strong>
                    </div>
                </td>
                <td style="text-align:center;">${actionBtn}</td>
            </tr>
        `;
    };

    aktif.forEach(p => tbody.innerHTML += renderRow(p));

    if (selesai.length > 0) {
        tbody.innerHTML += `<tr><td colspan="7" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>`;
        selesai.forEach(p => tbody.innerHTML += renderRow(p));
    }
};
window.deleteHarvestingDaily = async (id) => {
    if(confirm('Apakah Anda yakin ingin menghapus data rencana harian ini?')) {
        try {
            const res = await fetch(`${API_URL}/harvesting/daily/${id}`, { method: 'DELETE' });
            if (res.ok) {
                // The websocket / poll will update the UI, but we can optimistically update
                db.harvesting_daily = db.harvesting_daily.filter(h => h.id !== id);
                renderHarvestingTable();
                
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = "Rencana harian berhasil dihapus!";
                    toast.className = "toast show success";
                    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
                }
            } else {
                alert('Gagal menghapus data harian.');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat menghapus data.');
        }
    }
};

const renderHarvestingTable = () => {
    const tbodyDaily = document.getElementById('tbody-harvesting-daily');
    if (!tbodyDaily) return;
    
    tbodyDaily.innerHTML = '';
    
    const now = new Date();
    const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const titleEl = document.getElementById('monitoring-month-year');
    if (titleEl) {
        titleEl.textContent = `Month : ${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    const btnHm = document.getElementById('btn-input-hm');
    const btnHd = document.getElementById('btn-input-hd');
    if (btnHm && btnHd) {
        if (currentUser.role.includes('Security') || currentUser.role.includes('Manager')) {
            btnHm.style.display = 'none';
            btnHd.style.display = 'none';
        } else {
            btnHm.style.display = 'inline-block';
            btnHd.style.display = 'inline-block';
        }
    }
    
    const sortFn = (a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        
        const divA = a.divisi || '';
        const divB = b.divisi || '';
        return divA.localeCompare(divB);
    };

    let filteredData = db.harvesting_daily;
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        filteredData = filteredData.filter(h => !h.estate || h.estate === currentUser.estate);
    }

    const draftData = filteredData.filter(h => h.status !== 'Selesai' && h.status !== 'Closed').sort(sortFn);
    const selesaiData = filteredData.filter(h => h.status === 'Selesai' || h.status === 'Closed').sort(sortFn);
    
    const renderDailyRow = (h) => {
        let statusEl = '<span style="color:green;font-weight:bold;">Closed</span>';
        if (h.status !== 'Selesai' && h.status !== 'Closed') {
            const canUpdateRoles = ['Askep', 'Assistant', 'Mandor', 'Krani Divisi', 'Krani Mill', 'Supir', 'Admin'];
            if (currentUser && canUpdateRoles.includes(currentUser.role)) {
                statusEl = `<button type="button" class="btn btn-primary" style="padding:2px 8px; font-size:0.8rem; background-color:orange; border:none; border-radius:15px; font-weight:bold;" onclick="openAddHarvestingRealizationModal(${h.id}, '${h.block}', ${h.est_janjang || 0}, ${h.plan_pemanen || 0}, ${h.est_kg || 0}, '${h.divisi}')">Update</button>`;
            } else {
                statusEl = '<span style="color:gray; font-weight:bold;">In Progress</span>';
            }
        }
        
        let deleteBtn = '';
        if (currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Admin')) {
            deleteBtn = `<button type="button" class="btn-delete-hover" style="margin-left:5px; font-weight:bold; vertical-align:middle; padding:2px 8px;" onclick="deleteHarvestingDaily(${h.id})">Del</button>`;
        }
        statusEl = `<div style="display:flex; align-items:center;">${statusEl}${deleteBtn}</div>`;
        
        let dateStr = h.date;
        if(typeof dateStr === 'string' && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        
        let formattedDate = dateStr;
        if(dateStr) {
            const d = new Date(dateStr);
            if(!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                formattedDate = `${day} ${months[d.getMonth()]}`;
            }
        }
            
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${h.divisi || '-'}</td>
                <td>${(h.status === 'Selesai' || h.status === 'Closed') ? `<a href="#" onclick="openBlockHistory('${h.block}', '${h.divisi}')" style="color:var(--primary); font-weight:bold; text-decoration:underline; cursor:pointer;" title="Lihat History">${h.block}</a>` : `<strong>${h.block}</strong>`}</td>
                <td>${h.pusingan || '-'}</td>
                <td>${h.mandor}</td>
                <td>${h.est_janjang}</td>
                <td>${h.est_kg}</td>
                <td>${h.plan_pemanen}</td>
                <td>${h.realized_janjang}</td>
                <td>${h.realized_pemanen}</td>
                <td>${h.realized_kg}</td>
                <td>${statusEl}</td>
            </tr>
        `;
    };



    draftData.forEach(h => tbodyDaily.innerHTML += renderDailyRow(h));
    
    if (selesaiData.length > 0) {
        tbodyDaily.innerHTML += `<tr><td colspan="12" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Closed</td></tr>`;
        selesaiData.forEach(h => {
            tbodyDaily.innerHTML += renderDailyRow(h);
        });
        
        tbodyDaily.innerHTML += `<tr><td colspan="12" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-chart-simple" style="color: var(--primary-color);"></i> Rekap Panen per Divisi (Dari Pekerjaan Selesai)</td></tr>`;
        
        const rekapMap = {};
        selesaiData.forEach(h => {
            const key = h.date + '_' + h.divisi;
            if(!rekapMap[key]) {
                rekapMap[key] = {
                    date: h.date,
                    divisi: h.divisi,
                    plan_jjg: 0,
                    plan_kg: 0,
                    plan_pemanen: 0,
                    act_jjg: 0,
                    act_kg: 0,
                    act_pemanen: 0
                };
            }
            rekapMap[key].plan_jjg += h.est_janjang || 0;
            rekapMap[key].plan_kg += h.est_kg || 0;
            rekapMap[key].plan_pemanen += h.plan_pemanen || 0;
            rekapMap[key].act_jjg += h.realized_janjang || 0;
            rekapMap[key].act_kg += h.realized_kg || 0;
            rekapMap[key].act_pemanen += h.realized_pemanen || 0;
        });
        
        Object.values(rekapMap).reverse().forEach(r => {
            let dateStr = r.date;
            if(typeof dateStr === 'string' && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let formattedDate = dateStr;
            const d = new Date(dateStr);
            if(!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                formattedDate = `${day} ${months[d.getMonth()]}`;
            }
            
            tbodyDaily.innerHTML += `
                <tr style="background-color: #f8fafc;">
                    <td>${formattedDate}</td>
                    <td>${r.divisi ? `<a href="#" onclick="openDivisiHistory('${r.divisi}')" style="color:var(--primary); font-weight:bold; text-decoration:underline; cursor:pointer;" title="Lihat History Divisi">${r.divisi}</a>` : '-'}</td>
                    <td style="color:#94a3b8;">-</td>
                    <td style="color:#94a3b8;">-</td>
                    <td style="color:#94a3b8;">-</td>
                    <td><strong>${r.plan_jjg}</strong></td>
                    <td><strong>${r.plan_kg}</strong></td>
                    <td><strong>${r.plan_pemanen}</strong></td>
                    <td><strong>${r.act_jjg}</strong></td>
                    <td><strong>${r.act_pemanen}</strong></td>
                    <td><strong>${r.act_kg}</strong></td>
                    <td><span style="color:green;font-weight:bold;">Closed</span></td>
                </tr>
            `;
        });
    }
    
    if(draftData.length === 0 && selesaiData.length === 0) {
        tbodyDaily.innerHTML = `<tr><td colspan="12" style="text-align:center;">Belum ada rencana panen harian.</td></tr>`;
    }
};

const renderUsersTable = () => {
    const tbody = document.getElementById('tbody-users');
    if (!tbody) return;
    tbody.innerHTML = '';
    const btnInput = document.getElementById('btn-input-user');
    if (btnInput) {
        if (currentUser.role === 'Admin') {
            btnInput.style.display = 'inline-block';
        } else {
            btnInput.style.display = 'none';
        }
    }
    
    [...db.users].forEach(u => {
        const actionBtns = (u.username !== 'admin' && currentUser.role !== 'Senior Field Manager') ? 
            `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem; margin-right:5px;" onclick="promptEditUser(${u.id})"><i class="fa-solid fa-pen"></i></button>` +
            `<button class="btn btn-logout" style="padding: 4px 8px; font-size: 0.8rem; color: #ef4444;" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>` : '-';
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.username}</strong></td>
                <td><span class="status-badge" style="background: rgba(0,0,0,0.1)">${u.role}</span></td>
                <td><small>${u.estate || '-'}</small></td>
                <td>${actionBtns}</td>
            </tr>
        `;
    });
};

window.promptEditUser = (id) => {
    const user = db.users.find(u => u.id === id);
    if (!user) return;
    
    const userEstates = user.estate ? user.estate.split(',').map(e => e.trim()) : [];
    let estatesOptions = `<label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="eu_estate" value="Semua Estate (Khusus Admin)" ${userEstates.includes('Semua Estate (Khusus Admin)') ? 'checked' : ''}> Semua Estate (Khusus Admin)</label>`;
    const allEstates = ['Bunga Tanjung Estate', 'Sungai Teramang Estate', 'Air Bukik Estate', 'Air Buluh Estate', 'Malin Demang Estate', 'Batu Kuda Estate', 'Sungai Jerinjing Estate', 'Muko Muko Estate', 'Talang Petai Estate', 'Sungai Kiang Estate', 'Tanah Rekah Estate', 'Air Majunto Estate', 'Small Holder', 'Bunga Tanjung Mill', 'Muko Muko Mill'];
    let dropdownOptions = '';
    allEstates.forEach(est => {
        dropdownOptions += `<option value="${est}" ${user.estate === est ? 'selected' : ''}>${est}</option>`;
        estatesOptions += `<label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="eu_estate" value="${est}" ${userEstates.includes(est) ? 'checked' : ''}> ${est}</label>`;
    });

    const html = `
        <div class="modal-overlay" id="modal-edit-user">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit User: ${user.username}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-edit-user').remove()">&times;</button>
                </div>
                
                <div class="form-group">
                    <label>Role</label>
                    <select id="eu-role" class="form-control" onchange="window.toggleEstateUI('eu-role', 'eu-estate-dropdown', 'eu-estate-container', 'eu-estate-label')">
                        <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="Manager Mill" ${user.role === 'Manager Mill' ? 'selected' : ''}>Manager Mill</option>
                        <option value="Askep" ${user.role === 'Askep' ? 'selected' : ''}>Askep</option>
                        <option value="Assistant" ${user.role === 'Assistant' ? 'selected' : ''}>Assistant</option>
                        <option value="Office Assistant (OAA)" ${user.role === 'Office Assistant (OAA)' ? 'selected' : ''}>Office Assistant (OAA)</option>
                        <option value="Office Assistant Mill" ${user.role === 'Office Assistant Mill' ? 'selected' : ''}>Office Assistant Mill</option>
                        <option value="Mandor" ${user.role === 'Mandor' ? 'selected' : ''}>Mandor</option>
                        <option value="Krani Divisi" ${user.role === 'Krani Divisi' ? 'selected' : ''}>Krani Divisi</option>
                        <option value="Krani Mill" ${user.role === 'Krani Mill' ? 'selected' : ''}>Krani Mill</option>
                        <option value="Security" ${user.role === 'Security' ? 'selected' : ''}>Security</option>
                        <option value="Security Mill" ${user.role === 'Security Mill' ? 'selected' : ''}>Security Mill</option>
                        <option value="Supir" ${user.role === 'Supir' ? 'selected' : ''}>Supir</option>
                    </select>
                </div>
                <div class="form-group">
                    <label id="eu-estate-label">Penempatan (Estate / Mill) - Bisa Pilih Banyak</label>
                    <select id="eu-estate-dropdown" class="form-control" style="display: none;">
                        <option value="Semua Estate (Khusus Admin)" ${user.estate === 'Semua Estate (Khusus Admin)' ? 'selected' : ''}>Semua Estate (Khusus Admin)</option>
                        ${dropdownOptions}
                    </select>
                    <div id="eu-estate-container" class="form-control" style="height: 150px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--surface-color);">
                        ${estatesOptions}
                    </div>
                </div>
                <div class="form-group">
                    <label>Password Baru (Kosongkan jika tidak ingin diubah)</label>
                    <input type="password" id="eu-password" class="form-control" placeholder="Password Baru">
                </div>
                <button type="button" class="btn btn-primary" onclick="editUser(${id})">Simpan Perubahan</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        window.toggleEstateUI('eu-role', 'eu-estate-dropdown', 'eu-estate-container', 'eu-estate-label');
    }, 10);
};

window.editUser = async (id) => {
    const role = document.getElementById('eu-role').value;
    const multiRoles = ['Admin', 'Senior Field Manager', 'Manager', 'Manager Mill'];
    const estate = multiRoles.includes(role) 
        ? Array.from(document.querySelectorAll('input[name="eu_estate"]:checked')).map(cb => cb.value).join(', ')
        : document.getElementById('eu-estate-dropdown').value;
    const password = document.getElementById('eu-password').value;
    
    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, estate, password })
        });
        if (res.ok) {
            document.getElementById('modal-edit-user').remove();
            await loadUsers();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal mengubah user');
        }
    } catch (e) {
        console.error(e);
    }
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
    const today = window.getLocalDate();
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
        } catch(e) { console.error(e); }
    }
};

window.calcHarvestingEstimate = () => {
    const block = document.getElementById('hd-block').value;
    const divisi = document.getElementById('hd-divisi').value;
    const akp = parseFloat(document.getElementById('hd-akp').value) || 0;
    
    // Pastikan match nama blok dan divisinya
    const blockData = masterData.blok.find(b => b.name === block && b.divisi === divisi);
    
    if (blockData) {
        // Hapus koma atau titik jika formatnya ribuan sebelum di-parse
        let rawTs = blockData.total_stand;
        if(typeof rawTs === 'string') rawTs = rawTs.replace(/,/g, '');
        const ts = parseFloat(rawTs) || 0;
        
        let rawBjr = blockData.bjr;
        if(typeof rawBjr === 'string') rawBjr = rawBjr.replace(/,/g, '');
        const bjr = parseFloat(rawBjr) || 0;
        
        const estJanjang = Math.round(ts * (akp / 100));
        const estKg = Math.round(estJanjang * bjr);
        
        document.getElementById('hd-est-janjang').innerText = estJanjang.toLocaleString('id-ID');
        document.getElementById('hd-est-kg').innerText = estKg.toLocaleString('id-ID') + ' Kg';
    } else {
        document.getElementById('hd-est-janjang').innerText = '0';
        document.getElementById('hd-est-kg').innerText = '0 Kg';
    }
};

window.openBlockHistory = (block, divisi) => {
    const historyData = db.harvesting_daily.filter(h => h.block === block && h.divisi === divisi && (h.status === 'Selesai' || h.status === 'Closed'));
    
    let blockData;
    if (divisi && divisi !== 'undefined') blockData = masterData.blok.find(b => b.name === block && b.divisi === divisi);
    if (!blockData) blockData = masterData.blok.find(b => b.name === block);
    const grossArea = blockData ? blockData.gross_area : 0;
    
    let html = `
        <div class="modal-overlay" id="modal-history">
            <div class="modal-content animate-fade-in" style="width:95vw; max-width:1200px; max-height:85vh; overflow-y:auto;">
                <div class="modal-header">
                    <h3>History & Prestasi Panen: ${block}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-history').remove()">&times;</button>
                </div>
                <table class="data-table table-compact" style="font-size:0.85rem; margin-top:15px;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Div</th>
                            <th>Blok</th>
                            <th>Plan<br>Hvr</th>
                            <th>Act<br>Hvr</th>
                            <th>Gross Area<br>(Ha)</th>
                            <th>Act<br>Ha</th>
                            <th>Act<br>Kg</th>
                            <th>Prestasi<br>(Kg/HK)</th>
                            <th>Kapasitas<br>(Ha/WD)</th>
                            <th>Var<br>Hvr (%)</th>
                            <th>Var<br>Ha (%)</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if(historyData.length === 0) {
        html += `<tr><td colspan="12" style="text-align:center;">Belum ada data historis</td></tr>`;
    } else {
        historyData.forEach(h => {
            let dateStr = h.date;
            if(typeof dateStr === 'string' && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            let formattedDate = dateStr;
            const d = new Date(dateStr);
            if(!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                formattedDate = `${day} ${months[d.getMonth()]}`;
            }
            
            const planHvr = h.plan_pemanen || 0;
            const actHvr = h.realized_pemanen || 0;
            let varHvr = 0;
            if (planHvr > 0) varHvr = (actHvr / planHvr) * 100;
            
            const actHa = h.realized_ha || 0;
            let varHa = 0;
            if (grossArea > 0) varHa = (actHa / grossArea) * 100;
            
            const prestasiHvr = actHvr > 0 ? (h.realized_kg || 0) / actHvr : 0;
            const kapasitasHa = actHvr > 0 ? actHa / actHvr : 0;
            
            let trucksArr = [];
            try {
                const rl = JSON.parse(h.ritase_list || '[]');
                const tSet = new Set(rl.map(r => r.truck).filter(Boolean));
                trucksArr = Array.from(tSet);
            } catch(e) {}
            const trucksStr = trucksArr.length > 0 ? `Truk: ${trucksArr.join(', ')}` : 'Belum ada truk';
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${h.divisi || '-'}</td>
                    <td>
                        <strong>${h.block}</strong>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:4px; max-width: 150px; white-space: normal;">${trucksStr}</div>
                    </td>
                    <td>${planHvr}</td>
                    <td>${actHvr}</td>
                    <td>${grossArea}</td>
                    <td>${actHa}</td>
                    <td>${h.realized_kg || 0}</td>
                    <td>${prestasiHvr.toFixed(1)}</td>
                    <td>${kapasitasHa.toFixed(2)}</td>
                    <td style="color:${varHvr > 100 ? 'red' : (varHvr < 100 ? 'green' : 'black')}; font-weight:bold;">${varHvr.toFixed(1)}%</td>
                    <td style="color:${varHa > 100 ? 'red' : (varHa < 100 ? 'green' : 'black')}; font-weight:bold;">${varHa.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    
    html += `
                    </tbody>
                </table>
                <div style="text-align:right; margin-top:20px;">
                    <button class="btn btn-primary" onclick="document.getElementById('modal-history').remove()">Tutup</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.openDivisiHistory = (divisi) => {
    const historyData = db.harvesting_daily.filter(h => h.divisi === divisi && (h.status === 'Selesai' || h.status === 'Closed'));
    
    const dateMap = {};
    historyData.forEach(h => {
        const dStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        if(!dateMap[dStr]) {
            dateMap[dStr] = {
                date: dStr,
                planHvr: 0,
                actHvr: 0,
                actHa: 0,
                actKg: 0,
                grossArea: 0,
                pusinganSum: 0,
                pusinganCount: 0,
                blocks: new Set()
            };
        }
        dateMap[dStr].planHvr += h.plan_pemanen || 0;
        dateMap[dStr].actHvr += h.realized_pemanen || 0;
        dateMap[dStr].actHa += h.realized_ha || 0;
        dateMap[dStr].actKg += h.realized_kg || 0;
        
        if (h.pusingan) {
            dateMap[dStr].pusinganSum += parseInt(h.pusingan) || 0;
            dateMap[dStr].pusinganCount++;
        }
        
        if (!dateMap[dStr].blocks.has(h.block)) {
            dateMap[dStr].blocks.add(h.block);
            let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === divisi);
            if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
            dateMap[dStr].grossArea += (blockData ? blockData.gross_area : 0);
        }
    });

    const dates = Object.values(dateMap).sort((a,b) => b.date.localeCompare(a.date));

    let html = `
        <div class="modal-overlay" id="modal-history-divisi">
            <div class="modal-content animate-fade-in" style="width:95vw; max-width:1200px; max-height:85vh; overflow-y:auto;">
                <div class="modal-header">
                    <h3>History Prestasi Divisi: ${divisi}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-history-divisi').remove()">&times;</button>
                </div>
                <table class="data-table table-compact" style="font-size:0.85rem; margin-top:15px;">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Divisi</th>
                            <th>Avg<br>Round</th>
                            <th>Plan<br>Hvr</th>
                            <th>Act<br>Hvr</th>
                            <th>Total Gross Area<br>(Ha)</th>
                            <th>Act<br>Ha</th>
                            <th>Act<br>Kg</th>
                            <th>Prestasi<br>(Kg/HK)</th>
                            <th>Kapasitas<br>(Ha/WD)</th>
                            <th>Var<br>Hvr (%)</th>
                            <th>Var<br>Ha (%)</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if(dates.length === 0) {
        html += `<tr><td colspan="12" style="text-align:center;">Belum ada data historis divisi</td></tr>`;
    } else {
        dates.forEach(r => {
            let formattedDate = r.date;
            const d = new Date(r.date);
            if(!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                formattedDate = `${day} ${months[d.getMonth()]}`;
            }
            
            let varHvr = 0;
            if (r.planHvr > 0) varHvr = (r.actHvr / r.planHvr) * 100;
            
            let varHa = 0;
            if (r.grossArea > 0) varHa = (r.actHa / r.grossArea) * 100;
            
            const prestasiHvr = r.actHvr > 0 ? r.actKg / r.actHvr : 0;
            const kapasitasHa = r.actHvr > 0 ? r.actHa / r.actHvr : 0;
            const avgPusingan = r.pusinganCount > 0 ? (r.pusinganSum / r.pusinganCount).toFixed(1) : '-';
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td><strong>${divisi}</strong></td>
                    <td>${avgPusingan}</td>
                    <td>${r.planHvr}</td>
                    <td>${r.actHvr}</td>
                    <td>${r.grossArea.toFixed(2)}</td>
                    <td>${r.actHa.toFixed(2)}</td>
                    <td>${r.actKg}</td>
                    <td>${prestasiHvr.toFixed(1)}</td>
                    <td>${kapasitasHa.toFixed(2)}</td>
                    <td style="color:${varHvr > 100 ? 'red' : (varHvr < 100 ? 'green' : 'black')}; font-weight:bold;">${varHvr.toFixed(1)}%</td>
                    <td style="color:${varHa > 100 ? 'red' : (varHa < 100 ? 'green' : 'black')}; font-weight:bold;">${varHa.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    
    html += `
                    </tbody>
                </table>
                <div style="text-align:right; margin-top:20px;">
                    <button class="btn btn-primary" onclick="document.getElementById('modal-history-divisi').remove()">Tutup</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.openMonthlyRealization = () => {
    const now = new Date();
    const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
    const displayMonthStr = `${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
    const masterDivisiList = masterData.divisi || [];
    
    let html = `
        <div class="modal-overlay" id="modal-monthly-realization">
            <div class="modal-content animate-fade-in" style="width:90vw; max-width:800px; max-height:85vh; overflow-y:auto;">
                <div class="modal-header" style="margin-bottom: 5px;">
                    <h3>Monitoring Realisasi Bulanan</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-monthly-realization').remove()">&times;</button>
                </div>
                <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--text-secondary); font-weight: 500;">Month : ${displayMonthStr}</h4>
                <table class="data-table table-compact" style="font-size:0.9rem; margin-top:15px;">
                    <thead>
                        <tr>
                            <th>Divisi</th>
                            <th>Target Bulanan (Kg)</th>
                            <th>Realisasi (Kg)</th>
                            <th>% Pencapaian</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (masterDivisiList.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center;">Belum ada master divisi</td></tr>`;
    } else {
        masterDivisiList.forEach(div => {
            let filteredMonthly = db.harvesting_monthly || [];
            if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
                filteredMonthly = filteredMonthly.filter(m => !m.estate || m.estate === currentUser.estate);
            }
            const planRecord = filteredMonthly.find(m => m.divisi === div.name && m.month === currentMonthStr);
            const targetKg = planRecord ? (planRecord.target_kg || 0) : 0;
            let filteredDaily = db.harvesting_daily || [];
            if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
                filteredDaily = filteredDaily.filter(h => !h.estate || h.estate === currentUser.estate);
            }
            
            const divRealisasi = filteredDaily.filter(h => 
                h.divisi === div.name && 
                (h.status === 'Selesai' || h.status === 'Closed') &&
                h.date && h.date.startsWith(currentMonthStr)
            ).reduce((sum, h) => sum + (h.realized_kg || 0), 0);
            
            const percent = targetKg > 0 ? (divRealisasi / targetKg) * 100 : 0;
            
            html += `
                <tr>
                    <td><strong>${div.name}</strong></td>
                    <td>${targetKg}</td>
                    <td>${divRealisasi}</td>
                    <td style="color:${percent >= 100 ? 'green' : (percent > 0 ? 'orange' : 'black')}; font-weight:bold;">${percent.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    
    html += `
                    </tbody>
                </table>
                <div style="text-align:right; margin-top:20px;">
                    <button class="btn btn-primary" onclick="document.getElementById('modal-monthly-realization').remove()">Tutup</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

let currentMonthlyPlanId = null;
window.checkMonthlyPlan = () => {
    const divisi = document.getElementById('hm-divisi').value;
    const month = document.getElementById('hm-month').value;
    const btn = document.getElementById('btn-hm-submit');
    const targetInput = document.getElementById('hm-target');
    
    if(divisi && month) {
        const existing = (db.harvesting_monthly || []).find(m => m.divisi === divisi && m.month === month);
        if(existing) {
            currentMonthlyPlanId = existing.id;
            targetInput.value = existing.target_kg;
            targetInput.disabled = true;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Terkunci (Sudah Diinput)';
        } else {
            currentMonthlyPlanId = null;
            targetInput.value = '';
            targetInput.disabled = false;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-calendar-days"></i> Simpan Rencana Bulanan';
        }
    }
};

window.selectedDailyTrucks = [];

window.openTruckSelectionModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-truck-selection';
    
    let checkboxesHtml = masterData.truk.map(t => {
        const isChecked = window.selectedDailyTrucks.includes(t.plate_number) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; gap:10px; margin-bottom:8px; padding:8px; background:#f1f5f9; border-radius:5px; cursor:pointer;">
                <input type="checkbox" class="truck-checkbox" value="${t.plate_number}" ${isChecked} style="width:18px; height:18px;">
                <span style="font-size:0.95rem;">${t.plate_number} ${t.supir ? `(${t.supir})` : ''}</span>
            </label>
        `;
    }).join('');
    
    if (masterData.truk.length === 0) {
        checkboxesHtml = '<p style="color:#ef4444; font-size:0.9rem;">Tidak ada data truk di Master Data untuk estate ini.</p>';
    }

    modal.innerHTML = `
        <div class="modal-content animate-fade-in" style="max-width:400px; max-height:80vh; display:flex; flex-direction:column;">
            <h3>Pilih Alokasi Truk</h3>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:15px;">Pilih truk yang akan dialokasikan untuk divisi ini pada tanggal tersebut.</p>
            
            <div style="flex:1; overflow-y:auto; margin-bottom:15px; max-height: 400px;">
                ${checkboxesHtml}
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="btn btn-logout" onclick="document.getElementById('modal-truck-selection').remove()" style="background:#64748b; color:white; border:none; padding:8px 16px;">Batal</button>
                <button class="btn btn-primary" onclick="saveTruckSelection()" style="padding:8px 16px;">Simpan Pilihan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.saveTruckSelection = () => {
    const checkboxes = document.querySelectorAll('.truck-checkbox:checked');
    window.selectedDailyTrucks = Array.from(checkboxes).map(cb => cb.value);
    
    const btnText = document.getElementById('btn-truck-text');
    if (window.selectedDailyTrucks.length === 0) {
        btnText.innerText = '-- Pilih Truk --';
    } else {
        btnText.innerText = `${window.selectedDailyTrucks.length} Truk Dipilih`;
    }
    
    document.getElementById('modal-truck-selection').remove();
};

window.openAddHarvestingRealizationModal = (id, block, planJjg, planHvr, planKg, divisi) => {
    let blockData;
    if (divisi && divisi !== 'undefined') {
        blockData = masterData.blok.find(b => b.name === block && b.divisi === divisi);
    }
    if (!blockData) {
        blockData = masterData.blok.find(b => b.name === block); // fallback
    }
    const grossArea = blockData ? blockData.gross_area : 0;
    
    const h = (db.harvesting_daily || []).find(x => x.id == id) || {};
    const currJanjang = h.realized_janjang || 0;
    const currPemanen = h.realized_pemanen || 0;
    const currKg = h.realized_kg || 0;
    const currHa = h.realized_ha || 0;
    // Gather allocated trucks for this Divisi and Date
    const allocatedTrucks = new Set();
    const sameDivisiDateRows = db.harvesting_daily.filter(x => x.date === h.date && x.divisi === h.divisi && x.allocated_trucks);
    sameDivisiDateRows.forEach(row => {
        try {
            const arr = JSON.parse(row.allocated_trucks);
            if(Array.isArray(arr)) arr.forEach(t => allocatedTrucks.add(t));
        } catch(e){}
    });
    const allocatedTrucksOptions = Array.from(allocatedTrucks).map(t => `<option value="${t}">${t}</option>`).join('');

    let ritaseListInnerHtml = '';
    try {
        const rList = JSON.parse(h.ritase_list || '[]');
        if(rList.length > 0) {
            ritaseListInnerHtml = `
                <strong style="color:#0369a1; display:block; margin-bottom:5px;">Truk Terdahulu Hari Ini:</strong>
                <ul style="margin:0 0 0 20px; padding:0; color:#0c4a6e; font-size:0.85rem;">
                    ${rList.map(r => `<li><b>${r.truck}</b>: ${r.janjang || 0} Jjg / ${r.kg || 0} Kg</li>`).join('')}
                </ul>
            `;
        } else {
            ritaseListInnerHtml = `
                <strong style="color:#0369a1; display:block; margin-bottom:5px;">Truk Terdahulu Hari Ini:</strong>
                <p style="margin:0; color:#0c4a6e; font-size:0.85rem; font-style:italic;">Belum ada ritase.</p>
            `;
        }
    } catch(e){}
    
    const isClosed = h.status === 'Closed';
    const isPemanenLocked = currPemanen > 0;
    const isHaLocked = currHa > 0;
    
    if (isClosed) {
        alert("Blok ini sudah ditutup (Closed) dan tidak dapat ditambah lagi.");
        return;
    }
    
    const isGroupA = ['Mandor', 'Supir', 'Krani Divisi', 'Krani Mill'].includes(currentUser.role);
    const isGroupB = !isGroupA;

    let formFieldsHtml = '';
    
    if (isGroupA) {
        formFieldsHtml = `
            <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
                <label>Pilih Truk (Wajib)</label>
                <select id="hr-truck" class="form-control" required>
                    <option value="" disabled selected>-- Pilih Truk Dialokasikan --</option>
                    ${allocatedTrucksOptions}
                </select>
                ${allocatedTrucks.size === 0 ? '<small style="color:#ef4444; font-size:0.8rem;">*Tidak ada truk dialokasikan di divisi ini.</small>' : ''}
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label title="Opsional untuk Brondolan">Tambahan Janjang</label>
                <input type="number" id="hr-janjang" class="form-control" placeholder="0">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Tambahan Kg</label>
                <input type="number" step="0.1" id="hr-kg" class="form-control" placeholder="0" required>
            </div>
        `;
    } else if (isGroupB) {
        formFieldsHtml = `
            <div class="form-group" style="margin-bottom: 0;">
                <label>HK Pemanen</label>
                <input type="number" id="hr-pemanen" class="form-control" placeholder="0" ${isPemanenLocked ? 'disabled style="background:#e2e8f0; cursor:not-allowed;" title="HK Pemanen sudah dilock karena cukup 1 kali input."' : 'required'}>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Luasan (Ha)</label>
                <input type="number" step="0.01" id="hr-ha" class="form-control" placeholder="0" ${isHaLocked ? 'disabled style="background:#e2e8f0; cursor:not-allowed;" title="Luasan Ha sudah dilock karena cukup 1 kali input."' : 'required'}>
            </div>
            <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
                <label>Status Blok</label>
                <select id="hr-status" class="form-control">
                    <option value="In Progress" ${h.status !== 'Closed' ? 'selected' : ''}>Masih Berlanjut (In Progress)</option>
                    <option value="Closed" ${h.status === 'Closed' ? 'selected' : ''}>Tutup Blok (Selesai)</option>
                </select>
            </div>
        `;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-harvesting-realization';
    modal.innerHTML = `
        <div class="modal-content animate-fade-in" style="max-width:550px;">
            <h3>Input Ritase Panen: ${block} <span style="font-size:0.9rem; color:var(--text-secondary); font-weight:normal;">(Luas: ${grossArea} Ha)</span></h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; margin-bottom: 15px;">
                <div style="background: #f1f5f9; border-left: 4px solid #94a3b8; padding: 10px; border-radius: 4px; font-size: 0.85rem;">
                    <strong style="color:#334155;">Total Terkumpul (Saat Ini):</strong>
                    <div style="margin-top:5px; line-height:1.4;">
                        Janjang: ${currJanjang} / ${planJjg}<br>
                        Kg: ${currKg} / ${planKg}<br>
                        HK (Pemanen): ${currPemanen} / ${planHvr}<br>
                        Luasan: ${currHa} / ${grossArea} Ha
                    </div>
                </div>
                <div style="background: #e0f2fe; border-left: 4px solid #38bdf8; padding: 10px; border-radius: 4px;">
                    ${ritaseListInnerHtml}
                </div>
            </div>
            
            <p style="margin-top: 5px; font-weight: bold; font-size: 0.95rem;">Masukkan Tambahan (Ritase Baru):</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                ${formFieldsHtml}
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button class="btn btn-logout" onclick="document.getElementById('modal-harvesting-realization').remove()" style="background:#64748b; color:white; border:none; padding:8px 16px;">Batal</button>
                <button class="btn btn-primary" onclick="submitHarvestingRealization(${id})" style="padding:8px 16px;">Simpan Tambahan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitHarvestingRealization = async (id) => {
    const isGroupA = ['Mandor', 'Supir', 'Krani Divisi', 'Krani Mill'].includes(currentUser.role);
    const isGroupB = !isGroupA;
    
    // Get current values
    const h = (db.harvesting_daily || []).find(x => x.id == id) || {};

    let truck = '';
    let addJanjang = 0;
    let addKg = 0;
    let addPemanen = 0;
    let addHa = 0;
    let status = h.status || 'In Progress';

    if (isGroupA) {
        truck = document.getElementById('hr-truck').value;
        if (!truck) {
            alert("Pilih truk pengangkut terlebih dahulu!");
            return;
        }
        addJanjang = parseFloat(document.getElementById('hr-janjang').value) || 0;
        addKg = parseFloat(document.getElementById('hr-kg').value) || 0;
        
        if (addJanjang === 0 && addKg === 0) {
            alert("Inputan tambahan masih kosong. Silakan isi setidaknya satu nilai (Kg atau Janjang).");
            return;
        }
    } else if (isGroupB) {
        const pEl = document.getElementById('hr-pemanen');
        if(pEl && !pEl.disabled) {
            addPemanen = parseInt(pEl.value) || 0;
        }
        const haEl = document.getElementById('hr-ha');
        if(haEl && !haEl.disabled) {
            addHa = parseFloat(haEl.value) || 0;
        }
        status = document.getElementById('hr-status').value;

        if (addPemanen === 0 && addHa === 0 && status === h.status) {
            alert("Tidak ada data atau status yang diupdate.");
            return;
        }
    }
    
    let blockData;
    if (h.divisi && h.divisi !== 'undefined') {
        blockData = masterData.blok.find(b => b.name === h.block && b.divisi === h.divisi);
    }
    if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
    const grossArea = blockData ? blockData.gross_area : 0;
    
    const totalJanjang = (h.realized_janjang || 0) + addJanjang;
    const totalPemanen = (h.realized_pemanen || 0) + addPemanen;
    const totalKg = (h.realized_kg || 0) + addKg;
    const totalHa = (h.realized_ha || 0) + addHa;
    
    if (grossArea > 0 && totalHa > grossArea) {
        alert(`Error: Total akumulasi Luasan Panen (${totalHa.toFixed(2)} Ha) tidak boleh melebihi Luas Blok (${grossArea} Ha). Sisa maksimal yang bisa diinput adalah ${(grossArea - (h.realized_ha || 0)).toFixed(2)} Ha.`);
        return;
    }
    
    let ritaseList = [];
    try { ritaseList = JSON.parse(h.ritase_list || '[]'); } catch(e){}
    if (addJanjang > 0 || addKg > 0) {
        ritaseList.push({
            truck: truck,
            janjang: addJanjang,
            kg: addKg,
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const res = await fetch(`${API_URL}/harvesting/daily/${id}/realization`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                realized_janjang: totalJanjang, 
                realized_pemanen: totalPemanen, 
                realized_kg: totalKg, 
                realized_ha: totalHa,
                status: status,
                ritase_list: JSON.stringify(ritaseList)
            })
        });
        
        if (!res.ok) {
            const errData = await res.json();
            alert("Error: " + (errData.error || "Gagal menyimpan realisasi"));
            return;
        }
        
        const modalEl = document.getElementById('modal-harvesting-realization');
        if(modalEl) modalEl.remove();
        
        await loadData();
    } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan jaringan atau server.");
    }
};

const bindForms = () => {
    const formVehicle = document.getElementById('form-vehicle');
    if(formVehicle) formVehicle.onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const autoTimeDepart = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const selectedBlock = document.getElementById('v-block').value;
        const blockData = masterData.blok.find(b => b.name === selectedBlock);
        const payload = {
            plate: document.getElementById('v-plate').value,
            driver: document.getElementById('v-driver').value,
            ritase: document.getElementById('v-ritase').value,
            block: selectedBlock,
            janjang: document.getElementById('v-janjang').value,
            timeDepart: autoTimeDepart,
            timeArrive: "",
            date: window.getLocalDate(),
            estate: currentUser.estate,
            divisi: blockData ? blockData.divisi : '-'
        };
        try {
            await fetch(`${API_URL}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formVehicle.reset();
            const modal = document.getElementById('modal-vehicle-input');
            if (modal) modal.style.display = 'none';
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
            targetWorkers: parseInt(document.getElementById('u-workers').value) || 0,
            worker: document.getElementById('u-worker').value,
            startDate: window.getLocalDate(),
            estate: currentUser.estate
        };
        try {
            await fetch(`${API_URL}/upkeep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formUpkeep.reset();
            const modal = document.getElementById('modal-upkeep-input');
            if (modal) modal.style.display = 'none';
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
            targetKg: parseFloat(document.getElementById('p-target').value),
            estate: currentUser.estate
        };
        try {
            await fetch(`${API_URL}/pemupukan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formPemupukan.reset();
            const modal = document.getElementById('modal-pemupukan-input');
            if (modal) modal.style.display = 'none';
            await loadData();
        } catch (e) { console.error(e); }
    };
    
    const formHarvestingMonthly = document.getElementById('form-harvesting-monthly');
    if (formHarvestingMonthly) formHarvestingMonthly.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            estate: currentUser.estate,
            divisi: document.getElementById('hm-divisi').value,
            month: document.getElementById('hm-month').value,
            target_kg: parseFloat(document.getElementById('hm-target').value)
        };
        try {
            let res;
            if(currentMonthlyPlanId) {
                res = await fetch(`${API_URL}/harvesting/monthly/${currentMonthlyPlanId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_URL}/harvesting/monthly`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            if (res.ok) {
                formHarvestingMonthly.reset();
            const modal = document.getElementById('modal-harvesting-monthly-input');
            if (modal) modal.style.display = 'none';
                currentMonthlyPlanId = null;
                document.getElementById('btn-hm-submit').innerHTML = '<i class="fa-solid fa-calendar-days"></i> Simpan Rencana Bulanan';
                await loadData();
                alert("Rencana bulanan berhasil disimpan.");
            } else {
                const errData = await res.json();
                alert(errData.error || "Gagal menyimpan rencana bulanan.");
            }
        } catch (e) { console.error(e); }
    };

    const formHarvestingDaily = document.getElementById('form-harvesting-daily');
    if (formHarvestingDaily) formHarvestingDaily.onsubmit = async (e) => {
        e.preventDefault();
        const block = document.getElementById('hd-block').value;
        const akp = parseFloat(document.getElementById('hd-akp').value);
        
        const estJanjang = parseInt(document.getElementById('hd-est-janjang').innerText.replace(/,/g, '').replace(/\./g, '')) || 0;
        const estKg = parseFloat(document.getElementById('hd-est-kg').innerText.replace(/,/g, '').replace(/\./g, '').replace(' Kg', '')) || 0;
        
        const allocatedTrucks = window.selectedDailyTrucks || [];

        const payload = {
            date: document.getElementById('hd-date').value,
            estate: currentUser.estate,
            divisi: document.getElementById('hd-divisi').value,
            block: block,
            akp: akp,
            est_janjang: estJanjang,
            est_kg: estKg,
            plan_pemanen: parseInt(document.getElementById('hd-pemanen').value),
            mandor: document.getElementById('hd-mandor').value,
            pusingan: document.getElementById('hd-pusingan').value,
            allocated_trucks: JSON.stringify(allocatedTrucks)
        };
        try {
            await fetch(`${API_URL}/harvesting/daily`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formHarvestingDaily.reset();
            const modal = document.getElementById('modal-harvesting-daily-input');
            if (modal) modal.style.display = 'none';
            document.getElementById('hd-est-janjang').innerText = '0';
            document.getElementById('hd-est-kg').innerText = '0 Kg';
            window.selectedDailyTrucks = [];
            document.getElementById('btn-truck-text').innerText = '-- Pilih Truk --';
            await loadData();
        } catch (e) { console.error(e); }
    };

    const formUser = document.getElementById('form-user');
    if(formUser) formUser.onsubmit = async (e) => {
        e.preventDefault();
        const role = document.getElementById('u-role').value;
        const multiRoles = ['Admin', 'Senior Field Manager', 'Manager', 'Manager Mill'];
        const estate = multiRoles.includes(role)
            ? Array.from(document.querySelectorAll('input[name="u_estate"]:checked')).map(cb => cb.value).join(', ')
            : document.getElementById('u-estate-dropdown').value;
            
        const payload = {
            username: document.getElementById('u-username').value,
            password: document.getElementById('u-password').value,
            role: role,
            estate: estate
        };
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                alert('Gagal menambahkan user: ' + (data.error || data.message || 'Error'));
                return;
            }
            formUser.reset();
            const modal = document.getElementById('modal-user-input');
            if (modal) modal.style.display = 'none';
            await loadUsers();
        } catch (e) { 
            console.error(e); 
            alert('Terjadi kesalahan sistem.'); 
        }
    };
};

// Charts
let dashboardTonaseChartInstance = null;

const initDashboardChart = async () => {
    const ctx = document.getElementById('tonaseChart');
    if(!ctx) return;
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        // Use today's date
        const dateObj = new Date();
        const date = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
        
        const res = await fetch(`${API_URL}/tonase/${mill}/${date}`);
        let resData = await res.json();
        
        // Filter by estate if user is not a Mill
        const isMill = currentUser.estate && currentUser.estate.endsWith('Mill');
        if (!isMill && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
            resData = resData.filter(item => item.estate === currentUser.estate);
        }
        
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const actualData = new Array(hours.length).fill(0);
        let totalTonase = 0;
        let estateProgress = {};
        
        resData.forEach(item => {
            const hIdx = hours.indexOf(item.time_hour);
            const val = (parseFloat(item.realized_kg) || 0) / 1000;
            const targetVal = (parseFloat(item.target_kg) || 0) / 1000;
            
            if (hIdx !== -1) {
                actualData[hIdx] += val;
            }
            totalTonase += val;
            
            const est = item.estate || 'Unknown Estate';
            if (!estateProgress[est]) estateProgress[est] = { target: 0, realized: 0 };
            estateProgress[est].realized += val;
            estateProgress[est].target += targetVal;
        });
        
        const progressContainer = document.getElementById('dashboard-progress-panen-container');
        if (progressContainer) {
            let progressHtml = '';
            const estates = Object.keys(estateProgress);
            if (estates.length === 0) {
                progressHtml = '<p style="color:var(--text-secondary); text-align:center;">Belum ada data progress hari ini</p>';
            } else {
                estates.forEach(est => {
                    const data = estateProgress[est];
                    let pct = 0;
                    if (data.target > 0) pct = Math.round((data.realized / data.target) * 100);
                    else if (data.realized > 0) pct = 100;
                    if (pct > 100) pct = 100;
                    
                    let bgColor = '';
                    if (pct < 50) bgColor = 'background-color: var(--danger);';
                    else if (pct < 80) bgColor = 'background-color: var(--warning);';
                    
                    progressHtml += `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${est}</span>
                                <strong>${pct}%</strong>
                            </div>
                            <div class="progress-wrapper" title="Realized: ${data.realized.toFixed(1)} T / Target: ${data.target.toFixed(1)} T">
                                <div class="progress-fill" style="width: ${pct}%; ${bgColor}"></div>
                            </div>
                        </div>
                    `;
                });
            }
            progressContainer.innerHTML = progressHtml;
        }
        
        const tonaseEl = document.getElementById('dashboard-tonase-today-value');
        if (tonaseEl) {
            tonaseEl.innerText = totalTonase.toFixed(1) + ' T';
        }
        
        // Calculate Active Trucks
        const trukEl = document.getElementById('dashboard-truk-aktif-value');
        if (trukEl && db.vehicles) {
            let activeTrucks = 0;
            const isMillUser = currentUser && currentUser.estate && currentUser.estate.endsWith('Mill');
            const allowedEstates = isMillUser ? (masterData.supply_chain || []).map(sc => sc.estate) : [];
            
            db.vehicles.forEach(v => {
                const tArrive = v.timearrive || v.timeArrive;
                if (!tArrive || tArrive.trim() === '') { // It's active
                    if (isMillUser) {
                        if (allowedEstates.includes(v.estate)) activeTrucks++;
                    } else {
                        if (v.estate === currentUser.estate) activeTrucks++;
                    }
                }
            });
            trukEl.innerText = activeTrucks;
        }
        
        if (dashboardTonaseChartInstance) dashboardTonaseChartInstance.destroy();
        
        dashboardTonaseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Tonase Masuk (Ton)',
                    data: actualData,
                    borderColor: '#0d8b4e',
                    backgroundColor: 'rgba(13, 139, 78, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: '#0d8b4e',
                        font: { weight: 'bold' },
                        formatter: function(value) {
                            return value > 0 ? value.toFixed(1) : '';
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        max: 200,
                        ticks: {
                            stepSize: 20
                        },
                        grace: '10%' // Add space above points for labels
                    } 
                }
            }
        });
    } catch (e) {
        console.error("Error loading dashboard tonase chart", e);
    }
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
    if(viewId === 'tonase') {
        if (currentUser.role === 'Krani Mill' || currentUser.role === 'Manager Mill' || currentUser.role === 'Admin' || currentUser.role === 'Office Assistant Mill') {
            document.querySelectorAll('.btn-tonase-action').forEach(b => b.style.display = 'inline-block');
            if (!document.getElementById('t-date').value) {
                document.getElementById('t-date').value = window.getLocalDate();
            }
        } else {
            document.querySelectorAll('.btn-tonase-action').forEach(b => b.style.display = 'none');
        }
        loadTonaseChartData();
    }
    if(viewId === 'users') { 
        renderUsersTable(); 
        bindForms(); 
        window.toggleEstateUI('u-role', 'u-estate-dropdown', 'u-estate-container', 'u-estate-label');
    }
    if(viewId === 'master') { renderMasterTables(); }
    
    // Read-only logic for Senior Field Manager
    if (currentUser && currentUser.role === 'Senior Field Manager') {
        const forms = container.querySelectorAll('.form-container');
        forms.forEach(f => f.style.display = 'none');
        const layouts = container.querySelectorAll('.module-layout');
        layouts.forEach(l => l.style.gridTemplateColumns = '1fr');
    }

    // Specific read-only logic for Vehicle Motion Monitoring (Manager, Askep, Assistant)
    const vehicleReadOnlyRoles = ['Manager', 'Askep', 'Assistant'];
    if (viewId === 'vehicle' && currentUser && vehicleReadOnlyRoles.includes(currentUser.role)) {
        const forms = container.querySelectorAll('.form-container');
        forms.forEach(f => f.style.display = 'none');
        const layouts = container.querySelectorAll('.module-layout');
        layouts.forEach(l => l.style.gridTemplateColumns = '1fr');
    }

    // Specific read-only logic for Upkeep and Pemupukan (Only Assistant, Askep, and Admin can input rencana)
    if ((viewId === 'upkeep' || viewId === 'pemupukan') && currentUser) {
        if (currentUser.role !== 'Assistant' && currentUser.role !== 'Askep' && currentUser.role !== 'Admin') {
            const forms = container.querySelectorAll('.form-container');
            forms.forEach(f => f.style.display = 'none');
            const layouts = container.querySelectorAll('.module-layout');
            layouts.forEach(l => l.style.gridTemplateColumns = '1fr');
        }
    }

    // Harvesting specific read-only logic
    if (viewId === 'harvesting' && currentUser) {
        const role = currentUser.role;
        const canInputMonthly = ['Assistant', 'Askep', 'Admin'].includes(role);
        const canInputDaily = ['Mandor', 'Assistant', 'Askep', 'Admin'].includes(role);

        const containerMonthly = document.getElementById('container-monthly-plan');
        if (containerMonthly) containerMonthly.style.display = canInputMonthly ? 'block' : 'none';
        
        const containerDaily = document.getElementById('container-daily-plan');
        if (containerDaily) containerDaily.style.display = canInputDaily ? 'block' : 'none';

        if (!canInputMonthly && !canInputDaily) {
            const forms = container.querySelectorAll('.form-container');
            forms.forEach(f => f.style.display = 'none');
            const layouts = container.querySelectorAll('.module-layout');
            layouts.forEach(l => l.style.gridTemplateColumns = '1fr');
        }
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Render Date
    const elDate = document.getElementById('display-date');
    if (elDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        elDate.textContent = new Date().toLocaleDateString('id-ID', options);
    }

    // 1. Check Auth
    checkAuth();
    
    // Login Form Listener
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
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
    
    const isMill = currentUser.estate.endsWith('Mill');
    document.querySelectorAll('.master-estate-card').forEach(el => el.style.display = isMill ? 'none' : 'block');
    const scCard = document.getElementById('card-master-supply-chain');
    if (scCard) scCard.style.display = isMill ? 'block' : 'none';
    
    if (isMill) {
        const scContainer = document.getElementById('container-master-supply-chain');
        if (scContainer) {
            const allEstates = [
                'Bunga Tanjung Estate', 'Sungai Teramang Estate', 'Air Bikuk Estate',
                'Batu Kuda Estate', 'Air Buluh Estate', 'Malin Deman Estate',
                'Tanah Rekah Estate', 'Muko Muko Estate', 'Sei Jerinjing Estate',
                'Talang Petai Estate', 'Sungai Kiang Estate', 'Air Majunto Estate',
                'Small Holder'
            ];
            const currentSC = (masterData.supply_chain || []).map(sc => sc.estate);
            
            let scHtml = '';
            allEstates.forEach(est => {
                const checked = currentSC.includes(est) ? 'checked' : '';
                scHtml += `
                    <div style="display:flex; align-items:center; gap:10px; background:var(--background-color); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                        <input type="checkbox" class="sc-checkbox" value="${est}" id="sc-${est.replace(/\s+/g, '-')}" ${checked} style="width:20px; height:20px;">
                        <label for="sc-${est.replace(/\s+/g, '-')}" style="cursor:pointer; margin:0; font-weight:bold;">${est}</label>
                    </div>
                `;
            });
            scContainer.innerHTML = scHtml;
        }
    }
    
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
        let trukRows = '';
        masterData.truk.forEach(t => {
            const safePlate = t.plate_number.replace(/['"\\n\\r]/g, ' ');
            const supirText = t.supir ? t.supir : '-';
            trukRows += `
                <tr>
                    <td><strong>${t.plate_number}</strong></td>
                    <td>${supirText}</td>
                    <td style="width:140px; text-align:right;">
                        <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem; margin-right:5px;" onclick="editMaster('truk', ${t.id}, '${safePlate}')"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button type="button" class="btn btn-delete-hover" onclick="deleteMaster('truk', ${t.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
                    </td>
                </tr>
            `;
        });

        cTruk.innerHTML = `
            <div id="truk-default-view" style="width: 100%;">
                <table class="data-table" style="font-size:0.85rem; width:100%;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Plat Nomor</th>
                            <th style="text-align:left;">Nama Supir</th>
                            <th style="text-align:right;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trukRows || '<tr><td colspan="3" style="text-align:center;">Belum ada data truk.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    const cSupir = document.getElementById('container-master-supir');
    if (cSupir) {
        let supirRows = '';
        masterData.supir.forEach(s => {
            const safeName = s.name.replace(/['"\\n\\r]/g, ' ');
            supirRows += `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td style="width:140px; text-align:right;">
                        <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem; margin-right:5px;" onclick="editMaster('supir', ${s.id}, '${safeName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.75rem;" onclick="deleteMaster('supir', ${s.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
                    </td>
                </tr>
            `;
        });
        cSupir.innerHTML = `
            <div style="width: 100%;">
                <table class="data-table" style="font-size:0.85rem; width:100%;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Nama Supir</th>
                            <th style="text-align:right;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${supirRows || '<tr><td colspan="2" style="text-align:center;">Belum ada data supir.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    const cPupuk = document.getElementById('container-master-pupuk');
    if (cPupuk) {
        let pupukRows = '';
        masterData.pupuk.forEach(p => {
            const safeName = p.name.replace(/['"\\n\\r]/g, ' ');
            pupukRows += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td style="width:140px; text-align:right;">
                        <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem; margin-right:5px;" onclick="editMaster('pupuk', ${p.id}, '${safeName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button type="button" class="btn btn-delete-hover" onclick="deleteMaster('pupuk', ${p.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
                    </td>
                </tr>
            `;
        });
        cPupuk.innerHTML = `
            <div style="width: 100%; margin-top:15px;">
                <table class="data-table" style="font-size:0.85rem; width:100%;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Nama Pupuk</th>
                            <th style="text-align:right;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pupukRows || '<tr><td colspan="2" style="text-align:center;">Belum ada data pupuk.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
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
    const blokRows = bloks.map(b => `<tr><td>${b.name}</td><td>${b.gross_area || 0}</td><td>${b.sph || 0}</td><td>${b.total_stand || 0}</td><td>${b.bjr}</td><td style="width:120px; text-align:right;"><button type="button" class="btn btn-primary" style="padding:2px 6px; font-size:0.7rem; margin-right:5px;" onclick="editMasterBlok(${b.id}, '${b.name}', ${b.bjr})">Edit BJR</button><button type="button" class="btn btn-delete-hover" style="padding:2px 6px; font-size:0.7rem;" onclick="deleteMaster('blok', ${b.id})">Hapus</button></td></tr>`).join('');
    
    const safeDivName = d.name.replace(/['"\\n\\r]/g, ' ');
    contentDiv.innerHTML = `
        <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1; margin-bottom: 20px;">
            <strong style="font-size:1.1rem; margin-right: 20px;">${d.name}</strong>
            <button type="button" class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="editMaster('divisi', ${d.id}, '${safeDivName}')"><i class="fa-solid fa-pen"></i> Edit Divisi</button>
            <button type="button" class="btn btn-logout" style="background:#ef4444; color:white; border:none; padding:4px 8px; font-size:0.8rem;" onclick="deleteMaster('divisi', ${d.id})"><i class="fa-solid fa-trash"></i> Hapus Divisi</button>
        </div>
        
        <h4>Daftar Blok di ${d.name}</h4>
        <div style="margin: 15px 0;">
            <button type="button" class="btn btn-primary" onclick="promptAddBlok('${safeDivName}')"><i class="fa-solid fa-plus"></i> Tambah Blok Baru</button>
        </div>
        <table class="data-table" style="font-size:0.85rem;">
            <thead><tr><th>Nama Blok</th><th>Gross Area (Ha)</th><th>SPH</th><th>Total Stand</th><th>BJR (Kg)</th><th>Aksi</th></tr></thead>
            <tbody>${blokRows || '<tr><td colspan="6" style="text-align:center;">Belum ada blok di divisi ini.</td></tr>'}</tbody>
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
        const supirName = t.supir ? ` (Supir: ${t.supir})` : ' (Supir: -)';
        contentDiv.innerHTML = `
            <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:10px 16px; border-radius:8px; font-size:0.95rem; border:1px solid #cbd5e1;">
                <strong style="font-size:1.1rem; margin-right: 20px;">${safeName}${supirName}</strong>
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
    let bulkPlaceholder = type === 'truk' ? 'Paste daftar di sini (Plat Truk [TAB] Nama Supir)...' : 'Paste daftar di sini...';
    
    let singleInputHtml = '';
    if (type === 'truk') {
        singleInputHtml = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <input type="text" id="m-single-${type}" class="form-control" placeholder="${placeholderStr}">
                <input type="text" id="m-single-supir-${type}" class="form-control" placeholder="Nama Supir (Wajib)">
                <button type="button" class="btn btn-primary" onclick="addMasterSingle('${type}')">+ Tambah Truk</button>
            </div>
        `;
    } else {
        singleInputHtml = `
            <div style="display:flex; gap:10px;">
                <input type="text" id="m-single-${type}" class="form-control" placeholder="${placeholderStr}">
                <button type="button" class="btn btn-primary" style="white-space:nowrap; padding: 4px 15px;" onclick="addMasterSingle('${type}')">+ Tambah</button>
            </div>
        `;
    }
    
    let bulkInstruction = '';
    if (type === 'truk') {
        bulkInstruction = `<p style="font-size: 0.8rem; color:#64748b; margin-top:0; margin-bottom:10px;">Pastikan Anda meng-copy 2 kolom dari Excel: Kolom 1 untuk Plat Nomor, Kolom 2 untuk Nama Supir.</p>`;
    }

    const html = `
        <div class="modal-overlay" id="modal-add-master-${type}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Master ${titleStr}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-add-master-${type}').remove()">&times;</button>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 1: Tambah Satu per Satu</label>
                    ${singleInputHtml}
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 2: Tambah Banyak Sekaligus (Paste dari Excel):</label>
                    ${bulkInstruction}
                    <textarea id="m-bulk-${type}" class="form-control" rows="5" placeholder="${bulkPlaceholder}"></textarea>
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
    if (type === 'truk') {
        const supirVal = document.getElementById(`m-single-supir-${type}`).value;
        if (!supirVal || !supirVal.trim()) {
            alert("Nama Supir wajib diisi untuk Truk!");
            return;
        }
        payload.plate_number = val.trim();
        payload.supir = supirVal.trim();
    }
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
    
    let items;
    if (type === 'truk') {
        const rows = text.trim().split('\n');
        items = rows.map(r => {
            const cols = r.split('\t');
            if (cols.length >= 2) {
                return { plate_number: cols[0].trim(), supir: cols[1].trim() };
            }
            return null;
        }).filter(item => item !== null && item.plate_number !== '');
    } else {
        items = text.split(/[\n\t,]+/).map(l => l.trim()).filter(l => l !== '');
    }
    
    if(items.length === 0) {
        alert("Tidak ada data valid yang bisa dibaca.");
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/master/${type}/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, items })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById(`modal-add-master-${type}`).remove();
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan data bulk');
        }
    } catch(err) { console.error(err); }
};



window.saveSupplyChain = async () => {
    const checkboxes = document.querySelectorAll('.sc-checkbox:checked');
    const estates = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        const res = await fetch(`${API_URL}/master/supply_chain/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mill: currentUser.estate, estates })
        });
        if (!res.ok) alert('Gagal menyimpan supply chain');
        else {
            alert('Supply Chain berhasil disimpan!');
            await loadMasterData();
        }
    } catch (e) {
        console.error(e);
        alert('Gagal menyimpan supply chain');
    }
};

window.toggleSupplyChain = async (estateName, isActive) => {
    try {
        const res = await fetch(`${API_URL}/master/supply_chain/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mill: currentUser.estate, estate: estateName, active: isActive })
        });
        if (!res.ok) alert('Gagal mengupdate supply chain');
        else await loadMasterData();
    } catch (e) {
        console.error(e);
        alert('Gagal mengupdate supply chain');
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
    const newBjr = prompt(`Edit nilai BJR (Kg) untuk blok ${currentName}:`, currentBjr);
    if (newBjr === null || newBjr.trim() === '') return;
    
    const parsedBjr = parseFloat(newBjr.replace(',', '.'));
    if (isNaN(parsedBjr)) { alert("Nilai BJR harus berupa angka!"); return; }

    try {
        const res = await fetch(`${API_URL}/master/blok/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentName, bjr: parsedBjr })
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
    const val = document.getElementById(`m-val-${type}`).value;
    if (type === 'divisi') payload.name = val;
    else if (type === 'supir') payload.name = val;
    else if (type === 'pupuk') payload.name = val;
    else if (type === 'truk') {
        const supirVal = document.getElementById(`m-single-supir-${type}`).value;
        if (!supirVal || !supirVal.trim()) { alert('Nama Supir wajib diisi'); return; }
        payload.plate_number = val.toUpperCase();
        payload.supir = supirVal.toUpperCase();
    } else {
        payload.name = val;
    }

    try {
        const res = await fetch(`${API_URL}/master/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            document.getElementById(`modal-add-master-${type}`).remove();
            await loadMasterData();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menambahkan data');
        }
    } catch(err) { console.error(err); }
};

window.editMaster = (type, id, currentName) => {
    let modalId = `modal-edit-master-${type}-${id}`;
    let existingModal = document.getElementById(modalId);
    if(existingModal) existingModal.remove();

    let inputHtml = '';
    if (type === 'truk') {
        const t = masterData.truk.find(x => x.id === id);
        const currentSupir = t ? (t.supir || '') : '';
        inputHtml = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <label style="font-size: 0.85rem; display:block; font-weight:bold;">Plat Nomor Truk:</label>
                <input type="text" id="edit-val-${type}-${id}" class="form-control" value="${currentName}">
                <label style="font-size: 0.85rem; display:block; margin-top:10px; font-weight:bold;">Nama Supir:</label>
                <input type="text" id="edit-supir-${type}-${id}" class="form-control" value="${currentSupir}">
            </div>
        `;
    } else {
        let labelName = type === 'divisi' ? 'Nama Divisi' : (type === 'supir' ? 'Nama Supir' : 'Jenis Pupuk');
        inputHtml = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <label style="font-size: 0.85rem; display:block; font-weight:bold;">${labelName}:</label>
                <input type="text" id="edit-val-${type}-${id}" class="form-control" value="${currentName}">
            </div>
        `;
    }

    let titleStr = type === 'truk' ? 'Truk' : (type === 'divisi' ? 'Divisi' : (type === 'supir' ? 'Supir' : 'Jenis Pupuk'));

    const html = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit ${titleStr}</h3>
                    <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    ${inputHtml}
                    <div style="margin-top: 20px; text-align:right;">
                        <button type="button" class="btn btn-logout" style="background:#64748b; color:white; border:none; padding:8px 15px; margin-right:10px;" onclick="document.getElementById('${modalId}').remove()">Batal</button>
                        <button type="button" class="btn btn-primary" style="padding:8px 15px;" onclick="saveEditMaster('${type}', ${id})"><i class="fa-solid fa-save"></i> Simpan Perubahan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.saveEditMaster = async (type, id) => {
    let payload = {};
    if (type === 'truk') {
        const newPlate = document.getElementById(`edit-val-${type}-${id}`).value;
        const newSupir = document.getElementById(`edit-supir-${type}-${id}`).value;
        if (!newPlate || !newPlate.trim()) { alert('Plat Nomor tidak boleh kosong!'); return; }
        if (!newSupir || !newSupir.trim()) { alert('Nama Supir tidak boleh kosong!'); return; }
        payload.plate_number = newPlate.trim();
        payload.supir = newSupir.trim();
    } else {
        const newName = document.getElementById(`edit-val-${type}-${id}`).value;
        if (!newName || !newName.trim()) { alert('Nilai tidak boleh kosong!'); return; }
        payload.name = newName.trim();
    }

    try {
        const res = await fetch(`${API_URL}/master/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            document.getElementById(`modal-edit-master-${type}-${id}`).remove();
            await loadMasterData();
            if (type === 'truk') selectTruk(payload.plate_number);
            else if (type === 'supir') selectSupir(payload.name);
            else if (type === 'pupuk') selectPupuk(payload.name);
            else if (type === 'divisi') selectDivisi(payload.name);
        } else {
            alert('Gagal mengedit data');
        }
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
    } else if (targetId === 'hd-block') {
        const akpEl = document.getElementById('hd-akp');
        if(akpEl) akpEl.value = '';
        document.getElementById('hd-est-janjang').innerText = '0';
        document.getElementById('hd-est-kg').innerText = '0 Kg';
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
    const trukOpts = `<option value="" disabled selected>-- Pilih Truk --</option>` + masterData.truk.map(t => `<option value="${t.plate_number}" data-supir="${t.supir || ''}">${t.plate_number}</option>`).join('');
    elTruk.forEach(el => {
        el.innerHTML = trukOpts;
        if(el.id === 'v-plate') el.setAttribute('onchange', 'onVehicleTrukChange(this)');
    });

    const elPupuk = document.querySelectorAll('.select-pupuk');
    const pupukOpts = `<option value="" disabled selected>-- Pilih Pupuk --</option>` + masterData.pupuk.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    elPupuk.forEach(el => el.innerHTML = pupukOpts);

    const elSupir = document.querySelectorAll('.select-supir');
    const supirOpts = `<option value="" disabled selected>-- Pilih Supir --</option>` + masterData.supir.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    elSupir.forEach(el => el.innerHTML = supirOpts);

    const elMonth = document.querySelectorAll('.select-month');
    const currentYear = new Date().getFullYear();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthOpts = `<option value="" disabled selected>-- Pilih Bulan --</option>` + 
        months.map((m, i) => {
            const val = `${currentYear}-${(i+1).toString().padStart(2, '0')}`;
            return `<option value="${val}">${m} ${currentYear}</option>`;
        }).join('');
    elMonth.forEach(el => el.innerHTML = monthOpts);

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

window.onVehicleTrukChange = (selectEl) => {
    if (selectEl.selectedIndex === -1) return;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const supir = selectedOption.getAttribute('data-supir');
    const driverInput = document.getElementById('v-driver');
    if (driverInput) {
        if (supir) {
            driverInput.value = supir;
            driverInput.readOnly = true;
            driverInput.style.backgroundColor = '#f1f5f9';
        } else {
            driverInput.value = '';
            driverInput.readOnly = false;
            driverInput.style.backgroundColor = '';
        }
    }
};

window.promptHistoricalVehicle = () => {
    const html = `
        <div class="modal-overlay" id="modal-historical-vehicle">
            <div class="modal-content" style="width: 800px; max-width: 95%;">
                <div class="modal-header">
                    <h3>Historical Vehicle Motion</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-historical-vehicle').remove()">&times;</button>
                </div>
                <div style="display:flex; gap:15px; align-items:flex-end; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <label style="font-size:0.85rem; font-weight:bold; display:block; margin-bottom:5px;">Dari Tanggal</label>
                        <input type="date" id="hist-start-date" class="form-control">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size:0.85rem; font-weight:bold; display:block; margin-bottom:5px;">Hingga Tanggal</label>
                        <input type="date" id="hist-end-date" class="form-control">
                    </div>
                    <div>
                        <button type="button" class="btn btn-primary" style="padding: 8px 20px;" onclick="loadHistoricalVehicle()">Tampilkan</button>
                    </div>
                </div>
                
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Plate Truk</th>
                                <th>Asal Estate</th>
                                <th>Divisi</th>
                                <th>Ritase</th>
                                <th>Blok</th>
                                <th>Janjang</th>
                                <th>Berangkat</th>
                                <th>Tiba PKS</th>
                                <th>Durasi</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-historical-vehicle">
                            <tr><td colspan="9" style="text-align:center;">Pilih tanggal dan klik Tampilkan.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.loadHistoricalVehicle = () => {
    const start = document.getElementById('hist-start-date').value;
    const end = document.getElementById('hist-end-date').value;
    if (!start || !end) {
        alert("Pilih Dari Tanggal dan Hingga Tanggal");
        return;
    }
    
    const tbody = document.getElementById('tbody-historical-vehicle');
    tbody.innerHTML = '';
    
    let filtered = db.vehicles.filter(v => {
        if (!v.date) return false;
        return v.date >= start && v.date <= end;
    });
    
    if (currentUser.estate && currentUser.estate.endsWith('Mill')) {
        const allowedEstates = (masterData.supply_chain || []).map(sc => sc.estate);
        filtered = filtered.filter(v => allowedEstates.includes(v.estate));
    } else if (currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        filtered = filtered.filter(v => v.estate === currentUser.estate);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Tidak ada data pada rentang tanggal ini.</td></tr>';
        return;
    }
    
    [...filtered].reverse().forEach(v => {
        const tDepart = v.timedepart || v.timeDepart;
        const tArrive = v.timearrive || v.timeArrive;
        const duration = calculateDuration(tDepart, tArrive);
        
        tbody.innerHTML += `
            <tr>
                <td>${v.date}</td>
                <td><strong>${v.plate}</strong><br><small>${v.driver}</small></td>
                <td><strong>${getEstateCode(v.estate)}</strong></td>
                <td>${v.divisi || '-'}</td>
                <td>${v.ritase}</td>
                <td>${v.block}</td>
                <td>${v.janjang}</td>
                <td>${tDepart}</td>
                <td>${tArrive || '-'}</td>
                <td><strong>${duration}</strong></td>
            </tr>
        `;
    });
};

window.getEstateCode = (estateName) => {
    if (!estateName) return '-';
    const name = estateName.toUpperCase();
    if (name.includes('BUNGA TANJUNG')) return 'BTEE';
    if (name.includes('SUNGAI TERAMANG')) return 'STGE';
    if (name.includes('AIR BIKUK')) return 'ABEE';
    if (name.includes('BATU KUDA')) return 'BKDE';
    if (name.includes('AIR BULUH')) return 'ABEE';
    if (name.includes('MALING DEMANG')) return 'MDEE';
    if (name.includes('TANAH REKAH')) return 'TREE';
    if (name.includes('MUKO MUKO')) return 'MME';
    if (name.includes('SEI JERINJING')) return 'SJEE';
    if (name.includes('TALANG PETAI')) return 'TPEE';
    if (name.includes('SUNGAI KIANG')) return 'SKGE';
    if (name.includes('AIR MAJUNTO')) return 'AMEE';
    if (name.includes('SMALL HOLDER')) return 'PHK3';
    
    const words = name.replace(' ESTATE', '').split(' ');
    if (words.length === 1) return words[0].substring(0, 3) + 'E';
};

window.promptAddBlok = (divisiName) => {
    const html = `
        <div class="modal-overlay" id="modal-add-blok">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Blok di ${divisiName}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-add-blok').remove()">&times;</button>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 1: Tambah Satu per Satu</label>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <input type="text" id="m-single-blok" class="form-control" placeholder="Nama Blok Baru">
                        <input type="number" step="0.01" id="m-single-gross" class="form-control" placeholder="Gross Area (Ha)">
                        <input type="number" step="0.01" id="m-single-sph" class="form-control" placeholder="SPH">
                        <input type="number" step="0.01" id="m-single-total" class="form-control" placeholder="Total Stand">
                        <input type="number" step="0.1" id="m-single-bjr" class="form-control" placeholder="BJR (kg)">
                        <button type="button" class="btn btn-primary" onclick="addBlokSingle('${divisiName}')">+ Tambah Blok</button>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid rgba(0,0,0,0.1);">
                    <label style="font-size: 0.85rem; display:block; margin-bottom: 8px;">Opsi 2: Tambah Banyak Sekaligus (Paste dari Excel):</label>
                    <p style="font-size: 0.8rem; color:#64748b; margin-top:0; margin-bottom:10px;">Pastikan Anda meng-copy 5 kolom dari Excel secara berurutan: Blok, Gross Area(Ha), SPH, Total Stand, BJR.</p>
                    <textarea id="m-bulk-blok" class="form-control" rows="5" placeholder="Paste daftar di sini (Blok [TAB] Gross [TAB] SPH [TAB] Total [TAB] BJR)..."></textarea>
                    <button type="button" class="btn btn-primary" style="margin-top: 8px; font-size: 0.85rem; padding: 6px 15px;" onclick="addBlokBulkFromModal('${divisiName}')"><i class="fa-solid fa-paste"></i> Simpan Hasil Paste Excel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.addBlokSingle = async (divisiName) => {
    const nama = document.getElementById('m-single-blok').value;
    const gross_area = document.getElementById('m-single-gross').value;
    const sph = document.getElementById('m-single-sph').value;
    const total_stand = document.getElementById('m-single-total').value;
    const bjr = document.getElementById('m-single-bjr').value;
    if(!nama || !nama.trim() || !bjr) return;
    try {
        const res = await fetch(`${API_URL}/master/blok`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, name: nama, bjr: bjr, divisi: divisiName, gross_area, sph, total_stand })
        });
        if(res.ok) {
            document.getElementById('modal-add-blok').remove();
            await loadMasterData();
        }
    } catch(e) { console.error(e); }
};

window.addBlokBulkFromModal = async (divisiName) => {
    const pasteData = document.getElementById('m-bulk-blok').value;
    if(!pasteData.trim()) return;
    
    const rows = pasteData.trim().split('\n');
    let bloks = [];
    rows.forEach(r => {
        const cols = r.split('\t');
        if (cols.length >= 1) {
            const bName = cols[0].trim();
            const bGross = cols.length >= 2 ? parseFloat(cols[1].trim().replace(',', '.')) : 0;
            const bSph = cols.length >= 3 ? parseFloat(cols[2].trim().replace(',', '.')) : 0;
            const bTotal = cols.length >= 4 ? parseFloat(cols[3].trim().replace(',', '.')) : 0;
            const bBjr = cols.length >= 5 ? parseFloat(cols[4].trim().replace(',', '.')) : 0;
            
            if (bName) bloks.push({ 
                name: bName, 
                gross_area: isNaN(bGross) ? 0 : bGross,
                sph: isNaN(bSph) ? 0 : bSph,
                total_stand: isNaN(bTotal) ? 0 : bTotal,
                bjr: isNaN(bBjr) ? 0 : bBjr, 
                divisi: divisiName 
            });
        }
    });
    
    if (bloks.length === 0) return;
    
    try {
        const res = await fetch(`${API_URL}/master/blok/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estate: currentUser.estate, divisi: divisiName, bloks })
        });
        const data = await res.json();
        if(res.ok) {
            alert(`Berhasil menyimpan ${data.inserted || 0} blok baru dari hasil copy-paste.`);
            document.getElementById('modal-add-blok').remove();
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan data paste.');
        }
    } catch(e) { console.error(e); }
};

window.updateLocationList = () => {
    const type = document.getElementById('login-location-type').value;
    const estateSelect = document.getElementById('login-estate');
    if (!estateSelect) return;
    
    estateSelect.innerHTML = '';
    
    if (type === 'Estate') {
        estateSelect.innerHTML = `
            <option value="" disabled selected>LIST ESTATE</option>
            <option>Bunga Tanjung Estate</option>
            <option>Sungai Teramang Estate</option>
            <option>Air Bikuk Estate</option>
            <option>Batu Kuda Estate</option>
            <option>Air Buluh Estate</option>
            <option>Malin Deman Estate</option>
            <option>Tanah Rekah Estate</option>
            <option>Muko Muko Estate</option>
            <option>Sei Jerinjing Estate</option>
            <option>Talang Petai Estate</option>
            <option>Sungai Kiang Estate</option>
            <option>Air Majunto Estate</option>
        `;
    } else if (type === 'Mill') {
        estateSelect.innerHTML = `
            <option value="" disabled selected>LIST MILL</option>
            <option>Bunga Tanjung Mill</option>
            <option>Muko Muko Mill</option>
        `;
    }
};

window.promptAddUpkeepProgress = (id, block, type, target, realized) => {
    const modalId = 'modal-upkeep-progress-' + id;
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const today = window.getLocalDate();
    const sisa = Math.max(0, target - realized).toFixed(2);

    const modalHTML = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Update Progress Upkeep</h3>
                    <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
                </div>
                <div style="margin-bottom: 15px; font-size: 0.9rem; background: #f8fafc; padding: 10px; border-radius: 8px;">
                    <strong>Blok:</strong> ${block}<br>
                    <strong>Pekerjaan:</strong> ${type}<br>
                    <strong>Sisa Target:</strong> ${sisa} Ha
                </div>
                <form id="form-upkeep-add-${id}" onsubmit="submitUpkeepProgress(event, ${id})">
                    <div class="form-group">
                        <label>Realisasi Tambahan (Ha)</label>
                        <input type="number" step="0.1" id="upkeep-add-${id}" class="form-control" required placeholder="Contoh: 2.5" max="${sisa}">
                    </div>
                    <div class="form-group">
                        <label>Jumlah Pekerja (Orang)</label>
                        <input type="number" id="upkeep-workers-${id}" class="form-control" required placeholder="Contoh: 5">
                    </div>
                    <div class="form-group">
                        <label>Tanggal Pengerjaan</label>
                        <input type="date" id="upkeep-date-${id}" class="form-control" required value="${today}">
                    </div>
                    <div class="form-group">
                        <label>Penanggung Jawab / Keterangan</label>
                        <input type="text" id="upkeep-worker-${id}" class="form-control" placeholder="Opsional">
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                        <button type="button" class="btn btn-logout" style="background:#64748b; color:white; border:none; padding:8px 15px; margin-right:10px;" onclick="document.getElementById('${modalId}').remove()">Batal</button>
                        <button type="submit" class="btn btn-primary" style="padding:8px 15px;"><i class="fa-solid fa-save"></i> Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.submitUpkeepProgress = async (e, id) => {
    e.preventDefault();
    const additionalHa = parseFloat(document.getElementById(`upkeep-add-${id}`).value);
    const dateAdded = document.getElementById(`upkeep-date-${id}`).value;
    const worker = document.getElementById(`upkeep-worker-${id}`).value;
    const workers = parseInt(document.getElementById(`upkeep-workers-${id}`).value) || 0;
    
    try {
        const res = await fetch(`${API_URL}/upkeep/${id}/add`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ additionalHa, dateAdded, worker, workers })
        });
        if (res.ok) {
            document.getElementById(`modal-upkeep-progress-${id}`).remove();
            await loadData();
        } else {
            alert('Gagal update progress.');
        }
    } catch(err) {
        console.error(err);
        alert('Terjadi kesalahan jaringan.');
    }
};

window.viewUpkeepHistory = async (id, block, type) => {
    try {
        const res = await fetch(`${API_URL}/upkeep/${id}/history`);
        if (res.ok) {
            const history = await res.json();
            const modalId = 'modal-upkeep-history-' + id;
            const existing = document.getElementById(modalId);
            if (existing) existing.remove();
            
            let totalHa = 0;
            let totalHK = 0;

            const rows = history.map(h => {
                const addedHa = parseFloat(h.addedha) || 0;
                const workers = parseInt(h.workers) || 0;
                totalHa += addedHa;
                totalHK += workers;
                
                let prestasi = 0;
                if (workers > 0) prestasi = addedHa / workers;
                
                return `
                    <tr>
                        <td>${h.dateadded}</td>
                        <td><strong>+${addedHa} Ha</strong></td>
                        <td>${workers} Org</td>
                        <td><strong>${prestasi.toFixed(2)}</strong></td>
                        <td><small>${h.worker || '-'}</small></td>
                    </tr>
                `;
            }).join('');

            let totalPrestasi = 0;
            if (totalHK > 0) totalPrestasi = totalHa / totalHK;
            
            let footer = '';
            if (history.length > 0) {
                footer = `
                    <tfoot>
                        <tr style="background: #f1f5f9; font-weight: bold;">
                            <td>TOTAL</td>
                            <td>${totalHa.toFixed(2)} Ha</td>
                            <td>${totalHK} Org</td>
                            <td>${totalPrestasi.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                `;
            }

            const modalHTML = `
                <div class="modal-overlay" id="${modalId}">
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h3>Riwayat Progress Upkeep</h3>
                            <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">&times;</button>
                        </div>
                        <div style="margin-bottom: 15px; font-size: 0.9rem;">
                            <strong>Blok:</strong> ${block} | <strong>Pekerjaan:</strong> ${type}
                        </div>
                        <div style="max-height: 300px; overflow-y: auto;">
                            <table class="history-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Penambahan (Ha)</th>
                                        <th>HK / Orang</th>
                                        <th>Prestasi (Ha/HK)</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows || '<tr><td colspan="5" style="text-align:center;">Belum ada riwayat.</td></tr>'}
                                </tbody>
                                ${footer}
                            </table>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    } catch(e) {
        console.error(e);
    }
};

let historicalChartInstance = null;

window.openHistoricalModal = async () => {
    document.getElementById('historical-modal').style.display = 'flex';
    document.getElementById('historical-date').value = window.getLocalDate();
    
    // Populate estate dropdown
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    try {
        const masterRes = await fetch(`${API_URL}/master/${mill}`);
        const masterData = await masterRes.json();
        const sel = document.getElementById('historical-estate');
        sel.innerHTML = '<option value="ALL">All Estate (Gabungan)</option>';
        masterData.supply_chain.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.estate;
            opt.innerText = s.estate;
            sel.appendChild(opt);
        });
    } catch(e) { console.error(e); }
    
    loadHistoricalChartData();
};

window.loadHistoricalChartData = async () => {
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    const date = document.getElementById('historical-date').value;
    if (!date) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/tonase/${mill}/${date}`);
        const tonaseData = await res.json();
        
        const labels = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const targets = new Array(labels.length).fill(0);
        const realized = new Array(labels.length).fill(0);
        
        const selectedEstate = document.getElementById('historical-estate').value;
        
        tonaseData.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            
            const idx = labels.indexOf(item.time_hour);
            if (idx !== -1) {
                targets[idx] += parseFloat(item.target_kg) || 0;
                realized[idx] += parseFloat(item.realized_kg) || 0;
            }
        });
        
        const ctx = document.getElementById('historicalChartCanvas');
        if (!ctx) return;
        
        if (historicalChartInstance) {
            historicalChartInstance.destroy();
        }
        
        historicalChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Realisasi Tonase Masuk (Ton)',
                    data: realized.map(v => v / 1000),
                    backgroundColor: '#f7a01d',
                    borderRadius: 4
                }, {
                    label: 'Target Tonase (Ton)',
                    data: targets.map(v => v / 1000),
                    backgroundColor: 'rgba(203, 213, 225, 0.5)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Komparasi Target vs Realisasi Tonase Per Jam (${date}) - ${selectedEstate === 'ALL' ? 'All Estate' : selectedEstate}` }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
        
    } catch(e) {
        console.error(e);
    }
};

window.closeUpkeep = async (id, block) => {
    if (confirm(`Tutup target pekerjaan di Blok ${block} dan tandai Selesai?`)) {
        try {
            await fetch(`${API_URL}/upkeep/${id}/close`, { method: 'PUT' });
            await loadData();
        } catch(e) { console.error(e); }
    }
};

// --- TONASE MONITORING LOGIC ---
window.tonaseMode = 'plan'; 

window.openTonaseModal = (mode) => {
    window.tonaseMode = mode;
    document.getElementById('tonase-modal').style.display = 'flex';
    
    if (mode === 'plan') {
        document.getElementById('tonase-form-title').innerText = 'Input Target (Plan) Tonase';
        if (document.getElementById('container-plan-mode')) document.getElementById('container-plan-mode').style.display = 'block';
        const planMode = document.getElementById('t-plan-mode') ? document.getElementById('t-plan-mode').value : 'single';
        document.getElementById('container-t-hour').style.display = planMode === 'grid' ? 'none' : 'block';
        document.getElementById('t-btn-label').innerText = 'Simpan Plan (Target)';
        if (document.getElementById('t-btn-reset')) document.getElementById('t-btn-reset').style.display = 'inline-block';
    } else {
        document.getElementById('tonase-form-title').innerText = 'Input Realisasi Tonase';
        if (document.getElementById('container-plan-mode')) document.getElementById('container-plan-mode').style.display = 'none';
        document.getElementById('container-t-hour').style.display = 'block';
        document.getElementById('t-btn-label').innerText = 'Simpan Realisasi';
        if (document.getElementById('t-btn-reset')) document.getElementById('t-btn-reset').style.display = 'none';
    }
    
    if (!document.getElementById('t-date').value) {
        document.getElementById('t-date').value = window.getLocalDate();
    }
    
    loadTonaseInputData();
};
window.calculateTonaseTotals = () => {
    const container = document.getElementById('tonase-estate-list');
    if (!container) return;
    
    const inputs = Array.from(container.querySelectorAll('.tonase-input'));
    const totals = {};
    
    inputs.forEach(input => {
        const est = input.getAttribute('data-estate');
        const val = parseFloat(input.value) || 0;
        totals[est] = (totals[est] || 0) + val;
    });
    
    Object.keys(totals).forEach(est => {
        const cleanEstClass = est.replace(/[^a-zA-Z0-9]/g, '-');
        const totalEl = document.getElementById(`tonase-total-${cleanEstClass}`);
        if (totalEl) {
            totalEl.innerText = parseFloat(totals[est].toFixed(2));
        }
    });
};

window.resetTonaseInputs = () => {
    if (!confirm('Yakin ingin mereset semua input di tabel ini menjadi 0?')) return;
    const inputs = document.querySelectorAll('.tonase-input');
    inputs.forEach(input => {
        if (!input.disabled && !input.readOnly) {
            input.value = 0;
        }
    });
    calculateTonaseTotals();
};

window.handleTonasePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    
    const rows = text.trim().split('\n').map(row => row.split('\t'));
    const target = e.target;
    const tbody = target.closest('tbody');
    const tr = target.closest('tr');
    const td = target.closest('td');
    
    if (!tbody || !tr || !td) return;
    
    const trs = Array.from(tbody.querySelectorAll('tr'));
    const startRowIdx = trs.indexOf(tr);
    
    const tds = Array.from(tr.querySelectorAll('td')).filter(el => el.querySelector('input.tonase-input'));
    const startColIdx = tds.indexOf(td);
    
    rows.forEach((row, i) => {
        const rowIdx = startRowIdx + i;
        if (rowIdx >= 0 && rowIdx < trs.length) {
            const currentTr = trs[rowIdx];
            const currentTds = Array.from(currentTr.querySelectorAll('td')).filter(el => el.querySelector('input.tonase-input'));
            
            row.forEach((cellVal, j) => {
                const colIdx = startColIdx + j;
                if (colIdx >= 0 && colIdx < currentTds.length) {
                    const input = currentTds[colIdx].querySelector('input.tonase-input');
                    if (input && !input.disabled && !input.readOnly) {
                        let cleanVal = cellVal.trim();
                        if (cleanVal.includes(',') && !cleanVal.includes('.')) {
                            cleanVal = cleanVal.replace(',', '.');
                        } else {
                            cleanVal = cleanVal.replace(/,/g, '');
                        }
                        cleanVal = cleanVal.replace(/[^0-9.-]/g, '');
                        if (cleanVal) {
                            input.value = cleanVal;
                        }
                    }
                }
            });
        }
    });
    
    window.calculateTonaseTotals();
};

window.loadTonaseInputData = async () => {
    const date = document.getElementById('t-date').value;
    const hourSelect = document.getElementById('t-hour').value;
    const container = document.getElementById('tonase-estate-list');
    
    if (!date) return;
    
    if (window.tonaseMode === 'realization' && !hourSelect) {
        container.innerHTML = '<div style="text-align:center; padding: 20px; color:#64748b;">Pilih Jam terlebih dahulu untuk menginput realisasi.</div>';
        return;
    }
    
    container.innerHTML = '<div style="text-align:center; padding: 20px;">Memuat data...</div>';
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        const masterRes = await fetch(`${API_URL}/master/${mill}`);
        const masterData = await masterRes.json();
        const supplyChain = masterData.supply_chain.map(s => s.estate);
        
        if (supplyChain.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Belum ada supply chain yang diatur untuk Mill ini di Master Data.</div>';
            return;
        }
        
        const tonaseRes = await fetch(`${API_URL}/tonase/${mill}/${date}`);
        const tonaseData = await tonaseRes.json();
        window.tonaseDataCache = tonaseData;
        
        let planMode = 'single';
        if (document.getElementById('t-plan-mode')) {
            planMode = document.getElementById('t-plan-mode').value;
        }

        if (window.tonaseMode === 'plan') {
            document.getElementById('container-t-hour').style.display = planMode === 'grid' ? 'none' : 'block';
        }

        const hours = (window.tonaseMode === 'plan' && planMode === 'grid')
            ? ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00']
            : [hourSelect];
        
        let html = `
            <table class="data-table" style="min-width: 600px;">
                <thead>
                    <tr>
                        <th style="min-width: 80px; position: sticky; left: 0; top: 0; background: #ffffff; z-index: 11; border-bottom: 2px solid #ddd; padding: 10px;">HOUR</th>
        `;
        supplyChain.forEach(est => {
            let thText = est.toUpperCase();
            html += `<th style="position: sticky; top: 0; background: #ffffff; z-index: 10; min-width: 80px; border-bottom: 2px solid #ddd; padding: 10px;">${thText}</th>`;
        });
        html += `</tr></thead><tbody>`;
        
        hours.forEach(hour => {
            html += `<tr><td style="font-weight:bold; position: sticky; left: 0; background: #fff;">${hour}</td>`;
            supplyChain.forEach(est => {
                const existing = tonaseData.find(t => t.estate === est && t.time_hour === hour);
                let val = '';
                if (existing) {
                    let rawVal = window.tonaseMode === 'plan' ? existing.target_kg : existing.realized_kg;
                    val = parseFloat((parseFloat(rawVal) / 1000).toFixed(2));
                }
                html += `
                    <td style="padding: 2px;">
                        <input type="number" step="0.01" class="form-control tonase-input" data-estate="${est}" data-hour="${hour}" value="${val}" min="0" placeholder="" style="min-width: 70px; padding: 5px;">
                    </td>
                `;
            });
            html += `</tr>`;
        });
        html += `</tbody>`;
        
        html += `<tfoot style="background-color: #f1f5f9; position: sticky; bottom: 0; z-index: 10;">
            <tr>
                <td style="font-weight:bold; position: sticky; left: 0; background-color: #f1f5f9; padding: 8px;">TOTAL</td>
        `;
        supplyChain.forEach(est => {
            const cleanEstClass = est.replace(/[^a-zA-Z0-9]/g, '-');
            html += `<td style="font-weight:bold; padding: 8px; text-align:center; color: var(--primary-color);" id="tonase-total-${cleanEstClass}">0</td>`;
        });
        html += `</tr></tfoot>`;
        
        html += `</table>`;
        container.innerHTML = html;
        
        calculateTonaseTotals();
        
        const inputs = container.querySelectorAll('.tonase-input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateTonaseTotals);
            input.addEventListener('paste', handleTonasePaste);
        });
        
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Gagal memuat data.</div>';
    }
};

window.saveTonaseData = async () => {
    const date = document.getElementById('t-date').value;
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    
    if (!date) {
        alert("Pilih Tanggal terlebih dahulu.");
        return;
    }
    
    const inputs = document.querySelectorAll('.tonase-input');
    const entries = [];
    inputs.forEach(input => {
        let val = parseFloat(input.value);
        if (isNaN(val)) val = 0;
        else val = Math.round(val * 1000); // Convert Ton to Kg
        
        const est = input.getAttribute('data-estate');
        const hour = input.getAttribute('data-hour');
        if (window.tonaseMode === 'plan') {
            entries.push({ time_hour: hour, estate: est, target_kg: val });
        } else {
            entries.push({ time_hour: hour, estate: est, realized_kg: val });
        }
    });
    
    if (entries.length === 0) {
        alert("Belum ada data yang diisi.");
        return;
    }
    
    // Check if data already exists to prompt for revision
    let hasExisting = false;
    if (window.tonaseDataCache && window.tonaseDataCache.length > 0) {
        if (window.tonaseMode === 'plan') {
            hasExisting = window.tonaseDataCache.some(t => t.target_kg !== null && t.target_kg !== undefined);
        } else {
            const hourSelect = document.getElementById('t-hour').value;
            hasExisting = window.tonaseDataCache.some(t => t.time_hour === hourSelect && t.realized_kg !== null && t.realized_kg !== undefined);
        }
    }
    
    if (hasExisting) {
        if (!confirm('Data untuk tanggal / jam ini sudah pernah diinput sebelumnya. Apakah Anda yakin ingin merevisi / menimpa data yang lama dengan input terbaru?')) {
            return;
        }
    }
    
    const endpoint = window.tonaseMode === 'plan' ? 'plan' : 'realization';
    
    try {
        const res = await fetch(`${API_URL}/tonase/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, mill, entries })
        });
        const data = await res.json();
        if (data.success) {
            alert('Data berhasil disimpan!');
            document.getElementById('tonase-modal').style.display = 'none';
            loadTonaseChartData();
        } else {
            alert('Gagal menyimpan data.');
        }
    } catch(e) {
        console.error(e);
        alert('Terjadi kesalahan jaringan.');
    }
};

let tonaseChartInstance = null;

window.loadTonaseChartData = async () => {
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill'; // default fallback for Admin
    }
    const date = window.getLocalDate();
    
    try {
        const res = await fetch(`${API_URL}/tonase/${mill}/${date}`);
        const tonaseData = await res.json();
        
        const labels = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const targets = new Array(labels.length).fill(0);
        const realized = new Array(labels.length).fill(0);
        
        tonaseData.forEach(item => {
            const idx = labels.indexOf(item.time_hour);
            if (idx !== -1) {
                targets[idx] += parseFloat(item.target_kg) || 0;
                realized[idx] += parseFloat(item.realized_kg) || 0;
            }
        });
        
        const ctx = document.getElementById('tonaseBigChart');
        if (!ctx) return;
        
        if (tonaseChartInstance) {
            tonaseChartInstance.destroy();
        }
        
        tonaseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Realisasi Tonase Masuk (Ton)',
                    data: realized.map(v => v / 1000),
                    backgroundColor: '#f7a01d',
                    borderRadius: 4
                }, {
                    label: 'Target Tonase (Ton)',
                    data: targets.map(v => v / 1000),
                    backgroundColor: 'rgba(203, 213, 225, 0.5)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Komparasi Target vs Realisasi Tonase Per Jam (${date})` }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
        
    } catch(e) {
        console.error(e);
    }
    
    if (typeof window.renderTonaseMonitorTable === 'function') {
        window.renderTonaseMonitorTable();
    }
};

window.renderTonaseMonitorTable = async (isHistorical = false) => {
    let container, date, hour;
    
    if (isHistorical === true) {
        container = document.getElementById('historical-tonase-monitor-container');
        date = document.getElementById('historical-monitor-date').value;
        if (!date) {
            alert('Pilih tanggal terlebih dahulu');
            return;
        }
        hour = null; // No hour for historical recap
    } else {
        container = document.getElementById('tonase-monitor-table-container');
        const dateInput = document.getElementById('monitor-tonase-date');
        const hourInput = document.getElementById('monitor-tonase-hour');
        if (!dateInput || !hourInput) return;
        
        if (!dateInput.value) {
            dateInput.value = window.getLocalDate();
        }
        date = dateInput.value;
        hour = hourInput.value;
    }
    
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding: 20px;">Memuat data monitoring...</div>';
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        
        const [masterRes, tonaseRes] = await Promise.all([
            fetch(`${API_URL}/master/${mill}`),
            fetch(`${API_URL}/tonase/${mill}/${date}`)
        ]);
        
        const masterData = await masterRes.json();
        const tonaseData = await tonaseRes.json();
        
        const supplyChain = masterData.supply_chain.map(s => s.estate);
        
        if (supplyChain.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Belum ada supply chain.</div>';
            return;
        }
        
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const hourIdx = hour ? hours.indexOf(hour) : -1;
        
        let html = `
            <table class="data-table" style="min-width: 800px; text-align: center;">
                <thead style="background-color: #333; color: white;">
                    <tr>
                        <th rowspan="2" style="position: sticky; left: 0; background-color: #000; color: #fff; z-index: 10;">ESTATE</th>
                        <th colspan="2" style="background-color: #000; color: #fff;">FFB RECEIVED (Ton)</th>
                        <th rowspan="2" style="background-color: #ffe600; color: #000;">ACTUAL AKUMULASI (Ton)</th>
                        <th rowspan="2" style="background-color: #87ceeb; color: #000;">PLAN / JAM (Ton)</th>
                        <th rowspan="2" style="background-color: #90ee90; color: #000;">% ACT VS PLAN PER JAM</th>
                        <th rowspan="2" style="background-color: #87ceeb; color: #000;">TODAY PLAN (Ton)</th>
                        <th rowspan="2" style="background-color: #ffe600; color: #000;">% REALISASI VS TODAY PLAN</th>
                    </tr>
                    <tr>
                        <th style="background-color: #000; color: #fff;">ACTUAL PER JAM</th>
                        <th style="background-color: #000; color: #fff;">ACTUAL TRIP</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalActJam = 0, totalActAkumulasi = 0, totalPlanJam = 0, totalTodayPlan = 0;
        
        supplyChain.forEach(est => {
            const dataEst = tonaseData.filter(t => t.estate === est);
            
            let actJam = 0, planJam = 0, actAkumulasi = 0, todayPlan = 0;
            
            if (isHistorical) {
                // Actual akumulasi for the whole day
                dataEst.forEach(t => actAkumulasi += ((parseFloat(t.realized_kg) || 0) / 1000));
                
                // Today plan for the whole day
                dataEst.forEach(t => todayPlan += ((parseFloat(t.target_kg) || 0) / 1000));
            } else {
                // Actual per jam
                const actJamRow = dataEst.find(t => t.time_hour === hour);
                actJam = actJamRow ? ((parseFloat(actJamRow.realized_kg) || 0) / 1000) : 0;
                
                // Actual akumulasi (from 06:00 up to selected hour)
                for (let i = 0; i <= hourIdx; i++) {
                    const r = dataEst.find(t => t.time_hour === hours[i]);
                    if (r) actAkumulasi += ((parseFloat(r.realized_kg) || 0) / 1000);
                }
                
                // Plan per jam
                const planJamRow = dataEst.find(t => t.time_hour === hour);
                planJam = planJamRow ? ((parseFloat(planJamRow.target_kg) || 0) / 1000) : 0;
                
                // Today plan (all hours)
                dataEst.forEach(t => todayPlan += ((parseFloat(t.target_kg) || 0) / 1000));
            }
            
            const pctActVsPlanJam = (!isHistorical && planJam > 0) ? (actJam / planJam * 100) : ((!isHistorical && actJam > 0) ? Infinity : 0);
            const pctActVsTodayPlan = todayPlan > 0 ? (actAkumulasi / todayPlan * 100) : (actAkumulasi > 0 ? Infinity : 0);
            
            // Add to totals
            totalActJam += actJam;
            totalActAkumulasi += actAkumulasi;
            totalPlanJam += planJam;
            totalTodayPlan += todayPlan;
            
            if (isHistorical) {
                html += `
                    <tr>
                        <td style="position: sticky; left: 0; background-color: #f1f5f9; font-weight: bold;">${est}</td>
                        <td>-</td>
                        <td>-</td>
                        <td style="background-color: #fffacd;">${actAkumulasi > 0 ? actAkumulasi.toLocaleString('id-ID') : '-'}</td>
                        <td style="background-color: #e0f7fa;">-</td>
                        <td style="background-color: #f1f5f9; font-weight: bold;">-</td>
                        <td style="background-color: #e0f7fa;">${todayPlan > 0 ? todayPlan.toLocaleString('id-ID') : '-'}</td>
                        <td style="background-color: #fffacd;">${pctActVsTodayPlan === Infinity ? '∞' : pctActVsTodayPlan.toFixed(2) + '%'}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td style="position: sticky; left: 0; background-color: #f1f5f9; font-weight: bold;">${est}</td>
                        <td>${actJam > 0 ? actJam.toLocaleString('id-ID') : '-'}</td>
                        <td>-</td>
                        <td style="background-color: #fffacd;">${actAkumulasi > 0 ? actAkumulasi.toLocaleString('id-ID') : '-'}</td>
                        <td style="background-color: #e0f7fa;">${planJam > 0 ? planJam.toLocaleString('id-ID') : '-'}</td>
                        <td style="background-color: ${pctActVsPlanJam >= 100 ? '#90ee90' : (pctActVsPlanJam === 0 ? '#90ee90' : '#ffcccb')}; color: ${pctActVsPlanJam >= 100 ? '#000' : (pctActVsPlanJam === 0 ? '#000' : 'red')}; font-weight: bold;">
                            ${pctActVsPlanJam === Infinity ? '∞' : pctActVsPlanJam.toFixed(2) + '%'}
                        </td>
                        <td style="background-color: #e0f7fa;">${todayPlan > 0 ? todayPlan.toLocaleString('id-ID') : '-'}</td>
                        <td style="background-color: #fffacd;">${pctActVsTodayPlan === Infinity ? '∞' : pctActVsTodayPlan.toFixed(2) + '%'}</td>
                    </tr>
                `;
            }
        });
        
        // Total row
        const totalPctActVsPlanJam = (!isHistorical && totalPlanJam > 0) ? (totalActJam / totalPlanJam * 100) : ((!isHistorical && totalActJam > 0) ? Infinity : 0);
        const totalPctActVsTodayPlan = totalTodayPlan > 0 ? (totalActAkumulasi / totalTodayPlan * 100) : (totalActAkumulasi > 0 ? Infinity : 0);
        
        if (isHistorical) {
            html += `
                    <tr style="font-weight: bold; background-color: #f8cbad;">
                        <td style="position: sticky; left: 0; background-color: #f8cbad;">TOTAL FFB</td>
                        <td>-</td>
                        <td>-</td>
                        <td style="background-color: #ffe600;">${totalActAkumulasi.toLocaleString('id-ID')}</td>
                        <td style="background-color: #87ceeb;">-</td>
                        <td style="background-color: #f8cbad;">-</td>
                        <td style="background-color: #87ceeb;">${totalTodayPlan.toLocaleString('id-ID')}</td>
                        <td style="background-color: #ffe600;">${totalPctActVsTodayPlan === Infinity ? '∞' : totalPctActVsTodayPlan.toFixed(2) + '%'}</td>
                    </tr>
                </tbody></table>
            `;
        } else {
            html += `
                    <tr style="font-weight: bold; background-color: #f8cbad;">
                        <td style="position: sticky; left: 0; background-color: #f8cbad;">TOTAL FFB</td>
                        <td>${totalActJam.toLocaleString('id-ID')}</td>
                        <td>-</td>
                        <td style="background-color: #ffe600;">${totalActAkumulasi.toLocaleString('id-ID')}</td>
                        <td style="background-color: #87ceeb;">${totalPlanJam.toLocaleString('id-ID')}</td>
                        <td style="background-color: ${totalPctActVsPlanJam >= 100 ? '#90ee90' : (totalPctActVsPlanJam === 0 ? '#90ee90' : '#ff0000')}; color: ${totalPctActVsPlanJam >= 100 ? '#000' : (totalPctActVsPlanJam === 0 ? '#000' : '#fff')};">
                            ${totalPctActVsPlanJam === Infinity ? '∞' : totalPctActVsPlanJam.toFixed(2) + '%'}
                        </td>
                        <td style="background-color: #87ceeb;">${totalTodayPlan.toLocaleString('id-ID')}</td>
                        <td style="background-color: #ffe600;">${totalPctActVsTodayPlan === Infinity ? '∞' : totalPctActVsTodayPlan.toFixed(2) + '%'}</td>
                    </tr>
                </tbody></table>
            `;
        }
        
        container.innerHTML = html;
        
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Gagal memuat tabel monitoring.</div>';
    }
    
    if (typeof window.loadPrimeTimeChart === 'function') {
        window.loadPrimeTimeChart();
    }
};

let primeTimeChartInstance = null;

window.loadPrimeTimeChart = async () => {
    const dateInput = document.getElementById('monitor-tonase-date');
    if (!dateInput || !dateInput.value) return;
    
    const dateStr = dateInput.value;
    const month = dateStr.substring(0, 7); // YYYY-MM
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        
        const primeSel = document.getElementById('prime-estate');
        if (primeSel && primeSel.options.length <= 1) {
            try {
                const masterRes = await fetch(`${API_URL}/master/${mill}`);
                const masterData = await masterRes.json();
                masterData.supply_chain.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.estate;
                    opt.innerText = s.estate;
                    primeSel.appendChild(opt);
                });
            } catch(e) { console.error(e); }
        }
        
        const selectedEstate = primeSel ? primeSel.value : 'ALL';
        
        const res = await fetch(`${API_URL}/tonase/${mill}/month/${month}`);
        const data = await res.json();
        
        // Group data by date
        const dailyData = {};
        
        // Determine number of days in the month
        const year = parseInt(month.split('-')[0]);
        const m = parseInt(month.split('-')[1]);
        const daysInMonth = new Date(year, m, 0).getDate();
        
        // Initialize all days
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${month}-${i.toString().padStart(2, '0')}`;
            dailyData[dStr] = { prime: 0, middle: 0, last: 0, total: 0 };
        }
        
        // Categorize each record
        // Prime: 06:00 to 12:00
        // Middle: >12:00 to 18:00
        // Last: >18:00 to 24:00 (or 00:00)
        
        const primeHours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
        const middleHours = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const lastHours = ['19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        
        data.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            
            const d = item.date.split('T')[0];
            if (!dailyData[d]) dailyData[d] = { prime: 0, middle: 0, last: 0, total: 0 };
            
            const kg = parseFloat(item.realized_kg) || 0;
            if (kg > 0) {
                if (primeHours.includes(item.time_hour)) {
                    dailyData[d].prime += kg;
                } else if (middleHours.includes(item.time_hour)) {
                    dailyData[d].middle += kg;
                } else if (lastHours.includes(item.time_hour)) {
                    dailyData[d].last += kg;
                }
                dailyData[d].total += kg;
            }
        });
        
        const labels = [];
        const primePct = [];
        const middlePct = [];
        const lastPct = [];
        
        const primeRaw = [];
        const middleRaw = [];
        const lastRaw = [];
        
        // Prepare chart arrays
        for (let i = 1; i <= daysInMonth; i++) {
            labels.push(i.toString());
            const dStr = `${month}-${i.toString().padStart(2, '0')}`;
            const dayRecord = dailyData[dStr];
            
            if (dayRecord.total > 0) {
                primePct.push( (dayRecord.prime / dayRecord.total) * 100 );
                middlePct.push( (dayRecord.middle / dayRecord.total) * 100 );
                lastPct.push( (dayRecord.last / dayRecord.total) * 100 );
            } else {
                primePct.push(0);
                middlePct.push(0);
                lastPct.push(0);
            }
            
            primeRaw.push(dayRecord.prime);
            middleRaw.push(dayRecord.middle);
            lastRaw.push(dayRecord.last);
        }
        
        const ctx = document.getElementById('primeTimeChart');
        if (!ctx) return;
        
        if (primeTimeChartInstance) {
            primeTimeChartInstance.destroy();
        }
        
        primeTimeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Prime Time (06:00 - 12:00)',
                        data: primePct,
                        rawTonase: primeRaw,
                        backgroundColor: '#1d4ed8', // Blue
                    },
                    {
                        label: 'Middle Time (13:00 - 18:00)',
                        data: middlePct,
                        rawTonase: middleRaw,
                        backgroundColor: '#22c55e', // Green
                    },
                    {
                        label: 'Last Time (19:00 - 24:00)',
                        data: lastPct,
                        rawTonase: lastRaw,
                        backgroundColor: '#eab308', // Yellow
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const ds = context.dataset;
                                const rawKg = ds.rawTonase ? ds.rawTonase[context.dataIndex] : 0;
                                const rawTon = (rawKg / 1000).toFixed(2);
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '% (' + rawTon + ' Ton)';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: 'TANGGAL' }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'PERSENTASE (%)' },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
    } catch(e) {
        console.error('Error loading prime time chart:', e);
    }
};
