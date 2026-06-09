/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "./types";

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "MacBook Pro 16\" M3 Max",
    brand: "Apple",
    category: "New Laptops",
    price: 345000,
    stock: 8,
    description: "The ultimate developer powerhouse. Brand-new sealed. Featuring the Apple M3 Max chip with a 16-core CPU, 40-core GPU, 48GB Unified Memory, and 1TB SSD. Liquid Retina XDR display with ProMotion.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple M3 Max (16-core CPU)",
      "Graphics": "40-core GPU, Hardware-accelerated ray tracing",
      "Memory": "48GB Unified RAM",
      "Storage": "1TB Superfast SSD",
      "Display": "16.2-inch Liquid Retina XDR, 3456 x 2234, 120Hz",
      "Battery": "Up to 22 hours",
      "OS": "macOS Sonoma"
    }
  },
  {
    name: "Refurbished HP Spectre x360 14\"",
    brand: "HP",
    category: "Refurbished Laptops",
    price: 95000,
    stock: 12,
    description: "Certified pristine condition. Premium convertible 2-in-1 laptop with stunning 2.8K OLED touchscreen, Intel Core Ultra 7 processor, 16GB RAM, and 1TB SSD. Ideal for professionals and creators.",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core Ultra 7 155H",
      "Graphics": "Intel Arc Graphics",
      "Memory": "16GB LPDDR5x",
      "Storage": "1TB PCIe Gen4 NVMe SSD",
      "Display": "14-inch 2.8K OLED Touchscreen, 120Hz",
      "Battery": "Up to 15 hours",
      "Convertible": "Yes (360-degree hinge)"
    }
  },
  {
    name: "Refurbished Lenovo ThinkPad T14 Gen 2",
    brand: "Lenovo",
    category: "Refurbished Laptops",
    price: 55000,
    stock: 18,
    description: "Certified pristine corporate refurbished business powerhouse. Legendary spill-resistant keyboard, military-grade durability, with 85%+ verified battery health and 1-year boutique warranty.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core i5-1145G7 vPro",
      "Memory": "16GB DDR4 RAM",
      "Storage": "512GB PCIe NVMe SSD",
      "Display": "14-inch Full HD IPS Anti-Glare",
      "Battery": "Up to 8 hours (85%+ capacity)",
      "OS": "Windows 11 Pro"
    }
  },
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    category: "New Phones",
    price: 189000,
    stock: 15,
    description: "Brand-new. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x optical zoom.",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "A17 Pro chip with 6-core GPU",
      "Camera": "48MP Main | 12MP Ultra Wide | 12MP 5x Telephoto",
      "Storage": "256GB NVMe",
      "Display": "6.7-inch Super Retina XDR OLED, 120Hz",
      "Material": "Aerospace-grade Titanium design",
      "Port": "USB-C (highly requested USB 3 speeds)",
      "OS": "iOS 17 (upgradable to iOS 18)"
    }
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    category: "New Phones",
    price: 169000,
    stock: 18,
    description: "Welcome to the era of mobile AI. Brand-new. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility. Built-in S-Pen.",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Snapdragon 8 Gen 3 for Galaxy",
      "Camera": "200MP Main + 50MP + 12MP + 10MP Quad Lens",
      "Storage": "512GB UFS 4.0",
      "Memory": "12GB LPDDR5X RAM",
      "Display": "6.8-inch Dynamic AMOLED 2X, QHD+, 120Hz",
      "Battery": "5000mAh with 45W Fast Charging",
      "OS": "Android 14 with One UI 6.1"
    }
  },
  {
    name: "Refurbished iPhone 13 Pro Max (Certified)",
    brand: "Apple",
    category: "Refurbished Phones",
    price: 89000,
    stock: 12,
    description: "Certified refurbished iPhone 13 Pro Max in pristine physical condition. Battery health is guaranteed above 88%. 1-year local service center warranty support.",
    image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "A15 Bionic chip",
      "Camera": "12MP Pro camera system with 3x optical zoom",
      "Display": "6.7-inch Super Retina XDR with ProMotion",
      "Battery": "Certified 88%+ health",
      "Storage": "128GB Flash NVMe",
      "OS": "iOS 17"
    }
  },
  {
    name: "Custom AMD Ryzen 9 Performance Desktop",
    brand: "Custom Rigs",
    category: "New Desktops",
    price: 245000,
    stock: 5,
    description: "Ultimate workstation desktop built for heavy compilations, 3D video-rendering, and local AI model running. Liquid water-cooled and optimized for silent operational outputs.",
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "AMD Ryzen 9 7900X (12 Cores, 5.6GHz)",
      "Graphics": "NVIDIA GeForce RTX 4070 Ti Super 16GB",
      "Memory": "64GB CORSAIR Vengeance DDR5 6000MHz",
      "Storage": "2TB Crucial T500 Gen4 NVMe SSD",
      "Cooling": "Corsair iCUE Link H150i Liquid CPU Cooler",
      "Power Supply": "850W ASUS ROG Strix Gold Certified"
    }
  },
  {
    name: "HP EliteDesk 800 G9 Tower",
    brand: "HP",
    category: "Refurbished Desktops",
    price: 115000,
    stock: 6,
    description: "Enterprise business desktop computer with high-performance security features. Compact physical design with extensive PCIe Gen4 expansion slots available for upgrades.",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core i7-13700",
      "Memory": "16GB DDR5 Dual-Channel",
      "Storage": "512GB PCIe Gen4 NVMe SSD",
      "OS": "Windows 11 Pro",
      "Ports": "6x USB 3.2, 1x DisplayPort, 1x HDMI"
    }
  },
  {
    name: "Epson EcoTank L3250 Mecha-Ink",
    brand: "Epson",
    category: "Printers",
    price: 34500,
    stock: 10,
    description: "Multifunction ink tank printer with Wi-Fi Direct. Spill-free refilling, high-yield ink bottles, and professional quality document printing for small Kenyan businesses and homes.",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Functions": "Print, Scan, Copy",
      "Connectivity": "Wi-Fi, Wi-Fi Direct, USB 2.0",
      "Print Speed": "33 ppm (Black), 15 ppm (Color)",
      "Ink Tanks": "4-color EcoTank integration",
      "Yield": "Up to 4,500 pages (Black) / 7,500 pages (Color)",
      "Warranty": "1 Year or 30,000 pages"
    }
  },
  {
    name: "Anker Prime 20,000mAh Power Bank",
    brand: "Anker",
    category: "Accessories",
    price: 16500,
    stock: 30,
    description: "Ultra-high capacity power bank with 200W total output. Smart digital display shows real-time charging status, temperature, and battery percentage. Compact structural design.",
    image: "https://images.unsplash.com/photo-1609592424085-f5b2b29598d9?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Capacity": "20,000mAh",
      "Total Wattage": "200W Max total output",
      "Ports": "2x USB-C (100W each), 1x USB-A (65W)",
      "Display": "Smart LCD status display",
      "Recharge Time": "Full charge in 1.1 hours with 100W input",
      "Weight": "540g"
    }
  },
  {
    name: "Apple iMac 24\" M3 (Yellow)",
    brand: "Apple",
    category: "All-in-One PCs",
    price: 245000,
    stock: 5,
    description: "The world's best all-in-one desktop, now supercharged by the M3 chip. Bold slim design, gorgeous 4.5K Retina display, studio-quality mics, and six-speaker sound system.",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple M3 (8-core CPU, 10-core GPU)",
      "Display": "24-inch 4.5K Retina display, 4480 x 2520, 500 nits",
      "Memory": "8GB Unified RAM",
      "Storage": "512GB SSD",
      "Camera": "1080p FaceTime HD camera with M3 ISP",
      "Audio": "High-fidelity six-speaker system with spatial audio",
      "Accessories": "Color-matched Magic Keyboard & Mouse"
    }
  },
  {
    name: "HP EliteOne 840 G9 AIO",
    brand: "HP",
    category: "All-in-One PCs",
    price: 195000,
    stock: 7,
    description: "Enterprise flagship All-in-One PC. Intel Core i7, 16GB RAM, 512GB SSD, 23.8-inch FHD display. Featuring built-in conferencing features with HP Presence AI.",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core i7-12700 (12 Cores)",
      "Display": "23.8-inch diagonal Full HD display (1920 x 1080), IPS",
      "Memory": "16GB DDR5 RAM",
      "Storage": "512GB PCIe NVMe SSD",
      "Camera": "5MP Pop-up privacy camera",
      "Network": "Wi-Fi 6E + Bluetooth 5.3",
      "Security": "HP Wolf Security for Business"
    }
  }
];

export const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kiambu", "Nakuru", "Uasin Gishu", "Kisumu", "Kajiado", "Machakos", "Meru", "Nyeri", "Laikipia", "Kilifi", "Kakamega"
];

export const PAYSTACK_GATEWAYS = [
  { name: "Paystack API Transaction Initialization", status: "Operational", ping: "78ms" },
  { name: "Paystack Live Callback webhook endpoints", status: "Operational", ping: "92ms" },
  { name: "Paystack Card / Mobile Secure tokenizers", status: "Operational", ping: "55ms" }
];
