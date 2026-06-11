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
