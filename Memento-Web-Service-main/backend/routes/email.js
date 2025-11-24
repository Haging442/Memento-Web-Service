const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Existing will notification
async function sendWillNotification(toEmail, willLocation, willFileUrl, deceasedName) {
    const mailOptions = {
        from: `"Memento Service" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[Memento] ${deceasedName}님의 자필 유언장 보관 위치 안내`,
        text: `고인께서 보관하신 자필 유언장 위치: ${willLocation}`,
        attachments: willFileUrl
            ? [
                  {
                      filename: "will_document.jpg",
                      path: willFileUrl,
                  },
              ]
            : [],
    };
    return transporter.sendMail(mailOptions);
}

// NEW: Time capsule notification
async function sendTimeCapsuleNotification(toEmail, deceasedId, capsuleTitle) {
    const mailOptions = {
        from: `"Memento Service" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[Memento] 고인의 디지털 타임캡슐 알림`,
        text: `고인의 타임캡슐이 있습니다: "${capsuleTitle}"\n로그인 후 확인 가능합니다.`,
    };
    return transporter.sendMail(mailOptions);
}

// Export all functions
module.exports = { sendWillNotification, sendTimeCapsuleNotification };
