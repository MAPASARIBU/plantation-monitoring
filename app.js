// API Base URL
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] && typeof args[0] === 'string' && args[0].includes(API_URL)) {
        const clonedResponse = response.clone();
        try {
            const text = await clonedResponse.text();
            if (text.includes('Maling Demang') || text.includes('Malin Demang')) {
                const newText = text.replace(/Maling Demang|Malin Demang/gi, 'Malin Deman');
                return new Response(newText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            }
        } catch(e) {}
    }
    return response;
};

window.getLocalDate = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

window.parseTonaseResponse = async (response) => {
    try {
        const text = await response.text();
        if (!text || text.trim() === '') return [];
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("parseTonaseResponse error:", e);
        return [];
    }
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
                
                const allEstatesList = ['Bunga Tanjung Estate', 'Sungai Teramang Estate', 'Air Bikuk Estate', 'Air Buluh Estate', 'Malin Deman Estate', 'Batu Kuda Estate', 'Sungai Jerinjing Estate', 'Muko Muko Estate', 'Talang Petai Estate', 'Sungai Kiang Estate', 'Tanah Rekah Estate', 'Air Majunto Estate', 'Small Holder', 'Bunga Tanjung Mill', 'Muko Muko Mill'];
                
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
        if (typeof loadMasterData === 'function') loadMasterData();
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
    } else if (role === 'Senior Field Manager' || role === 'Manager') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Estate Manager' || role === 'Asisten Kepala' || role === 'Division Manager' || role === 'Assistant') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting']);
    } else if (role === 'Manager Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master']);
    } else if (role === 'Askep' || role === 'Office Assistant (OAA)') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Office Assistant Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master']);
    } else if (role === 'Supervisor Mill') {
        showViews(['dashboard', 'vehicle', 'tonase']);
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
            
            <!-- Dashboard Historical Modal -->
            <div class="modal-overlay" id="dashboard-historical-modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="width: 800px; max-width: 95%; overflow-y: auto; display: flex; flex-direction: column;">
                    <div class="modal-header" id="dashboard-historical-modal-header" style="cursor: move; background-color: #f1f5f9; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-arrows-up-down-left-right"></i> Historical Tonase TBS / Jam</h2>
                        <button type="button" class="modal-close" onclick="document.getElementById('dashboard-historical-modal').style.display = 'none'">&times;</button>
                    </div>
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <div style="display: flex; gap: 10px; align-items: center; justify-content: center; margin-bottom: 20px;">
                            <label style="font-weight: bold;">Pilih Tanggal:</label>
                            <input type="date" id="dashboard-historical-date" class="form-control" style="width: auto;">
                            <button class="btn" style="background-color: #e2e8f0; color: #333;" onclick="document.getElementById('dashboard-historical-modal').style.display='none'">No</button>
                            <button class="btn btn-primary" onclick="loadDashboardHistoricalChart()">OK</button>
                            <button id="btn-print-historical" class="btn" style="background-color: #4a5568; color: white; display: none;" onclick="printHistoricalChart()"><i class="fa-solid fa-print"></i> Print</button>
                        </div>
                        <div id="dashboard-historical-chart-container" style="flex: 1; width: 100%; display: none; min-height: 400px;">
                            <canvas id="dashboardHistoricalChartCanvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="glass-card">
                    <div class="view-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0;">Grafik Tonase TBS / Jam</h2>
                        <button class="btn btn-primary btn-sm" onclick="document.getElementById('dashboard-historical-modal').style.display='flex';"><i class="fa-solid fa-clock-rotate-left"></i> Historical</button>
                    </div>
                    <div style="height: 8cm; width: 100%; margin-top: 15px;">
                        <canvas id="tonaseChart"></canvas>
                    </div>
                </div>
                <div class="glass-card">
                    <div class="view-header" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                        <h2 style="margin: 0;">Progres Penerimaan TBS Hari Ini</h2>
                        <span id="dashboard-progress-time" style="font-size: 0.9em; color: var(--text-secondary); font-weight: bold;"></span>
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
                        <button type="button" class="btn btn-primary" id="btn-input-vehicle" onclick="document.getElementById('modal-vehicle-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Vehicle Motion Input</button>
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
                            <label>Tanggal Rencana</label>
                            <input type="date" id="u-date" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Pilih Divisi (Opsional)</label>
                            <select class="form-control select-divisi" onchange="filterBlok(this.value, 'u-block')"></select>
                        </div>
                        <div class="form-group">
                            <label>Blok</label>
                            <select id="u-block" class="form-control select-blok" required onchange="updateUpkeepMaxLabel()"></select>
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
                            <label>Target (Ha) <span id="u-target-max-label" style="font-size: 0.8rem; font-weight: normal; color: #f59e0b; display: block; margin-top: 2px;"></span></label>
                            <input type="number" step="0.1" id="u-target" class="form-control" oninput="calcPrestasiUpkeepPlan()" required readonly>
                        </div>
                        <div class="form-group">
                            <label>Target HK (Orang)</label>
                            <input type="number" id="u-workers" class="form-control" oninput="calcPrestasiUpkeepPlan()" required>
                        </div>
                        <div class="form-group" style="background:#e0f2fe; padding:8px; border-radius:4px; margin-bottom: 10px;">
                            <label style="margin-bottom:0; font-size: 0.9rem;">Estimasi Prestasi: <strong id="u-prestasi-plan" style="color:#0369a1;">-</strong></label>
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
                    <div style="display:flex; gap: 10px;">
                        <button type="button" class="btn btn-primary" id="btn-input-upkeep" onclick="document.getElementById('u-date').value = window.getLocalDate(); document.getElementById('modal-upkeep-input').style.display='flex';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Upkeep</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="openUpkeepMonthlyRealization()"><i class="fa-solid fa-chart-pie"></i> Realisasi Bulanan</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Blok</th>
                                <th>Tanggal Mulai</th>
                                <th>Estate</th>
                                <th>Divisi</th>
                                <th>Pekerjaan</th>
                                <th>Target (Ha)</th>
                                <th>Target HK</th>
                                <th>Realisasi (Ha)</th>
                                <th>Realisasi Prestasi (Ha/HK)</th>
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
                            <label>Dosis (Kg / Pokok)</label>
                            <input type="number" step="0.1" id="p-dosis" class="form-control" placeholder="Contoh: 1.5" required>
                        </div>
                        <div class="form-group" style="display:flex; gap: 10px;">
                            <div style="flex:1;">
                                <label>Target Area (Ha)</label>
                                <input type="number" step="any" id="p-target-ha" class="form-control" readonly style="background-color: #f1f5f9; cursor: not-allowed;" placeholder="Otomatis" required>
                            </div>
                            <div style="flex:1;">
                                <label>Target Pekerja</label>
                                <input type="number" id="p-target-workers" class="form-control" placeholder="Jml Orang" required>
                            </div>
                        </div>
                        <div class="form-group" style="display:flex; gap: 15px; align-items: flex-start;">
                            <div style="flex:1;">
                                <label>Target Total (Kg)</label>
                                <input type="number" step="any" id="p-target" class="form-control" readonly style="background-color: #f1f5f9; cursor: not-allowed;" placeholder="Dihitung otomatis" required>
                            </div>
                            <div style="flex:1; padding-top: 25px;">
                                <div id="p-estimate" style="font-size: 0.85rem; color: #10b981; font-weight: 600; display: none; line-height: 1.5;"></div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                            <i class="fa-solid fa-plus"></i> Buat Rencana
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="modal-pemupukan-realization" class="modal-overlay" style="display:none;">
                <div class="modal-content animate-fade-in" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 id="pr-title">Update Realisasi Pemupukan</h3>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-pemupukan-realization').style.display='none';">&times;</button>
                    </div>
                    <form id="form-pemupukan-realization" style="margin-top: 15px;">
                        <input type="hidden" id="pr-id">
                        
                        <div style="display:flex; gap:15px; margin-bottom:15px;">
                            <div style="flex:1; background: #e0f2fe; padding:15px; border-radius:8px; border-left: 4px solid #3b82f6;">
                                <h4 style="margin:0 0 10px 0; color:#1e3a8a; font-size:0.95rem;">Plan / Target:</h4>
                                <div style="font-size:0.85rem; color:#1e40af; line-height:1.5;">
                                    <div style="display:flex; justify-content:space-between;"><span>Pupuk:</span> <strong id="pr-plan-kg">0 Kg</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>Area:</span> <strong id="pr-plan-ha">0 Ha</strong></div>
                                    <div style="display:flex; justify-content:space-between;"><span>Pekerja:</span> <strong id="pr-plan-workers">0 Orang</strong></div>
                                </div>
                            </div>
                        </div>

                        <label style="font-weight:600; margin-bottom:10px; display:block; font-size:0.95rem;">Masukkan Input Realisasi (Sekali Input):</label>
                        <div class="form-group">
                            <label>Realisasi Pupuk (Kg)</label>
                            <input type="number" step="any" id="pr-input-kg" class="form-control" placeholder="Total Kg" required oninput="window.calcPrestasiPemupukan()">
                        </div>
                        <div style="display:flex; gap:10px;">
                            <div class="form-group" style="flex:1;">
                                <label>Realisasi Area (Ha)</label>
                                <input type="number" step="any" id="pr-input-ha" class="form-control" placeholder="Total Ha" required oninput="window.calcPrestasiPemupukan()">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label>Realisasi Pekerja</label>
                                <input type="number" id="pr-input-workers" class="form-control" placeholder="Total Orang" required oninput="window.calcPrestasiPemupukan()">
                            </div>
                        </div>
                        
                        <div style="background:#f0fdf4; padding:10px; border-radius:4px; margin-top:10px; border-left:4px solid #16a34a; font-size: 0.9rem;">
                            <strong style="color:#166534;">Realisasi Prestasi Otomatis:</strong>
                            <div style="display:flex; justify-content:space-between; margin-top: 5px;">
                                <span style="color:#15803d;">Prestasi Area (Ha/Pekerja):</span> <strong id="pr-prestasi-ha" style="color:#166534;">-</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top: 5px;">
                                <span style="color:#15803d;">Prestasi Pupuk (Kg/Pekerja):</span> <strong id="pr-prestasi-kg" style="color:#166534;">-</strong>
                            </div>
                        </div>
                        
                        <div style="display:flex; gap:10px; margin-top:10px;">
                            <button type="button" class="btn btn-secondary" style="flex:1; justify-content:center; background:#64748b; color:white; border:none;" onclick="document.getElementById('modal-pemupukan-realization').style.display='none';">Batal</button>
                            <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;">Simpan Realisasi</button>
                        </div>
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
                                <th>Estate</th>
                                <th>DIV</th>
                                <th>Blok</th>
                                <th>Pupuk</th>
                                <th>Target<br><small>(Kg | Ha | Orang)</small></th>
                                <th>Realisasi<br><small>(Kg | Ha | Orang)</small></th>
                                <th>Progress<br><small>(Kg)</small></th>
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
                            <select id="hd-divisi" class="form-control select-divisi" required onchange="filterBlok(this.value, 'hd-block'); window.resetHarvestingBlocks();"></select>
                        </div>
                        
                        <div id="hd-blocks-container">
                            <div class="hd-block-row" style="background:#f8fafc; padding:10px; border-radius:5px; margin-bottom:10px; border: 1px solid #e2e8f0; position:relative;">
                                <div class="form-group">
                                    <label>Blok</label>
                                    <select id="hd-block" class="form-control select-blok hd-block-select" required onchange="calcHarvestingEstimate()"></select>
                                </div>
                                <div class="form-group">
                                    <label>Angka Kerapatan Panen (AKP %)</label>
                                    <input type="number" step="0.1" class="form-control hd-akp-input" required oninput="calcHarvestingEstimate()">
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label>Pusingan Panen</label>
                                    <input type="number" class="form-control hd-pusingan-input" required>
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="btn btn-secondary" style="width: 100%; justify-content: center; margin-bottom: 15px; background: #e2e8f0; color: #334155; border: 1px dashed #94a3b8;" onclick="window.addHarvestingBlockRow()">
                            <i class="fa-solid fa-plus"></i> Tambah Blok
                        </button>
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
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Alokasi Pemanen</label>
                                <input type="number" id="hd-pemanen" class="form-control" required oninput="calcHarvestingEstimate()">
                            </div>
                            <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                <label>Alokasi Truk</label>
                                <button type="button" class="btn btn-primary" style="background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1; width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; padding-left: 8px; padding-right: 8px;" onclick="openTruckSelectionModal()">
                                    <span id="btn-truck-text" style="font-size: 0.9em;">-- Pilih Truk --</span>
                                    <i class="fa-solid fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                        <div style="background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.85rem; border: 1px solid rgba(16, 185, 129, 0.2);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                                <span style="white-space:nowrap; font-weight: 500; color: #047857;">Plan Prestasi Kg/HK:</span>
                                <strong id="hd-prestasi-kg" style="text-align:right; color: #047857;">0 Kg</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="white-space:nowrap; font-weight: 500; color: #047857;">Plan Prestasi Ha/HK:</span>
                                <strong id="hd-prestasi-ha" style="text-align:right; color: #047857;">0 Ha</strong>
                            </div>
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
                            <button type="button" class="btn btn-primary btn-sm" onclick="printHarvestingDaily()" style="background-color: #64748b; border: none;"><i class="fa-solid fa-print"></i> Print Out</button>
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
                                <th>Estate</th>
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
                
                <div id="closed-jobs-header" style="display: none; justify-content: space-between; align-items: center; margin-top: 30px; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--text-primary);"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Closed</h3>
                    <button type="button" class="btn btn-primary btn-sm" onclick="openPrintClosedHarvestingModal()" style="background-color: #64748b; border: none; padding: 6px 12px; font-size: 0.8rem;"><i class="fa-solid fa-print"></i> Print Out</button>
                </div>
                <div class="table-container" id="closed-jobs-container" style="margin-bottom: 30px; display: none;">
                    <table class="data-table table-compact">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Estate</th>
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
                                <th>Plan<br>(Ha)</th>
                                <th>Act<br>(Ha)</th>
                                <th>Prestasi<br>Ha/WD</th>
                                <th>Prestasi<br>Kg/WD</th>
                                <th>Actual<br>BJR</th>
                                <th>Var Act Ha<br>vs Plan (%)</th>
                                <th>Turn Out<br>(%)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-harvesting-closed"></tbody>
                    </table>
                </div>

                <!-- Rekap Panen Table -->
                <div class="table-container" style="margin-bottom: 30px; overflow-x: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; padding: 12px 15px; border: 1px solid #cbd5e1; border-bottom: none;">
                        <div><i class="fa-solid fa-chart-simple" style="color: var(--primary-color);"></i> Rekap Panen per Divisi (Dari Pekerjaan Selesai)</div>
                        <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="openPrintRekapModal()"><i class="fa-solid fa-print"></i> Print Out</button>
                    </div>
                    <table class="data-table table-compact" style="border-collapse: collapse; min-width: 1200px;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">MTD</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">ESTATE</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">DIVISI</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">AVG<br>ROUND</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">AKP<br>(%)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN<br>TOTAL JJG</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN<br>PANEN (KG)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>TOTAL JJG</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>PANEN (KG)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>HVR (HK)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">PRESTASI<br>HA/ACT HVR</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">PRESTASI<br>KG/WD (KG/HK)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">VAR<br>HA(%)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">TURN OUT<br>(%)</th>
                                <th style="border: 1px solid #cbd5e1; text-align:center;">ABW<br>(BJR ACTUAL)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-harvesting-rekap"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    tonase: `
        <div class="animate-fade-in module-layout" id="tonase-layout" style="grid-template-columns: 1fr;">
            
            <!-- Export Wrapper -->
            <div id="export-dashboard-wrapper" style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
                <h2 style="margin: 0; font-size: 1.5rem; color: var(--primary-color);">Monitoring FFB Received, EFB Evacuation & Despatch CPOPK</h2>
            </div>
            
            <div style="display: flex; justify-content: flex-end; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 15px;">                <!-- Controls -->
                <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary btn-tonase-action" style="display:none;" onclick="openTonaseModal('plan')">
                            <i class="fa-solid fa-plus"></i> Input Plan
                        </button>
                        <button class="btn btn-tonase-action" style="display:none; background-color: #f7a01d; color: white;" onclick="openTonaseModal('realization')">
                            <i class="fa-solid fa-plus"></i> Input Realisasi
                        </button>
                        <button class="btn btn-tonase-action" style="display:none; background-color: #8b5cf6; color: white;" onclick="openDailyMonitorModal()">
                            <i class="fa-solid fa-calendar-day"></i> Input Harian (LF/JJK/Despatch)
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
                        <button class="btn" style="background-color: #ef4444; color: white;" onclick="exportDashboard()">
                            <i class="fa-solid fa-download"></i> Save
                        </button>
                    </div>
                </div>
            </div>

            <!-- Table Dashboard Grid -->
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch;">
                
                <!-- FFB -->
                <div class="glass-card table-wrapper" style="padding: 10px; flex: 1.5 1 500px;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: #e2e8f0; padding: 4px 10px; font-weight: bold; text-decoration: underline;">FFB RECEIVED</span>
                    </div>
                    <!-- Summary Box moved here -->
                    <div style="display: flex; flex-direction: column; width: 320px; font-family: monospace; font-size: 14px; border: 1px solid #000; margin-bottom: 15px;">
                        <div style="display: flex; background: black; color: white; padding: 4px 8px; font-weight: bold;">
                            <div style="width: 120px;">TANGGAL</div>
                            <div>: <span id="summary-tanggal">-</span></div>
                        </div>
                        <div style="display: flex; background: #e2e8f0; color: black; padding: 4px 8px; font-weight: bold;">
                            <div style="width: 120px;">JAM</div>
                            <div>: <span id="summary-jam">-</span></div>
                        </div>
                        <div style="display: flex; background: #f8cbad; color: black; padding: 4px 8px; font-weight: bold;">
                            <div style="width: 120px;">GRAND TOTAL</div>
                            <div>: <span id="summary-total">-</span></div>
                        </div>
                    </div>
                    <div id="tonase-monitor-table-container" style="overflow-x: auto;">
                        <div style="text-align:center; padding: 20px; color:#64748b;">Memuat tabel...</div>
                    </div>
                </div>
                
                <!-- LF -->
                <div class="glass-card table-wrapper" style="padding: 10px; flex: 1 1 350px; display: none;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: #e2e8f0; padding: 4px 10px; font-weight: bold; text-decoration: underline;">LOOSE FRUIT RECEIVED</span>
                    </div>
                    <div id="lf-monitor-table-container" style="overflow-x: auto;"></div>
                </div>
                
                <!-- JJK -->
                <div class="glass-card table-wrapper" style="padding: 10px; flex: 1.5 1 450px;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: #e2e8f0; padding: 4px 10px; font-weight: bold; text-decoration: underline;">MONITORING EVAKUASI EFB</span>
                    </div>
                    <div id="jjk-monitor-table-container" style="overflow-x: auto;"></div>
                </div>

                <!-- DESPATCH -->
                <div class="glass-card table-wrapper" style="padding: 10px; flex: 1 1 250px;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: #94a3b8; color: white; padding: 4px 10px; font-weight: bold; text-decoration: underline;">DESPATCH</span>
                    </div>
                    <div id="despatch-monitor-table-container" style="overflow-x: auto;"></div>
                </div>
            </div>
            </div> <!-- Close export-dashboard-wrapper -->
            
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
                <div class="modal-content" style="width: 95%; max-width: 1200px; max-height: 90vh; overflow-y: auto; overflow-x: hidden;">
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

            <!-- Modal Daily Monitor -->
            <div class="modal-overlay" id="daily-monitor-modal" style="display:none; z-index: 9999;">
                <div class="modal-content" style="width: 95%; max-width: 1400px; max-height: 90vh; overflow-y: auto; overflow-x: hidden;">
                    <div class="modal-header" style="cursor: move;" title="Geser Pop Up">
                        <h2>Input Harian (LF / JJK / Despatch)</h2>
                        <button type="button" class="modal-close" onclick="document.getElementById('daily-monitor-modal').style.display = 'none'">&times;</button>
                    </div>
                    
                    <div style="display: flex; gap: 15px; max-width: 300px; margin-top: 15px; margin-bottom: 20px;">
                        <div style="flex:1;">
                            <label>Tanggal</label>
                            <input type="date" id="dm-date" class="form-control" required onchange="loadDailyMonitorInputData()">
                        </div>
                    </div>
                    
                    <!-- Mill Config Section -->
                    <div class="glass-card" style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc;">
                        <h3 style="margin-top: 0;">Konfigurasi Mill & Produksi JJK</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; align-items: end;">
                            <div>
                                <label>Olah TBS Hari Ini?</label>
                                <select id="dm-is-processing" class="form-control">
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </div>
                            <div>
                                <label>Ratio EFB (%)</label>
                                <input type="number" id="dm-efb-ratio" class="form-control" step="0.01" min="0" placeholder="Cth: 20.5">
                            </div>
                            <div>
                                <label>Sisa JJK Kemarin (TON)</label>
                                <input type="number" id="dm-sisa-kemarin" class="form-control" step="0.01" min="0" placeholder="0">
                            </div>
                            <div>
                                <button type="button" class="btn btn-primary" id="btn-lock-mill-config" onclick="saveMillConfig()"><i class="fa-solid fa-lock"></i> Simpan & Lock</button>
                                <div id="mill-config-status" style="font-size: 0.8rem; color: #ef4444; margin-top: 5px;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <form id="form-daily-monitor" onsubmit="event.preventDefault(); saveDailyMonitorData();">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                            <!-- Kolom 1: Loose Fruit -->
                            <div>
                                <h3>Loose Fruit Received</h3>
                                <div id="dm-lf-list">Memuat...</div>
                            </div>
                            <!-- Kolom 2: EFB Transport -->
                            <div>
                                <h3>EFB (JJK) Transport</h3>
                                <div id="dm-efb-list">Memuat...</div>
                            </div>
                            <!-- Kolom 3: Despatch -->
                            <div>
                                <h3>Despatch</h3>
                                <div id="dm-despatch-list">Memuat...</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                            <button type="button" class="btn" style="background-color: #e2e8f0; color: #333; margin-right: 10px;" onclick="document.getElementById('daily-monitor-modal').style.display='none'">Batal</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fa-solid fa-save"></i> Simpan Realisasi Harian
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
            <!-- Daily Arrival Table -->
            <div class="glass-card table-wrapper" style="margin-top: 20px;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <h2 style="margin:0;">Daily Arrival FFB</h2>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <label style="font-weight: bold; font-size: 0.9em; color: var(--text-secondary);">Date:</label>
                        <input type="date" id="daily-arrival-date" class="form-control" onchange="renderDailyArrivalTable()">
                    </div>
                </div>
                <div style="margin-top: 20px; overflow-x: auto;">
                    <table class="data-table table-compact" style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center; border: 1px solid #0ea5e9;">
                        <thead>
                            <tr>
                                <th style="background-color: #0ea5e9; color: white;">KEY OPERATIONAL INDICATORS ( ARRIVAL )</th>
                                <th style="background-color: #0ea5e9; color: white;">FFB RECEIVED ( MT )</th>
                                <th style="background-color: #0ea5e9; color: white;">PERCENTAGE (%)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-daily-arrival">
                            <!-- rows injected here -->
                        </tbody>
                        <tfoot id="tfoot-daily-arrival" style="font-weight: bold; background-color: #fed7aa; color: #000;">
                        </tfoot>
                    </table>
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
                                <option>Supervisor Mill</option>
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
                                <option>Air Bikuk Estate</option>
                                <option>Air Buluh Estate</option>
                                <option>Malin Deman Estate</option>
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
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Air Bikuk Estate"> Air Bikuk Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Air Buluh Estate"> Air Buluh Estate</label>
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:normal;"><input type="checkbox" name="u_estate" value="Malin Deman Estate"> Malin Deman Estate</label>
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
        if (currentUser.role === 'Supir' || currentUser.role === 'Mandor' || currentUser.role === 'Admin') {
            btnInput.style.display = 'flex';
            btnInput.disabled = false;
            btnInput.style.opacity = '1';
            btnInput.style.cursor = 'pointer';
            btnInput.onclick = () => { document.getElementById('modal-vehicle-input').style.display='flex'; };
        } else if (currentUser.role === 'Assistant' || currentUser.role === 'Senior Field Manager') {
            btnInput.style.display = 'flex';
            btnInput.disabled = true;
            btnInput.style.opacity = '0.5';
            btnInput.style.cursor = 'not-allowed';
            btnInput.onclick = null;
            btnInput.title = 'Hanya Supir dan Mandor yang dapat menginput pergerakan';
        } else {
            btnInput.style.display = 'none';
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
        } else if (currentUser && currentUser.role) {
            const roleL = currentUser.role.toLowerCase();
            if (['asisten divisi', 'assistant', 'assistant divisi', 'asst divisi', 'krani divisi', 'mandor', 'mandor divisi'].includes(roleL)) {
                actionBtn = `
                <div style="display:flex; justify-content:center; width: 100%;">
                    <button type="button" class="btn" style="padding: 2px 6px; font-size: 0.7rem; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; justify-content:center;" onclick="promptAddUpkeepProgress(${u.id}, '${u.block}', '${safeType}', ${u.target}, ${u.realized}, ${u.targetworkers || 0})"><i class="fa-solid fa-pen-to-square"></i> Update</button>
                </div>
            `;
            } else {
                actionBtn = '-';
            }
        } else {
            actionBtn = '-';
        }
        
        let prestasiCell = '-';
        if (u.realized > 0 && u.realizedworkers > 0) {
            const prestasiVal = (u.realized / u.realizedworkers).toFixed(2);
            prestasiCell = `<strong style="color:#0369a1; font-size:1.05rem;">${prestasiVal}</strong> Ha/HK`;
        } else if (u.realized > 0) {
            prestasiCell = `<span style="color:#64748b; font-size:0.85rem;">Menunggu data HK</span>`;
        }
        
        const bData = masterData.blok.find(x => x.name === u.block);
        const divisi = bData ? bData.divisi : '-';
        
        return `
            <tr>
                <td><strong><a href="#" style="color: var(--primary-color); text-decoration: underline; cursor: pointer;" onclick="viewUpkeepHistory(${u.id}, '${u.block}', '${safeType}'); return false;">${u.block}</a></strong></td>
                <td>${u.startdate || '-'}</td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap; font-weight:bold;">${getEstateCode(u.estate)}</span></td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap;">${divisi}</span></td>
                <td>${u.type}<br><small>${u.worker}</small></td>
                <td>${u.target}</td>
                <td>${u.targetworkers || 0} Orang</td>
                <td>${u.realized}</td>
                <td>${prestasiCell}</td>
                <td style="text-align:center;">${actionBtn}</td>
            </tr>
        `;
    };

    aktif.forEach(u => tbody.innerHTML += renderRow(u));

    if (selesai.length > 0) {
        tbody.innerHTML += `<tr><td colspan="10" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>`;
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
        const tHa = p.targetha || p.targetHa || 0;
        const rHa = p.realizedha || p.realizedHa || 0;
        const tWorkers = p.targetworkers || p.targetWorkers || 0;
        const rWorkers = p.realizedworkers || p.realizedWorkers || 0;
        const sDate = p.startdate || p.startDate;
        const pct = getProgressStr(rKg, tKg);
        
        // Find divisi from master blok
        const bData = masterData.blok.find(x => x.name === p.block);
        const divisi = bData ? bData.divisi : '-';

        let actionBtn = '-';
        let hapusBtn = '';
        if (currentUser && currentUser.role && (currentUser.role.includes('Manager') || currentUser.role === 'Admin')) {
            hapusBtn = `<button class="btn btn-logout btn-hapus-hover" style="padding: 2px 6px; font-size: 0.7rem; background: #dc2626; color: white; border-radius: 4px; border:none; margin-top:3px; width: 100%;" onclick="deletePemupukan(${p.id})"><i class="fa-solid fa-trash"></i> Hapus</button>`;
        }

        if (p.status === 'Selesai') {
            actionBtn = `
                <div class="action-group-hover" style="display:flex; flex-direction:column; gap:3px; align-items: center; min-height: 40px; justify-content: center;">
                    <span class="status-badge status-done" style="text-align:center; width: 100%; box-sizing: border-box;">Selesai</span>
                    ${hapusBtn}
                </div>
            `;
        } else {
            actionBtn = `
                <div class="action-group-hover" style="display:flex; flex-direction:column; gap:3px; min-height: 40px; justify-content: center;">
                    <button class="btn btn-primary" style="padding: 2px 6px; font-size: 0.7rem; background:#f59e0b; border:none; width: 100%;" onclick="openPemupukanRealizationModal(${p.id}, '${p.block}', '${p.plan}', ${tKg}, ${rKg}, ${tHa}, ${rHa}, ${tWorkers}, ${rWorkers})"><i class="fa-solid fa-pen-to-square"></i> Update</button>
                    ${hapusBtn}
                </div>
            `;
        }
            
        return `
            <tr>
                <td>${sDate || '-'}</td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap; font-weight:bold;">${getEstateCode(p.estate)}</span></td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px;">${divisi}</span></td>
                <td><strong><a href="#" style="color: var(--primary-color); text-decoration: underline; cursor: pointer;" onclick="viewPemupukanSummary('${p.block}', '${p.plan}', ${tKg}, ${tHa}, ${tWorkers}, ${rKg}, ${rHa}, ${rWorkers}); return false;">${p.block}</a></strong></td>
                <td>${p.plan}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:2px; font-size:0.8rem;">
                        <span><strong>Kg:</strong> ${tKg}</span>
                        <span><strong>Ha:</strong> ${tHa}</span>
                        <span><strong>Orang:</strong> ${tWorkers}</span>
                    </div>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:2px; font-size:0.8rem;">
                        <span><strong>Kg:</strong> ${rKg}</span>
                        <span><strong>Ha:</strong> ${rHa}</span>
                        <span><strong>Orang:</strong> ${rWorkers}</span>
                    </div>
                </td>
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
        tbody.innerHTML += `<tr><td colspan="9" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>`;
        selesai.forEach(p => tbody.innerHTML += renderRow(p));
    }
};

window.openPemupukanRealizationModal = (id, block, plan, tKg, rKg, tHa, rHa, tWorkers, rWorkers) => {
    document.getElementById('pr-id').value = id;
    document.getElementById('pr-title').innerText = `Update Realisasi: ${block} (${plan})`;
    
    // Set Target Display
    document.getElementById('pr-plan-kg').innerText = `${tKg} Kg`;
    document.getElementById('pr-plan-ha').innerText = `${tHa} Ha`;
    document.getElementById('pr-plan-workers').innerText = `${tWorkers} Orang`;
    
    // Clear Inputs
    document.getElementById('pr-input-kg').value = '';
    document.getElementById('pr-input-ha').value = '';
    document.getElementById('pr-input-workers').value = '';
    
    // Clear Prestasi Text
    document.getElementById('pr-prestasi-ha').innerText = '-';
    document.getElementById('pr-prestasi-kg').innerText = '-';
    
    document.getElementById('modal-pemupukan-realization').style.display = 'flex';
};

window.calcPrestasiPemupukan = () => {
    const kg = parseFloat(document.getElementById('pr-input-kg').value) || 0;
    const ha = parseFloat(document.getElementById('pr-input-ha').value) || 0;
    const hk = parseInt(document.getElementById('pr-input-workers').value) || 0;
    
    const prestasiHaEl = document.getElementById('pr-prestasi-ha');
    const prestasiKgEl = document.getElementById('pr-prestasi-kg');
    
    if (hk > 0) {
        if (ha > 0) prestasiHaEl.innerText = (ha / hk).toFixed(2) + ' Ha/HK';
        else prestasiHaEl.innerText = '-';
        
        if (kg > 0) prestasiKgEl.innerText = (kg / hk).toFixed(2) + ' Kg/HK';
        else prestasiKgEl.innerText = '-';
    } else {
        prestasiHaEl.innerText = '-';
        prestasiKgEl.innerText = '-';
    }
};


window.deletePemupukan = async (id) => {
    if(confirm('Apakah Anda yakin ingin menghapus data rencana pemupukan ini? Seluruh data realisasi yang terikat juga akan terhapus.')) {
        try {
            const res = await fetch(`${API_URL}/pemupukan/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadData();
                
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = "Rencana pemupukan berhasil dihapus!";
                    toast.className = "toast show success";
                    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
                }
            } else {
                let errMsg = 'Gagal menghapus data.';
                try {
                    const errData = await res.json();
                    errMsg += ' Error: ' + errData.error;
                } catch(e) {}
                alert(errMsg);
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan koneksi: ' + e.message);
        }
    }
};

