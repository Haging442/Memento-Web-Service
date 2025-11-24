const db = require('../db');

// Death notification middleware
const deathNotificationMiddleware = (req, res, next) => {
    // Only check for logged-in users
    if (!req.session?.userId) {
        return next();
    }
    
    // Skip check for death notification related routes
    if (req.path.includes('/death-notification')) {
        return next();
    }
    
    try {
        // Check for pending death notification for this user
        db.get(
            `SELECT dr.*, u.name as deceased_name
             FROM death_reports dr
             JOIN users u ON dr.target_user_id = u.id
             WHERE dr.target_user_id = ? AND dr.status = 'CONFIRMED'
             AND datetime(dr.resolved_at, '+72 hours') > datetime('now')`,
            [req.session.userId],
            (err, report) => {
                if (err) {
                    console.error('Death notification middleware error:', err);
                    return next();
                }
                
                // Add death notification info to request
                req.deathNotification = {
                    hasPending: !!report,
                    report: report
                };
                
                // If there's a pending death notification and user is accessing main pages,
                // redirect to death notification page
                if (report && !req.path.includes('/logout')) {
                    return res.redirect('/death-notification');
                }
                
                next();
            }
        );
        
    } catch (error) {
        console.error('Death notification middleware error:', error);
        next();
    }
};

module.exports = deathNotificationMiddleware;
