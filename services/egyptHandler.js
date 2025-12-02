const axios = require('axios');
const qs = require('qs');

// روابط البيئة التجريبية (Preprod)
const ETA_ID_URL = 'https://id.preprod.eta.gov.eg';
const ETA_API_URL = 'https://api.preprod.invoicing.eta.gov.eg';

module.exports = {
    // 1. تسجيل الدخول والحصول على التوكن
    async login(clientId, clientSecret) {
        try {
            const res = await axios.post(`${ETA_ID_URL}/connect/token`, qs.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'InvoicingAPI'
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            return res.data.access_token;
        } catch (e) {
            throw new Error(`Login Failed: ${e.response?.data?.error || e.message}`);
        }
    },

    // 2. تجهيز الفاتورة وتوقيعها وإرسالها
    async process(invoiceData, companyInfo) {
        console.log(`[EG] Starting Full Process for ${companyInfo.name}...`);

        // استخراج المفاتيح
        let creds = {};
        try { creds = JSON.parse(companyInfo.api_credentials || '{}'); } catch (e) {}
        if (!creds.id || !creds.secret) return { success: false, error: "Missing Credentials" };

        try {
            // الخطوة 1: تسجيل الدخول
            const token = await this.login(creds.id, creds.secret);
            console.log("✅ Logged in to ETA");

            // الخطوة 2: بناء الفاتورة JSON
            const document = this.buildInvoiceJson(invoiceData, companyInfo);

            // الخطوة 3: التوقيع الإلكتروني (الجزء الحاسم)
            // ⚠️ هنا يجب أن يتم التوقيع باستخدام Token أو HSM
            // بما أننا لا نملك جهاز توقيع متصل الآن، هذه الدالة ستضيف توقيعاً وهمياً للتجربة
            const signedDocument = await this.signDocument(document); 

            // الخطوة 4: الإرسال للضرائب
            const submission = await axios.post(`${ETA_API_URL}/api/v1/documentsubmissions`, {
                documents: [signedDocument]
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // الخطوة 5: الرد بالنتيجة
            if (submission.data.submissionId) {
                return {
                    success: true,
                    gov_uuid: submission.data.submissionId, // رقم الإرسال
                    full_response: submission.data
                };
            } else {
                // في حالة الرفض (Rejected)
                return {
                    success: false,
                    error: "Rejected by ETA",
                    full_response: submission.data
                };
            }

        } catch (error) {
            console.error("❌ Process Failed:", error.response?.data || error.message);
            return { success: false, error: error.response?.data?.error?.message || error.message };
        }
    },

    // دالة بناء الفاتورة
    buildInvoiceJson(data, info) {
        return {
            "issuer": {
                "address": { "branchID": "0", "country": "EG", "governate": "Cairo", "regionCity": "Cairo", "street": "Street", "buildingNumber": "1" },
                "type": "B", "id": info.tax_id, "name": info.name
            },
            "receiver": {
                "address": { "country": "EG", "governate": "Cairo", "regionCity": "Cairo", "street": "Street", "buildingNumber": "1" },
                "type": "P", "id": "", "name": "Consumer"
            },
            "documentType": "I", "documentTypeVersion": "1.0",
            "dateTimeIssued": new Date().toISOString(),
            "taxpayerActivityCode": "4610",
            "internalID": data.internal_id || `INV-${Date.now()}`,
            "invoiceLines": data.items.map(item => ({
                "description": item.name,
                "itemType": "EGS", 
                "itemCode": `EG-${info.tax_id}-${item.code || '1000'}`, 
                "unitType": "EA", "quantity": 1, "internalCode": "ITM",
                "salesTotal": item.price, "total": item.price * 1.14, "valueDifference": 0, "totalTaxableFees": 0, "netTotal": item.price, "itemsDiscount": 0,
                "unitValue": { "currencySold": "EGP", "amountEGP": item.price },
                "discount": { "rate": 0, "amount": 0 },
                "taxableItems": [{ "taxType": "T1", "amount": item.price * 0.14, "subType": "V009", "rate": 14 }]
            })),
            "totalDiscountAmount": 0, "totalSalesAmount": data.total, "netAmount": data.total,
            "taxTotals": [{ "taxType": "T1", "amount": data.total * 0.14 }],
            "totalAmount": data.total * 1.14, "extraDiscountAmount": 0, "totalItemsDiscountAmount": 0,
            "signatures": [] // سيتم ملؤه في دالة التوقيع
        };
    },

    // دالة التوقيع (Placeholder)
    async signDocument(doc) {
        console.log("⚠️ Attempting to sign document...");
        
        // لكي يعمل هذا الكود حقيقة، يجب أن يكون لديك سيرفر توقيع (Signer Service)
        // مثال: const signature = await axios.post('http://localhost:9000/sign', doc);
        
        // حالياً، سنترك التوقيع فارغاً، وهذا سيجعل الضرائب ترد بـ "Invalid Signature"
        // وهذا هو "الرد الحقيقي" المتوقع في غياب التوقيع.
        return {
            ...doc,
            signatures: [
                {
                    "signatureType": "I",
                    "value": "MOCK_SIGNATURE_VALUE_FOR_TESTING_ONLY" // توقيع وهمي
                }
            ]
        };
    }
};
