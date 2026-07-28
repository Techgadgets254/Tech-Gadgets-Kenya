import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Clock, LogOut, RefreshCw, X, ShieldCheck } from "lucide-react";
import { useStore } from "../StoreContext";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// Constants for inactivity tracking
const INACTIVITY_WARNING_MS = 30 * 60 * 1000; // 30 minutes (1,800,000 ms)
const MAX_INACTIVITY_MS = 35 * 60 * 1000;      // 35 minutes (2,100,000 ms)
const CHECK_INTERVAL_MS = 1000;                 // 1 second tick

export default function InactivityTimer() {
  const { user, userProfile, logout, addCustomNotification } = useStore();
  const isLoggedIn = Boolean(user || userProfile || localStorage.getItem("tgk_custom_user"));

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes = 300s
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);

  // Sync ref with state
  useEffect(() => {
    isWarningOpenRef.current = showWarningModal;
  }, [showWarningModal]);

  // Reset activity timestamp on user interaction (only if modal is not currently showing)
  const handleUserActivity = useCallback(() => {
    if (!isWarningOpenRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Attach window event listeners when user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarningModal(false);
      return;
    }

    // Reset last activity when login is detected
    lastActivityRef.current = Date.now();

    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledActivityHandler = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          handleUserActivity();
        }, 1000); // Throttle to once per second max
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, throttledActivityHandler, { passive: true });
    });

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, throttledActivityHandler);
      });
    };
  }, [isLoggedIn, handleUserActivity]);

  // Timer loop checking elapsed idle time every second
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      // 1. If 35 minutes passed, trigger immediate auto-logout
      if (idleTime >= MAX_INACTIVITY_MS) {
        setShowWarningModal(false);
        const userEmail = user?.email || userProfile?.email || "Authenticated User";
        const userId = user?.uid || userProfile?.uid || "";

        // Log security audit event
        try {
          if (db) {
            await addDoc(collection(db, "auth_events"), {
              eventType: "auto_logout_inactivity",
              status: "success",
              email: userEmail,
              userId,
              timestamp: new Date().toISOString(),
              errorMessage: "🔐 Auto-Logout Security Trigger: Session automatically terminated after 35 minutes of inactivity."
            });
          }
        } catch (err) {
          console.warn("Failed logging auto-logout audit event:", err);
        }

        // Perform clean logout
        await logout();
        if (addCustomNotification) {
          addCustomNotification("🔐 You were automatically signed out after 35 minutes of inactivity for security.");
        }
        return;
      }

      // 2. If 30 minutes passed, trigger warning modal
      if (idleTime >= INACTIVITY_WARNING_MS) {
        if (!isWarningOpenRef.current) {
          setShowWarningModal(true);
        }
        const remainingSec = Math.max(0, Math.ceil((MAX_INACTIVITY_MS - idleTime) / 1000));
        setSecondsRemaining(remainingSec);
      } else {
        if (isWarningOpenRef.current) {
          setShowWarningModal(false);
        }
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLoggedIn, user, userProfile, logout, addCustomNotification]);

  // Manual reset action ("Stay Signed In")
  const extendSession = () => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);
    if (addCustomNotification) {
      addCustomNotification("✔ Session extended successfully. Welcome back!");
    }
  };

  // Immediate logout action ("Sign Out Now")
  const handleImmediateLogout = async () => {
    setShowWarningModal(false);
    await logout();
    if (addCustomNotification) {
      addCustomNotification("Signed out successfully.");
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isLoggedIn) return null;

  return (
    <AnimatePresence>
      {showWarningModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#0B0B0B] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-white text-left"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={extendSession}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
              title="Extend Session"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sans font-extrabold text-lg text-white tracking-tight">
                  Inactivity Security Alert
                </h3>
                <p className="text-xs text-amber-400/80 font-mono mt-0.5 font-semibold">
                  30-Minute Idle Threshold Reached
                </p>
              </div>
            </div>

            {/* User details badge */}
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-white/40 text-[10px] uppercase">Active Session:</span>
              <span className="font-bold text-[#C5A059] truncate max-w-[220px]">
                {user?.email || userProfile?.email || "Logged In User"}
              </span>
            </div>

            {/* Main Countdown Banner */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3 text-center">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block">
                Automatic Session Termination In
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-red-400 tracking-wider">
                {formatCountdown(secondsRemaining)}
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsRemaining / 300) * 100}%` }}
                />
              </div>

              <p className="text-xs text-red-200/90 leading-relaxed font-sans text-left pt-1">
                ⚠️ <strong>Security Policy:</strong> You have been inactive for 30 minutes. To protect client data and prevent unauthorized administrative or order access, you will be automatically logged out in <strong>5 minutes</strong> unless you confirm presence.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={extendSession}
                className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b08e4d] text-black font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all transform active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Stay Signed In (Extend Session)</span>
              </button>

              <button
                type="button"
                onClick={handleImmediateLogout}
                className="w-full py-3 text-white/60 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Now</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
