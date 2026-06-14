/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useStore } from "../StoreContext";
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
  X
} from "lucide-react";
import { Product } from "../types";

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
  const [sortBy, setSortBy] = useState<string>("default");
  const [onlyShowWishlist, setOnlyShowWishlist] = useState<boolean>(false);

  // Quick Buy interactive modal configurations
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quickBuyQuantity, setQuickBuyQuantity] = useState<number>(1);

  const getProductVariants = (product: Product) => {
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

  useEffect(() => {
    if (quickBuyProduct) {
      const variants = getProductVariants(quickBuyProduct).options;
      setSelectedVariant(variants[0]);
      setQuickBuyQuantity(1);
    }
  }, [quickBuyProduct]);

  const handleQuickBuySubmit = () => {
    if (!quickBuyProduct) return;
    
    let finalPrice = quickBuyProduct.price;
    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
    if (priceMatch) {
      const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      finalPrice += premium;
    }

    const modifiedProduct = {
      ...quickBuyProduct,
      name: `${quickBuyProduct.name} (${selectedVariant.split(" (+")[0]})`,
      price: finalPrice
    };

    addToCart(modifiedProduct, quickBuyQuantity);
    setQuickBuyProduct(null);
  };

  // Helper mapping to extract core category name
  const getProductMainCategory = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes("laptop")) return "Laptops";
    if (catLower.includes("phone")) return "Phones";
    if (catLower.includes("desktop")) return "Desktops";
    return category; // Printers, Accessories, All-in-One PCs, etc.
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
    return ["All", "Laptops", "Phones", "Desktops", "Printers", "Accessories", "All-in-One PCs"];
  }, []);

  const brands = useMemo(() => {
    const matchingProducts = products.filter(p => 
      selectedMainCategory === "All" || getProductMainCategory(p.category) === selectedMainCategory
    );
    const list = new Set(matchingProducts.map(p => p.brand));
    return ["All", ...Array.from(list)];
  }, [products, selectedMainCategory]);

  // Reset filters
  const resetFilters = () => {
    setSelectedMainCategory("All");
    setSelectedCondition("All");
    setSelectedBrand("All");
    setSortBy("default");
    setSearchQuery("");
    setOnlyShowWishlist(false);
  };

  // Filter & Sort Logic combined
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search Query matching
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.brand.toLowerCase().includes(q) || 
             p.category.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q)
      );
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
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Wishlist Filter
    if (onlyShowWishlist) {
      result = result.filter(p => wishlist.includes(p.id));
    }

    // Sorting Logic
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
  }, [products, searchQuery, selectedMainCategory, selectedCondition, selectedBrand, sortBy, onlyShowWishlist, wishlist]);

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
                    className="bg-white/[0.03] border border-white/10 text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans cursor-pointer appearance-none w-full sm:w-40"
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
            </div>

            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= 5;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <motion.div
                      key={p.id}
                      variants={itemVariants}
                      className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/40 transition-all flex flex-col group shadow-lg"
                    >
                      {/* Product image with click trigger */}
                      <div
                        onClick={() => {
                          setQuickBuyProduct(p);
                        }}
                        className="relative h-44 sm:h-48 bg-[#1A1A1A] overflow-hidden cursor-pointer shrink-0"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
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
                            {highlightText(p.brand, searchQuery)}
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
                              setQuickBuyProduct(p);
                            }}
                            className="font-sans font-semibold text-sm text-white mt-1 cursor-pointer hover:text-[#C5A059] line-clamp-2 leading-tight"
                          >
                            {highlightText(p.name, searchQuery)}
                          </h3>

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
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setActiveView("product-details");
                            }}
                            className="text-[10px] text-white/30 font-mono hover:text-[#C5A059] transition-colors flex items-center gap-1 leading-none mb-3 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-white/30" />
                            <span>View technical specifications</span>
                          </button>

                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-white/30 font-mono block leading-none">STORE PRICE</span>
                              <span className="font-sans font-extrabold text-white text-sm">
                                KES {p.price.toLocaleString()}
                              </span>
                            </div>

                            <button
                              disabled={isOutOfStock}
                              onClick={() => addToCart(p, 1)}
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

              {hasMoreProducts && (
                <div className="flex justify-center mt-12 pb-6">
                  <button
                    disabled={productsLoading}
                    onClick={loadMoreProducts}
                    className="bg-transparent border border-white/20 hover:border-[#C5A059]/60 text-white hover:text-[#C5A059] px-6 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer shadow-md hover:shadow-[#C5A059]/10 hover:scale-102 active:scale-98 flex items-center gap-2"
                  >
                    {productsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />}
                    {productsLoading ? "Inventory Syncing..." : "Load More Premium Commodities"}
                  </button>
                </div>
              )}
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
                <img
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
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block font-bold">
                {getProductVariants(quickBuyProduct).label}
              </label>
              <div className="space-y-2">
                {getProductVariants(quickBuyProduct).options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedVariant(option)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex justify-between items-center transition-all cursor-pointer border ${
                      selectedVariant === option
                        ? "bg-[#C5A059]/10 border-[#C5A059] text-white"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/60"
                    }`}
                  >
                    <span>{option.split(" (+")[0]}</span>
                    {option.includes("(+") && (
                      <span className="text-[10px] font-mono text-[#C5A059]">
                        +{option.split("(+")[1].replace(")", "")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

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
                    let price = quickBuyProduct.price;
                    const priceMatch = selectedVariant.match(/\+\s*KES\s*([\d,]+)/i);
                    if (priceMatch) {
                      const premium = parseInt(priceMatch[1].replace(/,/g, ""), 10);
                      price += premium;
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

    </div>
  );
}
