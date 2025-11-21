// db.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./memento.db', (err) => {
  if (err)
    console.error('DB Error: ', err.message);
  else
    console.log('SQLite DB connected.');
});

module.exports = db;
