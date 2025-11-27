//backend/routes/memento.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { encrypt } = require("../encrypt");

const router = express.Router();

// Save files to 'uploads/' with original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

/**
 * POST /memento/register
 * Fields: userId, originalLocation
 * File: mementoImage
 */
router.post("/register", upload.single("mementoImage"), (req, res) => {
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });

    const userId = req.body.userId;
    const filePath = req.file.path; // full path to local file

    let encryptedJson;
    try {
        const encrypted = encrypt(req.body.originalLocation);
        encryptedJson = JSON.stringify(encrypted);
    } catch (e) {
        console.error("Encryption failed:", e);
        return res.status(500).json({ ok: false, error: "Encryption failed" });
    }

    db.run(
        `INSERT INTO memento_storage (user_id, file_path, encrypted_location)
         VALUES (?, ?, ?)`,
        [userId, filePath, encryptedJson],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ ok: false });
            }

            // Return full file path for reference (useful for emails)
            res.json({ ok: true, id: this.lastID, filePath });
        }
    );
});

module.exports = router;