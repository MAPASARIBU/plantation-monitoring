// --- MILL MODULES (Processing, Water, FFB Quality, Dashboard) ---
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
// API_URL used from global or window
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
if (!window.views) window.views = {};
window.views = window.views || (typeof views !== 'undefined' ? views : {});
// const views = window.views;
window.views = window.views || {};


// 1. PROCESSING VIEW
window.views.processing = `
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
    const readOnlyRoles = ['Senior Field Manager', 'Director', 'Senior Mill Manager', 'Office Head Assistant'];
    if (window.currentUser && readOnlyRoles.includes(window.currentUser.role)) {
        document.querySelectorAll('#view-container .btn-success, #view-container .btn-tonase-action').forEach(el => el.style.display = 'none');
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
window.views.water = `
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
    const readOnlyRoles = ['Senior Field Manager', 'Director', 'Senior Mill Manager', 'Office Head Assistant'];
    if (window.currentUser && readOnlyRoles.includes(window.currentUser.role)) {
        document.querySelectorAll('#view-container .btn-success, #view-container .btn-tonase-action').forEach(el => el.style.display = 'none');
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
window.views.ffb_quality = `
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

    const canInput = window.hasPermission ? window.hasPermission('ffb_quality', 'input') : false;
    document.querySelectorAll('#view-container button[onclick*="openFFB"], #view-container .btn-success').forEach(el => {
        el.style.display = canInput ? 'inline-flex' : 'none';
    });
    
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

    const canInput = window.hasPermission ? window.hasPermission('ffb_quality', 'input') : false;
    document.querySelectorAll('#view-container button[onclick*="openFFB"], #view-container .btn-success').forEach(el => {
        el.style.display = canInput ? 'inline-flex' : 'none';
    });
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
    
    const canDelete = window.hasPermission ? window.hasPermission('ffb_quality', 'delete') : false;
    const canEdit = window.hasPermission ? window.hasPermission('ffb_quality', 'edit') : false;

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
    if (window.hasPermission && !window.hasPermission('ffb_quality', 'delete')) {
        alert('Akses Ditolak: Anda tidak memiliki otoritas untuk menghapus data Loose Fruit.');
        return;
    }
    if (!confirm('Hapus baris data grading Loose Fruit ini?')) return;
    try {
        const item = (Array.isArray(window.ffbQualityData) && window.ffbQualityData[index]) ? window.ffbQualityData[index] : null;
        const targetId = id || (item ? item.id : null);
        
        if (targetId) {
            let res = await fetch(`/api/ffb_quality/${targetId}`, { method: 'DELETE' });
            if (!res.ok) {
                await fetch(`/api/ffb_quality/delete/${targetId}`, { method: 'POST' });
            }
        }
        if (item) {
            await fetch('/api/ffb_quality/delete_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, id: targetId })
            });
        }
        if (Array.isArray(window.ffbQualityData) && index >= 0 && index < window.ffbQualityData.length) {
            window.ffbQualityData.splice(index, 1);
        }
        if (typeof window.saveFFBQuality === 'function') {
            await window.saveFFBQuality();
        }
        const startDate = window.currentFfbStartDate || (item ? item.date : window.getLocalDate());
        const endDate = window.currentFfbEndDate || startDate;
        await window.loadFFBQuality(startDate, endDate);
        alert('Baris data grading Loose Fruit berhasil dihapus.');
    } catch(e) {
        console.error('Error deleting row:', e);
        alert('Gagal menghapus baris data: ' + e.message);
    }
};

window.loadFFBQuality = async function(start, end) {
    if (!start) start = window.currentFfbStartDate || window.getLocalDate();
    if (!end) end = window.currentFfbEndDate || start;
    window.currentFfbStartDate = start;
    window.currentFfbEndDate = end;

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
    const date = (window.ffbQualityData && window.ffbQualityData.length > 0 && window.ffbQualityData[0].date) 
        ? window.ffbQualityData[0].date 
        : (document.getElementById('fq-modal-date')?.value || window.currentFfbStartDate || window.getLocalDate());
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
    window.currentEditingFfbId = null;
    window.currentEditingFfbIndex = null;

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

    window.currentEditingFfbId = data.id || null;
    window.currentEditingFfbIndex = index;

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

    const editId = (document.getElementById('fq-modal-edit-id')?.value) || window.currentEditingFfbId;
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
            const res = await fetch(`/api/ffb_quality/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Gagal update data');
        } else {
            const res = await fetch('/api/ffb_quality/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Gagal tambah data');
        }
        window.currentEditingFfbId = null;
        window.currentEditingFfbIndex = null;
        const modalEl = document.getElementById('modal-ffb-quality');
        if (modalEl) modalEl.style.display = 'none';
        if (fqDateElem) fqDateElem.value = saveDate;
        await window.loadFFBQuality(saveDate, saveDate);
    } catch(e) {
        console.error('Error saving FFB quality:', e);
        alert('Gagal menyimpan data FFB quality.');
    }
};

