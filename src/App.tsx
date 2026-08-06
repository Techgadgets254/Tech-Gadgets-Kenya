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
import ReturnPolicyView from "./components/ReturnPolicyView";
import NotificationCenter from "./components/NotificationCenter";
import CartToastContainer from "./components/CartToastContainer";
import AIAdvisor from "./components/AIAdvisor";
import ErrorBoundary from "./components/ErrorBoundary";
import { Helmet } from "./components/Helmet";
import { useDynamicSeo } from "./hooks/useDynamicSeo";
import { useUserActivityTracker } from "./hooks/useUserActivityTracker";
import AuthModal from "./components/AuthModal";
import InactivityTimer from "./components/InactivityTimer";
import ProductComparisonOverlay from "./components/ProductComparisonOverlay";
import FloatingCompareBar from "./components/FloatingCompareBar";
import BackToTop from "./components/BackToTop";
import { Loader2, MessageSquare, HelpCircle, Share2, Package, PhoneCall, PhoneIncoming, ShoppingBag, XCircle, Copy, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Smooth, skeleton-style loaders to replace generic loading spinners and improve perceived load speed
function ClientDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-4 sm:p-8 bg-[#0F0F0F] rounded-3xl border border-white/10 shadow-2xl">
      {/* Header Profile Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 shrink-0" />
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-5 bg-white/10 rounded w-36 sm:w-48" />
            <div className="h-3 bg-white/5 rounded w-48 sm:w-64" />
          </div>
        </div>
        <div className="h-9 bg-white/10 rounded-xl w-32 shrink-0 self-start sm:self-auto" />
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-white/5 rounded-xl w-24 shrink-0" />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Orders */}
        <div className="lg:col-span-8 space-y-4">
          <div className="h-5 bg-white/10 rounded w-40 mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0" />
                <div className="space-y-2 min-w-0">
                  <div className="h-3.5 bg-white/10 rounded w-32 sm:w-48 truncate" />
                  <div className="h-2.5 bg-white/5 rounded w-20" />
                </div>
              </div>
              <div className="h-7 bg-white/10 rounded-lg w-20 shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="h-4 bg-white/10 rounded w-28" />
            <div className="space-y-2.5">
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-5/6" />
            </div>
            <div className="h-9 bg-white/10 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-4 sm:p-8 bg-[#0F0F0F] rounded-3xl border border-white/10 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="h-6 bg-white/10 rounded w-48" />
          <div className="h-3.5 bg-white/5 rounded w-64 sm:w-80" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-9 bg-white/10 rounded-xl w-24" />
          <div className="h-9 bg-white/10 rounded-xl w-28" />
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-white/5 rounded w-16" />
              <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
            </div>
            <div className="h-6 bg-white/10 rounded w-20" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Secondary split panel skeleton */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="h-5 bg-white/10 rounded w-36" />
          <div className="h-8 bg-white/10 rounded-lg w-44" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
                <div className="space-y-2 w-full min-w-0">
                  <div className="h-3.5 bg-white/10 rounded w-4/5 truncate" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3.5 bg-white/10 rounded w-24 shrink-0 hidden sm:block" />
              <div className="h-3.5 bg-white/5 rounded w-16 shrink-0 hidden sm:block" />
              <div className="h-6 bg-white/10 rounded w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoreLayout() {
  const { activeView, authLoading, isAuthModalOpen, selectedProductId, products, cart, setActiveView } = useStore();

  const cartCount = React.useMemo(() => {
    return cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  }, [cart]);
  const [isWhatsAppVisible, setIsWhatsAppVisible] = React.useState(true);
  const [isMicroMenuOpen, setIsMicroMenuOpen] = React.useState(() => {
    try {
      return localStorage.getItem("tsk_micromenu_open") === "true";
    } catch (e) {
      return false;
    }
  });
  const [copied, setCopied] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeView, selectedProductId]);

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

  const activeProduct = React.useMemo(() => {
    if (activeView === "product-details" && selectedProductId) {
      return products.find(p => p.id === selectedProductId);
    }
    return null;
  }, [activeView, selectedProductId, products]);

  const seoData = useDynamicSeo(activeView, activeProduct);

  // Firestore user activity interaction tracking hook
  useUserActivityTracker(activeView, activeProduct || null, cartCount, false);

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

  const handleGeoLocationWhatsAppInquiry = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const msg = `Hello Tech Sokoni Kenya, I am inquiring about product availability and immediate delivery near my current location (GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Do you have stock available for dispatch to my area?`;
          window.open(`https://wa.me/254792620789?text=${encodeURIComponent(msg)}`, "_blank");
        },
        (error) => {
          console.warn("Geolocation positioning error / permission fallback:", error);
          const msg = `Hello Tech Sokoni Kenya, I am inquiring about product stock availability and express delivery options near my local area in Kenya.`;
          window.open(`https://wa.me/254792620789?text=${encodeURIComponent(msg)}`, "_blank");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      const msg = `Hello Tech Sokoni Kenya, I am inquiring about product stock availability and express delivery options near my local area in Kenya.`;
      window.open(`https://wa.me/254792620789?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleRequestCallBack = () => {
    const phone = "254792620789";
    const itemReference = activeProduct ? activeProduct.name : "Tech Sokoni Kenya Gadgets";
    const msg = `Request Call: Hello Tech Sokoni Kenya support team, please call me back regarding ${itemReference}. I need assistance with product specification and ordering.`;
    
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try { navigator.vibrate(50); } catch (e) { /* ignore */ }
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

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

    const currentUrl = activeProduct 
      ? `${window.location.origin}/?product=${activeProduct.id}`
      : window.location.href;

    const shareTitle = activeProduct 
      ? `${activeProduct.brand} ${activeProduct.name} - Tech Sokoni Kenya`
      : "Tech Sokoni Kenya | Premium Laptops & Enterprise Electronics";

    const shareText = activeProduct
      ? `🔥 Check out the ${activeProduct.brand} ${activeProduct.name} (KES ${activeProduct.price.toLocaleString()}) on Tech Sokoni Kenya!\nStock: ${activeProduct.stock > 0 ? `${activeProduct.stock} units available` : "Pre-order / Request Alert"}\nSpecs: ${activeProduct.description?.slice(0, 110) || "Genuine imported hardware"}...\nSame-day Nairobi delivery with Lipa Na M-Pesa STK Push.`
      : `🔥 Discover genuine Apple MacBooks, HP EliteBooks, Dell XPS workstations, and iPhones on Tech Sokoni Kenya!\nSame-day Nairobi delivery with Lipa Na M-Pesa.`;

    const shareData = {
      title: shareTitle,
      text: shareText,
      url: currentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        triggerToast("Product details shared successfully!");
      } else {
        await navigator.clipboard.writeText(`${shareText}\nDirect Link: ${currentUrl}`);
        triggerToast("Product details & link copied to clipboard!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(`${shareText}\nDirect Link: ${currentUrl}`);
          triggerToast("Product details & link copied to clipboard!");
        } catch (clipErr) {
          console.warn("Share failed:", clipErr);
        }
      }
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
      <Helmet 
        title={seoData.title} 
        description={seoData.description} 
        keywords={seoData.keywords}
        image={seoData.image}
        url={seoData.url}
        type={seoData.type}
        product={activeProduct}
      />

      {/* Real-time Order Status Notifications overlay */}
      <NotificationCenter />

      {/* Animated item add-to-cart notifications */}
      <CartToastContainer />

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
                <ClientDashboardSkeleton />
              ) : (
                <ClientDashboard />
              )
            )}
            {activeView === "admin-dashboard" && (
              authLoading ? (
                <AdminDashboardSkeleton />
              ) : (
                <ErrorBoundary fallbackName="Operations Management Portal">
                  <AdminDashboard />
                </ErrorBoundary>
              )
            )}
            {activeView === "news" && <NewsView />}
            {activeView === "return-policy" && <ReturnPolicyView />}
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
                  
                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      handleGeoLocationWhatsAppInquiry();
                      setIsMicroMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80 hover:text-[#C5A059] transition-all cursor-pointer text-left w-full"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>GPS Stock Inquiry</span>
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      handleRequestCallBack();
                      setIsMicroMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer text-left w-full font-bold"
                  >
                    <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Request Call-Back</span>
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

      {/* Product Comparison Overlay, Floating Bar, Inactivity Timer & Back to Top */}
      <FloatingCompareBar />
      <ProductComparisonOverlay />
      <InactivityTimer />
      <BackToTop />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#0F0F0F] text-white px-5 py-3 rounded-2xl border border-[#C5A059]/40 shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
