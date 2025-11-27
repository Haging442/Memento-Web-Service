// controllers/email.js

async function sendTimeCapsuleNotification(toEmail, userId, title) {
    console.log(`[EMAIL] (DEV MODE) Time capsule notification → ${toEmail}`);
    console.log(`User: ${userId}, Capsule title: ${title}`);

    // 실제 이메일 발송은 너의 기존 sendWillNotification 참고해서 넣으면 됨
    // 예: nodemailer, mailgun, SES 등
}

module.exports = {
    sendTimeCapsuleNotification
};
