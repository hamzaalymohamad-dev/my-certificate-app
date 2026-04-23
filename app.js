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

function renderUserForm() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = "";
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label><input type="checkbox" onchange="toggleS('${item.id}')" id="na-${item.id}"> N/A</label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-row">
                        <span>Presentation content:</span>
                        <select id="r1-${item.id}"><option value="">Select...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                    </div>
                    <div class="rating-row">
                        <span>Presentation delivery:</span>
                        <select id="r2-${item.id}"><option value="">Select...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Comments for this session..."></textarea>
                </div>
            </div>`;
    });
}

function toggleS(id) { 
    document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked); 
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const general = document.getElementById('generalFeedback').value;

    if(!name || !email) return alert("Full Name and Email are required.");
    if(!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return alert("Please enter a valid email address.");

    let usedEmails = JSON.parse(localStorage.getItem('submitted_emails') || "[]");
    if(usedEmails.includes(email.toLowerCase())) return alert("You have already submitted feedback.");

    let attended = [];
    let msg = `OVERALL DAY FEEDBACK: ${general}\n\n`;
    agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            msg += `[${item.title}] Presentation Content: ${document.getElementById(`r1-${item.id}`).value}, Presentation Delivery: ${document.getElementById(`r2-${item.id}`).value}. Comment: ${document.getElementById(`comm-${item.id}`).value}\n\n`;
        }
    });

    usedEmails.push(email.toLowerCase());
    localStorage.setItem('submitted_emails', JSON.stringify(usedEmails));

    document.getElementById('user-view').innerHTML = `<div style="text-align:center; padding:40px;"><h2 style="color:#28a745;">✓ Thank You</h2><p>Certificate downloading. Please click the link again for future access.</p></div>`;

    await generateCert(name, attended, false);
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// --- ADMIN FUNCTIONS ---
function checkAdmin() {
    if (prompt("Admin Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    }
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).style.display = 'block';
    document.getElementById(`btn-tab-${tab}`).classList.add('active');
}

function renderAdminAgenda() {
    const list = document.getElementById('admin-agenda-list');
    list.innerHTML = "";
    agenda.forEach((item, index) => {
        list.innerHTML += `
            <div class="admin-session-box">
                <div class="admin-row"><input type="text" style="width:70px" value="${item.time}" onchange="updateAgenda(${index}, 'time', this.value)"><input type="text" value="${item.title}" onchange="updateAgenda(${index}, 'title', this.value)"><button class="btn-del" onclick="removeSession(${index})">×</button></div>
                <input type="text" value="${item.speakers.join(', ')}" onchange="updateSpeakers(${index}, this.value)">
                <div class="btn-row">${item.speakers.map(s => `<button class="btn-mini" onclick="generateCert('${s.trim()}', '${item.title}', true)">Cert: ${s}</button>`).join('')}</div>
            </div>`;
    });
}

function updateAgenda(i, k, v) { agenda[i][k] = v; save(); }
function updateSpeakers(i, v) { agenda[i].speakers = v.split(','); save(); renderAdminAgenda(); }
function addSession() { agenda.push({ id: Date.now(), time: "00:00", title: "New Session", speakers: ["Speaker"] }); save(); renderAdminAgenda(); }
function removeSession(i) { agenda.splice(i, 1); save(); renderAdminAgenda(); }
function save() { localStorage.setItem('ace_agenda', JSON.stringify(agenda)); }
function updateGlobalDate(v) { eventDate = v; localStorage.setItem('ace_date', v); document.getElementById('date-display').innerText = v; }

function handleFileUpload(event) {
    const reader = new FileReader();
    reader.onload = (e) => { document.getElementById('raw-data-input').value = e.target.result; processImportedData(); };
    reader.readAsText(event.target.files[0]);
}

function processImportedData() {
    const data = document.getElementById('raw-data-input').value;
    const container = document.getElementById('analysis-results');
    container.innerHTML = "";

    agenda.forEach((session, idx) => {
        const getCounts = (label) => {
            const regex = new RegExp(`${session.title}.*?${label}:\\s*(Excellent|Good|Satisfactory|Poor)`, "gi");
            const matches = data.match(regex) || [];
            let c = { Excellent: 0, Good: 0, Satisfactory: 0, Poor: 0 };
            matches.forEach(m => {
                if (/Excellent/i.test(m)) c.Excellent++;
                if (/Good/i.test(m)) c.Good++;
                if (/Satisfactory/i.test(m)) c.Satisfactory++;
                if (/Poor/i.test(m)) c.Poor++;
            });
            return c;
        };

        const contentCounts = getCounts("Presentation Content");
        const deliveryCounts = getCounts("Presentation Delivery");

        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `
            <h4>${session.title}</h4>
            <div class="dual-chart-row">
                <div class="chart-item"><canvas id="c-chart-${idx}" width="150" height="150"></canvas><p>Content</p></div>
                <div class="chart-item"><canvas id="d-chart-${idx}" width="150" height="150"></canvas><p>Delivery</p></div>
                <div class="comments-preview" id="comm-${idx}"><h5>Comments:</h5></div>
            </div>`;
        container.appendChild(card);

        const createDoughnut = (id, counts) => new Chart(document.getElementById(id), {
            type: 'doughnut',
            data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts).some(v=>v>0)?Object.values(counts):[1,0,0,0], backgroundColor: ['#005eb8', '#41b6e6', '#002f5c', '#d93025'] }] },
            options: { responsive: false, plugins: { legend: { display: false } } }
        });

        createDoughnut(`c-chart-${idx}`, contentCounts);
        createDoughnut(`d-chart-${idx}`, deliveryCounts);
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
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(5); doc.rect(20, 20, 802, 555);
    doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 421, 100, {align:"center"});
    doc.setFontSize(22).setTextColor(0);
    doc.text(isSpeaker ? "SPEAKER CERTIFICATE" : "CERTIFICATE OF ATTENDANCE", 421, 180, {align:"center"});
    doc.setFontSize(40).setTextColor(0, 94, 184);
    doc.text(name, 421, 280, {align:"center"});
    doc.setFontSize(16).setTextColor(0).setFont("helvetica", "normal");
    const desc = isSpeaker ? `For delivering the presentation: "${detail}"` : "For attending the sessions held on:";
    doc.text(desc, 421, 330, {align:"center"});
    doc.setFont("helvetica", "bold").text(eventDate, 421, 360, {align:"center"});
    if(!isSpeaker) {
        doc.setFontSize(10); let y = 390;
        detail.forEach(t => { doc.text(`• ${t}`, 421, y, {align:"center"}); y+=18; });
    }
    doc.text("Clinical Audit Lead: Mohamad Aly", 421, 530, {align:"center"});
    doc.save(`${name.replace(/\s+/g, '_')}_Cert.pdf`);
}
