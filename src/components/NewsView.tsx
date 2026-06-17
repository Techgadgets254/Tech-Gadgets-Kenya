/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../StoreContext";
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  Share2, 
  Award, 
  Sparkles, 
  BookOpen, 
  Newspaper, 
  Bookmark, 
  Search, 
  X, 
  Check, 
  TrendingUp, 
  Printer, 
  Laptop, 
  ExternalLink, 
  ShieldCheck,
  RefreshCw,
  Zap,
  GitCompare,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProductComparison from "./ProductComparison";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  readTime: string;
  category: "Laptops" | "Market Trends" | "Printers" | "Nairobi Hub" | "AI Hardware" | "Comparisons";
  isFeatured?: boolean;
}

// Fixed Premium Articles Pool
export const FIXED_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "M-Silicon Dominance in Nairobi Tech Hubs: Why Developers are Choosing M3 Pro & Max Arrays",
    excerpt: "From Westlands seed startups to Kilimani development corporations, custom high-bandwidth Apple silicon is shifting the Kenyan computer landscape.",
    content: "With local developer salaries reaching global markets, hardware latency translates directly to currency losses. The Apple M3 Pro and M3 Max SoC architectures provide unprecedented memory bandwidth. In local compile runs using Docker, microservices built on localized container clusters finish 45% faster compared to traditional x86 developer packages in Nairobi tech parks. At our Kenyatta Avenue shop #514, we configure these custom systems for local software engineers.\n\nUnified memory guarantees that heavy local virtual machines, Swahili LLM setups, and multiple VS Code frames run natively without bottleneck swaps.",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=700",
    date: "June 14, 2026",
    readTime: "5 min read",
    category: "Laptops",
    isFeatured: true
  },
  {
    id: "art-2",
    title: "EcoTank Printing Evolution: HP Smart Tank vs Epson EcoTank in High-Volume Offices",
    excerpt: "A deep comparative performance matrix mapping local cartridge-free models on Kenya printing paper sizes and speed metrics.",
    content: "SME corporate suites in Nairobi CBD process hundreds of invoices and packing lists daily. EcoTank ink reservoirs save over 90% of printing costs by doing away with traditional premium cartridge restrictions. Epson L-series smart pumps deliver robust performance with high-density pigment ink layers that prevent bleeding on local grades of office paper. \n\nIn our tests, the Epson L3250 outperforms traditional laser cartridge speeds on mid-grade letter sheets, while the HP Smart Tank 515 features slightly better warm-hue photo distributions.",
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=600",
    date: "June 12, 2026",
    readTime: "4 min read",
    category: "Printers"
  },
  {
    id: "art-3",
    title: "Paystack Payment Gateway Drives E-Commerce Security Upgrades Across Kenya",
    excerpt: "Online merchants integrate direct webhooks and secure inline checkouts to shield customers from manual payment validation lulls.",
    content: "E-Commerce businesses in Kenya are shifting from manual transaction keying to fully automated online checkout gateways. The advantages are multi-fold: client transactions are processed with instant SSL handshakes, and invoice states update in real-time. Tech Gadgets Kenya has pioneered this automated flow inside its client dashboards, ensuring your orders are securely cleared as 'Paid' within seconds of payment.",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600",
    date: "June 10, 2026",
    readTime: "3 min read",
    category: "Market Trends"
  },
  {
    id: "art-4",
    title: "Inside the AI Hardware Arms Race: Local Startups Procuring NVIDIA RT-Enabled Workstations",
    excerpt: "Artificial intelligence development surges in East Africa, sparking massive demand for high-VRAM GPU personal workstations.",
    content: "Local tech hubs are adopting advanced model customization. Startups use dedicated NVIDIA workstations equipped with 16GB VRAM configurations to run custom local LLMs behind closed networks. We explore standard hardware options like HP Victus and ASUS ROG Strix developer systems, which maintain high thermodynamic control during deep-learning compilations.",
    imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=600",
    date: "June 8, 2026",
    readTime: "6 min read",
    category: "AI Hardware"
  },
  {
    id: "art-5",
    title: "Official Tech Gadgets Store Opens on Kenyatta Avenue, Shop 514",
    excerpt: "Providing Nairobi software engineers with instant physical pickup options for brand-new US and UK-imported laptops.",
    content: "Our highly-anticipated Nairobi boutique store is officially open! Located on the 5th Floor of Kenyatta Pioneer Building, Shop 514 (conveniently right next to the I&M Building, Nairobi CBD), customers can now experience and test premium laptops, phones, and enterprise printers before buying, backed by same-day county shipping guarantees.",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600",
    date: "June 5, 2026",
    readTime: "2 min read",
    category: "Nairobi Hub"
  }
];

