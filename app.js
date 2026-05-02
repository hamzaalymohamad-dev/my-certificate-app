const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

const RATING_COLORS = { Excellent: '#28a745', Good: '#41b6e6', Satisfactory: '#ffc107', Poor: '#d93025' };

let liveData = JSON.parse(localStorage.getItem('ace_live_data')) || {
    status: "open",
    date: "28 April 2026",
    agenda: [
        { id: 1, time: "13:30", title: "Critical Care Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
        { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] },
        { id: 3, time: "14:35", title: "ICM recent Updates", speakers: ["Speaker Name"] },
        { id: 4, time: "15:05", title: "Justice in Critical Care - a question of allocation", speakers: ["Speaker Name"] },
        { id: 5, time: "15:45", title: "PICC Line Insertion Service", speakers: ["Speaker Name"] }
    ]
};

// FIX 1: adminWork is always a fresh deep copy of liveData at startup
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
            <div class="session-header">
                <strong>${item.time} - ${item.title}</strong>
                <label><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
            </div>
            <div class="session-body" id="body-${item.id}">
                <div class="rating-row"><span>Content Quality:</span><select id="r1-${item.id}" required><option value="">- Select -</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                <div class="rating-row"><span>Speaker Delivery:</span><select id="r2-${item.id}" required><option value="">- Select -</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                <textarea id="comm-${item.id}" placeholder="Please share your thoughts on this session..." required></textarea>
            </div>
        </div>`).join('');
}

// FIX 2: toggleS now correctly handles required on both select and textarea on both check and uncheck
function toggleS(id) {
    const isNA = document.getElementById(`na-${id}`).checked;
    const b = document.getElementById(`body-${id}`);
    b.classList.toggle('disabled', isNA);
    b.querySelectorAll('select, textarea').forEach(el => {
        if (isNA) {
            el.removeAttribute('required');
            el.dataset.wasRequired = "true";
        } else {
            el.setAttribute('required', 'required');
        }
    });
}

async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();
    if (!name || !email || !general) return alert("Please fill Name, Email, and Overall Feedback.");

    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;
    let err = false;

    liveData.agenda.forEach(item => {
        if (!document.getElementById(`na-${item.id}`).checked) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const cm = document.getElementById(`comm-${item.id}`).value.trim();
            if (!r1 || !r2 || !cm) { err = true; return; }
            attended.push(item.title);
            msg += `SESS_START|${item.title}\nSCORE_C|${r1}\nSCORE_D|${r2}\nCOMMENT|${cm}\nSESS_END\n\n`;
        }
    });

    if (err) return alert("Please complete all rating fields and comments for sessions you attended.");
    if (attended.length === 0) return alert("Please attend at least one session or uncheck N/A.");

    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    document.getElementById('user-view').innerHTML = "<h2 style='text-align:center; color:#005eb8;'>Submitted Successfully!</h2><p style='text-align:center;'>Your certificate is downloading...</p>";
    await generateCert(name, attended, false);

    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// --- ADMIN PANEL ---
function checkAdmin() {
    if (prompt("Enter Admin Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        // FIX 3: Re-sync adminWork from liveData each time admin panel is opened
        adminWork = JSON.parse(JSON.stringify(liveData));
        loadAdminWorkspace();
    }
}

function loadAdminWorkspace() {
    document.getElementById('admin-date-input').value = adminWork.date;
    document.getElementById('form-status-toggle').value = adminWork.status;
    renderAdminAgenda();
    renderLog();
    // FIX 4: Ensure first tab is shown correctly on load
    showTab('agenda');
}

function addSession() {
    // FIX 5: Capture current input values before pushing new session so edits aren't lost
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    adminWork.agenda.push({ id: Date.now(), time: "00:00", title: "New Session", speakers: ["Name"] });
    renderAdminAgenda();
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = adminWork.agenda.map((item, index) => {
        // FIX 6: Escape speaker names to prevent onclick attribute breakage with apostrophes/quotes
        const speakerButtons = item.speakers.map(s => {
            const safeName = s.trim().replace(/'/g, "\\'");
            const safeTitle = item.title.replace(/'/g, "\\'");
            return `<button onclick="generateCert('${safeName}', '${safeTitle}', true)" class="btn-mini">Cert: ${s.trim()}</button>`;
        }).join('');

        return `
        <div class="admin-item-box">
            <div style="display:flex; gap:10px; margin-bottom:5px;">
                <input type="text" style="width:70px" value="${item.time}" onchange="adminWork.agenda[${index}].time=this.value">
                <input type="text" style="flex:1" value="${item.title}" onchange="adminWork.agenda[${index}].title=this.value">
                <button class="btn-del" onclick="adminWork.agenda.splice(${index},1); renderAdminAgenda()">×</button>
            </div>
            <div style="display:flex; gap:10px; flex-direction: column;">
                <input type="text" value="${item.speakers.join(', ')}" placeholder="Speakers (comma separated)" onchange="adminWork.agenda[${index}].speakers=this.value.split(',').map(s=>s.trim())">
                <div style="display:flex; gap:5px; flex-wrap: wrap;">
                    ${speakerButtons}
                </div>
            </div>
        </div>`;
    }).join('');
}

function syncToLive() {
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    liveData = JSON.parse(JSON.stringify(adminWork));
    localStorage.setItem('ace_live_data', JSON.stringify(liveData));
    alert("Live Portal Updated for THIS browser! (To update for all, edit app.js file directly)");
    applyLiveUI();
}

// --- ATTENDANCE LOGS ---
// FIX 7: Don't use .reverse() which mutates the array — use a spread copy to reverse for display only
function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const reversed = [...logs].reverse();
    document.getElementById('attendance-log-list').innerHTML = reversed.map((l, displayIdx) => {
        // Map display index back to real index in the original logs array
        const realIdx = logs.length - 1 - displayIdx;
        return `
        <div class="log-entry">
            <div><strong>${l.name}</strong><br><small>${l.email || ''} &mdash; ${l.date}</small></div>
            <div style="display:flex; gap:5px;">
                <button class="btn-mini" onclick="regenerateFromLog(${realIdx})">PDF</button>
                <button class="btn-del" style="padding:2px 8px;" onclick="deleteSingleLog(${realIdx})">×</button>
            </div>
        </div>`;
    }).join('');
}

function deleteSingleLog(idx) {
    if (!confirm("Delete this entry?")) return;
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.splice(idx, 1);
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));
    renderLog();
}

function clearAllLogs() {
    if (!confirm("Wipe all logs?")) return;
    localStorage.removeItem('ace_attendance_log');
    renderLog();
}

function regenerateFromLog(idx) {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    // FIX 8: Guard against invalid index
    if (!logs[idx]) return alert("Log entry not found.");
    generateCert(logs[idx].name, logs[idx].sessions, false);
}

// --- ANALYSIS LOGIC ---
function handleFileUpload(e) {
    const reader = new FileReader();
    reader.onload = (f) => {
        document.getElementById('raw-data-input').value = f.target.result;
        processImportedData();
    };
    reader.readAsText(e.target.files[0]);
}

function processImportedData() {
    const raw = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = "";

    // FIX 9: Use liveData.agenda (which reflects synced state) for analysis
    liveData.agenda.forEach((session, idx) => {
        let cC = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let dC = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
        let comms = [];
        raw.split('SESS_START|').forEach(block => {
            if (block.includes(session.title.trim())) {
                const cM = block.match(/SCORE_C\|(Excellent|Good|Satisfactory|Poor)/i);
                if (cM) cC[cap(cM[1])]++;
                const dM = block.match(/SCORE_D\|(Excellent|Good|Satisfactory|Poor)/i);
                if (dM) dC[cap(dM[1])]++;
                const comM = block.match(/COMMENT\|(.*?)(?=\n|SESS_END)/);
                if (comM) comms.push(comM[1].trim());
            }
        });
        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `<h4>${session.title}</h4><div class="analysis-row">
            <div class="chart-box"><canvas id="c-${idx}"></canvas></div>
            <div class="chart-box"><canvas id="d-${idx}"></canvas></div>
            <div class="com-box"><b>Comments:</b><br>${comms.length ? '• ' + comms.join('<br>• ') : 'None'}</div>
        </div>`;
        container.appendChild(card);
        renderD(idx, 'c', cC);
        renderD(idx, 'd', dC);
    });
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function renderD(idx, type, v) {
    const has = Object.values(v).reduce((a, b) => a + b, 0) > 0;
    new Chart(document.getElementById(`${type}-${idx}`), {
        type: 'doughnut',
        data: {
            labels: Object.keys(v),
            datasets: [{
                data: has ? Object.values(v) : [1],
                backgroundColor: has ? Object.keys(v).map(k => RATING_COLORS[k]) : ['#eee']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            cutout: '70%'
        }
    });
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).style.display = 'block';
    document.getElementById(`btn-tab-${t}`).classList.add('active');
}

// --- CERTIFICATE GENERATION ---
// FIX 10: detail can be a string (speaker) or array (attendee) — handle both safely
async function generateCert(name, detail, isSpeaker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    doc.addImage(WATERMARK_URL, 'PNG', 0, 0, 842, 595);
    doc.setGState(new doc.GState({ opacity: 1.0 }));
    doc.addImage(BEE_LOGO, 'PNG', 40, 40, 50, 50);
    doc.addImage(MFT_LOGO, 'PNG', 680, 40, 120, 45);
    doc.setDrawColor(0, 94, 184).setLineWidth(5).rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(0, 51, 102).text("Critical Care ACE Day", 421, 100, { align: "center" });
    doc.setFontSize(22).setTextColor(0).text(isSpeaker ? "SPEAKER CERTIFICATE" : "CERTIFICATE OF ATTENDANCE", 421, 180, { align: "center" });
    doc.setFontSize(40).setTextColor(0, 94, 184).text(name, 421, 280, { align: "center" });
    doc.setFontSize(16).setTextColor(0).setFont("helvetica", "normal");

    if (isSpeaker) {
        // detail is a session title string for speaker certs
        doc.text(`For delivering: "${detail}"`, 421, 330, { align: "center" });
    } else {
        // detail is an array of session titles for attendee certs
        doc.text("For attending sessions on:", 421, 330, { align: "center" });
    }

    doc.setFont("helvetica", "bold").text(liveData.date, 421, 360, { align: "center" });

    if (!isSpeaker && Array.isArray(detail)) {
        doc.setFontSize(10);
        let y = 390;
        detail.forEach(s => {
            doc.text(`• ${s}`, 421, y, { align: "center" });
            y += 18;
        });
    }

    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, { align: "center" });
    doc.save(`${name.replace(/\s+/g, '_')}_Cert.pdf`);
}
