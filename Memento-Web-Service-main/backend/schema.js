const db = require("./db");

db.run(`
CREATE TABLE IF NOT EXISTS will_storage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    encrypted_location TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.error(err);
    else console.log("Table created.");
});