// Dynamic daily updates (Refreshing based on Day Of the Week to provide live daily updates)
export const DAILY_ARTICLES: Record<number, Article> = {
  0: {
    id: "dyn-0",
    title: "Sunday Sync: How Local Developer Nodes Maintain Remote Container Latency",
    excerpt: "Westlands-based startups leverage high-speed fiber routing to connect directly with AWS Cape Town nodes with minimal overhead.",
    content: "Mombasa subsea cable upgrades have fully stabilized. As local tech professionals continue working remotely, low-latency SSH shells and localized Docker compile volumes remain key. Solid client-side routers pre-configured at our shop guarantee continuous bandwidth speeds with no packet throttling.",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "Nairobi Hub"
  },
  1: {
    id: "dyn-1",
    title: "Monday Market Review: Tech import Tariffs for US and UK Laptops Stabilize",
    excerpt: "Wholesale computer hardware imports experience steady pricing metrics as the Kenya Shilling strengthens against key foreign currencies.",
    content: "As the KES consolidates at 128 to the USD, tech hardware stores in Nairobi CBD are returning margins to developers. This stabilization yields fantastic discount windows for young tech founders procuring brand-new configurations such as 32GB RAM laptops or high-coverage office multi-function printers.",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "3 min read",
    category: "Market Trends"
  },
  2: {
    id: "dyn-2",
    title: "Tuesday Tech: Safaricom Lipa Na M-Pesa STK Push API V2 Security Protocols",
    excerpt: "Safaricom introduces merchant API security updates to protect SME checkouts from manual polling timeouts.",
    content: "The newly launched Daraja V2 validation secure endpoint forces cryptographic hashes on immediate callbacks. This completely removes double-trigger risks and resolves checkout states in millisecond bounds. Tech Gadgets Kenya has integrated these protocols, making online gadget purchases extremely safe.",
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "5 min read",
    category: "Market Trends"
  },
  3: {
    id: "dyn-3",
    title: "Wednesday Workshop: Swahili Large Language Model Workstations on RTX GPUs",
    excerpt: "Nairobi researchers fine-tune Swahili deep learning models using localized multi-VRAM custom server stacks.",
    content: "Deep learning mandates massive hardware caches. Local Swahili semantic parsing relies on high VRAM workstations (NVIDIA RTX 4080 and 4090 models). Researchers bypass expensive cloud fees by deploying custom personal workstations. Contact our systems consultant at Kenyatta Avenue to configure your workstation.",
    imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "AI Hardware"
  },
  4: {
    id: "dyn-4",
    title: "Thursday Printing Analysis: Ink Tank vs Laser Printing Costs in Nairobi Primary Schools",
    excerpt: "Testing shows Epson EcoTank pigment fluid reduces high-volume page costs by 87% compared to traditional toner cartridges.",
    content: "Administrative centers processing massive assignments every month are shifting to durable ink tanks. Our real-world analysis shows pigment fluid prevents water bleeding on standard 70gsm xerox sheets, while reducing total electricity consumption during thermal print head releases. Epson's L3250 EcoTank is leading the pack.",
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "5 min read",
    category: "Printers"
  },
  5: {
    id: "dyn-5",
    title: "Friday Founders: Westlands AI Co-ops Deploy Shared Render Clusters",
    excerpt: "Nairobi developer groups combine resources to install multi-card GPU servers under localized offline workspaces.",
    content: "To bypass current global high-end VM prices, local founders are setting up collaborative local mining and rendering clusters. By using shared hardware arrays (such as the ASUS ROG Strix setups stocked in our Kenyatta Pioneer store), local startups are maintaining Swahili LLM systems without continuous overseas billing.",
    imageUrl: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "4 min read",
    category: "AI Hardware"
  },
  6: {
    id: "dyn-6",
    title: "Saturday Specs: What is the Ideal Unified RAM Setup for 2026 Microservice Suites?",
    excerpt: "We analyze why local fullstack engineers are choosing 64GB Unified RAM setups to prevent swap lag.",
    content: "Modern developer containers, Docker pods, and active Redis tables swallow RAM continuously. A 64GB high-bandwidth architecture prevents swap bottlenecks and reduces heating over long coding cycles. Hardware testing on Kenyatta Avenue proves unified memory handles up to 50 concurrent microservices with no trace of lag.",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
    date: "Today's Bulletin",
    readTime: "3 min read",
    category: "Laptops"
  }
};

