/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../types";

export const SUBCATEGORIES_BY_MAIN_CATEGORY: Record<string, string[]> = {
  "All": [
    "Business Laptops",
    "Workstations",
    "Gaming Laptops",
    "Budget Laptops",
    "Starter Laptops",
    "Flagship Phones",
    "Mid-Range Phones",
    "Budget Phones",
    "Laser Printers",
    "InkTank Printers",
    "All-in-One PCs",
    "Power Banks & Chargers"
  ],
  "All Electronics": [
    "Business Laptops",
    "Workstations",
    "Gaming Laptops",
    "Budget Laptops",
    "Starter Laptops",
    "Flagship Phones",
    "Mid-Range Phones",
    "Budget Phones",
    "Laser Printers",
    "InkTank Printers",
    "All-in-One PCs",
    "Power Banks & Chargers"
  ],
  "Laptops": [
    "Business Laptops",
    "Workstations",
    "Gaming Laptops",
    "Budget Laptops",
    "Starter Laptops"
  ],
  "Apple Collection": [
    "Business Laptops",
    "Workstations",
    "Flagship Phones",
    "Mid-Range Phones",
    "Smartwatches & Wearables",
    "Audio & Headphones"
  ],
  "Desktops": [
    "Business Desktops",
    "Workstation Desktops",
    "Gaming PCs",
    "All-in-One PCs",
    "Budget Towers"
  ],
  "Phones": [
    "Flagship Phones",
    "Mid-Range Phones",
    "Budget Phones",
    "Foldables & Tablets"
  ],
  "Printers": [
    "Laser Printers",
    "InkTank Printers",
    "Multifunction Printers",
    "Heavy Duty Office Printers"
  ],
  "Accessories": [
    "Audio & Headphones",
    "Power Banks & Chargers",
    "Smartwatches & Wearables",
    "Keyboards & Mice",
    "Monitors & Displays"
  ]
};

/**
 * Checks if a product matches a given subcategory, checking product.subcategory or intelligent fallback keywords.
 */
export function matchesSubcategory(product: Product, subcategory: string): boolean {
  if (!subcategory || subcategory === "All") return true;

  if (product.subcategory && product.subcategory.toLowerCase() === subcategory.toLowerCase()) {
    return true;
  }

  const name = product.name.toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const sub = subcategory.toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const price = product.price;

  if (sub.includes("business")) {
    return name.includes("business") || name.includes("thinkpad") || name.includes("probook") || name.includes("elitebook") || name.includes("latitude") || name.includes("spectre") || name.includes("xps") || desc.includes("business") || desc.includes("corporate") || desc.includes("enterprise");
  }

  if (sub.includes("workstation")) {
    return name.includes("workstation") || name.includes("zbook") || name.includes("precision") || name.includes("m3 max") || name.includes("m3 pro") || name.includes("ryzen 9") || desc.includes("workstation") || desc.includes("3d video") || desc.includes("rendering");
  }

  if (sub.includes("gaming")) {
    return name.includes("gaming") || name.includes("rog") || name.includes("tuf") || name.includes("legion") || name.includes("rtx") || desc.includes("gaming");
  }

  if (sub.includes("budget") && (cat.includes("laptop") || sub.includes("laptop"))) {
    return price < 65000 || name.includes("budget") || desc.includes("budget");
  }

  if (sub.includes("starter")) {
    return price <= 55000 || name.includes("starter") || desc.includes("starter") || name.includes("essential");
  }

  if (sub.includes("flagship")) {
    return price >= 120000 || name.includes("pro max") || name.includes("ultra") || name.includes("pixel 8 pro");
  }

  if (sub.includes("mid-range")) {
    return (price >= 60000 && price < 120000) || name.includes("iphone 13") || name.includes("s22");
  }

  if (sub.includes("budget") && (cat.includes("phone") || sub.includes("phone"))) {
    return price < 60000;
  }

  if (sub.includes("foldable") || sub.includes("tablet")) {
    return name.includes("ipad") || name.includes("tab") || name.includes("fold") || name.includes("flip");
  }

  if (sub.includes("laser")) {
    return name.includes("laser") || desc.includes("laser");
  }

  if (sub.includes("inktank")) {
    return name.includes("ecotank") || name.includes("inktank") || desc.includes("ink");
  }

  if (sub.includes("all-in-one")) {
    return cat.includes("all-in-one") || name.includes("all-in-one") || name.includes("aio") || desc.includes("all-in-one");
  }

  if (sub.includes("audio") || sub.includes("headphone")) {
    return name.includes("airpods") || name.includes("headphone") || name.includes("earbuds") || desc.includes("audio");
  }

  if (sub.includes("power") || sub.includes("charger")) {
    return name.includes("power bank") || name.includes("anker") || name.includes("charger") || desc.includes("power bank");
  }

  if (sub.includes("smartwatch") || sub.includes("wearable")) {
    return name.includes("watch") || desc.includes("titanium case") || desc.includes("smartwatch");
  }

  return false;
}
