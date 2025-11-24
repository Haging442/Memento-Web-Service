const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Death notification page
router.get('/', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }
    
    // Get pending death report for current user
    db.get(
        `SELECT dr.*, u.name as deceased_name
         FROM death_reports dr
         JOIN users u ON dr.target_user_id = u.id
         WHERE dr.target_user_id = ? AND dr.status = 'CONFIRMED'
         AND datetime(dr.resolved_at, '+72 hours') > datetime('now')`,
        [req.session.userId],
        (err, report) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/dashboard');
            }
            
            if (!report) {
                return res.redirect('/dashboard');
            }
            
            // Calculate remaining time
            const resolvedTime = new Date(report.resolved_at);
            const executionTime = new Date(resolvedTime.getTime() + (72 * 60 * 60 * 1000));
            const timeRemaining = executionTime - new Date();
            const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
            
            // Get confirmations info
            db.all(
                `SELECT dv.status, tc.name as contact_name
                 FROM death_verifications dv
                 JOIN trusted_contacts tc ON dv.contact_id = tc.id
                 WHERE dv.death_report_id = ?`,
                [report.id],
                (err, verifications) => {
                    if (err) {
                        console.error('Database error:', err);
                        verifications = [];
                    }
                    
                    // Format confirmations for template
                    const confirmations = verifications.map(v => ({
                        contactName: v.contact_name,
                        confirmed: v.status === 'CONFIRMED',
                        verifiedAt: new Date().toISOString()
                    }));
                    
                    res.render('death-notification', {
                        title: '사망 신고 알림',
                        report: {
                            ...report,
                            executionStartTime: executionTime.toISOString(),
                            confirmations: confirmations
                        },
                        hoursRemaining,
                        user: req.session.user
                    });
                }
            );
        }
    );
});

// POST: Cancel death report (false positive)
router.post('/cancel', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    // Find pending death report for current user
    db.get(
        `SELECT id FROM death_reports 
         WHERE target_user_id = ? AND status = 'CONFIRMED'
         AND datetime(resolved_at, '+72 hours') > datetime('now')`,
        [req.session.userId],
        (err, report) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (!report) {
                return res.status(404).json({ success: false, message: '취소할 신고가 없습니다.' });
            }
            
            // Cancel the death report
            db.run(
                `UPDATE death_reports 
                 SET status = 'CANCELED',
                     admin_note = COALESCE(admin_note, '') || '\n[USER] 본인이 직접 취소함 (' || datetime('now') || ')'
                 WHERE id = ?`,
                [report.id],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    
                    console.log(`[DEATH REPORT CANCELED] Report ID: ${report.id}, User ID: ${req.session.userId}`);
                    
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
