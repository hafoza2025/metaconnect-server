const axios = require('axios');

async function sendSaudiInvoice() {
    try {
        console.log("🇸🇦 جاري إرسال فاتورة سعودية (ZATCA XML)...");
        
        const response = await axios.post('http://localhost:3000/api/v1/submit', {
            tax_id: "300-400-500", // الرقم الضريبي للشركة السعودية التي أضفناها
            invoice: {
                internal_id: "KSA-INV-001",
                total: 1000.00, // سيتم إعادة حسابه داخل الهاندلر بدقة
                items: [
                    { "name": "تصميم موقع", "price": 500 },
                    { "name": "استضافة سنوية", "price": 500 }
                ]
            }
        });

        console.log("✅ تم توليد الـ XML! هذا جزء منه:");
        // طباعة أول 500 حرف فقط من الـ XML عشان ميزحمش الشاشة
        console.log(response.data.data.xml_content.substring(0, 500) + "...");

    } catch (error) {
        console.error("❌ فشل:", error.response ? error.response.data : error.message);
    }
}

sendSaudiInvoice();
