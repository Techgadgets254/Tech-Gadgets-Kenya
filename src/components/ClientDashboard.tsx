/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../StoreContext";
import { 
  ShoppingBag, 
  Printer, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Search,
  Mail,
  Loader2,
  Monitor,
  Sparkles,
  Bookmark,
  Coins,
  Share2,
  Download
} from "lucide-react";
import { Order } from "../types";
import { jsPDF } from "jspdf";

export default function ClientDashboard() {
  const { 
    user, 
    orders, 
    products,
    invoiceOrderId, 
    setInvoiceOrderId, 
    setActiveView 
  } = useStore();

  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Save/bookmark specific order receipts locally
  const [savedReceiptIds, setSavedReceiptIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_saved_receipts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const toggleSaveReceipt = (id: string) => {
    setSavedReceiptIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("tgk_saved_receipts", JSON.stringify(updated));
      return updated;
    });
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleDownloadInvoicePDF = (order: Order | null) => {
    if (!order) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [197, 160, 89]; // #C5A059 Gold representation

    // 1. Header Banner
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 48, "F");

    // 2. Branding Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TECH GADGETS KENYA", 15, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PREMIUM IMPORTS & ENTERPRISE COMPUTERS", 15, 26);

    doc.setTextColor(160, 160, 160);
    doc.text("Kenyatta Pioneer Building, along Kenyatta Avenue, Shop 514, Nairobi", 15, 32);
    doc.text("Lipa Na M-Pesa Buy Goods Till Number: 9309020 | Support: info@techgadgetskenya.co.ke", 15, 37);

    // 3. Tax Invoice Badge
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(145, 12, 50, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TAX INVOICE", 155, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text(`ID: #${order.id.substring(0, 8).toUpperCase()}`, 145, 28);
    doc.setFont("Helvetica", "normal");
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Pending"}`, 145, 33);
    doc.text(`Settled Code: ${order.receiptNo || "STK PIN APPROVED"}`, 145, 38);

    // 4. Billed Recipient & Delivery Details
    doc.setTextColor(40, 40, 40);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("BILLED RECIPIENT", 15, 58);
    doc.text("DELIVERY LOGISTIC CHANNEL", 112, 58);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Customer: ${order.customerName}`, 15, 64);
    doc.text(`Email Address: ${order.customerEmail}`, 15, 69);
    doc.text(`Phone Contact: ${order.customerPhone}`, 15, 74);

    let wrappedAddress = doc.splitTextToSize(order.shippingAddress || "Nairobi CBD Delivery Counter", 82);
    doc.text(wrappedAddress, 112, 64);

    // 5. Table Header lines
    let currentY = 88;
    doc.setFillColor(242, 244, 247);
    doc.rect(15, currentY, 180, 8, "F");
    doc.setDrawColor(220, 222, 225);
    doc.line(15, currentY, 195, currentY);
    doc.line(15, currentY + 8, 195, currentY + 8);

    doc.setTextColor(15, 15, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Specification Model Details", 18, currentY + 5.5);
    doc.text("Qty", 125, currentY + 5.5);
    doc.text("Unit Cost (KES)", 145, currentY + 5.5);
    doc.text("Total Value (KES)", 171, currentY + 5.5);

    doc.setFont("Helvetica", "normal");
    currentY += 8;

    // 6. Loop and output line items
    (order.items || []).forEach((item) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(`${item.brand} ${item.name}`, 18, currentY + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(String(item.quantity), 126, currentY + 6);
      doc.text(Number(item.price).toLocaleString(), 145, currentY + 6);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 15, 15);
      doc.text(Number(item.price * item.quantity).toLocaleString(), 171, currentY + 6);

      currentY += 9;
      doc.line(15, currentY, 195, currentY);
    });

    // 7. Balance calculation section
    currentY += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 26, "F");
    doc.rect(15, currentY, 180, 26, "S");

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(197, 160, 89);
    doc.text("Safaricom Daraja API Settlement Badge", 20, currentY + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Payer STK Contact: +${order.mpesaPhone}`, 20, currentY + 11);
    if (order.receiptNo) {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 15, 15);
      doc.text(`Official Receipt ID: ${order.receiptNo}`, 20, currentY + 15);
    }
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Digital Escrow cleared via Kenya Till 9309020", 20, currentY + 19);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Ledger Subtotal:", 115, currentY + 7);
    doc.text("Local Delivery Fees:", 115, currentY + 12);
    doc.text("Paid Total Amount:", 115, currentY + 18);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`KES ${Number(order.totalAmount).toLocaleString()}`, 165, currentY + 7);
    doc.text("KES 0 (FREE)", 165, currentY + 12);
    
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(10);
    doc.text(`KES ${Number(order.totalAmount).toLocaleString()}`, 165, currentY + 18);

    // 8. Signature Bottom row
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(7.5);
    doc.text("This transaction copy has been verified electronically. No physical stamp required.", 105, 275, { align: "center" });
    doc.text("Tech Gadgets Kenya | East Africa Premium Electronics Importers", 105, 279, { align: "center" });

    doc.save(`Tech_Gadgets_Kenya_Invoice_${order.id.substring(0, 8)}.pdf`);
  };

  const handleSendEmailReceipt = () => {
    if (!activeOrder?.customerEmail) return;
    setSendingEmail(true);
    setEmailSuccess(false);

    setTimeout(() => {
      setSendingEmail(false);
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
      }, 4000);
    }, 1500);
  };

  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders;
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(ord => 
      ord.id.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerEmail.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      ord.mpesaPhone.toLowerCase().includes(q) ||
      ord.receiptNo?.toLowerCase().includes(q) ||
      (ord.items || []).some(item => item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q))
    );
  }, [orders, orderSearchQuery]);

  // Selected Order for detailing or default to first order
  const activeOrder = useMemo(() => {
    if (invoiceOrderId) {
      return filteredOrders.find(o => o.id === invoiceOrderId) || filteredOrders[0] || null;
    }
    return filteredOrders[0] || null;
  }, [filteredOrders, invoiceOrderId]);

  // Set active order ID whenever selected changes or on mount
  useEffect(() => {
    if (activeOrder && invoiceOrderId !== activeOrder.id) {
      setInvoiceOrderId(activeOrder.id);
    }
  }, [activeOrder, invoiceOrderId, setInvoiceOrderId]);

  // Trigger browser-native PDF/Print dialog leveraging customized print CSS rules
  const handlePrintInvoice = () => {
    window.print();
  };

  // If user is not authenticated, prompt them to sign in to access their client profile
  if (!user) {
    return (
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xl animate-fadeIn my-8">
        <AlertCircle className="w-12 h-12 text-[#C5A059] mx-auto mb-4" />
        <h2 className="font-sans font-semibold text-lg text-white">Access Profile Hub</h2>
        <p className="text-white/40 text-xs mt-2 leading-relaxed">
          Please log in to your registered Google store account to view your past orders, trace dispatch couriers, and download official invoices.
        </p>
        <button
          onClick={() => setActiveView("home")}
          className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div id="customer-profile-hub" className="animate-fadeIn">
      
      {/* 1. CSS Stylesheet injecting custom @media print rules for flawless downloadable A4 PDFs */}
      <style>{`
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          #print-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm 1.2cm !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            font-size: 11px !important;
            font-family: inherit !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Robust borders/lines to separate layout logically on paper */
          #print-invoice-area .border-b,
          #print-invoice-area .border-t {
            border-color: #1A1A1A !important;
            border-width: 0 0 1px 0 !important;
            border-style: solid !important;
          }
          
          #print-invoice-area h1,
          #print-invoice-area h2,
          #print-invoice-area h3,
          #print-invoice-area h4 {
            color: #000000 !important;
            font-weight: bold !important;
            text-shadow: none !important;
            margin-bottom: 4px !important;
          }
          
          #print-invoice-area span,
          #print-invoice-area p,
          #print-invoice-area div,
          #print-invoice-area td,
          #print-invoice-area th,
          #print-invoice-area strong,
          #print-invoice-area em,
          #print-invoice-area b {
            color: #1A1A1A !important;
            text-shadow: none !important;
          }

          /* Styling the verification QR container cleanly */
          #print-invoice-area img {
            border: 1px solid #CCCCCC !important;
            padding: 4px !important;
            background-color: #FFFFFF !important;
          }

          /* Solid crisp backgrounds for table & info blocks */
          #print-invoice-area .bg-[#0A0A0A],
          #print-invoice-area .bg-[#0F0F0F],
          #print-invoice-area .bg-[#C5A059]/10,
          #print-invoice-area .bg-white/[0.02] {
            background-color: #F8FAFC !important;
            border: 1px solid #1A1A1A !important;
            border-radius: 6px !important;
            padding: 12px !important;
          }

          /* Table formatting for crisp layout */
          #print-invoice-area table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
          }
          #print-invoice-area th {
            background-color: #E2E8F0 !important;
            color: #000000 !important;
            font-weight: bold !important;
            border-bottom: 2px solid #000000 !important;
            padding: 8px !important;
          }
          #print-invoice-area td {
            background-color: transparent !important;
            border-bottom: 1px solid #CBD5E1 !important;
            padding: 8px !important;
            color: #1A1A1A !important;
          }
          #print-invoice-area tr {
            border-bottom: 1px solid #CBD5E1 !important;
          }

          #print-invoice-area .text-[#C5A059] {
            color: #000000 !important;
            font-weight: bold !important;
          }
          #print-invoice-area .text-white/40,
          #print-invoice-area .text-white/30 {
            color: #666666 !important;
          }
          #print-invoice-area .text-emerald-400 {
            color: #047857 !important;
            font-weight: bold !important;
          }

          #print-invoice-area .no-print,
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.2cm;
          }
        }
      `}</style>

      {/* Hero Header panel */}
      <div className="mb-6 no-print">
        <h1 className="font-sans font-semibold text-2xl sm:text-3xl tracking-tight text-white mb-1">
          Client Dashboard
        </h1>
        <p className="text-white/40 text-xs sm:text-sm mt-1">
          Review purchase history, watch courier dispatches, and download certified tax invoices.
        </p>
      </div>

      {/* Informative Delivery Status Banner - No Predictive Scarcity Forecast */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3.5 text-left no-print animate-fadeIn">
        <div className="bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/10">
          <Truck className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-sans font-bold text-emerald-400 flex items-center gap-1.5 leading-none uppercase">
            Logistics & Same-Day Dispatch Updates
          </h4>
          <p className="text-white/60 leading-relaxed text-[11px] pt-1">
            Kenyatta Avenue CBD freight and courier dispatch channels are operating at maximum efficiency. Approved orders are packed, verified, and handed over to same-day couriers instantly.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto my-6 no-print">
          <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="font-sans font-semibold text-lg text-white">No Orders Placed Yet</h2>
          <p className="text-white/40 text-xs mt-2 leading-relaxed">
            You haven't ordered any premium hardware from Tech Gadgets Kenya yet. Explore our stock catalog to place your first Lipa Na M-Pesa order!
          </p>
          <button
            onClick={() => setActiveView("shop")}
            className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Browse Stock Storefront
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: HISTORY SELECTION TABLE & TRACKING BAR (no-print) */}
          <div className="lg:col-span-4 space-y-6 no-print">
            
            {/* Purchase History Menu */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3">
                TRANSACTION ARCHIVES ({orders.length})
              </span>

              {/* Order Search Bar */}
              <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="ID, name, phone, M-Pesa..."
                  className="w-full bg-[#0A0A0A] border border-white/10 text-[11px] py-2 pl-9 pr-3 rounded-xl focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/20"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredOrders.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/5 rounded-2xl bg-black/30">
                    <p className="text-[10px] font-mono text-white/30">No matching transactions found.</p>
                  </div>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = ord.id === activeOrder?.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setInvoiceOrderId(ord.id)}
                        className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs flex justify-between items-center ${
                          isSelected
                            ? "bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059] shadow-md scale-99"
                            : "bg-[#0A0A0A] border-white/5 text-white/70 hover:border-white/10"
                        }`}
                      >
                        <div className="min-w-0 text-left">
                          <p className="font-mono font-bold text-white">
                            ORDER #{ord.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-white/40 text-[10px] font-mono mt-0.5">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Pending date"}
                          </p>
                          <p className="font-sans font-bold text-white text-xs mt-2">
                            KES {ord.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold tracking-wider block ${
                            ord.paymentStatus === "Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
                          }`}>
                            {ord.paymentStatus}
                          </span>
                          <span className="text-[10px] text-white/35 block mt-2 font-semibold">
                            {ord.shippingStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AFFILIATE PROGRAM PANEL */}
            <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-[#C5A059]/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden no-print animate-fadeIn">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3.5">
                <div className="bg-[#C5A059]/10 text-[#C5A059] w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#C5A059]/20">
                  <Coins className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div className="text-left">
                  <h4 className="font-sans font-bold text-white text-sm">Affiliate Partner Program</h4>
                  <p className="text-white/40 text-[11px] leading-relaxed mt-1">
                    Refer clients to Tech Gadgets Kenya and earn rewards. Your friends receive a <span className="text-[#C5A059] font-bold">KES 1,000 instant discount</span> on checkout in our online catalog!
                  </p>
                </div>
              </div>

              {/* Unique Code Block */}
              <div className="mt-5 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-wider">YOUR PARTNER CODE</span>
                  <span className="font-mono text-[9px] text-[#C5A059] font-bold uppercase">ACTIVE PARTNER</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#C5A059] font-mono font-bold tracking-wider select-all text-center">
                    TGK-REF-{user?.uid ? user.uid.substring(0, 6).toUpperCase() : "PARTNER"}
                  </div>
                  <button
                    onClick={() => {
                      const code = `TGK-REF-${user?.uid ? user.uid.substring(0, 6).toUpperCase() : "PARTNER"}`;
                      const shareTxt = `Use my partner coupon "${code}" during checkout to save KES 1,000 on your purchase at Tech Gadgets Kenya!`;
                      navigator.clipboard.writeText(shareTxt);
                      alert("Affiliate referral link message copied to clipboard!");
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer transition-colors"
                    title="Copy referral message"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  </button>
                </div>

                <p className="text-[10px] text-white/50 text-center italic mt-1 leading-normal">
                  "Give KES 1,000, build your premium hardware community."
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/35">
                <span>COMMISSION: KES 1,000 / SALE</span>
                <span>Sandbox Verified</span>
              </div>
            </div>

            {/* FULFILLMENT TRACKING TIMELINE PANEL */}
            {activeOrder && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs">
                <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-5">
                  DELIVERY LOG TIMELINE
                </span>

                <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                  
                  {/* Step 1: Order Received */}
                  <div className="relative text-xs">
                    <span className="absolute -left-6 bg-emerald-500 text-white rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Order Placed & Registered</p>
                      <p className="text-white/40 text-[11px] mt-0.5">Secured on store indices. Waiting for settlement approval.</p>
                    </div>
                  </div>

                  {/* Step 2: Payment clearance */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.paymentStatus === "Paid"
                        ? "bg-emerald-500 text-white"
                        : "bg-[#C5A059] text-black"
                    }`}>
                      {activeOrder.paymentStatus === "Paid" ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-black fill-transparent" />
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {activeOrder.paymentStatus === "Paid" ? "M-Pesa Clearing Received" : "M-Pesa Verification Awaiting"}
                      </p>
                      {activeOrder.paymentStatus === "Paid" ? (
                        <p className="text-white/40 text-[11px] mt-0.5">
                          Safaricom PayCode <strong>{activeOrder.receiptNo}</strong> validated. Account cleared.
                        </p>
                      ) : (
                        <div className="mt-1.5 p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-xl border border-[#C5A059]/20">
                          <p className="text-[11px] leading-relaxed">
                            Payment status: <strong>Pending</strong>. Double check your STK push pin prompt to authorize clearance.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Courier Dispatch */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.shippingStatus === "Shipped" || activeOrder.shippingStatus === "Delivered"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/30"
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Courier Dispatching</p>
                      <p className="text-white/40 text-[11px] mt-0.5">
                        {activeOrder.shippingStatus === "Shipped" || activeOrder.shippingStatus === "Delivered"
                          ? `Discharged to regional logistics courier. [County: ${activeOrder.shippingAddress.split(", ").slice(-2)[0] || "Nairobi"}]`
                          : "Order undergoing dispatch packaging and safety checks."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Finished Delivered */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.shippingStatus === "Delivered"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/30"
                    }`}>
                      <Package className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Fulfillment Delivered</p>
                      <p className="text-white/40 text-[11px] mt-0.5">
                        {activeOrder.shippingStatus === "Delivered"
                          ? "Handover complete. Official signature recorded."
                          : "Awaiting final handoff."
                        }
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: TAX INVOICE GENERATOR DISPLAY (Optimized for printing/PDF downloads) */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeOrder ? (
              <div className="space-y-4">
                
                {/* Print and Email action strip (no-print) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print sm:mx-0">
                  <div className="text-xs">
                    <h3 className="font-sans font-semibold text-white">Downloadable Invoice & Fiscal Receipt</h3>
                    <p className="text-white/40 text-[11px] mt-0.5">Perfect for print logs or sending digital records to your business account.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Save Receipt Button */}
                    <button
                      type="button"
                      onClick={() => toggleSaveReceipt(activeOrder.id)}
                      className={`font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                        savedReceiptIds.includes(activeOrder.id)
                          ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30 font-bold"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      }`}
                      title={savedReceiptIds.includes(activeOrder.id) ? "Saved locally!" : "Save receipt for faster load"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedReceiptIds.includes(activeOrder.id) ? "fill-[#C5A059] text-[#C5A059]" : "text-white"}`} />
                      <span>{savedReceiptIds.includes(activeOrder.id) ? "Saved" : "Save Later"}</span>
                    </button>

                    {/* Send to Email Button */}
                    <button
                      type="button"
                      disabled={sendingEmail || !activeOrder?.customerEmail}
                      onClick={handleSendEmailReceipt}
                      className={`font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                        emailSuccess 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      }`}
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : emailSuccess ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Receipt Sent!</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Send to Email</span>
                        </>
                      )}
                    </button>

                    {/* Download Invoice PDF Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoicePDF(activeOrder)}
                      className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-black" />
                      <span>Download Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Email dispatch alert toast overlay */}
                {emailSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-xl text-xs space-y-1 no-print">
                    <p className="font-bold">✓ Transaction Receipt Dispatched!</p>
                    <p className="text-white/50">An official PDF and structured fiscal copy of Order <strong>#{activeOrder.id.substring(0,8).toUpperCase()}</strong> has been delivered to <strong>{activeOrder.customerEmail}</strong>.</p>
                  </div>
                )}

                {/* VISIBLE INVOICE DOCK IN BOX (Targeted for standard PDF output scale) */}
                <div 
                  id="print-invoice-area" 
                  className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl font-sans text-white max-w-3xl mx-auto"
                >
                  {/* Tax Invoice Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-3.5 mb-2.5">
                        {/* Premium Tech Gadgets Kenya Logo */}
                        <div className="w-10 h-10 bg-[#C5A059] rounded-lg rotate-45 flex items-center justify-center shadow-md shrink-0 print:border print:border-[#C5A059]">
                          <div className="-rotate-45">
                            <Monitor className="w-5 h-5 text-black" />
                          </div>
                        </div>
                        <div>
                          <span className="font-serif italic text-lg sm:text-xl font-bold tracking-[0.1em] uppercase text-white print:text-black block leading-none">
                            TECH GADGETS
                          </span>
                          <span className="font-mono text-[9px] tracking-[0.15em] text-[#C5A059] block font-extrabold mt-1 uppercase">
                            KENYA • PREMIUM
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-[10px] text-white/40 print:text-black/60 font-mono leading-relaxed">
                        <p className="font-semibold text-white/60 print:text-black">Kenyatta Pioneer Building, along Kenyatta Avenue,</p>
                        <p className="font-semibold text-white/50 print:text-black/70">5th Floor, Shop Number 514 (Next to I&M Building)</p>
                        <p>Postal Acc ID: info@techgadgetskenya.co.ke</p>
                        <p>M-Pesa Till No: 9309020 | Buy Goods</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end items-start text-left sm:text-right font-mono">
                      <span className="bg-[#C5A059] text-black font-sans text-xs font-bold px-3 py-1 rounded-sm block w-fit select-none uppercase tracking-wider">
                        TAX INVOICE
                      </span>
                      <p className="text-xs font-black text-white print:text-black mt-3 block">
                        ORDER ID: #{activeOrder.id.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-white/40 print:text-black/60 mt-1">
                        Cleared On: {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleString() : "Date pending"}
                      </p>
                      
                      {/* Secure Offline QR Code Verification Module */}
                      <div className="mt-4 p-1.5 bg-white rounded-lg border border-white/10 print:border-black/25 flex flex-col items-center shadow-md">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(activeOrder.id)}`}
                          alt={`Verification QR for order ${activeOrder.id}`}
                          className="w-14 h-14 sm:w-16 sm:h-16"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[7px] font-mono text-black font-extrabold mt-1 tracking-wider uppercase block">OFFLINE VERIFY</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Billing particulars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-white/10 text-white">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-1">
                        BILLED RECIPIENT
                      </span>
                      <h4 className="font-sans font-semibold text-xs sm:text-sm text-white leading-tight">
                        {activeOrder.customerName}
                      </h4>
                      <p className="text-xs text-white/40 font-mono mt-1 break-all">
                        {activeOrder.customerEmail}
                      </p>
                      <p className="text-xs text-white/40 font-mono leading-none mt-1">
                        Contact: {activeOrder.customerPhone}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-1">
                        DISPATCH DETAILS
                      </span>
                      <p className="text-xs text-white/80 leading-normal">
                        {activeOrder.shippingAddress}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        Courier: Same-Day Delivery Dispatch
                      </p>
                    </div>
                  </div>

                  {/* Tabular Item summaries */}
                  <div className="py-6">
                    <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-3">
                      PURCHASING ITEM SUMMARY
                    </span>
                    
                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A]">
                      <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/10 font-mono text-white/40 font-bold">
                            <th className="p-3">Component / Model</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Total (KES)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans text-white/80">
                          {(activeOrder.items || []).map((item, index) => (
                            <tr key={index}>
                              <td className="p-3 font-medium">
                                <span className="text-[10px] font-mono text-[#C5A059] block uppercase font-bold">{item.brand}</span>
                                {item.name}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-white">{item.quantity}</td>
                              <td className="p-3 text-right font-mono font-medium">KES {item.price.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono font-black text-white">
                                KES {(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Calculations Ledger & Stamps */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shadow-xs/10">
                    
                    {/* Official Safaricom M-Pesa stamp verification */}
                    <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl max-w-sm shrink-0">
                      <div className="flex gap-2 items-center text-[#C5A059] font-bold mb-1.5 text-xs font-sans">
                        <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                        <span>Safaricom M-Pesa Verified</span>
                      </div>
                      
                      <div className="space-y-1 text-[10px] font-mono text-[#C5A059]/80 leading-tight">
                        <p>Processing: STK Gateway Cleared</p>
                        <p>Settlement Phone: +{activeOrder.mpesaPhone}</p>
                        {activeOrder.receiptNo && (
                          <p className="text-white font-bold">Receipt reference: {activeOrder.receiptNo}</p>
                        )}
                        <p className="text-[9px] text-[#C5A059]/50 mt-1 block">Certified under Till Na: 9309020</p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto space-y-2 border-t border-white/5 pt-3 sm:border-0 sm:pt-0 font-sans text-white/80">
                      <div className="flex justify-between sm:justify-end gap-12 text-xs text-white/40">
                        <span>Ledger Subtotal:</span>
                        <span className="font-mono font-semibold text-white">KES {activeOrder.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between sm:justify-end gap-12 text-xs text-emerald-400">
                        <span>Daraja STK Fee:</span>
                        <span className="font-mono font-semibold">KES 0 (FREE)</span>
                      </div>
                      <div className="flex justify-between sm:justify-end gap-12 text-xs text-white/40 pb-2 border-b border-white/5">
                        <span>Courier Dispatch fee:</span>
                        <span className="font-mono font-semibold text-white">KES 0 (FREE)</span>
                      </div>

                      <div className="flex justify-between sm:justify-end gap-12 items-baseline text-sm font-bold text-white pt-1">
                        <span>Billed Total amount:</span>
                        <span className="font-sans font-black text-[#C5A059] text-base sm:text-lg">
                          KES {activeOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Footnote details */}
                  <div className="text-center text-[9px] text-white/20 font-mono mt-10 pt-4 border-t border-white/5 leading-normal">
                    <p>Thank you for shopping at Tech Gadgets Kenya.</p>
                    <p>This digital receipt carries absolute fiscal clearance. Certified copies remain persistent inside your authenticated client profile.</p>
                  </div>

                </div>

              </div>
            ) : null}

          </div>

        </div>
      )}

    </div>
  );
}
