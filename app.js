const ACCESS_KEY = "d0491ab4-b81b-43f5-9341-10a60a6309fe";

const agenda = [
    { id: 1, time: "13:30", title: "ICU Echo Audit" },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit" },
    { id: 3, time: "14:35", title: "Critical Care Updates" },
    { id: 4, time: "15:05", title: "Critical Care Ethics" },
    { id: 5, time: "15:45", title: "PICC Line Service at ORC" }
];

window.onload = () => {
    const container = document.getElementById('sessions-container');
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card">
                <div class="session-header">
                    <strong>${item.time} - ${item.title}</strong>
                    <label class="na-check">
                        <input type="checkbox" onchange="toggleSession(${item.id})" id="na-${item.id}"> Did not attend
                    </label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-grid">
                        <select id="r1-${item.id}"><option value="">Content...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                        <select id="r2-${item.id}"><option value="">Delivery...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Key takeaway..."></textarea>
                </div>
            </div>`;
    });
};

function toggleSession(id) {
    document.getElementById(`body-${id}`).classList.toggle('disabled', document.getElementById(`na-${id}`).checked);
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const btn = document.getElementById('submitBtn');
    let attendedTitles = [];
    let isValid = true;
    let feedbackLog = "";

    if (!name || !email) { alert("Name and Email are required."); return; }

    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        if (!isNA) {
            const r1 = document.getElementById(`r1-${item.id}`).value;
            const r2 = document.getElementById(`r2-${item.id}`).value;
            const msg = document.getElementById(`comm-${item.id}`).value;
            if (!r1 || !r2 || !msg) isValid = false;
            else {
                attendedTitles.push(item.title);
                feedbackLog += `${item.title}\nRatings: ${r1}/${r2}\nFeedback: ${msg}\n\n`;
            }
        }
    });

    if (!isValid) { document.getElementById('error-msg').style.display = "block"; return; }
    document.getElementById('error-msg').style.display = "none";
    
    btn.disabled = true;
    btn.innerText = "Processing...";

    // PDF Generation (Landscape)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); 
    doc.setDrawColor(0, 94, 184); doc.setLineWidth(4); doc.rect(20, 20, 802, 555);
    doc.setDrawColor(0, 51, 102); doc.setLineWidth(1); doc.rect(30, 30, 782, 535);
    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 421, 85, { align: "center" });
    doc.setFontSize(14); doc.setFont("helvetica", "normal"); doc.text("Audit & Clinical Effectiveness Collaborative", 421, 110, { align: "center" });
    doc.setTextColor(0); doc.setFontSize(22); doc.text("Certificate of Attendance", 421, 190, { align: "center" });
    doc.setFontSize(36); doc.setTextColor(0, 94, 184); doc.setFont("helvetica", "bold");
    doc.text(name, 421, 275, { align: "center" });
    doc.setTextColor(0); doc.setFontSize(14); doc.setFont("helvetica", "normal");
    doc.text("Sessions attended on 28 April 2026:", 421, 325, { align: "center" });
    doc.setFontSize(11);
    let y = 355;
    attendedTitles.forEach(title => { doc.text(`• ${title}`, 421, y, { align: "center" }); y += 20; });
    doc.line(120, 510, 280, 510); doc.text("Mohamad Aly", 200, 525, { align: "center" });
    doc.line(560, 510, 720, 510); doc.text("28/04/2026", 640, 525, { align: "center" });
    doc.save(`${name}_ACE_Certificate.pdf`);

    // Web3Forms Send
    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                access_key: ACCESS_KEY,
                name: name,
                email: email,
                subject: `ACE Feedback: ${name}`,
                message: feedbackLog
            })
        });
        const result = await response.json();
        if (result.success) {
            alert("Feedback sent successfully!");
            location.reload();
        } else {
            alert("Error sending email. Please check your Access Key.");
        }
    } catch (err) {
        alert("Network error. Certificate saved locally.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Submit Feedback & Download Certificate";
    }
}
