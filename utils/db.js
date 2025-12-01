const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000, // TiDB يستخدم 4000 غالباً
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 👇👇👇 هذا الجزء ضروري جداً للاتصال بالسحابة 👇👇👇
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

// تصدير نسخة تدعم الـ Promises (وهذا ما يستخدمه index.js عندك)
module.exports = pool.promise();
