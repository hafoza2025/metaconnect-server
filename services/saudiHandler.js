const { create } = require('xmlbuilder2');
const crypto = require('crypto');

// دالة مساعدة لتحويل البيانات إلى TLV Base64 (لأجل QR Code)
function getTLV(tag, value) {
    const valueBuffer = Buffer.from(String(value), 'utf8');
    const tagBuffer = Buffer.from([tag]);
    const lengthBuffer = Buffer.from([valueBuffer.length]);
    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

module.exports = {
    /**
     * الدالة الرئيسية لمعالجة الفاتورة السعودية
     */
    async process(invoiceData, companyInfo) {
        try {
            console.log(`[KSA] Processing Invoice for: ${companyInfo.name}`);

            // 1. استخراج بيانات الاعتماد
            let creds = {};
            try {
                if (companyInfo.api_credentials) {
                    creds = JSON.parse(companyInfo.api_credentials);
                }
            } catch (e) { console.error("Error parsing credentials", e); }

            // 2. إعداد التواريخ والأرقام
            const issueDate = new Date().toISOString().split('T')[0]; 
            const issueTime = new Date().toISOString().split('T')[1].split('.')[0]; 
            const invoiceRef = String(invoiceData.internal_id);
            const uuid = crypto.randomUUID(); 

            // 3. بناء ملف XML (UBL 2.1)
            const doc = create({ version: '1.0', encoding: 'UTF-8' })
                .ele('Invoice', {
                    'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
                    'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                    'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
                    'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
                });

            // 4. إضافة الامتدادات (مكان التوقيع - يترك فارغاً حالياً ليتم توقيعه لاحقاً)
            const ublExtensions = doc.ele('ext:UBLExtensions');
            ublExtensions.ele('ext:UBLExtension')
                .ele('ext:ExtensionURI').txt('urn:oasis:names:specification:ubl:dsig:enveloped:xades').up()
                .ele('ext:ExtensionContent')
                    .ele('sig:UBLDocumentSignatures', {'xmlns:sig': 'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2'})
                        .ele('sac:SignatureInformation', {'xmlns:sac': 'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2'})
                            .ele('cbc:ID').txt('urn:oasis:names:specification:ubl:signature:1').up()
                            .ele('ds:Signature', {'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#'})
                                .ele('ds:SignedInfo').up() // سيتم ملؤه بالتوقيع
                                .ele('ds:SignatureValue').up()
                                .ele('ds:KeyInfo').up()
                            .up()
                        .up()
                    .up()
                .up()
            .up();

            // 5. بيانات الفاتورة الأساسية
            doc.ele('cbc:ProfileID').txt('Reporting:1.0').up()
               .ele('cbc:ID').txt(invoiceRef).up()
               .ele('cbc:UUID').txt(uuid).up()
               .ele('cbc:IssueDate').txt(issueDate).up()
               .ele('cbc:IssueTime').txt(issueTime).up()
               .ele('cbc:InvoiceTypeCode', { name: '0100000' }).txt('388').up() // 388 = فاتورة ضريبية
               .ele('cbc:DocumentCurrencyCode').txt('SAR').up()
               .ele('cbc:TaxCurrencyCode').txt('SAR').up();

            // 6. بيانات المورد (البائع)
            doc.ele('cac:AccountingSupplierParty')
               .ele('cac:Party')
                   .ele('cac:PartyIdentification')
                       .ele('cbc:ID', { schemeID: 'CRN' }).txt(companyInfo.commercial_register || '1010101010').up()
                   .up()
                   .ele('cac:PartyTaxScheme')
                       .ele('cbc:CompanyID').txt(companyInfo.tax_id).up()
                       .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
                   .up()
                   .ele('cac:PartyLegalEntity')
                       .ele('cbc:RegistrationName').txt(companyInfo.name).up()
                   .up()
               .up()
            .up();

            // 7. بيانات العميل (المشتري)
            doc.ele('cac:AccountingCustomerParty')
               .ele('cac:Party')
                   .ele('cac:PartyLegalEntity')
                       .ele('cbc:RegistrationName').txt('General Consumer').up()
                   .up()
               .up()
            .up();

            // 8. إضافة السطور (Items)
            let lineTotal = 0;
            let taxTotal = 0;

            invoiceData.items.forEach((item, index) => {
                const price = parseFloat(item.price || 0);
                const qty = parseFloat(item.qty || 1);
                const lineAmount = price * qty;
                const taxAmount = lineAmount * 0.15;

                lineTotal += lineAmount;
                taxTotal += taxAmount;

                doc.ele('cac:InvoiceLine')
                    .ele('cbc:ID').txt((index + 1).toString()).up()
                    .ele('cbc:InvoicedQuantity', { unitCode: 'PCE' }).txt(qty.toString()).up()
                    .ele('cbc:LineExtensionAmount', { currencyID: 'SAR' }).txt(lineAmount.toFixed(2)).up()
                    .ele('cac:TaxTotal')
                        .ele('cbc:TaxAmount', { currencyID: 'SAR' }).txt(taxAmount.toFixed(2)).up()
                        .ele('cbc:RoundingAmount', { currencyID: 'SAR' }).txt((lineAmount + taxAmount).toFixed(2)).up()
                    .up()
                    .ele('cac:Item')
                        .ele('cbc:Name').txt(item.name).up()
                        .ele('cac:ClassifiedTaxCategory')
                            .ele('cbc:ID').txt('S').up()
                            .ele('cbc:Percent').txt('15.00').up()
                            .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
                        .up()
                    .up()
                    .ele('cac:Price')
                        .ele('cbc:PriceAmount', { currencyID: 'SAR' }).txt(price.toFixed(2)).up()
                    .up()
                .up();
            });

            const grandTotal = lineTotal + taxTotal;

            // 9. الإجماليات الضريبية
            doc.ele('cac:TaxTotal')
                .ele('cbc:TaxAmount', { currencyID: 'SAR' }).txt(taxTotal.toFixed(2)).up()
                .up();
            
            doc.ele('cac:LegalMonetaryTotal')
                .ele('cbc:LineExtensionAmount', { currencyID: 'SAR' }).txt(lineTotal.toFixed(2)).up()
                .ele('cbc:TaxExclusiveAmount', { currencyID: 'SAR' }).txt(lineTotal.toFixed(2)).up()
                .ele('cbc:TaxInclusiveAmount', { currencyID: 'SAR' }).txt(grandTotal.toFixed(2)).up()
                .ele('cbc:PayableAmount', { currencyID: 'SAR' }).txt(grandTotal.toFixed(2)).up()
                .up();

            // =================================================
            // 🔥 توليد QR Code (TLV Structure)
            // =================================================
            const sellerName = companyInfo.name;
            const vatReg = companyInfo.tax_id;
            const timeStamp = `${issueDate}T${issueTime}Z`;
            const totalVal = grandTotal.toFixed(2);
            const taxVal = taxTotal.toFixed(2);

            // بناء البافر (Tags 1-5)
            const qrBuffer = Buffer.concat([
                getTLV(1, sellerName),
                getTLV(2, vatReg),
                getTLV(3, timeStamp),
                getTLV(4, totalVal),
                getTLV(5, taxVal)
                // الهاش (Tag 6) والتوقيع (Tag 7) يتم إضافتهم بعد التوقيع الرقمي
            ]);
            
            const qrBase64 = qrBuffer.toString('base64');

            // إضافة QR للفاتورة
            doc.ele('cac:AdditionalDocumentReference')
                .ele('cbc:ID').txt('QR').up()
                .ele('cac:Attachment')
                    .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: 'text/plain' }).txt(qrBase64).up()
                .up()
            .up();

            // إنهاء ملف XML الأولي
            let xmlOutput = doc.end({ prettyPrint: true });

            // =================================================
            // 🔐 مرحلة التوقيع (Simulation)
            // =================================================
            // هنا المفروض نستدعي دالة التوقيع الحقيقية
            // xmlOutput = await signInvoice(xmlOutput, creds); 
            
            // حساب الهاش (لأغراض التخزين)
            const invoiceHash = crypto.createHash('sha256').update(xmlOutput).digest('base64');

            return {
                success: true,
                gov_uuid: uuid,
                invoice_hash: invoiceHash,
                qr_code: qrBase64,
                xml_file: xmlOutput, // يمكنك حفظ هذا الملف
                full_response: {
                    message: "تم إنشاء الفاتورة وتجهيزها للإرسال",
                    status: "REPORTED" // أو SUBMITTED في حالة الربط الكامل
                }
            };

        } catch (err) {
            console.error("Saudi Handler Error:", err);
            return { success: false, message: err.message };
        }
    }
};
