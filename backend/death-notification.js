const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const deathReportsPath = path.join(__dirname, 'data', 'death-reports.json');

// Helper function to read death reports
function readDeathReports() {
    try {
        const data = fs.readFileSync(deathReportsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Helper function to write death reports
function writeDeathReports(data) {
    fs.writeFileSync(deathReportsPath, JSON.stringify(data, null, 2));
}

// GET: Death notification page
router.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const deathReports = readDeathReports();
    const pendingReport = Object.values(deathReports).find(report => 
        report.deceasedUserId === req.session.userId && 
        report.status === 'confirmed' && 
        new Date() < new Date(report.executionStartTime)
    );
    
    if (!pendingReport) {
        return res.redirect('/dashboard');
    }
    
    const timeRemaining = new Date(pendingReport.executionStartTime) - new Date();
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    
    res.render('death-notification', {
        title: '사망 신고 알림',
        report: pendingReport,
        hoursRemaining,
        user: req.session.user
    });
});

// POST: Cancel death report (false positive)
router.post('/cancel', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    const deathReports = readDeathReports();
    const reportKey = Object.keys(deathReports).find(key => {
        const report = deathReports[key];
        return report.deceasedUserId === req.session.userId && 
               report.status === 'confirmed' && 
               new Date() < new Date(report.executionStartTime);
    });
    
    if (!reportKey) {
        return res.status(404).json({ success: false, message: '취소할 신고가 없습니다.' });
    }
    
    const report = deathReports[reportKey];
    report.status = 'cancelled';
    report.cancelledAt = new Date().toISOString();
    report.cancelledBy = req.session.userId;
    
    writeDeathReports(deathReports);
    
    res.json({ 
        success: true, 
        message: '사망 신고가 성공적으로 취소되었습니다.' 
    });
});

module.exports = router;
