// 1. Tell the app who you are (IDs MUST be in "quotation marks")
emailjs.init("N9nzTwaMwjXe8rVEv");

// 2. This function starts when the user clicks the button
async function startProcess() {
    // Get the info from the boxes on the screen
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const topic = document.getElementById('topic').value;

    // A simple check to make sure they filled everything out
    if (!name || !email || topic === "Select a Topic") {
        alert("Please fill in all fields!");
        return;
    }

    alert("Working on your certificate... please wait.");

    // 3. This part "draws" the certificate
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); 

    doc.setFontSize(30);
    doc.text("Certificate of Attendance", 420, 150, { align: "center" });
    doc.setFontSize(20);
    doc.text("This is presented to:", 420, 220, { align: "center" });
    doc.text(name, 420, 280, { align: "center" });
    doc.text("For the session: " + topic, 420, 350, { align: "center" });

    const pdfData = doc.output('datauristring');

    // 4. Send the data to EmailJS
    const emailData = {
        user_name: name,
        user_email: email,
        topic: topic,
        content: pdfData 
    };

    // Note: service and template IDs also need "quotes"
    emailjs.send("service_cw255i8", "template_5ohdsal", emailData)
        .then(() => {
            alert("Success! Your certificate is in your email.");
        })
        .catch((err) => {
            alert("Oops, something went wrong.");
            console.log(err);
        });
}
