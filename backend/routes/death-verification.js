const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Import our new services
const { sendVerificationEmail, sendDeathNotificationSMS } = require('../services/email-service');
const { processDeathCertificate } = require('../services/pdf-ocr-service');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'death-certificates');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const upload = multer({
    dest: uploadsDir,
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

// Helper function to generate token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// GET: Death report form (public access)
router.get('/report', (req, res) => {
    res.render('death-report', {
        title: '사망 신고',
        message: req.query.message || null
    });
});

// POST: Submit death report with OCR processing
router.post('/report', upload.single('deathCertificate'), async (req, res) => {
    const { reporterName, reporterEmail, reporterPhone, deceasedName, deceasedId, additionalInfo } = req.body;
    
    // Validation
    if (!reporterName || !reporterEmail || !deceasedName || !deceasedId) {
        return res.redirect('/death-verification/report?message=' + encodeURIComponent('필수 정보를 모두 입력해주세요.'));
    }
    
    // Find user by name (simplified matching)
    db.get(
        `SELECT id, username, name FROM users WHERE name = ?`,
        [deceasedName],
        async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
            }
            
            if (!user) {
                return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자를 찾을 수 없습니다.'));
            }
            
            let ocrResults = null;
            let ocrVerification = null;
            
            // Process death certificate if uploaded
            if (req.file) {
                console.log('📋 Processing uploaded death certificate...');
                try {
                    const ocrResult = await processDeathCertificate(
                        req.file.path, 
                        deceasedName, 
                        deceasedId
                    );
                    
                    ocrResults = ocrResult.extractedInfo;
                    ocrVerification = ocrResult.verification;
                    
                    // Log OCR results
                    console.log('🔍 OCR Processing Results:');
                    console.log('- Simulated:', ocrResult.ocrResult?.simulated || false);
                    console.log('- Extracted Info:', ocrResults);
                    console.log('- Verification:', ocrVerification);
                    
                } catch (ocrError) {
                    console.error('OCR processing failed:', ocrError);
                    // Continue without OCR results
                }
            }
            
            // Get trusted contacts for this user
            db.all(
                `SELECT id, name, relation, email, phone FROM trusted_contacts WHERE user_id = ?`,
                [user.id],
                async (err, contacts) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
                    }
                    
                    if (!contacts || contacts.length < 2) {
                        return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자의 신뢰 연락처가 부족합니다.'));
                    }
                    
                    // Create death report with OCR results
                    const reportMessage = additionalInfo || '';
                    const ocrInfo = ocrResults ? `\n[OCR 추출 정보]\n이름: ${ocrResults.name || 'N/A'}\n주민번호: ${ocrResults.idNumber || 'N/A'}\n사망일자: ${ocrResults.deathDate || 'N/A'}` : '';
                    const verificationInfo = ocrVerification ? `\n[검증 결과]\n이름 일치: ${ocrVerification.nameMatch ? 'O' : 'X'}\nID 일치: ${ocrVerification.idMatch ? 'O' : 'X'}\n신뢰도: ${ocrVerification.confidence}` : '';
                    
                    db.run(
                        `INSERT INTO death_reports (target_user_id, reporter_name, reporter_contact, relation, message, status)
                         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
                        [
                            user.id,
                            reporterName,
                            reporterEmail + (reporterPhone ? ` / ${reporterPhone}` : ''),
                            '신고자', // Default relation
                            reportMessage + ocrInfo + verificationInfo
                        ],
                        async function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
                            }
                            
                            const reportId = this.lastID;
                            
                            // Create verification entries and send emails to trusted contacts
                            let completedCount = 0;
                            const totalContacts = contacts.length;
                            
                            for (const contact of contacts) {
                                const token = generateToken();
                                
                                // Create verification entry
                                db.run(
                                    `INSERT INTO death_verifications (death_report_id, contact_id, token, status)
                                     VALUES (?, ?, ?, 'PENDING')`,
                                    [reportId, contact.id, token],
                                    async (err) => {
                                        if (err) {
                                            console.error('Verification creation error:', err);
                                        } else {
                                            // Send verification email
                                            const verificationUrl = `${req.protocol}://${req.get('host')}/death-verification/verify/${token}`;
                                            
                                            try {
                                                const emailResult = await sendVerificationEmail(
                                                    contact.email,
                                                    contact.name,
                                                    verificationUrl,
                                                    {
                                                        deceasedName,
                                                        reporterName,
                                                        reporterEmail,
                                                        additionalInfo: additionalInfo || '',
                                                        ocrResults,
                                                        ocrVerification
                                                    },
                                                    req
                                                );
                                                
                                                if (emailResult.simulated) {
                                                    console.log('📧 Email simulated for:', contact.email);
                                                } else {
                                                    console.log('✅ Email sent successfully to:', contact.email);
                                                }
                                                
                                            } catch (emailError) {
                                                console.error('Email sending error:', emailError);
                                            }
                                        }
                                        
                                        completedCount++;
                                        if (completedCount === totalContacts) {
                                            // All verification entries created and emails sent
                                            res.render('death-report-success', {
                                                title: '사망 신고 접수 완료',
                                                reportId: reportId,
                                                contactCount: totalContacts,
                                                ocrProcessed: !!req.file,
                                                ocrResults,
                                                ocrVerification
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            );
        }
    );
});

// GET: Verification page
router.get('/verify/:token', (req, res) => {
    const { token } = req.params;
    
    db.get(
        `SELECT dv.*, dr.*, tc.name as contact_name, tc.email as contact_email,
                u.name as deceased_name
         FROM death_verifications dv
         JOIN death_reports dr ON dv.death_report_id = dr.id
         JOIN trusted_contacts tc ON dv.contact_id = tc.id
         JOIN users u ON dr.target_user_id = u.id
         WHERE dv.token = ?`,
        [token],
        (err, verification) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('verification-error', {
                    title: '데이터베이스 오류',
                    message: '데이터베이스 오류가 발생했습니다.'
                });
            }
            
            if (!verification) {
                return res.render('verification-error', {
                    title: '인증 오류',
                    message: '유효하지 않은 인증 링크입니다.'
                });
            }
            
            if (verification.status !== 'PENDING') {
                return res.render('verification-error', {
                    title: '이미 처리됨',
                    message: '이미 확인된 요청입니다.'
                });
            }
            
            // Check if token is expired (7 days)
            const createdAt = new Date(verification.created_at);
            const expiryTime = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000));
            
            if (new Date() > expiryTime) {
                return res.render('verification-error', {
                    title: '인증 만료',
                    message: '인증 링크가 만료되었습니다.'
                });
            }
            
            res.render('death-verification', {
                title: '사망 확인',
                token,
                report: {
                    deceasedName: verification.deceased_name,
                    reporterName: verification.reporter_name,
                    reporterEmail: verification.reporter_contact.split(' / ')[0],
                    additionalInfo: verification.message,
                    createdAt: verification.created_at,
                    certificateFile: !!verification.message.includes('[OCR 추출 정보]')
                },
                contact: {
                    name: verification.contact_name,
                    email: verification.contact_email
                }
            });
        }
    );
});