// --- FFB CROP QUALITY ---
window.loadFFBCropQuality = async function(start, end) {
    if (!start) start = window.currentFfbCropStartDate || window.getLocalDate();
    if (!end) end = window.currentFfbCropEndDate || start;
    window.currentFfbCropStartDate = start;
    window.currentFfbCropEndDate = end;

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
    const date = (window.ffbCropQualityData && window.ffbCropQualityData.length > 0 && window.ffbCropQualityData[0].date) 
        ? window.ffbCropQualityData[0].date 
        : (document.getElementById('fqc-modal-date')?.value || window.currentFfbCropStartDate || window.getLocalDate());
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

    const canDelete = window.hasPermission ? window.hasPermission('ffb_quality', 'delete') : false;
    const canEdit = window.hasPermission ? window.hasPermission('ffb_quality', 'edit') : false;

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
    if (window.hasPermission && !window.hasPermission('ffb_quality', 'delete')) {
        alert('Akses Ditolak: Anda tidak memiliki otoritas untuk menghapus data FFB Crop Quality.');
        return;
    }
    if (!confirm('Hapus baris data grading Daily FFB Crop Quality ini?')) return;
    try {
        const item = (Array.isArray(window.ffbCropQualityData) && window.ffbCropQualityData[index]) ? window.ffbCropQualityData[index] : null;
        const targetId = id || (item ? item.id : null);
        
        if (targetId) {
            let res = await fetch(`/api/ffb_crop_quality/${targetId}`, { method: 'DELETE' });
            if (!res.ok) {
                await fetch(`/api/ffb_crop_quality/delete/${targetId}`, { method: 'POST' });
            }
        }
        if (item) {
            await fetch('/api/ffb_crop_quality/delete_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, id: targetId })
            });
        }
        if (Array.isArray(window.ffbCropQualityData) && index >= 0 && index < window.ffbCropQualityData.length) {
            window.ffbCropQualityData.splice(index, 1);
        }
        if (typeof window.saveFFBCropQuality === 'function') {
            await window.saveFFBCropQuality();
        }
        const startDate = window.currentFfbCropStartDate || (item ? item.date : window.getLocalDate());
        const endDate = window.currentFfbCropEndDate || startDate;
        await window.loadFFBCropQuality(startDate, endDate);
        alert('Baris data grading Daily FFB Crop Quality berhasil dihapus.');
    } catch(e) {
        console.error('Error deleting crop row:', e);
        alert('Gagal menghapus baris data: ' + e.message);
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
    window.currentEditingCropId = null;
    window.currentEditingCropIndex = null;

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

    window.currentEditingCropId = data.id || null;
    window.currentEditingCropIndex = index;

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

    const editId = (document.getElementById('fqc-modal-edit-id')?.value) || window.currentEditingCropId;
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
            const res = await fetch(`/api/ffb_crop_quality/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Gagal update data');
        } else {
            const res = await fetch('/api/ffb_crop_quality/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Gagal tambah data');
        }
        window.currentEditingCropId = null;
        window.currentEditingCropIndex = null;
        const modalEl = document.getElementById('modal-ffb-crop-quality');
        if (modalEl) modalEl.style.display = 'none';
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
window.views.mill_dashboard = `
<div class="animate-fade-in" style="padding-top: 10px;">

<!-- Dashboard Extra Sections (Processing & Water) -->
<div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
    <div style="display: flex; flex-direction: column;">
        <h2 style="margin: 0; font-size: 1.35rem; color: #1e293b; font-weight: 700;">Processing & Water Analysis</h2>
        <span id="dash-extra-date-label" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; margin-top: 2px;">Monitoring Hasil Inputan Report Bulanan</span>
    </div>
    <button class="btn btn-primary btn-sm" onclick="document.getElementById('dashboard-extra-date-modal').style.display='flex';" style="border-radius: 6px; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left"></i> Historical Pop Up</button>
</div>

<!-- Monthly Liquid Monitoring Card -->
<div class="glass-card" style="margin-top: 15px; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
        <div style="display: flex; flex-direction: column;">
            <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700;"><i class="fa-solid fa-flask-vial" style="color: #0d8b4e; margin-right: 8px;"></i>Monthly Liquid Monitoring</h3>
            <span style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Rata-rata Harian Parameter Cairan & Mutu Produksi CPO Day-by-Day (1-31)</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; color: #475569; font-size: 0.88rem;"><i class="fa-regular fa-calendar" style="margin-right: 4px; color: #0d8b4e;"></i> BULAN:</span>
            <input type="month" id="dash-monthly-liquid-month" class="form-control" style="width: auto; padding: 5px 12px; font-size: 0.88rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="if(window.loadMonthlyLiquidMonitoring) window.loadMonthlyLiquidMonitoring(this.value)">
            <button class="btn btn-primary" onclick="if(window.loadMonthlyLiquidMonitoring) window.loadMonthlyLiquidMonitoring()" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-magnifying-glass"></i> Tampilkan</button>
            <button class="btn btn-secondary" onclick="printTable('dash-monthly-liquid-wrapper', 'Laporan Monthly Liquid Monitoring')" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    </div>
    
    <div class="table-responsive" id="dash-monthly-liquid-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <table class="data-table" id="dash-table-monthly-liquid" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
            <thead></thead>
            <tbody>
                <tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Monthly Liquid Monitoring...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Water Analysis Section -->
<div class="dashboard-grid" style="grid-template-columns: minmax(0, 1fr); gap: 20px; margin-top: 25px;">
    <!-- 1.1 Analisa Air Sebelum Proses Card -->
    <div class="glass-card" style="padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
            <div style="display: flex; flex-direction: column;">
                <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700;"><i class="fa-solid fa-water" style="color: #0284c7; margin-right: 8px;"></i>1.1 Analisa Air Sebelum Proses</h3>
                <span style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Monitoring Kualitas Raw Water, Clarifier, Sand Filter & Feed Water Day-by-Day (1-31)</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <span style="font-weight: 600; color: #475569; font-size: 0.88rem;"><i class="fa-regular fa-calendar" style="margin-right: 4px; color: #0284c7;"></i> BULAN:</span>
                <input type="month" id="dash-water-sebelum-month" class="form-control" style="width: auto; padding: 5px 12px; font-size: 0.88rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="if(window.loadWaterSebelumTable) window.loadWaterSebelumTable(this.value)">
                <button class="btn btn-primary" onclick="window.loadWaterSebelumTable()" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-magnifying-glass"></i> Tampilkan</button>
                <button class="btn btn-secondary" onclick="printTable('dash-water-sebelum-wrapper', 'Laporan 1.1 Analisa Air Sebelum Proses')" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-print"></i> Print</button>
            </div>
        </div>
        
        <div class="table-responsive" id="dash-water-sebelum-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <table class="data-table" id="dash-table-water-sebelum" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
                <thead></thead>
                <tbody>
                    <tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Analisa Air Sebelum Proses...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 1.2 Analisa Air Boiler Card -->
    <div class="glass-card" style="padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
            <div style="display: flex; flex-direction: column;">
                <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700;"><i class="fa-solid fa-fire-burner" style="color: #ea580c; margin-right: 8px;"></i>1.2 Analisa Air Boiler (Rata-rata)</h3>
                <span style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Monitoring Parameter Kualitas Air Boiler & Chemical Treatment Day-by-Day (1-31)</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <span style="font-weight: 600; color: #475569; font-size: 0.88rem;"><i class="fa-regular fa-calendar" style="margin-right: 4px; color: #ea580c;"></i> BULAN:</span>
                <input type="month" id="dash-water-boiler-month" class="form-control" style="width: auto; padding: 5px 12px; font-size: 0.88rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="if(window.loadWaterBoilerTable) window.loadWaterBoilerTable(this.value)">
                <button class="btn btn-primary" onclick="window.loadWaterBoilerTable()" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-magnifying-glass"></i> Tampilkan</button>
                <button class="btn btn-secondary" onclick="printTable('dash-water-boiler-wrapper', 'Laporan 1.2 Analisa Air Boiler (Rata-rata)')" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-print"></i> Print</button>
            </div>
        </div>
        
        <div class="table-responsive" id="dash-water-boiler-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <table class="data-table" id="dash-table-water-boiler" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
                <thead></thead>
                <tbody>
                    <tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Analisa Air Boiler...</td></tr>
                </tbody>
            </table>
        </div>
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


window.loadMonthlyLiquidMonitoring = async function(monthOverride) {
    const monthInput = document.getElementById('dash-monthly-liquid-month');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonth = yyyy + '-' + mm;

    let month = monthOverride || (monthInput ? monthInput.value : null) || currentMonth;
    if (monthInput) monthInput.value = month;

    let mill = 'Bunga Tanjung Mill';
    const headerDropdown = document.getElementById('header-estate-dropdown');
    if (headerDropdown && headerDropdown.value && headerDropdown.value.toLowerCase().includes('mill') && !headerDropdown.value.includes('Semua')) {
        mill = headerDropdown.value;
    } else if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }

    const tableEl = document.getElementById('dash-table-monthly-liquid');
    if (!tableEl) return;

    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Monthly Liquid Monitoring...</td></tr>';

    try {
        const res = await fetch('/api/processing/monthly/' + encodeURIComponent(mill) + '/' + encodeURIComponent(month));
        const data = res.ok ? await res.json() : { liquid: [], ffa: [] };
        const rawLiquid = data.liquid || [];
        const rawFfa = data.ffa || [];

        // Determine days in selected month (1 to 28/29/30/31)
        const parts = month.split('-');
        const year = parseInt(parts[0]);
        const mNum = parseInt(parts[1]);
        const daysInMonth = new Date(year, mNum, 0).getDate();
        const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

        // Daily aggregation maps & Monthly totals
        const dayLiquid = {};
        const dayFfa = {};
        const totalLiquid = { sum: {}, count: {} };
        const totalFfa = { sum: {}, count: {} };

        for (let d = 1; d <= daysInMonth; d++) {
            dayLiquid[d] = { sum: {}, count: {} };
            dayFfa[d] = { sum: {}, count: {} };
        }

        const liquidFields = ['cot_oil', 'cot_sludge', 'cot_water', 'cot_solid', 'cot_temp', 'cst1_oil', 'cst1_sludge', 'cst1_water', 'cst1_solid', 'cst1_temp', 'cst1_level_minyak', 'sludge_tank_oil', 'sludge_tank_sludge', 'sludge_tank_water', 'sludge_tank_solid', 'sludge_tank_temp'];
        const ffaFields = ['ffa_b', 'moist_b', 'dirt_b', 'ffa_a', 'moist_a', 'dirt_a', 'ffa', 'moist'];

        rawLiquid.forEach(r => {
            if (!r.date) return;
            const d = parseInt(r.date.split('-')[2]);
            if (!d || !dayLiquid[d]) return;
            liquidFields.forEach(f => {
                if (r[f] !== null && r[f] !== undefined && r[f] !== '' && !isNaN(r[f])) {
                    const val = parseFloat(r[f]);
                    dayLiquid[d].sum[f] = (dayLiquid[d].sum[f] || 0) + val;
                    dayLiquid[d].count[f] = (dayLiquid[d].count[f] || 0) + 1;
                    totalLiquid.sum[f] = (totalLiquid.sum[f] || 0) + val;
                    totalLiquid.count[f] = (totalLiquid.count[f] || 0) + 1;
                }
            });
        });

        rawFfa.forEach(r => {
            if (!r.date) return;
            const d = parseInt(r.date.split('-')[2]);
            if (!d || !dayFfa[d]) return;
            ffaFields.forEach(f => {
                if (r[f] !== null && r[f] !== undefined && r[f] !== '' && !isNaN(r[f])) {
                    const val = parseFloat(r[f]);
                    dayFfa[d].sum[f] = (dayFfa[d].sum[f] || 0) + val;
                    dayFfa[d].count[f] = (dayFfa[d].count[f] || 0) + 1;
                    totalFfa.sum[f] = (totalFfa.sum[f] || 0) + val;
                    totalFfa.count[f] = (totalFfa.count[f] || 0) + 1;
                }
            });
        });

        const getVal = (type, field, d, fallbackField = null, decimals = 1) => {
            const store = type === 'liquid' ? dayLiquid[d] : dayFfa[d];
            if (store && store.count[field] > 0) {
                return (store.sum[field] / store.count[field]).toFixed(decimals);
            }
            if (fallbackField && store && store.count[fallbackField] > 0) {
                return (store.sum[fallbackField] / store.count[fallbackField]).toFixed(decimals);
            }
            return '-';
        };

        const getAvg = (type, field, fallbackField = null, decimals = 1) => {
            const store = type === 'liquid' ? totalLiquid : totalFfa;
            if (store && store.count[field] > 0) {
                return (store.sum[field] / store.count[field]).toFixed(decimals);
            }
            if (fallbackField && store && store.count[fallbackField] > 0) {
                return (store.sum[fallbackField] / store.count[fallbackField]).toFixed(decimals);
            }
            return '-';
        };

        // Table Header
        let theadHtml = '<tr>' +
            '<th rowspan="2" style="min-width: 270px; text-align: left; vertical-align: middle; position: sticky; left: 0; background: #1e293b; color: #ffffff; z-index: 3; padding: 10px 14px; font-weight: 700; border-right: 2px solid #334155;">PARAMETER / DESCRIPTION</th>' +
            '<th colspan="' + daysInMonth + '" style="text-align: center; background: #1e293b; color: #ffffff; padding: 8px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #334155;">TANGGAL (' + month + ')</th>' +
            '<th rowspan="2" style="min-width: 70px; text-align: center; vertical-align: middle; background: #0f172a; color: #38bdf8; z-index: 2; padding: 10px 8px; font-weight: 700; border-left: 2px solid #334155;">AVG</th>' +
            '</tr><tr>';
        
        daysArray.forEach(d => {
            theadHtml += '<th style="min-width: 38px; text-align: center; background: #334155; color: #f8fafc; font-weight: 600; padding: 6px 2px; font-size: 0.78rem; border-right: 1px solid #475569;">' + d + '</th>';
        });
        theadHtml += '</tr>';
        thead.innerHTML = theadHtml;

        // Rows Configuration with SOP Standard Thresholds
        const rowsConfig = [
            // Section a: Crude Oil Tank (% Oil) - Range 35.0% - 39.0%
            { type: 'header', title: 'a. Crude Oil Tank (% Oil)', bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'cot_oil', decimals: 1, minLimit: 35.0, maxLimit: 39.0 },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'cot_sludge', decimals: 1 },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'cot_water', decimals: 1 },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'cot_solid', decimals: 1 },
            
            // Section b: CONTINUOUS SETTLING TANK (CST)
            { type: 'header', title: 'b. CONTINUOUS SETTLING TANK (CST)', bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
            { type: 'subheader', title: 'b.1. UNDERFLOW CST', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'cst1_oil', decimals: 1, maxLimit: 6.0 },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'cst1_sludge', decimals: 1 },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'cst1_water', decimals: 1 },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'cst1_solid', decimals: 1 },
            { type: 'subheader', title: 'b.2. Ketebalan Minyak CST (CM)', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'Ketebalan Minyak (CM)', source: 'liquid', field: 'cst1_level_minyak', decimals: 1, maxLimit: 40.0 },

            // Section c: SLUDGE TANK
            { type: 'header', title: 'c. SLUDGE TANK', bg: '#f0fdfa', border: '#14b8a6', color: '#115e59' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'sludge_tank_oil', decimals: 1 },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'sludge_tank_sludge', decimals: 1 },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'sludge_tank_water', decimals: 1 },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'sludge_tank_solid', decimals: 1 },

            // Section d: TEMPERATURE - Range 90.0°C - 98.0°C
            { type: 'header', title: 'd. TEMPERATURE', bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
            { type: 'data', label: 'Crude Oil Tank (°C)', source: 'liquid', field: 'cot_temp', decimals: 1, minLimit: 90.0, maxLimit: 98.0 },
            { type: 'data', label: 'Continuous Settling Tank (CST) (°C)', source: 'liquid', field: 'cst1_temp', decimals: 1, minLimit: 90.0, maxLimit: 98.0 },
            { type: 'data', label: 'Sludge Tank (°C)', source: 'liquid', field: 'sludge_tank_temp', decimals: 1, minLimit: 90.0, maxLimit: 98.0 },

            // Section e: CPO PRODUCTION QUALITY
            { type: 'header', title: 'e. CPO PRODUCTION QUALITY', bg: '#fdf2f8', border: '#ec4899', color: '#9d174d' },
            { type: 'subheader', title: 'e.1. Sebelum Washing Plant', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'FFA (%)', source: 'ffa', field: 'ffa_b', decimals: 2 },
            { type: 'data', label: 'Moist (%)', source: 'ffa', field: 'moist_b', decimals: 2 },
            { type: 'data', label: 'Dirt (%)', source: 'ffa', field: 'dirt_b', decimals: 2 },
            { type: 'subheader', title: 'e.2. Setelah Washing Plant', bg: '#ffedd5', color: '#9a3412' },
            { type: 'data', label: 'FFA (%) Maks 3.5 %', source: 'ffa', field: 'ffa_a', fallback: 'ffa', decimals: 2, maxLimit: 3.5 },
            { type: 'data', label: 'Moist (%) Maks 0.2 %', source: 'ffa', field: 'moist_a', fallback: 'moist', decimals: 2, maxLimit: 0.2 },
            { type: 'data', label: 'Dirt (%) Maks 0.02 %', source: 'ffa', field: 'dirt_a', decimals: 2, maxLimit: 0.02 }
        ];

        const isOutOfSpec = (valStr, row) => {
            if (!valStr || valStr === '-' || isNaN(valStr)) return false;
            const num = parseFloat(valStr);
            if (isNaN(num)) return false;
            if (row.minLimit !== undefined && num < row.minLimit) return true;
            if (row.maxLimit !== undefined && num > row.maxLimit) return true;
            return false;
        };

        let tbodyHtml = '';
        rowsConfig.forEach(row => {
            if (row.type === 'header') {
                tbodyHtml += '<tr style="background-color: ' + row.bg + '; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">' +
                    '<td style="text-align: left; padding: 7px 12px; color: ' + row.color + '; font-weight: 700; position: sticky; left: 0; background-color: ' + row.bg + '; z-index: 1; border-left: 4px solid ' + row.border + '; border-right: 2px solid #cbd5e1;">' + row.title + '</td>' +
                    '<td colspan="' + daysInMonth + '" style="background-color: ' + row.bg + ';"></td>' +
                    '<td style="background-color: ' + row.bg + '; border-left: 2px solid #cbd5e1;"></td>' +
                    '</tr>';
            } else if (row.type === 'subheader') {
                tbodyHtml += '<tr style="background-color: ' + row.bg + '; font-weight: 600; border-bottom: 1px solid #e2e8f0;">' +
                    '<td style="text-align: left; padding: 5px 12px 5px 22px; color: ' + row.color + '; font-style: italic; position: sticky; left: 0; background-color: ' + row.bg + '; z-index: 1; border-left: 4px solid #cbd5e1; border-right: 2px solid #e2e8f0;">' + row.title + '</td>' +
                    '<td colspan="' + daysInMonth + '" style="background-color: ' + row.bg + ';"></td>' +
                    '<td style="background-color: ' + row.bg + '; border-left: 2px solid #e2e8f0;"></td>' +
                    '</tr>';
            } else if (row.type === 'data') {
                const dec = row.decimals || 1;
                const avgVal = getAvg(row.source, row.field, row.fallback, dec);
                const isAvgOver = isOutOfSpec(avgVal, row);
                const avgColor = isAvgOver ? '#dc2626' : '#0369a1';
                const avgBg = isAvgOver ? '#fee2e2' : '#f0f9ff';

                tbodyHtml += '<tr style="transition: background 0.15s ease;">';
                tbodyHtml += '<td style="text-align: left; padding: 5px 12px 5px 30px; font-weight: 500; position: sticky; left: 0; background-color: #ffffff; z-index: 1; border-right: 2px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; color: #334155;">' + row.label + '</td>';
                daysArray.forEach(d => {
                    const val = getVal(row.source, row.field, d, row.fallback, dec);
                    const isMuted = val === '-';
                    const isOver = isOutOfSpec(val, row);
                    const textColor = isMuted ? '#94a3b8' : (isOver ? '#dc2626' : '#1e293b');
                    const textWeight = isOver ? '700' : 'normal';
                    const bgStyle = isOver ? 'background-color: #fee2e2;' : '';
                    tbodyHtml += '<td style="text-align: center; padding: 5px 2px; font-size: 0.78rem; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; color: ' + textColor + '; font-weight: ' + textWeight + '; ' + bgStyle + '">' + val + '</td>';
                });
                tbodyHtml += '<td style="text-align: center; padding: 5px 4px; font-size: 0.8rem; font-weight: 800; color: ' + avgColor + '; background-color: ' + avgBg + '; border-left: 2px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">' + avgVal + '</td>';
                tbodyHtml += '</tr>';
            }
        });

        tbody.innerHTML = tbodyHtml;

    } catch (err) {
        console.error('Error loading Monthly Liquid Monitoring:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; color: red; padding: 25px;">Gagal memuat data: ' + err.message + '</td></tr>';
    }
};

