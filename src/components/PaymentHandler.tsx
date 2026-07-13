import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface PaymentHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerEmail: string;
  totalAmount: number;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  initializePaystackTransaction: (orderId: string, email: string, amount: number) => Promise<{
    success: boolean;
    mode: "real" | "simulated";
    authUrl?: string;
    reference?: string;
    message?: string;
  }>;
  verifyPaystackTransaction: (orderId: string, reference: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

export const PaymentHandler: React.FC<PaymentHandlerProps> = ({
  isOpen,
  onClose,
  orderId,
  customerEmail,
  totalAmount,
  onSuccess,
  onCancel,
  initializePaystackTransaction,
  verifyPaystackTransaction
}) => {
  const [step, setStep] = useState<"checking" | "ready" | "initializing" | "processing_real" | "completed" | "failed">("checking");
  const [logs, setLogs] = useState<string[]>([]);
  const [isKeyDefined, setIsKeyDefined] = useState<boolean | null>(null);
  const [transactionData, setTransactionData] = useState<{ reference?: string; authUrl?: string; mode?: "real" | "simulated" } | null>(null);
  const [simulatedOption, setSimulatedOption] = useState<string>("");
  const [pollAttempts, setPollAttempts] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const addLog = (message: string) => {
    console.log(`[PaymentHandler] ${message}`);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Perform pre-flight validations and remote API key configurations checks before any endpoint calls
  useEffect(() => {
    if (isOpen) {
      runPreFlightChecks();
    }
  }, [isOpen]);

  const runPreFlightChecks = async () => {
    setLogs([]);
    setStep("checking");
    setErrorMessage("");
    setTransactionData(null);
    setPollAttempts(0);

    addLog("Initiating Payment Pre-flight Validation...");
    
    // Explicit Validation Check 1: Internet online state
    if (!navigator.onLine) {
      addLog("ERROR: Device detected as offline.");
      setErrorMessage("Network connection is unavailable. Verify internet status before continuing.");
      setStep("failed");
      return;
    }
    
    // Explicit Validation Check 2: Correct payload parameters
    if (!orderId) {
      addLog("ERROR: Missing purchase orderId reference document.");
      setErrorMessage("Invalid payment payload: Transaction order ID reference is empty.");
      setStep("failed");
      return;
    }
    
    if (totalAmount <= 0) {
      addLog(`ERROR: Invalid transaction total sum (KES ${totalAmount}).`);
      setErrorMessage("Invalid payment payload: Total sum must be strictly positive.");
      setStep("failed");
      return;
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      addLog(`ERROR: Invalid format for receipt recipient email: '${customerEmail}'`);
      setErrorMessage("Invalid billing parameters: Valid customer email address is mandatory.");
      setStep("failed");
      return;
    }

    addLog("Pre-flight parameters verified. Performing secure backend credentials audit...");

    try {
      // Connect to our secure check endpoint
      const configRes = await fetch("/api/paystack/check-config");
      if (!configRes.ok) {
        throw new Error(`Config audit returned HTTP error ${configRes.status}`);
      }
      
      const configData = await configRes.json();
      setIsKeyDefined(configData.configured);
      
      if (configData.configured) {
        addLog("Security Check: Live PAYSTACK_SECRET_KEY verified in server environment.");
        addLog("Production gateway loaded. Transitioning to payment session initialization.");
      } else {
        addLog("Warning: Remote PAYSTACK_SECRET_KEY is undefined/blank in environment configuration.");
        addLog("Sandbox Safe-Mode Active. Transaction will proceed in Simulated Mode.");
      }
      
      setStep("ready");
    } catch (err: any) {
      addLog(`ERROR: Failed completing environment security check: ${err.message}`);
      // Fallback to safety check
      addLog("Config connection timeout. Defaulting safety check to sandbox simulation mode.");
      setIsKeyDefined(false);
      setStep("ready");
    }
  };

  const handleStartPayment = async () => {
    setStep("initializing");
    addLog(`Contacting Tech Soko transaction bridge for Order ${orderId}...`);
    addLog(`Authenticating currency parameters and invoice sum: KES ${totalAmount.toLocaleString()}`);

    try {
      const initRes = await initializePaystackTransaction(orderId, customerEmail, totalAmount);
      
      if (initRes.success) {
        addLog(`Handshake completed! Reference identifier acquired: ${initRes.reference}`);
        setTransactionData({
          reference: initRes.reference,
          authUrl: initRes.authUrl,
          mode: initRes.mode
        });

        if (initRes.mode === "real") {
          setStep("processing_real");
          addLog("Production Paystack transaction active.");
          addLog("System starting background polling loop to track invoice settlement on Paystack network.");
          
          // Open standard Paystack authorization page
          if (initRes.authUrl) {
            window.open(initRes.authUrl, "_blank");
          }
        } else {
          // Simulation option choosing steps
          addLog("Simulated sandbox context ready. Waiting for user simulated choice confirmation.");
        }
      } else {
        throw new Error(initRes.message || "Failed initializing transaction on backend server.");
      }
    } catch (err: any) {
      addLog(`Handshake Error: ${err.message}`);
      setErrorMessage(err.message || "Endpoint error encountered while starting transaction flow.");
      setStep("failed");
    }
  };

  // Safe simulated checkout choices
  const handleSimulatedPay = async (status: "success" | "fail") => {
    if (!transactionData?.reference) return;
    
    setStep("initializing");
    addLog(`Processing simulated action: [${status.toUpperCase()}] for reference ${transactionData.reference}...`);

    if (status === "success") {
      addLog("Verifying simulation settlement status on Sandbox verification node...");
      try {
        const verifyRes = await verifyPaystackTransaction(orderId, transactionData.reference);
        if (verifyRes.success) {
          addLog("INVOICE SETTLED: Paystack payment verified successfully.");
          setStep("completed");
          setTimeout(() => {
            onSuccess(transactionData.reference!);
          }, 1500);
        } else {
          throw new Error(verifyRes.message || "Sandbox verification node rejected the transaction.");
        }
      } catch (err: any) {
        addLog(`Verification Failure: ${err.message}`);
        setErrorMessage(err.message);
        setStep("failed");
      }
    } else {
      addLog("SIMULATED ERROR: Customer cancelled checkout operations or balance exceeded.");
      setErrorMessage("Simulated Payment Error: Invoice cancelled by user.");
      setStep("failed");
    }
  };

  const triggerManualVerification = async () => {
    if (!transactionData?.reference) return;
    addLog("[User Action] Initiating immediate payment lookup check...");
    try {
      const res = await verifyPaystackTransaction(orderId, transactionData.reference);
      if (res.success) {
        addLog(`TRANSACTION COMMITTED: Payment Reference ${transactionData.reference} verified!`);
        setStep("completed");
        setTimeout(() => {
          onSuccess(transactionData.reference!);
        }, 1500);
      } else {
        addLog(`Manual Verification Check Status: ${res.message || "Pending/Unsettled"}`);
        const lowerMsg = (res.message || "").toLowerCase();
        const isDefinitiveFailure = 
          lowerMsg.includes("fail") || 
          lowerMsg.includes("cancel") || 
          lowerMsg.includes("abandon") || 
          lowerMsg.includes("reject") ||
          lowerMsg.includes("invalid") ||
          lowerMsg.includes("expired") ||
          lowerMsg.includes("declined");

        if (isDefinitiveFailure) {
          addLog("TRANSACTION DECLARED FAILED: Checked and found a terminal state with the gateway.");
          setErrorMessage(res.message || "Payment transaction was rejected or cancelled at the gateway.");
          setStep("failed");
        } else {
          alert(`Verification Status: "${res.message || 'Payment is still pending on Paystack'}"\n\nIf you completed the secure payment, please wait a moment or click again.`);
        }
      }
    } catch (err: any) {
      addLog(`Status check query warning: ${err.message}`);
      alert(`Could not verify payment: ${err.message}`);
    }
  };

  // Continuous loop monitoring real Paystack transaction
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "processing_real" && transactionData?.reference) {
      const maxPollAttempts = 40;
      interval = setInterval(async () => {
        setPollAttempts((prev) => {
          const next = prev + 1;
          addLog(`Polling Paystack network validation node... Attempt ${next}/${maxPollAttempts}`);
          
          verifyPaystackTransaction(orderId, transactionData.reference!)
            .then((res) => {
              if (res.success) {
                addLog(`TRANSACTION COMMITTED: Payment Reference ${transactionData.reference} verified!`);
                clearInterval(interval);
                setStep("completed");
                setTimeout(() => {
                  onSuccess(transactionData.reference!);
                }, 1500);
              } else {
                // If payment check returned a definitive failure
                const lowerMsg = (res.message || "").toLowerCase();
                const isDefinitiveFailure = 
                  lowerMsg.includes("fail") || 
                  lowerMsg.includes("cancel") || 
                  lowerMsg.includes("abandon") || 
                  lowerMsg.includes("reject") ||
                  lowerMsg.includes("invalid") ||
                  lowerMsg.includes("expired") ||
                  lowerMsg.includes("declined");

                if (isDefinitiveFailure) {
                  addLog(`TRANSACTION STALL GENTLY TERMINATED: ${res.message || 'Gateway reported transaction failed'}`);
                  clearInterval(interval);
                  setErrorMessage(res.message || "The payment transaction was cancelled, expired, or rejected by the gateway.");
                  setStep("failed");
                } else {
                  addLog(`Gateway reported: Payment is still pending (Hold state)...`);
                }
              }
            })
            .catch((err) => {
              addLog(`Network lookup warning: ${err.message}`);
            });

          if (next >= maxPollAttempts) {
            clearInterval(interval);
            addLog("ERROR: High timeout threshold exceeded verifying transaction status.");
            setErrorMessage("Query timeout exceeded. If you completed payment, check your client order logs.");
            setStep("failed");
          }
          return next;
        });
      }, 4000);
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
          className="relative w-full max-w-lg bg-[#121212] border border-[#C5A059]/30 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header Banner */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#1E1A12] to-[#121212] border-b border-[#C5A059]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#C5A059]" />
              <h3 className="text-base font-semibold tracking-wide text-white uppercase font-mono">
                Tech Secure Payments
              </h3>
            </div>
            {isKeyDefined !== null && (
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                isKeyDefined ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {isKeyDefined ? "Live Gateway" : "Sim Sandbox"}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Amount Visualizer */}
            <div className="p-4 bg-[#181818] border border-white/5 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Order Invoice Ref</p>
                <p className="font-mono text-xs text-white mt-0.5">{orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-medium">Invoice Sum</p>
                <p className="text-lg font-semibold text-[#C5A059] font-mono mt-0.5">KES {totalAmount.toLocaleString()}/=</p>
              </div>
            </div>

            {/* Animation state controls */}
            {step === "checking" && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                <p className="text-xs text-muted-foreground font-mono">Performing client parameters & network audit...</p>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs leading-relaxed text-[#D2D2D2]">
                  {isKeyDefined ? (
                    <p className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                      <span>Ready to trigger Live Paystack billing connection. You'll be redirected securely to finalize the balance.</span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-amber-400/90">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Server is presently conducting payments via simulation (Sandbox Mode) as live gateway credentials are unspecified.</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all font-mono"
                  >
                    Modify Order
                  </button>
                  <button
                    onClick={handleStartPayment}
                    className="flex-1 py-2.5 px-4 bg-[#C5A059] hover:bg-[#B38F48] active:scale-95 text-black font-semibold text-xs rounded-lg transition-all font-mono shadow-md shadow-[#C5A059]/20"
                  >
                    Initiate Paystack Gateway
                  </button>
                </div>
              </div>
            )}

            {step === "initializing" && (!transactionData || transactionData.mode !== "simulated") && (
              <div className="py-4 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                <p className="text-xs text-muted-foreground font-mono">Negotiating server checkout token...</p>
              </div>
            )}

            {/* Simulated Choice popup */}
            {step === "initializing" && transactionData?.mode === "simulated" && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-semibold text-amber-300 font-mono">Simulation Sandbox Console</p>
                </div>
                <p className="text-xs text-[#BCBCBC] leading-relaxed">
                  Choose a sandbox resolution to simulate direct integration response:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleSimulatedPay("success")}
                    className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded font-mono transition-colors"
                  >
                    Simulate Paid (Verify)
                  </button>
                  <button
                    onClick={() => handleSimulatedPay("fail")}
                    className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded font-mono transition-colors"
                  >
                    Simulate Cancel
                  </button>
                </div>
              </div>
            )}

            {step === "processing_real" && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <p className="text-xs font-semibold text-emerald-300 font-mono">Production Checkout Active</p>
                </div>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  We've successfully created the checkout session. If the Paystack security window didn't open automatically, use the button below to launch it:
                </p>
                
                <div className="flex flex-col gap-2">
                  {transactionData?.authUrl && (
                    <button
                      onClick={() => window.open(transactionData.authUrl, "_blank")}
                      className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-semibold rounded transition-all font-mono text-center"
                    >
                      💳 Open Payment Window
                    </button>
                  )}
                  
                  <button
                    onClick={triggerManualVerification}
                    className="w-full py-2.5 px-4 bg-[#C5A059] hover:bg-[#B38F48] active:scale-95 text-black font-semibold text-xs rounded transition-all font-mono text-center shadow-md shadow-[#C5A059]/20"
                  >
                    ⚡ I Have Completed Payment (Verify Instantly!)
                  </button>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-mono">Polling Net Node: {pollAttempts} requests</span>
                  <button
                    onClick={() => {
                      setStep("ready");
                      addLog("Billing monitor paused by user request.");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-white font-mono underline"
                  >
                    Cancel Monitor
                  </button>
                </div>
              </div>
            )}

            {step === "completed" && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                <p className="text-sm font-semibold text-emerald-300 font-mono uppercase tracking-wider">Payment Validated!</p>
                <p className="text-xs text-muted-foreground font-mono">Synchronizing order logs to database...</p>
              </div>
            )}

            {step === "failed" && (
              <div className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">Transaction Halt</h4>
                </div>
                <p className="text-xs text-[#DFDFDF] leading-relaxed font-mono bg-black/40 p-3 rounded border border-white/5">
                  {errorMessage || "An unexpected error interrupted secure checkout operations."}
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={runPreFlightChecks}
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-white transition-all text-center"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-300 text-xs font-mono rounded transition-all text-center font-semibold"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Real-time Explicit Logger */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                Operation Audit Logs
              </label>
              <div className="h-32 overflow-y-auto bg-black border border-white/5 p-3 rounded font-mono text-[9px] text-[#A0A0A0] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground italic select-none">No active operations in progress.</p>
                ) : (
                  logs.map((log, index) => (
                    <p key={index} className="leading-normal break-words whitespace-pre-wrap select-all selection:bg-white/20">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
