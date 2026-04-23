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
                    <div class="rating-grid">
                        <select id="r1-${item.id}"><option value="">Content...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                        <select id="r2-${item.id}"><option value="">Delivery...</option><option>Excellent</option><option>Good</option><option>Satisfactory</option><option>Poor</option></select>
                    </div>
                    <textarea id="comm-${item.id}" placeholder="Comments..."></textarea>
                </div>
            </div>`;
    });
}

function validateEmail(email) {
    return String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const general = document.getElementById('generalFeedback').value;

    if(!name || !email) return alert("Please enter your name and email.");
    if(!validateEmail(email)) return alert("Please enter a valid email address format.");

    // Check if email has already submitted
    let usedEmails = JSON.parse(localStorage.getItem('submitted_emails') || "[]");
    if(usedEmails.includes(email)) {
        return alert("This email has already submitted a form. Please click the link again if you need to access the site.");
    }

    let attended = [];
    let msg = `Overall Feedback: ${general}\n\n`;
    agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            msg += `[${item.title}] Content: ${document.getElementById(`r1-${item.id}`).value}, Delivery: ${document.getElementById(`r2-${item.id}`).value}. Comment: ${document.getElementById(`comm-${item.id}`).value}\n\n`;
        }
    });

    // Save email to prevent double submission
    usedEmails.push(email);
    localStorage.setItem('submitted_emails', JSON.stringify(usedEmails));

    // Hide form and show Thank You
    document.getElementById('user-view').innerHTML = `
        <div class="thank-you-msg">
            <div class="success-icon">✓</div>
            <h3>Thank You, ${name}!</h3>
            <p>Your feedback has been submitted successfully.</p>
            <p>Your certificate is downloading. You may now close this window.</p>
            <button class="btn-sec" onclick="location.reload()">Back to Home</button>
        </div>`;

    await generateCert(name, attended, false);
    
    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg })
    });
}

// (Keep generateCert, checkAdmin, showTab, updateGlobalDate, etc. from previous version)
function checkAdmin() {
    if (prompt("Enter Admin Password:") === ADMIN_PASS) {
        document.getElementById('user-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        renderAdminAgenda();
    }
}
// ... [Existing admin functions stay here]
