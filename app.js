const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

let eventDate = localStorage.getItem('ace_date') || "28 April 2026";
let agenda = JSON.parse(localStorage.getItem('ace_agenda')) || [
    { id: 1, time: "13:30", title: "ICU Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] }
];

window.onload = () => { 
    document.getElementById('date-display').innerText = eventDate;
    document.getElementById('admin-date-input').value = eventDate;
    renderUserForm(); 
};

function updateGlobalDate(val) {
    eventDate = val;
    localStorage.setItem('ace_date', val);
    document.getElementById('date-display').innerText = val;
}

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
                        <select id="r1-${item.id}"><option value="">Content...</option><option value="3">Excellent</option><option value="2">Good</option></select>
                        <select id="r2-${item.id}"><option value="">Delivery...</option><option value="3">Excellent</option><option value="2">Good</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Key learning point..."></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) { document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked); }

function checkAdmin() {
    if (prompt("Enter Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    }
}

function showTab(tab) {
    document.getElementById('tab-manage').style.display = tab === 'manage' ? 'block' : 'none';
    document.getElementById('tab-analysis').style.display = tab === 'analysis' ? 'block' : 'none';
    if(tab === 'analysis') renderAnalysis();
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-session-box">
                <div class="admin-row">
                    <input type="text" value="${item.time}" onchange="updateAgenda(${index}, 'time', this.value)">
                    <input type="text" value="${item.title}" onchange="updateAgenda(${index}, 'title', this.value)">
                    <button class="btn-del" onclick="removeSession(${index})">Del</button>
                </div>
                <input type="text" value="${item.speakers.join(', ')}" onchange="updateSpeakers(${index}, this.value)">
                <div class="speaker-certs-row">
                    ${item.speakers.map(s => `<button onclick="generateCert('${s.trim()}', '${item.title}', true)">Cert: ${s}</button>`).join('')}
                </div>
            </div>`;
    });
}

function updateAgenda(i, k, v) { agenda[i][k] = v; save(); }
function updateSpeakers(i, v) { agenda[i].speakers = v.split(','); save(); renderAdminAgenda(); }
function addSession() { agenda.push({ id: Date.now(), time: "00:00", title: "New", speakers: ["Speaker"] }); save(); renderAdminAgenda(); }
function removeSession(i) { agenda.splice(i, 1); save(); renderAdminAgenda(); }
function save() { localStorage.setItem('ace_agenda', JSON.stringify(agenda)); }

async function generateCert(name, detail, isSpeaker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    
    // Watermark
    doc.setGState(new doc.GState({opacity: 0.1}));
    doc.addImage(WATERMARK_URL, 'PNG', 200, 100, 400, 400);
    doc.setGState(new doc.GState({opacity: 1.0}));

    // Logos
    doc.addImage(MFT_LOGO, 'PNG', 40, 40, 100, 40);
    doc.addImage(BEE_LOGO, 'PNG', 700, 40, 50, 50);

    // Borders
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(5); doc.rect(20, 20, 802, 555);

    doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 421, 100, {align:"center"});
    
    doc.setFontSize(20); doc.setTextColor(0);
    doc.text(isSpeaker ? "GUEST SPEAKER CERTIFICATE" : "CERTIFICATE OF ATTENDANCE", 421, 180, {align:"center"});
    
    doc.setFontSize(36); doc.setTextColor(0, 94, 184);
    doc.text(name, 421, 270, {align:"center"});

    doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "normal");
    const desc = isSpeaker ? `For presenting: "${detail}"` : "For attending the clinical sessions held on:";
    doc.text(desc, 421, 330, {align:"center"});
    doc.setFont("helvetica", "bold");
    doc.text(eventDate, 421, 360, {align:"center"});

    if(!isSpeaker) {
        doc.setFontSize(10);
        let y = 400;
        detail.forEach(t => { doc.text(`• ${t}`, 421, y, {align:"center"}); y+=18; });
    }

    doc.setFontSize(12);
    doc.text("Mohamad Aly", 421, 510, {align:"center"});
    doc.text("Clinical Audit Lead", 421, 530, {align:"center"});

    doc.save(`${name}_Cert.pdf`);
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    if(!name || !email) return alert("Fill Name/Email");

    let attended = [];
    let feedback = "";
    agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            feedback += `${item.title}: ${document.getElementById(`r1-${item.id}`).value}/${document.getElementById(`r2-${item.id}`).value}\n`;
        }
    });

    await generateCert(name, attended, false);
    
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: feedback })
    }).then(() => { alert("Feedback sent!"); location.reload(); });
}
