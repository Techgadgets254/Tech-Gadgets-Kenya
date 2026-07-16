import React, { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Order } from "../types";
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle,
  FileText, 
  Loader2, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { jsPDF } from "jspdf";

interface LiveOrderTrackerProps {
  initialOrderId?: string;
  onNavigateToShop?: () => void;
}

export default function LiveOrderTracker({ initialOrderId = "", onNavigateToShop }: LiveOrderTrackerProps) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-track if an initial Order ID is provided
  useEffect(() => {
    if (initialOrderId) {
      handleTrackOrder(initialOrderId);
    }
  }, [initialOrderId]);

  // Real-time Firestore Sync for the tracked order
  useEffect(() => {
    if (!trackedOrder?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "orders", trackedOrder.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setTrackedOrder({ id: snapshot.id, ...snapshot.data() } as Order);
        }
      },
      (err) => {
        console.error("Error subscribing to tracked order:", err);
      }
    );

    return () => unsubscribe();
  }, [trackedOrder?.id]);

  const handleTrackOrder = async (targetId?: string) => {
    const id = (targetId || orderIdInput).trim();
    if (!id) {
      setErrorMsg("Please enter a valid Order ID to initiate tracking.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setTrackedOrder(null);

    try {
      const docRef = doc(db, "orders", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const orderData = { id: snapshot.id, ...snapshot.data() } as Order;
        setTrackedOrder(orderData);
      } else {
        setErrorMsg(`No active order found with Reference ID: "${id}". Please double-check your invoice copy or verify you're signed in to your portal.`);
      }
    } catch (err: any) {
      console.error("Error tracking order:", err);
      setErrorMsg("Unauthorized database access. If this is a private account order, please sign in to view tracking.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "processing" || s === "pending") return 1;
    if (s === "shipped") return 2;
    if (s === "out for delivery" || s === "out_for_delivery") return 3;
    if (s === "delivered") return 4;
    return 1;
  };

  const activeStep = trackedOrder ? getStepNumber(trackedOrder.shippingStatus) : 1;

  const steps = [
    { num: 1, label: "Processing", desc: "Warehouse preparing your package", icon: Package },
    { num: 2, label: "Shipped", desc: "Left our Kenyatta Avenue Depot", icon: Truck },
    { num: 3, label: "Out For Delivery", desc: "Express courier dispatcher in transit", icon: MapPin },
    { num: 4, label: "Delivered", desc: "Successfully delivered & verified", icon: CheckCircle }
  ];

  const handleDownloadInvoicePDF = async () => {
    if (!trackedOrder) return;
    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = [197, 160, 89]; // #C5A059 Gold representation
      const brandLogo = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80";

      // 1. Header Background banner
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, 210, 48, "F");

      // 2. Branding Typography
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("TECH SOKONI KENYA", 15, 21);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PREMIUM IMPORTS & ENTERPRISE COMPUTERS", 15, 27);

      doc.setTextColor(160, 160, 160);
      doc.text("Kenyatta Pioneer Building, along Kenyatta Avenue, Shop 514, Nairobi", 15, 33);
      doc.text("Payment Clearance Channel: Lipa Na M-Pesa Till 9309020 | Support: info@techsokoni.co.ke", 15, 38);

      // 3. Tax Invoice Badge
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(145, 12, 50, 10, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TAX INVOICE", 155, 185);
      doc.text("TAX INVOICE", 155, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(`ID: #${trackedOrder.id.substring(0, 8).toUpperCase()}`, 145, 28);
      doc.setFont("Helvetica", "normal");
      doc.text(`Date: ${trackedOrder.createdAt ? new Date(trackedOrder.createdAt).toLocaleDateString() : "Pending"}`, 145, 33);
      doc.text(`Settled Code: ${trackedOrder.receiptNo || "STK PIN APPROVED"}`, 145, 38);
      doc.setFont("Helvetica", "bold");
      doc.text(`Payment: ${trackedOrder.paymentStatus ? trackedOrder.paymentStatus.toUpperCase() : "PENDING"}`, 145, 43);

      // 4. Billed Recipient & Delivery Details
      doc.setTextColor(40, 40, 40);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("BILLED RECIPIENT", 15, 64);
      doc.text("DELIVERY LOGISTIC CHANNEL", 112, 64);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Customer: ${trackedOrder.customerName}`, 15, 70);
      doc.text(`Email Address: ${trackedOrder.customerEmail}`, 15, 75);
      doc.text(`Phone Contact: ${trackedOrder.customerPhone}`, 15, 80);

      let wrappedAddress = doc.splitTextToSize(trackedOrder.shippingAddress || "Nairobi CBD Delivery Counter", 82);
      doc.text(wrappedAddress, 112, 70);

      // 5. Table Header lines
      let currentY = 94;
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
      (trackedOrder.items || []).forEach((item) => {
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
      doc.setTextColor(79, 158, 49); // M-Pesa green representation
      doc.text("Secure M-Pesa Live Reconciliation Badge", 20, currentY + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Billing Contact: +${trackedOrder.mpesaPhone}`, 20, currentY + 11);
      if (trackedOrder.receiptNo) {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 15, 15);
        doc.text(`Official Receipt ID: ${trackedOrder.receiptNo}`, 20, currentY + 15);
      }
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Digital Transaction secure instant clearing system", 20, currentY + 19);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Ledger Subtotal:", 115, currentY + 7);
      doc.text("Local Delivery Fees:", 115, currentY + 12);
      doc.text("Paid Total Amount:", 115, currentY + 18);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(`KES ${Number(trackedOrder.totalAmount).toLocaleString()}`, 165, currentY + 7);
      doc.text("KES 0 (FREE)", 165, currentY + 12);
      
      doc.setTextColor(197, 160, 89);
      doc.setFontSize(10);
      doc.text(`KES ${Number(trackedOrder.totalAmount).toLocaleString()}`, 165, currentY + 18);

      // 8. Signature Bottom row
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(7.5);
      doc.text("This transaction copy has been verified electronically. No physical stamp required.", 105, 275, { align: "center" });
      doc.text("Tech Sokoni Kenya | East Africa Premium Electronics Importers", 105, 279, { align: "center" });

      doc.save(`Tech_Sokoni_Kenya_Invoice_${trackedOrder.id.substring(0, 8)}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="live-tracking-section" className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C5A059] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping" />
            Consignment Tracking Station
          </span>
          <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-white">Live Order Tracking</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono">
          <span>Server: active-live-feed</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5 mb-6">
        <p className="text-white/60 text-xs mb-3 font-sans leading-relaxed">
          Input your alphanumeric invoice transaction reference code or order key to query real-time transit status, courier positions, and official eTIMS receipts.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleTrackOrder();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. ord_283928198"
              className="w-full bg-[#030303] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-mono focus:border-[#C5A059]/40 focus:outline-hidden focus:ring-1 focus:ring-[#C5A059]/10"
            />
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={isLoading || !orderIdInput.trim()}
            className="bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:bg-[#C5A059]/40 text-black font-sans font-bold px-6 py-3 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Searching Node...</span>
              </>
            ) : (
              <>
                <span>Search Reference</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {trackedOrder ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs font-mono">
            <div>
              <span className="text-white/30 block text-[9px] uppercase tracking-wider mb-0.5">Order Identity</span>
              <span className="text-white font-bold">#{trackedOrder.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-white/30 block text-[9px] uppercase tracking-wider mb-0.5">Dispatched Recipient</span>
              <span className="text-white font-bold truncate block">{trackedOrder.customerName}</span>
            </div>
            <div>
              <span className="text-white/30 block text-[9px] uppercase tracking-wider mb-0.5">Payment Method</span>
              <span className="text-emerald-400 font-bold uppercase">{trackedOrder.paymentProvider || "M-Pesa"}</span>
            </div>
            <div>
              <span className="text-white/30 block text-[9px] uppercase tracking-wider mb-0.5">Total Valuation</span>
              <span className="text-[#C5A059] font-bold">KES {trackedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Graphical Progress Bar Timeline */}
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 relative">
            <h3 className="font-sans font-semibold text-xs text-white/50 mb-6 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              Fulfillment pipeline status
            </h3>

            {/* Horizontal Timeline on desktop, vertical on mobile */}
            <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-white/5 z-0">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
                />
              </div>

              {steps.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = activeStep >= step.num;
                const isCurrent = activeStep === step.num;

                return (
                  <div key={step.num} className="flex md:flex-col items-center gap-4 md:text-center flex-1 z-10">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                        isCompleted 
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5"
                          : "bg-[#0A0A0A] border-white/10 text-white/20"
                      } ${isCurrent ? "ring-2 ring-emerald-500/40 animate-pulse bg-emerald-500/20 text-emerald-400 border-emerald-500" : ""}`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 md:space-y-0.5 text-left md:text-center">
                      <h4 className={`text-xs font-bold font-sans ${isCompleted ? "text-white" : "text-white/30"}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-white/40 leading-normal max-w-xs md:max-w-[130px] mx-auto font-sans">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Action Drawer */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-5">
              <h4 className="font-sans font-semibold text-xs text-white/50 uppercase tracking-widest mb-3.5">
                Itemized Manifest
              </h4>
              <div className="divide-y divide-white/5 space-y-3.5">
                {(trackedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex gap-3.5 items-center pt-3.5 first:pt-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-white/5 border border-white/15" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-[#C5A059] uppercase block">{item.brand}</span>
                      <h5 className="font-sans font-semibold text-xs text-white truncate">{item.name}</h5>
                    </div>
                    <div className="text-right font-mono text-xs text-white/80">
                      <span>{item.quantity} x KES {item.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-5">
              <div>
                <h4 className="font-sans font-semibold text-xs text-white/50 uppercase tracking-widest mb-3.5">
                  Action Panel
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Transit Status:</span>
                    <span className="font-mono text-emerald-400 font-bold uppercase">{trackedOrder.shippingStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Settlement Status:</span>
                    <span className={`font-mono font-bold uppercase ${trackedOrder.paymentStatus === "Paid" ? "text-emerald-400" : "text-amber-400"}`}>
                      {trackedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Recipient Contact:</span>
                    <span className="font-mono text-white/80">{trackedOrder.customerPhone}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadInvoicePDF}
                disabled={isDownloading}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/25 text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Reconciling PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-white" />
                    <span>Download eTIMS Tax Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-white/30 text-xs">
            <Package className="w-8 h-8 text-white/10 mx-auto mb-2.5" />
            <p>No active order selection loaded. Enter your Order ID to initiate real-time transit telemetry.</p>
          </div>
        )
      )}
    </div>
  );
}
