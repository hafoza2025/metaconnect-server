require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');

// إنشاء الاتصال بقاعدة البيانات السحابية (TiDB)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 4000,
    ssl: { rejectUnauthorized: true }, // ضروري جداً للسحابة
    waitForConnections: true,
    connectionLimit: 5
});

// تعريف المتغير db لكي يعمل باقي الكود
const db = pool.promise();

const egyptHandler = require('./services/egyptHandler');
const saudiHandler = require('./services/saudiHandler');

const app = express();

// --- إعدادات رفع الصور (تم التعطيل مؤقتاً لتوافق Vercel) ---
const upload = (req, res, next) => {
    req.file = null;
    next();
};

// دالة التحقق من نوع الملف
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    else cb('Error: Images Only!');
}

// --- إعدادات Express ---
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views')); 
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'meta-super-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // يوم واحد
}));

// --- MIDDLEWARE ---
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

function requireDev(req, res, next) {
    if (req.session.role !== 'developer') return res.redirect('/login');
    next();
}

// دالة للتحقق من صحة الرقم الضريبي حسب الدولة
function validateTaxId(taxId, countryCode) {
    // 1. حماية ضد البيانات الفارغة (لتجنب توقف السيرفر)
    if (!taxId || !countryCode) return false;

    // 2. تنظيف الرقم (تحويله لنص أولاً ثم حذف أي شيء غير الأرقام)
    const cleanTaxId = String(taxId).replace(/[^0-9]/g, '');

    if (countryCode === 'EG') {
        // مصر: يجب أن يكون 9 أرقام بالضبط
        return /^\d{9}$/.test(cleanTaxId);
    } 
    else if (countryCode === 'SA') {
        // السعودية: 15 رقم، يبدأ بـ 3 وينتهي بـ 3
        return /^3\d{13}3$/.test(cleanTaxId);
    }

    return false;
}



// --- ROUTES الرئيسية ---
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.role === 'admin') return res.redirect('/admin-dashboard');
        if (req.session.role === 'developer') return res.redirect('/dev-dashboard');
        if (req.session.role === 'store') return res.redirect('/store-portal');
    }
    res.redirect('/login');
});

// --- AUTH ---
app.get('/login', (req, res) => res.render('login'));
app.get('/register-dev', (req, res) => res.render('register-dev'));

app.post('/register-dev', async (req, res) => {
    const { name, email, password, phone, country, website, contact_person } = req.body;
    try {
        await db.execute(
            `INSERT INTO developers 
            (name, email, password, wallet_balance, phone, country, website, contact_person) 
            VALUES (?, ?, ?, 5.00, ?, ?, ?, ?)`, 
            [name, email, password, phone, country, website || null, contact_person]
        );
        res.redirect('/login?success=registered');
    } catch (e) { 
        console.error("Registration Error:", e);
        res.send(`
            <div style="text-align:center; margin-top:50px; font-family:sans-serif; direction:rtl;">
                <h3 style="color:red">❌ حدث خطأ تقني بالتفصيل:</h3>
                <p style="background:#f8d7da; color:#721c24; padding:15px; display:inline-block; border-radius:5px;">${e.message}</p>
                <br><br>
                <a href="/register-dev" style="padding:10px 20px; background:#0d6efd; color:white; text-decoration:none; border-radius:5px;">حاول مرة أخرى</a>
            </div>
        `); 
    }
});

