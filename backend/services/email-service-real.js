// Email configuration for production use
require('dotenv').config();

const nodemailer = require('nodemailer');

// Email transporter setup
const createTransporter = () => {
    // Check if we have email configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('⚠️  Email configuration not found. Using console logging mode.');
        return null;
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // For Gmail specifically
        ...(process.env.SMTP_HOST.includes('gmail') && {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS // Use App Password for Gmail
            }
        })
    });

    return transporter;
};

// Send verification email function
async function sendVerificationEmail(contactEmail, contactName, verificationUrl, reportData, req) {
    const transporter = createTransporter();
    
    // If no transporter (no config), fall back to console logging
    if (!transporter) {
        console.log('=== VERIFICATION EMAIL (SIMULATED) ===');
        console.log(`To: ${contactEmail}`);
        console.log(`Subject: [메멘토] 사망 확인 요청`);
        console.log(`Contact: ${contactName}`);
        console.log(`Deceased: ${reportData.deceasedName}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('==========================================');
        return { success: true, simulated: true };
    }

    // Email content
    const mailOptions = {
        from: {
            name: '메멘토 시스템',
            address: process.env.SMTP_FROM || process.env.SMTP_USER
        },
        to: contactEmail,
        subject: '[메멘토] 사망 확인 요청',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">
                        <span style="font-size: 1.5em;">💜</span> 메멘토 사망 확인 요청
                    </h1>
                </div>
                
                <div style="background: white; border: 1px solid #ddd; border-top: none; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">안녕하세요, ${contactName}님</h2>
                    
                    <p style="line-height: 1.6; color: #555;">
                        <strong>${reportData.deceasedName}</strong>님의 사망 신고가 접수되었습니다.<br>
                        귀하는 해당 사용자의 신뢰 연락처로 등록되어 있어, 사망 확인이 필요합니다.
                    </p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #007bff;">
                        <h3 style="color: #007bff; margin-top: 0;">📋 신고 정보</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #333;">신고자:</td>
                                <td style="padding: 8px; color: #666;">${reportData.reporterName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #333;">신고자 이메일:</td>
                                <td style="padding: 8px; color: #666;">${reportData.reporterEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #333;">고인:</td>
                                <td style="padding: 8px; color: #666;">${reportData.deceasedName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #333;">신고 시각:</td>
                                <td style="padding: 8px; color: #666;">${new Date().toLocaleString('ko-KR')}</td>
                            </tr>
                        </table>
                        ${reportData.additionalInfo ? `
                        <div style="margin-top: 15px;">
                            <strong style="color: #333;">추가 정보:</strong><br>
                            <span style="color: #666;">${reportData.additionalInfo}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ 중요 안내</h3>
                        <p style="color: #856404; margin-bottom: 10px;"><strong>이것이 정확한 사망 신고라면, 아래 링크를 클릭하여 확인해주세요:</strong></p>
                        <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
                            <li>이 링크는 <strong>7일 후 만료</strong>됩니다</li>
                            <li>신뢰 연락처 <strong>2명 모두 확인</strong>해야 처리가 시작됩니다</li>
                            <li>확인 후 <strong>72시간 대기</strong> 후 유언 집행이 시작됩니다</li>
                            <li>허위 확인은 법적 책임을 질 수 있습니다</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; 
                                  background: linear-gradient(45deg, #28a745 0%, #20c997 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 8px; 
                                  font-weight: bold; 
                                  font-size: 16px;">
                            🔍 사망 확인하기
                        </a>
                    </div>
                    
                    <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 30px;">
                        <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                            이 이메일은 메멘토 사망 확인 시스템에서 자동 발송되었습니다.<br>
                            문의사항이 있으시면 시스템 관리자에게 연락해주세요.
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${contactEmail}`);
        return { success: true, simulated: false };
    } catch (error) {
        console.error(`❌ Email sending failed to ${contactEmail}:`, error.message);
        
        // Fall back to console logging on error
        console.log('=== VERIFICATION EMAIL (FALLBACK) ===');
        console.log(`To: ${contactEmail}`);
        console.log(`Subject: [메멘토] 사망 확인 요청`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log('=====================================');
        
        return { success: false, error: error.message, simulated: true };
    }
}

// Send death notification SMS (simulated for now)
function sendDeathNotificationSMS(userId, userPhone = null) {
    // For now, just log to console
    // TODO: Implement actual SMS service (Twilio, AWS SNS, etc.)
    console.log(`=== DEATH NOTIFICATION SMS ===`);
    console.log(`User ID: ${userId}`);
    if (userPhone) {
        console.log(`Phone: ${userPhone}`);
    }
    console.log(`Message: 🚨 사망 신고가 접수되어 72시간 후 유언 집행이 시작됩니다. 오탐지인 경우 즉시 로그인하여 '오탐지입니다' 버튼을 클릭하세요.`);
    console.log(`==============================`);
    
    return { success: true, simulated: true };
}

module.exports = {
    sendVerificationEmail,
    sendDeathNotificationSMS,
    createTransporter
};
