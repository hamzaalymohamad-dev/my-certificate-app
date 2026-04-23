const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026"; // Change this to your preferred password

let agenda = [
    { id: 1, time: "13:30", title: "ICU Echo Audit", speaker: "Steve Benington, Suraj, Vikas & Hussein" },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speaker: "Anna Tilley" },
    { id: 3, time: "14:35", title: "Critical Care Updates", speaker: "Evangelos Boultoukas" },
    { id: 4, time: "15:05", title: "Critical Care Ethics", speaker: "Bernard Foex" },
    { id: 5, time: "15:45", title: "PICC Line Service at ORC", speaker: "Ruth Wynn" }
];

window.onload = () => { renderUserForm(); };

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = "";
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label class="na-check"><input type="checkbox" onchange="toggleS(${item.id})" id="na-${item.id}"> N/A</label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-grid">
                        <select id="r1-${item.id}"><option value="">Content...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option></select>
                        <select id="r2-${item.id}"><option value="">Delivery...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Key learning point..."></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) {
    document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked);
}

// --- ADMIN LOGIC ---
function checkAdmin() {
    const pass = prompt("Enter Coordinator Password:");
    if (pass === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    } else { alert("Access Denied"); }
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "<h4>Manage Agenda & Speaker Certs</h4>";
    agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-item">
                <input type="text" value="${item.title}" onchange="agenda[${index}].title=this.value">
                <input type="text" value="${item.speaker}" onchange="agenda[${index}].speaker=this.value">
                <button onclick="singleSpeakerCert(${index})">Cert</button>
            </div>`;
    });
}

function singleSpeakerCert(index) {
    const item = agenda[index];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    
    // Formal Speaker Design
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(5); doc.rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.setTextColor(0, 51, 102);
    doc.text("Guest Speaker Certificate", 421, 100, { align: "center" });
    
    doc.setFontSize(18); doc.setTextColor(0);
    doc.text("Presented with gratitude to", 421, 180, { align: "center" });
    
    doc.setFontSize(36); doc.setTextColor(0, 94, 184);
    doc.text(item.speaker, 421, 250, { align: "center" });
    
    doc.setFontSize(16); doc.setTextColor(0);
    doc.text(`For delivering the clinical presentation:`, 421, 310, { align: "center" });
    doc.setFont("helvetica", "italic");
    doc.text(`"${item.title}"`, 421, 340, { align: "center" });

    doc.setFont("helvetica", "normal"); doc.setFontSize(14);
    doc.text("Critical Care ACE Day | 28 April 2026", 421, 400, { align: "center" });

    doc.line(300, 500, 540, 500); doc.text("Mohamad Aly, Coordinator", 421, 520, { align: "center" });
    
    doc.save(`Speaker_Cert_${item.speaker.replace(/\s+/g, '_')}.pdf`);
}

// --- USER SUBMISSION ---
async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    let attended = [];
    let feedbackLog = "";

    if (!name || !email) { alert("Please fill Name and Email"); return; }

    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        if (!isNA) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const msg = document.getElementById(`comm-${item.id}`).value;
            if (r1 && r2 && msg) {
                attended.push(item.title);
                feedbackLog += `${item.title}: ${r1}/${r2} - ${msg}\n\n`;
            }
        }
    });

    // Generate User Cert (Same landscape design as Speaker but for Attendee)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(5); doc.rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("Critical Care ACE Day", 421, 100, {align:"center"});
    doc.setFontSize(36); doc.setTextColor(0, 94, 184); doc.text(name, 421, 260, {align:"center"});
    doc.setTextColor(0); doc.setFontSize(14); doc.text("Attended Sessions on 28 April 2026:", 421, 320, {align:"center"});
    let y = 350;
    attended.forEach(t => { doc.setFontSize(11); doc.text(`• ${t}`, 421, y, {align:"center"}); y+=20; });
    doc.save(`${name}_ACE_Cert.pdf`);

    // Web3Forms
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: feedbackLog })
    }).then(() => { alert("Feedback sent!"); location.reload(); });
}