app.get('/admin/login', (req, res) => {
    if (req.session.user && req.session.role === 'admin') {
        return res.redirect('/admin-dashboard');
    }
    res.sendFile(path.join(process.cwd(), 'views', 'admin-login.html')); 
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [admins] = await db.execute('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
        if (admins.length > 0) {
            req.session.user = admins[0];
            req.session.role = 'admin';
            return res.json({ success: true, redirect: '/admin-dashboard' });
        } else {
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        if (role === 'developer') {
            const [devs] = await db.execute('SELECT * FROM developers WHERE email = ? AND password = ?', [username, password]);
            if (devs.length > 0) {
                req.session.user = devs[0];
                req.session.role = 'developer';
                return res.redirect('/dev-dashboard');
            }
        } else if (role === 'store') {
            const [users] = await db.execute('SELECT * FROM end_users WHERE username = ? AND password = ?', [username, password]);
            if (users.length > 0) {
                req.session.user = users[0];
                req.session.role = 'store';
                req.session.user.company_id = users[0].company_id;
                return res.redirect('/store-portal');
            }
        }
        res.send(`
            <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
                <h3 style="color:red">خطأ في تسجيل الدخول</h3>
                <p>تأكد من البريد الإلكتروني وكلمة المرور ونوع الحساب.</p>
                <a href="/login">العودة</a>
            </div>
        `);
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Server Error");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- DASHBOARDS ---

app.get('/admin-dashboard', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.redirect('/login');
    const [companies] = await db.execute('SELECT * FROM companies');
    const [developers] = await db.execute('SELECT * FROM developers');
    const [totalInvoices] = await db.execute("SELECT COUNT(*) as count FROM invoices WHERE status = 'submitted'");
    const [todayInvoices] = await db.execute("SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = CURDATE() AND status = 'submitted'");
    const [failedInvoices] = await db.execute("SELECT COUNT(*) as count FROM invoices WHERE status != 'submitted'");

    res.render('dashboard', {
        user: req.session.user.name,
        companies,
        stats: {
            companiesCount: companies.length,
            devsCount: developers.length,
            totalInvoices: totalInvoices[0].count,
            todayInvoices: todayInvoices[0].count,
            failedInvoices: failedInvoices[0].count
        },
        userType: 'admin'
    });
});

app.get('/dev-dashboard', requireDev, async (req, res) => {
    const devId = req.session.user.id;
    
    try {
        // 1. جلب بيانات المطور
        const [devs] = await db.execute('SELECT * FROM developers WHERE id = ?', [devId]);
        
        if (devs.length === 0) {
            return res.status(404).send("حساب المطور غير موجود");
        }
        const developer = devs[0];

        // 2. جلب الشركات + عدد الفواتير + اسم المستخدم
        const query = `
            SELECT 
                c.*, 
                (SELECT COUNT(*) FROM invoices WHERE company_id = c.id) AS invoices_used,
                COALESCE(u.username, CONCAT('store_', c.id)) AS username
            FROM companies c 
            LEFT JOIN end_users u ON c.id = u.company_id 
            WHERE c.developer_id = ?
        `;

        const [companies] = await db.execute(query, [devId]);

        // (اختياري) طباعة للتأكد من البيانات في الـ Terminal
        // console.log(`Dev ${devId} has ${companies.length} companies.`);

        // 3. عرض الصفحة
        res.render('developer-dashboard', { 
            developer, 
            companies, 
            userType: 'developer' 
        });

    } catch (e) {
        console.error("Dashboard Error:", e);
        res.status(500).send(`حدث خطأ أثناء تحميل اللوحة: ${e.message}`);
    }
});


app.get('/store-portal', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.redirect('/login');
    const [invoices] = await db.execute('SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 50', [req.session.user.company_id]);
    const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [req.session.user.company_id]);
    const company = companies[0];

    res.render('store-portal', { user: req.session.user, invoices, company, userType: 'store' });
});

app.get('/company/:id', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.redirect('/');
    const companyId = req.params.id;
    const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (companies.length === 0) return res.redirect('/');
    const [invoices] = await db.execute('SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 20', [companyId]);
    res.render('company-details', { company: companies[0], invoices, userType: 'admin' });
});

app.get('/docs', async (req, res) => {
    let userType = req.session.user ? req.session.role : null;
    let exampleConfig = { name: "شركة افتراضية", tax_id: "100-200-300", api_secret: "sec_example123" };

    if (userType === 'developer') {
        const devId = req.session.user.id;
        const requestedCompanyId = req.query.company_id;
        let targetCompany = null;

        if (requestedCompanyId) {
            const [comps] = await db.execute('SELECT * FROM companies WHERE id = ? AND developer_id = ?', [requestedCompanyId, devId]);
            if (comps.length > 0) targetCompany = comps[0];
        }
        if (!targetCompany) {
            const [comps] = await db.execute('SELECT * FROM companies WHERE developer_id = ? LIMIT 1', [devId]);
            if (comps.length > 0) targetCompany = comps[0];
        }
        if (targetCompany) {
            exampleConfig.name = targetCompany.name;
            exampleConfig.tax_id = targetCompany.tax_id;
            exampleConfig.api_secret = targetCompany.api_secret;
        }
    }
    res.render('docs', { userType, exampleConfig });
});

