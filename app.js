emailjs.init("N9nzTwaMwjXe8rVEv");

const agenda = [
    { id: 1, time: "13:30", title: "ICU Echo Audit", speaker: "Steve Benington, Suraj, Vikas & Hussein" },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit", speaker: "Anna Tilley" },
    { id: 3, time: "14:35", title: "Critical Care Updates", speaker: "Evangelos Boultoukas" },
    { id: 4, time: "15:05", title: "Critical Care Ethics", speaker: "Bernard Foex" },
    { id: 5, time: "15:45", title: "PICC Line Service at ORC", speaker: "Ruth Wynn" }
];

// 1. Generate Form Items
window.onload = () => {
    const container = document.getElementById('sessions-container');
    agenda.forEach(item => {
        container.innerHTML += `
            <div class="session-card" id="card-${item.id}">
                <div class="session-header">
                    <div>
                        <span class="time-tag">${item.time}</span>
                        <strong>${item.title}</strong>
                    </div>
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
                    <textarea id="comment-${item.id}" placeholder="Impact on your practice / Takeaway..."></textarea>
                </div>
            </div>
        `;
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
    
    let submissionData = [];
    let isFormComplete = true;

    if (!name || !email) {
        alert("Please provide your name and email.");
        return;
    }

    // 2. Validate Every Session
    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        const r1 = document.getElementById(`rating-content-${item.id}`).value;
        const r2 = document.getElementById(`rating-delivery-${item.id}`).value;
        const comm = document.getElementById(`comment-${item.id}`).value;

        if (!isNA && (!r1 || !r2 || !comm)) {
            isFormComplete = false;
        }

        submissionData.push({
            title: item.title,
            speaker: item.speaker,
            attended: !isNA,
            ratings: `${r1}/${r2}`,
            comment: comm
        });
    });

    if (!isFormComplete) {
        errorBanner.style.display = "block";
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }
    
    errorBanner.style.display = "none";

    // 3. Generate Multi-Page PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    let attendCount = 0;

    submissionData.filter(d => d.attended).forEach((data, index) => {
        if (index > 0) doc.addPage();
        attendCount++;
        
        // Design Styles
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(0, 51, 102);
        doc.text("Critical Care ACE Day", 420, 80, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Audit & Clinical Effectiveness Collaborative", 420, 105, { align: "center" });

        doc.setTextColor(0);
        doc.setFontSize(20);
        doc.text("Certificate of Attendance", 420, 200, { align: "center" });
        
        doc.setFontSize(30);
        doc.setTextColor(0, 94, 184);
        doc.text(name, 420, 250, { align: "center" });

        doc.setTextColor(0);
        doc.setFontSize(16);
        doc.text(`For attending the session:`, 420, 310, { align: "center" });
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(data.title, 420, 340, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        doc.text(`Presented by: ${data.speaker}`, 420, 365, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.text("Date: 28 April 2026 | Coordinator: Mohamad Aly", 420, 500, { align: "center" });
    });

    if (attendCount > 0) doc.save(`${name.replace(/\s+/g, '_')}_Certificates.pdf`);

    // 4. Send Email Summary to EmailJS
    const emailSummary = submissionData.map(d => 
        `${d.title}: ${d.attended ? 'Attended (' + d.ratings + ') - ' + d.comment : 'Did Not Attend'}`
    ).join("\n\n");

    emailjs.send("service_cw255i8", "template_5ohdsal", {
        user_name: name,
        user_email: email,
        feedback_text: emailSummary
    }).then(() => {
        alert("Submission Successful! Your certificates have been generated.");
        location.reload(); 
    });
}
