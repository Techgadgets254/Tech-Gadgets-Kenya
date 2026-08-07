/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import brandLogo from "../assets/images/tech_soko_logo_1783960703453.jpg";
import PushNotificationDrawer from "./PushNotificationDrawer";
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Search, 
  Monitor, 
  Settings, 
  MessageSquare,
  Home, 
  LogIn,
  ShieldAlert,
  Newspaper,
  Sun,
  Moon,
  X,
  RotateCcw,
  GitCompare,
  Bell,
  BellRing,
  Sparkles,
  ArrowRight,
  Tag,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Header() {
  const { 
    user, 
    userProfile, 
    cart, 
    activeView, 
    setActiveView, 
    loginWithGoogle, 
    logout,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    products,
    setSelectedProductId,
    setIsAuthModalOpen,
    setAuthModalMode,
    compareList,
    setIsCompareOverlayOpen
  } = useStore();

  const isLight = theme === "light";

  const [desktopFocused, setDesktopFocused] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search when global searchQuery changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce the search query update to 150ms for instant feel
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const trimmedQuery = localSearch.trim().toLowerCase();

  // Enhanced Predictive Search Calculations
  const suggestions = React.useMemo(() => {
    if (!trimmedQuery) {
      // Default popular quick suggestions when focused but query is empty
      const popularCats = Array.from(new Set(products.map(p => p.category))).slice(0, 4);
      const featuredProds = products.filter(p => p.stock > 0).slice(0, 3);
      return {
        categories: popularCats.map(c => ({
          name: c,
          count: products.filter(p => p.category === c).length
        })),
        products: featuredProds,
        isDefault: true
      };
    }

    // 1. Categories matching query
    const categoriesWithCounts = Array.from(new Set(products.map(p => p.category)))
      .filter(cat => cat.toLowerCase().includes(trimmedQuery))
      .map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
      }));

    // 2. Products matching query in name, brand, category, specifications or tags
    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.brand.toLowerCase().includes(trimmedQuery) ||
      p.category.toLowerCase().includes(trimmedQuery) ||
      (p.sku && p.sku.toLowerCase().includes(trimmedQuery))
    ).slice(0, 6);

    return {
      categories: categoriesWithCounts,
      products: matchingProducts,
      isDefault: false
    };
  }, [trimmedQuery, products]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    if (activeView !== "shop") {
      setActiveView("shop");
    }
  };

  return (
    <>
    <header 
      id="storefront-header" 
      className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-xl transition-all ${
        theme === "light"
          ? "bg-white/95 border-[#E7E2D8] text-[#1c1917]"
          : "bg-[#0F0F0F]/95 border-white/10 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Static Setup */}
          <div 
            id="brand-logo" 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink min-w-0 group relative select-none transition-transform duration-300 ease-in-out hover:scale-105"
            onClick={() => { setActiveView("home"); setLocalSearch(""); setSearchQuery(""); }}
          >
            {/* The rotate-45 framing wrapper with premium gold glow transition */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-[#0F0F0F] rounded-lg flex items-center justify-center shadow-lg shrink-0 border border-[#C5A059]/30 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(197,160,89,0.7)] group-hover:border-[#C5A059]">
              <img 
                src={brandLogo} 
                alt="Tech Sokoni Kenya Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Custom Brand Labels */}
            <div className="text-left min-w-0">
              <span className={`font-serif italic text-sm sm:text-lg font-bold tracking-[0.1em] sm:tracking-[0.12em] uppercase block leading-none truncate ${
                isLight ? "text-zinc-900" : "text-white"
              }`}>
                TECH SOKONI
              </span>
              <span className="font-mono text-[8px] tracking-[0.12em] sm:tracking-[0.16em] text-[#C5A059] block font-bold mt-0.5 sm:mt-1 truncate">
                KENYA • PREMIUM
              </span>
            </div>
          </div>

          {/* Global Search Bar (Optimized desktop viewport) */}
          <div 
            id="header-search" 
            className="hidden md:flex items-center flex-1 max-w-md relative group"
          >
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 group-focus-within:text-[#C5A059] transition-colors pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              onFocus={() => setDesktopFocused(true)}
              onBlur={() => setTimeout(() => setDesktopFocused(false), 200)}
              placeholder="Search specs, desktops, Kenyatta Ave bulletins..."
              className="w-full bg-[#161616] border border-white/10 hover:border-white/20 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#C5A059] focus:bg-[#1C1C1C] transition-all text-white placeholder-white/40 font-sans shadow-inner group-focus-within:ring-1 group-focus-within:ring-[#C5A059]/20"
            />
            {localSearch && (
              <button 
                onClick={() => { setLocalSearch(""); setSearchQuery(""); }}
                className="absolute right-3 text-white/40 hover:text-white text-[10px] uppercase font-mono cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Desktop Real-time predictive search suggestions dropdown */}
            {desktopFocused && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-[#0E0E0E]/98 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-left py-2.5 max-h-[32rem] overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {/* Header label */}
                <div className="px-3.5 pb-2 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  <span>{suggestions.isDefault ? "Popular Suggestions" : `Predictive Results (${suggestions.products.length + suggestions.categories.length})`}</span>
                  <span className="text-[#C5A059]">Instant Search</span>
                </div>

                {/* Categories */}
                {suggestions.categories.length > 0 && (
                  <div className="px-3 py-2">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059] uppercase flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{suggestions.isDefault ? "Explore Categories" : "Top Categories"}</span>
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {suggestions.categories.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setLocalSearch(cat.name);
                            setSearchQuery(cat.name);
                            setActiveView("shop");
                            setDesktopFocused(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs bg-white/[0.03] hover:bg-white/[0.08] hover:text-[#C5A059] transition-all flex items-center justify-between font-medium cursor-pointer border border-white/5"
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 shrink-0 ml-1">
                            {cat.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {suggestions.categories.length > 0 && suggestions.products.length > 0 && (
                  <div className="border-t border-white/5 my-1" />
                )}

                {/* Matching Products */}
                {suggestions.products.length > 0 && (
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059] uppercase flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{suggestions.isDefault ? "Top Products" : "Matching Product Names"}</span>
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {suggestions.products.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setActiveView("product-details");
                            setDesktopFocused(false);
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs hover:bg-white/[0.06] transition-all flex items-center gap-3 cursor-pointer border border-transparent hover:border-white/10 group/item"
                        >
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0 border border-white/10 group-hover/item:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-white/95 truncate leading-snug group-hover/item:text-[#C5A059] transition-colors">{prod.name}</p>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold shrink-0">
                                {prod.brand}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                              <span className="text-[#C5A059] font-bold">KES {prod.price.toLocaleString()}</span>
                              <span className={prod.stock > 0 ? "text-emerald-400" : "text-rose-400"}>
                                {prod.stock > 0 ? `${prod.stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View all search CTA */}
                {trimmedQuery && (
                  <div className="px-3 pt-2 pb-1 border-t border-white/5">
                    <button
                      onClick={() => {
                        setActiveView("shop");
                        setDesktopFocused(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#C5A059]/15 hover:bg-[#C5A059] text-[#C5A059] hover:text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#C5A059]/30"
                    >
                      <span>See all matching results for "{trimmedQuery}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div id="header-actions" className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => { setActiveView("home"); setSearchQuery(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  activeView === "home"
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                    : isLight
                      ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent"
                      : "text-white/60 hover:text-white hover:bg-white/[0.02] border-transparent"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => { setActiveView("shop"); setSearchQuery(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  activeView === "shop"
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                    : isLight
                      ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent"
                      : "text-white/60 hover:text-white hover:bg-white/[0.02] border-transparent"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop</span>
              </button>
              <button
                onClick={() => { setActiveView("news"); setSearchQuery(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  activeView === "news"
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                    : isLight
                      ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent"
                      : "text-white/60 hover:text-white hover:bg-white/[0.02] border-transparent"
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>News</span>
              </button>
            </nav>

            {/* Push Notifications Trigger */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all border focus:outline-none cursor-pointer group ${
                isLight
                  ? "text-zinc-700 hover:text-[#C5A059] border-zinc-200 hover:bg-zinc-100"
                  : "text-white/70 hover:text-[#C5A059] border-white/10 hover:bg-[#1A1A1A]"
              }`}
              title="Open Push Notifications & Alert Settings"
            >
              <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 sm:p-2.5 rounded-xl transition-all border focus:outline-none cursor-pointer group ${
                isLight
                  ? "text-zinc-700 hover:text-[#C5A059] border-zinc-200 hover:bg-zinc-100"
                  : "text-white/70 hover:text-[#C5A059] border-white/10 hover:bg-[#1A1A1A]"
              }`}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 transition-transform group-hover:scale-110" />
              ) : (
                <Moon className="w-4 h-4 transition-transform group-hover:scale-110" />
              )}
            </button>

            {/* Compare Matrix Trigger (Hidden on small screens to avoid header clutter) */}
            <button
              onClick={() => setIsCompareOverlayOpen(true)}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all border group focus:outline-none cursor-pointer hidden sm:flex ${
                compareList.length > 0 
                  ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/40" 
                  : isLight
                    ? "text-zinc-700 hover:text-[#C5A059] border-zinc-200 hover:bg-zinc-100"
                    : "text-white/70 hover:text-[#C5A059] border-white/10 hover:bg-[#1A1A1A]"
              }`}
              title="Open Hardware Comparison Overlay"
            >
              <GitCompare className="w-4 h-4 transition-transform group-hover:scale-110" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C5A059] text-black font-sans text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-lg">
                  {compareList.length}
                </span>
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setActiveView("checkout")}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all border group focus:outline-none cursor-pointer ${
                isLight
                  ? "text-zinc-700 hover:text-[#C5A059] border-zinc-200 hover:bg-zinc-100"
                  : "text-white/70 hover:text-[#C5A059] border-white/10 hover:bg-[#1A1A1A]"
              }`}
              title="Go to Cart Checklist"
            >
              <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-105" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C5A059] text-black font-sans text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-lg animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Profile dropdown menu (desktop only) */}
            <div className="relative hidden sm:block">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`flex items-center gap-2 p-1 border rounded-xl transition-all focus:outline-none ${
                      isLight 
                        ? "border-zinc-200 hover:border-[#C5A059]/50 hover:bg-zinc-100 text-zinc-900" 
                        : "border-white/10 hover:border-[#C5A059]/30 hover:bg-[#161616] text-white/80"
                    }`}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="User profile" 
                        className="w-7 h-7 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-lg flex items-center justify-center font-bold text-xs">
                        {user.displayName?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className={`hidden lg:inline text-xs font-bold pr-1.5 ${isLight ? "text-zinc-800" : "text-white/80"}`}>
                      {userProfile?.role === "admin" ? "Admin Mode" : "My Account"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-2 w-56 border rounded-xl shadow-2xl py-2 z-50 text-left ${
                          isLight 
                            ? "bg-white border-zinc-200 shadow-zinc-400/20" 
                            : "bg-[#0E0E0E] border-white/10"
                        }`}
                      >
                        <div className={`px-4 py-2 border-b ${isLight ? "border-zinc-100" : "border-white/5"}`}>
                          <p className={`text-xs font-black truncate ${isLight ? "text-zinc-900" : "text-white/90"}`}>
                            {user.displayName}
                          </p>
                          <p className={`text-[10px] font-mono truncate ${isLight ? "text-zinc-500" : "text-white/40"}`}>{user.email}</p>
                          {userProfile?.role && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono rounded-md bg-[#C5A059]/15 text-[#C55010] border border-[#C5A059]/30 font-bold">
                              {userProfile.role.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {(userProfile?.role === "admin" || user?.email === "techgadgetsk@gmail.com") && (
                          <>
                            <button
                              onClick={() => {
                                localStorage.setItem("tsk_active_admin_subtab", "overview");
                                setActiveView("admin-dashboard");
                                setShowProfileDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 font-bold cursor-pointer ${
                                isLight ? "text-zinc-700 hover:bg-zinc-50" : "text-white/70 hover:bg-white/[0.03]"
                              }`}
                            >
                              <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>Admin Portal</span>
                            </button>
                            <button
                              onClick={() => {
                                localStorage.setItem("tsk_active_admin_subtab", "whatsapp_catalog");
                                setActiveView("admin-dashboard");
                                setShowProfileDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 font-bold cursor-pointer text-[#25D366] hover:bg-[#25D366]/5`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>WhatsApp Catalog Sync</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setActiveView("client-dashboard");
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 font-bold cursor-pointer ${
                            isLight ? "text-zinc-700 hover:bg-zinc-50" : "text-white/70 hover:bg-white/[0.03]"
                          }`}
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Client Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            logout();
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 font-bold cursor-pointer border-t mt-1 ${
                            isLight ? "text-red-600 hover:bg-red-50 border-zinc-100" : "text-red-400 hover:bg-red-500/10 border-white/5"
                          }`}
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthModalMode("login"); setIsAuthModalOpen(true); }}
                  className="bg-[#C5A059] text-black hover:bg-[#C5A059]/90 transform active:scale-95 transition-all px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Search Bar Block (Optimized experience) */}
      <div className={`md:hidden px-4 pb-3 pt-1 border-b ${
        theme === "light"
          ? "bg-white border-[#E7E2D8]"
          : "bg-[#0F0F0F] border-white/10"
      }`}>
        <div id="mobile-search-bar" className="relative flex items-center group">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 pointer-events-none group-focus-within:text-[#C5A059]" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            onFocus={() => setMobileFocused(true)}
            onBlur={() => setTimeout(() => setMobileFocused(false), 200)}
            placeholder="Search laptops, setups, printers..."
            className="w-full bg-[#161616] border border-white/10 text-xs py-2 pl-9 pr-8 rounded-xl focus:outline-none focus:border-[#C5A059] focus:bg-[#1E1E1E] text-white transition-all font-sans"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(""); setSearchQuery(""); }}
              className="absolute right-3 text-[10px] font-mono text-white/40 hover:text-white cursor-pointer active:scale-95"
            >
              Esc
            </button>
          )}

          {/* Mobile Real-time suggestions dropdown */}
          {mobileFocused && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
            <div 
              className="absolute top-full left-0 right-0 mt-2 bg-[#0E0E0E]/98 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 text-left py-2.5 max-h-80 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.categories.length > 0 && (
                <div className="px-3 py-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059] uppercase flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{suggestions.isDefault ? "Explore Categories" : "Top Categories"}</span>
                  </span>
                  <div className="mt-1 space-y-1">
                    {suggestions.categories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocalSearch(cat.name);
                          setSearchQuery(cat.name);
                          setActiveView("shop");
                          setMobileFocused(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/[0.06] hover:text-[#C5A059] transition-colors flex items-center justify-between font-medium cursor-pointer border border-white/5"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 shrink-0 ml-1">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {suggestions.categories.length > 0 && suggestions.products.length > 0 && (
                <div className="border-t border-white/5 my-1" />
              )}

              {suggestions.products.length > 0 && (
                <div className="px-3 py-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059] uppercase flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>{suggestions.isDefault ? "Top Products" : "Matching Product Names"}</span>
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {suggestions.products.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedProductId(prod.id);
                          setActiveView("product-details");
                          setMobileFocused(false);
                        }}
                        className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-2.5 cursor-pointer border border-transparent hover:border-white/10"
                      >
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-8 h-8 rounded-md object-cover bg-white/5 shrink-0 border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white/95 truncate leading-none">{prod.name}</p>
                          <p className="text-[9px] font-mono text-[#C5A059] mt-1">KES {prod.price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <nav 
        id="mobile-bottom-nav-dock"
        aria-label="Mobile Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-xl px-2 py-1.5 flex items-center justify-around transition-all duration-300 ${
          isLight
            ? "bg-white/95 border-zinc-200 text-zinc-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            : "bg-[#0A0A0A]/95 border-white/10 text-white/70 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
        }`}
      >
        <button
          onClick={() => { setActiveView("home"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === "home"
              ? "text-[#C5A059] font-bold"
              : isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => { setActiveView("shop"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === "shop"
              ? "text-[#C5A059] font-bold"
              : isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">Shop</span>
        </button>

        <button
          onClick={() => { setActiveView("checkout"); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeView === "checkout"
              ? "text-[#C5A059] font-bold"
              : isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#C5A059] text-black font-sans text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-md animate-pulse">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">Cart</span>
        </button>

        <button
          onClick={() => { setActiveView("news"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === "news"
              ? "text-[#C5A059] font-bold"
              : isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">News</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              setActiveView("client-dashboard");
            } else {
              setAuthModalMode("login");
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === "client-dashboard"
              ? "text-[#C5A059] font-bold"
              : isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">
            {user ? "Account" : "Sign In"}
          </span>
        </button>
      </nav>

    </header>

      {/* Push Notifications Drawer Overlay */}
      <PushNotificationDrawer 
        isOpen={isNotificationDrawerOpen} 
        onClose={() => setIsNotificationDrawerOpen(false)} 
      />
    </>
  );
}