window.loadWaterSebelumTable = async function(monthOverride) {
    const monthInput = document.getElementById('dash-water-sebelum-month');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonth = yyyy + '-' + mm;

    let month = monthOverride || (monthInput ? monthInput.value : null) || currentMonth;
    if (monthInput) monthInput.value = month;

    let mill = 'Bunga Tanjung Mill';
    const headerDropdown = document.getElementById('header-estate-dropdown');
    if (headerDropdown && headerDropdown.value && headerDropdown.value.toLowerCase().includes('mill') && !headerDropdown.value.includes('Semua')) {
        mill = headerDropdown.value;
    } else if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }

    const tableEl = document.getElementById('dash-table-water-sebelum');
    if (!tableEl) return;

    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Analisa Air Sebelum Proses...</td></tr>';

    try {
        const res = await fetch('/api/water/dashboard/month/' + encodeURIComponent(mill) + '/' + encodeURIComponent(month));
        const data = res.ok ? await res.json() : { water_analysis: [] };
        const rawWater = data.water_analysis || [];

        const parts = month.split('-');
        const year = parseInt(parts[0]);
        const mNum = parseInt(parts[1]);
        const daysInMonth = new Date(year, mNum, 0).getDate();
        const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

        // Map data by day
        const waterMap = {};
        const sumMap = {};
        const countMap = {};

        rawWater.forEach(w => {
            if (!w.date) return;
            const d = parseInt(w.date.split('-')[2]);
            if (!d) return;
            waterMap[d] = w;
            for (let k in w) {
                if (w[k] !== null && w[k] !== undefined && w[k] !== '' && !isNaN(w[k]) && k !== 'id') {
                    const num = parseFloat(w[k]);
                    sumMap[k] = (sumMap[k] || 0) + num;
                    countMap[k] = (countMap[k] || 0) + 1;
                }
            }
        });

        // Header
        let theadHtml = '<tr>' +
            '<th rowspan="2" style="min-width: 270px; text-align: left; vertical-align: middle; position: sticky; left: 0; background: #1e293b; color: #ffffff; z-index: 3; padding: 10px 14px; font-weight: 700; border-right: 2px solid #334155;">PARAMETER / SAMPLING POINT</th>' +
            '<th colspan="' + daysInMonth + '" style="text-align: center; background: #1e293b; color: #ffffff; padding: 8px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #334155;">TANGGAL (' + month + ')</th>' +
            '<th rowspan="2" style="min-width: 70px; text-align: center; vertical-align: middle; background: #0f172a; color: #38bdf8; z-index: 2; padding: 10px 8px; font-weight: 700; border-left: 2px solid #334155;">AVG</th>' +
            '</tr><tr>';
        
        daysArray.forEach(d => {
            theadHtml += '<th style="min-width: 38px; text-align: center; background: #334155; color: #f8fafc; font-weight: 600; padding: 6px 2px; font-size: 0.78rem; border-right: 1px solid #475569;">' + d + '</th>';
        });
        theadHtml += '</tr>';
        thead.innerHTML = theadHtml;

        const config = [
            { type: 'header', title: '=> RAW WATER', bg: '#ecfeff', border: '#06b6d4', color: '#0e7490' },
            { type: 'data', id: 'raw_ph', label: 'Raw Water - PH', isPh: true },
            { type: 'data', id: 'raw_tds', label: 'Raw Water - TDS' },
            { type: 'data', id: 'raw_thardness', label: 'Raw Water - Total Hardness' },
            { type: 'data', id: 'raw_silica', label: 'Raw Water - Silica / SiO2' },
            { type: 'data', id: 'raw_turbidity', label: 'Raw Water - Turbidity' },
            { type: 'data', id: 'raw_cloride', label: 'Raw Water - Chloride' },

            { type: 'header', title: '=> WTP / CLARIFIER', bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
            { type: 'data', id: 'wtp_ph', label: 'WTP - PH', isPh: true },
            { type: 'data', id: 'wtp_tds', label: 'WTP - TDS' },
            { type: 'data', id: 'wtp_turbidity', label: 'WTP - Turbidity (<10)' },
            { type: 'data', id: 'wtp_cloride', label: 'WTP - Chloride' },

            { type: 'header', title: '=> SAND FILTER', bg: '#eef2ff', border: '#6366f1', color: '#3730a3' },
            { type: 'data', id: 'sand_ph', label: 'Sand Filter - PH', isPh: true },
            { type: 'data', id: 'sand_tds', label: 'Sand Filter - TDS' },
            { type: 'data', id: 'sand_turbidity', label: 'Sand Filter - Turbidity (<10)' },
            { type: 'data', id: 'sand_cloride', label: 'Sand Filter - Chloride' },

            { type: 'header', title: '=> DEMIN PLANT (CATION / ANION / FEED TANK)', bg: '#f0fdf4', border: '#10b981', color: '#166534' },
            { type: 'subheader', title: 'Cation', bg: '#f8fafc', color: '#475569' },
            { type: 'data', id: 'cation_ph', label: 'Cation - PH (<5.5)', isPh: true },
            { type: 'data', id: 'cation_tds', label: 'Cation - TDS' },
            { type: 'data', id: 'cation_thardness', label: 'Cation - Total Hardness (Trace)' },

            { type: 'subheader', title: 'Anion', bg: '#f8fafc', color: '#475569' },
            { type: 'data', id: 'anion_ph', label: 'Anion - PH (6.5 - 9.5)', isPh: true },
            { type: 'data', id: 'anion_tds', label: 'Anion - TDS (<100)' },
            { type: 'data', id: 'anion_silica', label: 'Anion - Silica / SiO2 (<2.5)' },

            { type: 'subheader', title: 'Feed Tank / Feed Water', bg: '#f8fafc', color: '#475569' },
            { type: 'data', id: 'feed_ph', label: 'Feed Water - PH (6.5 - 9.5)', isPh: true },
            { type: 'data', id: 'feed_tds', label: 'Feed Water - TDS (<100)' },
            { type: 'data', id: 'feed_thardness', label: 'Feed Water - Total Hardness (Trace)' },
            { type: 'data', id: 'feed_silica', label: 'Feed Water - Silica / SiO2 (<5)' },
            { type: 'data', id: 'feed_cloride', label: 'Feed Water - Chloride' }
        ];

        let tbodyHtml = '';
        config.forEach(row => {
            if (row.type === 'header') {
                tbodyHtml += '<tr style="background-color: ' + row.bg + '; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">' +
                    '<td style="text-align: left; padding: 7px 12px; color: ' + row.color + '; font-weight: 700; position: sticky; left: 0; background-color: ' + row.bg + '; z-index: 1; border-left: 4px solid ' + row.border + '; border-right: 2px solid #cbd5e1;">' + row.title + '</td>' +
                    '<td colspan="' + daysInMonth + '" style="background-color: ' + row.bg + ';"></td>' +
                    '<td style="background-color: ' + row.bg + '; border-left: 2px solid #cbd5e1;"></td>' +
                    '</tr>';
            } else if (row.type === 'subheader') {
                tbodyHtml += '<tr style="background-color: ' + row.bg + '; font-weight: 600; border-bottom: 1px solid #e2e8f0;">' +
                    '<td style="text-align: left; padding: 5px 12px 5px 22px; color: ' + row.color + '; font-style: italic; position: sticky; left: 0; background-color: ' + row.bg + '; z-index: 1; border-left: 4px solid #cbd5e1; border-right: 2px solid #e2e8f0;">' + row.title + '</td>' +
                    '<td colspan="' + daysInMonth + '" style="background-color: ' + row.bg + ';"></td>' +
                    '<td style="background-color: ' + row.bg + '; border-left: 2px solid #e2e8f0;"></td>' +
                    '</tr>';
            } else if (row.type === 'data') {
                const avgVal = countMap[row.id] > 0 ? (sumMap[row.id] / countMap[row.id]).toFixed(row.isPh ? 2 : 1) : '-';

                tbodyHtml += '<tr style="transition: background 0.15s ease;">';
                tbodyHtml += '<td style="text-align: left; padding: 5px 12px 5px 30px; font-weight: 500; position: sticky; left: 0; background-color: #ffffff; z-index: 1; border-right: 2px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; color: #334155;">' + row.label + '</td>';
                daysArray.forEach(d => {
                    const rowData = waterMap[d];
                    let val = rowData && rowData[row.id] !== null && rowData[row.id] !== undefined && rowData[row.id] !== '' ? rowData[row.id] : '-';
                    if (val !== '-' && !isNaN(val)) {
                        val = parseFloat(val).toFixed(row.isPh ? 2 : 1);
                    }
                    const isMuted = val === '-';
                    const textColor = isMuted ? '#94a3b8' : '#1e293b';
                    tbodyHtml += '<td style="text-align: center; padding: 5px 2px; font-size: 0.78rem; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; color: ' + textColor + ';">' + val + '</td>';
                });
                tbodyHtml += '<td style="text-align: center; padding: 5px 4px; font-size: 0.8rem; font-weight: 700; color: #0369a1; background-color: #f0f9ff; border-left: 2px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">' + avgVal + '</td>';
                tbodyHtml += '</tr>';
            }
        });

        tbody.innerHTML = tbodyHtml;

    } catch (err) {
        console.error('Error loading Water Sebelum Table:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; color: red; padding: 25px;">Gagal memuat data: ' + err.message + '</td></tr>';
    }
};

window.loadWaterBoilerTable = async function(monthOverride) {
    const monthInput = document.getElementById('dash-water-boiler-month');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonth = yyyy + '-' + mm;

    let month = monthOverride || (monthInput ? monthInput.value : null) || currentMonth;
    if (monthInput) monthInput.value = month;

    let mill = 'Bunga Tanjung Mill';
    const headerDropdown = document.getElementById('header-estate-dropdown');
    if (headerDropdown && headerDropdown.value && headerDropdown.value.toLowerCase().includes('mill') && !headerDropdown.value.includes('Semua')) {
        mill = headerDropdown.value;
    } else if (window.currentUser && window.currentUser.estate && window.currentUser.estate.toLowerCase().includes('mill') && window.currentUser.estate !== 'Semua Estate (Khusus Admin)') {
        mill = window.currentUser.estate;
    }

    const tableEl = document.getElementById('dash-table-water-boiler');
    if (!tableEl) return;

    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Memuat data Analisa Air Boiler...</td></tr>';

    try {
        const res = await fetch('/api/water/dashboard/month/' + encodeURIComponent(mill) + '/' + encodeURIComponent(month));
        const data = res.ok ? await res.json() : { boiler_averages: {} };
        const boilerAverages = data.boiler_averages || {};

        const parts = month.split('-');
        const year = parseInt(parts[0]);
        const mNum = parseInt(parts[1]);
        const daysInMonth = new Date(year, mNum, 0).getDate();
        const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

        // Header
        let theadHtml = '<tr>' +
            '<th rowspan="2" style="min-width: 270px; text-align: left; vertical-align: middle; position: sticky; left: 0; background: #1e293b; color: #ffffff; z-index: 3; padding: 10px 14px; font-weight: 700; border-right: 2px solid #334155;">PARAMETER BOILER</th>' +
            '<th colspan="' + daysInMonth + '" style="text-align: center; background: #1e293b; color: #ffffff; padding: 8px; font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid #334155;">TANGGAL (' + month + ')</th>' +
            '<th rowspan="2" style="min-width: 70px; text-align: center; vertical-align: middle; background: #0f172a; color: #38bdf8; z-index: 2; padding: 10px 8px; font-weight: 700; border-left: 2px solid #334155;">AVG</th>' +
            '</tr><tr>';
        
        daysArray.forEach(d => {
            theadHtml += '<th style="min-width: 38px; text-align: center; background: #334155; color: #f8fafc; font-weight: 600; padding: 6px 2px; font-size: 0.78rem; border-right: 1px solid #475569;">' + d + '</th>';
        });
        theadHtml += '</tr>';
        thead.innerHTML = theadHtml;

        const params = [
            { type: 'header', title: 'PARAMETER AIR BOILER', bg: '#fff7ed', border: '#f97316', color: '#c2410c' },
            { type: 'data', id: 'ph', label: 'PH (10.5 - 11.5)', isPh: true },
            { type: 'data', id: 'tds', label: 'TDS (<1800)' },
            { type: 'data', id: 'palkanity', label: 'P-Alkanity (300 - 700)' },
            { type: 'data', id: 'malkanity', label: 'M-Alkanity (<1300)' },
            { type: 'data', id: 'oalkanity', label: 'O-Alkanity (>2.5x silica)' },
            { type: 'data', id: 'thardness', label: 'T-Hardness' },
            { type: 'data', id: 'silica', label: 'Silica / SiO2 (<125)' },
            { type: 'data', id: 'phospate', label: 'Phospate / PO4 (30 - 70)' },
            { type: 'data', id: 'sulfite', label: 'Sulfite / SO3 (30 - 70)' },
            { type: 'data', id: 'chloride', label: 'Chloride' }
        ];

        // Compute monthly totals for each parameter
        const totalSum = {};
        const totalCount = {};

        daysArray.forEach(d => {
            const dayStr = String(d).padStart(2, '0');
            const fullDate = month + '-' + dayStr;
            const dayObj = boilerAverages[fullDate];
            if (dayObj) {
                params.forEach(p => {
                    if (p.type === 'data') {
                        const val = dayObj[p.id];
                        if (val !== undefined && val !== null && val !== '-' && !isNaN(val)) {
                            totalSum[p.id] = (totalSum[p.id] || 0) + parseFloat(val);
                            totalCount[p.id] = (totalCount[p.id] || 0) + 1;
                        }
                    }
                });
            }
        });

        let tbodyHtml = '';
        params.forEach(row => {
            if (row.type === 'header') {
                tbodyHtml += '<tr style="background-color: ' + row.bg + '; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">' +
                    '<td style="text-align: left; padding: 7px 12px; color: ' + row.color + '; font-weight: 700; position: sticky; left: 0; background-color: ' + row.bg + '; z-index: 1; border-left: 4px solid ' + row.border + '; border-right: 2px solid #cbd5e1;">' + row.title + '</td>' +
                    '<td colspan="' + daysInMonth + '" style="background-color: ' + row.bg + ';"></td>' +
                    '<td style="background-color: ' + row.bg + '; border-left: 2px solid #cbd5e1;"></td>' +
                    '</tr>';
            } else if (row.type === 'data') {
                const avgVal = totalCount[row.id] > 0 ? (totalSum[row.id] / totalCount[row.id]).toFixed(row.isPh ? 2 : 1) : '-';

                tbodyHtml += '<tr style="transition: background 0.15s ease;">';
                tbodyHtml += '<td style="text-align: left; padding: 5px 12px 5px 30px; font-weight: 500; position: sticky; left: 0; background-color: #ffffff; z-index: 1; border-right: 2px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; color: #334155;">' + row.label + '</td>';
                daysArray.forEach(d => {
                    const dayStr = String(d).padStart(2, '0');
                    const fullDate = month + '-' + dayStr;
                    const dayObj = boilerAverages[fullDate];
                    let val = dayObj && dayObj[row.id] !== undefined && dayObj[row.id] !== null && dayObj[row.id] !== '' ? dayObj[row.id] : '-';
                    if (val !== '-' && !isNaN(val)) {
                        val = parseFloat(val).toFixed(row.isPh ? 2 : 1);
                    }
                    const isMuted = val === '-';
                    const textColor = isMuted ? '#94a3b8' : '#1e293b';
                    tbodyHtml += '<td style="text-align: center; padding: 5px 2px; font-size: 0.78rem; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; color: ' + textColor + ';">' + val + '</td>';
                });
                tbodyHtml += '<td style="text-align: center; padding: 5px 4px; font-size: 0.8rem; font-weight: 700; color: #166534; background-color: #f0fdf4; border-left: 2px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">' + avgVal + '</td>';
                tbodyHtml += '</tr>';
            }
        });

        tbody.innerHTML = tbodyHtml;

    } catch (err) {
        console.error('Error loading Water Boiler Table:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; color: red; padding: 25px;">Gagal memuat data: ' + err.message + '</td></tr>';
    }
};

// Helper to initialize all Dashboard date and month inputs to active date/month
window.initDashboardDefaultDates = function(dateOverride) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const currentDay = `${yyyy}-${mm}-${dd}`;
    const currentMonth = `${yyyy}-${mm}`;

    const setVal = (id, val, force = false) => {
        const el = document.getElementById(id);
        if (el && (force || !el.value)) {
            el.value = val;
        }
    };

    setVal('dash-monthly-liquid-month', currentMonth, !!dateOverride);
    setVal('dash-water-sebelum-month', currentMonth, !!dateOverride);
    setVal('dash-water-boiler-month', currentMonth, !!dateOverride);
    setVal('ffb-received-month-input', currentMonth, !!dateOverride);
    setVal('dash-ffb-fruit-loose-start-date', currentDay, !!dateOverride);
    setVal('dash-ffb-fruit-loose-end-date', currentDay, !!dateOverride);
    setVal('dash-ffb-crop-start-date', currentDay, !!dateOverride);
    setVal('dash-ffb-crop-end-date', currentDay, !!dateOverride);
    setVal('ffb-received-date-input', currentDay, !!dateOverride);
    setVal('dash-extra-date-input', currentDay, !!dateOverride);
    setVal('dashboard-progress-historical-date', currentDay, !!dateOverride);
};

window.loadDashboardExtraData = async function(dateOverride) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const defaultDate = `${yyyy}-${mm}-${dd}`;
    const currentMonth = `${yyyy}-${mm}`;

    let date = dateOverride || defaultDate;
    const dashMonth = date.substring(0, 7) || currentMonth;

    if (typeof window.initDashboardDefaultDates === 'function') {
        window.initDashboardDefaultDates(dateOverride);
    }

    // Role-based visibility check for cards
    if (window.currentUser) {
        const role = (window.currentUser.role || '').toLowerCase().trim();
        const allowedRoles = [
            'senior field manager', 'senior mill manager', 'director', 'office head assistant',
            'senior manager estate', 'manager', 'askep', 'assistant', 
            'krani divisi', 'manager mill', 
            'supervisor mill', 'krani mill', 'analis & grading', 'analis', 'grading', 
            'office assistant mill', 'office assistant (oaa)', 'office assistant', 'admin', 'administrator'
        ];
        const isAllowed = (window.hasPermission && (window.hasPermission('tonase', 'view') || window.hasPermission('dashboard', 'view'))) ||
                          allowedRoles.includes(role);
        const card = document.getElementById('ffb-received-card');
        if (card) {
            card.style.display = isAllowed ? 'block' : 'none';
        }
    }

    // Run all dashboard tables in parallel for instant loading
    await Promise.allSettled([
        (async () => {
            if (typeof window.renderFfbReceivedChart === 'function') {
                await window.renderFfbReceivedChart();
            }
        })(),
        (async () => {
            if (typeof window.renderDashFfbCropQuality === 'function') {
                await window.renderDashFfbCropQuality();
            }
        })(),
        (async () => {
            if (typeof window.renderDashFfbFruitLooseAnalysis === 'function') {
                await window.renderDashFfbFruitLooseAnalysis();
            }
        })(),
        (async () => {
            if (typeof window.loadMonthlyLiquidMonitoring === 'function') {
                await window.loadMonthlyLiquidMonitoring(dashMonth);
            }
        })(),
        (async () => {
            if (typeof window.loadWaterSebelumTable === 'function') {
                await window.loadWaterSebelumTable(dashMonth);
            }
        })(),
        (async () => {
            if (typeof window.loadWaterBoilerTable === 'function') {
                await window.loadWaterBoilerTable(dashMonth);
            }
        })()
    ]);
};