// POST: Confirm verification
router.post('/verify/:token', (req, res) => {
    const { token } = req.params;
    const { confirmed } = req.body;
    
    // Get verification info
    db.get(
        `SELECT dv.*, dr.target_user_id
         FROM death_verifications dv
         JOIN death_reports dr ON dv.death_report_id = dr.id
         WHERE dv.token = ? AND dv.status = 'PENDING'`,
        [token],
        (err, verification) => {
            if (err || !verification) {
                return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다.' });
            }
            
            const newStatus = confirmed === 'true' ? 'CONFIRMED' : 'REJECTED';
            
            // Update verification status
            db.run(
                `UPDATE death_verifications 
                 SET status = ?, verified_at = CURRENT_TIMESTAMP 
                 WHERE token = ?`,
                [newStatus, token],
                (err) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: '데이터베이스 오류' });
                    }
                    
                    // Check if we have enough confirmations
                    db.all(
                        `SELECT status FROM death_verifications WHERE death_report_id = ?`,
                        [verification.death_report_id],
                        (err, allVerifications) => {
                            if (err) {
                                return res.status(500).json({ success: false, message: '데이터베이스 오류' });
                            }
                            
                            const confirmedCount = allVerifications.filter(v => v.status === 'CONFIRMED').length;
                            const totalResponses = allVerifications.filter(v => v.status !== 'PENDING').length;
                            const totalRequired = allVerifications.length;
                            
                            // Need at least 2 confirmations
                            if (confirmedCount >= 2) {
                                // Update death report to CONFIRMED
                                db.run(
                                    `UPDATE death_reports 
                                     SET status = 'CONFIRMED', resolved_at = CURRENT_TIMESTAMP
                                     WHERE id = ?`,
                                    [verification.death_report_id],
                                    (err) => {
                                        if (err) {
                                            console.error('Failed to update death report:', err);
                                        } else {
                                            // Send notification to user
                                            console.log('📱 Sending death notification to user...');
                                            sendDeathNotificationSMS(verification.target_user_id);
                                        }
                                    }
                                );
                            } else if (totalResponses >= totalRequired && confirmedCount < 2) {
                                // All responded but not enough confirmations
                                db.run(
                                    `UPDATE death_reports 
                                     SET status = 'REJECTED', resolved_at = CURRENT_TIMESTAMP
                                     WHERE id = ?`,
                                    [verification.death_report_id]
                                );
                            }
                            
                            res.json({ 
                                success: true, 
                                message: confirmed === 'true' ? '사망 확인이 완료되었습니다.' : '확인이 거부되었습니다.',
                                redirect: '/death-verification/verify/' + token + '/complete'
                            });
                        }
                    );
                }
            );
        }
    );
});

// GET: Verification complete page
router.get('/verify/:token/complete', (req, res) => {
    const { token } = req.params;
    
    db.get(
        `SELECT dv.status, tc.name as contact_name
         FROM death_verifications dv
         JOIN trusted_contacts tc ON dv.contact_id = tc.id
         WHERE dv.token = ?`,
        [token],
        (err, verification) => {
            if (err || !verification) {
                return res.render('verification-error', {
                    title: '오류',
                    message: '유효하지 않은 요청입니다.'
                });
            }
            
            res.render('verification-complete', {
                title: '확인 완료',
                confirmed: verification.status === 'CONFIRMED',
                contactName: verification.contact_name
            });
        }
    );
});

// GET: Admin dashboard for death reports
router.get('/admin', (req, res) => {
    if (!req.session?.isAdmin) {
        return res.status(403).send('관리자 권한이 필요합니다.');
    }
    
    db.all(
        `SELECT dr.*, u.name as deceased_name, u.username as deceased_username
         FROM death_reports dr
         JOIN users u ON dr.target_user_id = u.id
         ORDER BY dr.created_at DESC`,
        (err, reports) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('데이터베이스 오류');
            }
            
            res.render('death-admin', {
                title: '사망 신고 관리',
                reports: reports || []
            });
        }
    );
});

module.exports = router;
