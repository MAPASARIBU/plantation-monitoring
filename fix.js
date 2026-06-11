const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Vehicle template
code = code.replace(
    '<div id="vehicle-module-layout" class="animate-fade-in module-layout">',
    '<div id="vehicle-module-layout" class="animate-fade-in" style="padding-top: 10px;">'
);
code = code.replace(
    '<div id="vehicle-form-container" class="glass-card form-container">',
    '<div id="modal-vehicle-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Input Pergerakan</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-vehicle-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n            </div>\n            <div class="glass-card table-wrapper">',
    '</form>\n            </div></div>\n            <div class="glass-card table-wrapper" style="width: 100%;">'
);
code = code.replace(
    '<h2>Tabel Monitoring Truk</h2>\n                    <button type="button" class="btn"',
    '<h2>Tabel Monitoring Truk</h2>\n                    <div style="display:flex; gap: 10px;"><button type="button" class="btn btn-primary" id="btn-input-vehicle" onclick="document.getElementById(\'modal-vehicle-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Pergerakan</button>\n                    <button type="button" class="btn"'
);
code = code.replace(
    '<button type="button" class="btn" style="background-color: white; color: var(--text-primary); border: 2px solid var(--danger); font-weight: bold; padding: 6px 15px;" onclick="promptHistoricalVehicle()">Historical</button>',
    '<button type="button" class="btn" style="background-color: white; color: var(--text-primary); border: 2px solid var(--danger); font-weight: bold; padding: 6px 15px;" onclick="promptHistoricalVehicle()">Historical</button></div>'
);
code = code.replace(
    `const layout = document.getElementById('vehicle-module-layout');
    const formContainer = document.getElementById('vehicle-form-container');
    if (formContainer && layout) {
        if (currentUser.role.includes('Security') || currentUser.role === 'Security Mill' || currentUser.role === 'Manager' || currentUser.role === 'Manager Mill') {
            formContainer.style.display = 'none';
            layout.style.gridTemplateColumns = '1fr';
        } else {
            formContainer.style.display = 'block';
            layout.style.gridTemplateColumns = '240px 1fr';
        }
    }`,
    `const btnInput = document.getElementById('btn-input-vehicle');
    if (btnInput) {
        if (currentUser.role.includes('Security') || currentUser.role === 'Security Mill' || currentUser.role === 'Manager' || currentUser.role === 'Manager Mill') {
            btnInput.style.display = 'none';
        } else {
            btnInput.style.display = 'block';
        }
    }`
);

// 2. Upkeep template
code = code.replace(
    '<div class="animate-fade-in module-layout">\n            <div class="glass-card form-container">\n                <h2>Input Upkeep</h2>',
    '<div class="animate-fade-in" style="padding-top: 10px;">\n            <div id="modal-upkeep-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Input Upkeep</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-upkeep-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n            </div>\n            <div class="glass-card table-wrapper">\n                <div class="view-header">\n                    <h2>Progress Upkeep Harian</h2>\n                </div>',
    '</form>\n            </div></div>\n            <div class="glass-card table-wrapper" style="width: 100%;">\n                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">\n                    <h2>Progress Upkeep Harian</h2>\n                    <button type="button" class="btn btn-primary" id="btn-input-upkeep" onclick="document.getElementById(\'modal-upkeep-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Upkeep</button>\n                </div>'
);
code = code.replace(
    `if (selesai.length > 0) {
        tbody.innerHTML += \`<tr><td colspan="8" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>\`;
        selesai.forEach(u => tbody.innerHTML += renderRow(u));
    }`,
    `if (selesai.length > 0) {
        tbody.innerHTML += \`<tr><td colspan="8" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>\`;
        selesai.forEach(u => tbody.innerHTML += renderRow(u));
    }
    const btnInput = document.getElementById('btn-input-upkeep');
    if (btnInput) {
        if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            btnInput.style.display = 'block';
        } else {
            btnInput.style.display = 'none';
        }
    }`
);

// 3. Pemupukan template
code = code.replace(
    '<div class="animate-fade-in module-layout">\n            <div class="glass-card form-container">\n                <h2>Buat Rencana Pemupukan</h2>',
    '<div class="animate-fade-in" style="padding-top: 10px;">\n            <div id="modal-pemupukan-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Buat Rencana Pemupukan</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-pemupukan-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n            </div>\n            <div class="glass-card table-wrapper">\n                <div class="view-header">\n                    <h2>Monitoring Pemupukan Blok</h2>\n                </div>',
    '</form>\n            </div></div>\n            <div class="glass-card table-wrapper" style="width: 100%;">\n                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">\n                    <h2>Monitoring Pemupukan Blok</h2>\n                    <button type="button" class="btn btn-primary" id="btn-input-pemupukan" onclick="document.getElementById(\'modal-pemupukan-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Input Pemupukan</button>\n                </div>'
);
code = code.replace(
    `if (selesai.length > 0) {
        tbody.innerHTML += \`<tr><td colspan="7" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>\`;
        selesai.forEach(p => tbody.innerHTML += renderRow(p));
    }`,
    `if (selesai.length > 0) {
        tbody.innerHTML += \`<tr><td colspan="7" style="background-color: #f1f5f9; color: var(--text-primary); font-weight: bold; text-align: left; padding: 12px 15px; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;"><i class="fa-solid fa-check-circle" style="color: var(--primary-color);"></i> List pekerjaan sudah Selesai</td></tr>\`;
        selesai.forEach(p => tbody.innerHTML += renderRow(p));
    }
    const btnInput = document.getElementById('btn-input-pemupukan');
    if (btnInput) {
        if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            btnInput.style.display = 'block';
        } else {
            btnInput.style.display = 'none';
        }
    }`
);

