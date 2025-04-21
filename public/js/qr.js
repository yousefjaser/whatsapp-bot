import QrCreator from "https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.es6.min.js";

const qrcode = document.getElementById("qrcode").innerText;
const clientready = document.getElementById("clientready").innerText;
const clientauthenticated = document.getElementById("clientauthenticated").innerText;
const qrdiv = document.getElementById("qr-div");
const statusDiv = document.getElementById("status-div");
const messageForm = document.getElementById("message-form");

function updateStatus(message, isSuccess = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isSuccess ? 'success' : 'waiting'}`;
}

function showMessageForm(show) {
    messageForm.style.display = show ? 'block' : 'none';
}

async function checkStatus() {
    try {
        const response = await fetch('/api/v1/status');
        const data = await response.json();
        
        if (data.clientready === true) {
            updateStatus("WhatsApp Client Connected Successfully! ", true);
            showMessageForm(true);
            qrdiv.innerHTML = '<a href="/api/v1/logout">LOGOUT</a> &nbsp;&nbsp; <a href="/api-docs">API Docs</a>';
        } else if (data.clientauthenticated === true) {
            updateStatus("WhatsApp client authenticated, please wait...");
            showMessageForm(false);
            setTimeout(checkStatus, 2000);
        } else if (data.qrcode) {
            updateStatus("Scan the QR code with WhatsApp to connect");
            showMessageForm(false);
            QrCreator.render(
                {
                    text: data.qrcode,
                    radius: 0.5,
                    ecLevel: "H",
                    fill: "#000",
                    background: null,
                    size: 300,
                },
                qrdiv
            );
            setTimeout(checkStatus, 2000);
        } else {
            updateStatus("Waiting for QR code...");
            setTimeout(checkStatus, 2000);
        }
    } catch (error) {
        console.error("Error checking status:", error);
        updateStatus("Error checking status, refreshing...");
        setTimeout(checkStatus, 5000);
    }
}

if (!qrcode && clientready != "yes" && clientauthenticated != "yes") {
    updateStatus("Failed to load relevant info, please refresh your browser");
    showMessageForm(false);
} else if (clientready == "yes") {
    updateStatus("WhatsApp Client Connected Successfully! ", true);
    showMessageForm(true);
    qrdiv.innerHTML = '<a href="/api/v1/logout">LOGOUT</a> &nbsp;&nbsp; <a href="/api-docs">API Docs</a>';
} else if (clientauthenticated == "yes") {
    updateStatus("WhatsApp client authenticated, please wait...");
    showMessageForm(false);
} else {
    updateStatus("Scan the QR code with WhatsApp to connect");
    showMessageForm(false);
    QrCreator.render(
        {
            text: `${qrcode}`,
            radius: 0.5,
            ecLevel: "H",
            fill: "#000",
            background: null,
            size: 300,
        },
        qrdiv
    );
}

// Start checking status
checkStatus();

// Handle message form submission
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/api/v1/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobile: phone,
                message: message
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Message sent successfully!');
            messageForm.reset();
        } else {
            alert('Failed to send message: ' + result.error);
        }
    } catch (error) {
        alert('Error sending message: ' + error.message);
    }
});
