// --- MILL MODULES (Processing, Water, FFB Quality, Dashboard) ---
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
// API_URL used from global or window
window.API_URL = window.API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3006/api' : '/api');
if (!window.views) window.views = {};
window.views = window.views || (typeof views !== 'undefined' ? views : {});
const views = window.views;


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
            <input type="month" id="dash-monthly-liquid-month" class="form-control" style="width: auto; padding: 5px 12px; font-size: 0.88rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px;">
            <button class="btn btn-primary" onclick="if(window.loadMonthlyLiquidMonitoring) window.loadMonthlyLiquidMonitoring()" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-magnifying-glass"></i> Tampilkan</button>
            <button class="btn btn-secondary" onclick="printTable('dash-monthly-liquid-wrapper', 'Laporan Monthly Liquid Monitoring')" style="padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    </div>
    
    <div class="table-responsive" id="dash-monthly-liquid-wrapper" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <table class="data-table" id="dash-table-monthly-liquid" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
            <thead></thead>
            <tbody>
                <tr><td colspan="34" style="text-align: center; padding: 25px; color: #64748b; font-style: italic;">Pilih bulan dan klik Tampilkan</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Water Analysis Section Below Monthly Liquid Monitoring -->
<div class="dashboard-grid" style="grid-template-columns: minmax(0, 1fr); gap: 15px; margin-top: 20px;">
    <div class="glass-card" style="overflow: hidden; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.05rem; font-weight: 700; color: #1e293b;"><i class="fa-solid fa-water" style="color: #0284c7; margin-right: 8px;"></i>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="data-table" id="dash-table-water-sebelum" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <div class="glass-card" style="overflow: hidden; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.05rem; font-weight: 700; color: #1e293b;"><i class="fa-solid fa-fire-burner" style="color: #ea580c; margin-right: 8px;"></i>1.2 Analisa Air Boiler (Rata-rata)</h3>
        <div class="table-responsive" style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="data-table" id="dash-table-water-boiler" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.82rem;">
                <thead></thead>
                <tbody></tbody>
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
    if (monthInput && !monthInput.value) monthInput.value = month;

    let mill = 'Bunga Tanjung Mill';
    const headerDropdown = document.getElementById('header-estate-dropdown');
    if (headerDropdown && headerDropdown.value && headerDropdown.value.toLowerCase().includes('mill')) {
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

        const getVal = (type, field, d, fallbackField = null) => {
            const store = type === 'liquid' ? dayLiquid[d] : dayFfa[d];
            if (store && store.count[field] > 0) {
                return (store.sum[field] / store.count[field]).toFixed(2);
            }
            if (fallbackField && store && store.count[fallbackField] > 0) {
                return (store.sum[fallbackField] / store.count[fallbackField]).toFixed(2);
            }
            return '-';
        };

        const getAvg = (type, field, fallbackField = null) => {
            const store = type === 'liquid' ? totalLiquid : totalFfa;
            if (store && store.count[field] > 0) {
                return (store.sum[field] / store.count[field]).toFixed(2);
            }
            if (fallbackField && store && store.count[fallbackField] > 0) {
                return (store.sum[fallbackField] / store.count[fallbackField]).toFixed(2);
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

        // Rows Configuration
        const rowsConfig = [
            // Section a: Crude Oil Tank (% Oil)
            { type: 'header', title: 'a. Crude Oil Tank (% Oil)', bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'cot_oil' },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'cot_sludge' },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'cot_water' },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'cot_solid' },
            
            // Section b: CONTINUOUS SETTLING TANK (CST)
            { type: 'header', title: 'b. CONTINUOUS SETTLING TANK (CST)', bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
            { type: 'subheader', title: 'b.1. UNDERFLOW CST', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'cst1_oil' },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'cst1_sludge' },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'cst1_water' },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'cst1_solid' },
            { type: 'subheader', title: 'b.2. Ketebalan Minyak CST (CM)', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'Ketebalan Minyak (CM)', source: 'liquid', field: 'cst1_level_minyak' },

            // Section c: SLUDGE TANK
            { type: 'header', title: 'c. SLUDGE TANK', bg: '#f0fdfa', border: '#14b8a6', color: '#115e59' },
            { type: 'data', label: 'Oil (%)', source: 'liquid', field: 'sludge_tank_oil' },
            { type: 'data', label: 'Sludge (%)', source: 'liquid', field: 'sludge_tank_sludge' },
            { type: 'data', label: 'Water (%)', source: 'liquid', field: 'sludge_tank_water' },
            { type: 'data', label: 'Solid (%)', source: 'liquid', field: 'sludge_tank_solid' },

            // Section d: TEMPERATURE
            { type: 'header', title: 'd. TEMPERATURE', bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
            { type: 'data', label: 'Crude Oil Tank (°C)', source: 'liquid', field: 'cot_temp' },
            { type: 'data', label: 'Continuous Settling Tank (CST) (°C)', source: 'liquid', field: 'cst1_temp' },
            { type: 'data', label: 'Sludge Tank (°C)', source: 'liquid', field: 'sludge_tank_temp' },

            // Section e: CPO PRODUCTION QUALITY
            { type: 'header', title: 'e. CPO PRODUCTION QUALITY', bg: '#fdf2f8', border: '#ec4899', color: '#9d174d' },
            { type: 'subheader', title: 'e.1. Sebelum Washing Plant', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'FFA (%)', source: 'ffa', field: 'ffa_b' },
            { type: 'data', label: 'Moist (%)', source: 'ffa', field: 'moist_b' },
            { type: 'data', label: 'Dirt (%)', source: 'ffa', field: 'dirt_b' },
            { type: 'subheader', title: 'e.2. Setelah Washing Plant', bg: '#f8fafc', color: '#475569' },
            { type: 'data', label: 'FFA (%)', source: 'ffa', field: 'ffa_a', fallback: 'ffa' },
            { type: 'data', label: 'Moist (%)', source: 'ffa', field: 'moist_a', fallback: 'moist' },
            { type: 'data', label: 'Dirt (%)', source: 'ffa', field: 'dirt_a' }
        ];

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
                const avgVal = getAvg(row.source, row.field, row.fallback);
                tbodyHtml += '<tr style="transition: background 0.15s ease;">';
                tbodyHtml += '<td style="text-align: left; padding: 5px 12px 5px 30px; font-weight: 500; position: sticky; left: 0; background-color: #ffffff; z-index: 1; border-right: 2px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; color: #334155;">' + row.label + '</td>';
                daysArray.forEach(d => {
                    const val = getVal(row.source, row.field, d, row.fallback);
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
        console.error('Error loading Monthly Liquid Monitoring:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="35" style="text-align: center; color: red; padding: 25px;">Gagal memuat data: ' + err.message + '</td></tr>';
    }
};

window.loadDashboardExtraData = async function(dateOverride) {
    let date = dateOverride || document.getElementById('dash-date')?.value;
    if(!date) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        date = yyyy + '-' + mm + '-' + dd;
    }
    
    let mill = window.currentUser && window.currentUser.estate && window.currentUser.estate !== 'Semua Estate (Khusus Admin)' 
               ? window.currentUser.estate 
               : 'Bunga Tanjung Mill';
               
    const dashMonth = date.substring(0, 7);

    // Call Monthly Liquid Monitoring
    if (typeof window.loadMonthlyLiquidMonitoring === 'function') {
        window.loadMonthlyLiquidMonitoring(dashMonth);
    }
    
    try {
        let resWMonth = await fetch('/api/water/dashboard/month/' + encodeURIComponent(mill) + '/' + encodeURIComponent(dashMonth));
        let monthlyWaterData = resWMonth.ok ? await resWMonth.json() : { water_analysis: [], boiler_averages: {} };
        
        const parts = date.split('-');
        const daysInMonth = new Date(parts[0], parts[1], 0).getDate();
        const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

        // 1. Fill Water Sebelum Proses
        let dashWaterSebelumTable = document.getElementById('dash-table-water-sebelum');
        if (dashWaterSebelumTable) {
            let thead = dashWaterSebelumTable.querySelector('thead');
            let tbody = dashWaterSebelumTable.querySelector('tbody');

            let headRow = '<tr><th style="min-width: 200px; position: sticky; left: 0; background-color: #fff; z-index: 1;">PARAMETER</th>';
            daysArray.forEach(d => {
                headRow += '<th style="min-width: 45px; text-align: center;">' + d + '</th>';
            });
            headRow += '</tr>';
            thead.innerHTML = headRow;

            const fieldsSebelum = [
                { id: 'raw_tds', label: 'Raw Water - TDS' },
                { id: 'raw_ph', label: 'Raw Water - PH' },
                { id: 'raw_turbidity', label: 'Raw Water - Turbidity' },
                { id: 'raw_thardness', label: 'Raw Water - Total Hardness' },
                { id: 'clarified_ph', label: 'Clarified Water - PH' },
                { id: 'clarified_turbidity', label: 'Clarified Water - Turbidity' },
                { id: 'clarified_thardness', label: 'Clarified Water - Total Hardness' },
                { id: 'sand_filter_ph', label: 'Sand Filter - PH' },
                { id: 'sand_filter_turbidity', label: 'Sand Filter - Turbidity' },
                { id: 'sand_filter_thardness', label: 'Sand Filter - Total Hardness' },
                { id: 'feed_water_ph', label: 'Feed Water - PH' },
                { id: 'feed_water_tds', label: 'Feed Water - TDS' },
                { id: 'feed_water_thardness', label: 'Feed Water - Total Hardness' }
            ];

            let bodyHtml = '';
            fieldsSebelum.forEach(f => {
                bodyHtml += '<tr><td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">' + f.label + '</td>';
                daysArray.forEach(d => {
                    const dayStr = String(d).padStart(2, '0');
                    const fullDate = dashMonth + '-' + dayStr;
                    const dayObj = (monthlyWaterData.water_analysis || []).find(w => w.date === fullDate);
                    const val = dayObj && dayObj[f.id] !== null && dayObj[f.id] !== undefined ? dayObj[f.id] : '-';
                    bodyHtml += '<td style="text-align: center;">' + val + '</td>';
                });
                bodyHtml += '</tr>';
            });
            tbody.innerHTML = bodyHtml;
        }

        // 2. Fill Water Boiler Rata-rata (Monthly)
        let dashWaterBoilerTable = document.getElementById('dash-table-water-boiler');
        if (dashWaterBoilerTable) {
            let thead = dashWaterBoilerTable.querySelector('thead');
            let tbody = dashWaterBoilerTable.querySelector('tbody');

            let headRow = '<tr><th style="min-width: 200px; position: sticky; left: 0; background-color: #fff; z-index: 1;">PARAMETER</th>';
            daysArray.forEach(d => {
                headRow += '<th style="min-width: 45px; text-align: center;">' + d + '</th>';
            });
            headRow += '</tr>';
            thead.innerHTML = headRow;

            const fieldsBoiler = [
                { id: 'ph', label: 'PH' },
                { id: 'tds', label: 'TDS' },
                { id: 'palkanity', label: 'P-Alkanity' },
                { id: 'malkanity', label: 'M-Alkanity' },
                { id: 'oalkanity', label: 'O-Alkanity' },
                { id: 'thardness', label: 'T-Hardness' },
                { id: 'silica', label: 'Silica' },
                { id: 'phospate', label: 'Phospate' },
                { id: 'sulfite', label: 'Sulfite' },
                { id: 'chloride', label: 'Chloride' }
            ];

            let bodyHtml = '';
            fieldsBoiler.forEach(f => {
                bodyHtml += '<tr><td style="position: sticky; left: 0; background-color: #fff; z-index: 1;">' + f.label + '</td>';
                daysArray.forEach(d => {
                    const dayStr = String(d).padStart(2, '0');
                    const fullDate = dashMonth + '-' + dayStr;
                    const dayAvgObj = monthlyWaterData.boiler_averages ? monthlyWaterData.boiler_averages[fullDate] : null;
                    const val = dayAvgObj && dayAvgObj[f.id] !== undefined ? dayAvgObj[f.id] : '-';
                    bodyHtml += '<td style="text-align: center;">' + val + '</td>';
                });
                bodyHtml += '</tr>';
            });
            tbody.innerHTML = bodyHtml;
        }

    } catch (e) {
        console.error('Error in loadDashboardExtraData:', e);
    }
};
