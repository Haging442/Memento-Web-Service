const express = require("express");
const db = require("../db");
const { sendWillNotification } = require("./email"); // reuse for emails
const router = express.Router();

// Middleware: example authentication
function authMiddleware(req, res, next) {
    // For simplicity, assume userId in req.header('x-user-id')
    const userId = req.header("x-user-id");
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
    req.userId = userId;
    next();
}

// GET /time-capsules - list all capsules for logged-in user
router.get("/", authMiddleware, (req, res) => {
    db.all(
        `SELECT * FROM time_capsules WHERE user_id = ?`,
        [req.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ ok: false, error: err.message });
            res.json({ ok: true, capsules: rows });
        }
    );
});

// POST /time-capsules/open/:id
// Opens a time capsule. If private, sends emails to beneficiary
router.post("/open/:id", authMiddleware, (req, res) => {
    const capsuleId = req.params.id;

    db.get(
        `SELECT * FROM time_capsules WHERE id = ? AND user_id = ?`,
        [capsuleId, req.userId],
        async (err, capsule) => {
            if (err) return res.status(500).json({ ok: false, error: err.message });
            if (!capsule) return res.status(404).json({ ok: false, error: "Capsule not found" });

            // If release_type is PRIVATE, send notification to beneficiary
            if (capsule.release_type === "PRIVATE" && capsule.beneficiary_email) {
                try {
                    await sendTimeCapsuleNotification(
                        capsule.beneficiary_email,
                        capsule.user_id,
                        capsule.title
                    );
                    console.log(`[EMAIL] Sent time capsule notification to ${capsule.beneficiary_email}`);
                } catch (e) {
                    console.error("[EMAIL] Failed to send time capsule notification:", e);
                }
            }

            // Return content (encrypted key or file_url as stored)
            res.json({ ok: true, capsule });
        }
    );
});

module.exports = router;
