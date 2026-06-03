/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { StoreProvider, useStore } from "./StoreContext";
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
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function StoreLayout() {
  const { activeView, authLoading } = useStore();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const seoData = React.useMemo(() => {
    switch (activeView) {
      case "home":
        return {
          title: "Tech Gadgets Kenya | Premium Imports & Hardware",
          description: "Premium laptops, desktops, and phones imported directly to Kenya. Fast, secure Lipa Na M-Pesa checkout with Nairobi CBD same-day dispatch.",
          keywords: "Tech Gadgets Kenya, laptops Nairobi, M-Pesa electronics, refurbished laptops Kenya, Apple MacBook Nairobi"
        };
      case "shop":
        return {
          title: "Browse Stock Storefront | Tech Gadgets Kenya",
          description: "Explore our live stock of high-end business laptops, Intel Core i7 systems, dedicated graphics cards, and enterprise accessories.",
          keywords: "HP EliteBook Nairobi, ThinkPad Kenya, refurbished MacBooks, Buy laptops Kenya"
        };
      case "product-details":
        return {
          title: "Detailed Specifications | Tech Gadgets Kenya",
          description: "Inspect component specifications, live local inventory levels, and configure direct WhatsApp price drop alerts instantly.",
          keywords: "Refurbished specs, laptop hardware configuration, tech price drop alert"
        };
      case "checkout":
        return {
          title: "Secure Lipa Na M-Pesa Checkout | Tech Gadgets Kenya",
          description: "Authorize purchase settlement securely with Safaricom Daraja STK Push pin prompt instantly. Quick regional courier dispatch.",
          keywords: "STK push, pay till number Nairobi, Safaricom Daraja checkout"
        };
      case "client-dashboard":
        return {
          title: "Client Profile Hub | Tech Gadgets Kenya",
          description: "Trace active delivery courier timelines, view transaction history, download tax invoices, and retrieve partner affiliate codes.",
          keywords: "Tech Gadgets invoice download, Nairobi county shipper tracking, Kenya tech partner"
        };
      case "admin-dashboard":
        return {
          title: "Admin Portal Console | Tech Gadgets Kenya",
          description: "Confidential administration console. Manage product assets, bulk ingest inventory CSV, and process customer price drop signals.",
          keywords: "Admin management console, inventory CSV ingestion, Kenya Daraja API"
        };
      case "news":
        return {
          title: "Kenya Technology & Hardware Blog | Tech Gadgets Kenya",
          description: "Inside coverage on global computer imports, KRA customs clearance procedures, and Nairobi hardware price forecasts.",
          keywords: "Kenya tech blogs, Nairobi computers price drop forecasts, customs gadgets Nairobi"
        };
      default:
        return {
          title: "Tech Gadgets Kenya | High-Performance Electronics",
          description: "Premium computer imports, electronics, and accessories along Kenyatta Avenue, Nairobi. Fast Safaricom M-Pesa checkout."
        };
    }
  }, [activeView]);

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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
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

      {/* Persistent Floating WhatsApp Chat Button */}
      <a
        href="https://wa.me/254792620789"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] hover:scale-105 active:scale-95 transition-all p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center group border border-white/10"
        title="Immediate Chat on WhatsApp"
        id="floating-whatsapp-trigger"
      >
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0F0F0F]/95 text-[10px] font-mono font-bold uppercase tracking-wider text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:inline-block">
          Direct WhatsApp Chat
        </span>
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm11.954-20.244c-4.529 0-8.214 3.68-8.217 8.204-.002 1.637.485 3.234 1.411 4.616l.245.365-1.002 3.662 3.75-.983.356.212c1.32.784 2.827 1.197 4.364 1.198l.006.001c4.529 0 8.215-3.68 8.219-8.203.002-2.192-.852-4.253-2.404-5.808C16.915 4.636 14.808 3.757 12.011 3.756zm4.845 10.02c-.266-.134-1.576-.777-1.82-.866-.245-.089-.423-.134-.601.134-.178.266-.69.866-.846 1.043-.156.178-.311.2-.577.066-.266-.134-1.12-.413-2.133-1.317-.789-.704-1.321-1.573-1.476-1.839-.156-.266-.017-.41.117-.543.12-.12.266-.31.4-.466.133-.156.178-.266.266-.443.089-.178.044-.333-.022-.466-.067-.134-.601-1.443-.823-1.976-.216-.52-.439-.443-.601-.451l-.511-.01c-.178 0-.467.067-.71.333-.245.267-.934.91-.934 2.22s.956 2.575 1.089 2.753c.133.178 1.88 2.87 4.554 4.024.637.275 1.134.439 1.522.562.64.203 1.222.174 1.682.105.513-.077 1.576-.644 1.8-.1233.222-.589.222-1.083.156-1.171-.067-.09-.245-.134-.51-.268z" />
        </svg>
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </a>

      {/* 3. Base footer elements */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreLayout />
    </StoreProvider>
  );
}
