/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../StoreContext";
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Search, 
  Monitor, 
  Settings, 
  Home, 
  LogIn,
  ShieldAlert,
  Newspaper,
  Sun,
  Moon,
  Menu,
  X,
  Upload,
  RotateCcw
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
    setSelectedProductId
  } = useStore();

  const [desktopFocused, setDesktopFocused] = useState(false);
  const [mobileFocused, setMobileFocused] = useState(false);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const suggestions = React.useMemo(() => {
    if (!trimmedQuery) return { categories: [], products: [] };

    const uniqueCategories = Array.from(
      new Set(products.map(p => p.category))
    );
    const matchingCategories = uniqueCategories.filter(cat => 
      cat.toLowerCase().includes(trimmedQuery)
    );

    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.brand.toLowerCase().includes(trimmedQuery) ||
      p.category.toLowerCase().includes(trimmedQuery)
    ).slice(0, 5);

    return {
      categories: matchingCategories,
      products: matchingProducts
    };
  }, [searchQuery, products]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem("tgk_custom_logo");
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (activeView !== "shop") {
      setActiveView("shop");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomLogo(base64String);
        localStorage.setItem("tgk_custom_logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomLogo(null);
    localStorage.removeItem("tgk_custom_logo");
  };

  return (
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
          
          {/* Brand Logo & Custom Upload Interaction */}
          <div 
            id="brand-logo" 
            className="flex items-center gap-3 cursor-pointer shrink-0 group relative select-none transition-transform duration-300 ease-in-out hover:scale-105"
            onClick={() => { setActiveView("home"); setSearchQuery(""); setMobileMenuOpen(false); }}
          >
            {/* The rotate-45 framing wrapper with premium gold glow transition */}
            <div className="relative w-9 h-9 bg-gradient-to-tr from-[#C5A059] to-[#8E6E3E] rounded-xs rotate-45 flex items-center justify-center shadow-lg shrink-0 border border-[#C5A059]/20 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(197,160,89,0.7)] group-hover:border-[#C5A059]">
              {customLogo ? (
                <div className="-rotate-45 w-full h-full p-1 bg-black/50">
                  <img 
                    src={customLogo} 
                    alt="Custom partner logo" 
                    className="w-full h-full object-contain rounded-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="-rotate-45">
                  <Monitor className="w-4 h-4 text-black" />
                </div>
              )}
            </div>

            {/* Custom Brand Labels */}
            {!customLogo ? (
              <div className="text-left">
                <span className="font-serif italic text-base sm:text-lg font-light tracking-[0.12em] uppercase text-white block leading-none">
                  TECH GADGETS
                </span>
                <span className="font-mono text-[8px] tracking-[0.16em] text-[#C5A059] block font-bold mt-1">
                  KENYA • PREMIUM
                </span>
              </div>
            ) : (
              <div className="text-left">
                <span className="font-serif italic text-sm sm:text-base font-bold tracking-[0.08em] uppercase text-[#C5A059] block leading-none">
                  CUSTOM LOGO
                </span>
                <span className="font-mono text-[8px] tracking-[0.12em] text-white/50 block font-semibold mt-1">
                  ACTIVE PARTNER
                </span>
              </div>
            )}

            {/* Embedded Logo Actions */}
            <div 
              className="absolute -bottom-2 -left-1 hidden group-hover:flex items-center gap-1 bg-black/95 border border-[#C5A059]/30 rounded-md px-1.5 py-0.5 scale-90 shadow-2xl z-30" 
              onClick={(e) => e.stopPropagation()}
            >
              <label 
                htmlFor="header-logo-upload-input" 
                className="text-[8px] font-mono font-bold text-[#C5A059] hover:text-white cursor-pointer flex items-center gap-1 transition-colors"
                title="Upload brand logo"
              >
                <Upload className="w-2 h-2" />
                <span>Upload</span>
              </label>
              <input 
                type="file" 
                id="header-logo-upload-input" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />
              {customLogo && (
                <>
                  <span className="text-white/20 select-none text-[8px]">•</span>
                  <button
                    onClick={handleResetLogo}
                    className="text-[8px] font-mono font-black text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
                    title="Reset default text branding"
                  >
                    <RotateCcw className="w-2 h-2" />
                    <span>Reset</span>
                  </button>
                </>
              )}
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
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setDesktopFocused(true)}
              onBlur={() => setTimeout(() => setDesktopFocused(false), 200)}
              placeholder="Search specs, desktops, Kenyatta Ave bulletins..."
              className="w-full bg-[#161616] border border-white/10 hover:border-white/20 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#C5A059] focus:bg-[#1C1C1C] transition-all text-white placeholder-white/40 font-sans shadow-inner group-focus-within:ring-1 group-focus-within:ring-[#C5A059]/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-white/40 hover:text-white text-[10px] uppercase font-mono cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Desktop Real-time suggestions dropdown */}
            {desktopFocused && trimmedQuery && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-[#0E0E0E]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left py-2 max-h-96 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestions.categories.length > 0 && (
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059]/80 uppercase">Matching Categories</span>
                    <div className="mt-1 space-y-0.5">
                      {suggestions.categories.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(cat);
                            setActiveView("shop");
                            setDesktopFocused(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/[0.04] hover:text-[#C5A059] transition-colors flex items-center justify-between font-medium cursor-pointer"
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] font-mono text-white/30">Category</span>
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
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059]/80 uppercase">Matching Products</span>
                    <div className="mt-1.5 space-y-1">
                      {suggestions.products.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setActiveView("product-details");
                            setDesktopFocused(false);
                          }}
                          className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-8 h-8 rounded-md object-cover bg-white/5 shrink-0"
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

          {/* Action Controls */}
          <div id="header-actions" className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => { setActiveView("home"); setSearchQuery(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  activeView === "home"
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
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
                    : "text-white/60 hover:text-white hover:bg-white/[0.02] border-transparent"
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>News</span>
              </button>
            </nav>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all border focus:outline-none cursor-pointer group ${
                theme === "light"
                  ? "text-[#a0782c] border-[#D0C9BD] hover:bg-[#F3EFE7]"
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

            {/* Cart Trigger */}
            <button
              onClick={() => setActiveView("checkout")}
              className="relative p-2.5 text-white/70 hover:text-[#C5A059] rounded-xl transition-all border border-white/10 hover:bg-[#1A1A1A] group focus:outline-none"
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
                    className="flex items-center gap-2 p-1 border border-white/10 hover:border-[#C5A059]/30 rounded-xl hover:bg-[#161616] transition-all focus:outline-none"
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
                    <span className="hidden lg:inline text-xs font-bold pr-1.5 text-white/80">
                      {userProfile?.role === "admin" ? "Admin Mode" : "My Account"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-[#0E0E0E] border border-white/10 rounded-xl shadow-2xl py-2 z-50 text-left"
                      >
                        <div className="px-4 py-2 border-b border-white/5">
                          <p className="text-xs font-black text-white/90 truncate">
                            {user.displayName}
                          </p>
                          <p className="text-[10px] font-mono text-white/40 truncate">{user.email}</p>
                          {userProfile?.role && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono rounded-md bg-[#C5A059]/15 text-[#C55010] border border-[#C5A059]/30 font-bold">
                              {userProfile.role.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {userProfile?.role === "admin" && (
                          <button
                            onClick={() => {
                              setActiveView("admin-dashboard");
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.03] transition-colors flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Admin Portal</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveView("client-dashboard");
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.03] transition-colors flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Client Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            logout();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-bold cursor-pointer border-t border-white/5 mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="bg-[#C5A059] text-black hover:bg-[#C5A059]/90 transform active:scale-95 transition-all px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Hamburger Menu Trigger Button (mobile layout) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-white/70 hover:text-white rounded-xl border border-white/10 hover:bg-[#171717] transition-all md:hidden z-50 focus:outline-none"
              title="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-[#C5A059]" /> : <Menu className="w-4 h-4" />}
            </button>

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
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setMobileFocused(true)}
            onBlur={() => setTimeout(() => setMobileFocused(false), 200)}
            placeholder="Search laptops, setups, printers..."
            className="w-full bg-[#161616] border border-white/10 text-xs py-2 pl-9 pr-8 rounded-xl focus:outline-none focus:border-[#C5A059] focus:bg-[#1E1E1E] text-white transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-[10px] font-mono text-white/40 hover:text-white cursor-pointer active:scale-95"
            >
              Esc
            </button>
          )}

          {/* Mobile Real-time suggestions dropdown */}
          {mobileFocused && trimmedQuery && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
            <div 
              className="absolute top-full left-0 right-0 mt-2 bg-[#0E0E0E]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left py-2 max-h-80 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.categories.length > 0 && (
                <div className="px-3 py-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059]/80 uppercase">Matching Categories</span>
                  <div className="mt-1 space-y-0.5">
                    {suggestions.categories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(cat);
                          setActiveView("shop");
                          setMobileFocused(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/[0.04] hover:text-[#C5A059] transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        <span>{cat}</span>
                        <span className="text-[10px] font-mono text-white/30">Category</span>
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
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#C5A059]/80 uppercase">Matching Products</span>
                  <div className="mt-1.5 space-y-1">
                    {suggestions.products.map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedProductId(prod.id);
                          setActiveView("product-details");
                          setMobileFocused(false);
                        }}
                        className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-8 h-8 rounded-md object-cover bg-white/5 shrink-0"
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

      {/* Mobile Drawer Slide-down Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden bg-[#0A0A0A] border-b border-white/10 overflow-hidden text-left"
          >
            <div className="p-4 space-y-4">
              
              {/* Profile card if authenticated */}
              {user && (
                <div className="flex items-center gap-3.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User profile" 
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-xl flex items-center justify-center font-bold text-sm">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white leading-tight truncate">{user.displayName}</p>
                    <p className="text-[10px] font-mono text-white/40 truncate">{user.email}</p>
                    {userProfile?.role && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono rounded bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                        {userProfile.role.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setActiveView("home"); setSearchQuery(""); setMobileMenuOpen(false); }}
                  className={`py-3 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 ${
                    activeView === "home"
                      ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                      : "bg-white/[0.01] text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => { setActiveView("shop"); setSearchQuery(""); setMobileMenuOpen(false); }}
                  className={`py-3 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 ${
                    activeView === "shop"
                      ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                      : "bg-white/[0.01] text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop</span>
                </button>

                <button
                  onClick={() => { setActiveView("news"); setSearchQuery(""); setMobileMenuOpen(false); }}
                  className={`py-3 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1.5 ${
                    activeView === "news"
                      ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/35"
                      : "bg-white/[0.01] text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>News</span>
                </button>
              </div>

              {/* Portal specific routes for mobile */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                {user ? (
                  <>
                    {userProfile?.role === "admin" && (
                      <button
                        onClick={() => { setActiveView("admin-dashboard"); setMobileMenuOpen(false); }}
                        className="w-full text-left py-2.5 px-3.5 rounded-xl bg-[#C5A059]/5 hover:bg-[#C5A059]/10 border border-[#C5A059]/25 text-[#C5A059] text-xs font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Go to Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setActiveView("client-dashboard"); setMobileMenuOpen(false); }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#C5A059]" />
                      <span>Client Account / Saved Receipts</span>
                    </button>

                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of System</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { loginWithGoogle(); setMobileMenuOpen(false); }}
                    className="w-full py-3 rounded-xl bg-[#C5A059] text-black font-sans text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer tracking-wider"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>SIGN IN WITH GOOGLE</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
