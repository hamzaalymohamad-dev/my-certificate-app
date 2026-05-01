const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

// HARDCODED DATA - This ensures the agenda ALWAYS shows
const liveData = {
    status: "open", 
    date: "28 April 2026",
    agenda: [
        { id: 1, time: "13:30", title: "Critical Care Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
        { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] },
        { id: 3, time: "14:35", title: "Quality and Safety Update in ORC", speakers: ["Ian Tyrrell-Marsh"] },
        { id: 4, time: "15:05", title: "Justice in Critical Care - a question of allocation", speakers: ["Speaker Name"] },
        { id: 5, time: "15:45", title: "PICC Line Insertion Service", speakers: ["Speaker Name"] }
    ]
};

window.onload = () => {
    document.getElementById('date-display').innerText = liveData.date;
    renderUserForm();
};

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    if (!container) return;
    
    container.innerHTML = liveData.agenda.map(item => `
        <div class="session-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <div class="session-header" style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${item.time} - ${item.title}</strong>
                <label style="font-size: 0.8em;"><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
            </div>
            <div class="session-body" id="body-${item.id}" style="margin-top: 10px;">
                <div style="margin-bottom: 5px;">
                    <span style="font-size: 0.9em;">Quality:</span>
                    <select id="r1-${item.id}" required style="width: 100%; padding: 5px;">
                        <option value="">- Select -</option>
                        <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                    </select>
                </div>
                <div style="margin-bottom: 5px;">
                    <span style="font-size: 0.9em;">Delivery:</span>
                    <select id="r2-${item.id}" required style="width: 100%; padding: 5px;">
                        <option value="">- Select -</option>
                        <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                    </select>
                </div>
                <textarea id="comm-${item.id}" placeholder="Comments..." required style="width: 100%; height: 40px; margin-top: 5px;"></textarea>
            </div>
        </div>`).join('');
}

function toggleS(id) {
    const isNA = document.getElementById(`na-${id}`).checked;
    const b = document.getElementById(`body-${id}`);
    b.style.opacity = isNA ? "0.3" : "1";
    b.querySelectorAll('select, textarea').forEach(el => el.required = !isNA);
}

async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();
    
    if(!name || !email || !general) return alert("Please fill Name, Email, and overall feedback.");

    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;

    liveData.agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            msg += `SESS_START|${item.title}\nSCORE_C|${document.getElementById('r1-'+item.id).value}\nSCORE_D|${document.getElementById('r2-'+item.id).value}\nCOMMENT|${document.getElementById('comm-'+item.id).value}\nSESS_END\n\n`;
        }
    });

    if(attended.length === 0) return alert("Please select at least one session.");

    // SAVE LOGS LOCALLY
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    // SUCCESS UI
    document.getElementById('user-view').innerHTML = `
        <div style="text-align:center; padding:40px;">
            <h2 style="color:#005eb8;">Success!</h2>
            <p>Thank you ${name}. Your certificate is downloading.</p>
            <button onclick="location.reload()" style="padding:10px 20px; background:#005eb8; color:white; border:none; border-radius:5px;">New Form</button>
        </div>`;

    // PDF GENERATION
    await generateCert(name, attended, false);
    
    // EMAIL (BACKGROUND)
    fetch("https://api.web3forms.com/submit", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg }),
        mode: 'no-cors' 
    });
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
    doc.save(`${name.replace(/\s+/g, '_')}_Cert.pdf`);
}

function checkAdmin() {
    if (prompt("Pass:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderLog();
    }
}

function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    document.getElementById('attendance-log-list').innerHTML = logs.reverse().map((l, i) => `
        <div style="border-bottom:1px solid #eee; padding:10px;">
            <strong>${l.name}</strong> - ${l.date}
        </div>`).join('');
}
