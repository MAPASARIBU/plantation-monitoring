// API Base URL
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api';
window.API_URL = API_URL;

window.updateLocationList = function() {
    const locationTypeEl = document.getElementById('login-location-type');
    const estateDropdown = document.getElementById('login-estate');
    if (!locationTypeEl || !estateDropdown) return;
    
    const type = (locationTypeEl.value || '').toUpperCase();
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
        window.currentUser = currentUser;
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

window.handleLoginSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-sandi').value.trim();
    const estateEl = document.getElementById('login-estate');
    const estate = estateEl ? estateEl.value : null;
    login(username, password, estate);
    return false;
};

const login = async (username, password, estate) => {
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('btn-login-submit') || document.querySelector('#login-form button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Masuk...';
    }

    const resetBtn = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right"></i>';
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

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
                resetBtn();
                return;
            }
            
            errorEl.style.display = 'none';
            dbUser.assignedEstates = assignedEstates;
            currentUser = dbUser;
            window.currentUser = currentUser;
            if (estate) currentUser.estate = estate;
            localStorage.setItem('agrimonitor_user', JSON.stringify(currentUser));
            document.getElementById('login-form').reset();
            resetBtn();
            checkAuth();
        } else {
            errorEl.innerText = result.error || result.message || 'Username atau Password salah.';
            errorEl.style.display = 'block';
            resetBtn();
        }
    } catch (e) {
        console.error("Login error:", e);
        if (e.name === 'AbortError') {
            errorEl.innerText = "Koneksi timeout. Silakan periksa jaringan dan coba lagi.";
        } else {
            errorEl.innerText = "Gagal terhubung ke server backend.";
        }
        errorEl.style.display = 'block';
        resetBtn();
    }
};

const logout = () => {
    localStorage.removeItem('agrimonitor_user');
    currentUser = null;
    window.currentUser = null;
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
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'users', 'master', 'processing', 'water', 'ffb_quality', 'mill_dashboard']);
    } else if (role === 'Senior Field Manager' || role === 'Manager') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Estate Manager' || role === 'Asisten Kepala' || role === 'Division Manager' || role === 'Assistant') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting']);
    } else if (role === 'Manager Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master', 'processing', 'water', 'ffb_quality', 'mill_dashboard']);
    } else if (role === 'Askep' || role === 'Office Assistant (OAA)') {
        showViews(['dashboard', 'vehicle', 'pemupukan', 'upkeep', 'tonase', 'harvesting', 'master']);
    } else if (role === 'Office Assistant Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'master', 'processing', 'water', 'ffb_quality', 'mill_dashboard']);
    } else if (role === 'Supervisor Mill') {
        showViews(['dashboard', 'vehicle', 'tonase', 'processing', 'water', 'ffb_quality', 'mill_dashboard']);
    } else if (role === 'Mandor' || role === 'Krani Divisi') {
        showViews(['vehicle', 'pemupukan', 'upkeep', 'harvesting']);
    } else if (role === 'Krani Mill') {
        showViews(['dashboard', 'tonase']);
    } else if (role === 'Grading') {
        showViews(['dashboard', 'ffb_quality']);
    } else if (role === 'Analis') {
        showViews(['dashboard', 'processing', 'water']);
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
window.views = window.views || {};
const views = window.views;
Object.assign(views, {
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
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                            <h2 style="margin: 0;">Progres Penerimaan TBS Hari Ini</h2>
                            <button class="btn btn-primary btn-sm" onclick="document.getElementById('dashboard-progress-historical-modal').style.display='flex';"><i class="fa-solid fa-clock-rotate-left"></i> Historical</button>
                        </div>
                        <span id="dashboard-progress-time" style="font-size: 0.9em; color: var(--text-secondary); font-weight: bold;"></span>
                    </div>
                    <div id="dashboard-progress-panen-container" style="margin-top: 20px;">
                        <p style="color:var(--text-secondary); text-align:center;">Loading...</p>
                    </div>
                </div>
            </div>

            
<!-- Dashboard Progress Historical Modal -->
<div class="modal-overlay" id="dashboard-progress-historical-modal" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 800px; max-width: 95%; overflow-y: auto; display: flex; flex-direction: column;">
        <div class="modal-header" id="dashboard-progress-historical-modal-header" style="cursor: move; background-color: #f1f5f9; padding: 15px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-arrows-up-down-left-right"></i> FFB Received % by Time Band</h2>
            <button type="button" class="modal-close" onclick="document.getElementById('dashboard-progress-historical-modal').style.display = 'none'">&times;</button>
        </div>
        <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
            <div style="display: flex; gap: 10px; align-items: center; justify-content: center; margin-bottom: 20px;">
                <label style="font-weight: bold;">Pilih Tanggal:</label>
                <input type="date" id="dashboard-progress-historical-date" class="form-control" style="width: auto;">
                <button class="btn" style="background-color: #e2e8f0; color: #333;" onclick="document.getElementById('dashboard-progress-historical-modal').style.display='none'">No</button>
                <button class="btn btn-primary" onclick="loadDashboardProgressHistoricalChart()">OK</button>
            </div>
            <div id="dashboard-progress-historical-chart-container" style="flex: 1; width: 100%; display: none; min-height: 400px; position: relative;">
                <canvas id="dashboardProgressHistoricalChartCanvas"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="glass-card" id="ffb-received-card" style="margin-top: 20px; display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
        <h3 style="margin: 0;">FFB Received S/D Jam <span id="ffb-received-time-label">18:00</span> by Estates</h3>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <select id="ffb-received-period-select" class="form-control" style="width: auto;" onchange="if(window.toggleFfbReceivedInputs) window.toggleFfbReceivedInputs()">
                <option value="daily" selected>Harian</option>
                <option value="monthly">Bulanan</option>
            </select>
            
            <label id="ffb-received-date-label" style="font-weight: bold; margin-bottom: 0;">Pilih Tanggal:</label>
            <input type="date" id="ffb-received-date-input" class="form-control" style="width: auto;">
            
            <label id="ffb-received-month-label" style="font-weight: bold; margin-bottom: 0; display: none;">Pilih Bulan:</label>
            <input type="month" id="ffb-received-month-input" class="form-control" style="width: auto; display: none;">
            
            <select id="ffb-received-time-select" class="form-control" style="width: auto;">
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
                <option value="18:00" selected>18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
                <option value="23:00">23:00</option>
                <option value="24:00">24:00</option>
            </select>
            
            <button class="btn btn-success" onclick="if(window.renderFfbReceivedChart) window.renderFfbReceivedChart()">Tampilkan</button>
        </div>
    </div>
    <div style="position: relative; height: 300px; width: 60%;">
        <canvas id="chart-ffb-received"></canvas>
    </div>
</div>

<div class="glass-card" id="dash-ffb-crop-card" style="margin-top: 20px; display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
        <h3 style="margin: 0;">Daily FFB Crop Quality</h3>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <label style="font-weight: bold; margin-bottom: 0;">Dari Tanggal:</label>
            <input type="date" id="dash-ffb-crop-start-date" class="form-control" style="width: auto;">
            
            <label style="font-weight: bold; margin-bottom: 0;">Hingga Tanggal:</label>
            <input type="date" id="dash-ffb-crop-end-date" class="form-control" style="width: auto;">
            
            <button class="btn btn-success" onclick="if(window.renderDashFfbCropQuality) window.renderDashFfbCropQuality()">Tampilkan</button>
        </div>
    </div>
    <div class="table-responsive" style="display: flex; justify-content: center; width: 100%; overflow-x: auto;">
        <style>
            #dash-ffb-crop-table {
                width: auto !important;
                max-width: 900px;
                font-size: 0.82rem;
                border-collapse: collapse;
                margin: 10px auto 5px auto !important;
            }
            #dash-ffb-crop-table th, #dash-ffb-crop-table td {
                padding: 4px 6px !important;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            #dash-ffb-crop-table th {
                background-color: #f8fafc;
                font-weight: bold;
                color: #334155;
            }
        </style>
                <table class="data-table" id="dash-ffb-crop-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 80px; min-width: 70px;">ESTATE</th>
                    <th rowspan="2" style="width: 75px;">FFB<br><span style="font-size:0.75rem; font-weight:normal;">(TON)</span></th>
                    <th colspan="1" style="width: 80px;">UN RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                    <th colspan="1" style="width: 90px;">UNDER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 3%)</span></th>
                    <th colspan="1" style="width: 80px;">RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Min. 90%)</span></th>
                    <th colspan="1" style="width: 80px;">OVER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 7%)</span></th>
                    <th colspan="1" style="width: 90px;">EMPTY BUNCH<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                    <th colspan="1" style="width: 80px;">LONGSTALK<br><span style="font-size:0.75rem; font-weight:normal;">(&lt; 2%)</span></th>
                    <th colspan="1" style="width: 85px;">RAT DAMAGE<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                    <th rowspan="2" style="width: 75px;">LOOSE FRUIT<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                </tr>
                <tr>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                </tr>
            </thead>
            <tbody>
                <!-- Rows injected via JS -->
            </tbody>
            <tfoot>
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td style="text-align: right;">TOTAL:</td>
                    <td id="dash-fqc-tot-tonase">0.00</td>
                    <td id="dash-fqc-avg-unripe">0.0</td>
                    <td id="dash-fqc-avg-under">0.0</td>
                    <td id="dash-fqc-avg-normal">0.0</td>
                    <td id="dash-fqc-avg-over">0.0</td>
                    <td id="dash-fqc-avg-empty">0.0</td>
                    <td id="dash-fqc-avg-long">0.0</td>
                    <td id="dash-fqc-avg-rat">0.0</td>
                    <td id="dash-fqc-avg-lf">0.00</td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>

<div class="glass-card" id="dash-ffb-fruit-loose-card" style="margin-top: 20px; display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
        <h3 style="margin: 0;">Daily FFB Quality Fruit Loose Analysis</h3>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <label style="font-weight: bold; margin-bottom: 0;">Dari Tanggal:</label>
            <input type="date" id="dash-ffb-fruit-loose-start-date" class="form-control" style="width: auto;">
            
            <label style="font-weight: bold; margin-bottom: 0;">Hingga Tanggal:</label>
            <input type="date" id="dash-ffb-fruit-loose-end-date" class="form-control" style="width: auto;">
            
            <button class="btn btn-success" onclick="if(window.renderDashFfbFruitLooseAnalysis) window.renderDashFfbFruitLooseAnalysis()">Tampilkan</button>
        </div>
    </div>
    <div class="table-responsive" style="display: flex; justify-content: center; width: 100%; overflow-x: auto;">
        <style>
            #dash-ffb-fruit-loose-table {
                width: auto !important;
                max-width: 580px;
                font-size: 0.82rem;
                border-collapse: collapse;
                margin: 10px auto 5px auto !important;
            }
            #dash-ffb-fruit-loose-table th, #dash-ffb-fruit-loose-table td {
                padding: 4px 6px !important;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            #dash-ffb-fruit-loose-table th {
                background-color: #f8fafc;
                font-weight: bold;
                color: #334155;
            }
        </style>
        <table class="data-table" id="dash-ffb-fruit-loose-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 90px; min-width: 80px;">ESTATE</th>
                    <th colspan="1" style="width: 100px;">BRON SEGAR</th>
                    <th colspan="1" style="width: 120px;">BRON TDK SEGAR</th>
                    <th colspan="1" style="width: 100px;">BRON BUSUK</th>
                    <th colspan="1" style="width: 80px;">SAMPAH</th>
                </tr>
                <tr>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                    <th>(%)</th>
                </tr>
            </thead>
            <tbody>
                <!-- Rows injected via JS -->
            </tbody>
            <tfoot>
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td style="text-align: right;">TOTAL:</td>
                    <td id="dash-fql-avg-segar">0.00</td>
                    <td id="dash-fql-avg-tsegar">0.00</td>
                    <td id="dash-fql-avg-busuk">0.00</td>
                    <td id="dash-fql-avg-sampah">0.00</td>
                </tr>
            </tfoot>
        </table>
    </div>
</div>

<!-- Dashboard Extra Sections (Processing & Water) -->
<div id="dashboard-mill-sections">
<div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
    <div style="display: flex; flex-direction: column;">
        <h2 style="margin: 0;">Processing & Water Analysis</h2>
        <span id="dash-extra-date-label" style="font-size: 0.9em; color: var(--text-secondary); font-weight: bold;">Data Hari Ini</span>
    </div>
    <button class="btn btn-primary btn-sm" onclick="document.getElementById('dashboard-extra-date-modal').style.display='flex';"><i class="fa-solid fa-clock-rotate-left"></i> Historical Pop Up</button>
</div>

<div class="glass-card" style="margin-top: 15px;">
    <h3>Liquid Monitoring Historical Grafik</h3>
    <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-oil-cot-cst"></canvas>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-cst-ketebalan"></canvas>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-temp-cot-cst"></canvas>
        </div>
    </div>
</div>

<div class="glass-card" style="margin-top: 20px;">
    <h3>Chart Monitoring FFA Today</h3>
    <div class="chart-container" style="position: relative; height:300px; width:100%; max-width: 600px; margin: 0 auto;">
        <canvas id="chart-ffa-today"></canvas>
    </div>
</div>

<div class="glass-card" style="margin-top: 20px;">
    <h3>Korelasi FFB Quality vs FFA Washing Plant (Bulan Berjalan)</h3>
    <div class="chart-container" style="position: relative; height:350px; width:100%; max-width: 800px; margin: 0 auto;">
        <canvas id="chart-ffb-ffa-correlation"></canvas>
    </div>
    
    <h3 style="margin-top: 30px;">Tabel Data Bulanan</h3>
    <div class="table-responsive" style="overflow-x: auto; padding-bottom: 15px;">
        <table class="data-table" id="table-ffb-ffa-correlation-body">
            <thead>
                <tr>
                    <th style="min-width: 30px;">No</th>
                    <th style="min-width: 150px;">Parameter</th>
                    <!-- Hari 1-31 akan di-generate oleh JS -->
                </tr>
            </thead>
            <tbody>
                <tr><td colspan="33" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div class="dashboard-grid" style="grid-template-columns: minmax(0, 1fr); gap: 15px; margin-top: 20px;">
    <div class="glass-card" style="overflow: hidden;">
        <h3>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" id="dash-table-water-sebelum">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <div class="glass-card" style="overflow: hidden;">
        <h3>1.2 Analisa Air Boiler (Rata-rata)</h3>
        <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" id="dash-table-water-boiler">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>
</div> <!-- Close dashboard-mill-sections -->



<!-- Dashboard Extra Date Picker Modal -->
<div class="modal-overlay" id="dashboard-extra-date-modal" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 400px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;">Pilih Tanggal Historical</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('dashboard-extra-date-modal').style.display = 'none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <input type="date" id="dash-extra-date-input" class="form-control">
            <button class="btn btn-primary" onclick="loadDashboardExtraData(document.getElementById('dash-extra-date-input').value); document.getElementById('dashboard-extra-date-modal').style.display='none';">Load Data</button>
        </div>
    </div>
</div>

            
`,
    vehicle: `
        <div id="vehicle-module-layout" class="animate-fade-in module-layout" style="grid-template-columns: 1fr; padding-top: 10px;">
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

            <!-- Sub-Sheet Navigation Tabs -->
            <div class="subsheet-tab-bar">
                <button class="subsheet-tab-btn active" id="tab-btn-vehicle-monitor" onclick="switchVehicleSubTab('monitor')">
                    <i class="fa-solid fa-truck-fast"></i> Monitoring Trip Kendaraan
                </button>
                <button class="subsheet-tab-btn" id="tab-btn-vehicle-analytics" onclick="switchVehicleSubTab('analytics')">
                    <i class="fa-solid fa-chart-line"></i> Analisa & Efisiensi Armada
                </button>
            </div>

            <!-- 1. SUB-SHEET: MONITORING LIVE PERGERAKAN -->
            <div id="vehicle-subsheet-monitor" class="subsheet-content active">
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

            <!-- 2. SUB-SHEET: ANALYTICS & FLEET EFFICIENCY -->
            <div id="vehicle-subsheet-analytics" class="subsheet-content">
                <div class="grading-filter-bar">
                    <div class="grading-filter-group">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar-day"></i> Tanggal Analisis</label>
                            <input type="date" id="vanal-date" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.loadVehicleAnalyticsData()">
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-layer-group"></i> Ruang Lingkup</label>
                            <select id="vanal-scope" class="form-control" style="font-weight: 600; min-width: 160px;" onchange="window.loadVehicleAnalyticsData()">
                                <option value="daily" selected>Harian (Tanggal Terpilih)</option>
                                <option value="mtd">MTD (Bulan Berjalan)</option>
                                <option value="all">Semua Historis</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.loadVehicleAnalyticsData()"><i class="fa-solid fa-rotate"></i> Refresh Analisis</button>
                        <button class="btn btn-secondary" onclick="window.printVehicleAnalytics()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                        <button class="btn btn-success" onclick="window.exportVehicleAnalyticsCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
                    </div>
                </div>

                <!-- Executive KPI Cards -->
                <div class="grading-kpi-grid">
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon blue">
                            <i class="fa-solid fa-truck-moving"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Ritase & Armada</h4>
                            <div class="kpi-val" id="vanal-kpi-trips">0 Trip</div>
                            <div class="kpi-sub" id="vanal-kpi-trucks">0 Truk Beroperasi Aktif</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-boxes-stacked"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Janjang Terangkut</h4>
                            <div class="kpi-val" id="vanal-kpi-janjang">0 JJG</div>
                            <div class="kpi-sub" id="vanal-kpi-avg-jjg">Rata-rata 0 JJG / Trip</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon yellow">
                            <i class="fa-solid fa-stopwatch"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Rata-rata Lead Time ke PKS</h4>
                            <div class="kpi-val" id="vanal-kpi-duration">0 Menit</div>
                            <div class="kpi-sub" id="vanal-kpi-fastest-slowest">Tercepat: - | Terlama: -</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-weight-hanging"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Estimasi Tonase Angkut</h4>
                            <div class="kpi-val" id="vanal-kpi-tonase">0.00 Ton</div>
                            <div class="kpi-sub" id="vanal-kpi-turnaround">Rata-rata Ritase: 0.0 Rit/Truk</div>
                        </div>
                    </div>
                </div>

                <!-- Tabel 1: Rekapitulasi Kinerja Armada per Truk & Supir -->
                <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin: 0;"><i class="fa-solid fa-truck-ramp-box"></i> 1. Rekapitulasi Kinerja & Efisiensi Armada (Fleet Performance)</h3>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Analisis produktivitas janjang, ritase, dan durasi pengiriman per kendaraan.</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="vanal-truck-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                            <thead>
                                <tr style="background-color: #1e293b; color: white;">
                                    <th style="width: 35px;">NO</th>
                                    <th style="text-align: left; min-width: 120px;">PLATE TRUK</th>
                                    <th style="text-align: left; min-width: 130px;">NAMA SUPIR</th>
                                    <th>ASAL ESTATE</th>
                                    <th>DIVISI</th>
                                    <th style="background-color: #0284c7; color: white;">TOTAL RITASE</th>
                                    <th style="background-color: #059669; color: white;">TOTAL JANJANG</th>
                                    <th style="background-color: #6366f1; color: white;">RATA-RATA JJG/TRIP</th>
                                    <th style="background-color: #d97706; color: white;">RATA-RATA DURASI</th>
                                    <th>TRIP PERTAMA</th>
                                    <th>TRIP TERAKHIR</th>
                                    <th>STATUS UTILISASI</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                            <tfoot></tfoot>
                        </table>
                    </div>
                </div>

                <!-- Grid: Tabel 2 (Logistics Rhythm per Blok) & Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <!-- Tabel 2 -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-map-location-dot"></i> 2. Analisis Lead Time per Divisi & Blok</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Evaluasi kelancaran jalur logistik pengangkutan TBS dari blok ke pabrik.</span>
                        <div class="table-responsive">
                            <table class="data-table" id="vanal-block-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th>DIVISI / BLOK</th>
                                        <th>TRIP</th>
                                        <th>JANJANG</th>
                                        <th>TERCEPAT</th>
                                        <th>TERLAMA</th>
                                        <th>RATA-RATA</th>
                                        <th>EVALUASI JALUR</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot></tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Chart 1 -->
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> Produktivitas Janjang per Kendaraan</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Perbandingan total janjang yang berhasil diangkut oleh masing-masing truk.</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-vanal-productivity"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Ritme Waktu Kedatangan di PKS -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-clock-rotate-left"></i> Sebaran Waktu Tiba di PKS & Durasi Perjalanan</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Pola jam kedatangan armada di pos security / timbangan PKS vs waktu tempuh dari blok.</span>
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="chart-vanal-timeline"></canvas>
                    </div>
                </div>

                <!-- Smart Diagnostic Recommendations -->
                <div class="grading-insight-box">
                    <h4><i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i> Smart Operational Diagnostic & Recommendations</h4>
                    <ul id="vanal-insights-list"></ul>
                </div>
            </div>
        </div>
    `,
    upkeep: `
        <div id="upkeep-module-layout" class="animate-fade-in module-layout" style="grid-template-columns: 1fr; padding-top: 10px;">
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

            <!-- Sub-Sheet Navigation Tabs -->
            <div class="subsheet-tab-bar">
                <button class="subsheet-tab-btn active" id="tab-btn-upkeep-monitor" onclick="switchUpkeepSubTab('monitor')">
                    <i class="fa-solid fa-list-check"></i> Progress Upkeep Harian
                </button>
                <button class="subsheet-tab-btn" id="tab-btn-upkeep-analytics" onclick="switchUpkeepSubTab('analytics')">
                    <i class="fa-solid fa-chart-simple"></i> Analisa Produktivitas & Kinerja Upkeep
                </button>
            </div>

            <!-- 1. SUB-SHEET: PROGRESS UPKEEP HARIAN -->
            <div id="upkeep-subsheet-monitor" class="subsheet-content active">
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
                                    <th>Realisasi HK</th>
                                    <th>Realisasi Prestasi (Ha/HK)</th>
                                    <th style="text-align:center;">Aksi / Status</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-upkeep"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 2. SUB-SHEET: ANALYTICS UPKEEP -->
            <div id="upkeep-subsheet-analytics" class="subsheet-content">
                <div class="grading-filter-bar">
                    <div class="grading-filter-group">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar-day"></i> Periode Analisis</label>
                            <input type="date" id="uanal-date" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.loadUpkeepAnalyticsData()">
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-layer-group"></i> Ruang Lingkup</label>
                            <select id="uanal-scope" class="form-control" style="font-weight: 600; min-width: 160px;" onchange="window.loadUpkeepAnalyticsData()">
                                <option value="all" selected>Semua Data (Total Historis)</option>
                                <option value="mtd">MTD (Bulan Berjalan)</option>
                                <option value="daily">Harian (Tanggal Saja)</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-filter"></i> Filter Pekerjaan</label>
                            <select id="uanal-type-filter" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.processAndRenderUpkeepAnalytics()">
                                <option value="ALL">Semua Jenis Pekerjaan</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.loadUpkeepAnalyticsData()"><i class="fa-solid fa-rotate"></i> Refresh Analisis</button>
                        <button class="btn btn-secondary" onclick="window.printUpkeepAnalytics()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                        <button class="btn btn-success" onclick="window.exportUpkeepAnalyticsCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
                    </div>
                </div>

                <!-- Executive KPI Cards -->
                <div class="grading-kpi-grid">
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-map"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Luas Rawat (Ha)</h4>
                            <div class="kpi-val" id="uanal-kpi-area">0.00 Ha</div>
                            <div class="kpi-sub" id="uanal-kpi-area-sub">Target: 0.00 Ha (0%)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon blue">
                            <i class="fa-solid fa-person-digging"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Tenaga Kerja Terpakai</h4>
                            <div class="kpi-val" id="uanal-kpi-hk">0 HK</div>
                            <div class="kpi-sub" id="uanal-kpi-hk-sub">Total Alokasi Pekerja</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon yellow">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Rata-rata Prestasi Upkeep</h4>
                            <div class="kpi-val" id="uanal-kpi-prestasi">0.00 Ha/HK</div>
                            <div class="kpi-sub" id="uanal-kpi-prestasi-sub">Norma: 0.50 - 1.50 Ha/HK</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-chart-pie"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Pekerjaan Paling Dominan</h4>
                            <div class="kpi-val" id="uanal-kpi-dominant">-</div>
                            <div class="kpi-sub" id="uanal-kpi-dominant-sub">0.00 Ha (0%)</div>
                        </div>
                    </div>
                </div>

                <!-- Tabel 1: Rekapitulasi per Jenis Pekerjaan Upkeep -->
                <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin: 0;"><i class="fa-solid fa-table-list"></i> 1. Rekapitulasi Capaian & Prestasi per Jenis Pekerjaan Rawat Kebun</h3>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Komparasi target vs realisasi luas, penggunaan tenaga kerja HK, dan efisiensi prestasi kerja.</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="uanal-type-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                            <thead>
                                <tr style="background-color: #1e293b; color: white;">
                                    <th style="width: 35px;">NO</th>
                                    <th style="text-align: left; min-width: 140px;">JENIS PEKERJAAN</th>
                                    <th style="background-color: #0284c7; color: white;">TARGET (HA)</th>
                                    <th style="background-color: #059669; color: white;">REALISASI (HA)</th>
                                    <th style="background-color: #0d9488; color: white;">% CAPAIAN</th>
                                    <th>TOTAL HK</th>
                                    <th style="background-color: #6366f1; color: white;">PRESTASI (HA/HK)</th>
                                    <th style="background-color: #d97706; color: white;">EFISIENSI KERJA</th>
                                    <th>STATUS EVALUASI</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                            <tfoot></tfoot>
                        </table>
                    </div>
                </div>

                <!-- Grid: Tabel 2 & Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <!-- Tabel 2: Evaluasi Mandor & Blok -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-user-check"></i> 2. Evaluasi Produktivitas Mandor & Blok</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Rincian prestasi pemenuhan target mandor di masing-masing blok divisi.</span>
                        <div class="table-responsive">
                            <table class="data-table" id="uanal-block-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th>DIV / BLOK</th>
                                        <th>PEKERJAAN</th>
                                        <th>MANDOR</th>
                                        <th>LUAS (HA)</th>
                                        <th>HK</th>
                                        <th>HA/HK</th>
                                        <th>EVALUASI</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot></tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Chart 1: Capaian Luas per Jenis Pekerjaan -->
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> Capaian Luas Rawat (Ha) per Aktivitas</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Perbandingan target vs realisasi luas area yang telah diselesaikan.</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-uanal-type"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Komparasi Prestasi Ha/HK -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-line"></i> Produktivitas Kerja Realisasi vs Standar Norma (Ha/HK)</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Analisis efisiensi output per orang pekerja untuk tiap jenis kegiatan rawat.</span>
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="chart-uanal-prestasi"></canvas>
                    </div>
                </div>

                <!-- Smart Diagnostic Recommendations -->
                <div class="grading-insight-box">
                    <h4><i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i> Smart Upkeep Diagnostic & Recommendations</h4>
                    <ul id="uanal-insights-list"></ul>
                </div>
            </div>
        </div>
    `,
    pemupukan: `
        <div id="pemupukan-module-layout" class="animate-fade-in module-layout" style="grid-template-columns: 1fr; padding-top: 10px;">
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

            <!-- Sub-Sheet Navigation Tabs -->
            <div class="subsheet-tab-bar">
                <button class="subsheet-tab-btn active" id="tab-btn-pemupukan-monitor" onclick="switchPemupukanSubTab('monitor')">
                    <i class="fa-solid fa-seedling"></i> Rencana & Progres Harian
                </button>
                <button class="subsheet-tab-btn" id="tab-btn-pemupukan-analytics" onclick="switchPemupukanSubTab('analytics')">
                    <i class="fa-solid fa-chart-pie"></i> Analisa Kinerja & Dosis Pemupukan
                </button>
            </div>

            <!-- 1. SUB-SHEET: MONITORING HARIAN -->
            <div id="pemupukan-subsheet-monitor" class="subsheet-content active">
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

            <!-- 2. SUB-SHEET: ANALYTICS PEMUPUKAN -->
            <div id="pemupukan-subsheet-analytics" class="subsheet-content">
                <div class="grading-filter-bar">
                    <div class="grading-filter-group">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar-day"></i> Periode Analisis</label>
                            <input type="date" id="panal-date" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.loadPemupukanAnalyticsData()">
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-layer-group"></i> Ruang Lingkup</label>
                            <select id="panal-scope" class="form-control" style="font-weight: 600; min-width: 160px;" onchange="window.loadPemupukanAnalyticsData()">
                                <option value="all" selected>Semua Data (Total Historis)</option>
                                <option value="mtd">MTD (Bulan Berjalan)</option>
                                <option value="daily">Harian (Tanggal Saja)</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-filter"></i> Filter Pupuk</label>
                            <select id="panal-pupuk-filter" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.processAndRenderPemupukanAnalytics()">
                                <option value="ALL">Semua Jenis Pupuk</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.loadPemupukanAnalyticsData()"><i class="fa-solid fa-rotate"></i> Refresh Analisis</button>
                        <button class="btn btn-secondary" onclick="window.printPemupukanAnalytics()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                        <button class="btn btn-success" onclick="window.exportPemupukanAnalyticsCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
                    </div>
                </div>

                <!-- Executive KPI Cards -->
                <div class="grading-kpi-grid">
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-vector-square"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Area Terpukul (Ha)</h4>
                            <div class="kpi-val" id="panal-kpi-area">0.00 Ha</div>
                            <div class="kpi-sub" id="panal-kpi-area-sub">Target Plan: 0.00 Ha (0%)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon blue">
                            <i class="fa-solid fa-sack-xmark"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Pupuk Diaplikasikan (Kg)</h4>
                            <div class="kpi-val" id="panal-kpi-pupuk">0 Kg</div>
                            <div class="kpi-sub" id="panal-kpi-pupuk-sub">Rencana: 0 Kg (0%)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon yellow">
                            <i class="fa-solid fa-user-gear"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Rata-rata Prestasi Kerja</h4>
                            <div class="kpi-val" id="panal-kpi-prestasi">0.00 Ha/HK</div>
                            <div class="kpi-sub" id="panal-kpi-prestasi-sub">Aplikasi: 0.0 Kg / HK</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon red">
                            <i class="fa-solid fa-hourglass-half"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Sisa Defisit Belum Selesai</h4>
                            <div class="kpi-val" id="panal-kpi-sisa">0.00 Ha</div>
                            <div class="kpi-sub" id="panal-kpi-sisa-sub">Sisa Pupuk: 0 Kg</div>
                        </div>
                    </div>
                </div>

                <!-- Tabel 1: Rekapitulasi Capaian Pemupukan per Jenis Pupuk -->
                <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin: 0;"><i class="fa-solid fa-layer-group"></i> 1. Rekapitulasi Capaian & Akurasi Dosis Pemupukan per Jenis Pupuk</h3>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Evaluasi pemenuhan target luas area, pemakaian kilogram pupuk, dan deviasi dosis rekomendasi.</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="panal-pupuk-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                            <thead>
                                <tr style="background-color: #1e293b; color: white;">
                                    <th style="width: 35px;">NO</th>
                                    <th style="text-align: left; min-width: 140px;">JENIS PUPUK</th>
                                    <th style="background-color: #0284c7; color: white;">TARGET (HA)</th>
                                    <th style="background-color: #059669; color: white;">REALISASI (HA)</th>
                                    <th style="background-color: #0d9488; color: white;">% AREA</th>
                                    <th style="background-color: #0284c7; color: white;">TARGET (KG)</th>
                                    <th style="background-color: #059669; color: white;">REALISASI (KG)</th>
                                    <th style="background-color: #0d9488; color: white;">% PUPUK</th>
                                    <th>DOSIS BAKU<br>(KG/PKK)</th>
                                    <th>DOSIS REAL<br>(KG/PKK)</th>
                                    <th style="background-color: #d97706; color: white;">DEVIASI DOSIS</th>
                                    <th>STATUS APLIKASI</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                            <tfoot></tfoot>
                        </table>
                    </div>
                </div>

                <!-- Grid: Tabel 2 & Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <!-- Tabel 2: Evaluasi Mandor & Blok -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-users"></i> 2. Evaluasi Produktivitas Tenaga Kerja per Blok</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Analisis output harian tenaga kerja pemupukan dan efisiensi mandor di lapangan.</span>
                        <div class="table-responsive">
                            <table class="data-table" id="panal-block-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th>DIV / BLOK</th>
                                        <th>PUPUK</th>
                                        <th>REAL HA</th>
                                        <th>REAL KG</th>
                                        <th>HK</th>
                                        <th>HA/HK</th>
                                        <th>KG/HK</th>
                                        <th>EVALUASI</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot></tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Chart 1: Target vs Realisasi Luas -->
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> Luas Area Target vs Realisasi (Ha)</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Capaian hektar per jenis pupuk yang telah diaplikasikan di lapangan.</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-panal-area"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Komparasi Tonase Pupuk Terpakai -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-weight-scale"></i> Pemakaian Pupuk Target vs Realisasi (Kg)</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Akurasi penyerapan kilogram pupuk sesuai rekomendasi dosis agronomi.</span>
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="chart-panal-dose"></canvas>
                    </div>
                </div>

                <!-- Smart Diagnostic Recommendations -->
                <div class="grading-insight-box">
                    <h4><i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i> Smart Fertilizer Diagnostic & Recommendations</h4>
                    <ul id="panal-insights-list"></ul>
                </div>
            </div>
        </div>
    `,
    harvesting: `
        <div id="harvesting-module-layout" class="animate-fade-in module-layout" style="grid-template-columns: 1fr; padding-top: 10px;">
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

            <!-- Sub-Sheet Navigation Tabs -->
            <div class="subsheet-tab-bar">
                <button class="subsheet-tab-btn active" id="tab-btn-harvesting-monitor" onclick="switchHarvestingSubTab('monitor')">
                    <i class="fa-solid fa-wheat-awn"></i> Monitoring Panen Harian & Rekap
                </button>
                <button class="subsheet-tab-btn" id="tab-btn-harvesting-analytics" onclick="switchHarvestingSubTab('analytics')">
                    <i class="fa-solid fa-chart-column"></i> Analisa Kinerja Panen & Produktivitas
                </button>
            </div>

            <!-- 1. SUB-SHEET: MONITORING HARIAN -->
            <div id="harvesting-subsheet-monitor" class="subsheet-content active">
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

            <!-- 2. SUB-SHEET: HARVESTING ANALYTICS -->
            <div id="harvesting-subsheet-analytics" class="subsheet-content">
                <div class="grading-filter-bar">
                    <div class="grading-filter-group">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar-day"></i> Periode Analisis</label>
                            <input type="date" id="hanal-date" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.loadHarvestingAnalyticsData()">
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-layer-group"></i> Ruang Lingkup</label>
                            <select id="hanal-scope" class="form-control" style="font-weight: 600; min-width: 160px;" onchange="window.loadHarvestingAnalyticsData()">
                                <option value="all" selected>Semua Data (Total Historis)</option>
                                <option value="mtd">MTD (Bulan Berjalan)</option>
                                <option value="daily">Harian (Tanggal Saja)</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-filter"></i> Filter Divisi</label>
                            <select id="hanal-divisi-filter" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.processAndRenderHarvestingAnalytics()">
                                <option value="ALL">Semua Divisi</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.loadHarvestingAnalyticsData()"><i class="fa-solid fa-rotate"></i> Refresh Analisis</button>
                        <button class="btn btn-secondary" onclick="window.printHarvestingAnalytics()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                        <button class="btn btn-success" onclick="window.exportHarvestingAnalyticsCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
                    </div>
                </div>

                <!-- Executive KPI Cards -->
                <div class="grading-kpi-grid">
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-scale-balanced"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Produksi Tonase</h4>
                            <div class="kpi-val" id="hanal-kpi-tonase">0.00 Ton</div>
                            <div class="kpi-sub" id="hanal-kpi-janjang">Total 0 Janjang (JJG)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon blue">
                            <i class="fa-solid fa-chart-area"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Luas Panen</h4>
                            <div class="kpi-val" id="hanal-kpi-area">0.00 Ha</div>
                            <div class="kpi-sub" id="hanal-kpi-density">Kerapatan: 0 JJG / Ha</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon yellow">
                            <i class="fa-solid fa-person-digging"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Produktivitas Pemanen</h4>
                            <div class="kpi-val" id="hanal-kpi-output">0 JJG/HK</div>
                            <div class="kpi-sub" id="hanal-kpi-output-ton">Output: 0.00 Ton / HK</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-weight-scale"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Rata-rata Berat Janjang (BJR)</h4>
                            <div class="kpi-val" id="hanal-kpi-bjr">0.00 Kg</div>
                            <div class="kpi-sub" id="hanal-kpi-pemanen-count">Total 0 HK Pemanen</div>
                        </div>
                    </div>
                </div>

                <!-- Tabel 1: Rekapitulasi Kinerja Panen per Divisi -->
                <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin: 0;"><i class="fa-solid fa-sitemap"></i> 1. Rekapitulasi Kinerja & Output Panen per Divisi</h3>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Konsolidasi produksi janjang, tonase panen, kerapatan pohon, dan output prestasi pemanen per divisi.</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table" id="hanal-divisi-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                            <thead>
                                <tr style="background-color: #1e293b; color: white;">
                                    <th style="width: 35px;">NO</th>
                                    <th style="text-align: left; min-width: 140px;">DIVISI</th>
                                    <th style="background-color: #0284c7; color: white;">LUAS PANEN (HA)</th>
                                    <th style="background-color: #059669; color: white;">TOTAL JJG</th>
                                    <th>KERAPATAN (JJG/HA)</th>
                                    <th>BJR AKTUAL (KG)</th>
                                    <th style="background-color: #059669; color: white;">EST. TONASE (TON)</th>
                                    <th>HK PEMANEN</th>
                                    <th style="background-color: #6366f1; color: white;">OUTPUT JJG/HK</th>
                                    <th style="background-color: #d97706; color: white;">OUTPUT TON/HK</th>
                                    <th>STATUS KINERJA</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                            <tfoot></tfoot>
                        </table>
                    </div>
                </div>

                <!-- Grid: Tabel 2 & Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <!-- Tabel 2: Analisis Blok & Pusingan -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-cubes-stacked"></i> 2. Analisis Produktivitas & Pusingan Panen per Blok</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Evaluasi kedisiplinan interval pusingan rotasi panen (standar 7-10 hari) dan pemenuhan taksasi.</span>
                        <div class="table-responsive">
                            <table class="data-table" id="hanal-block-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th>DIV / BLOK</th>
                                        <th>ROUND</th>
                                        <th>MANDOR</th>
                                        <th>EST JJG</th>
                                        <th>ACT JJG</th>
                                        <th>% CAPAIAN</th>
                                        <th>JJG/HK</th>
                                        <th>STATUS PUSINGAN</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot></tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Chart 1: Tonase Panen per Divisi -->
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> Produksi Tonase & Janjang per Divisi</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Sebaran hasil panen TBS yang diperoleh dari tiap-tiap divisi kebun.</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-hanal-divisi"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart 2: Output Pemanen vs Kerapatan -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-line"></i> Produktivitas Pemanen (JJG/HK) vs Kerapatan Buah (JJG/Ha)</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Hubungan antara ketersediaan buah matang di pohon dengan kecepatan hasil potong tenaga panen.</span>
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="chart-hanal-output"></canvas>
                    </div>
                </div>

                <!-- Smart Diagnostic Recommendations -->
                <div class="grading-insight-box">
                    <h4><i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i> Smart Harvesting Diagnostic & Recommendations</h4>
                    <ul id="hanal-insights-list"></ul>
                </div>
            </div>
        </div>
    `,
    tonase: `
        <div class="animate-fade-in module-layout" id="tonase-layout" style="grid-template-columns: 1fr;">
            
            <!-- Sub-Sheet Navigation Tabs -->
            <div class="subsheet-tab-bar">
                <button class="subsheet-tab-btn active" id="tab-btn-tonase-monitor" onclick="switchTonaseSubTab('monitor')">
                    <i class="fa-solid fa-clock"></i> Monitoring Tonase Harian & Jam-Jaman
                </button>
                <button class="subsheet-tab-btn" id="tab-btn-tonase-summary" onclick="switchTonaseSubTab('summary')">
                    <i class="fa-solid fa-chart-pie"></i> Summary Penerimaan TBS & Analisa Operasional
                </button>
            </div>

            <!-- 1. SUB-SHEET: MONITORING TONASE HARIAN & JAM-JAMAN -->
            <div id="tonase-subsheet-monitor" class="subsheet-content active">
                <!-- Export Wrapper -->
                <div id="export-dashboard-wrapper" style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                <div style="margin-bottom: 15px;">
                    <h2 style="margin: 0; font-size: 1.5rem; color: var(--primary-color);">Monitoring FFB Received, EFB Evacuation & Despatch CPOPK</h2>
                </div>
                
                <div style="display: flex; justify-content: flex-end; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 15px;">
                    <!-- Controls -->
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
                        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="background: #e2e8f0; padding: 4px 10px; font-weight: bold; text-decoration: underline;">MONITORING EVAKUASI EFB</span>
                            <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="openEfbHistoricalModal()">
                                <i class="fa-solid fa-clock-rotate-left"></i> Historical
                            </button>
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

                <!-- Prime Time Chart -->
                <div class="glass-card table-wrapper" style="margin-top: 20px;">
                    <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <h2 style="margin:0; display:flex; align-items:center; gap: 10px;">
                            Prime Time Monitoring
                            <button class="btn btn-primary btn-sm" onclick="openHistoricalPlanning()">Historical Planning</button>
                            <button class="btn btn-primary btn-sm" onclick="openHistoricalActual()">Historical Actual</button>
                        </h2>
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

            <!-- 2. SUB-SHEET: SUMMARY PENERIMAAN TBS (NEW ANALYTICS) -->
            <div id="tonase-subsheet-summary" class="subsheet-content">
                <!-- Filter & Control Toolbar -->
                <div class="grading-filter-bar">
                    <div class="grading-filter-group">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar-day"></i> Tanggal Analisis</label>
                            <input type="date" id="tsum-date" class="form-control" style="font-weight: 600; min-width: 150px;" onchange="window.loadTonaseSummaryData()">
                        </div>
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-layer-group"></i> Ruang Lingkup Data</label>
                            <select id="tsum-scope" class="form-control" style="font-weight: 600; min-width: 170px;" onchange="window.loadTonaseSummaryData()">
                                <option value="daily" selected>Harian (1 Hari Penuh)</option>
                                <option value="mtd">MTD (Bulan Berjalan)</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.loadTonaseSummaryData()"><i class="fa-solid fa-rotate"></i> Refresh Analisis</button>
                        <button class="btn btn-secondary" onclick="window.printTonaseSummary()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                        <button class="btn btn-success" onclick="window.exportTonaseSummaryCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
                    </div>
                </div>

                <!-- Executive KPI Cards -->
                <div class="grading-kpi-grid">
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-scale-balanced"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Total Realisasi TBS</h4>
                            <div class="kpi-val" id="tsum-kpi-total-tbs">0.00 Ton</div>
                            <div class="kpi-sub" id="tsum-kpi-total-plan">Target Plan: 0.00 Ton (0%)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon blue">
                            <i class="fa-solid fa-truck-ramp-box"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Efisiensi Armada / Payload</h4>
                            <div class="kpi-val" id="tsum-kpi-payload">0.00 Ton/Trip</div>
                            <div class="kpi-sub" id="tsum-kpi-trips">Total 0 Trip Armada Truk</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon yellow">
                            <i class="fa-solid fa-business-time"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Distribusi Waktu Kedatangan</h4>
                            <div class="kpi-val" id="tsum-kpi-timedist">0% / 0% / 0%</div>
                            <div class="kpi-sub" id="tsum-kpi-timedist-sub">Prime (06-12) / Mid (13-18) / Last (19-24)</div>
                        </div>
                    </div>
                    <div class="grading-kpi-card">
                        <div class="grading-kpi-icon green">
                            <i class="fa-solid fa-recycle"></i>
                        </div>
                        <div class="grading-kpi-info">
                            <h4>Kinerja Evakuasi EFB</h4>
                            <div class="kpi-val" id="tsum-kpi-efb">0.00 Ton</div>
                            <div class="kpi-sub" id="tsum-kpi-efb-sub">Sisa JJK Pabrik: 0.00 Ton</div>
                        </div>
                    </div>
                </div>

                <!-- Tabel 1: Rekapitulasi Penerimaan TBS & Distribusi Waktu per Estate -->
                <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin: 0;">1. Rekapitulasi Penerimaan TBS & Distribusi Waktu Kedatangan per Estate</h3>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Rincian target plan, realisasi penerimaan, efisiensi muatan truk, loose fruit, dan sebaran waktu kirim (Prime: 06-12, Middle: 13-18, Last: 19-24).</span>
                        </div>
                    </div>
                    <div id="tsum-estate-table-wrapper" class="table-responsive">
                        <style>
                            #tsum-estate-table th, #tsum-estate-table td {
                                padding: 6px 8px !important;
                                text-align: center;
                            }
                            #tsum-estate-table th {
                                white-space: nowrap;
                            }
                        </style>
                        <table class="data-table" id="tsum-estate-table" style="font-size: 0.8rem; width: 100%;">
                            <thead>
                                <tr style="background-color: #334155; color: white;">
                                    <th rowspan="2" style="width: 35px;">NO</th>
                                    <th rowspan="2" style="text-align: left; min-width: 140px;">ESTATE</th>
                                    <th rowspan="2" style="background-color: #0284c7; color: white;">TARGET PLAN<br>(TON)</th>
                                    <th rowspan="2" style="background-color: #059669; color: white;">REALISASI TBS<br>(TON)</th>
                                    <th rowspan="2" style="background-color: #0d9488; color: white;">% CAPAIAN<br>PLAN</th>
                                    <th rowspan="2">TRIP<br>(RIT)</th>
                                    <th rowspan="2" style="background-color: #6366f1; color: white;">RATA-RATA<br>TON/TRIP</th>
                                    <th colspan="2" style="background-color: #f59e0b; color: white;">LOOSE FRUIT (LF)</th>
                                    <th colspan="2" style="background-color: #2563eb; color: white;">PRIME TIME (06-12)</th>
                                    <th colspan="2" style="background-color: #16a34a; color: white;">MIDDLE TIME (13-18)</th>
                                    <th colspan="2" style="background-color: #d97706; color: white;">LAST TIME (19-24)</th>
                                    <th rowspan="2" style="min-width: 130px;">STATUS & EVALUASI</th>
                                </tr>
                                <tr style="background-color: #475569; color: white; font-size: 0.72rem;">
                                    <th>TON</th><th>% LF</th>
                                    <th>TON</th><th>%</th>
                                    <th>TON</th><th>%</th>
                                    <th>TON</th><th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Injected JS -->
                            </tbody>
                            <tfoot>
                                <!-- Injected JS -->
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Grid: Tabel 2 (Interval 2 Jam) & Tabel 3 (Evakuasi EFB) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    
                    <!-- Tabel 2: Rekapitulasi Arus Masuk Interval 2 Jam -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;">2. Monitoring Ritme Kedatangan TBS per Interval 2 Jam</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Analisis kepadatan arus masuk loading ramp & timbangan per blok 2 jam.</span>
                        <div id="tsum-interval-table-wrapper" class="table-responsive">
                            <table class="data-table" id="tsum-interval-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th>INTERVAL WAKTU</th>
                                        <th>PLAN (TON)</th>
                                        <th>REALISASI (TON)</th>
                                        <th>TRIP</th>
                                        <th>PROPORSI (%)</th>
                                        <th>KUMULATIF (TON)</th>
                                        <th>STATUS KEPADATAN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Injected JS -->
                                </tbody>
                                <tfoot>
                                    <!-- Injected JS -->
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Tabel 3: Neraca & Monitoring Evakuasi EFB -->
                    <div class="glass-card" style="overflow-x: auto;">
                        <h3 style="margin-top: 0; margin-bottom: 8px;">3. Neraca & Monitoring Evakuasi EFB (Jangkos)</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Realisasi pengangkutan jangkos vs estimasi produksi pabrik per estate.</span>
                        
                        <!-- Mini Balance Box -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; font-size: 0.75rem; text-align: center;">
                            <div style="background: #f1f5f9; padding: 6px; border-radius: 6px;">
                                <div style="color: var(--text-secondary);">Sisa Kemarin</div>
                                <div id="tsum-efb-kemarin" style="font-weight: bold; font-size: 0.9rem;">0.00 Ton</div>
                            </div>
                            <div style="background: #e0f2fe; padding: 6px; border-radius: 6px;">
                                <div style="color: #0369a1;">Est. Produksi EFB</div>
                                <div id="tsum-efb-produksi" style="font-weight: bold; font-size: 0.9rem; color: #0369a1;">0.00 Ton</div>
                            </div>
                            <div style="background: #dcfce7; padding: 6px; border-radius: 6px;">
                                <div style="color: #15803d;">Total Evakuasi</div>
                                <div id="tsum-efb-realisasi" style="font-weight: bold; font-size: 0.9rem; color: #15803d;">0.00 Ton</div>
                            </div>
                            <div style="background: #fef3c7; padding: 6px; border-radius: 6px;">
                                <div style="color: #b45309;">Sisa di Pabrik</div>
                                <div id="tsum-efb-sisa" style="font-weight: bold; font-size: 0.9rem; color: #b45309;">0.00 Ton</div>
                            </div>
                        </div>

                        <div id="tsum-efb-table-wrapper" class="table-responsive">
                            <table class="data-table" id="tsum-efb-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                                <thead>
                                    <tr style="background-color: #1e293b; color: white;">
                                        <th style="width: 30px;">NO</th>
                                        <th style="text-align: left;">ESTATE</th>
                                        <th>TARGET (TON)</th>
                                        <th>REALISASI (TON)</th>
                                        <th>% CAPAIAN</th>
                                        <th>TRIP</th>
                                        <th>TON/TRIP</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Injected JS -->
                                </tbody>
                                <tfoot>
                                    <!-- Injected JS -->
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Grafik Analisis Interaktif -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-column"></i> Grafik Distribusi Waktu Kirim TBS per Estate</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Proporsi kedatangan Prime (06-12), Middle (13-18), dan Last Time (19-24).</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-tsum-timedist"></canvas>
                        </div>
                    </div>
                    <div class="glass-card">
                        <h3 style="margin-top: 0; margin-bottom: 8px;"><i class="fa-solid fa-chart-area"></i> Grafik Arus Kedatangan TBS Interval 2 Jam</h3>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 12px;">Pola tonase masuk per 2 jam vs kurva kumulatif penerimaan harian.</span>
                        <div style="position: relative; height: 320px; width: 100%;">
                            <canvas id="chart-tsum-interval"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Smart Operational Diagnostic & Recommendations Box -->
                <div class="grading-insight-box" id="tsum-insights-box">
                    <h4><i class="fa-solid fa-lightbulb"></i> Rekomendasi & Analisis Operasional Penerimaan TBS & Evakuasi EFB:</h4>
                    <ul id="tsum-insights-list">
                        <!-- Injected JS -->
                    </ul>
                </div>
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
        
        <!-- Modal Historical EFB -->
        <div class="modal-overlay" id="efb-historical-modal" style="display:none; z-index: 1000;">
            <div class="modal-content" style="max-width: 95%; width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Historical Evakuasi EFB</h2>
                    <button type="button" class="modal-close" onclick="document.getElementById('efb-historical-modal').style.display = 'none'">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
                        <label>Dari Tanggal:</label>
                        <input type="date" id="efb-historical-start-date" class="form-control">
                        <label>Sampai Tanggal:</label>
                        <input type="date" id="efb-historical-end-date" class="form-control">
                        <label>Estate:</label>
                        <select id="efb-historical-estate" class="form-control" onchange="loadEfbHistoricalChartData()">
                            <option value="ALL">All Estate (Gabungan)</option>
                        </select>
                        <button class="btn btn-primary" onclick="loadEfbHistoricalChartData()">OK</button>
                    </div>
                    <div style="height: 400px; width: 100%;">
                        <canvas id="efbHistoricalChartCanvas"></canvas>
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
                    
                    <div style="margin-top: 20px; text-align: right;">
                        <button type="button" class="btn" style="background-color: #e2e8f0; color: #333; margin-right: 10px;" onclick="document.getElementById('daily-monitor-modal').style.display='none'">Batal</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-save"></i> Simpan Harian
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Historical Actual Modal -->
        <div class="modal-overlay" id="modal-historical-actual" style="display:none; z-index: 1000;">
            <div class="modal-content" style="width: 1200px; max-width: 95vw; height: 90vh; display:flex; flex-direction:column; overflow:hidden;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding: 15px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <h3 style="margin:0;"><i class="fa-solid fa-chart-column"></i> Historical Actual</h3>
                    <button type="button" class="modal-close" onclick="document.getElementById('modal-historical-actual').style.display='none';">&times;</button>
                </div>
                <div style="padding: 15px; display:flex; gap:10px; align-items:center; background:white; border-bottom:1px solid #e2e8f0;">
                    <label style="font-weight:bold;">Tipe Akumulasi:</label>
                    <select id="historical-actual-type" class="form-control" style="width:auto;" onchange="window.toggleHistoricalActualInputs()">
                        <option value="bulanan">Bulanan</option>
                        <option value="harian">Harian</option>
                    </select>
                    
                    <label id="lbl-historical-actual-month" style="font-weight:bold; margin-left:10px;">Pilih Bulan:</label>
                    <input type="month" id="historical-actual-month" class="form-control" style="width:auto;" value="${window.getLocalDate().substring(0, 7)}" onchange="loadHistoricalActualChart()">
                    
                    <label id="lbl-historical-actual-date" style="font-weight:bold; margin-left:10px; display:none;">Pilih Tanggal:</label>
                    <input type="date" id="historical-actual-date" class="form-control" style="width:auto; display:none;" value="${window.getLocalDate()}" onchange="loadHistoricalActualChart()">
                    
                    <button class="btn btn-primary" style="margin-left:10px;" onclick="loadHistoricalActualChart()">Tampilkan</button>
                </div>
                <div style="flex:1; padding: 15px; background: white; overflow-y: auto; display:flex; flex-direction:column; gap: 20px;">
                    <div style="width:100%; position:relative; min-height: 400px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="text-align: center; margin-top: 0;">Prime Time Actual Monitoring</h4>
                        <canvas id="historicalActualPrimeChartCanvas"></canvas>
                    </div>
                    <div style="width:50%; margin: 0 auto; position:relative; min-height: 400px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="text-align: center; margin-top: 0;">Cumulative FFB Received by Time Band</h4>
                        <canvas id="cumulativeFFBTimeBandChartCanvas"></canvas>
                    </div>
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
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="btn" style="background:#64748b; color:#fff;" onclick="addSupplyChainMaster()"><i class="fa-solid fa-plus"></i> Tambah Supply Chain</button>
                            <button type="button" class="btn btn-primary" onclick="saveSupplyChain()"><i class="fa-solid fa-save"></i> Simpan</button>
                        </div>
                    </div>
                    <div id="container-master-supply-chain" style="margin-top: 15px; width: 100%; overflow-x: auto;"></div>
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
                                <option>Grading</option>
                                <option>Analis</option>
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
    `,
    processing: `
<div class="content-header">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <input type="date" id="p-date" class="form-control" style="width: auto;" onchange="loadProcessingData()">
        <button class="btn btn-primary" onclick="loadProcessingData()"><i class="fa-solid fa-rotate"></i> Load</button>
        <button class="btn btn-success btn-tonase-action" onclick="openLiquidModal()"><i class="fa-solid fa-plus"></i> Input Parameter Liquid</button>
        <button class="btn btn-success btn-tonase-action" onclick="openFfaModal()"><i class="fa-solid fa-plus"></i> Input Parameter FFA</button>
        <button class="btn btn-info" onclick="openProcessingHistorical()"><i class="fa-solid fa-clock-rotate-left"></i> Historical Per Jam</button>
    </div>
</div>
<div class="dashboard-grid" style="grid-template-columns: 1fr;">
    <div class="glass-card" style="overflow-x: auto;">
        <h3>1a. Liquid Monitoring (Summary Hari Ini)</h3>
        <div class="table-responsive" style="width: 100%;">
            <table class="data-table" id="summary-liquid-table" style="min-width: 1200px;">
                <thead>
                    <tr>
                        <th rowspan="2">Jam</th>
                        <th colspan="5">COT (Oil 36-38 %)</th>
                        <th colspan="6">CST</th>
                        <th colspan="5">Sludge Tank</th>
                    </tr>
                    <tr>
                        <th>OIL<br>(standart 36-38%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                        <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th><th>Ketebalan Minyak<br>(mm)</th>
                        <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                    </tr>
                </thead>
                <tbody id="summary-liquid-tbody">
                    <!-- Generated via JS -->
                </tbody>
            </table>
        </div>
    </div>

    
    <div class="glass-card" style="overflow-x: auto;">
        <h3>1c. FFA Produksi (Summary Hari Ini)</h3>
        <div class="table-responsive">
            <table class="data-table" id="summary-ffa-table">
                <thead>
                    <tr>
                        <th rowspan="2">Keterangan</th>
                        <th colspan="3">Sebelum Washing Plant</th>
                        <th colspan="3">Setelah Washing Plant</th>
                    </tr>
                    <tr>
                        <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                        <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                    </tr>
                </thead>
                <tbody id="summary-ffa-tbody">
                    <!-- Generated via JS -->
                </tbody>
            </table>
        </div>
    </div>
    

</div>

<!-- Modal Input Liquid -->
<div class="modal-overlay" id="modal-input-liquid" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 900px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Parameter Liquid</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-input-liquid').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <input type="date" id="ml-date" class="form-control" style="width: 150px;" onchange="loadLiquidHour()">
                <select id="ml-hour" class="form-control" style="width: 120px;" onchange="loadLiquidHour()">
                    <option value="07:00">07:00</option><option value="08:00">08:00</option>
                    <option value="09:00">09:00</option><option value="10:00">10:00</option>
                    <option value="11:00">11:00</option><option value="12:00">12:00</option>
                    <option value="13:00">13:00</option><option value="14:00">14:00</option>
                    <option value="15:00">15:00</option><option value="16:00">16:00</option>
                    <option value="17:00">17:00</option><option value="18:00">18:00</option>
                    <option value="19:00">19:00</option><option value="20:00">20:00</option>
                    <option value="21:00">21:00</option><option value="22:00">22:00</option>
                    <option value="23:00">23:00</option><option value="24:00">24:00</option>
                    <option value="01:00">01:00</option><option value="02:00">02:00</option>
                    <option value="03:00">03:00</option><option value="04:00">04:00</option>
                    <option value="05:00">05:00</option><option value="06:00">06:00</option>
                </select>
            </div>
            <!-- inputs table for Liquid -->
            <div class="table-responsive">
                <table class="data-table" style="width: 100%; min-width: 600px;">
                    <thead>
                        <tr>
                            <th>PARAMETER</th>
                            <th>COT</th>
                            <th>CST</th>
                            <th>SLUDGE TANK</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>OIL (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_oil" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_oil" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_oil" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>SLUDGE (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_sludge" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_sludge" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_sludge" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>WATER (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_water" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_water" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_water" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>SOLID (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_solid" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_solid" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_solid" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>TEMP (°C)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_temp" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_temp" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_temp" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>KETEBALAN MINYAK</strong></td>
                            <td style="background: #f3f4f6;"></td>
                            <td><input type="number" step="any" id="ml_cst_level" class="form-control"></td>
                            <td style="background: #f3f4f6;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 10px; padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; font-size: 14px;">
                <strong><i class="fa-solid fa-triangle-exclamation"></i> Note:</strong> Total persentase (Oil + Sludge + Water + Solid) untuk masing-masing <strong>COT, CST, dan Sludge Tank</strong> harus berjumlah tepat <strong>100%</strong>.
            </div>
            <button class="btn btn-success mt-3" onclick="saveLiquidHour()">Simpan Liquid</button>
        </div>
    </div>
</div>

<!-- Modal Input FFA -->
<div class="modal-overlay" id="modal-input-ffa" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 600px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Parameter FFA</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-input-ffa').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <input type="date" id="mf-date" class="form-control" style="width: 150px;" onchange="loadFfaHour()">
                <select id="mf-hour" class="form-control" style="width: 120px;" onchange="loadFfaHour()">
                    <option value="08:00">08:00</option><option value="10:00">10:00</option>
                    <option value="12:00">12:00</option><option value="15:00">15:00</option>
                    <option value="17:00">17:00</option><option value="19:00">19:00</option>
                    <option value="22:00">22:00</option><option value="24:00">24:00</option>
                    <option value="02:00">02:00</option><option value="04:00">04:00</option>
                </select>
            </div>
            <table class="data-table" style="width:100%; margin-top:15px; margin-bottom: 15px;">
                <thead>
                    <tr>
                        <th style="text-align:center;">PARAMETER</th>
                        <th style="text-align:center;">Sebelum Washing Plant</th>
                        <th style="text-align:center;">Setelah Washing Plant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight:bold;">FFA</td>
                        <td><input type="number" step="0.1" id="mf_ffa_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.1" id="mf_ffa_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Moisture (%)</td>
                        <td><input type="number" step="0.01" id="mf_moist_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.01" id="mf_moist_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Dirt (%)</td>
                        <td><input type="number" step="0.001" id="mf_dirt_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.001" id="mf_dirt_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                </tbody>
            </table>
            <button class="btn btn-success mt-3" onclick="saveFfaHour()">Simpan FFA</button>
        </div>
    </div>
</div>

<!-- Modal Historical Processing -->
<div class="modal-overlay" id="modal-processing-hist" style="display:none; z-index:9998;">
    <div class="modal-content" style="max-width: 95%; width:100%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Historical Processing (Per Jam)</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-processing-hist').style.display='none'">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            <h4>Data Liquid</h4>
            <div class="table-responsive" style="margin-bottom:20px;">
                <table class="data-table" id="hist-liquid-table" style="min-width: 1200px;">
                    <thead>
                        <tr>
                            <th rowspan="2">Jam</th>
                            <th colspan="5">COT (Oil 36-38 %)</th>
                            <th colspan="6">CST</th>
                            <th colspan="5">Sludge Tank</th>
                        </tr>
                        <tr>
                            <th>OIL<br>(standart 36-38%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                            <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th><th>Ketebalan Minyak<br>(mm)</th>
                            <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <h4>Data FFA</h4>
            <div class="table-responsive">
                <table class="data-table" id="hist-ffa-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Jam</th>
                            <th colspan="3">Sebelum Washing Plant</th>
                            <th colspan="3">Setelah Washing Plant</th>
                        </tr>
                        <tr>
                            <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                            <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`,
    water: `
<div class="content-header">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <input type="date" id="w-date" class="form-control" style="width: auto;">
        <button class="btn btn-primary" onclick="loadWaterData()"><i class="fa-solid fa-rotate"></i> Load</button>
        <button class="btn btn-success" onclick="document.getElementById('w_sebelum_date').value = document.getElementById('w-date').value || window.getLocalDate(); window.loadSebelumDataByDate(); document.getElementById('modal-water-sebelum').style.display='flex'"><i class="fa-solid fa-plus"></i> Input Air Sebelum Proses</button>
        <button class="btn btn-success" onclick="document.getElementById('w_boiler_date').value = document.getElementById('w-date').value || window.getLocalDate(); window.fetchBoilerHourlyByDate(); document.getElementById('modal-water-boiler').style.display='flex'"><i class="fa-solid fa-plus"></i> Update Air Boiler</button>
    </div>
</div>

<div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
    <div class="glass-card">
        <h3>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive">
            <table class="data-table" id="table-water-sebelum">
                <tbody>
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> RAW WATER</strong></td></tr>
                    <tr><td style="width:50%;">PH</td><td id="td_raw_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_raw_tds"></td></tr>
                    <tr><td>T.hardness</td><td id="td_raw_thardness"></td></tr>
                    <tr><td>Silica/Sio2</td><td id="td_raw_silica"></td></tr>
                    <tr><td>Turbidity</td><td id="td_raw_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_raw_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> WTP / clarifier</strong></td></tr>
                    <tr><td>PH</td><td id="td_wtp_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_wtp_tds"></td></tr>
                    <tr><td>Turbidity(<10)</td><td id="td_wtp_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_wtp_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> Sand Filter</strong></td></tr>
                    <tr><td>PH</td><td id="td_sand_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_sand_tds"></td></tr>
                    <tr><td>Turbidity(<10)</td><td id="td_sand_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_sand_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>Demin plant no.1 atau no.2 (pilihan)</strong></td></tr>
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> CATION</strong></td></tr>
                    <tr><td>PH(<5.5)</td><td id="td_cation_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_cation_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_cation_thardness"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> ANION</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_anion_ph"></td></tr>
                    <tr><td>Tds(<100)</td><td id="td_anion_tds"></td></tr>
                    <tr><td>SiO2/silica(<2.5)</td><td id="td_anion_silica"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> FEED TANK</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_feed_ph"></td></tr>
                    <tr><td>Tds(<100)</td><td id="td_feed_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_feed_thardness"></td></tr>
                    <tr><td>Silica/SiO2(<5)</td><td id="td_feed_silica"></td></tr>
                    <tr><td>Cloride</td><td id="td_feed_cloride"></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="glass-card">
        <h3>1.2 ANALISA AIR BOILER SELAMA PENGOLAHAN</h3>
        <div class="table-responsive">
            <table class="data-table" id="table-water-boiler">
                <thead>
                    <tr>
                        <th style="width:50%;">PARAMETER</th>
                        <th>HASIL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>PH(10.5-11.5)</td><td id="td_boiler2j_ph"></td></tr>
                    <tr><td>Tds(<1800)</td><td id="td_boiler2j_tds"></td></tr>
                    <tr><td>P.alkanity(300 - 700)</td><td id="td_boiler2j_palkanity"></td></tr>
                    <tr><td>M.alkanity(<1300)</td><td id="td_boiler2j_malkanity"></td></tr>
                    <tr><td>O.alkanity(>2,5xsilica)</td><td id="td_boiler2j_oalkanity"></td></tr>
                    <tr><td>T.hardness</td><td id="td_boiler2j_thardness"></td></tr>
                    <tr><td>Silica/SiO2(<125)</td><td id="td_boiler2j_silica"></td></tr>
                    <tr><td>Phospate/PO4(30 - 70)</td><td id="td_boiler2j_phospate"></td></tr>
                    <tr><td>Sulfite/SO3(30 - 70)</td><td id="td_boiler2j_sulfite"></td></tr>
                    <tr><td>Chloride</td><td id="td_boiler2j_chloride"></td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modals -->
<div class="modal-overlay" id="modal-water-sebelum" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 900px; width:90%; padding:20px; max-height:90vh; overflow-y:auto;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Analisa Air Sebelum Proses</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-water-sebelum').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold;">Tanggal:</label>
                <input type="date" id="w_sebelum_date" class="form-control" onchange="window.loadSebelumDataByDate()">
            </div>
            <div class="table-responsive">
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 50%;">PARAMETER</th>
                            <th>NILAI PARAMETER</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> RAW WATER</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_raw_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_raw_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness</td><td><input type="number" step="any" id="w_raw_thardness" class="form-control"></td></tr>
                        <tr><td>Silica/Sio2</td><td><input type="number" step="any" id="w_raw_silica" class="form-control"></td></tr>
                        <tr><td>Turbidity</td><td><input type="number" step="any" id="w_raw_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_raw_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> WTP / clarifier</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_wtp_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_wtp_tds" class="form-control"></td></tr>
                        <tr><td>Turbidity(<10)</td><td><input type="number" step="any" id="w_wtp_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_wtp_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> Sand Filter</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_sand_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_sand_tds" class="form-control"></td></tr>
                        <tr><td>Turbidity(<10)</td><td><input type="number" step="any" id="w_sand_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_sand_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>Demin plant no.1 atau no.2 (pilihan)</strong></td></tr>
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> CATION</strong></td></tr>
                        <tr><td>PH(<5.5)</td><td><input type="number" step="any" id="w_cation_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_cation_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness(Trace)</td><td><input type="number" step="any" id="w_cation_thardness" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> ANION</strong></td></tr>
                        <tr><td>PH(6.5 - 9.5)</td><td><input type="number" step="any" id="w_anion_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<100)</td><td><input type="number" step="any" id="w_anion_tds" class="form-control"></td></tr>
                        <tr><td>SiO2/silica(<2.5)</td><td><input type="number" step="any" id="w_anion_silica" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> FEED TANK</strong></td></tr>
                        <tr><td>PH(6.5 - 9.5)</td><td><input type="number" step="any" id="w_feed_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<100)</td><td><input type="number" step="any" id="w_feed_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness(Trace)</td><td><input type="number" step="any" id="w_feed_thardness" class="form-control"></td></tr>
                        <tr><td>Silica/SiO2(<5)</td><td><input type="number" step="any" id="w_feed_silica" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_feed_cloride" class="form-control"></td></tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary" style="margin-top:15px; width:100%" onclick="saveWaterData('sebelum')"><i class="fa-solid fa-floppy-disk"></i> Simpan Analisa Sebelum Proses</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-water-boiler" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 600px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Update Analisa Air Boiler</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-water-boiler').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="flex:1;">
                    <label style="font-weight: bold;">Tanggal:</label>
                    <input type="date" id="w_boiler_date" class="form-control" onchange="window.fetchBoilerHourlyByDate()">
                </div>
                <div style="flex:1;">
                    <label style="font-weight: bold;">Jam Olah:</label>
                    <select id="w_boiler_jam" class="form-control" onchange="window.loadBoilerHourlyData()">
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
                    <option value="00:00">00:00</option>
                    <option value="01:00">01:00</option>
                    <option value="02:00">02:00</option>
                    <option value="03:00">03:00</option>
                    <option value="04:00">04:00</option>
                    <option value="05:00">05:00</option>
                    <option value="06:00">06:00</option>
                </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 50%;">PARAMETER</th>
                            <th>NILAI PARAMETER</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>PH(10.5-11.5)</td><td><input type="number" step="0.1" id="w_boiler2j_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<1800)</td><td><input type="number" step="any" min="500" id="w_boiler2j_tds" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>P.alkanity(300 - 700)</td><td><input type="number" step="any" min="100" id="w_boiler2j_palkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>M.alkanity(<1300)</td><td><input type="number" step="any" min="100" id="w_boiler2j_malkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>O.alkanity(>2.5xsilica)</td><td><input type="number" step="any" min="50" id="w_boiler2j_oalkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>T.hardness</td><td><input type="number" step="any" id="w_boiler2j_thardness" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Silica/SiO2(<125)</td><td><input type="number" step="any" id="w_boiler2j_silica" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Phospate/PO4(30 - 70)</td><td><input type="number" step="any" id="w_boiler2j_phospate" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Sulfite/SO3(30 - 70)</td><td><input type="number" step="any" id="w_boiler2j_sulfite" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Chloride</td><td><input type="number" step="any" id="w_boiler2j_chloride" class="form-control"></td></tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary" style="margin-top:15px; width:100%" onclick="saveWaterData('boiler')"><i class="fa-solid fa-floppy-disk"></i> Simpan Analisa Boiler</button>
        </div>
    </div>
</div>
`,
    ffb_quality: `
<!-- Sub-Sheet Navigation Tabs -->
<div class="subsheet-tab-bar">
    <button class="subsheet-tab-btn active" id="tab-btn-loose" onclick="switchFFBSubTab('loose')">
        <i class="fa-solid fa-seedling"></i> FFB Quality Fruit Loose Analysis
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-crop" onclick="switchFFBSubTab('crop')">
        <i class="fa-solid fa-wheat-awn"></i> Daily FFB Crop Quality
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-detail" onclick="switchFFBSubTab('detail')">
        <i class="fa-solid fa-table-list"></i> Detail FFQ FFB Crop Quality
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-monthly" onclick="switchFFBSubTab('monthly')">
        <i class="fa-solid fa-calendar-check"></i> Summary Monthly Grading
    </button>
</div>

<!-- 1. SUB-SHEET: LOOSE FRUIT ANALYSIS -->
<div id="ffb-subsheet-loose" class="subsheet-content active">
    <div class="content-header" style="margin-bottom: 15px;">
        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="openFqRangeModal('loose')"><i class="fa-solid fa-rotate"></i> Load Data</button>
            <button class="btn btn-secondary" onclick="printTable('ffb-quality-wrapper', 'Laporan FFB Quality Fruit Loose Analysis')"><i class="fa-solid fa-print"></i> Print</button>
            <button class="btn btn-success" onclick="openFFBModal()"><i class="fa-solid fa-plus"></i> Tambah input Loose Fruit Quality</button>
        </div>
    </div>
    <div class="glass-card" style="overflow-x: auto;">
        <h3>FFB Quality Fruit Loose Analysis</h3>
        <div id="ffb-quality-wrapper" class="table-responsive">
            <style>
                #ffb-quality-table th, #ffb-quality-table td {
                    padding: 4px 8px !important;
                }
            </style>
            <table class="data-table" id="ffb-quality-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                    <tr>
                        <th rowspan="2">Tanggal</th>
                        <th rowspan="2">Estate</th>
                        <th rowspan="2">Divisi</th>
                        <th rowspan="2">No. Truck</th>
                        <th>Brt Sample</th>
                        <th colspan="2">Bron Segar</th>
                        <th colspan="2">Bron Tdk Segar</th>
                        <th colspan="2">Bron Busuk</th>
                        <th colspan="2">Sampah</th>
                        <th rowspan="2">Aksi</th>
                    </tr>
                    <tr>
                        <th>(gram)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Generated via JS -->
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td colspan="5" style="text-align: right;">RATA-RATA / TOTAL:</td>
                        <td id="fq-tot-bg">0</td>
                        <td id="fq-tot-bd">0</td>
                        <td id="fq-avg-bd">0.0</td>
                        <td id="fq-tot-ts">0</td>
                        <td id="fq-avg-ts">0.0</td>
                        <td id="fq-tot-bb">0</td>
                        <td id="fq-avg-bb">0.0</td>
                        <td id="fq-tot-sampah">0</td>
                        <td id="fq-avg-sampah">0.0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- 2. SUB-SHEET: DAILY FFB CROP QUALITY -->
<div id="ffb-subsheet-crop" class="subsheet-content">
    <div class="glass-card" style="overflow-x: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin:0;">Daily FFB Crop Quality</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="openFqRangeModal('crop')"><i class="fa-solid fa-rotate"></i> Load Data</button>
                <button class="btn btn-secondary" onclick="printTable('ffb-crop-wrapper', 'Laporan Daily FFB Crop Quality')"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn btn-success" onclick="openFFBCropModal()"><i class="fa-solid fa-plus"></i> Tambah input FFB Crop Quality</button>
            </div>
        </div>
        <div id="ffb-crop-wrapper" class="table-responsive">
            <style>
                #ffb-crop-table th, #ffb-crop-table td, #ffb-crop-summary-table th, #ffb-crop-summary-table td {
                    padding: 4px 8px !important;
                }
            </style>
            <table class="data-table" id="ffb-crop-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                <thead>
                    <tr>
                        <th rowspan="2">Estate</th>
                        <th rowspan="2">Divisi</th>
                        <th rowspan="2">Blok</th>
                        <th rowspan="2">No. Truck</th>
                        <th rowspan="2">Total Janjang</th>
                        <th colspan="2">Unripe</th>
                        <th colspan="2">Underripe</th>
                        <th colspan="2">Normal Ripe</th>
                        <th colspan="2">Over Ripe</th>
                        <th colspan="2">Empty Bunch</th>
                        <th colspan="2">Long Stalk</th>
                        <th colspan="2">Rat Damage</th>
                        <th rowspan="2">Aksi</th>
                    </tr>
                    <tr>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Generated via JS -->
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td colspan="4" style="text-align: right;">TOTAL / AVERAGE:</td>
                        <td id="fqc-tot-jjg">0</td>
                        <td id="fqc-tot-unripe">0</td><td id="fqc-avg-unripe">0.0</td>
                        <td id="fqc-tot-under">0</td><td id="fqc-avg-under">0.0</td>
                        <td id="fqc-tot-normal">0</td><td id="fqc-avg-normal">0.0</td>
                        <td id="fqc-tot-over">0</td><td id="fqc-avg-over">0.0</td>
                        <td id="fqc-tot-empty">0</td><td id="fqc-avg-empty">0.0</td>
                        <td id="fqc-tot-long">0</td><td id="fqc-avg-long">0.0</td>
                        <td id="fqc-tot-rat">0</td><td id="fqc-avg-rat">0.0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <table class="data-table" id="ffb-crop-summary-table" style="font-size: 0.8rem; width: 100%; text-align: center; display: none; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th rowspan="2">ESTATE</th>
                        <th rowspan="2">TOTAL JANJANG</th>
                        <th colspan="1">UN RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">UNDER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 3%)</span></th>
                        <th colspan="1">RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Min. 90%)</span></th>
                        <th colspan="1">OVER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 7%)</span></th>
                        <th colspan="1">EMPTY BUNCH<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">LONGSTALK<br><span style="font-size:0.75rem; font-weight:normal;">(&lt; 2%)</span></th>
                        <th colspan="1">RAT DAMAGE<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                    </tr>
                    <tr>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td style="text-align: right;">TOTAL:</td>
                        <td id="fqc-sum-tot-jjg">0</td>
                        <td id="fqc-sum-unripe">0.00</td>
                        <td id="fqc-sum-under">0.00</td>
                        <td id="fqc-sum-normal">0.00</td>
                        <td id="fqc-sum-over">0.00</td>
                        <td id="fqc-sum-empty">0.00</td>
                        <td id="fqc-sum-long">0.00</td>
                        <td id="fqc-sum-rat">0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- 3. SUB-SHEET: SUMMARY MONTHLY GRADING -->
<!-- 3. SUB-SHEET: DETAIL FFQ FFB CROP QUALITY -->
<div id="ffb-subsheet-detail" class="subsheet-content" style="display:none;">
    <div class="glass-card" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="background: rgba(16, 185, 129, 0.15); color: #10b981; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    <i class="fa-solid fa-table-list"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b;">Detail FFQ FFB Crop Quality</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Rekapitulasi Mutu Panen & Loose Fruit Harian Day-by-Day per Estate</span>
                </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Dari:</label>
                    <input type="date" id="fq-detail-start-date" class="form-control" style="width: auto; padding: 5px 10px;" onchange="window.loadFFQDetailData()">
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Hingga:</label>
                    <input type="date" id="fq-detail-end-date" class="form-control" style="width: auto; padding: 5px 10px;" onchange="window.loadFFQDetailData()">
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Estate:</label>
                    <select id="fq-detail-estate-filter" class="form-control" style="width: auto; min-width: 180px; padding: 5px 10px;" onchange="window.loadFFQDetailData()">
                        <option value="ALL">Semua Estate (FFB)</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="window.loadFFQDetailData()"><i class="fa-solid fa-filter"></i> Tampilkan</button>
                <button class="btn btn-secondary" onclick="printTable('ffq-detail-wrapper', 'Laporan Detail FFQ FFB Crop Quality')"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn btn-success" onclick="window.exportFFQDetailCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
            </div>
        </div>

        <div id="ffq-detail-wrapper" class="table-responsive">
            <style>
                #ffq-detail-table th, #ffq-detail-table td {
                    padding: 6px 8px !important;
                    font-size: 0.8rem;
                    text-align: center;
                }
                #ffq-detail-table th {
                    background-color: #f8fafc;
                    color: #334155;
                    font-weight: 600;
                    border: 1px solid #e2e8f0;
                }
                #ffq-detail-table td {
                    border: 1px solid #f1f5f9;
                }
                #ffq-detail-table tr:hover {
                    background-color: rgba(241, 245, 249, 0.6);
                }
            </style>
            <table class="data-table" id="ffq-detail-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 40px;">No</th>
                        <th rowspan="2" style="width: 95px;">Tanggal</th>
                        <th rowspan="2" style="text-align: left; min-width: 140px;">Estate</th>
                        <th rowspan="2" style="width: 90px;">FFB<br><span style="font-size:0.75rem; font-weight:normal;">(Ton)</span></th>
                        <th colspan="1">UNRIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">UNDER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 3%)</span></th>
                        <th colspan="1">RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Min. 90%)</span></th>
                        <th colspan="1">OVER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 7%)</span></th>
                        <th colspan="1">EMPTY BUNCH<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">LONGSTALK<br><span style="font-size:0.75rem; font-weight:normal;">(&lt; 2%)</span></th>
                        <th colspan="1">RAT DAMAGE<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                        <th rowspan="2" style="width: 80px;">LF<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                    </tr>
                    <tr>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="12" style="padding: 20px; color: #64748b; font-style: italic;">Silakan pilih tanggal dan klik Tampilkan</td></tr>
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                        <td colspan="3" style="text-align: right; font-weight: 700;">RATA-RATA / TOTAL (INTERPOLASI):</td>
                        <td id="ffqd-tot-ffb">0.00</td>
                        <td id="ffqd-avg-unripe">0.00</td>
                        <td id="ffqd-avg-under">0.00</td>
                        <td id="ffqd-avg-ripe">0.00</td>
                        <td id="ffqd-avg-over">0.00</td>
                        <td id="ffqd-avg-empty">0.00</td>
                        <td id="ffqd-avg-long">0.00</td>
                        <td id="ffqd-avg-rat">0.00</td>
                        <td id="ffqd-avg-lf">0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<div id="ffb-subsheet-monthly" class="subsheet-content">
    <!-- Filter & Options Toolbar -->
    <div class="grading-filter-bar">
        <div class="grading-filter-group">
            <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-sliders"></i> Parameter Kriteria Grading</label>
                <select id="ffb-monthly-param" class="form-control" style="font-weight: 600; color: #1e293b; min-width: 290px;" onchange="window.onFFBMonthlyParamChange()">
                    <optgroup label="-- Kualitas Janjang (Crop Quality) --">
                        <option value="ripe" selected>Ripe / Buah Matang (%) [Standar Min. 90%]</option>
                        <option value="unripe">Unripe / Buah Mentah (%) [Standar Max. 0%]</option>
                        <option value="underripe">Under Ripe / Kurang Matang (%) [Standar Max. 3%]</option>
                        <option value="over_ripe">Over Ripe / Lewat Matang (%) [Standar Max. 7%]</option>
                        <option value="empty_bunch">Empty Bunch / Janjang Kosong (%) [Standar Max. 0%]</option>
                        <option value="long_stalk">Long Stalk / Tangkai Panjang (%) [Standar &lt; 2%]</option>
                        <option value="rat_damage">Rat Damage / Serangan Tikus (%)</option>
                        <option value="total_janjang">Total Janjang Sampling (Janjang)</option>
                    </optgroup>
                    <optgroup label="-- Kualitas Brondolan (Loose Fruit) --">
                        <option value="bd_percent">Brondolan Segar (%) [Standar Min. 85%]</option>
                        <option value="t_segar_percent">Brondolan Tidak Segar (%) [Standar Max. 10%]</option>
                        <option value="busuk_percent">Brondolan Busuk (%) [Standar Max. 5%]</option>
                        <option value="sampah_percent">Sampah Brondolan (%) [Standar Max. 2%]</option>
                        <option value="bg_gram">Total Berat Sample (gram)</option>
                    </optgroup>
                    <optgroup label="-- Executive Score --">
                        <option value="quality_index">Overall Grading Quality Score / Indeks Mutu (0-100)</option>
                    </optgroup>
                </select>
            </div>
            <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar"></i> Tahun</label>
                <select id="ffb-monthly-year" class="form-control" style="font-weight: 600; min-width: 100px;" onchange="window.loadFFBMonthlySummary()">
                    <option value="2026" selected>2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2027">2027</option>
                </select>
            </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.loadFFBMonthlySummary()"><i class="fa-solid fa-rotate"></i> Refresh</button>
            <button class="btn btn-secondary" onclick="window.printMonthlyGrading()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
            <button class="btn btn-success" onclick="window.exportMonthlyGradingCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
        </div>
    </div>

    <!-- Executive KPI Summary Cards -->
    <div class="grading-kpi-grid">
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon green">
                <i class="fa-solid fa-trophy"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Top Performer Estate</h4>
                <div class="kpi-val" id="ffb-kpi-top-estate">-</div>
                <div class="kpi-sub" id="ffb-kpi-top-detail">Mutu terbaik tahun ini</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon red">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Perlu Perhatian</h4>
                <div class="kpi-val" id="ffb-kpi-worst-estate">-</div>
                <div class="kpi-sub" id="ffb-kpi-worst-detail">Deviasi tertinggi dari standar</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon blue">
                <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Rata-Rata Pabrik (YTD)</h4>
                <div class="kpi-val" id="ffb-kpi-mill-avg">-</div>
                <div class="kpi-sub" id="ffb-kpi-mill-target">Target: -</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon yellow">
                <i class="fa-solid fa-bullseye"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Tingkat Kepatuhan Standar</h4>
                <div class="kpi-val" id="ffb-kpi-compliance">-</div>
                <div class="kpi-sub" id="ffb-kpi-compliance-sub">Bulan lolos batas toleransi</div>
            </div>
        </div>
    </div>

    <!-- Monthly Summary Table Card -->
    <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
                <h3 style="margin: 0;" id="ffb-monthly-table-title">Tabel Rekapitulasi Grading Bulanan 1 Tahun</h3>
                <span id="ffb-monthly-table-subtitle" style="font-size: 0.8rem; color: var(--text-secondary);">Menampilkan capaian per estate untuk 12 bulan beserta rata-rata dan status toleransi.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; font-size: 0.75rem;">
                <span class="grading-badge good"><i class="fa-solid fa-check"></i> Sesuai Standar</span>
                <span class="grading-badge warn"><i class="fa-solid fa-triangle-exclamation"></i> Waspada</span>
                <span class="grading-badge danger"><i class="fa-solid fa-xmark"></i> Melebihi Toleransi</span>
            </div>
        </div>
        <div id="ffb-monthly-table-wrapper" class="table-responsive">
            <style>
                #ffb-monthly-grading-table th, #ffb-monthly-grading-table td {
                    padding: 6px 8px !important;
                    text-align: center;
                }
                #ffb-monthly-grading-table th {
                    white-space: nowrap;
                }
            </style>
            <table class="data-table" id="ffb-monthly-grading-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                    <tr>
                        <th style="width: 35px;">NO</th>
                        <th style="text-align: left; min-width: 140px;">ESTATE</th>
                        <th>JAN</th><th>FEB</th><th>MAR</th><th>APR</th>
                        <th>MEI</th><th>JUN</th><th>JUL</th><th>AGU</th>
                        <th>SEP</th><th>OKT</th><th>NOV</th><th>DES</th>
                        <th style="background-color: #e2e8f0; font-weight: bold; min-width: 90px;">RATA-RATA</th>
                        <th style="min-width: 100px;">TARGET</th>
                        <th style="min-width: 120px;">EVALUASI & TREND</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Injected by JS -->
                </tbody>
                <tfoot>
                    <!-- Injected by JS -->
                </tfoot>
            </table>
        </div>
    </div>

    <!-- Monthly Trend Chart Card -->
    <div class="glass-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
                <h3 style="margin: 0;" id="ffb-monthly-chart-title">Grafik Trend Kualitas Bulanan (12 Bulan)</h3>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Garis putus-putus menunjukkan batas standar toleransi. Klik legenda estate untuk menyembunyikan/menampilkan garis.</span>
            </div>
        </div>
        <div style="position: relative; height: 350px; width: 100%;">
            <canvas id="chart-ffb-monthly-trend"></canvas>
        </div>
    </div>

    <!-- Smart Diagnostic & Operational Insights -->
    <div class="grading-insight-box" id="ffb-monthly-insights-card">
        <h4><i class="fa-solid fa-lightbulb"></i> Analisis & Rekomendasi Operasional Mutu:</h4>
        <ul id="ffb-monthly-insights-list">
            <!-- Injected by JS -->
        </ul>
    </div>
</div>

<!-- Modal Input FFB Quality (Loose Fruit) -->
<div class="modal-overlay" id="modal-ffb-quality" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 500px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;" id="fq-modal-title">Tambah input Loose Fruit Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="hidden" id="fq-modal-edit-id"><input type="date" id="fq-modal-date" class="form-control">
            </div>
            <div class="form-group">
                <label>Pilihan Supply Chain</label>
                <select id="fq-modal-estate" class="form-control" required onchange="window.onFFBModalEstateChange(this.value)"></select>
            </div>
            <div class="form-group">
                <label>Divisi (Opsional)</label>
                <div id="fq-modal-divisi-container">
                    <input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Nomor Truk</label>
                <input type="text" id="fq-modal-truck" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Berat Sample (gram)</label>
                <input type="number" step="any" id="fq-modal-bg" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Segar (gram)</label>
                <input type="number" step="any" id="fq-modal-bd" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Tidak Segar (gram)</label>
                <input type="number" step="any" id="fq-modal-tsegar" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Busuk (gram)</label>
                <input type="number" step="any" id="fq-modal-busuk" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Sampah (gram) (Otomatis)</label>
                <input type="number" step="any" id="fq-modal-sampah" class="form-control" readonly style="background-color: #f1f5f9;">
            </div>
            <button class="btn btn-primary" id="fq-modal-submit-btn" onclick="submitFFBModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
        </div>
    </div>
</div>

<!-- Modal Input FFB Crop Quality -->
<div class="modal-overlay" id="modal-ffb-crop-quality" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 500px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;" id="fqc-modal-title">Tambah input FFB Crop Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-crop-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="hidden" id="fqc-modal-edit-id"><input type="date" id="fqc-modal-date" class="form-control">
            </div>
            <div class="form-group">
                <label>Pilihan Supply Chain</label>
                <select id="fqc-modal-estate" class="form-control" required onchange="window.onFFBCropModalEstateChange(this.value)"></select>
            </div>
            <div class="form-group">
                <label>Divisi (Opsional)</label>
                <div id="fqc-modal-divisi-container">
                    <input type="text" id="fqc-modal-divisi" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Blok (Opsional)</label>
                <div id="fqc-modal-blok-container">
                    <input type="text" id="fqc-modal-blok" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Nomor Truk</label>
                <input type="text" id="fqc-modal-truck" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Total Janjang</label>
                <input type="number" id="fqc-modal-total" class="form-control" required oninput="calculateFFBCropModal()">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="form-group">
                    <label>Unripe (Jjg)</label>
                    <input type="number" id="fqc-modal-unripe" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Underripe (Jjg)</label>
                    <input type="number" id="fqc-modal-underripe" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Normal Ripe (Otomatis)</label>
                    <input type="number" id="fqc-modal-normal" class="form-control" readonly style="background-color: #f1f5f9;">
                </div>
                <div class="form-group">
                    <label>Over Ripe (Jjg)</label>
                    <input type="number" id="fqc-modal-over" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Empty Bunch (Jjg)</label>
                    <input type="number" id="fqc-modal-empty" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Long Stalk (Jjg)</label>
                    <input type="number" id="fqc-modal-long" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Rat Damage (Jjg)</label>
                    <input type="number" id="fqc-modal-rat" class="form-control" placeholder="0" oninput="calculateFFBCropModal()">
                </div>
            </div>
            <button class="btn btn-primary" id="fqc-modal-submit-btn" onclick="submitFFBCropModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-fq-range" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 400px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;">Pilih Rentang Tanggal</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-fq-range').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <input type="hidden" id="fq-range-target">
            <div class="form-group">
                <label>Dari Tanggal</label>
                <input type="date" id="fq-range-start" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Hingga Tanggal</label>
                <input type="date" id="fq-range-end" class="form-control" required>
            </div>
            <button class="btn btn-primary" onclick="submitFqRangeModal()" style="width:100%; justify-content:center; margin-top:10px;">Tampilkan</button>
        </div>
    </div>
</div>
`
});

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
        
        const tWorkers = u.targetworkers !== undefined ? u.targetworkers : (u.targetWorkers !== undefined ? u.targetWorkers : 0);
        const rWorkers = u.realizedworkers !== undefined ? u.realizedworkers : (u.realizedWorkers !== undefined ? u.realizedWorkers : 0);
        const sDate = u.startdate || u.startDate || u.date || '-';

        if (u.status === 'Selesai') {
            actionBtn = `<span class="status-badge status-done" style="margin-right: 5px;">Selesai</span>`;
        } else if (currentUser && currentUser.role) {
            const roleL = currentUser.role.toLowerCase();
            if (['asisten divisi', 'assistant', 'assistant divisi', 'asst divisi', 'krani divisi', 'mandor', 'mandor divisi', 'admin'].includes(roleL)) {
                actionBtn = `
                <div style="display:flex; justify-content:center; width: 100%;">
                    <button type="button" class="btn" style="padding: 2px 6px; font-size: 0.7rem; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; justify-content:center;" onclick="promptAddUpkeepProgress(${u.id}, '${u.block}', '${safeType}', ${u.target}, ${u.realized}, ${tWorkers})"><i class="fa-solid fa-pen-to-square"></i> Update</button>
                </div>
            `;
            } else {
                actionBtn = '-';
            }
        } else {
            actionBtn = '-';
        }
        
        let prestasiCell = '-';
        if (u.realized > 0 && rWorkers > 0) {
            const prestasiVal = (u.realized / rWorkers).toFixed(2);
            prestasiCell = `<strong style="color:#0369a1; font-size:1.05rem;">${prestasiVal}</strong> Ha/HK`;
        } else if (u.realized > 0) {
            prestasiCell = `<span style="color:#64748b; font-size:0.85rem;">Menunggu data HK</span>`;
        }
        
        const bData = masterData.blok.find(x => x.name === u.block);
        const divisi = bData ? bData.divisi : '-';
        const realizedHa = parseFloat(u.realized || 0);
        
        return `
            <tr>
                <td><strong><a href="#" style="color: var(--primary-color); text-decoration: underline; cursor: pointer;" onclick="viewUpkeepHistory(${u.id}, '${u.block}', '${safeType}'); return false;">${u.block}</a></strong></td>
                <td>${sDate}</td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap; font-weight:bold;">${getEstateCode(u.estate)}</span></td>
                <td><span class="status-badge" style="background:#e2e8f0; color:#334155; padding:2px 6px; white-space:nowrap;">${divisi}</span></td>
                <td>${u.type}<br><small>${u.worker}</small></td>
                <td>${u.target}</td>
                <td>${tWorkers} Orang</td>
                <td>${realizedHa > 0 ? realizedHa.toFixed(2) : '0'}</td>
                <td>${rWorkers > 0 ? rWorkers + ' Orang' : '-'}</td>
                <td>${prestasiCell}</td>
                <td style="text-align:center;">${actionBtn}</td>
            </tr>
        `;
    };

    aktif.forEach(u => tbody.innerHTML += renderRow(u));

    if (selesai.length > 0) {
        tbody.innerHTML += `<tr><td colspan="11" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>`;
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


window.publishHarvesting = async function(id) {
    try {
        const res = await fetch(`${API_URL}/harvesting/daily/${id}/realization`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'In Progress' })
        });
        if (res.ok) await loadData();
    } catch (e) {
        console.error(e);
    }
};

window.closeHarvesting = async function(id) {
    if (!confirm('Tutup blok pekerjaan panen ini?')) return;
    try {
        const res = await fetch(`${API_URL}/harvesting/daily/${id}/realization`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Closed' })
        });
        if (res.ok) await loadData();
    } catch (e) {
        console.error(e);
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
                        <option value="Grading" ${user.role === 'Grading' ? 'selected' : ''}>Grading</option>
                        <option value="Analis" ${user.role === 'Analis' ? 'selected' : ''}>Analis</option>
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
            bData = (masterData.blok || []).find(b => b.name === bName && b.divisi === divisi);
        }
        if (!bData) bData = (masterData.blok || []).find(b => b.name === bName); // fallback
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

    // Gather allocated trucks and all available master trucks
    const allocatedTrucks = new Set();
    const allTrucks = new Set();

    // 1. Allocated trucks from daily plans in same date & divisi
    const sameDivisiDateRows = (db.harvesting_daily || []).filter(x => x.date === h.date && x.divisi === h.divisi && x.allocated_trucks);
    sameDivisiDateRows.forEach(row => {
        try {
            const arr = JSON.parse(row.allocated_trucks);
            if(Array.isArray(arr)) arr.forEach(t => { if(t) allocatedTrucks.add(t); });
        } catch(e){}
    });

    // 2. All trucks from masterData.truk
    if (masterData && Array.isArray(masterData.truk)) {
        masterData.truk.forEach(t => {
            const plate = t.plate_number || t.plate || t.name;
            if (plate) allTrucks.add(plate);
        });
    }

    // 3. All trucks from db.vehicles
    if (db && Array.isArray(db.vehicles)) {
        db.vehicles.forEach(v => {
            if (v.plate) allTrucks.add(v.plate);
        });
    }

    // Build Truck Dropdown Options
    let truckOptionsHtml = '<option value="" disabled selected>-- Pilih Truk Pengangkut --</option>';
    if (allocatedTrucks.size > 0) {
        truckOptionsHtml += '<optgroup label="Truk Dialokasikan Rencana">';
        allocatedTrucks.forEach(t => {
            truckOptionsHtml += `<option value="${t}">🚚 ${t} (Alokasi Rencana)</option>`;
        });
        truckOptionsHtml += '</optgroup>';
    }

    const otherTrucks = Array.from(allTrucks).filter(t => !allocatedTrucks.has(t));
    if (otherTrucks.length > 0) {
        truckOptionsHtml += `<optgroup label="${allocatedTrucks.size > 0 ? 'Truk Master Kebun Lainnya' : 'Daftar Armada Truk'}">`;
        otherTrucks.forEach(t => {
            truckOptionsHtml += `<option value="${t}">🚚 ${t}</option>`;
        });
        truckOptionsHtml += '</optgroup>';
    }
    if (allTrucks.size === 0 && allocatedTrucks.size === 0) {
        truckOptionsHtml += '<option value="Truk Lapangan">🚚 Truk Lapangan</option>';
    }

    let ritaseListInnerHtml = '';
    try {
        const rList = JSON.parse(h.ritase_list || '[]');
        if(rList.length > 0) {
            ritaseListInnerHtml = `
                <strong style="color:#0369a1; display:block; margin-bottom:5px;">Truk Terdahulu Hari Ini:</strong>
                <ul style="margin:0 0 0 15px; padding:0; color:#0c4a6e; font-size:0.82rem; max-height:100px; overflow-y:auto;">
                    ${rList.map(r => `<li><b>${r.truck}</b>: ${r.janjang || 0} Jjg / ${r.kg || 0} Kg</li>`).join('')}
                </ul>
            `;
        } else {
            ritaseListInnerHtml = `
                <strong style="color:#0369a1; display:block; margin-bottom:5px;">Truk Terdahulu Hari Ini:</strong>
                <p style="margin:0; color:#0c4a6e; font-size:0.82rem; font-style:italic;">Belum ada ritase pengangkutan.</p>
            `;
        }
    } catch(e){}

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-harvesting-realization';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content animate-fade-in" style="max-width:560px; max-height:90vh; overflow-y:auto;">
            <div class="modal-header" style="margin-bottom:12px;">
                <h3 style="margin:0;"><i class="fa-solid fa-clipboard-check" style="color:var(--primary-color);"></i> Input Realisasi Panen: ${block}</h3>
                <button type="button" class="modal-close" onclick="document.getElementById('modal-harvesting-realization').remove()">&times;</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: #f1f5f9; border-left: 4px solid #0284c7; padding: 10px; border-radius: 4px; font-size: 0.85rem;">
                    <strong style="color:#0369a1;">Akumulasi Saat Ini:</strong>
                    <div style="margin-top:4px; line-height:1.45;">
                        <div>Janjang: <strong>${currJanjang}</strong> / ${planJjg}</div>
                        <div>Tonase: <strong>${currKg}</strong> / ${planKg} Kg</div>
                        <div>HK Pemanen: <strong>${currPemanen}</strong> / ${planHvr} Org</div>
                        <div>Luas Panen: <strong>${currHa.toFixed(2)}</strong> / ${grossArea.toFixed(2)} Ha</div>
                    </div>
                </div>
                <div style="background: #e0f2fe; border-left: 4px solid #38bdf8; padding: 10px; border-radius: 4px;">
                    ${ritaseListInnerHtml}
                </div>
            </div>
            
            <!-- 1. Realisasi Tenaga & Luas -->
            <div style="background:#fefce8; padding:8px 12px; border-radius:4px; font-weight:bold; margin-bottom:8px; border-left:4px solid #eab308; font-size:0.9rem;">
                <i class="fa-solid fa-users"></i> 1. Realisasi Tenaga Kerja & Luas Panen
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.85rem; font-weight:600;">Total HK Pemanen (Hari Ini)</label>
                    <input type="number" id="hr-pemanen" class="form-control" value="${currPemanen > 0 ? currPemanen : (planHvr || '')}" placeholder="Contoh: 40">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.85rem; font-weight:600;">Total Luasan Panen (Ha)</label>
                    <input type="number" step="0.01" id="hr-ha" class="form-control" value="${currHa > 0 ? currHa : ''}" placeholder="Maks: ${grossArea > 0 ? grossArea.toFixed(2) : 0} Ha">
                </div>
            </div>

            <!-- 2. Tambah Ritase Pengangkutan Buah -->
            <div style="background:#f0fdf4; padding:8px 12px; border-radius:4px; font-weight:bold; margin-bottom:8px; border-left:4px solid #22c55e; font-size:0.9rem;">
                <i class="fa-solid fa-truck"></i> 2. Tambah Ritase Pengangkutan TBS (Trip Baru)
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size:0.85rem; font-weight:600;">Pilih Truk Pengangkut (Wajib jika isi JJG/Kg)</label>
                <select id="hr-truck" class="form-control">
                    ${truckOptionsHtml}
                </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.85rem; font-weight:600;">Tambahan Janjang (Trip Ini)</label>
                    <input type="number" id="hr-janjang" class="form-control" placeholder="0">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.85rem; font-weight:600;">Tambahan Kg (Trip Ini)</label>
                    <input type="number" step="0.1" id="hr-kg" class="form-control" placeholder="0">
                </div>
            </div>

            <!-- 3. Status Pekerjaan -->
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-size:0.85rem; font-weight:600;">Status Blok / Pekerjaan</label>
                <select id="hr-status" class="form-control">
                    <option value="In Progress" ${h.status !== 'Closed' && h.status !== 'Selesai' ? 'selected' : ''}>Masih Berlanjut (In Progress)</option>
                    <option value="Selesai" ${h.status === 'Selesai' ? 'selected' : ''}>Panen Selesai (Selesai)</option>
                    <option value="Closed" ${h.status === 'Closed' ? 'selected' : ''}>Tutup Blok (Closed)</option>
                </select>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-harvesting-realization').remove()" style="background:#64748b; color:white; border:none; padding:8px 18px;">Batal</button>
                <button type="button" class="btn btn-primary" id="btn-save-harvesting-real" onclick="window.submitHarvestingRealization(${id})" style="padding:8px 18px;"><i class="fa-solid fa-floppy-disk"></i> Simpan Realisasi</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitHarvestingRealization = async (id) => {
    const saveBtn = document.getElementById('btn-save-harvesting-real');
    const h = (db.harvesting_daily || []).find(x => x.id == id) || {};

    const inputPemanenVal = document.getElementById('hr-pemanen')?.value.trim();
    const inputHaVal = document.getElementById('hr-ha')?.value.trim();
    const addJanjang = parseFloat(document.getElementById('hr-janjang')?.value) || 0;
    const addKg = parseFloat(document.getElementById('hr-kg')?.value) || 0;
    const truck = document.getElementById('hr-truck')?.value || '';
    const status = document.getElementById('hr-status')?.value || h.status || 'In Progress';

    // If adding janjang or kg, truck must be selected
    if (addJanjang > 0 || addKg > 0) {
        if (!truck) {
            alert("Pilih truk pengangkut terlebih dahulu untuk ritase ini!");
            return;
        }
    }

    let grossArea = 0;
    const blockNames = h.block ? h.block.split(',').map(s => s.trim()) : [];
    blockNames.forEach(bName => {
        let bData;
        if (h.divisi && h.divisi !== 'undefined') {
            bData = (masterData.blok || []).find(b => b.name === bName && b.divisi === h.divisi);
        }
        if (!bData) bData = (masterData.blok || []).find(b => b.name === bName);
        if (bData) {
            let area = bData.gross_area;
            if(typeof area === 'string') area = area.replace(/,/g, '');
            grossArea += parseFloat(area) || 0;
        }
    });

    // Determine new totals
    let totalPemanen = h.realized_pemanen || 0;
    if (inputPemanenVal !== '' && !isNaN(parseInt(inputPemanenVal))) {
        totalPemanen = parseInt(inputPemanenVal);
    }

    let totalHa = h.realized_ha || 0;
    if (inputHaVal !== '' && !isNaN(parseFloat(inputHaVal))) {
        totalHa = parseFloat(inputHaVal);
    }

    if (grossArea > 0 && totalHa > (grossArea + 0.5)) {
        alert(`Peringatan: Total Luasan Panen (${totalHa.toFixed(2)} Ha) melebihi Luas Blok (${grossArea.toFixed(2)} Ha). Mohon periksa kembali inputan Anda.`);
        return;
    }

    const totalJanjang = (h.realized_janjang || 0) + addJanjang;
    const totalKg = (h.realized_kg || 0) + addKg;

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

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
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
                ritase_list: JSON.stringify(ritaseList),
                date: h.date,
                block: h.block
            })
        });
        
        if (!res.ok) {
            const errData = await res.json();
            alert("Error: " + (errData.error || "Gagal menyimpan realisasi"));
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Realisasi'; }
            return;
        }
        
        const modalEl = document.getElementById('modal-harvesting-realization');
        if(modalEl) modalEl.remove();
        
        await loadData();
    } catch (e) {
        console.error("Save realization error:", e);
        alert("Terjadi kesalahan jaringan atau server.");
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Realisasi'; }
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
            const res = await fetch(`${API_URL}/pemupukan/${id}/add`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                alert('Gagal menyimpan realisasi pemupukan: ' + (errData.error || 'Server error'));
                return;
            }
            formPemupukanRealization.reset();
            const modal = document.getElementById('modal-pemupukan-realization');
            if (modal) modal.style.display = 'none';
            await loadData();
        } catch (e) { 
            console.error(e);
            alert('Terjadi kesalahan jaringan saat menyimpan.');
        }
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
        
        const [res, masterRes] = await Promise.all([
            fetch(`${API_URL}/tonase/${mill}/${date}`),
            fetch(`${API_URL}/master/${mill}`)
        ]);
        let resData = await window.parseTonaseResponse(res);
        const masterData = await masterRes.json();
        const supplyChainFFB = (masterData.supply_chain || []).filter(s => s.is_ffb !== false).map(s => s.estate);
        
        // Filter by estate if user is not a Mill
        const isMill = currentUser.estate && currentUser.estate.endsWith('Mill');
        if (!isMill && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
            resData = resData.filter(item => item.estate === currentUser.estate);
        }
        
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        const actualData = new Array(hours.length).fill(0);
        const planData = new Array(hours.length).fill(0);
        let totalTonase = 0;
        let estateProgress = {};
        
        // Initialize only FFB estates
        supplyChainFFB.forEach(est => {
            if (isMill || currentUser.estate === 'Semua Estate (Khusus Admin)' || currentUser.estate === est) {
                estateProgress[est] = { target: 0, realized: 0 };
            }
        });
        
        resData.forEach(item => {
            const hIdx = hours.indexOf(item.time_hour);
            const val = (parseFloat(item.realized_kg) || 0) / 1000;
            const targetVal = (parseFloat(item.target_kg) || 0) / 1000;
            
            if (hIdx !== -1) {
                actualData[hIdx] += val;
                planData[hIdx] += targetVal;
            }
            totalTonase += val;
            
            const est = item.estate || 'Unknown Estate';
            if (estateProgress[est]) {
                estateProgress[est].realized += val;
                estateProgress[est].target += targetVal;
            }
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
        
        const datasets = [];
        const hasPlan = planData.some(v => v > 0);
        
        if (hasPlan) {
            datasets.push({
                label: 'Target Plan (Ton)',
                data: planData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.4
            });
        }
        
        datasets.push({
            label: 'Tonase Masuk (Ton)',
            data: actualData,
            borderColor: '#0d8b4e',
            backgroundColor: 'rgba(13, 139, 78, 0.1)',
            fill: true,
            tension: 0.4
        });

        dashboardTonaseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: datasets
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: true, position: 'bottom' },
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: function(context) {
                            return context.dataset.borderColor;
                        },
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
        const planData = new Array(hours.length).fill(0);
        
        tonaseData.forEach(item => {
            const hIdx = hours.indexOf(item.time_hour);
            if (hIdx !== -1) {
                actualData[hIdx] += parseFloat(item.realized_kg) || 0;
                planData[hIdx] += parseFloat(item.target_kg) || 0;
            }
        });
        
        for (let i = 0; i < actualData.length; i++) {
            actualData[i] = actualData[i] / 1000;
            planData[i] = planData[i] / 1000;
        }
        
        const ctx = document.getElementById('dashboardHistoricalChartCanvas');
        if (!ctx) return;
        
        if (printBtn) printBtn.style.display = 'inline-block';
        
        if (dashboardHistoricalChartInstance) dashboardHistoricalChartInstance.destroy();
        
        const datasets = [];
        const hasPlan = planData.some(v => v > 0);
        
        if (hasPlan) {
            datasets.push({
                label: 'Target Plan (Ton)',
                data: planData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.4
            });
        }
        
        datasets.push({
            label: 'Tonase Masuk (Ton)',
            data: actualData,
            borderColor: '#0d8b4e',
            backgroundColor: 'rgba(13, 139, 78, 0.1)',
            fill: true,
            tension: 0.4
        });
        
        dashboardHistoricalChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: datasets
            },
            plugins: [ChartDataLabels],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: true, position: 'bottom' },
                    datalabels: {
                        display: true,
                        align: 'end',
                        anchor: 'end',
                        color: function(context) {
                            return context.dataset.borderColor;
                        },
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
        users: 'Master User Management',
        processing: 'Processing Monitoring',
        water: 'Water Analysis',
        ffb_quality: 'FFB Quality'
    };
    const baseTitle = titles[viewId] || 'Dashboard';
    title.innerText = currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)'
        ? `${baseTitle} - ${currentUser.estate}`
        : baseTitle;
    const activeViews = window.views || views;
    container.innerHTML = activeViews[viewId] || activeViews.dashboard;
    populateSelects();
    
    if(viewId === 'dashboard') {
        initDashboardChart();
        if(window.loadDashboardExtraData) window.loadDashboardExtraData();
        
        // Hide mill sections for estate users
        if (currentUser && currentUser.estate && !currentUser.estate.toLowerCase().includes('mill') && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
            const millSec = document.getElementById('dashboard-mill-sections');
            if (millSec) millSec.style.display = 'none';
        }
    }
    if(viewId === 'vehicle') { 
        renderVehicleTable(); 
        bindForms(); 
        if(window.switchVehicleSubTab) window.switchVehicleSubTab(window.activeVehicleSubTab || 'monitor');
    }
    if(viewId === 'upkeep') { 
        renderUpkeepTable(); 
        bindForms(); 
        if(window.switchUpkeepSubTab) window.switchUpkeepSubTab(window.activeUpkeepSubTab || 'monitor');
    }
    if(viewId === 'pemupukan') { 
        renderPemupukanTable(); 
        bindForms(); 
        if(window.switchPemupukanSubTab) window.switchPemupukanSubTab(window.activePemupukanSubTab || 'monitor');
    }
    if(viewId === 'harvesting') { 
        renderHarvestingTable(); 
        bindForms(); 
        if(window.switchHarvestingSubTab) window.switchHarvestingSubTab(window.activeHarvestingSubTab || 'monitor');
    }
    if(viewId === 'processing') { if(window.renderProcessingView) window.renderProcessingView(); }
    if(viewId === 'water') { if(window.renderWaterView) window.renderWaterView(); }
    if(viewId === 'ffb_quality') { if(window.renderFFBQualityView) window.renderFFBQualityView(); }
    
    
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

        if (window.activeTonaseSubTab) {
            window.switchTonaseSubTab(window.activeTonaseSubTab);
        } else {
            window.switchTonaseSubTab('monitor');
        }
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
            const password = document.getElementById('login-sandi').value.trim();
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
            const allEstates = masterData.supply_chain_list || [];
            const currentSC = masterData.supply_chain || [];
            
            let scHtml = `
            <table class="data-table" style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                    <tr>
                        <th style="background:#000; color:#fff; width: 50px; padding: 10px;">NO</th>
                        <th style="background:#000; color:#fff; padding: 10px;">NAMA</th>
                        <th style="background:#000; color:#fff; padding: 10px;">KODE (SINGKATAN)</th>
                        <th style="background:#000; color:#fff; text-align:center; width: 80px; padding: 10px;">FFB</th>
                        <th style="background:#000; color:#fff; text-align:center; width: 80px; padding: 10px;">EFB</th>
                    </tr>
                </thead>
                <tbody>
            `;
            allEstates.forEach((estObj, idx) => {
                const est = estObj.name;
                const abbr = estObj.abbr;
                const scEntry = currentSC.find(sc => sc.estate === est);
                const isFfb = scEntry ? scEntry.is_ffb : false;
                const isEfb = scEntry ? scEntry.is_efb : false;
                
                scHtml += `
                    <tr>
                        <td style="padding: 10px;">${idx + 1}</td>
                        <td style="padding: 10px; font-weight:bold;">${est.toUpperCase()}</td>
                        <td style="padding: 10px;">${abbr}</td>
                        <td style="padding: 10px; text-align:center;">
                            <input type="checkbox" class="sc-ffb-checkbox" data-estate="${est}" ${isFfb ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
                        </td>
                        <td style="padding: 10px; text-align:center;">
                            <input type="checkbox" class="sc-efb-checkbox" data-estate="${est}" ${isEfb ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
                        </td>
                    </tr>
                `;
            });
            scHtml += `</tbody></table>`;
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

window.addSupplyChainMaster = () => {
    let html = `
        <div id="modal-add-sc-master" class="modal-overlay">
            <div class="modal-content animate-fade-in" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Tambah Supply Chain Master</h3>
                    <button type="button" class="modal-close" onclick="document.getElementById('modal-add-sc-master').remove();">&times;</button>
                </div>
                <div style="margin-top: 15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">Nama Estate / Pihak ke-3:</label>
                    <input type="text" id="add-sc-name" class="form-control" placeholder="Contoh: Pihak Ke-3 Test">
                    
                    <label style="display:block; margin-top:15px; margin-bottom:5px; font-weight:bold;">Kode (Singkatan):</label>
                    <input type="text" id="add-sc-abbr" class="form-control" placeholder="Contoh: 3rd Test">
                    
                    <button class="btn btn-primary" style="margin-top:20px; width:100%;" onclick="submitAddSupplyChainMaster()"><i class="fa-solid fa-save"></i> Simpan ke Master Data</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.submitAddSupplyChainMaster = async () => {
    const name = document.getElementById('add-sc-name').value.trim();
    const abbr = document.getElementById('add-sc-abbr').value.trim();
    if (!name || !abbr) return alert('Nama dan Kode harus diisi!');
    
    try {
        const res = await fetch(`${API_URL}/master/supply_chain_list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, abbr })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('modal-add-sc-master').remove();
            alert('Supply Chain Master berhasil ditambahkan!');
            await loadMasterData();
        } else {
            alert(data.error || 'Gagal menambahkan Supply Chain Master');
        }
    } catch (e) {
        console.error(e);
        alert('Gagal menghubungi server.');
    }
};

window.saveSupplyChain = async () => {
    const estatesMap = new Map();
    document.querySelectorAll('.sc-ffb-checkbox').forEach(cb => {
        const est = cb.getAttribute('data-estate');
        if (!estatesMap.has(est)) estatesMap.set(est, { estate: est, is_ffb: false, is_efb: false });
        estatesMap.get(est).is_ffb = cb.checked;
    });
    document.querySelectorAll('.sc-efb-checkbox').forEach(cb => {
        const est = cb.getAttribute('data-estate');
        if (!estatesMap.has(est)) estatesMap.set(est, { estate: est, is_ffb: false, is_efb: false });
        estatesMap.get(est).is_efb = cb.checked;
    });
    
    const estates = Array.from(estatesMap.values()).filter(e => e.is_ffb || e.is_efb);
    
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
                const addedHa = parseFloat(h.addedha !== undefined ? h.addedha : h.addedHa) || 0;
                const workers = parseInt(h.workers) || 0;
                const dateAdded = h.dateadded || h.dateAdded || '-';
                totalHa += addedHa;
                totalHK += workers;
                
                let prestasi = 0;
                if (workers > 0) prestasi = addedHa / workers;
                
                return `
                    <tr>
                        <td>${dateAdded}</td>
                        <td><strong>+${addedHa.toFixed(2)} Ha</strong></td>
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

let efbHistoricalChartInstance = null;

window.openEfbHistoricalModal = async () => {
    document.getElementById('efb-historical-modal').style.display = 'flex';
    const today = window.getLocalDate();
    const firstDay = today.substring(0, 8) + '01';
    document.getElementById('efb-historical-start-date').value = firstDay;
    document.getElementById('efb-historical-end-date').value = today;
    
    // Populate estate dropdown
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    try {
        const masterRes = await fetch(`${API_URL}/master/${mill}`);
        const masterData = await masterRes.json();
        const sel = document.getElementById('efb-historical-estate');
        sel.innerHTML = '<option value="ALL">All Estate (Gabungan)</option>';
        masterData.supply_chain.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.estate;
            opt.innerText = s.estate;
            sel.appendChild(opt);
        });
    } catch(e) { console.error(e); }
    
    loadEfbHistoricalChartData();
};

window.loadEfbHistoricalChartData = async () => {
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    const startDate = document.getElementById('efb-historical-start-date').value;
    const endDate = document.getElementById('efb-historical-end-date').value;
    if (!startDate || !endDate) {
        alert('Pilih rentang tanggal terlebih dahulu');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/efb-historical/${mill}/${startDate}/${endDate}`);
        const data = await res.json();
        
        const selectedEstate = document.getElementById('efb-historical-estate').value;
        
        // Group data by date
        const dateMap = {};
        
        // generate date range labels
        let current = new Date(startDate);
        const end = new Date(endDate);
        const labels = [];
        while (current <= end) {
            const d = current.toISOString().split('T')[0];
            labels.push(d);
            dateMap[d] = { target: 0, actual: 0 };
            current.setDate(current.getDate() + 1);
        }
        
        data.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            
            // Format item date as YYYY-MM-DD to match the labels
            let d;
            if (item.date) {
                // if it's already YYYY-MM-DD
                if (item.date.length === 10) d = item.date;
                // if it's an ISO string
                else d = new Date(item.date).toISOString().split('T')[0];
            }
            if (d && dateMap[d]) {
                dateMap[d].target += parseFloat(item.target) || 0;
                dateMap[d].actual += parseFloat(item.actual) || 0;
            }
        });
        
        const targets = labels.map(l => dateMap[l].target);
        const realized = labels.map(l => dateMap[l].actual);
        
        const ctx = document.getElementById('efbHistoricalChartCanvas');
        if (!ctx) return;
        
        if (efbHistoricalChartInstance) {
            efbHistoricalChartInstance.destroy();
        }
        
        efbHistoricalChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Realisasi Evakuasi (Ton)',
                    data: realized,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                }, {
                    label: 'Target Evakuasi (Ton)',
                    data: targets,
                    backgroundColor: 'rgba(203, 213, 225, 0.5)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Komparasi Target vs Realisasi Evakuasi EFB (${startDate} s/d ${endDate}) - ${selectedEstate === 'ALL' ? 'All Estate' : selectedEstate}` }
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
        if (document.getElementById('t-btn-reset')) {
            const isKraniMill = currentUser && currentUser.role === 'Krani Mill';
            document.getElementById('t-btn-reset').style.display = isKraniMill ? 'none' : 'inline-block';
        }
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
        const supplyChainFFB = masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => s.estate);
        const supplyChainEFB = masterData.supply_chain.filter(s => s.is_efb !== false).map(s => s.estate);
        const supplyChain = supplyChainFFB;
        
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
                let disabledAttrPlan = '';
                if (window.tonaseMode === 'plan') {
                    const isPlanLocked = window.tonaseDataCache.some(t => t.target_kg !== null && t.target_kg !== undefined && parseFloat(t.target_kg) > 0);
                    const canEditLockedPlan = currentUser && ['Admin', 'Office Assistant Mill', 'Manager Mill', 'Askep', 'Krani Mill'].includes(currentUser.role);
                    if (isPlanLocked && !canEditLockedPlan) {
                        disabledAttrPlan = 'disabled title="Plan sudah dilock. Hanya Office Assistant Mill, Manager Mill, Askep, atau Krani Mill yang dapat mengubahnya."';
                    }
                }
                
                html += `
                    <td style="padding: 4px;">
                        <input type="number" step="0.01" class="form-control tonase-input" data-estate="${est}" data-hour="${hour}" value="${val}" min="0" placeholder="" style="min-width: 80px; width: 100%; padding: 6px; text-align: center; font-size: 0.9rem;" ${disabledAttrPlan}>
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
            
            let hasTargets = false;
            if (efbData.length > 0) {
                hasTargets = efbData.some(e => e.target && parseFloat(e.target) > 0);
            }
            
            if (!hasTargets) {
                try {
                    const latestRes = await fetch(`${API_URL}/daily-monitor/${mill}/latest-efb-target?date=${date}`);
                    if (latestRes.ok) {
                        const latestData = await latestRes.json();
                        latestData.forEach(latestEfb => {
                            let existing = efbData.find(e => e.estate === latestEfb.estate);
                            if (existing) {
                                existing.target = latestEfb.target;
                            } else {
                                efbData.push({ estate: latestEfb.estate, target: latestEfb.target });
                            }
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch latest efb target", err);
                }
            }
            
            html += `<h4 style="margin-top: 25px; margin-bottom: 10px; color: var(--primary-color);">TARGET EFB (TONASE HARIAN)</h4>`;
            html += `<div style="overflow-x: auto; max-width: 100%; padding-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
            <table class="data-table" style="min-width: 600px; border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="min-width: 60px; background: #f8cbad; border-bottom: 2px solid #ddd; padding: 8px;">TARGET</th>`;
            supplyChainEFB.forEach(est => {
                html += `<th style="background: #f8cbad; min-width: 100px; border-bottom: 2px solid #ddd; padding: 8px; font-size: 0.8rem;">${est.toUpperCase()}</th>`;
            });
            html += `</tr></thead><tbody><tr>`;
            html += `<td style="font-weight:bold; background: #fff;">TONASE</td>`;
            
            let canEditEfb = currentUser && ['Admin', 'Office Assistant Mill', 'Supervisor Mill', 'Manager Mill', 'Krani Mill'].includes(currentUser.role);
            let disableAttrEfb = canEditEfb ? '' : 'disabled title="Akses ditolak. Hanya Office Assistant Mill, Supervisor Mill, Manager Mill, dan Krani Mill yang dapat mengisi ini."';
            
            if (hasTargets) {
                canEditEfb = currentUser && ['Admin', 'Office Assistant Mill', 'Manager Mill', 'Askep', 'Krani Mill'].includes(currentUser.role);
                if (!canEditEfb) {
                    disableAttrEfb = 'disabled title="Plan EFB sudah dilock. Hanya Office Assistant Mill, Manager Mill, Askep, atau Krani Mill yang dapat mengubahnya."';
                }
            }

            supplyChainEFB.forEach(est => {
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
        if (window.tonaseMode === 'plan') {
            const canEditLockedPlan = currentUser && ['Admin', 'Office Assistant Mill', 'Manager Mill', 'Askep', 'Krani Mill'].includes(currentUser.role);
            if (!canEditLockedPlan) {
                alert("Plan sudah dilock karena sudah pernah diinput. Hanya level Office Assistant Mill, Manager Mill, Askep, atau Krani Mill yang dapat mengubah plan.");
                return;
            }
        }
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
        
        const datasets = [{
            label: 'Realisasi Tonase Masuk (Ton)',
            data: realized.map(v => v / 1000),
            backgroundColor: '#f7a01d',
            borderRadius: 4
        }];
        
        const hasTargets = targets.some(v => v > 0);
        if (hasTargets) {
            datasets.push({
                label: 'Target Tonase (Ton)',
                data: targets.map(v => v / 1000),
                backgroundColor: 'rgba(203, 213, 225, 0.5)',
                borderRadius: 4
            });
        }

        tonaseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
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
        
        const supplyChainFFB = masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => s.estate);
        const supplyChainEFB = masterData.supply_chain.filter(s => s.is_efb !== false).map(s => s.estate);
        const supplyChain = supplyChainFFB;
        
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
        
        const abbrMap = {};
        if (masterData && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                abbrMap[item.name] = item.abbr;
            });
        }
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
            window.renderDailyMonitorTables(mill, date, supplyChain, totalActAkumulasi, estateFfbAkumulasiMap, supplyChainEFB);
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

let historicalPlanningChartInstance = null;

window.openHistoricalPlanning = () => {
    let modal = document.getElementById('modal-historical-planning');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-historical-planning';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '1000';
        modal.innerHTML = `
            <div class="modal-content" style="width: 900px; max-width: 95vw; height: 80vh; display:flex; flex-direction:column; overflow:hidden;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding: 15px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <h3 style="margin:0;"><i class="fa-solid fa-chart-column"></i> Historical Planning</h3>
                    <button type="button" class="modal-close" onclick="document.getElementById('modal-historical-planning').style.display='none';">&times;</button>
                </div>
                <div style="padding: 15px; display:flex; gap:10px; align-items:center; background:white; border-bottom:1px solid #e2e8f0;">
                    <label style="font-weight:bold;">Pilih Bulan:</label>
                    <input type="month" id="historical-planning-month" class="form-control" style="width:auto;" value="${window.getLocalDate().substring(0, 7)}" onchange="loadHistoricalPlanningChart()">
                    <button class="btn btn-primary" onclick="loadHistoricalPlanningChart()">Tampilkan</button>
                </div>
                <div style="flex:1; padding: 15px; background: white; overflow: hidden; display:flex; flex-direction:column;">
                    <div style="flex:1; width:100%; position:relative;">
                        <canvas id="historicalPlanningChartCanvas"></canvas>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    setTimeout(loadHistoricalPlanningChart, 100);
};

window.loadHistoricalPlanningChart = async () => {
    const monthInput = document.getElementById('historical-planning-month');
    if (!monthInput || !monthInput.value) return;
    const month = monthInput.value; // YYYY-MM
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        
        const primeSel = document.getElementById('prime-estate');
        const selectedEstate = primeSel ? primeSel.value : 'ALL';
        
        const res = await fetch(`${API_URL}/tonase/${mill}/month/${month}`);
        const data = await window.parseTonaseResponse(res);
        
        const year = parseInt(month.split('-')[0]);
        const m = parseInt(month.split('-')[1]);
        const daysInMonth = new Date(year, m, 0).getDate();
        
        const dailyData = {};
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${month}-${i.toString().padStart(2, '0')}`;
            dailyData[dStr] = { prime: 0, middle: 0, last: 0, total: 0 };
        }
        
        const primeHours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
        const middleHours = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const lastHours = ['19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        
        data.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            
            const d = item.date.split('T')[0];
            if (!dailyData[d]) dailyData[d] = { prime: 0, middle: 0, last: 0, total: 0 };
            
            const kg = parseFloat(item.target_kg) || 0; // Use target_kg for planning
            if (kg > 0) {
                if (primeHours.includes(item.time_hour)) {
                    dailyData[d].prime += kg;
                } else if (middleHours.includes(item.time_hour)) {
                    dailyData[d].middle += kg;
                } else if (lastHours.includes(item.time_hour)) {
                    dailyData[d].last += kg;
                } else {
                    // Jika target diinput secara harian tanpa jam spesifik, bagi rata ke 3 bagian
                    const third = kg / 3;
                    dailyData[d].prime += third;
                    dailyData[d].middle += third;
                    dailyData[d].last += third;
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
        
        const ctx = document.getElementById('historicalPlanningChartCanvas');
        if (!ctx) return;
        
        if (historicalPlanningChartInstance) {
            historicalPlanningChartInstance.destroy();
        }
        
        historicalPlanningChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Prime Time (06:00 - 12:00) Plan',
                        data: primePct,
                        rawTonase: primeRaw,
                        backgroundColor: '#1d4ed8', // Blue
                    },
                    {
                        label: 'Middle Time (13:00 - 18:00) Plan',
                        data: middlePct,
                        rawTonase: middleRaw,
                        backgroundColor: '#22c55e', // Green
                    },
                    {
                        label: 'Last Time (19:00 - 24:00) Plan',
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
        console.error('Error loading historical planning chart:', e);
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
        const canLock = ['Admin', 'Manager Mill', 'Supervisor Mill', 'Manager', 'Askep', 'Krani Mill'].includes(currentUser.role);
        
        document.getElementById('dm-is-processing').disabled = isLocked && !canLock;
        document.getElementById('dm-efb-ratio').disabled = isLocked && !canLock;
        document.getElementById('dm-sisa-kemarin').disabled = isLocked && !canLock;
        document.getElementById('btn-lock-mill-config').style.display = canLock ? 'inline-block' : 'none';
        
        if (isLocked) {
            document.getElementById('mill-config-status').innerText = canLock ? "Terkunci (Anda memiliki akses)" : "Terkunci";
        } else {
            document.getElementById('mill-config-status').innerText = "Belum dilock";
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

window.renderDailyMonitorTables = async (mill, date, supplyChain, totalFfb, estateFfbAkumulasiMap = {}, supplyChainEFB = null) => {
    if (!supplyChainEFB) supplyChainEFB = supplyChain;
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
        
        const masterRes = await fetch(`${API_URL}/master/${mill}`);
        const masterData = await masterRes.json();
        
        const abbrMap = {};
        if (masterData && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                abbrMap[item.name] = item.abbr;
            });
        }
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
                        <th style="background-color: #e2e8f0; color: #000;">TARGET</th>
                        <th style="background-color: #000; color: #fff;">TRIP</th>
                        <th style="background-color: #000; color: #fff;">ACT MTD</th>
                        <th style="background-color: #e2e8f0; color: #000;">TARGET MTD</th>
                        <th style="background-color: #000; color: #fff;">TRIP MTD</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let tEfbTon = 0, tEfbTonMtd = 0, tEfbTrip = 0, tEfbTarget = 0, tEfbTargetMtd = 0, tEfbTripMtd = 0;
            supplyChainEFB.forEach(est => {
                const eRow = efbData.find(x => x.estate === est);
                const eMtd = efbMtdData.find(x => x.estate === est);
                
                const ton = eRow ? (parseFloat(eRow.tonase) || 0) : 0;
                const trip = eRow ? (parseInt(eRow.trip) || 0) : 0;
                const target = eRow ? (parseFloat(eRow.target) || 0) : 0;
                const tonMtd = eMtd ? (parseFloat(eMtd.tonase_mtd) || 0) : 0;
                const targetMtd = eMtd ? (parseFloat(eMtd.target_mtd) || 0) : 0;
                const tripMtd = eMtd ? (parseInt(eMtd.trip_mtd) || 0) : 0;
                
                tEfbTon += ton;
                tEfbTrip += trip;
                tEfbTarget += target;
                tEfbTonMtd += tonMtd;
                tEfbTargetMtd += targetMtd;
                tEfbTripMtd += tripMtd;
                
                jHtml += `<tr>
                    <td style="text-align: left; background-color: #fff;">${getAbbr(est)}</td>
                    <td style="background-color: #fff;">${ton > 0 ? ton.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                    <td style="background-color: #f1f5f9; font-weight: bold;">${target > 0 ? target.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #fff;">${trip > 0 ? trip : '0'}</td>
                    <td style="background-color: #fff;">${tonMtd > 0 ? tonMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00'}</td>
                    <td style="background-color: #f1f5f9; font-weight: bold;">${targetMtd > 0 ? targetMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #fff;">${tripMtd > 0 ? tripMtd : '0'}</td>
                </tr>`;
            });
            
            const sisaSekarang = sisaKemarin + jjkProduksi - tEfbTon;
            
            jHtml += `
                <tr style="background-color: #f8cbad; font-weight: bold;">
                    <td style="background-color: #f8cbad; text-align: left;">TOTAL</td>
                    <td style="background-color: #f8cbad;">${tEfbTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="background-color: #f8cbad;">${tEfbTarget > 0 ? tEfbTarget.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #f8cbad;">${tEfbTrip}</td>
                    <td style="background-color: #f8cbad;">${tEfbTonMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="background-color: #f8cbad;">${tEfbTargetMtd > 0 ? tEfbTargetMtd.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #f8cbad;">${tEfbTripMtd}</td>
                </tr>
                <tr style="background-color: #f8cbad; font-weight: bold; font-size: 1.1em;">
                    <td colspan="4" style="background-color: #f8cbad; text-align: left;">SISA JJK SEKARANG</td>
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
        if (data.success) {
            submitBtn.innerText = 'Memasuki Dashboard...';
            submitBtn.style.backgroundColor = '#10b981';
            errorEl.style.color = '#10b981';
            errorEl.innerText = 'Berhasil! Mengalihkan...';
            errorEl.style.display = 'block';
            
            const loginPassEl = document.getElementById('login-sandi');
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

window.openHistoricalActual = () => {
    document.getElementById('modal-historical-actual').style.display = 'flex';
    setTimeout(loadHistoricalActualChart, 100);
};

window.toggleHistoricalActualInputs = () => {
    const type = document.getElementById('historical-actual-type').value;
    if (type === 'bulanan') {
        document.getElementById('lbl-historical-actual-month').style.display = 'block';
        document.getElementById('historical-actual-month').style.display = 'block';
        document.getElementById('lbl-historical-actual-date').style.display = 'none';
        document.getElementById('historical-actual-date').style.display = 'none';
    } else {
        document.getElementById('lbl-historical-actual-month').style.display = 'none';
        document.getElementById('historical-actual-month').style.display = 'none';
        document.getElementById('lbl-historical-actual-date').style.display = 'block';
        document.getElementById('historical-actual-date').style.display = 'block';
    }
};

let historicalActualPrimeChartInstance = null;
let cumulativeFFBTimeBandChartInstance = null;

window.loadHistoricalActualChart = async () => {
    const type = document.getElementById('historical-actual-type') ? document.getElementById('historical-actual-type').value : 'bulanan';
    const monthInput = document.getElementById('historical-actual-month');
    const dateInput = document.getElementById('historical-actual-date');
    if (type === 'bulanan' && (!monthInput || !monthInput.value)) return;
    if (type === 'harian' && (!dateInput || !dateInput.value)) return;
    
    const month = type === 'bulanan' ? monthInput.value : dateInput.value.substring(0, 7);
    const selectedDate = type === 'harian' ? dateInput.value : null;
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        
        const primeSel = document.getElementById('prime-estate');
        const selectedEstate = primeSel ? primeSel.value : 'ALL';
        
        const res = await fetch(`${API_URL}/tonase/${mill}/month/${month}`);
        const data = await window.parseTonaseResponse(res);
        
        const year = parseInt(month.split('-')[0]);
        const m = parseInt(month.split('-')[1]);
        const daysInMonth = new Date(year, m, 0).getDate();
        
        const dailyData = {};
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${month}-${i.toString().padStart(2, '0')}`;
            dailyData[dStr] = { prime: 0, middle: 0, last: 0, total: 0 };
        }
        
        const primeHours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
        const middleHours = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const lastHours = ['19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
        
        let bands = [0, 0, 0, 0, 0, 0];
        let totalMonth = 0;
        
        data.forEach(item => {
            if (selectedEstate !== 'ALL' && item.estate !== selectedEstate) return;
            const kg = parseFloat(item.realized_kg) || 0;
            if (kg > 0) {
                const d = item.date.split('T')[0];
                if (dailyData[d]) {
                    if (primeHours.includes(item.time_hour)) dailyData[d].prime += kg;
                    else if (middleHours.includes(item.time_hour)) dailyData[d].middle += kg;
                    else if (lastHours.includes(item.time_hour)) dailyData[d].last += kg;
                    else {
                        const third = kg / 3;
                        dailyData[d].prime += third;
                        dailyData[d].middle += third;
                        dailyData[d].last += third;
                    }
                    dailyData[d].total += kg;
                }
                
                const hourStr = item.time_hour;
                if (hourStr) {
                    if (type === 'bulanan' || (type === 'harian' && item.date.startsWith(selectedDate))) {
                        const hour = parseInt(hourStr.split(':')[0], 10);
                        totalMonth += kg;
                        if (hour > 6 && hour <= 10) bands[0] += kg;
                        else if (hour > 10 && hour <= 12) bands[1] += kg;
                        else if (hour > 12 && hour <= 14) bands[2] += kg;
                        else if (hour > 14 && hour <= 16) bands[3] += kg;
                        else if (hour > 16 && hour <= 18) bands[4] += kg;
                        else if (hour > 18 || hour <= 6) bands[5] += kg;
                    }
                }
            }
        });
        
        const labels = [];
        const primePct = [];
        const middlePct = [];
        const lastPct = [];
        const primeRaw = [];
        const middleRaw = [];
        const lastRaw = [];
        
        for (let i = 1; i <= daysInMonth; i++) {
            labels.push(i.toString());
            const dStr = `${month}-${i.toString().padStart(2, '0')}`;
            const dayRecord = dailyData[dStr];
            if (dayRecord && dayRecord.total > 0) {
                primePct.push((dayRecord.prime / dayRecord.total) * 100);
                middlePct.push((dayRecord.middle / dayRecord.total) * 100);
                lastPct.push((dayRecord.last / dayRecord.total) * 100);
                primeRaw.push(dayRecord.prime);
                middleRaw.push(dayRecord.middle);
                lastRaw.push(dayRecord.last);
            } else {
                primePct.push(0); middlePct.push(0); lastPct.push(0);
                primeRaw.push(0); middleRaw.push(0); lastRaw.push(0);
            }
        }
        
        const primeCtx = document.getElementById('historicalActualPrimeChartCanvas');
        if (primeCtx) {
            if (historicalActualPrimeChartInstance) historicalActualPrimeChartInstance.destroy();
            historicalActualPrimeChartInstance = new Chart(primeCtx, {
                type: 'bar',
                plugins: [window.ChartDataLabels || ChartDataLabels],
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Prime Time (06:00 - 12:00)', data: primePct, rawTonase: primeRaw, backgroundColor: '#1d4ed8' },
                        { label: 'Middle Time (13:00 - 18:00)', data: middlePct, rawTonase: middleRaw, backgroundColor: '#22c55e' },
                        { label: 'Last Time (19:00 - 24:00)', data: lastPct, rawTonase: lastRaw, backgroundColor: '#eab308' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, title: { display: true, text: 'TANGGAL' } },
                        y: { stacked: true, min: 0, max: 100, title: { display: true, text: 'PERSENTASE (%)' }, ticks: { callback: v => v + '%' } }
                    },
                    plugins: {
                        datalabels: {
                            display: true,
                            color: 'white',
                            font: { weight: 'bold', size: 10 },
                            formatter: (value, context) => {
                                if (value < 5) return '';
                                const raw = context.dataset.rawTonase[context.dataIndex];
                                const mt = (raw / 1000).toFixed(1) + ' MT';
                                return `${value.toFixed(1)}%\n${mt}`;
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.raw || 0;
                                    const raw = context.dataset.rawTonase[context.dataIndex];
                                    const mt = (raw / 1000).toFixed(2);
                                    return `${context.dataset.label}: ${val.toFixed(2)}% (${mt} MT)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        const cumulativePct = [];
        let acc = 0;
        for (let i = 0; i < bands.length; i++) {
            acc += bands[i];
            cumulativePct.push(totalMonth > 0 ? (acc / totalMonth) * 100 : 0);
        }
        
        const cumCtx = document.getElementById('cumulativeFFBTimeBandChartCanvas');
        if (cumCtx) {
            if (cumulativeFFBTimeBandChartInstance) cumulativeFFBTimeBandChartInstance.destroy();
            cumulativeFFBTimeBandChartInstance = new Chart(cumCtx, {
                type: 'line',
                plugins: [window.ChartDataLabels || ChartDataLabels],
                data: {
                    labels: ['7am to\n10am', '10am to\n12pm', '12pm to\n2pm', '2pm to\n4pm', '4pm to\n6pm', 'After 6pm'],
                    datasets: [{
                        label: 'Cumulative FFB Received %',
                        data: cumulativePct,
                        borderColor: '#eab308',
                        backgroundColor: '#eab308',
                        tension: 0.1,
                        pointRadius: 6,
                        borderWidth: 3,
                        segment: {
                            borderColor: ctx => {
                                const idx = ctx.p1DataIndex;
                                const colors = ['#166534', '#22c55e', '#4ade80', '#facc15', '#b45309', '#ef4444'];
                                return colors[idx] || '#eab308';
                            }
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Time Period', color: '#1e3a8a', font: { weight: 'bold' } }, ticks: { callback: function(val) { return this.getLabelForValue(val).split('\n'); } } },
                        y: { title: { display: true, text: 'FFB Received %', color: '#1e3a8a', font: { weight: 'bold' } }, min: 0, max: 100, ticks: { stepSize: 50, callback: v => v + '%' } }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            display: true,
                            align: 'top',
                            color: (context) => {
                                const colors = ['#166534', '#22c55e', '#4ade80', '#facc15', '#b45309', '#ef4444'];
                                return colors[context.dataIndex] || '#000';
                            },
                            font: { weight: 'bold', size: 12 },
                            formatter: value => value.toFixed(2) + '%'
                        },
                        tooltip: { callbacks: { label: function(context) { return `Cumulative: ${context.raw.toFixed(2)}%`; } } }
                    }
                }
            });
        }
    } catch(e) {
        console.error(e);
        alert('Gagal memuat data historical actual.');
    }
};

let dashboardProgressHistoricalChartInstance = null;
window.loadDashboardProgressHistoricalChart = async () => {
    const dInput = document.getElementById('dashboard-progress-historical-date');
    if (!dInput || !dInput.value) return;
    const selectedDate = dInput.value;
    
    document.getElementById('dashboard-progress-historical-chart-container').style.display = 'block';
    
    try {
        let mill = currentUser.estate;
        if (!mill || !mill.endsWith('Mill')) {
            mill = 'Bunga Tanjung Mill';
        }
        const res = await fetch(`${API_URL}/tonase/${mill}/${selectedDate}`);
        const data = await window.parseTonaseResponse(res);
        
        let bands = [0, 0, 0, 0, 0, 0];
        let totalDay = 0;
        
        const isMillUser = currentUser && currentUser.estate && currentUser.estate.endsWith('Mill');
        const primeSel = document.getElementById('prime-estate');
        const selectedEstate = primeSel ? primeSel.value : 'ALL';
        
        data.forEach(item => {
            if (!isMillUser && currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
                if (item.estate !== currentUser.estate) return;
            } else if (selectedEstate !== 'ALL') {
                if (item.estate !== selectedEstate) return;
            }
            
            const kg = parseFloat(item.realized_kg) || 0;
            if (kg > 0) {
                totalDay += kg;
                const hourStr = item.time_hour;
                if (hourStr) {
                    const hour = parseInt(hourStr.split(':')[0], 10);
                    if (hour > 6 && hour <= 10) bands[0] += kg;
                    else if (hour > 10 && hour <= 12) bands[1] += kg;
                    else if (hour > 12 && hour <= 14) bands[2] += kg;
                    else if (hour > 14 && hour <= 16) bands[3] += kg;
                    else if (hour > 16 && hour <= 18) bands[4] += kg;
                    else if (hour > 18 || hour <= 6) bands[5] += kg;
                }
            }
        });
        
        const bandsPct = bands.map(b => totalDay > 0 ? (b / totalDay) * 100 : 0);
        const bgColors = ['#d1d5db', '#d1d5db', '#4ade80', '#eab308', '#ca8a04', '#ef4444'];
        
        const ctx = document.getElementById('dashboardProgressHistoricalChartCanvas');
        if (ctx) {
            if (dashboardProgressHistoricalChartInstance) dashboardProgressHistoricalChartInstance.destroy();
            dashboardProgressHistoricalChartInstance = new Chart(ctx, {
                type: 'bar',
                plugins: [window.ChartDataLabels || ChartDataLabels],
                data: {
                    labels: ['7am to\n10am', '10am to\n12pm', '12pm to\n2pm', '2pm to\n4pm', '4pm to\n6pm', 'After 6pm'],
                    datasets: [{
                        label: 'FFB Received %',
                        data: bandsPct,
                        backgroundColor: bgColors,
                        borderWidth: 0,
                        barPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            title: { display: true, text: 'Time Band', color: '#1e3a8a', font: { weight: 'bold' } }, 
                            ticks: { callback: function(val) { return this.getLabelForValue(val).split('\n'); } },
                            grid: { display: false }
                        },
                        y: { 
                            title: { display: true, text: 'FFB Received %', color: '#1e3a8a', font: { weight: 'bold' } }, 
                            min: 0, 
                            suggestedMax: 50, 
                            ticks: { stepSize: 50, callback: v => v + '%' },
                            border: { display: false },
                            grid: { borderDash: [4, 4], color: '#e5e7eb' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            display: true,
                            anchor: 'end',
                            align: 'bottom',
                            color: '#fff',
                            textAlign: 'center',
                            backgroundColor: (context) => {
                                const val = context.dataset.data[context.dataIndex];
                                // If value is very small, we might want to place it outside, but the screenshot has it inside the background box
                                return bgColors[context.dataIndex];
                            },
                            borderRadius: 4,
                            padding: 4,
                            font: { size: 10, weight: 'bold' },
                            formatter: (value, context) => {
                                const tonase = (bands[context.dataIndex] / 1000).toFixed(2);
                                return value.toFixed(2) + '%\n' + tonase;
                            }
                        },
                        tooltip: { 
                            callbacks: { 
                                label: function(context) { 
                                    return `${context.raw.toFixed(2)}% (${(bands[context.dataIndex]/1000).toFixed(2)} Ton)`; 
                                } 
                            } 
                        }
                    }
                }
            });
        }
    } catch(e) {
        console.error(e);
        alert('Gagal memuat data.');
    }
};

// ==========================================
// --- TONASE SUB-SHEET & SUMMARY PENERIMAAN TBS SYSTEM ---
// ==========================================

window.activeTonaseSubTab = 'monitor';

window.switchTonaseSubTab = (tabId) => {
    window.activeTonaseSubTab = tabId;
    
    // Toggle active class on tab buttons
    const btnMonitor = document.getElementById('tab-btn-tonase-monitor');
    const btnSummary = document.getElementById('tab-btn-tonase-summary');
    
    if (btnMonitor) btnMonitor.classList.toggle('active', tabId === 'monitor');
    if (btnSummary) btnSummary.classList.toggle('active', tabId === 'summary');
    
    // Toggle active class on tab contents
    const contentMonitor = document.getElementById('tonase-subsheet-monitor');
    const contentSummary = document.getElementById('tonase-subsheet-summary');
    
    if (contentMonitor) contentMonitor.classList.toggle('active', tabId === 'monitor');
    if (contentSummary) contentSummary.classList.toggle('active', tabId === 'summary');
    
    if (tabId === 'monitor') {
        if (typeof window.renderTonaseMonitorTable === 'function') {
            window.renderTonaseMonitorTable();
        }
        if (typeof window.loadTonaseChartData === 'function') {
            window.loadTonaseChartData();
        }
    } else if (tabId === 'summary') {
        // Init dates if not set
        const dateInput = document.getElementById('tsum-date');
        const monitorDate = document.getElementById('monitor-tonase-date');
        if (dateInput) {
            if (!dateInput.value) {
                dateInput.value = (monitorDate && monitorDate.value) ? monitorDate.value : window.getLocalDate();
            }
        }
        window.loadTonaseSummaryData();
    }
};

let chartTsumTimeDistInstance = null;
let chartTsumIntervalInstance = null;
window.cachedTonaseSummaryData = null;

window.loadTonaseSummaryData = async () => {
    const dateInput = document.getElementById('tsum-date');
    const scopeSelect = document.getElementById('tsum-scope');
    
    if (!dateInput || !dateInput.value) {
        if (dateInput) dateInput.value = window.getLocalDate();
    }
    
    const selectedDate = dateInput ? dateInput.value : window.getLocalDate();
    const scope = scopeSelect ? scopeSelect.value : 'daily';
    const month = selectedDate.substring(0, 7); // YYYY-MM
    
    let mill = currentUser.estate;
    if (!mill || !mill.endsWith('Mill')) {
        mill = 'Bunga Tanjung Mill';
    }
    
    const estateTableBody = document.querySelector('#tsum-estate-table tbody');
    if (estateTableBody) {
        estateTableBody.innerHTML = '<tr><td colspan="16" style="text-align:center; padding: 25px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data analisis penerimaan TBS...</td></tr>';
    }
    
    try {
        const promises = [
            fetch(`${API_URL}/master/${mill}`),
            scope === 'mtd' ? fetch(`${API_URL}/tonase/${mill}/month/${month}`) : fetch(`${API_URL}/tonase/${mill}/${selectedDate}`),
            fetch(`${API_URL}/daily-monitor/${mill}/${selectedDate}`)
        ];
        
        const [masterRes, tonaseRes, dmRes] = await Promise.all(promises);
        const masterData = await masterRes.json();
        const tonaseData = await window.parseTonaseResponse(tonaseRes);
        const dmData = await dmRes.json();
        
        window.cachedTonaseSummaryData = {
            mill,
            selectedDate,
            scope,
            month,
            masterData,
            tonaseData,
            dmData
        };
        
        window.processAndRenderTonaseSummary();
    } catch(err) {
        console.error('Error loading Tonase Summary:', err);
        if (estateTableBody) {
            estateTableBody.innerHTML = '<tr><td colspan="16" style="text-align:center; padding: 20px; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data analisis penerimaan TBS.</td></tr>';
        }
    }
};

window.processAndRenderTonaseSummary = () => {
    if (!window.cachedTonaseSummaryData) return;
    const { mill, selectedDate, scope, month, masterData, tonaseData, dmData } = window.cachedTonaseSummaryData;
    
    const supplyChainFFB = (masterData.supply_chain || []).filter(s => s.is_ffb !== false).map(s => s.estate);
    const supplyChainEFB = (masterData.supply_chain || []).filter(s => s.is_efb !== false).map(s => s.estate);
    
    const abbrMap = {};
    if (masterData && masterData.supply_chain_list) {
        masterData.supply_chain_list.forEach(item => {
            abbrMap[item.name] = item.abbr;
        });
    }
    const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

    // Time buckets
    const primeHours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
    const middleHours = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const lastHours = ['19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];

    const intervals = [
        { label: '06:00 - 08:00', hours: ['06:00', '07:00', '08:00'] },
        { label: '08:00 - 10:00', hours: ['09:00', '10:00'] },
        { label: '10:00 - 12:00', hours: ['11:00', '12:00'] },
        { label: '12:00 - 14:00', hours: ['13:00', '14:00'] },
        { label: '14:00 - 16:00', hours: ['15:00', '16:00'] },
        { label: '16:00 - 18:00', hours: ['17:00', '18:00'] },
        { label: '18:00 - 20:00', hours: ['19:00', '20:00'] },
        { label: '> 20:00 (Malam)', hours: ['21:00', '22:00', '23:00', '24:00'] }
    ];

    const lfList = dmData.lf || [];
    const efbList = dmData.efb || [];
    const millConfig = dmData.config || dmData.mill_config || {};

    // 1. Process Estate Aggregation
    const estateStats = [];
    let totPlanTon = 0, totActTon = 0, totTrips = 0, totLfTon = 0;
    let totPrimeTon = 0, totMidTon = 0, totLastTon = 0;

    supplyChainFFB.forEach(est => {
        const estRows = tonaseData.filter(t => t.estate === est);
        let planKg = 0, actKg = 0, tripCount = 0;
        let primeKg = 0, midKg = 0, lastKg = 0;

        estRows.forEach(r => {
            const pKg = parseFloat(r.target_kg) || 0;
            const aKg = parseFloat(r.realized_kg) || 0;
            const tr = parseInt(r.realized_trip) || 0;
            const hr = r.time_hour;

            planKg += pKg;
            actKg += aKg;
            tripCount += tr;

            if (primeHours.includes(hr)) primeKg += aKg;
            else if (middleHours.includes(hr)) midKg += aKg;
            else if (lastHours.includes(hr)) lastKg += aKg;
        });

        const planTon = planKg / 1000;
        const actTon = actKg / 1000;
        const primeTon = primeKg / 1000;
        const midTon = midKg / 1000;
        const lastTon = lastKg / 1000;

        const estAbbr = getAbbr(est);
        const lfRow = lfList.find(x => 
            x.estate === est || 
            x.estate === estAbbr || 
            getAbbr(x.estate) === estAbbr ||
            (x.estate && est && x.estate.trim().toLowerCase() === est.trim().toLowerCase())
        );
        const lfTon = lfRow ? (parseFloat(lfRow.actual_lf_tonase !== undefined ? lfRow.actual_lf_tonase : lfRow.tonase) || 0) : 0;
        const lfPct = actTon > 0 ? (lfTon / actTon * 100) : 0;

        const pctPlan = planTon > 0 ? (actTon / planTon * 100) : (actTon > 0 ? 100 : 0);
        const payload = tripCount > 0 ? (actTon / tripCount) : 0;

        const primePct = actTon > 0 ? (primeTon / actTon * 100) : 0;
        const midPct = actTon > 0 ? (midTon / actTon * 100) : 0;
        const lastPct = actTon > 0 ? (lastTon / actTon * 100) : 0;

        // Evaluation status
        let evalStatus = '';
        let evalBadgeClass = '';
        if (actTon === 0) {
            evalStatus = 'Belum Ada Kiriman';
            evalBadgeClass = 'grading-cell-neutral';
        } else if (lastPct > 30) {
            evalStatus = 'Penumpukan Last Time (Sore/Malam)';
            evalBadgeClass = 'grading-cell-danger';
        } else if (payload > 0 && payload < 6.5) {
            evalStatus = 'Payload Truk Rendah (<6.5 T)';
            evalBadgeClass = 'grading-cell-warn';
        } else if (pctPlan >= 100) {
            evalStatus = 'Target Tercapai & Lancar';
            evalBadgeClass = 'grading-cell-good';
        } else {
            evalStatus = 'Kirim Normal Sesuai Jadwal';
            evalBadgeClass = 'grading-cell-good';
        }

        estateStats.push({
            estate: est,
            abbr: getAbbr(est),
            planTon,
            actTon,
            pctPlan,
            tripCount,
            payload,
            lfTon,
            lfPct,
            primeTon,
            primePct,
            midTon,
            midPct,
            lastTon,
            lastPct,
            evalStatus,
            evalBadgeClass
        });

        totPlanTon += planTon;
        totActTon += actTon;
        totTrips += tripCount;
        totLfTon += lfTon;
        totPrimeTon += primeTon;
        totMidTon += midTon;
        totLastTon += lastTon;
    });

    // 2. Process Interval 2-Jam Aggregation
    const intervalStats = [];
    let cumActTon = 0;
    let totIntervalPlan = 0, totIntervalAct = 0, totIntervalTrips = 0;

    intervals.forEach(inv => {
        let invPlanKg = 0, invActKg = 0, invTrips = 0;
        tonaseData.forEach(r => {
            if (inv.hours.includes(r.time_hour)) {
                invPlanKg += parseFloat(r.target_kg) || 0;
                invActKg += parseFloat(r.realized_kg) || 0;
                invTrips += parseInt(r.realized_trip) || 0;
            }
        });

        const invPlanTon = invPlanKg / 1000;
        const invActTon = invActKg / 1000;
        cumActTon += invActTon;

        const proporsiPct = totActTon > 0 ? (invActTon / totActTon * 100) : 0;
        const cumPct = totActTon > 0 ? (cumActTon / totActTon * 100) : 0;

        let trafficStatus = 'Normal Lancar';
        let trafficBadge = 'grading-cell-good';
        if (proporsiPct > 25) {
            trafficStatus = 'Puncak / Antrian Loading Ramp';
            trafficBadge = 'grading-cell-danger';
        } else if (proporsiPct >= 15) {
            trafficStatus = 'Arus Padat Terkendali';
            trafficBadge = 'grading-cell-warn';
        }

        intervalStats.push({
            label: inv.label,
            planTon: invPlanTon,
            actTon: invActTon,
            trips: invTrips,
            proporsiPct,
            cumActTon,
            cumPct,
            trafficStatus,
            trafficBadge
        });

        totIntervalPlan += invPlanTon;
        totIntervalAct += invActTon;
        totIntervalTrips += invTrips;
    });

    // 3. Process EFB Aggregation
    const efbRatio = parseFloat(millConfig.efb_ratio) || 22.0;
    const sisaKemarin = parseFloat(millConfig.sisa_kemarin_jjk !== undefined ? millConfig.sisa_kemarin_jjk : (millConfig.sisa_kemarin || 0));
    const isProcessing = millConfig.is_processing === 1;
    const estProduksiEfb = isProcessing ? (totActTon * efbRatio / 100) : (totActTon * efbRatio / 100);

    let totEfbTarget = 0, totEfbActual = 0, totEfbTrip = 0;
    const efbStats = [];

    const efbSourceList = (scope === 'mtd' && dmData.efb_mtd && dmData.efb_mtd.length > 0) ? dmData.efb_mtd : efbList;

    supplyChainEFB.forEach((est, idx) => {
        const estAbbr = getAbbr(est);
        const row = efbSourceList.find(e => 
            e.estate === est || 
            e.estate === estAbbr || 
            getAbbr(e.estate) === estAbbr ||
            (e.estate && est && e.estate.trim().toLowerCase() === est.trim().toLowerCase())
        );

        let tgt = 0, act = 0, tr = 0;
        if (row) {
            if (scope === 'mtd' && row.tonase_mtd !== undefined) {
                tgt = parseFloat(row.target_mtd) || 0;
                act = parseFloat(row.tonase_mtd) || 0;
                tr = parseInt(row.trip_mtd) || 0;
            } else {
                tgt = parseFloat(row.target !== undefined ? row.target : (row.target_tonase || 0)) || 0;
                act = parseFloat(row.tonase !== undefined ? row.tonase : (row.actual_tonase || 0)) || 0;
                tr = parseInt(row.trip !== undefined ? row.trip : (row.actual_trip || 0)) || 0;
            }
        }

        const pct = tgt > 0 ? (act / tgt * 100) : (act > 0 ? 100 : 0);
        const tonPerTrip = tr > 0 ? (act / tr) : 0;

        let status = act >= tgt && tgt > 0 ? 'Tuntas Sesuai Target' : (act > 0 ? 'Sebagian Terangkut' : 'Belum Ada Evakuasi');
        let statusBadge = act >= tgt && tgt > 0 ? 'grading-cell-good' : (act > 0 ? 'grading-cell-warn' : 'grading-cell-neutral');

        efbStats.push({
            no: idx + 1,
            estate: est,
            abbr: estAbbr,
            target: tgt,
            actual: act,
            pct,
            trip: tr,
            tonPerTrip,
            status,
            statusBadge
        });

        totEfbTarget += tgt;
        totEfbActual += act;
        totEfbTrip += tr;
    });

    const sisaJjkPabrik = Math.max(0, sisaKemarin + estProduksiEfb - totEfbActual);

    // 4. Render KPI Cards
    const totalPlanPct = totPlanTon > 0 ? (totActTon / totPlanTon * 100) : (totActTon > 0 ? 100 : 0);
    const avgPayload = totTrips > 0 ? (totActTon / totTrips) : 0;
    const pPrimePct = totActTon > 0 ? (totPrimeTon / totActTon * 100) : 0;
    const pMidPct = totActTon > 0 ? (totMidTon / totActTon * 100) : 0;
    const pLastPct = totActTon > 0 ? (totLastTon / totActTon * 100) : 0;

    const elKpiTotalTbs = document.getElementById('tsum-kpi-total-tbs');
    const elKpiTotalPlan = document.getElementById('tsum-kpi-total-plan');
    if (elKpiTotalTbs) elKpiTotalTbs.innerText = `${totActTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton`;
    if (elKpiTotalPlan) elKpiTotalPlan.innerText = `Target Plan: ${totPlanTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton (${totalPlanPct.toFixed(1)}%)`;

    const elKpiPayload = document.getElementById('tsum-kpi-payload');
    const elKpiTrips = document.getElementById('tsum-kpi-trips');
    if (elKpiPayload) elKpiPayload.innerText = `${avgPayload.toFixed(2)} Ton / Trip`;
    if (elKpiTrips) elKpiTrips.innerText = `Total ${totTrips} Ritase Truk TBS`;

    const elKpiTimeDist = document.getElementById('tsum-kpi-timedist');
    const elKpiTimeDistSub = document.getElementById('tsum-kpi-timedist-sub');
    if (elKpiTimeDist) elKpiTimeDist.innerText = `${pPrimePct.toFixed(0)}% / ${pMidPct.toFixed(0)}% / ${pLastPct.toFixed(0)}%`;
    if (elKpiTimeDistSub) elKpiTimeDistSub.innerText = `Prime: ${totPrimeTon.toFixed(1)}T | Mid: ${totMidTon.toFixed(1)}T | Last: ${totLastTon.toFixed(1)}T`;

    const elKpiEfb = document.getElementById('tsum-kpi-efb');
    const elKpiEfbSub = document.getElementById('tsum-kpi-efb-sub');
    if (elKpiEfb) elKpiEfb.innerText = `${totEfbActual.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton`;
    if (elKpiEfbSub) elKpiEfbSub.innerText = `Sisa Stock JJK di Pabrik: ${sisaJjkPabrik.toFixed(2)} Ton`;

    // Render Mini Balance Box
    const elEfbKemarin = document.getElementById('tsum-efb-kemarin');
    const elEfbProduksi = document.getElementById('tsum-efb-produksi');
    const elEfbRealisasi = document.getElementById('tsum-efb-realisasi');
    const elEfbSisa = document.getElementById('tsum-efb-sisa');
    if (elEfbKemarin) elEfbKemarin.innerText = `${sisaKemarin.toFixed(2)} Ton`;
    if (elEfbProduksi) elEfbProduksi.innerText = `${estProduksiEfb.toFixed(2)} Ton`;
    if (elEfbRealisasi) elEfbRealisasi.innerText = `${totEfbActual.toFixed(2)} Ton`;
    if (elEfbSisa) elEfbSisa.innerText = `${sisaJjkPabrik.toFixed(2)} Ton`;

    // 5. Render Table 1 (Estate Summary)
    const tbEstate = document.querySelector('#tsum-estate-table tbody');
    const tfEstate = document.querySelector('#tsum-estate-table tfoot');
    if (tbEstate) {
        let html = '';
        estateStats.forEach((st, idx) => {
            const planBadge = st.pctPlan >= 100 ? 'grading-cell-good' : (st.pctPlan >= 85 ? 'grading-cell-warn' : (st.actTon > 0 ? 'grading-cell-danger' : ''));
            const payloadBadge = st.payload >= 7.5 ? 'grading-cell-good' : (st.payload >= 6.5 ? 'grading-cell-warn' : (st.tripCount > 0 ? 'grading-cell-danger' : ''));
            const lastBadge = st.lastPct > 30 ? 'grading-cell-danger' : (st.lastPct > 15 ? 'grading-cell-warn' : '');

            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align: left; font-weight: 600;">${st.estate}</td>
                    <td style="background-color: #f0f9ff; font-weight: bold;">${st.planTon > 0 ? st.planTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td style="background-color: #ecfdf5; font-weight: bold;">${st.actTon > 0 ? st.actTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                    <td class="${planBadge}" style="font-weight: bold;">${st.actTon > 0 ? st.pctPlan.toFixed(1) + '%' : '-'}</td>
                    <td>${st.tripCount > 0 ? st.tripCount : '-'}</td>
                    <td class="${payloadBadge}" style="font-weight: bold;">${st.payload > 0 ? st.payload.toFixed(2) : '-'}</td>
                    <td>${st.lfTon > 0 ? st.lfTon.toFixed(2) : '-'}</td>
                    <td>${st.lfTon > 0 ? st.lfPct.toFixed(2) + '%' : '0.00%'}</td>
                    <td style="background-color: #eff6ff;">${st.primeTon > 0 ? st.primeTon.toFixed(2) : '-'}</td>
                    <td style="background-color: #eff6ff; font-weight: 600;">${st.primeTon > 0 ? st.primePct.toFixed(1) + '%' : '0%'}</td>
                    <td style="background-color: #f0fdf4;">${st.midTon > 0 ? st.midTon.toFixed(2) : '-'}</td>
                    <td style="background-color: #f0fdf4; font-weight: 600;">${st.midTon > 0 ? st.midPct.toFixed(1) + '%' : '0%'}</td>
                    <td style="background-color: #fffbeb;">${st.lastTon > 0 ? st.lastTon.toFixed(2) : '-'}</td>
                    <td class="${lastBadge}" style="font-weight: 600;">${st.lastTon > 0 ? st.lastPct.toFixed(1) + '%' : '0%'}</td>
                    <td><span class="grading-badge ${st.evalBadgeClass}" style="font-size: 0.72rem; padding: 2px 6px;">${st.evalStatus}</span></td>
                </tr>
            `;
        });
        tbEstate.innerHTML = html || '<tr><td colspan="16" style="text-align:center; padding: 15px;">Tidak ada data TBS.</td></tr>';
    }

    if (tfEstate) {
        const totLfPct = totActTon > 0 ? (totLfTon / totActTon * 100) : 0;
        const totPrimePct = totActTon > 0 ? (totPrimeTon / totActTon * 100) : 0;
        const totMidPct = totActTon > 0 ? (totMidTon / totActTon * 100) : 0;
        const totLastPct = totActTon > 0 ? (totLastTon / totActTon * 100) : 0;

        tfEstate.innerHTML = `
            <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
                <td colspan="2" style="text-align: left; padding-left: 10px;">TOTAL / RATA-RATA PABRIK</td>
                <td style="background-color: #bae6fd;">${totPlanTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="background-color: #a7f3d0;">${totActTon.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="background-color: #99f6e4;">${totalPlanPct.toFixed(1)}%</td>
                <td>${totTrips}</td>
                <td style="background-color: #c7d2fe;">${avgPayload.toFixed(2)}</td>
                <td>${totLfTon.toFixed(2)}</td>
                <td>${totLfPct.toFixed(2)}%</td>
                <td style="background-color: #bfdbfe;">${totPrimeTon.toFixed(2)}</td>
                <td style="background-color: #bfdbfe;">${totPrimePct.toFixed(1)}%</td>
                <td style="background-color: #bbf7d0;">${totMidTon.toFixed(2)}</td>
                <td style="background-color: #bbf7d0;">${totMidPct.toFixed(1)}%</td>
                <td style="background-color: #fde68a;">${totLastTon.toFixed(2)}</td>
                <td style="background-color: #fde68a;">${totLastPct.toFixed(1)}%</td>
                <td><span class="grading-badge grading-cell-good" style="font-size: 0.72rem; padding: 2px 6px;">Total Konsolidasi</span></td>
            </tr>
        `;
    }

    // 6. Render Table 2 (Interval 2 Jam)
    const tbInterval = document.querySelector('#tsum-interval-table tbody');
    const tfInterval = document.querySelector('#tsum-interval-table tfoot');
    if (tbInterval) {
        let html = '';
        intervalStats.forEach(inv => {
            html += `
                <tr>
                    <td style="font-weight: 600; text-align: left; padding-left: 10px;">${inv.label}</td>
                    <td>${inv.planTon > 0 ? inv.planTon.toFixed(2) : '-'}</td>
                    <td style="font-weight: bold; background-color: #ecfdf5;">${inv.actTon > 0 ? inv.actTon.toFixed(2) : '-'}</td>
                    <td>${inv.trips > 0 ? inv.trips : '-'}</td>
                    <td style="font-weight: 600;">${inv.actTon > 0 ? inv.proporsiPct.toFixed(1) + '%' : '0%'}</td>
                    <td style="background-color: #f8fafc;">${inv.cumActTon > 0 ? inv.cumActTon.toFixed(2) + ' (' + inv.cumPct.toFixed(0) + '%)' : '-'}</td>
                    <td><span class="grading-badge ${inv.trafficBadge}" style="font-size: 0.72rem; padding: 2px 6px;">${inv.trafficStatus}</span></td>
                </tr>
            `;
        });
        tbInterval.innerHTML = html;
    }
    if (tfInterval) {
        tfInterval.innerHTML = `
            <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td style="text-align: left; padding-left: 10px;">TOTAL</td>
                <td>${totIntervalPlan.toFixed(2)}</td>
                <td style="background-color: #a7f3d0;">${totIntervalAct.toFixed(2)}</td>
                <td>${totIntervalTrips}</td>
                <td>100%</td>
                <td>${totActTon.toFixed(2)} (100%)</td>
                <td>-</td>
            </tr>
        `;
    }

    // 7. Render Table 3 (EFB)
    const tbEfb = document.querySelector('#tsum-efb-table tbody');
    const tfEfb = document.querySelector('#tsum-efb-table tfoot');
    if (tbEfb) {
        let html = '';
        efbStats.forEach(st => {
            html += `
                <tr>
                    <td>${st.no}</td>
                    <td style="text-align: left; font-weight: 600;">${st.estate}</td>
                    <td>${st.target > 0 ? st.target.toFixed(2) : '-'}</td>
                    <td style="font-weight: bold; background-color: #ecfdf5;">${st.actual > 0 ? st.actual.toFixed(2) : '-'}</td>
                    <td style="font-weight: bold;">${st.actual > 0 ? st.pct.toFixed(1) + '%' : '-'}</td>
                    <td>${st.trip > 0 ? st.trip : '-'}</td>
                    <td>${st.tonPerTrip > 0 ? st.tonPerTrip.toFixed(2) : '-'}</td>
                    <td><span class="grading-badge ${st.statusBadge}" style="font-size: 0.72rem; padding: 2px 6px;">${st.status}</span></td>
                </tr>
            `;
        });
        tbEfb.innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding: 15px;">Tidak ada data evakuasi EFB.</td></tr>';
    }
    if (tfEfb) {
        const totEfbPct = totEfbTarget > 0 ? (totEfbActual / totEfbTarget * 100) : (totEfbActual > 0 ? 100 : 0);
        const totEfbTonPerTrip = totEfbTrip > 0 ? (totEfbActual / totEfbTrip) : 0;
        tfEfb.innerHTML = `
            <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="2" style="text-align: left; padding-left: 10px;">TOTAL EVAKUASI</td>
                <td>${totEfbTarget.toFixed(2)}</td>
                <td style="background-color: #a7f3d0;">${totEfbActual.toFixed(2)}</td>
                <td>${totEfbPct.toFixed(1)}%</td>
                <td>${totEfbTrip}</td>
                <td>${totEfbTonPerTrip.toFixed(2)}</td>
                <td><span class="grading-badge grading-cell-good" style="font-size: 0.72rem; padding: 2px 6px;">Konsolidasi</span></td>
            </tr>
        `;
    }

    // 8. Render Charts
    window.renderTonaseSummaryCharts(estateStats, intervalStats);

    // 9. Render Smart Diagnostic Insights
    window.renderTonaseSummaryInsights(estateStats, intervalStats, efbStats, {
        totActTon, totPlanTon, avgPayload, pPrimePct, pMidPct, pLastPct, sisaJjkPabrik, estProduksiEfb, totEfbActual
    });
};

window.renderTonaseSummaryCharts = (estateStats, intervalStats) => {
    // Chart 1: Stacked Bar Chart Distribusi Waktu per Estate
    const ctxTimeDist = document.getElementById('chart-tsum-timedist');
    if (ctxTimeDist) {
        if (chartTsumTimeDistInstance) chartTsumTimeDistInstance.destroy();

        const labels = estateStats.map(e => e.abbr);
        const primeData = estateStats.map(e => e.primeTon);
        const midData = estateStats.map(e => e.midTon);
        const lastData = estateStats.map(e => e.lastTon);

        chartTsumTimeDistInstance = new Chart(ctxTimeDist, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Prime Time (06:00 - 12:00)',
                        data: primeData,
                        backgroundColor: '#2563eb',
                        stack: 'time'
                    },
                    {
                        label: 'Middle Time (13:00 - 18:00)',
                        data: midData,
                        backgroundColor: '#16a34a',
                        stack: 'time'
                    },
                    {
                        label: 'Last Time (19:00 - 24:00)',
                        data: lastData,
                        backgroundColor: '#f59e0b',
                        stack: 'time'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                return `${context.dataset.label}: ${val.toFixed(2)} Ton`;
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, title: { display: true, text: 'Tonase TBS (Ton)' }, beginAtZero: true }
                }
            }
        });
    }

    // Chart 2: Interval 2-Jam Arus Masuk vs Kumulatif
    const ctxInterval = document.getElementById('chart-tsum-interval');
    if (ctxInterval) {
        if (chartTsumIntervalInstance) chartTsumIntervalInstance.destroy();

        const labels = intervalStats.map(i => i.label);
        const actTonData = intervalStats.map(i => i.actTon);
        const cumPctData = intervalStats.map(i => i.cumPct);

        chartTsumIntervalInstance = new Chart(ctxInterval, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Realisasi Tonase (Ton)',
                        data: actTonData,
                        backgroundColor: '#0d9488',
                        yAxisID: 'y',
                        order: 2
                    },
                    {
                        type: 'line',
                        label: 'Kumulatif Kedatangan (%)',
                        data: cumPctData,
                        borderColor: '#ea580c',
                        backgroundColor: '#ea580c',
                        borderWidth: 2.5,
                        pointRadius: 4,
                        tension: 0.2,
                        yAxisID: 'y1',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.type === 'line') {
                                    return `Kumulatif: ${context.raw.toFixed(1)}%`;
                                }
                                return `Tonase: ${context.raw.toFixed(2)} Ton`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Tonase Masuk (Ton)' },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Kumulatif (%)' },
                        min: 0,
                        max: 100,
                        grid: { drawOnChartArea: false },
                        ticks: { callback: v => v + '%' }
                    }
                }
            }
        });
    }
};

window.renderTonaseSummaryInsights = (estateStats, intervalStats, efbStats, metrics) => {
    const list = document.getElementById('tsum-insights-list');
    if (!list) return;

    const insights = [];

    // 1. Target Plan Achievement
    if (metrics.totActTon >= metrics.totPlanTon && metrics.totPlanTon > 0) {
        insights.push(`<strong>Penerimaan TBS Optimal:</strong> Total realisasi TBS pabrik mencapai <strong>${metrics.totActTon.toFixed(2)} Ton</strong> (${((metrics.totActTon/metrics.totPlanTon)*100).toFixed(1)}% dari target plan). Suplai bahan baku pabrik memenuhi rencana olah.`);
    } else if (metrics.totPlanTon > 0) {
        const gap = metrics.totPlanTon - metrics.totActTon;
        insights.push(`<strong>Under-Target Plan (${((metrics.totActTon/metrics.totPlanTon)*100).toFixed(1)}%):</strong> Realisasi TBS masih di bawah target dengan selisih <strong>${gap.toFixed(2)} Ton</strong>. Koordinasikan dengan estate pengirim untuk memastikan pemenuhan janjang panen.`);
    }

    // 2. Time Distribution & Last Time Congestion
    const lateEstates = estateStats.filter(e => e.lastPct > 30 && e.actTon > 0);
    if (lateEstates.length > 0) {
        const names = lateEstates.map(e => `${e.estate} (${e.lastPct.toFixed(1)}%)`).join(', ');
        insights.push(`<strong>Peringatan Penumpukan Last Time (>18:00 WIB):</strong> Estate ${names} mengirimkan lebih dari 30% TBS di malam hari. Hal ini berisiko menimbulkan antrian timbangan, beban lembur loading ramp, dan penurunan mutu buah (kenaikan asam lemak bebas / FFA). <em>Rekomendasi: Dorong percepatan muat di TPH sejak pagi hari (07:00-10:00).</em>`);
    } else {
        insights.push(`<strong>Ritme Kirim Teratur:</strong> Distribusi kedatangan TBS berjalan seimbang dengan dominasi pada Prime Time (06-12: <strong>${metrics.pPrimePct.toFixed(1)}%</strong>) dan Middle Time (13-18: <strong>${metrics.pMidPct.toFixed(1)}%</strong>), meminimalkan risiko bottleneck timbangan malam hari.`);
    }

    // 3. Payload & Truck Fleet Efficiency
    const lowPayloadEstates = estateStats.filter(e => e.payload < 6.5 && e.tripCount > 0);
    if (lowPayloadEstates.length > 0) {
        const names = lowPayloadEstates.map(e => `${e.estate} (${e.payload.toFixed(2)} T/trip)`).join(', ');
        insights.push(`<strong>Efisiensi Muatan Truk Perlu Ditingkatkan:</strong> Estate ${names} memiliki rata-rata muatan di bawah 6.50 Ton/trip. <em>Rekomendasi: Optimalisasi susunan muatan janjang di bak truk agar biaya solar dan kebutuhan armada per tonase TBS lebih efisien.</em>`);
    } else if (metrics.avgPayload >= 7.5) {
        insights.push(`<strong>Payload Armada Sangat Efisien:</strong> Rata-rata muatan truk mencapai <strong>${metrics.avgPayload.toFixed(2)} Ton / Trip</strong> (di atas standar optimal 7.50 Ton/Trip).`);
    }

    // 4. EFB Evacuation Balance
    if (metrics.sisaJjkPabrik > 50) {
        insights.push(`<strong>Perhatian Penumpukan Jangkos (EFB):</strong> Sisa stock jangkos di area pabrik mencapai <strong>${metrics.sisaJjkPabrik.toFixed(2)} Ton</strong>. <em>Rekomendasi: Segera prioritaskan truk kebun untuk membawa muatan balik jangkos (backload) saat kembali ke estate guna mencegah risiko panas/kebakaran di hopper jangkos.</em>`);
    } else {
        insights.push(`<strong>Evakuasi EFB Terkendali:</strong> Total evakuasi jangkos mencapai <strong>${metrics.totEfbActual.toFixed(2)} Ton</strong> dengan sisa stock pabrik yang rendah (<strong>${metrics.sisaJjkPabrik.toFixed(2)} Ton</strong>). Area hopper jangkos dalam kondisi bersih.`);
    }

    list.innerHTML = insights.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('');
};

window.printTonaseSummary = () => {
    window.print();
};

window.exportTonaseSummaryCSV = () => {
    if (!window.cachedTonaseSummaryData) {
        alert('Data belum dimuat.');
        return;
    }
    const { mill, selectedDate, scope } = window.cachedTonaseSummaryData;
    
    let csv = `LAPORAN SUMMARY PENERIMAAN TBS & EVAKUASI EFB\n`;
    csv += `Unit Pabrik: ${mill}\n`;
    csv += `Tanggal: ${selectedDate} (Scope: ${scope.toUpperCase()})\n\n`;
    
    // Table 1
    csv += `1. REKAPITULASI PENERIMAAN TBS PER ESTATE\n`;
    csv += `No,Estate,Target Plan (Ton),Realisasi TBS (Ton),% Capaian,Trip,Payload (Ton/Trip),Loose Fruit (Ton),% LF,Prime 06-12 (Ton),% Prime,Mid 13-18 (Ton),% Mid,Last 19-24 (Ton),% Last,Status Evaluasi\n`;
    
    const rows = document.querySelectorAll('#tsum-estate-table tbody tr');
    rows.forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });
    
    // Table 2
    csv += `\n2. REKAPITULASI RITME INTERVAL 2 JAM\n`;
    csv += `Interval Waktu,Plan (Ton),Realisasi (Ton),Trip,Proporsi (%),Kumulatif (Ton),Status Kepadatan\n`;
    const rows2 = document.querySelectorAll('#tsum-interval-table tbody tr');
    rows2.forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    // Table 3
    csv += `\n3. NERACA EVAKUASI EFB (JANGKOS)\n`;
    csv += `No,Estate,Target (Ton),Realisasi (Ton),% Capaian,Trip,Ton/Trip,Status\n`;
    const rows3 = document.querySelectorAll('#tsum-efb-table tbody tr');
    rows3.forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Summary_Penerimaan_TBS_${mill}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// =========================================================================
// --- VEHICLE MOTION SUB-SHEET & FLEET ANALYTICS SYSTEM ---
// =========================================================================

window.activeVehicleSubTab = 'monitor';
let chartVanalProdInstance = null;
let chartVanalTimeInstance = null;
window.cachedVehicleAnalyticsData = null;

window.switchVehicleSubTab = (tabId) => {
    window.activeVehicleSubTab = tabId;
    const btnMonitor = document.getElementById('tab-btn-vehicle-monitor');
    const btnAnalytics = document.getElementById('tab-btn-vehicle-analytics');
    if (btnMonitor) btnMonitor.classList.toggle('active', tabId === 'monitor');
    if (btnAnalytics) btnAnalytics.classList.toggle('active', tabId === 'analytics');

    const contentMonitor = document.getElementById('vehicle-subsheet-monitor');
    const contentAnalytics = document.getElementById('vehicle-subsheet-analytics');
    if (contentMonitor) contentMonitor.classList.toggle('active', tabId === 'monitor');
    if (contentAnalytics) contentAnalytics.classList.toggle('active', tabId === 'analytics');

    if (tabId === 'monitor') {
        renderVehicleTable();
    } else if (tabId === 'analytics') {
        const dateInput = document.getElementById('vanal-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = window.getLocalDate();
        }
        window.loadVehicleAnalyticsData();
    }
};

window.loadVehicleAnalyticsData = async () => {
    const dateInput = document.getElementById('vanal-date');
    const scopeSelect = document.getElementById('vanal-scope');
    if (dateInput && !dateInput.value) dateInput.value = window.getLocalDate();

    const selectedDate = dateInput ? dateInput.value : window.getLocalDate();
    const scope = scopeSelect ? scopeSelect.value : 'daily';
    const month = selectedDate.substring(0, 7);

    let rawVehicles = db.vehicles || [];
    
    // Filter by estate
    if (currentUser.estate && currentUser.estate.endsWith('Mill')) {
        const allowedEstates = (masterData.supply_chain || []).map(sc => sc.estate);
        rawVehicles = rawVehicles.filter(v => allowedEstates.includes(v.estate));
    } else if (currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        rawVehicles = rawVehicles.filter(v => v.estate === currentUser.estate);
    }

    // Filter by scope
    if (scope === 'daily') {
        rawVehicles = rawVehicles.filter(v => v.date === selectedDate);
    } else if (scope === 'mtd') {
        rawVehicles = rawVehicles.filter(v => v.date && v.date.startsWith(month));
    }

    window.cachedVehicleAnalyticsData = {
        selectedDate,
        scope,
        month,
        vehicles: rawVehicles
    };

    window.processAndRenderVehicleAnalytics();
};

window.processAndRenderVehicleAnalytics = () => {
    if (!window.cachedVehicleAnalyticsData) return;
    const { selectedDate, scope, vehicles } = window.cachedVehicleAnalyticsData;

    // Helper: convert HH:MM to minutes
    const parseMinutes = (tStr) => {
        if (!tStr) return null;
        const p = tStr.split(':');
        if (p.length < 2) return null;
        return parseInt(p[0]) * 60 + parseInt(p[1]);
    };

    // 1. Group by Truck
    const truckMap = {};
    let totJanjang = 0;
    let totDurationMin = 0;
    let validDurationCount = 0;
    let fastestMin = 9999, slowestMin = 0;
    let fastestInfo = '-', slowestInfo = '-';

    vehicles.forEach(v => {
        const key = v.plate || 'UNKNOWN';
        if (!truckMap[key]) {
            truckMap[key] = {
                plate: v.plate,
                driver: v.driver || '-',
                estate: v.estate || '-',
                divisi: v.divisi || '-',
                trips: 0,
                janjang: 0,
                totalDurMin: 0,
                durCount: 0,
                firstDepart: '23:59',
                lastArrive: '00:00'
            };
        }

        const tObj = truckMap[key];
        tObj.trips += 1;
        const jjg = parseInt(v.janjang) || 0;
        tObj.janjang += jjg;
        totJanjang += jjg;

        const tDepart = v.timedepart || v.timeDepart;
        const tArrive = v.timearrive || v.timeArrive;

        if (tDepart && tDepart < tObj.firstDepart) tObj.firstDepart = tDepart;
        if (tArrive && tArrive > tObj.lastArrive) tObj.lastArrive = tArrive;

        const dMin = parseMinutes(tDepart);
        const aMin = parseMinutes(tArrive);
        if (dMin !== null && aMin !== null) {
            let diff = aMin - dMin;
            if (diff < 0) diff += 1440; // over midnight
            tObj.totalDurMin += diff;
            tObj.durCount += 1;
            totDurationMin += diff;
            validDurationCount += 1;

            if (diff < fastestMin) {
                fastestMin = diff;
                fastestInfo = `${diff}m (${v.plate} / ${v.block})`;
            }
            if (diff > slowestMin) {
                slowestMin = diff;
                slowestInfo = `${diff}m (${v.plate} / ${v.block})`;
            }
        }
    });

    const truckStats = Object.values(truckMap).map(t => {
        const avgJjg = t.trips > 0 ? (t.janjang / t.trips) : 0;
        const avgDur = t.durCount > 0 ? Math.round(t.totalDurMin / t.durCount) : 0;
        
        let statusClass = 'grading-cell-good';
        let statusText = 'Sangat Produktif';
        if (t.trips < 2) {
            statusClass = 'grading-cell-warn';
            statusText = 'Ritase Rendah (<2 Rit)';
        } else if (avgJjg < 250 && avgJjg > 0) {
            statusClass = 'grading-cell-danger';
            statusText = 'Muatan Kurang (<250 JJG)';
        } else if (t.trips >= 3) {
            statusClass = 'grading-cell-good';
            statusText = 'Optimal (≥3 Rit)';
        }

        return {
            ...t,
            avgJjg,
            avgDur,
            statusClass,
            statusText,
            firstDepart: t.firstDepart === '23:59' ? '-' : t.firstDepart,
            lastArrive: t.lastArrive === '00:00' ? '-' : t.lastArrive
        };
    }).sort((a, b) => b.trips - a.trips || b.janjang - a.janjang);

    // 2. Group by Divisi / Blok
    const blockMap = {};
    vehicles.forEach(v => {
        const div = v.divisi || 'Divisi -';
        const blk = v.block || 'Blok -';
        const key = `${v.estate || ''}|${div}|${blk}`;

        if (!blockMap[key]) {
            blockMap[key] = {
                estate: v.estate || '-',
                divisi: div,
                block: blk,
                trips: 0,
                janjang: 0,
                minDur: 9999,
                maxDur: 0,
                totDur: 0,
                durCount: 0
            };
        }

        const bObj = blockMap[key];
        bObj.trips += 1;
        bObj.janjang += (parseInt(v.janjang) || 0);

        const dMin = parseMinutes(v.timedepart || v.timeDepart);
        const aMin = parseMinutes(v.timearrive || v.timeArrive);
        if (dMin !== null && aMin !== null) {
            let diff = aMin - dMin;
            if (diff < 0) diff += 1440;
            if (diff < bObj.minDur) bObj.minDur = diff;
            if (diff > bObj.maxDur) bObj.maxDur = diff;
            bObj.totDur += diff;
            bObj.durCount += 1;
        }
    });

    const blockStats = Object.values(blockMap).map(b => {
        const avgDur = b.durCount > 0 ? Math.round(b.totDur / b.durCount) : 0;
        let routeStatus = 'Lancar Terkendali';
        let routeBadge = 'grading-cell-good';
        if (avgDur > 120) {
            routeStatus = 'Jarak Jauh / Hambatan Jalan (>2 Jam)';
            routeBadge = 'grading-cell-danger';
        } else if (avgDur > 75) {
            routeStatus = 'Perjalanan Sedang (1-2 Jam)';
            routeBadge = 'grading-cell-warn';
        }
        return {
            ...b,
            avgDur,
            minDur: b.minDur === 9999 ? '-' : `${b.minDur}m`,
            maxDur: b.maxDur === 0 ? '-' : `${b.maxDur}m`,
            routeStatus,
            routeBadge
        };
    }).sort((a, b) => b.trips - a.trips);

    // 3. Render KPI Cards
    const totalTrips = vehicles.length;
    const activeTrucks = truckStats.length;
    const avgJjgPerTrip = totalTrips > 0 ? (totJanjang / totalTrips) : 0;
    const overallAvgDur = validDurationCount > 0 ? Math.round(totDurationMin / validDurationCount) : 0;
    const estTonase = (totJanjang * 18.5) / 1000; // Asumsi BJR 18.5 kg
    const avgTripsPerTruck = activeTrucks > 0 ? (totalTrips / activeTrucks) : 0;

    const elKpiTrips = document.getElementById('vanal-kpi-trips');
    const elKpiTrucks = document.getElementById('vanal-kpi-trucks');
    if (elKpiTrips) elKpiTrips.innerText = `${totalTrips} Trip`;
    if (elKpiTrucks) elKpiTrucks.innerText = `${activeTrucks} Truk Beroperasi Aktif`;

    const elKpiJanjang = document.getElementById('vanal-kpi-janjang');
    const elKpiAvgJjg = document.getElementById('vanal-kpi-avg-jjg');
    if (elKpiJanjang) elKpiJanjang.innerText = `${totJanjang.toLocaleString('id-ID')} JJG`;
    if (elKpiAvgJjg) elKpiAvgJjg.innerText = `Rata-rata ${avgJjgPerTrip.toFixed(0)} JJG / Trip`;

    const elKpiDuration = document.getElementById('vanal-kpi-duration');
    const elKpiFastSlow = document.getElementById('vanal-kpi-fastest-slowest');
    if (elKpiDuration) elKpiDuration.innerText = `${overallAvgDur} Menit`;
    if (elKpiFastSlow) elKpiFastSlow.innerText = `Cepat: ${fastestInfo} | Lambat: ${slowestInfo}`;

    const elKpiTonase = document.getElementById('vanal-kpi-tonase');
    const elKpiTurnaround = document.getElementById('vanal-kpi-turnaround');
    if (elKpiTonase) elKpiTonase.innerText = `${estTonase.toFixed(2)} Ton`;
    if (elKpiTurnaround) elKpiTurnaround.innerText = `Turnaround: ${avgTripsPerTruck.toFixed(1)} Rit / Truk`;

    // 4. Render Table 1 (Fleet)
    const tbTruck = document.querySelector('#vanal-truck-table tbody');
    const tfTruck = document.querySelector('#vanal-truck-table tfoot');
    if (tbTruck) {
        let html = '';
        truckStats.forEach((t, idx) => {
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align:left; font-weight:bold;">${t.plate}</td>
                    <td style="text-align:left;">${t.driver}</td>
                    <td>${getEstateCode(t.estate)}</td>
                    <td>${t.divisi}</td>
                    <td style="background-color:#f0f9ff; font-weight:bold;">${t.trips}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${t.janjang.toLocaleString('id-ID')}</td>
                    <td style="background-color:#eff6ff; font-weight:600;">${t.avgJjg.toFixed(0)}</td>
                    <td style="background-color:#fffbeb; font-weight:600;">${t.avgDur > 0 ? t.avgDur + ' m' : '-'}</td>
                    <td>${t.firstDepart}</td>
                    <td>${t.lastArrive}</td>
                    <td><span class="grading-badge ${t.statusClass}" style="font-size:0.72rem; padding:2px 6px;">${t.statusText}</span></td>
                </tr>
            `;
        });
        tbTruck.innerHTML = html || '<tr><td colspan="12" style="text-align:center; padding:15px;">Tidak ada data pergerakan truk.</td></tr>';
    }

    if (tfTruck) {
        tfTruck.innerHTML = `
            <tr style="background-color:#e2e8f0; font-weight:bold;">
                <td colspan="5" style="text-align:left; padding-left:10px;">TOTAL KONSOLIDASI ARMADA (${activeTrucks} Unit)</td>
                <td style="background-color:#bae6fd;">${totalTrips}</td>
                <td style="background-color:#a7f3d0;">${totJanjang.toLocaleString('id-ID')}</td>
                <td style="background-color:#bfdbfe;">${avgJjgPerTrip.toFixed(0)}</td>
                <td style="background-color:#fde68a;">${overallAvgDur} m</td>
                <td colspan="3">-</td>
            </tr>
        `;
    }

    // 5. Render Table 2 (Route / Block)
    const tbBlock = document.querySelector('#vanal-block-table tbody');
    const tfBlock = document.querySelector('#vanal-block-table tfoot');
    if (tbBlock) {
        let html = '';
        blockStats.slice(0, 15).forEach(b => {
            html += `
                <tr>
                    <td style="text-align:left; font-weight:600;">${b.divisi} / ${b.block}</td>
                    <td>${b.trips}</td>
                    <td style="font-weight:bold;">${b.janjang.toLocaleString('id-ID')}</td>
                    <td>${b.minDur}</td>
                    <td>${b.maxDur}</td>
                    <td style="background-color:#f8fafc; font-weight:600;">${b.avgDur > 0 ? b.avgDur + 'm' : '-'}</td>
                    <td><span class="grading-badge ${b.routeBadge}" style="font-size:0.7rem; padding:2px 5px;">${b.routeStatus}</span></td>
                </tr>
            `;
        });
        tbBlock.innerHTML = html || '<tr><td colspan="7" style="text-align:center; padding:15px;">Tidak ada data rute blok.</td></tr>';
    }
    if (tfBlock) {
        tfBlock.innerHTML = `
            <tr style="background-color:#e2e8f0; font-weight:bold;">
                <td style="text-align:left;">TOTAL</td>
                <td>${totalTrips}</td>
                <td>${totJanjang.toLocaleString('id-ID')}</td>
                <td colspan="4">-</td>
            </tr>
        `;
    }

    // 6. Render Charts
    window.renderVehicleCharts(truckStats, vehicles);

    // 7. Render Insights
    window.renderVehicleInsights(truckStats, blockStats, { totalTrips, activeTrucks, avgJjgPerTrip, overallAvgDur, estTonase, avgTripsPerTruck });
};

window.renderVehicleCharts = (truckStats, vehicles) => {
    // Chart 1: Bar Chart Produktivitas Janjang per Kendaraan
    const ctxProd = document.getElementById('chart-vanal-productivity');
    if (ctxProd) {
        if (chartVanalProdInstance) chartVanalProdInstance.destroy();
        const topTrucks = truckStats.slice(0, 10);
        chartVanalProdInstance = new Chart(ctxProd, {
            type: 'bar',
            data: {
                labels: topTrucks.map(t => t.plate),
                datasets: [
                    {
                        label: 'Total Janjang (JJG)',
                        data: topTrucks.map(t => t.janjang),
                        backgroundColor: '#059669',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Ritase (Trip)',
                        data: topTrucks.map(t => t.trips),
                        backgroundColor: '#0284c7',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Jumlah Janjang' }, beginAtZero: true },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Ritase' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // Chart 2: Timeline Kedatangan di PKS
    const ctxTime = document.getElementById('chart-vanal-timeline');
    if (ctxTime) {
        if (chartVanalTimeInstance) chartVanalTimeInstance.destroy();
        
        // Group arrivals by hour
        const hourBuckets = {};
        for (let h = 6; h <= 22; h++) {
            const hStr = h.toString().padStart(2, '0') + ':00';
            hourBuckets[hStr] = 0;
        }

        vehicles.forEach(v => {
            const arr = v.timearrive || v.timeArrive;
            if (arr) {
                const hr = arr.split(':')[0] + ':00';
                if (hourBuckets[hr] !== undefined) hourBuckets[hr] += 1;
            }
        });

        chartVanalTimeInstance = new Chart(ctxTime, {
            type: 'line',
            data: {
                labels: Object.keys(hourBuckets),
                datasets: [{
                    label: 'Jumlah Truk Tiba di PKS (Unit)',
                    data: Object.values(hourBuckets),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2.5,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { title: { display: true, text: 'Jumlah Truk Masuk' }, beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
};

window.renderVehicleInsights = (truckStats, blockStats, metrics) => {
    const list = document.getElementById('vanal-insights-list');
    if (!list) return;
    const insights = [];

    // 1. Ritase & Armada
    if (metrics.avgTripsPerTruck >= 2.5) {
        insights.push(`<strong>Utilisasi Armada Sangat Baik:</strong> Rata-rata perputaran truk mencapai <strong>${metrics.avgTripsPerTruck.toFixed(1)} Rit/Truk</strong>. Jadwal pengangkutan dari kebun berjalan optimal.`);
    } else {
        const lowTrips = truckStats.filter(t => t.trips === 1);
        if (lowTrips.length > 0) {
            insights.push(`<strong>Peluang Peningkatan Ritase:</strong> Sebanyak <strong>${lowTrips.length} truk</strong> hanya melakukan 1 ritase per hari. <em>Rekomendasi: Evaluasi kesiapan restan buah di TPH pagi hari agar truk dapat berangkat lebih awal.</em>`);
        }
    }

    // 2. Muatan JJG
    const lowPayload = truckStats.filter(t => t.avgJjg < 250 && t.trips > 0);
    if (lowPayload.length > 0) {
        const names = lowPayload.map(t => t.plate).join(', ');
        insights.push(`<strong>Muatan Di Bawah Kapasitas:</strong> Kendaraan ${names} memiliki muatan rata-rata di bawah 250 JJG/trip. <em>Rekomendasi: Maksimalkan susunan janjang di bak truk agar efisiensi solar dan biaya angkut per ton TBS lebih hemat.</em>`);
    }

    // 3. Durasi Perjalanan
    const longRoutes = blockStats.filter(b => b.avgDur > 100);
    if (longRoutes.length > 0) {
        const routeNames = longRoutes.map(b => `${b.divisi}/${b.block} (${b.avgDur}m)`).join(', ');
        insights.push(`<strong>Peringatan Hambatan Jalur / Jarak Jauh:</strong> Pengiriman dari ${routeNames} membutuhkan waktu tempuh di atas 100 menit. <em>Rekomendasi: Periksa kondisi jalan poros/kolektor kebun dan prioritaskan pengangkutan dari blok jauh pada pagi hari.</em>`);
    }

    list.innerHTML = insights.map(i => `<li style="margin-bottom:8px;">${i}</li>`).join('');
};

window.printVehicleAnalytics = () => window.print();

window.exportVehicleAnalyticsCSV = () => {
    if (!window.cachedVehicleAnalyticsData) { alert('Data belum dimuat.'); return; }
    const { selectedDate, scope } = window.cachedVehicleAnalyticsData;
    let csv = `LAPORAN ANALISA KINERJA & EFISIENSI ARMADA (VEHICLE MOTION)\nTanggal: ${selectedDate} (Scope: ${scope.toUpperCase()})\n\n`;
    csv += `1. KINERJA ARMADA PER TRUK & SUPIR\nNo,Plate Truk,Nama Supir,Asal Estate,Divisi,Total Ritase,Total Janjang,Rata-rata JJG/Trip,Rata-rata Durasi (m),Trip Pertama,Trip Terakhir,Status Utilisasi\n`;
    
    document.querySelectorAll('#vanal-truck-table tbody tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    csv += `\n2. ANALISIS LEAD TIME PER BLOK\nDivisi / Blok,Trip,Janjang,Tercepat,Terlama,Rata-rata,Evaluasi Jalur\n`;
    document.querySelectorAll('#vanal-block-table tbody tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Vehicle_Analytics_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// =========================================================================
// --- UPKEEP SUB-SHEET & PRODUCTIVITY ANALYTICS SYSTEM ---
// =========================================================================

window.activeUpkeepSubTab = 'monitor';
let chartUanalTypeInstance = null;
let chartUanalPrestasiInstance = null;
window.cachedUpkeepAnalyticsData = null;

window.switchUpkeepSubTab = (tabId) => {
    window.activeUpkeepSubTab = tabId;
    const btnMonitor = document.getElementById('tab-btn-upkeep-monitor');
    const btnAnalytics = document.getElementById('tab-btn-upkeep-analytics');
    if (btnMonitor) btnMonitor.classList.toggle('active', tabId === 'monitor');
    if (btnAnalytics) btnAnalytics.classList.toggle('active', tabId === 'analytics');

    const contentMonitor = document.getElementById('upkeep-subsheet-monitor');
    const contentAnalytics = document.getElementById('upkeep-subsheet-analytics');
    if (contentMonitor) contentMonitor.classList.toggle('active', tabId === 'monitor');
    if (contentAnalytics) contentAnalytics.classList.toggle('active', tabId === 'analytics');

    if (tabId === 'monitor') {
        renderUpkeepTable();
    } else if (tabId === 'analytics') {
        const dateInput = document.getElementById('uanal-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = window.getLocalDate();
        }
        window.loadUpkeepAnalyticsData();
    }
};

window.loadUpkeepAnalyticsData = async () => {
    const dateInput = document.getElementById('uanal-date');
    const scopeSelect = document.getElementById('uanal-scope');
    if (dateInput && !dateInput.value) dateInput.value = window.getLocalDate();

    const selectedDate = dateInput ? dateInput.value : window.getLocalDate();
    const scope = scopeSelect ? scopeSelect.value : 'all';
    const month = selectedDate.substring(0, 7);

    let rawUpkeep = db.upkeep || [];
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        rawUpkeep = rawUpkeep.filter(u => !u.estate || u.estate === currentUser.estate);
    }

    if (scope === 'daily') {
        rawUpkeep = rawUpkeep.filter(u => (u.startdate || u.startDate || u.date) === selectedDate);
    } else if (scope === 'mtd') {
        rawUpkeep = rawUpkeep.filter(u => {
            const d = u.startdate || u.startDate || u.date;
            return d && d.startsWith(month);
        });
    }

    // Populate type filter
    const typeSet = new Set(rawUpkeep.map(u => u.type).filter(Boolean));
    const typeFilter = document.getElementById('uanal-type-filter');
    if (typeFilter) {
        const curr = typeFilter.value;
        typeFilter.innerHTML = '<option value="">Semua Jenis Pekerjaan</option>';
        typeSet.forEach(t => {
            typeFilter.innerHTML += `<option value="${t}" ${t === curr ? 'selected' : ''}>${t}</option>`;
        });
    }

    window.cachedUpkeepAnalyticsData = {
        selectedDate,
        scope,
        month,
        upkeep: rawUpkeep
    };

    window.processAndRenderUpkeepAnalytics();
};

window.processAndRenderUpkeepAnalytics = () => {
    if (!window.cachedUpkeepAnalyticsData) return;
    const { upkeep } = window.cachedUpkeepAnalyticsData;
    const typeFilter = document.getElementById('uanal-type-filter');
    
    let filtered = upkeep;
    if (typeFilter && typeFilter.value) {
        filtered = filtered.filter(u => u.type === typeFilter.value);
    }

    // 1. Group by Job Type
    const typeMap = {};
    let totTargetHa = 0, totRealizedHa = 0, totHK = 0;

    filtered.forEach(u => {
        const type = u.type || 'Lainnya';
        if (!typeMap[type]) {
            typeMap[type] = {
                type,
                targetHa: 0,
                realizedHa: 0,
                targetWorkers: 0,
                realizedWorkers: 0,
                count: 0
            };
        }
        const tObj = typeMap[type];
        const tHa = parseFloat(u.target) || 0;
        const rHa = parseFloat(u.realized) || 0;
        const tW = parseInt(u.targetworkers !== undefined ? u.targetworkers : u.targetWorkers) || 0;
        const rW = parseInt(u.realizedworkers !== undefined ? u.realizedworkers : u.realizedWorkers) || tW || 0;

        tObj.targetHa += tHa;
        tObj.realizedHa += rHa;
        tObj.targetWorkers += tW;
        tObj.realizedWorkers += rW;
        tObj.count += 1;

        totTargetHa += tHa;
        totRealizedHa += rHa;
        totHK += rW;
    });

    const typeStats = Object.values(typeMap).map(t => {
        const pctHa = t.targetHa > 0 ? (t.realizedHa / t.targetHa * 100) : (t.realizedHa > 0 ? 100 : 0);
        const realizedPrestasi = t.realizedWorkers > 0 ? (t.realizedHa / t.realizedWorkers) : 0;
        const targetPrestasi = t.targetWorkers > 0 ? (t.targetHa / t.targetWorkers) : 0;
        const hkEfficiency = targetPrestasi > 0 ? (realizedPrestasi / targetPrestasi * 100) : 100;

        let statusClass = 'grading-cell-good';
        let statusText = 'Sesuai Norma';
        if (pctHa >= 100 && hkEfficiency >= 90) {
            statusClass = 'grading-cell-good';
            statusText = 'Sangat Produktif & Tuntas';
        } else if (pctHa < 70) {
            statusClass = 'grading-cell-danger';
            statusText = 'Progress Tertinggal (<70%)';
        } else if (hkEfficiency < 80) {
            statusClass = 'grading-cell-warn';
            statusText = 'Prestasi Rendah (<Norma HK)';
        }

        return {
            ...t,
            pctHa,
            realizedPrestasi,
            targetPrestasi,
            hkEfficiency,
            statusClass,
            statusText
        };
    }).sort((a, b) => b.realizedHa - a.realizedHa);

    // 2. Group by Mandor / Blok
    const blockStats = filtered.map(u => {
        const bData = masterData.blok.find(x => x.name === u.block);
        const divisi = bData ? bData.divisi : (u.divisi || '-');
        const rHa = parseFloat(u.realized) || 0;
        const tHa = parseFloat(u.target) || 0;
        const rW = parseInt(u.realizedworkers) || parseInt(u.targetworkers) || 0;
        const haPerHk = rW > 0 ? (rHa / rW) : 0;

        let evalBadge = 'grading-cell-good';
        let evalText = 'Efisien';
        if (haPerHk < 0.4 && haPerHk > 0) {
            evalBadge = 'grading-cell-danger';
            evalText = 'Kurang Produktif';
        } else if (rHa < tHa && u.status !== 'Selesai') {
            evalBadge = 'grading-cell-warn';
            evalText = 'In Progress';
        }

        return {
            block: u.block || '-',
            divisi,
            type: u.type || '-',
            mandor: u.worker || '-',
            targetHa: tHa,
            realizedHa: rHa,
            hk: rW,
            haPerHk,
            evalBadge,
            evalText
        };
    }).slice(0, 15);

    // 3. Render KPI Cards
    const overallPctHa = totTargetHa > 0 ? (totRealizedHa / totTargetHa * 100) : (totRealizedHa > 0 ? 100 : 0);
    const overallPrestasi = totHK > 0 ? (totRealizedHa / totHK) : 0;
    const dominantType = typeStats.length > 0 ? typeStats[0] : null;

    const elKpiArea = document.getElementById('uanal-kpi-area');
    const elKpiAreaSub = document.getElementById('uanal-kpi-area-sub');
    if (elKpiArea) elKpiArea.innerText = `${totRealizedHa.toFixed(2)} Ha`;
    if (elKpiAreaSub) elKpiAreaSub.innerText = `Target: ${totTargetHa.toFixed(2)} Ha (${overallPctHa.toFixed(1)}%)`;

    const elKpiHk = document.getElementById('uanal-kpi-hk');
    const elKpiHkSub = document.getElementById('uanal-kpi-hk-sub');
    if (elKpiHk) elKpiHk.innerText = `${totHK} HK`;
    if (elKpiHkSub) elKpiHkSub.innerText = `Total Alokasi Tenaga Kerja`;

    const elKpiPrestasi = document.getElementById('uanal-kpi-prestasi');
    const elKpiPrestasiSub = document.getElementById('uanal-kpi-prestasi-sub');
    if (elKpiPrestasi) elKpiPrestasi.innerText = `${overallPrestasi.toFixed(2)} Ha/HK`;
    if (elKpiPrestasiSub) elKpiPrestasiSub.innerText = `Rata-rata Konsolidasi Rawat`;

    const elKpiDominant = document.getElementById('uanal-kpi-dominant');
    const elKpiDominantSub = document.getElementById('uanal-kpi-dominant-sub');
    if (elKpiDominant) elKpiDominant.innerText = dominantType ? dominantType.type : '-';
    if (elKpiDominantSub) elKpiDominantSub.innerText = dominantType ? `${dominantType.realizedHa.toFixed(2)} Ha (${totRealizedHa > 0 ? (dominantType.realizedHa/totRealizedHa*100).toFixed(0) : 0}%)` : '-';

    // 4. Render Table 1 (Type)
    const tbType = document.querySelector('#uanal-type-table tbody');
    const tfType = document.querySelector('#uanal-type-table tfoot');
    if (tbType) {
        let html = '';
        typeStats.forEach((t, idx) => {
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align:left; font-weight:bold;">${t.type}</td>
                    <td style="background-color:#f0f9ff;">${t.targetHa.toFixed(2)}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${t.realizedHa.toFixed(2)}</td>
                    <td style="font-weight:bold;">${t.pctHa.toFixed(1)}%</td>
                    <td>${t.realizedWorkers}</td>
                    <td style="background-color:#eff6ff; font-weight:600;">${t.realizedPrestasi.toFixed(2)}</td>
                    <td style="background-color:#fffbeb; font-weight:600;">${t.hkEfficiency.toFixed(0)}%</td>
                    <td><span class="grading-badge ${t.statusClass}" style="font-size:0.72rem; padding:2px 6px;">${t.statusText}</span></td>
                </tr>
            `;
        });
        tbType.innerHTML = html || '<tr><td colspan="9" style="text-align:center; padding:15px;">Tidak ada data upkeep.</td></tr>';
    }
    if (tfType) {
        tfType.innerHTML = `
            <tr style="background-color:#e2e8f0; font-weight:bold;">
                <td colspan="2" style="text-align:left; padding-left:10px;">TOTAL KONSOLIDASI</td>
                <td style="background-color:#bae6fd;">${totTargetHa.toFixed(2)}</td>
                <td style="background-color:#a7f3d0;">${totRealizedHa.toFixed(2)}</td>
                <td style="background-color:#99f6e4;">${overallPctHa.toFixed(1)}%</td>
                <td>${totHK}</td>
                <td style="background-color:#bfdbfe;">${overallPrestasi.toFixed(2)}</td>
                <td colspan="2">-</td>
            </tr>
        `;
    }

    // 5. Render Table 2 (Block)
    const tbBlock = document.querySelector('#uanal-block-table tbody');
    if (tbBlock) {
        let html = '';
        blockStats.forEach(b => {
            html += `
                <tr>
                    <td style="text-align:left; font-weight:600;">${b.divisi} / ${b.block}</td>
                    <td>${b.type}</td>
                    <td style="text-align:left;"><small>${b.mandor}</small></td>
                    <td style="font-weight:bold;">${b.realizedHa.toFixed(2)}</td>
                    <td>${b.hk}</td>
                    <td style="font-weight:600;">${b.haPerHk.toFixed(2)}</td>
                    <td><span class="grading-badge ${b.evalBadge}" style="font-size:0.7rem; padding:2px 5px;">${b.evalText}</span></td>
                </tr>
            `;
        });
        tbBlock.innerHTML = html || '<tr><td colspan="7" style="text-align:center; padding:15px;">Tidak ada data blok.</td></tr>';
    }

    // 6. Render Charts
    window.renderUpkeepCharts(typeStats);

    // 7. Render Insights
    window.renderUpkeepInsights(typeStats, { totTargetHa, totRealizedHa, totHK, overallPrestasi, overallPctHa });
};

window.renderUpkeepCharts = (typeStats) => {
    // Chart 1: Luas Ha per Aktivitas
    const ctxType = document.getElementById('chart-uanal-type');
    if (ctxType) {
        if (chartUanalTypeInstance) chartUanalTypeInstance.destroy();
        chartUanalTypeInstance = new Chart(ctxType, {
            type: 'bar',
            data: {
                labels: typeStats.map(t => t.type),
                datasets: [
                    {
                        label: 'Target Plan (Ha)',
                        data: typeStats.map(t => t.targetHa),
                        backgroundColor: '#94a3b8'
                    },
                    {
                        label: 'Realisasi (Ha)',
                        data: typeStats.map(t => t.realizedHa),
                        backgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Luas (Ha)' }, beginAtZero: true } }
            }
        });
    }

    // Chart 2: Prestasi Realisasi Ha/HK
    const ctxPres = document.getElementById('chart-uanal-prestasi');
    if (ctxPres) {
        if (chartUanalPrestasiInstance) chartUanalPrestasiInstance.destroy();
        chartUanalPrestasiInstance = new Chart(ctxPres, {
            type: 'bar',
            data: {
                labels: typeStats.map(t => t.type),
                datasets: [{
                    label: 'Realisasi Prestasi (Ha/HK)',
                    data: typeStats.map(t => t.realizedPrestasi),
                    backgroundColor: '#0284c7'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Prestasi (Ha/HK)' }, beginAtZero: true } }
            }
        });
    }
};

window.renderUpkeepInsights = (typeStats, metrics) => {
    const list = document.getElementById('uanal-insights-list');
    if (!list) return;
    const insights = [];

    if (metrics.overallPctHa >= 90) {
        insights.push(`<strong>Capaian Rawat Kebun Sesuai Jadwal:</strong> Total realisasi fisik mencapai <strong>${metrics.totRealizedHa.toFixed(2)} Ha</strong> (${metrics.overallPctHa.toFixed(1)}% dari rencana).`);
    } else {
        const gap = metrics.totTargetHa - metrics.totRealizedHa;
        insights.push(`<strong>Defisit Target Rawat:</strong> Masih terdapat selisih <strong>${gap.toFixed(2)} Ha</strong> area rawat yang belum terselesaikan. <em>Rekomendasi: Tambah alokasi tenaga kerja atau percepat rotasi kerja mandor.</em>`);
    }

    const lowPres = typeStats.filter(t => t.realizedPrestasi < 0.5 && t.realizedHa > 0);
    if (lowPres.length > 0) {
        const names = lowPres.map(t => `${t.type} (${t.realizedPrestasi.toFixed(2)} Ha/HK)`).join(', ');
        insights.push(`<strong>Prestasi Kerja Perlu Dioptimalkan:</strong> Kegiatan ${names} mencatat output di bawah norma standar. <em>Rekomendasi: Evaluasi kendala lapangan (semak tebal / medan curam) dan pengawasan mandor.</em>`);
    }

    list.innerHTML = insights.map(i => `<li style="margin-bottom:8px;">${i}</li>`).join('');
};

window.printUpkeepAnalytics = () => window.print();

window.exportUpkeepAnalyticsCSV = () => {
    if (!window.cachedUpkeepAnalyticsData) { alert('Data belum dimuat.'); return; }
    const { selectedDate, scope } = window.cachedUpkeepAnalyticsData;
    let csv = `LAPORAN ANALISA PRODUKTIVITAS & KINERJA UPKEEP\nPeriode: ${selectedDate} (Scope: ${scope.toUpperCase()})\n\n`;
    csv += `1. REKAPITULASI CAPAIAN PER JENIS PEKERJAAN\nNo,Jenis Pekerjaan,Target (Ha),Realisasi (Ha),% Capaian,Total HK,Prestasi (Ha/HK),Efisiensi Kerja,Status Evaluasi\n`;
    
    document.querySelectorAll('#uanal-type-table tbody tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Upkeep_Analytics_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// =========================================================================
// --- PEMUPUKAN SUB-SHEET & DOSAGE ANALYTICS SYSTEM ---
// =========================================================================

window.activePemupukanSubTab = 'monitor';
let chartPanalAreaInstance = null;
let chartPanalDoseInstance = null;
window.cachedPemupukanAnalyticsData = null;

window.switchPemupukanSubTab = (tabId) => {
    window.activePemupukanSubTab = tabId;
    const btnMonitor = document.getElementById('tab-btn-pemupukan-monitor');
    const btnAnalytics = document.getElementById('tab-btn-pemupukan-analytics');
    if (btnMonitor) btnMonitor.classList.toggle('active', tabId === 'monitor');
    if (btnAnalytics) btnAnalytics.classList.toggle('active', tabId === 'analytics');

    const contentMonitor = document.getElementById('pemupukan-subsheet-monitor');
    const contentAnalytics = document.getElementById('pemupukan-subsheet-analytics');
    if (contentMonitor) contentMonitor.classList.toggle('active', tabId === 'monitor');
    if (contentAnalytics) contentAnalytics.classList.toggle('active', tabId === 'analytics');

    if (tabId === 'monitor') {
        renderPemupukanTable();
    } else if (tabId === 'analytics') {
        const dateInput = document.getElementById('panal-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = window.getLocalDate();
        }
        window.loadPemupukanAnalyticsData();
    }
};

window.loadPemupukanAnalyticsData = async () => {
    const dateInput = document.getElementById('panal-date');
    const scopeSelect = document.getElementById('panal-scope');
    if (dateInput && !dateInput.value) dateInput.value = window.getLocalDate();

    const selectedDate = dateInput ? dateInput.value : window.getLocalDate();
    const scope = scopeSelect ? scopeSelect.value : 'all';
    const month = selectedDate.substring(0, 7);

    let rawPemupukan = db.pemupukan || [];
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        rawPemupukan = rawPemupukan.filter(p => !p.estate || p.estate === currentUser.estate);
    }

    if (scope === 'daily') {
        rawPemupukan = rawPemupukan.filter(p => p.startdate === selectedDate || p.startDate === selectedDate);
    } else if (scope === 'mtd') {
        rawPemupukan = rawPemupukan.filter(p => (p.startdate && p.startdate.startsWith(month)) || (p.startDate && p.startDate.startsWith(month)));
    }

    // Populate pupuk filter
    const pupukSet = new Set(rawPemupukan.map(p => p.plan).filter(Boolean));
    const pupukFilter = document.getElementById('panal-pupuk-filter');
    if (pupukFilter) {
        const curr = pupukFilter.value;
        pupukFilter.innerHTML = '<option value="ALL">Semua Jenis Pupuk</option>' + 
            Array.from(pupukSet).map(p => `<option value="${p}">${p}</option>`).join('');
        if (curr && pupukSet.has(curr)) pupukFilter.value = curr;
    }

    window.cachedPemupukanAnalyticsData = {
        selectedDate,
        scope,
        month,
        pemupukan: rawPemupukan
    };

    window.processAndRenderPemupukanAnalytics();
};

window.processAndRenderPemupukanAnalytics = () => {
    if (!window.cachedPemupukanAnalyticsData) return;
    const { pemupukan } = window.cachedPemupukanAnalyticsData;
    const pupukFilter = document.getElementById('panal-pupuk-filter');
    const selectedPupuk = pupukFilter ? pupukFilter.value : 'ALL';

    let filtered = pemupukan;
    if (selectedPupuk && selectedPupuk !== 'ALL') {
        filtered = filtered.filter(p => p.plan === selectedPupuk);
    }

    // 1. Group by Jenis Pupuk
    const pupukMap = {};
    let totTargetHa = 0, totRealizedHa = 0, totTargetKg = 0, totRealizedKg = 0, totWorkers = 0;

    filtered.forEach(p => {
        const jenis = p.plan || 'Pupuk -';
        if (!pupukMap[jenis]) {
            pupukMap[jenis] = {
                jenis,
                targetHa: 0,
                realizedHa: 0,
                targetKg: 0,
                realizedKg: 0,
                dosisSum: 0,
                dosisCount: 0,
                workers: 0,
                count: 0
            };
        }
        const pObj = pupukMap[jenis];
        const tHa = parseFloat(p.targetha || p.targetHa) || 0;
        const rHa = parseFloat(p.realizedha || p.realizedHa) || 0;
        const tKg = parseFloat(p.targetkg || p.targetKg) || 0;
        const rKg = parseFloat(p.realizedkg || p.realizedKg) || 0;
        const rW = parseInt(p.realizedworkers || p.realizedWorkers || p.targetworkers || p.targetWorkers) || 0;
        const dosis = parseFloat(p.dosis) || 1.5;

        pObj.targetHa += tHa;
        pObj.realizedHa += rHa;
        pObj.targetKg += tKg;
        pObj.realizedKg += rKg;
        pObj.dosisSum += dosis;
        pObj.dosisCount += 1;
        pObj.workers += rW;
        pObj.count += 1;

        totTargetHa += tHa;
        totRealizedHa += rHa;
        totTargetKg += tKg;
        totRealizedKg += rKg;
        totWorkers += rW;
    });

    const pupukStats = Object.values(pupukMap).map(p => {
        const pctHa = p.targetHa > 0 ? (p.realizedHa / p.targetHa * 100) : (p.realizedHa > 0 ? 100 : 0);
        const pctKg = p.targetKg > 0 ? (p.realizedKg / p.targetKg * 100) : (p.realizedKg > 0 ? 100 : 0);
        const dosisBaku = p.dosisCount > 0 ? (p.dosisSum / p.dosisCount) : 1.5;
        
        // Est Pokok (Asumsi 136 pkk/ha)
        const estPokok = p.realizedHa * 136;
        const dosisReal = estPokok > 0 ? (p.realizedKg / estPokok) : dosisBaku;
        const deviasiDosisPct = dosisBaku > 0 ? ((dosisReal - dosisBaku) / dosisBaku * 100) : 0;

        let statusClass = 'grading-cell-good';
        let statusText = 'Aplikasi Sesuai';
        if (Math.abs(deviasiDosisPct) > 15) {
            statusClass = deviasiDosisPct > 15 ? 'grading-cell-warn' : 'grading-cell-danger';
            statusText = deviasiDosisPct > 15 ? 'Overdose (>15%)' : 'Underdose (<-15%)';
        } else if (pctHa >= 100) {
            statusClass = 'grading-cell-good';
            statusText = 'Tuntas 100%';
        }

        return {
            ...p,
            pctHa,
            pctKg,
            dosisBaku,
            dosisReal,
            deviasiDosisPct,
            statusClass,
            statusText
        };
    }).sort((a, b) => b.realizedKg - a.realizedKg);

    // 2. Group by Blok / Mandor
    const blockStats = filtered.map(p => {
        const bData = masterData.blok.find(x => x.name === p.block);
        const divisi = bData ? bData.divisi : '-';
        const rHa = parseFloat(p.realizedha || p.realizedHa) || 0;
        const rKg = parseFloat(p.realizedkg || p.realizedKg) || 0;
        const rW = parseInt(p.realizedworkers || p.realizedWorkers || p.targetworkers || p.targetWorkers) || 0;
        const haPerHk = rW > 0 ? (rHa / rW) : 0;
        const kgPerHk = rW > 0 ? (rKg / rW) : 0;

        let evalBadge = 'grading-cell-good';
        let evalText = 'Optimal';
        if (haPerHk < 0.3 && haPerHk > 0) {
            evalBadge = 'grading-cell-warn';
            evalText = 'Output Rendah';
        }

        return {
            block: p.block || '-',
            divisi,
            pupuk: p.plan || '-',
            realizedHa: rHa,
            realizedKg: rKg,
            hk: rW,
            haPerHk,
            kgPerHk,
            evalBadge,
            evalText
        };
    }).slice(0, 15);

    // 3. Render KPI Cards
    const overallPctHa = totTargetHa > 0 ? (totRealizedHa / totTargetHa * 100) : (totRealizedHa > 0 ? 100 : 0);
    const overallPctKg = totTargetKg > 0 ? (totRealizedKg / totTargetKg * 100) : (totRealizedKg > 0 ? 100 : 0);
    const avgPrestasiHa = totWorkers > 0 ? (totRealizedHa / totWorkers) : 0;
    const avgPrestasiKg = totWorkers > 0 ? (totRealizedKg / totWorkers) : 0;
    const sisaHa = Math.max(0, totTargetHa - totRealizedHa);
    const sisaKg = Math.max(0, totTargetKg - totRealizedKg);

    const elKpiArea = document.getElementById('panal-kpi-area');
    const elKpiAreaSub = document.getElementById('panal-kpi-area-sub');
    if (elKpiArea) elKpiArea.innerText = `${totRealizedHa.toFixed(2)} Ha`;
    if (elKpiAreaSub) elKpiAreaSub.innerText = `Target Plan: ${totTargetHa.toFixed(2)} Ha (${overallPctHa.toFixed(1)}%)`;

    const elKpiPupuk = document.getElementById('panal-kpi-pupuk');
    const elKpiPupukSub = document.getElementById('panal-kpi-pupuk-sub');
    if (elKpiPupuk) elKpiPupuk.innerText = `${totRealizedKg.toLocaleString('id-ID')} Kg`;
    if (elKpiPupukSub) elKpiPupukSub.innerText = `Rencana: ${totTargetKg.toLocaleString('id-ID')} Kg (${overallPctKg.toFixed(1)}%)`;

    const elKpiPrestasi = document.getElementById('panal-kpi-prestasi');
    const elKpiPrestasiSub = document.getElementById('panal-kpi-prestasi-sub');
    if (elKpiPrestasi) elKpiPrestasi.innerText = `${avgPrestasiHa.toFixed(2)} Ha/HK`;
    if (elKpiPrestasiSub) elKpiPrestasiSub.innerText = `Aplikasi: ${avgPrestasiKg.toFixed(1)} Kg / HK (${totWorkers} HK)`;

    const elKpiSisa = document.getElementById('panal-kpi-sisa');
    const elKpiSisaSub = document.getElementById('panal-kpi-sisa-sub');
    if (elKpiSisa) elKpiSisa.innerText = `${sisaHa.toFixed(2)} Ha`;
    if (elKpiSisaSub) elKpiSisaSub.innerText = `Sisa Pupuk: ${sisaKg.toLocaleString('id-ID')} Kg`;

    // 4. Render Table 1 (Pupuk)
    const tbPupuk = document.querySelector('#panal-pupuk-table tbody');
    const tfPupuk = document.querySelector('#panal-pupuk-table tfoot');
    if (tbPupuk) {
        let html = '';
        pupukStats.forEach((p, idx) => {
            const devBadge = Math.abs(p.deviasiDosisPct) > 15 ? 'grading-cell-warn' : 'grading-cell-good';
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align:left; font-weight:bold;">${p.jenis}</td>
                    <td style="background-color:#f0f9ff;">${p.targetHa.toFixed(2)}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${p.realizedHa.toFixed(2)}</td>
                    <td style="font-weight:bold;">${p.pctHa.toFixed(1)}%</td>
                    <td style="background-color:#f0f9ff;">${p.targetKg.toLocaleString('id-ID')}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${p.realizedKg.toLocaleString('id-ID')}</td>
                    <td style="font-weight:bold;">${p.pctKg.toFixed(1)}%</td>
                    <td>${p.dosisBaku.toFixed(2)}</td>
                    <td style="font-weight:600;">${p.dosisReal.toFixed(2)}</td>
                    <td class="${devBadge}" style="font-weight:bold;">${p.deviasiDosisPct > 0 ? '+' : ''}${p.deviasiDosisPct.toFixed(1)}%</td>
                    <td><span class="grading-badge ${p.statusClass}" style="font-size:0.72rem; padding:2px 6px;">${p.statusText}</span></td>
                </tr>
            `;
        });
        tbPupuk.innerHTML = html || '<tr><td colspan="12" style="text-align:center; padding:15px;">Tidak ada data pemupukan.</td></tr>';
    }
    if (tfPupuk) {
        tfPupuk.innerHTML = `
            <tr style="background-color:#e2e8f0; font-weight:bold;">
                <td colspan="2" style="text-align:left; padding-left:10px;">TOTAL KONSOLIDASI</td>
                <td style="background-color:#bae6fd;">${totTargetHa.toFixed(2)}</td>
                <td style="background-color:#a7f3d0;">${totRealizedHa.toFixed(2)}</td>
                <td style="background-color:#99f6e4;">${overallPctHa.toFixed(1)}%</td>
                <td style="background-color:#bae6fd;">${totTargetKg.toLocaleString('id-ID')}</td>
                <td style="background-color:#a7f3d0;">${totRealizedKg.toLocaleString('id-ID')}</td>
                <td style="background-color:#99f6e4;">${overallPctKg.toFixed(1)}%</td>
                <td colspan="4">-</td>
            </tr>
        `;
    }

    // 5. Render Table 2 (Block)
    const tbBlock = document.querySelector('#panal-block-table tbody');
    if (tbBlock) {
        let html = '';
        blockStats.forEach(b => {
            html += `
                <tr>
                    <td style="text-align:left; font-weight:600;">${b.divisi} / ${b.block}</td>
                    <td>${b.pupuk}</td>
                    <td style="font-weight:bold;">${b.realizedHa.toFixed(2)}</td>
                    <td>${b.realizedKg.toLocaleString('id-ID')}</td>
                    <td>${b.hk}</td>
                    <td style="font-weight:600;">${b.haPerHk.toFixed(2)}</td>
                    <td style="font-weight:600;">${b.kgPerHk.toFixed(1)}</td>
                    <td><span class="grading-badge ${b.evalBadge}" style="font-size:0.7rem; padding:2px 5px;">${b.evalText}</span></td>
                </tr>
            `;
        });
        tbBlock.innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding:15px;">Tidak ada data blok.</td></tr>';
    }

    // 6. Render Charts
    window.renderPemupukanCharts(pupukStats);

    // 7. Render Insights
    window.renderPemupukanInsights(pupukStats, { totTargetHa, totRealizedHa, totTargetKg, totRealizedKg, overallPctHa, overallPctKg, sisaHa, sisaKg });
};

window.renderPemupukanCharts = (pupukStats) => {
    // Chart 1: Luas Ha Target vs Realisasi
    const ctxArea = document.getElementById('chart-panal-area');
    if (ctxArea) {
        if (chartPanalAreaInstance) chartPanalAreaInstance.destroy();
        chartPanalAreaInstance = new Chart(ctxArea, {
            type: 'bar',
            data: {
                labels: pupukStats.map(p => p.jenis),
                datasets: [
                    {
                        label: 'Target Area (Ha)',
                        data: pupukStats.map(p => p.targetHa),
                        backgroundColor: '#94a3b8'
                    },
                    {
                        label: 'Realisasi Area (Ha)',
                        data: pupukStats.map(p => p.realizedHa),
                        backgroundColor: '#059669'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Luas (Ha)' }, beginAtZero: true } }
            }
        });
    }

    // Chart 2: Pemakaian Kg Pupuk Target vs Realisasi
    const ctxDose = document.getElementById('chart-panal-dose');
    if (ctxDose) {
        if (chartPanalDoseInstance) chartPanalDoseInstance.destroy();
        chartPanalDoseInstance = new Chart(ctxDose, {
            type: 'bar',
            data: {
                labels: pupukStats.map(p => p.jenis),
                datasets: [
                    {
                        label: 'Target Pupuk (Kg)',
                        data: pupukStats.map(p => p.targetKg),
                        backgroundColor: '#60a5fa'
                    },
                    {
                        label: 'Realisasi Pupuk (Kg)',
                        data: pupukStats.map(p => p.realizedKg),
                        backgroundColor: '#2563eb'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { x: { grid: { display: false } }, y: { title: { display: true, text: 'Tonase Pupuk (Kg)' }, beginAtZero: true } }
            }
        });
    }
};

window.renderPemupukanInsights = (pupukStats, metrics) => {
    const list = document.getElementById('panal-insights-list');
    if (!list) return;
    const insights = [];

    if (metrics.overallPctHa >= 90) {
        insights.push(`<strong>Capaian Luas Pemupukan Optimal:</strong> Realisasi pemupukan mencapai <strong>${metrics.totRealizedHa.toFixed(2)} Ha</strong> (${metrics.overallPctHa.toFixed(1)}% dari target program).`);
    } else {
        insights.push(`<strong>Progress Pemupukan Berjalan:</strong> Masih terdapat sisa area <strong>${metrics.sisaHa.toFixed(2)} Ha</strong> (${metrics.sisaKg.toLocaleString('id-ID')} Kg pupuk) yang harus ditabur.`);
    }

    const devPupuk = pupukStats.filter(p => Math.abs(p.deviasiDosisPct) > 15 && p.realizedHa > 0);
    if (devPupuk.length > 0) {
        const names = devPupuk.map(p => `${p.jenis} (${p.deviasiDosisPct > 0 ? '+' : ''}${p.deviasiDosisPct.toFixed(1)}%)`).join(', ');
        insights.push(`<strong>Peringatan Deviasi Dosis:</strong> Terdapat ketidaksesuaian dosis pada pupuk ${names}. <em>Rekomendasi: Lakukan kalibrasi mangkok takar pupuk pekerja dan briefing mandor sebelum penaburan.</em>`);
    }

    list.innerHTML = insights.map(i => `<li style="margin-bottom:8px;">${i}</li>`).join('');
};

window.printPemupukanAnalytics = () => window.print();

window.exportPemupukanAnalyticsCSV = () => {
    if (!window.cachedPemupukanAnalyticsData) { alert('Data belum dimuat.'); return; }
    const { selectedDate, scope } = window.cachedPemupukanAnalyticsData;
    let csv = `LAPORAN ANALISA KINERJA & DOSIS PEMUPUKAN\nPeriode: ${selectedDate} (Scope: ${scope.toUpperCase()})\n\n`;
    csv += `1. REKAPITULASI CAPAIAN PER JENIS PUPUK\nNo,Jenis Pupuk,Target (Ha),Realisasi (Ha),% Area,Target (Kg),Realisasi (Kg),% Pupuk,Dosis Baku (Kg/Pkk),Dosis Real (Kg/Pkk),Deviasi Dosis,Status Aplikasi\n`;
    
    document.querySelectorAll('#panal-pupuk-table tbody tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Pemupukan_Analytics_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// =========================================================================
// --- HARVESTING SUB-SHEET & PRODUCTIVITY ANALYTICS SYSTEM ---
// =========================================================================

window.activeHarvestingSubTab = 'monitor';
let chartHanalDivisiInstance = null;
let chartHanalOutputInstance = null;
window.cachedHarvestingAnalyticsData = null;

window.switchHarvestingSubTab = (tabId) => {
    window.activeHarvestingSubTab = tabId;
    const btnMonitor = document.getElementById('tab-btn-harvesting-monitor');
    const btnAnalytics = document.getElementById('tab-btn-harvesting-analytics');
    if (btnMonitor) btnMonitor.classList.toggle('active', tabId === 'monitor');
    if (btnAnalytics) btnAnalytics.classList.toggle('active', tabId === 'analytics');

    const contentMonitor = document.getElementById('harvesting-subsheet-monitor');
    const contentAnalytics = document.getElementById('harvesting-subsheet-analytics');
    if (contentMonitor) contentMonitor.classList.toggle('active', tabId === 'monitor');
    if (contentAnalytics) contentAnalytics.classList.toggle('active', tabId === 'analytics');

    if (tabId === 'monitor') {
        renderHarvestingTable();
    } else if (tabId === 'analytics') {
        const dateInput = document.getElementById('hanal-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = window.getLocalDate();
        }
        window.loadHarvestingAnalyticsData();
    }
};

window.loadHarvestingAnalyticsData = async () => {
    const dateInput = document.getElementById('hanal-date');
    const scopeSelect = document.getElementById('hanal-scope');
    if (dateInput && !dateInput.value) dateInput.value = window.getLocalDate();

    const selectedDate = dateInput ? dateInput.value : window.getLocalDate();
    const scope = scopeSelect ? scopeSelect.value : 'all';
    const month = selectedDate.substring(0, 7);

    let rawHarvesting = db.harvesting_daily || [];
    if (currentUser && currentUser.estate && currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        rawHarvesting = rawHarvesting.filter(h => !h.estate || h.estate === currentUser.estate);
    }

    if (scope === 'daily') {
        rawHarvesting = rawHarvesting.filter(h => h.date && h.date.startsWith(selectedDate));
    } else if (scope === 'mtd') {
        rawHarvesting = rawHarvesting.filter(h => h.date && h.date.startsWith(month));
    }

    // Populate divisi filter
    const divSet = new Set(rawHarvesting.map(h => h.divisi).filter(Boolean));
    const divFilter = document.getElementById('hanal-divisi-filter');
    if (divFilter) {
        const curr = divFilter.value;
        divFilter.innerHTML = '<option value="ALL">Semua Divisi</option>' + 
            Array.from(divSet).map(d => `<option value="${d}">${d}</option>`).join('');
        if (curr && divSet.has(curr)) divFilter.value = curr;
    }

    window.cachedHarvestingAnalyticsData = {
        selectedDate,
        scope,
        month,
        harvesting: rawHarvesting
    };

    window.processAndRenderHarvestingAnalytics();
};

window.processAndRenderHarvestingAnalytics = () => {
    if (!window.cachedHarvestingAnalyticsData) return;
    const { harvesting } = window.cachedHarvestingAnalyticsData;
    const divFilter = document.getElementById('hanal-divisi-filter');
    const selectedDiv = divFilter ? divFilter.value : 'ALL';

    let filtered = harvesting;
    if (selectedDiv && selectedDiv !== 'ALL') {
        filtered = filtered.filter(h => h.divisi === selectedDiv);
    }

    // 1. Group by Divisi
    const divMap = {};
    let totJanjang = 0, totKg = 0, totHa = 0, totHvr = 0;

    filtered.forEach(h => {
        const div = h.divisi || 'Divisi -';
        if (!divMap[div]) {
            divMap[div] = {
                divisi: div,
                janjang: 0,
                kg: 0,
                ha: 0,
                hvr: 0,
                count: 0
            };
        }
        const dObj = divMap[div];
        const jjg = parseInt(h.realized_janjang || h.est_janjang) || 0;
        const kg = parseFloat(h.realized_kg || h.est_kg) || 0;
        const hvr = parseInt(h.realized_pemanen || h.plan_pemanen) || 0;
        const ha = parseFloat(h.realized_ha || h.plan_ha) || (jjg > 0 ? jjg / 180 : 0); // approx ha if empty

        dObj.janjang += jjg;
        dObj.kg += kg;
        dObj.ha += ha;
        dObj.hvr += hvr;
        dObj.count += 1;

        totJanjang += jjg;
        totKg += kg;
        totHa += ha;
        totHvr += hvr;
    });

    const divStats = Object.values(divMap).map(d => {
        const density = d.ha > 0 ? (d.janjang / d.ha) : 0;
        const bjr = d.janjang > 0 ? (d.kg / d.janjang) : 18.0;
        const tonase = d.kg / 1000;
        const outputJjg = d.hvr > 0 ? (d.janjang / d.hvr) : 0;
        const outputTon = d.hvr > 0 ? (tonase / d.hvr) : 0;

        let statusClass = 'grading-cell-good';
        let statusText = 'Produktivitas Baik';
        if (outputJjg < 100 && outputJjg > 0) {
            statusClass = 'grading-cell-danger';
            statusText = 'Output Rendah (<100 JJG)';
        } else if (outputJjg >= 160) {
            statusClass = 'grading-cell-good';
            statusText = 'Sangat Tinggi (≥160 JJG)';
        }

        return {
            ...d,
            density,
            bjr,
            tonase,
            outputJjg,
            outputTon,
            statusClass,
            statusText
        };
    }).sort((a, b) => b.tonase - a.tonase);

    // 2. Group by Block & Pusingan
    const blockStats = filtered.map(h => {
        const estJjg = parseInt(h.est_janjang) || 0;
        const actJjg = parseInt(h.realized_janjang) || estJjg;
        const pctCap = estJjg > 0 ? (actJjg / estJjg * 100) : (actJjg > 0 ? 100 : 0);
        const hvr = parseInt(h.realized_pemanen || h.plan_pemanen) || 0;
        const jjgPerHk = hvr > 0 ? (actJjg / hvr) : 0;
        const round = parseInt(h.pusingan) || 8;

        let roundBadge = 'grading-cell-good';
        let roundText = `Normal (${round} Hari)`;
        if (round > 10) {
            roundBadge = 'grading-cell-danger';
            roundText = `Molor (${round} Hari)`;
        } else if (round < 7) {
            roundBadge = 'grading-cell-warn';
            roundText = `Ketat (${round} Hari)`;
        }

        return {
            divisi: h.divisi || '-',
            block: h.block || '-',
            round,
            mandor: h.mandor || '-',
            estJjg,
            actJjg,
            pctCap,
            jjgPerHk,
            roundBadge,
            roundText
        };
    }).slice(0, 15);

    // 3. Render KPI Cards
    const totalTonase = totKg / 1000;
    const avgDensity = totHa > 0 ? (totJanjang / totHa) : 0;
    const avgOutputJjg = totHvr > 0 ? (totJanjang / totHvr) : 0;
    const avgOutputTon = totHvr > 0 ? (totalTonase / totHvr) : 0;
    const avgBjr = totJanjang > 0 ? (totKg / totJanjang) : 0;

    const elKpiTonase = document.getElementById('hanal-kpi-tonase');
    const elKpiJanjang = document.getElementById('hanal-kpi-janjang');
    if (elKpiTonase) elKpiTonase.innerText = `${totalTonase.toFixed(2)} Ton`;
    if (elKpiJanjang) elKpiJanjang.innerText = `Total ${totJanjang.toLocaleString('id-ID')} Janjang (JJG)`;

    const elKpiArea = document.getElementById('hanal-kpi-area');
    const elKpiDensity = document.getElementById('hanal-kpi-density');
    if (elKpiArea) elKpiArea.innerText = `${totHa.toFixed(2)} Ha`;
    if (elKpiDensity) elKpiDensity.innerText = `Kerapatan: ${avgDensity.toFixed(0)} JJG / Ha`;

    const elKpiOutput = document.getElementById('hanal-kpi-output');
    const elKpiOutputTon = document.getElementById('hanal-kpi-output-ton');
    if (elKpiOutput) elKpiOutput.innerText = `${avgOutputJjg.toFixed(0)} JJG/HK`;
    if (elKpiOutputTon) elKpiOutputTon.innerText = `Output: ${avgOutputTon.toFixed(2)} Ton / HK`;

    const elKpiBjr = document.getElementById('hanal-kpi-bjr');
    const elKpiHvr = document.getElementById('hanal-kpi-pemanen-count');
    if (elKpiBjr) elKpiBjr.innerText = `${avgBjr.toFixed(2)} Kg`;
    if (elKpiHvr) elKpiHvr.innerText = `Total ${totHvr} HK Pemanen`;

    // 4. Render Table 1 (Divisi)
    const tbDiv = document.querySelector('#hanal-divisi-table tbody');
    const tfDiv = document.querySelector('#hanal-divisi-table tfoot');
    if (tbDiv) {
        let html = '';
        divStats.forEach((d, idx) => {
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align:left; font-weight:bold;">${d.divisi}</td>
                    <td style="background-color:#f0f9ff;">${d.ha.toFixed(2)}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${d.janjang.toLocaleString('id-ID')}</td>
                    <td>${d.density.toFixed(0)}</td>
                    <td>${d.bjr.toFixed(2)}</td>
                    <td style="background-color:#ecfdf5; font-weight:bold;">${d.tonase.toFixed(2)}</td>
                    <td>${d.hvr}</td>
                    <td style="background-color:#eff6ff; font-weight:600;">${d.outputJjg.toFixed(0)}</td>
                    <td style="background-color:#fffbeb; font-weight:600;">${d.outputTon.toFixed(2)}</td>
                    <td><span class="grading-badge ${d.statusClass}" style="font-size:0.72rem; padding:2px 6px;">${d.statusText}</span></td>
                </tr>
            `;
        });
        tbDiv.innerHTML = html || '<tr><td colspan="11" style="text-align:center; padding:15px;">Tidak ada data panen.</td></tr>';
    }
    if (tfDiv) {
        tfDiv.innerHTML = `
            <tr style="background-color:#e2e8f0; font-weight:bold;">
                <td colspan="2" style="text-align:left; padding-left:10px;">TOTAL KONSOLIDASI</td>
                <td style="background-color:#bae6fd;">${totHa.toFixed(2)}</td>
                <td style="background-color:#a7f3d0;">${totJanjang.toLocaleString('id-ID')}</td>
                <td>${avgDensity.toFixed(0)}</td>
                <td>${avgBjr.toFixed(2)}</td>
                <td style="background-color:#a7f3d0;">${totalTonase.toFixed(2)}</td>
                <td>${totHvr}</td>
                <td style="background-color:#bfdbfe;">${avgOutputJjg.toFixed(0)}</td>
                <td style="background-color:#fde68a;">${avgOutputTon.toFixed(2)}</td>
                <td>-</td>
            </tr>
        `;
    }

    // 5. Render Table 2 (Block)
    const tbBlock = document.querySelector('#hanal-block-table tbody');
    if (tbBlock) {
        let html = '';
        blockStats.forEach(b => {
            html += `
                <tr>
                    <td style="text-align:left; font-weight:600;">${b.divisi} / ${b.block}</td>
                    <td><span class="grading-badge ${b.roundBadge}" style="font-size:0.7rem; padding:2px 5px;">${b.roundText}</span></td>
                    <td style="text-align:left;"><small>${b.mandor}</small></td>
                    <td>${b.estJjg.toLocaleString('id-ID')}</td>
                    <td style="font-weight:bold;">${b.actJjg.toLocaleString('id-ID')}</td>
                    <td style="font-weight:bold;">${b.pctCap.toFixed(1)}%</td>
                    <td style="font-weight:600;">${b.jjgPerHk.toFixed(0)}</td>
                    <td><span class="grading-badge ${b.roundBadge}" style="font-size:0.7rem; padding:2px 5px;">${b.round > 10 ? 'Risiko Buah Restan' : 'Terkendali'}</span></td>
                </tr>
            `;
        });
        tbBlock.innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding:15px;">Tidak ada data blok.</td></tr>';
    }

    // 6. Render Charts
    window.renderHarvestingCharts(divStats);

    // 7. Render Insights
    window.renderHarvestingInsights(divStats, blockStats, { totalTonase, totJanjang, avgDensity, avgOutputJjg, avgBjr, totHvr });
};

window.renderHarvestingCharts = (divStats) => {
    // Chart 1: Tonase per Divisi
    const ctxDiv = document.getElementById('chart-hanal-divisi');
    if (ctxDiv) {
        if (chartHanalDivisiInstance) chartHanalDivisiInstance.destroy();
        chartHanalDivisiInstance = new Chart(ctxDiv, {
            type: 'bar',
            data: {
                labels: divStats.map(d => d.divisi),
                datasets: [
                    {
                        label: 'Tonase Panen (Ton)',
                        data: divStats.map(d => d.tonase),
                        backgroundColor: '#059669',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Jumlah Janjang (JJG)',
                        data: divStats.map(d => d.janjang),
                        backgroundColor: '#0284c7',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Tonase (Ton)' }, beginAtZero: true },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Janjang' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // Chart 2: Output Pemanen vs Kerapatan
    const ctxOut = document.getElementById('chart-hanal-output');
    if (ctxOut) {
        if (chartHanalOutputInstance) chartHanalOutputInstance.destroy();
        chartHanalOutputInstance = new Chart(ctxOut, {
            type: 'bar',
            data: {
                labels: divStats.map(d => d.divisi),
                datasets: [
                    {
                        type: 'bar',
                        label: 'Output Pemanen (JJG/HK)',
                        data: divStats.map(d => d.outputJjg),
                        backgroundColor: '#f59e0b',
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Kerapatan Buah (JJG/Ha)',
                        data: divStats.map(d => d.density),
                        borderColor: '#2563eb',
                        backgroundColor: '#2563eb',
                        borderWidth: 2.5,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'JJG / HK' }, beginAtZero: true },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'JJG / Ha' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                }
            }
        });
    }
};

window.renderHarvestingInsights = (divStats, blockStats, metrics) => {
    const list = document.getElementById('hanal-insights-list');
    if (!list) return;
    const insights = [];

    insights.push(`<strong>Produksi Panen Terkonsolidasi:</strong> Total panen mencapai <strong>${metrics.totalTonase.toFixed(2)} Ton</strong> (${metrics.totJanjang.toLocaleString('id-ID')} JJG) dengan rata-rata BJR <strong>${metrics.avgBjr.toFixed(2)} Kg/JJG</strong>.`);

    if (metrics.avgOutputJjg >= 130) {
        insights.push(`<strong>Produktivitas Pemanen Sangat Baik:</strong> Rata-rata output pemanen mencapai <strong>${metrics.avgOutputJjg.toFixed(0)} JJG / HK</strong> (di atas standar norma).`);
    } else {
        insights.push(`<strong>Peluang Peningkatan Output Panen:</strong> Rata-rata pemanen mencatat <strong>${metrics.avgOutputJjg.toFixed(0)} JJG / HK</strong>. <em>Rekomendasi: Perhatikan kerapatan ancak panen dan distribusi alat panen (egrek/dodos).</em>`);
    }

    const lateRounds = blockStats.filter(b => b.round > 10);
    if (lateRounds.length > 0) {
        const names = lateRounds.map(b => `${b.divisi}/${b.block} (${b.round} hari)`).join(', ');
        insights.push(`<strong>Peringatan Pusingan Panen Molor (>10 Hari):</strong> Blok ${names} melewati batas rotasi ideal. <em>Rekomendasi: Tambah tenaga pemanen bantuan agar tidak terjadi buah busuk atau kenaikan asam lemak bebas (FFA).</em>`);
    }

    list.innerHTML = insights.map(i => `<li style="margin-bottom:8px;">${i}</li>`).join('');
};

window.printHarvestingAnalytics = () => window.print();

window.exportHarvestingAnalyticsCSV = () => {
    if (!window.cachedHarvestingAnalyticsData) { alert('Data belum dimuat.'); return; }
    const { selectedDate, scope } = window.cachedHarvestingAnalyticsData;
    let csv = `LAPORAN ANALISA KINERJA PANEN & PRODUKTIVITAS\nPeriode: ${selectedDate} (Scope: ${scope.toUpperCase()})\n\n`;
    csv += `1. REKAPITULASI KINERJA PANEN PER DIVISI\nNo,Divisi,Luas Panen (Ha),Total JJG,Kerapatan (JJG/Ha),BJR Aktual (Kg),Est. Tonase (Ton),HK Pemanen,Output JJG/HK,Output Ton/HK,Status Kinerja\n`;
    
    document.querySelectorAll('#hanal-divisi-table tbody tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
        if (cols.length > 0) csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Harvesting_Analytics_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// =========================================================================
// --- UNIVERSAL HIGH-RESOLUTION PRINT ENGINE & FULL REPORT GENERATOR ---
// =========================================================================

window.generateReportPrintHtml = ({
    reportTitle,
    moduleName,
    unitName,
    dateStr,
    scopeStr,
    kpis = [],
    sections = [],
    chartCanvasIds = [],
    insightsListId = null
}) => {
    const printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    const userName = (currentUser && currentUser.name) ? `${currentUser.name} (${currentUser.role || 'Staff'})` : 'Administrator';

    // 1. Convert Canvas Charts to Images
    const chartImages = [];
    chartCanvasIds.forEach(item => {
        const canvas = document.getElementById(item.id);
        if (canvas) {
            try {
                const imgData = canvas.toDataURL('image/png');
                chartImages.push({ title: item.title, sub: item.sub || '', imgSrc: imgData });
            } catch(e) {
                console.warn('Canvas export warning:', e);
            }
        }
    });

    // 2. Extract Insights
    let insightsHtml = '';
    if (insightsListId) {
        const listEl = document.getElementById(insightsListId);
        if (listEl && listEl.innerHTML.trim()) {
            insightsHtml = `
                <div class="print-insight-box">
                    <h4><span style="font-size: 14pt;">💡</span> Rekomendasi & Analisa Operasional (Smart Diagnostic Insights)</h4>
                    <ul>${listEl.innerHTML}</ul>
                </div>
            `;
        }
    }

    // 3. Build KPI HTML
    let kpiHtml = '';
    if (kpis.length > 0) {
        kpiHtml = `
            <div class="print-kpi-grid">
                ${kpis.map(k => `
                    <div class="print-kpi-card">
                        <div class="print-kpi-title">${k.title}</div>
                        <div class="print-kpi-val" style="color: ${k.color || '#0f172a'};">${k.val}</div>
                        <div class="print-kpi-sub">${k.sub || ''}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 4. Build Sections & Tables HTML
    let sectionsHtml = '';
    sections.forEach(sec => {
        let tableContent = '';
        if (sec.tableId) {
            const tbl = document.getElementById(sec.tableId);
            if (tbl) {
                tableContent = `<table class="print-table">${tbl.innerHTML}</table>`;
            }
        } else if (sec.customHtml) {
            tableContent = sec.customHtml;
        }

        sectionsHtml += `
            <div class="print-section">
                <div class="print-section-header">
                    <h3>${sec.title}</h3>
                    ${sec.sub ? `<span>${sec.sub}</span>` : ''}
                </div>
                ${tableContent}
            </div>
        `;
    });

    // 5. Build Charts Grid HTML
    let chartsHtml = '';
    if (chartImages.length > 0) {
        chartsHtml = `
            <div class="print-charts-grid">
                ${chartImages.map(c => `
                    <div class="print-chart-box">
                        <h4>${c.title}</h4>
                        ${c.sub ? `<span>${c.sub}</span>` : ''}
                        <div class="print-chart-img-wrap">
                            <img src="${c.imgSrc}" alt="${c.title}">
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 6. Signatures Block
    const signatureHtml = `
        <div class="print-signatures">
            <div class="sig-box">
                <div class="sig-role">Dibuat Oleh:</div>
                <div class="sig-space"></div>
                <div class="sig-name">( ${userName} )</div>
                <div class="sig-title">Krani / Mandor Operasional</div>
            </div>
            <div class="sig-box">
                <div class="sig-role">Diperiksa Oleh:</div>
                <div class="sig-space"></div>
                <div class="sig-name">( ........................................ )</div>
                <div class="sig-title">Asisten / Asisten Kepala (Askep)</div>
            </div>
            <div class="sig-box">
                <div class="sig-role">Disetujui Oleh:</div>
                <div class="sig-space"></div>
                <div class="sig-name">( ........................................ )</div>
                <div class="sig-title">Estate Manager / Mill Manager</div>
            </div>
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>${reportTitle} - ${unitName}</title>
    <style>
        @page {
            size: landscape;
            margin: 8mm 10mm 10mm 10mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 8.5pt;
            line-height: 1.35;
        }
        .print-header-banner {
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .print-brand {
            font-size: 13pt;
            font-weight: 800;
            color: #0d8b4e;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .print-report-title {
            font-size: 13pt;
            font-weight: 800;
            color: #0f172a;
            margin: 3px 0 2px 0;
            text-transform: uppercase;
        }
        .print-meta-info {
            font-size: 8pt;
            color: #475569;
        }
        .print-meta-right {
            text-align: right;
            font-size: 7.5pt;
            color: #64748b;
            line-height: 1.4;
        }
        
        /* KPI Cards */
        .print-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
        }
        .print-kpi-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
        }
        .print-kpi-title {
            font-size: 7.5pt;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
        }
        .print-kpi-val {
            font-size: 12pt;
            font-weight: 800;
            margin: 2px 0;
        }
        .print-kpi-sub {
            font-size: 7pt;
            color: #64748b;
        }

        /* Sections & Tables */
        .print-section {
            margin-bottom: 14px;
            page-break-inside: auto;
        }
        .print-section-header {
            margin-bottom: 6px;
        }
        .print-section-header h3 {
            margin: 0;
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
        }
        .print-section-header span {
            font-size: 7.5pt;
            color: #64748b;
        }
        .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
            margin-bottom: 4px;
        }
        .print-table th, .print-table td {
            border: 1px solid #94a3b8;
            padding: 4px 6px;
            text-align: center;
        }
        .print-table thead tr {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-weight: 700;
        }
        .print-table thead tr th {
            color: #ffffff !important;
            background-color: #1e293b !important;
        }
        .print-table tfoot tr {
            background-color: #e2e8f0 !important;
            font-weight: 700;
        }
        .print-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Grading Badges */
        .grading-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 6.8pt;
            font-weight: 700;
        }
        .grading-cell-good, .grading-badge.good { background-color: #dcfce7 !important; color: #15803d !important; }
        .grading-cell-warn, .grading-badge.warn { background-color: #fef9c3 !important; color: #a16207 !important; }
        .grading-cell-danger, .grading-badge.danger { background-color: #fee2e2 !important; color: #b91c1c !important; }
        .grading-cell-neutral, .grading-badge.neutral { background-color: #f1f5f9 !important; color: #475569 !important; }

        /* Charts */
        .print-charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 14px;
            page-break-inside: avoid;
        }
        .print-chart-box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px;
            background: #ffffff;
            page-break-inside: avoid;
        }
        .print-chart-box h4 {
            margin: 0 0 2px 0;
            font-size: 8.5pt;
            font-weight: 700;
            color: #0f172a;
        }
        .print-chart-box span {
            font-size: 7pt;
            color: #64748b;
            display: block;
            margin-bottom: 6px;
        }
        .print-chart-img-wrap {
            text-align: center;
            height: 200px;
        }
        .print-chart-img-wrap img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
        }

        /* Insights Box */
        .print-insight-box {
            border: 1.5px solid #16a34a;
            border-radius: 6px;
            padding: 10px 14px;
            background-color: #f0fdf4 !important;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        .print-insight-box h4 {
            margin: 0 0 6px 0;
            font-size: 9pt;
            font-weight: 700;
            color: #166534;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .print-insight-box ul {
            margin: 0;
            padding-left: 18px;
        }
        .print-insight-box li {
            font-size: 7.8pt;
            color: #1f2937;
            margin-bottom: 4px;
            line-height: 1.35;
        }

        /* Signatures */
        .print-signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 15px;
            padding-top: 10px;
            page-break-inside: avoid;
        }
        .sig-box {
            text-align: center;
            font-size: 8pt;
        }
        .sig-role {
            font-weight: 600;
            margin-bottom: 45px;
        }
        .sig-space {
            height: 1px;
        }
        .sig-name {
            font-weight: 700;
            color: #0f172a;
        }
        .sig-title {
            font-size: 7pt;
            color: #64748b;
        }
    </style>
</head>
<body onload="setTimeout(function(){ window.print(); }, 400);">
    <div class="print-header-banner">
        <div>
            <div class="print-brand">🌿 AgriMonitor - Plantation & Mill Enterprise Portal</div>
            <div class="print-report-title">${reportTitle}</div>
            <div class="print-meta-info">
                <strong>Unit:</strong> ${unitName} &nbsp;|&nbsp; 
                <strong>Periode:</strong> ${dateStr} &nbsp;|&nbsp; 
                <strong>Scope:</strong> ${scopeStr}
            </div>
        </div>
        <div class="print-meta-right">
            <div><strong>Waktu Cetak:</strong> ${printTime}</div>
            <div><strong>Dicetak Oleh:</strong> ${userName}</div>
            <div><strong>Modul:</strong> ${moduleName}</div>
        </div>
    </div>

    ${kpiHtml}
    ${sectionsHtml}
    ${chartsHtml}
    ${insightsHtml}
    ${signatureHtml}
</body>
</html>
    `;
};

// 1. PRINT: TONASE MONITORING (Summary Penerimaan TBS)
window.printTonaseSummary = () => {
    if (!window.cachedTonaseSummaryData) {
        alert('Data summary tonase belum dimuat.');
        return;
    }
    const { mill, selectedDate, scope } = window.cachedTonaseSummaryData;

    const kpis = [
        {
            title: 'Total Realisasi TBS',
            val: document.getElementById('tsum-kpi-total-tbs')?.innerText || '0.00 Ton',
            sub: document.getElementById('tsum-kpi-total-plan')?.innerText || '',
            color: '#059669'
        },
        {
            title: 'Efisiensi Armada (Payload)',
            val: document.getElementById('tsum-kpi-payload')?.innerText || '0.00 Ton/Trip',
            sub: document.getElementById('tsum-kpi-trips')?.innerText || '',
            color: '#0284c7'
        },
        {
            title: 'Distribusi Waktu Kedatangan',
            val: document.getElementById('tsum-kpi-timedist')?.innerText || '0% / 0% / 0%',
            sub: document.getElementById('tsum-kpi-timedist-sub')?.innerText || '',
            color: '#d97706'
        },
        {
            title: 'Kinerja Evakuasi EFB (Jangkos)',
            val: document.getElementById('tsum-kpi-efb')?.innerText || '0.00 Ton',
            sub: document.getElementById('tsum-kpi-efb-sub')?.innerText || '',
            color: '#16a34a'
        }
    ];

    const sections = [
        {
            title: '1. Rekapitulasi Penerimaan TBS & Distribusi Waktu Kedatangan per Estate',
            sub: 'Rincian target plan, realisasi penerimaan, efisiensi muatan truk, loose fruit, dan sebaran waktu kirim (Prime: 06-12, Middle: 13-18, Last: 19-24).',
            tableId: 'tsum-estate-table'
        },
        {
            title: '2. Monitoring Ritme Kedatangan TBS per Interval 2 Jam',
            sub: 'Analisis kepadatan arus masuk loading ramp & timbangan per blok 2 jam.',
            tableId: 'tsum-interval-table'
        },
        {
            title: '3. Neraca & Monitoring Evakuasi EFB (Jangkos)',
            sub: 'Realisasi pengangkutan jangkos vs estimasi produksi pabrik per estate.',
            tableId: 'tsum-efb-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-tsum-timedist', title: 'Grafik Distribusi Waktu Kirim TBS per Estate', sub: 'Proporsi kedatangan Prime (06-12), Middle (13-18), dan Last Time (19-24).' },
        { id: 'chart-tsum-interval', title: 'Grafik Arus Kedatangan TBS Interval 2 Jam', sub: 'Pola tonase masuk per 2 jam vs kurva kumulatif penerimaan harian.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN SUMMARY PENERIMAAN TBS & ANALISA OPERASIONAL',
        moduleName: 'Tonase / Jam Monitoring',
        unitName: mill,
        dateStr: selectedDate,
        scopeStr: scope.toUpperCase(),
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: 'tsum-insights-list'
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// 2. PRINT: VEHICLE MOTION (Analisa & Efisiensi Armada)
window.printVehicleAnalytics = () => {
    if (!window.cachedVehicleAnalyticsData) {
        alert('Data analisa kendaraan belum dimuat.');
        return;
    }
    const { selectedDate, scope } = window.cachedVehicleAnalyticsData;
    const unitName = (currentUser && currentUser.estate) ? currentUser.estate : 'Semua Estate';

    const kpis = [
        {
            title: 'Total Ritase & Armada',
            val: document.getElementById('vanal-kpi-trips')?.innerText || '0 Trip',
            sub: document.getElementById('vanal-kpi-trucks')?.innerText || '',
            color: '#0284c7'
        },
        {
            title: 'Total Janjang Terangkut',
            val: document.getElementById('vanal-kpi-janjang')?.innerText || '0 JJG',
            sub: document.getElementById('vanal-kpi-avg-jjg')?.innerText || '',
            color: '#059669'
        },
        {
            title: 'Rata-rata Lead Time ke PKS',
            val: document.getElementById('vanal-kpi-duration')?.innerText || '0 Menit',
            sub: document.getElementById('vanal-kpi-fastest-slowest')?.innerText || '',
            color: '#d97706'
        },
        {
            title: 'Estimasi Tonase Angkut',
            val: document.getElementById('vanal-kpi-tonase')?.innerText || '0.00 Ton',
            sub: document.getElementById('vanal-kpi-turnaround')?.innerText || '',
            color: '#16a34a'
        }
    ];

    const sections = [
        {
            title: '1. Rekapitulasi Kinerja & Efisiensi Armada (Fleet Performance)',
            sub: 'Analisis produktivitas janjang, ritase, dan durasi pengiriman per kendaraan.',
            tableId: 'vanal-truck-table'
        },
        {
            title: '2. Analisis Lead Time per Divisi & Blok',
            sub: 'Evaluasi kelancaran jalur logistik pengangkutan TBS dari blok ke pabrik.',
            tableId: 'vanal-block-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-vanal-productivity', title: 'Produktivitas Janjang per Kendaraan', sub: 'Perbandingan total janjang yang berhasil diangkut oleh masing-masing truk.' },
        { id: 'chart-vanal-timeline', title: 'Sebaran Waktu Tiba di PKS & Durasi Perjalanan', sub: 'Pola jam kedatangan armada di pos security / timbangan PKS.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN ANALISA KINERJA & EFISIENSI ARMADA TRUK (VEHICLE MOTION)',
        moduleName: 'Vehicle Motion Monitoring',
        unitName,
        dateStr: selectedDate,
        scopeStr: scope.toUpperCase(),
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: 'vanal-insights-list'
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// 3. PRINT: UPKEEP (Analisa Produktivitas & Kinerja Upkeep)
window.printUpkeepAnalytics = () => {
    if (!window.cachedUpkeepAnalyticsData) {
        alert('Data analisa upkeep belum dimuat.');
        return;
    }
    const { selectedDate, scope } = window.cachedUpkeepAnalyticsData;
    const unitName = (currentUser && currentUser.estate) ? currentUser.estate : 'Semua Estate';

    const kpis = [
        {
            title: 'Total Luas Rawat (Ha)',
            val: document.getElementById('uanal-kpi-area')?.innerText || '0.00 Ha',
            sub: document.getElementById('uanal-kpi-area-sub')?.innerText || '',
            color: '#059669'
        },
        {
            title: 'Tenaga Kerja Terpakai',
            val: document.getElementById('uanal-kpi-hk')?.innerText || '0 HK',
            sub: document.getElementById('uanal-kpi-hk-sub')?.innerText || '',
            color: '#0284c7'
        },
        {
            title: 'Rata-rata Prestasi Upkeep',
            val: document.getElementById('uanal-kpi-prestasi')?.innerText || '0.00 Ha/HK',
            sub: document.getElementById('uanal-kpi-prestasi-sub')?.innerText || '',
            color: '#d97706'
        },
        {
            title: 'Pekerjaan Paling Dominan',
            val: document.getElementById('uanal-kpi-dominant')?.innerText || '-',
            sub: document.getElementById('uanal-kpi-dominant-sub')?.innerText || '',
            color: '#16a34a'
        }
    ];

    const sections = [
        {
            title: '1. Rekapitulasi Capaian & Prestasi per Jenis Pekerjaan Rawat Kebun',
            sub: 'Komparasi target vs realisasi luas, penggunaan tenaga kerja HK, dan efisiensi prestasi kerja.',
            tableId: 'uanal-type-table'
        },
        {
            title: '2. Evaluasi Produktivitas Mandor & Blok',
            sub: 'Rincian prestasi pemenuhan target mandor di masing-masing blok divisi.',
            tableId: 'uanal-block-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-uanal-type', title: 'Capaian Luas Rawat (Ha) per Aktivitas', sub: 'Perbandingan target vs realisasi luas area yang telah diselesaikan.' },
        { id: 'chart-uanal-prestasi', title: 'Produktivitas Kerja Realisasi vs Standar Norma (Ha/HK)', sub: 'Analisis efisiensi output per orang pekerja.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN ANALISA PRODUKTIVITAS & KINERJA RAWAT KEBUN (UPKEEP)',
        moduleName: 'Upkeep Monitoring',
        unitName,
        dateStr: selectedDate,
        scopeStr: scope.toUpperCase(),
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: 'uanal-insights-list'
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// 4. PRINT: PEMUPUKAN (Analisa Kinerja & Dosis Pemupukan)
window.printPemupukanAnalytics = () => {
    if (!window.cachedPemupukanAnalyticsData) {
        alert('Data analisa pemupukan belum dimuat.');
        return;
    }
    const { selectedDate, scope } = window.cachedPemupukanAnalyticsData;
    const unitName = (currentUser && currentUser.estate) ? currentUser.estate : 'Semua Estate';

    const kpis = [
        {
            title: 'Total Area Terpukul (Ha)',
            val: document.getElementById('panal-kpi-area')?.innerText || '0.00 Ha',
            sub: document.getElementById('panal-kpi-area-sub')?.innerText || '',
            color: '#059669'
        },
        {
            title: 'Pupuk Diaplikasikan (Kg)',
            val: document.getElementById('panal-kpi-pupuk')?.innerText || '0 Kg',
            sub: document.getElementById('panal-kpi-pupuk-sub')?.innerText || '',
            color: '#0284c7'
        },
        {
            title: 'Rata-rata Prestasi Kerja',
            val: document.getElementById('panal-kpi-prestasi')?.innerText || '0.00 Ha/HK',
            sub: document.getElementById('panal-kpi-prestasi-sub')?.innerText || '',
            color: '#d97706'
        },
        {
            title: 'Sisa Defisit Belum Selesai',
            val: document.getElementById('panal-kpi-sisa')?.innerText || '0.00 Ha',
            sub: document.getElementById('panal-kpi-sisa-sub')?.innerText || '',
            color: '#ef4444'
        }
    ];

    const sections = [
        {
            title: '1. Rekapitulasi Capaian & Akurasi Dosis Pemupukan per Jenis Pupuk',
            sub: 'Evaluasi pemenuhan target luas area, pemakaian kilogram pupuk, dan deviasi dosis rekomendasi.',
            tableId: 'panal-pupuk-table'
        },
        {
            title: '2. Evaluasi Produktivitas Tenaga Kerja per Blok',
            sub: 'Analisis output harian tenaga kerja pemupukan dan efisiensi mandor di lapangan.',
            tableId: 'panal-block-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-panal-area', title: 'Luas Area Target vs Realisasi (Ha)', sub: 'Capaian hektar per jenis pupuk yang telah diaplikasikan di lapangan.' },
        { id: 'chart-panal-dose', title: 'Pemakaian Pupuk Target vs Realisasi (Kg)', sub: 'Akurasi penyerapan kilogram pupuk sesuai rekomendasi dosis agronomi.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN ANALISA KINERJA & AKURASI DOSIS PEMUPUKAN',
        moduleName: 'Pemupukan Monitoring',
        unitName,
        dateStr: selectedDate,
        scopeStr: scope.toUpperCase(),
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: 'panal-insights-list'
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// 5. PRINT: HARVESTING (Analisa Kinerja Panen & Produktivitas)
window.printHarvestingAnalytics = () => {
    if (!window.cachedHarvestingAnalyticsData) {
        alert('Data analisa panen belum dimuat.');
        return;
    }
    const { selectedDate, scope } = window.cachedHarvestingAnalyticsData;
    const unitName = (currentUser && currentUser.estate) ? currentUser.estate : 'Semua Estate';

    const kpis = [
        {
            title: 'Total Produksi Tonase',
            val: document.getElementById('hanal-kpi-tonase')?.innerText || '0.00 Ton',
            sub: document.getElementById('hanal-kpi-janjang')?.innerText || '',
            color: '#059669'
        },
        {
            title: 'Total Luas Panen',
            val: document.getElementById('hanal-kpi-area')?.innerText || '0.00 Ha',
            sub: document.getElementById('hanal-kpi-density')?.innerText || '',
            color: '#0284c7'
        },
        {
            title: 'Produktivitas Pemanen',
            val: document.getElementById('hanal-kpi-output')?.innerText || '0 JJG/HK',
            sub: document.getElementById('hanal-kpi-output-ton')?.innerText || '',
            color: '#d97706'
        },
        {
            title: 'Rata-rata Berat Janjang (BJR)',
            val: document.getElementById('hanal-kpi-bjr')?.innerText || '0.00 Kg',
            sub: document.getElementById('hanal-kpi-pemanen-count')?.innerText || '',
            color: '#16a34a'
        }
    ];

    const sections = [
        {
            title: '1. Rekapitulasi Kinerja & Output Panen per Divisi',
            sub: 'Konsolidasi produksi janjang, tonase panen, kerapatan pohon, dan output prestasi pemanen per divisi.',
            tableId: 'hanal-divisi-table'
        },
        {
            title: '2. Analisis Produktivitas & Pusingan Panen per Blok',
            sub: 'Evaluasi kedisiplinan interval pusingan rotasi panen (standar 7-10 hari) dan pemenuhan taksasi.',
            tableId: 'hanal-block-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-hanal-divisi', title: 'Produksi Tonase & Janjang per Divisi', sub: 'Sebaran hasil panen TBS yang diperoleh dari tiap-tiap divisi kebun.' },
        { id: 'chart-hanal-output', title: 'Produktivitas Pemanen (JJG/HK) vs Kerapatan Buah (JJG/Ha)', sub: 'Hubungan ketersediaan buah matang dengan kecepatan hasil potong tenaga panen.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN ANALISA KINERJA PANEN & PRODUKTIVITAS (HARVESTING)',
        moduleName: 'Harvesting Monitoring',
        unitName,
        dateStr: selectedDate,
        scopeStr: scope.toUpperCase(),
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: 'hanal-insights-list'
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// 6. PRINT: FFB QUALITY (Rekapitulasi Monthly Grading)
window.printMonthlyGradingReport = () => {
    const unitName = (currentUser && currentUser.estate) ? currentUser.estate : 'Bunga Tanjung Mill';
    const yearSelect = document.getElementById('dash-fqc-year');
    const selectedYear = yearSelect ? yearSelect.value : new Date().getFullYear();

    const kpis = [
        {
            title: 'Total Sampel Grading',
            val: document.getElementById('dash-fqc-tot-sample')?.innerText || '0 Janjang',
            sub: 'Total Janjang Diperiksa',
            color: '#0284c7'
        },
        {
            title: 'Total Tonase Masuk',
            val: `${document.getElementById('dash-fqc-tot-tonase')?.innerText || '0.00'} Ton`,
            sub: 'Total Suplai Buah',
            color: '#059669'
        },
        {
            title: 'Rata-rata Buah Masak',
            val: `${document.getElementById('dash-fqc-tot-ripe')?.innerText || '0.00'}%`,
            sub: 'Standar Min: 85.00%',
            color: '#16a34a'
        },
        {
            title: 'Rata-rata Buah Mentah',
            val: `${document.getElementById('dash-fqc-tot-unripe')?.innerText || '0.00'}%`,
            sub: 'Maks Toleransi: 5.00%',
            color: '#ef4444'
        }
    ];

    const sections = [
        {
            title: `Rekapitulasi Mutu Kualitas Panen TBS per Estate (Tahun ${selectedYear})`,
            sub: 'Persentase mutu janjang panen tertimbang berdasarkan tonase penerimaan masing-masing estate.',
            tableId: 'dash-fqc-monthly-table'
        }
    ];

    const chartCanvasIds = [
        { id: 'chart-dash-fqc-trend', title: 'Trend Bulanan Kualitas Buah Masak vs Buah Mentah', sub: 'Perkembangan rasio kematangan buah sepanjang tahun.' }
    ];

    const html = window.generateReportPrintHtml({
        reportTitle: 'LAPORAN REKAPITULASI MUTU KUALITAS TBS (MONTHLY FFB GRADING)',
        moduleName: 'FFB Quality Monitoring',
        unitName,
        dateStr: `Tahun ${selectedYear}`,
        scopeStr: 'TAHUNAN (1 TAHUN PENUH)',
        kpis,
        sections,
        chartCanvasIds,
        insightsListId: null
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    }
};

// ==========================================================================
// --- UNIFIED MILL MODULES (Processing, Water Analysis, FFB Quality) ---
// ==========================================================================
// --- MILL MODULES (Processing, Water, FFB Quality, Dashboard) ---
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
// API_URL used from global or window
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
if (!window.views) window.views = {};
window.views = window.views || (typeof views !== 'undefined' ? views : {});


// 1. PROCESSING VIEW
views.processing = `
<div class="content-header">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <input type="date" id="p-date" class="form-control" style="width: auto;" onchange="loadProcessingData()">
        <button class="btn btn-primary" onclick="loadProcessingData()"><i class="fa-solid fa-rotate"></i> Load</button>
        <button class="btn btn-success btn-tonase-action" onclick="openLiquidModal()"><i class="fa-solid fa-plus"></i> Input Parameter Liquid</button>
        <button class="btn btn-success btn-tonase-action" onclick="openFfaModal()"><i class="fa-solid fa-plus"></i> Input Parameter FFA</button>
        <button class="btn btn-info" onclick="openProcessingHistorical()"><i class="fa-solid fa-clock-rotate-left"></i> Historical Per Jam</button>
    </div>
</div>
<div class="dashboard-grid" style="grid-template-columns: 1fr;">
    <div class="glass-card" style="overflow-x: auto;">
        <h3>1a. Liquid Monitoring (Summary Hari Ini)</h3>
        <div class="table-responsive" style="width: 100%;">
            <table class="data-table" id="summary-liquid-table" style="min-width: 1200px;">
                <thead>
                    <tr>
                        <th rowspan="2">Jam</th>
                        <th colspan="5">COT (Oil 36-38 %)</th>
                        <th colspan="6">CST</th>
                        <th colspan="5">Sludge Tank</th>
                    </tr>
                    <tr>
                        <th>OIL<br>(standart 36-38%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                        <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th><th>Ketebalan Minyak<br>(mm)</th>
                        <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                    </tr>
                </thead>
                <tbody id="summary-liquid-tbody">
                    <!-- Generated via JS -->
                </tbody>
            </table>
        </div>
    </div>

    
    <div class="glass-card" style="overflow-x: auto;">
        <h3>1c. FFA Produksi (Summary Hari Ini)</h3>
        <div class="table-responsive">
            <table class="data-table" id="summary-ffa-table">
                <thead>
                    <tr>
                        <th rowspan="2">Keterangan</th>
                        <th colspan="3">Sebelum Washing Plant</th>
                        <th colspan="3">Setelah Washing Plant</th>
                    </tr>
                    <tr>
                        <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                        <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                    </tr>
                </thead>
                <tbody id="summary-ffa-tbody">
                    <!-- Generated via JS -->
                </tbody>
            </table>
        </div>
    </div>
    

</div>

<!-- Modal Input Liquid -->
<div class="modal-overlay" id="modal-input-liquid" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 900px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Parameter Liquid</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-input-liquid').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <input type="date" id="ml-date" class="form-control" style="width: 150px;" onchange="loadLiquidHour()">
                <select id="ml-hour" class="form-control" style="width: 120px;" onchange="loadLiquidHour()">
                    <option value="07:00">07:00</option><option value="08:00">08:00</option>
                    <option value="09:00">09:00</option><option value="10:00">10:00</option>
                    <option value="11:00">11:00</option><option value="12:00">12:00</option>
                    <option value="13:00">13:00</option><option value="14:00">14:00</option>
                    <option value="15:00">15:00</option><option value="16:00">16:00</option>
                    <option value="17:00">17:00</option><option value="18:00">18:00</option>
                    <option value="19:00">19:00</option><option value="20:00">20:00</option>
                    <option value="21:00">21:00</option><option value="22:00">22:00</option>
                    <option value="23:00">23:00</option><option value="24:00">24:00</option>
                    <option value="01:00">01:00</option><option value="02:00">02:00</option>
                    <option value="03:00">03:00</option><option value="04:00">04:00</option>
                    <option value="05:00">05:00</option><option value="06:00">06:00</option>
                </select>
            </div>
            <!-- inputs table for Liquid -->
            <div class="table-responsive">
                <table class="data-table" style="width: 100%; min-width: 600px;">
                    <thead>
                        <tr>
                            <th>PARAMETER</th>
                            <th>COT</th>
                            <th>CST</th>
                            <th>SLUDGE TANK</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>OIL (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_oil" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_oil" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_oil" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>SLUDGE (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_sludge" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_sludge" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_sludge" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>WATER (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_water" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_water" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_water" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>SOLID (%)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_solid" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_solid" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_solid" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>TEMP (°C)</strong></td>
                            <td><input type="number" step="any" id="ml_cot_temp" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_cst_temp" class="form-control"></td>
                            <td><input type="number" step="any" id="ml_sludge_temp" class="form-control"></td>
                        </tr>
                        <tr>
                            <td><strong>KETEBALAN MINYAK</strong></td>
                            <td style="background: #f3f4f6;"></td>
                            <td><input type="number" step="any" id="ml_cst_level" class="form-control"></td>
                            <td style="background: #f3f4f6;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 10px; padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; font-size: 14px;">
                <strong><i class="fa-solid fa-triangle-exclamation"></i> Note:</strong> Total persentase (Oil + Sludge + Water + Solid) untuk masing-masing <strong>COT, CST, dan Sludge Tank</strong> harus berjumlah tepat <strong>100%</strong>.
            </div>
            <button class="btn btn-success mt-3" onclick="saveLiquidHour()">Simpan Liquid</button>
        </div>
    </div>
</div>

<!-- Modal Input FFA -->
<div class="modal-overlay" id="modal-input-ffa" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 600px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Parameter FFA</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-input-ffa').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <input type="date" id="mf-date" class="form-control" style="width: 150px;" onchange="loadFfaHour()">
                <select id="mf-hour" class="form-control" style="width: 120px;" onchange="loadFfaHour()">
                    <option value="08:00">08:00</option><option value="10:00">10:00</option>
                    <option value="12:00">12:00</option><option value="15:00">15:00</option>
                    <option value="17:00">17:00</option><option value="19:00">19:00</option>
                    <option value="22:00">22:00</option><option value="24:00">24:00</option>
                    <option value="02:00">02:00</option><option value="04:00">04:00</option>
                </select>
            </div>
            <table class="data-table" style="width:100%; margin-top:15px; margin-bottom: 15px;">
                <thead>
                    <tr>
                        <th style="text-align:center;">PARAMETER</th>
                        <th style="text-align:center;">Sebelum Washing Plant</th>
                        <th style="text-align:center;">Setelah Washing Plant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight:bold;">FFA</td>
                        <td><input type="number" step="0.1" id="mf_ffa_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.1" id="mf_ffa_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Moisture (%)</td>
                        <td><input type="number" step="0.01" id="mf_moist_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.01" id="mf_moist_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">Dirt (%)</td>
                        <td><input type="number" step="0.001" id="mf_dirt_b" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                        <td><input type="number" step="0.001" id="mf_dirt_a" class="form-control" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                </tbody>
            </table>
            <button class="btn btn-success mt-3" onclick="saveFfaHour()">Simpan FFA</button>
        </div>
    </div>
</div>

<!-- Modal Historical Processing -->
<div class="modal-overlay" id="modal-processing-hist" style="display:none; z-index:9998;">
    <div class="modal-content" style="max-width: 95%; width:100%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Historical Processing (Per Jam)</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-processing-hist').style.display='none'">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            <h4>Data Liquid</h4>
            <div class="table-responsive" style="margin-bottom:20px;">
                <table class="data-table" id="hist-liquid-table" style="min-width: 1200px;">
                    <thead>
                        <tr>
                            <th rowspan="2">Jam</th>
                            <th colspan="5">COT (Oil 36-38 %)</th>
                            <th colspan="6">CST</th>
                            <th colspan="5">Sludge Tank</th>
                        </tr>
                        <tr>
                            <th>OIL<br>(standart 36-38%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                            <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th><th>Ketebalan Minyak<br>(mm)</th>
                            <th>OIL<br>(standart max 6%)</th><th>SLUDGE<br>(%)</th><th>WATER<br>(%)</th><th>SOLID<br>(%)</th><th>TEMP<br>(°C)</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <h4>Data FFA</h4>
            <div class="table-responsive">
                <table class="data-table" id="hist-ffa-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Jam</th>
                            <th colspan="3">Sebelum Washing Plant</th>
                            <th colspan="3">Setelah Washing Plant</th>
                        </tr>
                        <tr>
                            <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                            <th>FFA (%)</th><th>Moist (%)</th><th>Dirt (%)</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`;

window.renderProcessingView = function() {
    if (!document.getElementById('p-date').value) {
        document.getElementById('p-date').value = window.getLocalDate();
    }
    window.loadProcessingData();
    
    // Disable inputs for read-only roles
    const readOnlyRoles = ['Senior Field Manager'];
    if (window.currentUser && readOnlyRoles.includes(window.currentUser.role)) {
        document.querySelectorAll('#view-container .btn-success').forEach(el => el.style.display = 'none');
    }
};

window.openLiquidModal = function() {
    const modal = document.getElementById('modal-input-liquid');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    const pDate = document.getElementById('p-date');
    const mainDate = (pDate && pDate.value) ? pDate.value : window.getLocalDate();
    const mlDate = document.getElementById('ml-date');
    if (mlDate) mlDate.value = mainDate;
    try { if (typeof window.loadLiquidHour === 'function') window.loadLiquidHour(); } catch(e){ console.error(e); }
};

window.openFfaModal = function() {
    const modal = document.getElementById('modal-input-ffa');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    const pDate = document.getElementById('p-date');
    const mainDate = (pDate && pDate.value) ? pDate.value : window.getLocalDate();
    const mfDate = document.getElementById('mf-date');
    if (mfDate) mfDate.value = mainDate;
    try { if (typeof window.loadFfaHour === 'function') window.loadFfaHour(); } catch(e){ console.error(e); }
};

window.openProcessingHistorical = function() {
    const modal = document.getElementById('modal-processing-hist');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
};

window.openWaterModal = function() {
    const modal = document.getElementById('modal-water-sebelum');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    const wDate = document.getElementById('w-date');
    const curDate = (wDate && wDate.value) ? wDate.value : window.getLocalDate();
    const sebDate = document.getElementById('w_sebelum_date');
    if (sebDate) sebDate.value = curDate;
    try { if (typeof window.loadSebelumDataByDate === 'function') window.loadSebelumDataByDate(); } catch(e){ console.error(e); }
};

window.openBoilerModal = function() {
    const modal = document.getElementById('modal-water-boiler');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    const wDate = document.getElementById('w-date');
    const curDate = (wDate && wDate.value) ? wDate.value : window.getLocalDate();
    const bDate = document.getElementById('w_boiler_date');
    if (bDate) bDate.value = curDate;
    try { if (typeof window.fetchBoilerHourlyByDate === 'function') window.fetchBoilerHourlyByDate(); } catch(e){ console.error(e); }
};

window.currentLiquidData = [];
window.currentFfaData = [];

window.loadProcessingData = async function() {
    const date = document.getElementById('p-date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    try {
        // Load Liquid
        let resL = await fetch(`/api/processing/liquid/${mill}/${date}`);
        if(resL.ok) {
            let dL = await resL.json();
            window.currentLiquidData = dL.sort((a,b) => {
                let tA = parseInt((a.time_hour || '0').split(':')[0]) || 0;
                let tB = parseInt((b.time_hour || '0').split(':')[0]) || 0;
                if(tA < 7) tA += 24;
                if(tB < 7) tB += 24;
                return tA - tB;
            });
        } else {
            window.currentLiquidData = [];
        }
        
        // Load FFA
        let resF = await fetch(`/api/processing/ffa/${mill}/${date}`);
        if(resF.ok) {
            let dF = await resF.json();
            window.currentFfaData = dF.sort((a,b) => {
                let tA = parseInt((a.time_hour || '0').split(':')[0]) || 0;
                let tB = parseInt((b.time_hour || '0').split(':')[0]) || 0;
                if(tA < 7) tA += 24;
                if(tB < 7) tB += 24;
                return tA - tB;
            });
        } else {
            window.currentFfaData = [];
        }
    } catch(err) {
        console.error("Error loading processing data:", err);
        window.currentLiquidData = [];
        window.currentFfaData = [];
    }
    
    updateProcessingSummary();
    updateProcessingHistorical();
};

window.renderProcessingCharts = function(L) {
    if(!window.processingCharts) window.processingCharts = {};
    
    // Register the datalabels plugin if available
    if (window.ChartDataLabels) {
        Chart.register(window.ChartDataLabels);
    }
    
    // Sort logic
    let sortedL = [...L].sort((a,b) => {
        let tA = parseInt((a.time_hour || '0').split(':')[0]) || 0;
        let tB = parseInt((b.time_hour || '0').split(':')[0]) || 0;
        if(tA < 7) tA += 24;
        if(tB < 7) tB += 24;
        return tA - tB;
    });

    const labels = sortedL.map(row => row.time_hour);

    // Dynamic display function for datalabels: only show if value > 0
    const showLabel = (context) => {
        return context.dataset.data[context.dataIndex] > 0;
    };

    // 1. Chart Oil COT & CST
    const cotOil = sortedL.map(row => parseFloat(row.cot_oil) || 0);
    const cstOil = sortedL.map(row => parseFloat(row.cst1_oil) || 0);
    const limit38 = sortedL.map(() => 38);
    const limit36 = sortedL.map(() => 36);

    const ctxOil = document.getElementById('chart-oil-cot-cst');
    if(window.processingCharts.oil) window.processingCharts.oil.destroy();
    if(ctxOil) {
        window.processingCharts.oil = new Chart(ctxOil, {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels,
                datasets: [
                    { label: 'COT Oil (%)', data: cotOil, borderColor: '#3b82f6', tension: 0.1, backgroundColor: 'transparent', datalabels: { align: 'top', anchor: 'end' } },
                    { label: 'CST Oil (%)', data: cstOil, borderColor: '#f59e0b', tension: 0.1, backgroundColor: 'transparent', datalabels: { align: 'bottom', anchor: 'start' } },
                    { label: 'Batas Max COT (38%)', data: limit38, borderColor: '#ef4444', borderDash: [5,5], borderWidth: 1, pointRadius: 0, backgroundColor: 'transparent', datalabels: { display: false } },
                    { label: 'Batas Min COT (36%)', data: limit36, borderColor: '#ef4444', borderDash: [5,5], borderWidth: 1, pointRadius: 0, backgroundColor: 'transparent', datalabels: { display: false } }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    title: { display: true, text: 'Grafik Oil COT & CST (%)' },
                    datalabels: { 
                        display: showLabel,
                        color: '#000', 
                        font: { weight: 'bold', size: 11 }
                    }
                },
                scales: { 
                    y: { 
                        min: 0, 
                        max: 60,
                        ticks: { stepSize: 5 }
                    } 
                }
            }
        });
    }

    // 2. Chart Ketebalan Minyak / CST Oil
    const ketebalan = sortedL.map(row => parseFloat(row.cst1_level_minyak) || 0);
    const limit6 = sortedL.map(() => 6);
    const limit40 = sortedL.map(() => 40);

    const ctxK = document.getElementById('chart-cst-ketebalan');
    if(window.processingCharts.ketebalan) window.processingCharts.ketebalan.destroy();
    if(ctxK) {
        window.processingCharts.ketebalan = new Chart(ctxK, {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels,
                datasets: [
                    { label: 'Ketebalan Minyak CST (mm)', data: ketebalan, borderColor: '#10b981', tension: 0.1, backgroundColor: 'transparent', datalabels: { align: 'top', anchor: 'end' } },
                    { label: 'Batas Ideal Ketebalan (40)', data: limit40, borderColor: '#3b82f6', borderDash: [5,5], borderWidth: 1, pointRadius: 0, backgroundColor: 'transparent', datalabels: { display: false } },
                    { label: 'Batas Max Oil (6%)', data: limit6, borderColor: '#ef4444', borderDash: [5,5], borderWidth: 1, pointRadius: 0, backgroundColor: 'transparent', datalabels: { display: false } }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    title: { display: true, text: 'Grafik Ketebalan Minyak & Standar Oil CST' },
                    datalabels: { 
                        display: showLabel,
                        color: '#000', 
                        font: { weight: 'bold', size: 11 }
                    }
                },
                scales: { y: { min: 0, max: 100 } }
            }
        });
    }

    // 3. Chart Temperature
    const cotTemp = sortedL.map(row => parseFloat(row.cot_temp) || 0);
    const cstTemp = sortedL.map(row => parseFloat(row.cst1_temp) || 0);

    const ctxTemp = document.getElementById('chart-temp-cot-cst');
    if(window.processingCharts.temp) window.processingCharts.temp.destroy();
    if(ctxTemp) {
        window.processingCharts.temp = new Chart(ctxTemp, {
            type: 'line',
            plugins: [ChartDataLabels],
            data: {
                labels,
                datasets: [
                    { label: 'Temp COT (°C)', data: cotTemp, borderColor: '#3b82f6', tension: 0.1, backgroundColor: 'transparent', datalabels: { align: 'top', anchor: 'end' } },
                    { label: 'Temp CST (°C)', data: cstTemp, borderColor: '#f59e0b', tension: 0.1, backgroundColor: 'transparent', datalabels: { align: 'bottom', anchor: 'start' } }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    title: { display: true, text: 'Grafik Temperature COT & CST' },
                    datalabels: { 
                        display: showLabel,
                        color: '#000', 
                        font: { weight: 'bold', size: 11 }
                    }
                },
                scales: { y: { min: 0, max: 150 } }
            }
        });
    }
    
    // 4. Chart FFA Today
    let F = Array.isArray(window.currentFfaData) ? window.currentFfaData : [];
    
    // Create fixed 12 labels (every 2 hours) from 07:00 to 05:00 next day
    const shiftHours = ['07:00','09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:00','01:00','03:00','05:00'];

    const labelsF = shiftHours;
    const ffaB = shiftHours.map(h => {
        let row = F.find(r => r.time_hour === h);
        return row ? parseFloat(row.ffa_b) || 0 : 0;
    });
    const ffaA = shiftHours.map(h => {
        let row = F.find(r => r.time_hour === h);
        return row ? parseFloat(row.ffa_a) || 0 : 0;
    });

    let ctxFfa = document.getElementById('chart-ffa-today');
    if (ctxFfa) {
        if (window.processingCharts['ffa']) window.processingCharts['ffa'].destroy();
        window.processingCharts['ffa'] = new Chart(ctxFfa, {
            type: 'line',
            data: {
                labels: labelsF,
                datasets: [
                    { label: 'FFA Sebelum Washing Plant (%)', data: ffaB, borderColor: '#ef4444', tension: 0.1, backgroundColor: 'transparent' },
                    { label: 'FFA Setelah Washing Plant (%)', data: ffaA, borderColor: '#3b82f6', tension: 0.1, backgroundColor: 'transparent' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Grafik FFA Sebelum & Sesudah Washing Plant' },
                    datalabels: { 
                        display: showLabel,
                        color: '#000', 
                        font: { weight: 'bold', size: 11 }
                    }
                },
                scales: { 
                    y: { 
                        min: 1, 
                        max: 8,
                        ticks: { stepSize: 0.5 }
                    } 
                }
            }
        });
    }
};

function avgOrSum(arr, prop) {
    let vals = arr.map(a => a[prop]).filter(v => v !== null && v !== undefined && v !== '');
    if(vals.length === 0) return '-';
    let sum = vals.reduce((a,b) => a+parseFloat(b), 0);
    return (sum / vals.length).toFixed(2);
}

function latestVal(arr, prop) {
    if(arr.length === 0) return '-';
    // assuming ordered by time or just get last
    let last = arr[arr.length - 1];
    return (last[prop] !== null && last[prop] !== undefined && last[prop] !== '') ? parseFloat(last[prop]).toFixed(2) : '-';
}

window.updateProcessingSummary = function() {
    const lBody = document.getElementById('summary-liquid-tbody');
    const fBody = document.getElementById('summary-ffa-tbody');
    
    let L = Array.isArray(window.currentLiquidData) ? window.currentLiquidData : [];
    let F = Array.isArray(window.currentFfaData) ? window.currentFfaData : [];
    
    // Render Liquid (All hours + padding)
    let lHtml = '';
    L.forEach(row => {
        let h = row.time_hour;
        lHtml += `<tr>
            <td><strong>${h}</strong></td>
            <td>${row.cot_oil||''}</td><td>${row.cot_sludge||''}</td><td>${row.cot_water||''}</td><td>${row.cot_solid||''}</td><td>${row.cot_temp||''}</td>
            <td>${row.cst1_oil||''}</td><td>${row.cst1_sludge||''}</td><td>${row.cst1_water||''}</td><td>${row.cst1_solid||''}</td><td>${row.cst1_temp||''}</td><td>${row.cst1_level_minyak||''}</td>
            <td>${row.sludge_tank_oil||''}</td><td>${row.sludge_tank_sludge||''}</td><td>${row.sludge_tank_water||''}</td><td>${row.sludge_tank_solid||''}</td><td>${row.sludge_tank_temp||''}</td>
        </tr>`;
    });
    
    // Pad with empty rows to at least 5 rows total
    let minRows = 5;
    let emptyRowsCount = Math.max(0, minRows - L.length);
    for (let i = 0; i < emptyRowsCount; i++) {
        lHtml += `<tr>
            <td style="height: 30px;"></td>
            <td></td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td>
        </tr>`;
    }
    
    // Add Average Row at the bottom
    if (L.length > 0) {
        lHtml += `<tr style="background-color: #f8fafc;">
            <td><strong>RATA-RATA</strong></td>
            <td><strong>${avgOrSum(L, 'cot_oil')}</strong></td><td><strong>${avgOrSum(L, 'cot_sludge')}</strong></td><td><strong>${avgOrSum(L, 'cot_water')}</strong></td><td><strong>${avgOrSum(L, 'cot_solid')}</strong></td><td><strong>${avgOrSum(L, 'cot_temp')}</strong></td>
            <td><strong>${avgOrSum(L, 'cst1_oil')}</strong></td><td><strong>${avgOrSum(L, 'cst1_sludge')}</strong></td><td><strong>${avgOrSum(L, 'cst1_water')}</strong></td><td><strong>${avgOrSum(L, 'cst1_solid')}</strong></td><td><strong>${avgOrSum(L, 'cst1_temp')}</strong></td><td><strong>${avgOrSum(L, 'cst1_level_minyak')}</strong></td>
            <td><strong>${avgOrSum(L, 'sludge_tank_oil')}</strong></td><td><strong>${avgOrSum(L, 'sludge_tank_sludge')}</strong></td><td><strong>${avgOrSum(L, 'sludge_tank_water')}</strong></td><td><strong>${avgOrSum(L, 'sludge_tank_solid')}</strong></td><td><strong>${avgOrSum(L, 'sludge_tank_temp')}</strong></td>
        </tr>`;
    }
    
    lBody.innerHTML = lHtml;
    
    // Call charts rendering
    window.renderProcessingCharts(L);
    
    let html = '';
    F.forEach(row => {
        html += `
        <tr>
            <td><strong>Jam ${row.time_hour}</strong></td>
            <td>${row.ffa_b||'-'}</td><td>${row.moist_b||'-'}</td><td>${row.dirt_b||'-'}</td>
            <td>${row.ffa_a||'-'}</td><td>${row.moist_a||'-'}</td><td>${row.dirt_a||'-'}</td>
        </tr>`;
    });
    html += `
        <tr style="background-color: #f1f5f9;">
            <td><strong>Rata-rata Hari Ini</strong></td>
            <td>${avgOrSum(F, 'ffa_b')}</td><td>${avgOrSum(F, 'moist_b')}</td><td>${avgOrSum(F, 'dirt_b')}</td>
            <td>${avgOrSum(F, 'ffa_a')}</td><td>${avgOrSum(F, 'moist_a')}</td><td>${avgOrSum(F, 'dirt_a')}</td>
        </tr>
    `;
    fBody.innerHTML = html;
}

function updateProcessingHistorical() {
    const lBody = document.querySelector('#hist-liquid-table tbody');
    const fBody = document.querySelector('#hist-ffa-table tbody');
    
    const hoursL = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','24:00','01:00','02:00','03:00','04:00','05:00','06:00'];
    let hL = '';
    hoursL.forEach(h => {
        let row = window.currentLiquidData.find(d => d.time_hour === h) || {};
        hL += `<tr>
            <td><strong>${h}</strong></td>
            <td>${row.cot_oil||''}</td><td>${row.cot_sludge||''}</td><td>${row.cot_water||''}</td><td>${row.cot_solid||''}</td><td>${row.cot_temp||''}</td>
            <td>${row.cst1_oil||''}</td><td>${row.cst1_sludge||''}</td><td>${row.cst1_water||''}</td><td>${row.cst1_solid||''}</td><td>${row.cst1_temp||''}</td><td>${row.cst1_level_minyak||''}</td>
            <td>${row.sludge_tank_oil||''}</td><td>${row.sludge_tank_sludge||''}</td><td>${row.sludge_tank_water||''}</td><td>${row.sludge_tank_solid||''}</td><td>${row.sludge_tank_temp||''}</td>
        </tr>`;
    });
    lBody.innerHTML = hL;
    
    const hoursF = ['08:00','10:00','12:00','15:00','17:00','19:00','22:00','24:00','02:00','04:00','06:00'];
    let hF = '';
    hoursF.forEach(h => {
        let row = window.currentFfaData.find(d => d.time_hour === h) || {};
        hF += `<tr>
            <td><strong>${h}</strong></td>
            <td>${row.ffa_b||''}</td><td>${row.moist_b||''}</td><td>${row.dirt_b||''}</td>
            <td>${row.ffa_a||''}</td><td>${row.moist_a||''}</td><td>${row.dirt_a||''}</td>
        </tr>`;
    });
    fBody.innerHTML = hF;
}

window.loadLiquidHour = async function() {
    const date = document.getElementById('ml-date').value;
    const hour = document.getElementById('ml-hour').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill || !date) return;
    
    let res = await fetch(`/api/processing/liquid/${mill}/${date}`);
    let data = await res.json();
    let row = data.find(d => d.time_hour === hour) || {};
    
    document.getElementById('ml_cot_oil').value = row.cot_oil || '';
    document.getElementById('ml_cot_water').value = row.cot_water || '';
    document.getElementById('ml_cot_temp').value = row.cot_temp || '';
    document.getElementById('ml_cot_sludge').value = row.cot_sludge || '';
    document.getElementById('ml_cot_solid').value = row.cot_solid || '';
    
    document.getElementById('ml_cst_oil').value = row.cst1_oil || '';
    document.getElementById('ml_cst_water').value = row.cst1_water || '';
    document.getElementById('ml_cst_temp').value = row.cst1_temp || '';
    document.getElementById('ml_cst_sludge').value = row.cst1_sludge || '';
    document.getElementById('ml_cst_solid').value = row.cst1_solid || '';
    document.getElementById('ml_cst_level').value = row.cst1_level_minyak || '';
    
    document.getElementById('ml_sludge_oil').value = row.sludge_tank_oil || '';
    document.getElementById('ml_sludge_water').value = row.sludge_tank_water || '';
    document.getElementById('ml_sludge_temp').value = row.sludge_tank_temp || '';
    document.getElementById('ml_sludge_sludge').value = row.sludge_tank_sludge || '';
    document.getElementById('ml_sludge_solid').value = row.sludge_tank_solid || '';
};

window.saveLiquidHour = async function() {
    const date = document.getElementById('ml-date').value;
    const hour = document.getElementById('ml-hour').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    // Parse values
    const cot_oil = parseFloat(document.getElementById('ml_cot_oil').value) || 0;
    const cot_sludge = parseFloat(document.getElementById('ml_cot_sludge').value) || 0;
    const cot_water = parseFloat(document.getElementById('ml_cot_water').value) || 0;
    const cot_solid = parseFloat(document.getElementById('ml_cot_solid').value) || 0;
    const cot_temp = parseFloat(document.getElementById('ml_cot_temp').value) || null;

    const cst_oil = parseFloat(document.getElementById('ml_cst_oil').value) || 0;
    const cst_sludge = parseFloat(document.getElementById('ml_cst_sludge').value) || 0;
    const cst_water = parseFloat(document.getElementById('ml_cst_water').value) || 0;
    const cst_solid = parseFloat(document.getElementById('ml_cst_solid').value) || 0;
    const cst_temp = parseFloat(document.getElementById('ml_cst_temp').value) || null;
    const cst_level = parseFloat(document.getElementById('ml_cst_level').value) || null;

    const sludge_oil = parseFloat(document.getElementById('ml_sludge_oil').value) || 0;
    const sludge_sludge = parseFloat(document.getElementById('ml_sludge_sludge').value) || 0;
    const sludge_water = parseFloat(document.getElementById('ml_sludge_water').value) || 0;
    const sludge_solid = parseFloat(document.getElementById('ml_sludge_solid').value) || 0;
    const sludge_temp = parseFloat(document.getElementById('ml_sludge_temp').value) || null;

    // Validation 100% rules
    const cot_total = cot_oil + cot_sludge + cot_water + cot_solid;
    const cst_total = cst_oil + cst_sludge + cst_water + cst_solid;
    const sludge_total = sludge_oil + sludge_sludge + sludge_water + sludge_solid;

    if (cot_total > 0 && Math.abs(cot_total - 100) > 0.01) {
        alert('Gagal Menyimpan: Total persentase COT (Oil+Sludge+Water+Solid) adalah ' + cot_total + '%. Harus tepat 100%!');
        return;
    }
    if (cst_total > 0 && Math.abs(cst_total - 100) > 0.01) {
        alert('Gagal Menyimpan: Total persentase CST (Oil+Sludge+Water+Solid) adalah ' + cst_total + '%. Harus tepat 100%!');
        return;
    }
    if (sludge_total > 0 && Math.abs(sludge_total - 100) > 0.01) {
        alert('Gagal Menyimpan: Total persentase Sludge Tank (Oil+Sludge+Water+Solid) adalah ' + sludge_total + '%. Harus tepat 100%!');
        return;
    }

    let obj = {
        time_hour: hour,
        cot_oil: cot_oil || null,
        cot_water: cot_water || null,
        cot_temp: cot_temp,
        cot_sludge: cot_sludge || null,
        cot_solid: cot_solid || null,
        cst1_oil: cst_oil || null,
        cst1_water: cst_water || null,
        cst1_temp: cst_temp,
        cst1_sludge: cst_sludge || null,
        cst1_solid: cst_solid || null,
        cst1_level_minyak: cst_level,
        sludge_tank_oil: sludge_oil || null,
        sludge_tank_water: sludge_water || null,
        sludge_tank_temp: sludge_temp,
        sludge_tank_sludge: sludge_sludge || null,
        sludge_tank_solid: sludge_solid || null
    };
    
    try {
        await fetch('/api/processing/liquid', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, mill, entries: [obj] })
        });
        alert('Data Liquid berhasil disimpan!');
        document.getElementById('modal-input-liquid').style.display = 'none';
        window.loadProcessingData(); // Refresh bg table
    } catch(e) {
        alert('Gagal menyimpan data Liquid.');
    }
};

window.loadFfaHour = async function() {
    const date = document.getElementById('mf-date').value;
    const hour = document.getElementById('mf-hour').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill || !date) return;
    
    let res = await fetch(`/api/processing/ffa/${mill}/${date}`);
    let data = await res.json();
    let row = data.find(d => d.time_hour === hour) || {};
    
    document.getElementById('mf_ffa_b').value = row.ffa_b || '';
    document.getElementById('mf_moist_b').value = row.moist_b || '';
    document.getElementById('mf_dirt_b').value = row.dirt_b || '';
    
    document.getElementById('mf_ffa_a').value = row.ffa_a || '';
    document.getElementById('mf_moist_a').value = row.moist_a || '';
    document.getElementById('mf_dirt_a').value = row.dirt_a || '';
};

window.saveFfaHour = async function() {
    const date = document.getElementById('mf-date').value;
    const hour = document.getElementById('mf-hour').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    let obj = {
        time_hour: hour,
        ffa_b: parseFloat(document.getElementById('mf_ffa_b').value) || null,
        moist_b: parseFloat(document.getElementById('mf_moist_b').value) || null,
        dirt_b: parseFloat(document.getElementById('mf_dirt_b').value) || null,
        ffa_a: parseFloat(document.getElementById('mf_ffa_a').value) || null,
        moist_a: parseFloat(document.getElementById('mf_moist_a').value) || null,
        dirt_a: parseFloat(document.getElementById('mf_dirt_a').value) || null
    };
    
    try {
        await fetch('/api/processing/ffa', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, mill, entries: [obj] })
        });
        alert('Data FFA berhasil disimpan!');
        document.getElementById('modal-input-ffa').style.display = 'none';
        window.loadProcessingData(); // Refresh bg table
    } catch(e) {
        alert('Gagal menyimpan data FFA.');
    }
};

// 2. WATER VIEW
views.water = `
<div class="content-header">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <input type="date" id="w-date" class="form-control" style="width: auto;">
        <button class="btn btn-primary" onclick="loadWaterData()"><i class="fa-solid fa-rotate"></i> Load</button>
        <button class="btn btn-success" onclick="document.getElementById('w_sebelum_date').value = document.getElementById('w-date').value || window.getLocalDate(); window.loadSebelumDataByDate(); document.getElementById('modal-water-sebelum').style.display='flex'"><i class="fa-solid fa-plus"></i> Input Air Sebelum Proses</button>
        <button class="btn btn-success" onclick="document.getElementById('w_boiler_date').value = document.getElementById('w-date').value || window.getLocalDate(); window.fetchBoilerHourlyByDate(); document.getElementById('modal-water-boiler').style.display='flex'"><i class="fa-solid fa-plus"></i> Update Air Boiler</button>
    </div>
</div>

<div class="dashboard-grid" style="grid-template-columns: 1fr 1fr;">
    <div class="glass-card">
        <h3>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive">
            <table class="data-table" id="table-water-sebelum">
                <tbody>
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> RAW WATER</strong></td></tr>
                    <tr><td style="width:50%;">PH</td><td id="td_raw_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_raw_tds"></td></tr>
                    <tr><td>T.hardness</td><td id="td_raw_thardness"></td></tr>
                    <tr><td>Silica/Sio2</td><td id="td_raw_silica"></td></tr>
                    <tr><td>Turbidity</td><td id="td_raw_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_raw_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> WTP / clarifier</strong></td></tr>
                    <tr><td>PH</td><td id="td_wtp_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_wtp_tds"></td></tr>
                    <tr><td>Turbidity(<10)</td><td id="td_wtp_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_wtp_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> Sand Filter</strong></td></tr>
                    <tr><td>PH</td><td id="td_sand_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_sand_tds"></td></tr>
                    <tr><td>Turbidity(<10)</td><td id="td_sand_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_sand_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>Demin plant no.1 atau no.2 (pilihan)</strong></td></tr>
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> CATION</strong></td></tr>
                    <tr><td>PH(<5.5)</td><td id="td_cation_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_cation_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_cation_thardness"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> ANION</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_anion_ph"></td></tr>
                    <tr><td>Tds(<100)</td><td id="td_anion_tds"></td></tr>
                    <tr><td>SiO2/silica(<2.5)</td><td id="td_anion_silica"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> FEED TANK</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_feed_ph"></td></tr>
                    <tr><td>Tds(<100)</td><td id="td_feed_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_feed_thardness"></td></tr>
                    <tr><td>Silica/SiO2(<5)</td><td id="td_feed_silica"></td></tr>
                    <tr><td>Cloride</td><td id="td_feed_cloride"></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="glass-card">
        <h3>1.2 ANALISA AIR BOILER SELAMA PENGOLAHAN</h3>
        <div class="table-responsive">
            <table class="data-table" id="table-water-boiler">
                <thead>
                    <tr>
                        <th style="width:50%;">PARAMETER</th>
                        <th>HASIL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>PH(10.5-11.5)</td><td id="td_boiler2j_ph"></td></tr>
                    <tr><td>Tds(<1800)</td><td id="td_boiler2j_tds"></td></tr>
                    <tr><td>P.alkanity(300 - 700)</td><td id="td_boiler2j_palkanity"></td></tr>
                    <tr><td>M.alkanity(<1300)</td><td id="td_boiler2j_malkanity"></td></tr>
                    <tr><td>O.alkanity(>2,5xsilica)</td><td id="td_boiler2j_oalkanity"></td></tr>
                    <tr><td>T.hardness</td><td id="td_boiler2j_thardness"></td></tr>
                    <tr><td>Silica/SiO2(<125)</td><td id="td_boiler2j_silica"></td></tr>
                    <tr><td>Phospate/PO4(30 - 70)</td><td id="td_boiler2j_phospate"></td></tr>
                    <tr><td>Sulfite/SO3(30 - 70)</td><td id="td_boiler2j_sulfite"></td></tr>
                    <tr><td>Chloride</td><td id="td_boiler2j_chloride"></td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modals -->
<div class="modal-overlay" id="modal-water-sebelum" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 900px; width:90%; padding:20px; max-height:90vh; overflow-y:auto;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Input Analisa Air Sebelum Proses</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-water-sebelum').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold;">Tanggal:</label>
                <input type="date" id="w_sebelum_date" class="form-control" onchange="window.loadSebelumDataByDate()">
            </div>
            <div class="table-responsive">
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 50%;">PARAMETER</th>
                            <th>NILAI PARAMETER</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> RAW WATER</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_raw_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_raw_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness</td><td><input type="number" step="any" id="w_raw_thardness" class="form-control"></td></tr>
                        <tr><td>Silica/Sio2</td><td><input type="number" step="any" id="w_raw_silica" class="form-control"></td></tr>
                        <tr><td>Turbidity</td><td><input type="number" step="any" id="w_raw_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_raw_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> WTP / clarifier</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_wtp_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_wtp_tds" class="form-control"></td></tr>
                        <tr><td>Turbidity(<10)</td><td><input type="number" step="any" id="w_wtp_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_wtp_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> Sand Filter</strong></td></tr>
                        <tr><td>PH</td><td><input type="number" step="any" id="w_sand_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_sand_tds" class="form-control"></td></tr>
                        <tr><td>Turbidity(<10)</td><td><input type="number" step="any" id="w_sand_turbidity" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_sand_cloride" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>Demin plant no.1 atau no.2 (pilihan)</strong></td></tr>
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> CATION</strong></td></tr>
                        <tr><td>PH(<5.5)</td><td><input type="number" step="any" id="w_cation_ph" class="form-control"></td></tr>
                        <tr><td>Tds</td><td><input type="number" step="any" id="w_cation_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness(Trace)</td><td><input type="number" step="any" id="w_cation_thardness" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> ANION</strong></td></tr>
                        <tr><td>PH(6.5 - 9.5)</td><td><input type="number" step="any" id="w_anion_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<100)</td><td><input type="number" step="any" id="w_anion_tds" class="form-control"></td></tr>
                        <tr><td>SiO2/silica(<2.5)</td><td><input type="number" step="any" id="w_anion_silica" class="form-control"></td></tr>
                        
                        <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> FEED TANK</strong></td></tr>
                        <tr><td>PH(6.5 - 9.5)</td><td><input type="number" step="any" id="w_feed_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<100)</td><td><input type="number" step="any" id="w_feed_tds" class="form-control"></td></tr>
                        <tr><td>T.hardness(Trace)</td><td><input type="number" step="any" id="w_feed_thardness" class="form-control"></td></tr>
                        <tr><td>Silica/SiO2(<5)</td><td><input type="number" step="any" id="w_feed_silica" class="form-control"></td></tr>
                        <tr><td>Cloride</td><td><input type="number" step="any" id="w_feed_cloride" class="form-control"></td></tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary" style="margin-top:15px; width:100%" onclick="saveWaterData('sebelum')"><i class="fa-solid fa-floppy-disk"></i> Simpan Analisa Sebelum Proses</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-water-boiler" style="display:none; z-index:9999;">
    <div class="modal-content" style="max-width: 600px; width:90%; padding:20px;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0;">Update Analisa Air Boiler</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-water-boiler').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="flex:1;">
                    <label style="font-weight: bold;">Tanggal:</label>
                    <input type="date" id="w_boiler_date" class="form-control" onchange="window.fetchBoilerHourlyByDate()">
                </div>
                <div style="flex:1;">
                    <label style="font-weight: bold;">Jam Olah:</label>
                    <select id="w_boiler_jam" class="form-control" onchange="window.loadBoilerHourlyData()">
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
                    <option value="00:00">00:00</option>
                    <option value="01:00">01:00</option>
                    <option value="02:00">02:00</option>
                    <option value="03:00">03:00</option>
                    <option value="04:00">04:00</option>
                    <option value="05:00">05:00</option>
                    <option value="06:00">06:00</option>
                </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th style="width: 50%;">PARAMETER</th>
                            <th>NILAI PARAMETER</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>PH(10.5-11.5)</td><td><input type="number" step="0.1" id="w_boiler2j_ph" class="form-control"></td></tr>
                        <tr><td>Tds(<1800)</td><td><input type="number" step="any" min="500" id="w_boiler2j_tds" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>P.alkanity(300 - 700)</td><td><input type="number" step="any" min="100" id="w_boiler2j_palkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>M.alkanity(<1300)</td><td><input type="number" step="any" min="100" id="w_boiler2j_malkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>O.alkanity(>2.5xsilica)</td><td><input type="number" step="any" min="50" id="w_boiler2j_oalkanity" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>T.hardness</td><td><input type="number" step="any" id="w_boiler2j_thardness" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Silica/SiO2(<125)</td><td><input type="number" step="any" id="w_boiler2j_silica" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Phospate/PO4(30 - 70)</td><td><input type="number" step="any" id="w_boiler2j_phospate" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Sulfite/SO3(30 - 70)</td><td><input type="number" step="any" id="w_boiler2j_sulfite" class="form-control"></td></tr>
                        <tr class="boiler-extra-row"><td>Chloride</td><td><input type="number" step="any" id="w_boiler2j_chloride" class="form-control"></td></tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary" style="margin-top:15px; width:100%" onclick="saveWaterData('boiler')"><i class="fa-solid fa-floppy-disk"></i> Simpan Analisa Boiler</button>
        </div>
    </div>
</div>
`;


window.openWaterModal = function() {
    const wDate = document.getElementById('w-date');
    const curDate = (wDate && wDate.value) ? wDate.value : window.getLocalDate();
    const sebDate = document.getElementById('w_sebelum_date');
    if (sebDate) sebDate.value = curDate;
    if (typeof window.loadSebelumDataByDate === 'function') window.loadSebelumDataByDate();
    const modal = document.getElementById('modal-water-sebelum');
    if (modal) modal.style.display = 'flex';
};

window.openBoilerModal = function() {
    const wDate = document.getElementById('w-date');
    const curDate = (wDate && wDate.value) ? wDate.value : window.getLocalDate();
    const bDate = document.getElementById('w_boiler_date');
    if (bDate) bDate.value = curDate;
    if (typeof window.fetchBoilerHourlyByDate === 'function') window.fetchBoilerHourlyByDate();
    const modal = document.getElementById('modal-water-boiler');
    if (modal) modal.style.display = 'flex';
};

window.renderWaterView = function() {
    if (!document.getElementById('w-date').value) {
        document.getElementById('w-date').value = window.getLocalDate();
    }
    window.loadWaterData();
    
    // Disable inputs for read-only roles
    const readOnlyRoles = ['Senior Field Manager'];
    if (window.currentUser && readOnlyRoles.includes(window.currentUser.role)) {
        document.querySelectorAll('#view-container .btn-success').forEach(el => el.style.display = 'none');
    }
};

window.loadWaterData = async function() {
    const date = document.getElementById('w-date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    // Load Sebelum Proses
    let res = await fetch(`/api/water/${mill}/${date}`);
    let data = await res.json();
    
    // Load Boiler Hourly
    let resBoiler = await fetch(`/api/water_boiler/${mill}/${date}`);
    let dataBoiler = await resBoiler.json();
    window.currentBoilerHourly = dataBoiler.hourly || [];
    
    const fieldsSebelum = [
        'raw_ph', 'raw_tds', 'raw_thardness', 'raw_silica', 'raw_turbidity', 'raw_cloride',
        'wtp_ph', 'wtp_tds', 'wtp_turbidity', 'wtp_cloride',
        'sand_ph', 'sand_tds', 'sand_turbidity', 'sand_cloride',
        'cation_ph', 'cation_tds', 'cation_thardness',
        'anion_ph', 'anion_tds', 'anion_silica',
        'feed_ph', 'feed_tds', 'feed_thardness', 'feed_silica', 'feed_cloride'
    ];
    
    fieldsSebelum.forEach(f => {
        let el = document.getElementById('w_' + f);
        if(el) el.value = data && data[f] !== null ? data[f] : '';
        let td = document.getElementById('td_' + f);
        if(td) td.innerText = data && data[f] !== null ? data[f] : '-';
    });
    
    // Dynamically render Boiler table
    let boilerTable = document.getElementById('table-water-boiler');
    if (boilerTable) {
        let thead = boilerTable.querySelector('thead');
        let tbody = boilerTable.querySelector('tbody');
        
        let hourlyData = window.currentBoilerHourly ? [...window.currentBoilerHourly] : [];
        hourlyData.sort((a, b) => a.time_hour.localeCompare(b.time_hour));
        
        // Header
        let headRow = `<tr><th style="width:50%;">PARAMETER</th>`;
        hourlyData.forEach(h => { headRow += `<th>${h.time_hour}</th>`; });
        headRow += `<th style="width:15%;">Rata-rata</th></tr>`;
        thead.innerHTML = headRow;
        
        // Body
        let bodyHtml = '';
        const params = [
            { id: 'ph', label: 'PH(10.5-11.5)', extra: false },
            { id: 'tds', label: 'Tds(<1800)', extra: false },
            { id: 'palkanity', label: 'P.alkanity(300 - 700)', extra: true },
            { id: 'malkanity', label: 'M.alkanity(<1300)', extra: true },
            { id: 'oalkanity', label: 'O.alkanity(>2.5xsilica)', extra: true },
            { id: 'thardness', label: 'T.hardness', extra: true },
            { id: 'silica', label: 'Silica/SiO2(<125)', extra: true },
            { id: 'phospate', label: 'Phospate/PO4(30 - 70)', extra: true },
            { id: 'sulfite', label: 'Sulfite/SO3(30 - 70)', extra: true },
            { id: 'chloride', label: 'Chloride', extra: true }
        ];
        
        params.forEach(p => {
            let rowHtml = `<tr><td>${p.label}</td>`;
            if (p.extra) {
                let avgVal = dataBoiler.average && dataBoiler.average[p.id] !== null ? dataBoiler.average[p.id] : '-';
                if (hourlyData.length > 0) {
                    rowHtml += `<td colspan="${hourlyData.length}"></td>`;
                }
                rowHtml += `<td>${avgVal}</td>`;
            } else {
                hourlyData.forEach(h => {
                    let val = h[p.id] !== null ? h[p.id] : '-';
                    rowHtml += `<td>${val}</td>`;
                });
                let avgVal = dataBoiler.average && dataBoiler.average[p.id] !== null ? dataBoiler.average[p.id] : '-';
                rowHtml += `<td>${avgVal}</td>`;
            }
            rowHtml += `</tr>`;
            bodyHtml += rowHtml;
        });
        tbody.innerHTML = bodyHtml;
    }
    
    if (window.loadBoilerHourlyData) window.loadBoilerHourlyData(); // Fill boiler modal if it's open
};

window.loadBoilerHourlyData = function() {
    let jam = document.getElementById('w_boiler_jam').value;
    let hourlyData = window.currentBoilerHourly || [];
    let existing = hourlyData.find(x => x.time_hour === jam);
    
    let isFirstEntry = false;
    if (hourlyData.length === 0) {
        isFirstEntry = true;
    } else {
        let sorted = [...hourlyData].sort((a, b) => a.time_hour.localeCompare(b.time_hour));
        if (sorted[0].time_hour === jam) {
            isFirstEntry = true;
        }
    }
    
    let extraRows = document.querySelectorAll('.boiler-extra-row');
    extraRows.forEach(row => {
        row.style.display = isFirstEntry ? '' : 'none';
    });
    
    if (!existing && hourlyData.length > 0) {
        existing = [...window.currentBoilerHourly].reverse()[0];
    }
    
    const fieldsBoiler = ['ph', 'tds', 'palkanity', 'malkanity', 'oalkanity', 'thardness', 'silica', 'phospate', 'sulfite', 'chloride'];
    fieldsBoiler.forEach(f => {
        let el = document.getElementById('w_boiler2j_' + f);
        if(el) {
            el.value = existing && existing[f] !== null ? existing[f] : '';
        }
    });
};

window.loadSebelumDataByDate = async function() {
    let date = document.getElementById('w_sebelum_date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill || !date) return;
    
    let res = await fetch(`/api/water/${mill}/${date}`);
    let data = await res.json();
    
    const fieldsSebelum = [
        'raw_ph', 'raw_tds', 'raw_thardness', 'raw_silica', 'raw_turbidity', 'raw_cloride',
        'wtp_ph', 'wtp_tds', 'wtp_turbidity', 'wtp_cloride',
        'sand_ph', 'sand_tds', 'sand_turbidity', 'sand_cloride',
        'cation_ph', 'cation_tds', 'cation_thardness',
        'anion_ph', 'anion_tds', 'anion_silica',
        'feed_ph', 'feed_tds', 'feed_thardness', 'feed_silica', 'feed_cloride'
    ];
    
    fieldsSebelum.forEach(f => {
        let el = document.getElementById('w_' + f);
        if(el) el.value = data && data[f] !== null ? data[f] : '';
    });
};

window.fetchBoilerHourlyByDate = async function() {
    let date = document.getElementById('w_boiler_date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill || !date) return;
    
    let resBoiler = await fetch(`/api/water_boiler/${mill}/${date}`);
    let dataBoiler = await resBoiler.json();
    window.currentBoilerHourly = dataBoiler.hourly || [];
    window.loadBoilerHourlyData();
};

window.saveWaterData = async function(type) {
    const date = document.getElementById('w-date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    if (type === 'sebelum') {
        const dateSebelum = document.getElementById('w_sebelum_date').value || date;
        let res = await fetch(`/api/water/${mill}/${dateSebelum}`);
        let existing = await res.json();
        if(!existing) existing = {};

        let obj = { ...existing };
        const fieldsSebelum = [
            'raw_ph', 'raw_tds', 'raw_thardness', 'raw_silica', 'raw_turbidity', 'raw_cloride',
            'wtp_ph', 'wtp_tds', 'wtp_turbidity', 'wtp_cloride',
            'sand_ph', 'sand_tds', 'sand_turbidity', 'sand_cloride',
            'cation_ph', 'cation_tds', 'cation_thardness',
            'anion_ph', 'anion_tds', 'anion_silica',
            'feed_ph', 'feed_tds', 'feed_thardness', 'feed_silica', 'feed_cloride'
        ];
        fieldsSebelum.forEach(f => {
            let el = document.getElementById('w_' + f);
            if(el && el.value !== '') obj[f] = parseFloat(el.value);
            else obj[f] = null;
        });
        
        try {
            await fetch('/api/water', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateSebelum, mill, data: obj })
            });
            alert('Data berhasil disimpan!');
            document.getElementById('modal-water-sebelum').style.display = 'none';
            if (dateSebelum === date) {
                loadWaterData();
            }
        } catch(e) {
            alert('Gagal menyimpan data.');
        }
    } else {
        const dateBoiler = document.getElementById('w_boiler_date').value || date;
        let time_hour = document.getElementById('w_boiler_jam').value;
        const fieldsBoiler = ['ph', 'tds', 'palkanity', 'malkanity', 'oalkanity', 'thardness', 'silica', 'phospate', 'sulfite', 'chloride'];
        let obj = {};
        fieldsBoiler.forEach(f => {
            let el = document.getElementById('w_boiler2j_' + f);
            if(el && el.value !== '') obj[f] = parseFloat(el.value);
            else obj[f] = null;
        });
        
        try {
            await fetch('/api/water_boiler', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateBoiler, mill, time_hour, data: obj })
            });
            alert('Data berhasil disimpan!');
            document.getElementById('modal-water-boiler').style.display = 'none';
            if (dateBoiler === date) {
                loadWaterData();
            }
        } catch(e) {
            alert('Gagal menyimpan data.');
        }
    }
};

// 3. FFB QUALITY VIEW
views.ffb_quality = `
<!-- Sub-Sheet Navigation Tabs -->
<div class="subsheet-tab-bar">
    <button class="subsheet-tab-btn active" id="tab-btn-ffb-loose" onclick="switchFFBSubTab('loose')">
        <i class="fa-solid fa-seedling"></i> FFB Quality Fruit Loose Analysis
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-ffb-crop" onclick="switchFFBSubTab('crop')">
        <i class="fa-solid fa-wheat-awn"></i> Daily FFB Crop Quality
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-ffb-detail" onclick="switchFFBSubTab('detail')">
        <i class="fa-solid fa-table-list"></i> Detail FFQ FFB Crop Quality
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-ffb-monthly" onclick="switchFFBSubTab('monthly')">
        <i class="fa-solid fa-calendar-check"></i> Summary Monthly Grading
    </button>
</div>

<!-- 1. SUB-SHEET: LOOSE FRUIT ANALYSIS -->
<div id="ffb-subsheet-loose" class="subsheet-content active">
    <div class="content-header" style="margin-bottom: 15px;">
        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="openFqRangeModal('loose')"><i class="fa-solid fa-rotate"></i> Load Data</button>
            <button class="btn btn-secondary" onclick="printTable('ffb-quality-wrapper', 'Laporan FFB Quality Fruit Loose Analysis')"><i class="fa-solid fa-print"></i> Print</button>
            <button class="btn btn-success" onclick="openFFBModal()"><i class="fa-solid fa-plus"></i> Tambah input Loose Fruit Quality</button>
        </div>
    </div>
    <div class="glass-card" style="overflow-x: auto;">
        <h3>FFB Quality Fruit Loose Analysis</h3>
        <div id="ffb-quality-wrapper" class="table-responsive">
            <style>
                #ffb-quality-table th, #ffb-quality-table td {
                    padding: 4px 8px !important;
                }
            </style>
            <table class="data-table" id="ffb-quality-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                    <tr>
                        <th rowspan="2">Tanggal</th>
                        <th rowspan="2">Estate</th>
                        <th rowspan="2">Divisi</th>
                        <th rowspan="2">No. Truck</th>
                        <th>Brt Sample</th>
                        <th colspan="2">Bron Segar</th>
                        <th colspan="2">Bron Tdk Segar</th>
                        <th colspan="2">Bron Busuk</th>
                        <th colspan="2">Sampah</th>
                        <th rowspan="2">Aksi</th>
                    </tr>
                    <tr>
                        <th>(gram)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                        <th>(gram)</th><th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Generated via JS -->
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td colspan="5" style="text-align: right;">RATA-RATA / TOTAL:</td>
                        <td id="fq-tot-bg">0</td>
                        <td id="fq-tot-bd">0</td>
                        <td id="fq-avg-bd">0.0</td>
                        <td id="fq-tot-ts">0</td>
                        <td id="fq-avg-ts">0.0</td>
                        <td id="fq-tot-bb">0</td>
                        <td id="fq-avg-bb">0.0</td>
                        <td id="fq-tot-sampah">0</td>
                        <td id="fq-avg-sampah">0.0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- 2. SUB-SHEET: DAILY FFB CROP QUALITY -->
<div id="ffb-subsheet-crop" class="subsheet-content">
    <div class="glass-card" style="overflow-x: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h3 style="margin:0;">Daily FFB Crop Quality</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="openFqRangeModal('crop')"><i class="fa-solid fa-rotate"></i> Load Data</button>
                <button class="btn btn-secondary" onclick="printTable('ffb-crop-wrapper', 'Laporan Daily FFB Crop Quality')"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn btn-success" onclick="openFFBCropModal()"><i class="fa-solid fa-plus"></i> Tambah input FFB Crop Quality</button>
            </div>
        </div>
        <div id="ffb-crop-wrapper" class="table-responsive">
            <style>
                #ffb-crop-table th, #ffb-crop-table td, #ffb-crop-summary-table th, #ffb-crop-summary-table td {
                    padding: 4px 8px !important;
                }
            </style>
            <table class="data-table" id="ffb-crop-table" style="font-size: 0.8rem; width: 100%; text-align: center;">
                <thead>
                    <tr>
                        <th rowspan="2">Estate</th>
                        <th rowspan="2">Divisi</th>
                        <th rowspan="2">Blok</th>
                        <th rowspan="2">No. Truck</th>
                        <th rowspan="2">Total Janjang</th>
                        <th colspan="2">Unripe</th>
                        <th colspan="2">Underripe</th>
                        <th colspan="2">Normal Ripe</th>
                        <th colspan="2">Over Ripe</th>
                        <th colspan="2">Empty Bunch</th>
                        <th colspan="2">Long Stalk</th>
                        <th colspan="2">Rat Damage</th>
                        <th rowspan="2">Aksi</th>
                    </tr>
                    <tr>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                        <th>(Jjg)</th><th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Generated via JS -->
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td colspan="4" style="text-align: right;">TOTAL / AVERAGE:</td>
                        <td id="fqc-tot-jjg">0</td>
                        <td id="fqc-tot-unripe">0</td><td id="fqc-avg-unripe">0.0</td>
                        <td id="fqc-tot-under">0</td><td id="fqc-avg-under">0.0</td>
                        <td id="fqc-tot-normal">0</td><td id="fqc-avg-normal">0.0</td>
                        <td id="fqc-tot-over">0</td><td id="fqc-avg-over">0.0</td>
                        <td id="fqc-tot-empty">0</td><td id="fqc-avg-empty">0.0</td>
                        <td id="fqc-tot-long">0</td><td id="fqc-avg-long">0.0</td>
                        <td id="fqc-tot-rat">0</td><td id="fqc-avg-rat">0.0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <table class="data-table" id="ffb-crop-summary-table" style="font-size: 0.8rem; width: 100%; text-align: center; display: none; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th rowspan="2">ESTATE</th>
                        <th rowspan="2">TOTAL JANJANG</th>
                        <th colspan="1">UN RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">UNDER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 3%)</span></th>
                        <th colspan="1">RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Min. 90%)</span></th>
                        <th colspan="1">OVER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 7%)</span></th>
                        <th colspan="1">EMPTY BUNCH<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">LONGSTALK<br><span style="font-size:0.75rem; font-weight:normal;">(&lt; 2%)</span></th>
                        <th colspan="1">RAT DAMAGE<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                    </tr>
                    <tr>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold;">
                        <td style="text-align: right;">TOTAL:</td>
                        <td id="fqc-sum-tot-jjg">0</td>
                        <td id="fqc-sum-unripe">0.00</td>
                        <td id="fqc-sum-under">0.00</td>
                        <td id="fqc-sum-normal">0.00</td>
                        <td id="fqc-sum-over">0.00</td>
                        <td id="fqc-sum-empty">0.00</td>
                        <td id="fqc-sum-long">0.00</td>
                        <td id="fqc-sum-rat">0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- 3. SUB-SHEET: SUMMARY MONTHLY GRADING -->
<!-- 3. SUB-SHEET: DETAIL FFQ FFB CROP QUALITY -->
<div id="ffb-subsheet-detail" class="subsheet-content" style="display:none;">
    <div class="glass-card" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="background: rgba(16, 185, 129, 0.15); color: #10b981; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    <i class="fa-solid fa-table-list"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b;">Detail FFQ FFB Crop Quality</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Rekapitulasi Mutu Panen & Loose Fruit Harian Day-by-Day per Estate</span>
                </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Dari:</label>
                    <input type="date" id="fq-detail-start-date" class="form-control" style="width: auto; padding: 5px 10px;">
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Hingga:</label>
                    <input type="date" id="fq-detail-end-date" class="form-control" style="width: auto; padding: 5px 10px;">
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 0;">Estate:</label>
                    <select id="fq-detail-estate-filter" class="form-control" style="width: auto; min-width: 170px; padding: 5px 10px;">
                        <option value="ALL">Semua Estate (FFB)</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="window.loadFFQDetailData()"><i class="fa-solid fa-filter"></i> Tampilkan</button>
                <button class="btn btn-secondary" onclick="printTable('ffq-detail-wrapper', 'Laporan Detail FFQ FFB Crop Quality')"><i class="fa-solid fa-print"></i> Print</button>
                <button class="btn btn-success" onclick="window.exportFFQDetailCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
            </div>
        </div>

        <div id="ffq-detail-wrapper" class="table-responsive">
            <style>
                #ffq-detail-table th, #ffq-detail-table td {
                    padding: 6px 8px !important;
                    font-size: 0.8rem;
                    text-align: center;
                }
                #ffq-detail-table th {
                    background-color: #f8fafc;
                    color: #334155;
                    font-weight: 600;
                    border: 1px solid #e2e8f0;
                }
                #ffq-detail-table td {
                    border: 1px solid #f1f5f9;
                }
                #ffq-detail-table tr:hover {
                    background-color: rgba(241, 245, 249, 0.6);
                }
            </style>
            <table class="data-table" id="ffq-detail-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 40px;">No</th>
                        <th rowspan="2" style="width: 95px;">Tanggal</th>
                        <th rowspan="2" style="text-align: left; min-width: 140px;">Estate</th>
                        <th rowspan="2" style="width: 90px;">FFB<br><span style="font-size:0.75rem; font-weight:normal;">(Ton)</span></th>
                        <th colspan="1">UNRIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">UNDER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 3%)</span></th>
                        <th colspan="1">RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Min. 90%)</span></th>
                        <th colspan="1">OVER RIPE<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 7%)</span></th>
                        <th colspan="1">EMPTY BUNCH<br><span style="font-size:0.75rem; font-weight:normal;">(Max. 0%)</span></th>
                        <th colspan="1">LONGSTALK<br><span style="font-size:0.75rem; font-weight:normal;">(&lt; 2%)</span></th>
                        <th colspan="1">RAT DAMAGE<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                        <th rowspan="2" style="width: 80px;">LF<br><span style="font-size:0.75rem; font-weight:normal;">(%)</span></th>
                    </tr>
                    <tr>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                        <th>(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="12" style="padding: 20px; color: #64748b; font-style: italic;">Silakan pilih tanggal dan klik Tampilkan</td></tr>
                </tbody>
                <tfoot>
                    <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                        <td colspan="3" style="text-align: right; font-weight: 700;">RATA-RATA / TOTAL (INTERPOLASI):</td>
                        <td id="ffqd-tot-ffb">0.00</td>
                        <td id="ffqd-avg-unripe">0.00</td>
                        <td id="ffqd-avg-under">0.00</td>
                        <td id="ffqd-avg-ripe">0.00</td>
                        <td id="ffqd-avg-over">0.00</td>
                        <td id="ffqd-avg-empty">0.00</td>
                        <td id="ffqd-avg-long">0.00</td>
                        <td id="ffqd-avg-rat">0.00</td>
                        <td id="ffqd-avg-lf">0.00</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<div id="ffb-subsheet-monthly" class="subsheet-content">
    <!-- Filter & Options Toolbar -->
    <div class="grading-filter-bar">
        <div class="grading-filter-group">
            <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-sliders"></i> Parameter Kriteria Grading</label>
                <select id="ffb-monthly-param" class="form-control" style="font-weight: 600; color: #1e293b; min-width: 290px;" onchange="window.onFFBMonthlyParamChange()">
                    <optgroup label="-- Kualitas Janjang (Crop Quality) --">
                        <option value="ripe" selected>Ripe / Buah Matang (%) [Standar Min. 90%]</option>
                        <option value="unripe">Unripe / Buah Mentah (%) [Standar Max. 0%]</option>
                        <option value="underripe">Under Ripe / Kurang Matang (%) [Standar Max. 3%]</option>
                        <option value="over_ripe">Over Ripe / Lewat Matang (%) [Standar Max. 7%]</option>
                        <option value="empty_bunch">Empty Bunch / Janjang Kosong (%) [Standar Max. 0%]</option>
                        <option value="long_stalk">Long Stalk / Tangkai Panjang (%) [Standar &lt; 2%]</option>
                        <option value="rat_damage">Rat Damage / Serangan Tikus (%)</option>
                        <option value="total_janjang">Total Janjang Sampling (Janjang)</option>
                    </optgroup>
                    <optgroup label="-- Kualitas Brondolan (Loose Fruit) --">
                        <option value="bd_percent">Brondolan Segar (%) [Standar Min. 85%]</option>
                        <option value="t_segar_percent">Brondolan Tidak Segar (%) [Standar Max. 10%]</option>
                        <option value="busuk_percent">Brondolan Busuk (%) [Standar Max. 5%]</option>
                        <option value="sampah_percent">Sampah Brondolan (%) [Standar Max. 2%]</option>
                        <option value="bg_gram">Total Berat Sample (gram)</option>
                    </optgroup>
                    <optgroup label="-- Executive Score --">
                        <option value="quality_index">Overall Grading Quality Score / Indeks Mutu (0-100)</option>
                    </optgroup>
                </select>
            </div>
            <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-calendar"></i> Tahun</label>
                <select id="ffb-monthly-year" class="form-control" style="font-weight: 600; min-width: 100px;" onchange="window.loadFFBMonthlySummary()">
                    <option value="2026" selected>2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2027">2027</option>
                </select>
            </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.loadFFBMonthlySummary()"><i class="fa-solid fa-rotate"></i> Refresh</button>
            <button class="btn btn-secondary" onclick="window.printMonthlyGrading()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
            <button class="btn btn-success" onclick="window.exportMonthlyGradingCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>
        </div>
    </div>

    <!-- Executive KPI Summary Cards -->
    <div class="grading-kpi-grid">
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon green">
                <i class="fa-solid fa-trophy"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Top Performer Estate</h4>
                <div class="kpi-val" id="ffb-kpi-top-estate">-</div>
                <div class="kpi-sub" id="ffb-kpi-top-detail">Mutu terbaik tahun ini</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon red">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Perlu Perhatian</h4>
                <div class="kpi-val" id="ffb-kpi-worst-estate">-</div>
                <div class="kpi-sub" id="ffb-kpi-worst-detail">Deviasi tertinggi dari standar</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon blue">
                <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Rata-Rata Pabrik (YTD)</h4>
                <div class="kpi-val" id="ffb-kpi-mill-avg">-</div>
                <div class="kpi-sub" id="ffb-kpi-mill-target">Target: -</div>
            </div>
        </div>
        <div class="grading-kpi-card">
            <div class="grading-kpi-icon yellow">
                <i class="fa-solid fa-bullseye"></i>
            </div>
            <div class="grading-kpi-info">
                <h4>Tingkat Kepatuhan Standar</h4>
                <div class="kpi-val" id="ffb-kpi-compliance">-</div>
                <div class="kpi-sub" id="ffb-kpi-compliance-sub">Bulan lolos batas toleransi</div>
            </div>
        </div>
    </div>

    <!-- Monthly Summary Table Card -->
    <div class="glass-card" style="overflow-x: auto; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
                <h3 style="margin: 0;" id="ffb-monthly-table-title">Tabel Rekapitulasi Grading Bulanan 1 Tahun</h3>
                <span id="ffb-monthly-table-subtitle" style="font-size: 0.8rem; color: var(--text-secondary);">Menampilkan capaian per estate untuk 12 bulan beserta rata-rata dan status toleransi.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; font-size: 0.75rem;">
                <span class="grading-badge good"><i class="fa-solid fa-check"></i> Sesuai Standar</span>
                <span class="grading-badge warn"><i class="fa-solid fa-triangle-exclamation"></i> Waspada</span>
                <span class="grading-badge danger"><i class="fa-solid fa-xmark"></i> Melebihi Toleransi</span>
            </div>
        </div>
        <div id="ffb-monthly-table-wrapper" class="table-responsive">
            <style>
                #ffb-monthly-grading-table th, #ffb-monthly-grading-table td {
                    padding: 6px 8px !important;
                    text-align: center;
                }
                #ffb-monthly-grading-table th {
                    white-space: nowrap;
                }
            </style>
            <table class="data-table" id="ffb-monthly-grading-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                    <tr>
                        <th style="width: 35px;">NO</th>
                        <th style="text-align: left; min-width: 140px;">ESTATE</th>
                        <th>JAN</th><th>FEB</th><th>MAR</th><th>APR</th>
                        <th>MEI</th><th>JUN</th><th>JUL</th><th>AGU</th>
                        <th>SEP</th><th>OKT</th><th>NOV</th><th>DES</th>
                        <th style="background-color: #e2e8f0; font-weight: bold; min-width: 90px;">RATA-RATA</th>
                        <th style="min-width: 100px;">TARGET</th>
                        <th style="min-width: 120px;">EVALUASI & TREND</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Injected by JS -->
                </tbody>
                <tfoot>
                    <!-- Injected by JS -->
                </tfoot>
            </table>
        </div>
    </div>

    <!-- Monthly Trend Chart Card -->
    <div class="glass-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
                <h3 style="margin: 0;" id="ffb-monthly-chart-title">Grafik Trend Kualitas Bulanan (12 Bulan)</h3>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Garis putus-putus menunjukkan batas standar toleransi. Klik legenda estate untuk menyembunyikan/menampilkan garis.</span>
            </div>
        </div>
        <div style="position: relative; height: 350px; width: 100%;">
            <canvas id="chart-ffb-monthly-trend"></canvas>
        </div>
    </div>

    <!-- Smart Diagnostic & Operational Insights -->
    <div class="grading-insight-box" id="ffb-monthly-insights-card">
        <h4><i class="fa-solid fa-lightbulb"></i> Analisis & Rekomendasi Operasional Mutu:</h4>
        <ul id="ffb-monthly-insights-list">
            <!-- Injected by JS -->
        </ul>
    </div>
</div>

<!-- Modal Input FFB Quality (Loose Fruit) -->
<div class="modal-overlay" id="modal-ffb-quality" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 500px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;" id="fq-modal-title">Tambah input Loose Fruit Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="hidden" id="fq-modal-edit-id"><input type="date" id="fq-modal-date" class="form-control">
            </div>
            <div class="form-group">
                <label>Pilihan Supply Chain</label>
                <select id="fq-modal-estate" class="form-control" required onchange="window.onFFBModalEstateChange(this.value)"></select>
            </div>
            <div class="form-group">
                <label>Divisi (Opsional)</label>
                <div id="fq-modal-divisi-container">
                    <input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Nomor Truk</label>
                <input type="text" id="fq-modal-truck" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Berat Sample (gram)</label>
                <input type="number" step="any" id="fq-modal-bg" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Segar (gram)</label>
                <input type="number" step="any" id="fq-modal-bd" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Tidak Segar (gram)</label>
                <input type="number" step="any" id="fq-modal-tsegar" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Brondolan Busuk (gram)</label>
                <input type="number" step="any" id="fq-modal-busuk" class="form-control" required oninput="calculateFFBModal()">
            </div>
            <div class="form-group">
                <label>Sampah (gram) (Otomatis)</label>
                <input type="number" step="any" id="fq-modal-sampah" class="form-control" readonly style="background-color: #f1f5f9;">
            </div>
            <button class="btn btn-primary" id="fq-modal-submit-btn" onclick="submitFFBModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
        </div>
    </div>
</div>

<!-- Modal Input FFB Crop Quality -->
<div class="modal-overlay" id="modal-ffb-crop-quality" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 500px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;" id="fqc-modal-title">Tambah input FFB Crop Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-crop-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="hidden" id="fqc-modal-edit-id"><input type="date" id="fqc-modal-date" class="form-control">
            </div>
            <div class="form-group">
                <label>Pilihan Supply Chain</label>
                <select id="fqc-modal-estate" class="form-control" required onchange="window.onFFBCropModalEstateChange(this.value)"></select>
            </div>
            <div class="form-group">
                <label>Divisi (Opsional)</label>
                <div id="fqc-modal-divisi-container">
                    <input type="text" id="fqc-modal-divisi" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Blok (Opsional)</label>
                <div id="fqc-modal-blok-container">
                    <input type="text" id="fqc-modal-blok" class="form-control" placeholder="(Optional)">
                </div>
            </div>
            <div class="form-group">
                <label>Nomor Truk</label>
                <input type="text" id="fqc-modal-truck" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Total Janjang</label>
                <input type="number" id="fqc-modal-total" class="form-control" required oninput="calculateFFBCropModal()">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="form-group">
                    <label>Unripe (Jjg)</label>
                    <input type="number" id="fqc-modal-unripe" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Underripe (Jjg)</label>
                    <input type="number" id="fqc-modal-underripe" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Normal Ripe (Otomatis)</label>
                    <input type="number" id="fqc-modal-normal" class="form-control" readonly style="background-color: #f1f5f9;">
                </div>
                <div class="form-group">
                    <label>Over Ripe (Jjg)</label>
                    <input type="number" id="fqc-modal-over" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Empty Bunch (Jjg)</label>
                    <input type="number" id="fqc-modal-empty" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group">
                    <label>Long Stalk (Jjg)</label>
                    <input type="number" id="fqc-modal-long" class="form-control" required oninput="calculateFFBCropModal()">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Rat Damage (Jjg)</label>
                    <input type="number" id="fqc-modal-rat" class="form-control" placeholder="0" oninput="calculateFFBCropModal()">
                </div>
            </div>
            <button class="btn btn-primary" id="fqc-modal-submit-btn" onclick="submitFFBCropModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="modal-fq-range" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 400px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;">Pilih Rentang Tanggal</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-fq-range').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <input type="hidden" id="fq-range-target">
            <div class="form-group">
                <label>Dari Tanggal</label>
                <input type="date" id="fq-range-start" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Hingga Tanggal</label>
                <input type="date" id="fq-range-end" class="form-control" required>
            </div>
            <button class="btn btn-primary" onclick="submitFqRangeModal()" style="width:100%; justify-content:center; margin-top:10px;">Tampilkan</button>
        </div>
    </div>
</div>
`;

window.ffbQualityData = [];
window.ffbCropQualityData = [];
window.activeFFBSubTab = 'loose';

window.switchFFBSubTab = function(tabId) {
    window.activeFFBSubTab = tabId;
    
    // Deactivate all
    document.querySelectorAll('.subsheet-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.subsheet-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    
    // Activate target button
    const btn = document.getElementById('tab-btn-ffb-' + tabId) || document.getElementById('tab-btn-' + tabId);
    if (btn) btn.classList.add('active');
    
    // Activate target content
    const content = document.getElementById('ffb-subsheet-' + tabId);
    if (content) {
        content.classList.add('active');
        content.style.display = 'block';
    }
    
    try {
        if (tabId === 'loose') {
            if (typeof window.loadFFBQuality === 'function') window.loadFFBQuality();
        } else if (tabId === 'crop') {
            if (typeof window.loadFFBCropQuality === 'function') window.loadFFBCropQuality();
        } else if (tabId === 'detail') {
            if (typeof window.loadFFQDetailData === 'function') window.loadFFQDetailData();
        } else if (tabId === 'monthly') {
            if (typeof window.loadFFBMonthlySummary === 'function') window.loadFFBMonthlySummary();
        }
    } catch(e) {
        console.error('Error switching FFB subtab:', e);
    }
};

window.renderFFBQualityView = function() {
    window.switchFFBSubTab(window.activeFFBSubTab || 'loose');

    // Disable inputs for read-only roles
    const readOnlyRoles = ['Senior Field Manager'];
    if (window.currentUser && readOnlyRoles.includes(window.currentUser.role)) {
        document.querySelectorAll('#view-container .btn-success').forEach(el => el.style.display = 'none');
    }
};

window.calculateFFBAverages = function() {
    let totBg = 0, totBd = 0, totTs = 0, totBb = 0, totSampah = 0;
    
    window.ffbQualityData.forEach(d => {
        totBg += parseFloat(d.bg_gram) || 0;
        totBd += parseFloat(d.bd_gram) || 0;
        totTs += parseFloat(d.t_segar_gram) || 0;
        totBb += parseFloat(d.busuk_gram) || 0;
        totSampah += parseFloat(d.sampah_gram) || 0;
    });

    const elTotBg = document.getElementById('fq-tot-bg');
    if (elTotBg) elTotBg.innerText = totBg.toFixed(0);
    const elTotBd = document.getElementById('fq-tot-bd');
    if (elTotBd) elTotBd.innerText = totBd.toFixed(0);
    const elTotTs = document.getElementById('fq-tot-ts');
    if (elTotTs) elTotTs.innerText = totTs.toFixed(0);
    const elTotBb = document.getElementById('fq-tot-bb');
    if (elTotBb) elTotBb.innerText = totBb.toFixed(0);
    const elTotSampah = document.getElementById('fq-tot-sampah');
    if (elTotSampah) elTotSampah.innerText = totSampah.toFixed(0);

    const elAvgBd = document.getElementById('fq-avg-bd');
    const elAvgTs = document.getElementById('fq-avg-ts');
    const elAvgBb = document.getElementById('fq-avg-bb');
    const elAvgSampah = document.getElementById('fq-avg-sampah');

    if (totBg > 0) {
        if (elAvgBd) elAvgBd.innerText = ((totBd / totBg) * 100).toFixed(1);
        if (elAvgTs) elAvgTs.innerText = ((totTs / totBg) * 100).toFixed(1);
        if (elAvgBb) elAvgBb.innerText = ((totBb / totBg) * 100).toFixed(1);
        if (elAvgSampah) elAvgSampah.innerText = ((totSampah / totBg) * 100).toFixed(1);
    } else {
        if (elAvgBd) elAvgBd.innerText = '0.0';
        if (elAvgTs) elAvgTs.innerText = '0.0';
        if (elAvgBb) elAvgBb.innerText = '0.0';
        if (elAvgSampah) elAvgSampah.innerText = '0.0';
    }
};

window.renderFFBTable = function(isSingleDay = true) {
    const tbody = document.querySelector('#ffb-quality-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let abbrMap = {};
    if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
        masterData.supply_chain_list.forEach(item => {
            abbrMap[item.name] = item.abbr;
        });
    }
    const getAbbr = (estName) => abbrMap[estName] || (estName ? estName.replace(' Estate', 'E') : '-');
    
    const userRole = window.currentUser ? window.currentUser.role : '';
    const canDelete = ['Admin', 'Administrator'].includes(userRole);
    const canEdit = ['Admin', 'Administrator', 'Grading', 'Analis', 'Supervisor Mill', 'Krani Mill', 'Manager Mill', 'Askep', 'Assistant'].includes(userRole) || !userRole;

    window.ffbQualityData.forEach((data, index) => {
        const tr = document.createElement('tr');
        let actionHtml = '';
        if (isSingleDay) {
            if (canEdit) {
                actionHtml += `<button class="btn btn-warning btn-sm" style="padding: 4px 8px; margin-right: 4px;" title="Edit Data" onclick="openFFBEditModal(${index})"><i class="fa-solid fa-pen-to-square"></i></button>`;
            }
            if (canDelete) {
                actionHtml += `<button class="btn btn-danger btn-sm" style="padding: 4px 8px;" title="Hapus Data" onclick="deleteFFBRow(${index}, ${data.id || 0})"><i class="fa-solid fa-trash"></i></button>`;
            }
            if (!actionHtml) actionHtml = '-';
        } else {
            actionHtml = '-';
        }

        tr.innerHTML = `
            <td>${data.date}</td>
            <td>${getAbbr(data.estate)}</td>
            <td>${data.divisi || '-'}</td>
            <td>${data.blok || '-'}</td>
            <td>${data.no_truck}</td>
            <td>${parseFloat(data.bg_gram || 0).toFixed(0)}</td>
            <td>${parseFloat(data.bd_gram || 0).toFixed(0)}</td>
            <td>${parseFloat(data.bd_percent || 0).toFixed(1)}</td>
            <td>${parseFloat(data.t_segar_gram || 0).toFixed(0)}</td>
            <td>${parseFloat(data.t_segar_percent || 0).toFixed(1)}</td>
            <td>${parseFloat(data.busuk_gram || 0).toFixed(0)}</td>
            <td>${parseFloat(data.busuk_percent || 0).toFixed(1)}</td>
            <td>${parseFloat(data.sampah_gram || 0).toFixed(0)}</td>
            <td>${parseFloat(data.sampah_percent || 0).toFixed(1)}</td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
    
    window.calculateFFBAverages();
};

window.deleteFFBRow = async function(index, id) {
    if (confirm('Hapus baris data grading Loose Fruit ini?')) {
        try {
            if (id) {
                await fetch(`/api/ffb_quality/${id}`, { method: 'DELETE' });
            } else {
                window.ffbQualityData.splice(index, 1);
                await window.saveFFBQuality();
            }
            const fqDateElem = document.getElementById('fq-date');
            const curDate = fqDateElem ? fqDateElem.value : window.getLocalDate();
            await window.loadFFBQuality(curDate, curDate);
        } catch(e) {
            console.error('Error deleting row:', e);
            alert('Gagal menghapus baris data.');
        }
    }
};

window.loadFFBQuality = async function(start, end) {
    if (!start) start = window.getLocalDate();
    if (!end) end = start;

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    if(typeof masterData === 'undefined' || !masterData.supply_chain) {
        if(typeof loadMasterData === 'function') await loadMasterData();
    }
    
    try {
        let res;
        if (start === end) {
            res = await fetch(`/api/ffb_quality/${encodeURIComponent(mill)}/${encodeURIComponent(start)}`);
        } else {
            res = await fetch(`/api/ffb_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
        }
        window.ffbQualityData = res.ok ? await res.json() : [];
    } catch(e) {
        console.error(e);
        window.ffbQualityData = [];
    }
    window.renderFFBTable(start === end);
};

window.saveFFBQuality = async function() {
    const date = document.getElementById('fq-modal-date')?.value || window.getLocalDate();
    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    try {
        await fetch('/api/ffb_quality', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, mill, entries: window.ffbQualityData })
        });
    } catch(e) {
        console.error('Gagal auto-save FFB Quality', e);
    }
};

window.onFFBModalDivisiChange = function(divisiName) {
    const blokDatalist = document.getElementById('fq-blok-list');
    const data = window.currentFFBEstateData;
    if (blokDatalist && data && data.blok) {
        let filteredBloks = data.blok;
        if (divisiName) {
            filteredBloks = data.blok.filter(b => b.divisi === divisiName);
        }
        blokDatalist.innerHTML = filteredBloks.map(b => `<option value="${b.name || b.blok}"></option>`).join('');
    }
};

window.onFFBModalEstateChange = async function(estate) {
    const containerDiv = document.getElementById('fq-modal-divisi-container');
    const containerBlok = document.getElementById('fq-modal-blok-container');
    if (!containerDiv) return;
    
    containerDiv.innerHTML = '<input type="text" class="form-control" disabled value="Loading...">';
    
    try {
        const res = await fetch(`${API_URL}/master/${encodeURIComponent(estate)}`);
        const data = await res.json();
        window.currentFFBEstateData = data;
        
        if (data && data.divisi && data.divisi.length > 0) {
            let sel = `<select id="fq-modal-divisi" class="form-control" onchange="window.onFFBModalDivisiChange(this.value)">`;
            sel += `<option value="">-- Pilih Divisi --</option>`;
            data.divisi.forEach(d => {
                sel += `<option value="${d.name}">${d.name}</option>`;
            });
            sel += `</select>`;
            containerDiv.innerHTML = sel;
        } else {
            containerDiv.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)" onchange="window.onFFBModalDivisiChange(this.value)">`;
        }
        
        if(containerBlok) {
            containerBlok.innerHTML = `
                <input type="text" id="fq-modal-blok" class="form-control" placeholder="(Optional)" list="fq-blok-list">
                <datalist id="fq-blok-list"></datalist>
            `;
        }
        
        const truckInput = document.getElementById('fq-modal-truck');
        if (truckInput) {
            let truckDatalist = document.getElementById('fq-truck-list');
            if (!truckDatalist) {
                truckInput.setAttribute('list', 'fq-truck-list');
                truckDatalist = document.createElement('datalist');
                truckDatalist.id = 'fq-truck-list';
                truckInput.parentNode.appendChild(truckDatalist);
            }
            if (data && data.truk) {
                truckDatalist.innerHTML = data.truk.map(t => `<option value="${t.plate_number || t.name || t.no_polisi || t.truck}"></option>`).join('');
            } else {
                truckDatalist.innerHTML = '';
            }
        }
        
        window.onFFBModalDivisiChange('');
        
    } catch(e) {
        console.error(e);
        containerDiv.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
        if(containerBlok) {
            containerBlok.innerHTML = `<input type="text" id="fq-modal-blok" class="form-control" placeholder="(Optional)">`;
        }
    }
};

window.openFFBModal = function() {
    const modal = document.getElementById('modal-ffb-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    
    const editIdEl = document.getElementById('fq-modal-edit-id');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('fq-modal-title');
    if (titleEl) titleEl.innerText = 'Tambah input Loose Fruit Quality';
    const btnEl = document.getElementById('fq-modal-submit-btn');
    if (btnEl) btnEl.innerText = 'Simpan';

    const fqDateElem = document.getElementById('fq-date');
    const dateEl = document.getElementById('fq-modal-date');
    if (dateEl) dateEl.value = (fqDateElem && fqDateElem.value) ? fqDateElem.value : window.getLocalDate();
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}">${s.estate}</option>`).join('')
        : '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    if (!estatesOpts) estatesOpts = '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    
    const estEl = document.getElementById('fq-modal-estate');
    if (estEl) estEl.innerHTML = estatesOpts;
    
    const divCont = document.getElementById('fq-modal-divisi-container');
    if (divCont) divCont.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
    const blokCont = document.getElementById('fq-modal-blok-container');
    if (blokCont) blokCont.innerHTML = `<input type="text" id="fq-modal-blok" class="form-control" placeholder="(Optional)">`;
    
    document.getElementById('fq-modal-truck').value = '';
    document.getElementById('fq-modal-bg').value = '';
    document.getElementById('fq-modal-bd').value = '';
    document.getElementById('fq-modal-tsegar').value = '';
    document.getElementById('fq-modal-busuk').value = '';
    document.getElementById('fq-modal-sampah').value = '0.00';

    if (estEl && estEl.value) {
        try { window.onFFBModalEstateChange(estEl.value); } catch(e){ console.error(e); }
    }
};

window.openFFBEditModal = function(index) {
    const data = window.ffbQualityData[index];
    if (!data) return;

    const modal = document.getElementById('modal-ffb-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }

    const editIdEl = document.getElementById('fq-modal-edit-id');
    if (editIdEl) editIdEl.value = data.id || '';
    const titleEl = document.getElementById('fq-modal-title');
    if (titleEl) titleEl.innerText = 'Edit Data Loose Fruit Quality';
    const btnEl = document.getElementById('fq-modal-submit-btn');
    if (btnEl) btnEl.innerText = 'Update Perubahan';

    const dateEl = document.getElementById('fq-modal-date');
    if (dateEl) dateEl.value = data.date;

    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}" ${s.estate === data.estate ? 'selected' : ''}>${s.estate}</option>`).join('')
        : `<option value="${data.estate}">${data.estate}</option>`;
    
    const estEl = document.getElementById('fq-modal-estate');
    if (estEl) estEl.innerHTML = estatesOpts;

    const divCont = document.getElementById('fq-modal-divisi-container');
    if (divCont) divCont.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" value="${data.divisi || ''}">`;
    const blokCont = document.getElementById('fq-modal-blok-container');
    if (blokCont) blokCont.innerHTML = `<input type="text" id="fq-modal-blok" class="form-control" value="${data.blok || ''}">`;

    document.getElementById('fq-modal-truck').value = data.no_truck || '';
    document.getElementById('fq-modal-bg').value = data.bg_gram || '';
    document.getElementById('fq-modal-bd').value = data.bd_gram || '';
    document.getElementById('fq-modal-tsegar').value = data.t_segar_gram || '';
    document.getElementById('fq-modal-busuk').value = data.busuk_gram || '';
    document.getElementById('fq-modal-sampah').value = data.sampah_gram || '0.00';

    window.calculateFFBModal();
};

window.calculateFFBModal = function() {
    const bg = parseFloat(document.getElementById('fq-modal-bg').value) || 0;
    const bd = parseFloat(document.getElementById('fq-modal-bd').value) || 0;
    const ts = parseFloat(document.getElementById('fq-modal-tsegar').value) || 0;
    const bb = parseFloat(document.getElementById('fq-modal-busuk').value) || 0;
    
    const sampah = bg - bd - ts - bb;
    const elSampah = document.getElementById('fq-modal-sampah');
    if (elSampah) elSampah.value = sampah.toFixed(2);
};

window.submitFFBModal = async function() {
    const modalDate = document.getElementById('fq-modal-date').value;
    const fqDateElem = document.getElementById('fq-date');
    const mainDate = fqDateElem ? fqDateElem.value : null;
    const saveDate = modalDate || mainDate || window.getLocalDate();

    const estate = document.getElementById('fq-modal-estate').value;
    const divisi = document.getElementById('fq-modal-divisi') ? document.getElementById('fq-modal-divisi').value : '';
    const blok = document.getElementById('fq-modal-blok') ? document.getElementById('fq-modal-blok').value : '';
    const truck = document.getElementById('fq-modal-truck').value;
    
    const bg = parseFloat(document.getElementById('fq-modal-bg').value) || 0;
    const bd = parseFloat(document.getElementById('fq-modal-bd').value) || 0;
    const ts = parseFloat(document.getElementById('fq-modal-tsegar').value) || 0;
    const bb = parseFloat(document.getElementById('fq-modal-busuk').value) || 0;
    const sampah = parseFloat(document.getElementById('fq-modal-sampah').value) || 0;
    
    if (!estate || !truck || bg <= 0) {
        alert("Mohon isi semua form yang diperlukan dengan benar (Berat sample harus > 0).");
        return;
    }
    
    if (bd > bg || ts > bg || bb > bg) {
        alert("Nilai rincian brondolan tidak boleh lebih besar dari Berat Sample.");
        return;
    }
    
    const actualSampah = bg - bd - ts - bb;
    if (actualSampah < 0) {
        alert("Sampah tidak boleh minus! Total rincian brondolan melebihi Berat Sample.");
        return;
    }

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';

    const editId = document.getElementById('fq-modal-edit-id')?.value;
    const payload = {
        date: saveDate,
        mill: mill,
        estate: estate,
        divisi: divisi,
        blok: blok,
        no_truck: truck,
        bg_gram: bg,
        bd_gram: bd,
        bd_percent: ((bd / bg) * 100),
        t_segar_gram: ts,
        t_segar_percent: ((ts / bg) * 100),
        busuk_gram: bb,
        busuk_percent: ((bb / bg) * 100),
        sampah_gram: actualSampah,
        sampah_percent: ((actualSampah / bg) * 100)
    };

    try {
        if (editId) {
            await fetch(`/api/ffb_quality/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch('/api/ffb_quality/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        document.getElementById('modal-ffb-quality').style.display = 'none';
        if (fqDateElem) fqDateElem.value = saveDate;
        await window.loadFFBQuality(saveDate, saveDate);
    } catch(e) {
        console.error('Error saving FFB quality:', e);
        alert('Gagal menyimpan data FFB quality.');
    }
};

// --- FFB CROP QUALITY ---
window.loadFFBCropQuality = async function(start, end) {
    if (!start) start = window.getLocalDate();
    if (!end) end = start;

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    try {
        let res;
        if (start === end) {
            res = await fetch(`/api/ffb_crop_quality/${encodeURIComponent(mill)}/${encodeURIComponent(start)}`);
        } else {
            res = await fetch(`/api/ffb_crop_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
        }
        window.ffbCropQualityData = res.ok ? await res.json() : [];

        // Fetch tonase range
        try {
            const tonaseRes = await fetch(`/api/tonase/range/${encodeURIComponent(mill)}/${encodeURIComponent(start)}/${encodeURIComponent(end)}`);
            const rawTonase = tonaseRes.ok ? await tonaseRes.json() : [];
            window.tonaseByEstCrop = {};
            rawTonase.forEach(row => {
                const e = row.estate || 'Unknown';
                const ton = (parseFloat(row.realized_kg) || 0) / 1000;
                window.tonaseByEstCrop[e] = (window.tonaseByEstCrop[e] || 0) + ton;
            });
        } catch(errTonase) {
            console.error('Error fetching tonase range for ffb crop', errTonase);
            window.tonaseByEstCrop = {};
        }
    } catch(e) {
        console.error(e);
        window.ffbCropQualityData = [];
    }
    if (window.renderFFBCropTable) window.renderFFBCropTable(start === end);
};

window.saveFFBCropQuality = async function() {
    const date = window.ffbCropQualityData.length > 0 ? window.ffbCropQualityData[0].date : window.getLocalDate();
    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    
    try {
        await fetch('/api/ffb_crop_quality', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, mill, entries: window.ffbCropQualityData })
        });
    } catch(e) {
        console.error('Gagal auto-save FFB Crop Quality', e);
    }
};

window.renderFFBCropTable = function(isSingleDay = true) {
    const rawTable = document.getElementById('ffb-crop-table');
    const sumTable = document.getElementById('ffb-crop-summary-table');
    if (!rawTable || !sumTable) return;
    
    let abbrMap = {};
    if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
        masterData.supply_chain_list.forEach(item => {
            abbrMap[item.name] = item.abbr;
        });
    }
    const getAbbr = (estName) => abbrMap[estName] || (estName ? estName.replace(' Estate', 'E') : '-');

    const userRole = window.currentUser ? window.currentUser.role : '';
    const canDelete = ['Admin', 'Administrator'].includes(userRole);
    const canEdit = ['Admin', 'Administrator', 'Grading', 'Analis', 'Supervisor Mill', 'Krani Mill', 'Manager Mill', 'Askep', 'Assistant'].includes(userRole) || !userRole;

    if (isSingleDay) {
        rawTable.style.display = 'table';
        sumTable.style.display = 'none';
        
        const tbody = rawTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        window.ffbCropQualityData.forEach((data, index) => {
            const tr = document.createElement('tr');
            const tot = parseInt(data.total_janjang) || 0;
            const p_unripe = tot > 0 ? (parseInt(data.unripe) / tot * 100).toFixed(1) : '0.0';
            const p_under = tot > 0 ? (parseInt(data.underripe) / tot * 100).toFixed(1) : '0.0';
            const p_normal = tot > 0 ? (parseInt(data.normal_ripe) / tot * 100).toFixed(1) : '0.0';
            const p_over = tot > 0 ? (parseInt(data.over_ripe) / tot * 100).toFixed(1) : '0.0';
            const p_empty = tot > 0 ? (parseInt(data.empty_bunch) / tot * 100).toFixed(1) : '0.0';
            const p_long = tot > 0 ? (parseInt(data.long_stalk) / tot * 100).toFixed(1) : '0.0';
            const p_rat = tot > 0 ? (parseInt(data.rat_damage || 0) / tot * 100).toFixed(1) : '0.0';
            
            let actionHtml = '';
            if (canEdit) {
                actionHtml += `<button class="btn btn-warning btn-sm" style="padding: 4px 8px; margin-right: 4px;" title="Edit Data" onclick="openFFBCropEditModal(${index})"><i class="fa-solid fa-pen-to-square"></i></button>`;
            }
            if (canDelete) {
                actionHtml += `<button class="btn btn-danger btn-sm" style="padding: 4px 8px;" title="Hapus Data" onclick="deleteFFBCropRow(${index}, ${data.id || 0})"><i class="fa-solid fa-trash"></i></button>`;
            }
            if (!actionHtml) actionHtml = '-';

            tr.innerHTML = `
                <td>${getAbbr(data.estate)}</td>
                <td>${data.divisi || '-'}</td>
                <td>${data.blok || '-'}</td>
                <td>${data.no_truck}</td>
                <td>${tot}</td>
                <td>${data.unripe || 0}</td><td>${p_unripe}</td>
                <td>${data.underripe || 0}</td><td>${p_under}</td>
                <td>${data.normal_ripe || 0}</td><td>${p_normal}</td>
                <td>${data.over_ripe || 0}</td><td>${p_over}</td>
                <td>${data.empty_bunch || 0}</td><td>${p_empty}</td>
                <td>${data.long_stalk || 0}</td><td>${p_long}</td>
                <td>${data.rat_damage || 0}</td><td>${p_rat}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
        
        window.calculateFFBCropAverages();
    } else {
        rawTable.style.display = 'none';
        sumTable.style.display = 'table';
        
        const tbody = sumTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        // aggregate by estate
        let estateAgg = {};
        window.ffbCropQualityData.forEach(d => {
            let est = d.estate;
            if (!estateAgg[est]) {
                estateAgg[est] = { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 };
            }
            estateAgg[est].tot += parseInt(d.total_janjang) || 0;
            estateAgg[est].unripe += parseInt(d.unripe) || 0;
            estateAgg[est].under += parseInt(d.underripe) || 0;
            estateAgg[est].normal += parseInt(d.normal_ripe) || 0;
            estateAgg[est].over += parseInt(d.over_ripe) || 0;
            estateAgg[est].empty += parseInt(d.empty_bunch) || 0;
            estateAgg[est].long += parseInt(d.long_stalk) || 0;
            estateAgg[est].rat += parseInt(d.rat_damage) || 0;
        });
        
        let t_tot = 0, t_unripe = 0, t_under = 0, t_normal = 0, t_over = 0, t_empty = 0, t_long = 0, t_rat = 0;
        
        for (let est in estateAgg) {
            let d = estateAgg[est];
            t_tot += d.tot;
            t_unripe += d.unripe;
            t_under += d.under;
            t_normal += d.normal;
            t_over += d.over;
            t_empty += d.empty;
            t_long += d.long;
            t_rat += d.rat;
            
            const p_unripe = d.tot > 0 ? (d.unripe / d.tot * 100) : 0;
            const p_under = d.tot > 0 ? (d.under / d.tot * 100) : 0;
            const p_normal = d.tot > 0 ? (d.normal / d.tot * 100) : 0;
            const p_over = d.tot > 0 ? (d.over / d.tot * 100) : 0;
            const p_empty = d.tot > 0 ? (d.empty / d.tot * 100) : 0;
            const p_long = d.tot > 0 ? (d.long / d.tot * 100) : 0;
            const p_rat = d.tot > 0 ? (d.rat / d.tot * 100) : 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:left;">${est}</td>
                <td style="font-weight:600;">${d.tot.toLocaleString('id-ID')}</td>
                <td style="${p_unripe > 0 ? 'color:red; font-weight:bold;' : ''}">${p_unripe.toFixed(2)}</td>
                <td style="${p_under > 3 ? 'color:red; font-weight:bold;' : ''}">${p_under.toFixed(2)}</td>
                <td style="${p_normal < 90 ? 'color:red; font-weight:bold;' : ''}">${p_normal.toFixed(2)}</td>
                <td style="${p_over > 7 ? 'color:red; font-weight:bold;' : ''}">${p_over.toFixed(2)}</td>
                <td style="${p_empty > 0 ? 'color:red; font-weight:bold;' : ''}">${p_empty.toFixed(2)}</td>
                <td style="${p_long >= 2 ? 'color:red; font-weight:bold;' : ''}">${p_long.toFixed(2)}</td>
                <td>${p_rat.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        }
        
        const pt_unripe = t_tot > 0 ? (t_unripe / t_tot * 100) : 0;
        const pt_under = t_tot > 0 ? (t_under / t_tot * 100) : 0;
        const pt_normal = t_tot > 0 ? (t_normal / t_tot * 100) : 0;
        const pt_over = t_tot > 0 ? (t_over / t_tot * 100) : 0;
        const pt_empty = t_tot > 0 ? (t_empty / t_tot * 100) : 0;
        const pt_long = t_tot > 0 ? (t_long / t_tot * 100) : 0;
        const pt_rat = t_tot > 0 ? (t_rat / t_tot * 100) : 0;
        
        const sumTotJjgEl = document.getElementById('fqc-sum-tot-jjg');
        if (sumTotJjgEl) sumTotJjgEl.innerText = t_tot.toLocaleString('id-ID');

        if (document.getElementById('fqc-sum-unripe')) document.getElementById('fqc-sum-unripe').innerText = pt_unripe.toFixed(2);
        if (document.getElementById('fqc-sum-under')) document.getElementById('fqc-sum-under').innerText = pt_under.toFixed(2);
        if (document.getElementById('fqc-sum-normal')) document.getElementById('fqc-sum-normal').innerText = pt_normal.toFixed(2);
        if (document.getElementById('fqc-sum-over')) document.getElementById('fqc-sum-over').innerText = pt_over.toFixed(2);
        if (document.getElementById('fqc-sum-empty')) document.getElementById('fqc-sum-empty').innerText = pt_empty.toFixed(2);
        if (document.getElementById('fqc-sum-long')) document.getElementById('fqc-sum-long').innerText = pt_long.toFixed(2);
        if (document.getElementById('fqc-sum-rat')) document.getElementById('fqc-sum-rat').innerText = pt_rat.toFixed(2);
    }
};

window.calculateFFBCropAverages = function() {
    let t_tot = 0, t_unripe = 0, t_under = 0, t_normal = 0, t_over = 0, t_empty = 0, t_long = 0, t_rat = 0;
    window.ffbCropQualityData.forEach(d => {
        t_tot += parseInt(d.total_janjang) || 0;
        t_unripe += parseInt(d.unripe) || 0;
        t_under += parseInt(d.underripe) || 0;
        t_normal += parseInt(d.normal_ripe) || 0;
        t_over += parseInt(d.over_ripe) || 0;
        t_empty += parseInt(d.empty_bunch) || 0;
        t_long += parseInt(d.long_stalk) || 0;
        t_rat += parseInt(d.rat_damage) || 0;
    });

    const elTotJjg = document.getElementById('fqc-tot-jjg');
    if (elTotJjg) {
        elTotJjg.innerText = t_tot;
        if (document.getElementById('fqc-tot-unripe')) document.getElementById('fqc-tot-unripe').innerText = t_unripe;
        if (document.getElementById('fqc-tot-under')) document.getElementById('fqc-tot-under').innerText = t_under;
        if (document.getElementById('fqc-tot-normal')) document.getElementById('fqc-tot-normal').innerText = t_normal;
        if (document.getElementById('fqc-tot-over')) document.getElementById('fqc-tot-over').innerText = t_over;
        if (document.getElementById('fqc-tot-empty')) document.getElementById('fqc-tot-empty').innerText = t_empty;
        if (document.getElementById('fqc-tot-long')) document.getElementById('fqc-tot-long').innerText = t_long;
        if (document.getElementById('fqc-tot-rat')) document.getElementById('fqc-tot-rat').innerText = t_rat;

        if (t_tot > 0) {
            if (document.getElementById('fqc-avg-unripe')) document.getElementById('fqc-avg-unripe').innerText = ((t_unripe / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-under')) document.getElementById('fqc-avg-under').innerText = ((t_under / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-normal')) document.getElementById('fqc-avg-normal').innerText = ((t_normal / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-over')) document.getElementById('fqc-avg-over').innerText = ((t_over / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-empty')) document.getElementById('fqc-avg-empty').innerText = ((t_empty / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-long')) document.getElementById('fqc-avg-long').innerText = ((t_long / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-rat')) document.getElementById('fqc-avg-rat').innerText = ((t_rat / t_tot) * 100).toFixed(1);
        } else {
            if (document.getElementById('fqc-avg-unripe')) document.getElementById('fqc-avg-unripe').innerText = '0.0';
            if (document.getElementById('fqc-avg-under')) document.getElementById('fqc-avg-under').innerText = '0.0';
            if (document.getElementById('fqc-avg-normal')) document.getElementById('fqc-avg-normal').innerText = '0.0';
            if (document.getElementById('fqc-avg-over')) document.getElementById('fqc-avg-over').innerText = '0.0';
            if (document.getElementById('fqc-avg-empty')) document.getElementById('fqc-avg-empty').innerText = '0.0';
            if (document.getElementById('fqc-avg-long')) document.getElementById('fqc-avg-long').innerText = '0.0';
            if (document.getElementById('fqc-avg-rat')) document.getElementById('fqc-avg-rat').innerText = '0.0';
        }
    }
};

window.deleteFFBCropRow = async function(index, id) {
    if (confirm('Hapus baris data grading Daily FFB Crop Quality ini?')) {
        try {
            if (id) {
                await fetch(`/api/ffb_crop_quality/${id}`, { method: 'DELETE' });
            } else {
                window.ffbCropQualityData.splice(index, 1);
                await window.saveFFBCropQuality();
            }
            const fqDateElem = document.getElementById('fq-date');
            const curDate = fqDateElem ? fqDateElem.value : window.getLocalDate();
            await window.loadFFBCropQuality(curDate, curDate);
        } catch(e) {
            console.error('Error deleting crop row:', e);
            alert('Gagal menghapus baris data.');
        }
    }
};

window.onFFBCropModalDivisiChange = function(divisiName) {
    const blokDatalist = document.getElementById('fqc-blok-list');
    const data = window.currentFFBCropEstateData;
    if (blokDatalist && data && data.blok) {
        let filteredBloks = data.blok;
        if (divisiName) {
            filteredBloks = data.blok.filter(b => b.divisi === divisiName);
        }
        blokDatalist.innerHTML = filteredBloks.map(b => `<option value="${b.name || b.blok}"></option>`).join('');
    }
};

window.onFFBCropModalEstateChange = async function(estate) {
    const containerDiv = document.getElementById('fqc-modal-divisi-container');
    const containerBlok = document.getElementById('fqc-modal-blok-container');
    if (!containerDiv) return;
    
    containerDiv.innerHTML = '<input type="text" class="form-control" disabled value="Loading...">';
    
    try {
        const res = await fetch(`${API_URL}/master/${encodeURIComponent(estate)}`);
        const data = await res.json();
        window.currentFFBCropEstateData = data;
        
        if (data && data.divisi && data.divisi.length > 0) {
            let sel = `<select id="fqc-modal-divisi" class="form-control" onchange="window.onFFBCropModalDivisiChange(this.value)">`;
            sel += `<option value="">-- Pilih Divisi --</option>`;
            data.divisi.forEach(d => {
                sel += `<option value="${d.name}">${d.name}</option>`;
            });
            sel += `</select>`;
            containerDiv.innerHTML = sel;
        } else {
            containerDiv.innerHTML = `<input type="text" id="fqc-modal-divisi" class="form-control" placeholder="(Optional)" onchange="window.onFFBCropModalDivisiChange(this.value)">`;
        }
        
        if(containerBlok) {
            containerBlok.innerHTML = `
                <input type="text" id="fqc-modal-blok" class="form-control" placeholder="(Optional)" list="fqc-blok-list">
                <datalist id="fqc-blok-list"></datalist>
            `;
        }
        
        const truckInput = document.getElementById('fqc-modal-truck');
        if (truckInput) {
            let truckDatalist = document.getElementById('fqc-truck-list');
            if (!truckDatalist) {
                truckInput.setAttribute('list', 'fqc-truck-list');
                truckDatalist = document.createElement('datalist');
                truckDatalist.id = 'fqc-truck-list';
                truckInput.parentNode.appendChild(truckDatalist);
            }
            if (data && data.truk) {
                truckDatalist.innerHTML = data.truk.map(t => `<option value="${t.plate_number || t.name || t.no_polisi || t.truck}"></option>`).join('');
            } else {
                truckDatalist.innerHTML = '';
            }
        }
        
        window.onFFBCropModalDivisiChange('');
        
    } catch(e) {
        console.error(e);
        containerDiv.innerHTML = `<input type="text" id="fqc-modal-divisi" class="form-control" placeholder="(Optional)">`;
        if(containerBlok) {
            containerBlok.innerHTML = `<input type="text" id="fqc-modal-blok" class="form-control" placeholder="(Optional)">`;
        }
    }
};

window.openFFBCropModal = function() {
    const modal = document.getElementById('modal-ffb-crop-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }

    const editIdEl = document.getElementById('fqc-modal-edit-id');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('fqc-modal-title');
    if (titleEl) titleEl.innerText = 'Tambah input FFB Crop Quality';
    const btnEl = document.getElementById('fqc-modal-submit-btn');
    if (btnEl) btnEl.innerText = 'Simpan';

    const fqDateElem = document.getElementById('fq-date');
    const date = fqDateElem ? fqDateElem.value : window.getLocalDate();
    document.getElementById('fqc-modal-date').value = date;
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}">${s.estate}</option>`).join('')
        : '<option value="">Kosong / Belum Load</option>';
    document.getElementById('fqc-modal-estate').innerHTML = estatesOpts;
    
    document.getElementById('fqc-modal-divisi-container').innerHTML = `<input type="text" id="fqc-modal-divisi" class="form-control" placeholder="(Optional)">`;
    document.getElementById('fqc-modal-blok-container').innerHTML = `<input type="text" id="fqc-modal-blok" class="form-control" placeholder="(Optional)">`;
    const currentEst = document.getElementById('fqc-modal-estate').value;
    if (currentEst) {
        window.onFFBCropModalEstateChange(currentEst);
    }
    document.getElementById('fqc-modal-truck').value = '';
    document.getElementById('fqc-modal-unripe').value = '';
    document.getElementById('fqc-modal-underripe').value = '';
    document.getElementById('fqc-modal-normal').value = '';
    document.getElementById('fqc-modal-over').value = '';
    document.getElementById('fqc-modal-empty').value = '';
    document.getElementById('fqc-modal-long').value = '';
    if (document.getElementById('fqc-modal-rat')) document.getElementById('fqc-modal-rat').value = '';
    document.getElementById('fqc-modal-total').value = '0';
};

window.openFFBCropEditModal = function(index) {
    const data = window.ffbCropQualityData[index];
    if (!data) return;

    const modal = document.getElementById('modal-ffb-crop-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }

    const editIdEl = document.getElementById('fqc-modal-edit-id');
    if (editIdEl) editIdEl.value = data.id || '';
    const titleEl = document.getElementById('fqc-modal-title');
    if (titleEl) titleEl.innerText = 'Edit Data FFB Crop Quality';
    const btnEl = document.getElementById('fqc-modal-submit-btn');
    if (btnEl) btnEl.innerText = 'Update Perubahan';

    document.getElementById('fqc-modal-date').value = data.date || window.getLocalDate();
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}" ${s.estate === data.estate ? 'selected' : ''}>${s.estate}</option>`).join('')
        : `<option value="${data.estate}">${data.estate}</option>`;
    document.getElementById('fqc-modal-estate').innerHTML = estatesOpts;

    document.getElementById('fqc-modal-divisi-container').innerHTML = `<input type="text" id="fqc-modal-divisi" class="form-control" value="${data.divisi || ''}">`;
    document.getElementById('fqc-modal-blok-container').innerHTML = `<input type="text" id="fqc-modal-blok" class="form-control" value="${data.blok || ''}">`;
    
    document.getElementById('fqc-modal-truck').value = data.no_truck || '';
    document.getElementById('fqc-modal-total').value = data.total_janjang || 0;
    document.getElementById('fqc-modal-unripe').value = data.unripe || 0;
    document.getElementById('fqc-modal-underripe').value = data.underripe || 0;
    document.getElementById('fqc-modal-normal').value = data.normal_ripe || 0;
    document.getElementById('fqc-modal-over').value = data.over_ripe || 0;
    document.getElementById('fqc-modal-empty').value = data.empty_bunch || 0;
    document.getElementById('fqc-modal-long').value = data.long_stalk || 0;
    if (document.getElementById('fqc-modal-rat')) document.getElementById('fqc-modal-rat').value = data.rat_damage || 0;

    window.calculateFFBCropModal();
};

window.calculateFFBCropModal = function() {
    const tot = parseInt(document.getElementById('fqc-modal-total').value) || 0;
    const u = parseInt(document.getElementById('fqc-modal-unripe').value) || 0;
    const un = parseInt(document.getElementById('fqc-modal-underripe').value) || 0;
    const o = parseInt(document.getElementById('fqc-modal-over').value) || 0;
    const e = parseInt(document.getElementById('fqc-modal-empty').value) || 0;
    
    let n = tot - (u + un + o + e);
    if (n < 0) n = 0;
    const elNormal = document.getElementById('fqc-modal-normal');
    if (elNormal) elNormal.value = n;
};

window.submitFFBCropModal = async function() {
    const modalDate = document.getElementById('fqc-modal-date').value;
    const fqDateElem = document.getElementById('fq-date');
    const mainDate = fqDateElem ? fqDateElem.value : null;
    const saveDate = modalDate || mainDate || window.getLocalDate();

    const estate = document.getElementById('fqc-modal-estate').value;
    const divisi = document.getElementById('fqc-modal-divisi') ? document.getElementById('fqc-modal-divisi').value : '';
    const blok = document.getElementById('fqc-modal-blok') ? document.getElementById('fqc-modal-blok').value : '';
    const truck = document.getElementById('fqc-modal-truck').value;
    
    const u = parseInt(document.getElementById('fqc-modal-unripe').value) || 0;
    const un = parseInt(document.getElementById('fqc-modal-underripe').value) || 0;
    const n = parseInt(document.getElementById('fqc-modal-normal').value) || 0;
    const o = parseInt(document.getElementById('fqc-modal-over').value) || 0;
    const e = parseInt(document.getElementById('fqc-modal-empty').value) || 0;
    const l = parseInt(document.getElementById('fqc-modal-long').value) || 0;
    const rat = parseInt(document.getElementById('fqc-modal-rat') ? document.getElementById('fqc-modal-rat').value : 0) || 0;
    const tot = parseInt(document.getElementById('fqc-modal-total').value) || 0;
    
    if (!estate || !truck) {
        alert("Mohon isi form Estate dan Truk dengan benar.");
        return;
    }

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';

    const editId = document.getElementById('fqc-modal-edit-id')?.value;
    const payload = {
        date: saveDate,
        mill: mill,
        estate: estate,
        divisi: divisi,
        blok: blok,
        no_truck: truck,
        unripe: u,
        underripe: un,
        normal_ripe: n,
        over_ripe: o,
        empty_bunch: e,
        long_stalk: l,
        rat_damage: rat,
        total_janjang: tot
    };

    try {
        if (editId) {
            await fetch(`/api/ffb_crop_quality/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch('/api/ffb_crop_quality/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        document.getElementById('modal-ffb-crop-quality').style.display = 'none';
        if (fqDateElem) fqDateElem.value = saveDate;
        await window.loadFFBCropQuality(saveDate, saveDate);
    } catch(err) {
        console.error('Error saving FFB crop quality:', err);
        alert('Gagal menyimpan data FFB Crop Quality.');
    }
};

// --- SUMMARY MONTHLY GRADING SYSTEM (12 BULAN PER ESTATE) ---

window.FFB_MONTHLY_CONFIGS = {
    // Crop Quality
    ripe: {
        category: 'crop',
        label: 'Ripe / Buah Matang (%)',
        unit: '%',
        targetLabel: 'Min. 90%',
        targetVal: 90,
        isMin: true,
        warnVal: 85,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.normal / crop.tot * 100) : null
    },
    unripe: {
        category: 'crop',
        label: 'Unripe / Buah Mentah (%)',
        unit: '%',
        targetLabel: 'Max. 0%',
        targetVal: 0,
        isMin: false,
        warnVal: 1.5,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.unripe / crop.tot * 100) : null
    },
    underripe: {
        category: 'crop',
        label: 'Under Ripe / Kurang Matang (%)',
        unit: '%',
        targetLabel: 'Max. 3%',
        targetVal: 3,
        isMin: false,
        warnVal: 4.5,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.under / crop.tot * 100) : null
    },
    over_ripe: {
        category: 'crop',
        label: 'Over Ripe / Lewat Matang (%)',
        unit: '%',
        targetLabel: 'Max. 7%',
        targetVal: 7,
        isMin: false,
        warnVal: 9.0,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.over / crop.tot * 100) : null
    },
    empty_bunch: {
        category: 'crop',
        label: 'Empty Bunch / Janjang Kosong (%)',
        unit: '%',
        targetLabel: 'Max. 0%',
        targetVal: 0,
        isMin: false,
        warnVal: 1.0,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.empty / crop.tot * 100) : null
    },
    long_stalk: {
        category: 'crop',
        label: 'Long Stalk / Tangkai Panjang (%)',
        unit: '%',
        targetLabel: '< 2%',
        targetVal: 2,
        isMin: false,
        warnVal: 3.5,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.long / crop.tot * 100) : null
    },
    rat_damage: {
        category: 'crop',
        label: 'Rat Damage / Serangan Tikus (%)',
        unit: '%',
        targetLabel: 'Max. 2%',
        targetVal: 2,
        isMin: false,
        warnVal: 3.5,
        decimals: 2,
        getValue: (crop) => (crop && crop.tot > 0) ? (crop.rat / crop.tot * 100) : null
    },
    total_janjang: {
        category: 'crop',
        label: 'Total Janjang Sampling (Janjang)',
        unit: ' Jjg',
        targetLabel: '-',
        targetVal: null,
        isMin: null,
        decimals: 0,
        getValue: (crop) => (crop && crop.tot > 0) ? crop.tot : null,
        isSum: true
    },
    // Loose Fruit Quality
    bd_percent: {
        category: 'loose',
        label: 'Brondolan Segar (%)',
        unit: '%',
        targetLabel: 'Min. 85%',
        targetVal: 85,
        isMin: true,
        warnVal: 75,
        decimals: 2,
        getValue: (crop, loose) => (loose && loose.bg > 0) ? (loose.bd / loose.bg * 100) : null
    },
    t_segar_percent: {
        category: 'loose',
        label: 'Brondolan Tidak Segar (%)',
        unit: '%',
        targetLabel: 'Max. 10%',
        targetVal: 10,
        isMin: false,
        warnVal: 15,
        decimals: 2,
        getValue: (crop, loose) => (loose && loose.bg > 0) ? (loose.ts / loose.bg * 100) : null
    },
    busuk_percent: {
        category: 'loose',
        label: 'Brondolan Busuk (%)',
        unit: '%',
        targetLabel: 'Max. 5%',
        targetVal: 5,
        isMin: false,
        warnVal: 8,
        decimals: 2,
        getValue: (crop, loose) => (loose && loose.bg > 0) ? (loose.bb / loose.bg * 100) : null
    },
    sampah_percent: {
        category: 'loose',
        label: 'Sampah Brondolan (%)',
        unit: '%',
        targetLabel: 'Max. 2%',
        targetVal: 2,
        isMin: false,
        warnVal: 4,
        decimals: 2,
        getValue: (crop, loose) => (loose && loose.bg > 0) ? (loose.sampah / loose.bg * 100) : null
    },
    bg_gram: {
        category: 'loose',
        label: 'Total Berat Sample (gram)',
        unit: ' g',
        targetLabel: '-',
        targetVal: null,
        isMin: null,
        decimals: 0,
        getValue: (crop, loose) => (loose && loose.bg > 0) ? loose.bg : null,
        isSum: true
    },
    // Composite Quality Index
    quality_index: {
        category: 'composite',
        label: 'Overall Grading Quality Score (0-100)',
        unit: ' Pts',
        targetLabel: 'Min. 85 Pts',
        targetVal: 85,
        isMin: true,
        warnVal: 75,
        decimals: 1,
        getValue: (crop, loose) => {
            if (!crop || crop.tot === 0) return null;
            let ripeP = (crop.normal / crop.tot) * 100;
            let unripeP = (crop.unripe / crop.tot) * 100;
            let underP = (crop.under / crop.tot) * 100;
            let overP = (crop.over / crop.tot) * 100;
            let emptyP = (crop.empty / crop.tot) * 100;
            let longP = (crop.long / crop.tot) * 100;
            let score = 100 - (unripeP * 5) - (underP * 2) - (emptyP * 5) - (Math.max(0, overP - 7) * 1.5) - (Math.max(0, longP - 2) * 2);
            if (loose && loose.bg > 0) {
                let busukP = (loose.bb / loose.bg) * 100;
                let sampahP = (loose.sampah / loose.bg) * 100;
                score -= (Math.max(0, busukP - 5) * 2) + (Math.max(0, sampahP - 2) * 2);
            }
            return Math.max(0, Math.min(100, score));
        }
    }
};

window.ffbYearlyCropData = [];
window.ffbYearlyLooseData = [];
window.ffbMonthlySummaryResult = null;
window.ffbMonthlyChartInstance = null;

window.onFFBMonthlyParamChange = function() {
    if (window.ffbMonthlySummaryResult) {
        window.processAndRenderFFBMonthlySummary();
    } else {
        window.loadFFBMonthlySummary();
    }
};

window.loadFFBMonthlySummary = async function() {
    const yearSelect = document.getElementById('ffb-monthly-year');
    const year = yearSelect ? yearSelect.value : '2026';
    
    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if (!mill) return;

    if (typeof masterData === 'undefined' || !masterData.supply_chain) {
        if (typeof loadMasterData === 'function') await loadMasterData();
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    try {
        const [cropRes, looseRes] = await Promise.all([
            fetch(`/api/ffb_crop_quality/range/${encodeURIComponent(mill)}/${startDate}/${endDate}`),
            fetch(`/api/ffb_quality/range/${encodeURIComponent(mill)}/${startDate}/${endDate}`)
        ]);

        window.ffbYearlyCropData = cropRes.ok ? await cropRes.json() : [];
        window.ffbYearlyLooseData = looseRes.ok ? await looseRes.json() : [];
    } catch (e) {
        console.error('Error loading yearly FFB data:', e);
        window.ffbYearlyCropData = [];
        window.ffbYearlyLooseData = [];
    }

    window.processAndRenderFFBMonthlySummary();
};

window.processAndRenderFFBMonthlySummary = function() {
    const yearSelect = document.getElementById('ffb-monthly-year');
    const year = yearSelect ? yearSelect.value : '2026';
    const paramSelect = document.getElementById('ffb-monthly-param');
    const paramKey = paramSelect ? paramSelect.value : 'ripe';
    const cfg = window.FFB_MONTHLY_CONFIGS[paramKey] || window.FFB_MONTHLY_CONFIGS.ripe;

    // Build estate list from supply chain + data
    let estateSet = new Set();
    if (typeof masterData !== 'undefined' && masterData.supply_chain) {
        masterData.supply_chain.filter(s => s.is_ffb !== false).forEach(s => estateSet.add(s.estate));
    }
    window.ffbYearlyCropData.forEach(d => { if (d.estate) estateSet.add(d.estate); });
    window.ffbYearlyLooseData.forEach(d => { if (d.estate) estateSet.add(d.estate); });

    const estateList = Array.from(estateSet).sort();

    // Data structures for aggregation
    // estateMonthStats[estate][monthNum (1-12)] = { crop: {...}, loose: {...} }
    let estateMonthStats = {};
    let millMonthStats = {};
    for (let m = 1; m <= 12; m++) {
        millMonthStats[m] = {
            crop: { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 },
            loose: { bg:0, bd:0, ts:0, bb:0, sampah:0 }
        };
    }

    estateList.forEach(est => {
        estateMonthStats[est] = {};
        for (let m = 1; m <= 12; m++) {
            estateMonthStats[est][m] = {
                crop: { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 },
                loose: { bg:0, bd:0, ts:0, bb:0, sampah:0 }
            };
        }
    });

    // Populate Crop Data
    window.ffbYearlyCropData.forEach(d => {
        if (!d.date || !d.estate) return;
        const est = d.estate;
        if (!estateMonthStats[est]) {
            estateMonthStats[est] = {};
            for (let m = 1; m <= 12; m++) {
                estateMonthStats[est][m] = {
                    crop: { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 },
                    loose: { bg:0, bd:0, ts:0, bb:0, sampah:0 }
                };
            }
        }
        const m = parseInt(d.date.split('-')[1], 10);
        if (m >= 1 && m <= 12) {
            const tot = parseInt(d.total_janjang) || 0;
            const u = parseInt(d.unripe) || 0;
            const under = parseInt(d.underripe) || 0;
            const norm = parseInt(d.normal_ripe) || 0;
            const over = parseInt(d.over_ripe) || 0;
            const emp = parseInt(d.empty_bunch) || 0;
            const long = parseInt(d.long_stalk) || 0;
            const rat = parseInt(d.rat_damage) || 0;

            estateMonthStats[est][m].crop.tot += tot;
            estateMonthStats[est][m].crop.unripe += u;
            estateMonthStats[est][m].crop.under += under;
            estateMonthStats[est][m].crop.normal += norm;
            estateMonthStats[est][m].crop.over += over;
            estateMonthStats[est][m].crop.empty += emp;
            estateMonthStats[est][m].crop.long += long;
            estateMonthStats[est][m].crop.rat += rat;

            millMonthStats[m].crop.tot += tot;
            millMonthStats[m].crop.unripe += u;
            millMonthStats[m].crop.under += under;
            millMonthStats[m].crop.normal += norm;
            millMonthStats[m].crop.over += over;
            millMonthStats[m].crop.empty += emp;
            millMonthStats[m].crop.long += long;
            millMonthStats[m].crop.rat += rat;
        }
    });

    // Populate Loose Fruit Data
    window.ffbYearlyLooseData.forEach(d => {
        if (!d.date || !d.estate) return;
        const est = d.estate;
        if (!estateMonthStats[est]) {
            estateMonthStats[est] = {};
            for (let m = 1; m <= 12; m++) {
                estateMonthStats[est][m] = {
                    crop: { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 },
                    loose: { bg:0, bd:0, ts:0, bb:0, sampah:0 }
                };
            }
        }
        const m = parseInt(d.date.split('-')[1], 10);
        if (m >= 1 && m <= 12) {
            const bg = parseFloat(d.bg_gram) || 0;
            const bd = parseFloat(d.bd_gram) || 0;
            const ts = parseFloat(d.t_segar_gram) || 0;
            const bb = parseFloat(d.busuk_gram) || 0;
            const sampah = parseFloat(d.sampah_gram) || 0;

            estateMonthStats[est][m].loose.bg += bg;
            estateMonthStats[est][m].loose.bd += bd;
            estateMonthStats[est][m].loose.ts += ts;
            estateMonthStats[est][m].loose.bb += bb;
            estateMonthStats[est][m].loose.sampah += sampah;

            millMonthStats[m].loose.bg += bg;
            millMonthStats[m].loose.bd += bd;
            millMonthStats[m].loose.ts += ts;
            millMonthStats[m].loose.bb += bb;
            millMonthStats[m].loose.sampah += sampah;
        }
    });

    // Helper to evaluate value against target
    const evaluateVal = (val) => {
        if (val === null || val === undefined || isNaN(val)) return 'none';
        if (cfg.isMin === null) return 'neutral';
        if (cfg.isMin === true) {
            if (val >= cfg.targetVal) return 'good';
            if (val >= cfg.warnVal) return 'warn';
            return 'danger';
        } else {
            if (val <= cfg.targetVal) return 'good';
            if (val <= cfg.warnVal) return 'warn';
            return 'danger';
        }
    };

    // Calculate processed values per estate
    let estateRows = [];
    estateList.forEach(est => {
        let monthlyVals = [];
        let totalWeight = 0;
        let weightedSum = 0;
        let simpleSum = 0;
        let countActive = 0;

        let annualCropAgg = { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 };
        let annualLooseAgg = { bg:0, bd:0, ts:0, bb:0, sampah:0 };

        for (let m = 1; m <= 12; m++) {
            const c = estateMonthStats[est][m].crop;
            const l = estateMonthStats[est][m].loose;

            annualCropAgg.tot += c.tot;
            annualCropAgg.unripe += c.unripe;
            annualCropAgg.under += c.under;
            annualCropAgg.normal += c.normal;
            annualCropAgg.over += c.over;
            annualCropAgg.empty += c.empty;
            annualCropAgg.long += c.long;
            annualCropAgg.rat += c.rat;

            annualLooseAgg.bg += l.bg;
            annualLooseAgg.bd += l.bd;
            annualLooseAgg.ts += l.ts;
            annualLooseAgg.bb += l.bb;
            annualLooseAgg.sampah += l.sampah;

            const val = cfg.getValue(c, l);
            monthlyVals.push(val);

            if (val !== null) {
                countActive++;
                simpleSum += val;
            }
        }

        // Calculate annual average/sum
        let annualVal = null;
        if (cfg.isSum) {
            annualVal = cfg.category === 'crop' ? annualCropAgg.tot : annualLooseAgg.bg;
        } else {
            annualVal = cfg.getValue(annualCropAgg, annualLooseAgg);
        }

        // Calculate trend (compare 2nd half or recent active vs earlier)
        let trend = 'neutral';
        let trendIcon = '➡️';
        let trendText = 'Stabil';
        let activeIndices = [];
        monthlyVals.forEach((v, idx) => { if (v !== null) activeIndices.push({ idx, v }); });

        if (activeIndices.length >= 2) {
            const mid = Math.floor(activeIndices.length / 2);
            const firstHalf = activeIndices.slice(0, mid);
            const secondHalf = activeIndices.slice(mid);

            const avg1 = firstHalf.reduce((s, x) => s + x.v, 0) / (firstHalf.length || 1);
            const avg2 = secondHalf.reduce((s, x) => s + x.v, 0) / (secondHalf.length || 1);
            const diff = avg2 - avg1;

            if (cfg.isMin === true) {
                if (diff >= 0.5) { trend = 'good'; trendIcon = '▲'; trendText = 'Membaik'; }
                else if (diff <= -0.5) { trend = 'danger'; trendIcon = '▼'; trendText = 'Menurun'; }
            } else if (cfg.isMin === false) {
                if (diff <= -0.3) { trend = 'good'; trendIcon = '▲'; trendText = 'Membaik'; }
                else if (diff >= 0.3) { trend = 'danger'; trendIcon = '▼'; trendText = 'Memburuk'; }
            }
        }

        const annualEval = evaluateVal(annualVal);

        estateRows.push({
            estate: est,
            monthlyVals,
            annualVal,
            annualEval,
            trend,
            trendIcon,
            trendText,
            countActive,
            annualCropAgg,
            annualLooseAgg
        });
    });

    // Mill Average Row calculation
    let millMonthlyVals = [];
    let millAnnualCropAgg = { tot:0, unripe:0, under:0, normal:0, over:0, empty:0, long:0, rat:0 };
    let millAnnualLooseAgg = { bg:0, bd:0, ts:0, bb:0, sampah:0 };

    for (let m = 1; m <= 12; m++) {
        const mc = millMonthStats[m].crop;
        const ml = millMonthStats[m].loose;

        millAnnualCropAgg.tot += mc.tot;
        millAnnualCropAgg.unripe += mc.unripe;
        millAnnualCropAgg.under += mc.under;
        millAnnualCropAgg.normal += mc.normal;
        millAnnualCropAgg.over += mc.over;
        millAnnualCropAgg.empty += mc.empty;
        millAnnualCropAgg.long += mc.long;
        millAnnualCropAgg.rat += mc.rat;

        millAnnualLooseAgg.bg += ml.bg;
        millAnnualLooseAgg.bd += ml.bd;
        millAnnualLooseAgg.ts += ml.ts;
        millAnnualLooseAgg.bb += ml.bb;
        millAnnualLooseAgg.sampah += ml.sampah;

        const val = cfg.getValue(mc, ml);
        millMonthlyVals.push(val);
    }

    let millAnnualVal = cfg.isSum 
        ? (cfg.category === 'crop' ? millAnnualCropAgg.tot : millAnnualLooseAgg.bg)
        : cfg.getValue(millAnnualCropAgg, millAnnualLooseAgg);
    
    let millAnnualEval = evaluateVal(millAnnualVal);

    window.ffbMonthlySummaryResult = {
        year,
        paramKey,
        cfg,
        estateRows,
        millMonthlyVals,
        millAnnualVal,
        millAnnualEval
    };

    // Render components
    window.renderFFBMonthlySummaryTable();
    window.renderFFBMonthlyKPIs();
    window.renderFFBMonthlyTrendChart();
    window.renderFFBMonthlyInsights();
};

window.renderFFBMonthlySummaryTable = function() {
    const res = window.ffbMonthlySummaryResult;
    if (!res) return;
    const { cfg, estateRows, millMonthlyVals, millAnnualVal, millAnnualEval } = res;

    const tbody = document.querySelector('#ffb-monthly-grading-table tbody');
    const tfoot = document.querySelector('#ffb-monthly-grading-table tfoot');
    if (!tbody || !tfoot) return;

    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    const formatVal = (v) => {
        if (v === null || v === undefined || isNaN(v)) return '-';
        if (cfg.decimals === 0) return Math.round(v).toLocaleString('id-ID');
        return v.toFixed(cfg.decimals);
    };

    const getCellClass = (status) => {
        if (status === 'good') return 'grading-cell-good';
        if (status === 'warn') return 'grading-cell-warn';
        if (status === 'danger') return 'grading-cell-danger';
        return 'grading-cell-neutral';
    };

    const evaluateVal = (val) => {
        if (val === null || val === undefined || isNaN(val)) return 'none';
        if (cfg.isMin === null) return 'neutral';
        if (cfg.isMin === true) {
            if (val >= cfg.targetVal) return 'good';
            if (val >= cfg.warnVal) return 'warn';
            return 'danger';
        } else {
            if (val <= cfg.targetVal) return 'good';
            if (val <= cfg.warnVal) return 'warn';
            return 'danger';
        }
    };

    // Abbr mapping for estate names
    let abbrMap = {};
    if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
        masterData.supply_chain_list.forEach(item => {
            abbrMap[item.name] = item.abbr;
        });
    }
    const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

    estateRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        
        let monthTds = '';
        row.monthlyVals.forEach(v => {
            const status = evaluateVal(v);
            const cls = getCellClass(status);
            monthTds += `<td class="${cls}">${formatVal(v)}</td>`;
        });

        const avgCls = getCellClass(row.annualEval);
        const evalBadgeCls = row.annualEval === 'good' ? 'good' : (row.annualEval === 'warn' ? 'warn' : (row.annualEval === 'danger' ? 'danger' : 'neutral'));
        
        let trendBadgeCls = row.trend === 'good' ? 'good' : (row.trend === 'danger' ? 'danger' : 'neutral');

        tr.innerHTML = `
            <td style="color:var(--text-secondary); font-weight:500;">${idx + 1}</td>
            <td style="text-align:left; font-weight:600;" title="${row.estate}">${getAbbr(row.estate)}</td>
            ${monthTds}
            <td class="${avgCls}" style="font-weight:bold; background-color:#f1f5f9;">${formatVal(row.annualVal)}</td>
            <td><span class="grading-badge neutral">${cfg.targetLabel}</span></td>
            <td>
                <span class="grading-badge ${trendBadgeCls}" style="margin-right:2px;">${row.trendIcon} ${row.trendText}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Mill Average Footer Row
    let millMonthTds = '';
    millMonthlyVals.forEach(v => {
        const status = evaluateVal(v);
        const cls = getCellClass(status);
        millMonthTds += `<td class="${cls}" style="font-weight:bold;">${formatVal(v)}</td>`;
    });
    const millAvgCls = getCellClass(millAnnualEval);

    tfoot.innerHTML = `
        <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
            <td colspan="2" style="text-align: right; font-weight:bold; letter-spacing:0.5px;">RATA-RATA PABRIK:</td>
            ${millMonthTds}
            <td class="${millAvgCls}" style="font-weight:bold; font-size:0.85rem; background-color:#e2e8f0;">${formatVal(millAnnualVal)}</td>
            <td><span class="grading-badge neutral">${cfg.targetLabel}</span></td>
            <td><span class="grading-badge ${millAnnualEval === 'good' ? 'good' : 'warn'}">Pabrik (YTD)</span></td>
        </tr>
    `;
};

window.renderFFBMonthlyKPIs = function() {
    const res = window.ffbMonthlySummaryResult;
    if (!res) return;
    const { cfg, estateRows, millAnnualVal, millAnnualEval } = res;

    const elTop = document.getElementById('ffb-kpi-top-estate');
    const elTopSub = document.getElementById('ffb-kpi-top-detail');
    const elWorst = document.getElementById('ffb-kpi-worst-estate');
    const elWorstSub = document.getElementById('ffb-kpi-worst-detail');
    const elMill = document.getElementById('ffb-kpi-mill-avg');
    const elMillSub = document.getElementById('ffb-kpi-mill-target');
    const elComp = document.getElementById('ffb-kpi-compliance');
    const elCompSub = document.getElementById('ffb-kpi-compliance-sub');

    if (!elTop || !elWorst || !elMill || !elComp) return;

    // Filter estates with valid annual value
    const validRows = estateRows.filter(r => r.annualVal !== null);

    if (validRows.length === 0) {
        elTop.innerText = '-';
        elTopSub.innerText = 'Belum ada data';
        elWorst.innerText = '-';
        elWorstSub.innerText = 'Belum ada data';
        elMill.innerText = '-';
        elMillSub.innerText = `Target: ${cfg.targetLabel}`;
        elComp.innerText = '0%';
        elCompSub.innerText = '0 bulan sampling';
        return;
    }

    // Sort by best to worst
    let sorted = [...validRows];
    if (cfg.isMin === true) {
        sorted.sort((a, b) => b.annualVal - a.annualVal);
    } else if (cfg.isMin === false) {
        sorted.sort((a, b) => a.annualVal - b.annualVal);
    } else {
        sorted.sort((a, b) => b.annualVal - a.annualVal);
    }

    const topPerformer = sorted[0];
    const worstPerformer = sorted[sorted.length - 1];

    const formatVal = (v) => {
        if (v === null || isNaN(v)) return '-';
        return cfg.decimals === 0 ? Math.round(v).toLocaleString('id-ID') : v.toFixed(cfg.decimals);
    };

    elTop.innerText = topPerformer.estate.replace(' Estate', '');
    elTopSub.innerText = `${cfg.label.split('/')[0]}: ${formatVal(topPerformer.annualVal)}${cfg.unit}`;

    if (sorted.length > 1 && worstPerformer.annualVal !== topPerformer.annualVal) {
        elWorst.innerText = worstPerformer.estate.replace(' Estate', '');
        elWorstSub.innerText = `${cfg.label.split('/')[0]}: ${formatVal(worstPerformer.annualVal)}${cfg.unit}`;
    } else {
        elWorst.innerText = 'N/A';
        elWorstSub.innerText = 'Semua estate seragam';
    }

    elMill.innerText = `${formatVal(millAnnualVal)}${cfg.unit}`;
    elMillSub.innerHTML = `Target: <strong>${cfg.targetLabel}</strong> (${millAnnualEval === 'good' ? '🟢 Tercapai' : '🔴 Perlu Peningkatan'})`;

    // Compliance rate
    let totalActiveMonths = 0;
    let compliantMonths = 0;
    validRows.forEach(r => {
        r.monthlyVals.forEach(v => {
            if (v !== null) {
                totalActiveMonths++;
                if (cfg.isMin === true && v >= cfg.targetVal) compliantMonths++;
                else if (cfg.isMin === false && v <= cfg.targetVal) compliantMonths++;
            }
        });
    });

    const compRate = totalActiveMonths > 0 ? (compliantMonths / totalActiveMonths * 100).toFixed(1) : '100.0';
    elComp.innerText = `${compRate}%`;
    elCompSub.innerText = `${compliantMonths} dari ${totalActiveMonths} bulan memenuhi standar`;
};

window.renderFFBMonthlyTrendChart = function() {
    const res = window.ffbMonthlySummaryResult;
    if (!res) return;
    const { cfg, estateRows, year } = res;

    const canvas = document.getElementById('chart-ffb-monthly-trend');
    if (!canvas) return;

    if (window.ffbMonthlyChartInstance) {
        window.ffbMonthlyChartInstance.destroy();
        window.ffbMonthlyChartInstance = null;
    }

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const colors = [
        '#0d8b4e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
        '#06b6d4', '#84cc16', '#e11d48', '#14b8a6', '#6366f1',
        '#d97706', '#64748b'
    ];

    let datasets = [];

    // Estate datasets
    estateRows.forEach((row, i) => {
        // Only include if has at least 1 month of data
        if (row.countActive > 0) {
            const color = colors[i % colors.length];
            datasets.push({
                label: row.estate.replace(' Estate', ''),
                data: row.monthlyVals,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2.5,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: false,
                spanGaps: true
            });
        }
    });

    // Add Target Baseline Line if applicable
    if (cfg.targetVal !== null) {
        datasets.push({
            label: `Batas Standar (${cfg.targetLabel})`,
            data: Array(12).fill(cfg.targetVal),
            borderColor: cfg.isMin ? '#10b981' : '#ef4444',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false
        });
    }

    const ctx = canvas.getContext('2d');
    window.ffbMonthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 14,
                        font: { size: 11, family: 'Inter' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += cfg.decimals === 0 ? Math.round(context.parsed.y).toLocaleString('id-ID') : context.parsed.y.toFixed(cfg.decimals);
                                label += cfg.unit;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: false // disable datalabels to keep chart clean
                }
            },
            scales: {
                x: {
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            return value + cfg.unit;
                        }
                    }
                }
            }
        }
    });
};

window.renderFFBMonthlyInsights = function() {
    const res = window.ffbMonthlySummaryResult;
    if (!res) return;
    const { cfg, estateRows } = res;

    const listEl = document.getElementById('ffb-monthly-insights-list');
    if (!listEl) return;

    const validRows = estateRows.filter(r => r.annualVal !== null);
    if (validRows.length === 0) {
        listEl.innerHTML = `<li><i class="fa-solid fa-info-circle"></i> Belum terdapat cukup data sampling pada tahun yang dipilih untuk menghasilkan analisis operasional.</li>`;
        return;
    }

    let insights = [];

    // 1. Top & Best Performers
    const sorted = [...validRows];
    if (cfg.isMin === true) sorted.sort((a, b) => b.annualVal - a.annualVal);
    else if (cfg.isMin === false) sorted.sort((a, b) => a.annualVal - b.annualVal);

    const top = sorted[0];
    const formatVal = (v) => cfg.decimals === 0 ? Math.round(v).toLocaleString('id-ID') : v.toFixed(cfg.decimals);

    insights.push(`<strong>Pencapaian Terbaik:</strong> Estate <strong>${top.estate}</strong> mencatatkan kinerja ${cfg.label} terbaik dengan rata-rata tahunan <strong>${formatVal(top.annualVal)}${cfg.unit}</strong> (${top.annualEval === 'good' ? 'memenuhi target' : 'mendekati target'}).`);

    // 2. Trend & Momentum
    const improvingEstates = validRows.filter(r => r.trend === 'good').map(r => r.estate.replace(' Estate', ''));
    const worseningEstates = validRows.filter(r => r.trend === 'danger').map(r => r.estate.replace(' Estate', ''));

    if (improvingEstates.length > 0) {
        insights.push(`<strong>Tren Positif:</strong> Estate <strong>${improvingEstates.join(', ')}</strong> menunjukkan perbaikan mutu yang konsisten pada periode semester kedua dibanding awal tahun.`);
    }
    if (worseningEstates.length > 0) {
        insights.push(`<strong>Perlu Evaluasi Lapangan:</strong> Estate <strong>${worseningEstates.join(', ')}</strong> mengalami penurunan performa pada parameter ini dalam beberapa bulan terakhir.`);
    }

    // 3. Operational Focus & Recommendations
    if (cfg.category === 'crop') {
        if (cfg.paramKey === 'unripe' || cfg.paramKey === 'underripe') {
            insights.push(`<strong>Rekomendasi Pemanenan:</strong> Perketat seleksi kriteria matang panen di TPH (Tempat Pengumpulan Hasil) dan berikan sanksi denda pada pemanen buah mentah untuk mencegah penurunan OER di pabrik.`);
        } else if (cfg.paramKey === 'long_stalk') {
            insights.push(`<strong>Rekomendasi Pemotongan Tangkai:</strong> Pengawasan pemotongan tangkai panjang (V-cut / cangkul) harus ditingkatkan di ancak panen agar efisiensi pengangkutan dan proses perebusan (sterilizer) optimal.`);
        } else {
            insights.push(`<strong>Rekomendasi Operasional:</strong> Pastikan rotasi panen dijaga pada interval 7-10 hari untuk memaksimalkan persentase buah matang (Ripe %) di atas 90%.`);
        }
    } else {
        insights.push(`<strong>Rekomendasi Kualitas Brondolan:</strong> Pastikan brondolan diangkut di hari yang sama dengan pemanenan (restan 0 hari) untuk mencegah kenaikan kadar asam lemak bebas (FFA) dan pembusukan.`);
    }

    listEl.innerHTML = insights.map(txt => `<li><i class="fa-solid fa-circle-check"></i> <div>${txt}</div></li>`).join('');
};

window.printMonthlyGrading = function() {
    if (typeof window.printMonthlyGradingReport === 'function') {
        window.printMonthlyGradingReport();
    } else {
        const res = window.ffbMonthlySummaryResult;
        const title = `Laporan Rekapitulasi Summary Monthly Grading ${res ? res.cfg.label : ''} - Tahun ${res ? res.year : ''}`;
        window.printTable('ffb-monthly-table-wrapper', title);
    }
};

window.exportMonthlyGradingCSV = function() {
    const res = window.ffbMonthlySummaryResult;
    if (!res) return;
    const { cfg, estateRows, millMonthlyVals, millAnnualVal, year } = res;

    let csv = `REKAPITULASI SUMMARY MONTHLY GRADING - ${cfg.label} (${year})\n\n`;
    csv += `No,Estate,Jan,Feb,Mar,Apr,Mei,Jun,Jul,Agu,Sep,Okt,Nov,Des,Rata-Rata,Target,Evaluasi & Trend\n`;

    const formatVal = (v) => (v === null || isNaN(v)) ? '' : (cfg.decimals === 0 ? Math.round(v) : v.toFixed(cfg.decimals));

    estateRows.forEach((r, idx) => {
        let rowData = [
            idx + 1,
            `"${r.estate}"`,
            ...r.monthlyVals.map(v => formatVal(v)),
            formatVal(r.annualVal),
            `"${cfg.targetLabel}"`,
            `"${r.trendText}"`
        ];
        csv += rowData.join(',') + '\n';
    });

    let millRow = [
        '',
        '"RATA-RATA PABRIK"',
        ...millMonthlyVals.map(v => formatVal(v)),
        formatVal(millAnnualVal),
        `"${cfg.targetLabel}"`,
        '"Pabrik"'
    ];
    csv += millRow.join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Monthly_Grading_${cfg.category}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};




// 4. MILL DASHBOARD
views.mill_dashboard = `
<div class="animate-fade-in" style="padding-top: 10px;">

<!-- Dashboard Extra Sections (Processing & Water) -->
<div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
    <div style="display: flex; flex-direction: column;">
        <h2 style="margin: 0;">Processing & Water Analysis</h2>
        <span id="dash-extra-date-label" style="font-size: 0.9em; color: var(--text-secondary); font-weight: bold;">Data Hari Ini</span>
    </div>
    <button class="btn btn-primary btn-sm" onclick="document.getElementById('dashboard-extra-date-modal').style.display='flex';"><i class="fa-solid fa-clock-rotate-left"></i> Historical Pop Up</button>
</div>

<div class="glass-card" style="margin-top: 15px;">
    <h3>Liquid Monitoring Historical Grafik</h3>
    <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr); gap: 15px;">
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-oil-cot-cst"></canvas>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-cst-ketebalan"></canvas>
        </div>
        <div class="chart-container" style="position: relative; height:300px; width:100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <canvas id="chart-temp-cot-cst"></canvas>
        </div>
    </div>
</div>

<div class="glass-card" style="margin-top: 20px;">
    <h3>Chart Monitoring FFA Today</h3>
    <div class="chart-container" style="position: relative; height:300px; width:100%; max-width: 600px; margin: 0 auto;">
        <canvas id="chart-ffa-today"></canvas>
    </div>
</div>

<div class="glass-card" style="margin-top: 20px;">
    <h3>Korelasi FFB Quality vs FFA Washing Plant (Bulan Berjalan)</h3>
    <div class="chart-container" style="position: relative; height:350px; width:100%; max-width: 800px; margin: 0 auto;">
        <canvas id="chart-ffb-ffa-correlation"></canvas>
    </div>
    
    <h3 style="margin-top: 30px;">Tabel Data Bulanan</h3>
    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Rata-rata Brondolan Segar (%)</th>
                    <th>Rata-rata FFA After Washing Plant (%)</th>
                </tr>
            </thead>
            <tbody id="table-ffb-ffa-correlation-body">
                <tr><td colspan="3" class="text-center">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div class="dashboard-grid" style="grid-template-columns: minmax(0, 1fr); gap: 15px; margin-top: 20px;">
    <div class="glass-card" style="overflow: hidden;">
        <h3>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" id="dash-table-water-sebelum">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <div class="glass-card" style="overflow: hidden;">
        <h3>1.2 Analisa Air Boiler (Rata-rata)</h3>
        <div class="table-responsive" style="overflow-x: auto;">
            <table class="data-table" id="dash-table-water-boiler">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>

<div class="glass-card" id="ffb-received-card" style="margin-top: 20px; display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
        <h3 style="margin: 0;">FFB Received After <span id="ffb-received-time-label">6pm</span> by Estates</h3>
        <select id="ffb-received-time-select" class="form-control" style="width: auto;" onchange="if(window.renderFfbReceivedChart) window.renderFfbReceivedChart()">
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
            <option value="17:00">17:00</option>
            <option value="18:00" selected>18:00</option>
            <option value="19:00">19:00</option>
            <option value="20:00">20:00</option>
        </select>
    </div>
    <div style="position: relative; height: 300px; width: 100%;">
        <canvas id="chart-ffb-received"></canvas>
    </div>
</div>

<!-- Dashboard Extra Date Picker Modal -->
<div class="modal-overlay" id="dashboard-extra-date-modal" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 400px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;">Pilih Tanggal Historical</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('dashboard-extra-date-modal').style.display = 'none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <input type="date" id="dash-extra-date-input" class="form-control">
            <button class="btn btn-primary" onclick="loadDashboardExtraData(document.getElementById('dash-extra-date-input').value); document.getElementById('dashboard-extra-date-modal').style.display='none';">Load Data</button>
        </div>
    </div>
</div>

</div>
`;

window.millCharts = {};

window.renderMillDashboardView = async function() {
    if(window.loadDashboardExtraData) window.loadDashboardExtraData();
};

window.loadDashboardExtraData = async function(dateOverride) {
    let date = dateOverride || document.getElementById('dash-date')?.value;
    if(!date) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        date = `${yyyy}-${mm}-${dd}`;
    }
    
    // Update header text if we're not loading today's data by default
    let headerEl = document.getElementById('dash-extra-header');
    if (headerEl) {
        if (dateOverride) {
            headerEl.innerText = 'Data Tanggal: ' + dateOverride;
        } else {
            headerEl.innerText = 'Data Hari Ini';
        }
    }
    
    let mill = window.currentUser && window.currentUser.estate && window.currentUser.estate !== 'Semua Estate (Khusus Admin)' 
               ? window.currentUser.estate 
               : 'Bunga Tanjung Mill';
               
    const dashMonth = date.substring(0, 7);
    
    let pL = fetch(`/api/processing/liquid/${mill}/${date}`);
    let pF = fetch(`/api/processing/ffa/${mill}/${date}`);
    let pWMonth = fetch(`/api/water/dashboard/month/${mill}/${dashMonth}`);
    
    let [resL, resF, resWMonth] = await Promise.all([pL, pF, pWMonth].map(p => p.catch(e => null)));
    
    let liquidData = resL && resL.ok ? await resL.json() : [];
    let ffaData = resF && resF.ok ? await resF.json() : [];
    let monthlyWaterData = resWMonth && resWMonth.ok ? await resWMonth.json() : { water_analysis: [], boiler_averages: {} };
    
    // Sort Liquid and FFA data
    let sortFn = (a,b) => {
        let tA = parseInt((a.time_hour || '0').split(':')[0]) || 0;
        let tB = parseInt((b.time_hour || '0').split(':')[0]) || 0;
        if(tA < 7) tA += 24;
        if(tB < 7) tB += 24;
        return tA - tB;
    };
    liquidData.sort(sortFn);
    ffaData.sort(sortFn);
    
    // Helper to get days in month
    const parts = date.split('-');
    const daysInMonth = new Date(parts[0], parts[1], 0).getDate();
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

    // 1. Fill Water Sebelum Proses (Monthly)
    let dashWaterSebelumTable = document.getElementById('dash-table-water-sebelum');
    if (dashWaterSebelumTable) {
        let thead = dashWaterSebelumTable.querySelector('thead');
        let tbody = dashWaterSebelumTable.querySelector('tbody');
        
        // Map data by date (YYYY-MM-DD)
        const waterSebelumMap = {};
        if (monthlyWaterData.water_analysis) {
            monthlyWaterData.water_analysis.forEach(w => {
                waterSebelumMap[w.date] = w;
            });
        }

        // Header
        let headRow = `<tr><th style="min-width: 200px; position: sticky; left: 0; background-color: #fff; z-index: 1;">PARAMETER</th>`;
        daysArray.forEach(d => {
            headRow += `<th style="min-width: 50px; text-align: center;">${d}</th>`;
        });
        headRow += `</tr>`;
        thead.innerHTML = headRow;

        const fieldsSebelum = [
            { label: '=> RAW WATER', isHeader: true, bg: '#f1f5f9' },
            { id: 'raw_ph', label: 'PH' },
            { id: 'raw_tds', label: 'Tds' },
            { id: 'raw_thardness', label: 'T.hardness' },
            { id: 'raw_silica', label: 'Silica/Sio2' },
            { id: 'raw_turbidity', label: 'Turbidity' },
            { id: 'raw_cloride', label: 'Cloride' },
            { label: '=> WTP / clarifier', isHeader: true, bg: '#f1f5f9' },
            { id: 'wtp_ph', label: 'PH' },
            { id: 'wtp_tds', label: 'Tds' },
            { id: 'wtp_turbidity', label: 'Turbidity(<10)' },
            { id: 'wtp_cloride', label: 'Cloride' },
            { label: '=> Sand Filter', isHeader: true, bg: '#f1f5f9' },
            { id: 'sand_ph', label: 'PH' },
            { id: 'sand_tds', label: 'Tds' },
            { id: 'sand_turbidity', label: 'Turbidity(<10)' },
            { id: 'sand_cloride', label: 'Cloride' },
            { label: 'Demin plant no.1 atau no.2 (pilihan)', isHeader: true, bg: '#f1f5f9' },
            { label: '=> CATION', isHeader: true, bg: '#f8fafc' },
            { id: 'cation_ph', label: 'PH(<5.5)' },
            { id: 'cation_tds', label: 'Tds' },
            { id: 'cation_thardness', label: 'T.hardness(Trace)' },
            { label: '=> ANION', isHeader: true, bg: '#f8fafc' },
            { id: 'anion_ph', label: 'PH(6.5 - 9.5)' },
            { id: 'anion_tds', label: 'Tds(<100)' },
            { id: 'anion_silica', label: 'SiO2/silica(<2.5)' },
            { label: '=> FEED TANK', isHeader: true, bg: '#f8fafc' },
            { id: 'feed_ph', label: 'PH(6.5 - 9.5)' },
            { id: 'feed_tds', label: 'Tds(<100)' },
            { id: 'feed_thardness', label: 'T.hardness(Trace)' },
            { id: 'feed_silica', label: 'Silica/SiO2(<5)' },
            { id: 'feed_cloride', label: 'Cloride' }
        ];

        let bodyHtml = '';
        fieldsSebelum.forEach(f => {
            if (f.isHeader) {
                bodyHtml += `<tr style="background-color: ${f.bg};"><td colspan="${daysArray.length + 1}" style="position: sticky; left: 0; z-index: 1;"><strong>${f.label}</strong></td></tr>`;
            } else {
                let rowHtml = `<tr><td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">${f.label}</td>`;
                daysArray.forEach(d => {
                    const dateKey = `${parts[0]}-${parts[1]}-${String(d).padStart(2, '0')}`;
                    let val = waterSebelumMap[dateKey] && waterSebelumMap[dateKey][f.id] !== null && waterSebelumMap[dateKey][f.id] !== undefined ? waterSebelumMap[dateKey][f.id] : '-';
                    if (val !== '-' && !f.id.endsWith('_ph')) {
                        let num = parseFloat(val);
                        if (!isNaN(num)) val = Math.round(num);
                    }
                    rowHtml += `<td style="text-align: center;">${val}</td>`;
                });
                rowHtml += `</tr>`;
                bodyHtml += rowHtml;
            }
        });
        tbody.innerHTML = bodyHtml;
    }
    
    // 2. Boiler dynamic (Monthly)
    let dashBoilerTable = document.getElementById('dash-table-water-boiler');
    if (dashBoilerTable) {
        let thead = dashBoilerTable.querySelector('thead');
        let tbody = dashBoilerTable.querySelector('tbody');
        
        let headRow = `<tr><th style="min-width: 200px; position: sticky; left: 0; background-color: #fff; z-index: 1;">PARAMETER</th>`;
        daysArray.forEach(d => {
            headRow += `<th style="min-width: 50px; text-align: center;">${d}</th>`;
        });
        headRow += `</tr>`;
        thead.innerHTML = headRow;
        
        let bodyHtml = '';
        const params = [
            { id: 'ph', label: 'PH(10.5-11.5)' },
            { id: 'tds', label: 'Tds(<1800)' },
            { id: 'palkanity', label: 'P.alkanity(300 - 700)' },
            { id: 'malkanity', label: 'M.alkanity(<1300)' },
            { id: 'oalkanity', label: 'O.alkanity(>2.5xsilica)' },
            { id: 'thardness', label: 'T.hardness' },
            { id: 'silica', label: 'Silica/SiO2(<125)' },
            { id: 'phospate', label: 'Phospate/PO4(30 - 70)' },
            { id: 'sulfite', label: 'Sulfite/SO3(30 - 70)' },
            { id: 'chloride', label: 'Chloride' }
        ];
        
        params.forEach(p => {
            let rowHtml = `<tr><td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">${p.label}</td>`;
            daysArray.forEach(d => {
                const dateKey = `${parts[0]}-${parts[1]}-${String(d).padStart(2, '0')}`;
                const boilerAvg = monthlyWaterData.boiler_averages ? monthlyWaterData.boiler_averages[dateKey] : null;
                let val = boilerAvg && boilerAvg[p.id] !== undefined ? boilerAvg[p.id] : '-';
                if (val !== '-' && p.id !== 'ph') {
                    let num = parseFloat(val);
                    if (!isNaN(num)) val = Math.round(num);
                }
                rowHtml += `<td style="text-align: center;">${val}</td>`;
            });
            rowHtml += `</tr>`;
            bodyHtml += rowHtml;
        });
        tbody.innerHTML = bodyHtml;
    }

    // ==========================================
    // FFB QUALITY VS FFA CORRELATION CHART (Bulan Berjalan)
    // ==========================================
    try {
        const dashMonth = date.substring(0, 7);
        const ffbRes = await fetch(`/api/ffb_quality/month/${encodeURIComponent(mill)}/${dashMonth}`);
        const ffbMonthData = await ffbRes.json();
        
        const dashboardRes = await fetch(`/api/mill_dashboard/${encodeURIComponent(mill)}/${date}`);
        const dashboardData = await dashboardRes.json();
        const ffaMonthData = dashboardData.ffa_month;
        
        const ffaMap = {}; // date -> avg ffa_a
        if (ffaMonthData) {
            const ffaByDate = {};
            ffaMonthData.forEach(f => {
                if (f.ffa_a !== null && !isNaN(f.ffa_a) && f.ffa_a !== '') {
                    if(!ffaByDate[f.date]) ffaByDate[f.date] = [];
                    ffaByDate[f.date].push(parseFloat(f.ffa_a));
                }
            });
            for (let d in ffaByDate) {
                ffaMap[d] = ffaByDate[d].reduce((a, b) => a + b, 0) / ffaByDate[d].length;
            }
        }

        const ffbMap = {}; // date -> avg brondolan segar %
        if (ffbMonthData) {
            const ffbByDate = {};
            ffbMonthData.forEach(f => {
                if(!ffbByDate[f.date]) ffbByDate[f.date] = { bd: 0, bg: 0 };
                ffbByDate[f.date].bd += parseFloat(f.bd_gram) || 0;
                ffbByDate[f.date].bg += parseFloat(f.bg_gram) || 0;
            });
            for (let d in ffbByDate) {
                if (ffbByDate[d].bg > 0) {
                    ffbMap[d] = (ffbByDate[d].bd / ffbByDate[d].bg) * 100;
                }
            }
        }

        // Scatter data points
        const scatterPoints = [];
        const allDates = new Set([...Object.keys(ffaMap), ...Object.keys(ffbMap)]);
        const sortedDates = Array.from(allDates).sort();
        
        sortedDates.forEach(d => {
            if (ffbMap[d] !== undefined && ffaMap[d] !== undefined) {
                scatterPoints.push({ x: ffbMap[d], y: ffaMap[d] });
            }
        });

        // Determine max days in current month
        let daysInMonth = 31;
        if (dashMonth) {
            let [y, m] = dashMonth.split('-');
            daysInMonth = new Date(y, m, 0).getDate();
        }

        // Draw Horizontal Table
        const tableContainer = document.getElementById('table-ffb-ffa-correlation-body');
        if (tableContainer) {
            let theadHtml = `<tr><th style="min-width:30px;">No</th><th style="min-width:150px;">Parameter</th>`;
            for (let i = 1; i <= daysInMonth; i++) {
                theadHtml += `<th style="min-width:40px;">${i}</th>`;
            }
            theadHtml += `</tr>`;
            
            let rowBron = `<tr><td class="text-center">1</td><td>% Brondolan segar</td>`;
            let rowFfa = `<tr><td class="text-center">2</td><td>FFA</td>`;
            
            for (let i = 1; i <= daysInMonth; i++) {
                let dayStr = String(i).padStart(2, '0');
                let fullDate = `${dashMonth}-${dayStr}`;
                
                let valBron = ffbMap[fullDate] !== undefined ? ffbMap[fullDate].toFixed(2) : '';
                let valFfa = ffaMap[fullDate] !== undefined ? ffaMap[fullDate].toFixed(2) : '';
                
                rowBron += `<td class="text-center">${valBron}</td>`;
                rowFfa += `<td class="text-center">${valFfa}</td>`;
            }
            rowBron += `</tr>`;
            rowFfa += `</tr>`;
            
            tableContainer.innerHTML = `<thead>${theadHtml}</thead><tbody>${rowBron}${rowFfa}</tbody>`;
        }

        // Linear regression
        let trendlineData = [];
        if (scatterPoints.length > 1) {
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            let n = scatterPoints.length;
            scatterPoints.forEach(p => {
                sumX += p.x;
                sumY += p.y;
                sumXY += p.x * p.y;
                sumXX += p.x * p.x;
            });
            let denom = (n * sumXX - sumX * sumX);
            if (denom !== 0) {
                let slope = (n * sumXY - sumX * sumY) / denom;
                let intercept = (sumY - slope * sumX) / n;
                
                let minX = Math.min(...scatterPoints.map(p => p.x));
                let maxX = Math.max(...scatterPoints.map(p => p.x));
                minX = Math.max(0, minX - 5);
                maxX = Math.min(100, maxX + 5);
                
                trendlineData = [
                    { x: minX, y: slope * minX + intercept },
                    { x: maxX, y: slope * maxX + intercept }
                ];
            }
        }

        // Draw chart
        if (window.dashProcessingCharts && window.dashProcessingCharts['chart-ffb-ffa-correlation']) {
            window.dashProcessingCharts['chart-ffb-ffa-correlation'].destroy();
        }
        if (document.getElementById('chart-ffb-ffa-correlation')) {
            if (!window.dashProcessingCharts) window.dashProcessingCharts = {};
            window.dashProcessingCharts['chart-ffb-ffa-correlation'] = new Chart(document.getElementById('chart-ffb-ffa-correlation').getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Rata-rata Harian',
                        data: scatterPoints,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }, {
                        label: 'Garis Tren (Korelasi)',
                        type: 'line',
                        data: trendlineData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: { display: true, text: 'Rata-rata Brondolan Segar (%)', font: { weight: 'bold' } },
                            min: 0,
                            max: 100
                        },
                        y: {
                            title: { display: true, text: 'Rata-rata FFA After Washing Plant (%)', font: { weight: 'bold' } },
                            min: 0,
                            max: 8
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if(context.datasetIndex === 1) return '';
                                    return `Bron. Segar: ${context.parsed.x.toFixed(2)}%, FFA: ${context.parsed.y.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch(err) {
        console.error("Gagal load korelasi ffb vs ffa", err);
    }

    // Render Charts
    window.renderDashboardProcessingCharts(liquidData, ffaData);
};

window.renderDashboardProcessingCharts = function(liquidData, ffaData) {
    const labelsLiquid = liquidData.map(d => d.time_hour || '');
    const dataLiquidCotOil = liquidData.map(d => parseFloat(d.cot_oil) || 0);
    const dataLiquidCstOil = liquidData.map(d => parseFloat(d.cst1_oil) || 0);
    const dataLiquidCstMinyak = liquidData.map(d => parseFloat(d.cst1_level_minyak) || 0);
    const dataLiquidCotTemp = liquidData.map(d => parseFloat(d.cot_temp) || 0);
    const dataLiquidCstTemp = liquidData.map(d => parseFloat(d.cst1_temp) || 0);
    
    // Generate 24 hours from 07:00 to 06:00
    const labelsFfaAllHours = [];
    for (let i = 0; i < 24; i++) {
        let h = (7 + i);
        if (h === 24) {
            labelsFfaAllHours.push('24:00');
        } else {
            labelsFfaAllHours.push(String(h % 24).padStart(2, '0') + ':00');
        }
    }
    
    const getDataFfa = (h, field) => {
        let altH = h === '24:00' ? '00:00' : (h === '00:00' ? '24:00' : h);
        let row = ffaData.find(d => d.time_hour === h || d.time_hour === altH || d.time_hour === h.replace(':00', ':00:00') || d.time_hour === altH.replace(':00', ':00:00'));
        return row && row[field] !== null && row[field] !== undefined ? parseFloat(row[field]) : null;
    };
    
    const dataFfaBfAll = labelsFfaAllHours.map(h => getDataFfa(h, 'ffa_b'));
    const dataFfaAfAll = labelsFfaAllHours.map(h => getDataFfa(h, 'ffa_a'));

    const showLabel = (context) => {
        return context.dataset.data[context.dataIndex] > 0;
    };
    
    const datalabelsConfig = { 
        display: showLabel,
        color: '#000', 
        font: { weight: 'bold', size: 11 }
    };

    // Ensure plugin is registered globally if available
    const chartPlugins = window.ChartDataLabels ? [window.ChartDataLabels] : [];

    function buildChart(id, config) {
        if (!window.dashProcessingCharts) window.dashProcessingCharts = {};
        if (window.dashProcessingCharts[id]) window.dashProcessingCharts[id].destroy();
        let ctx = document.getElementById(id);
        if (ctx) {
            window.dashProcessingCharts[id] = new Chart(ctx, config);
        }
    }

    if (liquidData.length === 0) {
        ['chart-oil-cot-cst', 'chart-cst-ketebalan', 'chart-temp-cot-cst'].forEach(id => {
            if (window.dashProcessingCharts && window.dashProcessingCharts[id]) window.dashProcessingCharts[id].destroy();
        });
    } else {
        buildChart('chart-oil-cot-cst', {
            type: 'line',
            plugins: chartPlugins,
            data: {
                labels: labelsLiquid,
                datasets: [
                    { label: 'COT Oil (%)', data: dataLiquidCotOil, borderColor: '#4285F4', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'circle', pointRadius: 4, pointHoverRadius: 6, datalabels: { align: 'top', anchor: 'end' } },
                    { label: 'Under flow CST Oil(%)', data: dataLiquidCstOil, borderColor: '#FBBC04', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'circle', pointRadius: 4, pointHoverRadius: 6, datalabels: { align: 'bottom', anchor: 'start' } }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 60 } },
                plugins: {
                    datalabels: datalabelsConfig,
                    annotation: {
                        annotations: {
                            cotStandard: { type: 'line', yMin: 36.5, yMax: 36.5, borderColor: 'green', borderWidth: 2, borderDash: [5, 5], label: { display: false, content: 'Std COT (36.5%)', position: 'end' } },
                            cstStandard: { type: 'line', yMin: 6, yMax: 6, borderColor: 'brown', borderWidth: 2, borderDash: [5, 5], label: { display: false, content: 'Std CST (6%)', position: 'end' } }
                        }
                    }
                }
            }
        });

        buildChart('chart-cst-ketebalan', {
            type: 'line',
            plugins: chartPlugins,
            data: {
                labels: labelsLiquid,
                datasets: [
                    { label: 'Ketebalan Minyak CST (mm)', data: dataLiquidCstMinyak, borderColor: '#34A853', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'circle', pointRadius: 4, pointHoverRadius: 6, datalabels: { align: 'top', anchor: 'end' } }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } },
                plugins: {
                    datalabels: datalabelsConfig,
                    annotation: {
                        annotations: {
                            idealLine: { type: 'line', yMin: 40, yMax: 40, borderColor: '#4285F4', borderWidth: 1, borderDash: [5, 5], label: { display: false, content: 'Batas Ideal Ketebalan (40)', position: 'end' } }
                        }
                    }
                }
            }
        });

        buildChart('chart-temp-cot-cst', {
            type: 'line',
            plugins: chartPlugins,
            data: {
                labels: labelsLiquid,
                datasets: [
                    { label: 'Temp COT (°C)', data: dataLiquidCotTemp, borderColor: '#4285F4', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'circle', pointRadius: 4, pointHoverRadius: 6, datalabels: { align: 'top', anchor: 'end' } },
                    { label: 'Temp CST (°C)', data: dataLiquidCstTemp, borderColor: '#FBBC04', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'circle', pointRadius: 4, pointHoverRadius: 6, datalabels: { align: 'bottom', anchor: 'start' } }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 150 } }, 
                plugins: { 
                    datalabels: datalabelsConfig,
                    annotation: {
                        annotations: {
                            stdTemp: { type: 'line', yMin: 90, yMax: 90, borderColor: 'red', borderWidth: 2, borderDash: [5,5], label: { display: false, content: 'Std Min (90°C)', position: 'end' } }
                        }
                    } 
                } 
            }
        });
    }


    if (ffaData.length === 0) {
        if (window.dashProcessingCharts && window.dashProcessingCharts['chart-ffa-today']) window.dashProcessingCharts['chart-ffa-today'].destroy();
    } else {
        buildChart('chart-ffa-today', {
            type: 'line',
            plugins: chartPlugins,
            data: {
                labels: labelsFfaAllHours,
                datasets: [
                    { label: 'FFA Sebelum Washing Plant (%)', data: dataFfaBfAll, spanGaps: true, borderColor: '#EA4335', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'triangle', pointRadius: 5, pointHoverRadius: 7, datalabels: { align: 'bottom', anchor: 'start' } },
                    { label: 'FFA Setelah Washing Plant (%)', data: dataFfaAfAll, spanGaps: true, borderColor: '#4285F4', backgroundColor: 'transparent', borderWidth: 2, pointStyle: 'triangle', pointRadius: 5, pointHoverRadius: 7, datalabels: { align: 'top', anchor: 'end' } }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { min: 1.0, max: 8.0, title: { display: true, text: 'FFA (%)' } },
                    x: {
                        ticks: {
                            callback: function(val, index) {
                                return index % 2 === 0 ? this.getLabelForValue(val) : '';
                            }
                        }
                    }
                }, 
                plugins: { 
                    title: { display: true, text: 'Grafik FFA Sebelum & Sesudah Washing Plant' }, 
                    datalabels: datalabelsConfig,
                    annotation: {
                        annotations: {
                            maxFfa: { type: 'line', yMin: 3.5, yMax: 3.5, borderColor: 'green', borderWidth: 2, borderDash: [5,5], label: { display: false, content: 'Max FFA (3.5%)', position: 'end' } }
                        }
                    } 
                } 
            }
        });
    }
};
window.toggleFfbReceivedInputs = function() {
    const period = document.getElementById('ffb-received-period-select')?.value;
    const dateLabel = document.getElementById('ffb-received-date-label');
    const dateInput = document.getElementById('ffb-received-date-input');
    const monthLabel = document.getElementById('ffb-received-month-label');
    const monthInput = document.getElementById('ffb-received-month-input');
    
    if (period === 'monthly') {
        if (dateLabel) dateLabel.style.display = 'none';
        if (dateInput) dateInput.style.display = 'none';
        if (monthLabel) monthLabel.style.display = 'block';
        if (monthInput) monthInput.style.display = 'block';
    } else {
        if (dateLabel) dateLabel.style.display = 'block';
        if (dateInput) dateInput.style.display = 'block';
        if (monthLabel) monthLabel.style.display = 'none';
        if (monthInput) monthInput.style.display = 'none';
    }
};

window.renderDashFfbCropQuality = async function() {
    const cardEl = document.getElementById('dash-ffb-crop-card');
    if (!cardEl) return;

    if (!window.currentUser || !window.currentUser.role) {
        cardEl.style.display = 'none';
        return;
    }
    const allowedRoles = [
        'Senior Field Manager', 'Manager', 'Askep', 'Assistant', 
        'Krani Divisi', 'Manager Mill', 'Manager MIll', 
        'supervisor Mill', 'Krani Mill', 'Analis & Grading', 'Admin', 'Administrator'
    ];
    if (!allowedRoles.includes(window.currentUser.role) && !allowedRoles.includes(window.currentUser.role.trim())) {
        cardEl.style.display = 'none';
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${yyyy}-${mm}-${dd}`;

    const normalizeDateStr = (val, fallback) => {
        if (!val) return fallback;
        val = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
            const p = val.split('/');
            return `${p[2]}-${p[0].padStart(2, '0')}-${p[1].padStart(2, '0')}`;
        }
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(val)) {
            const p = val.split('-');
            return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        }
        return val || fallback;
    };

    let rawStartDate = document.getElementById('dash-ffb-crop-start-date')?.value;
    let rawEndDate = document.getElementById('dash-ffb-crop-end-date')?.value;

    let startDate = normalizeDateStr(rawStartDate, defaultDate);
    let endDate = normalizeDateStr(rawEndDate, defaultDate);

    if (document.getElementById('dash-ffb-crop-start-date') && !document.getElementById('dash-ffb-crop-start-date').value) {
        document.getElementById('dash-ffb-crop-start-date').value = startDate;
    }
    if (document.getElementById('dash-ffb-crop-end-date') && !document.getElementById('dash-ffb-crop-end-date').value) {
        document.getElementById('dash-ffb-crop-end-date').value = endDate;
    }

    cardEl.style.display = 'block';

    const tbody = document.querySelector('#dash-ffb-crop-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="10">Loading...</td></tr>';

    let mill = 'Bunga Tanjung Mill';
    const headerDropdown = document.getElementById('header-estate-dropdown');
    if (headerDropdown && headerDropdown.value && headerDropdown.value.toLowerCase().includes('mill')) {
        mill = headerDropdown.value;
    } else if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }

    try {
        let rawData = [];
        let rawTonase = [];
        let rawLf = [];

        // Parallel fetch FFB Crop Quality, Tonase, and LF Received
        const [ffbRes, tonaseRes, lfRes] = await Promise.all([
            fetch(`/api/ffb_crop_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`),
            fetch(`/api/tonase/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`),
            fetch(`/api/daily-monitor/lf-range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`)
        ]);

        if (ffbRes.ok) rawData = await ffbRes.json();
        if (tonaseRes.ok) rawTonase = await tonaseRes.json();
        if (lfRes.ok) rawLf = await lfRes.json();

        // Abbr map
        let abbrMap = {};
        let activeFfbEstates = new Set();
        if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                if (item.name && item.abbr) {
                    abbrMap[item.name.trim().toLowerCase()] = item.abbr;
                    abbrMap[item.name.trim()] = item.abbr;
                }
            });
        }
        if (typeof masterData !== 'undefined' && masterData.supply_chain) {
            masterData.supply_chain.forEach(item => {
                const est = item.estate || item.name;
                const ab = item.abbr;
                if (item.is_ffb !== false && est) {
                    activeFfbEstates.add(est);
                }
                if (est && ab) {
                    abbrMap[est.trim().toLowerCase()] = ab;
                    abbrMap[est.trim()] = ab;
                }
            });
        }
        const getAbbr = (estName) => {
            if (!estName) return '-';
            const clean = estName.trim();
            if (abbrMap[clean]) return abbrMap[clean];
            if (abbrMap[clean.toLowerCase()]) return abbrMap[clean.toLowerCase()];
            if (clean.length <= 6) return clean;
            return clean.replace(/ Estate/i, 'E');
        };

        // Aggregate tonase from tonase_hourly by estate (realized_kg / 1000 = TON)
        const tonaseByEst = {};
        if (Array.isArray(rawTonase)) {
            rawTonase.forEach(row => {
                const e = row.estate || 'Unknown';
                const ton = (parseFloat(row.realized_kg) || 0) / 1000;
                tonaseByEst[e] = (tonaseByEst[e] || 0) + ton;
            });
        }

        // Aggregate LF from lf_received_daily by estate
        const lfByEst = {};
        if (Array.isArray(rawLf)) {
            rawLf.forEach(row => {
                const e = row.estate || 'Unknown';
                const lfTon = parseFloat(row.actual_lf_tonase) || 0;
                const ffbTon = parseFloat(row.actual_ffb_tonase) || 0;
                if (!lfByEst[e]) {
                    lfByEst[e] = { lf_ton: 0, ffb_ton: 0 };
                }
                lfByEst[e].lf_ton += lfTon;
                lfByEst[e].ffb_ton += ffbTon;
            });
        }

        // Aggregate FFB Quality by estate
        const estData = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(row => {
                const e = row.estate || 'Unknown';
                if (!estData[e]) {
                    estData[e] = {
                        total_janjang: 0,
                        unripe: 0,
                        underripe: 0,
                        normal_ripe: 0,
                        over_ripe: 0,
                        empty_bunch: 0,
                        long_stalk: 0,
                        rat_damage: 0
                    };
                }
                estData[e].total_janjang += parseInt(row.total_janjang) || 0;
                estData[e].unripe += parseInt(row.unripe) || 0;
                estData[e].underripe += parseInt(row.underripe) || 0;
                estData[e].normal_ripe += parseInt(row.normal_ripe) || 0;
                estData[e].over_ripe += parseInt(row.over_ripe) || 0;
                estData[e].empty_bunch += parseInt(row.empty_bunch) || 0;
                estData[e].long_stalk += parseInt(row.long_stalk) || 0;
                estData[e].rat_damage += parseInt(row.rat_damage) || 0;
            });
        }

        if (tbody) tbody.innerHTML = '';

        // Collect all distinct estates from crop data, tonase data, or lf data
        const allEstNames = new Set([
            ...Object.keys(estData),
            ...Object.keys(tonaseByEst),
            ...Object.keys(lfByEst)
        ]);

        if (allEstNames.size === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="color: #64748b; font-style: italic; text-align: center;">Tidak ada data.</td></tr>';
            const totTonaseEl = document.getElementById('dash-fqc-tot-tonase');
            if (totTonaseEl) totTonaseEl.innerText = '0.00';
            document.getElementById('dash-fqc-avg-unripe').innerText = '0.0';
            document.getElementById('dash-fqc-avg-under').innerText = '0.0';
            document.getElementById('dash-fqc-avg-normal').innerText = '0.0';
            document.getElementById('dash-fqc-avg-over').innerText = '0.0';
            document.getElementById('dash-fqc-avg-empty').innerText = '0.0';
            document.getElementById('dash-fqc-avg-long').innerText = '0.0';
            if (document.getElementById('dash-fqc-avg-rat')) document.getElementById('dash-fqc-avg-rat').innerText = '0.0';
            if (document.getElementById('dash-fqc-avg-lf')) document.getElementById('dash-fqc-avg-lf').innerText = '0.00';
            return;
        }

        const getEstateTonase = (estName) => {
            if (tonaseByEst[estName] !== undefined) return tonaseByEst[estName];
            for (let k in tonaseByEst) {
                if (getAbbr(k) === getAbbr(estName) || k.toLowerCase() === estName.toLowerCase()) {
                    return tonaseByEst[k];
                }
            }
            if (lfByEst[estName] && lfByEst[estName].ffb_ton > 0) return lfByEst[estName].ffb_ton;
            return 0;
        };

        const getEstateLf = (estName) => {
            if (lfByEst[estName]) return lfByEst[estName];
            for (let k in lfByEst) {
                if (getAbbr(k) === getAbbr(estName) || k.toLowerCase() === estName.toLowerCase()) {
                    return lfByEst[k];
                }
            }
            return { lf_ton: 0, ffb_ton: 0 };
        };

        let sumWeightedUnripe = 0;
        let sumWeightedUnder = 0;
        let sumWeightedRipe = 0;
        let sumWeightedOver = 0;
        let sumWeightedEmpty = 0;
        let sumWeightedLong = 0;
        let sumWeightedRat = 0;
        let totalGradingTonase = 0;
        let totalAllEstTonase = 0;
        let totalAllLfTon = 0;

        let sortedEstates = Array.from(allEstNames).sort((a, b) => getAbbr(a).localeCompare(getAbbr(b)));

        sortedEstates.forEach(est => {
            const d = estData[est] || { total_janjang: 0, unripe: 0, underripe: 0, normal_ripe: 0, over_ripe: 0, empty_bunch: 0, long_stalk: 0, rat_damage: 0 };
            const tot = d.total_janjang;
            
            const p_u_num = tot > 0 ? (d.unripe / tot * 100) : 0;
            const p_un_num = tot > 0 ? (d.underripe / tot * 100) : 0;
            const p_n_num = tot > 0 ? (d.normal_ripe / tot * 100) : 0;
            const p_o_num = tot > 0 ? (d.over_ripe / tot * 100) : 0;
            const p_e_num = tot > 0 ? (d.empty_bunch / tot * 100) : 0;
            const p_l_num = tot > 0 ? (d.long_stalk / tot * 100) : 0;
            const p_rat_num = tot > 0 ? (d.rat_damage / tot * 100) : 0;

            const p_u = p_u_num.toFixed(2);
            const p_un = p_un_num.toFixed(2);
            const p_n = p_n_num.toFixed(2);
            const p_o = p_o_num.toFixed(2);
            const p_e = p_e_num.toFixed(2);
            const p_l = p_l_num.toFixed(2);
            const p_rat = p_rat_num.toFixed(2);

            const estTonase = getEstateTonase(est);
            const lfData = getEstateLf(est);
            const estLfTon = lfData.lf_ton || 0;
            const estFfbForLf = estTonase > 0 ? estTonase : (lfData.ffb_ton || 0);
            const p_lf_num = estFfbForLf > 0 ? ((estLfTon / estFfbForLf) * 100) : 0;
            const p_lf = p_lf_num.toFixed(2);

            if (estTonase <= 0 && tot <= 0 && estLfTon <= 0) return;

            totalAllEstTonase += estTonase;
            totalAllLfTon += estLfTon;

            if (tot > 0) {
                const w = estTonase > 0 ? estTonase : (tot / 100);
                totalGradingTonase += w;
                sumWeightedUnripe += (w * p_u_num);
                sumWeightedUnder += (w * p_un_num);
                sumWeightedRipe += (w * p_n_num);
                sumWeightedOver += (w * p_o_num);
                sumWeightedEmpty += (w * p_e_num);
                sumWeightedLong += (w * p_l_num);
                sumWeightedRat += (w * p_rat_num);
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${getAbbr(est)}</td>
                <td style="font-weight: 600;">${estTonase.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="color: ${tot > 0 && parseFloat(p_u) > 0 ? 'red' : 'inherit'}">${p_u}</td>
                <td style="color: ${tot > 0 && parseFloat(p_un) > 3 ? 'red' : 'inherit'}">${p_un}</td>
                <td style="color: ${tot > 0 && parseFloat(p_n) < 90 ? 'red' : (tot > 0 && parseFloat(p_n) >= 90 ? '#10b981' : 'inherit')}">${p_n}</td>
                <td style="color: ${tot > 0 && parseFloat(p_o) > 7 ? 'red' : 'inherit'}">${p_o}</td>
                <td style="color: ${tot > 0 && parseFloat(p_e) > 0 ? 'red' : 'inherit'}">${p_e}</td>
                <td style="color: ${tot > 0 && parseFloat(p_l) >= 2 ? 'red' : 'inherit'}">${p_l}</td>
                <td>${p_rat}</td>
                <td style="font-weight: 600;">${p_lf}</td>
            `;
            if (tbody) tbody.appendChild(tr);
        });

        // Weighted Totals by Tonase (Interpolasi: SUM(Tonase * %) / Total Tonase)
        const p_tu = totalGradingTonase > 0 ? (sumWeightedUnripe / totalGradingTonase).toFixed(2) : '0.00';
        const p_tun = totalGradingTonase > 0 ? (sumWeightedUnder / totalGradingTonase).toFixed(2) : '0.00';
        const p_tn = totalGradingTonase > 0 ? (sumWeightedRipe / totalGradingTonase).toFixed(2) : '0.00';
        const p_to = totalGradingTonase > 0 ? (sumWeightedOver / totalGradingTonase).toFixed(2) : '0.00';
        const p_te = totalGradingTonase > 0 ? (sumWeightedEmpty / totalGradingTonase).toFixed(2) : '0.00';
        const p_tl = totalGradingTonase > 0 ? (sumWeightedLong / totalGradingTonase).toFixed(2) : '0.00';
        const p_trat = totalGradingTonase > 0 ? (sumWeightedRat / totalGradingTonase).toFixed(2) : '0.00';
        const p_tlf = totalAllEstTonase > 0 ? ((totalAllLfTon / totalAllEstTonase) * 100).toFixed(2) : '0.00';

        const totTonaseEl = document.getElementById('dash-fqc-tot-tonase');
        if (totTonaseEl) totTonaseEl.innerText = totalAllEstTonase.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        document.getElementById('dash-fqc-avg-unripe').innerText = p_tu;
        document.getElementById('dash-fqc-avg-under').innerText = p_tun;
        document.getElementById('dash-fqc-avg-normal').innerText = p_tn;
        document.getElementById('dash-fqc-avg-over').innerText = p_to;
        document.getElementById('dash-fqc-avg-empty').innerText = p_te;
        document.getElementById('dash-fqc-avg-long').innerText = p_tl;
        if (document.getElementById('dash-fqc-avg-rat')) document.getElementById('dash-fqc-avg-rat').innerText = p_trat;
        if (document.getElementById('dash-fqc-avg-lf')) document.getElementById('dash-fqc-avg-lf').innerText = p_tlf;
        
        document.getElementById('dash-fqc-avg-unripe').style.color = parseFloat(p_tu) > 0 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-under').style.color = parseFloat(p_tun) > 3 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-normal').style.color = parseFloat(p_tn) < 90 ? 'red' : (parseFloat(p_tn) >= 90 ? '#10b981' : 'inherit');
        document.getElementById('dash-fqc-avg-over').style.color = parseFloat(p_to) > 7 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-empty').style.color = parseFloat(p_te) > 0 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-long').style.color = parseFloat(p_tl) >= 2 ? 'red' : 'inherit';

    } catch(err) {
        console.error('Error rendering dash ffb crop quality:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="color: red;">Error: ' + err.message + '</td></tr>';
    }
};

window.renderDashFfbFruitLooseAnalysis = async function() {
    const cardEl = document.getElementById('dash-ffb-fruit-loose-card');
    if (!cardEl) return;

    if (!window.currentUser || !window.currentUser.role) {
        cardEl.style.display = 'none';
        return;
    }
    const allowedRoles = [
        'Senior Field Manager', 'Manager', 'Askep', 'Assistant', 
        'Krani Divisi', 'Manager Mill', 'Manager MIll', 
        'supervisor Mill', 'Krani Mill', 'Analis & Grading', 'Admin'
    ];
    if (!allowedRoles.includes(window.currentUser.role)) {
        cardEl.style.display = 'none';
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${yyyy}-${mm}-${dd}`;

    let startDate = document.getElementById('dash-ffb-fruit-loose-start-date')?.value;
    let endDate = document.getElementById('dash-ffb-fruit-loose-end-date')?.value;

    if (!startDate) {
        startDate = defaultDate;
        if (document.getElementById('dash-ffb-fruit-loose-start-date')) document.getElementById('dash-ffb-fruit-loose-start-date').value = startDate;
    }
    if (!endDate) {
        endDate = defaultDate;
        if (document.getElementById('dash-ffb-fruit-loose-end-date')) document.getElementById('dash-ffb-fruit-loose-end-date').value = endDate;
    }

    cardEl.style.display = 'block';

    const tbody = document.querySelector('#dash-ffb-fruit-loose-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    let mill = 'Bunga Tanjung Mill';
    if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }

    try {
        const res = await fetch(`/api/ffb_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`);
        if (!res.ok) throw new Error('Network error fetching ffb quality fruit loose');
        const rawData = await res.json();

        const estData = {};
        rawData.forEach(row => {
            const e = row.estate || 'Unknown';
            if (!estData[e]) {
                estData[e] = { bg_gram: 0, bd_gram: 0, t_segar_gram: 0, busuk_gram: 0, sampah_gram: 0 };
            }
            estData[e].bg_gram += parseFloat(row.bg_gram) || 0;
            estData[e].bd_gram += parseFloat(row.bd_gram) || 0;
            estData[e].t_segar_gram += parseFloat(row.t_segar_gram) || 0;
            estData[e].busuk_gram += parseFloat(row.busuk_gram) || 0;
            estData[e].sampah_gram += parseFloat(row.sampah_gram) || 0;
        });

        if (tbody) tbody.innerHTML = '';
        let t_bg = 0, t_bd = 0, t_ts = 0, t_bb = 0, t_sampah = 0;

        let abbrMap = {};
        if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                abbrMap[item.name] = item.abbr;
            });
        }
        const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

        Object.keys(estData).forEach(est => {
            const d = estData[est];
            t_bg += d.bg_gram; t_bd += d.bd_gram; t_ts += d.t_segar_gram; t_bb += d.busuk_gram; t_sampah += d.sampah_gram;

            const p_bd = d.bg_gram > 0 ? (d.bd_gram / d.bg_gram * 100).toFixed(2) : '0.00';
            const p_ts = d.bg_gram > 0 ? (d.t_segar_gram / d.bg_gram * 100).toFixed(2) : '0.00';
            const p_bb = d.bg_gram > 0 ? (d.busuk_gram / d.bg_gram * 100).toFixed(2) : '0.00';
            const p_sampah = d.bg_gram > 0 ? (d.sampah_gram / d.bg_gram * 100).toFixed(2) : '0.00';

            const bdColor = parseFloat(p_bd) < 70 ? 'red' : 'inherit';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${getAbbr(est)}</td>
                <td style="color: ${bdColor}; font-weight: ${parseFloat(p_bd) < 70 ? 'bold' : 'normal'}">${p_bd}</td>
                <td>${p_ts}</td>
                <td>${p_bb}</td>
                <td>${p_sampah}</td>
            `;
            if (tbody) tbody.appendChild(tr);
        });

        if (Object.keys(estData).length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5">Tidak ada data.</td></tr>';
        }

        const avg_bd = t_bg > 0 ? (t_bd / t_bg * 100).toFixed(2) : '0.00';
        const avg_ts = t_bg > 0 ? (t_ts / t_bg * 100).toFixed(2) : '0.00';
        const avg_bb = t_bg > 0 ? (t_bb / t_bg * 100).toFixed(2) : '0.00';
        const avg_sampah = t_bg > 0 ? (t_sampah / t_bg * 100).toFixed(2) : '0.00';

        document.getElementById('dash-fql-avg-segar').innerText = avg_bd;
        document.getElementById('dash-fql-avg-tsegar').innerText = avg_ts;
        document.getElementById('dash-fql-avg-busuk').innerText = avg_bb;
        document.getElementById('dash-fql-avg-sampah').innerText = avg_sampah;

        document.getElementById('dash-fql-avg-segar').style.color = parseFloat(avg_bd) < 70 ? 'red' : 'inherit';

    } catch(err) {
        console.error(err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
    }
};

window.renderFfbReceivedChart = async function() {
    const cardEl = document.getElementById('ffb-received-card');
    if (!cardEl) return;

    if (!window.currentUser || !window.currentUser.role) {
        cardEl.style.display = 'none';
        return;
    }

    const allowedRoles = [
        'Senior Field Manager', 'Manager', 'Askep', 'Assistant', 
        'Krani Divisi', 'Manager Mill', 'Manager MIll', 
        'supervisor Mill', 'Krani Mill', 'Analis & Grading', 'Admin'
    ];
    
    if (!allowedRoles.includes(window.currentUser.role)) {
        cardEl.style.display = 'none';
        return;
    } else {
        cardEl.style.display = 'block';
    }

    const timeSelect = document.getElementById('ffb-received-time-select');
    const timeLabel = document.getElementById('ffb-received-time-label');
    const selectedTime = timeSelect.value || '18:00';
    
    if (timeLabel) timeLabel.innerText = selectedTime;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${yyyy}-${mm}-${dd}`;
    const defaultMonth = `${yyyy}-${mm}`;

    const periodSelect = document.getElementById('ffb-received-period-select');
    const period = periodSelect ? periodSelect.value : 'daily';

    const dateInput = document.getElementById('ffb-received-date-input');
    const monthInput = document.getElementById('ffb-received-month-input');

    let date = dateInput?.value;
    let month = monthInput?.value;

    // Fallbacks if empty
    if (!date) {
        date = document.getElementById('dash-date')?.value || document.getElementById('dash-extra-date-input')?.value || defaultDate;
        if (dateInput) dateInput.value = date;
    }
    if (!month) {
        month = date.substring(0, 7);
        if (monthInput) monthInput.value = month;
    }
    
    let mill = 'Bunga Tanjung Mill';
    if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }



    let apiUrl = `/api/tonase/${mill}/${date}`;
    if (period === 'monthly') {
        apiUrl = `/api/tonase/${mill}/month/${month}`;
    }

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        const estateTotals = {};
        const estateAfterTime = {};
        
        data.forEach(row => {
            if (!row.estate || row.estate.trim() === '') return;
            const estate = row.estate;
            
            if (!estateTotals[estate]) estateTotals[estate] = 0;
            if (!estateAfterTime[estate]) estateAfterTime[estate] = 0;
            
            const kg = parseFloat(row.realized_kg) || 0;
            estateTotals[estate] += kg;
            
            if (row.time_hour) {
                const t1 = parseInt(row.time_hour.replace(':',''));
                const t2 = parseInt(selectedTime.replace(':',''));
                if (t1 <= t2) {
                    estateAfterTime[estate] += kg;
                }
            }
        });
        
        const chartData = [];
        for (const estate in estateTotals) {
            const total = estateTotals[estate];
            if (total > 0) {
                const afterTime = estateAfterTime[estate];
                const percentage = (afterTime / total) * 100;
                const acronymMap = {
                    'Bunga Tanjung Estate': 'BTEE',
                    'Sungai Teramang Estate': 'STGE',
                    'Air Bikuk Estate': 'ABKE',
                    'Air Buluh Estate': 'ABEE',
                    'Malin Deman Estate': 'MDEE',
                    'Small Holder': 'SH'
                };
                let acronym = acronymMap[estate];
                if (!acronym) {
                    const words = estate.split(' ');
                    if (words.length > 1 && estate.toLowerCase().includes('estate')) {
                        acronym = words.map(w => w[0]).join('').toUpperCase();
                    } else if (words.length > 1) {
                        acronym = words.map(w => w[0]).join('').toUpperCase();
                    } else {
                        acronym = estate;
                    }
                }
                chartData.push({ estate: acronym, fullName: estate, percentage: percentage, tonase: afterTime, totalTonase: total });
            }
        }
        
        chartData.sort((a, b) => a.percentage - b.percentage);
        
        const labels = chartData.map(d => d.estate);
        const dataPoints = chartData.map(d => d.percentage);
        
        const ctx = document.getElementById('chart-ffb-received');
        if (!ctx) return;
        
        if (window.millCharts.ffbReceived) {
            window.millCharts.ffbReceived.destroy();
        }
        
        if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
        
        const bgColors = dataPoints.map((val, idx) => {
            const ratio = dataPoints.length > 1 ? idx / (dataPoints.length - 1) : 1;
            const r = Math.round(59 - (59 - 30) * ratio);
            const g = Math.round(130 - (130 - 58) * ratio);
            const b = Math.round(246 - (246 - 138) * ratio);
            return `rgb(${r}, ${g}, ${b})`;
        });

        window.millCharts.ffbReceived = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'FFB Received %',
                    data: dataPoints,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) { return value + '%' }
                        },
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false,
                            borderDash: [5, 5]
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const idx = context[0].dataIndex;
                                return chartData[idx].fullName;
                            },
                            label: (context) => {
                                const idx = context.dataIndex;
                                const amount = (chartData[idx].tonase / 1000).toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1});
                                const total = (chartData[idx].totalTonase / 1000).toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1});
                                return `FFB Received: ${context.parsed.y.toFixed(2)}% (${amount} / ${total} Ton)`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value, context) {
                            const idx = context.dataIndex;
                            const amount = (chartData[idx].tonase / 1000).toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1});
                            return value.toFixed(1) + '% | ' + amount + ' Ton';
                        },
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        color: '#1e293b',
                        rotation: -90,
                        offset: 4
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
        
    } catch (err) {
        console.error("Failed to load FFB Received data:", err);
    }
};

const originalLoadDashboardExtraData = window.loadDashboardExtraData;
window.loadDashboardExtraData = async function(dateOverride) {
    if (originalLoadDashboardExtraData) {
        await originalLoadDashboardExtraData(dateOverride);
    }
    
    if (window.currentUser) {
        const role = window.currentUser.role;
        const allowedRoles = ['Manager', 'Assistant', 'Askep', 'Supervisor Mill', 'Senior Field Manager', 'Senior Manager Estate', 'Krani Mill', 'Analis', 'Grading'];
        const card = document.getElementById('ffb-received-card');
        if (card) {
            if (allowedRoles.includes(role)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    }

    if (window.renderFfbReceivedChart) {
        window.renderFfbReceivedChart();
    }
    if (window.renderDashFfbCropQuality) {
        window.renderDashFfbCropQuality();
    }
    if (window.renderDashFfbFruitLooseAnalysis) {
        window.renderDashFfbFruitLooseAnalysis();
    }
};

window.openFqRangeModal = function(target) {
    document.getElementById('fq-range-target').value = target;
    const today = window.getLocalDate();
    document.getElementById('fq-range-start').value = today;
    document.getElementById('fq-range-end').value = today;
    document.getElementById('modal-fq-range').style.display = 'flex';
};

window.submitFqRangeModal = function() {
    const target = document.getElementById('fq-range-target').value;
    const start = document.getElementById('fq-range-start').value;
    const end = document.getElementById('fq-range-end').value;
    
    if (!start || !end) {
        alert("Pilih tanggal awal dan akhir.");
        return;
    }
    if (start > end) {
        alert("Tanggal awal tidak boleh lebih dari tanggal akhir.");
        return;
    }
    
    document.getElementById('modal-fq-range').style.display = 'none';
    
    if (target === 'loose') {
        window.loadFFBQuality(start, end);
    } else if (target === 'crop') {
        window.loadFFBCropQuality(start, end);
    }
};

window.printTable = function(wrapperId, title) {
    const tableHtml = document.getElementById(wrapperId).innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h2 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
                th { background-color: #f1f5f9; }
                .btn { display: none; } /* Hide buttons in print */
                @media print {
                    @page { size: landscape; }
                }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            ${tableHtml}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
    w.document.close();
};



// --- DETAIL FFQ FFB CROP QUALITY (DAY BY DAY PER ESTATE) ---

window.initFFQDetailFilters = function() {
    const startInput = document.getElementById('fq-detail-start-date');
    const endInput = document.getElementById('fq-detail-end-date');
    const estateSelect = document.getElementById('fq-detail-estate-filter');

    const today = window.getLocalDate();
    if (startInput && !startInput.value) {
        startInput.value = today.substring(0, 7) + '-01';
    }
    if (endInput && !endInput.value) {
        endInput.value = today;
    }

    if (estateSelect) {
        const curVal = estateSelect.value;
        // Only rebuild options if not populated yet
        if (estateSelect.options.length <= 1) {
            let opts = '<option value="ALL">Semua Estate (FFB)</option>';
            let abbrMap = {};
            if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
                masterData.supply_chain_list.forEach(item => {
                    abbrMap[item.name] = item.abbr;
                });
            }

            let scList = [];
            if (typeof masterData !== 'undefined' && masterData.supply_chain) {
                scList = masterData.supply_chain.filter(s => s.is_ffb !== false);
            }
            if (scList.length > 0) {
                scList.forEach(s => {
                    const est = s.estate;
                    const abbr = s.abbr || abbrMap[est] || (est ? est.replace(' Estate', 'E') : '');
                    opts += `<option value="${est}">${est}${abbr ? ' (' + abbr + ')' : ''}</option>`;
                });
            } else if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
                masterData.supply_chain_list.forEach(s => {
                    opts += `<option value="${s.name}">${s.name} (${s.abbr})</option>`;
                });
            }
            estateSelect.innerHTML = opts;
            if (curVal && curVal !== 'ALL') {
                estateSelect.value = curVal;
            }
        }
    }
};

window.loadFFQDetailData = async function() {
    window.initFFQDetailFilters();

    const startInput = document.getElementById('fq-detail-start-date');
    const endInput = document.getElementById('fq-detail-end-date');
    const estateSelect = document.getElementById('fq-detail-estate-filter');

    const startDate = startInput && startInput.value ? startInput.value : window.getLocalDate();
    const endDate = endInput && endInput.value ? endInput.value : startDate;
    const selectedEstate = estateSelect ? estateSelect.value : 'ALL';

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';

    const tbody = document.querySelector('#ffq-detail-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="12" style="padding: 20px; color: #64748b; font-style: italic;">Loading data Detail FFQ...</td></tr>';

    try {
        const [cropRes, tonaseRes, lfRes] = await Promise.all([
            fetch(`/api/ffb_crop_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`),
            fetch(`/api/tonase/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`),
            fetch(`/api/daily-monitor/lf-range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`)
        ]);

        const rawCrop = cropRes.ok ? await cropRes.json() : [];
        const rawTonase = tonaseRes.ok ? await tonaseRes.json() : [];
        const rawLf = lfRes.ok ? await lfRes.json() : [];

        let abbrMap = {};
        let activeFfbEstates = new Set();
        if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                if (item.name && item.abbr) {
                    abbrMap[item.name.trim().toLowerCase()] = item.abbr;
                    abbrMap[item.name.trim()] = item.abbr;
                }
            });
        }
        if (typeof masterData !== 'undefined' && masterData.supply_chain) {
            masterData.supply_chain.forEach(item => {
                const est = item.estate || item.name;
                const ab = item.abbr;
                if (item.is_ffb !== false && est) {
                    activeFfbEstates.add(est);
                }
                if (est && ab) {
                    abbrMap[est.trim().toLowerCase()] = ab;
                    abbrMap[est.trim()] = ab;
                }
            });
        }
        const getAbbr = (estName) => {
            if (!estName) return '-';
            const clean = estName.trim();
            if (abbrMap[clean]) return abbrMap[clean];
            if (abbrMap[clean.toLowerCase()]) return abbrMap[clean.toLowerCase()];
            if (clean.length <= 6) return clean;
            return clean.replace(/ Estate/i, 'E');
        };

        const tonaseMap = {};
        if (Array.isArray(rawTonase)) {
            rawTonase.forEach(r => {
                const k = `${r.date}_${r.estate}`;
                const ton = (parseFloat(r.realized_kg) || 0) / 1000;
                tonaseMap[k] = (tonaseMap[k] || 0) + ton;
            });
        }

        const lfMap = {};
        if (Array.isArray(rawLf)) {
            rawLf.forEach(r => {
                const k = `${r.date}_${r.estate}`;
                lfMap[k] = {
                    lf_ton: parseFloat(r.actual_lf_tonase) || 0,
                    ffb_ton: parseFloat(r.actual_ffb_tonase) || 0
                };
            });
        }

        const cropMap = {};
        if (Array.isArray(rawCrop)) {
            rawCrop.forEach(r => {
                const k = `${r.date}_${r.estate}`;
                if (!cropMap[k]) {
                    cropMap[k] = {
                        tot: 0, unripe: 0, under: 0, normal: 0, over: 0, empty: 0, long: 0, rat: 0
                    };
                }
                cropMap[k].tot += parseInt(r.total_janjang) || 0;
                cropMap[k].unripe += parseInt(r.unripe) || 0;
                cropMap[k].under += parseInt(r.underripe) || 0;
                cropMap[k].normal += parseInt(r.normal_ripe) || 0;
                cropMap[k].over += parseInt(r.over_ripe) || 0;
                cropMap[k].empty += parseInt(r.empty_bunch) || 0;
                cropMap[k].long += parseInt(r.long_stalk) || 0;
                cropMap[k].rat += parseInt(r.rat_damage) || 0;
            });
        }

        const allKeys = new Set([
            ...Object.keys(cropMap),
            ...Object.keys(tonaseMap),
            ...Object.keys(lfMap)
        ]);

        let rowItems = [];
        allKeys.forEach(k => {
            const parts = k.split('_');
            const d = parts[0];
            const est = parts.slice(1).join('_');
            if (!d || !est) return;

            // Date filtering
            if (d < startDate || d > endDate) return;

            // Estate filtering
            if (selectedEstate !== 'ALL') {
                if (est.trim().toLowerCase() !== selectedEstate.trim().toLowerCase()) return;
            } else {
                if (activeFfbEstates.size > 0 && !activeFfbEstates.has(est)) {
                    if (!cropMap[k] && !tonaseMap[k]) return;
                }
            }

            const cData = cropMap[k] || { tot: 0, unripe: 0, under: 0, normal: 0, over: 0, empty: 0, long: 0, rat: 0 };
            const ffbTon = tonaseMap[k] !== undefined ? tonaseMap[k] : (lfMap[k] ? lfMap[k].ffb_ton : 0);
            const lfData = lfMap[k] || { lf_ton: 0, ffb_ton: ffbTon };

            const totJ = cData.tot;
            const p_unripe = totJ > 0 ? (cData.unripe / totJ * 100) : 0;
            const p_under = totJ > 0 ? (cData.under / totJ * 100) : 0;
            const p_ripe = totJ > 0 ? (cData.normal / totJ * 100) : 0;
            const p_over = totJ > 0 ? (cData.over / totJ * 100) : 0;
            const p_empty = totJ > 0 ? (cData.empty / totJ * 100) : 0;
            const p_long = totJ > 0 ? (cData.long / totJ * 100) : 0;
            const p_rat = totJ > 0 ? (cData.rat / totJ * 100) : 0;

            const lfTon = lfData.lf_ton || 0;
            const ffbTonForLf = ffbTon > 0 ? ffbTon : (lfData.ffb_ton || 0);
            const p_lf = ffbTonForLf > 0 ? ((lfTon / ffbTonForLf) * 100) : 0;

            if (ffbTon <= 0 && totJ <= 0 && lfTon <= 0) return;

            rowItems.push({
                date: d,
                estate: est,
                abbr: getAbbr(est),
                ffbTon: ffbTon,
                totJ: totJ,
                unripe: p_unripe,
                under: p_under,
                ripe: p_ripe,
                over: p_over,
                empty: p_empty,
                long: p_long,
                rat: p_rat,
                lfTon: lfTon,
                lf: p_lf
            });
        });

        // Sort by Date ASC, Estate ASC
        rowItems.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.estate.localeCompare(b.estate);
        });

        window.ffqDetailData = rowItems;

        if (tbody) tbody.innerHTML = '';

        if (rowItems.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="12" style="padding: 20px; color: #64748b; font-style: italic;">Tidak ada data pada rentang tanggal dan estate yang dipilih.</td></tr>';
            document.getElementById('ffqd-tot-ffb').innerText = '0.00';
            document.getElementById('ffqd-avg-unripe').innerText = '0.00';
            document.getElementById('ffqd-avg-under').innerText = '0.00';
            document.getElementById('ffqd-avg-ripe').innerText = '0.00';
            document.getElementById('ffqd-avg-over').innerText = '0.00';
            document.getElementById('ffqd-avg-empty').innerText = '0.00';
            document.getElementById('ffqd-avg-long').innerText = '0.00';
            document.getElementById('ffqd-avg-rat').innerText = '0.00';
            document.getElementById('ffqd-avg-lf').innerText = '0.00';
            return;
        }

        let sumGradingWeight = 0;
        let sumFfbTon = 0;
        let sumLfTon = 0;
        let sumUnripeW = 0;
        let sumUnderW = 0;
        let sumRipeW = 0;
        let sumOverW = 0;
        let sumEmptyW = 0;
        let sumLongW = 0;
        let sumRatW = 0;

        rowItems.forEach((r, idx) => {
            const tr = document.createElement('tr');
            
            // Total FFB & LF includes ALL rows (even if no grading)
            sumFfbTon += r.ffbTon;
            sumLfTon += r.lfTon;

            // Grading parameters ONLY include rows with actual grading samples (r.totJ > 0)
            if (r.totJ > 0) {
                const wGrading = r.ffbTon > 0 ? r.ffbTon : (r.totJ > 0 ? (r.totJ / 100) : 1);
                sumGradingWeight += wGrading;
                sumUnripeW += r.unripe * wGrading;
                sumUnderW += r.under * wGrading;
                sumRipeW += r.ripe * wGrading;
                sumOverW += r.over * wGrading;
                sumEmptyW += r.empty * wGrading;
                sumLongW += r.long * wGrading;
                sumRatW += r.rat * wGrading;
            }

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td style="font-weight: 500;">${r.date}</td>
                <td style="text-align: center; font-weight: 600;">${r.abbr}</td>
                <td style="font-weight: 600;">${r.ffbTon.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="${r.totJ > 0 && r.unripe > 0 ? 'color:#ef4444; font-weight:bold;' : ''}">${r.unripe.toFixed(2)}</td>
                <td style="${r.totJ > 0 && r.under > 3 ? 'color:#ef4444; font-weight:bold;' : ''}">${r.under.toFixed(2)}</td>
                <td style="${r.totJ > 0 && r.ripe < 90 ? 'color:#ef4444; font-weight:bold;' : (r.totJ > 0 && r.ripe >= 90 ? 'color:#10b981; font-weight:bold;' : '')}">${r.ripe.toFixed(2)}</td>
                <td style="${r.totJ > 0 && r.over > 7 ? 'color:#ef4444; font-weight:bold;' : ''}">${r.over.toFixed(2)}</td>
                <td style="${r.totJ > 0 && r.empty > 0 ? 'color:#ef4444; font-weight:bold;' : ''}">${r.empty.toFixed(2)}</td>
                <td style="${r.totJ > 0 && r.long >= 2 ? 'color:#ef4444; font-weight:bold;' : ''}">${r.long.toFixed(2)}</td>
                <td>${r.rat.toFixed(2)}</td>
                <td style="font-weight: 500;">${r.lf.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Compute Weighted Averages using sumGradingWeight for grading, and sumFfbTon for LF
        const avgUnripe = sumGradingWeight > 0 ? (sumUnripeW / sumGradingWeight) : 0;
        const avgUnder = sumGradingWeight > 0 ? (sumUnderW / sumGradingWeight) : 0;
        const avgRipe = sumGradingWeight > 0 ? (sumRipeW / sumGradingWeight) : 0;
        const avgOver = sumGradingWeight > 0 ? (sumOverW / sumGradingWeight) : 0;
        const avgEmpty = sumGradingWeight > 0 ? (sumEmptyW / sumGradingWeight) : 0;
        const avgLong = sumGradingWeight > 0 ? (sumLongW / sumGradingWeight) : 0;
        const avgRat = sumGradingWeight > 0 ? (sumRatW / sumGradingWeight) : 0;
        const avgLf = sumFfbTon > 0 ? ((sumLfTon / sumFfbTon) * 100) : 0;

        document.getElementById('ffqd-tot-ffb').innerText = sumFfbTon.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('ffqd-avg-unripe').innerText = avgUnripe.toFixed(2);
        document.getElementById('ffqd-avg-under').innerText = avgUnder.toFixed(2);
        document.getElementById('ffqd-avg-ripe').innerText = avgRipe.toFixed(2);
        document.getElementById('ffqd-avg-over').innerText = avgOver.toFixed(2);
        document.getElementById('ffqd-avg-empty').innerText = avgEmpty.toFixed(2);
        document.getElementById('ffqd-avg-long').innerText = avgLong.toFixed(2);
        document.getElementById('ffqd-avg-rat').innerText = avgRat.toFixed(2);
        document.getElementById('ffqd-avg-lf').innerText = avgLf.toFixed(2);

    } catch(err) {
        console.error('Error loading FFQ Detail data:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="12" style="padding: 20px; color: #ef4444;">Gagal memuat data Detail FFQ: ' + err.message + '</td></tr>';
    }
};

window.exportFFQDetailCSV = function() {
    if (!window.ffqDetailData || window.ffqDetailData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const startInput = document.getElementById('fq-detail-start-date');
    const endInput = document.getElementById('fq-detail-end-date');
    const startDate = startInput ? startInput.value : 'start';
    const endDate = endInput ? endInput.value : 'end';

    let csv = 'No,Tanggal,Estate,FFB (Ton),Unripe (%),Underripe (%),Ripe (%),Over Ripe (%),Empty Bunch (%),Long Stalk (%),Rat Damage (%),LF (%)\n';

    window.ffqDetailData.forEach((r, idx) => {
        csv += `${idx + 1},"${r.date}","${r.abbr}",${r.ffbTon.toFixed(2)},${r.unripe.toFixed(2)},${r.under.toFixed(2)},${r.ripe.toFixed(2)},${r.over.toFixed(2)},${r.empty.toFixed(2)},${r.long.toFixed(2)},${r.rat.toFixed(2)},${r.lf.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Detail_FFQ_FFB_Crop_Quality_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};