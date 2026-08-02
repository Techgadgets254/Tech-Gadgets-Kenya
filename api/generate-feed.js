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

  // Strategy 1: Admin SDK (Paginated and Batched)
  if (adminDb && isAdminDbAuthorized) {
    try {
      let lastDoc = null;
      let hasMore = true;
      const batchSize = 200;
      while (hasMore) {
        let query = adminDb.collection("products").limit(batchSize);
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
        const snap = await query.get();
        if (snap.empty) {
          hasMore = false;
        } else {
          snap.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
          });
          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.docs.length < batchSize) {
            hasMore = false;
          }
        }
      }
      if (products.length > 0) {
        return products;
      }
    } catch (err) {
      console.warn("[Feed Fetch] Admin SDK failed, falling back...", err.message);
    }
  }

  // Strategy 2: REST API (Paginated and Batched)
  try {
    const projectId = "tech-gadgets-kenya";
    let pageToken = "";
    let hasMore = true;
    const batchSize = 300;

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

    while (hasMore) {
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?pageSize=${batchSize}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`REST API HTTP error status: ${response.status}`);
      }
      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          const id = doc.name.split("/").pop();
          const fields = doc.fields || {};
          const prod = { id };

          for (const k of Object.keys(fields)) {
            prod[k] = parseVal(fields[k]);
          }
          products.push(prod);
        }
      }
      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        hasMore = false;
      }
    }
  } catch (err) {
    console.error("[Feed Fetch] REST API failed:", err.message);
  }

  return products;
}

function cleanTitle(title) {
  if (!title) return "";
  let text = String(title).replace(/<\/?[^>]+(>|$)/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > 150) {
    text = text.substring(0, 147) + "...";
  }
  return text;
}

function cleanDescription(htmlOrText, prodName, prodBrand) {
  let text = htmlOrText || "";
  // Strip HTML
  text = text.replace(/<\/?[^>]+(>|$)/g, " ");
  // Unescape standard entity sequences
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Normalize spacing
  text = text.replace(/\s+/g, " ").trim();
  
  if (!text) {
    text = `Buy ${prodName || "gadget"} by ${prodBrand || "Tech Sokoni Kenya"} online at the best price in Kenya.`;
  }
  
  if (text.length > 1000) {
    text = text.substring(0, 997) + "...";
  }
  return text;
}

function sanitizeGoogleMerchantImageLink(rawUrl, hostUrl) {
  if (!rawUrl) return `${hostUrl}/logo.jpg`;
  
  let url = String(rawUrl).trim();
  if (!url || url.startsWith("data:")) return `${hostUrl}/logo.jpg`;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `${hostUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  if (url.includes("images.unsplash.com")) {
    url = url.replace(/auto=[^&]*/gi, "fm=jpg");
    url = url.replace(/fm=(webp|avif|gif|png)/gi, "fm=jpg");
    if (!url.includes("fm=jpg")) {
      url += (url.includes("?") ? "&" : "?") + "fm=jpg&q=80&fit=max";
    }
  }

  const lower = url.toLowerCase();
  if (lower.includes(".svg") || lower.includes(".html") || lower.includes(".htm")) {
    return `${hostUrl}/logo.jpg`;
  }

  try {
    url = encodeURI(url);
  } catch (e) {
    return `${hostUrl}/logo.jpg`;
  }

  return url;
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
      
      const titleText = cleanTitle(prod.name);
      const descriptionText = cleanDescription(prod.description, prod.name, prod.brand);
      
      let imageLink = sanitizeGoogleMerchantImageLink(prod.image || (prod.images && prod.images[0]) || "", baseUrl);

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
      xml += `      <title><![CDATA[${titleText}]]></title>\n`;
      xml += `      <link><![CDATA[${baseUrl}/product/${prod.id}]]></link>\n`;
      xml += `      <g:image_link><![CDATA[${imageLink}]]></g:image_link>\n`;
      xml += `      <g:price>${priceVal}</g:price>\n`;
      xml += `      <g:brand><![CDATA[${prod.brand || "Generic"}]]></g:brand>\n`;
      xml += `      <g:availability>${availability}</g:availability>\n`;
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