// --- ACTION ROUTES ---
app.get('/install/php', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`<?php echo "✅ MetaConnect Installed Successfully!"; ?>`);
});

app.get('/connect.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public/meta-connect.js'));
});

app.post('/api/v1/sandbox/:storeId', (req, res) => {
    res.json({
        success: true,
        message: "تم التوثيق (بيئة تجريبية)",
        qr_code_data: "QR-TEST-DATA-123456",
        warning: "هذه الفاتورة لم ترسل للضرائب لأنك في وضع التجربة"
    });
});

app.post('/api/v1/connect/:storeId', async (req, res) => {
    res.json({ success: true, qr_code_data: "REAL-QR-DATA-FROM-ZATCA" });
});

app.post('/dev/add-company', requireDev, async (req, res) => {
    const { 
        name, country_code,
        tax_id_eg, address_eg,
        tax_id_sa, cr_number, building_no, street_name, city
    } = req.body;
    
    const devId = req.session.user.id;

    // 1. تحديد الرقم الضريبي بناءً على الدولة
    let tax_id, address, commercial_register;
    
    if (country_code === 'SA') {
        tax_id = tax_id_sa;
        address = `${building_no || ''}, ${street_name || ''}, ${city || ''}`.trim();
        commercial_register = cr_number;
    } else {
        tax_id = tax_id_eg;
        address = address_eg;
        commercial_register = null;
    }

    // 2. التحقق من صحة الرقم الضريبي
    if (!validateTaxId(tax_id, country_code)) {
        return res.send(`<script>alert("خطأ: الرقم الضريبي غير صحيح."); window.history.back();</script>`);
    }

    // 3. إنشاء مفتاح API
    const api_secret = 'sec_' + Math.random().toString(36).substr(2, 9);

    try {
        const cleanTaxId = tax_id.replace(/[^0-9]/g, '');
        
        // 4. إدخال الشركة مع الحقول الجديدة
        const [result] = await db.execute(
            `INSERT INTO companies 
            (name, tax_id, country_code, api_secret, developer_id, free_invoices_left, 
             address, commercial_register, building_no, street_name, city) 
            VALUES (?, ?, ?, ?, ?, 20, ?, ?, ?, ?, ?)`,
            [name, cleanTaxId, country_code, api_secret, devId, 
             address, commercial_register, building_no, street_name, city]
        );

        // 5. إنشاء مستخدم افتراضي
        await db.execute(
            'INSERT INTO end_users (company_id, username, password) VALUES (?, ?, ?)',
            [result.insertId, `store_${result.insertId}`, '123456']
        );

        res.redirect('/dev-dashboard');
        
    } catch (err) {
        console.error("Add Company Error:", err);
        res.send(`<script>alert("خطأ: ${err.code === 'ER_DUP_ENTRY' ? 'الرقم الضريبي مسجل مسبقاً' : 'حدث خطأ أثناء التسجيل'}"); window.history.back();</script>`);
    }
});


app.post('/dev/company/update-creds', requireDev, async (req, res) => {
    const { company_id, country_code, client_id, client_secret, otp } = req.body;
    const devId = req.session.user.id;

    const [check] = await db.execute('SELECT id FROM companies WHERE id = ? AND developer_id = ?', [company_id, devId]);
    if (check.length === 0) return res.status(403).send("Unauthorized");

    let credentials = {};
    if (country_code === 'EG') {
        credentials = { type: 'ETA_OAUTH', id: client_id.trim(), secret: client_secret.trim() };
    } else {
        credentials = { type: 'ZATCA_OTP', otp: otp ? otp.trim() : null };
    }

    try {
        await db.execute('UPDATE companies SET api_credentials = ? WHERE id = ?', [JSON.stringify(credentials), company_id]);
        res.redirect('/dev-dashboard');
    } catch (err) {
        res.send('Error updating credentials');
    }
});

