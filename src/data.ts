/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "./types";

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Dell XPS 16 Developer Laptop",
    brand: "Dell",
    category: "New Laptops",
    price: 325000,
    stock: 8,
    description: "The ultimate developer powerhouse. Brand-new sealed. Featuring the Intel Core Ultra 9 processor, NVIDIA RTX 4070 8GB GPU, 32GB LPDDR5X RAM, and 1TB NVMe SSD. 16.3-inch 4K OLED Touchscreen display.",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core Ultra 9 185H (16 Cores, 5.1GHz)",
      "Graphics": "NVIDIA GeForce RTX 4070 8GB GDDR6",
      "Memory": "32GB LPDDR5X 7467MHz",
      "Storage": "1TB PCIe Gen4 NVMe SSD",
      "Display": "16.3-inch 4K+ OLED Touchscreen, 400 nits, 120Hz",
      "Battery": "Up to 14 hours (99.5Wh)",
      "OS": "Windows 11 Pro"
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
    name: "Google Pixel 8 Pro",
    brand: "Google",
    category: "New Phones",
    price: 135000,
    stock: 15,
    description: "Brand-new factory sealed. Supercharged by Google Tensor G3, featuring advanced AI camera capabilities, 50MP triple lens array, 12GB RAM, and 7 years of OS updates.",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Google Tensor G3 with Titan M2 security coprocessor",
      "Camera": "50MP Main | 48MP Ultra Wide | 48MP 5x Telephoto",
      "Storage": "256GB UFS 3.1",
      "Display": "6.7-inch Super Actua OLED, 120Hz LTPO",
      "Battery": "5050mAh with 30W Fast Charging",
      "Port": "USB-C 3.2",
      "OS": "Android 14 (Pure Pixel Experience)"
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
    name: "Refurbished Samsung Galaxy S22 Ultra (Certified)",
    brand: "Samsung",
    category: "Refurbished Phones",
    price: 85000,
    stock: 12,
    description: "Certified refurbished Galaxy S22 Ultra in pristine physical condition. Built-in S-Pen stylus, 108MP camera with 100x Space Zoom, battery health guaranteed above 90%. 1-year local warranty.",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Snapdragon 8 Gen 1",
      "Camera": "108MP Quad Camera System with 10x Optical Zoom",
      "Display": "6.8-inch Edge QHD+ Dynamic AMOLED 2X 120Hz",
      "Battery": "Certified 90%+ health (5000mAh)",
      "Storage": "256GB UFS 3.1",
      "OS": "Android 14"
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
    name: "Dell OptiPlex 7410 All-in-One",
    brand: "Dell",
    category: "All-in-One PCs",
    price: 225000,
    stock: 5,
    description: "Premium commercial all-in-one desktop PC powered by 13th Gen Intel Core i7 processor. 23.8-inch FHD Touchscreen display, wireless keyboard and mouse included.",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Intel Core i7-13700 (16 Cores, up to 5.2GHz)",
      "Display": "23.8-inch FHD IPS Touchscreen (1920 x 1080)",
      "Memory": "16GB DDR5 RAM",
      "Storage": "512GB PCIe NVMe SSD",
      "Camera": "Pop-up Full HD Privacy Camera",
      "Audio": "Waves MaxxAudio Pro dual stereo speakers",
      "OS": "Windows 11 Pro"
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