// 4. Harvesting template
code = code.replace(
    '<div class="animate-fade-in module-layout">\n            <div class="glass-card form-container" id="harvesting-form-container">\n                <div id="container-monthly-plan">\n                    <h2>Rencana Panen Bulanan</h2>',
    '<div class="animate-fade-in" style="padding-top: 10px;">\n            <div id="modal-harvesting-monthly-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Rencana Panen Bulanan</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-harvesting-monthly-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n                </div>\n\n                <div id="container-daily-plan">\n                    <h2>Rencana Panen Harian</h2>',
    '</form>\n                </div></div>\n\n                <div id="modal-harvesting-daily-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Rencana Panen Harian</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-harvesting-daily-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n            </div>\n        </div>\n        \n        <div class="glass-card table-wrapper">',
    '</form>\n            </div></div>\n        \n        <div class="glass-card table-wrapper" style="width: 100%;">'
);
code = code.replace(
    '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">\n                        <h2>Monitoring Panen Harian</h2>\n                        <button type="button" class="btn btn-primary btn-sm" onclick="openMonthlyRealization()"><i class="fa-solid fa-chart-pie"></i> Monitoring Realisasi Bulanan</button>\n                    </div>',
    '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">\n                        <h2>Monitoring Panen Harian</h2>\n                        <div style="display:flex; gap: 10px;">\n                            <button type="button" class="btn btn-primary btn-sm" id="btn-input-hm" onclick="document.getElementById(\'modal-harvesting-monthly-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Rencana Bulanan</button>\n                            <button type="button" class="btn btn-primary btn-sm" id="btn-input-hd" onclick="document.getElementById(\'modal-harvesting-daily-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Rencana Harian</button>\n                            <button type="button" class="btn btn-primary btn-sm" onclick="openMonthlyRealization()"><i class="fa-solid fa-chart-pie"></i> Realisasi Bulanan</button>\n                        </div>\n                    </div>'
);
code = code.replace(
    `const layout = document.getElementById('harvesting-form-container');
    if (layout) {
        if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            layout.style.display = 'block';
        } else {
            layout.style.display = 'none';
        }
    }`,
    `const btnHm = document.getElementById('btn-input-hm');
    const btnHd = document.getElementById('btn-input-hd');
    if (btnHm && btnHd) {
        if (currentUser && currentUser.role && (currentUser.role.includes('Krani') || currentUser.role === 'Admin')) {
            btnHm.style.display = 'block';
            btnHd.style.display = 'block';
        } else {
            btnHm.style.display = 'none';
            btnHd.style.display = 'none';
        }
    }`
);

// 5. Users module template
code = code.replace(
    '<div class="animate-fade-in module-layout">\n            <div class="glass-card form-container" id="user-form-container">\n                <h2>Tambah User Baru</h2>',
    '<div class="animate-fade-in" style="padding-top: 10px;">\n            <div id="modal-user-input" class="modal-overlay" style="display:none;"><div class="modal-content animate-fade-in"><div class="modal-header"><h3>Tambah User Baru</h3><button type="button" class="modal-close" onclick="document.getElementById(\'modal-user-input\').style.display=\'none\';">&times;</button></div>'
);
code = code.replace(
    '</form>\n            </div>\n            <div class="glass-card table-wrapper">',
    '</form>\n            </div></div>\n            <div class="glass-card table-wrapper" style="width: 100%;">'
);
code = code.replace(
    '<div class="view-header">\n                    <h2>Manajemen Users</h2>\n                </div>',
    '<div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">\n                    <h2>Manajemen Users</h2>\n                    <button type="button" class="btn btn-primary" id="btn-input-user" onclick="document.getElementById(\'modal-user-input\').style.display=\'flex\';" style="display:none;"><i class="fa-solid fa-plus"></i> Tambah User</button>\n                </div>'
);
code = code.replace(
    `const formContainer = document.getElementById('user-form-container');
    if (formContainer) {
        if (currentUser && currentUser.role === 'Admin') {
            formContainer.style.display = 'block';
        } else {
            formContainer.style.display = 'none';
        }
    }`,
    `const btnInputUser = document.getElementById('btn-input-user');
    if (btnInputUser) {
        if (currentUser && currentUser.role === 'Admin') {
            btnInputUser.style.display = 'block';
        } else {
            btnInputUser.style.display = 'none';
        }
    }`
);

fs.writeFileSync('app.js', code);
console.log('Done refactoring UI templates!');
