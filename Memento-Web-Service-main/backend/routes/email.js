const nodemailer = require("nodemailer");
const db = require("../db");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// 로그 저장 헬퍼 함수
function logEmail(emailType, recipientEmail, userId, subject, status, errorMessage = null) {
    db.run(
        `INSERT INTO email_logs (email_type, recipient_email, user_id, subject, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [emailType, recipientEmail, userId, subject, status, errorMessage],
        (err) => {
            if (err) console.error('[EMAIL LOG] Failed to save log:', err);
        }
    );
}

// 유언장 알림 이메일
async function sendWillNotification(toEmail, willLocation, willFileUrl, deceasedName, userId) {
    const subject = `[Memento] ${deceasedName}님의 자필 유언장 보관 위치 안내`;
    try {
        const mailOptions = {
            from: `"Memento Service" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject,
            text: `고인께서 보관하신 자필 유언장 위치: ${willLocation}`,
            attachments: willFileUrl
                ? [{ filename: "will_document.jpg", path: willFileUrl }]
                : [],
        };
        await transporter.sendMail(mailOptions);
        logEmail('WILL', toEmail, userId, subject, 'SUCCESS');
        console.log(`[EMAIL LOG] Will notification logged as SUCCESS`);
    } catch (error) {
        logEmail('WILL', toEmail, userId, subject, 'FAILED', error.message);
        console.error(`[EMAIL LOG] Will notification logged as FAILED:`, error.message);
        throw error;
    }
}

// 타임캡슐 알림 이메일
async function sendTimeCapsuleNotification(toEmail, userId, capsuleTitle) {
    const subject = `[Memento] 고인의 디지털 타임캡슐 알림`;
    try {
        const mailOptions = {
            from: `"Memento Service" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject,
            text: `고인의 타임캡슐이 있습니다: "${capsuleTitle}"\n로그인 후 확인 가능합니다.`,
        };
        await transporter.sendMail(mailOptions);
        logEmail('TIME_CAPSULE', toEmail, userId, subject, 'SUCCESS');
        console.log(`[EMAIL LOG] Time capsule notification logged as SUCCESS`);
    } catch (error) {
        logEmail('TIME_CAPSULE', toEmail, userId, subject, 'FAILED', error.message);
        console.error(`[EMAIL LOG] Time capsule notification logged as FAILED:`, error.message);
        throw error;
    }
}

module.exports = { sendWillNotification, sendTimeCapsuleNotification };