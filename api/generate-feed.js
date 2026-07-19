import { initializeApp as adminInitApp, getApps as getAdminApps, cert as adminCert } from "firebase-admin/app";
import { getFirestore as adminGetFirestore } from "firebase-admin/firestore";

let adminDb = null;
let isAdminDbAuthorized = false;

try {
  const hasServiceAccount = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (hasServiceAccount) {
    const adminApps = getAdminApps();
    let adminApp;
    if (adminApps.length === 0) {
      const config = {};
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          config.credential = adminCert(serviceAccount);
        } catch (parseErr) {
          console.error("[Firebase Admin Feed] Parse error:", parseErr);
        }
      }
      adminApp = adminInitApp(config);
    } else {
      adminApp = adminApps[0];
    }
    adminDb = adminGetFirestore(adminApp);
    isAdminDbAuthorized = true;
  }
} catch (err) {
  console.warn("[Firebase Admin Feed] Error during admin init:", err.message);
}

async function fetchProducts() {
  const products = [];

  // Strategy 1: Admin SDK
  if (adminDb && isAdminDbAuthorized) {
    try {
      const snap = await adminDb.collection("products").get();
      snap.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      if (products.length > 0) {
        return products;
      }
    } catch (err) {
      console.warn("[Feed Fetch] Admin SDK failed, falling back...", err.message);
    }
  }

  // Strategy 2: REST API (High performance, zero credentials needed)
  try {
    const projectId = "tech-gadgets-kenya";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?pageSize=1000`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          const id = doc.name.split("/").pop();
          const fields = doc.fields || {};
          const prod = { id };

          const parseVal = (value) => {
            if (!value) return null;
            if ('stringValue' in value) return value.stringValue;
            if ('integerValue' in value) return parseInt(value.integerValue, 10);
            if ('doubleValue' in value) return parseFloat(value.doubleValue);
            if ('booleanValue' in value) return value.booleanValue;
            if ('arrayValue' in value) {
              return (value.arrayValue.values || []).map((v) => parseVal(v));
            }
            if ('mapValue' in value) {
              const obj = {};
              const subFields = value.mapValue.fields || {};
              for (const k of Object.keys(subFields)) {
                obj[k] = parseVal(subFields[k]);
              }
              return obj;
            }
            if ('timestampValue' in value) return value.timestampValue;
            return null;
          };

          for (const k of Object.keys(fields)) {
            prod[k] = parseVal(fields[k]);
          }
          products.push(prod);
        }
        return products;
      }
    }
  } catch (err) {
    console.error("[Feed Fetch] REST API failed:", err.message);
  }

  return products;
}

export default async function handler(req, res) {
  try {
    const products = await fetchProducts();
    const baseUrl = "https://techsokoni.com";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title><![CDATA[Tech Sokoni Kenya]]></title>\n`;
    xml += `    <link><![CDATA[${baseUrl}]]></link>\n`;
    xml += `    <description><![CDATA[Premium Imports & Enterprise Computers in Nairobi, Kenya]]></description>\n`;

    for (const prod of products) {
      const isRefurbished = prod.category?.toLowerCase().includes("refurbished") || 
                            prod.tags?.some((t) => t.toLowerCase() === "refurbished") || 
                            prod.name?.toLowerCase().includes("refurbished");
      
      const condition = isRefurbished ? "refurbished" : "new";
      const stockNum = Number(prod.stock || 0);
      const availability = stockNum > 0 ? "in stock" : "out of stock";
      
      const cleanPriceStr = String(prod.price || "0").replace(/,/g, "").replace(/[^0-9.]/g, "").trim();
      const finalPrice = Math.round(Number(cleanPriceStr) || 0);
      const priceVal = `${finalPrice} KES`;
      
      const descriptionText = prod.description || `Buy ${prod.name} by ${prod.brand || "Tech Sokoni Kenya"} online at the best price in Kenya.`;
      
      let imageLink = prod.image || (prod.images && prod.images[0]) || "";
      if (imageLink && !imageLink.startsWith("http")) {
        imageLink = `${baseUrl}${imageLink.startsWith("/") ? "" : "/"}${imageLink}`;
      } else if (!imageLink) {
        imageLink = `${baseUrl}/src/assets/images/tech_soko_logo_1783961449391.jpg`;
      }

      let googleProductCategory = "Electronics > Computers";
      const lowerCat = (prod.category || "").toLowerCase();
      if (lowerCat.includes("laptop")) {
        googleProductCategory = "Electronics > Computers > Laptops";
      } else if (lowerCat.includes("phone")) {
        googleProductCategory = "Electronics > Communications > Telephony > Mobile Phones";
      } else if (lowerCat.includes("printer")) {
        googleProductCategory = "Electronics > Computers > Computer Accessories > Printers, Scanners & Fax Machines > Printers";
      } else if (lowerCat.includes("accessory")) {
        googleProductCategory = "Electronics > Computer Components";
      } else if (lowerCat.includes("desktop") || lowerCat.includes("all-in-one") || lowerCat.includes("aio")) {
        googleProductCategory = "Electronics > Computers > Desktop Computers";
      }

      const mpn = prod.sku || prod.id;

      xml += `    <item>\n`;
      xml += `      <g:id><![CDATA[${prod.id}]]></g:id>\n`;
      xml += `      <title><![CDATA[${prod.name}]]></title>\n`;
      xml += `      <description><![CDATA[${descriptionText}]]></description>\n`;
      xml += `      <link><![CDATA[${baseUrl}/product/${prod.id}]]></link>\n`;
      xml += `      <g:image_link><![CDATA[${imageLink}]]></g:image_link>\n`;
      xml += `      <g:price>${priceVal}</g:price>\n`;
      xml += `      <g:brand><![CDATA[${prod.brand || "Generic"}]]></g:brand>\n`;
      xml += `      <g:availability>${availability}</g:availability>\n`;
      xml += `      <g:condition>${condition}</g:condition>\n`;
      xml += `      <g:mpn><![CDATA[${mpn}]]></g:mpn>\n`;
      xml += `      <g:google_product_category><![CDATA[${googleProductCategory}]]></g:google_product_category>\n`;
      xml += `      <g:identifier_exists>false</g:identifier_exists>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml.trim());
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><error>${err.message || "Failed to generate merchant feed"}</error>`);
  }
}