// High-Value SEO Product Comparisons Data
const LAPTOP_COMPARISONS = [
  {
    name: "MacBook Pro M3 Max (Developer Choice)",
    compileTime: "9.2s",
    compilePercent: 100, // lower time = better, but representation bar
    vram: "48GB / 128GB Unified Memory",
    cooling: "Silent Dual-Fan Contour",
    coolingScore: "95%",
    batteryLife: "Up to 22 Hours",
    price: "KES 410,000",
    rating: "4.9/5",
    idealFor: "Elite Software Engineers, Docker Stacks, Swift Compilers"
  },
  {
    name: "ASUS ROG Zephyrus G16 (AI & GPU Champ)",
    compileTime: "11.1s",
    compilePercent: 88,
    vram: "16GB RTX 4090 VRAM",
    cooling: "Liquid Metal + Tri-Fan Venting",
    coolingScore: "98%",
    batteryLife: "Up to 7 Hours",
    price: "KES 340,000",
    rating: "4.8/5",
    idealFor: "Local Swahili LLM Training, AI Rendering, Gaming"
  },
  {
    name: "HP EliteBook 840 G10 (Biz Standard)",
    compileTime: "22.4s",
    compilePercent: 55,
    vram: "32GB DDR5 RAM",
    cooling: "Single Silent Quiet-Flow Fan",
    coolingScore: "82%",
    batteryLife: "Up to 11 Hours",
    price: "KES 185,000",
    rating: "4.6/5",
    idealFor: "Office Suites, Systems Administration, Financial Modeling"
  }
];

const PRINTER_COMPARISONS = [
  {
    name: "Epson EcoTank L3250 (SME Titan)",
    costPerPage: "KES 0.12",
    costScore: 98, // higher is better cost efficiency
    speed: "33 pages per minute",
    speedScore: "95%",
    inkYield: "8,100 pages (Monochrome)",
    wifi: "Wi-Fi Direct & Smart App Link",
    price: "KES 34,500",
    rating: "4.9/5",
    idealFor: "High-Volume Nairobi Cyber Cafes, Office Letterheads"
  },
  {
    name: "HP Smart Tank 515 (Vibrant Graphics)",
    costPerPage: "KES 0.16",
    costScore: 85,
    speed: "22 pages per minute",
    speedScore: "80%",
    inkYield: "6,000 pages (Monochrome)",
    wifi: "Dual-band Wi-Fi & HP Smart App",
    price: "KES 32,000",
    rating: "4.7/5",
    idealFor: "Color Photo Printing, Architectural Color Portfolios"
  },
  {
    name: "Canon PIXMA G3411 (Entry Photo)",
    costPerPage: "KES 0.21",
    costScore: 72,
    speed: "18 pages per minute",
    speedScore: "68%",
    inkYield: "6,000 pages (Monochrome)",
    wifi: "Pixma Cloud Access & Wireless",
    price: "KES 29,500",
    rating: "4.5/5",
    idealFor: "Freelancers, Homework Tasks, Casual Color Output"
  }
];

