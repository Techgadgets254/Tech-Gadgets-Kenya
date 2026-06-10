import React, { useEffect, useState } from "react";
import { useStore } from "../StoreContext";
import { X, Truck, CheckCircle2, ShieldAlert, Package, Sliders } from "lucide-react";

export default function NotificationCenter() {
  const { notifications, dismissNotification, dismissAllNotifications } = useStore();

  const [duration, setDuration] = useState<number>(() => {
    const cached = localStorage.getItem("tgk_toast_duration");
    return cached ? parseInt(cached, 10) : 7;
  });

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDuration(val);
    localStorage.setItem("tgk_toast_duration", val.toString());
  };

  return (
    <div 
      id="notification-container" 
      className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      {notifications.length > 0 && (
        <div className="pointer-events-auto bg-[#0F0F0F]/95 backdrop-blur-md border border-[#C5A059]/30 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-fadeIn relative">
          <div className="flex items-center justify-between">
            <span className="font-sans font-black text-[10px] tracking-wider text-[#C5A059] uppercase flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-ping" />
              <span>Broadcast Overlays ({notifications.length})</span>
            </span>
            <button
              onClick={dismissAllNotifications}
              className="text-red-400 hover:text-red-300 font-mono text-[9px] uppercase font-bold px-2.5 py-1 rounded-lg bg-red-400/10 hover:bg-red-400/15 transition-all cursor-pointer border border-red-400/20 active:scale-95"
            >
              Dismiss All
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 text-white/50 text-[10px] font-mono border-t border-white/5 pt-2.5">
            <span className="flex items-center gap-1"><Sliders className="w-3 h-3 text-[#C5A059]" /> Banner Life: {duration}s</span>
            <input
              type="range"
              min="2"
              max="20"
              value={duration}
              onChange={handleDurationChange}
              className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C5A059] focus:outline-none"
            />
          </div>
        </div>
      )}

      {notifications.map((toast) => {
        return (
          <NotificationToast 
            key={toast.id} 
            toast={toast} 
            duration={duration}
            onDismiss={() => dismissNotification(toast.id)} 
          />
        );
      })}
    </div>
  );
}

function NotificationToast({ toast, onDismiss, duration }: { toast: any; onDismiss: () => void; duration: number }) {
  // Auto dismiss after custom duration (seconds * 1000)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Shipped":
        return <Truck className="w-5 h-5 text-[#C5A059]" />;
      case "Delivered":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "Processing":
        return <Package className="w-5 h-5 text-blue-400" />;
      case "Paid":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "Failed":
        return <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-[#C5A059]" />;
    }
  };

  return (
    <div 
      className="pointer-events-auto bg-[#0F0F0F]/95 backdrop-blur-md border border-[#C5A059]/40 rounded-xl p-4 shadow-2xl flex gap-3 animate-slideIn select-none max-w-sm"
      style={{
        boxShadow: "0 10px 30px -10px rgba(197, 160, 89, 0.15)"
      }}
    >
      <div className="bg-[#C5A059]/10 p-2 rounded-lg border border-[#C5A059]/20 self-start">
        {getStatusIcon(toast.newStatus)}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-sans font-black text-[10px] tracking-wider text-[#C5A059] uppercase">
            Order Status Update
          </span>
          <button 
            onClick={onDismiss} 
            className="text-white/30 hover:text-white transition-colors p-0.5 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="font-sans text-[11px] text-white/95 mt-1 leading-relaxed">
          {toast.message}
        </p>
        <span className="font-mono text-[9px] text-white/40 block mt-2">
          Real-time Firestore Sync • Just now
        </span>
      </div>
    </div>
  );
}
