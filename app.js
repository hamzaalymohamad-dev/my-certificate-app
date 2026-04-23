emailjs.init("N9nzTwaMwjXe8rVEv");

async function startProcess() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const topicSelect = document.getElementById('topic');
    const topic = topicSelect.value;
    const presenter = topicSelect.options[topicSelect.selectedIndex].getAttribute('data-presenter');
    
    const ratingPres = document.getElementById('ratingPresentation').value;
    const ratingDel = document.getElementById('ratingDelivery').value;
    const feedback = document.getElementById('feedback').value;

    // 1. Mandatory Field Validation
    if (!name || !email || !topic || !ratingPres || !ratingDel || !feedback) {
        alert("All fields are mandatory. Please provide ratings and feedback.");
        return;
    }

    // 2. Handle 'NA' Case
    if (topic === "NA") {
        alert("Feedback submitted. No certificate is generated for non-attendance.");
        // We still send the feedback to EmailJS, then stop
        sendEmailOnly(name, email, "NA", "NA", ratingPres, ratingDel, feedback);
        return;
    }

    // 3. Generate Certificate for Attendees
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');

    // Header Styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Critical Care ACE Day", 420, 80, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Audit & Clinical Effectiveness Collaborative — NMGH & Oxford Road Campus", 420, 105, { align: "center" });
    doc.text("Date: 28 April 2026 | Time: 13:30 – 16:15", 420, 125, { align: "center" });

    // Certificate Body
    doc.setFontSize(20);
    doc.text("This certificate of attendance is awarded to", 420, 200, { align: "center" });
    
    doc.setFontSize(30);
    doc.setTextColor(0, 51, 102); 
    doc.text(name, 420, 250, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text("For participation in the session:", 420, 310, { align: "center" });
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(topic, 420, 345, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text(`Presented by: ${presenter}`, 420, 375, { align: "center" });

    // Signatures
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Coordinator: Mohamad Aly", 100, 480);
    doc.line(100, 470, 250, 470); 

    doc.save(`${name}_ACE_Certificate.pdf`);

    // 4. Send the Email
    sendEmailOnly(name, email, topic, presenter, ratingPres, ratingDel, feedback);
}

function sendEmailOnly(name, email, topic, presenter, rPres, rDel, fback) {
    const params = {
        user_name: name,
        user_email: email,
        session_topic: topic,
        presenter_name: presenter,
        rating_presentation: rPres,
        rating_delivery: rDel,
        feedback_text: fback
    };

    emailjs.send("service_cw255i8", "template_5ohdsal", params)
        .then(() => {
            if(topic !== "NA") alert("Success! Certificate downloaded and feedback sent.");
        });
}
