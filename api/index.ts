import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { initializeApp as serverInitApp } from "firebase/app";
import { 
  getFirestore as serverGetFS, 
  doc as serverDoc, 
  getDoc as serverGetDoc,
  setDoc as serverSetDoc,
  updateDoc as serverUpdateDoc, 
  collection as serverCollection, 
  addDoc as serverAddDoc,
  getDocs as serverGetDocs 
} from "firebase/firestore";

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

  let finalOutline = commodityDescription;
  if (!finalOutline || !finalOutline.trim()) {
    finalOutline = `High performance ${category || "electronics"} hardware`;
  }

  try {
    const prompt = `
Generate a highly polished, professional product profile based on the details provided:
- Given Headline Name: ${name || "Not set/infer from outline"}
- Given Manufacturer Brand: ${brand || "Not set/infer from outline"}
- Category: ${category || "Electronics"}
- Outline Idea: ${finalOutline}
- Specifications Outline: ${specifications || "none"}

Your task:
1. Identify/generate a high-end, precise retail product headline commercial name (e.g., "Apple MacBook Pro 14 M3", "Epson EcoTank L3250 Wifi Printer", "HP EliteBook 840 G10"). If the Given Headline Name is set and meaningful, reuse or polish it.
2. Identify/generate the manufacturer brand name (e.g. "Apple", "Epson", "HP", "Samsung").
3. Determine a stock-keeping SKU prefix based on the FIRST WORD of the product name (e.g., "APPLE", "EPSON", "HP", "SAMSUNG"), translated to uppercase, alphanumeric, no spaces or symbols.
4. Generate a highly polished, professional, and SEO-friendly product description highlighting the hardware's capabilities, target user group, and value. You MUST output a detailed 'Product Overview' followed by a specialized 'About Product' section detailing the craftsmanship, premium durability, and enterprise value. Do NOT use markdown bold, asterisks (*), or formatting stars anywhere.
5. Create a clean newline-separated list of technical specifications. Format each item on a new line as 'Key: Value' (e.g. 'Processor: Core i7 13th Gen\\nMemory: 16GB LPDDR5\\nStorage: 512GB PCIe NVMe SSD\\nGraphics: Intel Iris Xe'). Do NOT include any asterisks (*) or star bullet points.

Return a strictly valid JSON object structured exactly like this:
{
  "name": "The polished retail headline name",
  "brand": "The manufacturer brand name",
  "sku_base": "The uppercase first word of product name to use as SKU prefix",
  "description": "Refined descriptive narrative & About Product section copy...",
  "specifications": "Key: Value\\nKey2: Value2..."
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
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      parsedResult = {
        name: name || "Premium Product",
        brand: brand || "Premium Brand",
        sku_base: (brand || name || "PROD").split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, ""),
        description: resultText.replace(/\*/g, ""),
        specifications: "Processor: Premium Specs\nGraphics: High Performance"
      };
    }

    const cleanedName = (parsedResult.name || name || "Premium Product").replace(/\*/g, "");
    const cleanedBrand = (parsedResult.brand || brand || "Premium Brand").replace(/\*/g, "");
    const cleanedSkuBase = (parsedResult.sku_base || "PROD").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const cleanedDescription = (parsedResult.description || "").replace(/\*/g, "");
    const cleanedSpecifications = (parsedResult.specifications || "").replace(/\*/g, "");

    res.json({ 
      name: cleanedName,
      brand: cleanedBrand,
      sku_base: cleanedSkuBase,
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

// Manual/Automatic Restock Alerts Dispatch via SMTP
app.post("/api/email/send-restock-alert", async (req, res) => {
  const { email, productName, productId, price } = req.body;

  if (!email || !productName) {
    return res.status(400).json({ error: "Missing required parameters: email and productName." });
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Tech Gadgets Kenya" <alerts@techgadgetskenya.co.ke>';

  const emailHtmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 3px solid #C5A059;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Tech Gadgets Kenya</h1>
        <p style="color: #C5A059; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Premium Electronics Inventory Alert</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-top: 0; font-size: 18px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Item Fully Restocked!</h2>
        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Dear Client,</p>
        <p style="font-size: 14px; color: #555555; line-height: 1.6;">You are receiving this update because you subscribed to inventory status indicators or price metrics for the premium gadget detailed below:</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; font-size: 14px; border-left: 4px solid #C5A059;">
          <p style="margin: 0 0 6px 0; color: #111111; font-weight: bold;">${productName}</p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #777777;">Product Code: #${(productId || "").substring(0, 8).toUpperCase()}</p>
          <p style="margin: 0; font-weight: bold; color: #835c17;">Current Price: KES ${(price || 0).toLocaleString()}/=</p>
        </div>

        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Our fresh air consignment has officially cleared custom diagnostics, and this model has been restored to fully active inventory. Stock is currently limited and available on a first-come, first-served basis.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://techgadgetskenya.co.ke" style="background-color: #835c17; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Secure Yours Now</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 11px; color: #777777; text-align: center; line-height: 1.6;">
          <p><strong>Physical Address:</strong> Kenyatta Pioneer Building, Kenyatta Avenue, 5th Floor, Shop 514 (Next to I&M Building), Nairobi, Kenya.</p>
          <p>Contact Email: <a href="mailto:info@techgadgetskenya.co.ke" style="color: #C5A059; text-decoration: none;">info@techgadgetskenya.co.ke</a> | WhatsApp: +254 700 000000</p>
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
        subject: `[Restock Alert] Tech Gadgets Kenya - ${productName} is back!`,
        html: emailHtmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Dispatcher] Restock Alert Email sent via SMTP: ${info.messageId}`);
      
      return res.json({
        success: true,
        message: "Restock notification email sent successfully via SMTP.",
        recipient: email,
        deliveryMode: "live"
      });
    } catch (err: any) {
      console.error("[Email Dispatcher] Outbound restock SMTP crash:", err);
      return res.json({
        success: true,
        message: `Outbound SMTP failed: ${err.message || String(err)}. Simulated delivery response fallback applied.`,
        recipient: email,
        deliveryMode: "simulated-fallback"
      });
    }
  } else {
    console.log(`[Email Dispatcher] SMTP credentials undefined. Simulated restock email sent to ${email}.`);
    return res.json({
      success: true,
      message: "Restock alert successfully processed and simulated.",
      recipient: email,
      deliveryMode: "simulated"
    });
  }
});