// =========================================================================
// HACCP DOCUMENT MODULE (Personal Hygiene & Pemeriksaan Tanki CPO)
// =========================================================================

window.views = window.views || {};
window.views.haccp = `
<div class="animate-fade-in" style="padding-bottom: 30px;">
    <!-- Sub-sheet Navigation Tabs -->
    <div class="subsheet-tabs-container" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; flex-wrap: wrap;">
        <button class="subsheet-tab-btn active" id="tab-btn-haccp-hygiene" onclick="switchHaccpSubTab('hygiene')" style="padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; background: #0284c7; color: #ffffff; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
            <i class="fa-solid fa-user-shield"></i> 1. Personal Hygiene (Kuesioner Tamu)
        </button>
        <button class="subsheet-tab-btn" id="tab-btn-haccp-cpo-tank" onclick="switchHaccpSubTab('cpo_tank')" style="padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; background: #e2e8f0; color: #475569; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
            <i class="fa-solid fa-truck-droplet"></i> 2. Pemeriksaan Tanki CPO - PK
        </button>
    </div>

    <!-- 1. SUB-SHEET: PERSONAL HYGIENE -->
    <div id="haccp-subsheet-hygiene" class="subsheet-content active" style="display: block;">
        <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <span style="font-weight: 600; color: #334155; font-size: 0.9rem;"><i class="fa-solid fa-calendar-days text-primary"></i> Filter Rentang Tanggal:</span>
                    <input type="date" id="haccp-hygiene-start-date" class="form-control" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
                    <span style="color: #64748b; font-weight: 500;">s/d</span>
                    <input type="date" id="haccp-hygiene-end-date" class="form-control" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
                    <button class="btn btn-primary" onclick="loadHaccpHygieneData()" style="padding: 7px 16px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-filter"></i> Tampilkan</button>
                    <button class="btn btn-secondary" onclick="printHaccpHygieneRecap()" style="padding: 7px 16px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-print"></i> Cetak Rekap</button>
                </div>
                <div>
                    <button class="btn btn-success" onclick="openHaccpHygieneInputModal()" style="padding: 8px 18px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; background: #16a34a; color: #fff;"><i class="fa-solid fa-user-plus"></i> + Input Kuesioner Tamu</button>
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-clipboard-user text-primary"></i> Rekap Kuesioner Kesehatan Tamu PKS (Personal Hygiene)
                </h3>
                <span id="haccp-hygiene-count-badge" class="badge" style="background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 0.8rem;">0 Tamu Terdata</span>
            </div>
            
            <div id="haccp-hygiene-table-wrapper" class="table-responsive">
                <table class="data-table" id="haccp-hygiene-table" style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #1e293b; color: #ffffff;">
                            <th style="padding: 10px; text-align: center; width: 45px;">No</th>
                            <th style="padding: 10px; text-align: center; width: 100px;">Tanggal</th>
                            <th style="padding: 10px; text-align: center; width: 85px;">Jam Masuk</th>
                            <th style="padding: 10px; text-align: left;">Nama Tamu</th>
                            <th style="padding: 10px; text-align: left;">Instansi / Perusahaan</th>
                            <th style="padding: 10px; text-align: left;">Tujuan Kunjungan</th>
                            <th style="padding: 10px; text-align: left;">Area yang Dimasuki</th>
                            <th style="padding: 10px; text-align: center; width: 130px;">Hasil Verifikasi</th>
                            <th style="padding: 10px; text-align: center; width: 140px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="haccp-hygiene-tbody">
                        <tr><td colspan="9" style="text-align: center; padding: 25px; color: #64748b;">Memuat data kuesioner tamu...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 2. SUB-SHEET: PEMERIKSAAN TANKI CPO -->
    <div id="haccp-subsheet-cpo-tank" class="subsheet-content" style="display: none;">
        <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <span style="font-weight: 600; color: #334155; font-size: 0.9rem;"><i class="fa-solid fa-calendar-days text-primary"></i> Filter Rentang Tanggal:</span>
                    <input type="date" id="haccp-cpo-start-date" class="form-control" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
                    <span style="color: #64748b; font-weight: 500;">s/d</span>
                    <input type="date" id="haccp-cpo-end-date" class="form-control" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
                    <button class="btn btn-primary" onclick="loadHaccpCpoData()" style="padding: 7px 16px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-filter"></i> Tampilkan</button>
                    <button class="btn btn-secondary" onclick="printHaccpCpoRecap()" style="padding: 7px 16px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-print"></i> Cetak Rekap</button>
                </div>
                <div>
                    <button class="btn btn-success" onclick="openHaccpCpoInputModal()" style="padding: 8px 18px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; background: #16a34a; color: #fff;"><i class="fa-solid fa-truck-ramp-box"></i> + Input Pemeriksaan Tanki</button>
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-clipboard-check text-primary"></i> Rekap Pemeriksaan Kebersihan Transport CPO - PK
                </h3>
                <span id="haccp-cpo-count-badge" class="badge" style="background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 0.8rem;">0 Kendaraan Terperiksa</span>
            </div>
            
            <div id="haccp-cpo-table-wrapper" class="table-responsive">
                <table class="data-table" id="haccp-cpo-table" style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #1e293b; color: #ffffff;">
                            <th style="padding: 10px; text-align: center; width: 45px;">No</th>
                            <th style="padding: 10px; text-align: center; width: 100px;">Tanggal</th>
                            <th style="padding: 10px; text-align: center; width: 85px;">Jam Periksa</th>
                            <th style="padding: 10px; text-align: left;">Nama Pengemudi</th>
                            <th style="padding: 10px; text-align: center; width: 110px;">Jenis Kendaraan</th>
                            <th style="padding: 10px; text-align: center; width: 120px;">Nomor Truk</th>
                            <th style="padding: 10px; text-align: center; width: 130px;">Keterangan</th>
                            <th style="padding: 10px; text-align: center; width: 140px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="haccp-cpo-tbody">
                        <tr><td colspan="8" style="text-align: center; padding: 25px; color: #64748b;">Memuat data pemeriksaan tanki...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- ========================================================================= -->
<!-- MODALS HACCP -->
<!-- ========================================================================= -->

<!-- 1. MODAL INPUT KUESIONER PERSONAL HYGIENE -->
<div class="modal-overlay" id="modal-haccp-hygiene-input" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.65); z-index: 10500; overflow-y: auto; padding: 20px 10px; align-items: center; justify-content: center;">
    <div class="modal-content" style="background: #ffffff; width: 100%; max-width: 860px; margin: auto; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25); max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="modal-header" style="background: #0f172a; color: #ffffff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-file-medical text-primary"></i> Form Kuesioner Kesehatan Tamu PKS (Personal Hygiene)
            </h3>
            <button type="button" class="modal-close" onclick="closeHaccpHygieneInputModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
        </div>
        <form id="form-haccp-hygiene" onsubmit="saveHaccpHygieneData(event)" style="padding: 20px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;">
            <!-- 1. Identitas Tamu -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
                <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #1e293b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
                    1. IDENTITAS TAMU
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Tanggal Kunjungan *</label>
                        <input type="date" id="hygiene-input-date" class="form-control" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Jam Masuk *</label>
                        <input type="time" id="hygiene-input-time" class="form-control" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Nama Lengkap Tamu *</label>
                        <input type="text" id="hygiene-input-name" class="form-control" placeholder="Contoh: Bpk. Hendra Wijaya" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Instansi / Perusahaan *</label>
                        <input type="text" id="hygiene-input-institution" class="form-control" placeholder="Contoh: PT. Sumber Tirta Mandiri" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Tujuan Kunjungan *</label>
                        <input type="text" id="hygiene-input-purpose" class="form-control" placeholder="Contoh: Maintenance Mesin Boiler" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Area yang Akan Dimasuki *</label>
                        <input type="text" id="hygiene-input-target-area" class="form-control" placeholder="Contoh: Area Pabrik & Workshop" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                </div>
            </div>

            <!-- 2. Pernyataan Kesehatan -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                    <h4 style="margin: 0; font-size: 0.95rem; color: #1e293b; font-weight: 700;">
                        2. PERNYATAAN KESEHATAN (Beri tanda pada jawaban yang sesuai)
                    </h4>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="setAllHygieneQuestions('tidak')" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; background: #e2e8f0; color: #0f172a; font-weight: 600;">
                        <i class="fa-solid fa-check-double"></i> Set Semua TIDAK (Sehat)
                    </button>
                </div>

                <!-- 1. Kondisi Kesehatan Umum -->
                <div style="margin-bottom: 14px;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">1. Kondisi Kesehatan Umum</div>
                    <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; background: #fff;">
                        <thead>
                            <tr style="background: #e2e8f0; color: #334155;">
                                <th style="padding: 6px 10px; text-align: left;">Pertanyaan</th>
                                <th style="padding: 6px 10px; text-align: center; width: 60px;">YA</th>
                                <th style="padding: 6px 10px; text-align: center; width: 60px;">TIDAK</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda sedang mengalami demam atau merasa tidak enak badan?</td>
                                <td style="text-align: center;"><input type="radio" name="q_demam" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_demam" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda sedang mengalami batuk, flu atau sakit tenggorokan?</td>
                                <td style="text-align: center;"><input type="radio" name="q_batuk" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_batuk" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda mengalami diare, muntah atau gangguan pencernaan dalam 48 jam terakhir?</td>
                                <td style="text-align: center;"><input type="radio" name="q_diare" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_diare" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda memiliki luka terbuka, infeksi kulit atau penyakit kulit lainnya?</td>
                                <td style="text-align: center;"><input type="radio" name="q_luka" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_luka" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda sedang menderita atau baru sembuh dari tifus dalam 14 hari terakhir?</td>
                                <td style="text-align: center;"><input type="radio" name="q_tifus" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_tifus" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda sedang mengonsumsi obat terkait penyakit menular?</td>
                                <td style="text-align: center;"><input type="radio" name="q_obat" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_obat" value="tidak" checked required></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 2. Riwayat Penyakit Menular (Termasuk Hepatitis) -->
                <div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">2. Riwayat Penyakit Menular (Termasuk Hepatitis)</div>
                    <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; background: #fff;">
                        <thead>
                            <tr style="background: #e2e8f0; color: #334155;">
                                <th style="padding: 6px 10px; text-align: left;">Pertanyaan</th>
                                <th style="padding: 6px 10px; text-align: center; width: 60px;">Ya</th>
                                <th style="padding: 6px 10px; text-align: center; width: 60px;">Tidak</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda sedang menderita penyakit Hepatitis A atau Hepatitis B?</td>
                                <td style="text-align: center;"><input type="radio" name="q_hepatitis" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_hepatitis" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda memiliki gejala kuning pada mata/ kulit (jaundice)?</td>
                                <td style="text-align: center;"><input type="radio" name="q_jaundice" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_jaundice" value="tidak" checked required></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px;">Apakah Anda pernah kontak dekat dengan seseorang yang terkonfirmasi Hepatitis A/B dalam 30 hari terakhir?</td>
                                <td style="text-align: center;"><input type="radio" name="q_kontak_hep" value="ya" required></td>
                                <td style="text-align: center;"><input type="radio" name="q_kontak_hep" value="tidak" checked required></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 3. Pernyataan Tamu -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 0.85rem; color: #166534;">
                <h4 style="margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 700; color: #15803d;">3. PERNYATAAN TAMU</h4>
                <p style="margin: 0; font-style: italic; line-height: 1.4;">
                    "Saya menyatakan bahwa informasi yang saya berikan adalah benar. Jika ditemukan gejala sakit atau risiko penyakit menular, saya bersedia mengikuti arahan petugas, termasuk larangan masuk ke area tertentu."
                </p>
            </div>

            <!-- 4. Verifikasi Petugas -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #1e293b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
                    4. VERIFIKASI PETUGAS
                </h4>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 6px;">
                        Diperbolehkan masuk area produksi: *
                    </label>
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #166534; cursor: pointer;">
                            <input type="radio" name="is_allowed" value="1" checked required> <i class="fa-solid fa-circle-check text-success"></i> YA (Boleh Masuk)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #991b1b; cursor: pointer;">
                            <input type="radio" name="is_allowed" value="0" required> <i class="fa-solid fa-circle-xmark text-danger"></i> TIDAK (Dilarang Masuk)
                        </label>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Catatan Tambahan (Opsional)</label>
                        <input type="text" id="hygiene-input-notes" class="form-control" placeholder="Contoh: Tamu dalam kondisi sehat dan mengenakan APD lengkap" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Nama Petugas Verifikasi *</label>
                        <input type="text" id="hygiene-input-officer" class="form-control" placeholder="Nama Security / QC" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; position: sticky; bottom: -20px; background: #ffffff; padding: 14px 0 4px 0; border-top: 1px solid #e2e8f0; margin-top: 15px; z-index: 10;">
                <button type="button" class="btn btn-secondary" onclick="closeHaccpHygieneInputModal()" style="padding: 8px 18px; border-radius: 6px;">Batal</button>
                <button type="submit" class="btn btn-primary" id="btn-save-haccp-hygiene" style="padding: 8px 22px; border-radius: 6px; font-weight: 600; background: #0284c7; color: #fff;">
                    <i class="fa-solid fa-floppy-disk"></i> Simpan Kuesioner
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 2. MODAL VIEW & PRINT STANDAR ISO: PERSONAL HYGIENE -->
<div class="modal-overlay" id="modal-haccp-hygiene-view" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.65); z-index: 10600; overflow-y: auto; padding: 20px 10px; align-items: center; justify-content: center;">
    <div class="modal-content" style="background: #ffffff; width: 100%; max-width: 880px; margin: auto; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25); max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="modal-header" style="background: #1e293b; color: #ffffff; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-file-lines text-primary"></i> Lembar Pemeriksaan Personal Hygiene di Area PKS
            </h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="btn btn-primary btn-sm" onclick="printHaccpElement('haccp-hygiene-iso-document', 'Kuesioner Personal Hygiene Tamu PKS')" style="padding: 6px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-print"></i> Cetak Dokumen
                </button>
                <button type="button" class="modal-close" onclick="closeHaccpHygieneViewModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
            </div>
        </div>
        
        <div style="padding: 25px; overflow-x: auto; background: #f1f5f9;"; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;>
            <!-- ISO DOCUMENT CONTAINER -->
            <div id="haccp-hygiene-iso-document" style="background: #ffffff; padding: 30px 35px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; font-family: 'Arial', sans-serif; color: #000000; line-height: 1.35; font-size: 11.5px;">
                <!-- Header Control Box -->
                <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 18px;">
                    <tr>
                        <td style="width: 110px; text-align: center; vertical-align: middle; border-right: 1.5px solid #000; padding: 6px;">
                            <div style="font-size: 26px; color: #1e3a8a; font-weight: 900; line-height: 1;"><i class="fa-solid fa-seedling"></i></div>
                            <div style="font-weight: 900; font-size: 12px; letter-spacing: 1px; color: #1e3a8a; margin-top: 2px;">SIPEF</div>
                        </td>
                        <td style="text-align: center; vertical-align: middle; border-right: 1.5px solid #000; padding: 6px 10px;">
                            <div style="font-weight: 800; font-size: 12.5px; text-transform: uppercase;">PT. AGRO MUKO - BUNGA TANJUNG PALM OIL MILL</div>
                            <div style="font-weight: 900; font-size: 13.5px; margin: 3px 0; text-transform: uppercase;">DOKUMENTASI HACCP</div>
                            <div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase;">PANDUAN PERSONAL HYGIENE DI AREA PKS</div>
                        </td>
                        <td style="width: 250px; padding: 0; vertical-align: top;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 3px 6px; font-weight: bold; width: 85px; border: none; border-right: 1px solid #000;">No Bagian</td>
                                    <td style="padding: 3px 6px; font-weight: bold; border: none;">ENG-HACCP-BTOM-00-01-A-00-P-03</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 3px 6px; font-weight: bold; border: none; border-right: 1px solid #000;">Tgl Berlaku</td>
                                    <td style="padding: 3px 6px; border: none;">19 November 2025</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 3px 6px; font-weight: bold; border: none; border-right: 1px solid #000;">No Revisi</td>
                                    <td style="padding: 3px 6px; border: none;">00</td>
                                </tr>
                                <tr>
                                    <td style="padding: 3px 6px; font-weight: bold; border: none; border-right: 1px solid #000;">Halaman</td>
                                    <td style="padding: 3px 6px; border: none;">1 dari 1</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="font-weight: bold; font-size: 11.5px; margin-bottom: 12px;">Lampiran 2. Kuesioner Kesehatan Tamu PKS</div>

                <!-- 1. IDENTITAS TAMU -->
                <div style="margin-bottom: 14px;">
                    <div style="font-weight: bold; font-size: 11.5px; margin-bottom: 4px;">1. IDENTITAS TAMU</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <tr>
                            <td style="width: 180px; padding: 2px 0; border: none;">• &nbsp; Nama</td>
                            <td style="border: none;">: &nbsp; <span id="iso-hygiene-name" style="font-weight: bold;">-</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; border: none;">• &nbsp; Instansi/Perusahaan</td>
                            <td style="border: none;">: &nbsp; <span id="iso-hygiene-institution">-</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; border: none;">• &nbsp; Tujuan Kunjungan</td>
                            <td style="border: none;">: &nbsp; <span id="iso-hygiene-purpose">-</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; border: none;">• &nbsp; Area yang Akan Dimasuki</td>
                            <td style="border: none;">: &nbsp; <span id="iso-hygiene-target-area">-</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; border: none;">• &nbsp; Tanggal / Jam Masuk</td>
                            <td style="border: none;">: &nbsp; <span id="iso-hygiene-date">-</span> &nbsp; / &nbsp; <span id="iso-hygiene-time">-</span></td>
                        </tr>
                    </table>
                </div>

                <!-- 2. PERNYATAAN KESEHATAN -->
                <div style="margin-bottom: 14px;">
                    <div style="font-weight: bold; font-size: 11.5px; margin-bottom: 2px;">2. PERNYATAAN KESEHATAN</div>
                    <div style="font-size: 11px; margin-bottom: 6px;">Mohon beri tanda (&check;) pada jawaban yang sesuai:</div>
                    
                    <!-- Tabel 1 -->
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px;">1. &nbsp; Kondisi Kesehatan Umum</div>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; font-size: 10.5px;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: center;">PERTANYAAN</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 45px; text-align: center;">YA</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 55px; text-align: center;">TIDAK</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda sedang mengalami demam atau merasa tidak enak badan?</td>
                                <td id="iso-q-demam-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-demam-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda sedang mengalami batuk, flu atau sakit tenggorokan?</td>
                                <td id="iso-q-batuk-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-batuk-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda mengalami diare, muntah atau gangguan pencernaan dalam 48 jam terakhir?</td>
                                <td id="iso-q-diare-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-diare-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda memiliki luka terbuka, infeksi kulit atau penyakit kulit lainnya?</td>
                                <td id="iso-q-luka-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-luka-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda sedang menderita atau baru sembuh dari tifus dalam 14 hari terakhir?</td>
                                <td id="iso-q-tifus-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-tifus-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda sedang mengonsumsi obat terkait penyakit menular?</td>
                                <td id="iso-q-obat-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-obat-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Tabel 2 -->
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px;">2. &nbsp; Riwayat Penyakit Menular (Termasuk Hepatitis)</div>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 12px; font-size: 10.5px;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Pertanyaan</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 45px; text-align: center;">Ya</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 55px; text-align: center;">Tidak</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda sedang menderita penyakit Hepatitis A atau Hepatitis B?</td>
                                <td id="iso-q-hepatitis-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-hepatitis-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda memiliki gejala kuning pada mata/ kulit (jaundice)?</td>
                                <td id="iso-q-jaundice-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-jaundice-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Apakah Anda pernah kontak dekat dengan seseorang yang terkonfirmasi Hepatitis A/B dalam 30 hari terakhir?</td>
                                <td id="iso-q-kontak_hep-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-q-kontak_hep-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 3. PERNYATAAN TAMU -->
                <div style="margin-bottom: 14px;">
                    <div style="font-weight: bold; font-size: 11.5px; margin-bottom: 2px;">3. &nbsp; PERNYATAAN TAMU</div>
                    <div style="font-size: 10.5px; margin-bottom: 8px; text-align: justify;">
                        Saya menyatakan bahwa informasi yang saya berikan adalah benar. Jika ditemukan gejala sakit atau risiko penyakit menular, saya bersedia mengikuti arahan petugas, termasuk larangan masuk ke area tertentu.
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                        <div style="text-align: center; width: 220px;">
                            <div style="font-size: 11px; margin-bottom: 40px;">Tanda tangan tamu:</div>
                            <div style="border-bottom: 1px dotted #000; margin-bottom: 4px; font-weight: bold;" id="iso-sign-guest-name">( .................................................. )</div>
                            <div style="font-size: 10.5px;">Tanggal: <span id="iso-sign-guest-date">____ / ____ / ________</span></div>
                        </div>
                    </div>
                </div>

                <!-- 4. VERIFIKASI PETUGAS -->
                <div>
                    <div style="font-weight: bold; font-size: 11.5px; margin-bottom: 2px;">4. &nbsp; VERIFIKASI PETUGAS</div>
                    <div style="font-size: 11px; margin-bottom: 4px;">
                        Diperbolehkan masuk area produksi: <span id="iso-officer-decision" style="font-weight: 800; padding: 2px 8px; border: 1.5px solid #000; border-radius: 4px; margin-left: 6px;">Ya</span> (lingkari salah satunya)
                    </div>
                    <div style="font-size: 11px; margin-bottom: 8px;">
                        Catatan tambahan: <span id="iso-officer-notes" style="border-bottom: 1px dotted #000; display: inline-block; min-width: 320px;">-</span>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                        <div style="text-align: center; width: 220px;">
                            <div style="font-size: 11px; margin-bottom: 40px;">Tanda tangan petugas:</div>
                            <div style="border-bottom: 1px dotted #000; margin-bottom: 4px; font-weight: bold;" id="iso-sign-officer-name">( .................................................. )</div>
                            <div style="font-size: 10.5px;">Tanggal: <span id="iso-sign-officer-date">____ / ____ / ________</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 3. MODAL INPUT CHECKLIST TRANSPORT CPO - PK -->
<div class="modal-overlay" id="modal-haccp-cpo-input" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.65); z-index: 10500; overflow-y: auto; padding: 20px 10px; align-items: center; justify-content: center;">
    <div class="modal-content" style="background: #ffffff; width: 100%; max-width: 880px; margin: auto; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25); max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="modal-header" style="background: #0f172a; color: #ffffff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-truck-droplet text-primary"></i> Form Checklist Pemeriksaan Kebersihan Transport CPO - PK
            </h3>
            <button type="button" class="modal-close" onclick="closeHaccpCpoInputModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
        </div>
        <form id="form-haccp-cpo" onsubmit="saveHaccpCpoData(event)" style="padding: 20px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;">
            <!-- Metadata Kendaraan -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
                <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #1e293b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
                    DATA KENDARAAN & PENGEMUDI
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Tanggal *</label>
                        <input type="date" id="cpo-input-date" class="form-control" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Jam Pemeriksaan *</label>
                        <input type="time" id="cpo-input-time" class="form-control" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Jenis Kendaraan *</label>
                        <select id="cpo-input-vehicle-type" class="form-control" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                            <option value="Truck">Truck</option>
                            <option value="Fuso">Fuso</option>
                            <option value="Tronton">Tronton</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">No. Kendaraan (Plat Polisi) *</label>
                        <input type="text" id="cpo-input-vehicle-no" class="form-control" placeholder="Contoh: BD 8123 AM" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Nama Pengemudi *</label>
                        <input type="text" id="cpo-input-driver-name" class="form-control" placeholder="Contoh: Joko Susanto" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                </div>
            </div>

            <!-- Quick Action Bar -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="setAllCpoChecklist('ya')" style="padding: 5px 12px; font-size: 0.78rem; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 700; border: 1px solid #bae6fd;">
                    <i class="fa-solid fa-check-double"></i> Set Semua Standar Sesuai (Ya / Bersih)
                </button>
            </div>

            <!-- Bagian A. Riwayat Muatan Sebelumnya -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #1e293b; font-weight: 700;">A. Riwayat Muatan Sebelumnya</h4>
                <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; background: #fff;">
                    <thead>
                        <tr style="background: #e2e8f0; color: #334155;">
                            <th style="padding: 6px 8px; width: 35px; text-align: center;">No</th>
                            <th style="padding: 6px 10px; text-align: left;">Pemeriksaan</th>
                            <th style="padding: 6px 8px; width: 50px; text-align: center;">Ya</th>
                            <th style="padding: 6px 8px; width: 55px; text-align: center;">Tidak</th>
                            <th style="padding: 6px 10px; width: 220px; text-align: left;">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">1</td>
                            <td style="padding: 6px 10px;">Riwayat muatan sebelumnya diketahui</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_a1" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_a1" value="tidak" required></td>
                            <td><input type="text" id="cpo_a1_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">2</td>
                            <td style="padding: 6px 10px;">Muatan sebelumnya CPO</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_a2" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_a2" value="tidak" required></td>
                            <td><input type="text" id="cpo_a2_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bagian B. Pemeriksaan Kebersihan Kendaraan CPO -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #1e293b; font-weight: 700;">B. Pemeriksaan Kebersihan Kendaraan CPO</h4>
                <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; background: #fff;">
                    <thead>
                        <tr style="background: #e2e8f0; color: #334155;">
                            <th style="padding: 6px 8px; width: 35px; text-align: center;">No</th>
                            <th style="padding: 6px 10px; text-align: left;">Pemeriksaan</th>
                            <th style="padding: 6px 8px; width: 50px; text-align: center;">Ya</th>
                            <th style="padding: 6px 8px; width: 55px; text-align: center;">Tidak</th>
                            <th style="padding: 6px 10px; width: 220px; text-align: left;">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">1</td>
                            <td style="padding: 6px 10px;">Kendaraan dalam kondisi bersih</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b1" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b1" value="tidak" required></td>
                            <td><input type="text" id="cpo_b1_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">2</td>
                            <td style="padding: 6px 10px;">Bebas kontaminasi</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b2" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b2" value="tidak" required></td>
                            <td><input type="text" id="cpo_b2_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">3</td>
                            <td style="padding: 6px 10px;">Tidak terdapat bau asing</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b3" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b3" value="tidak" required></td>
                            <td><input type="text" id="cpo_b3_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">4</td>
                            <td style="padding: 6px 10px;">Tidak terdapat karat dalam tanki</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b4" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b4" value="tidak" required></td>
                            <td><input type="text" id="cpo_b4_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">5</td>
                            <td style="padding: 6px 10px;">Tidak terdapat genangan air dalam tanki</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b5" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b5" value="tidak" required></td>
                            <td><input type="text" id="cpo_b5_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">6</td>
                            <td style="padding: 6px 10px;">Tidak terdapat kebocoran oli/grease</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b6" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b6" value="tidak" required></td>
                            <td><input type="text" id="cpo_b6_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">7</td>
                            <td style="padding: 6px 10px;">Manhole, Valve dan seal berfungsi baik</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b7" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b7" value="tidak" required></td>
                            <td><input type="text" id="cpo_b7_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">8</td>
                            <td style="padding: 6px 10px;">Cek muatan truck yang dianggap mencurigakan</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b8" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_b8" value="tidak" required></td>
                            <td><input type="text" id="cpo_b8_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bagian C. Pemeriksaan Kebersihan Kendaraan PK -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #1e293b; font-weight: 700;">C. Pemeriksaan Kebersihan Kendaraan PK</h4>
                <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse; background: #fff;">
                    <thead>
                        <tr style="background: #e2e8f0; color: #334155;">
                            <th style="padding: 6px 8px; width: 35px; text-align: center;">No</th>
                            <th style="padding: 6px 10px; text-align: left;">Pemeriksaan</th>
                            <th style="padding: 6px 8px; width: 50px; text-align: center;">Ya</th>
                            <th style="padding: 6px 8px; width: 55px; text-align: center;">Tidak</th>
                            <th style="padding: 6px 10px; width: 220px; text-align: left;">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">1</td>
                            <td style="padding: 6px 10px;">Bak truck dalam kondisi bersih</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c1" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c1" value="tidak" required></td>
                            <td><input type="text" id="cpo_c1_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">2</td>
                            <td style="padding: 6px 10px;">Bebas sisa muatan sebelumnya</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c2" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c2" value="tidak" required></td>
                            <td><input type="text" id="cpo_c2_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">3</td>
                            <td style="padding: 6px 10px;">Bebas kontaminasi (kayu, besi, logam, batu, dll)</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c3" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c3" value="tidak" required></td>
                            <td><input type="text" id="cpo_c3_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">4</td>
                            <td style="padding: 6px 10px;">Terpal bersih, utuh dan kering</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c4" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c4" value="tidak" required></td>
                            <td><input type="text" id="cpo_c4_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">5</td>
                            <td style="padding: 6px 10px;">Tidak terdapat jamur atau bauk busuk</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c5" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c5" value="tidak" required></td>
                            <td><input type="text" id="cpo_c5_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">6</td>
                            <td style="padding: 6px 10px;">Tidak terdapat kebocoran oli/grease</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c6" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c6" value="tidak" required></td>
                            <td><input type="text" id="cpo_c6_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">7</td>
                            <td style="padding: 6px 10px;">Manhole, Valve dan seal berfungsi baik</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c7" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c7" value="tidak" required></td>
                            <td><input type="text" id="cpo_c7_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="text-align: center;">8</td>
                            <td style="padding: 6px 10px;">Cek muatan truck yang dianggap mencurigakan</td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c8" value="ya" checked required></td>
                            <td style="text-align: center;"><input type="radio" name="cpo_c8" value="tidak" required></td>
                            <td><input type="text" id="cpo_c8_note" class="form-control" placeholder="Keterangan" style="width: 100%; padding: 4px 8px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Status Kelayakan & Tanda Tangan -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #1e293b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
                    KESIMPULAN HASIL PEMERIKSAAN
                </h4>
                <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 6px;">
                        Status Kelayakan Kendaraan: *
                    </label>
                    <div style="display: flex; gap: 25px; align-items: center;">
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #166534; cursor: pointer; font-size: 0.95rem;">
                            <input type="radio" name="status_kelayakan" value="Layak" checked required> <i class="fa-solid fa-circle-check text-success"></i> LAYAK
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #991b1b; cursor: pointer; font-size: 0.95rem;">
                            <input type="radio" name="status_kelayakan" value="Tidak Layak" required> <i class="fa-solid fa-circle-xmark text-danger"></i> TIDAK LAYAK
                        </label>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Diperiksa Oleh (Security) *</label>
                        <input type="text" id="cpo-input-inspector" class="form-control" value="Security" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Diketahui Oleh (OA/MA/MHA/MM) *</label>
                        <input type="text" id="cpo-input-acknowledged" class="form-control" value="OA/MA/MHA/MM" required style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Catatan Tambahan (Opsional)</label>
                    <input type="text" id="cpo-input-notes" class="form-control" placeholder="Catatan kondisi fisik kendaraan, segel, dll" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem;">
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; position: sticky; bottom: -20px; background: #ffffff; padding: 14px 0 4px 0; border-top: 1px solid #e2e8f0; margin-top: 15px; z-index: 10;">
                <button type="button" class="btn btn-secondary" onclick="closeHaccpCpoInputModal()" style="padding: 8px 18px; border-radius: 6px;">Batal</button>
                <button type="submit" class="btn btn-primary" id="btn-save-haccp-cpo" style="padding: 8px 22px; border-radius: 6px; font-weight: 600; background: #0284c7; color: #fff;">
                    <i class="fa-solid fa-floppy-disk"></i> Simpan Hasil Pemeriksaan
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 4. MODAL VIEW & PRINT STANDAR ISO: PEMERIKSAAN TANKI CPO -->
<div class="modal-overlay" id="modal-haccp-cpo-view" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.65); z-index: 10600; overflow-y: auto; padding: 20px 10px; align-items: center; justify-content: center;">
    <div class="modal-content" style="background: #ffffff; width: 100%; max-width: 880px; margin: auto; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25); max-height: calc(100vh - 40px); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="modal-header" style="background: #1e293b; color: #ffffff; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-file-circle-check text-primary"></i> Checklist Pemeriksaan Kebersihan Transport CPO - PK
            </h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="btn btn-primary btn-sm" onclick="printHaccpElement('haccp-cpo-iso-document', 'Checklist Kebersihan Transport CPO - PK')" style="padding: 6px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-print"></i> Cetak Dokumen
                </button>
                <button type="button" class="modal-close" onclick="closeHaccpCpoViewModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
            </div>
        </div>
        
        <div style="padding: 25px; overflow-x: auto; background: #f1f5f9;"; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch;>
            <!-- ISO DOCUMENT CONTAINER -->
            <div id="haccp-cpo-iso-document" style="background: #ffffff; padding: 30px 35px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; font-family: 'Arial', sans-serif; color: #000000; line-height: 1.3; font-size: 11px;">
                <!-- Header -->
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 100px; text-align: center;">
                        <div style="font-size: 26px; color: #1e3a8a; font-weight: 900; line-height: 1;"><i class="fa-solid fa-seedling"></i></div>
                        <div style="font-weight: 900; font-size: 11px; letter-spacing: 1px; color: #1e3a8a; margin-top: 2px;">SIPEF</div>
                    </div>
                    <div style="flex: 1; text-align: center; padding-right: 100px;">
                        <div style="font-weight: 800; font-size: 14px; text-transform: capitalize;">Cheklist Pemeriksaan Kebersihan Transport CPO - PK</div>
                        <div style="font-weight: 800; font-size: 12.5px; margin-top: 2px;">PT. Agromuko Bunga Tanjung Palm Oil Mill</div>
                    </div>
                </div>

                <!-- Info Block -->
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
                    <tr>
                        <td style="width: 140px; padding: 2px 0; border: none;">Tanggal</td>
                        <td style="border: none;">: &nbsp; <span id="iso-cpo-date" style="font-weight: bold;">-</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; border: none;">Jenis Kendaraan</td>
                        <td style="border: none;">: &nbsp; <span id="iso-cpo-vehicle-type">-</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; border: none;">No. Kendaraan</td>
                        <td style="border: none;">: &nbsp; <span id="iso-cpo-vehicle-no" style="font-weight: bold;">-</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; border: none;">Nama Pengemudi</td>
                        <td style="border: none;">: &nbsp; <span id="iso-cpo-driver-name">-</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0; border: none;">Jam Pemeriksaan</td>
                        <td style="border: none;">: &nbsp; <span id="iso-cpo-time">-</span></td>
                    </tr>
                </table>

                <!-- Bagian A -->
                <div style="margin-bottom: 12px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">A. Riwayat Muatan Sebelumnya</div>
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 10.5px;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 35px; text-align: center;">No.</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; text-align: center;">Pemeriksaan</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 45px; text-align: center;">Ya</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 50px; text-align: center;">Tidak</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; width: 220px; text-align: center;">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">1</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Riwayat muatan sebelumnya diketahui</td>
                                <td id="iso-cpo-a1-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-a1-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-a1-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">2</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Muatan sebelumnya CPO</td>
                                <td id="iso-cpo-a2-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-a2-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-a2-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Bagian B -->
                <div style="margin-bottom: 12px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">B. Pemeriksaan Kebersihan Kendaraan CPO</div>
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 10.5px;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 35px; text-align: center;">No.</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; text-align: center;">Pemeriksaan</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 45px; text-align: center;">Ya</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 50px; text-align: center;">Tidak</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; width: 220px; text-align: center;">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">1</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Kendaraan dalam kondisi bersih</td>
                                <td id="iso-cpo-b1-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b1-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b1-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">2</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Bebas kontaminasi</td>
                                <td id="iso-cpo-b2-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b2-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b2-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">3</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat bau asing</td>
                                <td id="iso-cpo-b3-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b3-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b3-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">4</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat karat dalam tanki</td>
                                <td id="iso-cpo-b4-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b4-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b4-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">5</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat genangan air dalam tanki</td>
                                <td id="iso-cpo-b5-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b5-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b5-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">6</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat kebocoran oli/grease</td>
                                <td id="iso-cpo-b6-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b6-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b6-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">7</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Manhole, Valve dan seal berfungsi baik</td>
                                <td id="iso-cpo-b7-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b7-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b7-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">8</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Cek muatan truck yang dianggap mencurigakan</td>
                                <td id="iso-cpo-b8-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b8-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-b8-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Bagian C -->
                <div style="margin-bottom: 14px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 3px;">C. Pemeriksaan Kebersihan Kendaraan PK</div>
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 10.5px;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 35px; text-align: center;">No.</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; text-align: center;">Pemeriksaan</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 45px; text-align: center;">Ya</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; width: 50px; text-align: center;">Tidak</th>
                                <th style="border: 1px solid #000; padding: 4px 8px; width: 220px; text-align: center;">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">1</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Bak truck dalam kondisi bersih</td>
                                <td id="iso-cpo-c1-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c1-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c1-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">2</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Bebas sisa muatan sebelumnya</td>
                                <td id="iso-cpo-c2-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c2-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c2-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">3</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Bebas kontaminasi (kayu, besi, logam, batu, dll</td>
                                <td id="iso-cpo-c3-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c3-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c3-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">4</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Terpal bersih, utuh dan kering</td>
                                <td id="iso-cpo-c4-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c4-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c4-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">5</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat jamur atau bauk busuk</td>
                                <td id="iso-cpo-c5-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c5-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c5-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">6</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Tidak terdapat kebocoran oli/grease</td>
                                <td id="iso-cpo-c6-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c6-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c6-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">7</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Manhole, Valve dan seal berfungsi baik</td>
                                <td id="iso-cpo-c7-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c7-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c7-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; text-align: center;">8</td>
                                <td style="border: 1px solid #000; padding: 3px 6px;">Cek muatan truck yang dianggap mencurigakan</td>
                                <td id="iso-cpo-c8-ya" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c8-tidak" style="border: 1px solid #000; text-align: center; font-weight: bold;"></td>
                                <td id="iso-cpo-c8-note" style="border: 1px solid #000; padding: 3px 6px;"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Kesimpulan Status Kelayakan -->
                <div style="margin-bottom: 16px; border: 1.5px solid #000; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; font-size: 11.5px;">KESIMPULAN KELAYAKAN KENDARAAN:</div>
                    <div id="iso-cpo-status-badge" style="font-weight: 900; font-size: 13px; text-transform: uppercase;">LAYAK</div>
                </div>

                <!-- Tanda Tangan 2-Tier -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
                    <tr>
                        <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
                            <div style="font-weight: bold; margin-bottom: 45px;">Diperiksa oleh</div>
                            <div style="font-weight: bold;" id="iso-sign-cpo-inspector">Security</div>
                        </td>
                        <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
                            <div style="font-weight: bold; margin-bottom: 45px;">Diketahui Oleh</div>
                            <div style="font-weight: bold;" id="iso-sign-cpo-acknowledged">OA/MA/MHA/MM</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</div>
`;

