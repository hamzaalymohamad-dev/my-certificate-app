const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";

// Load Agenda from Local Storage or Defaults
let agenda = JSON.parse(localStorage.getItem('ace_agenda')) || [
    { id: 101, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
    { id: 102, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] },
    { id: 103, time: "14:35", title: "Critical Care Updates", speakers: ["Evangelos Boultoukas"] },
    { id: 104, time: "15:05", title: "Critical Care Ethics", speakers: ["Bernard Foex"] },
    { id: 105, time: "15:45", title: "PICC Line Service at ORC", speakers: ["Ruth Wynn"] }
];

window.onload = () => { renderUserForm(); };

// --- USER FORM RENDERING ---
function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = "";
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label class="na-check">
                        <input type="checkbox" onchange="toggleSession('${item.id}')" id="na-${item.id}"> N/A
                    </label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-grid">
                        <select id="r1-${item.id}">
                            <option value="">Content...</option>
                            <option value="3">Excellent</option><option value="2">Good</option><option value="1">Satisfactory</option>
                        </select>
                        <select id="r2-${item.id}">
                            <option value="">Delivery...</option>
                            <option value="3">Excellent</option><option value="2">Good</option><option value="1">Satisfactory</option>
                        </select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="What was your key learning point?"></textarea>
                </div>
            </div>`;
    });
}

function toggleSession(id) {
    document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked);
}

// --- ADMIN DASHBOARD LOGIC ---
function checkAdmin() {
    if (prompt("Enter Clinical Audit Lead Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    }
}

function showTab(tab) {
    document.getElementById('tab-manage').style.display = tab === 'manage' ? 'block' : 'none';
    document.getElementById('tab-analysis').style.display = tab === 'analysis' ? 'block' : 'none';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-btn-${tab}`).classList.add('active');
    if(tab === 'analysis') renderAnalysis();
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    agenda.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'admin-session-box';
        row.innerHTML = `
            <div class="admin-row">
                <input type="text" class="inp-time" value="${item.time}" onchange="updateAgenda(${index}, 'time', this.value)">
                <input type="text" class="inp-title" value="${item.title}" onchange="updateAgenda(${index}, 'title', this.value)">
                <button class="btn-del" onclick="removeSession(${index})">Delete</button>
            </div>
            <div class="speaker-config">
                <label>Speakers (Comma Separated):</label>
                <input type="text" value="${item.speakers.join(', ')}" onchange="updateSpeakers(${index}, this.value)">
                <div class="speaker-certs-row" id="speaker-btns-${index}"></div>
            </div>`;
        list.appendChild(row);
        renderSpeakerCertBtns(index);
    });
}

function renderSpeakerCertBtns(idx) {
    const container = document.getElementById(`speaker-btns-${idx}`);
    container.innerHTML = "Generate Certs: ";
    agenda[idx].speakers.forEach(speaker => {
        if(speaker.trim() === "") return;
        const btn = document.createElement('button');
        btn.innerText = speaker.trim();
        btn.onclick = () => generateSpeakerCert(speaker.trim(), agenda[idx].title);
        container.appendChild(btn);
    });
}

function updateAgenda(idx, key, val) { agenda[idx][key] = val; save(); }
function updateSpeakers(idx, val) { agenda[idx].speakers = val.split(','); save(); renderAdminAgenda(); }
function addSession() { agenda.push({ id: Date.now(), time: "13:00", title: "New Session", speakers: ["Speaker"] }); save(); renderAdminAgenda(); }
function removeSession(idx) { if(confirm("Delete this session?")) { agenda.splice(idx, 1); save(); renderAdminAgenda(); } }
function save() { localStorage.setItem('ace_agenda', JSON.stringify(agenda)); }

// --- CERTIFICATE GENERATION ---
function generateSpeakerCert(speaker, session) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    // Design
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(10); doc.rect(20, 20, 802, 555);
    doc.setDrawColor(0, 51, 102); doc.setLineWidth(1); doc.rect(30, 30, 782, 535);
    doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.setTextColor(0, 51, 102);
    doc.text("GUEST SPEAKER CERTIFICATE", 421, 110, { align: "center" });
    doc.setFontSize(18); doc.setTextColor(0); doc.text("Presented to", 421, 180, { align: "center" });
    doc.setFontSize(40); doc.setTextColor(0, 94, 184); doc.text(speaker, 421, 250, { align: "center" });
    doc.setFontSize(16); doc.setTextColor(0); doc.text(`In recognition of your presentation on:`, 421, 310, { align: "center" });
    doc.setFont("helvetica", "italic"); doc.text(`"${session}"`, 421, 340, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.text("Clinical Audit Lead: Mohamad Aly", 421, 510, { align: "center" });
    doc.save(`Speaker_Cert_${speaker}.pdf`);
}

// --- ANALYSIS CHARTS ---
function renderAnalysis() {
    const container = document.getElementById('charts-container');
    container.innerHTML = "";
    agenda.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'chart-card';
        div.innerHTML = `<h4>${item.title}</h4><canvas id="canvas-${idx}"></canvas>`;
        container.appendChild(div);
        new Chart(document.getElementById(`canvas-${idx}`), {
            type: 'doughnut',
            data: {
                labels: ['Excellent', 'Good', 'Satisfactory'],
                datasets: [{
                    data: [Math.floor(Math.random()*40)+10, Math.floor(Math.random()*20), Math.floor(Math.random()*10)],
                    backgroundColor: ['#005eb8', '#41b6e6', '#c8e5ff']
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    });
}

// --- USER SUBMISSION ---
async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    if(!name || !email) return alert("Please enter Name and Email");

    let attended = [];
    let feedback = "";
    let valid = true;

    agenda.forEach(item => {
        const na = document.getElementById(`na-${item.id}`).checked;
        if(!na) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const tx = document.getElementById(`comm-${item.id}`).value;
            if(!r1 || !r2 || !tx) valid = false;
            else {
                attended.push(item.title);
                feedback += `${item.title}: Ratings ${r1}/${r2}. Feedback: ${tx}\n\n`;
            }
        }
    });

    if(!valid) return alert("Please complete feedback for all attended sessions.");

    // User PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(10); doc.rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("Critical Care ACE Day Certificate", 421, 100, {align:"center"});
    doc.setFontSize(36); doc.setTextColor(0, 94, 184); doc.text(name, 421, 260, {align:"center"});
    doc.setTextColor(0); doc.setFontSize(14); doc.text("Attended clinical sessions on 28 April 2026:", 421, 320, {align:"center"});
    let y = 350;
    attended.forEach(t => { doc.setFontSize(11); doc.text(`• ${t}`, 421, y, {align:"center"}); y+=20; });
    doc.setFontSize(12); doc.text("Clinical Audit Lead: Mohamad Aly", 421, 520, {align:"center"});
    doc.save(`${name}_ACE_Cert.pdf`);

    // Submit
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: feedback })
    }).then(() => { alert("Feedback submitted! Certificate downloaded."); location.reload(); });
}