app.post('/add-company', async (req, res) => {
    if (!req.session.user || req.session.role !== 'admin') return res.redirect('/login');
    const { name, tax_id, country_code } = req.body;

    if (!validateTaxId(tax_id, country_code)) {
        return res.send('Error: Invalid Tax ID format.');
    }

    const cleanTaxId = tax_id.replace(/[^0-9]/g, '');
    const api_secret = 'sec_' + Math.random().toString(36).substr(2, 9);

    try {
        await db.execute('INSERT INTO companies (name, tax_id, country_code, api_secret, free_invoices_left) VALUES (?, ?, ?, ?, 9999)',
            [name, cleanTaxId, country_code, api_secret]);
        res.redirect('/admin-dashboard');
    } catch (err) { res.send('Error: Tax ID exists'); }
});

app.post('/api/v1/submit', async (req, res) => {
    const { tax_id, invoice } = req.body;
    const INVOICE_COST = 0.50;
    try {
        const [companies] = await db.execute('SELECT * FROM companies WHERE tax_id = ? LIMIT 1', [tax_id]);
        if (companies.length === 0) return res.status(401).json({ error: "Unknown Company" });
        const company = companies[0];

        let isFree = false;
        let developer = null;

        if (company.free_invoices_left > 0) {
            isFree = true;
        } else if (company.invoice_limit > 0) { // تم التعديل ليدعم الشحن المباشر
            // الشركة لديها رصيد مشحون
        } else if (company.developer_id) {
            const [devs] = await db.execute('SELECT * FROM developers WHERE id = ?', [company.developer_id]);
            if (devs.length === 0 || devs[0].wallet_balance < INVOICE_COST) {
                return res.status(402).json({ error: "Insufficient Funds", message: "رصيد المطور غير كافٍ" });
            }
            developer = devs[0];
        }

        let result;
        if (company.country_code === 'EG') result = await egyptHandler.process(invoice, company);
        else result = await saudiHandler.process(invoice, company);

        if (result.success) {
            if (isFree) {
                await db.execute('UPDATE companies SET free_invoices_left = free_invoices_left - 1 WHERE id = ?', [company.id]);
            } else if (company.invoice_limit > 0) { // الخصم من رصيد الشركة المباشر
                 await db.execute('UPDATE companies SET invoice_limit = invoice_limit - 1, invoices_used = invoices_used + 1 WHERE id = ?', [company.id]);
            } else if (developer) {
                await db.execute('UPDATE developers SET wallet_balance = wallet_balance - ? WHERE id = ?', [INVOICE_COST, developer.id]);
                await db.execute('INSERT INTO transactions (developer_id, amount, description) VALUES (?, ?, ?)', [developer.id, -INVOICE_COST, `Invoice for ${company.name}`]);
            }
            await db.execute('INSERT INTO invoices (company_id, internal_id, total_amount, status, gov_uuid) VALUES (?, ?, ?, ?, ?)', [company.id, invoice.internal_id, invoice.total, 'submitted', result.gov_uuid]);
        }
        res.json({ ...result, billing: isFree ? "Free Trial" : "Paid" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SUPPORT SYSTEM ---

app.get('/dev/support', requireDev, async (req, res) => {
    const devId = req.session.user.id;
    // تم التعديل لإخفاء تذاكر الإدارة
    const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE developer_id = ? AND (is_direct_to_admin = 0 OR is_direct_to_admin IS NULL) ORDER BY created_at DESC', [devId]);
    const [companies] = await db.execute('SELECT * FROM companies WHERE developer_id = ?', [devId]);
    res.render('dev-support', { tickets, companies, userType: 'developer' });
});

app.post('/dev/support/new', requireDev, async (req, res) => {
    const { subject, message, company_id } = req.body;
    const devId = req.session.user.id;
    const [comps] = await db.execute('SELECT * FROM companies WHERE id = ? AND developer_id = ?', [company_id, devId]);
    const company = comps[0];
    if (!company) return res.send("Error: Company not found");

    const [result] = await db.execute(
        'INSERT INTO support_tickets (developer_id, subject, company_name, tax_id, country_code) VALUES (?, ?, ?, ?, ?)',
        [devId, subject, company.name, company.tax_id, company.country_code]
    );
    await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)', [result.insertId, 'developer', message]);
    res.redirect('/dev/support/view/' + result.insertId);
});

app.get('/store/support', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.redirect('/login');
    const storeId = req.session.user.id;
    const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE store_id = ? ORDER BY created_at DESC', [storeId]);
    res.render('store-support', { tickets, userType: 'store' });
});

app.post('/store/support/new', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.status(403).send('Unauthorized');
    
    const { subject, message, target } = req.body;
    const storeId = req.session.user.id;
    const companyId = req.session.user.company_id;

    try {
        const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
        const company = companies[0];

        const isDirect = (target === 'admin') ? 1 : 0;

        const [result] = await db.execute(
            'INSERT INTO support_tickets (store_id, subject, company_name, tax_id, country_code, status, is_direct_to_admin, developer_id) VALUES (?, ?, ?, ?, ?, "open", ?, ?)',
            [storeId, subject, company.name, company.tax_id, company.country_code, isDirect, company.developer_id]
        );

        await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)', [result.insertId, 'store', message]);
        
        res.redirect('/store/support/view/' + result.insertId);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error creating ticket");
    }
});


app.get('/store/support/view/:id', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.redirect('/login');
    const ticketId = req.params.id;
    await db.execute('UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_type = "admin"', [ticketId]);
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    const [ticket] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    res.render('ticket-view', { ticket: ticket[0], messages, userType: 'store' });
});

