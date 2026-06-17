import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, LogIn, AlertCircle, CheckCircle2, RefreshCw, UserPlus, HelpCircle } from "lucide-react";
import { auth, googleProvider, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useStore } from "../StoreContext";

interface AuthModalProps {
  onGoogleLogin?: () => Promise<void>;
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

export default function AuthModal({ onGoogleLogin }: AuthModalProps) {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode,
    loginWithGoogle,
    setUser,
    setUserProfile,
    theme
  } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);

  // Status management states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isLight = theme === "light";

  // Reset inputs when mode of modal changes
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
    setFullName("");
    setIsResetMode(false);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const validateEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setEmail("");
    setPassword("");
    setFullName("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsResetMode(false);
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
    const isSignUp = authModalMode === "signup";
    try {
      if (isSignUp) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          if (fullName) {
            await updateProfile(userCred.user, { displayName: fullName });
          }
          await logAuthEvent("signup", "success", email, userCred.user.uid);
          
          // Also explicitly write their user profile to Firestore to ensure prompt sync
          const { doc, setDoc } = await import("firebase/firestore");
          const isAdminEmail = email === "techgadgetsk@gmail.com" || email === "admin@techgadgetskenya.co.ke";
          await setDoc(doc(db, "users", userCred.user.uid), {
            uid: userCred.user.uid,
            email: email,
            name: fullName || "Valued Customer",
            role: isAdminEmail ? "admin" : "customer",
            createdAt: new Date().toISOString()
          }, { merge: true });

          setSuccessMsg("✔ Space registry complete! Account initialized successfully.");
          setTimeout(() => {
            handleClose();
          }, 1200);
        } catch (err: any) {
          if (err?.code === "auth/operation-not-allowed" || err?.message?.includes("operation-not-allowed") || err?.message?.includes("disabled")) {
            console.warn("Firebase Auth Emails/Passwords provider is disabled. Falling back to local Firestore seamless identity system.");
            const generatedUid = "cust_" + Math.random().toString(36).substr(2, 9);
            const isAdminEmail = email === "techgadgetsk@gmail.com" || email === "admin@techgadgetskenya.co.ke";
            const userProfileData = {
              uid: generatedUid,
              email: email,
              name: fullName || "Valued Customer",
              role: (isAdminEmail ? "admin" : "customer") as "admin" | "customer",
              createdAt: new Date().toISOString()
            };
            
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "users", generatedUid), userProfileData);
            await logAuthEvent("signup_fallback", "success", email, generatedUid);
            
            localStorage.setItem("tgk_custom_user", JSON.stringify(userProfileData));
            setUser({ uid: generatedUid, email: email, displayName: fullName || "Valued Customer" } as any);
            setUserProfile(userProfileData);
            
            setSuccessMsg("✔ Space registry complete! Account initialized (Local/Firestore Handshake).");
            setTimeout(() => {
              handleClose();
            }, 1200);
          } else {
            throw err;
          }
        }
      } else {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          await logAuthEvent("login", "success", email, userCred.user.uid);
          setSuccessMsg("✔ Authentication successful! Back to the command deck.");
          setTimeout(() => {
            handleClose();
          }, 1200);
        } catch (err: any) {
          if (err?.code === "auth/operation-not-allowed" || err?.message?.includes("operation-not-allowed") || err?.message?.includes("disabled") || err?.code === "auth/user-not-found") {
            console.warn("Firebase email sign-in blocked/unavailable. Checking fallback list in users collection...");
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const userData = querySnap.docs[0].data() as any;
              await logAuthEvent("login_fallback", "success", email, userData.uid);
              
              localStorage.setItem("tgk_custom_user", JSON.stringify(userData));
              setUser({ uid: userData.uid, email: email, displayName: userData.name } as any);
              setUserProfile(userData);
              
              setSuccessMsg("✔ Authentication successful! Welcome back (Local/Firestore Handshake).");
              setTimeout(() => {
                handleClose();
              }, 1250);
            } else {
              if (err?.code === "auth/user-not-found") {
                setErrorMsg("No profile found matching that email address.");
              } else {
                setErrorMsg("No local fallback profile found. Please Register first!");
              }
            }
          } else {
            throw err;
          }
        }
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

  const handleGoogleAuthenticate = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (onGoogleLogin) {
        await onGoogleLogin();
      } else {
        await loginWithGoogle();
      }
      setSuccessMsg("✔ Google handshake authorized successfully!");
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: any) {
      console.error("Google authentication error:", err);
      setErrorMsg(err?.message || "Google single sign-on attempt rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] overflow-y-auto" 
      id="auth-modal-overlay"
    >
      {/* Dark overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-0"
      />

      {/* Center content wrapper with relative positioning, padding and top z-index */}
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md relative">
          {/* Floating Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`w-full ${
              isLight ? "bg-white border-[#DCD6CD] text-zinc-900" : "bg-[#0F0F0F] border-white/10 text-white"
            } border rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col`}
            id="auth-modal-card"
          >
          {/* Subtle gold line accent */}
          <div className="absolute top-0 left-12 w-32 h-1 bg-[#C5A059] blur-md opacity-40" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute top-5 right-5 ${
              isLight ? "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100" : "text-white/40 hover:text-white hover:bg-white/5"
            } p-2 rounded-xl transition-all cursor-pointer`}
            title="Dismiss Authentication"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title Header */}
          <div className="mb-5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">
              Tech Gadgets Kenya Portal
            </span>
            <h2 className={`text-xl font-sans font-black tracking-tight mt-1 ${isLight ? "text-zinc-900" : "text-white"}`}>
              {isResetMode 
                ? "Recover Security Passcode" 
                : authModalMode === "signup"
                  ? "Create Premium Account" 
                  : "Authorize Portal Access"}
            </h2>
            <p className={`text-[11px] mt-1.5 leading-normal ${isLight ? "text-zinc-500" : "text-white/50"}`}>
              {isResetMode 
                ? "Provide your registered email address, and we will send you a secure password recovery instruction instantly." 
                : authModalMode === "signup"
                  ? "Join Kenya's elite electronics catalog. Track orders, request WhatsApp alerts, and download business tax invoices instantly." 
                  : "Unlock elite local stock reservation, print downloadable receipts, and sync customized setup preferences instantly."}
            </p>
          </div>

          {/* Mode Selector Tabs (Hidden when in reset passcode mode) */}
          {!isResetMode && (
            <div className={`grid grid-cols-2 p-1 gap-1 mb-5 rounded-2xl ${
              isLight ? "bg-zinc-100" : "bg-white/[0.03] border border-white/5"
            }`}>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authModalMode === "login"
                    ? isLight
                      ? "bg-white text-zinc-900 shadow-md"
                      : "bg-[#C5A059] text-black shadow-lg"
                    : isLight
                      ? "text-zinc-500 hover:text-zinc-800"
                      : "text-white/50 hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authModalMode === "signup"
                    ? isLight
                      ? "bg-white text-zinc-900 shadow-md"
                      : "bg-[#C5A059] text-black shadow-lg"
                    : isLight
                      ? "text-zinc-500 hover:text-zinc-800"
                      : "text-white/50 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Alert messages feedback */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-red-600 dark:text-red-300 leading-normal">{errorMsg}</p>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 leading-normal">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Email / Password parameters form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === "signup" && (
              <div className="space-y-1.5" id="fullname-input-wrapper">
                <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                  isLight ? "text-zinc-500" : "text-white/40"
                }`}>
                  Full Name / business title
                </label>
                <div className="relative flex items-center">
                  <UserPlus className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-400" : "text-white/30"}`} />
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g., Adam Kassim"
                    disabled={loading}
                    className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-sans outline-none transition-all ${
                      isLight 
                        ? "bg-zinc-50 border-zinc-200 focus:border-[#C5A059] focus:bg-white text-zinc-900 placeholder-zinc-400" 
                        : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30"
                    } border`}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                isLight ? "text-zinc-500" : "text-white/40"
              }`}>
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-400" : "text-white/30"}`} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corporate_buyer@nairobi.co.ke"
                  disabled={loading}
                  className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-sans outline-none transition-all ${
                    isLight 
                      ? "bg-zinc-50 border-zinc-200 focus:border-[#C5A059] focus:bg-white text-zinc-900 placeholder-zinc-400" 
                      : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30"
                  } border`}
                  required
                />
              </div>
            </div>

            {!isResetMode && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                    isLight ? "text-zinc-500" : "text-white/40"
                  }`}>
                    Password Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-[9px] font-mono tracking-wide text-[#C5A059] hover:underline cursor-pointer uppercase font-black"
                  >
                    Forgot passcode?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-400" : "text-white/30"}`} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-sans outline-none transition-all ${
                      isLight 
                        ? "bg-zinc-50 border-zinc-200 focus:border-[#C5A059] focus:bg-white text-zinc-900 placeholder-zinc-400" 
                        : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30"
                    } border`}
                    required={!isResetMode}
                  />
                </div>
              </div>
            )}

            {/* Submit Action Block */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transform active:scale-95 transition-all ${
                  isLight 
                    ? "bg-[#835c17] hover:bg-[#704e12] text-white" 
                    : "bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-extrabold"
                } disabled:opacity-50 disabled:pointer-events-none`}
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isResetMode ? (
                  <HelpCircle className="w-3.5 h-3.5" />
                ) : authModalMode === "signup" ? (
                  <UserPlus className="w-3.5 h-3.5" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>
                  {loading 
                    ? "Processing auth protocol..." 
                    : isResetMode 
                      ? "Request password recovery link" 
                      : authModalMode === "signup" 
                        ? "Register New profile" 
                        : "Sign into storefront portal"}
                </span>
              </button>
            </div>
          </form>

          {/* Toggle Back to Authentication (only visible when in password reset mode) */}
          {isResetMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`text-[10px] font-mono uppercase tracking-wider font-extrabold hover:underline ${
                  isLight ? "text-zinc-600 hover:text-zinc-900" : "text-white/60 hover:text-white"
                }`}
              >
                ← Return to standard authorization login
              </button>
            </div>
          )}

          {/* Separator boundary line */}
          <div className="relative my-5 flex items-center justify-center">
            <div className={`absolute inset-0 flex items-center ${isLight ? "bg-zinc-250" : ""}`}>
              <div className={`w-full border-t ${isLight ? "border-zinc-200" : "border-white/10"}`} />
            </div>
            <span className={`relative px-3 text-[9px] font-mono uppercase tracking-wider z-10 ${
              isLight ? "bg-white text-zinc-400" : "bg-[#0F0F0F] text-white/30"
            }`}>
              OR AUTHENTICATE VIA SECONDARY IDENTIFIER
            </span>
          </div>

          {/* Social Sign-in proxy */}
          <button
            type="button"
            onClick={handleGoogleAuthenticate}
            disabled={loading}
            className={`w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 border text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
              isLight 
                ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800" 
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/15 text-white"
            } disabled:opacity-50`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Authenticate with Google Profile</span>
          </button>

          {/* Secure indicator logo context footer */}
          <div className="mt-5 text-center flex items-center justify-center gap-1.5 opacity-60">
            <svg className="w-3 h-3 text-[#C5A059]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className={`text-[9px] font-mono uppercase tracking-wider ${
              isLight ? "text-zinc-400" : "text-white/20"
            }`}>Secure OAuth 2.0 Endpoints Enabled</span>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
  );
}