// Global State
window.activeHaccpSubTab = 'hygiene';
window.haccpHygieneData = [];
window.haccpCpoData = [];

// Sub-Tab Switcher
window.switchHaccpSubTab = function(tabId) {
    window.activeHaccpSubTab = tabId;
    
    // Deactivate all
    document.querySelectorAll('#view-container .subsheet-tab-btn, .subsheet-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#e2e8f0';
        btn.style.color = '#475569';
    });
    document.querySelectorAll('#view-container .subsheet-content, .subsheet-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    
    // Activate target
    const btn = document.getElementById('tab-btn-haccp-' + (tabId === 'cpo_tank' ? 'cpo-tank' : 'hygiene'));
    if (btn) {
        btn.classList.add('active');
        btn.style.background = '#0284c7';
        btn.style.color = '#ffffff';
    }
    
    const content = document.getElementById('haccp-subsheet-' + (tabId === 'cpo_tank' ? 'cpo-tank' : 'hygiene'));
    if (content) {
        content.classList.add('active');
        content.style.display = 'block';
    }
    
    // Load data for active tab
    if (tabId === 'hygiene') {
        window.loadHaccpHygieneData();
    } else if (tabId === 'cpo_tank') {
        window.loadHaccpCpoData();
    }
};

window.renderHACCPView = function() {
    const today = window.getLocalDate ? window.getLocalDate() : new Date().toISOString().split('T')[0];
    
    // Init date inputs if empty
    const hStart = document.getElementById('haccp-hygiene-start-date');
    const hEnd = document.getElementById('haccp-hygiene-end-date');
    if (hStart && !hStart.value) hStart.value = today;
    if (hEnd && !hEnd.value) hEnd.value = today;
    
    const cStart = document.getElementById('haccp-cpo-start-date');
    const cEnd = document.getElementById('haccp-cpo-end-date');
    if (cStart && !cStart.value) cStart.value = today;
    if (cEnd && !cEnd.value) cEnd.value = today;

    window.switchHaccpSubTab(window.activeHaccpSubTab || 'hygiene');
};

