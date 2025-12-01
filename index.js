require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./utils/db');
const egyptHandler = require('./services/egyptHandler');
const saudiHandler = require('./services/saudiHandler');

const app = express();

// --- إعدادات رفع الصور (Multer) ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, 'img-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    else cb('Error: Images Only!');
}

// --- إعدادات Express ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'meta-super-secret-key',
    resave: false,
    saveUninitialized: true
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
    // إزالة أي فواصل أو مسافات أو شرطات
    const cleanTaxId = taxId.replace(/[^0-9]/g, '');

    if (countryCode === 'EG') {
        // مصر: يجب أن يكون 9 أرقام
        return cleanTaxId.length === 9;
    } else if (countryCode === 'SA') {
        // السعودية: 15 رقم، يبدأ بـ 3 وينتهي بـ 3
        return cleanTaxId.length === 15 && cleanTaxId.startsWith('3') && cleanTaxId.endsWith('3');
    }
    return false; // دولة غير معروفة
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
    const { name, email, password } = req.body;
    try {
        await db.execute('INSERT INTO developers (name, email, password, wallet_balance) VALUES (?, ?, ?, 5.00)', [name, email, password]);
        res.redirect('/login');
    } catch (e) { res.send('خطأ: البريد الإلكتروني مسجل مسبقاً'); }
});

app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    if (role === 'admin') {
        if (username === 'admin' && password === 'admin123') {
            req.session.user = { name: 'Super Admin', id: 0 };
            req.session.role = 'admin';
            return res.redirect('/admin-dashboard');
        }
    } else if (role === 'developer') {
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
    res.send('بيانات الدخول غير صحيحة أو نوع الحساب خاطئ');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- DASHBOARDS ---

// 1. Admin Dashboard (المحدث بالإحصائيات)
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

// 2. Developer Dashboard
app.get('/dev-dashboard', requireDev, async (req, res) => {
    const devId = req.session.user.id;
    const [devs] = await db.execute('SELECT * FROM developers WHERE id = ?', [devId]);
    const developer = devs[0];
    const [companies] = await db.execute('SELECT * FROM companies WHERE developer_id = ?', [devId]);
    res.render('developer-dashboard', { developer, companies, userType: 'developer' });
});

// 3. Store Portal
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

// صفحة التوثيق (مخصصة حسب المطور)
// صفحة التوثيق (مخصصة حسب الشركة المختارة)
app.get('/docs', async (req, res) => {
    let userType = req.session.user ? req.session.role : null;

    // الإعدادات الافتراضية (للزائر العادي)
    let exampleConfig = {
        name: "شركة افتراضية",
        tax_id: "100-200-300",
        api_secret: "sec_example123"
    };

    // إذا كان مطوراً، نحاول جلب بيانات حقيقية
    if (userType === 'developer') {
        const devId = req.session.user.id;
        const requestedCompanyId = req.query.company_id; // هل ضغط على زر شركة معينة؟

        let targetCompany = null;

        if (requestedCompanyId) {
            // 1. إذا طلب شركة محددة، نتحقق أنها ملكه (أمان)
            const [comps] = await db.execute('SELECT * FROM companies WHERE id = ? AND developer_id = ?', [requestedCompanyId, devId]);
            if (comps.length > 0) targetCompany = comps[0];
        }

        if (!targetCompany) {
            // 2. إذا لم يطلب (أو طلب شركة ليست ملكه)، نجلب أول شركة له تلقائياً
            const [comps] = await db.execute('SELECT * FROM companies WHERE developer_id = ? LIMIT 1', [devId]);
            if (comps.length > 0) targetCompany = comps[0];
        }

        // تحديث البيانات المعروضة
        if (targetCompany) {
            exampleConfig.name = targetCompany.name;
            exampleConfig.tax_id = targetCompany.tax_id;
            exampleConfig.api_secret = targetCompany.api_secret;
        }
    }

    res.render('docs', { userType, exampleConfig });
});


// --- ACTION ROUTES ---
// --- MAGIC INSTALLERS ---

// 1. مثبت PHP
app.get('/install/php', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`<?php
        // هذا الكود يعمل على جهاز العميل عند التثبيت
        $dir = 'metaconnect';
        if (!file_exists($dir)) mkdir($dir, 0777, true);
        
        // تنزيل الكلاس الأساسي من سيرفرك
        $content = file_get_contents('http://localhost:3000/sdks/MetaConnect.php');
        file_put_contents($dir . '/MetaConnect.php', $content);

        // إنشاء ملف التهيئة
        $initCode = "<?php require_once 'MetaConnect.php'; class MetaConnectWrapper { static function submit(\$data) { /* ... wrapper logic ... */ } } ?>";
        file_put_contents($dir . '/init.php', $initCode);

        echo "✅ MetaConnect Installed Successfully!\\n";
        echo "📂 Folder created: metaconnect/\\n";
    ?>`);
});

