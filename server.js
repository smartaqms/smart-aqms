const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Parser } = require('json2csv');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from root

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Prakash@123',
  database: 'smart_air_quality'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'smartairqualitymonitorsystem@gmail.com',
    pass: 'adrv yafl xdax xjan' // Gmail App Password
  }
});

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Signup route
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || password.length < 8) {
    return res.json({ success: false, message: 'Invalid input.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (results.length > 0) {
      return res.json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.query(
      'INSERT INTO users (email, password, alerts_enabled) VALUES (?, ?, ?)',
      [email, passwordHash, true],
      (err) => {
        if (err) {
          return res.json({ success: false, message: 'Signup failed.' });
        }
        res.json({ success: true });
      }
    );
  });
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (results.length === 0 || !bcrypt.compareSync(password, results[0].password)) {
      return res.json({ success: false, message: 'Invalid credentials.' });
    }
    req.session.user = email;
    res.json({ success: true });
  });
});

// Sensor data
app.get('/api/sensors', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching data');
    } else {
      res.json(results[0]);
    }
  });
});

// Disease prediction + email alert + logging
app.get('/api/predict', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1', (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).send('Error fetching data');
    }

    const { aqi } = results[0];
    let risk = 'Low Risk';
    let disease = 'Healthy';
    let cure = 'Maintain a healthy lifestyle and stay hydrated.';

    if (aqi > 150) {
      risk = 'High Risk';
      disease = 'Asthma, Bronchitis, COPD';
      cure = 'Avoid outdoor activities. Use N95 masks. Use inhalers or consult a doctor.';

      db.query('SELECT email FROM users WHERE alerts_enabled = TRUE', (err, users) => {
        if (!err && users.length > 0) {
          users.forEach(user => {
            const mailOptions = {
              from: 'smartairqualitymonitorsystem@gmail.com',
              to: user.email,
              subject: '⚠️ Air Quality Alert: High Risk Detected',
              html: `
                <div style="font-family:Segoe UI, sans-serif; padding:20px;">
                  <h2 style="color:#e53935;">Air Quality Alert</h2>
                  <p>Dear user,</p>
                  <p><strong>Air Quality Index:</strong> ${aqi}</p>
                  <p><strong>Risk Level:</strong> <span style="color:#d32f2f;">${risk}</span></p>
                  <p><strong>Possible Diseases:</strong> ${disease}</p>
                  <p><strong>Recommended Precautions:</strong> ${cure}</p>
                  <p style="margin-top:20px;">Stay safe,<br><strong>Smart AQMS Team</strong></p>
                </div>
              `
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error(`Email failed for ${user.email}:`, error);
              } else {
                console.log(`Email sent to ${user.email}:`, info.response);
              }
            });

            db.query(
              'INSERT INTO email_alerts (email, aqi, risk_level, disease, cure) VALUES (?, ?, ?, ?, ?)',
              [user.email, aqi, risk, disease, cure]
            );
          });
        }
      });
    }

    res.json({ risk, disease, cure });
  });
});

// Historical data
app.get('/api/history', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 20', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching historical data');
    } else {
      res.json(results.reverse());
    }
  });
});

// CSV export
app.get('/api/export', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 20', (err, results) => {
    if (err) {
      return res.status(500).send('Error generating CSV');
    }

    const fields = ['timestamp', 'aqi', 'humidity', 'temperature', 'co2_ppm', 'no2_ppm'];
    const parser = new Parser({ fields });
    const csv = parser.parse(results.reverse());

    res.header('Content-Type', 'text/csv');
    res.attachment('sensor_data.csv');
    res.send(csv);
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});