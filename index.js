<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MetaConnect | Console</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    
    <style>
        :root {
            --primary: #0f172a; --primary-light: #334155; --accent: #3b82f6;
            --bg-body: #f1f5f9; --surface: #ffffff; --border: #e2e8f0;
            --success-soft: #dcfce7; --success-text: #15803d;
            --warning-soft: #fef3c7; --warning-text: #b45309;
            --font-main: 'Tajawal', sans-serif;
        }
        body { font-family: var(--font-main); background-color: var(--bg-body); color: #1e293b; -webkit-font-smoothing: antialiased; }

        /* Navbar */
        .navbar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .brand-logo { font-family: 'Cairo', sans-serif; font-weight: 800; letter-spacing: -0.5px; color: var(--primary); font-size: 1.4rem; }
        .nav-pill-user { background: #f8fafc; border: 1px solid var(--border); padding: 6px 16px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
        .nav-pill-user:hover { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        /* Main Cards */
        .stats-card { background: var(--primary); color: white; border-radius: 24px; padding: 2.5rem; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15); transition: transform 0.3s; }
        .stats-card:hover { transform: translateY(-3px); }
        .stats-card::before { content: ''; position: absolute; top: -50%; right: -20%; width: 250px; height: 250px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); }
        .wallet-balance { font-size: 3.5rem; font-weight: 800; letter-spacing: -1px; line-height: 1; margin: 1rem 0; }
        
        .add-btn-card { background: var(--surface); border: 2px dashed #cbd5e1; border-radius: 24px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: all 0.3s; min-height: 220px; position: relative; overflow: hidden; }
        .add-btn-card:hover { border-color: var(--accent); background: #eff6ff; transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1); }
        .add-icon-wrapper { width: 70px; height: 70px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; transition: 0.3s; }
        .add-btn-card:hover .add-icon-wrapper { background: var(--accent); color: white; transform: scale(1.1); }

        /* Modern Table */
        .content-box { background: var(--surface); border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; margin-top: 2.5rem; }
        .box-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fff; }
        .table thead th { background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; padding: 1.2rem 2rem; border-bottom: 1px solid var(--border); letter-spacing: 0.5px; }
        .table tbody td { padding: 1.5rem 2rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 500; }
        .table tbody tr:last-child td { border-bottom: none; }
        
        .company-avatar { width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; border: 1px solid #bfdbfe; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1); }
        
        /* Status Badges */
        .status-badge { padding: 8px 14px; border-radius: 50px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
        .status-connected { background: #ecfdf5; color: var(--success-text); border: 1px solid #a7f3d0; }
        .status-pending { background: #fffbeb; color: var(--warning-text); border: 1px solid #fde68a; }
        
        /* Action Buttons */
        .action-btn { width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--border); background: #fff; color: #64748b; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; margin-left: 8px; font-size: 1.1rem; text-decoration: none; }
        .action-btn:hover { background: #f8fafc; color: var(--primary); border-color: #94a3b8; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .action-btn.primary-action { background: #eff6ff; color: var(--accent); border-color: #bfdbfe; }
        .action-btn.primary-action:hover { background: var(--accent); color: white; border-color: var(--accent); }
        .action-btn.code-action { background: #f3e8ff; color: #9333ea; border-color: #e9d5ff; }
        .action-btn.code-action:hover { background: #9333ea; color: white; border-color: #9333ea; }

        /* Modals */
        .modal-content { border: none; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border); background: #fff; }
        .form-control { padding: 0.8rem 1rem; border-radius: 12px; border-color: #cbd5e1; background: #f8fafc; font-weight: 500; transition: 0.2s; }
        .form-control:focus { background: #fff; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    </style>
</head>
<body>

    <!-- Navbar -->
    <nav class="navbar sticky-top">
        <div class="container" style="max-width: 1250px;">
            <div class="d-flex align-items-center gap-3">
                <div style="width: 42px; height: 42px; background: var(--primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <i class="bi bi-boxes fs-5"></i>
                </div>
                <span class="brand-logo">MetaConnect</span>
            </div>
            
            <div class="d-flex align-items-center gap-3">
                <div class="nav-pill-user">
                    <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);"></div>
                    <%= developer.name %>
                </div>
                <a href="/logout" class="action-btn text-danger border-danger-subtle ms-0" style="background: #fef2f2; width: 38px; height: 38px;" title="تسجيل خروج">
                    <i class="bi bi-box-arrow-left"></i>
                </a>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <div class="container py-5" style="max-width: 1250px;">
        
        <!-- Header Stats -->
        <div class="row g-4">
            <!-- Wallet Card -->
            <div class="col-lg-5">
                <div class="stats-card h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-white-50 fw-bold text-uppercase small ls-1">رصيد المحفظة الحالي</span>
                            <span class="badge bg-white bg-opacity-10 border border-white border-opacity-25 rounded-pill px-3 py-2 fw-normal backdrop-blur">Live Balance</span>
                        </div>
                        <div class="wallet-balance">
                            <%= parseFloat(developer.wallet_balance).toFixed(2) %><span class="fs-3 ms-2 fw-light opacity-75">EGP</span>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-top border-white border-opacity-10 d-flex gap-3">
                        <button class="btn btn-light fw-bold px-4 py-2 rounded-pill flex-grow-1" onclick="window.open('https://wa.me/201000000000', '_blank')">
                            <i class="bi bi-plus-lg me-2"></i>شحن الرصيد
                        </button>
                        <button class="btn btn-outline-light fw-bold px-4 py-2 rounded-pill" onclick="location.href='/dev/support'">
                            <i class="bi bi-headset me-2"></i>الدعم
                        </button>
                    </div>
                </div>
            </div>

            <!-- Add Company Action -->
            <div class="col-lg-7">
                <div class="add-btn-card" onclick="new bootstrap.Modal(document.getElementById('addCompanyModal')).show()">
                    <div class="add-icon-wrapper text-primary">
                        <i class="bi bi-building-add fs-2"></i>
                    </div>
                    <h4 class="fw-bold text-primary mb-2">تسجيل منشأة جديدة</h4>
                    <p class="text-muted mb-0">اضغط هنا لإضافة عميل جديد والبدء في إجراءات الربط الحكومي (ETA / ZATCA)</p>
                </div>
            </div>
        </div>

        <!-- Companies List -->
        <div class="content-box">
            <div class="box-header">
                <div class="d-flex align-items-center gap-3">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                        <i class="bi bi-grid-fill fs-5"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0 text-dark">العملاء والمنشآت</h6>
                        <small class="text-muted">إدارة اشتراكات العملاء وحالة الربط</small>
                    </div>
                </div>
                <span class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2 rounded-pill font-monospace">Total: <%= companies.length %></span>
            </div>
            <div class="table-responsive">
                <table class="table mb-0">
                    <thead>
                        <tr>
                            <th class="ps-4">المنشأة / المستخدم</th>
                            <th>تفاصيل الفواتير والرصيد</th>
                            <th>حالة الربط الحكومي</th>
                            <th class="text-end pe-4">أدوات التحكم</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% companies.forEach(function(comp) { 
                            let currency = comp.country_code === 'SA' ? 'SAR' : 'EGP';
                            let flag = comp.country_code === 'SA' ? 'https://flagcdn.com/w20/sa.png' : 'https://flagcdn.com/w20/eg.png';
                            
                            // Invoices Calculation
                            let balance = parseFloat(comp.allocated_balance || 0);
                            let paidInvoices = Math.floor(balance / 0.5); // Assuming 0.5 cost per invoice
                            let usedInvoices = comp.invoices_used || 0;
                            let freeInvoices = comp.free_invoices_left || 0;
                            
                            let isConnected = false;
                            try {
                                let c = JSON.parse(comp.api_credentials || '{}');
                                isConnected = comp.country_code === 'EG' ? !!c.client_id : !!c.binarySecurityToken;
                            } catch(e) {}
                            
                            // Auth User (إذا كان هناك اسم مستخدم مخصص نعرضه، وإلا نعرض الافتراضي)
                            let authUser = comp.store_username ? comp.store_username : ('store_' + String(comp.id).substring(0,8));
                        %>
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="company-avatar"><%= comp.name.charAt(0) %></div>
                                    <div>
                                        <div class="fw-bold text-dark fs-6 mb-1"><%= comp.name %></div>
                                        <div class="d-flex align-items-center gap-2 mb-1">
                                            <span class="badge bg-light border text-secondary fw-normal px-2 py-1 rounded-2 d-flex align-items-center gap-1" style="font-size: 0.7rem;">
                                                <img src="<%= flag %>" width="12"> <%= comp.country_code %> | <%= comp.tax_id %>
                                            </span>
                                        </div>
                                        <div class="d-flex align-items-center gap-1 text-muted" style="font-size: 0.75rem;">
                                            <i class="bi bi-person-circle"></i>
                                            <span class="font-monospace text-dark fw-bold bg-light px-1 rounded"><%= authUser %></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="min-width: 200px;">
                                <div class="bg-light p-2 rounded-3 border">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="text-muted small fw-bold">رصيد مدفوع:</span>
                                        <span class="fw-bold text-primary font-monospace"><%= balance.toFixed(2) %> <%= currency %></span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="text-muted small" style="font-size: 0.7rem;">(<%= paidInvoices %> فاتورة)</span>
                                    </div>
                                    
                                    <div class="border-top pt-2 mt-1 d-flex justify-content-between align-items-center">
                                        <span class="text-muted small fw-bold"><i class="bi bi-gift-fill text-warning me-1"></i>رصيد مجاني:</span>
                                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 rounded-pill font-monospace"><%= freeInvoices %> فاتورة</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <% if(isConnected) { %>
                                    <span class="status-badge status-connected"><i class="bi bi-check-circle-fill fs-6"></i> متصل بالنظام</span>
                                <% } else { %>
                                    <span class="status-badge status-pending"><i class="bi bi-exclamation-triangle-fill fs-6"></i> بانتظار التفعيل</span>
                                <% } %>
                            </td>
                            <td class="text-end pe-4">
                                <div class="d-flex justify-content-end gap-1">
                                    <!-- زر التوثيق الخاص بالشركة -->
                                    <a href="/dev/docs?company_id=<%= comp.id %>" class="action-btn code-action" data-bs-toggle="tooltip" title="أكواد الربط والتوثيق">
                                        <i class="bi bi-code-slash fs-4"></i>
                                    </a>
                                    
                                    <button class="action-btn primary-action" onclick='openCredsModal(<%= JSON.stringify(comp) %>)' data-bs-toggle="tooltip" title="إعدادات الربط الحكومي">
                                        <i class="bi bi-link-45deg fs-4"></i>
                                    </button>
                                    <button class="action-btn" onclick="openAllocateModal('<%= comp.id %>', '<%= comp.name %>', '<%= currency %>')" title="شحن رصيد">
                                        <i class="bi bi-cash-stack"></i>
                                    </button>
                                    <button class="action-btn" onclick="openAuthModal('<%= comp.id %>', '<%= comp.name %>', '<%= authUser %>')" title="بيانات الدخول">
                                        <i class="bi bi-key"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <% }); %>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- 1. Registration Modal -->
    <div class="modal fade" id="addCompanyModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold"><i class="bi bi-building-add me-2 text-primary"></i>تسجيل منشأة جديدة</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form action="/dev/add-company" method="POST" onsubmit="return validateRegistration(this)">
                    <div class="modal-body p-4">
                        <!-- Country Selection -->
                        <div class="row mb-4 justify-content-center">
                            <div class="col-md-10">
                                <label class="form-label text-center d-block text-muted small fw-bold mb-3">اختر الدولة لبدء التسجيل</label>
                                <div class="row g-3">
                                    <div class="col-6">
                                        <input type="radio" class="btn-check" name="country_code" id="c_eg" value="EG" checked onchange="toggleCountryFields()">
                                        <label class="btn btn-outline-dark w-100 py-3 border-2 rounded-4 d-flex flex-column align-items-center gap-2 h-100" for="c_eg">
                                            <img src="https://flagcdn.com/w80/eg.png" width="32" class="rounded-1 shadow-sm">
                                            <span class="fw-bold">مصر (ETA)</span>
                                        </label>
                                    </div>
                                    <div class="col-6">
                                        <input type="radio" class="btn-check" name="country_code" id="c_sa" value="SA" onchange="toggleCountryFields()">
                                        <label class="btn btn-outline-dark w-100 py-3 border-2 rounded-4 d-flex flex-column align-items-center gap-2 h-100" for="c_sa">
                                            <img src="https://flagcdn.com/w80/sa.png" width="32" class="rounded-1 shadow-sm">
                                            <span class="fw-bold">السعودية (ZATCA)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-secondary">الاسم التجاري للمنشأة</label>
                                <input type="text" name="name" class="form-control" placeholder="اسم الشركة كما في السجل" required>
                            </div>

                            <!-- Egypt Fields -->
                            <div id="fields_eg" class="col-12 row g-3 m-0 p-0">
                                <div class="col-md-6 ps-md-2 ps-0">
                                    <label class="form-label small fw-bold text-secondary">رقم التسجيل الضريبي</label>
                                    <input type="text" name="tax_id_eg" class="form-control font-monospace" placeholder="9 أرقام (xxxxxxxxx)" maxlength="9">
                                </div>
                                <div class="col-md-6 pe-md-2 pe-0">
                                    <label class="form-label small fw-bold text-secondary">العنوان</label>
                                    <input type="text" name="address_eg" class="form-control" placeholder="المحافظة - المدينة - الحي">
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-secondary">رقم السجل التجاري (اختياري)</label>
                                    <input type="text" name="cr_number_eg" class="form-control font-monospace">
                                </div>
                            </div>

                            <!-- Saudi Fields -->
                            <div id="fields_sa" class="col-12 row g-3 m-0 p-0" style="display:none;">
                                <div class="col-md-6 ps-md-2 ps-0">
                                    <label class="form-label small fw-bold text-secondary">الرقم الضريبي (VAT Number)</label>
                                    <input type="text" name="tax_id_sa" class="form-control font-monospace" placeholder="3xxxxxxxxxxxxx3" maxlength="15">
                                </div>
                                <div class="col-md-6 pe-md-2 pe-0">
                                    <label class="form-label small fw-bold text-secondary">رقم السجل التجاري</label>
                                    <input type="text" name="cr_number" class="form-control font-monospace">
                                </div>
                                <div class="col-12"><hr class="my-2"></div>
                                <div class="col-md-4 ps-md-2 ps-0">
                                    <label class="form-label small text-muted">رقم المبنى</label>
                                    <input type="text" name="building_no" class="form-control" maxlength="4">
                                </div>
                                <div class="col-md-4 px-md-2 px-0">
                                    <label class="form-label small text-muted">الشارع</label>
                                    <input type="text" name="street_name" class="form-control">
                                </div>
                                <div class="col-md-4 pe-md-2 pe-0">
                                    <label class="form-label small text-muted">المدينة</label>
                                    <input type="text" name="city" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-light p-3">
                        <button type="button" class="btn btn-light fw-bold" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-primary fw-bold px-4 rounded-pill">حفظ وتسجيل</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- 2. Credentials Modal -->
    <div class="modal fade" id="credsModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title fw-bold">إعدادات الربط الحكومي</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <form action="/dev/company/update-creds" method="POST">
                    <div class="modal-body p-4">
                        <input type="hidden" name="company_id" id="creds_company_id">
                        <input type="hidden" name="country_code" id="creds_country_code">

                        <div id="egypt_fields" style="display:none;">
                            <div class="alert alert-light border border-primary border-opacity-25 d-flex gap-3 align-items-center mb-4">
                                <i class="bi bi-info-circle-fill text-primary fs-4"></i>
                                <div class="small text-muted">
                                    يجب استخراج <b>Client ID & Secret</b> من بوابة الفواتير (ERP) وإدخالهم هنا.
                                    <a href="https://invoicing.eta.gov.eg" target="_blank" class="fw-bold text-decoration-none d-block mt-1">فتح بوابة الضرائب ↗</a>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Client ID</label>
                                <input type="text" name="client_id" id="client_id" class="form-control font-monospace">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Client Secret</label>
                                <input type="password" name="client_secret" id="client_secret" class="form-control font-monospace">
                            </div>
                        </div>

                        <div id="saudi_fields" style="display:none;">
                            <div class="alert alert-light border border-success border-opacity-25 d-flex gap-3 align-items-center mb-4">
                                <i class="bi bi-check-circle-fill text-success fs-4"></i>
                                <div class="small text-muted">
                                    اطلب كود <b>OTP</b> (6 أرقام) من بوابة "فاتورة" (قسم الوحدات) وأدخله لتفعيل الربط فوراً.
                                    <a href="https://fatoora.zatca.gov.sa" target="_blank" class="fw-bold text-success text-decoration-none d-block mt-1">فتح بوابة فاتورة ↗</a>
                                </div>
                            </div>
                            <div class="text-center">
                                <label class="form-label fw-bold mb-3">رمز التفعيل (OTP)</label>
                                <input type="text" name="otp" class="form-control form-control-lg text-center fw-bold letter-spacing-3 fs-2" maxlength="6" placeholder="------">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer bg-light p-3">
                        <button type="submit" class="btn btn-success w-100 fw-bold rounded-pill py-2">تأكيد الربط</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- 3. Allocate Modal -->
    <div class="modal fade" id="allocateModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body p-4 text-center">
                    <div class="mb-3 text-primary bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle">
                        <i class="bi bi-wallet2 fs-1"></i>
                    </div>
                    <h5 class="fw-bold mb-1">إضافة رصيد</h5>
                    <p class="text-muted small mb-4">خصم من محفظتك وإيداع للعميل</p>
                    
                    <form action="/dev/allocate-balance" method="POST">
                        <input type="hidden" name="company_id" id="alloc_company_id">
                        <div class="form-floating mb-3">
                            <input type="number" name="amount" class="form-control text-center fw-bold fs-4" id="floatAmount" placeholder="0.00" step="0.01" required>
                            <label for="floatAmount" class="w-100 text-center">المبلغ (<span id="alloc_currency"></span>)</label>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 fw-bold rounded-pill">تأكيد</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- 4. Auth Info Modal (Updated for Username & Password) -->
    <div class="modal fade" id="authModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h6 class="modal-title fw-bold"><i class="bi bi-shield-lock me-2"></i>إدارة بيانات دخول المتجر</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-4">
                        <label class="form-label small text-muted fw-bold">اسم المستخدم الحالي</label>
                        <div class="input-group">
                            <input type="text" id="auth_user_display" class="form-control bg-light text-dark fw-bold font-monospace" readonly>
                            <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText(document.getElementById('auth_user_display').value)">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                        <small class="text-muted fst-italic ms-1">يستخدمه العميل للدخول للنظام.</small>
                    </div>
                    
                    <hr>

                    <form action="/dev/update-store-auth" method="POST" class="mt-3">
                        <input type="hidden" name="company_id" id="auth_company_id">
                        
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-secondary">اسم مستخدم جديد (اختياري)</label>
                            <input type="text" name="new_username" class="form-control" placeholder="اترك فارغاً إذا لا تريد التغيير">
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-secondary">كلمة مرور جديدة (اختياري)</label>
                            <input type="text" name="new_password" class="form-control" placeholder="اترك فارغاً إذا لا تريد التغيير" minlength="6">
                        </div>

                        <button type="submit" class="btn btn-dark w-100 fw-bold py-2 rounded-pill">حفظ التعديلات</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- JS Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // 1. Registration Logic
        function toggleCountryFields() {
            const isSA = document.getElementById('c_sa').checked;
            if (isSA) {
                document.getElementById('fields_sa').style.display = 'flex';
                document.getElementById('fields_eg').style.display = 'none';
                
                document.querySelector('input[name="tax_id_sa"]').required = true;
                document.querySelector('input[name="building_no"]').required = true;
                document.querySelector('input[name="street_name"]').required = true;
                document.querySelector('input[name="city"]').required = true;
                
                document.querySelector('input[name="tax_id_eg"]').required = false;
                document.querySelector('input[name="address_eg"]').required = false;
            } else {
                document.getElementById('fields_sa').style.display = 'none';
                document.getElementById('fields_eg').style.display = 'flex';
                
                document.querySelector('input[name="tax_id_sa"]').required = false;
                document.querySelector('input[name="building_no"]').required = false;
                document.querySelector('input[name="street_name"]').required = false;
                document.querySelector('input[name="city"]').required = false;

                document.querySelector('input[name="tax_id_eg"]').required = true;
                document.querySelector('input[name="address_eg"]').required = true;
            }
        }

        function validateRegistration(form) {
            const isSA = document.getElementById('c_sa').checked;
            if (isSA) {
                const val = form.tax_id_sa.value;
                if (!/^3\d{13}3$/.test(val)) {
                    alert('⚠️ الرقم الضريبي السعودي يجب أن يكون 15 رقم ويبدأ وينتهي بـ 3');
                    return false;
                }
            } else {
                const val = form.tax_id_eg.value;
                if (!/^\d{9}$/.test(val)) {
                    alert('⚠️ رقم التسجيل الضريبي المصري يجب أن يكون 9 أرقام');
                    return false;
                }
            }
            return true;
        }

        // 2. Credentials Modal
        function openCredsModal(comp) {
            document.getElementById('creds_company_id').value = comp.id;
            document.getElementById('creds_country_code').value = comp.country_code;
            
            let creds = {};
            try { creds = JSON.parse(comp.api_credentials || '{}'); } catch(e) {}

            if(comp.country_code === 'EG') {
                document.getElementById('egypt_fields').style.display = 'block';
                document.getElementById('saudi_fields').style.display = 'none';
                document.getElementById('client_id').value = creds.client_id || '';
                document.getElementById('client_secret').value = creds.client_secret || '';
            } else {
                document.getElementById('egypt_fields').style.display = 'none';
                document.getElementById('saudi_fields').style.display = 'block';
            }
            new bootstrap.Modal(document.getElementById('credsModal')).show();
        }

        // 3. Allocate
        function openAllocateModal(id, name, curr) {
            document.getElementById('alloc_company_id').value = id;
            document.getElementById('alloc_currency').innerText = curr;
            new bootstrap.Modal(document.getElementById('allocateModal')).show();
        }

        // 4. Auth Modal (Updated Logic)
        function openAuthModal(id, name, username) {
            document.getElementById('auth_company_id').value = id;
            document.getElementById('auth_user_display').value = username;
            new bootstrap.Modal(document.getElementById('authModal')).show();
        }
    </script>
</body>
</html>
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
app.get('/dev/login', (req, res) => {
    if (req.session.developerId) {
        return res.redirect('/dev-dashboard');
    }
    res.render('dev-login'); // تأكد من وجود ملف views/dev-login.ejs
});

// معالجة تسجيل الدخول (POST)
app.post('/dev/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [devs] = await pool.query('SELECT * FROM developers WHERE email = ?', [email]);

        if (devs.length === 0) {
            return res.status(401).send("البريد الإلكتروني غير مسجل");
        }

        const developer = devs[0];
        const isValid = await bcrypt.compare(password, developer.password);

        if (!isValid) {
            return res.status(401).send("كلمة المرور خاطئة");
        }

        req.session.developerId = developer.id;
        res.redirect('/dev-dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).send("خطأ في السيرفر");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));











