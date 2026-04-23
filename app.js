// Initialize EmailJS with your Public Key
emailjs.init("N9nzTwaMwjXe8rVEv");

const agenda = [
    { id: 1, time: "13:30", title: "ICU Echo Audit" },
    { id: 2, time: "14:15", title: "Vancomycin Infusions Re-Audit" },
    { id: 3, time: "14:35", title: "Critical Care Updates" },
    { id: 4, time: "15:05", title: "Critical Care Ethics" },
    { id: 5, time: "15:45", title: "PICC Line Service at ORC" }
];

// Build the form dynamically
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
                    <textarea id="comment-${item.id}" placeholder="Impact on practice / Key takeaway..."></textarea>
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
    
    let attendedSessions = [];
    let allSessionsValidated = true;
    let emailFeedback = "";

    if (!name || !email) {
        alert("Please enter your name and email.");
        return;
    }

    // Validate every session on the agenda
    agenda.forEach(item => {
        const isNA = document.getElementById(`na-${item.id}`).checked;
        const rContent = document.getElementById(`rating-content-${item.id}`).value;
        const rDelivery = document.getElementById(`rating-delivery-${item.id}`).value;
        const comment = document.getElementById(`comment-${item.id}`).value;

        if (!isNA) {
            // If they attended, all fields are mandatory
            if (!rContent || !rDelivery || !comment) {
                allSessionsValidated = false;
            } else {
                attendedSessions.push(item.title);
                emailFeedback += `${item.title}:\n- Content: ${rContent}\n- Delivery: ${rDelivery}\n- Comment: ${comment}\n\n`;
            }
        } else {
            emailFeedback += `${item.title}: DID NOT ATTEND\n\n`;
        }
    });

    if (!allSessionsValidated) {
        errorBanner.style.display = "block";
        window.scrollTo(0, document.body.scrollHeight);
        return;
    }
    
    errorBanner.style.display = "none";

    // --- PDF GENERATION (Single Page Portrait) ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text("Critical Care ACE Day", 297, 80, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Audit & Clinical Effectiveness Collaborative — NMGH & ORC", 297, 100, { align: "center" });

    // Certificate Body
    doc.setTextColor(0);
    doc.setFontSize(18);
    doc.text("Certificate of Attendance", 297, 180, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("This is to certify that", 297, 210, { align: "center" });

    doc.setFontSize(28);
    doc.setTextColor(0, 94, 184); // NHS Blue
    doc.text(name, 297, 260, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Has attended the following clinical sessions:", 297, 320, { align: "center" });
    
    // List attended sessions
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    let yPos = 350;
    
    if (attendedSessions.length === 0) {
        doc.text("General Attendance (No specific sessions logged)", 297, 350, { align: "center" });
    } else {
        attendedSessions.forEach(title => {
            doc.text(`• ${title}`, 297, yPos, { align: "center" });
            yPos += 20;
        });
    }

    // Footer & Signature
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Date: 28 April 2026", 100, 720);
    doc.text("Coordinator: Mohamad Aly", 495, 720, { align: "right" });
    doc.line(395, 710, 495, 710); // Signature line

    doc.save(`${name.replace(/\s+/g, '_')}_ACE_Certificate.pdf`);

    // --- EMAIL NOTIFICATION ---
    emailjs.send("service_cw255i8", "template_5ohdsal", {
        user_name: name,
        user_email: email,
        feedback_text: emailFeedback
    }).then(() => {
        alert("Success! Your feedback has been sent and your certificate is downloading.");
        location.reload();
    });
}
