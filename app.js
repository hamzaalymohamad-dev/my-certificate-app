// Initialize EmailJS
emailjs.init("N9nzTwaMwjXe8rVEv");

async function startProcess() {
    // 1. Collect Data
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const feedback = document.getElementById('feedback').value;
    const topicSelect = document.getElementById('topic');
    const topic = topicSelect.value;
    
    // Get the presenter from the hidden data attribute
    const presenter = topicSelect.options[topicSelect.selectedIndex].getAttribute('data-presenter');

    // 2. Validation
    if (!name || !email || topic === "Select a Session" || !feedback) {
        alert("Please complete all fields and provide feedback.");
        return;
    }

    // 3. Generate Certificate
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); // Landscape A4

    // Header Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("Critical Care ACE Day", 420, 80, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Audit & Clinical Effectiveness Collaborative", 420, 110, { align: "center" });
    doc.text("NMGH & Oxford Road Campus", 420, 130, { align: "center" });

    // Main Body
    doc.setFontSize(20);
    doc.text("This is to certify that", 420, 200, { align: "center" });
    
    doc.setFontSize(32);
    doc.setTextColor(0, 51, 102); // Dark Blue
    doc.text(name, 420, 250, { align: "center" });

    doc.setTextColor(0); // Back to Black
    doc.setFontSize(16);
    doc.text("Has participated in the clinical session:", 420, 300, { align: "center" });
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(topic, 420, 340, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text(`Presented by: ${presenter}`, 420, 370, { align: "center" });

    // Footer Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Date: 28 April 2026", 150, 480);
    doc.text("Coordinator: Mohamad Aly", 690, 480, { align: "right" });
    
    // Decorative Signature Line
    doc.setLineWidth(1);
    doc.line(600, 470, 780, 470); 

    // 4. Download Immediately
    doc.save(`${name.replace(/\s+/g, '_')}_ACE_Certificate.pdf`);

    // 5. Send Feedback via EmailJS
    const emailParams = {
        user_name: name,
        user_email: email,
        session_topic: topic,
        presenter_name: presenter,
        feedback_text: feedback
    };

    emailjs.send("service_cw255i8", "template_5ohdsal", emailParams)
        .then(() => {
            alert("Thank you! Your certificate has downloaded and your feedback was submitted.");
        })
        .catch((err) => {
            console.error("Email failed:", err);
            alert("Certificate downloaded, but email submission failed. Check your connection.");
        });
}
