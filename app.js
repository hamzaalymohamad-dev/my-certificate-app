// WRONG (No quotes): emailjs.init(N9nzTwaMwjXe8rVEv);
// CORRECT (With quotes): 
emailjs.init("N9nzTwaMwjXe8rVEv");

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const topic = document.getElementById('topic').value;

    if (!name || !email || topic === "Select a Topic") {
        alert("Please fill in all fields!");
        return;
    }

    alert("Working on your certificate... please wait.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); 

    doc.setFontSize(30);
    doc.text("Certificate of Attendance", 420, 150, { align: "center" });
    doc.setFontSize(20);
    doc.text("This is presented to:", 420, 220, { align: "center" });
    doc.text(name, 420, 280, { align: "center" });
    doc.text("For the session: " + topic, 420, 350, { align: "center" });

    const pdfData = doc.output('datauristring');

    const emailData = {
        user_name: name,
        user_email: email,
        topic: topic,
        content: pdfData 
    };

    // 2. Fixed: Added quotes around Service ID and Template ID
    emailjs.send("service_cw255i8", "template_5ohdsal", emailData)
        .then(() => {
            alert("Success! Your certificate is in your email.");
        })
        .catch((err) => {
            alert("Oops, something went wrong.");
            console.log(err);
        });
}
