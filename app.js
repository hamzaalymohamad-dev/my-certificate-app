const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

const RATING_COLORS = { Excellent: '#2ecc71', Good: '#3498db', Satisfactory: '#f1c40f', Poor: '#e74c3c' };

let liveData = JSON.parse(localStorage.getItem('ace_live_data')) || {
    status: "open",
    date: "28 April 2026",
    agenda: [
        { id: 1, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
        { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] }
    ]
};

let adminWork = JSON.parse(JSON.stringify(liveData));
window.onload = () => applyLiveUI();

function applyLiveUI() {
    document.getElementById('date-display').innerText = liveData.date;
    document.getElementById('form-active-area').style.display = liveData.status === "open" ? 'block' : 'none';
    document.getElementById('form-closed-msg').style.display = liveData.status === "closed" ? 'block' : 'none';
    renderUserForm();
}

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = liveData.agenda.map(item => `
        <div class="session-card">
            <div class="session-head">
                <div class="session-info">
                    <span class="time-tag">${item.time}</span>
                    <span class="title-tag">${item.title}</span>
                </div>
                <label class="na-check"><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
            </div>
            <div class="session-body" id="body-${item.id}">
                <div class="rating-grid">
                    <div class="rating-box"><span>Content Quality:</span><select id="r1-${item.id}" required><option value="">- Select -</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                    <div class="rating-box"><span>Speaker Delivery:</span><select id="r2-${item.id}" required><option value="">- Select -</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                </div>
                <textarea id="comm-${item.id}" placeholder="Please share any specific thoughts on this session..." required></textarea>
            </div>
        </div>`).join('');
}

function toggleS(id) {
    const isNA = document.getElementById(`na-${id}`).checked;
    const b = document.getElementById(`body-${id}`);
    b.classList.toggle('disabled', isNA);
    b.querySelectorAll('select, textarea').forEach(el => el.required = !isNA);
}

async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();
    if(!name || !email || !general) return alert("Please complete Name, Email, and Overall Feedback.");

    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;
    let err = false;

    liveData.agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const cm = document.getElementById(`comm-${item.id}`).value.trim();
            if(!r1 || !r2 || !cm) { err = true; return; }
            attended.push(item.title);
            msg += `SESS_START|${item.title}\nSCORE_C|${r1}\nSCORE_D|${r2}\nCOMMENT|${cm}\nSESS_END\n\n`;
        }
    });

    if(err || attended.length === 0) return alert("Please complete feedback for at least one attended session.");

    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    document.getElementById('user-view').innerHTML = `<div class="status-msg success"><h3>Submission Successful</h3><p>Your certificate is being generated. Thank you for your participation.</p></div>`;
    await generateCert(name, attended, false);
    fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg }) });
}

// --- ADMIN ---
function checkAdmin() {
    if (prompt("Admin Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        loadAdminWorkspace();
    }
}

function loadAdminWorkspace() {
    document.getElementById('admin-date-input').value = adminWork.date;
    document.getElementById('form-status-toggle').value = adminWork.status;
    renderAdminAgenda();
    renderLog();
}

function addSession() {
    adminWork.agenda.push({ id: Date.now(), time: "00:00", title: "New Audit Presentation", speakers: ["Speaker"] });
    renderAdminAgenda();
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = adminWork.agenda.map((item, index) => `
        <div class="admin-item">
            <div class="admin-item-row">
                <input type="text" class="time-input" value="${item.time}" onchange="adminWork.agenda[${index}].time=this.value">
                <input type="text" class="title-input" value="${item.title}" onchange="adminWork.agenda[${index}].title=this.value">
                <button class="btn-del" onclick="adminWork.agenda.splice(${index},1); renderAdminAgenda()">×</button>
            </div>
            <div class="admin-item-row sub">
                <input type="text" value="${item.speakers.join(', ')}" placeholder="Speakers" onchange="adminWork.agenda[${index}].speakers=this.value.split(',').map(s=>s.trim())">
                <button onclick="generateCert('${item.speakers[0]}', '${item.title}', true)" class="btn-action">Speaker PDF</button>
            </div>
        </div>`).join('');
}

function syncToLive() {
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    liveData = JSON.parse(JSON.stringify(adminWork));
    localStorage.setItem('ace_live_data', JSON.stringify(liveData));
    alert("Live Portal Updated Successfully.");
    applyLiveUI();
}

// --- LOGS ---
function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    document.getElementById('attendance-log-list').innerHTML = logs.reverse().map((l, i) => `
        <div class="log-row">
            <div class="log-info">
                <strong>${l.name}</strong>
                <small>${l.date}</small>
            </div>
            <div class="log-btns">
                <button onclick="regenerateFromLog(${logs.length - 1 - i})" class="btn-action">PDF</button>
                <button onclick="deleteSingleLog(${logs.length - 1 - i})" class="btn-del-mini">×</button>
            </div>
        </div>`).join('') || '<p style="text-align:center; padding:20px; color:#999;">No logs found.</p>';
}

