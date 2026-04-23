emailjs.init("N9nzTwaMwjXe8rVEv");

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const topicSelect = document.getElementById('topic');
    const topic = topicSelect.value;
    const presenter = topicSelect.options[topicSelect.selectedIndex].getAttribute('data-presenter');
    
    const rPres = document.getElementById('ratingPresentation').value;
    const rDel = document.getElementById('ratingDelivery').value;
    const feedback = document.getElementById('feedback').value;

    if (!name || !email || !topic || !rPres || !rDel || !feedback) {
        alert("Please complete all mandatory fields.");
        return;
    }

    if (topic === "NA") {
        alert("Feedback submitted. Thank you.");
        sendFeedbackOnly(name, email, topic, "N/A", rPres, rDel, feedback);
        return;
    }

    // PDF Generation
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');

    // Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(0, 47, 92);
    doc.text("Critical Care ACE Day", 420, 80, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Audit & Clinical Effectiveness Collaborative — NMGH & Oxford Road Campus", 420, 105, { align: "center" });
    doc.text("Date: 28 April 2026", 420, 125, { align: "center" });

    // Main Content
    doc.setTextColor(0);
    doc.setFontSize(20);
    doc.text("Certificate of Attendance", 420, 200, { align: "center" });
    
    doc.setFontSize(32);
    doc.setTextColor(0, 94, 184); 
    doc.text(name, 420, 260, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text("For participating in the clinical session:", 420, 315, { align: "center" });
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(topic, 420, 350, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text(`Presented by: ${presenter}`, 420, 380, { align: "center" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Coordinator: Mohamad Aly", 100, 480);
    doc.line(100, 470, 250, 470); 

    doc.save(`${name}_ACE_Certificate.pdf`);

    sendFeedbackOnly(name, email, topic, presenter, rPres, rDel, feedback);
}

function sendFeedbackOnly(name, email, topic, pres, r1, r2, fb) {
    const params = {
        user_name: name,
        user_email: email,
        session_topic: topic,
        presenter_name: pres,
        rating_presentation: r1,
        rating_delivery: r2,
        feedback_text: fb
    };

    emailjs.send("service_cw255i8", "template_5ohdsal", params)
        .then(() => alert("Feedback sent successfully."));
}
