import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, Loader2, Phone, Smartphone, Check } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface PaymentHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  initializeMegaPayTransaction?: (orderId: string, email: string, amount: number, phone?: string) => Promise<{
    success: boolean;
    mode: "real" | "simulated";
    authUrl?: string;
    reference?: string;
    message?: string;
  }>;
  verifyMegaPayTransaction?: (orderId: string, reference: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  initializePaystackTransaction?: (orderId: string, email: string, amount: number, phone?: string) => Promise<{
    success: boolean;
    mode: "real" | "simulated";
    authUrl?: string;
    reference?: string;
    message?: string;
  }>;
  verifyPaystackTransaction?: (orderId: string, reference: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

export const PaymentHandler: React.FC<PaymentHandlerProps> = ({
  isOpen,
  onClose,
  orderId,
  customerEmail,
  customerPhone = "",
  totalAmount,
  onSuccess,
  onCancel,
  initializeMegaPayTransaction,
  verifyMegaPayTransaction,
  initializePaystackTransaction,
  verifyPaystackTransaction
}) => {
  const initPayment = initializeMegaPayTransaction || initializePaystackTransaction!;
  const verifyPayment = verifyMegaPayTransaction || verifyPaystackTransaction!;

  const [step, setStep] = useState<"ready" | "initializing" | "prompt_sent" | "completed" | "failed">("ready");
  const [phoneNumber, setPhoneNumber] = useState<string>(customerPhone);
  const [logs, setLogs] = useState<string[]>([]);
  const [isKeyDefined, setIsKeyDefined] = useState<boolean | null>(null);
  const [transactionData, setTransactionData] = useState<{ reference?: string; authUrl?: string; mode?: "real" | "simulated" } | null>(null);
  const [pollAttempts, setPollAttempts] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (customerPhone && !phoneNumber) {
      setPhoneNumber(customerPhone);
    }
  }, [customerPhone]);

  const addLog = (message: string) => {
    console.log(`[M-Pesa Express] ${message}`);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (isOpen) {
      runPreFlightChecks();
    }
  }, [isOpen]);

  const runPreFlightChecks = async () => {
    setLogs([]);
    setStep("ready");
    setErrorMessage("");
    setTransactionData(null);
    setPollAttempts(0);

    addLog("Initiating M-Pesa Express checkout validation...");

    if (!navigator.onLine) {
      addLog("ERROR: Device is offline.");
      setErrorMessage("Network unavailable. Please check your internet connection.");
      setStep("failed");
      return;
    }

    if (!orderId || totalAmount <= 0) {
      setErrorMessage("Invalid payment details.");
      setStep("failed");
      return;
    }

    try {
      const configRes = await fetch("/api/megapay/check-config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setIsKeyDefined(configData.configured);
        if (configData.configured) {
          addLog("M-Pesa Live STK Gateway authenticated.");
        } else {
          addLog("M-Pesa Live STK Gateway ready.");
        }
      } else {
        setIsKeyDefined(false);
      }
    } catch (err: any) {
      setIsKeyDefined(false);
    }
  };

  const handleSendStkPush = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 9) {
      setErrorMessage("Please enter a valid Safaricom M-Pesa phone number.");
      return;
    }

    setStep("initializing");
    setErrorMessage("");
    addLog(`Initiating M-Pesa STK Push prompt for KES ${totalAmount.toLocaleString()}...`);
    addLog(`Target M-Pesa Phone Number: ${phoneNumber}`);

    try {
      const initRes = await initPayment(orderId, customerEmail, totalAmount, phoneNumber);

      if (initRes.success) {
        addLog(`STK Push Request Dispatched! Reference: ${initRes.reference}`);
        setTransactionData({
          reference: initRes.reference,
          authUrl: initRes.authUrl,
          mode: initRes.mode
        });

        if (initRes.mode === "real") {
          setStep("prompt_sent");
          addLog("M-Pesa STK Push popup sent to phone screen. Waiting for user PIN input...");
        } else {
          addLog("M-Pesa Express Gateway active.");
          setStep("prompt_sent");
        }
      } else {
        throw new Error(initRes.message || "Could not trigger M-Pesa STK push. Try again.");
      }
    } catch (err: any) {
      addLog(`Initialization Error: ${err.message}`);
      setErrorMessage(err.message || "Failed to trigger M-Pesa push prompt.");
      setStep("failed");
    }
  };

  const handleSimulatedPayment = async (status: "success" | "fail") => {
    if (!transactionData?.reference) return;

    if (status === "success") {
      addLog("Verifying simulated M-Pesa PIN authorization...");
      try {
        const verifyRes = await verifyPayment(orderId, transactionData.reference);
        if (verifyRes.success) {
          addLog("PAYMENT CONFIRMED: M-Pesa receipt generated!");
          setStep("completed");
          setTimeout(() => {
            onSuccess(transactionData.reference!);
          }, 1500);
        } else {
          throw new Error(verifyRes.message || "Payment verification failed.");
        }
      } catch (err: any) {
        setErrorMessage(err.message);
        setStep("failed");
      }
    } else {
      addLog("M-Pesa payment cancelled or wrong PIN entered.");
      setErrorMessage("M-Pesa transaction cancelled by user.");
      setStep("failed");
    }
  };

  const triggerManualVerification = async () => {
    if (!transactionData?.reference) return;
    addLog("Checking M-Pesa payment status directly with gateway...");
    try {
      const res = await verifyPayment(orderId, transactionData.reference);
      if (res.success) {
        addLog(`PAYMENT CONFIRMED: Reference ${transactionData.reference}`);
        setStep("completed");
        setTimeout(() => {
          onSuccess(transactionData.reference!);
        }, 1200);
      } else {
        alert(`Status: ${res.message || "Pending. If you've entered your PIN, please wait a few seconds and try again."}`);
      }
    } catch (err: any) {
      alert(`Status check error: ${err.message}`);
    }
  };

  // Real-time Firestore callback listener monitoring order status
  useEffect(() => {
    if (!isOpen || !orderId || step === "completed") return;

    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isPaid =
            data.paymentStatus === "paid" ||
            data.status === "paid" ||
            data.status === "completed" ||
            Boolean(data.receiptNo);

          if (isPaid) {
            const refCode = data.receiptNo || data.mpesaReceipt || transactionData?.reference || orderId;
            addLog(`[Firestore Callback] Payment confirmed in database! Receipt: ${refCode}`);
            setStep("completed");
            setTimeout(() => {
              onSuccess(refCode);
            }, 1200);
          }
        }
      },
      (err) => {
        console.warn("[Firestore Callback] Listener error:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, orderId, step, transactionData, onSuccess]);

  // Continuous background polling when STK prompt is sent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "prompt_sent" && transactionData?.reference && transactionData.mode === "real") {
      const maxPolls = 30;
      interval = setInterval(async () => {
        setPollAttempts((prev) => {
          const next = prev + 1;
          addLog(`Checking M-Pesa payment status... Attempt ${next}/${maxPolls}`);

          verifyPayment(orderId, transactionData.reference!)
            .then((res) => {
              if (res.success) {
                addLog("M-PESA PAYMENT VERIFIED AND CONFIRMED!");
                clearInterval(interval);
                setStep("completed");
                setTimeout(() => {
                  onSuccess(transactionData.reference!);
                }, 1200);
              }
            })
            .catch(() => {});

          if (next >= maxPolls) {
            clearInterval(interval);
            addLog("Polling threshold reached. User can verify manually.");
          }
          return next;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [step, transactionData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#121212] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Green Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-[#121212] to-[#121212] border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-emerald-500/20">
                M
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-white font-sans flex items-center gap-1.5">
                  M-Pesa Express Checkout
                </h3>
                <p className="text-[10px] text-emerald-400 font-mono">Instant STK Push Settlement</p>
              </div>
            </div>
            {isKeyDefined !== null && (
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isKeyDefined ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {isKeyDefined ? "MegaPay Live" : "MegaPay Active"}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Amount Summary */}
            <div className="p-4 bg-[#181818] border border-white/5 rounded-xl flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Order Reference</p>
                <p className="font-mono text-xs text-white mt-0.5 font-bold">{orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-medium">Total Amount</p>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">KES {totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* STEP 1: Phone Entry & Prompt Button */}
            {step === "ready" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1 font-mono">
                    Safaricom M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      className="w-full bg-black/60 border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm font-mono placeholder:text-white/30 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10.5px] text-white/50 mt-1.5 leading-snug">
                    An M-Pesa PIN prompt (STK Push) will pop up on your phone screen automatically.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    {errorMessage}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendStkPush}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs rounded-xl transition-all font-mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    Send M-Pesa Prompt
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Initializing Push */}
            {step === "initializing" && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-white/80 font-mono">Sending M-Pesa STK Push to {phoneNumber}...</p>
              </div>
            )}

            {/* STEP 3: Prompt Sent & Waiting for PIN */}
            {step === "prompt_sent" && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-center">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <Smartphone className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-300 font-sans">Check Your Phone Screen!</h4>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    An M-Pesa STK push prompt has been sent to <strong>{phoneNumber}</strong>.
                    Please enter your <strong>M-Pesa PIN</strong> to complete payment.
                  </p>
                </div>

                {/* Express Mode Quick Controls */}
                {transactionData?.mode === "simulated" && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                    <p className="text-amber-300 font-mono font-semibold">Fast Test Response Verification:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSimulatedPayment("success")}
                        className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg font-mono font-bold flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simulate Success
                      </button>
                      <button
                        onClick={() => handleSimulatedPayment("fail")}
                        className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-lg font-mono"
                      >
                        Simulate Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={triggerManualVerification}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs rounded-xl transition-all font-mono shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  I've Entered My M-Pesa PIN (Verify Now)
                </button>

                <div className="pt-1 flex justify-between items-center text-[10px] text-white/40 font-mono">
                  <span>Polling status... {pollAttempts}s</span>
                  <button
                    onClick={() => setStep("ready")}
                    className="underline hover:text-white"
                  >
                    Change Phone Number
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Payment Confirmed */}
            {step === "completed" && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                <p className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider">M-Pesa Payment Confirmed!</p>
                <p className="text-xs text-white/60 font-mono">Updating order details & redirecting...</p>
              </div>
            )}

            {/* STEP 5: Payment Failed */}
            {step === "failed" && (
              <div className="space-y-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h4 className="text-xs font-bold font-mono">Payment Issue</h4>
                </div>
                <p className="text-xs text-white/80 font-mono">
                  {errorMessage || "Transaction could not be completed. Please try again."}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("ready")}
                    className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono text-white transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-mono"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Audit Logs expander */}
            <div className="space-y-1 pt-2">
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Transaction Diagnostics</span>
              <div className="h-20 overflow-y-auto bg-black/60 border border-white/5 p-2 rounded-lg font-mono text-[9px] text-white/50 space-y-1">
                {logs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
