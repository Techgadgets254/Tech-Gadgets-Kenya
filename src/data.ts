/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "./types";

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Apple MacBook Pro 16\" M3 Max",
    brand: "Apple",
    category: "New Laptops",
    price: 485000,
    stock: 6,
    description: "The ultimate Apple Silicon workstation. Brand-new sealed. Featuring the M3 Max 16-core CPU, 40-core GPU, 36GB Unified Memory, and 1TB SSD. 16.2-inch Liquid Retina XDR display with 120Hz ProMotion in Space Black.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple M3 Max (16-Core CPU, 40-Core GPU)",
      "Unified Memory": "36GB Unified RAM",
      "Storage": "1TB PCIe NVMe SSD",
      "Display": "16.2-inch Liquid Retina XDR, 3024x1964, 120Hz ProMotion",
      "Battery": "Up to 22 hours video playback",
      "OS": "macOS Sonoma",
      "Color": "Space Black"
    }
  },
  {
    name: "Refurbished Apple MacBook Air 13\" M2",
    brand: "Apple",
    category: "Refurbished Laptops",
    price: 125000,
    stock: 14,
    description: "Certified pristine condition Apple Silicon laptop. Fanless silent operation, 13.6-inch Liquid Retina display, M2 8-core CPU / 8-core GPU, 8GB Unified RAM, 256GB SSD. Midnight finish with MagSafe 3.",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple M2 (8-Core CPU, 8-Core GPU)",
      "Unified Memory": "8GB Unified Memory",
      "Storage": "256GB High-Speed SSD",
      "Display": "13.6-inch Liquid Retina, 500 nits brightness",
      "Battery": "Up to 18 hours (90%+ verified battery health)",
      "Ports": "MagSafe 3, 2x Thunderbolt / USB 4",
      "Warranty": "1-Year Boutique Warranty"
    }
  },
  {
    name: "Apple iPhone 15 Pro Max 256GB",
    brand: "Apple",
    category: "New Phones",
    price: 185000,
    stock: 20,
    description: "Brand-new factory sealed Titanium flagship. Powered by A17 Pro 3nm chip, customizable Action button, 48MP main camera with 5x optical telephoto lens, USB-C 3.0 port.",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple A17 Pro (6-Core CPU, 6-Core GPU)",
      "Camera": "48MP Main | 12MP Ultra Wide | 12MP 5x Telephoto",
      "Storage": "256GB NVMe",
      "Display": "6.7-inch Super Retina XDR OLED, 120Hz ProMotion",
      "Build": "Grade 5 Titanium frame with Ceramic Shield front",
      "OS": "iOS 17"
    }
  },
  {
    name: "Refurbished Apple iPhone 13 Pro 128GB (Certified)",
    brand: "Apple",
    category: "Refurbished Phones",
    price: 78000,
    stock: 12,
    description: "Certified pristine refurbished iPhone 13 Pro in Sierra Blue. 120Hz ProMotion display, cinematic mode video recording, 12MP triple lens array, battery health guaranteed above 88%.",
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple A15 Bionic",
      "Camera": "12MP Telephoto, Wide, and Ultra Wide cameras",
      "Display": "6.1-inch Super Retina XDR with ProMotion",
      "Battery": "88%+ Verified Health Capacity",
      "Storage": "128GB",
      "OS": "iOS 17"
    }
  },
  {
    name: "Apple iPad Pro 12.9\" M2 Wi-Fi + Cellular",
    brand: "Apple",
    category: "Accessories",
    price: 165000,
    stock: 8,
    description: "The ultimate iPad experience powered by Apple M2. 12.9-inch Liquid Retina XDR display with mini-LED backlighting, ProMotion, Apple Pencil hover, and 5G Cellular connectivity.",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Processor": "Apple M2 (8-Core CPU, 10-Core GPU)",
      "Display": "12.9-inch Liquid Retina XDR mini-LED (2732x2048)",
      "Storage": "256GB",
      "Connectivity": "Wi-Fi 6E + 5G Cellular (eSIM + Nano-SIM)",
      "Camera": "12MP Wide + 10MP Ultra Wide + LiDAR Scanner",
      "Accessories": "Supports Apple Pencil (2nd Gen) & Magic Keyboard"
    }
  },
  {
    name: "Apple Watch Ultra 2 GPS + Cellular 49mm",
    brand: "Apple",
    category: "Accessories",
    price: 115000,
    stock: 10,
    description: "The most rugged and capable Apple Watch ever. 49mm titanium case, S9 SiP with double tap gesture, 3000 nits Always-On display, dual-frequency precision GPS.",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600",
    specifications: {
      "Case": "49mm Aerospace-Grade Titanium",
      "Processor": "Apple S9 SiP with 4-core Neural Engine",
      "Display": "Always-On Retina OLED, up to 3000 nits",
      "Water Resistance": "100m water resistant, EN13319 certified",
      "Battery": "Up to 36 hours normal use / 72 hours low power",
      "Sensors": "ECG, Blood Oxygen, Temperature sensing, Depth gauge"
    }
  },
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
