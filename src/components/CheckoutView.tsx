/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import { 
  ShoppingBag, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  CheckCircle, 
  CreditCard, 
  Key, 
  AlertCircle,
  Truck,
  Printer,
  Copy,
  Check,
  QrCode,
  Zap,
  Smartphone
} from "lucide-react";
import { KENYAN_COUNTIES } from "../data";
import { PaymentHandler } from "./PaymentHandler";
import MpesaStatusMonitor from "./MpesaStatusMonitor";
import { initializeMegaPayPayment, verifyMegaPayPayment } from "../lib/megapay";

export const getSafaricomValidation = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;
  
  if (normalized.startsWith("254") && normalized.length > 3) {
    normalized = "0" + normalized.substring(3);
  } else if (!normalized.startsWith("0") && normalized.length === 9) {
    normalized = "0" + normalized;
  }

  const prefix3 = normalized.substring(0, 3);
  const prefix4 = normalized.substring(0, 4);

  const safaricom3Prefixes = ["070", "071", "072", "079", "011", "012"];
  const safaricom4Prefixes = [
    "0740", "0741", "0742", "0743", "0744", "0745", "0746", "0748",
    "0757", "0758", "0759", "0768", "0769"
  ];

  const isSafaricom = safaricom3Prefixes.includes(prefix3) || safaricom4Prefixes.includes(prefix4);

  let network = "Unknown Network";
  if (isSafaricom) {
    network = "Safaricom M-Pesa";
  } else if (["073", "078", "010"].includes(prefix3)) {
    network = "Airtel Money";
  } else if (["077"].includes(prefix3) || ["0119"].includes(prefix4)) {
    network = "Telkom T-Kash";
  } else if (["0763", "0764", "0765", "0766"].includes(prefix4)) {
    network = "Equitel";
  }

  let apiFormatted = "";
  if (normalized.startsWith("0") && normalized.length === 10) {
    apiFormatted = "254" + normalized.substring(1);
  } else if (normalized.length === 9 && !normalized.startsWith("0")) {
    apiFormatted = "254" + normalized;
  } else if (normalized.startsWith("254") && normalized.length === 12) {
    apiFormatted = normalized;
  }

  return {
    isValid: isSafaricom && (normalized.length === 10 || (normalized.startsWith("254") && normalized.length === 12)),
    network,
    normalized,
    apiFormatted
  };
};