function deleteSingleLog(idx) {
    if(!confirm("Delete this attendance record?")) return;
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.splice(idx, 1);
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));
    renderLog();
}

function clearAllLogs() {
    if(!confirm("DANGER: This will delete ALL attendance history. Continue?")) return;
    localStorage.removeItem('ace_attendance_log');
    renderLog();
}

function regenerateFromLog(idx) {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    generateCert(logs[idx].name, logs[idx].sessions, false);
}

// --- ANALYSIS ---
function handleFileUpload(e) {
    const reader = new FileReader();
    reader.onload = (f) => { document.getElementById('raw-data-input').value = f.target.result; processImportedData(); };
    reader.readAsText(e.target.files[0]);
}

function processImportedData() {
    const raw = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = "";
    liveData.agenda.forEach((session, idx) => {
        let cC = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let dC = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let comms = [];
        raw.split('SESS_START|').forEach(block => {
            if (block.includes(session.title.trim())) {
                const cM = block.match(/SCORE_C\|(Excellent|Good|Satisfactory|Poor)/i); if (cM) cC[cap(cM[1])]++;
                const dM = block.match(/SCORE_D\|(Excellent|Good|Satisfactory|Poor)/i); if (dM) dC[cap(dM[1])]++;
                const comM = block.match(/COMMENT\|(.*?)(?=\n|SESS_END)/); if (comM) comms.push(comM[1].trim());
            }
        });
        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `<h4>${session.title}</h4><div class="chart-row">
            <canvas id="c-${idx}" width="120" height="120"></canvas>
            <canvas id="d-${idx}" width="120" height="120"></canvas>
        </div><div class="comm-list">${comms.map(c=>`• ${c}`).join('<br>') || 'No comments'}</div>`;
        container.appendChild(card);
        renderD(idx, 'c', cC); renderD(idx, 'd', dC);
    });
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);

function renderD(idx, type, v) {
    new Chart(document.getElementById(`${type}-${idx}`), {
        type: 'doughnut',
        data: { labels: Object.keys(v), datasets: [{ data: sum(v) > 0 ? Object.values(v) : [1], backgroundColor: sum(v) > 0 ? Object.keys(v).map(k=>RATING_COLORS[k]) : ['#eee'] }] },
        options: { plugins: { legend: { display: false } }, cutout: '75%' }
    });
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).style.display='block';
    document.getElementById(`btn-tab-${t}`).classList.add('active');
}

async function generateCert(name, detail, isSpeaker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setGState(new doc.GState({opacity: 0.08}));
    doc.addImage(WATERMARK_URL, 'PNG', 0, 0, 842, 595); 
    doc.setGState(new doc.GState({opacity: 1.0}));
    doc.addImage(BEE_LOGO, 'PNG', 40, 40, 50, 50);
    doc.addImage(MFT_LOGO, 'PNG', 680, 40, 120, 45);
    doc.setDrawColor(0, 94, 184).setLineWidth(5).rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(0, 51, 102).text("Critical Care ACE Day", 421, 100, {align:"center"});
    doc.setFontSize(22).setTextColor(0).text(isSpeaker ? "SPEAKER CERTIFICATE" : "CERTIFICATE OF ATTENDANCE", 421, 180, {align:"center"});
    doc.setFontSize(40).setTextColor(0, 94, 184).text(name, 421, 280, {align:"center"});
    doc.setFontSize(16).setTextColor(0).setFont("helvetica", "normal").text(isSpeaker ? `For delivering: "${detail}"` : "For attending sessions on:", 421, 330, {align:"center"});
    doc.setFont("helvetica", "bold").text(liveData.date, 421, 360, {align:"center"});
    if(!isSpeaker && Array.isArray(detail)) {
        doc.setFontSize(10); let y = 390;
        detail.forEach(s => { doc.text(`• ${s}`, 421, y, {align:"center"}); y+=18; });
    }
    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, {align:"center"});
    doc.save(`${name}_Cert.pdf`);
}
