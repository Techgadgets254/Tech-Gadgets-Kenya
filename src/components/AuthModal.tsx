import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, LogIn, AlertCircle, CheckCircle2, RefreshCw, UserPlus, HelpCircle, Eye, EyeOff, ShieldAlert, ShieldCheck, Check } from "lucide-react";
import { auth, googleProvider, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
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
    user,
    userProfile,
    setActiveView,
    logout,
    theme
  } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "verify">("email");
  const [resetCode, setResetCode] = useState("");
  const [resetExpiresAt, setResetExpiresAt] = useState<number | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const displayNameRef = useRef<HTMLInputElement>(null);

  // Status management states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Account Lockout protection states
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);

  // Last sent password reset verification code & OTP states
  const [lastSentCode, setLastSentCode] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState<boolean>(false);

  const isLight = theme === "light";

  // Resend cooldown countdown timer effect (60s limit)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Account lockout countdown timer effect
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutTimeLeft(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Live 15-minute countdown timer effect
  useEffect(() => {
    if (!resetExpiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((resetExpiresAt - Date.now()) / 1000));
      setTimeLeftSec(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [resetExpiresAt]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const syncOtpDigits = (fullCode: string) => {
    setResetCode(fullCode);
    const digitsOnly = fullCode.replace(/\D/g, "");
    const chars = digitsOnly.slice(0, 6).split("");
    while (chars.length < 6) chars.push("");
    setOtpDigits(chars);
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const digitsOnly = val.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split("");
      while (chars.length < 6) chars.push("");
      setOtpDigits(chars);
      setResetCode(chars.join(""));
      otpInputRefs.current[Math.min(5, digitsOnly.length - 1)]?.focus();
      return;
    }

    const singleChar = digitsOnly.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleChar;
    setOtpDigits(updated);
    setResetCode(updated.join(""));

    if (singleChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const getPasswordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(p) || /[^a-zA-Z0-9]/.test(p)) score++;
    
    let color = "bg-red-500";
    let text = "Weak";
    if (score >= 5) {
      color = "bg-emerald-500";
      text = "Strong";
    } else if (score >= 3) {
      color = "bg-amber-500";
      text = "Fair";
    } else if (score > 0) {
      color = "bg-rose-500";
      text = "Weak";
    } else {
      color = "bg-zinc-350 dark:bg-zinc-700";
      text = "Very Weak";
    }

    return { percentage: score * 100 / 5, color, text };
  };

  // Auto-dismiss toast helper
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reset inputs when mode of modal changes
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
    setFullName("");
    setToast(null);
    setIsResetMode(false);
    setShowPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  }, [authModalMode, isAuthModalOpen]);

  // Auto focus the Display Name (fullName) input field on signup mode mounting/opening
  useEffect(() => {
    if (isAuthModalOpen && authModalMode === "signup") {
      const timer = setTimeout(() => {
        displayNameRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const validateEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const isPasswordValid = (pw: string): boolean => {
    if (pw.length < 8) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw) && !/[^a-zA-Z0-9]/.test(pw)) return false;
    return true;
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
    if (loading) return;

    if (lockoutTimeLeft > 0) {
      const lockMsg = `🔒 Account is temporarily locked due to repeated failed login attempts. Please wait ${lockoutTimeLeft}s before trying again or use Password Reset.`;
      setErrorMsg(lockMsg);
      setToast({ type: "error", message: lockMsg });
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      const msg = "Please enter your email address.";
      setErrorMsg(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    if (!validateEmail(email)) {
      const msg = "Please enter a valid email format.";
      setErrorMsg(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    if (isResetMode) {
      if (resetStep === "email") {
        if (resendCooldown > 0) {
          const msg = `⏳ Please wait ${resendCooldown} seconds before requesting a new password reset code.`;
          setErrorMsg(msg);
          setToast({ type: "error", message: msg });
          return;
        }

        setLoading(true);
        try {
          const res = await fetch("/api/auth/send-reset-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            const expiryTime = data.expiresAtMs || (Date.now() + 15 * 60 * 1000);
            setResetExpiresAt(expiryTime);
            setTimeLeftSec(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
            setResetStep("verify");
            setResendCooldown(60); // Trigger 60s resend cooldown
            setShowResetSuccessModal(true);
            setSuccessMsg(`✔ Password reset verification code dispatched to ${email}! Check your inbox for the 6-digit code.`);
            setToast({ type: "success", message: "Verification code sent to email! Expiration window: 15 minutes." });
            await logAuthEvent("password_reset_email_sent", "success", email);
          } else {
            const errText = data.error || "Failed to dispatch password reset email.";
            setErrorMsg(errText);
            setToast({ type: "error", message: errText });
          }
        } catch (err: any) {
          console.error("Password reset email dispatch error:", err);
          const errText = err?.message || "Failed to dispatch password reset email.";
          setErrorMsg(errText);
          setToast({ type: "error", message: errText });
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!resetCode.trim()) {
        const msg = "Please enter the 6-digit verification code sent to your email.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }

      if (!newPassword) {
        const msg = "Please enter your new password passcode.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (newPassword !== confirmPassword) {
        const msg = "Passwords do not match. Please verify your passwords match.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (!isPasswordValid(newPassword)) {
        const msg = "New password does not meet safety rules (8+ chars, uppercase, digit, special char).";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }

      if (resetExpiresAt && Date.now() > resetExpiresAt) {
        const msg = "❌ Verification code has expired. Security rules enforce a 15-minute expiration for reset emails and codes. Please request a new code.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        await logAuthEvent("password_reset_attempt", "failed", email, undefined, "Code expired");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code: resetCode,
            newPassword
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          await logAuthEvent("password_reset_complete", "success", email);
          setIsVerificationSuccess(true);
          setSuccessMsg("✔ Code verified & passcode updated successfully! Proceeding to command deck.");
          setToast({ type: "success", message: "Passcode updated successfully! Proceeding." });
          setErrorMsg("");
          setTimeout(() => {
            setIsVerificationSuccess(false);
            setIsResetMode(false);
            setResetStep("email");
            setResetCode("");
            setOtpDigits(["", "", "", "", "", ""]);
            setNewPassword("");
            setConfirmPassword("");
          }, 2200);
        } else {
          const msg = data.error || "Verification failed. Please check your code.";
          setErrorMsg(msg);
          setToast({ type: "error", message: msg });
          await logAuthEvent("password_reset_complete", "failed", email, undefined, msg);
        }
      } catch (err: any) {
        console.error("Direct password reset error:", err);
        await logAuthEvent("password_reset_direct", "failed", email, undefined, err.message);
        let resetErr = err?.message || "Failed to update passcode.";
        setErrorMsg(resetErr);
        setToast({ type: "error", message: resetErr });
      } finally {
        setLoading(false);
      }
      return;
    }

    const isSignUp = authModalMode === "signup";

    if (isSignUp && !fullName.trim()) {
      const msg = "Please enter your display name or business title.";
      setErrorMsg(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    if (!password) {
      const msg = "Please provide your account security password.";
      setErrorMsg(msg);
      setToast({ type: "error", message: msg });
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        const msg = "Security rule failure: Password must be at least 8 characters.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (!/[A-Z]/.test(password)) {
        const msg = "Security rule failure: Password must contain at least one uppercase letter (A-Z).";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (!/[a-z]/.test(password)) {
        const msg = "Security rule failure: Password must contain at least one lowercase letter (a-z).";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (!/[0-9]/.test(password)) {
        const msg = "Security rule failure: Password must contain at least one digit/number (0-9).";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password) && !/[^a-zA-Z0-9]/.test(password)) {
        const msg = "Security rule failure: Password must contain at least one special character.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
    } else {
      if (password.length < 6) {
        const msg = "Password security requirement: Must be at least 6 characters.";
        setErrorMsg(msg);
        setToast({ type: "error", message: msg });
        return;
      }
    }

    setLoading(true);
    console.log("[AuthModal Registration Audit] Initiating signup submission process.", {
      email,
      fullName,
      passwordLength: password.length,
      isSignUp,
      authConfigured: !!auth
    });

    try {
      if (isSignUp) {
        try {
          console.log("[AuthModal Firebase SDK] Invoking createUserWithEmailAndPassword...");
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          
          console.log("[AuthModal Firebase SDK] User created successfully. UID:", userCred.user.uid);
          
          if (fullName) {
            console.log("[AuthModal Firebase SDK] Updating user profile displayName to:", fullName);
            await updateProfile(userCred.user, { displayName: fullName });
          }
          await logAuthEvent("signup", "success", email, userCred.user.uid);
          
          const isAdminEmail = email === "techgadgetsk@gmail.com" || email === "admin@techgadgetskenya.co.ke";
          const userProfileData = {
            uid: userCred.user.uid,
            email: email,
            name: fullName || "Valued Customer",
            role: (isAdminEmail ? "admin" : "customer") as "admin" | "customer",
            password: password,
            createdAt: new Date().toISOString()
          };

          // Also explicitly write their user profile to Firestore to ensure prompt sync
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "users", userCred.user.uid), userProfileData, { merge: true });

          // Prevent race condition on display name propagate: Set state in store manually
          setUser({ ...userCred.user, displayName: fullName } as any);
          setUserProfile(userProfileData);

          setSuccessMsg("✔ Space registry complete! Account initialized successfully.");
          setToast({ type: "success", message: "Registry complete! Account initialized successfully." });
          setTimeout(() => {
            handleClose();
          }, 1200);
        } catch (err: any) {
          const authCode = err?.code || "";
          console.error("[AuthModal Firebase SDK Failure] createUserWithEmailAndPassword threw an error during signup:", {
            code: authCode,
            message: err?.message,
            stack: err?.stack,
            email,
            isSignUpMode: true
          });

          // Specific logging for Firebase Auth 'invalid-email', 'email-already-in-use', and 'weak-password' codes
          if (authCode === "auth/invalid-email" || authCode === "invalid-email") {
            console.warn(`[Registration Incident] invalid-email detected for registration email target: ${email}`);
          } else if (authCode === "auth/email-already-in-use" || authCode === "email-already-in-use") {
            console.warn(`[Registration Incident] email-already-in-use detected. Access requested for persistent email: ${email}`);
          } else if (authCode === "auth/weak-password" || authCode === "weak-password") {
            console.warn(`[Registration Incident] weak-password rejected during registration schema validation.`);
          }

          if (authCode === "auth/operation-not-allowed" || err?.message?.includes("operation-not-allowed") || err?.message?.includes("disabled")) {
            console.warn("Firebase Auth Emails/Passwords provider is disabled. Falling back to local Firestore seamless identity system.");
            const generatedUid = "cust_" + Math.random().toString(36).substr(2, 9);
            const isAdminEmail = email === "techgadgetsk@gmail.com" || email === "admin@techgadgetskenya.co.ke";
            const userProfileData = {
              uid: generatedUid,
              email: email,
              name: fullName || "Valued Customer",
              role: (isAdminEmail ? "admin" : "customer") as "admin" | "customer",
              password: password,
              createdAt: new Date().toISOString()
            };
            
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "users", generatedUid), userProfileData);
            await logAuthEvent("signup_fallback", "success", email, generatedUid);
            
            localStorage.setItem("tgk_custom_user", JSON.stringify(userProfileData));
            setUser({ uid: generatedUid, email: email, displayName: fullName || "Valued Customer" } as any);
            setUserProfile(userProfileData);
            
            setSuccessMsg("✔ Space registry complete! Account initialized (Local/Firestore Handshake).");
            setToast({ type: "success", message: "Registry complete! Account generated (local backup)." });
            setTimeout(() => {
              handleClose();
            }, 1200);
          } else {
            // Localized custom messages mapping for outer error block
            let localizedMsg = err?.message || "Authentication attempt rejected.";
            if (authCode === "auth/invalid-email" || authCode === "invalid-email") {
              localizedMsg = "The email address provided is formatted incorrectly. Please verify the syntax of your email.";
            } else if (authCode === "auth/email-already-in-use" || authCode === "email-already-in-use") {
              localizedMsg = "This email address is already bound to an active customer identifier. Please login or reset your passcode.";
            } else if (authCode === "auth/weak-password" || authCode === "weak-password") {
              localizedMsg = "The password passcode does not satisfy deep firewall strength parameters. Please provide a stronger password.";
            }
            
            // Re-throw custom error object so that outer catch handles it elegantly with localization
            const localizedError = new Error(localizedMsg) as any;
            localizedError.code = authCode;
            throw localizedError;
          }
        }
      } else {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          await logAuthEvent("login", "success", email, userCred.user.uid);
          setFailedAttempts(0);
          setLockoutUntil(null);
          setLockoutTimeLeft(0);
          setSuccessMsg("✔ Authentication successful! Back to the command deck.");
          setToast({ type: "success", message: "Welcome back! Authentication successful." });
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
              
              if (userData.password && userData.password !== password) {
                const nextFailed = failedAttempts + 1;
                setFailedAttempts(nextFailed);
                let msg = "Invalid passcode. Please check your credentials.";
                if (nextFailed >= 5) {
                  const lockMs = 30 * 1000;
                  setLockoutUntil(Date.now() + lockMs);
                  setLockoutTimeLeft(30);
                  msg = "🔒 ACCOUNT LOCKOUT ACTIVATED: 5 failed login attempts detected. Temporary security block active for 30s.";
                } else if (nextFailed >= 3) {
                  msg = `⚠️ ACCOUNT LOCKOUT WARNING: ${nextFailed} failed login attempts recorded. Lockout triggers after 5 failed attempts.`;
                }
                setErrorMsg(msg);
                setToast({ type: "error", message: msg });
                return;
              }
              
              await logAuthEvent("login_fallback", "success", email, userData.uid);
              setFailedAttempts(0);
              setLockoutUntil(null);
              setLockoutTimeLeft(0);
              
              localStorage.setItem("tgk_custom_user", JSON.stringify(userData));
              setUser({ uid: userData.uid, email: email, displayName: userData.name } as any);
              setUserProfile(userData);
              
              setSuccessMsg("✔ Authentication successful! Welcome back (Local/Firestore Handshake).");
              setToast({ type: "success", message: "Welcome back! Authentication successful." });
              setTimeout(() => {
                handleClose();
              }, 1250);
            } else {
              if (err?.code === "auth/user-not-found") {
                const msg = "No profile found matching that email address.";
                setErrorMsg(msg);
                setToast({ type: "error", message: msg });
              } else {
                const msg = "No local fallback profile found. Please Register first!";
                setErrorMsg(msg);
                setToast({ type: "error", message: msg });
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
      let errMsg = err?.message || "Authentication attempt rejected.";
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        errMsg = "Invalid authorization credentials. Please verify your email and password.";
      } else if (err?.code === "auth/email-already-in-use" || err?.code === "email-already-in-use") {
        errMsg = "This email address is already bound to an active customer identifier.";
      } else if (err?.code === "auth/invalid-email" || err?.code === "invalid-email") {
        errMsg = "The email address provided is formatted incorrectly. Please verify the syntax of your email.";
      } else if (err?.code === "auth/weak-password" || err?.code === "weak-password") {
        errMsg = "The password passcode does not satisfy deep firewall strength parameters. Please provide a stronger password.";
      }

      if (!isSignUp && !isResetMode) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          const lockMs = 30 * 1000;
          setLockoutUntil(Date.now() + lockMs);
          setLockoutTimeLeft(30);
          errMsg = "🔒 ACCOUNT LOCKOUT ACTIVATED: 5 failed login attempts detected. Temporary security block active for 30s. Please reset your password or verify credentials.";
        } else if (nextFailed >= 3) {
          errMsg = `⚠️ ACCOUNT LOCKOUT WARNING: ${nextFailed} failed login attempts recorded. Account lockout will trigger after 5 failed attempts.`;
        }
      }

      setErrorMsg(errMsg);
      setToast({ type: "error", message: errMsg });
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
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-3 px-4.5 py-3.5 rounded-2xl shadow-2xl border font-sans font-bold text-xs max-w-sm w-[calc(100%-2rem)] ${
              toast.type === "success"
                ? isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-emerald-500/15 border-emerald-500/35 text-emerald-400"
                : isLight
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-red-500/15 border-red-500/35 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 animate-pulse" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span className="flex-1 text-left line-clamp-2">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Close toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            } p-2 rounded-xl transition-all cursor-pointer z-10`}
            title="Dismiss Authentication"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logged In User Profile View (Bypasses Login Form) */}
          {user ? (
            <div className="py-2 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#C5A059]/20 border-2 border-[#C5A059] flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-[#C5A059] shadow-lg">
                  {(userProfile?.name || user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                    {userProfile?.role === "admin" || user.email === "techgadgetsk@gmail.com" ? "⚡ Administrator" : "✓ Active Account"}
                  </span>
                </div>
                <h2 className={`text-xl font-bold font-sans tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
                  {userProfile?.name || user.displayName || "Valued Account"}
                </h2>
                <p className={`text-xs font-mono mt-1 ${isLight ? "text-zinc-500" : "text-white/50"}`}>
                  {user.email}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10">
                {(userProfile?.role === "admin" || user.email === "techgadgetsk@gmail.com") && (
                  <button
                    onClick={() => {
                      setActiveView("admin-dashboard");
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                  >
                    <span>Go to Admin Dashboard</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveView("client-dashboard");
                    setIsAuthModalOpen(false);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isLight 
                      ? "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-900" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  <span>My Orders & Invoices</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView("shop");
                    setIsAuthModalOpen(false);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isLight 
                      ? "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-900" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  <span>View Saved Items</span>
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>

          {/* Title Header */}
          <div className="mb-5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">
              Tech Sokoni Kenya Portal
            </span>
            <h2 className={`text-xl font-sans font-black tracking-tight mt-1 ${isLight ? "text-zinc-900" : "text-white"}`}>
              {isResetMode 
                ? "Reset Security Passcode" 
                : authModalMode === "signup"
                  ? "Create Premium Account" 
                  : "Authorize Portal Access"}
            </h2>
            <p className={`text-[11px] mt-1.5 leading-normal ${isLight ? "text-zinc-500" : "text-white/50"}`}>
              {isResetMode 
                ? "Provide your registered email address and define your new passcode. This will update your cloud credentials directly." 
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

          {/* Alert messages feedback & Account Lockout Warning Banner */}
          <AnimatePresence mode="wait">
            {(failedAttempts >= 3 || lockoutTimeLeft > 0) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-4 mb-4 rounded-2xl border ${
                  lockoutTimeLeft > 0 
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 dark:text-rose-200" 
                    : "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300"
                } space-y-2 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                    <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider">
                      {lockoutTimeLeft > 0 ? "Account Lockout Protection Active" : "Account Lockout Warning"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {failedAttempts} / 5 Failed
                  </span>
                </div>
                <p className="text-[11px] font-sans leading-relaxed">
                  {lockoutTimeLeft > 0 ? (
                    <>
                      Multiple unsuccessful authentication attempts detected. Requests are temporarily blocked for <strong className="font-mono font-bold underline">{lockoutTimeLeft}s</strong> to safeguard your account against brute-force attacks.
                    </>
                  ) : (
                    <>
                      Security Alert: <strong className="font-bold">{failedAttempts} unsuccessful authentication attempts</strong> logged. Reaching 5 failed attempts will trigger a 30-second security block.
                    </>
                  )}
                </p>
                {lockoutTimeLeft === 0 && (
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono">
                    <span className={isLight ? "text-amber-800 font-bold" : "text-amber-400"}>Forgot your passcode?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMsg("");
                      }}
                      className="text-[#C5A059] hover:underline font-extrabold uppercase cursor-pointer"
                    >
                      Reset Password →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

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
                  isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
                }`}>
                  Full Name / business title
                </label>
                <div className="relative flex items-center">
                  <UserPlus className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-650" : "text-white/30"}`} />
                  <input 
                    ref={displayNameRef}
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      console.log("[AuthModal Input Capture] Full Name changed:", e.target.value);
                      setFullName(e.target.value);
                    }}
                    placeholder="E.g., Adam Kassim"
                    disabled={loading}
                    className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-sans outline-none transition-all ${
                      isLight 
                        ? "bg-zinc-100/70 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 placeholder-zinc-550 border" 
                        : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30 border"
                    }`}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
              }`}>
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-650" : "text-white/30"}`} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    console.log("[AuthModal Input Capture] Email changed:", e.target.value);
                    setEmail(e.target.value);
                  }}
                  placeholder="corporate_buyer@nairobi.co.ke"
                  disabled={loading}
                  className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-sans outline-none transition-all ${
                    isLight 
                      ? "bg-zinc-100/70 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 placeholder-zinc-550 border" 
                      : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30 border"
                  }`}
                  required
                />
              </div>
            </div>

            {isResetMode && resetStep === "verify" && (
              <>
                {/* 15-Minute Live Countdown Timer Banner */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  timeLeftSec > 0
                    ? isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                    : "bg-red-500/15 border-red-500/30 text-red-400 animate-pulse"
                }`}>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                      {timeLeftSec > 0 ? "Email Code Expiration:" : "Code Expired (15 Min Limit):"}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${
                    timeLeftSec > 0 ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-red-500 text-white"
                  }`}>
                    {timeLeftSec > 0 ? formatTimeLeft(timeLeftSec) : "00:00"}
                  </span>
                </div>

                {/* 6-Digit Individual OTP Verification Code Inputs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                      isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
                    }`}>
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      disabled={loading || resendCooldown > 0}
                      onClick={async () => {
                        // Resend verification code in verify step
                        if (resendCooldown > 0) return;
                        setLoading(true);
                        try {
                          const res = await fetch("/api/auth/send-reset-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email })
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            const expiryTime = data.expiresAtMs || (Date.now() + 15 * 60 * 1000);
                            setResetExpiresAt(expiryTime);
                            setTimeLeftSec(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
                            setResendCooldown(60);
                            setResetCode("");
                            setOtpDigits(["", "", "", "", "", ""]);
                            setErrorMsg("");
                            setSuccessMsg(`✔ New 6-digit verification code dispatched to ${email}! Check your inbox.`);
                            setToast({ type: "success", message: "New code dispatched to email! Valid for 15 minutes." });
                          } else {
                            setErrorMsg(data.error || "Failed to resend verification code.");
                            setToast({ type: "error", message: data.error || "Failed to resend code." });
                          }
                        } catch (err: any) {
                          setErrorMsg("Failed to resend code.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`text-[10px] font-mono font-bold uppercase transition-all ${
                        resendCooldown > 0
                          ? isLight ? "text-zinc-400 cursor-not-allowed" : "text-white/30 cursor-not-allowed"
                          : "text-[#C5A059] hover:underline cursor-pointer"
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive email? Resend Code"}
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otpDigits[idx] || ""}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text");
                          handleOtpBoxChange(idx, pasted);
                        }}
                        disabled={loading}
                        className={`w-full h-11 rounded-xl text-center font-mono font-black text-lg outline-none transition-all ${
                          otpDigits[idx]
                            ? isLight
                              ? "bg-amber-500/10 border-[#C5A059] text-zinc-950 shadow-sm border-2"
                              : "bg-[#C5A059]/20 border-[#C5A059] text-white shadow-sm border-2"
                            : isLight
                              ? "bg-zinc-100/80 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 border"
                              : "bg-white/[0.03] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                    isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
                  }`}>
                    New Password Passcode
                  </label>
                  <div className="relative flex items-center">
                    <Lock className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-650" : "text-white/30"}`} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className={`w-full py-2.5 pl-10 pr-10 rounded-xl text-xs font-sans outline-none transition-all ${
                        isLight 
                          ? "bg-zinc-100/70 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 placeholder-zinc-550 border" 
                          : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30 border"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 p-1.5 rounded-lg opacity-85 hover:opacity-100 transition-opacity ${
                        isLight ? "text-stone-800 hover:text-black hover:bg-zinc-200" : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                      style={{ background: 'none', border: 'none' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider">
                        <span className={isLight ? "text-zinc-500" : "text-white/40"}>Password Strength:</span>
                        <span 
                          className="font-black"
                          style={{ 
                            color: getPasswordStrength(newPassword).text === "Strong" 
                              ? "#10b981" 
                              : getPasswordStrength(newPassword).text === "Fair" 
                                ? "#f59e0b" 
                                : "#ef4444" 
                          }}
                        >
                          {getPasswordStrength(newPassword).text}
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`}
                          style={{ width: `${getPasswordStrength(newPassword).percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                    isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
                  }`}>
                    Confirm Password Passcode
                  </label>
                  <div className="relative flex items-center">
                    <Lock className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-650" : "text-white/30"}`} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className={`w-full py-2.5 pl-10 pr-10 rounded-xl text-xs font-sans outline-none transition-all ${
                        isLight 
                          ? "bg-zinc-100/70 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 placeholder-zinc-550 border" 
                          : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30 border"
                      }`}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {!isResetMode && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                    isLight ? "text-zinc-850 font-extrabold" : "text-white/40"
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
                  <Lock className={`w-3.5 h-3.5 absolute left-3.5 ${isLight ? "text-zinc-650" : "text-white/30"}`} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      console.log("[AuthModal Input Capture] Password text updating...");
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full py-2.5 pl-10 pr-10 rounded-xl text-xs font-sans outline-none transition-all ${
                      isLight 
                        ? "bg-zinc-100/70 border-zinc-300 focus:border-[#C5A059] focus:bg-white text-zinc-950 placeholder-zinc-550 border" 
                        : "bg-white/[0.02] border-white/10 focus:border-[#C5A059] focus:bg-[#151515] text-white placeholder-white/30 border"
                    }`}
                    required={!isResetMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 p-1.5 rounded-lg opacity-85 hover:opacity-100 transition-opacity ${
                      isLight ? "text-stone-800 hover:text-black hover:bg-zinc-200" : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                    style={{ background: 'none', border: 'none' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                  </button>
                </div>

                {authModalMode === "signup" && password && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider">
                      <span className={isLight ? "text-zinc-500" : "text-white/40"}>Password Strength:</span>
                      <span 
                        className="font-black"
                        style={{ 
                          color: getPasswordStrength(password).text === "Strong" 
                            ? "#10b981" 
                            : getPasswordStrength(password).text === "Fair" 
                              ? "#f59e0b" 
                              : "#ef4444" 
                        }}
                      >
                        {getPasswordStrength(password).text}
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                        style={{ width: `${getPasswordStrength(password).percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {authModalMode === "signup" && (
                  <div className={`mt-2.5 p-3 rounded-xl border text-[10px] font-sans space-y-1.5 leading-normal transition-all ${
                    isLight ? "bg-zinc-50 border-zinc-200 text-zinc-650" : "bg-white/[0.02] border-white/5 text-white/50"
                  }`}>
                    <p className="font-mono font-bold uppercase text-[8px] tracking-wider text-[#C5A059]">Security password rules checklist:</p>
                    <ul className="list-disc pl-3.5 space-y-1">
                      <li className={password.length >= 8 ? "text-emerald-500 font-extrabold" : "text-amber-500/80"}>
                        At least 8 characters long {password.length >= 8 && "✔"}
                      </li>
                      <li className={/[A-Z]/.test(password) ? "text-emerald-500 font-extrabold" : "text-amber-500/80"}>
                        At least one uppercase letter (A-Z) {/[A-Z]/.test(password) && "✔"}
                      </li>
                      <li className={/[a-z]/.test(password) ? "text-emerald-500 font-extrabold" : "text-amber-500/80"}>
                        At least one lowercase letter (a-z) {/[a-z]/.test(password) && "✔"}
                      </li>
                      <li className={/[0-9]/.test(password) ? "text-emerald-500 font-extrabold" : "text-amber-500/80"}>
                        At least one number/digit (0-9) {/[0-9]/.test(password) && "✔"}
                      </li>
                      <li className={(/[!@#$%^&*(),.?":{}|<>]/.test(password) || /[^a-zA-Z0-9]/.test(password)) ? "text-emerald-500 font-extrabold" : "text-amber-500/80"}>
                        At least one special character (e.g., !, @, #, $, *) {(/[!@#$%^&*(),.?":{}|<>]/.test(password) || /[^a-zA-Z0-9]/.test(password)) && "✔"}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action Block */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  loading || 
                  lockoutTimeLeft > 0 ||
                  (authModalMode === "signup" && !isResetMode && !isPasswordValid(password)) || 
                  (isResetMode && resetStep === "email" && (!email || !validateEmail(email))) ||
                  (isResetMode && resetStep === "verify" && (!resetCode || !newPassword || newPassword !== confirmPassword || !isPasswordValid(newPassword)))
                }
                className={`w-full py-3 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transform active:scale-95 transition-all ${
                  isLight 
                    ? "bg-[#835c17] hover:bg-[#704e12] text-white" 
                    : "bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-extrabold"
                } disabled:opacity-50 disabled:pointer-events-none`}
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : lockoutTimeLeft > 0 ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : isResetMode ? (
                  <Mail className="w-3.5 h-3.5" />
                ) : authModalMode === "signup" ? (
                  <UserPlus className="w-3.5 h-3.5" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>
                  {loading 
                    ? "Processing..." 
                    : lockoutTimeLeft > 0
                      ? `🔒 Account Locked (${lockoutTimeLeft}s)`
                      : isResetMode 
                        ? resetStep === "email"
                          ? "Send Reset Email (15 Min Expiry)"
                          : "Verify Code & Reset Password"
                        : authModalMode === "signup" 
                          ? "Register New profile" 
                          : "Sign into storefront portal"}
                </span>
              </button>
            </div>
          </form>

          {/* Toggle Back to Authentication / Resend Reset Code */}
          {isResetMode && (
            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              {resetStep === "verify" && (
                <button
                  type="button"
                  onClick={() => {
                    setResetStep("email");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider text-[#C5A059] font-extrabold hover:underline"
                >
                  ↻ Resend Password Reset Email
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setResetStep("email");
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
          </>
          )}
        </motion.div>
      </div>

      {/* DEDICATED "PASSWORD RESET REQUESTED" SUCCESS MODAL POP-UP */}
      <AnimatePresence>
        {showResetSuccessModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0B0B0B] border border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-white text-left"
            >
              {/* Close icon */}
              <button
                type="button"
                onClick={() => setShowResetSuccessModal(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with Gold Security Icon */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#C5A059]/15 border border-[#C5A059]/30 rounded-2xl text-[#C5A059] shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-lg text-white tracking-tight">
                    Verification Code Dispatched
                  </h3>
                  <p className="text-xs text-white/60 font-sans mt-0.5">
                    6-Digit Security Code Sent to Email
                  </p>
                </div>
              </div>

              {/* Target Email Banner */}
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-white/40 text-[10px] uppercase">Client Email:</span>
                <span className="font-bold text-[#C5A059] truncate max-w-[220px]">{email}</span>
              </div>



              {/* 15-Minute Expiration Notice Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-mono font-extrabold text-[#C5A059] uppercase tracking-wider">
                      15-Minute Validity Limit
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-300 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {timeLeftSec > 0 ? formatTimeLeft(timeLeftSec) : "00:00"}
                  </span>
                </div>

                <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
                  ⏰ <strong>Security Policy Notice:</strong> For account security, 6-digit verification codes sent via email strictly expire in <strong>15 minutes</strong> ({resetExpiresAt ? new Date(resetExpiresAt).toLocaleTimeString("en-KE", { timeZone: "Africa/Nairobi" }) : "15 mins"} EAT).
                </p>
              </div>

              {/* Step-by-step guidance */}
              <div className="space-y-2 text-xs text-white/80 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl font-sans">
                <div className="flex items-start gap-2">
                  <span className="bg-[#C5A059]/20 text-[#C5A059] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">1</span>
                  <span>Check your email inbox for your 6-digit verification code.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-[#C5A059]/20 text-[#C5A059] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">2</span>
                  <span>Click <strong>Proceed to Code Verification</strong> below and enter the 6-digit code along with your new password.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-[#C5A059]/20 text-[#C5A059] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">3</span>
                  <span>Submit the form to verify that your entered code matches the code sent and update your password.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetSuccessModal(false)}
                  className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b08e4d] text-black font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all transform active:scale-95"
                >
                  <span>Proceed to Code Verification</span>
                  <Lock className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={async () => {
                    if (resendCooldown > 0) return;
                    setShowResetSuccessModal(false);
                    setLoading(true);
                    try {
                      const res = await fetch("/api/auth/send-reset-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        const expiryTime = data.expiresAtMs || (Date.now() + 15 * 60 * 1000);
                        setResetExpiresAt(expiryTime);
                        setResendCooldown(60);
                        setShowResetSuccessModal(true);
                        setSuccessMsg(`✔ Resent password reset code to ${email}. Check your email inbox for your 6-digit code.`);
                      } else {
                        setErrorMsg(data.error || "Failed to resend email.");
                        setToast({ type: "error", message: data.error || "Failed to resend code." });
                      }
                    } catch (err) {
                      console.error("Resend error:", err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className={`w-full py-2 text-center text-[11px] font-sans transition-colors cursor-pointer ${
                    resendCooldown > 0
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white/50 hover:text-[#C5A059]"
                  }`}
                >
                  {resendCooldown > 0
                    ? `Didn't receive code? Resend available in ${resendCooldown}s`
                    : "Didn't receive the email? Resend reset code"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERIFICATION SUCCESS MOTION ANIMATION OVERLAY */}
      <AnimatePresence>
        {isVerificationSuccess && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="bg-[#0D0D0D] border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 1] }}
                transition={{ delay: 0.1, duration: 0.45 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </motion.div>

              <div className="space-y-1">
                <h3 className="font-sans font-black text-xl text-emerald-300 tracking-tight">
                  Verification Successful!
                </h3>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Your 6-digit OTP verification code was verified and your new password passcode has been securely updated.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/60 py-2.5 px-4 rounded-xl border border-emerald-500/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Redirecting to command portal...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
