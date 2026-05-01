const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";
const ADMIN_PASS = "Aly2026";

const AGENDA = [
    { id: 1, title: "Critical Care Echo Audit" },
    { id: 2, title: "Vancomycin Infusions Re-Audit" },
    { id: 3, title: "Quality and Safety Update in ORC" },
    { id: 4, title: "Justice in Critical Care" },
    { id: 5, title: "PICC Line Insertion Service" }
];

// 1. Initialize Agenda
function renderAgenda() {
    const container = document.getElementById('sessions-container');
    if (!container) return;
    container.innerHTML = AGENDA.map(item => `
        <div class="session-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${item.title}</strong>
                <label style="font-size:12px;"><input type="checkbox" onchange="document.getElementById('fields-${item.id}').style.opacity = this.checked ? '0.3' : '1'" id="na-${item.id}"> N/A</label>
            </div>
            <div id="fields-${item.id}" style="margin-top:10px;">
                <select id="q-${item.id}"><option value="">Quality</option><option>Excellent</option><option>Good</option><option>Satisfactory</option></select>
                <select id="d-${item.id}"><option value="">Delivery</option><option>Excellent</option><option>Good</option><option>Satisfactory</option></select>
            </div>
        </div>
    `).join('');
}

// 2. Form Submission
async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    if (!name || !email) return alert("Enter Name and Email");

    let attended = [];
    AGENDA.forEach(item => {
        if (!document.getElementById(`na-${item.id}`).checked) attended.push(item.title);
    });

    // Save to Local Storage
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    // Show Success UI
    document.getElementById('user-view').innerHTML = `<div style="text-align:center; padding:50px;"><h2>Submitted!</h2><p>Thank you ${name}. Your certificate is downloading.</p><button onclick="location.reload()" class="btn-submit">New Entry</button></div>`;

    // Generate PDF
    generateCert(name, attended);

    // Send Email
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: `Attendee: ${name} | Sessions: ${attended.join(', ')}` })
    });
}

// 3. Admin Panel
function checkAdmin() {
    if (prompt("Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
        document.getElementById('attendance-log-list').innerHTML = logs.reverse().map(l => `
            <div style="border-bottom:1px solid #eee; padding:10px;">
                <strong>${l.name}</strong> - ${l.email}<br><small>${l.date}</small>
            </div>
        `).join('') || "No logs yet.";
    }
}

function exportToCSV() {
    const logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    let csv = "Name,Email,Date,Sessions\n" + logs.map(l => `"${l.name}","${l.email}","${l.date}","${l.sessions.join(';')}"`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ACE_Attendance.csv';
    a.click();
}

function clearLogs() { if(confirm("Clear all?")) { localStorage.removeItem('ace_attendance_log'); location.reload(); } }

function generateCert(name, sessions) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setDrawColor(0, 94, 184).setLineWidth(5).rect(20, 20, 802, 555);
    doc.setFontSize(30).text("Critical Care ACE Day", 421, 100, {align:"center"});
    doc.setFontSize(40).setTextColor(0, 94, 184).text(name, 421, 280, {align:"center"});
    doc.save(`${name}_Cert.pdf`);
}

window.onload = renderAgenda;
