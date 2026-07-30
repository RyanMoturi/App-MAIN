# Daraja / M-PESA setup

FundiLink uses M-PESA Express (STK Push). The browser never receives Daraja
credentials and never marks a payment as successful. A job is completed only
after the backend receives a successful Safaricom callback.

## Sandbox

1. Sign in at https://developer.safaricom.co.ke/.
2. Create a sandbox app with **Lipa Na M-PESA Online / M-PESA Express**.
3. Add these environment variables to the backend host:

```env
DARAJA_ENVIRONMENT=sandbox
DARAJA_CONSUMER_KEY=...
DARAJA_CONSUMER_SECRET=...
DARAJA_SHORTCODE=174379
DARAJA_PASSKEY=...
DARAJA_CALLBACK_URL=https://fundi-backend-087d.onrender.com/api/payments/daraja/callback
```

4. Restart the backend after saving the variables.

## Production

Complete Safaricom's Daraja go-live process, then replace the sandbox values
with the production consumer key, consumer secret, shortcode, and passkey.
Set `DARAJA_ENVIRONMENT=production`. The callback must remain a public HTTPS
URL served by the FundiLink backend.

Do not commit any real Daraja credential or place it in a frontend `VITE_`
variable.
