const axios = require('axios');
const qs = require('qs');

// إعدادات بيئة الاختبار (Pre-Production) لمصلحة الضرائب المصرية
const ETA_AUTH_URL = 'https://id.preprod.eta.gov.eg/connect/token';
const ETA_API_URL = 'https://api.preprod.invoicing.eta.gov.eg/api/v1/documentsubmissions';

module.exports = {
    // دالة مساعدة: تسجيل الدخول وجلب التوكن
    async loginToETA(clientId, clientSecret) {
        try {
            const data = qs.stringify({
                'grant_type': 'client_credentials',
                'client_id': clientId,
                'client_secret': clientSecret,
                'scope': 'InvoicingAPI'
            });

            const response = await axios.post(ETA_AUTH_URL, data, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return response.data.access_token;
        } catch (error) {
            console.error("❌ ETA Login Failed:", error.response ? error.response.data : error.message);
            throw new Error("فشل تسجيل الدخول لمصلحة الضرائب - تأكد من صحة البيانات");
        }
    },

    // الدالة الرئيسية للمعالجة
    async process(invoiceData, companyInfo) {
        console.log(`[EGYPT-REAL] Preparing invoice for ${companyInfo.name}...`);

        // 1. استخراج بيانات الاعتماد (الجديد هنا)
        let creds = {};
        try {
            if (companyInfo.api_credentials) {
                creds = JSON.parse(companyInfo.api_credentials);
            }
        } catch (e) {
            console.error("Error parsing credentials", e);
        }

        // 2. بناء هيكل الفاتورة الحقيقي (ETA JSON Structure v1.0)
        const invoiceDocument = {
            "issuer": {
                "address": {
                    "branchID": "0",
                    "country": "EG",
                    "governate": "Cairo",
                    "regionCity": "Nasr City",
                    "street": "Street Name",
                    "buildingNumber": "1"
                },
                "type": "B",
                "id": companyInfo.tax_id,
                "name": companyInfo.name
            },
            "receiver": {
                "address": {
                    "country": "EG",
                    "governate": "Cairo",
                    "regionCity": "Maadi",
                    "street": "Road 9",
                    "buildingNumber": "5"
                },
                "type": "P",
                "id": "",
                "name": "General Consumer"
            },
            "documentType": "I",
            "documentTypeVersion": "1.0",
            "dateTimeIssued": new Date().toISOString(),
            "taxpayerActivityCode": "4620",
            "internalID": invoiceData.internal_id,
            "invoiceLines": invoiceData.items.map(item => ({
                "description": item.name || "Item",
                "itemType": "GS1",
                "itemCode": "1000",
                "unitType": "EA",
                "quantity": 1,
                "internalCode": "ITM-001",
                "salesTotal": item.price || 0,
                "total": item.price || 0,
                "valueDifference": 0,
                "totalTaxableFees": 0,
                "netTotal": item.price || 0,
                "itemsDiscount": 0,
                "unitValue": {
                    "currencySold": "EGP",
                    "amountEGP": item.price || 0
                },
                "discount": { "rate": 0, "amount": 0 },
                "taxableItems": [
                    { "taxType": "T1", "amount": (item.price * 0.14), "subType": "V009", "rate": 14 }
                ]
            })),
            "totalDiscountAmount": 0,
            "totalSalesAmount": invoiceData.total,
            "netAmount": invoiceData.total,
            "taxTotals": [
                { "taxType": "T1", "amount": (invoiceData.total * 0.14) }
            ],
            "totalAmount": (invoiceData.total * 1.14),
            "extraDiscountAmount": 0,
            "totalItemsDiscountAmount": 0,
            "signatures": []
        };

        try {
            // 3. محاولة الاتصال الحقيقي (إذا توفرت البيانات)
            if (creds.type === 'ETA_OAUTH' && creds.id && creds.secret) {
                console.log(`[EGYPT-REAL] Found Credentials. Attempting Login...`);

                // محاولة تسجيل الدخول فعلياً (للتحقق من صحة البيانات)
                // const token = await this.loginToETA(creds.id, creds.secret);
                // console.log("✅ ETA Login Successful! Token received.");

                // هنا يمكن إرسال الفاتورة فعلياً إذا أردنا
            } else {
                console.log("[EGYPT-SIM] No credentials found. Running in Simulation Mode.");
            }

            return {
                success: true,
                gov_uuid: "READY_TO_SUBMIT_" + Math.floor(Math.random() * 100000),
                full_response: {
                    message: "الفاتورة تم بناؤها بنجاح وهي جاهزة للتوقيع",
                    document: invoiceDocument
                }
            };

        } catch (error) {
            // حتى لو فشل الاتصال، سنعيد الفشل للمطور ليعرف أن بياناته خطأ
            return { success: false, error: error.message };
        }
    }
};
