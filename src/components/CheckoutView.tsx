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
  Check
} from "lucide-react";
import { KENYAN_COUNTIES } from "../data";
import { PaymentHandler } from "./PaymentHandler";

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
    setActiveView, 
    setInvoiceOrderId,
    loginWithGoogle,
    affiliates
  } = useStore();

  // Shipments state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCounty, setSelectedCounty] = useState(KENYAN_COUNTIES[0]);
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [billingPhone, setBillingPhone] = useState("");

  // Payment Selection: "paystack"
  const [paymentMethod, setPaymentMethod] = useState<"paystack">("paystack");

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

  // Validate mobile formats & card details
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!customerName || !customerPhone || !deliveryDetails) {
      alert("Please fill in all requested fields to dispatch billing");
      return;
    }

    if (isNairobi) {
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
  };

  const updateSTKLog = (message: string, delay: number) => {
    setTimeout(() => {
      setStkLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, delay);
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
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
      {!paymentSuccess && !isSTKProcessing && (
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
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 text-xs py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans h-[38px]"
                        placeholder="0712345678"
                      />
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
                      <div className="flex flex-col gap-2.5">
                        <span className="font-mono text-[10px] text-white/30 font-bold uppercase tracking-wider">SECURE INSTANT CHECKOUT</span>
                        <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
                          <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <span className="font-bold text-xs">P</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold font-sans text-emerald-400">Paystack Commerce Gateway</h4>
                            <p className="text-[10.5px] text-white/50 mt-1 leading-relaxed font-sans">
                              Pre-payment is required for Nairobi locations. Secure credit card, debit card, and mobile money payments are processed with live encryption.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer text-sm transform hover:scale-101 duration-200"
                  >
                    <CreditCard className="w-5 h-5 text-black shrink-0" />
                    <span>
                      {isNairobi 
                        ? "Proceed to Pay via Paystack"
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
    </div>
  );
}
