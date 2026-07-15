/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../StoreContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Laptop, 
  Smartphone, 
  Printer, 
  Cable, 
  Tv, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Heart,
  Scale,
  ChevronDown,
  HelpCircle,
  Cpu,
  Shield,
  Info,
  Tag,
  Percent,
  Flame,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";

export default function HomeView() {
  const { 
    products, 
    setActiveView, 
    setSelectedProductId, 
    addToCart,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
    setSearchQuery
  } = useStore();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // States & memoized logic for dynamic cycling promo banners
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const promoProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter(p => {
      if (!p.flashPrice || p.stock <= 0) return false;
      const now = new Date();
      if (p.flashExpiry) {
        const expiryDate = new Date(p.flashExpiry);
        if (now > expiryDate) return false;
      }
      return true;
    });
  }, [products]);

  useEffect(() => {
    if (promoProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promoProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promoProducts]);

  const getPromoText = (index: number, product: any) => {
    return {
      badge: product.flashBanner || "🔥 WAREHOUSE FLASH DEAL",
      title: product.name,
      tagline: product.description || "Experience unmatched performance, local Kenyan service center warranty, and immediate M-Pesa clearing."
    };
  };

  const sectionVariants: any = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const faqData = [
    {
      q: "How does the Paystack payment gateway work?",
      a: "When checking out, select Paystack as your payment method. You can securely clear payments instantly using your credit/debit cards or mobile money channels. Real-time encryption verifies the transaction instantly and updates your orders list directly on your client dashboard."
    },
    {
      q: "What is the delivery timeline and coverage?",
      a: "We ship nationwide across all 47 counties of Kenya! Nairobi addresses qualify for same-day delivery via immediate bicycle courier routes. Deliveries to upcountry logistics hubs (Mombasa, Kisumu, Nakuru, Eldoret, Thika, etc.) arrive within 24 to 48 hours."
    },
    {
      q: "Is shipping free?",
      a: "Yes! We currently offer 100% Free Shipping nationwide with absolutely no delivery surcharge, including Nairobi addresses."
    },
    {
      q: "How does Pay-on-Delivery (Cash on Delivery) work?",
      a: "For upcountry addresses located outside Nairobi county, we bypass pre-payment entirely. You are permitted to fully inspect the physical hardware (screens, seals, test prints) at your courier collection office before authorizing cash release."
    },
    {
      q: "Are the products genuine and covered by warranty?",
      a: "Absolutely. Every Apple MacBook/iPhone, genuine Epson EcoTank printer, and Anker power backup is 100% manufacturer-certified and comes with a 1-year local service center replacement guarantee."
    }
  ];

  // Expanded categories map for custom icons & counts
  const categories = [
    { name: "New Laptops", desc: "Brand-new M3 Pro/Max sealed developer powerhouse arrays", icon: Laptop, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "Refurbished Laptops", desc: "Certified pristine corporate business laptops", icon: Laptop, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "New Phones", desc: "Titanium iPhone 15s & AI Galaxy S-series flagships", icon: Smartphone, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "Refurbished Phones", desc: "Certified pristine pre-owned iPhone & Galaxy units", icon: Smartphone, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "New Desktops", desc: "Brand-new Ryzen custom compiling rigs & elite workspace towers", icon: Cpu, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "Refurbished Desktops", desc: "Certified pristine corporate HP secure slim towers", icon: Cpu, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "Printers", desc: "Industrial Epson EcoTanks & smart business scanners", icon: Printer, color: "bg-white/[0.02] text-[#C5A059] border-white/10" },
    { name: "Accessories", desc: "High-yield power reservoirs & elite Anker setups", icon: Cable, color: "bg-white/[0.02] text-[#C5A059] border-white/10" }
  ];

  const featured = products.slice(0, 4);

  // We recommend high demand laptops for suggestion in hero section
  const suggestedLaptops = products.filter(p => 
    p.category.toLowerCase().includes("laptop")
  ).slice(0, 2);

  return (
    <div id="home-view-container" className="animate-fadeIn">
      {/* 1. Interactive Premium Hero Banner */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="bg-gradient-to-br from-[#0F0F0F] via-[#121212] to-[#0A0A0A] border border-white/10 text-white rounded-3xl overflow-hidden p-6 sm:p-12 relative shadow-2xl mb-12"
      >
        <div className="absolute top-4 right-4 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-xs z-20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Safaricom STK-Push Online</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7">
            <span className="font-mono text-xs font-bold tracking-widest text-[#C5A059] uppercase">
              Official Kenyan Electronics Distributor
            </span>
            <h1 className="font-serif italic font-light text-3xl sm:text-5xl tracking-tight text-white mt-4 leading-tight">
              Elite Hardware.
              <span className="text-[#C5A059] block font-sans font-extrabold not-italic mt-2 tracking-tight">Immediate Delivery.</span>
            </h1>
            <p className="font-sans text-white/50 text-sm sm:text-base mt-4 leading-relaxed">
              Acquire premium Apple M3 suites, extreme-capacity Anker reservoirs, and genuine Epson ink technologies synced directly on local inventory pools. Pay securely with M-Pesa.
            </p>
            
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveView("shop");
                }}
                className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 group text-sm"
              >
                <span>Explore Stock Catalog</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveView("client-dashboard");
                }}
                className="bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 font-sans px-5 py-3 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Track Order Invoice
              </button>
            </div>
          </div>

          {/* Interactive Laptop recommendation placeholder replacing the image */}
          <div className="md:col-span-5 space-y-3 z-10">
            <div className="text-left mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-ping" />
                Featured Laptop Picks
              </span>
              <span className="text-[9px] text-white/30 font-mono">Immediate Nairobi Pickup</span>
            </div>
            
            <div className="space-y-3">
              {suggestedLaptops.map(laptop => (
                <div
                  key={laptop.id}
                  onClick={() => {
                    setSelectedProductId(laptop.id);
                    setActiveView("product-details");
                  }}
                  style={{ backgroundColor: "var(--theme-bg-050505)" }}
                  className="border border-white/5 dark:border-white/10 hover:border-[#C5A059]/50 rounded-2xl p-4 flex gap-4 cursor-pointer transition-all hover:opacity-90 group/suggestion relative"
                >
                  <img
                    src={laptop.image}
                    alt={laptop.name}
                    className="w-14 h-14 rounded-xl object-cover border border-white/5 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left flex-1 min-w-0">
                    <span className="text-[8.5px] font-mono bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/15 px-1.5 py-0.5 rounded">
                      {laptop.category}
                    </span>
                    <h3 className="text-white text-xs font-semibold truncate mt-1 group-hover/suggestion:text-[#C5A059] transition-colors font-sans">
                      {laptop.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 mt-1.5">
                      <p className="text-[#C5A059] font-mono text-xs font-bold leading-none">
                        KES {laptop.price.toLocaleString()}
                      </p>
                      <span className="text-[9px] font-mono text-emerald-400 font-medium">In Stock</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient backdrop gradient glow */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-[#C5A059]/10 to-transparent pointer-events-none hidden md:block z-0" />
      </motion.section>

      {/* Dynamic Cycling Motion-Based Promotional Banner */}
      {promoProducts.length > 0 && (
        <section className="mb-12 relative overflow-hidden" id="motion-promotions-section">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-sans font-medium text-lg text-white">Live Warehouse Flash Offers</h2>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setActivePromoIndex(prev => (prev - 1 + promoProducts.length) % promoProducts.length)}
                className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059] bg-white/[0.02] hover:bg-white/[0.06] text-white/60 hover:text-[#C5A059] transition-all cursor-pointer"
                title="Previous Offer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActivePromoIndex(prev => (prev + 1) % promoProducts.length)}
                className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059] bg-white/[0.02] hover:bg-white/[0.06] text-white/60 hover:text-[#C5A059] transition-all cursor-pointer"
                title="Next Offer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-950/20 via-[#0F0F0F] to-amber-950/20 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden min-h-[260px] flex flex-col justify-center">
            {/* Ambient background blur circles */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

            <AnimatePresence mode="wait">
              {promoProducts.map((product, idx) => {
                if (idx !== activePromoIndex) return null;
                const textInfo = getPromoText(idx, product);
                const promoPrice = product.flashPrice || product.price;
                const originalPrice = product.price;
                const discountPercent = originalPrice > 0 ? Math.round((1 - promoPrice / originalPrice) * 100) : 0;
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10"
                  >
                    {/* Text Details (7 Cols) */}
                    <div className="md:col-span-7 text-left space-y-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-mono text-[9px] font-extrabold tracking-widest text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                          {textInfo.badge}
                        </span>
                        {discountPercent > 0 && (
                          <span className="font-mono text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Percent className="w-2.5 h-2.5" />
                            Save {discountPercent}% Today
                          </span>
                        )}
                      </div>

                      <h3 className="font-sans font-bold text-lg sm:text-2xl text-white tracking-tight leading-snug">
                        {textInfo.title}
                      </h3>
                      
                      <p className="text-white/50 text-xs leading-relaxed max-w-xl">
                        {textInfo.tagline}
                      </p>

                      <div className="flex flex-wrap items-end gap-3 pt-1.5">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-white/35 font-mono uppercase tracking-wider block">PROMOTIONAL OFFER</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl font-extrabold text-[#C5A059] font-mono">
                              KES {promoPrice.toLocaleString()}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-xs text-white/35 line-through font-mono">
                                KES {originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md font-mono h-fit mb-0.5">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Expires soon: {product.stock} left</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setActiveView("product-details");
                            window.scrollTo(0, 0);
                          }}
                          className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 group/btn"
                        >
                          <span>Secure Deal Specs</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-sans text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer hover:border-[#C5A059]/40"
                        >
                          Add to Dispatch
                        </button>
                      </div>
                    </div>

                    {/* Interactive Image Display (5 Cols) */}
                    <div className="md:col-span-5 flex justify-center md:justify-end relative">
                      <div className="relative group/promoimg">
                        <div className="absolute inset-0 bg-[#C5A059]/10 rounded-2xl blur-xl group-hover/promoimg:bg-[#C5A059]/20 transition-all duration-500" />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full max-w-[200px] h-36 sm:h-44 object-cover rounded-2xl border border-white/15 bg-black/60 shadow-xl relative z-10 transition-transform duration-500 group-hover/promoimg:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6 relative z-10">
              {promoProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePromoIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === activePromoIndex ? "bg-[#C5A059] w-5" : "bg-white/15 hover:bg-white/30"
                  }`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Structured Category Selection Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        className="mb-14"
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-sans font-medium text-2xl tracking-tight text-white">
              Browse Genuine Stock Categories
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              Select category to filter authentic hardware currently in our Nairobi warehouse.
            </p>
          </div>
          <button 
            onClick={() => setActiveView("shop")} 
            className="text-xs sm:text-sm font-semibold text-[#C5A059] hover:text-[#C5A059]/80 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            // Count products in this precise subcategory
            const count = products.filter(p => p.category === cat.name).length;

            return (
              <div
                key={i}
                onClick={() => {
                  setSearchQuery(cat.name);
                  setActiveView("shop");
                }}
                style={{ backgroundColor: "var(--theme-bg-0f0f0f)" }}
                className="border border-white/10 rounded-2xl p-5 hover:border-[#C5A059]/60 cursor-pointer transition-all flex flex-row xl:flex-col xl:items-start items-center justify-between xl:justify-start gap-4 group hover:opacity-95"
              >
                <div className={`${cat.color} p-3 rounded-xl border flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 xl:mt-2">
                  <h3 className="font-sans font-semibold text-sm text-white group-hover:text-[#C5A059] transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-white/40 text-[11px] leading-tight mt-1 hidden sm:block xl:line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <span className="font-mono text-xs font-bold bg-white/[0.02] text-white/60 border border-white/10 rounded-md px-2 py-0.5 shrink-0 block">
                  {count > 0 ? `${count} items` : "Catalog"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 3. Featured Premium Products Selector */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        className="mb-14"
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-sans font-medium text-2xl tracking-tight text-white">
              Featured Premium Listings
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              Top recommended machinery for creators, developers, and businesses in East Africa.
            </p>
          </div>
          <button 
            onClick={() => setActiveView("shop")} 
            className="text-xs sm:text-sm font-semibold text-[#C5A059] hover:text-[#C5A059]/80 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

         {products.length === 0 ? (
          <div style={{ backgroundColor: "var(--theme-bg-0f0f0f)" }} className="border border-white/10 py-12 rounded-2xl text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A059] mb-4" />
            <p className="text-xs text-white/40 font-mono">Syncing warehouse collection from firestore...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => {
              const isLowStock = product.stock <= 5;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  style={{ backgroundColor: "var(--theme-bg-0f0f0f)" }}
                  className="border border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/40 transition-all flex flex-col group relative"
                >
                  <div 
                    style={{ backgroundColor: "var(--theme-bg-1a1a1a)" }}
                    className="relative h-48 overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setActiveView("product-details");
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                    
                    {/* Floating Wishlist / Compare */}
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                        className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                          wishlist.includes(product.id)
                            ? "bg-[#C5A059] text-black border-[#C5A059]"
                            : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                        }`}
                        title="Add to wishlist"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                        className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                          compareList.some(item => item.id === product.id)
                            ? "bg-white text-black border-white"
                            : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                        }`}
                        title="Compare Product"
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      <span className="bg-black/70 backdrop-blur-xs text-[#C5A059] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {product.brand}
                      </span>
                      {isOutOfStock ? (
                        <span className="bg-white/10 text-white/50 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-red-500/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>LOW STOCK</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider">
                        {product.category}
                      </span>
                      <h3 
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setActiveView("product-details");
                        }}
                        className="font-sans font-semibold text-base text-white mt-1 cursor-pointer hover:text-[#C5A059] transition-colors line-clamp-2"
                      >
                        {product.name}
                      </h3>
                      <p className="text-white/50 text-xs mt-2 line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-white/30 font-mono block">STORE PRICE</span>
                        <span className="font-sans font-black text-white text-md">
                          KES {product.price.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product, 1)}
                        className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* 4. Dedicated Premium Laptops Listings Showcase */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        className="mb-14"
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-sans font-medium text-2xl tracking-tight text-white flex items-center gap-2">
              <Laptop className="w-5.5 h-5.5 text-[#C5A059]" />
              Premium Laptop Listings
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              Top-tier computing power: Apple Silicon MacBooks and Intel Ultra powerhouse elite laptops.
            </p>
          </div>
          <button 
            onClick={() => setActiveView("shop")} 
            className="text-xs sm:text-sm font-semibold text-[#C5A059] hover:text-[#C5A059]/80 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Laptops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

         {products.filter(p => p.category.toLowerCase().includes("laptop")).length === 0 ? (
          <div style={{ backgroundColor: "var(--theme-bg-0f0f0f)" }} className="border border-white/10 py-12 rounded-2xl text-center">
            <p className="text-xs text-white/40 font-mono">Syncing laptop warehouse allocation...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(p => p.category.toLowerCase().includes("laptop"))
              .slice(0, 4)
              .map((product) => {
                const isLowStock = product.stock <= 5;
                const isOutOfStock = product.stock === 0;

                return (
                  <div
                    key={product.id}
                    style={{ backgroundColor: "var(--theme-bg-0f0f0f)" }}
                    className="border border-[#C5A059]/20 rounded-2xl overflow-hidden hover:border-[#C5A059]/50 transition-all flex flex-col group relative"
                  >
                    <div 
                      style={{ backgroundColor: "var(--theme-bg-1a1a1a)" }}
                      className="relative h-48 overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setActiveView("product-details");
                      }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                      
                      {/* Floating Action Buttons */}
                      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                          className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                            wishlist.includes(product.id)
                              ? "bg-[#C5A059] text-black border-[#C5A059]"
                              : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                          }`}
                          title="Save to Wishlist"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                          className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                            compareList.some(item => item.id === product.id)
                              ? "bg-white text-black border-white"
                              : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                          }`}
                          title="Compare with another item"
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        <span className="bg-black/70 backdrop-blur-xs text-[#C5A059] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {product.brand}
                        </span>
                        {isOutOfStock ? (
                          <span className="bg-white/10 text-white/50 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-red-500/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>LOW STOCK</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider">
                          {product.category}
                        </span>
                        <h3 
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setActiveView("product-details");
                          }}
                          className="font-sans font-semibold text-base text-white mt-1 cursor-pointer hover:text-[#C5A059] transition-colors line-clamp-2"
                        >
                          {product.name}
                        </h3>
                        <p className="text-white/50 text-xs mt-2 line-clamp-3">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-white/30 font-mono block">STORE PRICE</span>
                          <span className="font-sans font-black text-[#C5A059] text-md">
                            KES {product.price.toLocaleString()}
                          </span>
                        </div>

                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product, 1)}
                          className={`font-sans text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                            isOutOfStock 
                              ? "bg-white/5 text-white/30 cursor-not-allowed" 
                              : "bg-[#C5A059] hover:bg-[#C5A059]/90 text-black"
                          }`}
                        >
                          {isOutOfStock ? "Sold Out" : "Add to Bag"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </motion.section>

      {/* 3. Interactive FAQ Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        id="distribution-faq"
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-xl">
            <HelpCircle className="w-5 h-5 text-[#C5A059]" />
          </div>
          <div>
            <h2 className="font-serif italic text-2xl font-light text-white leading-none">
              Frequently Asked Questions
            </h2>
            <p className="font-mono text-[9px] tracking-[0.2em] text-[#C5A059] font-bold uppercase mt-1">
              Distribution & M-Pesa Till Guidance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {faqData.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div 
                key={i}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-sans font-semibold text-xs sm:text-sm text-white hover:text-[#C5A059] cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-[#C5A059]">0{i + 1}.</span>
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/45 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#C5A059]" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 text-white/70 text-xs leading-relaxed font-sans animate-fadeIn whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Trust Banner */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={sectionVariants}
        className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="max-w-xl">
          <h3 className="font-serif italic text-lg font-light tracking-wide text-white">
            Secure Safaricom Till Verification
          </h3>
          <p className="text-white/40 text-xs sm:text-sm mt-1 leading-relaxed border-l-2 border-[#C5A059]/30 pl-3">
            Tech Soko Kenya utilizes registered Buy Goods Till terminals. When checking out, enter your registered Safaricom number to trigger an instant secure STK push pin prompt. Receipts update in seconds, generating clean downloadable tax invoices.
          </p>
        </div>
        <div className="flex gap-4 shrink-0 font-mono text-xs text-[#C5A059] bg-white/[0.02] border border-white/10 p-4 rounded-xl">
          <div>
            <p className="font-bold text-[#C5A059]">M-PESA TILL NO</p>
            <p className="text-base font-black tracking-widest text-white bg-white/[0.04] border border-white/10 rounded-md px-3 py-1 mt-1">
              9309020
            </p>
          </div>
          <div>
            <p className="font-bold text-[#C5A059]">ACC TYPE</p>
            <p className="text-base font-black tracking-widest text-white bg-white/[0.04] border border-white/10 rounded-md px-3 py-1 mt-1">
              BUY GOODS
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
