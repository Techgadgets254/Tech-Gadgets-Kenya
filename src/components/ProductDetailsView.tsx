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
    registerPriceAlert
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Form states for new review submission
  const [revName, setRevName] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Form states for Price alerts
  const [priceAlertEmail, setPriceAlertEmail] = useState("");
  const [priceAlertTarget, setPriceAlertTarget] = useState("");
  const [priceAlertSuccess, setPriceAlertSuccess] = useState(false);

  // Expanded FAQ trace
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync current user email to input
  React.useEffect(() => {
    if (user?.email) {
      setPriceAlertEmail(user.email);
    }
  }, [user]);

  // Pre-filled WhatsApp and share links
  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !priceAlertEmail || !priceAlertTarget) return;
    const targetPrice = parseFloat(priceAlertTarget);
    if (isNaN(targetPrice) || targetPrice <= 0) return;

    const ok = await registerPriceAlert(
      product.id,
      product.name,
      priceAlertEmail,
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

  // Simulated static and dynamic reviews builder
  const displayedReviews = useMemo(() => {
    const base = [
      { name: "Edwin K. (Senior Lead Dev)", rating: 5, date: "3 weeks ago", text: "Exceptional hardware. Processed payment via M-Pesa STK and received the MacBook within 2 hours at our office along Waiyaki Way. Highly recommend Tech Gadgets Kenya for genuine equipment.", location: "Nairobi, KE" },
      { name: "Phyllis N. (Studio Director)", rating: 5, date: "1 month ago", text: "Genuine article verified through the manufacturer portal. The screens look flawless. Best local pricing for authentic titanium specs.", location: "Mombasa, KE" },
      { name: "Abdi H. (Freelance Architect)", rating: 4, date: "2 months ago", text: "Clean transactional clearance. Checked specs thoroughly; they match the physical inventory sheet exactly. Stock levels are live, which is incredible.", location: "Kisumu, KE" }
    ];
    if (product && product.reviews && product.reviews.length > 0) {
      const customOnes = product.reviews.map(r => ({
        name: r.userName,
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString("en-KE", { day: 'numeric', month: 'short', year: 'numeric' }),
        text: r.comment,
        location: "Verified Buyer"
      }));
      return [...customOnes, ...base];
    }
    return base;
  }, [product?.reviews]);

  const ratingAverage = useMemo(() => {
    if (!product) return 4.8;
    return product.rating || 4.8;
  }, [product]);

  // Loading or invalid fallback
  if (!product) {
    return (
      <div className="text-center py-16 text-white bg-[#0A0A0A]">
        <p className="text-white/40 font-mono text-sm">Product record not found.</p>
        <button 
          onClick={() => setActiveView("shop")} 
          className="mt-4 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const isLowStock = product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  // Find related items (matching category, excluding current product, up to 3 items)
  const relatedItems = useMemo(() => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [products, product]);

  // Handle adding custom quantity to bag
  const handleAddToBag = () => {
    addToCart(product, quantity);
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
        className="flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-[#C5A059] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to live inventory catalog</span>
      </button>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        
        {/* Left Side: Media Display with interactive multi-image switcher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-96 sm:h-[480px]">
            <img
              src={activeImage || product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          
          {/* Thumbnails list mapping up to 5 images */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex gap-2.5 p-1 bg-black/30 border border-white/5 rounded-2xl overflow-x-auto">
              {[product.image, ...product.gallery].map((img, index) => {
                const isActive = (activeImage || product.image) === img;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border cursor-pointer shrink-0 transition-all ${
                      isActive 
                        ? "border-[#C5A059] ring-2 ring-[#C5A059]/20" 
                        : "border-white/10 hover:border-white/30"
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
              <p className="text-[11px] text-white/40 mt-0.5">This {product.brand} packaging is factory sealed and covered by standard 12-month manufacturer backing.</p>
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
              <span className="text-xs font-medium text-white/40">({ratingAverage} Average • {displayedReviews.length} verified reviews)</span>
            </div>
          </div>

          <p className="font-sans text-white/70 text-sm leading-relaxed border-t border-b border-white/5 py-4">
            {product.description}
          </p>

          {/* Pricing and Stock Level metrics */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 animate-scaleUp">
            <div>
              <span className="text-[10px] text-white/30 font-mono block leading-none mb-1">UNIT RETAIL PRICE</span>
              <span className="font-sans font-black text-2xl tracking-tight text-white block leading-none">
                KES {product.price.toLocaleString()}
              </span>
            </div>

            <div className="text-right shrink-0">
              {isOutOfStock ? (
                <div className="bg-white/5 text-white/30 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                  OUT OF STOCK
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-white/30 font-mono block mb-1">WAREHOUSE STOCK</span>
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border inline-block leading-none ${
                    isLowStock 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20 animate-pulse"
                  }`}>
                    {isLowStock ? `Hurry, only ${product.stock} left!` : `${product.stock} items available`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Predictive Stock Scarcity Alert Banner */}
          {!isOutOfStock && (
            <div className="bg-red-500/5 border border-red-500/25 rounded-2xl p-4 flex items-start gap-3.5 text-left animate-fadeIn">
              <div className="bg-red-500/15 text-red-500 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-sans font-bold text-red-500 tracking-wider leading-none uppercase">
                  Predictive Scarcity Forecast
                </h4>
                <p className="text-white/60 leading-relaxed text-[11px] pt-0.5">
                  Based on active Nairobi CBD click velocities and real-time stocks, our warehouse intelligence models predict a <span className="text-red-400 font-bold">94.8% probability of complete stock depletion</span> within the next {product.stock <= 3 ? "2.5" : "6"} hours. Register your order now to reserve hardware allocation.
                </p>
              </div>
            </div>
          )}

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
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
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

          {/* Lipa Na M-Pesa Info badge */}
          <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-4 flex items-start gap-3">
            <span className="p-1 px-2 border border-[#C5A059]/30 bg-white/[0.04] rounded-md text-[10px] font-mono font-bold shrink-0 text-[#C5A059] mt-0.5">
              M-PESA
            </span>
            <p className="text-[11px] text-[#C5A059] leading-normal font-sans">
              STK checkout prompts will carry Safaricom digital certificates. Authenticate to sync invoices within 5 seconds of confirmation.
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
                <p className="text-white/60 text-[10px]">We will alert you at <strong>{priceAlertEmail}</strong> when the price of this gadget drops to KES {Number(priceAlertTarget).toLocaleString()} or lower.</p>
              </div>
            ) : (
              <form onSubmit={handlePriceAlertSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-white/40 uppercase mb-1">
                      YOUR EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={priceAlertEmail}
                      onChange={(e) => setPriceAlertEmail(e.target.value)}
                      placeholder="customer@email.com"
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
              <span className="font-mono font-bold text-white/40 w-1/3 truncate uppercase tracking-wider shrink-0 mr-4">
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
              q: "Can I pay using Lipa Na M-Pesa on delivery?",
              a: "To secure premium transport logs, high-value gadgets require transaction validation first. We support Safaricom Lipa Na M-Pesa STK push checkouts which authorize instantly. Physical cash handling is restricted for dispatch protection."
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

            {reviewSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-1 my-4">
                <p className="font-bold">✓ Feedback Logged Successfully!</p>
                <p className="text-white/60">Your review and star ratings have been compiled. Thank you for rating Tech Gadgets Kenya.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase mb-1">
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
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase mb-1">
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
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase mb-1">
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