app.post('/admin/ticket/status', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).send('Unauthorized');
    const { ticket_id, status } = req.body;
    await db.execute('UPDATE support_tickets SET status = ? WHERE id = ?', [status, ticket_id]);
    let sysMsg = status === 'closed' ? 'تم إغلاق التذكرة.' : (status === 'suspended' ? 'تم تعليق التذكرة للمراجعة.' : 'تم إعادة فتح التذكرة.');
    await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)', [ticket_id, 'admin', `[SYSTEM]: ${sysMsg}`]);
    res.redirect('/admin/support/view/' + ticket_id);
});

// --- هذا هو الجزء الذي تم تحديثه ---
app.get('/dev/support/view/:id', requireDev, async (req, res) => {
    const ticketId = req.params.id;
    const devId = req.session.user.id;

    // التحقق من أن التذكرة تخص هذا المطور وليست موجهة للإدمن مباشرة
    const [ticketCheck] = await db.execute('SELECT * FROM support_tickets WHERE id = ? AND developer_id = ? AND (is_direct_to_admin = 0 OR is_direct_to_admin IS NULL)', [ticketId, devId]);
    
    if (ticketCheck.length === 0) {
        return res.status(403).send("Access Denied or Ticket sent directly to Admin.");
    }

    await db.execute('UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_type = "admin"', [ticketId]);
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    
    res.render('ticket-view', { ticket: ticketCheck[0], messages, userType: 'developer' });
});
// -----------------------------------


app.post('/support/reply', requireLogin, async (req, res) => {
    const { ticket_id, message } = req.body;
    let senderType = 'developer';
    
    if (!req.session.user) return res.redirect('/login'); 

    if (req.session.role === 'admin') senderType = 'admin';
    else if (req.session.role === 'store') senderType = 'store';

    const attachment = null; 
    
    if (!message) return res.redirect('back');

    await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message, attachment) VALUES (?, ?, ?, ?)',
        [ticket_id, senderType, message || '', attachment]);

    if (senderType === 'admin') res.redirect('/admin/support/view/' + ticket_id);
    else if (senderType === 'store') res.redirect('/store/support/view/' + ticket_id);
    else res.redirect('/dev/support/view/' + ticket_id);
});

app.get('/admin/support', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.redirect('/login');
    const [tickets] = await db.execute(`
        SELECT t.*, d.name as dev_name, s.username as store_name 
        FROM support_tickets t 
        LEFT JOIN developers d ON t.developer_id = d.id 
        LEFT JOIN end_users s ON t.store_id = s.id
        ORDER BY t.created_at DESC
    `);
    res.render('admin-support', { tickets, userType: 'admin' });
});

app.get('/admin/support/view/:id', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.redirect('/login');
    const ticketId = req.params.id;
    await db.execute('UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_type != "admin"', [ticketId]);
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    const [ticket] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    let dev = null;
    if (ticket[0].developer_id) {
        const [devs] = await db.execute('SELECT * FROM developers WHERE id = ?', [ticket[0].developer_id]);
        dev = devs[0];
    }
    res.render('ticket-view', { ticket: ticket[0], messages, userType: 'admin', developer: dev });
});