// 2. ملف JS الموحد (للمتصفح)
app.get('/connect.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/meta-connect.js'));
});


// --------------------------------------
// 1. مسار بيئة التجربة (Sandbox) - للتجريب فقط
// --------------------------------------
app.post('/api/v1/sandbox/:storeId', (req, res) => {
    console.log(`🧪 [Sandbox] طلب تجريبي من المتجر: ${req.params.storeId}`);

    // نرد بنجاح وهمي فوراً
    res.json({
        success: true,
        message: "تم التوثيق (بيئة تجريبية)",
        qr_code_data: "QR-TEST-DATA-123456", // بيانات QR تجريبية
        warning: "هذه الفاتورة لم ترسل للضرائب لأنك في وضع التجربة"
    });
});

// --------------------------------------
// 2. مسار بيئة الإنتاج (Live) - الحقيقي
// --------------------------------------
app.post('/api/v1/connect/:storeId', async (req, res) => {
    console.log(`🚀 [Live] طلب حقيقي من المتجر: ${req.params.storeId}`);

    // هنا تضع كود الاتصال الحقيقي بالضرائب
    // const taxResponse = await sendToZatca(...);

    res.json({
        success: true,
        qr_code_data: "REAL-QR-DATA-FROM-ZATCA" // النتيجة الحقيقية
    });
});

// إضافة شركة (للمطور)
// إضافة شركة (للمطور) - مع التحقق من الرقم الضريبي
// إضافة شركة (للمطور) - مع التحقق من الرقم الضريبي (مصحح)
app.post('/dev/add-company', requireDev, async (req, res) => {
    const { name, tax_id, country_code } = req.body; // هنا المتغير اسمه country_code
    const devId = req.session.user.id;

    // 1. التحقق من صحة الرقم الضريبي
    if (!validateTaxId(tax_id, country_code)) {
        return res.send(`
            <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>خطأ</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css"></head>
            <body class="d-flex align-items-center justify-content-center vh-100 bg-light">
                <div class="card shadow p-5 text-center border-danger" style="max-width: 500px;">
                    <h3 class="text-danger">عفواً، الرقم الضريبي غير صحيح! ❌</h3>
                    <p class="text-muted">
                        الرقم الذي أدخلته: <strong>${tax_id}</strong><br>
                        الدولة: <strong>${country_code === 'EG' ? 'مصر 🇪🇬' : 'السعودية 🇸🇦'}</strong> <!-- تم التصحيح هنا -->
                    </p>
                    <div class="alert alert-warning small">
                        ${country_code === 'EG' ? 'يجب أن يتكون الرقم الضريبي المصري من 9 أرقام.' : 'يجب أن يتكون الرقم الضريبي السعودي من 15 رقم، ويبدأ وينتهي بالرقم 3.'}
                    </div>
                    <a href="/dev-dashboard" class="btn btn-primary mt-3">محاولة مرة أخرى</a>
                </div>
            </body></html>
        `);
    }

    const api_secret = 'sec_' + Math.random().toString(36).substr(2, 9);

    try {
        // تنظيف الرقم الضريبي قبل الحفظ (إزالة الشرطات)
        const cleanTaxId = tax_id.replace(/[^0-9]/g, '');

        const [result] = await db.execute(
            'INSERT INTO companies (name, tax_id, country_code, api_secret, developer_id, free_invoices_left) VALUES (?, ?, ?, ?, ?, 20)',
            [name, cleanTaxId, country_code, api_secret, devId]
        );
        await db.execute('INSERT INTO end_users (company_id, username, password) VALUES (?, ?, ?)',
            [result.insertId, `store_${result.insertId}`, '123456']);
        res.redirect('/dev-dashboard');
    } catch (err) {
        // صفحة الخطأ عند التكرار
        res.send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>خطأ</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css"></head><body class="d-flex align-items-center justify-content-center vh-100 bg-light"><div class="card shadow p-5 text-center" style="max-width: 500px;"><h3 class="text-danger">عفواً، حدث خطأ!</h3><p class="text-muted">الرقم الضريبي <strong>${tax_id}</strong> مسجل بالفعل.</p><a href="/dev-dashboard" class="btn btn-primary mt-3">عودة</a></div></body></html>`);
    }
});



