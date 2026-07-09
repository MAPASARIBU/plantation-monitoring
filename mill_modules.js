// --- MILL MODULES (Processing, Water, FFB Quality, Dashboard) ---

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
                    <option value="06:00">06:00</option><option value="08:00">08:00</option>
                    <option value="10:00">10:00</option><option value="12:00">12:00</option>
                    <option value="14:00">14:00</option><option value="16:00">16:00</option>
                    <option value="18:00">18:00</option><option value="20:00">20:00</option>
                    <option value="22:00">22:00</option><option value="24:00">24:00</option>
                    <option value="02:00">02:00</option><option value="04:00">04:00</option>
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
};

window.openLiquidModal = function() {
    const mainDate = document.getElementById('p-date').value;
    document.getElementById('ml-date').value = mainDate;
    document.getElementById('modal-input-liquid').style.display = 'flex';
    window.loadLiquidHour();
};

window.openFfaModal = function() {
    const mainDate = document.getElementById('p-date').value;
    document.getElementById('mf-date').value = mainDate;
    document.getElementById('modal-input-ffa').style.display = 'flex';
    window.loadFfaHour();
};

window.openProcessingHistorical = function() {
    document.getElementById('modal-processing-hist').style.display = 'flex';
    // Historical already populated by loadProcessingData
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
    
    const hoursL = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00','24:00','02:00','04:00','06:00'];
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

window.renderWaterView = function() {
    if (!document.getElementById('w-date').value) {
        document.getElementById('w-date').value = window.getLocalDate();
    }
    window.loadWaterData();
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
<div class="content-header">
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <input type="date" id="fq-date" class="form-control" style="width: auto;" onchange="loadFFBQuality()">
        <button class="btn btn-primary" onclick="loadFFBQuality()"><i class="fa-solid fa-rotate"></i> Load</button>
        <button class="btn btn-success" onclick="openFFBModal()"><i class="fa-solid fa-plus"></i> Tambah input Loose Fruit Quality</button>
    </div>
</div>
<div class="dashboard-grid" style="grid-template-columns: 1fr;">
    <div class="glass-card" style="overflow-x: auto;">
        <h3>FFB Quality Fruit Loose Analysis</h3>
        <div class="table-responsive">
            <style>
                #ffb-quality-table th, #ffb-quality-table td {
                    padding: 4px 8px !important;
                }
            </style>
            <table class="data-table" id="ffb-quality-table" style="font-size: 0.8rem; width: 100%;">
                <thead>
                    <tr>
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
                        <td colspan="3" style="text-align: right;">RATA-RATA / TOTAL:</td>
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

<!-- Modal Input FFB Quality -->
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
`;

window.ffbQualityData = [];

window.renderFFBQualityView = function() {
    if (!document.getElementById('fq-date').value) {
        document.getElementById('fq-date').value = window.getLocalDate();
    }
    window.loadFFBQuality();
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

window.renderFFBTable = function() {
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
            <td><button class="btn btn-danger" style="padding: 4px 8px;" onclick="deleteFFBRow(${index})"><i class="fa-solid fa-trash"></i></button></td>
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

window.loadFFBQuality = async function() {
    const date = document.getElementById('fq-date').value;
    let mill = window.currentUser ? window.currentUser.estate : null; 
    if (!mill || !mill.endsWith('Mill')) mill = 'Bunga Tanjung Mill';
    if(!mill) return;
    
    if(typeof masterData === 'undefined' || !masterData.supply_chain) {
        if(typeof loadMasterData === 'function') await loadMasterData();
    }
    
    try {
        let res = await fetch(`/api/ffb_quality/${mill}/${date}`);
        window.ffbQualityData = await res.json();
    } catch(e) {
        console.error(e);
        window.ffbQualityData = [];
    }
    window.renderFFBTable();
};

window.saveFFBQuality = async function() {
    const date = document.getElementById('fq-date').value;
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
    } catch(e) {
        console.error(e);
        container.innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
    }
};

window.openFFBModal = function() {
    const date = document.getElementById('fq-date').value;
    document.getElementById('fq-modal-date').value = date;
    
    let estatesOpts = typeof masterData !== 'undefined' && masterData.supply_chain 
        ? masterData.supply_chain.filter(s => s.is_ffb !== false).map(s => `<option value="${s.estate}">${s.estate}</option>`).join('')
        : '<option value="">Kosong / Belum Load</option>';
    document.getElementById('fq-modal-estate').innerHTML = estatesOpts;
    
    document.getElementById('fq-modal-divisi-container').innerHTML = `<input type="text" id="fq-modal-divisi" class="form-control" placeholder="(Optional)">`;
    const currentEst = document.getElementById('fq-modal-estate').value;
    if (currentEst) {
        window.onFFBModalEstateChange(currentEst);
    }
    document.getElementById('fq-modal-truck').value = '';
    document.getElementById('fq-modal-bg').value = '';
    document.getElementById('fq-modal-bd').value = '';
    document.getElementById('fq-modal-tsegar').value = '';
    document.getElementById('fq-modal-busuk').value = '';
    document.getElementById('fq-modal-sampah').value = '';
    
    document.getElementById('modal-ffb-quality').style.display = 'flex';
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
    const mainDate = document.getElementById('fq-date').value;
    
    if (modalDate && modalDate !== mainDate) {
        document.getElementById('fq-date').value = modalDate;
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

<div class="dashboard-grid" style="grid-template-columns: 35% 65%; gap: 15px; margin-top: 20px;">
    <div class="glass-card" style="overflow-x: auto;">
        <h3>1.1 Analisa Air Sebelum Proses</h3>
        <div class="table-responsive">
            <table class="data-table" id="dash-table-water-sebelum">
                <tbody>
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> RAW WATER</strong></td></tr>
                    <tr><td style="width:75%;">PH</td><td id="td_raw_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_raw_tds"></td></tr>
                    <tr><td>T.hardness</td><td id="td_raw_thardness"></td></tr>
                    <tr><td>Silica/Sio2</td><td id="td_raw_silica"></td></tr>
                    <tr><td>Turbidity</td><td id="td_raw_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_raw_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> WTP / clarifier</strong></td></tr>
                    <tr><td>PH</td><td id="td_wtp_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_wtp_tds"></td></tr>
                    <tr><td>Turbidity(&lt;10)</td><td id="td_wtp_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_wtp_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>=> Sand Filter</strong></td></tr>
                    <tr><td>PH</td><td id="td_sand_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_sand_tds"></td></tr>
                    <tr><td>Turbidity(&lt;10)</td><td id="td_sand_turbidity"></td></tr>
                    <tr><td>Cloride</td><td id="td_sand_cloride"></td></tr>
                    
                    <tr style="background-color: #f1f5f9;"><td colspan="2"><strong>Demin plant no.1 atau no.2 (pilihan)</strong></td></tr>
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> CATION</strong></td></tr>
                    <tr><td>PH(&lt;5.5)</td><td id="td_cation_ph"></td></tr>
                    <tr><td>Tds</td><td id="td_cation_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_cation_thardness"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> ANION</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_anion_ph"></td></tr>
                    <tr><td>Tds(&lt;100)</td><td id="td_anion_tds"></td></tr>
                    <tr><td>SiO2/silica(&lt;2.5)</td><td id="td_anion_silica"></td></tr>
                    
                    <tr style="background-color: #f8fafc;"><td colspan="2"><strong>=> FEED TANK</strong></td></tr>
                    <tr><td>PH(6.5 - 9.5)</td><td id="td_feed_ph"></td></tr>
                    <tr><td>Tds(&lt;100)</td><td id="td_feed_tds"></td></tr>
                    <tr><td>T.hardness(Trace)</td><td id="td_feed_thardness"></td></tr>
                    <tr><td>Silica/SiO2(&lt;5)</td><td id="td_feed_silica"></td></tr>
                    <tr><td>Cloride</td><td id="td_feed_cloride"></td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="glass-card" style="overflow-x: auto;">
        <h3>1.2 Analisa Air Boiler (Rata-rata)</h3>
        <div class="table-responsive">
            <table class="data-table" id="dash-table-water-boiler">
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
               
    let pL = fetch(`/api/processing/liquid/${mill}/${date}`);
    let pF = fetch(`/api/processing/ffa/${mill}/${date}`);
    let pW = fetch(`/api/water/${mill}/${date}`);
    let pB = fetch(`/api/water_boiler/${mill}/${date}`);
    
    let [resL, resF, resW, resB] = await Promise.all([pL, pF, pW, pB].map(p => p.catch(e => null)));
    
    let liquidData = resL && resL.ok ? await resL.json() : [];
    let ffaData = resF && resF.ok ? await resF.json() : [];
    let waterData = resW && resW.ok ? await resW.json() : {};
    let boilerData = resB && resB.ok ? await resB.json() : {};
    
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
    
    // Fill Water Tables
    const fieldsSebelum = [
        'raw_ph', 'raw_tds', 'raw_thardness', 'raw_silica', 'raw_turbidity', 'raw_cloride',
        'wtp_ph', 'wtp_tds', 'wtp_turbidity', 'wtp_cloride',
        'sand_ph', 'sand_tds', 'sand_turbidity', 'sand_cloride',
        'cation_ph', 'cation_tds', 'cation_thardness',
        'anion_ph', 'anion_tds', 'anion_silica',
        'feed_ph', 'feed_tds', 'feed_thardness', 'feed_silica', 'feed_cloride'
    ];
    fieldsSebelum.forEach(f => {
        let el = document.getElementById('td_' + f);
        if(el) el.innerText = waterData && waterData[f] !== null ? waterData[f] : '-';
    });
    
    // Boiler dynamic
    let dashBoilerTable = document.getElementById('dash-table-water-boiler');
    if (dashBoilerTable) {
        let thead = dashBoilerTable.querySelector('thead');
        let tbody = dashBoilerTable.querySelector('tbody');
        
        let hourlyData = boilerData && boilerData.hourly ? [...boilerData.hourly] : [];
        hourlyData.sort((a, b) => a.time_hour.localeCompare(b.time_hour));
        
        let headRow = `<tr><th style="width:30%;">PARAMETER</th>`;
        hourlyData.forEach(h => { headRow += `<th>${h.time_hour}</th>`; });
        headRow += `<th style="width:15%;">Rata-rata</th></tr>`;
        thead.innerHTML = headRow;
        
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
                let avgVal = boilerData && boilerData.average && boilerData.average[p.id] !== null && boilerData.average[p.id] !== undefined ? boilerData.average[p.id] : '-';
                if (hourlyData.length > 0) {
                    rowHtml += `<td colspan="${hourlyData.length}"></td>`;
                }
                rowHtml += `<td>${avgVal}</td>`;
            } else {
                hourlyData.forEach(h => {
                    let val = h[p.id] !== null && h[p.id] !== undefined ? h[p.id] : '-';
                    rowHtml += `<td>${val}</td>`;
                });
                let avgVal = boilerData && boilerData.average && boilerData.average[p.id] !== null && boilerData.average[p.id] !== undefined ? boilerData.average[p.id] : '-';
                rowHtml += `<td>${avgVal}</td>`;
            }
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
