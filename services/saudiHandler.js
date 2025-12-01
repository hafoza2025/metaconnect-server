const { create } = require('xmlbuilder2');

module.exports = {
    async process(invoiceData, companyInfo) {
        console.log(`[KSA-REAL] Generating ZATCA XML for ${companyInfo.name}...`);

        // 1. استخراج بيانات الاعتماد
        let creds = {};
        try {
            if (companyInfo.api_credentials) {
                creds = JSON.parse(companyInfo.api_credentials);
            }
        } catch (e) {
            console.error("Error parsing credentials", e);
        }

        // التحقق من وجود OTP (للتجربة المستقبلية)
        if (creds.type === 'ZATCA_OTP' && creds.otp) {
            console.log(`[KSA-REAL] Using OTP: ${creds.otp} for CSID generation simulation.`);
        }

        // 2. إعداد البيانات الأساسية
        const issueDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const issueTime = new Date().toISOString().split('T')[1].split('.')[0] + 'Z'; // HH:mm:ssZ
        const invoiceRef = invoiceData.internal_id;

        // 3. بناء ملف XML (UBL 2.1 Standard)
        const doc = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('Invoice', {
                'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
                'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
            })
            // معلومات الفاتورة الأساسية
            .ele('cbc:ProfileID').txt('Reporting:1.0').up()
            .ele('cbc:ID').txt(invoiceRef).up()
            .ele('cbc:UUID').txt('20595095-8113-4c33-8331-449968082560').up() // يجب توليده ديناميكياً
            .ele('cbc:IssueDate').txt(issueDate).up()
            .ele('cbc:IssueTime').txt(issueTime).up()
            .ele('cbc:InvoiceTypeCode', { name: '0200000' }).txt('388').up() // 388 = فاتورة ضريبية
            .ele('cbc:DocumentCurrencyCode').txt('SAR').up()
            .ele('cbc:TaxCurrencyCode').txt('SAR').up()

            // بيانات البائع (Supplier)
            .ele('cac:AccountingSupplierParty')
            .ele('cac:Party')
            .ele('cac:PartyIdentification')
            .ele('cbc:ID', { schemeID: 'CRN' }).txt(companyInfo.tax_id).up()
            .up()
            .ele('cac:PartyLegalEntity')
            .ele('cbc:RegistrationName').txt(companyInfo.name).up()
            .up()
            .up()
            .up()

            // بيانات المشتري (Customer)
            .ele('cac:AccountingCustomerParty')
            .ele('cac:Party')
            .ele('cac:PartyLegalEntity')
            .ele('cbc:RegistrationName').txt('General Customer').up()
            .up()
            .up()
            .up();

        // 4. إضافة بنود الفاتورة (Invoice Lines)
        let lineTotal = 0;
        let taxTotal = 0;

        invoiceData.items.forEach((item, index) => {
            const price = parseFloat(item.price || 0);
            const vatRate = 0.15; // ضريبة السعودية 15%
            const vatAmount = price * vatRate;
            const itemTotalWithTax = price + vatAmount;

            lineTotal += price;
            taxTotal += vatAmount;

            doc.ele('cac:InvoiceLine')
                .ele('cbc:ID').txt((index + 1).toString()).up()
                .ele('cbc:InvoicedQuantity', { unitCode: 'PCE' }).txt('1').up()
                .ele('cbc:LineExtensionAmount', { currencyID: 'SAR' }).txt(price.toFixed(2)).up()
                .ele('cac:TaxTotal')
                .ele('cbc:TaxAmount', { currencyID: 'SAR' }).txt(vatAmount.toFixed(2)).up()
                .ele('cbc:RoundingAmount', { currencyID: 'SAR' }).txt((itemTotalWithTax).toFixed(2)).up()
                .up()
                .ele('cac:Item')
                .ele('cbc:Name').txt(item.name || 'Product').up()
                .ele('cac:ClassifiedTaxCategory')
                .ele('cbc:ID').txt('S').up() // S = Standard Rate
                .ele('cbc:Percent').txt('15.00').up()
                .ele('cac:TaxScheme')
                .ele('cbc:ID').txt('VAT').up()
                .up()
                .up()
                .up()
                .ele('cac:Price')
                .ele('cbc:PriceAmount', { currencyID: 'SAR' }).txt(price.toFixed(2)).up()
                .up()
                .up();
        });

        // 5. إضافة إجماليات الضرائب (Global Tax Totals)
        doc.ele('cac:TaxTotal')
            .ele('cbc:TaxAmount', { currencyID: 'SAR' }).txt(taxTotal.toFixed(2)).up()
            .up()
            .ele('cac:LegalMonetaryTotal')
            .ele('cbc:LineExtensionAmount', { currencyID: 'SAR' }).txt(lineTotal.toFixed(2)).up()
            .ele('cbc:TaxExclusiveAmount', { currencyID: 'SAR' }).txt(lineTotal.toFixed(2)).up()
            .ele('cbc:TaxInclusiveAmount', { currencyID: 'SAR' }).txt((lineTotal + taxTotal).toFixed(2)).up()
            .ele('cbc:PayableAmount', { currencyID: 'SAR' }).txt((lineTotal + taxTotal).toFixed(2)).up()
            .up();

        // تحويل المستند لنص XML
        const xmlOutput = doc.end({ prettyPrint: true });

        // 6. الرد النهائي
        return {
            success: true,
            gov_uuid: "XML_GENERATED_" + Math.floor(Math.random() * 10000),
            full_response: {
                message: "تم توليد ملف XML المطابق للمواصفات السعودية",
                xml_content: xmlOutput
            }
        };
    }
};
