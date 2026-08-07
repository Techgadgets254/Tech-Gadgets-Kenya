/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  X, 
  PackageCheck, 
  Tag, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { requestFcmPushPermission, sendFcmPushNotification } from "../lib/fcm";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface PushNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PushNotificationDrawer({ isOpen, onClose }: PushNotificationDrawerProps) {
  const { user, userProfile, theme, setSelectedProductId, setActiveView } = useStore();
  const isLight = theme === "light";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "default"
  );
  const [isActivating, setIsActivating] = useState(false);

  const activeUid = user?.uid || localStorage.getItem("tsk_fcm_device_token") || "guest";

  // Subscribe to Firestore notifications collection
  useEffect(() => {
    if (!isOpen) return;

    const notifRef = collection(db, "notifications");
    const q = query(notifRef, where("userId", "in", [activeUid, "all"]));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    }, (err) => {
      console.warn("Notifications snapshot listener warning:", err);
    });

    return () => unsubscribe();
  }, [isOpen, activeUid]);

  const handleEnablePush = async () => {
    setIsActivating(true);
    const res = await requestFcmPushPermission(user?.uid || "");
    setPermission(res.permission);
    setIsActivating(false);

    if (res.success) {
      // Send welcoming FCM test push notification
      await sendFcmPushNotification({
        userId: activeUid,
        title: "🔔 Tech Sokoni Push Notifications Active!",
        body: "You will now receive instant push alerts for order updates, price drops, and new product arrivals.",
        type: "general"
      });
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const item of unread) {
      try {
        await updateDoc(doc(db, "notifications", item.id), { read: true });
      } catch (e) {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    for (const item of notifications) {
      try {
        await deleteDoc(doc(db, "notifications", item.id));
      } catch (e) {}
    }
    setNotifications([]);
  };

  const handleNotificationClick = (item: any) => {
    if (item.link) {
      if (item.link.startsWith("product:")) {
        const pId = item.link.replace("product:", "");
        setSelectedProductId(pId);
        setActiveView("product-details");
      } else if (item.link === "client-dashboard") {
        setActiveView("client-dashboard");
      } else if (item.link === "shop") {
        setActiveView("shop");
      }
    }
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 ${
              isLight ? "bg-white text-zinc-900 border-l border-zinc-200" : "bg-[#0E0E0E] text-white border-l border-white/10"
            }`}
          >
            {/* Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
              isLight ? "border-zinc-200 bg-zinc-50" : "border-white/10 bg-[#141414]"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-base sm:text-lg">Push Notifications</h3>
                  <p className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">
                    {unreadCount > 0 ? `${unreadCount} Unread Push Alerts` : "Live FCM Notification Service"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isLight ? "border-zinc-200 hover:bg-zinc-200" : "border-white/10 hover:bg-white/10"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permission Banner */}
            <div className={`p-4 border-b ${
              permission === "granted" 
                ? isLight ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-emerald-950/30 border-emerald-500/20 text-emerald-300"
                : isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-950/30 border-amber-500/20 text-amber-300"
            }`}>
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">
                    {permission === "granted" 
                      ? "Browser Push Notifications Active" 
                      : "Enable Instant Push Alerts"}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                    {permission === "granted"
                      ? "You are connected to receive live order updates, instant price drops, and stock arrivals."
                      : "Receive real-time mobile & web push updates directly to your screen when orders change."}
                  </p>
                  
                  {permission !== "granted" && (
                    <button
                      onClick={handleEnablePush}
                      disabled={isActivating}
                      className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#C5A059] text-black font-bold text-xs hover:bg-[#C5A059]/90 transition-all flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{isActivating ? "Connecting..." : "Enable Push Notifications"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Actions Toolbar */}
            {notifications.length > 0 && (
              <div className={`px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                isLight ? "border-zinc-100 bg-zinc-100/50" : "border-white/5 bg-white/[0.02]"
              }`}>
                <button
                  onClick={handleMarkAllRead}
                  className="text-white/60 hover:text-[#C5A059] flex items-center gap-1 cursor-pointer font-mono text-[11px]"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-mono text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear list</span>
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
                  <div className="p-4 rounded-2xl bg-white/5 mb-3 border border-white/5">
                    <Bell className="w-8 h-8 text-[#C5A059]" />
                  </div>
                  <p className="font-serif italic font-bold text-sm text-white/80">No Notifications Yet</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Your order status updates, price drop alerts, and new product arrivals will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  let icon = <Bell className="w-4 h-4 text-[#C5A059]" />;
                  if (item.type === "order_update") icon = <PackageCheck className="w-4 h-4 text-emerald-400" />;
                  if (item.type === "price_drop") icon = <Tag className="w-4 h-4 text-amber-400" />;
                  if (item.type === "product_arrival") icon = <Sparkles className="w-4 h-4 text-purple-400" />;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                        !item.read 
                          ? isLight ? "bg-amber-50/50 border-[#C5A059]/40 shadow-sm" : "bg-[#181818] border-[#C5A059]/30 shadow-lg"
                          : isLight ? "bg-white border-zinc-200 hover:border-zinc-300" : "bg-[#121212] border-white/5 hover:border-white/20"
                      }`}
                    >
                      {!item.read && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                      )}

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-3">
                          <p className={`text-xs font-bold leading-snug ${isLight ? "text-zinc-900" : "text-white"}`}>
                            {item.title}
                          </p>
                          <p className={`text-xs mt-1 leading-relaxed ${isLight ? "text-zinc-600" : "text-white/70"}`}>
                            {item.body}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {item.link && (
                              <span className="text-[#C5A059] flex items-center gap-0.5 font-sans font-bold group-hover:underline">
                                View details <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer note */}
            <div className={`p-3 border-t text-center text-[10px] font-mono shrink-0 ${
              isLight ? "border-zinc-200 text-zinc-500 bg-zinc-50" : "border-white/5 text-white/30 bg-[#111]"
            }`}>
              Tech Sokoni FCM Push Gateway • Encryption Active
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
