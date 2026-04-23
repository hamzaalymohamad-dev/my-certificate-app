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
                        <select id="r1-${item.id}">
                            <option value="">Content...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                        <select id="r2-${item.id}">
                            <option value="">Delivery...</option>
                            <option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option>
                        </select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Key takeaway..."></textarea>
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
    let isValid = true;
    let feedbackSummary = "";

    if (!name || !email) {
        alert("Name and Email are required.");
        return;
    }

    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        const q1 = document.getElementById(`r1-${item.id}`).value;
        const q2 = document.getElementById(`r2-${item.id}`).value;
        const txt = document.getElementById(`comm-${item.id}`).value;

        if (!isNA) {
            if (!q1 || !q2 || !txt) {
                isValid = false;
            } else {
                attendedSessions.push(item.title);
                feedbackSummary += `[${item.title}] Ratings: ${q1}/${q2}. Feedback: ${txt}\n\n`;
            }
        }
    });

    if (!isValid) {
        errorBanner.style.display = "block";
        return;
    }
    errorBanner.style.display = "none";

    // PDF Generation
    try {
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
        doc.setFontSize(11);
        let y = 350;
        attendedSessions.forEach(t => { doc.text(`• ${t}`, 297, y, { align: "center" }); y += 20; });
        doc.save(`${name.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (pdfErr) {
        console.error("PDF Error:", pdfErr);
    }

    // Web3Forms Submission
    const formData = {
        access_key: "YOUR_ACCESS_KEY_HERE", 
        name: name,
        email: email,
        message: feedbackSummary
    };

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert("Feedback sent and certificate downloaded!");
            location.reload();
        }
    } catch (err) {
        alert("Error sending feedback, but your certificate should have downloaded.");
    }
}
