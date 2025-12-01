const axios = require('axios');

async function sendInvoice() {
    const payload = {
        tax_id: "555-666-777", // نفس الرقم الذي سجلته للشركة
        invoice: {
            internal_id: "INV-" + Math.floor(Math.random() * 10000),
            date: new Date().toISOString(),
            total: 150.00,
            items: [
                { item: "بيبسي", price: 50, qty: 2 },
                { item: "شيبسي", price: 50, qty: 1 }
            ]
        }
    };

    try {
        const res = await axios.post('http://localhost:3000/api/v1/submit', payload);
        console.log("✅ الفاتورة نجحت:");
        console.log(res.data);
    } catch (err) {
        console.log("❌ فشل:", err.response ? err.response.data : err.message);
    }
}

sendInvoice();
