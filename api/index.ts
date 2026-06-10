import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { initializeApp as serverInitApp } from "firebase/app";
import { getFirestore as serverGetFS, doc as serverDoc, updateDoc as serverUpdateDoc, collection as serverCollection, addDoc as serverAddDoc } from "firebase/firestore";

dotenv.config();

// Load Firebase configuration safely without importing JSON via ES Modules
let serverFirebaseConfig: any;
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  serverFirebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (e) {
  console.error("Failed to load /firebase-applet-config.json via fs.readFileSync:", e);
  // Fallback to empty config to prevent crash
  serverFirebaseConfig = {
    projectId: "tech-gadgets-kenya",
    firestoreDatabaseId: "(default)"
  };
}

const app = express();

// Initialize server-side Firebase
const serverApp = serverInitApp(serverFirebaseConfig);
const serverDb = serverGetFS(serverApp, serverFirebaseConfig.firestoreDatabaseId || "(default)");

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// API routes RANGE
app.post("/api/ai/chat", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  const { message, history, productsContext } = req.body;

  try {
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
4. Keep in mind: Customers pay securely with Paystack (which supports Cards and Mobile Money). Standard delivery is immediate to Nairobi and within 24 hours to the rest of Kenya.
5. Do not share raw internal project configurations. Refer to the store pricing in Kenyan Shillings (KES).
`;

    const contents = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    
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

    const replyText = response.text || "I was unable to formulate a response. Please try again.";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

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
      parsedResult = {
        description: resultText.replace(/\*/g, ""),
        specifications: "Processor: Premium Specs\nGraphics: High Performance"
      };
    }

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

app.get("/api/paystack/check-config", (req, res) => {
  const rawSecret = process.env.PAYSTACK_SECRET_KEY;
  const isPaystackSecretValid = !!(rawSecret && 
    rawSecret.trim() !== "" && 
    rawSecret.startsWith("sk_") && 
    !rawSecret.includes("your") && 
    !rawSecret.includes("YOUR") && 
    !rawSecret.includes("placeholder") && 
    rawSecret.trim().length >= 15);

  res.json({
    configured: isPaystackSecretValid,
    message: isPaystackSecretValid 
      ? "Paystack API key is correctly defined in the environment." 
      : "PAYSTACK_SECRET_KEY is missing or invalid. Payments will fall back to simulation mode."
  });
});

app.post("/api/email/send-receipt", async (req, res) => {
  const { orderId, email, order } = req.body;

  if (!email || !order) {
    return res.status(400).json({ error: "Missing required parameters: email and order details." });
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Tech Gadgets Kenya" <receipts@techgadgetskenya.co.ke>';

  const itemsListHtml = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
        <div style="font-weight: bold; color: #222222;">${item.name}</div>
        <div style="font-size: 11px; color: #777777;">Brand: ${item.brand}</div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold;">KES ${item.price.toLocaleString()}</td>
    </tr>
  `).join("");

  const emailHtmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 3px solid #C5A059;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Tech Gadgets Kenya</h1>
        <p style="color: #C5A059; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Premium Electronics Authorized Distributor</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-top: 0; font-size: 18px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Official Fiscal Invoice & Receipt</h2>
        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Dear Client,</p>
        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Thank you for your purchase from Tech Gadgets Kenya! Your transaction of order <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> has been captured successfully. Below is a detailed record of your purchase.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Order ID:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Date:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">${new Date(order.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Customer Name:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Delivery Address:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">${order.shippingAddress}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Payment Provider:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #C5A059; font-weight: bold;">${order.paymentProvider}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;"><strong>Payment Status:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #2e7d32; font-weight: bold;">${order.paymentStatus}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #111111; font-size: 15px; margin-bottom: 10px;">Purchased Items</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="padding: 10px; border-bottom: 2px solid #dddddd; text-align: left;">Item Description</th>
              <th style="padding: 10px; border-bottom: 2px solid #dddddd; text-align: center;">Qty</th>
              <th style="padding: 10px; border-bottom: 2px solid #dddddd; text-align: right;">Unit Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Total Amount:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #C5A059; font-size: 15px;">KES ${order.totalAmount?.toLocaleString()}/=</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 11px; color: #777777; text-align: center; line-height: 1.6;">
          <p><strong>Physical Address:</strong> Kenyatta Pioneer Building, Kenyatta Avenue, 5th Floor, Shop 514 (Next to I&M Building), Nairobi, Kenya.</p>
          <p>Contact Email: <a href="mailto:info@techgadgetskenya.co.ke" style="color: #C5A059; text-decoration: none;">info@techgadgetskenya.co.ke</a> | M-Pesa Till No: 9309020</p>
          <p style="margin-top: 10px; font-weight: bold; color: #333333;">This invoice copy is verified electronically. Thank you for your business!</p>
        </div>
      </div>
    </div>
  `;

  const isSmtpConfigured = !!(host && user && pass);

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from,
        to: email,
        subject: `[Receipt] Tech Gadgets Kenya - Order #${orderId.substring(0, 8).toUpperCase()}`,
        html: emailHtmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Dispatcher] Real Email sent via SMTP: ${info.messageId}`);
      
      return res.json({
        success: true,
        message: "Receipt dispatched successfully to user inbox.",
        recipient: email,
        deliveryMode: "live",
        messageId: info.messageId
      });
    } catch (err: any) {
      console.error("[Email Dispatcher] Outbound SMTP transport crash:", err);
      // Fallback if SMTP fails to let user see successful simulation response
      return res.json({
        success: true,
        message: `Outbound SMTP failed: ${err.message || String(err)}. Simulated delivery response fallback applied.`,
        recipient: email,
        deliveryMode: "simulated-fallback"
      });
    }
  } else {
    console.log(`[Email Dispatcher] SMTP credentials undefined on Server. Simulator dispatched mock invoice email to client at ${email}.`);
    return res.json({
      success: true,
      message: "Receipt successfully processed and simulated.",
      recipient: email,
      deliveryMode: "simulated"
    });
  }
});

const paystackPaymentsMap = new Map<string, { status: "pending" | "success" | "failed"; reference: string; orderId: string; amount: number; message?: string }>();

app.post("/api/paystack/initialize", async (req, res) => {
  const { email, amount, orderId } = req.body;
  if (!email || !amount || !orderId) {
    return res.status(400).json({ error: "Email, amount, and orderId parameters are required to initialize Paystack transaction." });
  }

  const rawSecret = process.env.PAYSTACK_SECRET_KEY;
  const isPaystackSecretValid = !!(rawSecret && 
    rawSecret.trim() !== "" && 
    rawSecret.startsWith("sk_") && 
    !rawSecret.includes("your") && 
    !rawSecret.includes("YOUR") && 
    !rawSecret.includes("placeholder") && 
    rawSecret.trim().length >= 15);

  const paystackSecret = isPaystackSecretValid ? rawSecret : null;

  if (!paystackSecret) {
    const reference = "PSTK-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    paystackPaymentsMap.set(reference, {
      status: "pending",
      reference,
      orderId,
      amount
    });

    return res.json({
      success: true,
      mode: "simulated",
      authorization_url: `https://checkout.paystack.com/simulated-pay/${reference}`,
      reference,
      message: "Paystack transaction simulation initialized properly (API key is simulated/empty)."
    });
  }

  try {
    const callbackUrl = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, "")}/?paystack_ref=${orderId}`
      : `http://localhost:3000/?paystack_ref=${orderId}`;

    const payload = {
      email,
      amount: Math.round(amount * 100),
      currency: "KES",
      callback_url: callbackUrl,
      metadata: {
        orderId,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId
          }
        ]
      }
    };

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data: any;
    const contentType = paystackResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await paystackResponse.json();
    } else {
      const text = await paystackResponse.text();
      throw new Error(`Paystack API returned invalid non-JSON response (status ${paystackResponse.status}): ${text.slice(0, 150)}`);
    }

    if (paystackResponse.ok && data.status) {
      const reference = data.data.reference;
      paystackPaymentsMap.set(reference, {
        status: "pending",
        reference,
        orderId,
        amount
      });

      return res.json({
        success: true,
        mode: "real",
        authorization_url: data.data.authorization_url,
        reference,
        message: "Paystack live transaction initialized successfully."
      });
    } else {
      throw new Error(data.message || "Paystack Gateway rejected initial handshake payload.");
    }

  } catch (err: any) {
    console.error("Paystack Initialization Failure:", err);
    res.status(500).json({
      error: `Paystack API checkout connection error: ${err.message || "Verify secret credentials"}`
    });
  }
});

