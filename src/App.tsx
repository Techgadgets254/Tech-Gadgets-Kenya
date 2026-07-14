/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import "./lib/firebase";
import { StoreProvider, useStore } from "./StoreContext";
import { AdminStoreProvider } from "./components/AdminStore";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import ShopView from "./components/ShopView";
import ProductDetailsView from "./components/ProductDetailsView";
import CheckoutView from "./components/CheckoutView";
import AdminDashboard from "./components/AdminDashboard";
import ClientDashboard from "./components/ClientDashboard";
import NewsView from "./components/NewsView";
import NotificationCenter from "./components/NotificationCenter";
import AIAdvisor from "./components/AIAdvisor";
import ErrorBoundary from "./components/ErrorBoundary";
import { Helmet } from "./components/Helmet";
import AuthModal from "./components/AuthModal";
import { Loader2, MessageSquare, HelpCircle, Share2, Package, PhoneCall, ShoppingBag, XCircle, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function StoreLayout() {
  const { activeView, authLoading, isAuthModalOpen, selectedProductId, products, setActiveView } = useStore();
  const [isWhatsAppVisible, setIsWhatsAppVisible] = React.useState(true);
  const [isMicroMenuOpen, setIsMicroMenuOpen] = React.useState(() => {
    try {
      return localStorage.getItem("tsk_micromenu_open") === "true";
    } catch (e) {
      return false;
    }
  });
  const [copied, setCopied] = React.useState(false);
  const [hasBeenOnProductPageTenSecs, setHasBeenOnProductPageTenSecs] = React.useState(false);
  const lastScrollTopRef = React.useRef(0);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem("tsk_micromenu_open", isMicroMenuOpen ? "true" : "false");
    } catch (e) {}
  }, [isMicroMenuOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMicroMenuOpen(false);
      }
    };
    if (isMicroMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMicroMenuOpen]);

  const menuVariants: any = {
    hidden: { 
      opacity: 0, 
      y: 15, 
      scale: 0.9,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        staggerChildren: 0.05,
        delayChildren: 0.02
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  React.useEffect(() => {
    setHasBeenOnProductPageTenSecs(false);
    if (activeView === "product-details") {
      const timer = setTimeout(() => {
        setHasBeenOnProductPageTenSecs(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeView, selectedProductId]);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      if (scrollTop <= 50) {
        setIsWhatsAppVisible(true);
      } else if (scrollTop > lastScrollTopRef.current) {
        // Scrolling down - hide
        setIsWhatsAppVisible(false);
      } else {
        // Scrolling up - show
        setIsWhatsAppVisible(true);
      }
      lastScrollTopRef.current = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "u" || e.key === "s" || e.key === "x")) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const seoData = React.useMemo(() => {
    switch (activeView) {
      case "home":
        return {
          title: "Tech Soko Kenya | Premium Imports & Hardware",
          description: "Premium laptops, desktops, and phones imported directly to Kenya. Fast, secure Lipa Na M-Pesa checkout with Nairobi CBD same-day dispatch.",
          keywords: "Tech Soko Kenya, laptops Nairobi, M-Pesa electronics, refurbished laptops Kenya, Apple MacBook Nairobi"
        };
      case "shop":
        return {
          title: "Browse Stock Storefront | Tech Soko Kenya",
          description: "Explore our live stock of high-end business laptops, Intel Core i7 systems, dedicated graphics cards, and enterprise accessories.",
          keywords: "HP EliteBook Nairobi, ThinkPad Kenya, refurbished MacBooks, Buy laptops Kenya"
        };
      case "product-details":
        return {
          title: "Detailed Specifications | Tech Soko Kenya",
          description: "Inspect component specifications, live local inventory levels, and configure direct WhatsApp price drop alerts instantly.",
          keywords: "Refurbished specs, laptop hardware configuration, tech price drop alert"
        };
      case "checkout":
        return {
          title: "Secure Lipa Na M-Pesa Checkout | Tech Soko Kenya",
          description: "Authorize purchase settlement securely with Safaricom Daraja STK Push pin prompt instantly. Quick regional courier dispatch.",
          keywords: "STK push, pay till number Nairobi, Safaricom Daraja checkout"
        };
      case "client-dashboard":
        return {
          title: "Client Profile Hub | Tech Soko Kenya",
          description: "Trace active delivery courier timelines, view transaction history, download tax invoices, and retrieve partner affiliate codes.",
          keywords: "Tech Soko invoice download, Nairobi county shipper tracking, Kenya tech partner"
        };
      case "admin-dashboard":
        return {
          title: "Admin Portal Console | Tech Soko Kenya",
          description: "Confidential administration console. Manage product assets, bulk ingest inventory CSV, and process customer price drop signals.",
          keywords: "Admin management console, inventory CSV ingestion, Kenya Daraja API"
        };
      case "news":
        return {
          title: "Kenya Technology & Hardware Blog | Tech Soko Kenya",
          description: "Inside coverage on global computer imports, KRA customs clearance procedures, and Nairobi hardware price forecasts.",
          keywords: "Kenya tech blogs, Nairobi computers price drop forecasts, customs gadgets Nairobi"
        };
      default:
        return {
          title: "Tech Soko Kenya | High-Performance Electronics",
          description: "Premium computer imports, electronics, and accessories along Kenyatta Avenue, Nairobi. Fast Safaricom M-Pesa checkout."
        };
    }
  }, [activeView]);

  const activeProduct = React.useMemo(() => {
    if (activeView === "product-details" && selectedProductId) {
      return products.find(p => p.id === selectedProductId);
    }
    return null;
  }, [activeView, selectedProductId, products]);

  const whatsappUrl = React.useMemo(() => {
    const phone = "254792620789";
    if (activeProduct) {
      const text = `Hello! I am interested in purchasing the ${activeProduct.name} (KES ${activeProduct.price.toLocaleString()}). Could you please share more details?`;
      return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/${phone}`;
  }, [activeProduct]);

  const whatsappLabel = React.useMemo(() => {
    switch (activeView) {
      case "product-details":
        return "Ask about this product";
      case "checkout":
        return "Need checkout assistance?";
      case "shop":
        return "Inquire about inventory";
      case "news":
        return "Discuss tech news";
      default:
        return "Direct WhatsApp Chat";
    }
  }, [activeView]);

  const handleWhatsAppClick = async () => {
    // 1. Device vibration feedback for mobile
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(50);
      } catch (e) {
        console.warn("Vibration feedback not supported or blocked by user/browser:", e);
      }
    }

    // 2. Log engagement metrics to whatsapp_clicks Firestore collection
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db, auth } = await import("./firebase");
      
      let referral = document.referrer || "direct";
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      if (utmSource) {
        referral = `${referral} (utm_source: ${utmSource})`;
      }

      await addDoc(collection(db, "whatsapp_clicks"), {
        page: activeView,
        referralSource: referral,
        productName: activeProduct ? activeProduct.name : null,
        productId: activeProduct ? activeProduct.id : null,
        userId: auth.currentUser?.uid || null,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed logging whatsapp engagement metric:", err);
    }
  };

  const handleShareClick = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(50);
      } catch (e) {}
    }

    const shareData = {
      title: document.title || "Tech Soko Kenya",
      text: activeProduct 
        ? `Check out ${activeProduct.name} on Tech Soko Kenya!` 
        : "Check out Tech Soko Kenya for premium imported hardware!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.warn("Share failed:", err);
    }
  };

  const playSubtleWhatsappHoverSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime); // subtle warm base freq
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.12); // pleasant up-sweep
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, audioCtx.currentTime + 0.02); // very quiet/non-disruptive
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22); // fade out
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio cue failed:", e);
    }
  };

  // Specific interactive motion configurations custom-matched to each view's theme and purpose
  const transitionVariants = {
    home: {
      initial: { opacity: 0, scale: 0.98, y: 12 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.98, y: -12 },
      transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }
    },
    shop: {
      initial: { opacity: 0, x: 24 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -24 },
      transition: { duration: 0.28, ease: [0.25, 1, 0.5, 1] as const }
    },
    "product-details": {
      initial: { opacity: 0, x: 32, scale: 0.99 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: -32, scale: 0.99 },
      transition: { duration: 0.36, ease: [0.34, 1.5, 0.64, 1] as const }
    },
    checkout: {
      initial: { opacity: 0, scale: 1.015, y: 8 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.985, y: -8 },
      transition: { duration: 0.34, ease: [0.175, 0.885, 0.32, 1.1] as const }
    },
    "client-dashboard": {
      initial: { opacity: 0, y: 24, rotate: 0.5 },
      animate: { opacity: 1, y: 0, rotate: 0 },
      exit: { opacity: 0, y: -24, rotate: -0.5 },
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const }
    },
    "admin-dashboard": {
      initial: { opacity: 0, y: -24, scale: 0.99 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 24, scale: 0.99 },
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const }
    },
    news: {
      initial: { opacity: 0, filter: "blur(4px)", y: 16 },
      animate: { opacity: 1, filter: "blur(0px)", y: 0 },
      exit: { opacity: 0, filter: "blur(4px)", y: -16 },
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  const activeVariants = (transitionVariants[activeView] || {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.22, ease: "easeOut" }
  }) as any;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-[#E0E0E0] font-sans selection:bg-[#C5A059]/20 selection:text-[#C5A059]">
      {/* Dynamic SEO Meta Header element */}
      <Helmet title={seoData.title} description={seoData.description} keywords={seoData.keywords} />

      {/* Real-time Order Status Notifications overlay */}
      <NotificationCenter />

      {/* 1. Navigation Shell Header */}
      <Header />
      
      {/* 2. Main Tabbed Layout viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={activeVariants}
            transition={activeVariants.transition}
            className="w-full h-full"
          >
            {activeView === "home" && <HomeView />}
            {activeView === "shop" && <ShopView />}
            {activeView === "product-details" && <ProductDetailsView />}
            {activeView === "checkout" && <CheckoutView />}
            {activeView === "client-dashboard" && (
              authLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mb-3" />
                  <p className="text-[11px] font-mono text-white/40">Securing your workspace profile...</p>
                </div>
              ) : (
                <ClientDashboard />
              )
            )}
            {activeView === "admin-dashboard" && (
              authLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mb-3" />
                  <p className="text-[11px] font-mono text-white/40">Verifying secure administrator registry state...</p>
                </div>
              ) : (
                <ErrorBoundary fallbackName="Operations Management Portal">
                  <AdminDashboard />
                </ErrorBoundary>
              )
            )}
            {activeView === "news" && <NewsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Grounded AI Advisor and Product Comparison matrix */}
      <AIAdvisor />

      {/* Centralized Sign In & Registration Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && <AuthModal />}
      </AnimatePresence>

      {/* Persistent Floating WhatsApp Chat Button & Actions */}
      {activeView !== "admin-dashboard" && activeView !== "client-dashboard" && (
        <div 
          ref={menuRef}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-3"
          style={{ pointerEvents: isWhatsAppVisible ? "auto" : "none" }}
        >
          {/* Main Trigger Button Container for micro-menu absolute positioning */}
          <div className="relative">
            {/* Pulsating Radiating Ring Animation (triggers after 10s on product page) */}
            {hasBeenOnProductPageTenSecs && (
              <motion.div
                className="absolute -inset-2 rounded-full border-2 border-[#25D366] pointer-events-none"
                animate={{
                  scale: [1, 1.3, 1.6],
                  opacity: [0.7, 0.35, 0]
                }}
                transition={{
                  duration: 2.0,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}

            {/* Floating Menu Toggle Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ 
                opacity: isWhatsAppVisible ? 1 : 0, 
                scale: isWhatsAppVisible ? 1 : 0,
                y: isWhatsAppVisible ? 0 : 20
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => {
                // Device vibration feedback for mobile on tap
                if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
                  try {
                    navigator.vibrate(50);
                  } catch (e) {}
                }
                setIsMicroMenuOpen(!isMicroMenuOpen);
              }}
              onMouseEnter={playSubtleWhatsappHoverSound}
              className="bg-[#25D366] hover:bg-[#20ba5a] hover:scale-105 active:scale-95 transition-all p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center group border border-white/10 cursor-pointer relative"
              title={whatsappLabel}
              id="floating-whatsapp-trigger"
            >
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0F0F0F]/95 text-[10px] font-mono font-bold uppercase tracking-wider text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:inline-block">
                {whatsappLabel}
              </span>
              
              {/* Dynamically swapped icon based on view */}
              {activeView === "checkout" ? (
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              ) : (
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              )}

              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </motion.button>

            {/* Micro-Menu with Spring & Stagger animation variants */}
            <AnimatePresence>
              {isMicroMenuOpen && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="absolute bottom-16 left-0 mb-2 bg-[#0F0F0F]/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl min-w-[180px] flex flex-col gap-1.5 z-50 font-mono text-[10px] uppercase tracking-wider text-white select-none"
                >
                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      setActiveView("checkout");
                      setIsMicroMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80 hover:text-[#C5A059] transition-all cursor-pointer text-left w-full"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>View Cart</span>
                  </motion.button>
                  
                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      setActiveView("client-dashboard");
                      setIsMicroMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80 hover:text-[#C5A059] transition-all cursor-pointer text-left w-full"
                  >
                    <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>My Orders</span>
                  </motion.button>
                  
                  <motion.a
                    variants={itemVariants}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleWhatsAppClick();
                      setIsMicroMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80 hover:text-[#C5A059] transition-all cursor-pointer text-left w-full"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Contact Support</span>
                  </motion.a>

                  <motion.button
                    variants={itemVariants}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error("Failed to copy link:", err);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80 hover:text-[#C5A059] transition-all cursor-pointer text-left w-full"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    onClick={() => setIsMicroMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 hover:text-red-500 transition-all cursor-pointer text-left w-full border-t border-white/5 mt-1"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Close Menu</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Secondary 'Share' Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 0 }}
            animate={{ 
              opacity: isWhatsAppVisible ? 1 : 0, 
              scale: isWhatsAppVisible ? 1 : 0,
              y: isWhatsAppVisible ? 0 : 20
            }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
            onClick={handleShareClick}
            className="bg-[#0F0F0F]/90 hover:bg-[#1A1A1A] hover:scale-105 active:scale-95 transition-all p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center border border-white/10 text-[#C5A059] hover:text-white cursor-pointer relative"
            title="Share current page link"
          >
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
      )}

      {/* 3. Base footer elements */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AdminStoreProvider>
        <StoreLayout />
      </AdminStoreProvider>
    </StoreProvider>
  );
}
