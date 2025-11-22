const fs = require('fs');
const path = require('path');

// Death notification middleware
const deathNotificationMiddleware = (req, res, next) => {
    // Only check for logged-in users
    if (!req.session.userId) {
        return next();
    }
    
    try {
        const deathReportsPath = path.join(__dirname, 'data', 'death-reports.json');
        
        if (!fs.existsSync(deathReportsPath)) {
            return next();
        }
        
        const deathReports = JSON.parse(fs.readFileSync(deathReportsPath, 'utf8'));
        
        // Check for pending death notification for this user
        const pendingReport = Object.values(deathReports).find(report => 
            report.deceasedUserId === req.session.userId && 
            report.status === 'confirmed' && 
            new Date() < new Date(report.executionStartTime)
        );
        
        // Add death notification info to request
        req.deathNotification = {
            hasPending: !!pendingReport,
            report: pendingReport
        };
        
        // If there's a pending death notification and user is accessing main pages,
        // redirect to death notification page
        if (pendingReport && !req.path.includes('/death-notification')) {
            return res.redirect('/death-notification');
        }
        
    } catch (error) {
        console.error('Death notification middleware error:', error);
    }
    
    next();
};

module.exports = deathNotificationMiddleware;