window.deleteHarvestingDaily = async (id) => {
    if(confirm('Apakah Anda yakin ingin menghapus data rencana harian ini?')) {
        try {
            const res = await fetch(`${API_URL}/harvesting/daily/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadData();
                
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
    const tbodyRekap = document.getElementById('tbody-harvesting-rekap');
    if (!tbodyDaily) return;
    
    tbodyDaily.innerHTML = '';
    if (tbodyRekap) tbodyRekap.innerHTML = '';
    
    const now = new Date();
    const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const titleEl = document.getElementById('monitoring-month-year');
    if (titleEl) {
        titleEl.textContent = `Month : ${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    const btnHm = document.getElementById('btn-input-hm');
    const btnHd = document.getElementById('btn-input-hd');
    if (btnHm && btnHd) {
        if (currentUser.role.includes('Security') || currentUser.role.includes('Manager') || currentUser.role === 'Supir') {
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
        if (dateA !== dateB) return dateB - dateA;
        
        const divA = a.divisi || '';
        const divB = b.divisi || '';
        return divA.localeCompare(divB);
    };

    let filteredData = db.harvesting_daily;
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        filteredData = filteredData.filter(h => !h.estate || h.estate === currentUser.estate);
    }
    
    // Check if there are any UI filters active (like date or estate from the UI)
    const dateFilterEl = document.getElementById('harvesting-date-filter');
    const estateFilterEl = document.getElementById('harvesting-estate-filter');
    if (dateFilterEl && dateFilterEl.value) {
        filteredData = filteredData.filter(h => h.date && h.date.startsWith(dateFilterEl.value));
    }
    if (estateFilterEl && estateFilterEl.value) {
        filteredData = filteredData.filter(h => h.estate === estateFilterEl.value);
    }
    
    // Filter divisi if SFM/Manager
    if (currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Senior Field Manager')) {
        const divFilterEl = document.getElementById('harvesting-divisi-filter');
        if (divFilterEl && divFilterEl.value) {
            filteredData = filteredData.filter(h => h.divisi === divFilterEl.value);
        }
    } else if (currentUser && currentUser.role === 'Asisten Divisi') {
        filteredData = filteredData.filter(h => h.divisi === currentUser.divisi);
    }

    const draftData = filteredData.filter(h => h.status !== 'Selesai' && h.status !== 'Closed').sort(sortFn);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const selesaiData = filteredData.filter(h => {
        if (h.status !== 'Selesai' && h.status !== 'Closed') return false;
        const dObj = new Date(h.date);
        return isNaN(dObj) || dObj >= twoDaysAgo;
    }).sort(sortFn);
    
    const renderDailyRow = (h) => {
        let statusEl = '';
        if (h.status === 'Draft') {
            statusEl = `<span class="status-badge" style="background:#fef3c7; color:#d97706; padding:2px 6px;">${h.status}</span>`;
            if (currentUser.role === 'Mandor' || currentUser.role === 'Admin') {
                statusEl += ` <button type="button" class="btn btn-primary" style="padding:2px 6px; font-size:0.7rem; margin-left:5px;" onclick="publishHarvesting(${h.id})">Publish</button>`;
            }
        } else if (h.status === 'Published' || h.status === 'Open' || h.status === 'In Progress') {
            const roleL = currentUser.role ? currentUser.role.toLowerCase() : '';
            if (['kerani buah', 'krani divisi', 'admin', 'asisten divisi', 'assistant', 'assistant divisi', 'asst divisi', 'supir', 'mandor', 'mandor divisi'].includes(roleL)) {
                statusEl = `<button type="button" class="btn btn-primary" style="padding:2px 8px; font-size:0.8rem; background-color:orange; border:none; border-radius:15px; font-weight:bold;" onclick="openAddHarvestingRealizationModal(${h.id}, '${h.block}', ${h.est_janjang || 0}, ${h.plan_pemanen || 0}, ${h.est_kg || 0}, '${h.divisi}')">Update</button>`;
            } else {
                statusEl = `<span class="status-badge" style="background:#d1fae5; color:#065f46; padding:2px 6px;">${h.status}</span>`;
            }
        } else if (h.status === 'Selesai') {
            statusEl = `<span class="status-badge" style="background:#dcfce7; color:#15803d; padding:2px 6px;">${h.status}</span>`;
            if (currentUser.role === 'Asisten Divisi' || currentUser.role === 'Admin') {
                statusEl += ` <button type="button" class="btn btn-primary" style="padding:2px 6px; font-size:0.7rem; margin-left:5px; background-color:#16a34a; border:none;" onclick="closeHarvesting(${h.id})">Close</button>`;
            }
        } else {
            statusEl = `<span class="status-badge" style="background:#d1fae5; color:#065f46; padding:2px 6px;">${h.status}</span>`;
        }

        const dateStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        const dObj = new Date(dateStr);
        const formattedDate = !isNaN(dObj) ? dObj.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : dateStr;
            
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap;">${getEstateCode(h.estate)}</span></td>
                <td><strong>${h.divisi}</strong></td>
                <td>${h.block}</td>
                <td>${h.pusingan || '-'}</td>
                <td><small>${h.mandor || '-'}</small></td>
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
        const tbodyClosed = document.getElementById('tbody-harvesting-closed');
        const titleClosed = document.getElementById('closed-jobs-header');
        const containerClosed = document.getElementById('closed-jobs-container');
        
        if (tbodyClosed) {
            tbodyClosed.innerHTML = '';
            titleClosed.style.display = 'flex';
            containerClosed.style.display = 'block';
            selesaiData.forEach(h => {
                let statusEl = `<span class="status-badge" style="background:#d1fae5; color:#065f46; padding:2px 6px;">${h.status}</span>`;
                if (h.status === 'Selesai') {
                    statusEl = `<span class="status-badge" style="background:#dcfce7; color:#15803d; padding:2px 6px;">${h.status}</span>`;
                    if (currentUser.role === 'Asisten Divisi' || currentUser.role === 'Admin') {
                        statusEl += ` <button type="button" class="btn btn-primary" style="padding:2px 6px; font-size:0.7rem; margin-left:5px; background-color:#16a34a; border:none;" onclick="closeHarvesting(${h.id})">Close</button>`;
                    }
                }
                
                const dateStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
                const dObj = new Date(dateStr);
                const formattedDate = !isNaN(dObj) ? dObj.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : dateStr;
                
                const prestasiHaWd = (h.realized_pemanen > 0) ? (h.realized_ha / h.realized_pemanen).toFixed(2) : '0.00';
                const prestasiKgWd = (h.realized_pemanen > 0) ? (h.realized_kg / h.realized_pemanen).toFixed(1) : '0.0';
                const actualBjr = (h.realized_janjang > 0) ? (h.realized_kg / h.realized_janjang).toFixed(2) : '0.00';
                
                let grossArea = 0;
                const blockNames = h.block ? h.block.split(',').map(s => s.trim()) : [];
                blockNames.forEach(bName => {
                    let bData;
                    if (h.divisi && h.divisi !== 'undefined') {
                        bData = masterData.blok.find(b => b.name === bName && b.divisi === h.divisi);
                    }
                    if (!bData) bData = masterData.blok.find(b => b.name === bName);
                    if (bData) {
                        let area = bData.gross_area;
                        if(typeof area === 'string') area = area.replace(/,/g, '');
                        grossArea += parseFloat(area) || 0;
                    }
                });
                
                let varActHa = '0.0';
                if (grossArea > 0) varActHa = ((h.realized_ha / grossArea) * 100).toFixed(1);
                
                const turnOut = (h.plan_pemanen > 0) ? ((h.realized_pemanen / h.plan_pemanen) * 100).toFixed(1) : '0.0';

                tbodyClosed.innerHTML += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap;">${getEstateCode(h.estate)}</span></td>
                        <td><strong>${h.divisi}</strong></td>
                        <td>${h.block}</td>
                        <td>${h.pusingan || '-'}</td>
                        <td><small>${h.mandor || '-'}</small></td>
                        <td>${h.est_janjang}</td>
                        <td>${h.est_kg}</td>
                        <td>${h.plan_pemanen}</td>
                        <td>${h.realized_janjang}</td>
                        <td>${h.realized_pemanen}</td>
                        <td>${h.realized_kg}</td>
                        <td>${grossArea.toFixed(2)}</td>
                        <td>${h.realized_ha ? parseFloat(h.realized_ha).toFixed(2) : '0.00'}</td>
                        <td>${prestasiHaWd}</td>
                        <td>${prestasiKgWd}</td>
                        <td>${actualBjr}</td>
                        <td>${varActHa}%</td>
                        <td>${turnOut}%</td>
                        <td>${statusEl}</td>
                    </tr>
                `;
            });
        }
        
        const rekapMap = {};
        const currentMonthPrefix = new Date().toISOString().substring(0, 7);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const mtdLabel = `MTD ${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

        selesaiData.forEach(h => {
            const hDate = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
            if (!hDate || !hDate.startsWith(currentMonthPrefix)) return;

            const key = h.estate + '_' + h.divisi;
            if(!rekapMap[key]) {
                rekapMap[key] = {
                    label: mtdLabel,
                    estate: h.estate,
                    divisi: h.divisi,
                    plan_jjg: 0,
                    plan_kg: 0,
                    plan_pemanen: 0,
                    plan_pokok: 0,
                    act_jjg: 0,
                    act_kg: 0,
                    act_ha: 0,
                    act_pemanen: 0,
                    act_pokok: 0,
                    gross_area: 0,
                    pusingan_sum: 0,
                    pusingan_count: 0,
                    akp_sum: 0,
                    akp_count: 0,
                    blocks: new Set()
                };
            }
            rekapMap[key].plan_jjg += h.est_janjang || 0;
            rekapMap[key].plan_kg += h.est_kg || 0;
            rekapMap[key].plan_pemanen += h.plan_pemanen || 0;
            rekapMap[key].act_jjg += h.realized_janjang || 0;
            rekapMap[key].act_kg += h.realized_kg || 0;
            rekapMap[key].act_pemanen += h.realized_pemanen || 0;
            rekapMap[key].act_ha += h.realized_ha || 0;
            
            let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === h.divisi);
            if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
            const sph = (blockData && blockData.sph) ? parseFloat(blockData.sph) : 136;
            rekapMap[key].act_pokok += (h.realized_ha || 0) * sph;
            
            
            if (h.pusingan) {
                rekapMap[key].pusingan_sum += parseInt(h.pusingan) || 0;
                rekapMap[key].pusingan_count++;
            }
            
            if (h.akp) {
                const akpVals = String(h.akp).split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                akpVals.forEach(v => {
                    rekapMap[key].akp_sum += v;
                    rekapMap[key].akp_count++;
                });
            }
            
            if (!rekapMap[key].blocks.has(h.block)) {
                rekapMap[key].blocks.add(h.block);
                rekapMap[key].gross_area += (blockData ? blockData.gross_area : 0);
                rekapMap[key].plan_pokok += (blockData ? blockData.gross_area : 0) * sph;
            }
        });
        
        const sortedRekap = Object.values(rekapMap).sort((a, b) => {
            const estA = a.estate || '';
            const estB = b.estate || '';
            if (estA !== estB) return estA.localeCompare(estB);
            
            const divA = a.divisi || '';
            const divB = b.divisi || '';
            return divA.localeCompare(divB, undefined, {numeric: true});
        });
        
        if (tbodyRekap) {
            if (sortedRekap.length === 0) {
                tbodyRekap.innerHTML = `<tr><td colspan="14" style="text-align:center; border: 1px solid #cbd5e1;">Belum ada data rekap</td></tr>`;
            } else {
                sortedRekap.forEach(r => {
                    const avgPusingan = r.pusingan_count > 0 ? (r.pusingan_sum / r.pusingan_count).toFixed(1) : '-';
                    const akpPlan = r.akp_count > 0 ? (r.akp_sum / r.akp_count).toFixed(1) : '0.0';
                    const bjrActual = r.act_jjg > 0 ? (r.act_kg / r.act_jjg).toFixed(2) : '0.00';
                    
                    const prestasiHvr = r.act_pemanen > 0 ? r.act_kg / r.act_pemanen : 0;
                    const kapasitasHa = r.act_pemanen > 0 ? r.act_ha / r.act_pemanen : 0;
                    
                    let varHvr = 0;
                    if (r.plan_pemanen > 0) varHvr = (r.act_pemanen / r.plan_pemanen) * 100;
                    
                    let varHa = 0;
                    if (r.gross_area > 0) varHa = (r.act_ha / r.gross_area) * 100;

                    tbodyRekap.innerHTML += `
                        <tr style="background-color: #ffffff;">
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong style="color:var(--primary-color);">${r.label}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap;">${getEstateCode(r.estate)}</span></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${r.divisi ? `<a href="#" onclick="openDivisiHistory('${r.divisi}', null, '${r.estate}')" style="color:var(--primary); font-weight:bold; text-decoration:underline; cursor:pointer;" title="Lihat Detail Divisi">${r.divisi}</a>` : '-'}</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${avgPusingan}</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${akpPlan}%</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${r.plan_jjg}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${r.plan_kg}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${r.act_jjg}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${r.act_kg}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${r.act_pemanen}</strong></td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${kapasitasHa.toFixed(2)}</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${prestasiHvr.toFixed(1)}</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center; color:${varHa > 100 ? 'red' : (varHa < 100 ? 'green' : 'black')}; font-weight:bold;">${varHa.toFixed(1)}%</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center; color:${varHvr > 100 ? 'red' : (varHvr < 100 ? 'green' : 'black')}; font-weight:bold;">${varHvr.toFixed(1)}%</td>
                            <td style="border: 1px solid #cbd5e1; text-align:center;">${bjrActual}</td>
                        </tr>
                    `;
                });
            }
        }
    } else {
        if (tbodyRekap) {
            tbodyRekap.innerHTML = `<tr><td colspan="15" style="text-align:center; border: 1px solid #cbd5e1;">Belum ada data rekap</td></tr>`;
        }
    }
    
    if(draftData.length === 0 && selesaiData.length === 0) {
        tbodyDaily.innerHTML = `<tr><td colspan="13" style="text-align:center;">Belum ada rencana panen harian.</td></tr>`;
    } else if (draftData.length === 0) {
        tbodyDaily.innerHTML = `<tr><td colspan="13" style="text-align:center;">Belum ada pekerjaan yang berstatus Draft atau Published.</td></tr>`;
    } else if (selesaiData.length === 0) {
        const titleClosed = document.getElementById('closed-jobs-header');
        const containerClosed = document.getElementById('closed-jobs-container');
        if(titleClosed) titleClosed.style.display = 'none';
        if(containerClosed) containerClosed.style.display = 'none';
    }
};

window.printHarvestingDaily = () => {
    const estate = document.getElementById('header-estate-dropdown')?.value || currentUser.estate || 'Semua Estate';
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'});
    
    let html = `
        <html><head><title>Print Realisasi Panen Harian</title>
        <style>
            body { font-family: sans-serif; font-size: 11px; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
            th { background: #f0f0f0; }
            h2, h3 { text-align: center; margin: 5px 0; }
            .status-badge { font-weight: bold; }
        </style>
        </head><body onload="window.print()">
        <h2>Laporan Realisasi Panen Harian - ${estate}</h2>
        <h3 style="margin-bottom: 20px;">Tanggal Cetak: ${dateStr}</h3>
    `;
    
    const dailyTableEl = document.querySelector('#tbody-harvesting-daily');
    if (dailyTableEl && dailyTableEl.innerHTML.trim() !== '' && !dailyTableEl.innerHTML.includes('Belum ada')) {
        const dailyTable = dailyTableEl.closest('table').cloneNode(true);
        dailyTable.querySelectorAll('button').forEach(b => b.remove());
        html += `<h4>Monitoring Panen Harian (Open/In Progress)</h4>` + dailyTable.outerHTML;
    }
    
    const closedTableEl = document.querySelector('#tbody-harvesting-closed');
    if (closedTableEl && closedTableEl.innerHTML.trim() !== '') {
        const closedTable = closedTableEl.closest('table').cloneNode(true);
        closedTable.querySelectorAll('button').forEach(b => b.remove());
        html += `<h4>Pekerjaan Sudah Selesai (Closed)</h4>` + closedTable.outerHTML;
    }
    
    html += `</body></html>`;
    
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        alert('Pop-up terblokir. Silakan izinkan pop-up untuk mencetak.');
    }
};

window.openPrintClosedHarvestingModal = async () => {
    const canSeeAll = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Senior Field Manager');
    
    const estateList = [
        "Bunga Tanjung Estate", "Sungai Teramang Estate", "Air Bikuk Estate", "Batu Kuda Estate",
        "Air Buluh Estate", "Malin Deman Estate", "Tanah Rekah Estate", "Muko Muko Estate",
        "Sei Jerinjing Estate", "Talang Petai Estate", "Sungai Kiang Estate", "Air Majunto Estate"
    ];
    
    let selectedEstate = currentUser ? currentUser.estate : '';
    if (selectedEstate === 'Semua Estate (Khusus Admin)' || !selectedEstate || selectedEstate === '-') {
        selectedEstate = estateList[0];
    }

    let estateSelectHtml = '';
    if (canSeeAll) {
        let checkboxes = estateList.map(e => `
            <label style="display:block; margin-bottom:5px;">
                <input type="checkbox" name="print-closed-estate-cb" value="${e}" ${e === selectedEstate ? 'checked' : ''}> ${e}
            </label>
        `).join('');
        estateSelectHtml = `
            <div class="form-group">
                <label>Pilih Estate</label>
                <div style="max-height: 150px; overflow-y: auto; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
                    ${checkboxes}
                </div>
            </div>
        `;
    } else {
        estateSelectHtml = `<input type="hidden" id="print-closed-estate" value="${selectedEstate}">`;
    }

    const html = `
        <div class="modal-overlay" id="modal-print-closed-harvesting">
            <div class="modal-content animate-fade-in" style="width:90vw; max-width:500px;">
                <div class="modal-header">
                    <h3>Print Harvesting (Selesai)</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-print-closed-harvesting').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    ${estateSelectHtml}
                    <div class="form-group">
                        <label>Periode Dari Tanggal</label>
                        <input type="date" id="print-closed-start" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
                    </div>
                    <div class="form-group">
                        <label>Sampai Tanggal</label>
                        <input type="date" id="print-closed-end" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-print-closed-harvesting').remove()">Batal</button>
                        <button class="btn btn-primary" onclick="executePrintClosedHarvesting()">Print / Export</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.executePrintClosedHarvesting = () => {
    const startStr = document.getElementById('print-closed-start').value;
    const endStr = document.getElementById('print-closed-end').value;
    
    if (!startStr || !endStr) {
        alert("Pilih periode tanggal terlebih dahulu!");
        return;
    }

    let estatesInvolved = new Set();
    const canSeeAll = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Senior Field Manager');
    
    if (canSeeAll) {
        const cbs = document.querySelectorAll('input[name="print-closed-estate-cb"]:checked');
        cbs.forEach(cb => estatesInvolved.add(cb.value));
    } else {
        estatesInvolved.add(currentUser.estate);
    }
    
    if (estatesInvolved.size === 0) {
        alert("Pilih minimal 1 Estate!");
        return;
    }

    let rawData = [...db.harvesting_daily];
    
    const filtered = rawData.filter(d => {
        if (d.status !== 'Selesai' && d.status !== 'Closed') return false;
        if (!estatesInvolved.has(d.estate)) return false;
        return d.date >= startStr && d.date <= endStr;
    });
    
    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.estate !== b.estate) return a.estate.localeCompare(b.estate);
        if (a.divisi !== b.divisi) return (a.divisi||'').localeCompare(b.divisi||'', undefined, {numeric: true});
        return (a.block||'').localeCompare(b.block||'');
    });

    const estateNames = Array.from(estatesInvolved).map(e => getEstateCode(e)).join(', ') || 'All Estates';
    const periodLabel = `${startStr} s/d ${endStr}`;
    
    let tableRows = '';
    if (filtered.length === 0) {
        tableRows = `<tr><td colspan="20" style="text-align:center; padding: 20px;">Tidak ada data pekerjaan selesai pada periode dan estate yang dipilih.</td></tr>`;
    } else {
        filtered.forEach(h => {
            let prestasiHaWd = 0; if(h.realized_pemanen > 0) prestasiHaWd = h.realized_ha / h.realized_pemanen;
            let prestasiKgWd = 0; if(h.realized_pemanen > 0) prestasiKgWd = h.realized_kg / h.realized_pemanen;
            let bjrActual = 0; if(h.realized_janjang > 0) bjrActual = h.realized_kg / h.realized_janjang;
            let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === h.divisi);
            if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
            const grossArea = blockData ? blockData.gross_area : 0;
            let varHa = 0; if (grossArea > 0) varHa = (h.realized_ha / grossArea) * 100;
            let varHvr = 0; if (h.plan_pemanen > 0) varHvr = (h.realized_pemanen / h.plan_pemanen) * 100;
            
            tableRows += `
                <tr>
                    <td>${h.date}</td>
                    <td>${getEstateCode(h.estate)}</td>
                    <td>${h.divisi}</td>
                    <td>${h.block}</td>
                    <td>${h.pusingan || '-'}</td>
                    <td>${h.mandor || '-'}</td>
                    <td>${h.plan_janjang || h.est_janjang || 0}</td>
                    <td>${h.plan_kg || h.est_kg || 0}</td>
                    <td>${h.plan_pemanen}</td>
                    <td>${h.realized_janjang}</td>
                    <td>${h.realized_pemanen}</td>
                    <td>${h.realized_kg}</td>
                    <td>${h.plan_ha || 0}</td>
                    <td>${h.realized_ha || 0}</td>
                    <td>${prestasiHaWd.toFixed(2)}</td>
                    <td>${prestasiKgWd.toFixed(1)}</td>
                    <td>${bjrActual.toFixed(2)}</td>
                    <td>${varHa.toFixed(1)}%</td>
                    <td>${varHvr.toFixed(1)}%</td>
                    <td>Selesai</td>
                </tr>
            `;
        });
    }

    const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Harvesting (Selesai)</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
                .header-info { margin-bottom: 20px; text-align: center; }
                .header-info h2, .header-info h3, .header-info h4 { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; text-align: center; }
                td { text-align: center; }
                @media print {
                    @page { margin: 10mm; size: landscape; }
                    body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; }
                }
            </style>
        </head>
        <body onload="window.print();">
            <div class="header-info">
                <h2>LIST PEKERJAAN PANEN (SELESAI)</h2>
                <h3>ESTATE: ${estateNames}</h3>
                <h4>PERIODE: ${periodLabel}</h4>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>ESTATE</th>
                        <th>DIV</th>
                        <th>BLOK</th>
                        <th>ROUND</th>
                        <th>MANDOR</th>
                        <th>PLAN<br>(JJG)</th>
                        <th>PLAN<br>(KG)</th>
                        <th>HVR</th>
                        <th>ACT<br>(JJG)</th>
                        <th>ACT<br>(HVR)</th>
                        <th>ACT<br>(KG)</th>
                        <th>PLAN<br>(HA)</th>
                        <th>ACT<br>(HA)</th>
                        <th>PRESTASI<br>HA/WD</th>
                        <th>PRESTASI<br>KG/WD</th>
                        <th>ACTUAL<br>BJR</th>
                        <th>VAR ACT HA<br>VS PLAN (%)</th>
                        <th>TURN OUT<br>(%)</th>
                        <th>STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const printWin = window.open('', '', 'width=1200,height=800');
    if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
        document.getElementById('modal-print-closed-harvesting').remove();
    } else {
        alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak.");
    }
};

window.openPrintRekapModal = async () => {
    // Tentukan apakah user bisa melihat beberapa estate
    const canSeeAll = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Senior Field Manager');
    
    const estateList = [
        "Bunga Tanjung Estate", "Sungai Teramang Estate", "Air Bikuk Estate", "Batu Kuda Estate",
        "Air Buluh Estate", "Malin Deman Estate", "Tanah Rekah Estate", "Muko Muko Estate",
        "Sei Jerinjing Estate", "Talang Petai Estate", "Sungai Kiang Estate", "Air Majunto Estate"
    ];
    
    let selectedEstate = currentUser ? currentUser.estate : '';
    if (selectedEstate === 'Semua Estate (Khusus Admin)' || !selectedEstate || selectedEstate === '-') {
        selectedEstate = estateList[0];
    }

    let estateSelectHtml = '';
    if (canSeeAll) {
        let checkboxes = estateList.map(e => `
            <label style="display:block; margin-bottom:5px;">
                <input type="checkbox" name="print-rekap-estate-cb" value="${e}" ${e === selectedEstate ? 'checked' : ''}> ${e}
            </label>
        `).join('');
        estateSelectHtml = `
            <div class="form-group">
                <label>Pilih Estate</label>
                <div style="max-height: 150px; overflow-y: auto; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px;">
                    ${checkboxes}
                </div>
            </div>
        `;
    } else {
        estateSelectHtml = `<input type="hidden" id="print-rekap-estate" value="${selectedEstate}">`;
    }

    const html = `
        <div class="modal-overlay" id="modal-print-rekap">
            <div class="modal-content animate-fade-in" style="width:90vw; max-width:500px;">
                <div class="modal-header">
                    <h3>Print Rekap Panen per Divisi</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-print-rekap').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    ${estateSelectHtml}
                    <div class="form-group">
                        <label>Periode Dari Tanggal</label>
                        <input type="date" id="print-rekap-start" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
                    </div>
                    <div class="form-group">
                        <label>Sampai Tanggal</label>
                        <input type="date" id="print-rekap-end" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-print-rekap').remove()">Batal</button>
                        <button class="btn btn-primary" onclick="executePrintRekap()">Print / Export</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.updatePrintDivisiList = async () => {
    const estate = document.getElementById('print-rekap-estate').value;
    const container = document.getElementById('print-divisi-container');
    if (!container) return;
    
    container.innerHTML = 'Memuat divisi...';
    try {
        const res = await fetch(`${API_URL}/master/${encodeURIComponent(estate)}`);
        const data = await res.json();
        const divisies = data.divisi || [];
        
        if (divisies.length === 0) {
            container.innerHTML = '<span style="color:red; font-style:italic;">Tidak ada data divisi untuk estate ini.</span>';
            return;
        }
        
        container.innerHTML = divisies.map(d => `
            <label style="display:block; margin-bottom:5px;">
                <input type="checkbox" name="print-divisi" value="${d.name}" checked> ${d.name}
            </label>
        `).join('');
    } catch (e) {
        container.innerHTML = '<span style="color:red;">Gagal memuat divisi.</span>';
    }
};

window.executePrintRekap = () => {
    const startDate = document.getElementById('print-rekap-start').value;
    const endDate = document.getElementById('print-rekap-end').value;
    
    const canSeeAll = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Senior Field Manager');
    let targetEstates = [];
    if (canSeeAll) {
        const estateCbs = document.querySelectorAll('input[name="print-rekap-estate-cb"]:checked');
        targetEstates = Array.from(estateCbs).map(cb => cb.value);
        if (targetEstates.length === 0) {
            alert("Pilih minimal satu estate.");
            return;
        }
    } else {
        const hiddenEstate = document.getElementById('print-rekap-estate');
        if(hiddenEstate) targetEstates = [hiddenEstate.value];
    }
    
    if (!startDate || !endDate) {
        alert("Pilih periode tanggal terlebih dahulu.");
        return;
    }
    
    // Filter data
    const selesaiData = db.harvesting_daily.filter(h => h.status === 'Selesai' || h.status === 'Closed');
    
    const rekapMap = {};
    
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
    };
    const periodLabel = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    let estatesInvolved = new Set();
    
    selesaiData.forEach(h => {
        const hDateStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        if (!hDateStr) return;
        const hDateObj = new Date(hDateStr);
        
        // Check date range
        if (hDateObj < startObj || hDateObj > endObj) return;
        
        // Check estate filter
        if (!targetEstates.includes(h.estate)) return;
        
        if (h.estate) estatesInvolved.add(h.estate);
        
        const key = h.estate + '_' + h.divisi;
        if(!rekapMap[key]) {
            rekapMap[key] = {
                label: 'Periode Ini',
                estate: h.estate,
                divisi: h.divisi,
                plan_jjg: 0,
                plan_kg: 0,
                plan_pemanen: 0,
                act_jjg: 0,
                act_kg: 0,
                act_ha: 0,
                act_pemanen: 0,
                act_pokok: 0,
                gross_area: 0,
                pusingan_sum: 0,
                pusingan_count: 0,
                akp_sum: 0,
                akp_count: 0,
                blocks: new Set()
            };
        }
        rekapMap[key].plan_jjg += h.est_janjang || 0;
        rekapMap[key].plan_kg += h.est_kg || 0;
        rekapMap[key].plan_pemanen += h.plan_pemanen || 0;
        rekapMap[key].act_jjg += h.realized_janjang || 0;
        rekapMap[key].act_kg += h.realized_kg || 0;
        rekapMap[key].act_pemanen += h.realized_pemanen || 0;
        rekapMap[key].act_ha += h.realized_ha || 0;
        
        let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === h.divisi);
        if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
        const sph = (blockData && blockData.sph) ? parseFloat(blockData.sph) : 136;
        rekapMap[key].act_pokok += (h.realized_ha || 0) * sph;
        
        if (h.pusingan) {
            rekapMap[key].pusingan_sum += parseInt(h.pusingan) || 0;
            rekapMap[key].pusingan_count++;
        }
        
        if (h.akp) {
            const akpVals = String(h.akp).split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            akpVals.forEach(v => {
                rekapMap[key].akp_sum += v;
                rekapMap[key].akp_count++;
            });
        }
        
        if (!rekapMap[key].blocks.has(h.block)) {
            rekapMap[key].blocks.add(h.block);
            rekapMap[key].gross_area += (blockData ? blockData.gross_area : 0);
        }
    });
    
    const sortedRekap = Object.values(rekapMap).sort((a, b) => {
        const estA = a.estate || '';
        const estB = b.estate || '';
        if (estA !== estB) return estA.localeCompare(estB);
        const divA = a.divisi || '';
        const divB = b.divisi || '';
        return divA.localeCompare(divB, undefined, {numeric: true});
    });
    
    const rekapByEstate = {};
    sortedRekap.forEach(r => {
        if (!rekapByEstate[r.estate]) rekapByEstate[r.estate] = [];
        rekapByEstate[r.estate].push(r);
    });
    
    const estateNames = Array.from(estatesInvolved).map(e => getEstateCode(e)).join(', ') || 'All Estates';
    
    let allTableRowsHtml = '';
    
    if (Object.keys(rekapByEstate).length === 0) {
        allTableRowsHtml = `<tr><td colspan="15" style="text-align:center; padding: 20px;">Tidak ada data pada periode dan estate yang dipilih.</td></tr>`;
    } else {
        Object.keys(rekapByEstate).sort().forEach(estate => {
            const rows = rekapByEstate[estate];
            let totPlanJjg = 0, totPlanKg = 0, totActJjg = 0, totActKg = 0, totActHvr = 0, totActHa = 0;
            
            rows.forEach(r => {
                const avgPusingan = r.pusingan_count > 0 ? (r.pusingan_sum / r.pusingan_count).toFixed(1) : '-';
                const akpPlan = r.akp_count > 0 ? (r.akp_sum / r.akp_count).toFixed(1) : '0.0';
                const bjrActual = r.act_jjg > 0 ? (r.act_kg / r.act_jjg).toFixed(2) : '0.00';
                const prestasiHvr = r.act_pemanen > 0 ? r.act_kg / r.act_pemanen : 0;
                const kapasitasHa = r.act_pemanen > 0 ? r.act_ha / r.act_pemanen : 0;
                let varHvr = 0; if (r.plan_pemanen > 0) varHvr = (r.act_pemanen / r.plan_pemanen) * 100;
                let varHa = 0; if (r.gross_area > 0) varHa = (r.act_ha / r.gross_area) * 100;
                
                totPlanJjg += r.plan_jjg;
                totPlanKg += r.plan_kg;
                totActJjg += r.act_jjg;
                totActKg += r.act_kg;
                totActHvr += r.act_pemanen;
                totActHa += r.act_ha;
                
                allTableRowsHtml += `
                    <tr>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${periodLabel}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${getEstateCode(r.estate)}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${r.divisi || '-'}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${avgPusingan}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${akpPlan}%</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;"><strong>${r.plan_jjg}</strong></td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;"><strong>${r.plan_kg}</strong></td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;"><strong>${r.act_jjg}</strong></td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;"><strong>${r.act_kg}</strong></td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;"><strong>${r.act_pemanen}</strong></td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${kapasitasHa.toFixed(2)}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${prestasiHvr.toFixed(1)}</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${varHa.toFixed(1)}%</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${varHvr.toFixed(1)}%</td>
                        <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${bjrActual}</td>
                    </tr>
                `;
            });
            
            const totBjr = totActJjg > 0 ? (totActKg / totActJjg).toFixed(2) : '0.00';
            const totPrestasiHvr = totActHvr > 0 ? totActKg / totActHvr : 0;
            const totKapasitasHa = totActHvr > 0 ? totActHa / totActHvr : 0;
            
            allTableRowsHtml += `
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="5" style="border: 1px solid #cbd5e1; text-align:right; padding: 6px;">TOTAL ${getEstateCode(estate)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totPlanJjg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totPlanKg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totActJjg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totActKg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totActHvr}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totKapasitasHa.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totPrestasiHvr.toFixed(1)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">-</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">-</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; padding: 6px;">${totBjr}</td>
                </tr>
            `;
        });
    }

    const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Rekap Panen per Divisi</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                h2, h3, h4 { margin: 5px 0; text-align: center; }
                .header-info { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: center; }
                th { background-color: #f2f2f2; }
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; }
                }
            </style>
        </head>
        <body onload="window.print();">
            <div class="header-info">
                <h2>REKAP PANEN PER DIVISI</h2>
                <h3>ESTATE: ${estateNames}</h3>
                <h4>PERIODE: ${periodLabel}</h4>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>PERIODE</th>
                        <th>ESTATE</th>
                        <th>DIVISI</th>
                        <th>AVG<br>ROUND</th>
                        <th>AKP<br>(%)</th>
                        <th>PLAN<br>TOTAL JJG</th>
                        <th>PLAN<br>PANEN (KG)</th>
                        <th>ACT<br>TOTAL JJG</th>
                        <th>ACT<br>PANEN (KG)</th>
                        <th>ACT<br>HVR (HK)</th>
                        <th>PRESTASI<br>HA/ACT HVR</th>
                        <th>PRESTASI<br>KG/WD (KG/HK)</th>
                        <th>VAR<br>HA(%)</th>
                        <th>TURN OUT<br>(%)</th>
                        <th>ABW<br>(BJR ACTUAL)</th>
                    </tr>
                </thead>
                <tbody>
                    ${allTableRowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const printWin = window.open('', '', 'width=1200,height=800');
    if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
        document.getElementById('modal-print-rekap').remove();
    } else {
        alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak.");
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
    const allEstates = ['Bunga Tanjung Estate', 'Sungai Teramang Estate', 'Air Bikuk Estate', 'Air Buluh Estate', 'Malin Deman Estate', 'Batu Kuda Estate', 'Sungai Jerinjing Estate', 'Muko Muko Estate', 'Talang Petai Estate', 'Sungai Kiang Estate', 'Tanah Rekah Estate', 'Air Majunto Estate', 'Small Holder', 'Bunga Tanjung Mill', 'Muko Muko Mill'];
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
                        <option value="Supervisor Mill" ${user.role === 'Supervisor Mill' ? 'selected' : ''}>Supervisor Mill</option>
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

window.viewPemupukanSummary = (block, plan, tKg, tHa, tWorkers, rKg, rHa, rWorkers) => {
    const pKgHk = rWorkers > 0 ? (rKg / rWorkers).toFixed(1) : 0;
    const pHaHk = rWorkers > 0 ? (rHa / rWorkers).toFixed(2) : 0;
    const pKgHa = rHa > 0 ? (rKg / rHa).toFixed(1) : 0;

    const html = `
        <div class="modal-overlay" id="modal-summary">
            <div class="modal-content animate-fade-in" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Summary Pemupukan: ${block}</h3>
                    <button class="modal-close" onclick="document.getElementById('modal-summary').remove()">&times;</button>
                </div>
                <div style="margin-top: 15px;">
                    <div style="display:flex; gap:15px; margin-bottom:15px;">
                        <div style="flex:1; background: #e0f2fe; padding:15px; border-radius:8px; border-left: 4px solid #3b82f6;">
                            <h4 style="margin:0 0 10px 0; color:#1e3a8a; font-size:0.95rem;">Plan / Target</h4>
                            <div style="font-size:0.85rem; color:#1e40af; line-height:1.5;">
                                <div style="display:flex; justify-content:space-between;"><span>Pupuk (${plan}):</span> <strong>${tKg} Kg</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>Area:</span> <strong>${tHa} Ha</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>Pekerja:</span> <strong>${tWorkers} HK</strong></div>
                            </div>
                        </div>
                        <div style="flex:1; background: #dcfce7; padding:15px; border-radius:8px; border-left: 4px solid #10b981;">
                            <h4 style="margin:0 0 10px 0; color:#166534; font-size:0.95rem;">Realisasi</h4>
                            <div style="font-size:0.85rem; color:#15803d; line-height:1.5;">
                                <div style="display:flex; justify-content:space-between;"><span>Pupuk:</span> <strong>${rKg} Kg</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>Area:</span> <strong>${rHa} Ha</strong></div>
                                <div style="display:flex; justify-content:space-between;"><span>Pekerja:</span> <strong>${rWorkers} HK</strong></div>
                            </div>
                        </div>
                    </div>
                    <div style="background: #f8fafc; padding:15px; border-radius:8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin:0 0 10px 0; color:#334155; font-size:0.95rem; text-align:center;">Prestasi Pekerja & Dosis Aktual</h4>
                        <div style="display:flex; justify-content:space-around; text-align:center; margin-top:15px;">
                            <div>
                                <div style="font-size:1.2rem; font-weight:bold; color:#0f172a;">${pKgHk}</div>
                                <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase;">Kg / HK</div>
                            </div>
                            <div>
                                <div style="font-size:1.2rem; font-weight:bold; color:#0f172a;">${pHaHk}</div>
                                <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase;">Ha / HK</div>
                            </div>
                            <div>
                                <div style="font-size:1.2rem; font-weight:bold; color:#0f172a;">${pKgHa}</div>
                                <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase;">Kg / Ha</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
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
            if (res.ok) {
                await loadUsers();
            } else {
                alert('Gagal menghapus user');
            }
        } catch(e) { console.error(e); }
    }
};

window.resetHarvestingBlocks = () => {
    const container = document.getElementById('hd-blocks-container');
    if(!container) return;
    const rows = container.querySelectorAll('.hd-block-row');
    for(let i=1; i<rows.length; i++) {
        rows[i].remove();
    }
    const firstRow = rows[0];
    if(firstRow) {
        firstRow.querySelector('.hd-block-select').value = '';
        firstRow.querySelector('.hd-akp-input').value = '';
        firstRow.querySelector('.hd-pusingan-input').value = '';
    }
    calcHarvestingEstimate();
};

window.addHarvestingBlockRow = () => {
    const container = document.getElementById('hd-blocks-container');
    const firstRow = container.querySelector('.hd-block-row');
    if(!firstRow) return;
    
    const newRow = firstRow.cloneNode(true);
    newRow.querySelector('.hd-block-select').value = '';
    newRow.querySelector('.hd-akp-input').value = '';
    newRow.querySelector('.hd-pusingan-input').value = '';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger';
    removeBtn.innerHTML = '&times;';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '10px';
    removeBtn.style.right = '10px';
    removeBtn.style.padding = '2px 8px';
    removeBtn.style.background = '#ef4444';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '4px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.onclick = function() {
        newRow.remove();
        calcHarvestingEstimate();
    };
    newRow.appendChild(removeBtn);
    
    container.appendChild(newRow);
};

window.calcHarvestingEstimate = () => {
    const divisi = document.getElementById('hd-divisi').value;
    const rows = document.querySelectorAll('.hd-block-row');
    
    let totalJanjang = 0;
    let totalKg = 0;
    let totalHa = 0;
    
    rows.forEach(row => {
        const block = row.querySelector('.hd-block-select').value;
        const akp = parseFloat(row.querySelector('.hd-akp-input').value) || 0;
        
        const blockData = masterData.blok.find(b => b.name === block && b.divisi === divisi);
        if (blockData) {
            let rawTs = blockData.total_stand;
            if(typeof rawTs === 'string') rawTs = rawTs.replace(/,/g, '');
            const ts = parseFloat(rawTs) || 0;
            
            let rawBjr = blockData.bjr;
            if(typeof rawBjr === 'string') rawBjr = rawBjr.replace(/,/g, '');
            const bjr = parseFloat(rawBjr) || 0;
            
            const estJanjang = Math.round(ts * (akp / 100));
            const estKg = Math.round(estJanjang * bjr);
            
            totalJanjang += estJanjang;
            totalKg += estKg;
            
            let rawArea = blockData.gross_area;
            if(typeof rawArea === 'string') rawArea = rawArea.replace(/,/g, '');
            totalHa += parseFloat(rawArea) || 0;
        }
    });
    
    document.getElementById('hd-est-janjang').innerText = totalJanjang.toLocaleString('id-ID');
    document.getElementById('hd-est-kg').innerText = totalKg.toLocaleString('id-ID') + ' Kg';
    
    const pemanen = parseFloat(document.getElementById('hd-pemanen').value) || 0;
    if (pemanen > 0) {
        const kgHk = Math.round(totalKg / pemanen);
        const haHk = (totalHa / pemanen).toFixed(2);
        document.getElementById('hd-prestasi-kg').innerText = kgHk.toLocaleString('id-ID') + ' Kg';
        document.getElementById('hd-prestasi-ha').innerText = haHk + ' Ha';
    } else {
        document.getElementById('hd-prestasi-kg').innerText = '0 Kg';
        document.getElementById('hd-prestasi-ha').innerText = '0 Ha';
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
                            <th>AKP (%)</th>
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
        html += `<tr><td colspan="13" style="text-align:center;">Belum ada data historis</td></tr>`;
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
                    <td>${h.akp || '-'}</td>
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

window.printHistoryBulanan = (divisi, estate) => {
    const monthVal = document.getElementById('print-history-month').value;
    if (!monthVal) {
        alert("Pilih bulan terlebih dahulu untuk di-print!");
        return;
    }
    
    const [year, month] = monthVal.split('-');
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const monthName = monthNames[parseInt(month) - 1];
    
    let historyData = db.harvesting_daily.filter(h => h.divisi === divisi && (h.status === 'Selesai' || h.status === 'Closed'));
    if (estate) {
        historyData = historyData.filter(h => h.estate === estate);
    }
    
    historyData = historyData.filter(h => {
        let hDate = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        return hDate.startsWith(monthVal);
    });
    
    const dateMap = {};
    historyData.forEach(h => {
        const dStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        if(!dateMap[dStr]) {
            dateMap[dStr] = { date: dStr, planHvr: 0, planKg: 0, planJjg: 0, planPokok: 0, actHvr: 0, actHa: 0, actKg: 0, actJjg: 0, actPokok: 0, grossArea: 0, pusinganSum: 0, pusinganCount: 0, akpSum: 0, akpCount: 0, blocks: new Set() };
        }
        dateMap[dStr].planHvr += h.plan_pemanen || 0;
        dateMap[dStr].planKg += h.est_kg || 0;
        dateMap[dStr].planJjg += h.est_janjang || 0;
        dateMap[dStr].actHvr += h.realized_pemanen || 0;
        dateMap[dStr].actHa += h.realized_ha || 0;
        dateMap[dStr].actKg += h.realized_kg || 0;
        dateMap[dStr].actJjg += h.realized_janjang || 0;
        
        let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === divisi);
        if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
        const sph = (blockData && blockData.sph) ? parseFloat(blockData.sph) : 136;
        dateMap[dStr].actPokok += (h.realized_ha || 0) * sph;
        
        if (h.pusingan) { dateMap[dStr].pusinganSum += parseInt(h.pusingan) || 0; dateMap[dStr].pusinganCount++; }
        if (h.akp) {
            const akpVals = String(h.akp).split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            akpVals.forEach(v => { dateMap[dStr].akpSum += v; dateMap[dStr].akpCount++; });
        }
        if (!dateMap[dStr].blocks.has(h.block)) {
            dateMap[dStr].blocks.add(h.block);
            dateMap[dStr].grossArea += (blockData ? blockData.gross_area : 0);
            dateMap[dStr].planPokok += (blockData ? blockData.gross_area : 0) * sph;
        }
    });

    const dates = Object.values(dateMap).sort((a,b) => a.date.localeCompare(b.date));
    
    let totalPlanHvr = 0, totalPlanKg = 0, totalPlanJjg = 0;
    let totalActHvr = 0, totalActHa = 0, totalActKg = 0, totalActJjg = 0;
    
    let rowsHtml = '';
    if (dates.length === 0) {
        rowsHtml = `<tr><td colspan="17" style="text-align:center; padding: 10px; border: 1px solid #000;">Tidak ada data untuk bulan ${monthName} ${year}</td></tr>`;
    } else {
        dates.forEach(r => {
            let formattedDate = r.date;
            const d = new Date(r.date);
            if(!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                formattedDate = `${day} ${months[d.getMonth()]}`;
            }
            
            let varHvr = 0; if (r.planHvr > 0) varHvr = (r.actHvr / r.planHvr) * 100;
            let varHa = 0; if (r.grossArea > 0) varHa = (r.actHa / r.grossArea) * 100;
            const prestasiHvr = r.actHvr > 0 ? r.actKg / r.actHvr : 0;
            const kapasitasHa = r.actHvr > 0 ? r.actHa / r.actHvr : 0;
            const avgPusingan = r.pusinganCount > 0 ? (r.pusinganSum / r.pusinganCount).toFixed(1) : '-';
            const avgAkp = r.akpCount > 0 ? (r.akpSum / r.akpCount).toFixed(1) : '0.0';
            const bjrActual = r.actJjg > 0 ? (r.actKg / r.actJjg).toFixed(2) : '0.00';
            
            rowsHtml += `
                <tr>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${formattedDate}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;"><strong>${divisi}</strong></td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${avgPusingan}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${avgAkp}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.grossArea.toFixed(2)}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.planJjg}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.planKg}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.planHvr}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.actHa.toFixed(2)}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.actJjg}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.actKg}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.actHvr}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${kapasitasHa.toFixed(2)}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${prestasiHvr.toFixed(1)}</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${varHa.toFixed(1)}%</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${r.planJjg > 0 ? ((r.actJjg / r.planJjg)*100).toFixed(1) : '100.0'}%</td>
                    <td style="border: 1px solid #000; text-align:center; padding: 4px;">${bjrActual}</td>
                </tr>
            `;
            
            totalPlanHvr += r.planHvr;
            totalPlanKg += r.planKg;
            totalPlanJjg += r.planJjg;
            totalActHvr += r.actHvr;
            totalActHa += r.actHa;
            totalActKg += r.actKg;
            totalActJjg += r.actJjg;
        });
        
        const totalPrestasiHvr = totalActHvr > 0 ? totalActKg / totalActHvr : 0;
        const totalKapasitasHa = totalActHvr > 0 ? totalActHa / totalActHvr : 0;
        const totalBjr = totalActJjg > 0 ? (totalActKg / totalActJjg).toFixed(2) : '0.00';
        const totalTurnOut = totalPlanJjg > 0 ? ((totalActJjg / totalPlanJjg)*100).toFixed(1) : '100.0';
        
        rowsHtml += `
            <tr style="font-weight: bold; background-color: #f1f5f9;">
                <td colspan="5" style="text-align:center; border: 1px solid #000; padding: 6px;">TOTAL BULAN ${monthName.toUpperCase()}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalPlanJjg}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalPlanKg}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalPlanHvr}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalActHa.toFixed(2)}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalActJjg}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalActKg}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalActHvr}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalKapasitasHa.toFixed(2)}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalPrestasiHvr.toFixed(1)}</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">-</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalTurnOut}%</td>
                <td style="border: 1px solid #000; text-align:center; padding: 6px;">${totalBjr}</td>
            </tr>
        `;
    }
    
    let printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Print History Prestasi Divisi</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; font-size: 11px; }
                h2, h3, h4 { margin: 5px 0; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background-color: #f1f5f9; border: 1px solid #000; padding: 8px 4px; text-align: center; }
                td { border: 1px solid #000; padding: 4px; text-align: center; }
                @media print {
                    @page { margin: 10mm; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h2>LAPORAN HISTORIS PRESTASI DIVISI BULANAN</h2>
            <h3>ESTATE: ${estate ? getEstateCode(estate) : 'SEMUA'} - DIVISI: ${divisi}</h3>
            <h4>PERIODE: ${monthName.toUpperCase()} ${year}</h4>
            
            <table>
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>DIVISI</th>
                        <th>AVG<br>ROUND</th>
                        <th>AVG<br>AKP (%)</th>
                        <th>PLAN AREA<br>(HA)</th>
                        <th>PLAN<br>TOTAL JJG</th>
                        <th>PLAN<br>PANEN (KG)</th>
                        <th>PLAN<br>HVR (HK)</th>
                        <th>ACT AREA<br>(HA)</th>
                        <th>ACT<br>TOTAL JJG</th>
                        <th>ACT<br>PANEN (KG)</th>
                        <th>ACT<br>HVR (HK)</th>
                        <th>PRESTASI<br>HA/ACT HVR</th>
                        <th>PRESTASI<br>KG/WD (KG/HK)</th>
                        <th>VAR<br>HA(%)</th>
                        <th>TURN OUT<br>(%)</th>
                        <th>ABW<br>(BJR ACTUAL)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; display: flex; justify-content: flex-end; width: 100%;">
                <div style="text-align: center; width: 200px;">
                    <p>Dibuat Oleh,</p>
                    <br><br><br>
                    <p>(....................................)</p>
                </div>
            </div>
            
            <script>
                window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
};

window.openDivisiHistory = (divisi, date = null, estate = null) => {
    let historyData = db.harvesting_daily.filter(h => h.divisi === divisi && (h.status === 'Selesai' || h.status === 'Closed'));
    
    if (estate) {
        historyData = historyData.filter(h => h.estate === estate);
    }
    if (date) {
        historyData = historyData.filter(h => h.date === date);
    }
    
    const dateMap = {};
    historyData.forEach(h => {
        const dStr = typeof h.date === 'string' && h.date.includes('T') ? h.date.split('T')[0] : h.date;
        if(!dateMap[dStr]) {
            dateMap[dStr] = {
                date: dStr,
                planHvr: 0,
                planKg: 0,
                planJjg: 0,
                planPokok: 0,
                actHvr: 0,
                actHa: 0,
                actKg: 0,
                actJjg: 0,
                actPokok: 0,
                grossArea: 0,
                pusinganSum: 0,
                pusinganCount: 0,
                akpSum: 0,
                akpCount: 0,
                blocks: new Set()
            };
        }
        dateMap[dStr].planHvr += h.plan_pemanen || 0;
        dateMap[dStr].planKg += h.est_kg || 0;
        dateMap[dStr].planJjg += h.est_janjang || 0;
        dateMap[dStr].actHvr += h.realized_pemanen || 0;
        dateMap[dStr].actHa += h.realized_ha || 0;
        dateMap[dStr].actKg += h.realized_kg || 0;
        dateMap[dStr].actJjg += h.realized_janjang || 0;
        
        let blockData = masterData.blok.find(b => b.name === h.block && b.divisi === divisi);
        if (!blockData) blockData = masterData.blok.find(b => b.name === h.block);
        const sph = (blockData && blockData.sph) ? parseFloat(blockData.sph) : 136;
        dateMap[dStr].actPokok += (h.realized_ha || 0) * sph;
        
        if (h.pusingan) {
            dateMap[dStr].pusinganSum += parseInt(h.pusingan) || 0;
            dateMap[dStr].pusinganCount++;
        }
        
        if (h.akp) {
            const akpVals = String(h.akp).split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            akpVals.forEach(v => {
                dateMap[dStr].akpSum += v;
                dateMap[dStr].akpCount++;
            });
        }
        
        if (!dateMap[dStr].blocks.has(h.block)) {
            dateMap[dStr].blocks.add(h.block);
            dateMap[dStr].grossArea += (blockData ? blockData.gross_area : 0);
            dateMap[dStr].planPokok += (blockData ? blockData.gross_area : 0) * sph;
        }
    });

    const dates = Object.values(dateMap).sort((a,b) => b.date.localeCompare(a.date));

    let titleStr = `History Prestasi Divisi: ${divisi}`;
    if (date) {
        let dateStr = date;
        if(typeof dateStr === 'string' && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        let formattedDate = dateStr;
        const d = new Date(dateStr);
        if(!isNaN(d)) {
            const day = String(d.getDate()).padStart(2, '0');
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            formattedDate = `${day} ${months[d.getMonth()]}`;
        }
        titleStr = `Detail Prestasi Divisi: ${divisi} (${formattedDate})`;
    }
    if (estate) {
        titleStr += ` - ${getEstateCode(estate)}`;
    }

    let monthOptionsHtml = '';
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const dLocal = new Date(window.getLocalDate());
    const currentYear = dLocal.getFullYear();
    const currentMonthStr = String(dLocal.getMonth() + 1).padStart(2, '0');
    
    for (let i = 1; i <= 12; i++) {
        const mStr = String(i).padStart(2, '0');
        const ym = `${currentYear}-${mStr}`;
        const isSelected = (mStr === currentMonthStr) ? 'selected' : '';
        monthOptionsHtml += `<option value="${ym}" ${isSelected}>${monthNames[i-1]} ${currentYear}</option>`;
    }

    let html = `
        <div class="modal-overlay" id="modal-history-divisi">
            <div class="modal-content animate-fade-in" style="width:98vw; max-width:1500px; max-height:85vh; overflow-y:auto; padding: 20px;">
                <div class="modal-header" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; padding-right: 20px;">${titleStr}</h3>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 5px;">
                        <select id="print-history-month" class="form-control" style="width: auto; padding: 4px 8px; font-size: 0.9rem;" title="Pilih Bulan">
                            ${monthOptionsHtml}
                        </select>
                        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;" onclick="printHistoryBulanan('${divisi}', '${estate || ''}')"><i class="fa-solid fa-print"></i> Print Bulanan</button>
                        <button class="modal-close" onclick="document.getElementById('modal-history-divisi').remove()" style="margin-left: 10px;">&times;</button>
                    </div>
                </div>
                <div style="overflow-x: auto; width: 100%;">
                <table class="data-table table-compact" style="font-size:0.75rem; margin-top:15px; width:100%; border-collapse: collapse; min-width: 1200px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">DATE</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">DIVISI</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">AVG<br>ROUND</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">AVG<br>AKP (%)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN AREA<br>(HA)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN<br>TOTAL JJG</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN<br>PANEN (KG)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PLAN<br>HVR (HK)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">ACT AREA<br>(HA)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>TOTAL JJG</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>PANEN (KG)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">ACT<br>HVR (HK)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PRESTASI<br>HA/ACT HVR</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">PRESTASI<br>KG/WD (KG/HK)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">VAR<br>HA(%)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">TURN OUT<br>(%)</th>
                            <th style="border: 1px solid #cbd5e1; text-align:center;">ABW<br>(BJR ACTUAL)</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if(dates.length === 0) {
        html += `<tr><td colspan="17" style="text-align:center; border: 1px solid #cbd5e1;">Belum ada data historis divisi</td></tr>`;
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
            const avgAkp = r.akpCount > 0 ? (r.akpSum / r.akpCount).toFixed(1) : '0.0';
            
            const bjrActual = r.actJjg > 0 ? (r.actKg / r.actJjg).toFixed(2) : '0.00';
            
            html += `
                <tr>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${formattedDate}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;"><strong>${divisi}</strong></td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${avgPusingan}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${avgAkp}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.grossArea.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.planJjg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.planKg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.planHvr}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.actHa.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.actJjg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.actKg}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${r.actHvr}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${kapasitasHa.toFixed(2)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${prestasiHvr.toFixed(1)}</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; color:${varHa > 100 ? 'red' : (varHa < 100 ? 'green' : 'black')}; font-weight:bold;">${varHa.toFixed(1)}%</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center; color:${varHvr > 100 ? 'red' : (varHvr < 100 ? 'green' : 'black')}; font-weight:bold;">${varHvr.toFixed(1)}%</td>
                    <td style="border: 1px solid #cbd5e1; text-align:center;">${bjrActual}</td>
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
        const existing = (db.harvesting_monthly || []).find(m => m.divisi === divisi && m.month === month && (!m.estate || m.estate === currentUser.estate));
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
    let grossArea = 0;
    const blockNames = block ? block.split(',').map(s => s.trim()) : [];
    blockNames.forEach(bName => {
        let bData;
        if (divisi && divisi !== 'undefined') {
            bData = masterData.blok.find(b => b.name === bName && b.divisi === divisi);
        }
        if (!bData) bData = masterData.blok.find(b => b.name === bName); // fallback
        if (bData) {
            let area = bData.gross_area;
            if(typeof area === 'string') area = area.replace(/,/g, '');
            grossArea += parseFloat(area) || 0;
        }
    });
    
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
    
    const roleL = currentUser.role ? currentUser.role.toLowerCase() : '';
    const isGroupA = ['supir', 'krani divisi', 'kerani buah', 'krani mill', 'admin'].includes(roleL);
    const isGroupB = ['mandor', 'mandor divisi', 'asisten divisi', 'assistant', 'assistant divisi', 'asst divisi', 'admin'].includes(roleL);

    let formFieldsHtml = '';
    
    if (isGroupA) {
        formFieldsHtml += `
            <div style="grid-column: 1 / -1; background:#f0fdf4; padding:8px; border-radius:4px; font-weight:bold; margin-bottom:5px; border-left:4px solid #22c55e;">Input Ritase (Truk & Hasil Panen)</div>
            <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
                <label>Pilih Truk (Wajib jika isi ritase)</label>
                <select id="hr-truck" class="form-control">
                    <option value="" disabled selected>-- Pilih Truk Dialokasikan --</option>
                    ${allocatedTrucksOptions}
                </select>
                ${allocatedTrucks.size === 0 ? '<small style="color:#ef4444; font-size:0.8rem;">*Tidak ada truk dialokasikan di divisi ini.</small>' : ''}
            </div>
            <div style="grid-column: 1 / -1; margin-top: 5px; margin-bottom: 0;">
                <small style="color: #ef4444; font-weight: bold; font-style: italic;">*Input sesuai actual WB Mill</small>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label title="Opsional untuk Brondolan">Tambahan Janjang</label>
                <input type="number" id="hr-janjang" class="form-control" placeholder="0">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
                <label>Tambahan Kg</label>
                <input type="number" step="0.1" id="hr-kg" class="form-control" placeholder="0">
            </div>
        `;
    }
    
    if (isGroupB) {
        formFieldsHtml += `
            <div style="grid-column: 1 / -1; background:#fefce8; padding:8px; border-radius:4px; font-weight:bold; margin-bottom:5px; margin-top: ${isGroupA ? '10px' : '0'}; border-left:4px solid #eab308;">Input Realisasi Hektar, HK & Status</div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>HK Pemanen</label>
                <input type="number" id="hr-pemanen" class="form-control" placeholder="0" ${isPemanenLocked ? 'disabled style="background:#e2e8f0; cursor:not-allowed;" title="HK Pemanen sudah dilock karena cukup 1 kali input."' : ''}>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label>Luasan (Ha)</label>
                <input type="number" step="0.01" id="hr-ha" class="form-control" placeholder="0" ${isHaLocked ? 'disabled style="background:#e2e8f0; cursor:not-allowed;" title="Luasan Ha sudah dilock karena cukup 1 kali input."' : ''}>
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
    if (!confirm("Apakah input laporan sudah benar?")) return;
    
    const roleL = currentUser.role ? currentUser.role.toLowerCase() : '';
    const isGroupA = ['supir', 'krani divisi', 'kerani buah', 'krani mill', 'admin'].includes(roleL);
    const isGroupB = ['mandor', 'mandor divisi', 'asisten divisi', 'assistant', 'assistant divisi', 'asst divisi', 'admin'].includes(roleL);
    
    // Get current values
    const h = (db.harvesting_daily || []).find(x => x.id == id) || {};

    let truck = '';
    let addJanjang = 0;
    let addKg = 0;
    let addPemanen = 0;
    let addHa = 0;
    let status = h.status || 'In Progress';

    if (isGroupA) {
        addJanjang = parseFloat(document.getElementById('hr-janjang')?.value) || 0;
        addKg = parseFloat(document.getElementById('hr-kg')?.value) || 0;
        
        if (addJanjang > 0 || addKg > 0) {
            truck = document.getElementById('hr-truck')?.value;
            if (!truck) {
                alert("Pilih truk pengangkut terlebih dahulu untuk ritase ini!");
                return;
            }
        }
    }
    
    if (isGroupB) {
        const pEl = document.getElementById('hr-pemanen');
        if(pEl && !pEl.disabled) {
            addPemanen = parseInt(pEl.value) || 0;
        }
        const haEl = document.getElementById('hr-ha');
        if(haEl && !haEl.disabled) {
            addHa = parseFloat(haEl.value) || 0;
        }
        status = document.getElementById('hr-status')?.value || h.status;
    }
    
    if (addJanjang === 0 && addKg === 0 && addPemanen === 0 && addHa === 0 && status === h.status) {
        alert("Tidak ada data atau status yang diupdate.");
        return;
    }
    
    let grossArea = 0;
    const blockNames = h.block ? h.block.split(',').map(s => s.trim()) : [];
    blockNames.forEach(bName => {
        let bData;
        if (h.divisi && h.divisi !== 'undefined') {
            bData = masterData.blok.find(b => b.name === bName && b.divisi === h.divisi);
        }
        if (!bData) bData = masterData.blok.find(b => b.name === bName);
        if (bData) {
            let area = bData.gross_area;
            if(typeof area === 'string') area = area.replace(/,/g, '');
            grossArea += parseFloat(area) || 0;
        }
    });
    
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
        
        const blockEl = document.getElementById('u-block');
        const selectedOption = blockEl.options[blockEl.selectedIndex];
        const maxArea = selectedOption ? parseFloat(selectedOption.getAttribute('data-gross')) || 0 : 0;
        const targetHa = parseFloat(document.getElementById('u-target').value);
        
        if (maxArea > 0 && targetHa > maxArea) {
            alert(`Target luasan tidak boleh melebihi luasan blok ${blockEl.value} (Maksimal ${maxArea} Ha)`);
            return;
        }
        
        const payload = {
            block: blockEl.value,
            type: document.getElementById('u-type').value,
            target: parseFloat(document.getElementById('u-target').value),
            targetWorkers: parseInt(document.getElementById('u-workers').value) || 0,
            worker: document.getElementById('u-worker').value,
            startDate: document.getElementById('u-date').value,
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
            targetKg: parseFloat(document.getElementById('p-target').value) || 0,
            targetHa: parseFloat(document.getElementById('p-target-ha').value) || 0,
            targetWorkers: parseInt(document.getElementById('p-target-workers').value) || 0,
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
    
    // Auto-calculate Target Total for Pemupukan based on Dosis and Blok Total Stand
    const pDosis = document.getElementById('p-dosis');
    const pBlock = document.getElementById('p-block');
    const pTarget = document.getElementById('p-target');
    
    const calculatePemupukanTarget = () => {
        if (!pDosis || !pBlock || !pTarget) return;
        const dosis = parseFloat(pDosis.value) || 0;
        const blockName = pBlock.value;
        const pTargetHa = document.getElementById('p-target-ha');
        const pTargetWorkers = document.getElementById('p-target-workers');
        const pEstimate = document.getElementById('p-estimate');

        const updateEstimate = (targetVal, targetHaVal) => {
            if (!pEstimate || !pTargetWorkers) return;
            const workers = parseInt(pTargetWorkers.value) || 0;
            if (workers > 0 && targetVal > 0) {
                const estKg = (targetVal / workers).toFixed(1);
                const estHa = targetHaVal > 0 ? (targetHaVal / workers).toFixed(2) : 0;
                const estKgPerHa = targetHaVal > 0 ? (targetVal / targetHaVal).toFixed(1) : 0;
                pEstimate.innerHTML = `
                    <div style="margin-bottom: 3px;"><i class="fa-solid fa-leaf" style="width:16px;"></i> ${estKgPerHa} Kg Pupuk / Ha</div>
                    <div style="margin-bottom: 3px;"><i class="fa-solid fa-weight-hanging" style="width:16px;"></i> ${estKg} Kg Pupuk / HK</div>
                    <div><i class="fa-solid fa-map" style="width:16px;"></i> ${estHa} Prestasi Ha / HK</div>
                `;
                pEstimate.style.display = 'block';
            } else {
                pEstimate.style.display = 'none';
            }
        };

        if (!blockName || dosis <= 0) {
            pTarget.value = '';
            if (pTargetHa) pTargetHa.value = '';
            if (pEstimate) pEstimate.style.display = 'none';
            return;
        }
        
        // Get data safely from the selected option itself to prevent duplicate name mismatch
        const selectedOption = pBlock.options[pBlock.selectedIndex];
        if (selectedOption) {
            let totalStand = parseFloat(selectedOption.getAttribute('data-totalstand')) || 0;
            if (totalStand === 0) {
                const sph = parseFloat(selectedOption.getAttribute('data-sph')) || 0;
                const grossArea = parseFloat(selectedOption.getAttribute('data-gross')) || 0;
                totalStand = sph * grossArea;
            }
            const target = (dosis * totalStand).toFixed(1);
            pTarget.value = target;
            const targetHaVal = parseFloat(selectedOption.getAttribute('data-gross')) || 0;
            if (pTargetHa) pTargetHa.value = targetHaVal;
            updateEstimate(parseFloat(target), targetHaVal);
        } else {
            pTarget.value = '';
            if (pTargetHa) pTargetHa.value = '';
            if (pEstimate) pEstimate.style.display = 'none';
        }
    };
    
    if (pDosis) pDosis.addEventListener('input', calculatePemupukanTarget);
    if (pBlock) pBlock.addEventListener('change', calculatePemupukanTarget);
    const pTargetWorkersEl = document.getElementById('p-target-workers');
    if (pTargetWorkersEl) pTargetWorkersEl.addEventListener('input', calculatePemupukanTarget);

    const formPemupukanRealization = document.getElementById('form-pemupukan-realization');
    if(formPemupukanRealization) formPemupukanRealization.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('pr-id').value;
        const inputHa = parseFloat(document.getElementById('pr-input-ha').value) || 0;
        const planHaStr = document.getElementById('pr-plan-ha').innerText;
        const targetHa = parseFloat(planHaStr) || 0;

        if (inputHa > targetHa) {
            alert('Peringatan: Realisasi Area (Ha) tidak boleh melebihi Target Area (' + targetHa + ' Ha)!');
            return;
        }

        if (!confirm('Are you sure data is correct? Data yang tersimpan akan langsung menutup laporan dan status menjadi Selesai.')) {
            return;
        }

        const payload = {
            realizedKg: parseFloat(document.getElementById('pr-input-kg').value) || 0,
            realizedHa: inputHa,
            realizedWorkers: parseInt(document.getElementById('pr-input-workers').value) || 0
        };
        try {
            await fetch(`${API_URL}/pemupukan/${id}/add`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            formPemupukanRealization.reset();
            const modal = document.getElementById('modal-pemupukan-realization');
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
        const dateVal = document.getElementById('hd-date').value;
        const divisiVal = document.getElementById('hd-divisi').value;
        const pemanenVal = document.getElementById('hd-pemanen').value;
        
        if (!dateVal) { alert("Tanggal Rencana wajib diisi!"); return; }
        if (!divisiVal) { alert("Divisi wajib dipilih!"); return; }
        
        const rows = document.querySelectorAll('.hd-block-row');
        const blocks = [];
        const akps = [];
        const pusingans = [];
        let hasIncompleteBlock = false;
        
        rows.forEach(row => {
            const b = row.querySelector('.hd-block-select').value;
            const a = row.querySelector('.hd-akp-input').value;
            const p = row.querySelector('.hd-pusingan-input').value;
            if(b) {
                blocks.push(b);
                if (!a || !p) hasIncompleteBlock = true;
                akps.push(a);
                pusingans.push(p);
            }
        });
        
        if (blocks.length === 0) {
            alert("Minimal 1 Blok wajib dipilih!");
            return;
        }
        if (hasIncompleteBlock) {
            alert("Setiap blok yang dipilih wajib diisi nilai AKP dan Pusingan Panen!");
            return;
        }
        
        if (!pemanenVal || parseFloat(pemanenVal) <= 0) {
            alert("Alokasi Pemanen wajib diisi!");
            return;
        }
        
        const allocatedTrucks = window.selectedDailyTrucks || [];
        if (allocatedTrucks.length === 0) {
            alert("Alokasi Truk wajib dipilih minimal 1!");
            return;
        }
        
        const blockStr = blocks.join(', ');
        const akpStr = akps.join(', ');
        const pusinganStr = pusingans.join(', ');
        
        const estJanjang = parseInt(document.getElementById('hd-est-janjang').innerText.replace(/,/g, '').replace(/\./g, '')) || 0;
        const estKg = parseFloat(document.getElementById('hd-est-kg').innerText.replace(/,/g, '').replace(/\./g, '').replace(' Kg', '')) || 0;

        const payload = {
            date: document.getElementById('hd-date').value,
            estate: currentUser.estate,
            divisi: document.getElementById('hd-divisi').value,
            block: blockStr,
            akp: akpStr, // Send as string for multiple blocks
            est_janjang: estJanjang,
            est_kg: estKg,
            plan_pemanen: parseInt(document.getElementById('hd-pemanen').value),
            mandor: document.getElementById('hd-mandor').value,
            pusingan: pusinganStr, // Send as string for multiple blocks
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
        let resData = await window.parseTonaseResponse(res);
        
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
        const progressTimeSpan = document.getElementById('dashboard-progress-time');
        
        if (progressTimeSpan) {
            const now = new Date();
            let h = now.getHours();
            progressTimeSpan.innerText = `Pukul : ${h.toString().padStart(2, '0')}:00 Wib`;
        }

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

// Draggable Modal logic
function makeDraggable(modalId, headerId) {
    const modal = document.getElementById(modalId);
    const header = document.getElementById(headerId);
    if (!modal || !header) return;
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName.toLowerCase() === 'button') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.position = 'absolute';
            content.style.top = (content.offsetTop - pos2) + "px";
            content.style.left = (content.offsetLeft - pos1) + "px";
            content.style.margin = '0';
            content.style.transform = 'none';
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

let dashboardHistoricalChartInstance = null;
window.loadDashboardHistoricalChart = async () => {
    const dateInput = document.getElementById('dashboard-historical-date');
    if (!dateInput || !dateInput.value) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    const date = dateInput.value;
    
    document.getElementById('dashboard-historical-chart-container').style.display = 'block';
    const printBtn = document.getElementById('btn-print-historical');
    if (printBtn) printBtn.style.display = 'none';
    
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
        let tonaseData = await window.parseTonaseResponse(tonaseRes);
        
        const isMillUser = currentUser && currentUser.estate && currentUser.estate.endsWith('Mill');
        let displayName = 'Bunga Tanjung Mill';
        if (currentUser && currentUser.estate) {
            if (currentUser.estate === 'Semua Estate (Khusus Admin)') {
                displayName = 'Semua Estate';
            } else {
                displayName = currentUser.estate;
            }
        }
        
        const headerTitle = document.querySelector('#dashboard-historical-modal-header h2');
        if (headerTitle) {
            headerTitle.innerHTML = `<i class="fa-solid fa-arrows-up-down-left-right"></i> Historical Tonase TBS per Jam ${displayName}`;
        }
        
        if (!isMillUser && currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
            tonaseData = tonaseData.filter(item => item.estate === currentUser.estate);
        }
        
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const actualData = new Array(hours.length).fill(0);
        
        tonaseData.forEach(item => {
            const hIdx = hours.indexOf(item.time_hour);
            if (hIdx !== -1) {
                actualData[hIdx] += parseFloat(item.realized_kg) || 0;
            }
        });
        
        for (let i = 0; i < actualData.length; i++) {
            actualData[i] = actualData[i] / 1000;
        }
        
        const ctx = document.getElementById('dashboardHistoricalChartCanvas');
        if (!ctx) return;
        
        if (printBtn) printBtn.style.display = 'inline-block';
        
        if (dashboardHistoricalChartInstance) dashboardHistoricalChartInstance.destroy();
        
        dashboardHistoricalChartInstance = new Chart(ctx, {
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
                        ticks: { stepSize: 40 } 
                    } 
                }
            }
        });
        
    } catch(e) {
        console.error('Error loading dashboard historical chart:', e);
        alert('Gagal memuat data historical');
    }
};

window.printHistoricalChart = () => {
    const canvas = document.getElementById('dashboardHistoricalChartCanvas');
    if (!canvas) return;
    
    const imgData = canvas.toDataURL('image/png');
    const titleEl = document.querySelector('#dashboard-historical-modal-header h2');
    const title = titleEl ? titleEl.innerText : 'Historical Tonase TBS';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Tolong izinkan popup browser untuk fitur cetak');
        return;
    }
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print - ${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    img { max-width: 100%; height: auto; margin-top: 20px; }
                    h2 { color: #333; }
                    @media print {
                        @page { size: landscape; }
                        body { padding: 0; margin: 0; }
                    }
                </style>
            </head>
            <body>
                <h2>${title}</h2>
                <img src="${imgData}" />
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

// Apply draggable logic once DOM is loaded or when opened
setTimeout(() => {
    makeDraggable('dashboard-historical-modal', 'dashboard-historical-modal-header');
}, 1000);

// Navigation
const navigate = (viewId) => {
    // Cleanup any orphaned modals in body from previous views to prevent duplicate IDs
    document.querySelectorAll('body > .modal-overlay').forEach(m => m.remove());
    
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
    if(viewId === 'master') {
        if (currentUser && (currentUser.role === 'Senior Field Manager' || currentUser.role === 'Manager')) {
            const masterGrid = document.querySelector('.master-grid');
            if (masterGrid) {
                masterGrid.classList.add('master-read-only');
            }
        }
    }
    if(viewId === 'tonase') {
        if (currentUser.role === 'Krani Mill' || currentUser.role === 'Supervisor Mill' || currentUser.role === 'Manager Mill' || currentUser.role === 'Admin' || currentUser.role === 'Office Assistant Mill') {
            document.querySelectorAll('.btn-tonase-action').forEach(b => b.style.display = 'inline-block');
            if (!document.getElementById('t-date').value) {
                document.getElementById('t-date').value = window.getLocalDate();
            }
        } else {
            document.querySelectorAll('.btn-tonase-action').forEach(b => b.style.display = 'none');
        }

        // Auto select current hour
        const hourDropdown = document.getElementById('monitor-tonase-hour');
        if (hourDropdown) {
            const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';
            let optionExists = false;
            for (let i = 0; i < hourDropdown.options.length; i++) {
                if (hourDropdown.options[i].value === currentHour) {
                    optionExists = true;
                    break;
                }
            }
            if (optionExists) {
                hourDropdown.value = currentHour;
            }
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
    if (scCard) scCard.style.display = (isMill && currentUser.role !== 'Supervisor Mill') ? 'block' : 'none';
    
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
        filteredBloks.map(b => `<option value="${b.name}" data-bjr="${b.bjr}" data-totalstand="${b.total_stand}" data-sph="${b.sph}" data-gross="${b.gross_area}">${b.name}</option>`).join('');
    elBlok.innerHTML = blokOpts;
    
    if (targetId === 'h-block') {
        onHarvestingBlockChange('');
    } else if (targetId === 'hd-block') {
        const akpEl = document.getElementById('hd-akp');
        if(akpEl) akpEl.value = '';
        document.getElementById('hd-est-janjang').innerText = '0';
        document.getElementById('hd-est-kg').innerText = '0 Kg';
    } else if (targetId === 'u-block') {
        updateUpkeepMaxLabel();
    }
};

window.updateUpkeepMaxLabel = () => {
    const blockEl = document.getElementById('u-block');
    const labelSpan = document.getElementById('u-target-max-label');
    if (!blockEl || !labelSpan) return;
    
    if (blockEl.selectedIndex >= 0) {
        const selectedOption = blockEl.options[blockEl.selectedIndex];
        const maxArea = parseFloat(selectedOption.getAttribute('data-gross')) || 0;
        if (maxArea > 0) {
            labelSpan.innerText = `*maksimal Hektar Blok dipilih ${maxArea} Ha`;
            const targetInput = document.getElementById('u-target');
            if (targetInput) {
                targetInput.value = maxArea;
                if(typeof calcPrestasiUpkeepPlan === 'function') calcPrestasiUpkeepPlan();
            }
        } else {
            labelSpan.innerText = '';
        }
    } else {
        labelSpan.innerText = '';
    }
};

window.populateSelects = () => {
    const elDivisi = document.querySelectorAll('.select-divisi');
    const divisiOpts = `<option value="">-- Semua Divisi --</option>` + 
        masterData.divisi.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    elDivisi.forEach(el => el.innerHTML = divisiOpts);

    const elBlok = document.querySelectorAll('.select-blok');
    const blokOpts = `<option value="" disabled selected>-- Pilih Blok --</option>` + 
        masterData.blok.map(b => `<option value="${b.name}" data-bjr="${b.bjr}" data-totalstand="${b.total_stand}" data-sph="${b.sph}" data-gross="${b.gross_area}">${b.name}</option>`).join('');
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
            <div class="modal-content" style="width: 95%; max-width: 1200px;">
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
    if (name.includes('MALIN DEMAN')) return 'MDEE';
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

// Removed duplicate updateLocationList

window.promptAddUpkeepProgress = (id, block, type, target, realized, targetWorkers) => {
    const modalId = 'modal-upkeep-progress-' + id;
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const today = window.getLocalDate();
    const sisa = Math.max(0, target - realized).toFixed(2);

    let blockData = masterData.blok.find(b => b.name === block);
    const grossArea = blockData ? blockData.gross_area : 0;

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
                    <strong>Target Hektar (Ha):</strong> ${target} Ha (Luas Blok: ${grossArea} Ha)<br>
                    <strong>Rencana Man Power (HK):</strong> ${targetWorkers || 0} Orang
                </div>
                <form id="form-upkeep-add-${id}" onsubmit="submitUpkeepProgress(event, ${id})">
                    <div class="form-group">
                        <label>Realisasi (Ha)</label>
                        <input type="number" step="0.01" id="upkeep-add-${id}" class="form-control" required placeholder="Contoh: 2.5" max="${sisa}" oninput="calcPrestasiUpkeep(${id})">
                    </div>
                    <div class="form-group">
                        <label>Jumlah Pekerja (Orang)</label>
                        <input type="number" id="upkeep-workers-${id}" class="form-control" required placeholder="Contoh: 5" oninput="calcPrestasiUpkeep(${id})">
                    </div>
                    <div class="form-group" style="background:#e0f2fe; padding:8px; border-radius:4px; margin-bottom: 10px;">
                        <label style="margin-bottom:0; font-size: 0.9rem;">Prestasi Pekerja: <strong id="upkeep-prestasi-${id}" style="color:#0369a1;">-</strong></label>
                    </div>
                    <input type="hidden" id="upkeep-date-${id}" value="${today}">
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

window.calcPrestasiUpkeep = (id) => {
    const haEl = document.getElementById(`upkeep-add-${id}`);
    const hkEl = document.getElementById(`upkeep-workers-${id}`);
    const prestasiEl = document.getElementById(`upkeep-prestasi-${id}`);
    
    if (haEl && hkEl && prestasiEl) {
        const haStr = haEl.value.trim();
        const hkStr = hkEl.value.trim();
        const ha = parseFloat(haStr) || 0;
        const hk = parseFloat(hkStr) || 0;
        
        if (haStr !== '' && hkStr !== '' && hk > 0) {
            prestasiEl.innerText = (ha / hk).toFixed(2) + " Ha/HK";
        } else {
            prestasiEl.innerText = "-";
        }
    }
};

window.calcPrestasiUpkeepPlan = () => {
    const haEl = document.getElementById('u-target');
    const hkEl = document.getElementById('u-workers');
    const prestasiEl = document.getElementById('u-prestasi-plan');
    
    if (haEl && hkEl && prestasiEl) {
        const haStr = haEl.value.trim();
        const hkStr = hkEl.value.trim();
        const ha = parseFloat(haStr) || 0;
        const hk = parseFloat(hkStr) || 0;
        
        if (haStr !== '' && hkStr !== '' && hk > 0) {
            prestasiEl.innerText = (ha / hk).toFixed(2) + " Ha/HK";
        } else {
            prestasiEl.innerText = "-";
        }
    }
};

window.submitUpkeepProgress = async (e, id) => {
    e.preventDefault();
    if (!confirm("Sudah yakin inputan benar?")) return;

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
            // Automatically close the upkeep since it's a one-time entry
            await fetch(`${API_URL}/upkeep/${id}/close`, { method: 'PUT' });
            
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
        const tonaseData = await window.parseTonaseResponse(res);
        
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
    let modal = document.getElementById('tonase-modal');
    if (modal && modal.parentElement && modal.parentElement.tagName !== 'BODY') {
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    
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
    const visibleModal = Array.from(document.querySelectorAll('#tonase-modal')).find(m => m.style.display !== 'none');
    if (!visibleModal) return;
    
    const inputs = Array.from(visibleModal.querySelectorAll('.tonase-input'));
    const totals = {};
    const visibleHours = new Set();
    
    // Sum inputs currently on screen
    inputs.forEach(input => {
        const est = input.getAttribute('data-estate');
        const hour = input.getAttribute('data-hour');
        visibleHours.add(hour);
        const val = parseFloat(input.value) || 0;
        totals[est] = (totals[est] || 0) + val;
    });
    
    const hoursArr = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
    let maxHourIdx = -1;
    visibleHours.forEach(h => {
        const idx = hoursArr.indexOf(h);
        if (idx > maxHourIdx) maxHourIdx = idx;
    });

    // Add historical data from cache for hours that are NOT on screen, but ONLY up to the max visible hour
    if (window.tonaseDataCache) {
        window.tonaseDataCache.forEach(t => {
            const tIdx = hoursArr.indexOf(t.time_hour);
            if (tIdx <= maxHourIdx && !visibleHours.has(t.time_hour)) {
                let rawVal = window.tonaseMode === 'plan' ? t.target_kg : t.realized_kg;
                let val = parseFloat((parseFloat(rawVal || 0) / 1000).toFixed(2)) || 0;
                totals[t.estate] = (totals[t.estate] || 0) + val;
            }
        });
    }
    
    // Default to 0 for supply chain if undefined
    if (window.supplyChain) {
        window.supplyChain.forEach(est => {
            if (totals[est] === undefined) totals[est] = 0;
        });
    }
    
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
    
    const tds = Array.from(tr.querySelectorAll('td')).filter(el => el.querySelector('input.tonase-input, input.tonase-trip-input'));
    const startColIdx = tds.indexOf(td);
    
    rows.forEach((row, i) => {
        const rowIdx = startRowIdx + i;
        if (rowIdx >= 0 && rowIdx < trs.length) {
            const currentTr = trs[rowIdx];
            const currentTds = Array.from(currentTr.querySelectorAll('td')).filter(el => el.querySelector('input.tonase-input, input.tonase-trip-input'));
            
            row.forEach((cellVal, j) => {
                const colIdx = startColIdx + j;
                if (colIdx >= 0 && colIdx < currentTds.length) {
                    const input = currentTds[colIdx].querySelector('input.tonase-input, input.tonase-trip-input');
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
        const tonaseData = await window.parseTonaseResponse(tonaseRes);
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
            <div style="overflow-x: auto; max-width: 100%; padding-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
            <table class="data-table" style="min-width: 600px; border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="min-width: 60px; position: sticky; left: 0; top: 0; background: #ffffff; z-index: 11; border-bottom: 2px solid #ddd; padding: 8px;">JAM</th>
        `;
        supplyChain.forEach(est => {
            let thText = est.toUpperCase();
            html += `<th style="position: sticky; top: 0; background: #ffffff; z-index: 10; min-width: 100px; border-bottom: 2px solid #ddd; padding: 8px; font-size: 0.8rem;">${thText}</th>`;
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
                    if (val === 0 || isNaN(val)) val = '';
                }
                html += `
                    <td style="padding: 4px;">
                        <input type="number" step="0.01" class="form-control tonase-input" data-estate="${est}" data-hour="${hour}" value="${val}" min="0" placeholder="" style="min-width: 80px; width: 100%; padding: 6px; text-align: center; font-size: 0.9rem;">
                    </td>
                `;
            });
            html += `</tr>`;
        });
        
        if (window.tonaseMode === 'realization') {
            html += `<tr><td style="font-weight:bold; position: sticky; left: 0; background: #fff;">TOTAL RITASE</td>`;
            supplyChain.forEach(est => {
                const hour = hours[0];
                const existing = tonaseData.find(t => t.estate === est && t.time_hour === hour);
                let valTrip = '';
                if (existing && existing.realized_trip) {
                    valTrip = parseInt(existing.realized_trip);
                    if (valTrip === 0 || isNaN(valTrip)) valTrip = '';
                }
                html += `
                    <td style="padding: 4px;">
                        <input type="number" class="form-control tonase-trip-input" data-estate="${est}" data-hour="${hour}" value="${valTrip}" min="0" placeholder="" style="min-width: 80px; width: 100%; padding: 6px; text-align: center; font-size: 0.9rem;">
                    </td>
                `;
            });
            html += `</tr>`;
        }
        html += `</tbody>`;
        
        html += `<tfoot style="background-color: #f1f5f9; position: sticky; bottom: 0; z-index: 10;">
            <tr>
                <td style="font-weight:bold; position: sticky; left: 0; background-color: #f1f5f9; padding: 8px;">TOTAL (AKUMULASI)</td>
        `;
        supplyChain.forEach(est => {
            const cleanEstClass = est.replace(/[^a-zA-Z0-9]/g, '-');
            html += `<td style="font-weight:bold; padding: 8px; text-align:center; color: var(--primary-color);" id="tonase-total-${cleanEstClass}">0</td>`;
        });
        html += `</tr></tfoot>`;
        
        html += `</table></div>`;
        
        if (window.tonaseMode === 'plan') {
            const dmRes = await fetch(`${API_URL}/daily-monitor/${mill}/${date}`);
            let efbData = [];
            if (dmRes.ok) {
                const dmData = await dmRes.json();
                efbData = dmData.efb || [];
            }
            
            html += `<h4 style="margin-top: 25px; margin-bottom: 10px; color: var(--primary-color);">TARGET EFB (TONASE HARIAN)</h4>`;
            html += `<div style="overflow-x: auto; max-width: 100%; padding-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
            <table class="data-table" style="min-width: 600px; border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="min-width: 60px; background: #f8cbad; border-bottom: 2px solid #ddd; padding: 8px;">TARGET</th>`;
            supplyChain.forEach(est => {
                html += `<th style="background: #f8cbad; min-width: 100px; border-bottom: 2px solid #ddd; padding: 8px; font-size: 0.8rem;">${est.toUpperCase()}</th>`;
            });
            html += `</tr></thead><tbody><tr>`;
            html += `<td style="font-weight:bold; background: #fff;">TONASE</td>`;
            
            const canEditEfb = currentUser && ['Admin', 'Office Assistant Mill', 'Supervisor Mill', 'Manager Mill'].includes(currentUser.role);
            const disableAttrEfb = canEditEfb ? '' : 'disabled title="Akses ditolak. Hanya Office Assistant Mill, Supervisor Mill, dan Manager Mill yang dapat mengisi ini."';

            supplyChain.forEach(est => {
                const existingEfb = efbData.find(e => e.estate === est);
                let valEfb = '';
                if (existingEfb && existingEfb.target) {
                    valEfb = parseFloat(existingEfb.target);
                }
                html += `
                    <td style="padding: 4px;">
                        <input type="number" step="0.01" class="form-control efb-target-input" data-estate="${est}" value="${valEfb}" min="0" placeholder="" style="min-width: 80px; width: 100%; padding: 6px; text-align: center; font-size: 0.9rem;" ${disableAttrEfb}>
                    </td>
                `;
            });
            html += `</tr></tbody></table></div>`;
        }
        
        container.innerHTML = html;
        calculateTonaseTotals();
        
        const inputs = container.querySelectorAll('.tonase-input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateTonaseTotals);
            input.addEventListener('paste', handleTonasePaste);
        });
        
        const tripInputs = container.querySelectorAll('.tonase-trip-input');
        tripInputs.forEach(input => {
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
    
    // Fix duplicate modal bug by ONLY selecting inputs from the VISIBLE modal
    const visibleModal = Array.from(document.querySelectorAll('#tonase-modal')).find(m => m.style.display !== 'none');
    if (!visibleModal) {
        alert("Error: Modal tidak ditemukan.");
        return;
    }
    const inputs = visibleModal.querySelectorAll('.tonase-input');
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
            const tripInput = document.querySelector(`.tonase-trip-input[data-estate="${est}"][data-hour="${hour}"]`);
            let tripVal = 0;
            if (tripInput) {
                tripVal = parseInt(tripInput.value) || 0;
            }
            entries.push({ time_hour: hour, estate: est, realized_kg: val, realized_trip: tripVal });
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
        
        let efbSuccess = true;
        if (window.tonaseMode === 'plan') {
            const efbInputs = document.querySelectorAll('.efb-target-input');
            if (efbInputs.length > 0) {
                const efbEntries = [];
                efbInputs.forEach(inp => {
                    const est = inp.getAttribute('data-estate');
                    let targetVal = parseFloat(inp.value);
                    if (isNaN(targetVal)) targetVal = 0;
                    efbEntries.push({ estate: est, target: targetVal });
                });
                
                if (efbEntries.length > 0) {
                    const efbRes = await fetch(`${API_URL}/daily-monitor/efb`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date, mill, entries: efbEntries })
                    });
                    const efbData = await efbRes.json();
                    if (!efbData.success) efbSuccess = false;
                }
            }
        }
        
        if (data.success && efbSuccess) {
            alert('Data berhasil disimpan!');
            document.getElementById('tonase-modal').style.display = 'none';
            if (window.tonaseMode === 'realization') {
                const selectedHour = document.getElementById('t-hour').value;
                if (selectedHour) {
                    const dashboardHourSelect = document.getElementById('monitor-tonase-hour');
                    if (dashboardHourSelect) {
                        dashboardHourSelect.value = selectedHour;
                    }
                }
            }
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
        const tonaseData = await window.parseTonaseResponse(res);
        
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
        
        const [masterRes, tonaseRes, dmRes] = await Promise.all([
            fetch(`${API_URL}/master/${mill}`),
            fetch(`${API_URL}/tonase/${mill}/${date}`),
            fetch(`${API_URL}/daily-monitor/${mill}/${date}`)
        ]);
        
        const masterData = await masterRes.json();
        const tonaseData = await window.parseTonaseResponse(tonaseRes);
        const dmData = await dmRes.json();
        const lfData = dmData.lf || [];
        
        const supplyChain = masterData.supply_chain.map(s => s.estate);
        
        if (supplyChain.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Belum ada supply chain.</div>';
            return;
        }
        
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const hourIdx = hour ? hours.indexOf(hour) : -1;
        
        let html = `
            <table class="data-table" style="min-width: 500px; text-align: right;">
                <thead style="background-color: #333; color: white; text-align: center; font-size: 13px;">
                    <tr>
                        <th colspan="8" style="background-color: #dcfce7; color: #166534; border-bottom: 2px solid #ccc; font-weight: bold; padding: 6px;">FRESH FRUIT BUNCH</th>
                        <th colspan="2" style="background-color: #ffedd5; color: #9a3412; border-bottom: 2px solid #ccc; font-weight: bold; padding: 6px;">LOOSE FRUIT</th>
                    </tr>
                    <tr>
                        <th style="position: sticky; left: 0; background-color: #000; color: #fff; z-index: 10; text-align: left; width: 60px;">ESTATE</th>
                        <th style="background-color: #000; color: #fff; width: 70px;">ACTUAL<br>PER JAM</th>
                        <th style="background-color: #000; color: #fff; width: 60px;">ACTUAL<br>TRIP</th>
                        <th style="background-color: #ffe600; color: #000; width: 80px;">ACT DTD<br>(TON)</th>
                        <th style="background-color: #87ceeb; color: #000; width: 80px;">PLAN / JAM<br>(MT)</th>
                        <th style="background-color: #90ee90; color: #000; width: 80px;">% ACT VS<br>PLAN PER JAM</th>
                        <th style="background-color: #87ceeb; color: #000; width: 80px;">TODAY<br>PLAN (TON)</th>
                        <th style="background-color: #ffe600; color: #000; width: 80px;">% REAL VS<br>PLAN</th>
                        <th style="background-color: #000; color: #fff; width: 80px;">ACTUAL LF<br>ONLY</th>
                        <th style="background-color: #000; color: #fff; width: 80px;">PERSENTASE<br>LF</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalActJam = 0, totalActAkumulasi = 0, totalPlanJam = 0, totalTodayPlan = 0, totalActLf = 0, totalActTripAkumulasi = 0;
        let estateFfbAkumulasiMap = {};
        
        const abbrMap = {
            'Bunga Tanjung Estate': 'BTEE',
            'Air Bikuk Estate': 'ABKE',
            'Air Buluh Estate': 'ABEE',
            'Malin Deman Estate': 'MDEE',
            'Sungai Teramang Estate': 'STGE',
            'KMD': 'KMD',
            'KHJLT': 'KHJLT',
            'PLAB': 'PLAB',
            'PLAM': 'PLAM',
            'Small Holder': '3rd Prty'
        };
        const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

        supplyChain.forEach(est => {
            const dataEst = tonaseData.filter(t => t.estate === est);
            
            let actJam = 0, planJam = 0, actAkumulasi = 0, todayPlan = 0, actTripAkumulasi = 0;
            
            if (isHistorical) {
                // Actual akumulasi for the whole day
                dataEst.forEach(t => {
                    actAkumulasi += ((parseFloat(t.realized_kg) || 0) / 1000);
                    actTripAkumulasi += (parseInt(t.realized_trip) || 0);
                });
                
                // Today plan for the whole day
                dataEst.forEach(t => todayPlan += ((parseFloat(t.target_kg) || 0) / 1000));
            } else {
                // Actual per jam
                const actJamRow = dataEst.find(t => t.time_hour === hour);
                actJam = actJamRow ? ((parseFloat(actJamRow.realized_kg) || 0) / 1000) : 0;
                
                // Actual akumulasi (from 06:00 up to selected hour)
                for (let i = 0; i <= hourIdx; i++) {
                    const r = dataEst.find(t => t.time_hour === hours[i]);
                    if (r) {
                        actAkumulasi += ((parseFloat(r.realized_kg) || 0) / 1000);
                        actTripAkumulasi += (parseInt(r.realized_trip) || 0);
                    }
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
            totalActTripAkumulasi += actTripAkumulasi;
            estateFfbAkumulasiMap[est] = actAkumulasi;
            
            const lRow = lfData.find(x => x.estate === est);
            const actLf = lRow ? (parseFloat(lRow.actual_lf_tonase) || 0) : 0;
            const pctLf = actAkumulasi > 0 ? (actLf / actAkumulasi * 100) : 0;
            totalActLf += actLf;
            
            if (isHistorical) {
                html += `
                    <tr>
                        <td style="position: sticky; left: 0; background-color: #fff; text-align: left;">${getAbbr(est)}</td>
                        <td>-</td>
                        <td>${actTripAkumulasi > 0 ? actTripAkumulasi : '-'}</td>
                        <td style="background-color: #fffacd;">${actAkumulasi > 0 ? actAkumulasi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #e0f7fa;">-</td>
                        <td style="background-color: #fff;">-</td>
                        <td style="background-color: #e0f7fa;">${todayPlan > 0 ? todayPlan.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #fffacd;">${pctActVsTodayPlan === Infinity ? '∞' : pctActVsTodayPlan.toFixed(2) + '%'}</td>
                        <td style="background-color: #fff;">${actLf > 0 ? actLf.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #fff;">${actLf > 0 ? pctLf.toFixed(2) + '%' : '0.00%'}</td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td style="position: sticky; left: 0; background-color: #fff; text-align: left;">${getAbbr(est)}</td>
                        <td>${actJam > 0 ? actJam.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td>${actTripAkumulasi > 0 ? actTripAkumulasi : '-'}</td>
                        <td style="background-color: #fffacd;">${actAkumulasi > 0 ? actAkumulasi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #e0f7fa;">${planJam > 0 ? planJam.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: ${pctActVsPlanJam >= 100 ? '#90ee90' : (pctActVsPlanJam === 0 ? '#90ee90' : '#ff0000')}; color: #000;">
                            ${pctActVsPlanJam === Infinity ? '∞' : pctActVsPlanJam.toFixed(2) + '%'}
                        </td>
                        <td style="background-color: #e0f7fa;">${todayPlan > 0 ? todayPlan.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #fffacd;">${pctActVsTodayPlan === Infinity ? '∞' : pctActVsTodayPlan.toFixed(2) + '%'}</td>
                        <td style="background-color: #fff;">${actLf > 0 ? actLf.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td style="background-color: #fff;">${actLf > 0 ? pctLf.toFixed(2) + '%' : '0.00%'}</td>
                    </tr>
                `;
            }
        });
        
        // Total row
        const totalPctActVsPlanJam = (!isHistorical && totalPlanJam > 0) ? (totalActJam / totalPlanJam * 100) : ((!isHistorical && totalActJam > 0) ? Infinity : 0);
        const totalPctActVsTodayPlan = totalTodayPlan > 0 ? (totalActAkumulasi / totalTodayPlan * 100) : (totalActAkumulasi > 0 ? Infinity : 0);
        const totalPctLf = totalActAkumulasi > 0 ? (totalActLf / totalActAkumulasi * 100) : 0;
        
        if (isHistorical) {
            html += `
                    <tr style="font-weight: bold;">
                        <td style="position: sticky; left: 0; background-color: #f8cbad; text-align: left;">TOTAL</td>
                        <td style="background-color: #fff;">-</td>
                        <td style="background-color: #fff;">${totalActTripAkumulasi > 0 ? totalActTripAkumulasi : '-'}</td>
                        <td style="background-color: #ffe600;">${totalActAkumulasi > 0 ? totalActAkumulasi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #87ceeb;">-</td>
                        <td style="background-color: #90ee90;">-</td>
                        <td style="background-color: #87ceeb;">${totalTodayPlan > 0 ? totalTodayPlan.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #ffe600;">${totalPctActVsTodayPlan === Infinity ? '∞' : totalPctActVsTodayPlan.toFixed(2) + '%'}</td>
                        <td style="background-color: #fff;">${totalActLf > 0 ? totalActLf.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #fff;">${totalActLf > 0 ? totalPctLf.toFixed(2) + '%' : '0.00%'}</td>
                    </tr>
                </tbody></table>
            `;
        } else {
            html += `
                    <tr style="font-weight: bold;">
                        <td style="position: sticky; left: 0; background-color: #f8cbad; text-align: left;">TOTAL</td>
                        <td style="background-color: #fff;">${totalActJam > 0 ? totalActJam.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #fff;">${totalActTripAkumulasi > 0 ? totalActTripAkumulasi : '-'}</td>
                        <td style="background-color: #ffe600;">${totalActAkumulasi > 0 ? totalActAkumulasi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #87ceeb;">${totalPlanJam > 0 ? totalPlanJam.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: ${totalPctActVsPlanJam >= 100 ? '#90ee90' : (totalPctActVsPlanJam === 0 ? '#90ee90' : '#ff0000')}; color: #000;">
                            ${totalPctActVsPlanJam === Infinity ? '∞' : totalPctActVsPlanJam.toFixed(2) + '%'}
                        </td>
                        <td style="background-color: #87ceeb;">${totalTodayPlan > 0 ? totalTodayPlan.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #ffe600;">${totalPctActVsTodayPlan === Infinity ? '∞' : totalPctActVsTodayPlan.toFixed(2) + '%'}</td>
                        <td style="background-color: #fff;">${totalActLf > 0 ? totalActLf.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                        <td style="background-color: #fff;">${totalActLf > 0 ? totalPctLf.toFixed(2) + '%' : '0.00%'}</td>
                    </tr>
                </tbody></table>
            `;
        }
        
        container.innerHTML = html;
        
        // Update summary info
        const dateInput = document.getElementById('monitor-tonase-date');
        const hourInput = document.getElementById('monitor-tonase-hour');
        
        if (dateInput && dateInput.value) {
            const parts = dateInput.value.split('-');
            if (parts.length === 3) {
                document.getElementById('summary-tanggal').innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        if (hourInput && hourInput.value) {
            document.getElementById('summary-jam').innerText = hourInput.value;
        }
        const st = document.getElementById('summary-total');
        if (st) {
            st.innerText = totalActAkumulasi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
        
        if (typeof window.loadPrimeTimeChart === 'function') {
            window.loadPrimeTimeChart();
        }
        
        // Call render daily monitor tables
        if (!isHistorical && typeof window.renderDailyMonitorTables === 'function') {
            window.renderDailyMonitorTables(mill, date, supplyChain, totalActAkumulasi, estateFfbAkumulasiMap);
        }
        
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Gagal memuat tabel monitoring.</div>';
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
        const data = await window.parseTonaseResponse(res);
        
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
        
        if (typeof window.renderDailyArrivalTable === 'function') {
            window.renderDailyArrivalTable();
        }
    } catch(e) {
        console.error('Error loading prime time chart:', e);
    }
};

window.renderDailyArrivalTable = async () => {
    const dateInput = document.getElementById('daily-arrival-date');
    if (!dateInput) return;
    
    if (!dateInput.value) {
        // Fallback to monitor tonase date if available, otherwise today
        const mainDate = document.getElementById('monitor-tonase-date');
        if (mainDate && mainDate.value) {
            dateInput.value = mainDate.value;
        } else {
            dateInput.value = window.getLocalDate();
        }
    }
    const date = dateInput.value;
    
    const tbody = document.getElementById('tbody-daily-arrival');
    const tfoot = document.getElementById('tfoot-daily-arrival');
    if (!tbody || !tfoot) return;
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        
        const primeSel = document.getElementById('prime-estate');
        const selectedEstate = primeSel ? primeSel.value : 'ALL';
        
        const res = await fetch(`${API_URL}/tonase/${mill}/${date}`);
        const data = await window.parseTonaseResponse(res);
        
        // Ranges
        let r1 = 0; // 06am to 10am (06, 07, 08, 09, 10)
        let r2 = 0; // 10am to 12pm (11, 12)
        let r3 = 0; // 12pm to 2pm (13, 14)
        let r4 = 0; // 2pm to 4pm (15, 16)
        let r5 = 0; // 4pm to 6pm (17, 18)
        let r6 = 0; // After 6pm (19 to 24, 01 to 06)
        
        data.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            
            const kg = parseFloat(item.realized_kg) || 0;
            if (kg > 0) {
                const h = item.time_hour;
                if (['06:00', '07:00', '08:00', '09:00', '10:00'].includes(h)) r1 += kg;
                else if (['11:00', '12:00'].includes(h)) r2 += kg;
                else if (['13:00', '14:00'].includes(h)) r3 += kg;
                else if (['15:00', '16:00'].includes(h)) r4 += kg;
                else if (['17:00', '18:00'].includes(h)) r5 += kg;
                else r6 += kg;
            }
        });
        
        const totalKg = r1 + r2 + r3 + r4 + r5 + r6;
        const totalMt = totalKg / 1000;
        
        const formatRow = (label, kg) => {
            const mt = kg / 1000;
            const pct = totalKg > 0 ? ((kg / totalKg) * 100).toFixed(2) + '%' : '0.00%';
            return `<tr>
                <td style="text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">${label}</td>
                <td style="border: 1px solid #cbd5e1;">${mt.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1;">${pct}</td>
            </tr>`;
        };
        
        tbody.innerHTML = formatRow('06am to 10am', r1) +
                          formatRow('10am to 12pm', r2) +
                          formatRow('12pm to 2pm', r3) +
                          formatRow('2pm to 4pm', r4) +
                          formatRow('4pm to 6pm', r5) +
                          formatRow('After 6pm', r6);
                          
        tfoot.innerHTML = `<tr>
            <td style="text-align: left; border: 1px solid #cbd5e1;">Total FFB (MT)</td>
            <td style="border: 1px solid #cbd5e1;">${totalMt.toFixed(2)}</td>
            <td style="border: 1px solid #cbd5e1;">${totalKg > 0 ? '100.00%' : '0.00%'}</td>
        </tr>`;
        
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" style="color:red; border: 1px solid #cbd5e1;">Error memuat data</td></tr>';
    }
};

// UPKEEP MONTHLY REALIZATION
window.openUpkeepMonthlyRealization = () => {
    let modal = document.getElementById('modal-upkeep-monthly');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-upkeep-monthly';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '1000';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; width: 100%; height: 95vh; display:flex; flex-direction:column; overflow:hidden;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding: 15px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <h3 style="margin:0;">Monitoring Realisasi Upkeep Bulanan</h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="month" id="upkeep-monthly-date" class="form-control" style="width:auto;">
                        <select id="upkeep-monthly-type" class="form-control" style="width:auto;">
                            <option value="ALL">Semua Pekerjaan</option>
                            <option value="Pruning">Pruning</option>
                            <option value="Weeding">Weeding</option>
                            <option value="Spraying">Spraying</option>
                            <option value="Manuring">Manuring</option>
                        </select>
                        <button class="btn btn-primary" onclick="fetchUpkeepMonthlyData()">Tampilkan</button>
                        <button type="button" class="modal-close" onclick="document.getElementById('modal-upkeep-monthly').style.display='none'">&times;</button>
                    </div>
                </div>
                <div id="upkeep-monthly-table-container" style="flex:1; overflow:auto; padding: 15px;">
                    <!-- Table will be injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        document.getElementById('upkeep-monthly-date').value = `${yyyy}-${mm}`;
        document.getElementById('upkeep-monthly-type').value = 'Pruning'; // Default to Pruning as requested
    }
    modal.style.display = 'flex';
};

window.fetchUpkeepMonthlyData = async () => {
    const month = document.getElementById('upkeep-monthly-date').value;
    const type = document.getElementById('upkeep-monthly-type').value;
    const container = document.getElementById('upkeep-monthly-table-container');
    
    if(!month) return alert('Pilih bulan terlebih dahulu!');
    container.innerHTML = '<div style="text-align:center; padding:20px;">Loading data...</div>';
    
    try {
        const estate = (window.currentUser && window.currentUser.estate) ? window.currentUser.estate : 'ALL';
        const res = await fetch(`${API_URL}/upkeep/monthly?month=${month}&estate=${estate}`);
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        
        renderUpkeepMonthlyTable(data, month, type);
    } catch(err) {
        console.error(err);
        container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Gagal memuat data: ${err.message}</div>`;
    }
};

window.renderUpkeepMonthlyTable = (data, month, selectedType) => {
    const container = document.getElementById('upkeep-monthly-table-container');
    const { plan, actual } = data;
    
    const [yearStr, monthStr] = month.split('-');
    const daysInMonth = new Date(yearStr, monthStr, 0).getDate();
    
    // Grouping block
    // A block might have multiple plans in a month. We group by block AND type.
    const groups = {};
    
    plan.forEach(p => {
        if(selectedType !== 'ALL' && p.type !== selectedType) return;
        
        const key = `${p.estate}|${p.block}|${p.type}`;
        if(!groups[key]) {
            groups[key] = {
                estate: p.estate,
                block: p.block,
                type: p.type,
                plans: {}, // day -> {ha, hk}
                actuals: {} // day -> {ha, hk}
            };
        }
        
        const pDate = p.startdate; // 'YYYY-MM-DD'
        if(pDate && pDate.startsWith(month)) {
            const day = parseInt(pDate.split('-')[2], 10);
            if(!groups[key].plans[day]) groups[key].plans[day] = { ha: 0, hk: 0 };
            groups[key].plans[day].ha += parseFloat(p.target || 0);
            groups[key].plans[day].hk += parseInt(p.targetworkers || 0);
        }
    });
    
    actual.forEach(a => {
        const p = plan.find(x => x.id === a.upkeep_id);
        if(!p) return;
        if(selectedType !== 'ALL' && p.type !== selectedType) return;
        
        const key = `${p.estate}|${p.block}|${p.type}`;
        if(groups[key]) {
            const aDate = a.dateadded; // 'YYYY-MM-DD'
            if(aDate && aDate.startsWith(month)) {
                const day = parseInt(aDate.split('-')[2], 10);
                if(!groups[key].actuals[day]) groups[key].actuals[day] = { ha: 0, hk: 0 };
                groups[key].actuals[day].ha += parseFloat(a.addedha || 0);
                groups[key].actuals[day].hk += parseInt(a.workers || 0);
            }
        }
    });
    
    let html = `
        <style>
            .umo-table { border-collapse: collapse; width: max-content; min-width: 100%; font-size: 0.85rem; }
            .umo-table th, .umo-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: center; white-space: nowrap; }
            .umo-table th { background: #f1f5f9; position: sticky; top: 0; z-index: 10; font-weight: bold; color: #334155; }
            .umo-table th:nth-child(-n+5) { left: 0; z-index: 11; } 
            .umo-plan { background-color: #fef08a !important; color: #854d0e; } /* Yellow */
            .umo-actual { background-color: #bfdbfe !important; color: #1e3a8a; } /* Blue */
            .umo-empty { background-color: #f8fafc; }
            .umo-table tbody tr:hover td { filter: brightness(0.95); }
        </style>
        <table class="umo-table">
            <thead>
                <tr>
                    <th rowspan="2">Estate</th>
                    <th rowspan="2">Pekerjaan</th>
                    <th rowspan="2">Blok</th>
                    <th rowspan="2">Gross Area (Ha)</th>
                    <th rowspan="2">Plan/Actual</th>
    `;
    
    for(let d=1; d<=daysInMonth; d++) {
        html += `<th colspan="2">${d}</th>`;
    }
    html += `<th colspan="3">Month to Date</th></tr><tr>`;
    
    for(let d=1; d<=daysInMonth; d++) {
        html += `<th>Ha</th><th>HK</th>`;
    }
    html += `<th>Ha</th><th>HK</th><th>Prestasi</th></tr></thead><tbody>`;
    
    const sortedKeys = Object.keys(groups).sort();
    
    if(sortedKeys.length === 0) {
        html += `<tr><td colspan="${5 + (daysInMonth*2) + 3}" style="padding:20px;">Tidak ada data rencana/realisasi di bulan ini.</td></tr>`;
    }
    
    sortedKeys.forEach(key => {
        const g = groups[key];
        
        // gross area from master_blok
        const mb = window.db ? window.db.master_blok || [] : [];
        const blokData = mb.find(b => b.blok === g.block);
        const grossArea = blokData ? blokData.ha : '-';
        
        let mtdPlanHa = 0, mtdPlanHk = 0;
        let mtdActHa = 0, mtdActHk = 0;
        
        // PLAN ROW
        html += `<tr>
            <td rowspan="2" style="vertical-align:middle; font-weight:bold; background:#fff;">${g.estate}</td>
            <td rowspan="2" style="vertical-align:middle; background:#fff;">${g.type}</td>
            <td rowspan="2" style="vertical-align:middle; font-weight:bold; background:#fff;">${g.block}</td>
            <td rowspan="2" style="vertical-align:middle; background:#fff;">${grossArea}</td>
            <td style="font-weight:bold; background:#fff;">Plan</td>
        `;
        
        for(let d=1; d<=daysInMonth; d++) {
            const pd = g.plans[d];
            if(pd) {
                html += `<td class="umo-plan">${pd.ha.toFixed(2)}</td><td class="umo-plan">${pd.hk}</td>`;
                mtdPlanHa += pd.ha;
                mtdPlanHk += pd.hk;
            } else {
                html += `<td class="umo-empty"></td><td class="umo-empty"></td>`;
            }
        }
        
        let planPrestasi = mtdPlanHk > 0 ? (mtdPlanHa / mtdPlanHk).toFixed(2) : '-';
        html += `<td class="umo-plan" style="font-weight:bold;">${mtdPlanHa > 0 ? mtdPlanHa.toFixed(2) : ''}</td>
                 <td class="umo-plan" style="font-weight:bold;">${mtdPlanHk > 0 ? mtdPlanHk : ''}</td>
                 <td class="umo-plan" style="font-weight:bold;">${planPrestasi}</td>
                 </tr>`;
                 
        // ACTUAL ROW
        html += `<tr><td style="font-weight:bold; background:#fff;">Actual</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            const ad = g.actuals[d];
            if(ad) {
                html += `<td class="umo-actual" style="color:#16a34a; font-weight:bold;">${ad.ha.toFixed(2)}</td><td class="umo-actual" style="color:#16a34a; font-weight:bold;">${ad.hk}</td>`;
                mtdActHa += ad.ha;
                mtdActHk += ad.hk;
            } else {
                html += `<td class="umo-empty"></td><td class="umo-empty"></td>`;
            }
        }
        
        let actPrestasi = mtdActHk > 0 ? (mtdActHa / mtdActHk).toFixed(2) : '-';
        html += `<td class="umo-actual" style="font-weight:bold; color:#16a34a;">${mtdActHa > 0 ? mtdActHa.toFixed(2) : ''}</td>
                 <td class="umo-actual" style="font-weight:bold; color:#16a34a;">${mtdActHk > 0 ? mtdActHk : ''}</td>
                 <td class="umo-actual" style="font-weight:bold; color:#16a34a;">${actPrestasi}</td>
                 </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
};

// ==============================================
// DAILY MONITOR (LF, JJK, DESPATCH)
// ==============================================

window.openDailyMonitorModal = () => {
    document.getElementById('daily-monitor-modal').style.display = 'flex';
    document.getElementById('dm-date').value = window.getLocalDate();
    window.loadDailyMonitorInputData();
};

window.loadDailyMonitorInputData = async () => {
    const date = document.getElementById('dm-date').value;
    if(!date) return;
    
    let mill = currentUser.estate;
    if(!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    document.getElementById('dm-lf-list').innerHTML = 'Memuat...';
    document.getElementById('dm-efb-list').innerHTML = 'Memuat...';
    document.getElementById('dm-despatch-list').innerHTML = 'Memuat...';
    
    try {
        const [masterRes, dmRes] = await Promise.all([
            fetch(`${API_URL}/master/${mill}`),
            fetch(`${API_URL}/daily-monitor/${mill}/${date}`)
        ]);
        
        const master = await masterRes.json();
        const dm = await dmRes.json();
        
        const config = dm.config || {};
        const lfData = dm.lf || [];
        const efbData = dm.efb || [];
        const despatchData = dm.despatch || [];
        
        // Fill Config
        let efbRatio = config.efb_ratio;
        let sisaKemarin = config.sisa_kemarin_jjk;

        if (efbRatio === undefined || sisaKemarin === undefined) {
            const prevDateObj = new Date(date);
            prevDateObj.setDate(prevDateObj.getDate() - 1);
            const prevDateStr = prevDateObj.toISOString().split('T')[0];
            
            try {
                const [prevDmRes, prevTonaseRes] = await Promise.all([
                    fetch(`${API_URL}/daily-monitor/${mill}/${prevDateStr}`),
                    fetch(`${API_URL}/tonase/${mill}/${prevDateStr}`)
                ]);
                
                const prevDm = await prevDmRes.json();
                const prevTonase = await prevTonaseRes.json();
                const prevConfig = prevDm.config || {};
                
                if (efbRatio === undefined) {
                    efbRatio = prevConfig.efb_ratio !== undefined ? prevConfig.efb_ratio : "";
                }
                
                if (sisaKemarin === undefined) {
                    const pEfbRatio = parseFloat(prevConfig.efb_ratio) || 0;
                    const pSisaKemarin = parseFloat(prevConfig.sisa_kemarin_jjk) || 0;
                    const pIsProcessing = prevConfig.is_processing !== undefined ? prevConfig.is_processing : 1;
                    
                    let pTotalFfb = 0;
                    prevTonase.forEach(t => pTotalFfb += (parseFloat(t.realized_kg) || 0) / 1000);
                    
                    const pJjkProduksi = pIsProcessing == 1 ? pTotalFfb * (pEfbRatio / 100) : 0;
                    
                    let pTotalEfbEvakuasi = 0;
                    (prevDm.efb || []).forEach(e => pTotalEfbEvakuasi += parseFloat(e.tonase) || 0);
                    
                    sisaKemarin = pSisaKemarin + pJjkProduksi - pTotalEfbEvakuasi;
                    if (sisaKemarin < 0) sisaKemarin = 0;
                }
            } catch (e) {
                console.warn('Could not auto-fill from previous day:', e);
            }
        }

        document.getElementById('dm-is-processing').value = config.is_processing !== undefined ? config.is_processing : "1";
        document.getElementById('dm-efb-ratio').value = efbRatio !== undefined && efbRatio !== "" ? efbRatio : "";
        document.getElementById('dm-sisa-kemarin').value = sisaKemarin !== undefined && sisaKemarin !== "" ? (typeof sisaKemarin === 'number' ? sisaKemarin.toFixed(2) : sisaKemarin) : "";
        
        const isLocked = config.is_locked === 1;
        const canLock = ['Admin', 'Manager Mill', 'Supervisor Mill', 'Manager', 'Askep'].includes(currentUser.role);
        const isKraniMill = currentUser.role === 'Krani Mill';
        
        document.getElementById('dm-is-processing').disabled = isLocked && !canLock;
        document.getElementById('dm-efb-ratio').disabled = isKraniMill || (isLocked && !canLock);
        document.getElementById('dm-sisa-kemarin').disabled = isKraniMill || (isLocked && !canLock);
        document.getElementById('btn-lock-mill-config').style.display = canLock ? 'inline-block' : 'none';
        
        if (isKraniMill) {
            document.getElementById('mill-config-status').innerText = isLocked ? "Terkunci" : "Ratio & Sisa JJK dilock untuk Krani Mill";
        } else {
            document.getElementById('mill-config-status').innerText = isLocked ? "Terkunci (Anda memiliki akses)" : "Belum dilock";
        }        
        // Render LF Form
        let lfHtml = '<table class="data-table" style="width:100%; font-size:0.8rem;"><thead><tr><th>Estate</th><th>Actual LF Only (Ton)</th></tr></thead><tbody>';
        master.supply_chain.forEach(sc => {
            const eData = lfData.find(x => x.estate === sc.estate) || { actual_lf_tonase: '' };
            lfHtml += `<tr>
                <td>${sc.estate}</td>
                <td><input type="number" step="0.01" class="form-control inp-lf-act" data-estate="${sc.estate}" value="${eData.actual_lf_tonase}" onpaste="window.handleTablePaste(event, this)"></td>
            </tr>`;
        });
        lfHtml += '</tbody></table>';
        document.getElementById('dm-lf-list').innerHTML = lfHtml;
        
        // Render EFB Transport Form
        let efbHtml = '<table class="data-table" style="width:100%; font-size:0.8rem;"><thead><tr><th>Estate</th><th>Tonase (Ton)</th><th>Trip</th></tr></thead><tbody>';
        master.supply_chain.forEach(sc => {
            const eData = efbData.find(x => x.estate === sc.estate) || { tonase: '', trip: '' };
            efbHtml += `<tr>
                <td>${sc.estate}</td>
                <td><input type="number" step="0.01" class="form-control inp-efb-ton" data-estate="${sc.estate}" value="${eData.tonase}" onpaste="window.handleTablePaste(event, this)"></td>
                <td><input type="number" class="form-control inp-efb-trip" data-estate="${sc.estate}" value="${eData.trip}" onpaste="window.handleTablePaste(event, this)"></td>
            </tr>`;
        });
        efbHtml += '</tbody></table>';
        document.getElementById('dm-efb-list').innerHTML = efbHtml;
        
        // Render Despatch Form
        const products = ['CPO', 'PK', 'CANGKANG'];
        let dHtml = '<table class="data-table" style="width:100%; font-size:0.8rem;"><thead><tr><th>Product</th><th>Actual Trip</th><th>Tonase (MT)</th></tr></thead><tbody>';
        products.forEach(p => {
            const pData = despatchData.find(x => x.product === p) || { trip: '', tonase: '' };
            dHtml += `<tr>
                <td>${p}</td>
                <td><input type="number" class="form-control inp-dsp-trip" data-prod="${p}" value="${pData.trip}" onpaste="window.handleTablePaste(event, this)"></td>
                <td><input type="number" step="0.01" class="form-control inp-dsp-ton" data-prod="${p}" value="${pData.tonase}" onpaste="window.handleTablePaste(event, this)"></td>
            </tr>`;
        });
        dHtml += '</tbody></table>';
        document.getElementById('dm-despatch-list').innerHTML = dHtml;
        
    } catch(e) {
        console.error(e);
        alert('Gagal memuat data harian');
    }
};

window.saveMillConfig = async () => {
    const date = document.getElementById('dm-date').value;
    if(!date) return;
    let mill = currentUser.estate;
    if(!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    const is_processing = parseInt(document.getElementById('dm-is-processing').value) || 0;
    const efb_ratio = parseFloat(document.getElementById('dm-efb-ratio').value) || 0;
    const sisa_kemarin_jjk = parseFloat(document.getElementById('dm-sisa-kemarin').value) || 0;
    
    try {
        await fetch(`${API_URL}/daily-monitor/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date, mill, is_processing, efb_ratio, sisa_kemarin_jjk, is_locked: true
            })
        });
        document.getElementById('mill-config-status').innerText = 'Berhasil dilock!';
        window.renderTonaseMonitorTable(); // Refresh tabel
    } catch(e) {
        alert('Gagal simpan config');
    }
};

window.saveDailyMonitorData = async () => {
    const date = document.getElementById('dm-date').value;
    if(!date) return alert("Pilih tanggal");
    let mill = currentUser.estate;
    if(!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    // Collect LF
    const lfEntries = [];
    document.querySelectorAll('.inp-lf-act').forEach((el, i) => {
        const est = el.getAttribute('data-estate');
        const act = el.value;
        lfEntries.push({ estate: est, actual_lf_tonase: parseFloat(act)||0, actual_ffb_tonase: 0 });
    });
    
    // Collect EFB
    const efbEntries = [];
    document.querySelectorAll('.inp-efb-ton').forEach((el, i) => {
        const est = el.getAttribute('data-estate');
        const ton = el.value;
        const trip = document.querySelectorAll('.inp-efb-trip')[i].value;
        efbEntries.push({ estate: est, tonase: parseFloat(ton)||0, trip: parseInt(trip)||0 });
    });
    
    // Collect Despatch
    const dspEntries = [];
    document.querySelectorAll('.inp-dsp-trip').forEach((el, i) => {
        const p = el.getAttribute('data-prod');
        const trip = el.value;
        const ton = document.querySelectorAll('.inp-dsp-ton')[i].value;
        dspEntries.push({ product: p, trip: parseInt(trip)||0, tonase: parseFloat(ton)||0 });
    });
    
    try {
        await Promise.all([
            fetch(`${API_URL}/daily-monitor/lf`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({date, mill, entries: lfEntries}) }),
            fetch(`${API_URL}/daily-monitor/efb`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({date, mill, entries: efbEntries}) }),
            fetch(`${API_URL}/daily-monitor/despatch`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({date, mill, entries: dspEntries}) }),
        ]);
        alert("Realisasi harian berhasil disimpan");
        document.getElementById('daily-monitor-modal').style.display = 'none';
        if (typeof window.renderTonaseMonitorTable === 'function') window.renderTonaseMonitorTable();
    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan data harian");
    }
};

window.handleTablePaste = (e, cell) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    
    const tr = cell.closest('tr');
    const tbody = cell.closest('tbody');
    if (!tr || !tbody) return;
    
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const startRowIdx = allRows.indexOf(tr);
    
    const td = cell.closest('td');
    const allTds = Array.from(tr.querySelectorAll('td'));
    const startColIdx = allTds.indexOf(td);
    
    rows.forEach((rowStr, rOffset) => {
        const cols = rowStr.split(/\t/);
        const targetRow = allRows[startRowIdx + rOffset];
        if (targetRow) {
            const targetTds = targetRow.querySelectorAll('td');
            cols.forEach((colStr, cOffset) => {
                const targetTd = targetTds[startColIdx + cOffset];
                if (targetTd) {
                    const input = targetTd.querySelector('input');
                    if (input) {
                        let val = colStr.replace(/,/g, '').trim();
                        if (!isNaN(val) && val !== '') {
                            input.value = val;
                        }
                    }
                }
            });
        }
    });
};

window.renderDailyMonitorTables = async (mill, date, supplyChain, totalFfb, estateFfbAkumulasiMap = {}) => {
    const dContainer = document.getElementById('despatch-monitor-table-container');
    const lfContainer = document.getElementById('lf-monitor-table-container');
    const jContainer = document.getElementById('jjk-monitor-table-container');
    if (!dContainer || !jContainer || !lfContainer) return;
    
    try {
        const res = await fetch(`${API_URL}/daily-monitor/${mill}/${date}`);
        const dm = await res.json();
        
        const lfData = dm.lf || [];
        const efbData = dm.efb || [];
        const despatchData = dm.despatch || [];
        const config = dm.config || { is_processing: 0, efb_ratio: 0, sisa_kemarin_jjk: 0 };
        
        const abbrMap = {
            'Bunga Tanjung Estate': 'BTEE',
            'Air Bikuk Estate': 'ABKE',
            'Air Buluh Estate': 'ABEE',
            'Malin Deman Estate': 'MDEE',
            'Sungai Teramang Estate': 'STGE',
            'KMD': 'KMD',
            'KHJLT': 'KHJLT',
            'PLAB': 'PLAB',
            'PLAM': 'PLAM',
            'Small Holder': '3rd Prty'
        };
        const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');
        
        // Render Despatch Table
        try {
            let dHtml = `
            <table class="data-table" style="text-align: right; width: 100%;">
                <thead>
                    <tr>
                        <th style="background-color: #000; color: #fff; text-align: left;">PRODUCT</th>
                        <th style="background-color: #000; color: #fff;">ACTUAL TRIP</th>
                        <th style="background-color: #000; color: #fff;">TONASE<br>(MT)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        ['CPO', 'PK', 'CANGKANG'].forEach(p => {
            const dRow = despatchData.find(x => x.product === p) || { trip: '-', tonase: '-' };
            dHtml += `<tr>
                <td style="text-align: left; font-weight: bold; background-color: #f1f5f9;">${p}</td>
                <td style="background-color: #fff;">${dRow.trip !== '-' ? dRow.trip : '-'}</td>
                <td style="background-color: #fff;">${dRow.tonase !== '-' ? parseFloat(dRow.tonase).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
            </tr>`;
        });
        dHtml += `</tbody></table>`;
        dContainer.innerHTML = dHtml;
        
        // Render LF Table
        if (lfContainer) {
            lfContainer.innerHTML = '';
            lfContainer.style.display = 'none';
        }
    } catch (err) { console.error('Error rendering Despatch/LF:', err); }
        
        // 2. Render JJK Table in right side container
        try {
            let jjkProduksi = 0;
        if (config.is_processing === 1) {
            jjkProduksi = totalFfb * (config.efb_ratio / 100);
        }
        const sisaKemarin = parseFloat(config.sisa_kemarin_jjk) || 0;
        
        const efbMtdData = dm.efb_mtd || [];
        
        let jHtml = `
            <div style="background: #e2e8f0; padding: 10px; margin-bottom: 10px; font-family: monospace; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; width: 300px; margin-bottom: 5px;">
                    <span style="font-weight: bold;">JJK SISA KEMARIN</span>
                    <strong style="font-size: 1.1em;">${sisaKemarin.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON</strong>
                </div>
                <div style="display: flex; justify-content: space-between; width: 300px;">
                    <span style="font-weight: bold;">JJK PRODUKSI</span>
                    <strong style="font-size: 1.1em;">${jjkProduksi.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON</strong>
                </div>
            </div>
            <table class="data-table" style="text-align: right; width: 100%;">
                <thead>
                    <tr>
                        <th style="background-color: #000; color: #fff; text-align: left;">ESTATE</th>
                        <th style="background-color: #000; color: #fff;">ACTUAL<br>TONASE</th>
                        <th style="background-color: #000; color: #fff;">ACT MTD</th>
                        <th style="background-color: #000; color: #fff;">TRIP</th>
                        <th style="background-color: #e2e8f0; color: #000;">TARGET</th>
                        <th style="background-color: #e2e8f0; color: #000;">TARGET MTD</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let tEfbTon = 0, tEfbTonMtd = 0, tEfbTrip = 0, tEfbTarget = 0, tEfbTargetMtd = 0;
            supplyChain.forEach(est => {
                const eRow = efbData.find(x => x.estate === est);
                const eMtd = efbMtdData.find(x => x.estate === est);
                
                const ton = eRow ? (parseFloat(eRow.tonase) || 0) : 0;
                const trip = eRow ? (parseInt(eRow.trip) || 0) : 0;
                const target = eRow ? (parseFloat(eRow.target) || 0) : 0;
                const tonMtd = eMtd ? (parseFloat(eMtd.tonase_mtd) || 0) : 0;
                const targetMtd = eMtd ? (parseFloat(eMtd.target_mtd) || 0) : 0;
                
                tEfbTon += ton;
                tEfbTrip += trip;
                tEfbTarget += target;
                tEfbTonMtd += tonMtd;
                tEfbTargetMtd += targetMtd;
                
                jHtml += `<tr>
                    <td style="text-align: left; background-color: #fff;">${getAbbr(est)}</td>
                    <td style="background-color: #fff;">${ton > 0 ? ton.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                    <td style="background-color: #fff;">${tonMtd > 0 ? tonMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                    <td style="background-color: #fff;">${trip > 0 ? trip : '0'}</td>
                    <td style="background-color: #f1f5f9; font-weight: bold;">${target > 0 ? target.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #f1f5f9; font-weight: bold;">${targetMtd > 0 ? targetMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                </tr>`;
            });
            
            const sisaSekarang = sisaKemarin + jjkProduksi - tEfbTon;
            
            jHtml += `
                <tr style="background-color: #f8cbad; font-weight: bold;">
                    <td style="background-color: #f8cbad; text-align: left;">TOTAL</td>
                    <td style="background-color: #f8cbad;">${tEfbTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="background-color: #f8cbad;">${tEfbTonMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="background-color: #f8cbad;">${tEfbTrip}</td>
                    <td style="background-color: #f8cbad;">${tEfbTarget > 0 ? tEfbTarget.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #f8cbad;">${tEfbTargetMtd > 0 ? tEfbTargetMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                </tr>
                <tr style="background-color: #f8cbad; font-weight: bold; font-size: 1.1em;">
                    <td colspan="3" style="background-color: #f8cbad; text-align: left;">SISA JJK SEKARANG</td>
                    <td colspan="3" style="background-color: #f8cbad; text-align: right;">${sisaSekarang.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TON</td>
                </tr>
            </tbody></table>`;
            
            jContainer.innerHTML = jHtml;
        } catch (err) {
            console.error('Error rendering JJK:', err);
            jContainer.innerHTML = '<div style="color:red; padding:10px;">Gagal memuat JJK / EFB</div>';
        }
        
    } catch(e) {
        console.error("renderDailyMonitorTables error:", e);
        alert("Error loading daily monitor tables: " + e.message);
    }
};

// ==============================================
// DRAGGABLE MODALS (Global Event Delegation)
// ==============================================
let activeDragModal = null;
let isDragging = false;
let startX, startY, initialX, initialY;

document.addEventListener('mousedown', (e) => {
    const header = e.target.closest('.modal-header');
    if (!header) return;
    if (e.target.closest('.modal-close') || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    
    const modal = header.closest('.modal-content');
    if (!modal) return;
    
    activeDragModal = modal;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const style = window.getComputedStyle(modal);
    const matrix = new WebKitCSSMatrix(style.transform);
    initialX = matrix.m41;
    initialY = matrix.m42;
    
    modal.style.transition = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeDragModal) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    activeDragModal.style.transform = `translate(${initialX + dx}px, ${initialY + dy}px)`;
});

document.addEventListener('mouseup', () => {
    if (isDragging && activeDragModal) {
        isDragging = false;
        activeDragModal.style.transition = 'opacity 0.3s ease';
        activeDragModal = null;
    }
});

window.exportDashboard = function() {
    const container = document.getElementById('export-dashboard-wrapper');
    if(!container) return;
    
    const controls = container.querySelector('div[style*="justify-content: flex-end"]');
    if(controls) controls.style.display = 'none';
    
    const glassCards = container.querySelectorAll('.glass-card');
    const originalStyles = [];
    glassCards.forEach(card => {
        originalStyles.push({
            bg: card.style.backgroundColor,
            filter: card.style.backdropFilter,
            shadow: card.style.boxShadow,
            border: card.style.border
        });
        card.style.backgroundColor = '#ffffff';
        card.style.backdropFilter = 'none';
        card.style.boxShadow = 'none';
        card.style.border = '1px solid #cbd5e1';
    });
    
    const dateInput = document.getElementById('monitor-tonase-date').value;
    const hourInput = document.getElementById('monitor-tonase-hour').value;
    
    let formattedDate = "";
    if(dateInput) {
        const d = new Date(dateInput);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        formattedDate = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    
    const fileName = `monitoring FFB dan EFB pukul ${hourInput || '00:00'} ${formattedDate}.png`;
    
    html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false
    }).then(canvas => {
        if(controls) controls.style.display = 'flex';
        glassCards.forEach((card, idx) => {
            card.style.backgroundColor = originalStyles[idx].bg;
            card.style.backdropFilter = originalStyles[idx].filter;
            card.style.boxShadow = originalStyles[idx].shadow;
            card.style.border = originalStyles[idx].border;
        });
        
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    }).catch(err => {
        console.error('Export error:', err);
        if(controls) controls.style.display = 'flex';
        glassCards.forEach((card, idx) => {
            card.style.backgroundColor = originalStyles[idx].bg;
            card.style.backdropFilter = originalStyles[idx].filter;
            card.style.boxShadow = originalStyles[idx].shadow;
            card.style.border = originalStyles[idx].border;
        });
        alert('Gagal menyimpan gambar dashboard');
    });
};

window.updateLocationList = function() {
    const locationTypeEl = document.getElementById('login-location-type');
    const estateDropdown = document.getElementById('login-estate');
    if (!locationTypeEl || !estateDropdown) return;
    
    const type = locationTypeEl.value.toUpperCase();
    estateDropdown.innerHTML = '';
    
    if (type === 'MILL') {
        estateDropdown.innerHTML = '<option value="" disabled selected>LIST MILL</option>' +
            '<option>Bunga Tanjung Mill</option>' +
            '<option>Muko Muko Mill</option>';
    } else {
        estateDropdown.innerHTML = '<option value="" disabled selected>LIST ESTATE</option>' +
            '<option>Bunga Tanjung Estate</option>' +
            '<option>Sungai Teramang Estate</option>' +
            '<option>Air Bikuk Estate</option>' +
            '<option>Batu Kuda Estate</option>' +
            '<option>Air Buluh Estate</option>' +
            '<option>Malin Deman Estate</option>' +
            '<option>Tanah Rekah Estate</option>' +
            '<option>Muko Muko Estate</option>' +
            '<option>Sei Jerinjing Estate</option>' +
            '<option>Talang Petai Estate</option>' +
            '<option>Sungai Kiang Estate</option>' +
            '<option>Air Majunto Estate</option>';
    }
};

setTimeout(() => {
    if(document.getElementById('login-location-type')) {
        window.updateLocationList();
    }
}, 100);

window.handleChangePassword = async function(e) {
    e.preventDefault();
    
    // Ambil username dari form login (jika ada), atau dari sesi currentUser
    const loginUsernameEl = document.getElementById('login-username');
    const oldPass = document.getElementById('cp-old').value;
    const newPass = document.getElementById('cp-new').value;
    const confirmPass = document.getElementById('cp-confirm').value;
    const errorEl = document.getElementById('cp-error');
    const submitBtn = document.getElementById('btn-submit-cp');
    
    const username = (loginUsernameEl && loginUsernameEl.value.trim() !== '') ? loginUsernameEl.value.trim() : (window.currentUser ? window.currentUser.username : '');
    
    errorEl.style.display = 'none';
    
    if (!username) {
        errorEl.innerText = 'Silakan isi Nama Pengguna di form login terlebih dahulu!';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!oldPass) {
        errorEl.innerText = 'Password lama harus diisi!';
        errorEl.style.display = 'block';
        return;
    }
    
    if (newPass !== confirmPass) {
        errorEl.innerText = 'Konfirmasi password tidak cocok!';
        errorEl.style.display = 'block';
        return;
    }
    
    if (newPass.length < 4) {
        errorEl.innerText = 'Password baru minimal 4 karakter.';
        errorEl.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerText = 'Loading...';
    
    try {
        const res = await fetch(`${API_URL}/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, oldPassword: oldPass, newPassword: newPass })
        });
        
        const data = await res.json();
            submitBtn.innerText = 'Memasuki Dashboard...';
            submitBtn.style.backgroundColor = '#10b981';
            errorEl.style.color = '#10b981';
            errorEl.innerText = 'Berhasil! Mengalihkan...';
            errorEl.style.display = 'block';
            
            const loginPassEl = document.getElementById('login-password');
            if (loginPassEl) loginPassEl.value = newPass;
            
            document.getElementById('modal-change-password').style.display = 'none';
            const loginForm = document.getElementById('login-form');
            if (loginForm && !window.currentUser) {
                // Langsung submit form tanpa delay
                loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            } else {
                window.location.reload();
            }
        } else {
            errorEl.style.color = '#ef4444';
            errorEl.innerText = data.message || 'Gagal mengubah password.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerText = 'Update Password';
        }
    } catch (err) {
        console.error(err);
        errorEl.style.color = '#ef4444';
        errorEl.innerText = 'Terjadi kesalahan sistem.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Update Password';
    }
};
