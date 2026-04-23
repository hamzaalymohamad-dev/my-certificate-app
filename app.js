const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

// Core System Data
let liveData = JSON.parse(localStorage.getItem('ace_live_data')) || {
    status: "open",
    date: "28 April 2026",
    agenda: [
        { id: 1, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
        { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] }
    ]
};

// Admin Workspace (Changes here only move to liveData on "Sync")
let adminWork = JSON.parse(JSON.stringify(liveData));

window.onload = () => { 
    applyLiveUI();
};

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
                    <div class="rating-row"><span>Presentation content:</span><select id="r1-${item.id}"><option value="">Select...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                    <div class="rating-row"><span>Presentation delivery:</span><select id="r2-${item.id}"><option value="">Select...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select></div>
                    <textarea id="comm-${item.id}" placeholder="Comments for this session..."></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) { 
    document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked); 
}

// --- SUBMISSION LOGIC ---
async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const general = document.getElementById('generalFeedback').value;

    if(!name || !email) return alert("Please enter your name and email.");
    if(!email.includes("@")) return alert("Please enter a valid email.");

    let usedEmails = JSON.parse(localStorage.getItem('ace_submitted_emails') || "[]");
    if(usedEmails.includes(email.toLowerCase())) {
        return alert("You have already submitted feedback. To redo, please use a different email or contact admin.");
    }

    let attended = [];
    let msg = `OVERALL FEEDBACK: ${general}\n\n`;
    liveData.agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            const cVal = document.getElementById(`r1-${item.id}`).value;
            const dVal = document.getElementById(`r2-${item.id}`).value;
            const comm = document.getElementById(`comm-${item.id}`).value;
            attended.push(item.title);
            msg += `[${item.title}] Presentation Content: ${cVal}, Presentation Delivery: ${dVal}. Comment: ${comm}\n\n`;
        }
    });

    // Logging for Admin
    usedEmails.push(email.toLowerCase());
    localStorage.setItem('ace_submitted_emails', JSON.stringify(usedEmails));
    
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    // UI Change
    document.getElementById('user-view').innerHTML = `
        <div class="thank-you-msg">
            <h2>✓ Submission Successful</h2>
            <p>Thank you, ${name}. Your certificate is now downloading.</p>
            <p><small>You must click the link again if you need to access the form in the future.</small></p>
        </div>`;

    await generateCert(name, attended, false);

    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// --- ADMIN DASHBOARD ---
function checkAdmin() {
    const pass = prompt("Enter Admin Password:");
    if (pass === ADMIN_PASS) {
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

function syncToLive() {
    adminWork.date = document.getElementById('admin-date-input').value;
    adminWork.status = document.getElementById('form-status-toggle').value;
    liveData = JSON.parse(JSON.stringify(adminWork));
    localStorage.setItem('ace_live_data', JSON.stringify(liveData));
    alert("Changes saved and pushed live!");
    applyLiveUI();
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
                <input type="text" value="${item.speakers.join(', ')}" placeholder="Speakers (comma separated)" onchange="adminWork.agenda[${index}].speakers=this.value.split(',').map(s=>s.trim())">
                <div class="btn-row">
                    ${item.speakers.map(s => `<button class="btn-mini" onclick="generateCert('${s.trim()}', '${item.title}', true)">Speaker Cert: ${s}</button>`).join('')}
                </div>
            </div>`;
    });
}

function addSession() { 
    adminWork.agenda.push({id: Date.now(), time:"00:00", title:"New Presentation", speakers:[]}); 
    renderAdminAgenda(); 
}

function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const container = document.getElementById('attendance-log-list');
    container.innerHTML = logs.reverse().map((l, idx) => `
        <div class="log-entry">
            <div><strong>${l.name}</strong><br><small>${l.email}</small></div>
            <button class="btn-mini" onclick="regenerateFromLog(${logs.length - 1 - idx})">Regenerate PDF</button>
        </div>
    `).join('');
}

function regenerateFromLog(index) {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const rec = logs[index];
    if(rec) generateCert(rec.name, rec.sessions, false);
}

function clearLog() { 
    if(confirm("Clear all attendance data?")) { 
        localStorage.removeItem('ace_attendance_log'); 
        localStorage.removeItem('ace_submitted_emails');
        renderLog(); 
    }
}

// --- CSV ANALYSIS ---
function handleFileUpload(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('raw-data-input').value = e.target.result;
        processImportedData();
    };
    reader.readAsText(event.target.files[0]);
}

function processImportedData() {
    const raw = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = "";

    liveData.agenda.forEach((session, idx) => {
        const getCounts = (label) => {
            const regex = new RegExp(`\\[${session.title.trim()}\\]\\s*${label}:\\s*(Excellent|Good|Satisfactory|Poor)`, "gi");
            const matches = raw.match(regex) || [];
            let c = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
            matches.forEach(m => {
                if (/Excellent/i.test(m)) c.Excellent++;
                else if (/Good/i.test(m)) c.Good++;
                else if (/Satisfactory/i.test(m)) c.Satisfactory++;
                else if (/Poor/i.test(m)) c.Poor++;
            });
            return c;
        };

        const contentC = getCounts("Presentation Content");
        const deliveryC = getCounts("Presentation Delivery");

        // Comments extraction
        let comms = [];
        const cRegex = new RegExp(`\\[${session.title.trim()}\\][\\s\\S]*?Comment:\\s*(.*?)(?=\\n|\\r|$)`, "gi");
        let m; while((m = cRegex.exec(raw)) !== null) if(m[1].trim().length > 1) comms.push(m[1].trim());

        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `
            <h4>${session.title}</h4>
            <div class="dual-chart-row">
                <div class="chart-item"><canvas id="c-chart-${idx}" width="140" height="140"></canvas><p>Content</p></div>
                <div class="chart-item"><canvas id="d-chart-${idx}" width="140" height="140"></canvas><p>Delivery</p></div>
                <div class="comments-preview"><b>Comments:</b><br>${comms.map(c=>`• ${c}`).join('<br>') || 'None'}</div>
            </div>`;
        container.appendChild(card);

        const build = (id, vals) => {
            const hasData = Object.values(vals).some(v=>v>0);
            new Chart(document.getElementById(id), {
                type: 'doughnut',
                data: { labels: Object.keys(vals), datasets: [{ data: hasData?Object.values(vals):[1,0,0,0], backgroundColor: hasData?['#005eb8','#41b6e6','#002f5c','#d93025']:['#eee','#eee','#eee','#eee'] }] },
                options: { responsive: false, plugins: { legend: { display: false } } }
            });
        };
        build(`c-chart-${idx}`, contentC);
        build(`d-chart-${idx}`, deliveryC);
    });
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).style.display='block';
    document.getElementById(`btn-tab-${t}`).classList.add('active');
}

// --- PDF CERTIFICATE ENGINE ---
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
    
    doc.setFontSize(16).setTextColor(0).setFont("helvetica", "normal");
    const desc = isSpeaker ? `For delivering the presentation: "${detail}"` : "For attending the sessions held on:";
    doc.text(desc, 421, 330, {align:"center"});
    doc.setFont("helvetica", "bold").text(liveData.date, 421, 360, {align:"center"});

    if(!isSpeaker && Array.isArray(detail)) {
        doc.setFontSize(10); let y = 390;
        detail.forEach(s => { doc.text(`• ${s}`, 421, y, {align:"center"}); y+=18; });
    }
    
    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, {align:"center"});
    doc.save(`${name.replace(/\s+/g, '_')}_Certificate.pdf`);
}