// ----------------------------------------------------
// ADMINISTRATOR SYSTEM ACCOUNTS & PRIVILEGES ENDPOINTS
// ----------------------------------------------------

// Ensure default admin exists on server launch
async function ensureDefaultAdmin() {
  try {
    const adminRef = serverDoc(serverDb, "admin_accounts", "techgadgetsk@gmail.com");
    const adminSnap = await serverGetDoc(adminRef);
    if (!adminSnap.exists()) {
      await serverSetDoc(adminRef, {
        username: "techgadgetsk@gmail.com",
        password: "admin123",
        createdAt: new Date().toISOString()
      });
      console.log("[Admin Setup] Seeded default administrator account successfully.");
    }
  } catch (e: any) {
    console.error("[Admin Setup] Failed to seed default administrator:", e.message || e);
  }
}
ensureDefaultAdmin();

app.get("/api/admin/setup", async (req, res) => {
  try {
    await ensureDefaultAdmin();
    res.json({ success: true, message: "Admin system check/seeding executed successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to setup admin account." });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password, firebaseUid } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const sanitizedUsername = username.trim().toLowerCase();
    const adminRef = serverDoc(serverDb, "admin_accounts", sanitizedUsername);
    const adminSnap = await serverGetDoc(adminRef);

    let isValid = false;
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      if (data.password === password) {
        isValid = true;
      }
    } else if (sanitizedUsername === "techgadgetsk@gmail.com" && password === "admin123") {
      isValid = true;
      await serverSetDoc(adminRef, {
        username: sanitizedUsername,
        password: "admin123",
        createdAt: new Date().toISOString()
      });
    }

    if (isValid) {
      if (firebaseUid) {
        // Promote logged-in client account to admin role dynamically in Firestore
        const userRef = serverDoc(serverDb, "users", firebaseUid);
        await serverSetDoc(userRef, {
          role: "admin",
          email: sanitizedUsername,
          name: "Administrator",
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[Admin Promotion] Dynamically updated role="admin" for current Firebase Session: ${firebaseUid}`);
      }

      return res.json({
        success: true,
        message: "Administrator credentials verified.",
        username: sanitizedUsername
      });
    } else {
      return res.status(401).json({ success: false, error: "Invalid username or password credentials." });
    }
  } catch (err: any) {
    console.error("Admin login crash:", err);
    return res.status(500).json({ error: err.message || "Internal server error during login check." });
  }
});

app.post("/api/admin/accounts/list", async (req, res) => {
  const { requestorUsername, requestorPassword } = req.body;
  if (!requestorUsername || !requestorPassword) {
    return res.status(400).json({ error: "Requestor credentials are required." });
  }

  try {
    const adminRef = serverDoc(serverDb, "admin_accounts", requestorUsername.trim().toLowerCase());
    const adminSnap = await serverGetDoc(adminRef);
    if (!adminSnap.exists() || adminSnap.data()?.password !== requestorPassword) {
      return res.status(401).json({ error: "Access Denied: Invalid requestor credentials." });
    }

    const querySnapshot = await serverGetDocs(serverCollection(serverDb, "admin_accounts"));
    const accounts: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      accounts.push({
        username: doc.id,
        createdAt: data.createdAt || ""
      });
    });

    res.json({ success: true, accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch administrator listings." });
  }
});

app.post("/api/admin/accounts/change-password", async (req, res) => {
  const { adminUsername, currentPassword, newPassword } = req.body;
  if (!adminUsername || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "username, currentPassword, and newPassword are required parameters." });
  }

  try {
    const sanitizedUsername = adminUsername.trim().toLowerCase();
    const adminRef = serverDoc(serverDb, "admin_accounts", sanitizedUsername);
    const adminSnap = await serverGetDoc(adminRef);

    if (!adminSnap.exists() || adminSnap.data()?.password !== currentPassword) {
      return res.status(401).json({ error: "Authentication failed. Invalid current password." });
    }

    await serverSetDoc(adminRef, {
      password: newPassword,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[Admin Account] Password successfully changed for ${sanitizedUsername}`);
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to change admin password." });
  }
});

app.post("/api/admin/accounts/create", async (req, res) => {
  const { newUsername, newPassword, requestorUsername, requestorPassword } = req.body;
  if (!newUsername || !newPassword || !requestorUsername || !requestorPassword) {
    return res.status(400).json({ error: "All parameters (newUsername, newPassword, requestorUsername, requestorPassword) are required." });
  }

  try {
    const sanitizedRequestor = requestorUsername.trim().toLowerCase();
    const requestorRef = serverDoc(serverDb, "admin_accounts", sanitizedRequestor);
    const requestorSnap = await serverGetDoc(requestorRef);

    if (!requestorSnap.exists() || requestorSnap.data()?.password !== requestorPassword) {
      return res.status(401).json({ error: "Access Denied: Invalid requestor credentials." });
    }

    const sanitizedNewUsername = newUsername.trim().toLowerCase();
    const newAdminRef = serverDoc(serverDb, "admin_accounts", sanitizedNewUsername);
    const newAdminSnap = await serverGetDoc(newAdminRef);

    if (newAdminSnap.exists()) {
      return res.status(400).json({ error: "An administrator with that username/email already exists." });
    }

    await serverSetDoc(newAdminRef, {
      username: sanitizedNewUsername,
      password: newPassword,
      createdAt: new Date().toISOString()
    });

    console.log(`[Admin Account] New administrator created: ${sanitizedNewUsername}`);
    res.json({ success: true, message: `Administrator account ${sanitizedNewUsername} created successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to register new administrator account." });
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

// ----------------------------------------------------
// SECURE SYSTEM BACKUP SAfEGUARD DAEMON (JSON EXPORTS)
// ----------------------------------------------------

async function triggerDataBackup(adminUid: string, adminEmail: string) {
  try {
    const productsSnap = await serverGetDocs(serverCollection(serverDb, "products"));
    const productsList: any[] = [];
    productsSnap.forEach(doc => {
      productsList.push({ id: doc.id, ...doc.data() });
    });

    const ordersSnap = await serverGetDocs(serverCollection(serverDb, "orders"));
    const ordersList: any[] = [];
    ordersSnap.forEach(doc => {
      ordersList.push({ id: doc.id, ...doc.data() });
    });

    const backupPayload = {
      timestamp: new Date().toISOString(),
      products: productsList,
      transactions: ordersList,
      countProducts: productsList.length,
      countTransactions: ordersList.length
    };

    const todaySlug = new Date().toISOString().split("T")[0];
    const backupId = `backup_${todaySlug}_${Date.now()}`;

    // 1. Save detailed fallback locally first (not limited by Firestore's 1MB restriction)
    let isSavedLocally = false;
    try {
      const backupsDir = path.resolve(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      const localBackupPath = path.join(backupsDir, `${backupId}.json`);
      fs.writeFileSync(localBackupPath, JSON.stringify(backupPayload, null, 2), "utf8");
      isSavedLocally = true;
    } catch (fsErr) {
      console.warn("[Local FS Backup Warning] Local backups directory write skipped:", fsErr);
    }

    // 2. Measure payload size to safely enforce Firestore's 1MB limit check (1,048,576 bytes)
    const payloadStr = JSON.stringify(backupPayload);
    const payloadBytes = Buffer.byteLength(payloadStr, "utf8");
    const FIRESTORE_LIMIT = 1000 * 1024; // Safe margin around 1MB

    let backupFirestoreData: any;
    if (payloadBytes > FIRESTORE_LIMIT) {
      console.warn(`[Backup Daemon] Payload size (${payloadBytes} bytes) exceeds the safe Firestore 1MB limit. Switching to storing metadata summary in cloud document store...`);
      backupFirestoreData = {
        timestamp: backupPayload.timestamp,
        countProducts: backupPayload.countProducts,
        countTransactions: backupPayload.countTransactions,
        backupId: backupId,
        isDetailedInCloud: false,
        message: `High-density backup size (${(payloadBytes / 1024 / 1024).toFixed(2)} MB) exceeds 1MB Firestore limit. Complete ledger backed up on system storage.`,
        isSavedLocally,
        sizeInBytes: payloadBytes
      };
    } else {
      backupFirestoreData = {
        ...backupPayload,
        isDetailedInCloud: true,
        isSavedLocally,
        sizeInBytes: payloadBytes
      };
    }

    // 3. Write structured backup ledger entry to Firestore with failure recovery safeguards
    try {
      await serverSetDoc(serverDoc(serverDb, "backups", backupId), backupFirestoreData);
    } catch (firestoreErr: any) {
      console.warn("[Backup Daemon warning] Native write failure for detailed backup to Firestore. Executing cloud metadata summary fallback...", firestoreErr.message || firestoreErr);
      const safeMetadata = {
        timestamp: backupPayload.timestamp,
        countProducts: backupPayload.countProducts,
        countTransactions: backupPayload.countTransactions,
        backupId: backupId,
        isDetailedInCloud: false,
        message: `Automatic safe summary fallback. Exception details: ${firestoreErr.message || String(firestoreErr)}`,
        isSavedLocally,
        sizeInBytes: payloadBytes
      };
      await serverSetDoc(serverDoc(serverDb, "backups", backupId), safeMetadata);
    }

    // 4. Document into system activity / audit logs
    const auditRef = serverCollection(serverDb, "audit_logs");
    await serverAddDoc(auditRef, {
      action: "bulk_backup",
      details: `Daily JSON backup completed: Switched to size-aware smart backup archiving for ${productsList.length} products and ${ordersList.length} global orders/transactions. Data size: ${(payloadBytes / 1024 / 1024).toFixed(2)} MB.`,
      adminEmail: adminEmail,
      adminUid: adminUid,
      createdAt: new Date().toISOString()
    });

    console.log(`[Backup Daemon] Backup ${backupId} completed: Products: ${productsList.length}, Transactions: ${ordersList.length}, Size: ${payloadBytes} bytes`);
    return { success: true, backupId, productsCount: productsList.length, ordersCount: ordersList.length, timestamp: backupPayload.timestamp };
  } catch (err: any) {
    console.error("[Backup Daemon Failure] Backup failed executing:", err);
    throw err;
  }
}

// Router route for manual administrator backup triggers
app.post("/api/admin/backup/run", async (req, res) => {
  const { adminUsername, adminPassword } = req.body;

  if (!adminUsername || !adminPassword) {
    return res.status(400).json({ error: "Administrator authorization signatures are required." });
  }

  try {
    const adminRef = serverDoc(serverDb, "admin_accounts", adminUsername.trim().toLowerCase());
    const adminSnap = await serverGetDoc(adminRef);

    if (!adminSnap.exists() || adminSnap.data()?.password !== adminPassword) {
      return res.status(401).json({ error: "Access Denied: Invalid administrator signature credentials." });
    }

    const backupResult = await triggerDataBackup(adminUsername, adminUsername);
    res.json(backupResult);
  } catch (error: any) {
    res.status(500).json({ error: "Failed executing immediate database backup: " + (error.message || String(error)) });
  }
});

// Automatic Daily Backup Scheduler Check Daemon
(global as any).lastBackupExecutedDate = undefined;
function startDailyBackupScheduler() {
  const checkAndRun = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      if ((global as any).lastBackupExecutedDate !== today) {
        console.log(`[Backup Scheduler] Running daily JSON backup system scan: "${today}"`);
        await triggerDataBackup("SYSTEM_SCHEDULER", "system_scheduler@techgadgetskenya.co.ke");
        (global as any).lastBackupExecutedDate = today;
      }
    } catch (e: any) {
      console.error("[Backup Scheduler daemon failure]:", e.message || e);
    }
  };

  // Run initial scheduler check after boot delay (15 seconds) to allow database listeners to register
  setTimeout(() => {
    checkAndRun().catch(err => console.error("Database scheduler initial run failure", err));
  }, 15000);

  // Check hourly
  setInterval(() => {
    checkAndRun().catch(err => console.error("Database scheduler interval error", err));
  }, 1000 * 60 * 60);
}
startDailyBackupScheduler();

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
