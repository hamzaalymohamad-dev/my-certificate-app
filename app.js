const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

let eventDate = localStorage.getItem('ace_date') || "28 April 2026";
let agenda = JSON.parse(localStorage.getItem('ace_agenda')) || [
    { id: 1, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] },
    { id: 3, time: "14:35", title: "Critical Care Updates", speakers: ["Evangelos Boultoukas"] }
];

window.onload = () => { 
    document.getElementById('date-display').innerText = eventDate;
    document.getElementById('admin-date-input').value = eventDate;
    renderUserForm(); 
};

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = "";
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label class="na-check"><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-grid">
                        <select id="r1-${item.id}"><option value="">Content...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                        <select id="r2-${item.id}"><option value="">Delivery...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Your comments..."></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) { document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked); }

function checkAdmin() {
    if (prompt("Enter Clinical Audit Lead Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    }
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-session-box">
                <div class="admin-row">
                    <input type="text" class="sm-inp" value="${item.time}" onchange="updateAgenda(${index}, 'time', this.value)">
                    <input type="text" value="${item.title}" onchange="updateAgenda(${index}, 'title', this.value)">
                    <button class="btn-del" onclick="removeSession(${index})">×</button>
                </div>
                <input type="text" value="${item.speakers.join(', ')}" onchange="updateSpeakers(${index}, this.value)">
                <div class="btn-row">
                    ${item.speakers.map(s => `<button class="btn-mini" onclick="generateCert('${s.trim()}', '${item.title}', true)">Speaker Cert: ${s}</button>`).join('')}
                </div>
            </div>`;
    });
}

function updateAgenda(i, k, v) { agenda[i][k] = v; save(); }
function updateSpeakers(i, v) { agenda[i].speakers = v.split(','); save(); renderAdminAgenda(); }
function addSession() { agenda.push({ id: Date.now(), time: "00:00", title: "New Session", speakers: ["Speaker"] }); save(); renderAdminAgenda(); }
function removeSession(i) { agenda.splice(i, 1); save(); renderAdminAgenda(); }
function save() { localStorage.setItem('ace_agenda', JSON.stringify(agenda)); }
function updateGlobalDate(v) { eventDate = v; localStorage.setItem('ace_date', v); document.getElementById('date-display').innerText = v; }

async function generateCert(name, detail, isSpeaker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    
    doc.setGState(new doc.GState({opacity: 0.08}));
    doc.addImage(WATERMARK_URL, 'PNG', 0, 0, 842, 595); 
    doc.setGState(new doc.GState({opacity: 1.0}));

    doc.addImage(BEE_LOGO, 'PNG', 40, 40, 50, 50);
    doc.addImage(MFT_LOGO, 'PNG', 680, 40, 120, 45);

    doc.setDrawColor(0, 94, 184); doc.setLineWidth(5); doc.rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 421, 100, {align:"center"});
    
    doc.setFontSize(22); doc.setTextColor(0);
    doc.text(isSpeaker ? "SPEAKER CERTIFICATE" : "CERTIFICATE OF ATTENDANCE", 421, 180, {align:"center"});
    
    doc.setFontSize(40); doc.setTextColor(0, 94, 184);
    doc.text(name, 421, 280, {align:"center"});

    doc.setFontSize(16); doc.setTextColor(0); doc.setFont("helvetica", "normal");
    const desc = isSpeaker ? `For delivering the presentation: "${detail}"` : "For attending the sessions held on:";
    doc.text(desc, 421, 330, {align:"center"});
    doc.setFont("helvetica", "bold"); doc.text(eventDate, 421, 360, {align:"center"});

    if(!isSpeaker) {
        doc.setFontSize(10);
        let y = 400;
        detail.forEach(t => { doc.text(`• ${t}`, 421, y, {align:"center"}); y+=20; });
    }

    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, {align:"center"});
    doc.save(`${name.replace(/\s+/g, '_')}_Cert.pdf`);
}

function processImportedData() {
    const data = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = "";

    agenda.forEach((session, idx) => {
        // Tally results (Basic text scanning logic)
        const exc = (data.match(new RegExp(`Excellent`, "gi")) || []).length / (agenda.length * 2);
        const gd = (data.match(new RegExp(`Good`, "gi")) || []).length / (agenda.length * 2);
        const sat = (data.match(new RegExp(`Satisfactory`, "gi")) || []).length / (agenda.length * 2);

        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `
            <h4>${session.title}</h4>
            <div class="chart-flex">
                <canvas id="chart-${idx}" width="200" height="200"></canvas>
                <div class="comments-preview">
                    <h5>Feedback Comments:</h5>
                    <div class="comm-list" id="comm-list-${idx}">
                        <p style="font-style:italic;">Scanning input data for strings...</p>
                    </div>
                </div>
            </div>`;
        container.appendChild(card);

        new Chart(document.getElementById(`chart-${idx}`), {
            type: 'doughnut',
            data: {
                labels: ["Excellent", "Good", "Satisfactory"],
                datasets: [{
                    data: [exc || 1, gd || 0, sat || 0],
                    backgroundColor: ['#005eb8', '#41b6e6', '#002f5c']
                }]
            },
            options: { responsive: false }
        });
    });
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    if(!name || !email) return alert("Please enter Name and Email");

    let attended = [];
    let msg = "";
    agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            msg += `[${item.title}] Content: ${document.getElementById(`r1-${item.id}`).value}, Delivery: ${document.getElementById(`r2-${item.id}`).value}. Comment: ${document.getElementById(`comm-${item.id}`).value}\n\n`;
        }
    });

    await generateCert(name, attended, false);
    
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    }).then(() => { alert("Feedback Sent Successfully!"); location.reload(); });
}
