// --- MILL MODULES (Processing, Water, FFB Quality, Dashboard) ---
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
var API_URL = window.API_URL;
if (!window.views) window.views = {};
var views = window.views;


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
    const readOnlyRoles = ['Manager Mill', 'Supervisor Mill', 'Office Assistant Mill'];
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
    const readOnlyRoles = ['Manager Mill', 'Supervisor Mill', 'Office Assistant Mill'];
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
    <button class="subsheet-tab-btn active" id="tab-btn-loose" onclick="switchFFBSubTab('loose')">
        <i class="fa-solid fa-seedling"></i> FFB Quality Fruit Loose Analysis
    </button>
    <button class="subsheet-tab-btn" id="tab-btn-crop" onclick="switchFFBSubTab('crop')">
        <i class="fa-solid fa-wheat-awn"></i> Daily FFB Crop Quality
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
                        <td colspan="4" style="text-align: right;">RATA-RATA / TOTAL:</td>
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
            <h3 style="margin: 0;">Tambah input Loose Fruit Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="date" id="fq-modal-date" class="form-control">
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
            <button class="btn btn-primary" onclick="submitFFBModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
        </div>
    </div>
</div>

<!-- Modal Input FFB Crop Quality -->
<div class="modal-overlay" id="modal-ffb-crop-quality" style="display:none; z-index: 1000;">
    <div class="modal-content" style="width: 500px; max-width: 90%;">
        <div class="modal-header">
            <h3 style="margin: 0;">Tambah input FFB Crop Quality</h3>
            <button type="button" class="modal-close" onclick="document.getElementById('modal-ffb-crop-quality').style.display='none'">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group">
                <label>Tanggal</label>
                <input type="date" id="fqc-modal-date" class="form-control">
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
            <button class="btn btn-primary" onclick="submitFFBCropModal()" style="width:100%; justify-content:center; margin-top:10px;">Simpan</button>
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
    
    document.querySelectorAll('.subsheet-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.subsheet-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const activeContent = document.getElementById(`ffb-subsheet-${tabId}`);
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
    }
    
    try {
        if (tabId === 'loose') {
            if (typeof window.loadFFBQuality === 'function') window.loadFFBQuality();
        } else if (tabId === 'crop') {
            if (typeof window.loadFFBCropQuality === 'function') window.loadFFBCropQuality();
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
    const readOnlyRoles = ['Manager Mill', 'Supervisor Mill', 'Office Assistant Mill'];
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

    document.getElementById('fq-tot-bg').innerText = totBg.toFixed(0);
    document.getElementById('fq-tot-bd').innerText = totBd.toFixed(0);
    document.getElementById('fq-tot-ts').innerText = totTs.toFixed(0);
    document.getElementById('fq-tot-bb').innerText = totBb.toFixed(0);
    document.getElementById('fq-tot-sampah').innerText = totSampah.toFixed(0);

    if (totBg > 0) {
        document.getElementById('fq-avg-bd').innerText = ((totBd / totBg) * 100).toFixed(1);
        document.getElementById('fq-avg-ts').innerText = ((totTs / totBg) * 100).toFixed(1);
        document.getElementById('fq-avg-bb').innerText = ((totBb / totBg) * 100).toFixed(1);
        document.getElementById('fq-avg-sampah').innerText = ((totSampah / totBg) * 100).toFixed(1);
    } else {
        document.getElementById('fq-avg-bd').innerText = '0.0';
        document.getElementById('fq-avg-ts').innerText = '0.0';
        document.getElementById('fq-avg-bb').innerText = '0.0';
        document.getElementById('fq-avg-sampah').innerText = '0.0';
    }
};

window.renderFFBTable = function(isSingleDay = true) {
    const tbody = document.querySelector('#ffb-quality-table tbody');
    tbody.innerHTML = '';
    
    let abbrMap = {};
    if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
        masterData.supply_chain_list.forEach(item => {
            abbrMap[item.name] = item.abbr;
        });
    }
    const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');
    
    window.ffbQualityData.forEach((data, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data.date}</td>
            <td>${getAbbr(data.estate)}</td>
            <td>${data.divisi}</td>
            <td>${data.no_truck}</td>
            <td>${parseFloat(data.bg_gram).toFixed(0)}</td>
            <td>${parseFloat(data.bd_gram).toFixed(0)}</td>
            <td>${parseFloat(data.bd_percent).toFixed(1)}</td>
            <td>${parseFloat(data.t_segar_gram).toFixed(0)}</td>
            <td>${parseFloat(data.t_segar_percent).toFixed(1)}</td>
            <td>${parseFloat(data.busuk_gram).toFixed(0)}</td>
            <td>${parseFloat(data.busuk_percent).toFixed(1)}</td>
            <td>${parseFloat(data.sampah_gram).toFixed(0)}</td>
            <td>${parseFloat(data.sampah_percent).toFixed(1)}</td>
            <td>${isSingleDay ? `<button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteFFBRow(${index})"><i class="fa-solid fa-trash"></i></button>` : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    window.calculateFFBAverages();
};

window.deleteFFBRow = async function(index) {
    if(confirm('Hapus baris ini?')) {
        window.ffbQualityData.splice(index, 1);
        window.renderFFBTable();
        await window.saveFFBQuality();
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
            res = await fetch(`/api/ffb_quality/${mill}/${start}`);
        } else {
            res = await fetch(`/api/ffb_quality/range/${mill}/${start}/${end}`);
        }
        window.ffbQualityData = await res.json();
    } catch(e) {
        console.error(e);
        window.ffbQualityData = [];
    }
    window.renderFFBTable(start === end);
};

window.saveFFBQuality = async function() {
    const date = document.getElementById('fq-modal-date').value || window.getLocalDate();
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

window.onFFBModalEstateChange = async function(estate) {
    const container = document.getElementById('fq-modal-divisi-container');
    if (!container) return;
    
    container.innerHTML = '<input type="text" class="form-control" disabled value="Loading...">';
    
    try {
        const res = await fetch(`${API_URL}/master/${encodeURIComponent(estate)}`);
        const data = await res.json();
        
        if (data && data.divisi && data.divisi.length > 0) {
            let sel = `<select id="fq-modal-divisi" class="form-control">`;
            sel += `<option value="">-- Pilih Divisi (Opsional) --</option>`;
            data.divisi.forEach(d => {
                sel += `<option value="${d.name}">${d.name}</option>`;
            });
            sel += `</select>`;
            container.innerHTML = sel;
        } else {
            container.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
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
    } catch(e) {
        console.error(e);
        container.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
    }
};

window.openFFBModal = function() {
    const modal = document.getElementById('modal-ffb-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }
    
    const dateEl = document.getElementById('fq-modal-date');
    if (dateEl) dateEl.value = window.getLocalDate();
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}">${s.estate}</option>`).join('')
        : '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    if (!estatesOpts) estatesOpts = '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    
    const estEl = document.getElementById('fq-modal-estate');
    if (estEl) estEl.innerHTML = estatesOpts;
    
    const divCont = document.getElementById('fq-modal-divisi-container');
    if (divCont) divCont.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
    
    if (estEl && estEl.value) {
        try { window.onFFBModalEstateChange(estEl.value); } catch(e){ console.error(e); }
    }
};

window.openFFBCropModal = function() {
    const modal = document.getElementById('modal-ffb-crop-quality');
    if (modal) {
        if (typeof document !== 'undefined' && document.body && modal.parentNode !== document.body) { document.body.appendChild(modal); }
        modal.style.display = 'flex';
    }

    const dateEl = document.getElementById('fq-crop-modal-date');
    if (dateEl) dateEl.value = window.getLocalDate();
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}">${s.estate}</option>`).join('')
        : '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    if (!estatesOpts) estatesOpts = '<option value="Bunga Tanjung Estate">Bunga Tanjung Estate</option>';
    
    const estEl = document.getElementById('fq-crop-modal-estate');
    if (estEl) estEl.innerHTML = estatesOpts;
    
    const divCont = document.getElementById('fq-crop-modal-divisi-container');
    if (divCont) divCont.innerHTML = `<input type="text" id="fq-crop-modal-divisi" class="form-control" placeholder="(Optional)">`;
    
    if (estEl && estEl.value) {
        try { window.onFFBCropModalEstateChange(estEl.value); } catch(e){ console.error(e); }
    }
};

window.calculateFFBModal = function() {
    const bg = parseFloat(document.getElementById('fq-modal-bg').value) || 0;
    const bd = parseFloat(document.getElementById('fq-modal-bd').value) || 0;
    const ts = parseFloat(document.getElementById('fq-modal-tsegar').value) || 0;
    const bb = parseFloat(document.getElementById('fq-modal-busuk').value) || 0;
    
    const sampah = bg - bd - ts - bb;
    document.getElementById('fq-modal-sampah').value = sampah.toFixed(2);
};

window.submitFFBModal = async function() {
    const modalDate = document.getElementById('fq-modal-date').value;
    const fqDateElem = document.getElementById('fq-date');
    const mainDate = fqDateElem ? fqDateElem.value : null;
    
    if (modalDate && fqDateElem && modalDate !== mainDate) {
        fqDateElem.value = modalDate;
        await window.loadFFBQuality();
    }

    const estate = document.getElementById('fq-modal-estate').value;
    const divisi = document.getElementById('fq-modal-divisi') ? document.getElementById('fq-modal-divisi').value : '';
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
    
    const data = {
        date: modalDate || mainDate || window.getLocalDate(),
        estate: estate,
        divisi: divisi,
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
    
    window.ffbQualityData.push(data);
    document.getElementById('modal-ffb-quality').style.display = 'none';
    
    window.renderFFBTable();
    await window.saveFFBQuality();
};


window.loadFFBCropQuality = async function(start, end) {
    if (!start) start = window.getLocalDate();
    if (!end) end = start;

    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    try {
        let res;
        if (start === end) {
            res = await fetch(`/api/ffb_crop_quality/${mill}/${start}`);
        } else {
            res = await fetch(`/api/ffb_crop_quality/range/${mill}/${start}/${end}`);
        }
        window.ffbCropQualityData = await res.json();

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
    const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

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
                <td><button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteFFBCropRow(${index})"><i class="fa-solid fa-trash"></i></button></td>
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
        let totalTonaseSum = 0;
        
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

        document.getElementById('fqc-sum-unripe').innerText = pt_unripe.toFixed(2);
        document.getElementById('fqc-sum-under').innerText = pt_under.toFixed(2);
        document.getElementById('fqc-sum-normal').innerText = pt_normal.toFixed(2);
        document.getElementById('fqc-sum-over').innerText = pt_over.toFixed(2);
        document.getElementById('fqc-sum-empty').innerText = pt_empty.toFixed(2);
        document.getElementById('fqc-sum-long').innerText = pt_long.toFixed(2);
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
        document.getElementById('fqc-tot-unripe').innerText = t_unripe;
        document.getElementById('fqc-tot-under').innerText = t_under;
        document.getElementById('fqc-tot-normal').innerText = t_normal;
        document.getElementById('fqc-tot-over').innerText = t_over;
        document.getElementById('fqc-tot-empty').innerText = t_empty;
        document.getElementById('fqc-tot-long').innerText = t_long;
        if (document.getElementById('fqc-tot-rat')) document.getElementById('fqc-tot-rat').innerText = t_rat;

        if (t_tot > 0) {
            document.getElementById('fqc-avg-unripe').innerText = ((t_unripe / t_tot) * 100).toFixed(1);
            document.getElementById('fqc-avg-under').innerText = ((t_under / t_tot) * 100).toFixed(1);
            document.getElementById('fqc-avg-normal').innerText = ((t_normal / t_tot) * 100).toFixed(1);
            document.getElementById('fqc-avg-over').innerText = ((t_over / t_tot) * 100).toFixed(1);
            document.getElementById('fqc-avg-empty').innerText = ((t_empty / t_tot) * 100).toFixed(1);
            document.getElementById('fqc-avg-long').innerText = ((t_long / t_tot) * 100).toFixed(1);
            if (document.getElementById('fqc-avg-rat')) document.getElementById('fqc-avg-rat').innerText = ((t_rat / t_tot) * 100).toFixed(1);
        } else {
            document.getElementById('fqc-avg-unripe').innerText = '0.0';
            document.getElementById('fqc-avg-under').innerText = '0.0';
            document.getElementById('fqc-avg-normal').innerText = '0.0';
            document.getElementById('fqc-avg-over').innerText = '0.0';
            document.getElementById('fqc-avg-empty').innerText = '0.0';
            document.getElementById('fqc-avg-long').innerText = '0.0';
            if (document.getElementById('fqc-avg-rat')) document.getElementById('fqc-avg-rat').innerText = '0.0';
        }
    }
};

window.deleteFFBCropRow = async function(index) {
    if(confirm('Hapus baris ini?')) {
        window.ffbCropQualityData.splice(index, 1);
        window.renderFFBCropTable();
        await window.saveFFBCropQuality();
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
    
    document.getElementById('modal-ffb-crop-quality').style.display = 'flex';
};

window.calculateFFBCropModal = function() {
    const tot = parseInt(document.getElementById('fqc-modal-total').value) || 0;
    const u = parseInt(document.getElementById('fqc-modal-unripe').value) || 0;
    const un = parseInt(document.getElementById('fqc-modal-underripe').value) || 0;
    const o = parseInt(document.getElementById('fqc-modal-over').value) || 0;
    const e = parseInt(document.getElementById('fqc-modal-empty').value) || 0;
    
    let n = tot - (u + un + o + e);
    if (n < 0) n = 0;
    document.getElementById('fqc-modal-normal').value = n;
};

window.submitFFBCropModal = async function() {
    const modalDate = document.getElementById('fqc-modal-date').value;
    const fqDateElem = document.getElementById('fq-date');
    const mainDate = fqDateElem ? fqDateElem.value : null;
    
    if (modalDate && fqDateElem && modalDate !== mainDate) {
        fqDateElem.value = modalDate;
        await window.loadFFBQuality();
        if(window.loadFFBCropQuality) await window.loadFFBCropQuality();
    }

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
    
    const data = {
        date: modalDate || mainDate || window.getLocalDate(),
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
    
    window.ffbCropQualityData.push(data);
    document.getElementById('modal-ffb-crop-quality').style.display = 'none';
    
    window.renderFFBCropTable();
    await window.saveFFBCropQuality();
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
    if (tbody) tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

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

        // Fetch FFB Crop Quality data
        try {
            const ffbUrl = (startDate === endDate)
                ? `/api/ffb_crop_quality/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}`
                : `/api/ffb_crop_quality/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`;
            const ffbRes = await fetch(ffbUrl);
            if (ffbRes.ok) {
                rawData = await ffbRes.json();
            } else {
                console.warn('ffb_crop_quality response not ok:', ffbRes.status);
            }
        } catch(errFfb) {
            console.error('Error fetching ffb_crop_quality:', errFfb);
        }

        // Fetch Tonase data
        try {
            const tonaseUrl = (startDate === endDate)
                ? `/api/tonase/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}`
                : `/api/tonase/range/${encodeURIComponent(mill)}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`;
            const tonaseRes = await fetch(tonaseUrl);
            if (tonaseRes.ok) {
                rawTonase = await tonaseRes.json();
            } else {
                console.warn('tonase response not ok:', tonaseRes.status);
            }
        } catch(errTonase) {
            console.error('Error fetching tonase range:', errTonase);
        }

        // Aggregate tonase from tonase_hourly by estate (realized_kg / 1000 = TON)
        const tonaseByEst = {};
        if (Array.isArray(rawTonase)) {
            rawTonase.forEach(row => {
                const e = row.estate || 'Unknown';
                const ton = (parseFloat(row.realized_kg) || 0) / 1000;
                tonaseByEst[e] = (tonaseByEst[e] || 0) + ton;
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

        if (Object.keys(estData).length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="color: #64748b; font-style: italic; text-align: center;">Tidak ada data.</td></tr>';
            const totTonaseEl = document.getElementById('dash-fqc-tot-tonase');
            if (totTonaseEl) totTonaseEl.innerText = '0.00';
            document.getElementById('dash-fqc-avg-unripe').innerText = '0.0';
            document.getElementById('dash-fqc-avg-under').innerText = '0.0';
            document.getElementById('dash-fqc-avg-normal').innerText = '0.0';
            document.getElementById('dash-fqc-avg-over').innerText = '0.0';
            document.getElementById('dash-fqc-avg-empty').innerText = '0.0';
            document.getElementById('dash-fqc-avg-long').innerText = '0.0';
            if (document.getElementById('dash-fqc-avg-rat')) document.getElementById('dash-fqc-avg-rat').innerText = '0.0';
            return;
        }

        let sumWeightedUnripe = 0;
        let sumWeightedUnder = 0;
        let sumWeightedRipe = 0;
        let sumWeightedOver = 0;
        let sumWeightedEmpty = 0;
        let sumWeightedLong = 0;
        let sumWeightedRat = 0;
        let totalAllEstTonase = 0;
        let t_tot = 0, t_u = 0, t_un = 0, t_n = 0, t_o = 0, t_e = 0, t_l = 0, t_rat = 0;

        let abbrMap = {};
        if (typeof masterData !== 'undefined' && masterData.supply_chain_list) {
            masterData.supply_chain_list.forEach(item => {
                abbrMap[item.name] = item.abbr;
            });
        }
        const getAbbr = (estName) => abbrMap[estName] || estName.replace(' Estate', 'E');

        const getEstateTonase = (estName) => {
            if (tonaseByEst[estName] !== undefined) return tonaseByEst[estName];
            for (let k in tonaseByEst) {
                if (getAbbr(k) === getAbbr(estName) || k.toLowerCase() === estName.toLowerCase()) {
                    return tonaseByEst[k];
                }
            }
            return 0;
        };

        Object.keys(estData).forEach(est => {
            const d = estData[est];
            const tot = d.total_janjang;
            t_tot += tot; t_u += d.unripe; t_un += d.underripe; t_n += d.normal_ripe; t_o += d.over_ripe; t_e += d.empty_bunch; t_l += d.long_stalk; t_rat += d.rat_damage;
            
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
            totalAllEstTonase += estTonase;

            sumWeightedUnripe += (estTonase * p_u_num);
            sumWeightedUnder += (estTonase * p_un_num);
            sumWeightedRipe += (estTonase * p_n_num);
            sumWeightedOver += (estTonase * p_o_num);
            sumWeightedEmpty += (estTonase * p_e_num);
            sumWeightedLong += (estTonase * p_l_num);
            sumWeightedRat += (estTonase * p_rat_num);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${getAbbr(est)}</td>
                <td style="font-weight: 600;">${estTonase.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="color: ${parseFloat(p_u) > 0 ? 'red' : 'inherit'}">${p_u}</td>
                <td style="color: ${parseFloat(p_un) > 3 ? 'red' : 'inherit'}">${p_un}</td>
                <td style="color: ${parseFloat(p_n) < 90 ? 'red' : 'inherit'}">${p_n}</td>
                <td style="color: ${parseFloat(p_o) > 7 ? 'red' : 'inherit'}">${p_o}</td>
                <td style="color: ${parseFloat(p_e) > 0 ? 'red' : 'inherit'}">${p_e}</td>
                <td style="color: ${parseFloat(p_l) >= 2 ? 'red' : 'inherit'}">${p_l}</td>
                <td>${p_rat}</td>
            `;
            if (tbody) tbody.appendChild(tr);
        });

        // Weighted Totals by Tonase (Interpolasi: SUM(Tonase * %) / Total Tonase)
        const p_tu = totalAllEstTonase > 0 
            ? (sumWeightedUnripe / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_u / t_tot * 100).toFixed(2) : '0.00');
        const p_tun = totalAllEstTonase > 0 
            ? (sumWeightedUnder / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_un / t_tot * 100).toFixed(2) : '0.00');
        const p_tn = totalAllEstTonase > 0 
            ? (sumWeightedRipe / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_n / t_tot * 100).toFixed(2) : '0.00');
        const p_to = totalAllEstTonase > 0 
            ? (sumWeightedOver / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_o / t_tot * 100).toFixed(2) : '0.00');
        const p_te = totalAllEstTonase > 0 
            ? (sumWeightedEmpty / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_e / t_tot * 100).toFixed(2) : '0.00');
        const p_tl = totalAllEstTonase > 0 
            ? (sumWeightedLong / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_l / t_tot * 100).toFixed(2) : '0.00');
        const p_trat = totalAllEstTonase > 0 
            ? (sumWeightedRat / totalAllEstTonase).toFixed(2) 
            : (t_tot > 0 ? (t_rat / t_tot * 100).toFixed(2) : '0.00');

        const totTonaseEl = document.getElementById('dash-fqc-tot-tonase');
        if (totTonaseEl) totTonaseEl.innerText = totalAllEstTonase.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        document.getElementById('dash-fqc-avg-unripe').innerText = p_tu;
        document.getElementById('dash-fqc-avg-under').innerText = p_tun;
        document.getElementById('dash-fqc-avg-normal').innerText = p_tn;
        document.getElementById('dash-fqc-avg-over').innerText = p_to;
        document.getElementById('dash-fqc-avg-empty').innerText = p_te;
        document.getElementById('dash-fqc-avg-long').innerText = p_tl;
        if (document.getElementById('dash-fqc-avg-rat')) document.getElementById('dash-fqc-avg-rat').innerText = p_trat;
        
        document.getElementById('dash-fqc-avg-unripe').style.color = parseFloat(p_tu) > 0 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-under').style.color = parseFloat(p_tun) > 3 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-normal').style.color = parseFloat(p_tn) < 90 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-over').style.color = parseFloat(p_to) > 7 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-empty').style.color = parseFloat(p_te) > 0 ? 'red' : 'inherit';
        document.getElementById('dash-fqc-avg-long').style.color = parseFloat(p_tl) >= 2 ? 'red' : 'inherit';
    } catch(err) {
        console.error(err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="color: #ef4444; text-align: center;">Error loading data.</td></tr>';
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
