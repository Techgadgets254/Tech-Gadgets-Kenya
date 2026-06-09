import express from "express";
import path from "path";
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
4. Keep in mind: Customers pay securely with Paystack (which supports Cards and Mobile Money). Standard delivery is immediate to Nairobi and within 24 hours to the rest of Kenya.
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

// Paystack Payment Integration Endpoints
const paystackPaymentsMap = new Map<string, { status: "pending" | "success" | "failed"; reference: string; orderId: string; amount: number; message?: string }>();

app.post("/api/paystack/initialize", async (req, res) => {
  const { email, amount, orderId } = req.body;
  if (!email || !amount || !orderId) {
    return res.status(400).json({ error: "Email, amount, and orderId parameters are required to initialize Paystack transaction." });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecret) {
    // Simulated Mode when keys are not configured
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
      message: "Paystack transaction simulation initialized properly."
    });
  }

  // Live Paystack API initialization
  try {
    const callbackUrl = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, "")}/?paystack_ref=${orderId}`
      : `http://localhost:3000/?paystack_ref=${orderId}`;

    const payload = {
      email,
      amount: Math.round(amount * 100), // subunits (KES cents/subunits)
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

    const data = await paystackResponse.json();

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

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

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
      message: "Payment successfully verified and completed through Paystack simulation hub."
    });
  }

  // Live transaction status verification
  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`
      }
    });

    const data = await paystackResponse.json();
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

// Vite middleware and static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
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

if (process.env.VERCEL !== "1") {
  bootstrap().catch((err) => {
    console.error("Bootstrapping failed:", err);
  });
}

export default app;
