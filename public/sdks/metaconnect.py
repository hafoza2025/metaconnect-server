import requests
import json

class MetaConnect:
    def __init__(self, tax_id, api_secret, base_url="http://localhost:3000"):
        self.tax_id = tax_id
        self.api_secret = api_secret
        self.url = f"{base_url}/api/v1/submit"

    def send(self, invoice_data):
        payload = {
            "tax_id": self.tax_id,
            "api_secret": self.api_secret,
            "invoice": invoice_data
        }
        try:
            response = requests.post(self.url, json=payload)
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
