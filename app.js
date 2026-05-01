async function startProcess() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const general = document.getElementById('generalFeedback').value.trim();
    
    if(!name || !email || !general) return alert("Please fill Name, Email, and Feedback.");

    let attended = [];
    let msg = `GENERAL_FEEDBACK: ${general}\n\n`;

    liveData.agenda.forEach(item => {
        if(!document.getElementById(`na-${item.id}`).checked) {
            attended.push(item.title);
            msg += `SESS_START|${item.title}\nSCORE_C|${document.getElementById('r1-'+item.id).value}\nSCORE_D|${document.getElementById('r2-'+item.id).value}\nCOMMENT|${document.getElementById('comm-'+item.id).value}\nSESS_END\n\n`;
        }
    });

    // STEP 1: SAVE LOCALLY IMMEDIATELY (Safety first)
    let logs = JSON.parse(localStorage.getItem('ace_attendance_log') || "[]");
    logs.push({ name, email, date: new Date().toLocaleString(), sessions: attended });
    localStorage.setItem('ace_attendance_log', JSON.stringify(logs));

    // STEP 2: SHOW SUCCESS SCREEN IMMEDIATELY (Don't wait for email)
    document.getElementById('user-view').innerHTML = `
        <div style="text-align:center; padding:50px 20px;">
            <h2 style="color:#005eb8;">Submission Successful!</h2>
            <p>Thank you, ${name}. Your certificate is downloading now.</p>
            <button onclick="location.reload()" style="padding:10px 20px; background:#005eb8; color:white; border:none; border-radius:5px; cursor:pointer;">New Submission</button>
        </div>`;

    // STEP 3: DOWNLOAD PDF
    await generateCert(name, attended, false);
    
    // STEP 4: SEND EMAIL (Silent background task - if it hangs, it doesn't matter)
    fetch("https://api.web3forms.com/submit", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ access_key: ACCESS_KEY, name, email, message: msg }),
        mode: 'no-cors' // This prevents the browser from waiting for a response
    });
}
//
