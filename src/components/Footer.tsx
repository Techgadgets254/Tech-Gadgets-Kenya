/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../StoreContext";
import brandLogo from "../assets/images/tech_soko_logo_1783960703453.jpg";
import { 
  Monitor, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  Mail, 
  Send, 
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Youtube 
} from "lucide-react";

export default function Footer() {
  const { setActiveView, subscribeNewsletter } = useStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const ok = await subscribeNewsletter(email);
      if (ok) {
        setStatus("success");
        setEmail("");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <footer id="storefront-footer" className="bg-[#050505] text-white/50 font-sans border-t border-white/10">
      
      {/* Newsletter Block & Quick Values row */}
      <div className="border-b border-white/10 bg-black/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Newsletter CTA description */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center gap-2 text-[#C5A059]">
                <Mail className="w-4 h-4 animate-bounce" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Tech Newsletter</span>
              </div>
              <h3 className="text-white font-serif italic text-lg sm:text-xl font-bold tracking-wide">
                STAY AHEAD OF KENYA'S TECH TRENDS
              </h3>
              <p className="text-xs text-white/40 leading-relaxed max-w-md">
                Get first-hand alerts on exclusive corporate laptops arrivals, genuine Epson printers stock levels, and special price reductions straight to your inbox.
              </p>
            </div>

            {/* Newsletter Subscription input element */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubscribe} className="relative max-w-md lg:ml-auto w-full">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email to subscribe..."
                      disabled={status === "loading" || status === "success"}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:outline-hidden focus:border-[#C5A059] focus:bg-black text-xs py-3 pl-10 pr-4 rounded-xl text-white placeholder-white/30 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading" || status === "success"}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:bg-[#C5A059]/25 text-black px-5 py-3 rounded-xl font-sans text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {status === "loading" ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    ) : status === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Validation feedbacks */}
                {status === "success" && (
                  <p className="absolute left-0 top-full mt-2 text-[11px] text-emerald-400 font-mono animate-fadeIn flex items-center gap-1.5">
                    ✓ Subscription approved! We will notify you of daily warehouse updates.
                  </p>
                )}
                {status === "error" && (
                  <p className="absolute left-0 top-full mt-2 text-[11px] text-red-400 font-mono animate-fadeIn">
                    ⚠ Failed to register. Please check your connection or try again.
                  </p>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Core Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/10 pb-10 mb-10">
          <div className="flex gap-4 items-start">
            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg text-[#C5A059] shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Same-Day Delivery</h4>
              <p className="text-xs text-white/40 mt-1">Prompt courier dispatch across Nairobi, Kiambu, Machakos & Nakuru counties.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg text-[#C5A059] shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Safaricom M-Pesa Integrated</h4>
              <p className="text-xs text-white/40 mt-1">Instant STK push validation with dynamic tracking numbers on invoice generation.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg text-[#C5A059] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Official Kenya Warranties</h4>
              <p className="text-xs text-white/40 mt-1">100% genuine products sourced directly from authorized manufacturers in East Africa.</p>
            </div>
          </div>
        </div>

        {/* Brand Meta and Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4 animate-fadeIn">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#C5A059]/30">
                <img 
                  src={brandLogo} 
                  alt="Tech Soko Kenya Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-white font-bold tracking-wider uppercase">TECH SOKO KENYA</span>
            </div>
            <p className="text-xs text-white/30 max-w-sm leading-relaxed">
              Kenya's premier portal for luxury personal electronics and business computer arrays. From elite hardware like Apple M3 developer suites to industrial Epson ink reservoirs, we maintain absolute uptime for your technical life.
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Product Categories</h5>
            <div className="space-y-2 text-xs">
              {["Laptops", "Phones", "Printers", "Accessories", "All-in-One PCs"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveView("shop");
                  }}
                  className="block hover:text-[#C5A059] text-white/60 transition-colors cursor-pointer text-left"
                >
                  Premium {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">Boutique Headquarter</h5>
            <div className="space-y-3 text-xs text-white/40 font-mono">
              <div>
                <p className="text-white font-bold mb-1">Nairobi CBD Storefront</p>
                <p className="leading-relaxed">
                  Kenyatta Pioneer Building,<br />
                  along Kenyatta Avenue,<br />
                  5th Floor, Shop Number 514<br />
                  <span className="text-[#C5A059]">(Next to I&M Building)</span>
                </p>
              </div>
              <div>
                <p className="text-white font-bold">Secure Contact</p>
                <p>Phone: +254 792 620 789</p>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p>© {new Date().getFullYear()} Tech Soko Kenya. All rights reserved.</p>
            {/* Social media connections */}
            <div className="flex gap-4 mt-3 justify-center md:justify-start">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] text-white/40 transition-colors" title="Tech Soko Kenya Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] text-white/40 transition-colors" title="Tech Soko Kenya on X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] text-white/40 transition-colors" title="Tech Soko Kenya Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] text-white/40 transition-colors" title="Tech Soko Kenya YouTube Channel">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveView("admin-dashboard")}
              className="text-white/40 hover:text-[#C5A059] hover:bg-white/[0.04] transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.01]"
              title="Secure Administrator Control Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Admin Console</span>
            </button>
            <span className="text-white/20 hidden sm:inline">|</span>
            <a href="#" className="hover:text-[#C5A059] text-white/60 transition-colors">Warranties & Refunds</a>
            <a href="#" className="hover:text-[#C5A059] text-white/60 transition-colors">Privacy Shield</a>
            <a href="#" className="hover:text-[#C5A059] text-white/60 transition-colors">Safaricom Paybill</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