// >> الكود الجديد: تحديث بيانات الربط (Credentials)
// تحديث بيانات الربط الحكومي (النسخة الذكية)
app.post('/dev/company/update-creds', requireDev, async (req, res) => {
    const { company_id, country_code, client_id, client_secret, otp } = req.body;
    const devId = req.session.user.id;

    const [check] = await db.execute('SELECT id FROM companies WHERE id = ? AND developer_id = ?', [company_id, devId]);
    if (check.length === 0) return res.status(403).send("Unauthorized");

    let credentials = {};

    // تشكيل البيانات حسب الدولة
    if (country_code === 'EG') {
        // مصر: نحفظ ID و Secret
        credentials = {
            type: 'ETA_OAUTH',
            id: client_id.trim(),
            secret: client_secret.trim()
        };
    } else {
        // السعودية: نحفظ الـ OTP (أو البيانات الأخرى)
        credentials = {
            type: 'ZATCA_OTP',
            otp: otp ? otp.trim() : null,
            // يمكن إضافة CSR وغيرها هنا
        };
    }

    try {
        // نحفظها كـ JSON string
        await db.execute('UPDATE companies SET api_credentials = ? WHERE id = ?', [JSON.stringify(credentials), company_id]);
        res.redirect('/dev-dashboard');
    } catch (err) {
        res.send('Error updating credentials');
    }
});


// إضافة شركة (للإدمن)
app.post('/add-company', async (req, res) => {
    if (!req.session.user || req.session.role !== 'admin') return res.redirect('/login');
    const { name, tax_id, country_code } = req.body;

    if (!validateTaxId(tax_id, country_code)) {
        return res.send('Error: Invalid Tax ID format for the selected country.');
    }

    const cleanTaxId = tax_id.replace(/[^0-9]/g, '');
    const api_secret = 'sec_' + Math.random().toString(36).substr(2, 9);

    try {
        await db.execute('INSERT INTO companies (name, tax_id, country_code, api_secret, free_invoices_left) VALUES (?, ?, ?, ?, 9999)',
            [name, cleanTaxId, country_code, api_secret]);
        res.redirect('/admin-dashboard');
    } catch (err) { res.send('Error: Tax ID exists'); }
});


// --- API BILLING ---
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

// 1. قائمة تذاكر المطور
app.get('/dev/support', requireDev, async (req, res) => {
    const devId = req.session.user.id;
    const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE developer_id = ? ORDER BY created_at DESC', [devId]);
    const [companies] = await db.execute('SELECT * FROM companies WHERE developer_id = ?', [devId]);
    res.render('dev-support', { tickets, companies, userType: 'developer' });
});

// 2. فتح تذكرة جديدة (مطور)
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

// 3. قائمة تذاكر المتجر
app.get('/store/support', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.redirect('/login');
    const storeId = req.session.user.id;
    const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE store_id = ? ORDER BY created_at DESC', [storeId]);
    res.render('store-support', { tickets, userType: 'store' });
});

