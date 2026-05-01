const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";
const WATERMARK_URL = "https://i.postimg.cc/x8C63BzL/Designer-2-removebg-preview.png";
const MFT_LOGO = "https://i.postimg.cc/bN5B3YLk/mft.png";
const BEE_LOGO = "https://i.postimg.cc/4dGMV8wX/bee.png";

const AGENDA_DATA = [
    { id: 1, time: "13:30", title: "Critical Care Echo Audit", speakers: ["Steve Benington", "Suraj", "Vikas", "Hussein"] },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speakers: ["Anna Tilley"] },
    { id: 3, time: "14:35", title: "Quality and Safety Update in ORC", speakers: ["Ian Tyrrell-Marsh"] },
    { id: 4, time: "15:05", title: "Justice in Critical Care - a question of allocation", speakers: ["Speaker Name"] },
    { id: 5, time: "15:45", title: "PICC Line Insertion Service", speakers: ["Speaker Name"] }
];

// --- RENDER AGENDA ---
function forceRenderAgenda() {
    const container = document.getElementById('sessions-container');
    if (!container || container.innerHTML.trim() !== "") return;
    
    container.innerHTML = AGENDA_DATA.map(item => `
        <div class="session-card" style="border:1px solid #005eb8; padding:15px; margin-bottom:15px; border-radius:10px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <span style="color:#005eb8; font-weight:bold; font-size:1.1em;">${item.time} - ${item.title}</span>
                <label style="background:#eee; padding:2px 8px; border-radius:4px; font-size:0.8em; cursor:pointer;">
                    <input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A
                </label>
            </div>
            <div id="body-${item.id}">
                <div style="margin-bottom:8px;">
                    <label style="display:block; font-size:0.85em; color:#666;">Content Quality:</label>
                    <select id="r1-${item.id}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="">-- Rate Content --</option>
                        <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                    </select>
                </div>
                <div style="margin-bottom:8px;">
                    <label style="display:block; font-size:0.85em; color:#666;">Speaker Delivery:</label>
                    <select id="r2-${item.id}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="">-- Rate Delivery --</option>
                        <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                    </select>
                </div>
                <textarea id="comm-${item.id}" placeholder="Comments..." required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"></textarea>
            </div>
        </div>
    `).join('');
}

function toggleS(id) {
    const isNA = document.getElementById(`na-${id}`).checked;
    const b = document.getElementById(`body-${id}`);
    b.style.opacity = isNA ? "0.2" : "1";
    b.querySelectorAll('select, textarea').forEach(el => {
        el.disabled = isNA;
        el.required = !isNA;
    });
}

// --- SUBMISSION ---
async function startProcess() {
    const name = document.getElementById('userName')?.value.trim();
    const email = document.getElementById('userEmail')?.value.trim();
    const general = document.getElementById('generalFeedback')?.value.trim();
    
    if(!name || !email || !general) return alert("Please fill Name, Email, and Overall Feedback.");

    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;

    AGENDA_DATA.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const cm = document.getElementById(`comm-${item.id}`).value.trim();
            if(r1 && r2) {
                attended.push(item.title);
                msg += `SESSION: ${item.title}\nQuality: ${r1}\nDelivery: ${r2}\nComment: ${cm}\n---\n`;
            }
        }
    });

    if(attended.length === 0) return alert("Please complete at least one session.");

    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    document.getElementById('user-view').innerHTML = `<div style="text-align:center; padding:100px 20px;">
        <h1 style="color:#005eb8;">Submitted!</h1>
        <p>Thank you, ${name}. Your certificate is downloading.</p>
        <button onclick="location.reload()" style="padding:15px 30px; background:#005eb8; color:white; border:none; border-radius:5px;">New Form</button>
    </div>`;

    await generateCert(name, attended, false);
    fetch("https://api.web3forms.com/submit", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg }),
        mode: 'no-cors' 
    });
}

// --- ADMIN FEATURES ---
function checkAdmin() {
    const pass = prompt("Enter Admin Password:");
    if (pass === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderLog();
    } else {
        alert("Incorrect Password");
    }
}

function renderLog() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    const logList = document.getElementById('attendance-log-list');
    if (!logList) return;
    
    logList.innerHTML = logs.reverse().map(l => `
        <div style="border-bottom:1px solid #eee; padding:10px; font-size:0.9em;">
            <strong>${l.name}</strong> (${l.email})<br>
            <small>${l.date}</small> - ${l.sessions.length} sessions
        </div>
    `).join('') || "No logs found yet.";
}

// --- PDF GENERATION ---
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
    doc.setFontSize(16).setTextColor(0).setFont("helvetica", "normal").text("For attending sessions on 28 April 2026", 421, 330, {align:"center"});
    if(!isSpeaker && Array.isArray(detail)) {
        doc.setFontSize(10); let y = 360;
        detail.slice(0, 8).forEach(s => { doc.text(`• ${s}`, 421, y, {align:"center"}); y+=18; });
    }
    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, {align:"center"});
    doc.save(`${name.replace(/\s+/g, '_')}_Cert.pdf`);
}

// Heartbeat
setInterval(forceRenderAgenda, 1000);
window.onload = forceRenderAgenda;
