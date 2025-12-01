/**
 * MetaConnect SDK v1.0
 * مكتبة الربط السحري للفوترة الإلكترونية
 */
(function (window) {
    class MetaConnectClient {
        constructor(taxId, apiSecret, options = {}) {
            this.taxId = taxId;
            this.apiSecret = apiSecret;
            // رابط السيرفر الخاص بك (غيره عند الرفع)
            this.baseUrl = options.baseUrl || 'http://localhost:3000/api/v1';
        }

        /**
         * دالة الإرسال والطباعة الذكية
         * @param {Object} invoiceData بيانات الفاتورة
         * @param {String} qrElementId (اختياري) آيدي عنصر الصورة لعرض الـ QR تلقائياً
         */
        async submit(invoiceData, qrElementId = null) {
            try {
                console.log("🚀 MetaConnect: جاري إرسال الفاتورة...");

                const response = await fetch(`${this.baseUrl}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tax_id: this.taxId,
                        api_secret: this.apiSecret,
                        invoice: invoiceData
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log("✅ MetaConnect: تم التوثيق بنجاح!");

                    // السحر: إذا أعطيتني مكان الصورة، سأرسم الـ QR لك فوراً
                    if (qrElementId) {
                        this.renderQR(result.qr_code_data, qrElementId);
                    }

                    return result;
                } else {
                    throw new Error(result.error || "فشل غير معروف");
                }

            } catch (error) {
                console.error("❌ MetaConnect Error:", error.message);
                throw error;
            }
        }

        /**
         * دالة داخلية لرسم الـ QR Code
         * تعتمد على مكتبة خارجية خفيفة أو رابط جوجل للمحاكاة
         */
        renderQR(data, elementId) {
            const imgElement = document.getElementById(elementId);
            if (imgElement) {
                // نستخدم API خارجي بسيط لتوليد الصورة للعرض المباشر
                // ملاحظة: في الإنتاج يفضل استخدام مكتبة JS محلية مثل qrcode.js
                imgElement.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
                imgElement.style.display = 'block';
            }
        }
    }

    // إتاحة المكتبة في المتصفح
    window.MetaConnect = {
        createClient: (taxId, secret) => new MetaConnectClient(taxId, secret)
    };

})(window);
