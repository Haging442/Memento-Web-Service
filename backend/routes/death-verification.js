const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Configure multer for file upload
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads', 'death-certificates'),
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

// Helper function to send email (simulated in development)
function sendVerificationEmail(contactEmail, contactName, verificationUrl, reportData) {
    // In development, log to console
    console.log('=== VERIFICATION EMAIL ===');
    console.log(`To: ${contactEmail}`);
    console.log(`Subject: [메멘토] 사망 확인 요청`);
    console.log(`Contact: ${contactName}`);
    console.log(`Deceased: ${reportData.reporterName}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('=========================');
}

// Helper function to send SMS notification (simulated)
function sendDeathNotification(userId) {
    console.log(`=== DEATH NOTIFICATION SMS ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Message: 사망 신고가 접수되어 72시간 후 유언 집행이 시작됩니다. 오탐지인 경우 즉시 로그인하여 '오탐지입니다' 버튼을 클릭하세요.`);
    console.log(`==============================`);
}

// GET: Death report form (public access)
router.get('/report', (req, res) => {
    res.render('death-report', {
        title: '사망 신고',
        message: req.query.message || null
    });
});

// POST: Submit death report
router.post('/report', upload.single('deathCertificate'), (req, res) => {
    const { reporterName, reporterEmail, reporterPhone, deceasedName, deceasedId, additionalInfo } = req.body;
    
    // Validation
    if (!reporterName || !reporterEmail || !deceasedName || !deceasedId) {
        return res.redirect('/death-verification/report?message=' + encodeURIComponent('필수 정보를 모두 입력해주세요.'));
    }
    
    // Find user by name (simplified matching)
    db.get(
        `SELECT id, username, name FROM users WHERE name = ?`,
        [deceasedName],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
            }
            
            if (!user) {
                return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자를 찾을 수 없습니다.'));
            }
            
            // Get trusted contacts for this user
            db.all(
                `SELECT id, name, relation, email, phone FROM trusted_contacts WHERE user_id = ?`,
                [user.id],
                (err, contacts) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
                    }
                    
                    if (!contacts || contacts.length < 2) {
                        return res.redirect('/death-verification/report?message=' + encodeURIComponent('해당 사용자의 신뢰 연락처가 부족합니다.'));
                    }
                    
                    // Create death report
                    db.run(
                        `INSERT INTO death_reports (target_user_id, reporter_name, reporter_contact, relation, message, status)
                         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
                        [
                            user.id,
                            reporterName,
                            reporterEmail + (reporterPhone ? ` / ${reporterPhone}` : ''),
                            '신고자', // Default relation
                            additionalInfo || ''
                        ],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.redirect('/death-verification/report?message=' + encodeURIComponent('데이터베이스 오류가 발생했습니다.'));
                            }
                            
                            const reportId = this.lastID;
                            
                            // Create verification entries for each trusted contact
                            let completedCount = 0;
                            const totalContacts = contacts.length;
                            
                            contacts.forEach(contact => {
                                const token = generateToken();
                                
                                db.run(
                                    `INSERT INTO death_verifications (death_report_id, contact_id, token, status)
                                     VALUES (?, ?, ?, 'PENDING')`,
                                    [reportId, contact.id, token],
                                    (err) => {
                                        if (err) {
                                            console.error('Verification creation error:', err);
                                        } else {
                                            // Send verification email
                                            const verificationUrl = `${req.protocol}://${req.get('host')}/death-verification/verify/${token}`;
                                            sendVerificationEmail(contact.email, contact.name, verificationUrl, {
                                                reporterName: deceasedName,
                                                reporterEmail,
                                                additionalInfo
                                            });
                                        }
                                        
                                        completedCount++;
                                        if (completedCount === totalContacts) {
                                            // All verification entries created
                                            res.render('death-report-success', {
                                                title: '사망 신고 접수 완료',
                                                reportId: reportId,
                                                contactCount: totalContacts
                                            });
                                        }
                                    }
                                );
                            });
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
                    createdAt: verification.created_at
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
                                            sendDeathNotification(verification.target_user_id);
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

// GET: Check if user has pending death notifications
router.get('/check-death-notification/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.get(
        `SELECT * FROM death_reports 
         WHERE target_user_id = ? AND status = 'CONFIRMED' 
         AND datetime(resolved_at, '+72 hours') > datetime('now')`,
        [userId],
        (err, report) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            res.json({
                hasPendingReport: !!report,
                report: report
            });
        }
    );
});

// POST: Cancel death report (false positive)
router.post('/cancel-death-report', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    db.get(
        `SELECT id FROM death_reports 
         WHERE target_user_id = ? AND status = 'CONFIRMED'
         AND datetime(resolved_at, '+72 hours') > datetime('now')`,
        [req.session.userId],
        (err, report) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (!report) {
                return res.status(404).json({ success: false, message: '취소할 신고가 없습니다.' });
            }
            
            db.run(
                `UPDATE death_reports 
                 SET status = 'CANCELED', 
                     admin_note = COALESCE(admin_note, '') || '\n[USER] 본인이 직접 취소함'
                 WHERE id = ?`,
                [report.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: '사망 신고가 성공적으로 취소되었습니다.' 
                    });
                }
            );
        }
    );
});

module.exports = router;