// 4. فتح تذكرة جديدة من المتجر (المحسنة)
app.post('/store/support/new', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.status(403).send('Unauthorized');
    const { subject, message } = req.body;
    const storeId = req.session.user.id;
    const companyId = req.session.user.company_id;
    const [companies] = await db.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    const company = companies[0];

    const [result] = await db.execute(
        'INSERT INTO support_tickets (store_id, subject, company_name, tax_id, country_code, status) VALUES (?, ?, ?, ?, ?, "open")',
        [storeId, subject, company.name, company.tax_id, company.country_code]
    );
    await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)', [result.insertId, 'store', message]);
    res.redirect('/store/support/view/' + result.insertId);
});

// 5. عرض التذكرة للمتجر
app.get('/store/support/view/:id', requireLogin, async (req, res) => {
    if (req.session.role !== 'store') return res.redirect('/login');
    const ticketId = req.params.id;
    await db.execute('UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_type = "admin"', [ticketId]);
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    const [ticket] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    res.render('ticket-view', { ticket: ticket[0], messages, userType: 'store' });
});

// 6. تغيير حالة التذكرة (للإدمن) - مع التوجيه الصحيح
app.post('/admin/ticket/status', requireLogin, async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).send('Unauthorized');
    const { ticket_id, status } = req.body;
    await db.execute('UPDATE support_tickets SET status = ? WHERE id = ?', [status, ticket_id]);
    let sysMsg = status === 'closed' ? 'تم إغلاق التذكرة.' : (status === 'suspended' ? 'تم تعليق التذكرة للمراجعة.' : 'تم إعادة فتح التذكرة.');
    await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)', [ticket_id, 'admin', `[SYSTEM]: ${sysMsg}`]);
    res.redirect('/admin/support/view/' + ticket_id);
});

// 7. عرض التذكرة (للمطور) - مع تصفير الإشعارات
app.get('/dev/support/view/:id', requireDev, async (req, res) => {
    const ticketId = req.params.id;
    await db.execute('UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_type = "admin"', [ticketId]);
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    const [ticket] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    res.render('ticket-view', { ticket: ticket[0], messages, userType: 'developer' });
});

// 8. الرد على التذكرة (مشترك)
app.post('/support/reply', requireLogin, (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.send(err);
        const { ticket_id, message } = req.body;
        let senderType = 'developer';
        if (req.session.role === 'admin') senderType = 'admin';
        else if (req.session.role === 'store') senderType = 'store';

        const attachment = req.file ? req.file.filename : null;
        if (!message && !attachment) return res.redirect('back');

        await db.execute('INSERT INTO ticket_messages (ticket_id, sender_type, message, attachment) VALUES (?, ?, ?, ?)',
            [ticket_id, senderType, message || '', attachment]);

        if (senderType === 'admin') res.redirect('/admin/support/view/' + ticket_id);
        else if (senderType === 'store') res.redirect('/store/support/view/' + ticket_id);
        else res.redirect('/dev/support/view/' + ticket_id);
    });
});

// --- ADMIN SUPPORT ---
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
    if (req.session.role !== 'admin') return res.status(403).send('Unauthorized');
    const { developer_id, amount } = req.body;
    try {
        await db.execute('UPDATE developers SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, developer_id]);
        await db.execute('INSERT INTO transactions (developer_id, amount, description) VALUES (?, ?, ?)', [developer_id, amount, 'Admin Manual Deposit']);
        res.redirect('/admin/support');
    } catch (e) { res.send('Error adding balance'); }
});

// API Helper Routes
app.get('/api/support/messages/:id', requireLogin, async (req, res) => {
    const ticketId = req.params.id;
    const [messages] = await db.execute('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
    res.json(messages);
});

app.get('/api/notifications/count', requireLogin, async (req, res) => {
    let count = 0;
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
    res.json({ count });
});

app.get('/api/ticket/status/:id', requireLogin, async (req, res) => {
    const ticketId = req.params.id;
    const [ticket] = await db.execute('SELECT status FROM support_tickets WHERE id = ?', [ticketId]);
    if (ticket.length > 0) res.json({ status: ticket[0].status });
    else res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Multi-Tier System running at http://localhost:${PORT}`));