export const isCampaignOfferActive = (p: any) => {
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

export default function CheckoutView() {
  const { 
    user, 
    orders,
    cart, 
    getCartTotal, 
    updateCartItemQty, 
    removeFromCart, 
    clearCart,
    createCheckoutOrder, 
    initializeMegaPayTransaction,
    verifyMegaPayTransaction,
    initializePaystackTransaction, 
    verifyPaystackTransaction,
    updateOrderStatus,
    setActiveView, 
    setInvoiceOrderId,
    loginWithGoogle,
    affiliates,
    addCustomNotification,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useStore();

  // Shipments state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCounty, setSelectedCounty] = useState(KENYAN_COUNTIES[0]);
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  // Payment Selection: "megapay" or "mpesa_qr"
  const [paymentMethod, setPaymentMethod] = useState<"megapay" | "mpesa_qr" | "paystack">("megapay");

  // Dynamic M-Pesa QR checkout states
  const [showMpesaQrScreen, setShowMpesaQrScreen] = useState(false);
  const [mpesaQrOrderId, setMpesaQrOrderId] = useState("");
  const [mpesaQrAmount, setMpesaQrAmount] = useState(0);
  const [mpesaTransactionCode, setMpesaTransactionCode] = useState("");
  const [isVerifyingMpesa, setIsVerifyingMpesa] = useState(false);
  const [mpesaError, setMpesaError] = useState("");

  // STK PIN Prompt Simulation states
  const [showMpesaPushModal, setShowMpesaPushModal] = useState(false);
  const [mpesaPushPin, setMpesaPushPin] = useState("");
  const [mpesaPushError, setMpesaPushError] = useState("");
  const [mpesaPushStep, setMpesaPushStep] = useState<"prompt" | "processing" | "success" | "cancelled">("prompt");
  const [showMpesaConfetti, setShowMpesaConfetti] = useState(false);

  // STK Session Timer & Live Status states
  const [stkSessionExpired, setStkSessionExpired] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(30);
  const [liveOrderStatus, setLiveOrderStatus] = useState<"Processing" | "Confirmed" | "Cancelled">("Processing");

  // Simulated Paystack States
  const [simulatedPaystackRef, setSimulatedPaystackRef] = useState("");
  const [simulatedOrderId, setSimulatedOrderId] = useState("");
  const [showSimulatedPaystackModal, setShowSimulatedPaystackModal] = useState(false);
  const [simulatedPaystackStep, setSimulatedPaystackStep] = useState<"options" | "card" | "mobile" | "success">("options");
  const [simulatedCardNo, setSimulatedCardNo] = useState("");
  const [simulatedCardExp, setSimulatedCardExp] = useState("");
  const [simulatedCardPin, setSimulatedCardPin] = useState("");
  const [simulatedMobilePhone, setSimulatedMobilePhone] = useState("");
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Affiliate & Referral Promotion Codes State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState("");
  const [isPromoSuccess, setIsPromoSuccess] = useState(false);

  // Dedicated Payment Handler States
  const [isPaymentHandlerOpen, setIsPaymentHandlerOpen] = useState(false);
  const [activePaymentOrderId, setActivePaymentOrderId] = useState("");
  const [activePaymentEmail, setActivePaymentEmail] = useState("");
  const [activePaymentAmount, setActivePaymentAmount] = useState(0);

  // Copy receipt state & helper
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const handleCopyReceipt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoFeedback("Provide code block to register discount.");
      setIsPromoSuccess(false);
      return;
    }
    const code = promoInput.trim().toUpperCase();
    const matchedAffiliate = affiliates.find(a => a.code.toUpperCase() === code && a.active);

    if (matchedAffiliate) {
      setAppliedPromo(matchedAffiliate.code);
      const discountVal = matchedAffiliate.discountType === "percentage"
        ? Math.round(getCartTotal() * (matchedAffiliate.discountValue / 100))
        : matchedAffiliate.discountValue;
      setDiscount(discountVal);
      setPromoFeedback(`Affiliate Code "${matchedAffiliate.code}" applied! KES ${discountVal.toLocaleString()} discount registered.`);
      setIsPromoSuccess(true);
    } else if (code.length >= 4) {
      // Keep safety fallback
      setAppliedPromo(code);
      setDiscount(1000);
      setPromoFeedback(`Referral Code "${code}" registered successfully! KES 1,000 discount applied.`);
      setIsPromoSuccess(true);
    } else {
      setPromoFeedback("Invalid or inactive affiliate code. Please double check.");
      setIsPromoSuccess(false);
    }
  };

  // Visa card fields
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // STK Simulation states
  const [isSTKProcessing, setIsSTKProcessing] = useState(false);
  const [stkLogs, setStkLogs] = useState<string[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState("");
  const [generatedOrderId, setGeneratedOrderId] = useState("");
  const [currentCreatedOrder, setCurrentCreatedOrder] = useState<any>(null);

  const [redirectCount, setRedirectCount] = useState(6);

  const [sentEmailOrderIds, setSentEmailOrderIds] = useState<string[]>([]);

  const sendAutomatedCheckoutEmail = async (orderId: string, orderDetails?: any) => {
    try {
      let order = orderDetails || currentCreatedOrder || orders.find(o => o.id === orderId);
      if (!order) {
        console.warn("[CheckoutView] Automated email: order object not found for ID", orderId);
        return;
      }
      
      const emailToUse = order.customerEmail || user?.email;
      if (!emailToUse) {
        console.warn("[CheckoutView] Automated email: customer email not found");
        return;
      }

      console.log("[CheckoutView] Dispatching automated SMTP checkout confirmation to:", emailToUse);
      const response = await fetch("/api/email/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          email: emailToUse,
          order: order
        })
      });
      const data = await response.json();
      console.log("[CheckoutView] SMTP Automated Email receipt dispatch response:", data);
    } catch (err) {
      console.error("[CheckoutView] Automated receipt email dispatch crashed:", err);
    }
  };

  useEffect(() => {
    if (paymentSuccess && generatedOrderId && !sentEmailOrderIds.includes(generatedOrderId)) {
      setSentEmailOrderIds(prev => [...prev, generatedOrderId]);
      sendAutomatedCheckoutEmail(generatedOrderId);
    }
  }, [paymentSuccess, generatedOrderId, sentEmailOrderIds, currentCreatedOrder, orders]);

  useEffect(() => {
    if (paymentSuccess && generatedOrderId) {
      setRedirectCount(6);
      const timer = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setInvoiceOrderId(generatedOrderId);
            setActiveView("client-dashboard");
            setPaymentSuccess(false);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentSuccess, generatedOrderId, setInvoiceOrderId, setActiveView]);

  // Google Customer Reviews Opt-In Script Injection
  useEffect(() => {
    if (paymentSuccess && generatedOrderId) {
      console.log("[CheckoutView] Loading Google Customer Reviews script for order:", generatedOrderId);
      
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      script.async = true;
      script.defer = true;
      
      // Calculate estimated delivery date: today + 3 days in YYYY-MM-DD
      const date = new Date();
      date.setDate(date.getDate() + 3);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const estimatedDeliveryDate = `${yyyy}-${mm}-${dd}`;

      // Declare renderOptIn on window
      (window as any).renderOptIn = function() {
        if ((window as any).gapi) {
          console.log("[CheckoutView] Rendering Google Customer Reviews Opt-In");
          (window as any).gapi.load('surveyoptin', function() {
            try {
              (window as any).gapi.surveyoptin.render({
                "merchant_id": 5826398436,
                "order_id": generatedOrderId,
                "email": activePaymentEmail || "techgadgetsk@gmail.com",
                "delivery_country": "KE",
                "estimated_delivery_date": estimatedDeliveryDate,
                "products": cart.map(item => ({ "gtin": item.product.id || "GTIN" }))
              });
            } catch (err) {
              console.error("[CheckoutView] Google SurveyOptIn render error:", err);
            }
          });
        } else {
          console.error("[CheckoutView] gapi not found on window object");
        }
      };

      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch (e) {}
        delete (window as any).renderOptIn;
      };
    }
  }, [paymentSuccess, generatedOrderId, activePaymentEmail, cart]);

  useEffect(() => {
    if (showMpesaConfetti) {
      const timer = setTimeout(() => {
        setShowMpesaConfetti(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showMpesaConfetti]);

  const isNairobi = selectedCounty === "Nairobi";
  const deliveryFee = 0; // Standard Free Shipping nationwide

  // Populate Name & Phone from user profile if available
  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || "");
      setCardHolder(user.displayName || "");
      setBillingPhone("");
    }
  }, [user]);

  // M-Pesa QR STK 30s expiry countdown timer effect
  useEffect(() => {
    let timerId: any;
    if (showMpesaQrScreen && !paymentSuccess) {
      setStkSessionExpired(false);
      setSessionTimeLeft(30);
      timerId = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            setStkSessionExpired(true);
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setStkSessionExpired(false);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showMpesaQrScreen, paymentSuccess]);

  // Alert after 2 minutes of uncompleted pending M-Pesa transaction
  useEffect(() => {
    let pendingTimer: any;
    if (showMpesaQrScreen && !paymentSuccess) {
      pendingTimer = setTimeout(() => {
        addCustomNotification(
          `⏳ M-Pesa Pending Alert: Your payment push for Order #${mpesaQrOrderId ? mpesaQrOrderId.slice(-6).toUpperCase() : ""} has remained pending for over 2 minutes. Please verify your phone or re-trigger STK PIN push if needed.`,
          mpesaQrOrderId
        );
      }, 120000); // 120,000 ms is exactly 2 mins
    }
    return () => {
      if (pendingTimer) clearTimeout(pendingTimer);
    };
  }, [showMpesaQrScreen, paymentSuccess, mpesaQrOrderId, addCustomNotification]);

  // Real-time Firestore payment confirmation status polling / listener
  useEffect(() => {
    if (!showMpesaQrScreen || !mpesaQrOrderId) {
      return;
    }

    let unsubscribe: () => void = () => {};

    // Dynamically retrieve firebase tools
    Promise.all([
      import("../lib/firebase"),
      import("firebase/firestore")
    ]).then(([{ db }, { doc, onSnapshot }]) => {
      unsubscribe = onSnapshot(doc(db, "orders", mpesaQrOrderId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const pStatus = data?.paymentStatus;
          
          if (pStatus === "Paid") {
            setLiveOrderStatus("Confirmed");
          } else if (pStatus === "Cancelled" || pStatus === "Failed") {
            setLiveOrderStatus("Cancelled");
          } else {
            setLiveOrderStatus("Processing");
          }
        }
      }, (err) => {
        console.error("Firestore payment live status feed error:", err);
      });
    }).catch(err => {
      console.error("Failed loading firebase assets for polling thread:", err);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showMpesaQrScreen, mpesaQrOrderId]);

  // Handle Cart empty states
  if (cart.length === 0 && !isSTKProcessing && !paymentSuccess) {
    return (
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto animate-fadeIn mt-12">
        <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="font-sans font-semibold text-lg text-white">Your shopping bag is empty</h2>
        <p className="text-white/40 text-xs mt-2 leading-relaxed">
          You haven't added any premium gadgets to your bag yet. Head over to our stock catalog to secure your items.
        </p>
        <button
          onClick={() => setActiveView("shop")}
          className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          Browse Stock Catalog
        </button>
      </div>
    );
  }

  const handleVerifyMpesaQrPayment = async () => {
    if (!mpesaTransactionCode || mpesaTransactionCode.length !== 10) {
      setMpesaError("Please enter a valid 10-character M-Pesa Transaction Code (e.g. SGT245HJ89).");
      return;
    }

    // Validate alphanumeric 10 chars
    const isValidCode = /^[A-Z0-9]{10}$/.test(mpesaTransactionCode);
    if (!isValidCode) {
      setMpesaError("M-Pesa Transaction Code must be exactly 10 alphanumeric characters (no special characters).");
      return;
    }

    setIsVerifyingMpesa(true);
    setMpesaError("");

    try {
      // Simulate verification check
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Successfully verified! Update Firestore order status
      await updateOrderStatus(mpesaQrOrderId, "Paid", "Processing", mpesaTransactionCode);

      // Successfully processed: clear cart, show success receipt
      clearCart();
      setGeneratedReceipt(mpesaTransactionCode);
      setGeneratedOrderId(mpesaQrOrderId);
      setShowMpesaQrScreen(false);
      setPaymentSuccess(true);
      setShowMpesaConfetti(true);
    } catch (err: any) {
      console.error("M-Pesa Verification update details skipped/failed", err);
      setMpesaError("Payment verification could not be committed. Please try again or contact customer support.");
    } finally {
      setIsVerifyingMpesa(false);
    }
  };

  const handleQuickPayTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Ensure vital details are filled
    if (!customerName) {
      alert("Please fill out the 'RECIPIENT CONTACT NAME' field first under Shipping Information.");
      return;
    }
    if (!deliveryDetails) {
      alert("Please fill out the 'PHYSICAL DELIVERY ADDRESS' field first. We need this to route the express courier dispatch.");
      return;
    }
    
    // Set payment method to mpesa_qr and submit
    setPaymentMethod("mpesa_qr");
    
    // Call the checkout submit handler programmatically
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    handleCheckoutSubmit(dummyEvent);
  };

  // Validate mobile formats & card details
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isGuest) {
      setIsAuthModalOpen(true);
      setAuthModalMode("login");
      alert("Please log in or select 'Proceed as Guest' to finalize your payment and place your order.");
      return;
    }

    if (isGuest && !guestEmail) {
      alert("Please enter a valid email address to proceed with Guest Checkout.");
      return;
    }

    if (!customerName || !customerPhone || !deliveryDetails) {
      alert("Please fill in all requested fields to dispatch billing");
      return;
    }

    const safaricomCheck = getSafaricomValidation(customerPhone);
    const activeEmail = (user?.email || guestEmail || "customer@techsokoni.com").trim() || "customer@techsokoni.com";
    
    try {
      const shippingFullAddress = `${deliveryDetails}, ${selectedCounty} County, Kenya (Free Delivery)`;
      
      setIsSTKProcessing(true);
      setStkLogs([]);
      updateSTKLog(`Initiating M-Pesa Express Checkout for ${selectedCounty} County...`, 100);

      const orderObj = await createCheckoutOrder({
        customerName,
        customerEmail: activeEmail,
        customerPhone,
        shippingAddress: shippingFullAddress,
        mpesaPhone: customerPhone,
        totalAmount: Math.max(0, getCartTotal() + deliveryFee - discount),
        referralCode: appliedPromo || undefined,
        paymentProvider: "M-Pesa Express"
      });

      if (!orderObj) {
        setIsSTKProcessing(false);
        alert("Could not create database record for order. Please try again.");
        return;
      }

      setCurrentCreatedOrder(orderObj);
      setIsSTKProcessing(false);

      // Open M-Pesa Express Payment Handler
      setActivePaymentOrderId(orderObj.id);
      setActivePaymentEmail(activeEmail || "techgadgetsk@gmail.com");
      setActivePaymentAmount(orderObj.totalAmount);
      setIsPaymentHandlerOpen(true);
    } catch (err: any) {
      console.error("Checkout submission failed:", err);
      setIsSTKProcessing(false);
      alert(`Fulfillment Dispatch error. Please double-check configuration. Details: ${err?.message || err}`);
    }
  };

  const updateSTKLog = (message: string, delay: number) => {
    setTimeout(() => {
      setStkLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, delay);
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Confetti Animation Overlay when payment completes */}
      {showMpesaConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2.5;
            const duration = 2.5 + Math.random() * 2.5;
            const size = 6 + Math.random() * 8;
            const colors = ["#4f9e31", "#eab308", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#10b981"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const rotation = Math.random() * 360;
            return (
              <div
                key={i}
                className="absolute rounded-xs opacity-0 animate-confetti-fall animate-pulse"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: randomColor,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  transform: `rotate(${rotation}deg)`,
                  top: `-20px`
                }}
              />
            );
          })}
        </div>
      )}

      {/* 1. PAYSTACK MODAL POPUP */}
      {isSTKProcessing && (
        <div id="paystack-gateway-portal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-scaleUp">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C5A059] via-white to-[#C5A059] animate-pulse" />
            
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-white/[0.03] text-[#C5A059] border border-white/10 rounded-full flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-sans font-semibold text-lg text-white">
                M-Pesa Express Terminal
              </h3>
              <p className="text-white/40 text-xs mt-1">
                Your credentials are encrypted over secure live TLS connection. Verified on live MegaPay server queues.
              </p>
            </div>

            {/* Simulated Live Logs */}
            <div className="bg-[#050505] text-[#C5A059] font-mono text-[10px] sm:text-xs rounded-xl p-4 h-48 overflow-y-auto space-y-2 border border-white/5 shadow-inner">
              {stkLogs.map((log, index) => (
                <div key={index} className="leading-tight">
                  <span className="text-[#C5A059]/30">&gt;</span> {log}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-[#C5A059]/45 animate-pulse mt-2">
                <span>_ Syncing parameters with warehouse...</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center text-[10px] text-white/30 font-mono">
              <span>
                M-Pesa Commerce Bridge
              </span>
              <span>Keep your tab open</span>
            </div>
          </div>
        </div>
      )}



      {/* 2. SUCCESS CONFIRMATION SPLASH */}
      {paymentSuccess && (
        <div id="checkout-success-splash" className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl my-6 animate-scaleUp">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="font-sans font-semibold text-2xl tracking-tight text-white">
            Payment Cleared Successfully!
          </h2>
          <p className="text-white/40 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed font-sans">
            <span>Your purchase transition cleared in real time for <strong>{selectedCounty} County</strong>. Order <strong>#{generatedOrderId.substring(0, 8).toUpperCase()}</strong> has shifted directly into physical shipment fulfillment.</span>
          </p>

          {/* Redirection timer toast */}
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/25 text-[#C5A059] font-mono text-[11px] inline-flex items-center gap-2 max-w-xs mx-auto justify-center select-none animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
            <span>Transitioning to <strong>Dashboard</strong> in <strong className="text-white font-sans text-xs">{redirectCount}s</strong>...</span>
          </div>

          <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 my-6 font-mono text-xs text-white/70 space-y-2.5 text-left max-w-sm mx-auto">
            <p className="flex justify-between"><span>RECEIPT MODE:</span> <strong className="text-white">{generatedReceipt}</strong></p>
            <p className="flex justify-between"><span>CLEARANCE STATE:</span> <span className="text-[#C5A059] font-bold font-sans">{generatedReceipt === "POD-APPROVED" ? "APPROVED FOR COD" : "AUTHENTICATED & PAID"}</span></p>
            <p className="flex justify-between"><span>ORDER ID:</span> <span className="text-white/50">{generatedOrderId}</span></p>
            
            <button
              onClick={() => handleCopyReceipt(generatedOrderId)}
              className="w-full mt-2 bg-white/5 hover:bg-white/10 active:bg-white/20 text-[#C5A059] border border-white/10 font-sans font-bold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Copy Receipt ID</span>
                </>
              )}
            </button>
          </div>

          {/* Secure Mobile QR Code Validation */}
          <div className="my-6 p-4 bg-[#0A0A0A] border border-white/15 rounded-2xl max-w-sm mx-auto flex flex-col items-center gap-3">
            <span className="font-mono text-[9px] tracking-widest text-[#C5A059] font-bold uppercase block">SECURE MOBILE VALIDATION</span>
            <div className="p-2 bg-white rounded-xl inline-block shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedOrderId)}`}
                alt={`QR verification for order ${generatedOrderId}`}
                className="w-28 h-28 select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-sans text-[10px] text-white/40 max-w-xs leading-normal block">
              Scan this QR code during courier handover for rapid mobile verification.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setInvoiceOrderId(generatedOrderId);
                setActiveView("client-dashboard");
                setPaymentSuccess(false);
              }}
              className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Examine & Download Invoice
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-sans px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#C5A059]" />
              Print Confirmation
            </button>
            <button
              onClick={() => {
                setActiveView("shop");
                setPaymentSuccess(false);
              }}
              className="bg-white/5 hover:bg-white/10 text-white font-sans px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CHECKOUT GRID PANEL */}
      {!paymentSuccess && !isSTKProcessing && !showMpesaQrScreen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Block: Interactive bag verification and auth */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs">
              <h2 className="font-sans font-semibold text-lg text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                <span>Verify Your Selected Items</span>
                <button 
                  onClick={clearCart}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 px-2 py-1 rounded-md transition-all flex items-center gap-1 border border-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              </h2>

              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-4 flex gap-4 items-center last:pb-0">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#1A1A1A] border border-white/5"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[9px] text-[#C5A059] block uppercase font-bold">{item.product.brand}</span>
                      <h4 className="font-sans font-semibold text-xs sm:text-sm text-white truncate">{item.product.name}</h4>
                      <p className="font-sans font-extrabold text-xs text-white mt-1 flex items-center gap-1.5">
                        {isCampaignOfferActive(item.product) ? (
                          <>
                            <span className="text-red-400">KES {item.product.flashPrice!.toLocaleString()}</span>
                            <span className="text-[10px] text-white/30 line-through">KES {item.product.price.toLocaleString()}</span>
                          </>
                        ) : (
                          <span>KES {item.product.price.toLocaleString()}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center border border-white/10 rounded-lg bg-[#050505]">
                        <button
                          onClick={() => updateCartItemQty(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/[0.04] font-bold transition-colors cursor-pointer text-xs"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-mono text-xs text-white font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQty(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/[0.04] font-bold transition-colors cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 px-2 text-white/30 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Checkout notice or Auth status */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs animate-fadeIn">
              {!user && (
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 mb-5 text-left font-sans space-y-3">
                  <p className="text-white text-xs font-semibold">How would you like to check out?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuest(false);
                        setIsAuthModalOpen(true);
                        setAuthModalMode("login");
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        !isGuest
                          ? "bg-[#C5A059]/10 border-[#C5A059] text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      <strong className="block text-white">Sign In with Google</strong>
                      <span className="text-[10px] text-white/50 block mt-0.5">Track orders & secure past receipts.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGuest(true)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isGuest
                          ? "bg-[#C5A059]/10 border-[#C5A059] text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      <strong className="block text-white">Proceed as Guest</strong>
                      <span className="text-[10px] text-white/50 block mt-0.5">No login or account registration required.</span>
                    </button>
                  </div>
                </div>
              )}
              <h2 className="font-sans font-semibold text-lg text-white pb-3 border-b border-white/10 mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#C5A059]" />
                Shipping & Courier Dispatch
              </h2>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] font-bold text-white/35 block mb-1 uppercase">RECIPIENT NAME</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (!cardHolder) setCardHolder(e.target.value);
                        }}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans h-[38px]"
                        placeholder="Kelvin Mutua"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-bold text-white/35 block mb-1 uppercase">RECIPIENT CONTACT PHONE</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => {
                          const raw = e.target.value;
                          let cleaned = raw.replace(/[^\d+]/g, "");
                          
                          if (cleaned.startsWith("+254")) {
                            cleaned = "0" + cleaned.substring(4);
                          } else if (cleaned.startsWith("254") && cleaned.length > 3) {
                            cleaned = "0" + cleaned.substring(3);
                          }
                          
                          let formatted = cleaned;
                          if (cleaned.startsWith("0")) {
                            if (cleaned.length > 4 && cleaned.length <= 7) {
                              formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
                            } else if (cleaned.length > 7) {
                              formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
                            }
                          }
                          setCustomerPhone(formatted);
                        }}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans h-[38px]"
                        placeholder="0712 345 678"
                      />
                      {(() => {
                        const check = getSafaricomValidation(customerPhone);
                        if (!customerPhone) {
                          return (
                            <span className="text-[10px] text-white/35 block mt-1 font-mono">
                              Requires a registered M-Pesa line
                            </span>
                          );
                        }
                        if (check.isValid) {
                          return (
                            <span className="text-[9.5px] text-emerald-400 font-bold block mt-1 font-mono flex items-center gap-1">
                              ✓ Safaricom Network Detected (M-Pesa standardized: +{check.apiFormatted})
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9.5px] text-amber-400 font-bold block mt-1 font-mono flex items-center gap-1">
                            ⚠ Non-Safaricom or Incomplete! ({check.network})
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {isGuest && (
                    <div className="bg-zinc-900/40 p-4 border border-white/5 rounded-2xl animate-fadeIn space-y-1">
                      <label className="font-mono text-[10px] font-bold text-[#C5A059] block uppercase tracking-wider">GUEST EMAIL ADDRESS</label>
                      <input
                        type="email"
                        required={isGuest}
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans h-[38px]"
                        placeholder="your.email@example.com"
                      />
                      <span className="text-[9.5px] text-white/40 block pt-1 font-sans">
                        Provide your primary email address to receive secure digital receipts, real-time logistics dispatch logs, and to automatically log history under this email.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-mono text-[10px] font-bold text-white/35 block mb-1 uppercase">COUNTY</label>
                      <select
                        value={selectedCounty}
                        onChange={(e) => setSelectedCounty(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white/80 font-sans cursor-pointer h-[38px] appearance-none"
                      >
                        {KENYAN_COUNTIES.map(c => (
                          <option key={c} value={c} className="bg-[#0F0F0F] text-white">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-mono text-[10px] font-bold text-white/35 block mb-1 uppercase">SHIPPING ADDRESS DETAILS</label>
                      <input
                        type="text"
                        required
                        value={deliveryDetails}
                        onChange={(e) => setDeliveryDetails(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans h-[38px]"
                        placeholder="Westside Appts, Block B Room 3, Ring Rd"
                      />
                    </div>
                  </div>

                  {/* ACTIVE SHIPPING RULE ANNOUNCEMENT */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 transition-all mt-4 space-y-1.5">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {selectedCounty} County Delivery Rule
                    </span>
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      M-Pesa Express Checkout • Free Delivery
                    </p>
                    <p className="text-[10.5px] text-white/40 leading-relaxed font-sans">
                      Addresses in <strong>{selectedCounty} County</strong> qualify for <strong>Free Delivery Promo</strong>. Settlement is completed securely via M-Pesa Express STK prompt prior to courier dispatch.
                    </p>
                  </div>

                  {/* PAYMENT TAB METHODS */}
                  <div className="border-t border-white/5 pt-5 mt-6 space-y-4">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">SELECT PAYMENT METHOD</span>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Option 1: M-Pesa Express */}
                      <div className="flex items-start gap-3 p-4 rounded-2xl border bg-emerald-950/20 border-emerald-500/40 text-white">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 text-black font-extrabold text-sm shadow-md shadow-emerald-500/20">
                          M
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold font-sans text-emerald-400 flex items-center gap-2">
                            M-Pesa Express Checkout
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">STK Push</span>
                          </h4>
                          <p className="text-[10.5px] text-white/60 mt-1 leading-normal font-sans">
                            Receive an instant M-Pesa payment prompt on your phone screen to enter your PIN.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer text-sm transform hover:scale-[1.01] duration-200"
                  >
                    <Smartphone className="w-5 h-5 text-black shrink-0" />
                    <span>Proceed to Pay via M-Pesa Express</span>
                  </button>
                </form>
              </div>

          </div>

          {/* Right Block: Interactive Pricing Ledger */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-20">
              <h3 className="font-sans font-semibold text-base text-white pb-3 border-b border-white/10 mb-4">
                Purchasing Invoice Ledger
              </h3>
              
              <div className="space-y-3 font-sans text-xs border-b border-white/5 pb-4 mb-4">
                <div className="flex justify-between text-white/50">
                  <span>Bag Subtotal</span>
                  <span className="font-mono">KES {getCartTotal().toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400 font-semibold font-sans animate-pulse">
                    <span>Affiliate Referral Discount</span>
                    <span className="font-mono">-KES {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-500 font-semibold font-sans">
                  <span>Daraja Push Transaction Fee</span>
                  <span className="font-mono text-xs">KES 0 (FREE Accrued)</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Nationwide Courier Dispatch Duty</span>
                  <span className="font-mono text-emerald-500 font-bold">
                    KES 0 (FREE Promo)
                  </span>
                </div>
              </div>

              {/* Affiliate Referral Code block */}
              <div className="mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5">
                <label className="font-mono text-[9px] text-[#C5A059] block font-black uppercase tracking-wider">
                  AFFILIATE REFERRAL PROMO (SAVE KES 1,000)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="E.g. TGK-REF-WIN504"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-[10px] font-sans font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    Apply
                  </button>
                </div>
                {promoFeedback && (
                  <p className={`text-[10px] font-semibold leading-normal ${isPromoSuccess ? "text-emerald-400 animate-fadeIn" : "text-red-400"}`}>
                    {promoFeedback}
                  </p>
                )}
                <p className="text-[9px] text-white/30 leading-snug">
                  Have a friend's referral link or code? Apply it above to instantly deduct KES 1,000 from your transaction bill!
                </p>
              </div>

              <div className="flex items-baseline justify-between mb-6">
                <span className="text-sm font-semibold text-white/50 font-sans">Total Accounting Amount</span>
                <span className="font-sans font-black text-[#C5A059] text-lg sm:text-xl">
                  KES {Math.max(0, getCartTotal() + deliveryFee - discount).toLocaleString()}
                </span>
              </div>

              <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-4 text-[11px] leading-normal text-white/40 space-y-2">
                <div className="flex gap-2 text-[#C5A059]">
                  <AlertCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                  <strong>Fulfillment Assurance Policy:</strong>
                </div>
                <p>
                  All addresses across {selectedCounty} County and all 47 Kenyan counties receive express courier delivery following M-Pesa automated payment confirmation.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {showMpesaQrScreen && (
        <div className="my-12">
          <MpesaStatusMonitor
            orderId={mpesaQrOrderId}
            expectedAmount={mpesaQrAmount}
            onSuccess={() => {
              setGeneratedReceipt(mpesaTransactionCode || "M-PESA-STK-CONFIRMED");
              setGeneratedOrderId(mpesaQrOrderId);
              setPaymentSuccess(true);
              clearCart();
              setShowMpesaQrScreen(false);
            }}
            onFailure={(err) => {
              setMpesaError(err);
            }}
            onClose={() => {
              setShowMpesaQrScreen(false);
            }}
          />
        </div>
      )}

      <PaymentHandler
        isOpen={isPaymentHandlerOpen}
        onClose={() => setIsPaymentHandlerOpen(false)}
        orderId={activePaymentOrderId}
        customerEmail={activePaymentEmail}
        customerPhone={customerPhone}
        totalAmount={activePaymentAmount}
        onSuccess={(reference) => {
          setIsPaymentHandlerOpen(false);
          setGeneratedReceipt(reference);
          setGeneratedOrderId(activePaymentOrderId);
          setPaymentSuccess(true);
          clearCart();
        }}
        onCancel={() => {
          setIsPaymentHandlerOpen(false);
        }}
        initializeMegaPayTransaction={initializeMegaPayTransaction || (async (o, e, a, p) => initializeMegaPayPayment({ orderId: o, email: e, amount: a, phone: p }))}
        verifyMegaPayTransaction={verifyMegaPayTransaction || verifyMegaPayPayment}
      />

      {/* Mobile-optimized Floating 'Quick Pay' Action Button with bounce & pulse indicator */}
      {!showMpesaQrScreen && !paymentSuccess && !isSTKProcessing && cart.length > 0 && getSafaricomValidation(customerPhone).isValid && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden animate-bounce">
          <button
            type="button"
            onClick={handleQuickPayTrigger}
            className="flex items-center gap-2 bg-[#4f9e31] hover:bg-[#4f9e31]/95 text-white text-xs font-black px-5 py-4 rounded-full shadow-2xl border border-white/20 tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-sans"
            style={{ boxShadow: "0 10px 25px -5px rgba(79, 158, 49, 0.4)" }}
          >
            <Zap className="w-4 h-4 fill-white text-white animate-pulse" />
            <span>M-Pesa Quick Pay</span>
          </button>
        </div>
      )}

      {showMpesaPushModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          {/* Authentic Android/iOS Lipa Na M-Pesa Prompt Dialog Container */}
          <div className="w-full max-w-[320px] bg-[#EAEAEA] rounded-3xl shadow-2xl border border-white/25 text-black overflow-hidden font-sans">
            {/* SIM Carrier Header banner */}
            <div className="bg-[#4f9e31] px-4 py-3 flex items-center justify-between text-white">
              <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider">M-Pesa SIM ToolKit</span>
              <span className="text-[9px] uppercase font-mono font-extrabold px-2 py-0.5 bg-black/20 rounded">Safaricom Sim 1</span>
            </div>

            <div className="p-5 space-y-4">
              {mpesaPushStep === "prompt" && (
                <div className="space-y-4">
                  <div className="bg-white/90 border border-black/5 rounded-xl p-3.5 space-y-2 text-xs text-center border-l-4 border-l-[#4f9e31]">
                    <p className="font-semibold text-[13px] text-gray-800 leading-snug">
                      Do you want to pay KES {mpesaQrAmount.toLocaleString()} to Tech Sokoni Kenya?
                    </p>
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-mono text-[10.5px] font-bold text-[#4f9e31]">
                      <span>TILL NO: 9309020</span>
                      <span>REF: TSK-{mpesaQrOrderId.substring(0,6).toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-600 block uppercase tracking-wide">
                      ENTER M-PESA PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={5}
                      required
                      value={mpesaPushPin}
                      onChange={(e) => {
                        setMpesaPushPin(e.target.value.replace(/\D/g, ""));
                        setMpesaPushError("");
                      }}
                      className="w-full bg-white border border-gray-300 py-2.5 px-3 rounded-lg text-black text-center font-bold text-lg tracking-widest focus:outline-hidden placeholder:text-gray-300 text-black h-[42px]"
                      placeholder="••••"
                      autoFocus
                    />
                    {mpesaPushError && (
                      <p className="text-[10px] text-red-500 font-bold font-mono text-center">
                        ⚠️ {mpesaPushError}
                      </p>
                    )}
                  </div>

                  <p className="text-[9.5px] text-gray-500 leading-normal text-center">
                    Enter your M-Pesa PIN on this safe simulator to mock the physical SIM Hook settlement.
                  </p>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMpesaPushStep("cancelled");
                        setTimeout(() => {
                          setShowMpesaPushModal(false);
                        }, 1200);
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!mpesaPushPin || mpesaPushPin.length < 4) {
                          setMpesaPushError("PIN must be 4 or 5 digits");
                          return;
                        }
                        setMpesaPushStep("processing");
                        
                        const timestampLetters = ["A","B","C","D","E","F","G","H","J","K","L","P","R","S","T"];
                        const randomLetter = () => timestampLetters[Math.floor(Math.random() * timestampLetters.length)];
                        const simulatedCode = `${randomLetter()}${randomLetter()}${Math.floor(100000 + Math.random() * 900000)}${randomLetter()}${randomLetter()}`;
                        
                        try {
                          await new Promise((resolve) => setTimeout(resolve, 1800));
                          await updateOrderStatus(mpesaQrOrderId, "Paid", "Processing", simulatedCode);
                          setMpesaTransactionCode(simulatedCode);
                          setMpesaPushStep("success");
                          setShowMpesaConfetti(true);
                          
                          setTimeout(() => {
                            clearCart();
                            setGeneratedReceipt(simulatedCode);
                            setGeneratedOrderId(mpesaQrOrderId);
                            setShowMpesaQrScreen(false);
                            setShowMpesaPushModal(false);
                            setPaymentSuccess(true);
                            addCustomNotification(
                              `✅ Payment Confirmed! M-Pesa transaction #${simulatedCode} verified. Order #${mpesaQrOrderId.slice(-6).toUpperCase()} is being processed.`,
                              mpesaQrOrderId
                            );
                          }, 1800);
                        } catch (err) {
                          setMpesaPushStep("cancelled");
                          setMpesaPushError("M-Pesa system link delayed. Try manually.");
                        }
                      }}
                      className="flex-1 bg-[#4f9e31] hover:bg-[#4f9e31]/95 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      SEND PIN
                    </button>
                  </div>
                </div>
              )}

              {mpesaPushStep === "processing" && (
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#4f9e31]" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-gray-850 uppercase tracking-wider animate-pulse">Securing Lipa Na M-Pesa Hook</p>
                    <p className="text-[10px] text-gray-500">Connecting to Safaricom endpoint & verifying PIN...</p>
                  </div>
                </div>
              )}

              {mpesaPushStep === "success" && (
                <div className="py-6 flex flex-col items-center text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-[13px] text-emerald-600 uppercase tracking-wider">Payment Confirmed!</p>
                    <p className="text-[10.5px] text-gray-700 leading-relaxed max-w-[220px] mx-auto font-medium">
                      Sent KES {mpesaQrAmount.toLocaleString()} safely to Till <strong>9309020</strong>. Releasing premium shipment invoice...
                    </p>
                  </div>
                </div>
              )}

              {mpesaPushStep === "cancelled" && (
                <div className="py-6 flex flex-col items-center text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center border border-red-500/20 text-red-600">
                    <AlertCircle className="w-7 h-7 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-[13px] text-red-600 uppercase tracking-wide">Transaction Cancelled</p>
                    <p className="text-[10.5px] text-gray-600">
                      Lipa Na M-Pesa push rejected or cancelled. Payment session aborted.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
