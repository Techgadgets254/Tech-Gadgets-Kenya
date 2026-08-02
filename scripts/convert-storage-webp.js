/**
 * Storage & Catalog WebP Image Converter Script
 *
 * Iterates through product catalog image references in Firestore,
 * checks image format encoding, compresses/converts them to WebP standard format,
 * and updates Firestore document references for Google Merchant Center compliance.
 *
 * Usage:
 *   node scripts/convert-storage-webp.js
 */

import fetch from "node-fetch";

const API_ENDPOINT = process.env.API_BASE_URL || "http://localhost:3000/api/admin/convert-catalog-webp";

async function runWebPConversion() {
  console.log("=================================================");
  console.log("⚡ TECH SOKONI - WEBP IMAGE COMPRESSION SCRIPT");
  console.log("=================================================");
  console.log(`Connecting to server endpoint: ${API_ENDPOINT}`);

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Conversion failed [HTTP ${res.status}]:`, errorText);
      process.exit(1);
    }

    const data = await res.json();
    console.log("✅ Conversion completed successfully!");
    console.log(`• Total Products Scanned: ${data.totalScanned}`);
    console.log(`• Products Updated to WebP Standard: ${data.updatedCount}`);
    
    if (data.report && data.report.length > 0) {
      console.log("\nUpdated Products Log:");
      data.report.forEach((item, idx) => {
        console.log(`  [${idx + 1}] ID: ${item.id} | Name: ${item.name}`);
      });
    } else {
      console.log("✨ All product images are already 100% WebP / Merchant Center compliant!");
    }

  } catch (err) {
    console.error("❌ Script Execution Error:", err.message);
    process.exit(1);
  }
}

runWebPConversion();
