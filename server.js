const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

try {
    require('./setup-db.js');
    console.log("Database provisioning script executed successfully.");
} catch (e) {
    console.log("Note: setup-db.js handled externally:", e.message);
}

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const dbPath = path.join(__dirname, 'database', 'cafeteria.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected successfully to cafeteria database.");
        
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number INTEGER NOT NULL,
            items TEXT NOT NULL,
            pickup_time TEXT NOT NULL,
            status TEXT DEFAULT 'pending'
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS counters (
            id TEXT PRIMARY KEY,
            current_value INTEGER NOT NULL
        )`, () => {
            db.run(`INSERT OR IGNORE INTO counters (id, current_value) VALUES ('ticket_sequence', 0)`);
        });

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL, 
            name TEXT NOT NULL
        )`, () => {
            db.run(`INSERT OR IGNORE INTO users (id, password, role, name) VALUES ('12345', 'password123', 'student', 'Trayton')`);
            db.run(`INSERT OR IGNORE INTO users (id, password, role, name) VALUES ('12346', 'password123', 'student', 'Jayden')`);
            db.run(`INSERT OR IGNORE INTO users (id, password, role, name) VALUES ('99999', 'password123', 'staff', 'Canteen Supervisor')`);
        });
    }
});

app.post('/api/login', (req, res) => {
    const { userId, password } = req.body;

    db.get(`SELECT id, role, name FROM users WHERE id = ? AND password = ?`, [userId, password], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Authentication subsystem error." });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid ID or Password." });
        }
        res.json({ success: true, role: user.role, name: user.name });
    });
});

app.get('/api/menu', (req, res) => {
    db.all("SELECT * FROM menu", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/staff/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff/orders/complete', (req, res) => {
    const { orderId } = req.body;
    db.run("UPDATE orders SET status = 'completed' WHERE id = ?", [orderId], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});

app.post('/api/orders', (req, res) => {
    const { items, pickup_time } = req.body;
    if (!items || items.length === 0 || !pickup_time) {
        return res.status(400).json({ success: false, message: "Missing required order payloads." });
    }

    db.get(`SELECT current_value FROM counters WHERE id = 'ticket_sequence'`, [], (err, counterRow) => {
        if (err) return res.status(500).json({ success: false, message: "Internal tracker system error." });

        let nextTicketNumber = (counterRow ? counterRow.current_value : 0) + 1;
        if (nextTicketNumber > 99) nextTicketNumber = 1;

        db.run(`UPDATE counters SET current_value = ? WHERE id = 'ticket_sequence'`, [nextTicketNumber], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: "Failed to allocate token number." });

            const serializedItems = JSON.stringify(items);
            db.run(`INSERT INTO orders (ticket_number, items, pickup_time, status) VALUES (?, ?, ?, 'pending')`, 
                [nextTicketNumber, serializedItems, pickup_time], function (insertErr) {
                    if (insertErr) return res.status(500).json({ success: false, message: "Database execution failure." });
                    res.json({ success: true, ticketNumber: nextTicketNumber });
                }
            );
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server engine running on port ${PORT}`);
});