app.get("/api/paystack/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  const payment = paystackPaymentsMap.get(reference);

  const rawSecret = process.env.PAYSTACK_SECRET_KEY;
  const isPaystackSecretValid = !!(rawSecret && 
    rawSecret.trim() !== "" && 
    rawSecret.startsWith("sk_") && 
    !rawSecret.includes("your") && 
    !rawSecret.includes("YOUR") && 
    !rawSecret.includes("placeholder") && 
    rawSecret.trim().length >= 15);

  const paystackSecret = isPaystackSecretValid ? rawSecret : null;

  if (!paystackSecret) {
    if (payment) {
      payment.status = "success";
      paystackPaymentsMap.set(reference, payment);
    }
    return res.json({
      success: true,
      mode: "simulated",
      status: "success",
      reference,
      message: "Payment successfully verified and completed through Paystack simulation hub (API key is simulated/empty)."
    });
  }

  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`
      }
    });

    let data: any;
    const contentType = paystackResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await paystackResponse.json();
    } else {
      const text = await paystackResponse.text();
      throw new Error(`Paystack verification endpoint returned non-JSON response (status ${paystackResponse.status}): ${text.slice(0, 150)}`);
    }

    if (paystackResponse.ok && data.status && data.data?.status === "success") {
      if (payment) {
        payment.status = "success";
        paystackPaymentsMap.set(reference, payment);
      }
      return res.json({
        success: true,
        mode: "real",
        status: "success",
        reference,
        data: data.data,
        message: "Payment checked and fully validated on Paystack ecosystem."
      });
    } else {
      if (payment) {
        payment.status = "failed";
        paystackPaymentsMap.set(reference, payment);
      }
      return res.status(400).json({
        success: false,
        error: data.message || "Failed verifying transaction settlement status on Paystack gateway."
      });
    }
  } catch (err: any) {
    console.error("Paystack Verification service crash:", err);
    res.status(500).json({
      error: `Paystack core integration status lookup exploded: ${err.message}`
    });
  }
});

app.post("/api/paystack/webhook", async (req, res) => {
  try {
    const rawSecret = process.env.PAYSTACK_SECRET_KEY;
    const isPaystackSecretValid = !!(rawSecret && 
      rawSecret.trim() !== "" && 
      rawSecret.startsWith("sk_") && 
      !rawSecret.includes("your") && 
      !rawSecret.includes("YOUR") && 
      !rawSecret.includes("placeholder") && 
      rawSecret.trim().length >= 15);

    const paystackSecret = isPaystackSecretValid ? rawSecret : null;

    const signature = req.headers["x-paystack-signature"];
    if (paystackSecret && signature) {
      try {
        const hash = crypto
          .createHmac("sha512", paystackSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        
        if (hash !== signature) {
          console.warn("Paystack Webhook Security Warning: Received request with non-matching HMAC signature.");
        }
      } catch (cryptoErr) {
        console.error("Webhook signature digest computation crashed:", cryptoErr);
      }
    }

    const { event, data } = req.body || {};
    console.log(`Paystack Webhook: Received event '${event || "none"}'`);

    if (event === "charge.success" && data) {
      const reference = data.reference;
      let orderId = data.metadata?.orderId;
      if (!orderId && Array.isArray(data.metadata?.custom_fields)) {
        const oIdField = data.metadata.custom_fields.find((f: any) => f.variable_name === "order_id" || f.display_name === "Order ID");
        orderId = oIdField?.value;
      }

      console.log(`Paystack Webhook matching order validation: Ref=${reference}, OrderID=${orderId || "none"}`);

      if (reference) {
        const payment = paystackPaymentsMap.get(reference);
        paystackPaymentsMap.set(reference, {
          status: "success",
          reference,
          orderId: orderId || payment?.orderId || "unknown",
          amount: data.amount ? data.amount / 100 : (payment?.amount || 0),
          message: "Payment successfully verified and parsed through server-side Webhook loop."
        });

        if (orderId) {
          try {
            const orderRef = serverDoc(serverDb, "orders", orderId);

            await serverUpdateDoc(orderRef, {
              paymentStatus: "Paid",
              receiptNo: reference,
              updatedAt: new Date().toISOString()
            });

            console.log(`Paystack Webhook Success: Order ${orderId} marked as settled in Firestore.`);
          } catch (dbErr: any) {
            console.error("Paystack Webhook db sync failed:", dbErr.message || dbErr);
          }
        }
      }
    }

    res.status(200).json({ status: "success", message: "Paystack Webhook resolved successfully." });
  } catch (err: any) {
    console.error("Paystack Webhook Handler Error:", err);
    res.status(500).json({ error: `Internal Webhook Error: ${err.message}` });
  }
});

// Create Global Error Utility for logging module loading, server exceptions, and routes failures
async function logToFirestoreErrorStore(errorType: string, message: string, stack: string | null, details: any = {}) {
  try {
    const errorLogsRef = serverCollection(serverDb, "error-log");
    await serverAddDoc(errorLogsRef, {
      errorType,
      message,
      stack,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    });
    console.log(`[Error Store] Successfully logged '${errorType}' incident to Firestore: ${message}`);
  } catch (dbErr) {
    console.error("[Error Store] Critical Failure: Could not write incident log to Firestore:", dbErr);
  }
}

// Global process listeners to capture startup / module-loading path resolution issues
process.on("uncaughtException", (err: any) => {
  console.error("CRITICAL UNCAUGHT EXCEPTION:", err);
  const isModuleNotFound = err?.code === "ERR_MODULE_NOT_FOUND" || err?.message?.includes("Cannot find module");
  logToFirestoreErrorStore(
    isModuleNotFound ? "MODULE_NOT_FOUND" : "UNCAUGHT_EXCEPTION",
    err?.message || String(err),
    err?.stack || null,
    { code: err?.code }
  );
});

process.on("unhandledRejection", (reason: any) => {
  console.error("CRITICAL UNHANDLED REJECTION:", reason);
  logToFirestoreErrorStore(
    "UNHANDLED_REJECTION",
    reason?.message || String(reason),
    reason?.stack || null
  );
});

// Express route error resolution middleware
app.use(async (err: any, req: any, res: any, next: any) => {
  console.error("Express App Handler Caught Incident:", err);
  const isModuleNotFound = err?.code === "ERR_MODULE_NOT_FOUND" || err?.message?.includes("Cannot find module");
  
  await logToFirestoreErrorStore(
    isModuleNotFound ? "MODULE_NOT_FOUND" : "ROUTE_EXCEPTION",
    err?.message || String(err),
    err?.stack || null,
    {
      code: err?.code || null,
      path: req?.path || null,
      method: req?.method || null,
      query: req?.query || null
    }
  );

  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || String(err),
    code: err?.code || null
  });
});

export default app;
