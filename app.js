// 1. Initialize EmailJS with your Public Key
emailjs.init("N9nzTwaMwjXe8rVEv");

async function startProcess() {
    // Get info from the HTML inputs
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const topic = document.getElementById('topic').value;

    // Simple validation
    if (!name || !email || topic === "Select a Topic") {
        alert("Please fill in all fields!");
        return;
    }

    alert("Generating your certificate... it will download shortly.");

    // 2. Create the PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); // Landscape, Points, A4 size

    // Draw the Certificate
    doc.setFontSize(30);
    doc.setTextColor(40);
    doc.text("Certificate of Attendance", 420, 150, { align: "center" });

    doc.setFontSize(20);
    doc.text("This is presented to:", 420, 220, { align: "center" });
    
    doc.setFontSize(25);
    doc.setTextColor(0, 102, 204); // Blue color for the name
    doc.text(name, 420, 280, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("For successfully attending the session:", 420, 340, { align: "center" });
    doc.text(topic, 420, 380, { align: "center" });

    // 3. Trigger the Automatic Download
    // This bypasses the need for a paid EmailJS subscription
    doc.save(`${name}_Certificate.pdf`);

    // 4. Send the Email Notification (Text-only)
    const emailData = {
        user_name: name,
        user_email: email,
        topic: topic
    };

    emailjs.send("service_cw255i8", "template_5ohdsal", emailData)
        .then(() => {
            alert("Success! Your certificate has been downloaded and a confirmation email was sent.");
        })
        .catch((err) => {
            alert("Certificate generated, but there was an issue sending the email.");
            console.error("EmailJS Error:", err);
        });
}
