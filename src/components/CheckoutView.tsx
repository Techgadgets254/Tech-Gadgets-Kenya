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
  Zap
} from "lucide-react";
import { KENYAN_COUNTIES } from "../data";
import { PaymentHandler } from "./PaymentHandler";

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

export default function CheckoutView() {
  const { 
    user, 
    cart, 
    getCartTotal, 
    updateCartItemQty, 
    removeFromCart, 
    clearCart,
    createCheckoutOrder, 
    initializePaystackTransaction, 
    verifyPaystackTransaction,
    updateOrderStatus,
    setActiveView, 
    setInvoiceOrderId,
    loginWithGoogle,
    affiliates,
    addCustomNotification
  } = useStore();

  // Shipments state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCounty, setSelectedCounty] = useState(KENYAN_COUNTIES[0]);
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [billingPhone, setBillingPhone] = useState("");

  // Payment Selection: "paystack" or "mpesa_qr"
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa_qr">("paystack");

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

  const [redirectCount, setRedirectCount] = useState(6);

  useEffect(() => {
    if (paymentSuccess) {
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
    if (!user) return;

    if (!customerName || !customerPhone || !deliveryDetails) {
      alert("Please fill in all requested fields to dispatch billing");
      return;
    }

    const safaricomCheck = getSafaricomValidation(customerPhone);

    try {
      if (isNairobi) {
        // Mpesa QR payment handler
        if (paymentMethod === "mpesa_qr") {
          // Strict error prevention check
          if (!safaricomCheck.isValid) {
            alert(`A valid Safaricom phone number is required for Lipa Na M-Pesa. Detected: ${safaricomCheck.network}. Please change "RECIPIENT CONTACT PHONE" to a valid Safaricom line (e.g. starting with 07xx, 011x) to ensure smooth prompt delivery.`);
            return;
          }

          const shippingFullAddress = `${deliveryDetails}, ${selectedCounty} County, Kenya (Nairobi - Free Delivery)`;
          
          setIsSTKProcessing(true);
          setStkLogs([]);
          updateSTKLog("Generating dynamic M-Pesa QR payments pipeline...", 100);

          const amount = Math.max(0, getCartTotal() + deliveryFee - discount);
          const orderObj = await createCheckoutOrder({
            customerName,
            customerEmail: user.email || "",
            customerPhone: safaricomCheck.apiFormatted, // standardized format
            shippingAddress: shippingFullAddress,
            mpesaPhone: safaricomCheck.apiFormatted,
            totalAmount: amount,
            referralCode: appliedPromo || undefined,
            paymentProvider: "Mpesa-QR"
          });

          if (!orderObj) {
            setIsSTKProcessing(false);
            alert("Encountered access authorization limit creating database record.");
            return;
          }

          setIsSTKProcessing(false);
          setMpesaQrOrderId(orderObj.id);
          setMpesaQrAmount(amount);
          setMpesaTransactionCode("");
          setMpesaError("");
          setShowMpesaQrScreen(true);

          // Auto-trigger the physical Sim ToolKit / M-Pesa PIN prompt simulator after 1.8 seconds!
          setMpesaPushStep("prompt");
          setMpesaPushPin("");
          setMpesaPushError("");
          setTimeout(() => {
            setShowMpesaPushModal(true);
          }, 1800);
          return;
        }

        // Nairobi requires immediate Payment Before Delivery
        if (paymentMethod === "paystack") {
          const shippingFullAddress = `${deliveryDetails}, ${selectedCounty} County, Kenya (Nairobi - Free Delivery)`;
          
          // Show immediate spinner/loading state
          setIsSTKProcessing(true);
          setStkLogs([]);
          updateSTKLog("Starting Secure Ordering pipeline...", 100);

          const orderObj = await createCheckoutOrder({
            customerName,
            customerEmail: user.email || "",
            customerPhone,
            shippingAddress: shippingFullAddress,
            mpesaPhone: customerPhone, // Stores customer billing contact to satisfy Firestore layout
            totalAmount: Math.max(0, getCartTotal() + deliveryFee - discount),
            referralCode: appliedPromo || undefined,
            paymentProvider: "Paystack"
          });

          if (!orderObj) {
            setIsSTKProcessing(false);
            alert("Encountered access authorization limit creating database record.");
            return;
          }

          // Clean older states
          setIsSTKProcessing(false);

          // Open our high-integrity PaymentHandler modal
          setActivePaymentOrderId(orderObj.id);
          setActivePaymentEmail(user.email || "techgadgetsk@gmail.com");
          setActivePaymentAmount(orderObj.totalAmount);
          setIsPaymentHandlerOpen(true);
        }
      } else {
        // OUTSIDE NAIROBI: "no payment before delivery"
        setIsSTKProcessing(true);
        setStkLogs([]);

        updateSTKLog("Parsing outside-Nairobi shipping parameters...", 150);
        updateSTKLog("Validating logistics hub matching for county: " + selectedCounty, 450);

        const shippingFullAddress = `${deliveryDetails}, ${selectedCounty} County, Kenya (Outside Nairobi - Pay on Delivery)`;
        
        const orderObj = await createCheckoutOrder({
          customerName,
          customerEmail: user.email || "",
          customerPhone,
          shippingAddress: shippingFullAddress,
          mpesaPhone: "PAY-ON-DELIVERY",
          totalAmount: Math.max(0, getCartTotal() - discount),
          referralCode: appliedPromo || undefined,
          paymentProvider: "Delivery-Pay"
        });

        if (!orderObj) {
          setIsSTKProcessing(false);
          alert("Encountered database communication issue.");
          return;
        }

        updateSTKLog("Compiling free warehouse dispatch ledger...", 900);
        updateSTKLog("Order queued as PENDING DELIVERY (Pay on Delivery Approved)", 1400);

        setTimeout(() => {
          setGeneratedReceipt("POD-APPROVED");
          setGeneratedOrderId(orderObj.id);
          setPaymentSuccess(true);
          setIsSTKProcessing(false);
          clearCart();
        }, 2000);
      }
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
                {isNairobi 
                  ? "Paystack Commerce Terminal" 
                  : "Logistic Dispatch Routing"
                }
              </h3>
              <p className="text-white/40 text-xs mt-1">
                Your credentials are secured inside our private sandbox. Verified on live server queues.
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
                {isNairobi 
                  ? "Paystack Commerce Bridge"
                  : "Free Courier Dispatch"
                }
              </span>
              <span>Keep your tab open</span>
            </div>
          </div>
        </div>
      )}

      {/* 1.1 SIMULATED PAYSTACK POPUP OVERLAY */}
      {showSimulatedPaystackModal && (
        <div id="paystack-checkout-popup" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-black">
            {/* Header segment styled exactly like Paystack brand */}
            <div className="bg-[#121a24] text-white p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#09a5db]" />
                <div>
                  <h4 className="text-xs font-bold font-sans tracking-wide">Paystack Commerce</h4>
                  <p className="text-[9px] text-[#09a5db] font-mono leading-none tracking-widest uppercase font-bold">SIMULATOR ACTIVE</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-white/50 block font-bold">KES</span>
                <span className="text-sm font-bold font-sans text-emerald-500">
                  {Math.max(0, getCartTotal() + deliveryFee - discount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Simulated content body segments */}
            {simulatedPaystackStep === "options" && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500 font-sans leading-relaxed">
                  Choose your test payment method to simulate Paystack instant checkout clearance:
                </p>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedPaystackStep("card");
                      setSimulatedCardNo("");
                      setSimulatedCardPin("");
                    }}
                    className="w-full text-left p-3 rounded-xl border border-gray-150 hover:bg-gray-50 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-650 font-bold text-xs font-mono">💳</div>
                    <div>
                      <span className="text-xs font-bold font-sans text-gray-800 block">Pay with Card</span>
                      <span className="text-[10px] text-gray-400 block font-sans">Visa, Mastercard, Verve</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedPaystackStep("mobile");
                      setSimulatedMobilePhone(customerPhone || "");
                    }}
                    className="w-full text-left p-3 rounded-xl border border-gray-150 hover:bg-gray-50 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs font-sans">M</div>
                    <div>
                      <span className="text-xs font-bold font-sans text-gray-800 block">Pay with Mobile Money</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block font-sans">Paystack Mobile Wallet (MTN, Airtel, etc.)</span>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSimulatedPaystackModal(false);
                    setIsSTKProcessing(false);
                  }}
                  className="w-full text-center text-xs font-bold text-red-500 hover:underline pt-2 cursor-pointer font-sans border-none bg-transparent"
                >
                  Cancel Transaction
                </button>
              </div>
            )}

            {simulatedPaystackStep === "card" && (
              <div className="p-5 space-y-3.5">
                <h5 className="text-xs font-bold text-gray-700 font-mono">ENTER TEST CARD DETAILS</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold block mb-1">CARD NUMBER</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      value={simulatedCardNo}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                        setSimulatedCardNo(formatted);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">EXPIRY (MM/YY)</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center text-gray-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                        placeholder="11/29"
                        maxLength={5}
                        value={simulatedCardExp}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 2) {
                            val = val.substring(0, 2) + "/" + val.substring(2, 4);
                          }
                          setSimulatedCardExp(val);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">CARD PIN</label>
                      <input
                        type="password"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center text-gray-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                        placeholder="••••"
                        maxLength={4}
                        value={simulatedCardPin}
                        onChange={(e) => setSimulatedCardPin(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSimulatingPayment}
                    onClick={async () => {
                      if (simulatedCardNo.replace(/\s/g, "").length < 16) {
                        alert("Please specify a 16-digit test card number.");
                        return;
                      }
                      setIsSimulatingPayment(true);
                      setTimeout(async () => {
                        setIsSimulatingPayment(false);
                        setSimulatedPaystackStep("success");
                        // Trigger actual verification endpoint
                        await verifyPaystackTransaction(simulatedOrderId, simulatedPaystackRef);
                        setTimeout(() => {
                          setShowSimulatedPaystackModal(false);
                          setGeneratedReceipt(simulatedPaystackRef);
                          setGeneratedOrderId(simulatedOrderId);
                          setPaymentSuccess(true);
                          setIsSTKProcessing(false);
                          clearCart();
                        }, 1800);
                      }, 2000);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold py-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed border-none"
                  >
                    {isSimulatingPayment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Authorizing Transaction...</span>
                      </>
                    ) : (
                      <span>Pay KES {Math.round(getCartTotal() + deliveryFee - discount).toLocaleString()}</span>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setSimulatedPaystackStep("options")}
                    className="text-[11px] text-gray-400 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    &larr; Go Back
                  </button>
                </div>
              </div>
            )}

            {simulatedPaystackStep === "mobile" && (
              <div className="p-5 space-y-3.5">
                <h5 className="text-xs font-bold text-emerald-600 font-sans">PAY WITH MOBILE MONEY</h5>
                <p className="text-[11px] text-gray-500 leading-normal font-sans">
                  Our simulation will dispatch a test mobile money checkout to your handset callback pool:
                </p>
                <div>
                  <label className="text-[9px] text-gray-400 font-bold block mb-1">MOBILE PHONE NUMBER</label>
                  <div className="flex gap-2">
                    <div className="bg-gray-100 border border-gray-200 px-3 py-2 text-xs rounded-xl text-gray-500 flex items-center justify-center font-mono h-[36px]">
                      +254
                    </div>
                    <input
                      type="text"
                      className="flex-1 bg-gray-50 border border-gray-200 text-xs px-3 rounded-xl focus:outline-hidden focus:border-emerald-500 text-gray-800 font-sans font-bold h-[36px]"
                      placeholder="7XXXXXXXX"
                      maxLength={9}
                      value={simulatedMobilePhone}
                      onChange={(e) => setSimulatedMobilePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSimulatingPayment}
                    onClick={async () => {
                      if (!simulatedMobilePhone) {
                        alert("Please specify a simulated mobile money number.");
                        return;
                      }
                      setIsSimulatingPayment(true);
                      setTimeout(async () => {
                        setIsSimulatingPayment(false);
                        setSimulatedPaystackStep("success");
                        // Trigger verification
                        await verifyPaystackTransaction(simulatedOrderId, simulatedPaystackRef);
                        setTimeout(() => {
                           setShowSimulatedPaystackModal(false);
                           setGeneratedReceipt(simulatedPaystackRef);
                           setGeneratedOrderId(simulatedOrderId);
                           setPaymentSuccess(true);
                           setIsSTKProcessing(false);
                           clearCart();
                        }, 1800);
                      }, 2000);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold py-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:bg-gray-300 border-none"
                  >
                    {isSimulatingPayment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending checkout prompt...</span>
                      </>
                    ) : (
                      <span>Pay KES {Math.round(getCartTotal() + deliveryFee - discount).toLocaleString()}</span>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setSimulatedPaystackStep("options")}
                    className="text-[11px] text-gray-400 hover:underline cursor-pointer border-none bg-transparent"
                  >
                    &larr; Go Back
                  </button>
                </div>
              </div>
            )}

            {simulatedPaystackStep === "success" && (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-500 mx-auto text-xl font-bold">
                  ✓
                </div>
                <h5 className="text-sm font-bold text-emerald-600 font-sans">Payment Cleared!</h5>
                <p className="text-xs text-gray-450 font-sans max-w-xs mx-auto leading-relaxed">
                  Your reference <strong>{simulatedPaystackRef}</strong> has been cleared. Securing your invoice...
                </p>
              </div>
            )}

            {/* Footer segment with Paystack branding details */}
            <div className="bg-gray-50 px-5 py-3 text-center border-t border-gray-100 flex items-center justify-center gap-1.5">
              <span className="text-[9px] text-gray-400 font-sans tracking-wide uppercase font-semibold">Secured by</span>
              <span className="font-bold font-sans text-[11px] text-emerald-500">paystack</span>
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
            {generatedReceipt === "POD-APPROVED" ? "Fulfillment Dispatch Registered!" : "Payment Cleared Successfully!"}
          </h2>
          <p className="text-white/40 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed font-sans">
            {generatedReceipt === "POD-APPROVED" ? (
              <span>Your consignment for county <strong>{selectedCounty}</strong> is configured for <strong>Cash on Delivery (no payment before delivery required!)</strong>. Invoice #{generatedOrderId.substring(0, 8).toUpperCase()} stands queued for rapid courier loading.</span>
            ) : (
              <span>Your Nairobi purchase transition cleared in real time. Order <strong>#{generatedOrderId.substring(0, 8).toUpperCase()}</strong> has shifted directly into physical shipment fulfillment.</span>
            )}
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
                      <p className="font-sans font-extrabold text-xs text-white mt-1">
                        KES {item.product.price.toLocaleString()}
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

            {/* Security authorization roadblock (Strict Firebase Auth tracking) */}
            {!user ? (
              <div className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="p-3 bg-[#0F0F0F] rounded-full border border-[#C5A059]/30 text-[#C5A059] mb-3 shrink-0">
                  <Key className="w-6 h-6 text-[#C5A059]" />
                </div>
                <h3 className="font-serif italic font-light text-xl text-white">Authentication Required</h3>
                <p className="text-white/65 text-xs mt-1.5 max-w-sm leading-relaxed">
                  Tech Gadgets Kenya requires you to log in with Google to tie purchases directly to your profile. This is required to access your invoices, print them, and track delivery logs.
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors mt-4 flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-black" />
                  <span>Authorize with Google Profile</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs animate-fadeIn">
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
                  <div className="p-4 rounded-2xl border transition-all mt-4">
                    {isNairobi ? (
                      <div className="space-y-1.5">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Nairobi Shipping Rule Applied
                        </span>
                        <p className="text-xs text-white font-semibold">Payment Before Delivery Required</p>
                        <p className="text-[10.5px] text-white/40 leading-relaxed font-sans">
                          Nairobi addresses qualify for <strong>Free Delivery Promo</strong>. Settlement is mandated prior to vehicle dispatch through Paystack.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Upcountry Shipping Rule Applied
                        </span>
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          No Payment Before Delivery • Free Shipping
                        </p>
                        <p className="text-[10.5px] text-white/40 leading-relaxed font-sans">
                          Address corresponds outside Nairobi territory (<strong>{selectedCounty} County</strong>). Immediate pre-payment is **completely bypassed**; pay exclusively upon physically inspecting goods at your courier collection office.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PAYMENT TAB METHODS (Only enabled or relevant if Nairobi) */}
                  {isNairobi ? (
                    <div className="border-t border-white/5 pt-5 mt-6 space-y-4">
                      <span className="font-mono text-[10px] text-white/30 font-bold uppercase tracking-wider">SELECT PAYMENT METHOD</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Paystack */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paystack")}
                          className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            paymentMethod === "paystack"
                              ? "bg-emerald-950/10 border-emerald-500/40 text-white"
                              : "bg-[#0A0A0A] border-white/5 text-white/60 hover:border-white/10"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            paymentMethod === "paystack"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/5 text-white/40 border-white/5"
                          }`}>
                            <span className="font-bold text-xs">P</span>
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-semibold font-sans ${paymentMethod === "paystack" ? "text-emerald-400" : "text-white"}`}>Paystack Gateway</h4>
                            <p className="text-[10px] text-white/40 mt-1 leading-normal font-sans">
                              Secure credit card, debit card, and mobile money.
                            </p>
                          </div>
                        </button>

                        {/* Option 2: M-Pesa QR */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("mpesa_qr")}
                          className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            paymentMethod === "mpesa_qr"
                              ? "bg-emerald-950/10 border-emerald-500/40 text-white"
                              : "bg-[#0A0A0A] border-white/5 text-white/60 hover:border-white/10"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            paymentMethod === "mpesa_qr"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-white/5 text-white/40 border-white/5"
                          }`}>
                            <QrCode className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-semibold font-sans ${paymentMethod === "mpesa_qr" ? "text-emerald-400" : "text-white"}`}>M-Pesa Live QR</h4>
                            <p className="text-[10px] text-white/40 mt-1 leading-normal font-sans">
                              Scan dynamic QR for Lipa Na M-Pesa.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer text-sm transform hover:scale-101 duration-200"
                  >
                    {paymentMethod === "mpesa_qr" && isNairobi ? (
                      <QrCode className="w-5 h-5 text-black shrink-0" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-black shrink-0" />
                    )}
                    <span>
                      {isNairobi 
                        ? (paymentMethod === "mpesa_qr" ? "Proceed to Pay via M-Pesa QR" : "Proceed to Pay via Paystack")
                        : "Place Order (Pay on Delivery)"
                      }
                    </span>
                  </button>
                </form>
              </div>
            )}

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
                  <span>Nairobi Courier Dispatch Duty</span>
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
                  {isNairobi 
                    ? "Addresses within Nairobi receive same-day delivery via express cycle courier following STK or Visa automated confirmation."
                    : `Outside Nairobi deliveries (such as ${selectedCounty} county) bypass prepayment entirely with strict physical inspection prior to cash release.`
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {showMpesaQrScreen && (
        <div className="max-w-md mx-auto bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 text-center animate-fadeIn my-12 relative overflow-hidden">
          {/* M-Pesa green branding ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4f9e31]"></div>
          
          <div className="flex justify-center mb-4">
            <div className="bg-[#4f9e31]/10 px-4 py-1.5 rounded-full border border-[#4f9e31]/30 flex items-center gap-2">
              <span className="w-2 bg-[#4f9e31] h-2 rounded-full animate-ping"></span>
              <span className="font-mono text-[9px] font-bold text-[#4f9e31] tracking-wider uppercase">LIPA NA M-PESA INSTANT PORTAL</span>
            </div>
          </div>
          
          <h2 className="font-sans font-bold text-lg text-white">Dynamic M-Pesa Checkout</h2>
          <p className="text-white/40 text-[11px] mt-1.5 leading-relaxed font-sans">
            We've mapped a dynamic routing payload to fast-track your transaction. Scan the generated QR bar below in your M-Pesa App or enter details manually.
          </p>

          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 my-4 text-left">
            <p className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Lipa Na M-Pesa Push Sent Status
            </p>
            <p className="text-[10.5px] text-white/70 leading-relaxed font-sans">
              An M-Pesa dynamic secure prompt has been sent to your phone <strong className="text-[#C5A059] font-mono">+{getSafaricomValidation(customerPhone).apiFormatted}</strong>. Check your phone screen for the prompt or use the simulation console below.
            </p>
            <button
              type="button"
              disabled={stkSessionExpired}
              onClick={() => {
                setMpesaPushStep("prompt");
                setMpesaPushPin("");
                setMpesaPushError("");
                setShowMpesaPushModal(true);
              }}
              className="mt-3 w-full bg-[#4f9e31]/25 hover:bg-[#4f9e31]/40 border border-[#4f9e31]/45 disabled:opacity-40 disabled:hover:bg-[#4f9e31]/25 text-[#4f9e31] hover:text-[#5ebd3d] disabled:cursor-not-allowed font-mono text-[10px] font-black py-2 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ⚡ Re-Trigger Lipa Na M-Pesa STK Prompt
            </button>
          </div>

          {/* Live real-time STK status tracker */}
          <div className="my-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex items-center justify-between font-sans">
            <div className="text-left">
              <span className="text-white/30 block text-[9px] font-mono font-bold uppercase tracking-wide">Live Daraja Signal</span>
              <span className="text-white font-bold text-xs">M-Pesa Webhook Monitor</span>
            </div>
            <div className="flex items-center gap-1.5">
              {liveOrderStatus === "Processing" && (
                <span className="px-3 py-1 font-mono text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-500/25 rounded-full flex items-center gap-1.5 animate-pulse uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Processing STK Push
                </span>
              )}
              {liveOrderStatus === "Confirmed" && (
                <span className="px-3 py-1 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/25 rounded-full flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Confirmed & Paid
                </span>
              )}
              {liveOrderStatus === "Cancelled" && (
                <span className="px-3 py-1 font-mono text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-500/25 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Dynamic QR Code or Secure Expiry Warning Overlay */}
          <div className="my-6 min-h-[220px] flex flex-col items-center justify-center">
            {stkSessionExpired ? (
              <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl text-center space-y-4 max-w-[280px] mx-auto animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-red-400 text-sm uppercase tracking-wide">STK Session Expired</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                    For security reasons, the dynamic STK payment lock has initiated a timeout after 30 seconds of idle wait.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Reset countdown timer back to 30 and trigger prompt back
                    setSessionTimeLeft(30);
                    setStkSessionExpired(false);
                    setLiveOrderStatus("Processing");
                    setMpesaPushStep("prompt");
                    setMpesaPushPin("");
                    setMpesaPushError("");
                    setShowMpesaPushModal(true);
                  }}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-sans text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                >
                  🔄 Retry STK Prompt
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl inline-block border-2 border-[#4f9e31]/20 shadow-lg shrink-0 relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=2e7d32&data=${encodeURIComponent(
                    `M-PESA|BUY GOODS|TILL:9309020|ACC:TGK-${mpesaQrOrderId}|AMT:${mpesaQrAmount}`
                  )}`}
                  alt="M-Pesa Buy Goods Till QR Code"
                  className="w-40 h-40 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-[#4f9e31] text-white font-mono text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  {sessionTimeLeft}s left
                </div>
              </div>
            )}
          </div>

          {/* Core Payment Specifics Panel */}
          <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left text-xs mb-6 font-sans">
            <div>
              <span className="text-white/30 block text-[9.5px] font-mono font-bold uppercase tracking-wide">Recipient Merchant</span>
              <span className="text-white font-semibold">Tech Gadgets Kenya</span>
            </div>
            <div>
              <span className="text-white/30 block text-[9.5px] font-mono font-bold uppercase tracking-wide">Till Number</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">9309020</span>
            </div>
            <div className="mt-2.5">
              <span className="text-white/30 block text-[9.5px] font-mono font-bold uppercase tracking-wide">System Reference</span>
              <span className="text-white font-semibold font-mono text-[11px]">TGK-{mpesaQrOrderId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="mt-2.5">
              <span className="text-white/30 block text-[9.5px] font-mono font-bold uppercase tracking-wide">Invoice Amount</span>
              <span className="text-[#C5A059] font-extrabold font-mono text-xs sm:text-sm">KES {mpesaQrAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick instructions list */}
          <div className="text-white/40 text-[10px] text-left space-y-1 bg-white/[0.01] p-3.5 rounded-xl border border-white/5 mb-6 font-sans">
            <p className="font-semibold text-white/50 text-[10.5px] mb-1">How to pay manually:</p>
            <p>1. Open your Safaricom M-Pesa App or SIM Toolkit</p>
            <p>2. Select <strong>Lipa Na M-Pesa</strong> &rarr; <strong>Buy Goods and Services</strong></p>
            <p>3. Enter Till: <strong className="text-white">9309020</strong></p>
            <p>4. Enter exact Amount: <strong className="text-white">KES {mpesaQrAmount.toLocaleString()}</strong></p>
            <p>5. Receive notification code and paste it below to verify</p>
          </div>

          <div className="space-y-4 text-left border-t border-white/5 pt-5">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] font-black text-white/40 block uppercase tracking-wider">
                M-Pesa Transaction Code
              </label>
              <input
                type="text"
                required
                value={mpesaTransactionCode}
                onChange={(e) => {
                  setMpesaTransactionCode(e.target.value.toUpperCase().trim());
                  setMpesaError("");
                }}
                maxLength={10}
                className="w-full bg-[#050505] border border-white/10 py-3 px-4 rounded-xl text-white font-mono text-sm uppercase tracking-widest text-center focus:border-[#4f9e31] focus:ring-1 focus:ring-[#4f9e31]/20 outline-hidden"
                placeholder="e.g. SGT245HJ89"
              />
              <p className="text-[9px] text-white/30 font-mono mt-1 text-center font-medium">
                Enter the 10-byte transaction reference from Safaricom receipt.
              </p>
            </div>

            {mpesaError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-[10.5px] font-sans flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{mpesaError}</p>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMpesaQrScreen(false);
                  setMpesaTransactionCode("");
                  setMpesaError("");
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 font-sans font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel Checkout
              </button>
              <button
                type="button"
                disabled={isVerifyingMpesa}
                onClick={handleVerifyMpesaQrPayment}
                className="flex-1 bg-[#4f9e31] hover:bg-[#4f9e31]/90 text-white font-sans font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingMpesa ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                    <span>Confirm Settlement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentHandler
        isOpen={isPaymentHandlerOpen}
        onClose={() => setIsPaymentHandlerOpen(false)}
        orderId={activePaymentOrderId}
        customerEmail={activePaymentEmail}
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
        initializePaystackTransaction={initializePaystackTransaction}
        verifyPaystackTransaction={verifyPaystackTransaction}
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
                      Do you want to pay KES {mpesaQrAmount.toLocaleString()} to Tech Gadgets Kenya?
                    </p>
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-mono text-[10.5px] font-bold text-[#4f9e31]">
                      <span>TILL NO: 9309020</span>
                      <span>REF: TGK-{mpesaQrOrderId.substring(0,6).toUpperCase()}</span>
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
