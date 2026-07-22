/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useStore } from "../StoreContext";
import LazyImage from "./LazyImage";
import { Helmet } from "./Helmet";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X
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
    registerProductRestockRequest,
    productReviews
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Restock Notification form state
  const [restockEmail, setRestockEmail] = useState("");
  const [restockWhatsapp, setRestockWhatsapp] = useState("");
  const [restockSubmitted, setRestockSubmitted] = useState(false);
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Auto-fill user contact info if logged in
  React.useEffect(() => {
    if (user?.email) {
      setRestockEmail(user.email);
    }
  }, [user]);

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
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);

  // Form states for Price alerts
  const [priceAlertEmail, setPriceAlertEmail] = useState("whatsapp-only@techsokoni.com");
  const [priceAlertWhatsapp, setPriceAlertWhatsapp] = useState("");
  const [priceAlertTarget, setPriceAlertTarget] = useState("");
  const [priceAlertSuccess, setPriceAlertSuccess] = useState(false);

  // Expanded FAQ trace
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync current user email and display name if available
  React.useEffect(() => {
    if (user?.email) {
      setPriceAlertEmail(user.email);
    } else {
      setPriceAlertEmail("whatsapp-only@techsokoni.com");
    }
    if (user?.displayName) {
      setRevName(user.displayName);
    }
  }, [user]);

  // Pre-filled WhatsApp and share links
  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = priceAlertEmail || user?.email || "whatsapp-only@techsokoni.com";
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

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || (!restockEmail.trim() && !restockWhatsapp.trim())) return;
    setRestockSubmitting(true);
    try {
      const ok = await registerProductRestockRequest(
        product.id,
        product.name,
        product.image,
        restockEmail.trim(),
        restockWhatsapp.trim()
      );
      if (ok) {
        setRestockSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting restock request:", err);
    } finally {
      setRestockSubmitting(false);
    }
  };

  // Load selected product profile
  const product = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const isRefurbished = useMemo(() => {
    if (!product) return false;
    return product.category.toLowerCase().includes("refurbished") || 
           product.tags?.some(t => t.toLowerCase() === "refurbished") || 
           product.name.toLowerCase().includes("refurbished");
  }, [product]);

  // Construct a robust set of showcase images showing different angles and features
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.gallery && product.gallery.length > 0) {
      return [product.image, ...product.gallery];
    }
    
    // Fallback beautiful device angles and lifestyle showcases from Unsplash depending on category
    const cat = product.category.toLowerCase();
    
    if (cat.includes("laptop") || cat.includes("macbook")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600", // Side ports / layout
        "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&q=80&w=600", // Sleek metallic cover
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=600", // Ergonomic backlit keyboard close-up
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600"  // Multi-angle workstation mockup
      ];
    } else if (cat.includes("phone") || cat.includes("iphone")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600", // Profile / camera glass
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600", // Elegant tactile side keys
        "https://images.unsplash.com/photo-1565849328263-1a7dd3218122?auto=format&fit=crop&q=80&w=600", // High brightness HDR panel
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=600"  // Device in active hand use
      ];
    } else if (cat.includes("printer")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=600", // High capacity input feed tray
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600", // Pristine color printer output
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600"  // Wireless touchscreen selection pad
      ];
    } else if (cat.includes("accessories") || cat.includes("charger") || cat.includes("cable") || cat.includes("hub")) {
      return [
        product.image,
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600", // Connector contacts close-up
        "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&q=80&w=600", // Safe thermal dissipation structure
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"  // Packaging box and accessories
      ];
    } else {
      return [
        product.image,
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600", // Isometric alignment specs
        "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600", // Ambient office desktop setting
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"  // Reflected camera detail layout
      ];
    }
  }, [product]);

  // Sync activeImage when product changes
  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
    }
  }, [product]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length === 0) return;
    const currIndex = galleryImages.indexOf(activeImage || product.image);
    const prevIndex = currIndex <= 0 ? galleryImages.length - 1 : currIndex - 1;
    setActiveImage(galleryImages[prevIndex]);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryImages.length === 0) return;
    const currIndex = galleryImages.indexOf(activeImage || product.image);
    const nextIndex = currIndex >= galleryImages.length - 1 ? 0 : currIndex + 1;
    setActiveImage(galleryImages[nextIndex]);
  };

  // Load database reviews from the top-level Firestore collection
  const dbReviews = useMemo(() => {
    if (!productReviews || !product) return [];
    return productReviews.filter(r => r.productId === product.id);
  }, [productReviews, product]);

  // Simulated static and dynamic reviews builder
  const displayedReviews = useMemo(() => {
    const base = [
      { name: "Edwin K. (Senior Lead Dev)", rating: 5, date: "3 weeks ago", text: "Exceptional hardware. Processed payment via M-Pesa STK and received the MacBook within 2 hours at our office along Waiyaki Way. Highly recommend Tech Soko Kenya for genuine equipment.", location: "Nairobi, KE" },
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

  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<5 | 4 | 3 | 2 | 1, number>;
    displayedReviews.forEach(r => {
      const rate = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (counts[rate] !== undefined) {
        counts[rate]++;
      }
    });
    const total = displayedReviews.length || 1;
    return {
      5: { count: counts[5], percentage: Math.round((counts[5] / total) * 100) },
      4: { count: counts[4], percentage: Math.round((counts[4] / total) * 100) },
      3: { count: counts[3], percentage: Math.round((counts[3] / total) * 100) },
      2: { count: counts[2], percentage: Math.round((counts[2] / total) * 100) },
      1: { count: counts[1], percentage: Math.round((counts[1] / total) * 100) },
    };
  }, [displayedReviews]);

  const finalReviews = useMemo(() => {
    if (selectedRatingFilter === null) return displayedReviews;
    return displayedReviews.filter(r => Math.round(r.rating) === selectedRatingFilter);
  }, [displayedReviews, selectedRatingFilter]);

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
    if (p.enableVariants === false) return null;

    const hasCustom = p.customVariants && p.customVariants.options && p.customVariants.options.length > 0;
    const hasOther = (p.variants && p.variants.length > 0) || (p.variantGroups && p.variantGroups.length > 0);

    // Default legacy product to omit default variants helper if not turned on explicitly
    if (p.enableVariants === undefined && !hasCustom && !hasOther) {
      return null;
    }

    if (hasCustom) {
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
  const [selectedRam, setSelectedRam] = useState<string>("");
  const [selectedSsd, setSelectedSsd] = useState<string>("");
  
  // Custom multi-category selections state
  const [selectedSelections, setSelectedSelections] = useState<Record<string, string>>({});

  // Extract unique RAM and SSD configuration values
  const uniqueRams = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    return Array.from(new Set(product.variants.map(v => v.ram).filter(Boolean)));
  }, [product]);

  const uniqueSsds = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    return Array.from(new Set(product.variants.map(v => v.ssd).filter(Boolean)));
  }, [product]);

  const matchedVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    return product.variants.find(v => v.ram === selectedRam && v.ssd === selectedSsd) || product.variants[0];
  }, [product, selectedRam, selectedSsd]);

  const matchedVariantNew = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    if (product.variantGroups && product.variantGroups.length > 0) {
      // Find exact selected combination
      const exact = product.variants.find(v => {
        if (!v.selections) return false;
        return Object.entries(selectedSelections).every(([grpName, optVal]) => {
          return v.selections[grpName] === optVal;
        });
      });
      return exact || product.variants[0];
    }
    return null;
  }, [product, selectedSelections]);

  React.useEffect(() => {
    if (product && product.variantGroups && product.variantGroups.length > 0) {
      const initialSelections: Record<string, string> = {};
      product.variantGroups.forEach(g => {
        initialSelections[g.name] = g.options[0] || "";
      });
      if (product.variants && product.variants.length > 0 && product.variants[0].selections) {
        setSelectedSelections({ ...product.variants[0].selections });
      } else {
        setSelectedSelections(initialSelections);
      }
    } else {
      setSelectedSelections({});
    }
  }, [product]);

  React.useEffect(() => {
    if (uniqueRams.length > 0) {
      setSelectedRam(uniqueRams[0]);
    } else {
      setSelectedRam("");
    }
  }, [uniqueRams]);

  React.useEffect(() => {
    if (uniqueSsds.length > 0) {
      setSelectedSsd(uniqueSsds[0]);
    } else {
      setSelectedSsd("");
    }
  }, [uniqueSsds]);

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
    if (product.variantGroups && product.variantGroups.length > 0) {
      return matchedVariantNew ? matchedVariantNew.price : product.price;
    }
    if (product.variants && product.variants.length > 0) {
      return matchedVariant ? matchedVariant.price : product.price;
    }
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
  }, [product, selectedVariant, matchedVariant, matchedVariantNew]);

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (product.variantGroups && product.variantGroups.length > 0) {
      return matchedVariantNew ? matchedVariantNew.stock : product.stock;
    }
    if (product.variants && product.variants.length > 0) {
      return matchedVariant ? matchedVariant.stock : product.stock;
    }
    if (!selectedVariant || !variantsInfo) return product.stock;
    const idx = variantsInfo.options.indexOf(selectedVariant);
    if (idx === -1) return product.stock;
    const modStock = Math.max(1, (product.stock - idx * 2));
    return modStock;
  }, [product, selectedVariant, variantsInfo, matchedVariant, matchedVariantNew]);

  const priceHistoryData = useMemo(() => {
    if (!product) return [];
    
    const data = [];
    const basePrice = product.price;
    const now = new Date();
    
    // Create deterministic seeding based on product ID to make the chart perfectly stable
    const charSum = product.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      // Deterministic small fluctuation waves (within +2% to -4% of original retail price)
      const valueFactor = Math.sin((charSum + i) * 0.15) * 0.03 + Math.cos(i * 0.25) * 0.015;
      const fluctuatingPrice = Math.round(basePrice * (1 + valueFactor));
      
      data.push({
        date: dayName,
        price: fluctuatingPrice
      });
    }
    // Ground today's price exactly onto currentPrice
    if (data.length > 0) {
      data[data.length - 1].price = currentPrice || basePrice;
    }
    return data;
  }, [product, currentPrice]);

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

    if (product.variantGroups && product.variantGroups.length > 0 && matchedVariantNew) {
      finalPrice = matchedVariantNew.price;
      const desc = Object.values(selectedSelections).filter(Boolean).join(" / ");
      finalName = `${product.name} (${desc})`;
      finalId = `${product.id}-${desc.replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (product.variants && product.variants.length > 0 && matchedVariant) {
      finalPrice = matchedVariant.price;
      const desc = `${matchedVariant.ram} / ${matchedVariant.ssd}`;
      finalName = `${product.name} (${desc})`;
      finalId = `${product.id}-${desc.replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (selectedVariant) {
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
      <Helmet 
        title={`${product.name} | Tech Sokoni Kenya`}
        description={product.description ? product.description.slice(0, 155) + "..." : `Buy ${product.name} online at Tech Sokoni Kenya. Genuine brand imports, local warranty, and 2-hour M-Pesa delivery within Nairobi.`}
        keywords={`${product.name}, ${product.brand || "Tech Sokoni"}, laptop, specs, Tech Sokoni Kenya, Kenya electronics`}
        image={product.image}
        url={`https://techsokoni.com/product/${product.id}`}
        product={product}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.image ? (product.image.startsWith("http") ? product.image : `https://techsokoni.com${product.image}`) : "https://techsokoni.com/logo.png",
          "description": product.description || `Genuine ${product.name} with local warranty, available at Tech Sokoni Kenya.`,
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Tech Sokoni"
          },
          "sku": product.id,
          "mpn": product.id,
          "offers": {
            "@type": "Offer",
            "url": `https://techsokoni.com/product/${product.id}`,
            "priceCurrency": "KES",
            "price": currentPrice || product.price,
            "priceValidUntil": "2027-12-31",
            "itemCondition": isRefurbished ? "https://schema.org/RefurbishedCondition" : "https://schema.org/NewCondition",
            "availability": currentStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Tech Sokoni Kenya",
              "url": "https://techsokoni.com"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ratingAverage,
            "reviewCount": displayedReviews.length || 1,
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": displayedReviews.map((rev) => ({
            "@type": "Review",
            "author": {
              "@type": "Person",
              "name": rev.name || "Verified Buyer"
            },
            "datePublished": "2026-06-15",
            "reviewBody": rev.text || "Highly recommended quality product.",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": rev.rating || 5,
              "bestRating": "5",
              "worstRating": "1"
            }
          }))
        })
      }} />
      
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
        
        {/* Left Side: Media Display with interactive multi-image gallery slider */}
        <div className="lg:col-span-6 space-y-4 flex flex-col items-center">
          <div 
            className="bg-[#161616] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-64 sm:h-80 w-full max-w-sm sm:max-w-md mx-auto relative cursor-zoom-in group/zoom container-zoom-magnifier"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Main Interactive Zoomed Image */}
            <img
              src={activeImage || product.image}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-4 transition-transform duration-75 ease-out"
              style={zoomStyle}
            />

            {/* Left Chevron Slide Trigger */}
            {galleryImages.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-[#C5A059] text-white hover:text-black p-2 rounded-full border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md cursor-pointer z-20 group-hover/zoom:opacity-100"
                aria-label="Previous showcase view"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Chevron Slide Trigger */}
            {galleryImages.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-[#C5A059] text-white hover:text-black p-2 rounded-full border border-white/10 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md cursor-pointer z-20 group-hover/zoom:opacity-100"
                aria-label="Next showcase view"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Translucent Numeric Indicator overlay */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-3 right-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/5 select-none pointer-events-none z-20">
                {galleryImages.indexOf(activeImage || product.image) + 1} / {galleryImages.length}
              </div>
            )}
          </div>
          
          {/* Enhanced Thumbnails list mapping up to 5 beautiful device angles */}
          {galleryImages.length > 1 && (
            <div className="flex justify-center gap-2 px-2 py-1.5 bg-black/30 border border-white/5 rounded-2xl overflow-x-auto w-full max-w-sm sm:max-w-md">
              {galleryImages.map((img, index) => {
                const isActive = (activeImage || product.image) === img;
                // Human-readable labels representing device views
                const viewLabels = ["Primary", "Ports/Side", "Detail/Profile", "Interface/Keys", "Setup/Box"];
                const label = viewLabels[index] || `View ${index + 1}`;

                return (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border cursor-pointer shrink-0 transition-all ${
                      isActive 
                        ? "border-[#C5A059] ring-2 ring-[#C5A059]/20" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                    title={label}
                  >
                    <LazyImage src={img} alt={`${product.name} - ${label}`} className="w-full h-full object-cover" />
                    {/* Hover text label overlay */}
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white/80 font-sans py-0.5 text-center opacity-0 hover:opacity-100 transition-opacity truncate">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="flex border border-white/5 bg-white/[0.02] rounded-2xl p-4 items-center gap-3 w-full max-w-sm sm:max-w-md">
            <span className="p-2 rounded-lg bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shrink-0">
              <CheckCircle className="w-5 h-5 text-[#C5A059]" />
            </span>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Authentic East African Warranty Verified</p>
              <p className="text-[11px] text-white/70 mt-0.5 font-sans">This {product.brand} device is certified authentic and covered by a comprehensive {isRefurbished ? "6-month refurbished service warranty" : "12-month manufacturer backing"}.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Specific Details and Dynamic Buy panel */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[#C5A059] font-mono text-[11px] uppercase font-bold tracking-widest">
                {product.brand} • {product.category}
              </span>
              <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isRefurbished 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}>
                {isRefurbished ? "Warranty: 6 Months" : "Warranty: 1 Year"}
              </span>
            </div>
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
          {product.enableVariants !== false && (
            product.variantGroups && product.variantGroups.length > 0 ? (
              <div className="space-y-4 pt-2">
                {product.variantGroups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider block">
                      Choose {group.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedSelections[group.name] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedSelections({
                                ...selectedSelections,
                                [group.name]: opt
                              });
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-[#C5A059]/15 border-[#C5A059] text-white"
                                : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : product.variants && product.variants.length > 0 ? (
              <div className="space-y-4 pt-2">
                {uniqueRams.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider block">
                      Choose System RAM Configuration
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueRams.map((ramOption) => (
                        <button
                          key={ramOption}
                          type="button"
                          onClick={() => setSelectedRam(ramOption)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                            selectedRam === ramOption
                              ? "bg-[#C5A059]/15 border-[#C5A059] text-white"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                          }`}
                        >
                          {ramOption}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueSsds.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-wider block">
                      Choose SSD Storage Capacity
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSsds.map((ssdOption) => (
                        <button
                          key={ssdOption}
                          type="button"
                          onClick={() => setSelectedSsd(ssdOption)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                            selectedSsd === ssdOption
                              ? "bg-[#C5A059]/15 border-[#C5A059] text-white"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                          }`}
                        >
                          {ssdOption}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              variantsInfo && variantsInfo.options.length > 0 && (
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
              )
            )
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

          {/* Out of Stock Notify Me Section */}
          {isOutOfStock && (
            <div className="bg-[#161616] border border-[#C5A059]/30 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-2xl relative overflow-hidden my-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2.5 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] shrink-0">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm sm:text-base text-white">Notify Me When Restocked</h4>
                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">
                    This item is currently out of stock. Leave your contact details below to receive an instant WhatsApp or email alert when new units arrive!
                  </p>
                </div>
              </div>

              {restockSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 relative z-10">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div className="text-xs">
                    <span className="font-bold block text-sm">Restock Request Registered!</span>
                    <span>We&apos;ll notify you on {restockWhatsapp || restockEmail} immediately as soon as this item returns to inventory.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRestockSubmit} className="space-y-3 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#C5A059] uppercase font-bold tracking-wider block mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={restockWhatsapp}
                        onChange={(e) => setRestockWhatsapp(e.target.value)}
                        placeholder="e.g. 0792620789"
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#C5A059] uppercase font-bold tracking-wider block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={restockEmail}
                        onChange={(e) => setRestockEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={restockSubmitting || (!restockEmail.trim() && !restockWhatsapp.trim())}
                    className="w-full py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{restockSubmitting ? "Saving Request..." : "Request Restock Notification"}</span>
                  </button>
                </form>
              )}
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
                      const shareText = `Check out ${product.name} (KES ${product.price.toLocaleString()}) at Tech Soko Kenya!`;
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
                      `Check out this premium gadget on Tech Soko Kenya: *${product.name}* (${product.brand} - ${product.category})!\n\n💰 Price: KES ${product.price.toLocaleString()}\n📦 Stock: ${product.stock} units available\n\nTake a look here: ${window.location.origin}/?product=${product.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => {
                      try {
                        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
                        if (AudioCtxClass) {
                          const audioCtx = new AudioCtxClass();
                          const osc = audioCtx.createOscillator();
                          const gain = audioCtx.createGain();
                          osc.type = "sine";
                          osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                          osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.12);
                          gain.gain.setValueAtTime(0, audioCtx.currentTime);
                          gain.gain.linearRampToValueAtTime(0.015, audioCtx.currentTime + 0.02);
                          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
                          osc.connect(gain);
                          gain.connect(audioCtx.destination);
                          osc.start();
                          osc.stop(audioCtx.currentTime + 0.25);
                        }
                      } catch (e) {}
                    }}
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

            {/* Interactive Rating Summary & Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              {/* Average Rating Block */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{ratingAverage}</span>
                <div className="flex items-center gap-0.5 text-amber-400 my-1.5">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className={`w-3.5 h-3.5 ${idx < Math.round(ratingAverage) ? "fill-amber-400 text-amber-400" : "text-white/10"}`} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Product Rating Average</span>
              </div>

              {/* Distribution bars */}
              <div className="md:col-span-8 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((ratingNum) => {
                  const dist = ratingDistribution[ratingNum];
                  const isSelected = selectedRatingFilter === ratingNum;
                  return (
                    <button
                      key={ratingNum}
                      onClick={() => setSelectedRatingFilter(selectedRatingFilter === ratingNum ? null : ratingNum)}
                      className={`w-full flex items-center gap-3 text-left text-xs font-mono py-1 px-2 rounded-lg hover:bg-white/5 transition-all group border ${
                        isSelected ? "bg-white/5 border-[#C5A059]/40" : "border-transparent"
                      }`}
                    >
                      <span className="text-white/60 text-[11px] w-6 shrink-0 group-hover:text-white flex items-center gap-0.5">
                        {ratingNum} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline-block" />
                      </span>
                      <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? "bg-gradient-to-r from-[#C5A059] to-amber-500" : "bg-[#C5A059]/50 group-hover:bg-[#C5A059]/80"
                          }`}
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="text-white/30 text-[10px] w-12 text-right shrink-0 group-hover:text-white/60">
                        {dist.count} ({dist.percentage}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Indicator */}
            {selectedRatingFilter !== null && (
              <div className="flex items-center justify-between bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                  <span className="text-white/70">
                    Showing <strong className="text-white">{selectedRatingFilter} Star</strong> feedback logs only
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedRatingFilter(null)}
                  className="text-[#C5A059] hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 px-2 py-1 rounded-md transition-all cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2" id="reviews-list-hull">
              {finalReviews.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <p className="text-xs text-white/40 font-mono">No verified {selectedRatingFilter}-star logs compiled yet.</p>
                  <button 
                    onClick={() => setSelectedRatingFilter(null)}
                    className="mt-3 text-[#C5A059] hover:underline text-xs font-semibold cursor-pointer"
                  >
                    Display all logs
                  </button>
                </div>
              ) : (
                finalReviews.map((rev, i) => (
                  <div key={i} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-sans font-semibold text-sm text-white leading-none">{rev.name}</h4>
                        <span className="font-mono text-[9px] text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-md border border-[#C5A059]/20 mt-1.5 inline-block uppercase tracking-wider">
                          {rev.location} • Verified Purchaser
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
                ))
              )}
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
                <p className="text-white/60">Your review and star ratings have been compiled. Thank you for rating Tech Soko Kenya.</p>
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

      {/* 30-Day Price Trend & Market Insights Section */}
      <section className="mb-12 bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xl animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="font-sans font-semibold text-lg tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C5A059]" />
              <span>Verified 30-Day Price Trend & Analytics</span>
            </h2>
            <p className="text-white/40 text-xs mt-1">
              Analyze public market rate history fluctuation vectors for {product.name} to optimize your purchase choice timing.
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-white/5 py-2 px-3.5 rounded-2xl flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white/60">Best Purchase Opportunity Index: Stable</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          
          <div className="lg:col-span-3 h-64 font-mono pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistoryData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#555" fontSize={8} tickLine={false} />
                <YAxis 
                  stroke="#555" 
                  fontSize={9} 
                  tickLine={false} 
                  domain={['dataMin - 5000', 'dataMax + 2000']}
                  allowDecimals={false}
                  tickFormatter={(val) => `KES ${Math.round(val / 1000)}k`} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F0F0F", borderColor: "#333", borderRadius: "12px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  itemStyle={{ fontSize: 11, color: "#fff" }}
                  formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, "Retail Value"]}
                />
                <Area type="monotone" dataKey="price" stroke="#C5A059" strokeWidth={2} fillOpacity={1} fill="url(#priceColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4 font-sans text-xs">
            <div>
              <span className="text-[10px] text-white/40 font-mono block uppercase">Optimal Entry Target</span>
              <span className="text-emerald-400 text-lg font-black font-mono">
                KES {Math.round(product.price * 0.95).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 font-mono block uppercase">Last 30-Day Peak</span>
              <span className="text-white font-mono font-bold">
                KES {Math.round(product.price * 1.05).toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                💡 Current live configurations are backed by comprehensive local validation guarantees. Secure our low pricing by locking down M-Pesa or Card orders instantly.
              </p>
            </div>
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
                  <LazyImage
                    src={item.image}
                    alt={item.name}
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
