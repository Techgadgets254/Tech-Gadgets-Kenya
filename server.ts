import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// API routes FIRST
app.post("/api/ai/chat", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  const { message, history, productsContext } = req.body;

  try {
    // Construct system instructions to ground the AI in the available stock
    const productsInfo = Array.isArray(productsContext) 
      ? productsContext.map(p => `- [${p.brand}] ${p.name} (${p.category}): KES ${p.price.toLocaleString()}. Stock: ${p.stock}. Description: ${p.description}. Specs: ${JSON.stringify(p.specifications || {})}`).join("\n")
      : "No products context available";

    const systemInstruction = `
You are the AI Hardware Specialist for "Tech Gadgets Kenya", an elite authorized electronics distributor in Nairobi, Kenya.
Your job is to assist clients professionally by answering queries about electronics, making product recommendations, comparing hardware side-by-side, and providing technical support.

Guidelines:
1. Always be professional, helpful, and objective.
2. Rely strictly on the following actual live stock database context to answer product, stock, price, and spec queries. Do not make up fake products if they aren't here unless recommending general tech types, but prioritize recommending what we sell:
=== LIVE STOCK CATALOG ===
${productsInfo}
=== END CATALOG ===

3. If users ask to compare products, build a beautifully formatted Markdown table matching their specifications, prices, and suggest the absolute best choice based on their budget and requirements.
4. Keep in mind: Customers pay securely with Safaricom M-Pesa. Standard delivery is immediate to Nairobi and within 24 hours to the rest of Kenya.
5. Do not share raw internal project configurations. Refer to the store pricing in Kenyan Shillings (KES).
`;

    // Format chat history for GoogleGenAI SDK
    const contents = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add the current user query
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Solve deprecated property access: use response.text
    const replyText = response.text || "I was unable to formulate a response. Please try again.";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// AI Feature to generate technical descriptions for products
app.post("/api/ai/describe", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  const { name, brand, category, commodityDescription, specifications } = req.body;

  if (!commodityDescription) {
    return res.status(400).json({ error: "Commodity outline / description is required to generate technical details." });
  }

  try {
    const prompt = `
Generate a highly polished, professional product description and its corresponding technical specifications for the product "${name || "Generic Product"}".

Product Context:
- Brand: ${brand || "General Hardware"}
- Category: ${category || "Electronics"}
- Outline Idea: ${commodityDescription}
- Specifications: ${specifications || "none"}

Return a strictly valid JSON object structured exactly like this:
{
  "description": "A refined, narrative description paragraph highlighting the hardware's capabilities, target user group (developers, designers, enterprise), and value. This MUST NOT contain any markdown bold characters, asterisks (*), or formatting stars.",
  "specifications": "A clean newline-separated list of technical specifications. Format each item on a new line as 'Key: Value' (e.g. 'Processor: Core i7 13th Gen\\nMemory: 16GB LPDDR5\\nStorage: 512GB PCIe NVMe SSD\\nGraphics: Intel Iris Xe'). This must contain standard key/value fields appropriate for the defined Category. Do NOT include any asterisks (*) or star bullet points."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      // Fallback parser if JSON-like but with noise
      parsedResult = {
        description: resultText.replace(/\*/g, ""),
        specifications: "Processor: Premium Specs\nGraphics: High Performance"
      };
    }

    // Double check to remove any accidental asterisks
    const cleanedDescription = (parsedResult.description || "").replace(/\*/g, "");
    const cleanedSpecifications = (parsedResult.specifications || "").replace(/\*/g, "");

    res.json({ 
      description: cleanedDescription,
      specifications: cleanedSpecifications
    });
  } catch (error: any) {
    console.error("Gemini API Error in /api/ai/describe:", error);
    res.status(500).json({ error: error.message || "Failed to generate product technical description." });
  }
});

// Safaricom Daraja Lipa Na M-Pesa Integration Endpoints
const mpesaPaymentsMap = new Map<string, { status: "pending" | "success" | "failed"; receiptNo?: string; message?: string }>();

app.post("/api/mpesa/stkpush", async (req, res) => {
  const { phone, amount, orderId } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount parameters are required to trigger M-Pesa prompt." });
  }

  const hasDarajaCredentials = 
    process.env.MPESA_CONSUMER_KEY && 
    process.env.MPESA_CONSUMER_SECRET && 
    process.env.MPESA_PASSKEY;

  if (!hasDarajaCredentials) {
    // Dual-Mode: Simulated live response when Daraja environment keys are not configured
    const checkoutRequestId = "SIM-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    mpesaPaymentsMap.set(checkoutRequestId, { status: "pending" });
    
    // Automatically flag as success in 4.5 seconds for mock fidelity
    setTimeout(() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let receiptNo = "R";
      for (let i = 0; i < 9; i++) {
        receiptNo += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      mpesaPaymentsMap.set(checkoutRequestId, { 
        status: "success", 
        receiptNo, 
        message: "STK PIN confirmed. Payment cleared successfully via local simulation gateway." 
      });
    }, 4500);

    return res.json({
      success: true,
      mode: "simulated",
      checkoutRequestId,
      message: "Lipa Na M-Pesa simulation STK prompted correctly. Auto-completing verification in 4 seconds..."
    });
  }

  // Live Safaricom Daraja STK Push Core
  try {
    // Format Telephone line to standard 254xxxxxxxxx format
    let cleanPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "254" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (!cleanPhone.startsWith("254")) {
      cleanPhone = "254" + cleanPhone;
    }

    const mEnvironment = process.env.MPESA_ENVIRONMENT || "sandbox";
    const baseUrl = mEnvironment === "production" 
      ? "https://api.safaricom.co.ke" 
      : "https://sandbox.safaricom.co.ke";
    
    // Query Daraja Access Token
    const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to retrieve Daraja token credentials: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Secure LNM Password calculations
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14); // YYYYMMDDHHMMSS e.g. 20260531120000
    const shortcode = process.env.MPESA_SHORTCODE || "174379";
    const passkey = process.env.MPESA_PASSKEY || "";
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    // Dynamic Callback determination (highly compatible with AI studio sandbox dynamic URLs)
    const callbackUrl = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, "")}/api/mpesa/callback`
      : `https://techgadgetskenya.co.ke/api/mpesa/callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: cleanPhone,
      PartyB: shortcode,
      PhoneNumber: cleanPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId ? orderId.substring(0, 12) : "TechGadget",
      TransactionDesc: `Hardware order ${orderId ? orderId.substring(0, 8) : "Checkout"}`
    };

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stkPayload)
    });

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === "0" || stkData.ResponseCode === 0) {
      const checkoutRequestId = stkData.CheckoutRequestID;
      mpesaPaymentsMap.set(checkoutRequestId, { status: "pending" });
      
      return res.json({
        success: true,
        mode: "real",
        checkoutRequestId,
        message: "Lipa Na M-Pesa STK PIN Dialogue pushed to your mobile screen. Please key in your PIN on your physical handset."
      });
    } else {
      throw new Error(stkData.ResponseDescription || stkData.CustomerMessage || "Daraja rejected parameters.");
    }

  } catch (err: any) {
    console.error("Daraja Core Failure:", err);
    res.status(500).json({ 
      error: `Daraja API connection failed: ${err.message || "Check environment secrets"}` 
    });
  }
});

app.post("/api/mpesa/callback", (req, res) => {
  console.log("Daraja Push Callback Received:", JSON.stringify(req.body));
  
  try {
    const callbackData = req.body?.Body?.stkCallback;
    if (!callbackData) {
      return res.status(400).json({ error: "Invalid callback shape format." });
    }

    const checkoutRequestId = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    if (resultCode === 0 || resultCode === "0") {
      const metaItems = callbackData.CallbackMetadata?.Item || [];
      const receiptItem = metaItems.find((itm: any) => itm.Name === "MpesaReceiptNumber");
      const receiptNo = receiptItem ? receiptItem.Value : `MP${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      mpesaPaymentsMap.set(checkoutRequestId, {
        status: "success",
        receiptNo,
        message: "Payment successfully validated and completed."
      });
      console.log(`STK Client Success callback for Checkout ${checkoutRequestId}: Code ${receiptNo}`);
    } else {
      mpesaPaymentsMap.set(checkoutRequestId, {
        status: "failed",
        message: resultDesc || "Handset user rejected PIN confirmation prompt."
      });
      console.log(`STK Client Cancel callback for Checkout ${checkoutRequestId}: Message ${resultDesc}`);
    }

    res.json({ ResultCode: 0, ResultDesc: "Safaricom callback parsed properly" });
  } catch (error: any) {
    console.error("Callback parsing crash:", error);
    res.status(500).json({ error: "Internal callback handler failed." });
  }
});

app.get("/api/mpesa/status/:checkoutRequestId", (req, res) => {
  const { checkoutRequestId } = req.params;
  const payment = mpesaPaymentsMap.get(checkoutRequestId);
  
  if (!payment) {
    return res.status(404).json({ error: "Requested transaction token not active on server." });
  }

  res.json(payment);
});

// Lipana Gateway Integration Endpoints
const lipanaPaymentsMap = new Map<string, { status: "pending" | "success" | "failed"; receiptNo?: string; message?: string }>();

app.post("/api/lipana/stkpush", async (req, res) => {
  const { phone, amount, orderId } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount parameters are required to trigger premium Lipana prompt." });
  }

  const hasLipanaCredentials = 
    process.env.LIPANA_API_KEY && 
    process.env.LIPANA_MERCHANT_ID;

  if (!hasLipanaCredentials) {
    // If Lipana keys are not configured in system environment variables, run simulated mode for a smooth developer/preview experience!
    const checkoutRequestId = "LPN-SIM-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    lipanaPaymentsMap.set(checkoutRequestId, { status: "pending" });

    setTimeout(() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let receiptNo = "LPN";
      for (let i = 0; i < 9; i++) {
        receiptNo += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      lipanaPaymentsMap.set(checkoutRequestId, {
        status: "success",
        receiptNo,
        message: "Lipana STK push verified successfully. Settlement completed through simulated Lipana hub."
      });
    }, 4500);

    return res.json({
      success: true,
      mode: "simulated",
      checkoutRequestId,
      message: "Lipana payment simulation initiated successfully! Triggering simulation push..."
    });
  }

  // Live Lipana API integration
  try {
    let cleanPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "254" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (!cleanPhone.startsWith("254")) {
      cleanPhone = "254" + cleanPhone;
    }

    // According to Lipana API standard: POST payload with credentials and payment context
    const payload = {
      api_key: process.env.LIPANA_API_KEY,
      merchant_id: process.env.LIPANA_MERCHANT_ID,
      phone: cleanPhone,
      amount: Math.round(amount),
      reference: orderId || "TGK-ORDER",
      description: `Payment for Order ${orderId ? orderId.substring(0, 8) : "Checkout"}`.substring(0, 50),
      callback_url: process.env.APP_URL 
        ? `${process.env.APP_URL.replace(/\/$/, "")}/api/lipana/callback`
        : `https://techgadgetskenya.co.ke/api/lipana/callback`
    };

    // Make live requests securely to Lipana Gateway (standard endpoint api.lipana.tech/v1/stk/push)
    const lipanaResponse = await fetch("https://api.lipana.tech/v1/stk/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LIPANA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await lipanaResponse.json();

    if (lipanaResponse.ok && (responseData.status === "success" || responseData.success || responseData.response_code === "0")) {
      const checkoutRequestId = responseData.transaction_id || responseData.request_id || responseData.CheckoutRequestID || ("LPN-" + Math.random().toString(36).substring(2, 9).toUpperCase());
      lipanaPaymentsMap.set(checkoutRequestId, { status: "pending" });

      return res.json({
        success: true,
        mode: "real",
        checkoutRequestId,
        message: responseData.message || "Lipana Gateway STK push prompted on handset."
      });
    } else {
      throw new Error(responseData.message || responseData.error || "Lipana Gateway rejected STK parameter payload.");
    }
  } catch (err: any) {
    console.error("Lipana live integration failure:", err);
    res.status(500).json({
      error: `Lipana Live Integration error: ${err.message || "Verify your Lipana keys in Secrets panel."}`
    });
  }
});

app.post("/api/lipana/callback", (req, res) => {
  console.log("Lipana Callback Triggered:", JSON.stringify(req.body));
  try {
    const transactionId = req.body.transaction_id || req.body.request_id || req.body.CheckoutRequestID;
    const status = req.body.status || req.body.state; // "success" or "completed" or equivalent
    const receiptNo = req.body.receipt || req.body.mpesa_receipt || req.body.MpesaReceiptNumber;
    const message = req.body.message || req.body.ResultDesc;

    if (transactionId) {
      if (status === "success" || status === "completed" || status === "successful" || req.body.ResultCode === 0) {
        lipanaPaymentsMap.set(transactionId, {
          status: "success",
          receiptNo: receiptNo || `LPN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          message: message || "Payment authenticated & settled on Lipana hub."
        });
      } else {
        lipanaPaymentsMap.set(transactionId, {
          status: "failed",
          message: message || "Lipana transaction request rejected by subscriber."
        });
      }
    }
    res.json({ success: true, message: "Callback processed successfully by TechGadgetsKenya server." });
  } catch (err: any) {
    console.error("Lipana Callback Parsing Error:", err);
    res.status(500).json({ error: "Failed parsing Lipana callback payload." });
  }
});

app.get("/api/lipana/status/:checkoutRequestId", (req, res) => {
  const { checkoutRequestId } = req.params;
  const payment = lipanaPaymentsMap.get(checkoutRequestId);
  if (!payment) {
    return res.status(404).json({ error: "Checkout session ID not found on Lipana memory pool." });
  }
  res.json(payment);
});

// Vite middleware and static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrapping failed:", err);
});
