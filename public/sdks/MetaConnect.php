<?php
/**
 * MetaConnect Official PHP SDK
 * للربط المباشر دون تعقيد
 */
class MetaConnect {
    private $taxId;
    private $apiSecret;
    private $baseUrl;

    public function __construct($taxId, $apiSecret, $baseUrl = "http://localhost:3000") {
        $this->taxId = $taxId;
        $this->apiSecret = $apiSecret;
        $this->baseUrl = $baseUrl . "/api/v1/submit";
    }

    public function send($invoiceData) {
        $payload = json_encode([
            "tax_id" => $this->taxId,
            "api_secret" => $this->apiSecret,
            "invoice" => $invoiceData
        ]);

        $ch = curl_init($this->baseUrl);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        // تخطي شهادة SSL للتجربة المحلية (احذفها في الإنتاج)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

        $response = curl_exec($ch);
        
        if (curl_errno($ch)) {
            return ["success" => false, "error" => curl_error($ch)];
        }
        
        curl_close($ch);
        return json_decode($response, true);
    }
}
?>