app.post('/admin/add-balance', requireLogin, async (req, res) => {
    // تأكد أن المستخدم أدمن
    if (req.session.role !== 'admin') return res.status(403).send('Unauthorized Access');
    
    const { developer_id, amount } = req.body;
    try {
        await db.execute('UPDATE developers SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, developer_id]);
        await db.execute('INSERT INTO transactions (developer_id, amount, description) VALUES (?, ?, ?)', [developer_id, amount, 'Admin Manual Deposit']);
        // العودة لنفس الصفحة التي كنت فيها (غالباً صفحة الدعم أو قائمة المطورين)
        res.redirect('back'); 
    } catch (e) { 
        res.send('Error adding balance'); 
    }
});


app.get('/api/support/messages/:id', requireLogin, async (req, res) => {
    const ticketId = req.params.id;
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    res.json(messages);
});

app.get('/api/notifications/count', requireLogin, async (req, res) => {
    let count = 0;
    try {
        if (req.session.role === 'admin') {
            const [rows] = await db.execute('SELECT COUNT(*) as c FROM ticket_messages WHERE sender_type != "admin" AND is_read = 0');
            count = rows[0].c;
        } else if (req.session.role === 'developer') {
            const devId = req.session.user.id;
            const [rows] = await db.execute(`
                SELECT COUNT(*) as c FROM ticket_messages m 
                JOIN support_tickets t ON m.ticket_id = t.id 
                WHERE t.developer_id = ? AND m.sender_type = "admin" AND m.is_read = 0
            `, [devId]);
            count = rows[0].c;
        }
    } catch (e) { console.error(e); }
    res.json({ count });
});

app.get('/api/ticket/status/:id', requireLogin, async (req, res) => {
    const ticketId = req.params.id;
    const [ticket] = await db.execute('SELECT status FROM support_tickets WHERE id = ?', [ticketId]);
    if (ticket.length > 0) res.json({ status: ticket[0].status });
    else res.status(404).json({ error: 'Not found' });
});

app.get('/api/admin/dashboard-stats', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({error: 'Unauthorized'});
    try {
        const [companies] = await db.execute('SELECT * FROM companies ORDER BY created_at DESC');
        const [developers] = await db.execute('SELECT * FROM developers ORDER BY created_at DESC');
        const [invoiceStats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status != 'submitted' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
            FROM invoices
        `);
        const saudiCompanies = companies.filter(c => c.country_code === 'SA').length;
        const egyptCompanies = companies.filter(c => c.country_code === 'EG').length;
        res.json({
            stats: {
                totalCompanies: companies.length,
                totalDevs: developers.length,
                invoices: invoiceStats[0],
                saudiCount: saudiCompanies,
                egyptCount: egyptCompanies
            },
            recentCompanies: companies.slice(0, 5),
            recentDevs: developers.slice(0, 5)
        });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

app.post('/api/admin/delete-company', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({error: 'Unauthorized'});
    const { id } = req.body;
    await db.execute('DELETE FROM companies WHERE id = ?', [id]);
    res.json({success: true});
});

app.get('/api/admin/company-file/:id', requireLogin, async (req, res) => {
    const compId = req.params.id;
    try {
        const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [compId]);
        if (companies.length === 0) return res.status(404).json({error: 'الشركة غير موجودة'});
        const company = companies[0];
        let devInfo = { name: 'غير مسند', email: '-' };
        if (company.developer_id) {
            try {
                const [devs] = await db.execute('SELECT name, email FROM developers WHERE id = ?', [company.developer_id]);
                if (devs.length > 0) devInfo = devs[0];
            } catch (e) {}
        }
        let invoices = [];
        let invoiceCount = 0;
        try {
            const [invResult] = await db.execute('SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 20', [compId]);
            invoices = invResult;
            const [countResult] = await db.execute('SELECT COUNT(*) as count FROM invoices WHERE company_id = ?', [compId]);
            invoiceCount = countResult[0].count;
        } catch (e) {}
        let shippingLogs = [];
        try {
            const [shipResult] = await db.execute('SELECT * FROM shipping_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT 10', [compId]);
            shippingLogs = shipResult;
        } catch (e) {}
        const subType = company.subscription_type === 'pro' ? 'مدفوع (Pro)' : 'مجاني (Free)';
        res.json({
            info: { 
                ...company, 
                dev_name: devInfo.name, 
                dev_email: devInfo.email,
                invoice_count: invoiceCount,
                subscription_label: subType
            },
            credentials: JSON.parse(company.api_credentials || '{}'),
            invoices: invoices,
            shipping: shippingLogs
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({error: e.message});
    }
});

app.get('/api/admin/developer-file/:id', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({error: 'Unauthorized'});
    try {
        const [devData] = await db.execute('SELECT * FROM developers WHERE id = ?', [req.params.id]);
        const [companies] = await db.execute('SELECT * FROM companies WHERE developer_id = ?', [req.params.id]);
        const [transactions] = await db.execute('SELECT * FROM transactions WHERE developer_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id]);
        res.json({
            profile: devData[0],
            companies: companies,
            transactions: transactions
        });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

app.post('/api/admin/add-shipping', requireLogin, async (req, res) => {
    const { companyId, amount, trackingNumber, destination } = req.body;
    try {
        await db.execute(
            'INSERT INTO shipping_logs (company_id, tracking_number, status, destination, amount) VALUES (?, ?, ?, ?, ?)',
            [companyId, trackingNumber, 'shipped', destination, amount]
        );
        const extraInvoices = Math.floor(amount * 100); 
        await db.execute(
            'UPDATE companies SET wallet_balance = wallet_balance + ?, invoice_limit = invoice_limit + ? WHERE id = ?',
            [amount, extraInvoices, companyId]
        );
        res.json({success: true, addedInvoices: extraInvoices});
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

app.post('/dev/allocate-balance', requireDev, async (req, res) => {
    const { company_id, amount } = req.body;
    const devId = req.session.user.id;
    const transferAmount = parseFloat(amount);
    try {
        const [devs] = await db.execute('SELECT wallet_balance FROM developers WHERE id = ?', [devId]);
        if (devs[0].wallet_balance < transferAmount) {
            return res.send('<script>alert("عفواً، رصيد محفظتك لا يكفي!"); window.history.back();</script>');
        }
        await db.execute('UPDATE developers SET wallet_balance = wallet_balance - ? WHERE id = ?', [transferAmount, devId]);
        const invoicesToAdd = Math.floor(transferAmount * 10); 
        await db.execute(
            'UPDATE companies SET allocated_balance = allocated_balance + ?, invoice_limit = invoice_limit + ? WHERE id = ?',
            [transferAmount, invoicesToAdd, company_id]
        );
        await db.execute('INSERT INTO transactions (developer_id, amount, description) VALUES (?, ?, ?)', 
            [devId, -transferAmount, `Allocation to Company ID: ${company_id}`]);
        res.redirect('/dev-dashboard');
    } catch (e) {
        console.error(e);
        res.status(500).send("حدث خطأ أثناء التحويل");
    }
});

// --- مسار جديد: تحديث بيانات دخول المتجر من قبل المطور ---
// تحديث بيانات دخول المتجر (Username + Password)
app.post('/dev/update-store-auth', async (req, res) => {
    // 1. التحقق من جلسة المطور
    if (!req.session.developerId) {
        return res.redirect('/dev/login');
    }

    const { company_id, new_username, new_password } = req.body;
    const devId = req.session.developerId;

    // 2. التحقق من وجود بيانات للإدخال
    if (!company_id) {
        return res.status(400).send("خطأ: رقم الشركة غير موجود");
    }

    // يجب إرسال قيمة واحدة على الأقل للتعديل
    if ((!new_username || new_username.trim() === '') && (!new_password || new_password.trim() === '')) {
        return res.redirect('/dev-dashboard'); // لم يتم تغيير شيء، نعود للصفحة الرئيسية
    }

    try {
        // 3. التحقق من أن المتجر يتبع المطور الحالي
        const [companyCheck] = await pool.query(
            'SELECT id FROM companies WHERE id = ? AND developer_id = ?', 
            [company_id, devId]
        );
        
        if (companyCheck.length === 0) {
            return res.status(403).send("غير مصرح لك بتعديل هذا المتجر!");
        }

        // 4. بناء جملة التحديث ديناميكياً (لتحديث ما تم إرساله فقط)
        let updateFields = [];
        let updateValues = [];

        if (new_username && new_username.trim() !== '') {
            updateFields.push('store_username = ?'); // تأكد أن اسم العمود في الداتابيز هو store_username
            updateValues.push(new_username.trim());
        }

        if (new_password && new_password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(new_password, 10);
            updateFields.push('store_password = ?'); // تأكد أن اسم العمود في الداتابيز هو store_password
            updateValues.push(hashedPassword);
        }

        // إضافة ID الشركة في نهاية المصفوفة للشرط WHERE
        updateValues.push(company_id);

        const sql = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.execute(sql, updateValues);
        
        // نجاح العملية -> عودة للوحة التحكم
        res.redirect('/dev-dashboard');

    } catch (e) {
        console.error("Update Auth Error:", e);
        // في حالة تكرار اسم المستخدم
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).send("اسم المستخدم هذا موجود بالفعل، يرجى اختيار اسم آخر.");
        }
        res.status(500).send("حدث خطأ في النظام");
    }
});


// Route لصفحة التوثيق
// Route لصفحة التوثيق (الإصدار الصحيح)
app.get('/dev/docs', async (req, res) => {
    // التأكد من أن المطور مسجل دخوله
    if (!req.session.developerId) {
        return res.redirect('/dev/login');
    }

    const { company_id } = req.query;

    if (!company_id) {
        return res.status(400).send("Bad Request: Company ID is missing.");
    }

    try {
        // البحث عن الشركة باستخدام الـ ID القادم من الرابط
        const [companies] = await pool.query('SELECT * FROM companies WHERE id = ?', [company_id]);

        if (companies.length === 0) {
            return res.status(404).send("Error: Company not found.");
        }

        const companyData = companies[0];

        // 🔥 هنا التصحيح: إرسال البيانات تحت اسم 'exampleConfig' كما يتوقع ملفك
        res.render('docs', {
            userType: 'developer', // مطلوب في ملفك
            exampleConfig: companyData // إرسال بيانات الشركة هنا
        });

    } catch (err) {
        console.error("Server Error in /dev/docs:", err);
        res.status(500).send("An error occurred on the server.");
    }
});

// صفحة تسجيل دخول المطور (GET)
// صفحة تسجيل دخول المطور (GET)
// صفحة تسجيل دخول المطور (GET)
app.get('/dev/login', (req, res) => {
    if (req.session.developerId) {
        return res.redirect('/dev-dashboard');
    }
    // استدعاء ملف dev-login.ejs المنفصل
    res.render('dev-login'); 
});

// معالجة تسجيل الدخول (POST)
app.post('/dev/login', async (req, res) => {
    const { email, password } = req.body;

    // التحقق من وجود البيانات
    if (!email || !password) {
        return res.status(400).send(`
            <script>
                alert("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
                window.location.href = "/dev/login";
            </script>
        `);
    }

    try {
        // الحل الصحيح بناءً على كيفية تعريف pool في أعلى الملف:
        // إذا كان pool معرّف بـ: const pool = mysql.createPool({...}).promise();
        // استخدم هذا السطر:
        const [devs] = await pool.query('SELECT * FROM developers WHERE email = ?', [email]);
        
        // إذا كان pool معرّف بـ: const pool = mysql.createPool({...});
        // استخدم هذا السطر بدلاً من السطر السابق:
        // const [devs] = await pool.promise().query('SELECT * FROM developers WHERE email = ?', [email]);

        if (devs.length === 0) {
            return res.status(401).send(`
                <script>
                    alert("البريد الإلكتروني غير مسجل");
                    window.location.href = "/dev/login";
                </script>
            `);
        }

        const developer = devs[0];
        
        // التحقق من كلمة المرور باستخدام bcrypt
        const isValid = await bcrypt.compare(password, developer.password);

        if (!isValid) {
            return res.status(401).send(`
                <script>
                    alert("كلمة المرور خاطئة");
                    window.location.href = "/dev/login";
                </script>
            `);
        }

        // تسجيل الجلسة بنجاح
        req.session.developerId = developer.id;
        res.redirect('/dev-dashboard');

    } catch (err) {
        console.error("❌ Dev Login Error:", err);
        res.status(500).send(`
            <script>
                alert("حدث خطأ في السيرفر. حاول مرة أخرى.");
                window.location.href = "/dev/login";
            </script>
        `);
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));











