// 1. Tell the app who you are (Replace 'YOUR_PUBLIC_KEY' with yours)
emailjs.init(N9nzTwaMwjXe8rVEv);

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

    // 3. This part "draws" the certificate (we use a library called jsPDF)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); // 'l' means landscape (wide)

    // Let's add some text to the PDF
    doc.setFontSize(30);
    doc.text("Certificate of Attendance", 420, 150, { align: "center" });
    doc.setFontSize(20);
    doc.text("This is presented to:", 420, 220, { align: "center" });
    doc.text(name, 420, 280, { align: "center" });
    doc.text("For the session: " + topic, 420, 350, { align: "center" });

    // Convert the PDF into a special code (Base64) so it can be emailed
    const pdfData = doc.output('datauristring');

    // 4. Tell the "Delivery Driver" (EmailJS) to go!
    const emailData = {
        user_name: name,
        user_email: email,
        topic: topic,
        content: pdfData // This is our PDF
    };

    // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with yours
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", emailData)
        .then(() => {
            alert("Success! Your certificate is in your email.");
        })
        .catch((err) => {
            alert("Oops, something went wrong.");
            console.log(err);
        });
}
