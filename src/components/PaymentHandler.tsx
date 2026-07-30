import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, Loader2, CreditCard } from "lucide-react";

interface PaymentHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerEmail: string;
  totalAmount: number;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  initializeMegaPayTransaction?: (orderId: string, email: string, amount: number) => Promise<{
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
  initializePaystackTransaction?: (orderId: string, email: string, amount: number) => Promise<{
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

  const [step, setStep] = useState<"checking" | "ready" | "initializing" | "processing_real" | "completed" | "failed">("checking");
  const [logs, setLogs] = useState<string[]>([]);
  const [isKeyDefined, setIsKeyDefined] = useState<boolean | null>(null);
  const [transactionData, setTransactionData] = useState<{ reference?: string; authUrl?: string; mode?: "real" | "simulated" } | null>(null);
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

    addLog("Initiating MegaPay Pre-flight Validation...");
    
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
      const configRes = await fetch("/api/megapay/check-config");
      if (!configRes.ok) {
        throw new Error(`Config audit returned HTTP error ${configRes.status}`);
      }
      
      const configData = await configRes.json();
      setIsKeyDefined(configData.configured);
      
      if (configData.configured) {
        addLog("Security Check: Live MEGAPAY_API_KEY verified in server environment.");
        addLog("MegaPay production gateway loaded. Transitioning to payment session initialization.");
      } else {
        addLog("Notice: MEGAPAY_API_KEY is undefined or pending configuration in environment variables.");
        addLog("Sandbox Safe-Mode Active. Transaction will proceed in Simulated MegaPay Mode.");
      }
      
      setStep("ready");
    } catch (err: any) {
      addLog(`ERROR: Failed completing environment security check: ${err.message}`);
      addLog("Config connection timeout. Defaulting safety check to sandbox simulation mode.");
      setIsKeyDefined(false);
      setStep("ready");
    }
  };

  const handleStartPayment = async () => {
    setStep("initializing");
    addLog(`Contacting Tech Sokoni MegaPay transaction bridge for Order ${orderId}...`);
    addLog(`Authenticating currency parameters and invoice sum: KES ${totalAmount.toLocaleString()}`);

    try {
      const initRes = await initPayment(orderId, customerEmail, totalAmount);
      
      if (initRes.success) {
        addLog(`Handshake completed! Reference identifier acquired: ${initRes.reference}`);
        setTransactionData({
          reference: initRes.reference,
          authUrl: initRes.authUrl,
          mode: initRes.mode
        });

        if (initRes.mode === "real") {
          setStep("processing_real");
          addLog("Production MegaPay transaction active.");
          addLog("System starting background polling loop to track invoice settlement on MegaPay network.");
          
          if (initRes.authUrl) {
            window.open(initRes.authUrl, "_blank");
          }
        } else {
          addLog("Simulated sandbox context ready. Waiting for user simulated choice confirmation.");
        }
      } else {
        throw new Error(initRes.message || "Failed initializing transaction on MegaPay backend server.");
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
      addLog("Verifying simulation settlement status on MegaPay Sandbox node...");
      try {
        const verifyRes = await verifyPayment(orderId, transactionData.reference);
        if (verifyRes.success) {
          addLog("INVOICE SETTLED: MegaPay payment verified successfully.");
          setStep("completed");
          setTimeout(() => {
            onSuccess(transactionData.reference!);
          }, 1500);
        } else {
          throw new Error(verifyRes.message || "MegaPay Sandbox verification node rejected the transaction.");
        }
      } catch (err: any) {
        addLog(`Verification Failure: ${err.message}`);
        setErrorMessage(err.message);
        setStep("failed");
      }
    } else {
      addLog("SIMULATED ERROR: Customer cancelled checkout operations or balance exceeded.");
      setErrorMessage("Simulated MegaPay Payment Error: Invoice cancelled by user.");
      setStep("failed");
    }
  };

  const triggerManualVerification = async () => {
    if (!transactionData?.reference) return;
    addLog("[User Action] Initiating immediate MegaPay status lookup check...");
    try {
      const res = await verifyPayment(orderId, transactionData.reference);
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
          addLog("TRANSACTION DECLARED FAILED: Checked and found a terminal state with MegaPay gateway.");
          setErrorMessage(res.message || "Payment transaction was rejected or cancelled at the gateway.");
          setStep("failed");
        } else {
          alert(`Verification Status: "${res.message || 'Payment is still pending on MegaPay'}"\n\nIf you completed the secure payment, please wait a moment or click again.`);
        }
      }
    } catch (err: any) {
      addLog(`Status check query warning: ${err.message}`);
      alert(`Could not verify payment: ${err.message}`);
    }
  };

  // Continuous loop monitoring real MegaPay transaction
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "processing_real" && transactionData?.reference) {
      const maxPollAttempts = 40;
      interval = setInterval(async () => {
        setPollAttempts((prev) => {
          const next = prev + 1;
          addLog(`Polling MegaPay network validation node... Attempt ${next}/${maxPollAttempts}`);
          
          verifyPayment(orderId, transactionData.reference!)
            .then((res) => {
              if (res.success) {
                addLog(`TRANSACTION COMMITTED: Payment Reference ${transactionData.reference} verified!`);
                clearInterval(interval);
                setStep("completed");
                setTimeout(() => {
                  onSuccess(transactionData.reference!);
                }, 1500);
              } else {
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
                  addLog(`TRANSACTION STALL TERMINATED: ${res.message || 'MegaPay reported transaction failed'}`);
                  clearInterval(interval);
                  setErrorMessage(res.message || "The payment transaction was cancelled, expired, or rejected by MegaPay.");
                  setStep("failed");
                } else {
                  addLog(`MegaPay reported: Payment is still pending (Hold state)...`);
                }
              }
            })
            .catch((err) => {
              addLog(`Network lookup warning: ${err.message}`);
            });

          if (next >= maxPollAttempts) {
            clearInterval(interval);
            addLog("ERROR: High timeout threshold exceeded verifying MegaPay status.");
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
          className="relative w-full max-w-lg bg-[#121212] border border-[#C5A059]/30 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header Banner */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#1E1A12] via-[#151515] to-[#121212] border-b border-[#C5A059]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#8C6D2D] p-0.5 flex items-center justify-center shadow-lg">
                <CreditCard className="w-4 h-4 text-black font-bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-white font-sans flex items-center gap-1.5">
                  MegaPay Gateway
                  <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] font-mono px-1.5 py-0.2 rounded border border-[#C5A059]/30">v1.0</span>
                </h3>
                <p className="text-[10px] text-white/50 font-mono">Secure Card & Mobile Payment Settlement</p>
              </div>
            </div>
            {isKeyDefined !== null && (
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isKeyDefined ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}>
                {isKeyDefined ? "MegaPay Live" : "MegaPay Sandbox"}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Amount Visualizer */}
            <div className="p-4 bg-[#181818] border border-white/5 rounded-xl flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Order Invoice Ref</p>
                <p className="font-mono text-xs text-white mt-0.5 font-bold">{orderId}</p>
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
                <p className="text-xs text-muted-foreground font-mono">Performing MegaPay client parameters & network audit...</p>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs leading-relaxed text-[#D2D2D2]">
                  {isKeyDefined ? (
                    <p className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                      <span>Ready to trigger Live MegaPay billing connection. You'll be redirected securely to finalize the balance.</span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-amber-400/90">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Server is presently conducting payments via MegaPay Simulation (Sandbox Mode) while API keys are configured.</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all font-mono"
                  >
                    Modify Order
                  </button>
                  <button
                    onClick={handleStartPayment}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#C5A059] to-[#9E7A37] hover:from-[#B38F48] hover:to-[#8C6B2D] active:scale-95 text-black font-bold text-xs rounded-xl transition-all font-mono shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Initiate MegaPay Gateway
                  </button>
                </div>
              </div>
            )}

            {step === "initializing" && (!transactionData || transactionData.mode !== "simulated") && (
              <div className="py-4 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                <p className="text-xs text-muted-foreground font-mono">Negotiating MegaPay server checkout token...</p>
              </div>
            )}

            {/* Simulated Choice popup */}
            {step === "initializing" && transactionData?.mode === "simulated" && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-semibold text-amber-300 font-mono">MegaPay Simulation Sandbox Console</p>
                </div>
                <p className="text-xs text-[#BCBCBC] leading-relaxed">
                  Choose a sandbox resolution to simulate direct MegaPay integration response:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleSimulatedPay("success")}
                    className="py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg font-mono transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simulate Paid (Verify)
                  </button>
                  <button
                    onClick={() => handleSimulatedPay("fail")}
                    className="py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg font-mono transition-colors"
                  >
                    Simulate Cancel
                  </button>
                </div>
              </div>
            )}

            {step === "processing_real" && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <p className="text-xs font-semibold text-emerald-300 font-mono">MegaPay Production Checkout Active</p>
                </div>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  We've successfully created the MegaPay checkout session. If the MegaPay payment window didn't open automatically, use the button below to launch it:
                </p>
                
                <div className="flex flex-col gap-2">
                  {transactionData?.authUrl && (
                    <button
                      onClick={() => window.open(transactionData.authUrl, "_blank")}
                      className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-semibold rounded-lg transition-all font-mono text-center flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Open MegaPay Payment Window
                    </button>
                  )}
                  
                  <button
                    onClick={triggerManualVerification}
                    className="w-full py-2.5 px-4 bg-[#C5A059] hover:bg-[#B38F48] active:scale-95 text-black font-semibold text-xs rounded-lg transition-all font-mono text-center shadow-md shadow-[#C5A059]/20"
                  >
                    ⚡ I Have Completed Payment (Verify Instantly!)
                  </button>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-mono">Polling MegaPay Node: {pollAttempts} requests</span>
                  <button
                    onClick={() => {
                      setStep("ready");
                      addLog("MegaPay monitor paused by user request.");
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
                <p className="text-sm font-semibold text-emerald-300 font-mono uppercase tracking-wider">MegaPay Payment Validated!</p>
                <p className="text-xs text-muted-foreground font-mono">Synchronizing order logs to database...</p>
              </div>
            )}

            {step === "failed" && (
              <div className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">MegaPay Transaction Halt</h4>
                </div>
                <p className="text-xs text-[#DFDFDF] leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                  {errorMessage || "An unexpected error interrupted secure checkout operations."}
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={runPreFlightChecks}
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white transition-all text-center"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-300 text-xs font-mono rounded-lg transition-all text-center font-semibold"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Real-time Explicit Logger */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                MegaPay Operation Audit Logs
              </label>
              <div className="h-32 overflow-y-auto bg-black border border-white/5 p-3 rounded-xl font-mono text-[9px] text-[#A0A0A0] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
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
