/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../StoreContext";
import { 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle,
  PackageCheck,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Send
} from "lucide-react";

export default function ReturnPolicyView() {
  const { setActiveView, user, orders } = useStore();
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState("");
  const [returnReason, setReturnReason] = useState("defective");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const orderRef = selectedOrderForReturn || "General Order / Item";
    const msg = `Hello Tech Sokoni Kenya Return Team, I would like to initiate a return under your 30-Day Return Policy:\n\nOrder Ref: ${orderRef}\nReason: ${returnReason}\nNotes: ${returnNotes || "N/A"}\n\nPlease guide me on courier dispatch / store drop-off at Pioneer Building.`;
    window.open(`https://wa.me/254792620789?text=${encodeURIComponent(msg)}`, "_blank");
    setReturnSubmitted(true);
  };

  return (
    <div id="return-policy-page" className="max-w-5xl mx-auto space-y-10 pb-16 font-sans">
      
      {/* Schema.org MerchantReturnPolicy JSON-LD script for Google Merchant Center Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MerchantReturnPolicy",
            "name": "Tech Sokoni Kenya Official 30-Day Return & Refund Policy",
            "applicableCountry": "KE",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 30,
            "returnMethod": [
              "https://schema.org/ReturnByMail",
              "https://schema.org/ReturnInStore"
            ],
            "returnFees": "https://schema.org/FreeReturn",
            "customerRemorseReturnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
            "itemCondition": [
              "https://schema.org/NewCondition",
              "https://schema.org/RefurbishedCondition"
            ],
            "merchantReturnLink": "https://techsokoni.com/return-policy",
            "refundType": "https://schema.org/FullRefund",
            "restockingFee": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "KES"
            },
            "returnShippingFeesAmount": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "KES"
            }
          })
        }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#141414] via-[#0A0A0A] to-[#121212] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-mono font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Google Merchant Verified Policy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif italic font-bold text-white tracking-tight leading-tight">
            Return &amp; Refund Policy
          </h1>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans">
            At <strong className="text-white">Tech Sokoni Kenya</strong>, we stand behind the quality of every Apple MacBook, HP EliteBook, Dell XPS, printer, and phone we deliver. If you are not 100% satisfied with your purchase, our straightforward 30-day return policy ensures a hassle-free exchange or full refund.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-white/60">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              Pioneer Building 5th Flr, Shop 514, Nairobi CBD
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              +254 792 620 789
            </span>
          </div>
        </div>
      </div>

      {/* Google Merchant Center Dedicated Policy Hub */}
      <div className="relative bg-gradient-to-r from-[#181510] via-[#121212] to-[#1c1810] border-2 border-[#C5A059]/40 rounded-3xl p-6 sm:p-10 shadow-[0_0_30px_rgba(197,160,89,0.12)] space-y-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#C5A059]/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] text-[11px] font-mono font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Merchant Center Policy Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif italic font-bold text-white">
              Official Store Return Policy Requirements
            </h2>
            <p className="text-xs text-white/70">
              Verified merchant standards matching Google Merchant Center feeds &amp; Kenyan consumer protection laws
            </p>
          </div>

          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Google Merchant Approved</span>
          </div>
        </div>

        {/* 3 Core Fields Grid required by Google Merchant Center */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Field 1: Return Window */}
          <div className="bg-[#141414] border border-white/10 hover:border-[#C5A059]/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-md font-bold">
                Required Field #1
              </span>
            </div>
            
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">Return Window</h3>
              <p className="text-2xl font-bold text-white font-serif mt-1">30 Calendar Days</p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed border-t border-white/5 pt-3">
              Buyers have <strong className="text-white">30 days</strong> from the date of physical package delivery or in-store pickup to request a return or exchange.
            </p>
          </div>

          {/* Field 2: Return Cost */}
          <div className="bg-[#141414] border border-white/10 hover:border-emerald-500/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">
                Required Field #2
              </span>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">Return Cost</h3>
              <p className="text-2xl font-bold text-emerald-400 font-serif mt-1">Free (KES 0)</p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed border-t border-white/5 pt-3">
              <strong className="text-emerald-400">100% Free</strong> return courier shipping for defective or wrong items. Flat KES 250 or free in-person drop-off for change of mind.
            </p>
          </div>

          {/* Field 3: Return Conditions */}
          <div className="bg-[#141414] border border-white/10 hover:border-blue-500/60 rounded-2xl p-6 space-y-3 transition-all shadow-lg group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">
                Required Field #3
              </span>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">Return Conditions</h3>
              <p className="text-xl font-bold text-white font-serif mt-1">New or Unused Condition</p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed border-t border-white/5 pt-3">
              Items must be in <strong className="text-white">original box</strong> with un-tampered security seals, matching serial numbers, charger cables, and receipt.
            </p>
          </div>

        </div>

        {/* Additional Merchant Policy Guarantee Summary */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#C5A059] shrink-0" />
            <span className="text-white/80">
              <strong className="text-white">Zero Restocking Fee (0%):</strong> We do not charge any hidden restocking, processing, or administration fees on approved returns.
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[#C5A059] font-bold shrink-0">
            <span>Refund Time: 3-5 Business Days</span>
          </div>
        </div>
      </div>

      {/* Google Merchant Center Structured Policy Breakdown Table */}
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <FileText className="w-6 h-6 text-[#C5A059]" />
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Google Merchant Specification Overview</h2>
            <p className="text-xs text-white/50">Comprehensive summary of return parameters for customer transparency and Google Merchant compliance</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/80 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Policy Attribute</th>
                <th className="py-3 px-4">Specification Details</th>
                <th className="py-3 px-4">Applicable Conditions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Return Window</td>
                <td className="py-3.5 px-4 font-semibold text-[#C5A059]">30 Calendar Days</td>
                <td className="py-3.5 px-4 text-white/60">Applies to all laptops, smartphones, desktops, printers, and accessories.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Return Cost (Defective / Damaged)</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-400">100% FREE (KES 0)</td>
                <td className="py-3.5 px-4 text-white/60">If an item arrives damaged, defective, or misdescribed, Tech Sokoni covers courier costs.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Return Cost (Customer Remorse / Change of Mind)</td>
                <td className="py-3.5 px-4 font-semibold text-white">Flat KES 250 Courier OR KES 0 In-Store</td>
                <td className="py-3.5 px-4 text-white/60">Customer pays local courier shipping fee (KES 250) or drops off at Nairobi CBD shop for free.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Restocking Fee</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-400">KES 0 (0%)</td>
                <td className="py-3.5 px-4 text-white/60">No restocking fees charged on any returned items.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Accepted Item Condition</td>
                <td className="py-3.5 px-4 text-white">New, Unused, or Like-New Original Packaging</td>
                <td className="py-3.5 px-4 text-white/60">Must include original box, power cables, manuals, and serial numbers matching invoice.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Refund Method &amp; Currency</td>
                <td className="py-3.5 px-4 font-semibold text-[#C5A059]">M-Pesa STK Transfer / Original Payment (KES)</td>
                <td className="py-3.5 px-4 text-white/60">Full refund issued directly to buyer's Safaricom M-Pesa number or bank account.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Refund Processing Time</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-400">3 to 5 Business Days</td>
                <td className="py-3.5 px-4 text-white/60">Initiated immediately upon technical inspection and verification at our Nairobi office.</td>
              </tr>
              <tr className="hover:bg-white/[0.01]">
                <td className="py-3.5 px-4 font-bold text-white font-mono">Return Locations</td>
                <td className="py-3.5 px-4 text-white">Mail Courier or Physical Shop Drop-Off</td>
                <td className="py-3.5 px-4 text-white/60">Tech Sokoni Kenya, Pioneer Building 5th Flr, Shop 514, Kenyatta Ave, Nairobi CBD.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Content Clauses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <PackageCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white font-serif">1. Eligible Return Requirements</h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            To qualify for a 30-day return or exchange, your item must meet the following criteria:
          </p>
          <ul className="space-y-2.5 text-xs text-white/70 list-disc list-inside">
            <li>Returned within <strong>30 calendar days</strong> of package delivery or pickup.</li>
            <li>Item is in original condition, with security seals, serial tags, and branding untampered.</li>
            <li>Accompanied by original retail box, charger/power cord, accessories, and Tech Sokoni tax receipt/invoice.</li>
            <li>Software user accounts (Apple ID, Google Account, Microsoft User Profile) signed out and device wiped.</li>
          </ul>
        </div>

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Truck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white font-serif">2. Shipping &amp; Drop-Off Guidelines</h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            You can return products using either of these convenient Kenya methods:
          </p>
          <div className="space-y-3 text-xs text-white/70">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="font-bold text-white block mb-1">Option A: In-Store Drop-Off (Free - KES 0)</span>
              Bring the package directly to our Nairobi CBD Boutique at Pioneer Building, 5th Floor, Shop 514 along Kenyatta Avenue (Open Mon-Sat 8:00 AM - 6:30 PM).
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="font-bold text-white block mb-1">Option B: Courier Return Dispatch</span>
              Dispatch via Fargo Courier, G4S, or local parcel service addressed to Tech Sokoni Kenya Dispatch, Nairobi CBD.
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white font-serif">3. Inspection &amp; Refund Processing</h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Once received, our certified technical team verifies hardware serial numbers and testing diagnostics within <strong>24 to 48 hours</strong>. Upon approval, your full refund is dispatched via M-Pesa or bank transfer within <strong>3 to 5 business days</strong>.
          </p>
        </div>

        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white font-serif">4. Non-Returnable Items &amp; Exceptions</h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            For hygiene, safety, and digital copyright reasons, the following are non-refundable unless defective:
          </p>
          <ul className="space-y-2 text-xs text-white/70 list-disc list-inside">
            <li>Opened software licenses or activated digital key codes.</li>
            <li>In-ear headphones/earbuds where hygenic seal has been broken.</li>
            <li>Products damaged due to liquid spillage, electrical surge, physical drops, or unauthorized opening.</li>
          </ul>
        </div>

      </div>

      {/* Interactive Return Request Form */}
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Initiate a Return Request</h2>
            <p className="text-xs text-white/50">Submit an online return notice under our 30-day guarantee to receive immediate courier dispatch details</p>
          </div>
          {user && (
            <button
              onClick={() => setActiveView("client-dashboard")}
              className="text-xs text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#C5A059]/10 px-3 py-1.5 rounded-xl transition-colors font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Your Account Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {returnSubmitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Return Request Notice Opened</h3>
            <p className="text-xs text-white/70 max-w-lg mx-auto">
              Our support team has opened your return notification on WhatsApp / Email. Please bring or ship your item to Pioneer Building 5th Flr, Shop 514, Nairobi CBD along with your order invoice.
            </p>
            <button
              onClick={() => setReturnSubmitted(false)}
              className="text-xs text-emerald-400 underline cursor-pointer font-mono pt-2"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1.5">
                  Order Number / Receipt Ref
                </label>
                {orders && orders.length > 0 ? (
                  <select
                    value={selectedOrderForReturn}
                    onChange={(e) => setSelectedOrderForReturn(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="">-- Select Order or Enter Custom ID --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id.substring(0, 8).toUpperCase()} - KES {o.totalAmount?.toLocaleString()} ({new Date(o.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order #TSK-89214 or Invoice No"
                    value={selectedOrderForReturn}
                    onChange={(e) => setSelectedOrderForReturn(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="Defective / Damaged Item (Free Return Shipping)">Defective / Damaged Item (Free Return Shipping KES 0)</option>
                  <option value="Incorrect Item Received (Free Return Shipping)">Incorrect Item Received (Free Return Shipping KES 0)</option>
                  <option value="Customer Remorse / Change of Mind (KES 250 / In-Store Free)">Customer Remorse / Change of Mind (30 Days)</option>
                  <option value="Size / Specification Exchange">Size / Specification Exchange</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-white/60 mb-1.5">
                Additional Notes / Product Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide any serial number details, condition notes, or preferred refund/exchange choice..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-white/40">
                Need immediate help? Call support at <strong className="text-white">+254 792 620 789</strong> or email <strong className="text-white">shop@techsokoni.com</strong>
              </p>
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#C5A059] hover:bg-[#b08c48] text-black font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0"
              >
                <span>Submit Return Notification</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Support Contact Footer */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-white font-bold text-sm">Tech Sokoni Kenya Customer Care &amp; Logistics</p>
          <p>Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue, Nairobi CBD, Kenya</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="mailto:shop@techsokoni.com"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Email Support</span>
          </a>
          <a
            href="https://wa.me/254792620789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>WhatsApp Support</span>
          </a>
        </div>
      </div>

    </div>
  );
}
