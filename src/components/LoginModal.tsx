import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, LogIn, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { auth, googleProvider, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup 
} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
}

const logAuthEvent = async (eventType: string, status: string, email: string, userId?: string, error?: string) => {
  try {
    await addDoc(collection(db, "auth_events"), {
      eventType,
      status,
      email,
      userId: userId || "",
      errorMessage: error || "",
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to write auth event log:", err);
  }
};

export default function LoginModal({ isOpen, onClose, onGoogleLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Reset password mode
  const [isResetMode, setIsResetMode] = useState(false);

  // Status management states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const validateEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email format.");
      return;
    }

    if (isResetMode) {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        await logAuthEvent("password_reset", "success", email);
        setSuccessMsg("✔ A secure password-reset link has been dispatched to your inbox. Check your email!");
        setErrorMsg("");
      } catch (err: any) {
        console.error("Password reset error:", err);
        await logAuthEvent("password_reset", "failed", email, undefined, err.message);
        if (err?.code === "auth/user-not-found") {
          setErrorMsg("We could not find an account matching that email address.");
        } else {
          setErrorMsg(err?.message || "Failed to issue password recovery link.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg("Please provide your account security password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password security requirement: Must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await logAuthEvent("signup", "success", email, userCred.user.uid);
        setSuccessMsg("✔ Space registry complete! Account initialized successfully.");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await logAuthEvent("login", "success", email, userCred.user.uid);
        setSuccessMsg("✔ Authentication successful! Back to the command deck.");
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      await logAuthEvent(isSignUp ? "signup" : "login", "failed", email, undefined, err.message);
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Invalid authorization credentials. Please verify your email and password.");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("This email address is already bound to an active customer identifier.");
      } else {
        setErrorMsg(err?.message || "Authentication attempt rejected.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start sm:items-center justify-center p-4" id="login-modal-overlay">
      {/* Dark overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Floating Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-left overflow-hidden text-white my-auto"
        id="login-modal-card"
      >
        {/* Subtle decorative glow effect */}
        <div className="absolute top-0 left-12 w-32 h-1 bg-[#C5A059] blur-md opacity-30" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer"
          title="Dismiss Sign-In Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title Block */}
        <div className="mb-6">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">
            Portal Authorization Gateway
          </span>
          <h2 className="text-xl font-sans font-bold tracking-tight text-white mt-1">
            {isResetMode 
              ? "Recover Security Passcode" 
              : isSignUp 
                ? "Initiate Security Registry" 
                : "Authorize Account Access"}
          </h2>
          <p className="text-white/40 text-[11px] mt-1">
            {isResetMode 
              ? "Enter your registered email address below, and our systems will dispatch a secure password reset link directly to your inbox." 
              : isSignUp 
                ? "Configure a secure set of credentials to establish a personal storefront profile database." 
                : "Unlock access to premium transactional histories, personalized hardware registries, and fast checkouts."}
          </p>
        </div>

        {/* Alert/Status Banner notifications */}
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/25 rounded-2xl p-4 mb-4 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-red-300 leading-normal">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-2xl p-4 mb-4 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-emerald-300 leading-normal">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@system.com"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password input field (hidden in Reset mode) */}
          {!isResetMode && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Security Password</label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-[10px] font-mono text-[#C5A059] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required={!isResetMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A059] text-black hover:bg-[#C5A059]/90 py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isResetMode ? (
              <span>Dispatch Secure Recovery Link</span>
            ) : isSignUp ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Initialize Account Registry</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Authorize Credentials</span>
              </>
            )}
          </button>
        </form>

        {/* Alternate login & mode toggles */}
        {!isResetMode && (
          <div className="mt-5 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0A0A0A] px-3 text-[9px] font-mono uppercase tracking-widest text-white/30 absolute">OR</span>
            </div>

            {/* Google Sign-in proxy */}
            <button
              type="button"
              onClick={async () => {
                await onGoogleLogin();
                onClose();
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-4 rounded-2xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#C5A059]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Authenticate with Google</span>
            </button>
          </div>
        )}

        {/* Footer toggles */}
        <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-mono text-white/40">
          {isResetMode ? (
            <button
              onClick={() => {
                setIsResetMode(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-[#C5A059] hover:underline"
            >
              ← Back to Access Sign In
            </button>
          ) : (
            <>
              <span>
                {isSignUp ? "Already have an account?" : "No account configured?"}
              </span>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[#C5A059] hover:underline font-bold"
              >
                {isSignUp ? "Sign In Instead" : "Establish Profile Registry"}
              </button>
            </>
          )}
          
          <span className="text-[9px] text-white/20">Secure OAuth 2.0 Enabled</span>
        </div>
      </motion.div>
    </div>
  );
}
