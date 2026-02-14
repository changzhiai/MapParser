
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'map_parser.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT
    )`, (err) => {
        if (!err) {
            // Check if email column exists (migration for existing db)
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (!err && rows) {
                    const hasEmail = rows.some(r => r.name === 'email');
                    if (!hasEmail) {
                        console.log("Migrating: Adding email column to users table...");
                        db.run("ALTER TABLE users ADD COLUMN email TEXT");
                    }
                }
            });
        }
    });

    // Create Verification Codes table
    db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT,
        expires_at INTEGER
    )`);

    // Create Trips table
    db.run(`CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        link TEXT,
        note TEXT,
        created_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

const createVerificationCode = (email, code, callback) => {
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const stmt = db.prepare("INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)");
    stmt.run(email, code, expiresAt, function (err) {
        callback(err);
    });
    stmt.finalize();
};

const getVerificationCode = (email, callback) => {
    db.get("SELECT * FROM verification_codes WHERE email = ?", [email], (err, row) => {
        callback(err, row);
    });
};

const deleteVerificationCode = (email, callback) => {
    db.run("DELETE FROM verification_codes WHERE email = ?", [email], (err) => {
        if (callback) callback(err);
    });
};

const createUser = (username, password, email, callback) => {
    const hash = password ? bcrypt.hashSync(password, 10) : null;
    const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
    stmt.run(username, hash, email, function (err) {
        callback(err, this ? this.lastID : null);
    });
    stmt.finalize();
};

const getUserByUsername = (username, callback) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        callback(err, row);
    });
};

const getUserByEmail = (email, callback) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        callback(err, row);
    });
};

const getUserById = (id, callback) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        callback(err, row);
    });
};

const verifyUser = (identifier, password, callback) => {
    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier], (err, user) => {
        if (err || !user || !user.password) {
            return callback(err, false, null);
        }
        const isValid = bcrypt.compareSync(password, user.password);
        callback(null, isValid, user);
    });
};

const updateUserPassword = (userId, newPassword, callback) => {
    const hash = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare("UPDATE users SET password = ? WHERE id = ?");
    stmt.run(hash, userId, function (err) {
        callback(err);
    });
    stmt.finalize();
};

// Trip functions

const createTrip = (userId, name, link, year, location, note, callback) => {
    const createdAt = Date.now();
    const stmt = db.prepare("INSERT INTO trips (user_id, name, link, year, location, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(userId, name, link, year, location, note, createdAt, function (err) {
        callback(err, this ? this.lastID : null);
    });
    stmt.finalize();
};

const getUserTrips = (userId, callback) => {
    db.all("SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        callback(err, rows);
    });
};

const deleteTrip = (tripId, userId, callback) => {
    db.run("DELETE FROM trips WHERE id = ? AND user_id = ?", [tripId, userId], (err) => {
        callback(err);
    });
};

const updateTrip = (tripId, userId, name, link, year, location, note, callback) => {
    const stmt = db.prepare("UPDATE trips SET name = ?, link = ?, year = ?, location = ?, note = ? WHERE id = ? AND user_id = ?");
    stmt.run(name, link, year, location, note, tripId, userId, function (err) {
        callback(err);
    });
    stmt.finalize();
};

const updateUserProfile = (userId, username, email, callback) => {
    const stmt = db.prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
    stmt.run(username, email, userId, function (err) {
        callback(err);
    });
    stmt.finalize();
};

const deleteUser = (userId, callback) => {
    // Delete trips first
    db.run("DELETE FROM trips WHERE user_id = ?", [userId], (err) => {
        if (err) return callback(err);
        // Then delete user
        db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
            callback(err);
        });
    });
};

module.exports = {
    db,
    createUser,
    getUserByUsername,
    getUserByEmail,
    getUserById,
    verifyUser,
    createTrip,
    getUserTrips,
    deleteTrip,
    updateUserPassword,
    createVerificationCode,
    getVerificationCode,
    createVerificationCode,
    getVerificationCode,
    deleteVerificationCode,
    updateUserProfile,
    deleteUser,
    updateTrip
};
