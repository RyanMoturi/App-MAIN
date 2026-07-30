const darajaBaseUrl = () =>
  process.env.DARAJA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const requiredConfiguration = () => {
  const config = {
    consumerKey: process.env.DARAJA_CONSUMER_KEY,
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
    shortcode: process.env.DARAJA_SHORTCODE,
    passkey: process.env.DARAJA_PASSKEY,
    callbackUrl: process.env.DARAJA_CALLBACK_URL,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);

  if (missing.length) {
    const error = new Error("M-PESA payments are not configured yet.");
    error.code = "DARAJA_NOT_CONFIGURED";
    error.missing = missing;
    throw error;
  }

  return config;
};

const darajaTimestamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
};

const normalizeKenyanPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;

  return null;
};

const responseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.errorMessage ||
        data.error_description ||
        data.ResponseDescription ||
        "M-PESA request failed."
    );
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
};

const getAccessToken = async () => {
  const { consumerKey, consumerSecret } = requiredConfiguration();
  const credentials = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  const response = await fetch(
    `${darajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  const data = await responseJson(response);

  if (!data.access_token) {
    throw new Error("M-PESA did not return an access token.");
  }

  return data.access_token;
};

const initiateStkPush = async ({ amount, phoneNumber, accountReference }) => {
  const config = requiredConfiguration();
  const phone = normalizeKenyanPhone(phoneNumber);

  if (!phone) {
    const error = new Error(
      "Enter a valid Safaricom number, for example 0712345678."
    );
    error.code = "INVALID_PHONE";
    throw error;
  }

  const roundedAmount = Math.round(Number(amount));
  if (!Number.isFinite(roundedAmount) || roundedAmount < 1) {
    const error = new Error("The agreed price must be at least KES 1.");
    error.code = "INVALID_AMOUNT";
    throw error;
  }

  const timestamp = darajaTimestamp();
  const password = Buffer.from(
    `${config.shortcode}${config.passkey}${timestamp}`
  ).toString("base64");
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${darajaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: roundedAmount,
        PartyA: phone,
        PartyB: config.shortcode,
        PhoneNumber: phone,
        CallBackURL: config.callbackUrl,
        AccountReference: String(accountReference).slice(0, 12),
        TransactionDesc: "FundiLink job payment",
      }),
    }
  );

  return {
    ...(await responseJson(response)),
    phone,
    amount: roundedAmount,
  };
};

module.exports = {
  initiateStkPush,
  normalizeKenyanPhone,
  requiredConfiguration,
};
