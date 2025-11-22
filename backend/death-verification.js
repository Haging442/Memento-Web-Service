const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure multer for file upload
const upload = multer({
    dest: path.join(__dirname, 'uploads', 'death-certificates'),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('PDF 파일만 업로드 가능합니다.'));
        }
    }
});

// Data file paths
const deathReportsPath = path.join(__dirname, 'data', 'death-reports.json');
const verificationTokensPath = path.join(__dirname, 'data', 'verification-tokens.json');
const trustedContactsPath = path.join(__dirname, 'data', 'trusted-contacts.json');
const usersPath = path.join(__dirname, 'data', 'users.json');

// Ensure data directories exist
const dataDir = path.dirname(deathReportsPath);
const uploadsDir = path.join(__dirname, 'uploads', 'death-certificates');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize data files
[deathReportsPath, verificationTokensPath].forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
});

// Helper functions
function readData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Email configuration (you'll need to configure this with real SMTP settings)
const transporter = nodemailer.createTransporter({
    // Configure with your email provider
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

// GET: Death report form (public access)
router.get('/report', (req, res) => {
    res.render('death-report', {
        title: '사망 신고',
        message: req.query.message || null
    });
});

// POST: Submit death report
router.post('/report', upload.single('deathCertificate'), async (req, res) => {
    try {
        const { reporterName, reporterEmail, reporterPhone, deceasedName, deceasedId, additionalInfo } = req.body;
        
        // Validation
        if (!reporterName || !reporterEmail || !deceasedName || !deceasedId) {
            return res.redirect('/death-verification/report?message=' + encodeURIComponent('필수 정보를 모두 입력해주세요.'));
        }
        
        // Find user by name and partial ID
        const users = readData(usersPath);
        const user = Object.values(users).find(u => {
            // Simple matching - in real implementation, you'd want more secure verification
            const partialId = deceasedId.replace(/[*-]/g, ''); // Remove masking characters
            return u.name === deceasedName && u.id && u.id.includes(partialId);
        });
        
        if (!user) {
            return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자를 찾을 수 없습니다.'));
        }
        
        // Get trusted contacts
        const trustedContacts = readData(trustedContactsPath);
        const userContacts = trustedContacts[user.userId] || [];
        
        if (userContacts.length < 2) {
            return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자의 신뢰 연락처가 부족합니다.'));
        }
        
        const reportId = Date.now().toString();
        const deathReports = readData(deathReportsPath);
        
        // Store report
        deathReports[reportId] = {
            id: reportId,
            reporterName,
            reporterEmail,
            reporterPhone: reporterPhone || null,
            deceasedName,
            deceasedId,
            deceasedUserId: user.userId,
            additionalInfo,
            certificateFile: req.file ? req.file.filename : null,
            status: 'pending', // pending, verified, rejected, expired
            createdAt: new Date().toISOString(),
            confirmations: []
        };
        
        writeData(deathReportsPath, deathReports);
        
        // Send verification emails to trusted contacts
        await sendVerificationEmails(reportId, userContacts);
        
        res.render('death-report-success', {
            title: '사망 신고 접수 완료',
            reportId: reportId,
            contactCount: userContacts.length
        });
        
    } catch (error) {
        console.error('Death report error:', error);
        res.redirect('/death-verification/report?message=' + encodeURIComponent('오류가 발생했습니다.'));
    }
});

// Send verification emails to trusted contacts
async function sendVerificationEmails(reportId, trustedContacts) {
    const deathReports = readData(deathReportsPath);
    const report = deathReports[reportId];
    
    for (const contact of trustedContacts) {
        const token = generateToken();
        const verificationTokens = readData(verificationTokensPath);
        
        verificationTokens[token] = {
            reportId,
            contactEmail: contact.email,
            contactName: contact.name,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            verified: false
        };
        
        writeData(verificationTokensPath, verificationTokens);
        
        // Create verification URL
        const verificationUrl = `${req.protocol}://${req.get('host')}/death-verification/verify/${token}`;
        
        // Send email (in development, this might just log the URL)
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@memento.com',
            to: contact.email,
            subject: '[메멘토] 사망 확인 요청',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">메멘토 사망 확인 요청</h2>
                    <p>안녕하세요, ${contact.name}님</p>
                    <p><strong>${report.deceasedName}</strong>님의 사망 신고가 접수되었습니다.</p>
                    <p>귀하는 해당 사용자의 신뢰 연락처로 등록되어 있어, 사망 확인이 필요합니다.</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4>신고 정보:</h4>
                        <p><strong>신고자:</strong> ${report.reporterName}</p>
                        <p><strong>신고자 이메일:</strong> ${report.reporterEmail}</p>
                        <p><strong>고인:</strong> ${report.deceasedName}</p>
                    </div>
                    
                    <p><strong>※ 이것이 정확한 사망 신고라면, 아래 링크를 클릭하여 확인해주세요:</strong></p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                            사망 확인하기
                        </a>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <p><strong>주의사항:</strong></p>
                        <ul>
                            <li>이 링크는 7일 후 만료됩니다.</li>
                            <li>신뢰 연락처 2명 모두 확인해야 처리가 시작됩니다.</li>
                            <li>확인 후 72시간 대기 후 유언 집행이 시작됩니다.</li>
                        </ul>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
                        이 이메일은 메멘토 사망 확인 시스템에서 자동 발송되었습니다.
                    </p>
                </div>
            `
        };
        
        // In development, log instead of sending
        if (process.env.NODE_ENV === 'development') {
            console.log('=== VERIFICATION EMAIL ===');
            console.log(`To: ${contact.email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log('=========================');
        } else {
            await transporter.sendMail(mailOptions);
        }
    }
}

// GET: Verification page
router.get('/verify/:token', (req, res) => {
    const { token } = req.params;
    const verificationTokens = readData(verificationTokensPath);
    const tokenData = verificationTokens[token];
    
    if (!tokenData) {
        return res.render('verification-error', {
            title: '인증 오류',
            message: '유효하지 않은 인증 링크입니다.'
        });
    }
    
    if (new Date() > new Date(tokenData.expiresAt)) {
        return res.render('verification-error', {
            title: '인증 만료',
            message: '인증 링크가 만료되었습니다.'
        });
    }
    
    if (tokenData.verified) {
        return res.render('verification-error', {
            title: '이미 처리됨',
            message: '이미 확인된 요청입니다.'
        });
    }
    
    const deathReports = readData(deathReportsPath);
    const report = deathReports[tokenData.reportId];
    
    res.render('death-verification', {
        title: '사망 확인',
        token,
        report,
        contact: {
            name: tokenData.contactName,
            email: tokenData.contactEmail
        }
    });
});

// POST: Confirm verification
router.post('/verify/:token', (req, res) => {
    const { token } = req.params;
    const { confirmed } = req.body;
    
    const verificationTokens = readData(verificationTokensPath);
    const tokenData = verificationTokens[token];
    
    if (!tokenData || tokenData.verified) {
        return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다.' });
    }
    
    // Mark as verified
    tokenData.verified = true;
    tokenData.verifiedAt = new Date().toISOString();
    tokenData.confirmation = confirmed === 'true';
    writeData(verificationTokensPath, verificationTokens);
    
    // Update death report
    const deathReports = readData(deathReportsPath);
    const report = deathReports[tokenData.reportId];
    
    report.confirmations.push({
        contactName: tokenData.contactName,
        contactEmail: tokenData.contactEmail,
        confirmed: confirmed === 'true',
        verifiedAt: new Date().toISOString()
    });
    
    // Check if we have enough confirmations
    const confirmedCount = report.confirmations.filter(c => c.confirmed).length;
    const totalRequired = 2; // Minimum required confirmations
    
    if (confirmedCount >= totalRequired) {
        report.status = 'confirmed';
        report.confirmedAt = new Date().toISOString();
        report.executionStartTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours later
        
        // Send SMS to the user (simulated)
        sendDeathNotificationToUser(report.deceasedUserId);
    } else if (report.confirmations.length >= totalRequired && confirmedCount < totalRequired) {
        // If we have enough responses but not enough confirmations
        report.status = 'rejected';
    }
    
    writeData(deathReportsPath, report);
    
    res.json({ 
        success: true, 
        message: confirmed === 'true' ? '사망 확인이 완료되었습니다.' : '확인이 거부되었습니다.',
        redirect: '/death-verification/verify/' + token + '/complete'
    });
});

// Simulate sending SMS to user
function sendDeathNotificationToUser(userId) {
    console.log(`=== DEATH NOTIFICATION SMS ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Message: 사망 신고가 접수되어 72시간 후 유언 집행이 시작됩니다. 오탐지인 경우 즉시 로그인하여 '오탐지입니다' 버튼을 클릭하세요.`);
    console.log(`==============================`);
}

// GET: Verification complete page
router.get('/verify/:token/complete', (req, res) => {
    const { token } = req.params;
    const verificationTokens = readData(verificationTokensPath);
    const tokenData = verificationTokens[token];
    
    if (!tokenData) {
        return res.render('verification-error', {
            title: '오류',
            message: '유효하지 않은 요청입니다.'
        });
    }
    
    res.render('verification-complete', {
        title: '확인 완료',
        confirmed: tokenData.confirmation,
        contactName: tokenData.contactName
    });
});

// GET: Admin dashboard for death reports
router.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).send('관리자 권한이 필요합니다.');
    }
    
    const deathReports = readData(deathReportsPath);
    const reports = Object.values(deathReports).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.render('death-admin', {
        title: '사망 신고 관리',
        reports
    });
});

// GET: Check if user has pending death notifications
router.get('/check-death-notification/:userId', (req, res) => {
    // This should be called when user logs in
    const { userId } = req.params;
    const deathReports = readData(deathReportsPath);
    
    const pendingReport = Object.values(deathReports).find(report => 
        report.deceasedUserId === userId && 
        report.status === 'confirmed' && 
        new Date() < new Date(report.executionStartTime)
    );
    
    res.json({
        hasPendingReport: !!pendingReport,
        report: pendingReport
    });
});

// POST: Cancel death report (false positive)
router.post('/cancel-death-report', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    const deathReports = readData(deathReportsPath);
    const report = Object.values(deathReports).find(report => 
        report.deceasedUserId === req.session.userId && 
        report.status === 'confirmed' && 
        new Date() < new Date(report.executionStartTime)
    );
    
    if (!report) {
        return res.status(404).json({ success: false, message: '취소할 신고가 없습니다.' });
    }
    
    report.status = 'cancelled';
    report.cancelledAt = new Date().toISOString();
    report.cancelledBy = req.session.userId;
    
    writeData(deathReportsPath, deathReports);
    
    res.json({ 
        success: true, 
        message: '사망 신고가 성공적으로 취소되었습니다.' 
    });
});

module.exports = router;
