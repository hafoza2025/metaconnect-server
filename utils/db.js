const mysql = require('mysql2');
require('dotenv').config();

// إنشاء Pool لضمان عدم انهيار السيرفر مع كثرة الطلبات
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// تصدير نسخة تدعم الـ Promises لاستخدام async/await
module.exports = pool.promise();
