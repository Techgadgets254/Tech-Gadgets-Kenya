/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../StoreContext";
import Pagination from "./Pagination";
import LazyImage from "./LazyImage";
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Search, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  BookOpen,
  Heart,
  Scale,
  Star,
  Tag,
  Loader2,
  Minus,
  Plus,
  ArrowUp,
  X,
  History,
  Mic,
  MicOff,
  Flame
} from "lucide-react";
import { Product } from "../types";

const isCampaignOfferActive = (p: any) => {
  if (!p.flashPrice || !p.flashExpiry) return false;
  const now = new Date();
  const expiryDate = new Date(p.flashExpiry);
  if (now > expiryDate) return false;
  if (p.flashStart) {
    const startDate = new Date(p.flashStart);
    if (now < startDate) return false;
  }
  return true;
};

const isCampaignOfferUpcoming = (p: any) => {
  if (!p.flashPrice || !p.flashExpiry || !p.flashStart) return false;
  const now = new Date();
  const startDate = new Date(p.flashStart);
  return now < startDate;
};

interface FlashCountdownProps {
  expiry: string;
}

const FlashCountdown: React.FC<FlashCountdownProps> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiry) - +new Date();
      if (difference <= 0) {
        return "Expired";
      }

      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);

      return `${hrs}h ${mins}m ${secs}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiry]);

  return (
    <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-500/15">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
      {timeLeft}
    </span>
  );
};

function highlightText(text: string, highlight: string) {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  try {
    const cleanHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${cleanHighlight})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-[#C5A059]/40 text-white font-semibold rounded-xs px-0.5 border border-[#C5A059]/30">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (error) {
    return <span>{text}</span>;
  }
}

function normalizeBrandName(brand: string): string {
  if (!brand) return "Unknown";
  const b = brand.trim().toLowerCase();
  if (b === "hp") return "HP";
  if (b === "apple") return "Apple";
  if (b === "lenovo") return "Lenovo";
  if (b === "dell") return "Dell";
  if (b === "samsung") return "Samsung";
  if (b === "epson") return "Epson";
  if (b === "anker") return "Anker";
  if (b === "xiaomi") return "Xiaomi";
  if (b === "huawei") return "Huawei";
  if (b === "asus") return "Asus";
  if (b === "acer") return "Acer";
  return brand.trim().charAt(0).toUpperCase() + brand.trim().slice(1);
}

function ProductImageMagnifier({ src, alt }: { src: string; alt: string }) {
  const [coords, setCoords] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full overflow-hidden"
    >
      <motion.div
        animate={{
          scale: isHovered ? 1.4 : 1,
          transformOrigin: `${coords.x}% ${coords.y}%`
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
        className="w-full h-full"
      >
        <LazyImage
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Glass indicator overlay on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/15 pointer-events-none flex items-center justify-center animate-fadeIn">
          <div className="bg-black/60 text-white rounded-full p-2 border border-white/20 backdrop-blur-md shadow-lg scale-95 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Levenshtein Distance helper for spell-checking and spelling tolerance
function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j, al = a.length, bl = b.length, r;
  if (al === 0) return bl;
  if (bl === 0) return al;
  for (i = 0; i <= al; i++) tmp[i] = [i];
  for (j = 1; j <= bl; j++) tmp[0][j] = j;
  for (i = 1; i <= al; i++) {
    for (j = 1; j <= bl; j++) {
      r = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + r);
    }
  }
  return tmp[al][bl];
}

// Custom Fuzzy Search ranker that searches name, category, and technical specifications
function fuzzyMatchProducts(products: Product[], query: string): Product[] {
  const qClean = query.trim().toLowerCase();
  if (!qClean) return products;

  const queryWords = qClean.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return products;

  const scoredProducts = products.map(p => {
    let score = 0;
    const name = (p.name || "").toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    
    // Construct specifications search string to search technical specs as requested
    let specsStr = "";
    if (p.specifications) {
      specsStr = Object.entries(p.specifications)
        .map(([k, v]) => `${k} ${v}`)
        .join(" ")
        .toLowerCase();
    }

    queryWords.forEach(word => {
      // Direct substring matches
      if (name.includes(word)) {
        score += 50;
        if (name.startsWith(word)) score += 20; // Prefix bonus
      }
      if (brand.includes(word)) {
        score += 30;
      }
      if (category.includes(word)) {
        score += 40;
      }
      if (specsStr.includes(word)) {
        score += 45; // Technical specifications matching
      }
      if (desc.includes(word)) {
        score += 10;
      }

      // Typos and close spellings using Levenshtein distance
      const nameWords = name.split(/\s+/).filter(Boolean);
      nameWords.forEach(nw => {
        if (nw.length >= 3 && Math.abs(nw.length - word.length) <= 2) {
          const distance = getLevenshteinDistance(nw, word);
          if (distance <= 1) {
            score += 25; // 1-character typo
          } else if (distance === 2 && nw.length >= 5) {
            score += 10; // 2-character typo
          }
        }
      });
      
      const brandWords = brand.split(/\s+/).filter(Boolean);
      brandWords.forEach(bw => {
        if (bw.length >= 3 && Math.abs(bw.length - word.length) <= 1) {
          const distance = getLevenshteinDistance(bw, word);
          if (distance <= 1) {
            score += 20;
          }
        }
      });
    });

    return { product: p, score };
  });

  // Filter out products with 0 score (no matches), and sort descending by score
  return scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

export default function ShopView() {
  const { 
    products, 
    searchQuery, 
    setSearchQuery, 
    setSelectedProductId, 
    setActiveView,
    addToCart,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
    clearCompareList,
    productsLoading,
    hasMoreProducts,
    loadMoreProducts
  } = useStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 14
      }
    }
  };

  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<"All" | "New" | "Refurbished">("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [onlyShowWishlist, setOnlyShowWishlist] = useState<boolean>(false);
  const [gridDensity, setGridDensity] = useState<"comfortable" | "compact">("compact");
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Recent search history dropdown states & handlers
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToHistory = (query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 5);
      localStorage.setItem("tgk_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== item);
      localStorage.setItem("tgk_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("tgk_recent_searches");
  };

  // Voice Search Web Speech API state and handler
  const [isListening, setIsListening] = useState(false);
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onerror = (err: any) => {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        setSearchQuery(transcript);
        addToHistory(transcript);
      }
    };
    
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      addToHistory(searchQuery);
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset currentPage to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMainCategory, selectedCondition, selectedBrand, sortBy, onlyShowWishlist, minPrice, maxPrice]);

  // Quick Buy interactive modal configurations
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quickBuyRam, setQuickBuyRam] = useState<string>("");
  const [quickBuySsd, setQuickBuySsd] = useState<string>("");
  const [quickBuyQuantity, setQuickBuyQuantity] = useState<number>(1);

  // Expandable product cards state to reveal basic technical specifications directly in the grid
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const gridElement = document.getElementById("shop-view-grid");
      if (gridElement) {
        const gridRect = gridElement.getBoundingClientRect();
        // gridRect.top < -150 indicates that they have scrolled past the first row of products
        if (gridRect.top < -150) {
          setShowBackToTop(true);
        } else {
          setShowBackToTop(false);
        }
      } else {
        if (window.scrollY > 400) {
          setShowBackToTop(true);
        } else {
          setShowBackToTop(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const gridElement = document.getElementById("shop-view-grid");
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleExpandSpecs = (productId: string) => {
    setExpandedProductIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getProductVariants = (product: Product) => {
    if (product.enableVariants === false) return null;

    const hasCustom = product.customVariants && product.customVariants.options && product.customVariants.options.length > 0;
    const hasOther = (product.variants && product.variants.length > 0) || (product.variantGroups && product.variantGroups.length > 0);

    // Default legacy product to omit default variants helper if not turned on explicitly
    if (product.enableVariants === undefined && !hasCustom && !hasOther) {
      return null;
    }

    if (hasCustom) {
      return {
        label: product.customVariants.label || "Available Feature Options",
        options: product.customVariants.options.map(opt => {
          const offset = opt.price - product.price;
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

    const cat = product.category.toLowerCase();
    if (cat.includes("laptop")) {
      return {
        label: "RAM / System Performance Configuration",
        options: ["16GB Unified RAM | 512GB SSD", "32GB Unified RAM | 1TB SSD (+ KES 25,000)", "64GB Unified RAM | 2TB SSD (+ KES 60,000)"]
      };
    }
    if (cat.includes("phone")) {
      return {
        label: "Flash Storage Capacity Unit",
        options: ["12GB RAM | 128GB Storage", "12GB RAM | 256GB Storage (+ KES 12,500)", "16GB RAM | 512GB Storage (+ KES 28,000)"]
      };
    }
    if (cat.includes("printer")) {
      return {
        label: "Hardware Paper Feed Model",
        options: ["Standard Direct Workgroup Print", "Enterprise Network Duplex Feed (+ KES 8,500)"]
      };
    }
    if (cat.includes("desktop")) {
      return {
        label: "Graphics Card Processing Accelerator",
        options: ["NVIDIA RTX 4070 12GB G6X", "NVIDIA RTX 4095 VR-Ready Studio (+ KES 75,000)"]
      };
    }
    return {
      label: "Device Customization Bundle Option",
      options: ["Standard Retail Box Edition", "Extended Premium Care Warranty Bundle (+ KES 4,500)"]
    };
  };

  const matchedQuickBuyVariant = useMemo(() => {
    if (!quickBuyProduct || !quickBuyProduct.variants || quickBuyProduct.variants.length === 0) return null;
    return quickBuyProduct.variants.find(
      v => v.ram === quickBuyRam && v.ssd === quickBuySsd
    ) || quickBuyProduct.variants[0];
  }, [quickBuyProduct, quickBuyRam, quickBuySsd]);

  const uniqueQuickBuyRams = useMemo(() => {
    if (!quickBuyProduct || !quickBuyProduct.variants || quickBuyProduct.variants.length === 0) return [];
    return Array.from(new Set(quickBuyProduct.variants.map(v => v.ram).filter(Boolean)));
  }, [quickBuyProduct]);

  const uniqueQuickBuySsds = useMemo(() => {
    if (!quickBuyProduct || !quickBuyProduct.variants || quickBuyProduct.variants.length === 0) return [];
    return Array.from(new Set(quickBuyProduct.variants.map(v => v.ssd).filter(Boolean)));
  }, [quickBuyProduct]);

  useEffect(() => {
    if (quickBuyProduct) {
      if (quickBuyProduct.variants && quickBuyProduct.variants.length > 0) {
        const uniqueRams = Array.from(new Set(quickBuyProduct.variants.map(v => v.ram).filter(Boolean)));
        const uniqueSsds = Array.from(new Set(quickBuyProduct.variants.map(v => v.ssd).filter(Boolean)));
        setQuickBuyRam(uniqueRams[0] || "");
        setQuickBuySsd(uniqueSsds[0] || "");
      } else {
        const variantsInfo = getProductVariants(quickBuyProduct);
        const variants = variantsInfo ? variantsInfo.options : [];
        setSelectedVariant(variants[0] || "");
      }
      setQuickBuyQuantity(1);
    }
  }, [quickBuyProduct]);

  const handleQuickBuySubmit = () => {
    if (!quickBuyProduct) return;
    
    let finalPrice = quickBuyProduct.price;
    let finalName = quickBuyProduct.name;
    let finalId = quickBuyProduct.id;

    if (quickBuyProduct.variants && quickBuyProduct.variants.length > 0 && matchedQuickBuyVariant) {
      finalPrice = matchedQuickBuyVariant.price;
      const desc = `${matchedQuickBuyVariant.ram} / ${matchedQuickBuyVariant.ssd}`;
      finalName = `${quickBuyProduct.name} (${desc})`;
      finalId = `${quickBuyProduct.id}-${desc.replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else {
      const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
      const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
      if (priceMatch) {
        const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        finalPrice += premium;
      } else if (minusMatch) {
         const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
         finalPrice -= discount;
      }
      const cleanVariantName = selectedVariant.split(" (+")[0].split(" (-")[0];
      finalName = `${quickBuyProduct.name} (${cleanVariantName})`;
      finalId = `${quickBuyProduct.id}-${cleanVariantName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    const modifiedProduct = {
      ...quickBuyProduct,
      id: finalId,
      name: finalName,
      price: finalPrice
    };

    addToCart(modifiedProduct, quickBuyQuantity);
    setQuickBuyProduct(null);
    setActiveView("checkout");
  };

  // Helper mapping to extract core category name
  const getProductMainCategory = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes("laptop")) return "Laptops";
    if (catLower.includes("desktop") || catLower.includes("pc") || catLower.includes("all-in-one")) return "Desktops";
    if (catLower.includes("phone") || catLower.includes("mobile") || catLower.includes("tablet")) return "Phones";
    if (catLower.includes("printer") || catLower.includes("scanner") || catLower.includes("ink")) return "Printers";
    return "Accessories"; // Cables, chargers, adapters, bags, power, etc.
  };

  const getProductCondition = (p: Product) => {
    const catLower = p.category.toLowerCase();
    const nameLower = p.name.toLowerCase();
    const descLower = p.description.toLowerCase();
    if (catLower.includes("refurbished") || nameLower.includes("refurbished") || descLower.includes("refurbished") || nameLower.includes("refurbed")) {
      return "Refurbished";
    }
    return "New";
  };

  // Sync external search queries from home categories
  useEffect(() => {
    if (!searchQuery) return;
    const q = searchQuery.trim().toLowerCase();
    
    if (q === "new laptops") {
      setSelectedMainCategory("Laptops");
      setSelectedCondition("New");
      setSearchQuery("");
    } else if (q === "refurbished laptops") {
      setSelectedMainCategory("Laptops");
      setSelectedCondition("Refurbished");
      setSearchQuery("");
    } else if (q === "new phones") {
      setSelectedMainCategory("Phones");
      setSelectedCondition("New");
      setSearchQuery("");
    } else if (q === "refurbished phones") {
      setSelectedMainCategory("Phones");
      setSelectedCondition("Refurbished");
      setSearchQuery("");
    } else if (q === "new desktops" || q === "refurbished desktops" || q === "desktops") {
      setSelectedMainCategory("Desktops");
      if (q.includes("new")) setSelectedCondition("New");
      else if (q.includes("refurbished")) setSelectedCondition("Refurbished");
      else setSelectedCondition("All");
      setSearchQuery("");
    } else if (q === "printers") {
      setSelectedMainCategory("Printers");
      setSelectedCondition("All");
      setSearchQuery("");
    } else if (q === "accessories") {
      setSelectedMainCategory("Accessories");
      setSelectedCondition("All");
      setSearchQuery("");
    } else if (q === "all-in-one pcs") {
      setSelectedMainCategory("All-in-One PCs");
      setSelectedCondition("All");
      setSearchQuery("");
    }
  }, [searchQuery, setSearchQuery]);

  // Unified list of categories for main sidebar selection
  const mainCategoriesList = useMemo(() => {
    return ["All", "Laptops", "Desktops", "Phones", "Printers", "Accessories"];
  }, []);

  const brands = useMemo(() => {
    const matchingProducts = products.filter(p => 
      selectedMainCategory === "All" || getProductMainCategory(p.category) === selectedMainCategory
    );
    const list = new Set(matchingProducts.map(p => normalizeBrandName(p.brand)));
    return ["All", ...Array.from(list)];
  }, [products, selectedMainCategory]);

  // Reset filters
  const resetFilters = () => {
    setSelectedMainCategory("All");
    setSelectedCondition("All");
    setSelectedBrand("All");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setSearchQuery("");
    setOnlyShowWishlist(false);
  };

  // Filter & Sort Logic combined
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search Query matching (Fuzzy search matching name, brand, category, and specifications)
    if (searchQuery.trim() !== "") {
      result = fuzzyMatchProducts(result, searchQuery);
    }

    // Main Category Filter
    if (selectedMainCategory !== "All") {
      result = result.filter(p => getProductMainCategory(p.category) === selectedMainCategory);
    }

    // Condition Filter
    if (selectedCondition !== "All") {
      result = result.filter(p => getProductCondition(p) === selectedCondition);
    }

    // Brand Filter
    if (selectedBrand !== "All") {
      result = result.filter(p => normalizeBrandName(p.brand) === selectedBrand);
    }

    // Price Range Filter
    if (minPrice !== "") {
      result = result.filter(p => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter(p => Number(p.price) <= Number(maxPrice));
    }

    // Wishlist Filter
    if (onlyShowWishlist) {
      result = result.filter(p => wishlist.includes(p.id));
    }

    // Sorting Logic (Only sort if not using 'default' so that fuzzy matching score rank is preserved)
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const valA = (a as any).createdAt || (a as any).updatedAt || a.id || "";
        const valB = (b as any).createdAt || (b as any).updatedAt || b.id || "";
        return valB.localeCompare(valA);
      });
    } else if (sortBy === "name-az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-za") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [products, searchQuery, selectedMainCategory, selectedCondition, selectedBrand, minPrice, maxPrice, sortBy, onlyShowWishlist, wishlist]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div id="shop-view-grid" className="animate-fadeIn">
      
      {/* Search Indicator & Title */}
      <div className="mb-8">
        <h1 className="font-sans font-medium text-2xl sm:text-3xl tracking-tight text-white">
          Hardware Storefront
        </h1>
        <p className="text-white/50 text-xs sm:text-sm mt-1">
          Explore and filter our premium live inventory pool with prompt M-Pesa clearing.
        </p>

        {/* Persistent Search Input Field */}
        <div ref={searchContainerRef} className="mt-5 relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addToHistory(searchQuery);
                setIsSearchFocused(false);
              }
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specific products or brands (e.g., Apple, HP, Lenovo)..."
            className="block w-full pl-10 pr-20 py-3 bg-[#0F0F0F] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-sans shadow-inner"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 z-10">
            {/* Voice Search Button */}
            <button
              onClick={handleVoiceSearch}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20" 
                  : "text-white/40 hover:text-[#C5A059] hover:bg-white/5"
              }`}
              title={isListening ? "Listening... click to stop" : "Search with Voice"}
              type="button"
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Clear Search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Recent search dropdown menu */}
          <AnimatePresence>
            {isSearchFocused && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 mt-1.5 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 text-left"
              >
                <div className="flex items-center justify-between px-2 py-1 pb-1.5 border-b border-white/5">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-semibold">Recent Searches</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-[9px] font-mono text-[#C5A059] hover:text-white uppercase tracking-wider font-bold cursor-pointer hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                {recentSearches.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <History className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C5A059] shrink-0" />
                      <span className="text-xs text-white/70 group-hover:text-white truncate font-sans">{item}</span>
                    </div>
                    <button
                      onClick={(e) => removeFromHistory(e, item)}
                      className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                      title="Delete from history"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {searchQuery && (
          <div className="mt-3 flex items-center gap-2 bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 rounded-lg px-3 py-1.5 w-fit text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Showing results for: <strong>"{searchQuery}"</strong></span>
            <button onClick={() => setSearchQuery("")} className="font-bold underline ml-1 hover:text-[#C5A059]/80 cursor-pointer">Clear</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR FILTER PANEL */}
        <div id="sidebar-filters" className="space-y-6 lg:sticky lg:top-20 self-start">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <span className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
                Filter Catalog
              </span>
              <button 
                onClick={resetFilters} 
                className="text-[11px] font-semibold text-white/40 hover:text-[#C5A059] hover:bg-white/[0.04] px-2 py-1 rounded-md border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                title="Reset active filtering parameters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Wishlist Quick Toggle */}
            <div className="mb-5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <button
                onClick={() => setOnlyShowWishlist(!onlyShowWishlist)}
                className={`w-full flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  onlyShowWishlist 
                    ? "bg-[#C5A059] text-black" 
                    : "bg-white/[0.04] text-white/70 hover:bg-[#C5A059]/15 hover:text-[#C5A059]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Heart className={`w-3.5 h-3.5 ${onlyShowWishlist ? "fill-current" : ""}`} />
                  Saved Wishlist
                </span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  onlyShowWishlist ? "bg-black/20 text-black font-extrabold" : "bg-white/5 text-white/40"
                }`}>
                  {wishlist.length}
                </span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-5">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3">
                STOCK CATEGORIES
              </span>
              <div className="space-y-1.5">
                {mainCategoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedMainCategory(cat);
                      setSelectedBrand("All"); // Reset brand selection when category changes
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      selectedMainCategory === cat
                        ? "bg-[#C5A059]/10 text-[#C5A059] font-bold border-l-2 border-[#C5A059] pl-2.5"
                        : "text-white/60 hover:bg-white/[0.02] hover:text-white"
                    }`}
                  >
                    <span>{cat === "All" ? "All Electronics" : cat}</span>
                    <span className="font-mono text-[10px] bg-white/[0.04] text-white/40 px-1.5 py-0.5 rounded-md">
                      {cat === "All" 
                        ? products.length 
                        : products.filter(p => getProductMainCategory(p.category) === cat).length
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Condition + Extra Switch Button */}
            <div className="mb-5 border-t border-white/5 pt-5">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3 text-white/45">
                HARDWARE CONDITION
              </span>
              <div className="grid grid-cols-3 gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                {(["All", "New", "Refurbished"] as const).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={`text-[10px] font-mono py-2 rounded-lg font-bold cursor-pointer transition-all uppercase ${
                      selectedCondition === cond
                        ? "bg-[#C5A059] text-black shadow-md font-extrabold"
                        : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>

              {/* Extra Feature Switch Button */}
              <div className="mt-2.5">
                <button
                  onClick={() => {
                    setSelectedCondition(prev => prev === "New" ? "Refurbished" : "New");
                  }}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-[#C5A059]/30 rounded-xl py-2 px-3 text-[10.5px] font-mono transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                  title="Swap condition filter instantly"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#C5A059] group-hover:rotate-180 transition-transform duration-300" />
                  <span>Condition Quick-Switch ({selectedCondition === "New" ? "Refurbished" : "New"})</span>
                </button>
              </div>
            </div>

            {/* Brand Filter */}
            <div className="mb-5 border-t border-white/5 pt-5">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3">
                MANUFACTURER BRAND
              </span>
              <div className="space-y-1">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedBrand === brand
                        ? "bg-[#C5A059] text-black font-semibold"
                        : "text-white/50 hover:bg-white/[0.02] hover:text-white"
                    }`}
                  >
                    {brand === "All" ? "All Brands" : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-5 border-t border-white/5 pt-5">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3">
                PRICE RANGE (KES)
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-white/30">MIN</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white/[0.03] border border-white/10 text-xs py-2 pl-9 pr-2 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-mono h-[38px]"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-white/30">MAX</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="250k"
                    className="w-full bg-white/[0.03] border border-white/10 text-xs py-2 pl-9 pr-2 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-mono h-[38px]"
                  />
                </div>
              </div>
              {(minPrice !== "" || maxPrice !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="mt-2 text-[10px] font-mono text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Clear Price Filter
                </button>
              )}
            </div>

            {/* Sorting Filter Selector */}
            <div className="border-t border-white/5 pt-5">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3 font-medium animate-pulse">
                SORT PRODUCTS
              </span>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 text-xs py-2 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-[#E0E0E0] font-sans cursor-pointer appearance-none"
                >
                  <option value="default" className="bg-[#0F0F0F] text-white">Default Sort</option>
                  <option value="price-low" className="bg-[#0F0F0F] text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-[#0F0F0F] text-white">Price: High to Low</option>
                  <option value="newest" className="bg-[#0F0F0F] text-white">Newest Arrivals First</option>
                  <option value="name-az" className="bg-[#0F0F0F] text-white">Name: A to Z</option>
                  <option value="name-za" className="bg-[#0F0F0F] text-white">Name: Z to A</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* PRODUCTS DIRECT GRID VIEW */}
        <div className="lg:col-span-3">

          {/* TOP CONTROLS AND DROPDOWNS BAR */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Category Dropdown</label>
                <div className="relative">
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => {
                      setSelectedMainCategory(e.target.value);
                      setSelectedBrand("All");
                    }}
                    className="bg-white/[0.03] border border-white/10 text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans cursor-pointer appearance-none w-full sm:w-48"
                  >
                    {mainCategoriesList.map(cat => (
                      <option key={cat} value={cat} className="bg-[#0F0F0F] text-white">
                        {cat === "All" ? "All Electronics" : cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Manufacturer Brand</label>
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans cursor-pointer appearance-none w-full sm:w-40 h-[38px]"
                  >
                    {brands.map(brand => (
                      <option key={brand} value={brand} className="bg-[#0F0F0F] text-white">
                        {brand === "All" ? "All Brands" : brand}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Price Range (KES)</label>
                <div className="flex items-center gap-1.5 bg-[#0F0F0F] border border-white/10 rounded-lg p-1 h-[38px] w-full sm:w-48">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Min"
                    className="w-full bg-transparent text-xs py-1 px-1 focus:outline-hidden text-white font-mono text-center"
                  />
                  <span className="text-white/20 font-mono text-[9px]">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Max"
                    className="w-full bg-transparent text-xs py-1 px-1 focus:outline-hidden text-white font-mono text-center"
                  />
                  {(minPrice !== "" || maxPrice !== "") && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="text-white/40 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
              {/* Grid Density Toggle */}
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Grid Density</label>
                <div className="flex bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setGridDensity("comfortable")}
                    className={`text-xs px-3 py-1.5 rounded-md font-sans transition-all cursor-pointer ${
                      gridDensity === "comfortable"
                        ? "bg-[#C5A059] text-black font-semibold shadow-xs"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity("compact")}
                    className={`text-xs px-3 py-1.5 rounded-md font-sans transition-all cursor-pointer ${
                      gridDensity === "compact"
                        ? "bg-[#C5A059] text-black font-semibold shadow-xs"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Sorting Order</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans cursor-pointer appearance-none w-full sm:w-48"
                  >
                    <option value="default" className="bg-[#0F0F0F] text-white">Default Sorting</option>
                    <option value="price-low" className="bg-[#0F0F0F] text-white">Price: Low to High</option>
                    <option value="price-high" className="bg-[#0F0F0F] text-white">Price: High to Low</option>
                    <option value="newest" className="bg-[#0F0F0F] text-white">Newest Arrivals First</option>
                    <option value="name-az" className="bg-[#0F0F0F] text-white">Name: A to Z</option>
                    <option value="name-za" className="bg-[#0F0F0F] text-white">Name: Z to A</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {productsLoading && products.length === 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4 text-[10px] font-mono text-white/30 font-bold tracking-wider">
                <span>INDEX LIVE REVEALS: RETRIEVING COGNITIVE BATCH...</span>
                <span>FETCHING SECURE STOCKS</span>
              </div>
              <div className={gridDensity === "comfortable" 
                ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              }>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-4 animate-pulse space-y-4">
                    <div className="w-full h-44 bg-white/5 rounded-xl animate-pulse"></div>
                    <div className="h-3.5 bg-white/5 rounded w-1/4 animate-pulse"></div>
                    <div className="h-4.5 bg-white/5 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
                    <div className="pt-4 border-t border-white/5 space-y-3 animate-pulse col-span-1">
                      <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse"></div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-5 bg-white/5 rounded w-1/3 animate-pulse"></div>
                        <div className="h-8 bg-white/5 rounded-xl w-1/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="font-sans font-semibold text-lg text-white">No products matching filters</h3>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                We couldn't locate any premium hardware corresponding to those query parameters. Try widening your search or resetting categories.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Reset Storefront Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4 text-[10px] font-mono text-white/30 font-bold tracking-wider">
                <span>INDEX LIVE REVEALS: {filteredProducts.length} ITEMS FOUND</span>
                <span>PAYSTACK SECURE SYSTEM</span>
              </div>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className={gridDensity === "comfortable"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                }
              >
                {paginatedProducts.map((p) => {
                  const isLowStock = p.stock <= 5;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <motion.div
                      key={p.id}
                      layout
                      layoutId={`shop-product-${p.id}`}
                      variants={itemVariants}
                      className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/40 transition-all flex flex-col group shadow-lg"
                    >
                      {/* Product image with click trigger */}
                      <div
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setActiveView("product-details");
                        }}
                        className="relative h-44 sm:h-48 bg-[#1A1A1A] overflow-hidden cursor-pointer shrink-0"
                      >
                        <ProductImageMagnifier
                          src={p.image}
                          alt={p.name}
                        />
                        
                        {/* Interactive floating Wishlist and Compare Buttons */}
                        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                            className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                              wishlist.includes(p.id)
                                ? "bg-[#C5A059] text-black border-[#C5A059]"
                                : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                            }`}
                            title={wishlist.includes(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                          
                          <div className="relative group/compare flex items-center justify-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleCompare(p); }}
                              className={`p-1.5 rounded-lg border backdrop-blur-xs cursor-pointer transition-all ${
                                compareList.some(item => item.id === p.id)
                                  ? "bg-white text-black border-white"
                                  : "bg-black/60 text-white/70 border-white/10 hover:text-white"
                              }`}
                              title={compareList.some(item => item.id === p.id) ? "Selected for comparison (Limit 3)" : "Compare with other hardware (Limit 3)"}
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                            {/* Hover Tooltip explaining the 3 products maximum limit */}
                            <div className="absolute right-0 bottom-full mb-2.5 hidden group-hover/compare:block bg-[#0F0F0F] text-[9px] font-mono text-white/90 px-2 py-1.5 rounded shadow-xl border border-white/10 w-44 text-center pointer-events-none z-50 animate-fadeIn">
                              <span className="text-[#C5A059] font-bold block mb-0.5">COMPARE TOOL</span>
                              Select up to 3 hardware units
                            </div>
                          </div>
                        </div>

                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                          <span className="bg-black/70 backdrop-blur-xs text-[#C5A059] font-mono text-[9px] font-bold px-2 py-0.5 rounded-md">
                            {highlightText(normalizeBrandName(p.brand), searchQuery)}
                          </span>
                          {isOutOfStock ? (
                            <span className="bg-white/10 text-white/50 font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-red-500/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">
                              LOW STOCK ({p.stock})
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Info Panel */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#C5A059] font-mono text-[9px] uppercase font-bold tracking-wider">
                              {p.category}
                            </span>
                            {/* Stars rating count summary */}
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-white/80 font-bold font-mono text-[10px]">
                                {p.rating || 4.8}
                              </span>
                              <span className="text-white/30 text-[9px] font-mono">
                                ({p.reviews?.length || 12})
                              </span>
                            </div>
                          </div>

                          <h3
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setActiveView("product-details");
                            }}
                            className="font-sans font-semibold text-sm text-white mt-1 cursor-pointer hover:text-[#C5A059] line-clamp-2 leading-tight"
                          >
                            {highlightText(p.name, searchQuery)}
                          </h3>

                          {/* Flash Deal Promo Banner & Timer */}
                          {isCampaignOfferActive(p) && (
                            <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-sans font-bold flex items-center gap-1 border border-red-500/20 uppercase tracking-wider animate-pulse">
                                <Flame className="w-3 h-3 text-red-500" />
                                {p.flashBanner || "FLASH OFFER!"}
                              </span>
                              <FlashCountdown expiry={p.flashExpiry!} />
                            </div>
                          )}
                          {isCampaignOfferUpcoming(p) && (
                            <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-sans font-bold flex items-center gap-1 border border-amber-500/20 uppercase tracking-wider">
                                ⏳ {p.flashBanner || "UPCOMING DEAL"}
                              </span>
                              <span className="text-[9.5px] text-amber-300/80 font-mono">
                                Starts: {new Date(p.flashStart!).toLocaleDateString()} {new Date(p.flashStart!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          )}

                          {/* Complimentary Product Tag Badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(p.tags && p.tags.length > 0 ? p.tags : (
                              p.category.toLowerCase().includes("laptop") ? ["Elite Speed", "SME Pick"] :
                              p.category.toLowerCase().includes("phone") ? ["Super Retina", "5G Built"] :
                              p.category.toLowerCase().includes("printer") ? ["High Yield", "Duplex Ready"] :
                              p.category.toLowerCase().includes("accessory") ? ["Distributor Price"] :
                              p.category.toLowerCase().includes("desktop") ? ["Custom liquid Workstation", "Extreme Compile"] :
                              ["4K Studio Shield"]
                            )).map((t, idx) => (
                              <span 
                                key={idx} 
                                className="text-[9px] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded-md font-sans font-medium hover:scale-102 transform transition-all tracking-wide flex items-center gap-1 border border-[#C5A059]/20"
                              >
                                <Tag className="w-2.5 h-2.5 shrink-0" />
                                {t}
                              </span>
                            ))}
                          </div>

                          <p className="text-white/50 text-[11px] mt-2.5 line-clamp-3 leading-relaxed">
                            {highlightText(p.description, searchQuery)}
                          </p>
                        </div>

                        {/* Inventory specifications visual trigger */}
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandSpecs(p.id);
                            }}
                            className="text-[10px] text-[#C5A059] font-mono hover:text-white transition-colors flex items-center justify-between w-full leading-none mb-3 cursor-pointer"
                          >
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{expandedProductIds[p.id] ? "Hide technical specifications" : "Reveal technical specifications"}</span>
                            </span>
                            <span className="text-[12px]">
                              {expandedProductIds[p.id] ? "▲" : "▼"}
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {expandedProductIds[p.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-3 text-[11px] font-mono space-y-1.5 text-white/80">
                                  {p.specifications && Object.keys(p.specifications).length > 0 ? (
                                    Object.entries(p.specifications).map(([key, val]) => (
                                      <div key={key} className="flex justify-between border-b border-white/5 pb-1 last:border-b-0 last:pb-0 font-mono">
                                        <span className="text-white/40 uppercase tracking-tight">{key}</span>
                                        <span className="text-right text-white font-semibold">{val}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-white/30 text-center py-1 font-mono">Standard hardware configurations apply.</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-white/30 font-mono block leading-none">
                                {isCampaignOfferActive(p) ? "FLASH DEAL" : "STORE PRICE"}
                              </span>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                {isCampaignOfferActive(p) ? (
                                  <>
                                    <span className="font-sans font-extrabold text-red-400 text-sm">
                                      KES {p.flashPrice!.toLocaleString()}
                                    </span>
                                    <span className="font-mono text-[10px] text-white/40 line-through">
                                      KES {p.price.toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-sans font-extrabold text-white text-sm">
                                    KES {p.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              disabled={isOutOfStock}
                              onClick={() => {
                                const variants = getProductVariants(p);
                                if (variants && variants.options.length > 0) {
                                  setQuickBuyProduct(p);
                                } else {
                                  addToCart(p, 1);
                                }
                              }}
                              className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                isOutOfStock 
                                  ? "bg-white/5 text-white/30 cursor-not-allowed" 
                                  : "bg-[#C5A059] hover:bg-[#C5A059]/90 text-black shrink-0"
                              }`}
                            >
                              {isOutOfStock ? "Sold Out" : "Add to Bag"}
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemNameSingular="product"
                itemNamePlural="products"
                scrollToId="shop-view-grid"
              />
            </div>
          )}

        </div>

      </div>

      {/* Quick Buy Interactive Modal */}
      {quickBuyProduct && (
        <div id="quick-buy-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full relative space-y-6 shadow-2xl">
            {/* Close trigger */}
            <button
              onClick={() => setQuickBuyProduct(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 p-2 rounded-full cursor-pointer transition-colors bg-transparent border-none outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Card Header */}
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden p-2 flex items-center justify-center shrink-0">
                <LazyImage
                  src={quickBuyProduct.image}
                  alt={quickBuyProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest">{quickBuyProduct.category}</span>
                <h3 className="font-sans font-bold text-base text-white line-clamp-2 leading-snug">{quickBuyProduct.name}</h3>
                <p className="text-white/40 text-xs font-mono">Product Code: TG-{quickBuyProduct.id.substring(0, 5).toUpperCase()}</p>
              </div>
            </div>

            {/* Selected Variant Picker Section */}
            {quickBuyProduct.variants && quickBuyProduct.variants.length > 0 ? (
              <div className="space-y-4">
                {uniqueQuickBuyRams.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block font-bold">
                      Choose System RAM Configuration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueQuickBuyRams.map((ramOption) => (
                        <button
                          key={ramOption}
                          type="button"
                          onClick={() => setQuickBuyRam(ramOption)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                            quickBuyRam === ramOption
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

                {uniqueQuickBuySsds.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block font-bold">
                      Choose SSD Storage Capacity
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueQuickBuySsds.map((ssdOption) => (
                        <button
                          key={ssdOption}
                          type="button"
                          onClick={() => setQuickBuySsd(ssdOption)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                            quickBuySsd === ssdOption
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
            ) : getProductVariants(quickBuyProduct) ? (
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block font-bold">
                  {getProductVariants(quickBuyProduct)?.label}
                </label>
                <div className="space-y-2">
                  {getProductVariants(quickBuyProduct)?.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedVariant(option)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all cursor-pointer border ${
                        selectedVariant === option
                          ? "bg-[#C5A059]/10 border-[#C5A059] text-white"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/60"
                      }`}
                    >
                      <span>{option.split(" (")[0]}</span>
                      {option.includes("(+") && (
                        <span className="text-[10px] font-mono text-[#C5A059]">
                          +{option.split("(+")[1].replace(")", "")}
                        </span>
                      )}
                      {option.includes("(-") && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          -{option.split("(-")[1].replace(")", "")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quantity Selector Section */}
            <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
              <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Purchase Quantity</span>
              <div className="flex items-center gap-4 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
                <button
                  disabled={quickBuyQuantity <= 1}
                  onClick={() => setQuickBuyQuantity(prev => prev - 1)}
                  className="text-white/40 hover:text-white disabled:pointer-events-none p-1 cursor-pointer bg-transparent border-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold font-mono text-white select-none w-4 text-center">
                  {quickBuyQuantity}
                </span>
                <button
                  onClick={() => setQuickBuyQuantity(prev => prev + 1)}
                  className="text-white/40 hover:text-white p-1 cursor-pointer bg-transparent border-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Buy Summary Block */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[9px] text-white/30 font-mono block uppercase">ACCUMULATED BUY TOTAL</span>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  KES {(() => {
                    if (quickBuyProduct.variants && quickBuyProduct.variants.length > 0) {
                      const price = matchedQuickBuyVariant ? matchedQuickBuyVariant.price : quickBuyProduct.price;
                      return (price * quickBuyQuantity).toLocaleString();
                    }
                    let price = quickBuyProduct.price;
                    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
                    const minusMatch = selectedVariant.match(/\-\s*KES\s*([\d,]+)/i);
                    if (priceMatch) {
                      const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
                      price += premium;
                    } else if (minusMatch) {
                      const discount = parseInt(minusMatch[1].replace(/,/g, ""), 10);
                      price -= discount;
                    }
                    return (price * quickBuyQuantity).toLocaleString();
                  })()}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setQuickBuyProduct(null)}
                  className="bg-transparent border border-white/10 hover:border-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickBuySubmit}
                  className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:scale-102 transition-all cursor-pointer border-0"
                >
                  Direct Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Comparison Persistent Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-[#0F0F0F]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn font-sans">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-[#C5A059]/20 p-2 rounded-lg border border-[#C5A059]/30">
              <Scale className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Compare Hardware</h4>
              <p className="text-[10px] text-white/50">{compareList.length} of 3 items selected</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            {compareList.map((p) => (
              <div key={p.id} className="relative flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-1.5 pr-3 shrink-0">
                <div className="w-8 h-8 bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="max-w-[85px] sm:max-w-[100px]">
                  <p className="text-[10px] text-white font-medium truncate">{p.name}</p>
                  <p className="text-[8px] text-[#C5A059] font-mono">KES {p.price.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => toggleCompare(p)}
                  className="text-white/40 hover:text-white/80 rounded-full p-0.5 hover:bg-white/5 transition-colors cursor-pointer border-0 bg-transparent outline-none"
                  title="Remove from comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={clearCompareList}
              className="text-[11px] font-mono text-white/50 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer border-0 bg-transparent outline-none"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-0 outline-none"
            >
              <Scale className="w-3.5 h-3.5" />
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* Comparison Matrix Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0F0F0F] border border-white/10 rounded-3xl max-w-4xl w-full relative overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#0F0F0F] to-[#161616]">
                <div className="flex items-center gap-3">
                  <div className="bg-[#C5A059]/20 p-2.5 rounded-xl border border-[#C5A059]/30">
                    <Scale className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-lg text-white">Hardware Comparison Matrix</h3>
                    <p className="text-white/40 text-xs mt-0.5">Side-by-side technical specification assessment</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="text-white/40 hover:text-white hover:bg-white/5 p-2 rounded-full cursor-pointer transition-colors border-0 bg-transparent outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table Container (Scrollable) */}
              <div className="overflow-auto p-6 flex-1">
                {compareList.length === 0 ? (
                  <div className="text-center py-12 text-white/40 space-y-3">
                    <AlertCircle className="w-8 h-8 text-white/30 mx-auto" />
                    <p className="text-sm">No hardware commodities selected for comparison.</p>
                    <button
                      onClick={() => setIsCompareModalOpen(false)}
                      className="bg-white/5 border border-white/10 text-white text-xs px-4 py-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Back to storefront
                    </button>
                  </div>
                ) : (
                  <div className="min-w-[650px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          {/* Top-left corner cell */}
                          <th className="py-4 px-3 text-xs font-mono text-white/30 uppercase tracking-widest w-[25%] bg-white/[0.01]">
                            Specifications
                          </th>
                          {/* Column for each compared product */}
                          {compareList.map((p) => {
                            const isOutOfStock = p.stock === 0;
                            return (
                              <th key={p.id} className="py-4 px-4 w-[25%] align-top relative group">
                                <div className="space-y-4">
                                  {/* Thumbnail & Remove button */}
                                  <div className="relative">
                                    <div className="w-full h-32 bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden p-2 flex items-center justify-center bg-linear-to-b from-[#111] to-[#1A1A1A]">
                                      <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <button
                                      onClick={() => toggleCompare(p)}
                                      className="absolute -top-1.5 -right-1.5 bg-black/80 hover:bg-red-500 hover:text-white text-white/60 p-1.5 rounded-full border border-white/10 cursor-pointer transition-all shadow-md"
                                      title="Remove from comparison"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Name & price */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono text-[#C5A059] uppercase tracking-wider block">{normalizeBrandName(p.brand)}</span>
                                    <h4 className="text-xs text-white font-bold line-clamp-2 min-h-[32px] leading-tight">{p.name}</h4>
                                    <p className="text-sm font-sans font-extrabold text-[#C5A059]">KSh {p.price.toLocaleString()}</p>
                                  </div>

                                  {/* Add to Cart button */}
                                  <button
                                    disabled={isOutOfStock}
                                    onClick={() => {
                                      const variants = getProductVariants(p);
                                      if (variants && variants.options.length > 0) {
                                        setQuickBuyProduct(p);
                                        setIsCompareModalOpen(false); // open quickbuy directly
                                      } else {
                                        addToCart(p, 1);
                                      }
                                    }}
                                    className={`w-full font-sans text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer ${
                                      isOutOfStock 
                                        ? "bg-white/5 text-white/30 cursor-not-allowed" 
                                        : "bg-[#C5A059] hover:bg-[#C5A059]/90 text-black shadow-md hover:scale-102"
                                    }`}
                                  >
                                    {isOutOfStock ? "Sold Out" : "Add to Bag"}
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                          {/* Placeholders if comparing less than 3 */}
                          {compareList.length < 3 && 
                            Array.from({ length: 3 - compareList.length }).map((_, idx) => (
                              <th key={`placeholder-${idx}`} className="py-4 px-4 w-[25%] align-middle text-center border-l border-white/[0.03]">
                                <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center text-white/20 gap-2">
                                  <Scale className="w-6 h-6 text-white/10" />
                                  <p className="text-[10px] font-mono uppercase tracking-wider">Select Commodity</p>
                                </div>
                              </th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-white/80">
                        {/* Row: Brand */}
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-3 px-3 font-mono text-[10px] text-white/40 uppercase bg-white/[0.01] font-bold">Brand</td>
                          {compareList.map((p) => (
                            <td key={p.id} className="py-3 px-4 font-sans font-medium text-white">{normalizeBrandName(p.brand)}</td>
                          ))}
                          {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, idx) => <td key={idx} className="bg-transparent" />)}
                        </tr>
                        {/* Row: Category */}
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-3 px-3 font-mono text-[10px] text-white/40 uppercase bg-white/[0.01] font-bold">Category</td>
                          {compareList.map((p) => (
                            <td key={p.id} className="py-3 px-4 font-sans text-white/70">{p.category}</td>
                          ))}
                          {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, idx) => <td key={idx} className="bg-transparent" />)}
                        </tr>
                        {/* Row: Rating */}
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-3 px-3 font-mono text-[10px] text-white/40 uppercase bg-white/[0.01] font-bold">Rating</td>
                          {compareList.map((p) => {
                            const rating = p.rating || 5;
                            return (
                              <td key={p.id} className="py-3 px-4 font-sans">
                                <div className="flex items-center gap-1">
                                  <div className="flex text-[#C5A059]">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <Star key={idx} className={`w-3 h-3 ${idx < Math.round(rating) ? "fill-current" : "opacity-30"}`} />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-mono text-white/50">({rating})</span>
                                </div>
                              </td>
                            );
                          })}
                          {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, idx) => <td key={idx} className="bg-transparent" />)}
                        </tr>
                        {/* Row: Stock */}
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-3 px-3 font-mono text-[10px] text-white/40 uppercase bg-white/[0.01] font-bold">Availability</td>
                          {compareList.map((p) => {
                            const isOutOfStock = p.stock === 0;
                            const isLowStock = p.stock > 0 && p.stock <= 5;
                            return (
                              <td key={p.id} className="py-3 px-4 font-sans font-semibold">
                                {isOutOfStock ? (
                                  <span className="text-red-500">Out of Stock</span>
                                ) : isLowStock ? (
                                  <span className="text-[#C5A059]">Low Stock ({p.stock})</span>
                                ) : (
                                  <span className="text-green-500">In Stock ({p.stock} units)</span>
                                )}
                              </td>
                            );
                          })}
                          {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, idx) => <td key={idx} className="bg-transparent" />)}
                        </tr>

                        {/* Specification Rows */}
                        {Array.from(new Set(compareList.flatMap(p => Object.keys(p.specifications || {})))).map((specKey) => (
                          <tr key={specKey} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-3 font-mono text-[10px] text-white/40 uppercase bg-white/[0.01] font-bold truncate max-w-[150px]" title={specKey}>
                              {specKey}
                            </td>
                            {compareList.map((p) => {
                              const val = p.specifications?.[specKey] || "-";
                              return (
                                <td key={p.id} className="py-3 px-4 font-sans text-white/95 text-xs">
                                  {val}
                                </td>
                              );
                            })}
                            {compareList.length < 3 && Array.from({ length: 3 - compareList.length }).map((_, idx) => <td key={idx} className="bg-transparent" />)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
                <p className="text-[10px] text-white/30 font-mono">
                  COMPARE POOL ACCESS CODE: KE-HW-CMP-3
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={clearCompareList}
                    className="bg-transparent border border-white/10 hover:border-white/20 hover:text-white text-white/60 text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border-0"
                  >
                    Clear Comparison List
                  </button>
                  <button
                    onClick={() => setIsCompareModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs px-5 py-2 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Close assessment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Back to Top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            id="back-to-top-btn"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 bg-[#C5A059] hover:bg-[#b08e4d] text-black rounded-full p-3.5 shadow-2xl border border-white/20 flex items-center justify-center cursor-pointer transition-colors"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
