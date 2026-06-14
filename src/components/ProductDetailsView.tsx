/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useStore } from "../StoreContext";
import { 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Star, 
  Monitor,
  Bookmark,
  Share2,
  Bell,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function ProductDetailsView() {
  const { 
    products, 
    selectedProductId, 
    setSelectedProductId, 
    setActiveView, 
    addToCart,
    submitProductReview,
    wishlist,
    toggleWishlist,
    user,
    registerPriceAlert,
    productReviews
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Hover zoom magnifier state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: "center center",
    transform: "scale(1)"
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.2)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  // Form states for new review submission
  const [revName, setRevName] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Form states for Price alerts
  const [priceAlertEmail, setPriceAlertEmail] = useState("whatsapp-only@techgadgetskenya.co.ke");
  const [priceAlertWhatsapp, setPriceAlertWhatsapp] = useState("");
  const [priceAlertTarget, setPriceAlertTarget] = useState("");
  const [priceAlertSuccess, setPriceAlertSuccess] = useState(false);

  // Expanded FAQ trace
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync current user email to input if available
  React.useEffect(() => {
    if (user?.email) {
      setPriceAlertEmail(user.email);
    } else {
      setPriceAlertEmail("whatsapp-only@techgadgetskenya.co.ke");
    }
  }, [user]);

  // Pre-filled WhatsApp and share links
  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = priceAlertEmail || user?.email || "whatsapp-only@techgadgetskenya.co.ke";
    if (!product || !priceAlertWhatsapp || !priceAlertTarget) return;
    const targetPrice = parseFloat(priceAlertTarget);
    if (isNaN(targetPrice) || targetPrice <= 0) return;

    const ok = await registerPriceAlert(
      product.id,
      product.name,
      emailToUse,
      priceAlertWhatsapp,
      targetPrice,
      product.price
    );
    if (ok) {
      setPriceAlertSuccess(true);
    }
  };

  // Load selected product profile
  const product = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Sync activeImage when product changes
  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
    }
  }, [product]);

  // Load database reviews from the top-level Firestore collection
  const dbReviews = useMemo(() => {
    if (!productReviews || !product) return [];
    return productReviews.filter(r => r.productId === product.id);
  }, [productReviews, product]);

  // Simulated static and dynamic reviews builder
  const displayedReviews = useMemo(() => {
    const base = [
      { name: "Edwin K. (Senior Lead Dev)", rating: 5, date: "3 weeks ago", text: "Exceptional hardware. Processed payment via M-Pesa STK and received the MacBook within 2 hours at our office along Waiyaki Way. Highly recommend Tech Gadgets Kenya for genuine equipment.", location: "Nairobi, KE" },
      { name: "Phyllis N. (Studio Director)", rating: 5, date: "1 month ago", text: "Genuine article verified through the manufacturer portal. The screens look flawless. Best local pricing for authentic titanium specs.", location: "Mombasa, KE" },
      { name: "Abdi H. (Freelance Architect)", rating: 4, date: "2 months ago", text: "Clean transactional clearance. Checked specs thoroughly; they match the physical inventory sheet exactly. Stock levels are live, which is incredible.", location: "Kisumu, KE" }
    ];
    if (dbReviews && dbReviews.length > 0) {
      const customOnes = dbReviews.map(r => ({
        name: r.userName,
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString("en-KE", { day: 'numeric', month: 'short', year: 'numeric' }),
        text: r.comment,
        location: "Verified Buyer"
      }));
      return [...customOnes, ...base];
    }
    return base;
  }, [dbReviews]);

  const ratingAverage = useMemo(() => {
    if (!product) return 4.8;
    if (dbReviews.length === 0) return product.rating || 4.8;
    const total = dbReviews.reduce((sum, r) => sum + r.rating, 0);
    return Number((total / dbReviews.length).toFixed(1));
  }, [product, dbReviews]);

  // Loading or invalid fallback
  if (!product) {
    return (
      <div className="text-center py-16 text-white bg-[#0A0A0A]">
        <p className="text-white/70 font-mono text-sm">Product record not found.</p>
        <button 
          onClick={() => setActiveView("shop")} 
          className="mt-4 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const getProductVariants = (p: typeof product) => {
    if (!p) return null;
    if (p.customVariants && p.customVariants.options && p.customVariants.options.length > 0) {
      return {
        label: p.customVariants.label || "Available Feature Options",
        options: p.customVariants.options.map(opt => {
          const offset = opt.price - p.price;
          if (offset > 0) {
            return `${opt.name} (+ KES ${offset.toLocaleString()})`;
          } else if (offset < 0) {
            return `${opt.name} (- KES ${Math.abs(offset).toLocaleString()})`;
          } else {
            return opt.name;
          }
        })
      };
    }

    const cat = p.category.toLowerCase();
    if (cat.includes("laptop")) {
      return {
        label: "RAM / System Performance Configuration",
        options: ["16GB Unified RAM | 512GB SSD", "32GB Unified RAM | 1TB SSD (+ KES 25,000)", "64GB Unified RAM | 2TB SSD (+ KES 60,000)"]
      };
    }
    if (cat.includes("phone")) {
      return {
        label: "Flash Storage Capacity Unit",
        options: ["128GB Storage", "256GB Storage Unit (+ KES 10,000)", "512GB Storage Unit (+ KES 22,000)", "1TB Ultimate Storage Unit (+ KES 45,000)"]
      };
    }
    return {
      label: "Device Customization Bundle Option",
      options: ["Standard Retail Box Edition", "Extended Premium Care Warranty Bundle (+ KES 4,500)"]
    };
  };

  const [selectedVariant, setSelectedVariant] = useState<string>("");

  const variantsInfo = useMemo(() => {
    return getProductVariants(product);
  }, [product]);

  React.useEffect(() => {
    if (variantsInfo && variantsInfo.options.length > 0) {
      setSelectedVariant(variantsInfo.options[0]);
    } else {
      setSelectedVariant("");
    }
  }, [variantsInfo]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    if (!selectedVariant) return price;

    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
    const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
    if (priceMatch) {
       const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
       price += premium;
    } else if (minusMatch) {
       const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
       price -= discount;
    }
    return price;
  }, [product, selectedVariant]);

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (!selectedVariant || !variantsInfo) return product.stock;
    const idx = variantsInfo.options.indexOf(selectedVariant);
    if (idx === -1) return product.stock;
    const modStock = Math.max(1, (product.stock - idx * 2));
    return modStock;
  }, [product, selectedVariant, variantsInfo]);

  const isLowStock = currentStock <= 5;
  const isOutOfStock = currentStock === 0;

  // Find related items (matching category, excluding current product, up to 3 items)
  const relatedItems = useMemo(() => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [products, product]);

  // Handle adding custom quantity to bag
  const handleAddToBag = () => {
    let finalPrice = product.price;
    let finalName = product.name;
    let finalId = product.id;

    if (selectedVariant) {
      const cleanVariantName = selectedVariant.split(" (+")[0].split(" (-")[0];
      const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
      const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
      if (priceMatch) {
         const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
         finalPrice += premium;
      } else if (minusMatch) {
         const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
         finalPrice -= discount;
      }
      finalName = `${product.name} (${cleanVariantName})`;
      finalId = `${product.id}-${cleanVariantName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    const modifiedProduct = {
      ...product,
      id: finalId,
      name: finalName,
      price: finalPrice
    };

    addToCart(modifiedProduct, quantity);
    setActiveView("checkout");
  };

  // Submit dynamic review inside Firestore
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revComment.trim()) return;
    setSubmittingReview(true);
    try {
      await submitProductReview(product.id, revRating, revComment, revName);
      setReviewSuccess(true);
      setRevName("");
      setRevComment("");
      setRevRating(5);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div id="product-details-container" className="animate-fadeIn">
      
      {/* Return to shop banner link */}
      <button
        onClick={() => setActiveView("shop")}
        className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-[#C5A059] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to live inventory catalog</span>
      </button>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        
        {/* Left Side: Media Display with interactive multi-image switcher - Medium sized */}
        <div className="lg:col-span-6 space-y-4 flex flex-col items-center">
          <div 
            className="bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-64 sm:h-80 w-full max-w-sm sm:max-w-md mx-auto relative cursor-zoom-in group/zoom container-zoom-magnifier"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={activeImage || product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-3 transition-transform duration-75 ease-out"
              style={zoomStyle}
            />
          </div>
          
          {/* Thumbnails list mapping up to 5 images */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex justify-center gap-2 px-2 py-1.5 bg-black/30 border border-white/5 rounded-2xl overflow-x-auto w-full max-w-sm sm:max-w-md">
              {[product.image, ...product.gallery].map((img, index) => {
                const isActive = (activeImage || product.image) === img;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border cursor-pointer shrink-0 transition-all ${
                      isActive 
                        ? "border-[#C5A059] ring-2 ring-[#C5A059]/20" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img src={img} alt={`Asset View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="flex border border-white/5 bg-white/[0.02] rounded-2xl p-4 items-center gap-3">
            <span className="p-2 rounded-lg bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shrink-0">
              <CheckCircle className="w-5 h-5 text-[#C5A059]" />
            </span>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Authentic East African Warranty Verified</p>
              <p className="text-[11px] text-white/70 mt-0.5">This {product.brand} packaging is factory sealed and covered by standard 12-month manufacturer backing.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Specific Details and Dynamic Buy panel */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-[#C5A059] font-mono text-[11px] uppercase font-bold tracking-widest block mb-1">
              {product.brand} • {product.category}
            </span>
            <h1 className="font-sans font-semibold text-2xl sm:text-3xl tracking-tight text-white leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => {
                  const starIndex = i + 1;
                  const isGold = starIndex <= Math.round(ratingAverage);
                  return (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${isGold ? "text-amber-400 fill-amber-400" : "text-white/20"}`} 
                    />
                  );
                })}
              </div>
              <span className="text-xs font-medium text-white/70">({ratingAverage} Average • {displayedReviews.length} verified reviews)</span>
            </div>
          </div>

          <p className="font-sans text-white/70 text-sm leading-relaxed border-t border-b border-white/5 py-4">
            {product.description}
          </p>

          {/* Variants Selector Section */}
          {variantsInfo && variantsInfo.options.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider block">
                {variantsInfo.label}
              </span>
              <div className="flex flex-col gap-2">
                {variantsInfo.options.map((option) => {
                  const isSelected = selectedVariant === option;
                  const cleanOpt = option.split(" (")[0];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedVariant(option)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#C5A059]/15 border-[#C5A059] text-white"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                      }`}
                    >
                      <span>{cleanOpt}</span>
                      {option.includes("(+") && (
                        <span className="text-[10px] font-mono text-[#C5A059] font-bold">
                          +{option.split("(+")[1].replace(")", "")}
                        </span>
                      )}
                      {option.includes("(-") && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          -{option.split("(-")[1].replace(")", "")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing and Stock Level metrics */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 animate-scaleUp">
            <div>
              <span className="text-[10px] text-gray-300 font-mono block leading-none mb-1">UNIT RETAIL PRICE</span>
              <span className="font-sans font-black text-2xl tracking-tight text-white block leading-none">
                KES {currentPrice.toLocaleString()}
              </span>
            </div>

            <div className="text-right shrink-0">
              {isOutOfStock ? (
                <div className="bg-white/5 text-gray-300 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                  OUT OF STOCK
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-gray-300 font-mono block mb-1">WAREHOUSE STOCK</span>
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border inline-block leading-none ${
                    isLowStock 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20 animate-pulse"
                  }`}>
                    {isLowStock ? `Hurry, only ${currentStock} left!` : `${currentStock} items available`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantitative stock limits status indicator */}

          {/* Quantity custom count and Add-to-bag section */}
          {!isOutOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-white/30 tracking-wider">
                  QTY:
                </span>
                
                <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-[#0F0F0F]">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 text-white/60 hover:bg-white/[0.04] font-bold transition-colors cursor-pointer border-r border-white/10 text-sm"
                  >
                    -
                  </button>
                  <span className="px-5 py-2 font-mono text-xs font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    className="px-3 py-2 text-white/60 hover:bg-white/[0.04] font-bold transition-colors cursor-pointer border-l border-white/10 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToBag}
                  className="flex-1 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold px-6 py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <span>Secure Checkout Item</span>
                </button>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={`px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                      wishlist.includes(product.id)
                        ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/40"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                    title={wishlist.includes(product.id) ? "Saved to wishlist" : "Save product to view later"}
                  >
                    <Bookmark className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-current text-[#C5A059]" : "text-white"}`} />
                    <span>{wishlist.includes(product.id) ? "Saved" : "Save Later"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `Check out ${product.name} (KES ${product.price.toLocaleString()}) at Tech Gadgets Kenya!`;
                      const shareUrl = `${window.location.origin}/?product=${product.id}`;
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: shareText,
                          url: shareUrl,
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
                        alert("Product details copied to system clipboard!");
                      }
                    }}
                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    title="Share product details"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Share</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Check out this premium gadget on Tech Gadgets Kenya: *${product.name}* (${product.brand} - ${product.category})!\n\n💰 Price: KES ${product.price.toLocaleString()}\n📦 Stock: ${product.stock} units available\n\nTake a look here: ${window.location.origin}/?product=${product.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all focus:outline-hidden"
                    title="Share directly via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Paystack Info badge */}
          <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-4 flex items-start gap-3">
            <span className="p-1 px-2 border border-[#C5A059]/30 bg-white/[0.04] rounded-md text-[10px] font-mono font-bold shrink-0 text-[#C5A059] mt-0.5">
              PAYSTACK
            </span>
            <p className="text-[11px] text-[#C5A059] leading-normal font-sans">
              Instant checkouts are powered by secure live Paystack authorization. Authenticate to sync invoices within 5 seconds of confirmation.
            </p>
          </div>

          {/* Dynamic Price Drop Alert Panel */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-white">
              <span className="p-1.5 rounded-lg bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/10">
                <Bell className="w-4 h-4 text-[#C5A059]" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-white">Set Price Drop Alert</h4>
                <p className="text-[10px] text-white/50 leading-none mt-1">Get instant updates if the price drops below your target</p>
              </div>
            </div>

            {priceAlertSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold font-sans">✓ Price Alert Activated!</p>
                <p className="text-white/60 text-[10px]">We will notify your WhatsApp at <strong>{priceAlertWhatsapp}</strong> when the price of this gadget drops to KES {Number(priceAlertTarget).toLocaleString()} or lower.</p>
              </div>
            ) : (
              <form onSubmit={handlePriceAlertSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-white/40 uppercase mb-1">
                      WHATSAPP NUMBER
                    </label>
                    <input
                      type="text"
                      required
                      value={priceAlertWhatsapp}
                      onChange={(e) => setPriceAlertWhatsapp(e.target.value)}
                      placeholder="e.g. +254700000000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#C5A059] text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-white/40 uppercase mb-1">
                      TARGET PRICE (KES)
                    </label>
                    <input
                      type="number"
                      required
                      max={product.price - 1}
                      min={1}
                      value={priceAlertTarget}
                      onChange={(e) => setPriceAlertTarget(e.target.value)}
                      placeholder={`e.g. ${(product.price - 5000).toLocaleString()}`}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-[#C5A059] text-white font-mono font-bold text-[#C5A059]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] font-sans font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Submit Price Alert Request</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* Structured Technical Specifications Block */}
      <section className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 mb-12">
        <h2 className="font-sans font-semibold text-lg sm:text-xl tracking-tight text-white mb-6 pb-3 border-b border-white/10">
          Technical Specifications
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(product.specifications || {}).map(([key, val]) => (
            <div key={key} className="flex border-b border-white/5 pb-2 text-xs">
              <span className="font-mono font-bold text-white/70 w-1/3 truncate uppercase tracking-wider shrink-0 mr-4">
                {key}
              </span>
              <span className="font-mono text-white flex-1 break-words font-medium">
                {val}
              </span>
            </div>
          ))}

          {/* Default specs if object is sparse */}
          {(!product.specifications || Object.keys(product.specifications).length === 0) && (
            <p className="text-xs text-white/40 font-mono">Standard physical factory specifications apply.</p>
          )}
        </div>
      </section>

      {/* Interactive Bespoke Product FAQs Section */}
      <section className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 mb-12">
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
          <MessageCircle className="w-5 h-5 text-[#C5A059]" />
          <h2 className="font-sans font-semibold text-lg sm:text-xl tracking-tight text-white">
            Product FAQs & Ordering Policies
          </h2>
        </div>
        
        <div className="space-y-4">
          {[
            {
              q: `Is this ${product.name} brand new or refurbished?`,
              a: product.category.toLowerCase().includes("refurbed") || product.category.toLowerCase().includes("refurbished")
                ? `This is a certified Class-A Refurbished ${product.name} that has undergone strict 100-point diagnostic checks, repackaged in heavy cargo seals with original power modules.`
                : `This is a 100% brand-new, factory-sealed ${product.name} sourced directly from the original manufacturer's regional distribution hubs under certified seals.`
            },
            {
              q: "How long does shipping take within Nairobi and national counties?",
              a: "Local Nairobi deliveries are fulfilled via Waiyaki Way-based courier riders within 2 hours. Deliveries outside Nairobi (Mombasa, Kisumu, Eldoret, Nakuru) are dispatched overnight via secure courier services (G4S / Wells Fargo) for next-morning delivery."
            },
            {
              q: "Can I pay using online card or mobile money on delivery?",
              a: "To secure premium transport logs, high-value gadgets require transaction validation first. We support Paystack transactions which authorize instantly. Physical cash handling is restricted for dispatch protection."
            },
            {
              q: `How do I claim the 12-month manufacturer warranty for this ${product.brand} item?`,
              a: `All ${product.brand} devices carry an official local 12-month warranty from authorized Kenyan brand service hubs. Your order's digital receipt code can be presented instantly to receive free repair, diagnostics, or replacements.`
            }
          ].map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-white font-sans text-sm font-semibold select-none cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#C5A059] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                  )}
                </button>
                
                <div 
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isExpanded ? "max-h-50 border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 py-4 text-xs text-white/70 leading-relaxed font-sans bg-white/[0.005]">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Verified Reviews & Interactive Submission Section */}
      <section className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 mb-12" id="client-reviews-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          
          {/* Left Column: List Reviews (8 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="font-sans font-semibold text-lg sm:text-xl tracking-tight text-white pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Client Feedback Matrix</span>
              <span className="text-xs text-white/40 font-mono font-medium uppercase tracking-wider">{displayedReviews.length} Verified Logs</span>
            </h3>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2" id="reviews-list-hull">
              {displayedReviews.map((rev, i) => (
                <div key={i} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-sans font-semibold text-sm text-white leading-none">{rev.name}</h4>
                      <span className="font-mono text-[9px] text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-md border border-[#C5A059]/20 mt-1.5 inline-block uppercase tracking-wider">
                        {rev.location} • Secure Purchaser
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} className={`w-3 h-3 ${idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-white/10"}`} />
                        ))}
                      </div>
                      <span className="font-mono text-[9px] text-white/30 mt-1 block">{rev.date}</span>
                    </div>
                  </div>
                  <p className="text-white/70 text-xs mt-3 leading-relaxed">
                    {rev.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Write a Review Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white/[0.01] border border-white/5 p-6 rounded-2xl self-start">
            <h3 className="font-sans font-semibold text-base text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Submit Hardware Rating</span>
            </h3>

            {!user ? (
              <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 text-[#C5A059] p-4 rounded-xl text-xs space-y-2 mt-4" id="review-signin-notice">
                <p className="font-bold">🔒 Member Authorization Required</p>
                <p className="text-white/60">Please sign in utilizing your Google Account in the navigation header to log reviews and ratings for this electronics product.</p>
              </div>
            ) : reviewSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-1 my-4">
                <p className="font-bold">✓ Feedback Logged Successfully!</p>
                <p className="text-white/60">Your review and star ratings have been compiled. Thank you for rating Tech Gadgets Kenya.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase mb-1">
                    CLIENT NAME
                  </label>
                  <input
                    type="text"
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="e.g. Dennis Omwenga"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C5A059] text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase mb-1">
                    PRODUCT RATING
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRevRating(star)}
                        className="text-amber-400 focus:outline-hidden hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title={`${star} Stars`}
                      >
                        <Star className={`w-6 h-6 ${star <= revRating ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase mb-1">
                    DETAILED COMMENTS
                  </label>
                  <textarea
                    required
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Provide authentic details of configuration speed, heat dispersal, packaging quality at delivery point, etc."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-hidden focus:border-[#C5A059] text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:opacity-50 text-black font-sans font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {submittingReview ? "Submitting review..." : "Log Client Review"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Related items shelf */}
      {relatedItems.length > 0 && (
        <section className="mb-12">
          <h2 className="font-sans font-semibold text-lg sm:text-xl tracking-tight text-white mb-6">
            Similar Related Items
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedProductId(item.id);
                  setQuantity(1); // Reset
                  window.scrollTo(0, 0);
                }}
                className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden p-4 cursor-pointer hover:border-[#C5A059]/55 transition-all flex gap-4 items-center group shadow-md"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1A1A1A] shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform group-hover:scale-102"
                  />
                </div>
                
                <div className="min-w-0 font-sans">
                  <span className="font-mono text-[9px] text-[#C5A059] font-bold block">{item.brand}</span>
                  <h3 className="text-xs text-white truncate mt-0.5 group-hover:text-[#C5A059] transition-colors font-medium">
                    {item.name}
                  </h3>
                  <span className="font-extrabold text-xs text-white block mt-1">
                    KES {item.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