// =========================================================================
// 1. PERSONAL HYGIENE FUNCTIONS
// =========================================================================

window.loadHaccpHygieneData = async function() {
    const tbody = document.getElementById('haccp-hygiene-tbody');
    const countBadge = document.getElementById('haccp-hygiene-count-badge');
    const startInput = document.getElementById('haccp-hygiene-start-date');
    const endInput = document.getElementById('haccp-hygiene-end-date');
    const today = window.getLocalDate ? window.getLocalDate() : new Date().toISOString().split('T')[0];
    
    if (startInput && !startInput.value) {
        startInput.value = today;
    }
    if (endInput && !endInput.value) {
        endInput.value = today;
    }
    
    const startDate = (startInput && startInput.value) ? startInput.value : today;
    const endDate = (endInput && endInput.value) ? endInput.value : today;
    
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 25px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data kuesioner tamu...</td></tr>';
    
    try {
        const currentEstate = (window.currentUser && window.currentUser.estate) ? window.currentUser.estate : '';
        const mill = (currentEstate && currentEstate.toLowerCase().includes('mill')) ? currentEstate : 'all';
        const res = await fetch(`${API_URL}/haccp/personal-hygiene/range/${encodeURIComponent(mill)}/${startDate}/${endDate}`);
        const data = await res.json();
        
        if (!Array.isArray(data)) throw new Error(data.error || 'Format data salah');
        
        window.haccpHygieneData = data;
        if (countBadge) countBadge.innerText = `${data.length} Tamu Terdata`;
        
        if (data.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px; color: #94a3b8;">Belum ada kuesioner kesehatan tamu pada periode ini. Klik <b>+ Input Kuesioner Tamu</b> untuk menambahkan.</td></tr>';
            return;
        }
        
        const canDelete = window.hasPermission ? window.hasPermission('haccp', 'delete') : true;
        
        let html = '';
        data.forEach((item, index) => {
            const isAllowed = parseInt(item.is_allowed) === 1;
            const badge = isAllowed 
                ? '<span style="background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Boleh Masuk</span>'
                : '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Tidak Boleh</span>';
            
            html += `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 8px 10px; text-align: center; color: #64748b; font-weight: 600;">${index + 1}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 500;">${item.date}</td>
                    <td style="padding: 8px 10px; text-align: center; color: #475569;">${item.time_in || '-'}</td>
                    <td style="padding: 8px 10px;">
                        <a href="javascript:void(0)" onclick="viewHaccpHygieneLogsheet(${item.id})" style="color: #0284c7; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fa-solid fa-file-signature"></i> ${item.name}
                        </a>
                    </td>
                    <td style="padding: 8px 10px; color: #334155;">${item.institution || '-'}</td>
                    <td style="padding: 8px 10px; color: #334155;">${item.purpose || '-'}</td>
                    <td style="padding: 8px 10px; color: #475569;">${item.target_area || '-'}</td>
                    <td style="padding: 8px 10px; text-align: center;">${badge}</td>
                    <td style="padding: 8px 10px; text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="viewHaccpHygieneLogsheet(${item.id})" title="Lihat & Print Logsheet" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;">
                                <i class="fa-solid fa-print"></i> Print
                            </button>
                            ${canDelete ? `
                            <button class="btn btn-danger btn-sm" onclick="deleteHaccpHygieneData(${item.id})" title="Hapus" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; background: #ef4444; color: #fff;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        if (tbody) tbody.innerHTML = html;
    } catch (err) {
        console.error('Error loading HACCP hygiene data:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 25px; color: red;">Gagal memuat data: ${err.message}</td></tr>`;
    }
};

window.openHaccpHygieneInputModal = function() {
    const modal = document.getElementById('modal-haccp-hygiene-input');
    if (!modal) return;
    
    // Set default values
    const today = window.getLocalDate ? window.getLocalDate() : new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    const dInput = document.getElementById('hygiene-input-date');
    const tInput = document.getElementById('hygiene-input-time');
    const oInput = document.getElementById('hygiene-input-officer');
    
    if (dInput) dInput.value = today;
    if (tInput) tInput.value = timeStr;
    if (oInput) oInput.value = (window.currentUser && window.currentUser.username) ? window.currentUser.username : 'Security';
    
    window.setAllHygieneQuestions('tidak');
    modal.style.display = 'flex';
};

window.closeHaccpHygieneInputModal = function() {
    const modal = document.getElementById('modal-haccp-hygiene-input');
    if (modal) modal.style.display = 'none';
};

window.setAllHygieneQuestions = function(val) {
    const qNames = ['q_demam', 'q_batuk', 'q_diare', 'q_luka', 'q_tifus', 'q_obat', 'q_hepatitis', 'q_jaundice', 'q_kontak_hep'];
    qNames.forEach(q => {
        const el = document.querySelector(`input[name="${q}"][value="${val}"]`);
        if (el) el.checked = true;
    });
};

window.saveHaccpHygieneData = async function(event) {
    if (event) event.preventDefault();
    
    const submitBtn = document.getElementById('btn-save-haccp-hygiene');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    }
    
    try {
        const currentEstate = (window.currentUser && window.currentUser.estate) ? window.currentUser.estate : '';
        const mill = (currentEstate && currentEstate.toLowerCase().includes('mill')) ? currentEstate : 'Bunga Tanjung Mill';
        const date = document.getElementById('hygiene-input-date')?.value;
        const time_in = document.getElementById('hygiene-input-time')?.value;
        const name = document.getElementById('hygiene-input-name')?.value;
        const institution = document.getElementById('hygiene-input-institution')?.value;
        const purpose = document.getElementById('hygiene-input-purpose')?.value;
        const target_area = document.getElementById('hygiene-input-target-area')?.value;
        
        const getRadioVal = (rName) => {
            const el = document.querySelector(`input[name="${rName}"]:checked`);
            return el ? el.value : 'tidak';
        };
        
        const q_demam = getRadioVal('q_demam');
        const q_batuk = getRadioVal('q_batuk');
        const q_diare = getRadioVal('q_diare');
        const q_luka = getRadioVal('q_luka');
        const q_tifus = getRadioVal('q_tifus');
        const q_obat = getRadioVal('q_obat');
        const q_hepatitis = getRadioVal('q_hepatitis');
        const q_jaundice = getRadioVal('q_jaundice');
        const q_kontak_hep = getRadioVal('q_kontak_hep');
        
        const is_allowed = parseInt(document.querySelector('input[name="is_allowed"]:checked')?.value || '1');
        const notes = document.getElementById('hygiene-input-notes')?.value || '';
        const officer_name = document.getElementById('hygiene-input-officer')?.value || '';
        
        const payload = {
            mill, date, time_in, name, institution, purpose, target_area,
            q_demam, q_batuk, q_diare, q_luka, q_tifus, q_obat,
            q_hepatitis, q_jaundice, q_kontak_hep,
            is_allowed, notes, officer_name
        };
        
        const res = await fetch(`${API_URL}/haccp/personal-hygiene`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error || 'Gagal menyimpan data');
        
        alert('Data Kuesioner Kesehatan Tamu berhasil disimpan!');
        window.closeHaccpHygieneInputModal();
        document.getElementById('form-haccp-hygiene')?.reset();
        window.loadHaccpHygieneData();
    } catch (err) {
        console.error('Error saving HACCP hygiene data:', err);
        alert('Gagal menyimpan: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Kuesioner';
        }
    }
};

window.deleteHaccpHygieneData = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data kuesioner tamu ini?')) return;
    try {
        const res = await fetch(`${API_URL}/haccp/personal-hygiene/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error || 'Gagal menghapus');
        window.loadHaccpHygieneData();
    } catch (err) {
        alert('Gagal menghapus: ' + err.message);
    }
};

window.viewHaccpHygieneLogsheet = function(id) {
    const item = window.haccpHygieneData.find(d => d.id == id);
    if (!item) {
        alert('Data tidak ditemukan');
        return;
    }
    
    // Populate modal ISO fields
    const setElem = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.innerText = val || '-';
    };
    
    setElem('iso-hygiene-name', item.name);
    setElem('iso-hygiene-institution', item.institution);
    setElem('iso-hygiene-purpose', item.purpose);
    setElem('iso-hygiene-target-area', item.target_area);
    setElem('iso-hygiene-date', item.date);
    setElem('iso-hygiene-time', item.time_in ? item.time_in + ' WIB' : '-');
    
    const setCheck = (qField, yaId, tidakId) => {
        const isYa = (item[qField] || '').toLowerCase() === 'ya';
        const elYa = document.getElementById(yaId);
        const elTidak = document.getElementById(tidakId);
        if (elYa) elYa.innerHTML = isYa ? '&#10003;' : '';
        if (elTidak) elTidak.innerHTML = !isYa ? '&#10003;' : '';
    };
    
    setCheck('q_demam', 'iso-q-demam-ya', 'iso-q-demam-tidak');
    setCheck('q_batuk', 'iso-q-batuk-ya', 'iso-q-batuk-tidak');
    setCheck('q_diare', 'iso-q-diare-ya', 'iso-q-diare-tidak');
    setCheck('q_luka', 'iso-q-luka-ya', 'iso-q-luka-tidak');
    setCheck('q_tifus', 'iso-q-tifus-ya', 'iso-q-tifus-tidak');
    setCheck('q_obat', 'iso-q-obat-ya', 'iso-q-obat-tidak');
    setCheck('q_hepatitis', 'iso-q-hepatitis-ya', 'iso-q-hepatitis-tidak');
    setCheck('q_jaundice', 'iso-q-jaundice-ya', 'iso-q-jaundice-tidak');
    setCheck('q_kontak_hep', 'iso-q-kontak_hep-ya', 'iso-q-kontak_hep-tidak');
    
    setElem('iso-sign-guest-name', `( ${item.name || '...................................'} )`);
    setElem('iso-sign-guest-date', item.date || '____ / ____ / ________');
    
    const isAllowed = parseInt(item.is_allowed) === 1;
    const decEl = document.getElementById('iso-officer-decision');
    if (decEl) {
        decEl.innerText = isAllowed ? 'YA (Diperbolehkan Masuk)' : 'TIDAK (Dilarang Masuk)';
        decEl.style.color = isAllowed ? '#15803d' : '#b91c1c';
        decEl.style.borderColor = isAllowed ? '#15803d' : '#b91c1c';
    }
    
    setElem('iso-officer-notes', item.notes || '-');
    setElem('iso-sign-officer-name', `( ${item.officer_name || 'Security'} )`);
    setElem('iso-sign-officer-date', item.date || '____ / ____ / ________');
    
    const modal = document.getElementById('modal-haccp-hygiene-view');
    if (modal) modal.style.display = 'flex';
};

window.closeHaccpHygieneViewModal = function() {
    const modal = document.getElementById('modal-haccp-hygiene-view');
    if (modal) modal.style.display = 'none';
};

window.printHaccpHygieneRecap = function() {
    window.printTable('haccp-hygiene-table-wrapper', 'Rekap Kuesioner Kesehatan Tamu PKS (Personal Hygiene)');
};


// =========================================================================
// 2. PEMERIKSAAN TANKI CPO FUNCTIONS
// =========================================================================

window.loadHaccpCpoData = async function() {
    const tbody = document.getElementById('haccp-cpo-tbody');
    const countBadge = document.getElementById('haccp-cpo-count-badge');
    const startInput = document.getElementById('haccp-cpo-start-date');
    const endInput = document.getElementById('haccp-cpo-end-date');
    const today = window.getLocalDate ? window.getLocalDate() : new Date().toISOString().split('T')[0];
    
    if (startInput && !startInput.value) {
        startInput.value = today;
    }
    if (endInput && !endInput.value) {
        endInput.value = today;
    }
    
    const startDate = (startInput && startInput.value) ? startInput.value : today;
    const endDate = (endInput && endInput.value) ? endInput.value : today;
    
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 25px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data pemeriksaan tanki...</td></tr>';
    
    try {
        const currentEstate = (window.currentUser && window.currentUser.estate) ? window.currentUser.estate : '';
        const mill = (currentEstate && currentEstate.toLowerCase().includes('mill')) ? currentEstate : 'all';
        const res = await fetch(`${API_URL}/haccp/cpo-tank/range/${encodeURIComponent(mill)}/${startDate}/${endDate}`);
        const data = await res.json();
        
        if (!Array.isArray(data)) throw new Error(data.error || 'Format data salah');
        
        window.haccpCpoData = data;
        if (countBadge) countBadge.innerText = `${data.length} Kendaraan Terperiksa`;
        
        if (data.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">Belum ada data pemeriksaan tanki CPO pada periode ini. Klik <b>+ Input Pemeriksaan Tanki</b> untuk menambahkan.</td></tr>';
            return;
        }
        
        const canDelete = window.hasPermission ? window.hasPermission('haccp', 'delete') : true;
        
        let html = '';
        data.forEach((item, index) => {
            const isLayak = (item.status_kelayakan || '').toLowerCase() === 'layak';
            const badge = isLayak 
                ? '<span style="background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Layak</span>'
                : '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Tidak Layak</span>';
            
            html += `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 8px 10px; text-align: center; color: #64748b; font-weight: 600;">${index + 1}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 500;">${item.date}</td>
                    <td style="padding: 8px 10px; text-align: center; color: #475569;">${item.time_check || '-'}</td>
                    <td style="padding: 8px 10px;">
                        <a href="javascript:void(0)" onclick="viewHaccpCpoLogsheet(${item.id})" style="color: #0284c7; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fa-solid fa-truck-front"></i> ${item.driver_name}
                        </a>
                    </td>
                    <td style="padding: 8px 10px; text-align: center; color: #334155;"><span class="badge" style="background:#f1f5f9; color:#334155; padding:3px 8px; border-radius:4px;">${item.vehicle_type || 'Truck'}</span></td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #0f172a;">${item.vehicle_no || '-'}</td>
                    <td style="padding: 8px 10px; text-align: center;">${badge}</td>
                    <td style="padding: 8px 10px; text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button class="btn btn-secondary btn-sm" onclick="viewHaccpCpoLogsheet(${item.id})" title="Lihat & Print Logsheet" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;">
                                <i class="fa-solid fa-print"></i> Print
                            </button>
                            ${canDelete ? `
                            <button class="btn btn-danger btn-sm" onclick="deleteHaccpCpoData(${item.id})" title="Hapus" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; background: #ef4444; color: #fff;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        if (tbody) tbody.innerHTML = html;
    } catch (err) {
        console.error('Error loading HACCP CPO data:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 25px; color: red;">Gagal memuat data: ${err.message}</td></tr>`;
    }
};

window.openHaccpCpoInputModal = function() {
    const modal = document.getElementById('modal-haccp-cpo-input');
    if (!modal) return;
    
    const today = window.getLocalDate ? window.getLocalDate() : new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    const dInput = document.getElementById('cpo-input-date');
    const tInput = document.getElementById('cpo-input-time');
    if (dInput) dInput.value = today;
    if (tInput) tInput.value = timeStr;
    
    window.setAllCpoChecklist('ya');
    modal.style.display = 'flex';
};

window.closeHaccpCpoInputModal = function() {
    const modal = document.getElementById('modal-haccp-cpo-input');
    if (modal) modal.style.display = 'none';
};

window.setAllCpoChecklist = function(val) {
    const prefixes = ['cpo_a1', 'cpo_a2', 'cpo_b1', 'cpo_b2', 'cpo_b3', 'cpo_b4', 'cpo_b5', 'cpo_b6', 'cpo_b7', 'cpo_b8', 'cpo_c1', 'cpo_c2', 'cpo_c3', 'cpo_c4', 'cpo_c5', 'cpo_c6', 'cpo_c7', 'cpo_c8'];
    prefixes.forEach(p => {
        const el = document.querySelector(`input[name="${p}"][value="${val}"]`);
        if (el) el.checked = true;
    });
};

window.saveHaccpCpoData = async function(event) {
    if (event) event.preventDefault();
    
    const submitBtn = document.getElementById('btn-save-haccp-cpo');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    }
    
    try {
        const currentEstate = (window.currentUser && window.currentUser.estate) ? window.currentUser.estate : '';
        const mill = (currentEstate && currentEstate.toLowerCase().includes('mill')) ? currentEstate : 'Bunga Tanjung Mill';
        const date = document.getElementById('cpo-input-date')?.value;
        const time_check = document.getElementById('cpo-input-time')?.value;
        const vehicle_type = document.getElementById('cpo-input-vehicle-type')?.value || 'Truck';
        const vehicle_no = document.getElementById('cpo-input-vehicle-no')?.value || '';
        const driver_name = document.getElementById('cpo-input-driver-name')?.value || '';
        
        const getRadio = (name) => {
            const el = document.querySelector(`input[name="${name}"]:checked`);
            return el ? el.value : 'ya';
        };
        const getNote = (id) => document.getElementById(id)?.value || '';
        
        const checklist_data = {
            a1: { status: getRadio('cpo_a1'), note: getNote('cpo_a1_note') },
            a2: { status: getRadio('cpo_a2'), note: getNote('cpo_a2_note') },
            b1: { status: getRadio('cpo_b1'), note: getNote('cpo_b1_note') },
            b2: { status: getRadio('cpo_b2'), note: getNote('cpo_b2_note') },
            b3: { status: getRadio('cpo_b3'), note: getNote('cpo_b3_note') },
            b4: { status: getRadio('cpo_b4'), note: getNote('cpo_b4_note') },
            b5: { status: getRadio('cpo_b5'), note: getNote('cpo_b5_note') },
            b6: { status: getRadio('cpo_b6'), note: getNote('cpo_b6_note') },
            b7: { status: getRadio('cpo_b7'), note: getNote('cpo_b7_note') },
            b8: { status: getRadio('cpo_b8'), note: getNote('cpo_b8_note') },
            c1: { status: getRadio('cpo_c1'), note: getNote('cpo_c1_note') },
            c2: { status: getRadio('cpo_c2'), note: getNote('cpo_c2_note') },
            c3: { status: getRadio('cpo_c3'), note: getNote('cpo_c3_note') },
            c4: { status: getRadio('cpo_c4'), note: getNote('cpo_c4_note') },
            c5: { status: getRadio('cpo_c5'), note: getNote('cpo_c5_note') },
            c6: { status: getRadio('cpo_c6'), note: getNote('cpo_c6_note') },
            c7: { status: getRadio('cpo_c7'), note: getNote('cpo_c7_note') },
            c8: { status: getRadio('cpo_c8'), note: getNote('cpo_c8_note') }
        };
        
        const status_kelayakan = document.querySelector('input[name="status_kelayakan"]:checked')?.value || 'Layak';
        const inspector_name = document.getElementById('cpo-input-inspector')?.value || 'Security';
        const acknowledged_by = document.getElementById('cpo-input-acknowledged')?.value || 'OA/MA/MHA/MM';
        const notes = document.getElementById('cpo-input-notes')?.value || '';
        
        const payload = {
            mill, date, time_check, vehicle_type, vehicle_no, driver_name,
            checklist_data, status_kelayakan, inspector_name, acknowledged_by, notes
        };
        
        const res = await fetch(`${API_URL}/haccp/cpo-tank`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error || 'Gagal menyimpan data');
        
        alert('Data Pemeriksaan Kebersihan Transport CPO - PK berhasil disimpan!');
        window.closeHaccpCpoInputModal();
        document.getElementById('form-haccp-cpo')?.reset();
        window.loadHaccpCpoData();
    } catch (err) {
        console.error('Error saving HACCP CPO data:', err);
        alert('Gagal menyimpan: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Hasil Pemeriksaan';
        }
    }
};

window.deleteHaccpCpoData = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data pemeriksaan transport ini?')) return;
    try {
        const res = await fetch(`${API_URL}/haccp/cpo-tank/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error || 'Gagal menghapus');
        window.loadHaccpCpoData();
    } catch (err) {
        alert('Gagal menghapus: ' + err.message);
    }
};

window.viewHaccpCpoLogsheet = function(id) {
    const item = window.haccpCpoData.find(d => d.id == id);
    if (!item) {
        alert('Data tidak ditemukan');
        return;
    }
    
    let chk = {};
    try {
        chk = typeof item.checklist_data === 'string' ? JSON.parse(item.checklist_data) : (item.checklist_data || {});
    } catch (e) {
        chk = {};
    }
    
    const setElem = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el) el.innerText = val || '';
    };
    
    setElem('iso-cpo-date', item.date);
    setElem('iso-cpo-vehicle-type', item.vehicle_type || 'Truck');
    setElem('iso-cpo-vehicle-no', item.vehicle_no);
    setElem('iso-cpo-driver-name', item.driver_name);
    setElem('iso-cpo-time', item.time_check ? item.time_check + ' WIB' : '-');
    
    const setRow = (key, yaId, tidakId, noteId) => {
        const data = chk[key] || { status: 'ya', note: '' };
        const isYa = (data.status || '').toLowerCase() === 'ya';
        const elYa = document.getElementById(yaId);
        const elTidak = document.getElementById(tidakId);
        const elNote = document.getElementById(noteId);
        if (elYa) elYa.innerHTML = isYa ? '&#10003;' : '';
        if (elTidak) elTidak.innerHTML = !isYa ? '&#10003;' : '';
        if (elNote) elNote.innerText = data.note || '';
    };
    
    setRow('a1', 'iso-cpo-a1-ya', 'iso-cpo-a1-tidak', 'iso-cpo-a1-note');
    setRow('a2', 'iso-cpo-a2-ya', 'iso-cpo-a2-tidak', 'iso-cpo-a2-note');
    
    setRow('b1', 'iso-cpo-b1-ya', 'iso-cpo-b1-tidak', 'iso-cpo-b1-note');
    setRow('b2', 'iso-cpo-b2-ya', 'iso-cpo-b2-tidak', 'iso-cpo-b2-note');
    setRow('b3', 'iso-cpo-b3-ya', 'iso-cpo-b3-tidak', 'iso-cpo-b3-note');
    setRow('b4', 'iso-cpo-b4-ya', 'iso-cpo-b4-tidak', 'iso-cpo-b4-note');
    setRow('b5', 'iso-cpo-b5-ya', 'iso-cpo-b5-tidak', 'iso-cpo-b5-note');
    setRow('b6', 'iso-cpo-b6-ya', 'iso-cpo-b6-tidak', 'iso-cpo-b6-note');
    setRow('b7', 'iso-cpo-b7-ya', 'iso-cpo-b7-tidak', 'iso-cpo-b7-note');
    setRow('b8', 'iso-cpo-b8-ya', 'iso-cpo-b8-tidak', 'iso-cpo-b8-note');
    
    setRow('c1', 'iso-cpo-c1-ya', 'iso-cpo-c1-tidak', 'iso-cpo-c1-note');
    setRow('c2', 'iso-cpo-c2-ya', 'iso-cpo-c2-tidak', 'iso-cpo-c2-note');
    setRow('c3', 'iso-cpo-c3-ya', 'iso-cpo-c3-tidak', 'iso-cpo-c3-note');
    setRow('c4', 'iso-cpo-c4-ya', 'iso-cpo-c4-tidak', 'iso-cpo-c4-note');
    setRow('c5', 'iso-cpo-c5-ya', 'iso-cpo-c5-tidak', 'iso-cpo-c5-note');
    setRow('c6', 'iso-cpo-c6-ya', 'iso-cpo-c6-tidak', 'iso-cpo-c6-note');
    setRow('c7', 'iso-cpo-c7-ya', 'iso-cpo-c7-tidak', 'iso-cpo-c7-note');
    setRow('c8', 'iso-cpo-c8-ya', 'iso-cpo-c8-tidak', 'iso-cpo-c8-note');
    
    const isLayak = (item.status_kelayakan || '').toLowerCase() === 'layak';
    const stEl = document.getElementById('iso-cpo-status-badge');
    if (stEl) {
        stEl.innerText = isLayak ? 'LAYAK' : 'TIDAK LAYAK';
        stEl.style.color = isLayak ? '#15803d' : '#b91c1c';
    }
    
    setElem('iso-sign-cpo-inspector', item.inspector_name || 'Security');
    setElem('iso-sign-cpo-acknowledged', item.acknowledged_by || 'OA/MA/MHA/MM');
    
    const modal = document.getElementById('modal-haccp-cpo-view');
    if (modal) modal.style.display = 'flex';
};

window.closeHaccpCpoViewModal = function() {
    const modal = document.getElementById('modal-haccp-cpo-view');
    if (modal) modal.style.display = 'none';
};

window.printHaccpCpoRecap = function() {
    window.printTable('haccp-cpo-table-wrapper', 'Rekap Pemeriksaan Kebersihan Transport CPO - PK');
};


// =========================================================================
// HACCP DEDICATED ISO PRINT HELPER
// =========================================================================

window.printHaccpElement = function(elementId, title) {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
        alert('Pop-up terblokir! Izinkan pop-up pada browser Anda untuk mencetak.');
        return;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title || 'Dokumentasi HACCP'}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                @page {
                    size: A4 portrait;
                    margin: 12mm 15mm;
                }
                body {
                    font-family: 'Arial', 'Helvetica', sans-serif;
                    color: #000000;
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                * {
                    box-sizing: border-box;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 4px 6px;
                }
                .no-border th, .no-border td {
                    border: none !important;
                }
                @media print {
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div style="padding: 10px;">
                ${printContent.innerHTML}
            </div>
            <script>
                window.onload = function() {
                    window.focus();
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

