/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../StoreContext";
import { ShoppingBag, X, Check } from "lucide-react";

export default function CartToastContainer() {
  const { cartToasts, dismissCartToast, setActiveView } = useStore();

  return (
    <div className="fixed top-20 right-4 z-[999] pointer-events-none flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {cartToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, x: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto w-full bg-[#0F0F0F]/95 backdrop-blur-md border border-[#C5A059]/25 rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden group font-sans"
          >
            {/* Subtle radial glow overlay */}
            <div className="absolute inset-0 bg-radial-gradient from-[#C5A059]/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Success check badge */}
            <div className="bg-[#C5A059]/10 text-[#C5A059] p-2 rounded-xl shrink-0 flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>

            {/* Product image */}
            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
              <img
                src={toast.productImage}
                alt={toast.productName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & info description */}
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-white text-xs font-semibold truncate">
                Added to Cart
              </h4>
              <p className="text-white/60 text-[10px] mt-0.5 truncate">
                {toast.productName}
              </p>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[#C5A059] font-mono text-xs font-semibold">
                  KES {toast.price.toLocaleString()}
                </span>
                <button
                  onClick={() => setActiveView("checkout")}
                  className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white hover:text-[#C5A059] transition-colors cursor-pointer bg-white/5 px-2 py-1 rounded-lg"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Checkout</span>
                </button>
              </div>
            </div>

            {/* Dismiss trigger */}
            <button
              onClick={() => dismissCartToast(toast.id)}
              className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
