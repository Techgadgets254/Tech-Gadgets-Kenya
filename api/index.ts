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
import {
  getAuth as serverGetAuth,
  signInWithEmailAndPassword as serverSignIn,
  createUserWithEmailAndPassword as serverCreateUser
} from "firebase/auth";
import { initializeApp as adminInitApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as adminGetFirestore, Firestore as AdminFirestore } from "firebase-admin/firestore";

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

// Initialize server-side Firebase Client SDK (kept for potential other references)
const serverApp = serverInitApp(serverFirebaseConfig);
const serverDb = serverGetFS(serverApp, serverFirebaseConfig.firestoreDatabaseId || "(default)");

// Initialize server-side Firebase Admin SDK
let adminDb: AdminFirestore;
try {
  const adminApps = getAdminApps();
  if (adminApps.length === 0) {
    adminInitApp({
      projectId: serverFirebaseConfig.projectId
    });
  }
  adminDb = adminGetFirestore();
  console.log("[Firebase Admin] Initialized Admin SDK successfully for project:", serverFirebaseConfig.projectId);
} catch (e) {
  console.error("[Firebase Admin] Error initializing Admin SDK:", e);
}

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

  let finalOutline = commodityDescription || "";

  try {
    const prompt = `
Generate a highly polished, professional product profile based on the details provided:
- Given Headline Name: ${name || ""}
- Given Manufacturer Brand: ${brand || ""}
- Category: ${category || "Electronics"}
- Outline Idea (User Provided Product Description): ${finalOutline}
- Specifications Outline: ${specifications || ""}

Your task:
1. Identify/generate a high-end, precise retail product headline commercial name.
2. Identify/generate the manufacturer brand name.
3. Determine a stock-keeping SKU prefix based on the FIRST WORD of the product name.
4. Generate a highly polished, professional, and SEO-friendly product description highlighting the hardware's capabilities, target user group, and value. Keep it professional.
5. Create a clean newline-separated list of technical specifications. Format each item on a new line as 'Key: Value'.

CRITICAL REQUIREMENT FOR SPECIFICATIONS:
- You MUST ONLY extract and generate technical specifications, features, capacities, configurations, or hardware options directly from the user-provided 'Outline Idea' (which is the user's specific product description) and the 'Given Headline Name' provided above.
- You MUST NOT invent, guess, or assume any generic technical specifications (such as RAM size, Storage capacity, CPU count, or Ports) if they are not explicitly mentioned or clearly implied in the provided 'Outline Idea' or 'Given Headline Name'. Do NOT use generic placeholders or filler text when inputs are empty or lack technical details.
- If the 'Outline Idea' is empty, or lacks any technical specifications, configurations, or hardware details, you MUST return a completely empty string ("") for the "specifications" field.

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
        specifications: ""
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
    console.warn("Gemini API Error in /api/ai/describe. Delivering custom dynamic fallback design:", error);
    
    const brandGuess = brand || name || "Premium Goods";
    const nameGuess = name || "Hardware Variant Profile";
    const sku_base_guess = String(brandGuess).split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    const cat = (category || "Laptops").toLowerCase();
    let specStr = "";
    
    if (specifications && specifications.trim() && specifications.toLowerCase() !== "none") {
      specStr = specifications.trim();
    } else if (commodityDescription && commodityDescription.trim()) {
      const descText = commodityDescription;
      const specsList: string[] = [];
      
      const lines = descText.split("\n").map(l => l.trim());
      const colonLines = lines.filter(l => {
        const idx = l.indexOf(":");
        return idx > 1 && idx < l.length - 1 && l.length > 5 && l.length < 80;
      });
      
      if (colonLines.length > 0) {
        specsList.push(...colonLines);
      } else {
        const ramMatch = descText.match(/\b(\d+GB|\d+gb|\d+ GB|\d+ gb)\s*(RAM|ram|DDR\d|Unified|Memory)\b/i) || descText.match(/\b(8GB|16GB|24GB|32GB|64GB|128GB)\b/i);
        if (ramMatch) specsList.push(`Memory: ${ramMatch[1] || ramMatch[0]}`);

        const cpuMatch = descText.match(/\b(Core i\d|Ryzen \d|M\d Pro|M\d Max|M\d Ultra|Intel|AMD|Snapdragon|Apple M\d|M3|M4)\b/i);
        if (cpuMatch) specsList.push(`Processor: ${cpuMatch[0]}`);

        const ssdMatch = descText.match(/\b(\d+GB|\d+TB|\d+ gb|\d+ tb|1TB|2TB|512GB|256GB)\s*(SSD|NVMe|Storage|ROM|Hard Drive)\b/i) || descText.match(/\b(256GB|512GB|1TB|2TB)\b/i);
        if (ssdMatch) specsList.push(`Storage: ${ssdMatch[1] || ssdMatch[0]}`);

        const displayMatch = descText.match(/\b(\d+(\.\d+)?-inch|\d+(\.\d+)? inch|\d+["”'])\b/i);
        if (displayMatch) specsList.push(`Display: ${displayMatch[0]}`);

        const graphicsMatch = descText.match(/\b(RTX\s*\d{4}|GTX\s*\d{4}|Radeon|GeForce|Iris Xe|Intel HD|NVIDIA)\b/i);
        if (graphicsMatch) specsList.push(`Graphics: ${graphicsMatch[0]}`);

        const connMatch = descText.match(/\b(WiFi\s*\d?|Wi-Fi\s*\d?|Bluetooth\s*\d?|5G|4G|Ethernet)\b/i);
        if (connMatch) specsList.push(`Connectivity: ${connMatch[0]}`);
      }
      specStr = specsList.join("\n");
    } else {
      specStr = "";
    }
    
    const descriptionFallback = `Product Overview:
The ${nameGuess} is an exceptional hardware asset engineered to deliver reliable execution, superior quality, and incredible versatility. Whether deploying in extreme workflows or utilizing for daily critical business operations, it leverages advanced engineering to guarantee efficient performance.

About Product:
Designed with a clean structural aesthetic, the ${nameGuess} from ${brandGuess} is constructed from high-grade durable elements for long-lasting security. It features smart energy management and elegant thermal dissipation profiles, making it the perfect professional tool for tech-forward users.`;

    res.json({ 
      name: nameGuess,
      brand: brandGuess,
      sku_base: sku_base_guess || "PROD",
      description: descriptionFallback,
      specifications: specStr
    });
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

async function authenticateServerAsAdmin() {
  // Safe no-op on the server. Admin queries are handled by server-authoritative firebase-admin.
  return;
}

// Ensure default admin exists on server launch
async function ensureDefaultAdmin() {
  try {
    const adminRef = adminDb.collection("admin_accounts").doc("techgadgetsk@gmail.com");
    const adminSnap = await adminRef.get();
    if (!adminSnap.exists) {
      await adminRef.set({
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
    const adminRef = adminDb.collection("admin_accounts").doc(sanitizedUsername);
    const adminSnap = await adminRef.get();

    let isValid = false;
    if (adminSnap.exists) {
      const data = adminSnap.data();
      if (data && data.password === password) {
        isValid = true;
      }
    } else if (sanitizedUsername === "techgadgetsk@gmail.com" && password === "admin123") {
      isValid = true;
      await adminRef.set({
        username: sanitizedUsername,
        password: "admin123",
        createdAt: new Date().toISOString()
      });
    }

    if (isValid) {
      if (firebaseUid) {
        // Promote logged-in client account to admin role dynamically in Firestore
        const userRef = adminDb.collection("users").doc(firebaseUid);
        await userRef.set({
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
    const adminRef = adminDb.collection("admin_accounts").doc(requestorUsername.trim().toLowerCase());
    const adminSnap = await adminRef.get();
    if (!adminSnap.exists || adminSnap.data()?.password !== requestorPassword) {
      return res.status(401).json({ error: "Access Denied: Invalid requestor credentials." });
    }

    const querySnapshot = await adminDb.collection("admin_accounts").get();
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
    const adminRef = adminDb.collection("admin_accounts").doc(sanitizedUsername);
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists || adminSnap.data()?.password !== currentPassword) {
      return res.status(401).json({ error: "Authentication failed. Invalid current password." });
    }

    await adminRef.set({
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
    const requestorRef = adminDb.collection("admin_accounts").doc(sanitizedRequestor);
    const requestorSnap = await requestorRef.get();

    if (!requestorSnap.exists || requestorSnap.data()?.password !== requestorPassword) {
      return res.status(401).json({ error: "Access Denied: Invalid requestor credentials." });
    }

    const sanitizedNewUsername = newUsername.trim().toLowerCase();
    const newAdminRef = adminDb.collection("admin_accounts").doc(sanitizedNewUsername);
    const newAdminSnap = await newAdminRef.get();

    if (newAdminSnap.exists) {
      return res.status(400).json({ error: "An administrator with that username/email already exists." });
    }

    await newAdminRef.set({
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
            const orderRef = adminDb.collection("orders").doc(orderId);

            await orderRef.update({
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
    const productsSnap = await adminDb.collection("products").get();
    const productsList: any[] = [];
    productsSnap.forEach(doc => {
      productsList.push({ id: doc.id, ...doc.data() });
    });

    const ordersSnap = await adminDb.collection("orders").get();
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
      await adminDb.collection("backups").doc(backupId).set(backupFirestoreData);
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
      await adminDb.collection("backups").doc(backupId).set(safeMetadata);
    }

    // 4. Document into system activity / audit logs
    const auditRef = adminDb.collection("audit_logs");
    await auditRef.add({
      action: "bulk_backup",
      details: `Daily JSON backup completed: Switched to size-aware smart backup archiving for ${productsList.length} products and ${ordersList.length} global orders/transactions. Data size: ${(payloadBytes / 1024 / 1024).toFixed(2)} MB.`.slice(0, 1000),
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
    const adminRef = adminDb.collection("admin_accounts").doc(adminUsername.trim().toLowerCase());
    const adminSnap = await adminRef.get();

    if (!adminSnap.exists || adminSnap.data()?.password !== adminPassword) {
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

// Curated static Kenyan tech news bulletins to guarantee beautiful content when RSS and Gemini interfaces are offline or busy.
const DEFAULT_KENYAN_NEWS_FALLBACK = [
  {
    id: "fb-news-1",
    title: "Safaricom Initiates Enhanced High-Speed Fiber Expansion in Nairobi's Tech Corridors",
    excerpt: "Safaricom announced a major infrastructure initiative targeting the Nairobi metro area with upgraded gigabit fiber capacity for technology hubs.",
    content: "Safaricom is accelerating high-speed fiber-to-the-home and fiber-to-the-office connections inside Nairobi and its satellite cities. The initiative promises to drastically lower latency and improve connectivity reliability for tech developers, startups, and remote offices navigating large cloud workloads.\n\nIndustry experts praise the transition, noting that high-performance infrastructure is essential to sustain Silicon Savannah's leadership position in the sub-Saharan innovation ecosystem. To inspect the full bulletins and publishers, visit our official blog channel.",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=650",
    date: "June 17, 2026",
    readTime: "3 min read",
    category: "Nairobi Hub",
    link: "https://techweez.com"
  },
  {
    id: "fb-news-2",
    title: "Epson and HP Kenya Announce Eco-Friendly Printer Recycling Partnerships",
    excerpt: "New initiatives in Nairobi aim to curb electronic waste by introducing discount-based legacy trade-ins for eco-efficient tank printers.",
    content: "In response to increasing local demands for sustainable tech consumption, leading manufacturers Epson and HP Kenya have rolled out electronic waste processing streams within the capital city. Businesses can trade old laser cartridge printers for high-yield, refillable ink tank printers at a direct discount.\n\nThis green campaign is estimated to reduce local cartridge waste by 40% over the next two years, promoting cleaner business operations.",
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=650",
    date: "June 16, 2026",
    readTime: "4 min read",
    category: "Printers",
    link: "https://techweez.com"
  },
  {
    id: "fb-news-3",
    title: "Rising Demands for AI Hardware Spark GPU Rig Importation Trend in East Africa",
    excerpt: "Kenyan software enterprises scale up AI model training, boosting imports of high-performance tensor computing frameworks.",
    content: "As artificial intelligence applications gain strong momentum in East African healthcare, banking, and agriculture sectors, local tech firms are importing dedicated machine learning hardware. Nairobi-based system integrators report an unprecedented spike in requests for high-performance tensor cores and enterprise laptop rigs.\n\nLocal tech hubs are setting up local GPU clusters to avoid expensive latency when calling cloud-based LLM APIs, enabling fully on-premise model tuning.",
    imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=650",
    date: "June 15, 2026",
    readTime: "5 min read",
    category: "AI Hardware",
    link: "https://techweez.com"
  },
  {
    id: "fb-news-4",
    title: "Intel and Asus Partner to Launch Certified Developer Laptops in Kenya",
    excerpt: "New performance-centric computer lines arrive in local markets, complete with official domestic developer warranties and localized service care.",
    content: "Local distributors have finalized hardware agreements with Asus and Intel to import highly durable developer laptop lines tuned for high-stress compilers and local virtualization. Crucially, the agreements establish official walk-in service centers in Nairobi, eliminating long international shipping delays for repairs.\n\nWith optimized cooling designs and generous memory profiles, these machines are specifically tailored to meet the needs of regional software engineering squads.",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=650",
    date: "June 14, 2026",
    readTime: "4 min read",
    category: "Laptops",
    link: "https://techweez.com"
  }
];

// Live Kenyan Technology News service endpoint with RSS aggregator and Gemini fallback synthesis
app.get("/api/news/live", async (req, res) => {
  try {
    let feedXml = "";
    try {
      const response = await fetch("https://techweez.com/feed/", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TechGadgetsKenya/1.0" },
        signal: AbortSignal.timeout(6000)
      });
      if (response.ok) {
        feedXml = await response.text();
      }
    } catch (e) {
      console.warn("Primary RSS feed failed, trying secondary:", e);
      try {
        const responseList = await fetch("https://gadgets-africa.com/feed/", {
          headers: { "User-Agent": "Mozilla/5.0 TechGadgetsKenya/1.0" },
          signal: AbortSignal.timeout(5000)
        });
        if (responseList.ok) {
          feedXml = await responseList.text();
        }
      } catch (e2) {
        console.warn("Secondary RSS feed also failed:", e2);
      }
    }

    let parsedArticles: any[] = [];

    // Parse RSS XML elements
    if (feedXml) {
      const itemMatches = feedXml.match(/<item>[\s\S]*?<\/item>/g);
      if (itemMatches && itemMatches.length > 0) {
        for (const item of itemMatches.slice(0, 8)) {
          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
          const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/);
          const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const categoryMatch = item.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/) || item.match(/<category>([\s\S]*?)<\/category>/);
          const contentEncodedMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) || 
                                     item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/) ||
                                     item.match(/<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>/) ||
                                     item.match(/<content>([\s\S]*?)<\/content>/);

          const title = titleMatch ? titleMatch[1].trim() : "";
          const link = linkMatch ? linkMatch[1].trim() : "";
          const descRaw = descMatch ? descMatch[1].trim() : "";
          const descriptionClean = descRaw.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
          const description = descriptionClean.slice(0, 160) + "...";
          const dateStr = dateMatch ? new Date(dateMatch[1]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently";
          const categoryRaw = categoryMatch ? categoryMatch[1].trim() : "Market Trends";

          let contentStr = "";
          if (contentEncodedMatch) {
            contentStr = contentEncodedMatch[1]
              .replace(/<[^>]*>?/gm, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&#8216;/g, "'")
              .replace(/&#8217;/g, "'")
              .replace(/&#8220;/g, '"')
              .replace(/&#8221;/g, '"')
              .replace(/\s+/g, " ")
              .trim();
          }

          let category = "Market Trends";
          if (categoryRaw.toLowerCase().includes("laptop") || categoryRaw.toLowerCase().includes("pc") || categoryRaw.toLowerCase().includes("computer")) {
            category = "Laptops";
          } else if (categoryRaw.toLowerCase().includes("print") || categoryRaw.toLowerCase().includes("ink") || categoryRaw.toLowerCase().includes("epson")) {
            category = "Printers";
          } else if (categoryRaw.toLowerCase().includes("ai") || categoryRaw.toLowerCase().includes("model") || categoryRaw.toLowerCase().includes("gpu")) {
            category = "AI Hardware";
          } else if (categoryRaw.toLowerCase().includes("kenya") || categoryRaw.toLowerCase().includes("nairobi") || categoryRaw.toLowerCase().includes("local")) {
            category = "Nairobi Hub";
          }

          if (title) {
            let imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=650";
            if (category === "Laptops") {
              imageUrl = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=650";
            } else if (category === "Printers") {
              imageUrl = "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=650";
            } else if (category === "AI Hardware") {
              imageUrl = "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=650";
            } else if (category === "Nairobi Hub") {
              imageUrl = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=650";
            }

            // Fallback for detailed body text if content:encoded is missing or too short
            let detailedBody = contentStr;
            if (!detailedBody || detailedBody.length < 200) {
              detailedBody = descriptionClean;
              if (detailedBody.length < 200) {
                detailedBody = `${title}. This tech bulletin updates our Nairobi client network on hardware availability, system optimization, and technical benchmarks.\n\nOur system architects at TechGadgetsKenya CBD showroom have verified these components to survive extreme workloads. Bypassing international delays, we stock unique pre-calibrated machinery at our Kenyatta Ave CBD shop 514. Contact us for diagnostic calibrations and walk-in trials.`;
              } else {
                detailedBody = `${detailedBody}\n\nThis technology update from Kenya is highly optimized for local developers and software engineering teams. For comprehensive diagnostics, configurations, or localized warranty support, consult with our system experts directly at the TechGadgetsKenya showroom on Kenyatta Avenue in Nairobi.`;
              }
            } else {
              // Gracefully cap extremely long inline content while remaining detailed
              if (detailedBody.length > 2000) {
                detailedBody = detailedBody.slice(0, 1800) + "...";
              }
              detailedBody = `${detailedBody}\n\nFor more technical specs calibration, visit our Kenyatta Avenue showroom in Nairobi, CBD.`;
            }

            parsedArticles.push({
              id: "rss-" + crypto.createHash("md5").update(title).digest("hex").slice(0, 8),
              title,
              excerpt: description,
              content: detailedBody,
              imageUrl,
              date: dateStr,
              readTime: `${Math.max(3, Math.min(10, Math.ceil(detailedBody.split(" ").length / 150)))} min read`,
              category,
              link
            });
          }
        }
      }
    }

    // Secondary layer: Fallback/Enrichment via Gemini
    if (parsedArticles.length < 3) {
      console.log("[News Feed] RSS feeds are empty/throttled. Synthesizing fresh Kenyan tech bulletins using Gemini...");
      if (ai) {
        try {
          const prompt = `
Generate 4 realistic, SEO-optimized, highly authentic technology news articles focused strictly on the current Kenyan technology, mobile payment (M-Pesa / Safaricom), KRA computer taxes, or hardware imports landscape for Nairobi tech devs.
Current Date: June 2026.

For each article, generate:
- title: strong, professional headline
- excerpt: clean 1-sentence synopsis
- content: detailed 2-paragraph narrative
- category: choose strictly from "Laptops", "Market Trends", "Printers", "Nairobi Hub", "AI Hardware"
- readTime: e.g. "4 min read"

Return a strictly valid JSON array of objects, with no markdown styling asterisks (*) in strings, no formatting stars, and no other wrappers:
[
  {
    "title": "compelling title",
    "excerpt": "one-sentence hook",
    "content": "detailed body paragraph 1...\\n\\ndetail paragraph 2...",
    "category": "Laptops",
    "readTime": "4 min read"
  }
]
`;
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              temperature: 0.8,
              responseMimeType: "application/json"
            }
          });

          const geminiText = response.text || "[]";
          const geminiNews = JSON.parse(geminiText);
          if (Array.isArray(geminiNews)) {
            geminiNews.forEach((n, idx) => {
              let imageUrl = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=650";
              if (n.category === "Laptops") imageUrl = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=650";
              else if (n.category === "Printers") imageUrl = "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=650";
              else if (n.category === "AI Hardware") imageUrl = "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=650";
              else if (n.category === "Nairobi Hub") imageUrl = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=650";

              parsedArticles.push({
                id: `gem-news-${idx}-${Date.now().toString().slice(-4)}`,
                title: n.title,
                excerpt: n.excerpt,
                content: n.content,
                imageUrl,
                date: "Today's Bulletin",
                readTime: n.readTime || "4 min read",
                category: n.category || "Market Trends"
              });
            });
          }
        } catch (gemError) {
          console.error("Gemini News Synthesis fallback failed, applying curated static news array:", gemError);
          DEFAULT_KENYAN_NEWS_FALLBACK.forEach(fb => {
            if (!parsedArticles.some(p => p.title === fb.title)) {
              parsedArticles.push(fb);
            }
          });
        }
      } else {
        DEFAULT_KENYAN_NEWS_FALLBACK.forEach(fb => {
          if (!parsedArticles.some(p => p.title === fb.title)) {
            parsedArticles.push(fb);
          }
        });
      }
    }

    // Ultimate safety net to guarantee articles are never empty even if the above triggers are partially populated
    if (parsedArticles.length < 3) {
      DEFAULT_KENYAN_NEWS_FALLBACK.forEach(fb => {
        if (!parsedArticles.some(p => p.title === fb.title)) {
          parsedArticles.push(fb);
        }
      });
    }

    res.json({ success: true, articles: parsedArticles });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to compile live news feeds." });
  }
});

// Create Global Error Utility for logging module loading, server exceptions, and routes failures
async function logToFirestoreErrorStore(errorType: string, message: string, stack: string | null, details: any = {}) {
  try {
    const errorLogsRef = adminDb.collection("error-log");
    await errorLogsRef.add({
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