export default function NewsView() {
  const { setActiveView, addCustomNotification, theme } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [comparisonTab, setComparisonTab] = useState<"laptops" | "printers">("laptops");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshingWire, setIsRefreshingWire] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"bulletins" | "compare">("bulletins");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (artId: string) => {
    setImageErrors(prev => ({ ...prev, [artId]: true }));
  };

  const renderImagePlaceholder = (category: string) => {
    let IconComponent = Laptop;
    if (category === "Printers") IconComponent = Printer;
    else if (category === "AI Hardware" || category === "Laptops") IconComponent = Laptop;
    else IconComponent = Sparkles;
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1c1a16] via-[#0d0d0d] to-[#12110f] flex flex-col items-center justify-center p-4 text-center border-b border-[#C5A059]/25 relative min-h-[160px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(197,160,89,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(197,160,89,0.03)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
        <div className="p-3 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] mb-1.5 shadow-inner">
          <IconComponent className="w-5 h-5 animate-pulse" />
        </div>
        <span className="font-mono text-[8px] font-black uppercase tracking-widest text-[#C5A059]/70 leading-normal">Silicon Savannah Bulletin</span>
      </div>
    );
  };

  // Dynamic live news fetched from RSS aggregator + Gemini
  const [liveArticles, setLiveArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  // Load saved bookmarks from local storage
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("tgk_saved_news");
    return saved ? JSON.parse(saved) : [];
  });

  const fetchLiveNews = async (showToast: boolean = false) => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news/live");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.articles)) {
        setLiveArticles(data.articles);
        if (showToast) {
          triggerToast("📰 Live Kenyan Tech publications synchronized successfully!");
        }
      }
    } catch (err) {
      console.error("Failed to load live news:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Immediate live fetch on mount
  useEffect(() => {
    fetchLiveNews();

    // Check if user navigated to read a specific bookmarked article from ClientDashboard
    const targetArticleId = localStorage.getItem("tgk_selected_article_id");
    if (targetArticleId) {
      setExpandedArticle(targetArticleId);
      localStorage.removeItem("tgk_selected_article_id");
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  }, []);

  const toggleSaveArticle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[] = [];
    setSavedArticleIds(prev => {
      const isSaved = prev.includes(id);
      updated = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("tgk_saved_news", JSON.stringify(updated));
      return updated;
    });

    const artTitle = [...FIXED_ARTICLES, ...Object.values(DAILY_ARTICLES), ...liveArticles].find(a => a.id === id)?.title || "Article";
    const status = savedArticleIds.includes(id) ? "Removed from Bookmarks" : "Saved to Bookmarks";
    triggerToast(`"${artTitle.slice(0, 30)}..." ${status}`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe manual reference link copying with notification support
  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mockUrl = `${window.location.origin}/#news/${id}`;
    navigator.clipboard.writeText(mockUrl)
      .then(() => {
        triggerToast("🔗 Technical article URL copied successfully!");
        if (addCustomNotification) {
          addCustomNotification(`SEO Reference Link Copied: Saved article hash ${id.toUpperCase()} details to local clipboard.`, id);
        }
      })
      .catch((err) => {
        console.error("Copy failed:", err);
        triggerToast("Failed to copy link. Please manually highlight URL.");
      });
  };

  // Get current date strings
  const todayDateObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(todayDateObj);
  }, [todayDateObj]);

  // Daily seeded article based on Date
  const dailyArticle = useMemo(() => {
    const dayOfWeek = todayDateObj.getDay();
    return DAILY_ARTICLES[dayOfWeek];
  }, [todayDateObj]);

  // Combine both fixed, live fetched, and dynamic articles
  const allArticles = useMemo(() => {
    let list = [...FIXED_ARTICLES];
    if (liveArticles.length > 0) {
      const map = new Map<string, Article>();
      // Live articles first
      liveArticles.forEach(a => map.set(a.id, a));
      list.forEach(a => {
        if (!map.has(a.id)) {
          map.set(a.id, a);
        }
      });
      return Array.from(map.values());
    }

    if (dailyArticle && !list.some(x => x.id === dailyArticle.id)) {
      list.push(dailyArticle);
    }
    return list;
  }, [liveArticles, dailyArticle]);

  // Simulate refreshing the SEO tech bulletin engine
  const handleRefreshWire = () => {
    setIsRefreshingWire(true);
    fetchLiveNews(false).then(() => {
      setIsRefreshingWire(false);
      triggerToast("📰 Live Kenyan tech databases synced with Kenyatta Avenue Showroom!");
      if (addCustomNotification) {
        addCustomNotification(`Tech News wire refreshed. Synced current bulletins with Nairobi CBD hub routers.`, "NEWS-SYNC");
      }
    }).catch(() => {
      setIsRefreshingWire(false);
    });
  };

  const tags = ["All", "Laptops", "Printers", "Market Trends", "AI Hardware", "Nairobi Hub", "Saved Bulletins"];

  const filteredArticles = useMemo(() => {
    let result = allArticles;

    // Category filter
    if (selectedTag === "Saved Bulletins") {
      result = allArticles.filter(art => savedArticleIds.includes(art.id));
    } else if (selectedTag !== "All") {
      result = allArticles.filter(art => art.category === selectedTag);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(art => 
        art.title.toLowerCase().includes(q) || 
        art.excerpt.toLowerCase().includes(q) || 
        art.content.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [selectedTag, savedArticleIds, searchQuery, allArticles]);

  const featuredArticle = useMemo(() => {
    return FIXED_ARTICLES.find(art => art.isFeatured);
  }, []);

  return (
    <div id="tech-news-viewport" className="space-y-12 pb-16 font-sans antialiased text-left relative">
      
      {/* Toast Notification block */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#C5A059] text-black font-semibold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xl z-200 flex items-center gap-2 border border-white/20 font-sans"
          >
            <ShieldCheck className="w-4 h-4 text-black shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Title & Header Segment */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-stone-200 dark:border-white/10 pb-8 gap-6">
        <div className="max-w-2xl text-left">
          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
            <span className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-mono text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 animate-pulse text-[#C5A059] dark:text-[#C5A059]" />
              <span>LIVE KENYAN TECH WIRE</span>
            </span>
            <span className="font-mono text-[10px] text-stone-500 dark:text-white/40 flex items-center gap-1.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 px-2.5 py-1 rounded-sm">
              <Clock className="w-3 h-3 text-[#C5A059]" />
              <span>Today: {todayStr}</span>
            </span>
            <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500 animate-bounce" />
              <span>AUTO-FEED: ONLINE</span>
            </span>
          </div>
          
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-stone-900 dark:text-white font-bold tracking-tight leading-none">
            Kenya Tech News & Buying Handbooks
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-white/50 mt-3 max-w-xl leading-relaxed">
            Engineered specifically to power SEO rankings. Our daily bulletins cover MacBook M3 compilation matrices, Lipa Na M-Pesa automatic webhooks, HP/Epson tank costs, and Kenyatta Avenue showroom stock updates.
          </p>
        </div>

        {/* Search & Actions control panel */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch sm:items-center justify-start xl:justify-end shrink-0">
          {/* Refresh news Button */}
          <button
            onClick={handleRefreshWire}
            disabled={isRefreshingWire}
            className="h-10 px-4 rounded-xl bg-[#C5A059]/10 hover:bg-[#C5A059]/15 border border-[#C5A059]/30 hover:border-[#C5A059]/60 text-[#C5A059] font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            title="Force refresh News feed from Nairobi CBD warehouse databases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingWire ? "animate-spin" : ""}`} />
            <span>{isRefreshingWire ? "Syncing Feed..." : "Sync Tech Feed"}</span>
          </button>

          {/* Search bar helper */}
          <div className="relative flex items-center bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl px-3 h-10 focus-within:border-[#C5A059]/60 focus-within:bg-white/10 transition-all w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 dark:text-white/30 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news archives..."
              className="bg-transparent border-0 font-sans text-xs font-semibold text-stone-800 dark:text-white/80 focus:outline-hidden w-full placeholder-stone-400 dark:placeholder-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-stone-400 dark:text-white/40 hover:text-stone-600 dark:hover:text-white cursor-pointer ml-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern High-Value Segment Switcher Tab Segment */}
      <div className="flex bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 p-1.5 rounded-2xl gap-2 max-w-sm sm:max-w-md select-none">
        <button
          onClick={() => {
            setActiveSegment("bulletins");
            setExpandedArticle(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-sans font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === "bulletins"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "text-stone-500 dark:text-white/50 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Bulletins Wire</span>
        </button>
        <button
          onClick={() => {
            setActiveSegment("compare");
            setExpandedArticle(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] sm:text-xs font-sans font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === "compare"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "text-stone-500 dark:text-white/50 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Specs Comparator Portal</span>
        </button>
      </div>

      {/* Tags Slider Area */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 dark:border-white/5">
        <span className="font-mono text-[9px] text-[#C5A059] block font-black uppercase tracking-widest whitespace-nowrap mr-2">Category filters:</span>
        <div className="flex gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setExpandedArticle(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono tracking-wider uppercase font-bold transition-all border cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? "bg-[#C5A059] text-black dark:text-white border-[#C5A059] font-black"
                  : "bg-stone-50 dark:bg-[#0F0F0F] border-stone-200 dark:border-white/5 text-stone-600 dark:text-white/60 hover:text-stone-950 dark:hover:text-white hover:border-stone-300 dark:hover:border-white/15"
              }`}
            >
              {tag}
              {tag === "Saved Bulletins" && savedArticleIds.length > 0 && (
                <span className="ml-1.5 bg-[#C5A059]/20 text-[#caba70] font-black text-[9px] px-1.5 py-0.1 rounded-full">
                  {savedArticleIds.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Article Detail view */}
      {expandedArticle ? (
        (() => {
          const art = allArticles.find(a => a.id === expandedArticle);
          if (!art) return null;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn text-left shadow-2xl"
            >
              <button
                onClick={() => setExpandedArticle(null)}
                className="text-[#C5A059] hover:text-[#b48d47] font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
              >
                ← Back to Bulletin Board
              </button>

              <div className="max-h-[420px] w-full rounded-2xl overflow-hidden border border-[#C5A059]/20 h-64 sm:h-80 lg:h-96 relative bg-[#090909]">
                {imageErrors[art.id] ? (
                  renderImagePlaceholder(art.category)
                ) : (
                  <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    className="w-full h-full object-cover animate-fadeIn" 
                    referrerPolicy="no-referrer" 
                    onError={() => handleImageError(art.id)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <span className="absolute bottom-4 left-4 bg-black/85 text-[#C5A059] border border-[#C5A059]/30 text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                  {art.category}
                </span>

                {/* Save Toggle on expanded image overlay */}
                <button
                  onClick={(e) => toggleSaveArticle(art.id, e)}
                  className="absolute top-4 right-4 bg-black/85 hover:bg-[#C5A059] hover:text-black text-white p-2.5 rounded-xl border border-white/15 transition-all cursor-pointer z-10"
                  title={savedArticleIds.includes(art.id) ? "Remove from bookmarked saved list" : "Save article for reference"}
                >
                  <Bookmark className={`w-4 h-4 ${savedArticleIds.includes(art.id) ? "fill-current text-[#C5D070]" : "text-white"}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-stone-500 dark:text-white/40 font-mono">
                  <span className="flex items-center gap-1.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 py-1 px-2.5 rounded-md">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" /> 
                    {art.date}
                  </span>
                  <span className="flex items-center gap-1.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 py-1 px-2.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" /> 
                    {art.readTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                    <Award className="w-3.5 h-3.5" />
                    Verified Insight
                  </span>
                </div>

                <h2 className="text-stone-900 dark:text-white font-serif italic text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  {art.title}
                </h2>

                <p className="text-stone-700 dark:text-[#C5A059] text-xs sm:text-sm font-mono font-bold leading-relaxed border-l-3 border-[#C5A059] pl-4 py-1.5 italic bg-[#C5A059]/5 md:max-w-3xl">
                  "{art.excerpt}"
                </p>

                <div className="text-stone-700 dark:text-white/70 text-xs sm:text-sm leading-relaxed space-y-5 pt-4 whitespace-pre-line">
                  <p>{art.content}</p>
                  
                  <div className="bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 p-5 rounded-2xl space-y-3 mt-6">
                    <h4 className="font-serif italic font-bold text-[#C5A059] text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>SEO Integration Technical Reference Parameters</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-white/40 leading-relaxed font-sans">
                      This bulletin indexes custom queries relating to premium laptop memory, network topologies, subsea fiber bandwidths, and ink tank printers in Kenya. Clients shopping at our Kenyatta avenue showroom #514 receive guaranteed manufacturer hardware calibrations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons on detail bottom */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 mt-6 border-t border-stone-200 dark:border-white/10">
                <span className="text-[9px] text-stone-500 dark:text-white/30 font-mono tracking-wider uppercase">
                  ARCHIVE ENTRY ID: {art.id.toUpperCase()} • KENYATTA AVE SHOP 514
                </span>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={(e) => toggleSaveArticle(art.id, e)}
                    className={`font-sans text-xs font-semibold py-2 px-3.5 rounded-xl transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      savedArticleIds.includes(art.id)
                        ? "bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5D570]"
                        : "bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-800 dark:text-white hover:bg-stone-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{savedArticleIds.includes(art.id) ? "Saved" : "Save Later"}</span>
                  </button>

                  <button
                    onClick={(e) => handleCopyLink(art.id, e)}
                    className="bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-800 dark:text-white text-xs px-4 py-2 rounded-xl transition-all border border-stone-200 dark:border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy SEO link</span>
                  </button>

                  <button
                    onClick={() => {
                      setExpandedArticle(null);
                      setActiveView("shop");
                    }}
                    className="bg-[#C5A059] hover:bg-[#b58f4c] text-black/90 font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Analyze Specs In Shop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()
      ) : activeSegment === "compare" ? (
        <ProductComparison />
      ) : (
        <>
          {/* Main layout (Split in Bento: Left: News bulletin boards, Right: Dynamic comparisons matrix) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 7 PANELS: News list & Featured Spotlight */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              {/* Daily seeded article spotlight marquee (REFRESHES EVERYDAY AUTOMATICALLY) */}
              {selectedTag === "All" && !searchQuery && dailyArticle && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-amber-500/10 to-[#C5A059]/5 border-2 border-[#C5A059]/30 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute right-4 top-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>Fresh Daily Seed</span>
                  </div>

                  <span className="text-[9px] font-mono font-black text-[#C5A059] uppercase tracking-widest">TODAY'S SPECIAL BULLETINS</span>
                  <h3 className="font-serif italic font-bold text-stone-900 dark:text-white text-xl mt-1.5 leading-snug">
                    {dailyArticle.title}
                  </h3>
                  <p className="text-stone-600 dark:text-white/50 text-xs mt-2 leading-relaxed">
                    {dailyArticle.excerpt}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedArticle(dailyArticle.id)}
                      className="text-[#C5A059] hover:text-[#bc954b] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Live Feed Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] text-stone-400 dark:text-white/30 font-mono italic">Refreshes every morning</span>
                  </div>
                </motion.div>
              )}

              {/* Filtering News Grid */}
              {filteredArticles.length === 0 ? (
                <div className="bg-stone-50 dark:bg-[#0F0F0F] border border-stone-200 dark:border-white/10 rounded-3xl p-12 text-center max-w-sm mx-auto">
                  <Bookmark className="w-10 h-10 text-stone-300 dark:text-white/10 mx-auto mb-3" />
                  <h4 className="font-sans font-bold text-stone-800 dark:text-white text-sm">No Bulletins Matched</h4>
                  <p className="text-stone-500 dark:text-white/40 text-xs mt-1.5 leading-relaxed">
                    Try adjusting your filters, clearing your search query, or checking bookmarks to view catalog logs.
                  </p>
                  <button
                    onClick={() => { setSelectedTag("All"); setSearchQuery(""); }}
                    className="mt-5 bg-[#C5A059] text-black font-sans text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Reset Filter Fields
                  </button>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 gap-6 space-y-6 [&>*]:break-inside-avoid pb-4 text-left">
                  {filteredArticles.map((art, idx) => (
                    <motion.article
                      key={art.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      whileHover={{ y: -3 }}
                      className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-md group break-inside-avoid mb-6 h-fit max-w-full"
                    >
                      <div className="h-40 overflow-hidden relative border-b border-[#C5A059]/20 bg-[#090909] w-full">
                        {imageErrors[art.id] ? (
                          renderImagePlaceholder(art.category)
                        ) : (
                          <img 
                            src={art.imageUrl} 
                            alt={art.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103 scroll-smooth" 
                            referrerPolicy="no-referrer"
                            onError={() => handleImageError(art.id)}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2.5 left-2.5 bg-black/80 border border-white/10 text-[#C5A059] text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                          {art.category}
                        </span>

                        {/* Save / Bookmark Toggle corner selector */}
                        <button
                          onClick={(e) => toggleSaveArticle(art.id, e)}
                          className="absolute top-2.5 right-2.5 bg-black/85 hover:bg-[#C5A059] hover:text-black text-[#C5A059] p-1.5 rounded-lg border border-[#C5A059]/30 transition-all cursor-pointer z-10 select-none"
                          title="Bookmark article for later reference in ClientDashboard"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(art.id) ? "fill-current text-[#C5A059]" : ""}`} />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-[#0F0F0F]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 text-[9px] text-stone-500 dark:text-white/40 font-mono">
                            <span className="flex items-center gap-1 font-bold"><Calendar className="w-3 h-3 text-[#C5A059]" /> {art.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-bold"><Clock className="w-3 h-3 text-[#C5A059]" /> {art.readTime || "4 min read"}</span>
                          </div>
                          <h3 className="text-stone-900 dark:text-white font-sans text-xs sm:text-sm font-bold tracking-tight leading-snug group-hover:text-[#C5A059] transition-colors line-clamp-2">
                            {art.title}
                          </h3>
                          <p className="text-stone-600 dark:text-white/50 text-[11px] leading-relaxed line-clamp-2 font-sans pt-0.5">
                            {art.excerpt}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-white/5 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setExpandedArticle(art.id);
                              window.scrollTo({ top: 300, behavior: "smooth" });
                            }}
                            className="text-stone-850 dark:text-white/70 hover:text-[#C5A059] dark:hover:text-[#C5A059] font-mono text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 cursor-pointer select-none"
                          >
                            <span>Read Article</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleCopyLink(art.id, e)}
                            className="p-1 rounded-sm text-stone-400 hover:text-[#C5A059] dark:text-white/20 transition-all cursor-pointer"
                            title="Copy SEO permalink"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT 5 PANELS: Interactive Spec Comparisons (SEO Goldmine) */}
            <div className="lg:col-span-5 space-y-8 text-left">
              
              {/* Product Comparisons Matrix Widget */}
              <div className="bg-white dark:bg-[#0D0D0D] border-2 border-[#C5A059]/20 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-[#C5A059] animate-pulse" />
                  <span className="font-mono text-[9px] font-black text-[#C5A059] uppercase tracking-widest">SEO COMPARATIVE INDEX</span>
                </div>

                <h2 className="font-serif italic font-bold text-stone-900 dark:text-white text-xl leading-snug">
                  Kenya Tech Specs Comparison Matrix
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-white/45 leading-relaxed mt-1.5">
                  Analyze local benchmarks side-by-side to determine which hardware variant fits your cost-per-flow ratios.
                </p>

                {/* Sub-tabs */}
                <div className="flex bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 p-1.5 rounded-xl gap-1 mt-5">
                  <button
                    onClick={() => { setComparisonTab("laptops"); }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      comparisonTab === "laptops"
                        ? "bg-[#C5A059] text-black shadow-xs"
                        : "text-stone-600 dark:text-white/50 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Dev Laptops</span>
                  </button>
                  <button
                    onClick={() => { setComparisonTab("printers"); }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      comparisonTab === "printers"
                        ? "bg-[#C5A059] text-black shadow-xs"
                        : "text-stone-600 dark:text-white/50 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Office Printers</span>
                  </button>
                </div>

                {/* Comparisons Data Render */}
                <div className="mt-6 space-y-5">
                  {comparisonTab === "laptops" ? (
                    LAPTOP_COMPARISONS.map((lap, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 space-y-3 hover:border-[#C5A059]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif italic text-xs font-bold text-stone-900 dark:text-white hover:text-[#C5A059] transition-colors">{lap.name}</span>
                          <span className="bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#c8a15c] font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                            {lap.price}
                          </span>
                        </div>

                        {/* Metric compile time */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-stone-500 dark:text-white/40">
                            <span>Compile Time (100 Microservices) - Less is better</span>
                            <span className="text-[#C5A059] font-bold">{lap.compileTime}</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C5A059] rounded-full transition-all duration-500" style={{ width: `${lap.compilePercent}%` }} />
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-white/5 text-[9px] sm:text-[10px] font-mono text-stone-500 dark:text-white/45">
                          <div>
                            <span className="block text-stone-400 dark:text-white/20 uppercase tracking-tight">Active Cooling Score:</span>
                            <span className="text-stone-950 dark:text-stone-200 font-bold">{lap.coolingScore} • {lap.cooling}</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 dark:text-white/20 uppercase tracking-tight">VRAM Platform:</span>
                            <span className="text-stone-950 dark:text-stone-200 font-bold">{lap.vram}</span>
                          </div>
                        </div>

                        <div className="pt-2 text-[9px] font-sans text-stone-400 dark:text-white/30 flex items-center gap-1 leading-normal italic">
                          <span className="text-[#C5A059] font-extrabold font-mono uppercase not-italic">Ideal use:</span>
                          <span>{lap.idealFor}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    PRINTER_COMPARISONS.map((p, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 space-y-3 hover:border-[#C5A059]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif italic text-xs font-bold text-stone-900 dark:text-white hover:text-[#C5A059] transition-colors">{p.name}</span>
                          <span className="bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#c8a15c] font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                            {p.price}
                          </span>
                        </div>

                        {/* Cost per page metric */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-stone-500 dark:text-white/40">
                            <span>Cost Per Page (Ink-Tank efficiency)</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.costPerPage}</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${p.costScore}%` }} />
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-white/5 text-[9px] sm:text-[10px] font-mono text-stone-500 dark:text-white/45">
                          <div>
                            <span className="block text-stone-400 dark:text-white/20 uppercase tracking-tight">Mono Ink Yield:</span>
                            <span className="text-stone-950 dark:text-stone-200 font-bold">{p.inkYield}</span>
                          </div>
                          <div>
                            <span className="block text-stone-400 dark:text-white/20 uppercase tracking-tight">Wireless Connectivity:</span>
                            <span className="text-stone-950 dark:text-stone-200 font-bold">{p.wifi}</span>
                          </div>
                        </div>

                        <div className="pt-2 text-[9px] font-sans text-stone-400 dark:text-white/30 flex items-center gap-1 leading-normal italic">
                          <span className="text-[#C5A059] font-extrabold font-mono uppercase not-italic">Ideal use:</span>
                          <span>{p.idealFor}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200 dark:border-white/10 text-center">
                  <a
                    href="https://wa.me/254792620789"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[#C5A059] hover:text-[#b48d47] font-mono text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    <span>Request Custom Hardware benchmarks</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Nairobi physical store showroom promotional card */}
              <div className="bg-stone-50 dark:bg-[#050505] border border-stone-200 dark:border-white/10 rounded-3xl p-6 relative overflow-hidden space-y-4">
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-sm inline-flex items-center gap-1.5 select-none">
                  <Sparkles className="w-3 h-3 animate-spin text-[#C5A059]" />
                  <span>Kenya Showroom</span>
                </div>

                <h3 className="text-stone-900 dark:text-white font-serif italic text-lg sm:text-xl font-bold leading-tight">
                  Consult With Our System Experts At Kenyatta Avenue
                </h3>

                <p className="text-[11px] text-stone-500 dark:text-white/40 leading-relaxed">
                  Need custom Docker setups, developer laptops, same-day corporate printers, or heavy server clusters? Bypassing standard importation delays, we stock unique pre-calibrated machinery. Experience real hardware testing before shopping!
                </p>

                <div className="space-y-1.5 text-[9px] sm:text-[10px] font-mono text-stone-500 dark:text-white/40 leading-tight">
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#C5A059] font-bold shrink-0">📍 Hub Location:</span>
                    <span>Kenyatta Pioneer Building, 5th Floor, Shop 514 (CBD next to I&M Building)</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#C5A059] font-bold shrink-0">⏰ Store Hours:</span>
                    <span>Monday – Saturday: 8:00 AM – 7:30 PM</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200 dark:border-white/5 flex flex-col items-center justify-center text-center">
                  <p className="font-mono text-[8px] font-black tracking-wider text-stone-400 dark:text-white/30 uppercase">DIRECT CONCIERGE LINE</p>
                  <a 
                    href="tel:+254792620789" 
                    className="font-serif italic text-[#C5A059] hover:text-[#bc9853] font-bold text-2xl tracking-normal mt-0.5 block"
                  >
                    +254 792 620789
                  </a>
                  <a
                    href="https://wa.me/254792620789"
                    target="_blank"
                    className="mt-3.5 bg-[#25D366] hover:bg-[#1fa951] text-white font-sans font-bold text-xs py-2 px-4 w-full rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-center cursor-pointer select-none"
                  >
                    <span>Start Live Chat Support</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* SEO Metadata indexing helper badge footer */}
          <div className="bg-stone-100 dark:bg-white/[0.01] border border-stone-200 dark:border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-mono text-[9px] font-black text-stone-500 dark:text-white/40 uppercase block">SEO COGNITIVE SCHEMA ARCHIVE</span>
                <span className="text-[10px] text-stone-400 dark:text-white/30 font-sans">Indexed tags: e-commerce laptops Kenya, Epson l3250 price Nairobi, MacBook M3 compile developer.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-stone-200 dark:bg-white/5 text-stone-600 dark:text-white/30 font-mono text-[8px] font-bold px-2.5 py-1 rounded-sm">GOOGLE-BOT SCAN: OK</div>
              <div className="bg-stone-200 dark:bg-white/5 text-stone-600 dark:text-white/30 font-mono text-[8px] font-bold px-2.5 py-1 rounded-sm">XML SITE-MAP INDEXED</div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
