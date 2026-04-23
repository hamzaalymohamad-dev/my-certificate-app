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
            <div class="session-card" id="card-${item.id}">
                <div class="session-header">
                    <div><strong>${item.time} - ${item.title}</strong></div>
                    <label class="na-check">
                        <input type="checkbox" onchange="toggleSession(${item.id})" id="na-${item.id}"> Did not attend
                    </label>
                </div>
                <div class="session-body" id="body-${item.id}">
                    <div class="rating-grid">
                        <select id="rating-content-${item.id}">
                            <option value="">Rate Content...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                        <select id="rating-delivery-${item.id}">
                            <option value="">Rate Delivery...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <textarea id="comment-${item.id}" placeholder="Key takeaway..."></textarea>
                </div>
            </div>`;
    });
};

function toggleSession(id) {
    const body = document.getElementById(`body-${id}`);
    const isNA = document.getElementById(`na-${id}`).checked;
    body.classList.toggle('disabled', isNA);
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const errorBanner = document.getElementById('error-msg');
    
    let attendedSessions = [];
    let allSessionsValidated = true;
    let feedbackSummary = "";

    if (!name || !email) {
        alert("Please enter your name and email.");
        return;
    }

    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        const r1 = document.getElementById(`rating-content-${item.id}`).value;
        const r2 = document.getElementById = `rating-delivery-${item.id}`.value; // Corrected ID fetch
        const comm = document.getElementById(`comment-${item.id}`).value;

        // Manual fetch to fix a tiny logic typo in previous version
        const r1Val = document.getElementById(`rating-content-${item.id}`).value;
        const r2Val = document.getElementById(`rating-delivery-${item.id}`).value;

        if (!isNA) {
            if (!r1Val || !r2Val || !comm) {
                allSessionsValidated = false;
            } else {
                attendedSessions.push(item.title);
                feedbackSummary += `[${item.title}] Rating: ${r1Val}/${r2Val}. Feedback: ${comm}\n\n`;
            }
        } else {
            feedbackSummary += `[${item.title}] DID NOT ATTEND\n\n`;
        }
    });

    if (!allSessionsValidated) {
        errorBanner.style.display = "block";
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }
    
    errorBanner.style.display = "none";

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 297, 80, { align: "center" });
    doc.setFontSize(28);
    doc.setTextColor(0, 94, 184);
    doc.text(name, 297, 260, { align: "center" });
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Has attended the following clinical sessions:", 297, 320, { align: "center" });
    doc.setFontSize(12);
    let y = 350;
    attendedSessions.forEach(t => { doc.text(`• ${t}`, 297, y, { align: "center" }); y += 20; });
    doc.save(`${name.replace(/\s+/g, '_')}_ACE_Certificate.pdf`);

    const formData = {
        access_key: "YOUR_ACCESS_KEY_HERE", 
        name: name,
        email: email,
        subject: `ACE Day Feedback - ${name}`,
        message: feedbackSummary
    };

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert("Feedback submitted successfully! Certificate downloaded.");
            location.reload();
        } else {
            alert("Submission failed. Check your Web3Forms access key.");
        }
    } catch (err) {
        console.error(err);
        alert("Error connecting to server.");
    }
}
