/**
 * Critical Care ACE Day - Main Logic
 * Final Version: Fixed Analysis, Mandatory Fields, & Session Management
 */

const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

const RATING_COLORS = {
    Excellent: '#28a745',
    Good: '#41b6e6',
    Satisfactory: '#ffc107',
    Poor: '#d93025'
};

// --- DATA INITIALIZATION ---
let liveData = JSON.parse(localStorage.getItem('ace_live_data')) || {
    status: "open",
    date: "28 April 2026",
    agenda: [
        { id: 1, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
        { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] }
    ]
};

let adminWork = JSON.parse(JSON.stringify(liveData));

window.onload = () => { applyLiveUI(); };

// --- USER PORTAL UI ---
function applyLiveUI() {
    document.getElementById('date-display').innerText = liveData.date;
    const formArea = document.getElementById('form-active-area');
    const closedMsg = document.getElementById('form-closed-msg');
    
    if (liveData.status === "closed") {
        formArea.style.display = 'none';
        closedMsg.style.display = 'block';
    } else {
        formArea.style.display = 'block';
        closedMsg.style.display = 'none';
    }
    renderUserForm(); 
}

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = "";
    liveData.agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-row">
                        <span>Presentation Content: *</span>
                        <select id="r1-${item.id}" required>
                            <option value="">Select...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <div class="rating-row">
                        <span>Presentation Delivery: *</span>
                        <select id="r2-${item.id}" required>
                            <option value="">Select...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Mandatory comments for this session..." required></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) { 
    const isNA = document.getElementById(`na-${id}`).checked;
    const body = document.getElementById(`body-${id}`);
    body.classList.toggle('disabled', isNA);
    body.querySelectorAll('select, textarea').forEach(el => el.required = !isNA);
}

// --- SUBMISSION ENGINE ---
async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();

    if(!name || !email || !general) return alert("Name, Email, and Overall Feedback are mandatory.");
    
    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;
    let validationFailed = false;

    liveData.agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        if(!isNA) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const cm = document.getElementById(`comm-${item.id}`).value.trim();

            if(!r1 || !r2 || !cm) { validationFailed = true; return; }

            attended.push(item.title);
            msg += `SESS_START|${item.title}\nSCORE_C|${r1}\nSCORE_D|${r2}\nCOMMENT|${cm}\nSESS_END\n\n`;
        }
    });

    if(validationFailed) return alert("Please provide ratings and comments for all attended sessions.");
    if(attended.length === 0) return alert("Please provide feedback for at least one session or mark sessions as N/A.");

    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    document.getElementById('user-view').innerHTML = `<div class="thank-you-msg"><h2>✓ Success</h2><p>Certificate is downloading...</p></div>`;

    await generateCert(name, attended, false);
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// --- ADMIN CONTROLS ---
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
    adminWork.agenda.push({ id: Date.now(), time: "00:00", title: "New Session", speakers: ["Speaker"] }); 
    renderAdminAgenda(); 
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    adminWork.agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-session-box">
                <div class="admin-row">
                    <input type="text" style="width:70px" value="${item.time}" onchange="adminWork.agenda[${index}].time=this.value">
                    <input type="text" value="${item.title}" onchange="adminWork.agenda[${index}].title=this.value">
                    <button class="btn-del" onclick="adminWork.agenda.splice(${index},1); renderAdminAgenda()">×</button>
                </div>
                <input type="text" value="${item.speakers.join(', ')}" onchange="adminWork.agenda[${index}].speakers=this.value.split(',').map(s=>s.trim())">
            </div>`;
    });
}

function syncToLive() {
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    liveData = JSON.parse(JSON.stringify(adminWork));
    localStorage.setItem('ace_live_data', JSON.stringify(liveData));
    alert("Live portal synchronized!");
    applyLiveUI();
}

function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const container = document.getElementById('attendance-log-list');
    container.innerHTML = logs.reverse().map((l, i) => `
        <div class="log-entry">
            <span><strong>${l.name}</strong></span>
            <button class="btn-mini" onclick="regenerateFromLog(${logs.length - 1 - i})">PDF</button>
        </div>`).join('');
}

function regenerateFromLog(idx) {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const r = logs[idx];
    if(r) generateCert(r.name, r.sessions, false);
}

// --- ANALYSIS ENGINE ---
function handleFileUpload(e) {
    const r = new FileReader();
    r.onload = (f) => { document.getElementById('raw-data-input').value = f.target.result; processImportedData(); };
    r.readAsText(e.target.files[0]);
}

function processImportedData() {
    const raw = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = `<div class="analysis-legend"><strong>Key:</strong> 
        <span class="l-item"><i style="background:#28a745"></i> Excellent</span>
        <span class="l-item"><i style="background:#41b6e6"></i> Good</span>
        <span class="l-item"><i style="background:#ffc107"></i> Satisfactory</span>
        <span class="l-item"><i style="background:#d93025"></i> Poor</span></div>`;

    liveData.agenda.forEach((session, idx) => {
        const title = session.title.trim();
        let contentCounts = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let deliveryCounts = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let sessionComments = [];

        const blocks = raw.split('SESS_START|');
        blocks.forEach(block => {
            if (block.includes(title)) {
                const cM = block.match(/SCORE_C\|(Excellent|Good|Satisfactory|Poor)/i);
                if (cM) contentCounts[cap(cM[1])]++;
                const dM = block.match(/SCORE_D\|(Excellent|Good|Satisfactory|Poor)/i);
                if (dM) deliveryCounts[cap(dM[1])]++;
                const comM = block.match(/COMMENT\|(.*?)(?=\n|SESS_END)/);
                if (comM && comM[1].trim().length > 1) sessionComments.push(comM[1].trim());
            }
        });

        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `<h4>${session.title}</h4><div class="dual-chart-row">
            <div class="chart-item"><canvas id="c-${idx}" width="130" height="130"></canvas><div class="vote-count">${sum(contentCounts)} Votes</div><p>Content</p></div>
            <div class="chart-item"><canvas id="d-${idx}" width="130" height="130"></canvas><div class="vote-count">${sum(deliveryCounts)} Votes</div><p>Delivery</p></div>
            <div class="comments-preview"><b>Comments:</b><br>${sessionComments.map(c=>`• ${c}`).join('<br>') || 'None'}</div></div>`;
        container.appendChild(card);
        renderDoughnut(`c-${idx}`, contentCounts); renderDoughnut(`d-${idx}`, deliveryCounts);
    });
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

function renderDoughnut(id, vals) {
    const has = sum(vals) > 0;
    new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: { labels: Object.keys(vals), datasets: [{ data: has?Object.values(vals):[1], backgroundColor: has?Object.keys(vals).map(k=>RATING_COLORS[k]):['#eee'] }] },
        options: { responsive: false, plugins: { legend: { display: false } }, cutout: '70%' }
    });
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).style.display='block';
    document.getElementById(`btn-tab-${t}`).classList.add('active');
}

// --- PDF GENERATOR ---
async function generateCert(name, detail, isSpeaker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setGState(new doc.GState({opacity: 0.08}));
    doc.addImage(WATERMARK_URL, 'PNG', 0, 0, 842, 595); 
    doc.setGState(new doc.GState({opacity: 1.0}));
    doc.addImage(BEE_LOGO, 'PNG', 40, 40, 50, 50);
    doc.addImage
