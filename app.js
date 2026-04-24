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

// --- CORE DATA ---
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

// --- ADMIN LOGIN & UI SWITCH ---
function checkAdmin() {
    const pass = prompt("Enter Admin Password:");
    if (pass === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        loadAdminWorkspace();
    } else if (pass !== null) {
        alert("Incorrect Password.");
    }
}

function loadAdminWorkspace() {
    document.getElementById('admin-date-input').value = adminWork.date;
    document.getElementById('form-status-toggle').value = adminWork.status;
    renderAdminAgenda();
    renderLog();
}

// --- SESSION MANAGEMENT (RESTORED) ---
function addSession() {
    adminWork.agenda.push({
        id: Date.now(),
        time: "00:00",
        title: "New Presentation Title",
        speakers: ["Speaker Name"]
    });
    renderAdminAgenda();
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    adminWork.agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-session-box" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:8px; background:#fff;">
                <div style="display:flex; gap:10px; margin-bottom:5px;">
                    <input type="text" style="width:70px" value="${item.time}" onchange="adminWork.agenda[${index}].time=this.value">
                    <input type="text" style="flex:1" value="${item.title}" onchange="adminWork.agenda[${index}].title=this.value">
                    <button onclick="adminWork.agenda.splice(${index},1); renderAdminAgenda()" style="background:#d93025; color:white; border:none; border-radius:4px; cursor:pointer; padding:0 10px;">×</button>
                </div>
                <input type="text" placeholder="Speakers (comma separated)" value="${item.speakers.join(', ')}" 
                       onchange="adminWork.agenda[${index}].speakers=this.value.split(',').map(s=>s.trim())" style="width:100%">
            </div>`;
    });
}

function syncToLive() {
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    liveData = JSON.parse(JSON.stringify(adminWork));
    localStorage.setItem('ace_live_data', JSON.stringify(liveData));
    alert("Live Portal Synced!");
    applyLiveUI();
}

// --- USER FORM LOGIC ---
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
                <div class="session-header" style="background:#002f5c; color:white; padding:10px; display:flex; justify-content:space-between;">
                    <strong>${item.time} - ${item.title}</strong>
                    <label><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
                </div>
                <div class="session-body" id="body-${item.id}" style="padding:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span>Content Rating: *</span>
                        <select id="r1-${item.id}" required>
                            <option value="">Select...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span>Delivery Rating: *</span>
                        <select id="r2-${item.id}" required>
                            <option value="">Select...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Mandatory session comments..." required style="width:100%; height:60px;"></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) {
    const isNA = document.getElementById(`na-${id}`).checked;
    const body = document.getElementById(`body-${id}`);
    body.style.opacity = isNA ? "0.3" : "1";
    body.style.pointerEvents = isNA ? "none" : "auto";
    body.querySelectorAll('select, textarea').forEach(el => el.required = !isNA);
}

// --- SUBMISSION ---
async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();

    if(!name || !email || !general) return alert("Full Name, Email, and General Feedback are mandatory.");

    let attended = [];
    let msg = `GENERAL: ${general}\n\n`;
    let error = false;

    liveData.agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const cm = document.getElementById(`comm-${item.id}`).value.trim();
            if(!r1 || !r2 || !cm) { error = true; return; }
            attended.push(item.title);
            msg += `[${item.title}]\nContent: ${r1}\nDelivery: ${r2}\nComment: ${cm}\n\n`;
        }
    });

    if(error) return alert("Please fill ratings and comments for all attended sessions.");
    if(attended.length === 0) return alert("Select at least one session.");

    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    document.getElementById('user-view').innerHTML = `<h2 style="text-align:center">✓ Thank You</h2><p style="text-align:center">Downloading Certificate...</p>`;

    await generateCert(name, attended, false);
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// --- LOGS & ANALYSIS ---
function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const container = document.getElementById('attendance-log-list');
    container.innerHTML = logs.reverse().map((l, i) => `
        <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
            <span>${l.name}</span>
            <button onclick="regenerateFromLog(${logs.length - 1 - i})" style="cursor:pointer">PDF</button>
        </div>`).join('');
}

function regenerateFromLog(idx) {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const r = logs[idx];
    if(r) generateCert(r.name, r.sessions, false);
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).style.display='block';
    document.getElementById(`btn-tab-${t}`).classList.add('active');
}

// --- PDF ENGINE ---
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
