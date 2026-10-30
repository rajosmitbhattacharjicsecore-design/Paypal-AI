import os

class PayPalAdapter:
    """Safe adapter boundary. Demo mode never contacts PayPal or moves money."""
    def __init__(self):
        self.mode = os.getenv("PAYPAL_MODE", "demo").lower()

    def create_invoice(self, invoice):
        if self.mode != "sandbox":
            return {
                "mode": "demo",
                "provider": "PayPal sandbox adapter (not connected)",
                "reference": f"DEMO-INV-{invoice.id:05d}",
                "status": "Draft"
            }
        raise NotImplementedError(
            "Sandbox adapter credentials and OAuth/API implementation are not configured yet."
        )

paypal = PayPalAdapter()
