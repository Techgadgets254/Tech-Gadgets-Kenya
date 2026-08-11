import React, { useState } from "react";
import { useStore } from "../StoreContext";
import { Product } from "../types";
import Markdown from "react-markdown";
import { cleanAiMarkdown, stripMarkdownSymbols } from "../lib/cleanAiMarkdown";
import { 
  X, 
  GitCompare, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Star, 
  ChevronRight,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Bell
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

export default function ProductComparisonOverlay() {
  const { 
    compareList, 
    toggleCompare, 
    clearCompareList, 
    isCompareOverlayOpen, 
    setIsCompareOverlayOpen,
    products,
    addToCart,
    registerProductRestockRequest
  } = useStore();

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockEmail, setRestockEmail] = useState("");
  const [restockPhone, setRestockPhone] = useState("");
  const [restockSuccess, setRestockSuccess] = useState(false);

  if (!isCompareOverlayOpen) return null;

  // Filter out products already in compare list
  const availableProducts = products.filter(
    (p) => !compareList.some((cp) => cp.id === p.id)
  );

  const handleAddProductFromDropdown = (prodId: string) => {
    if (!prodId) return;
    const found = products.find((p) => p.id === prodId);
    if (found) {
      if (compareList.length >= 3) {
        alert("You can compare up to 3 products side-by-side.");
        return;
      }
      toggleCompare(found);
      setSelectedProductToAdd("");
      setAiAnalysis("");
    }
  };

  // Collect all unique specification keys across selected products
  const allSpecKeys = Array.from(
    new Set(
      compareList.flatMap((p) => Object.keys(p.specifications || {}))
    )
  );

  const handleGenerateAiAnalysis = async () => {
    if (compareList.length < 2) {
      setAiAnalysis("Please select at least 2 products to run AI side-by-side hardware synthesis.");
      return;
    }

    setIsAiLoading(true);
    setAiAnalysis("");

    try {
      // First try backend proxy if available
      const response = await fetch("/api/gemini/analyze-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: compareList.map((p) => ({
            name: p.name,
            brand: p.brand,
            price: p.price,
            specs: p.specifications,
            category: p.category
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setAiAnalysis(data.analysis);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (e) {
      // Proxy failed or unavailable, fallback gracefully
    }

    // Direct Gemini client SDK fallback
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAiAnalysis("AI Specs analysis feature requires a Gemini API key. Please check your setup.");
        setIsAiLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Compare these ${compareList.length} electronic products side-by-side for a buyer in Kenya:
${compareList.map((p, idx) => `
Product ${idx + 1}: ${p.brand} ${p.name}
Price: KES ${p.price.toLocaleString()}
Category: ${p.category}
Key Specs: ${JSON.stringify(p.specifications)}
`).join("\n")}

Provide a concise, professional comparison with:
1. Executive Verdict (Which offers best performance per KES)
2. Strengths & Target User for each product
3. Final purchasing recommendation.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });

      setAiAnalysis(result.text || "Analysis generated successfully.");
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAiAnalysis("Unable to generate AI analysis at this moment. Please review the specification matrix table below.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProduct || !restockEmail) return;

    const success = await registerProductRestockRequest(
      restockModalProduct.id,
      restockModalProduct.name,
      restockModalProduct.image,
      restockEmail,
      restockPhone
    );

    if (success) {
      setRestockSuccess(true);
      setTimeout(() => {
        setRestockSuccess(false);
        setRestockModalProduct(null);
        setRestockEmail("");
        setRestockPhone("");
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
      <div 
        className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0F0F0F] border-b border-white/10 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-extrabold text-lg sm:text-xl text-white">
                  Product Comparison Matrix
                </h2>
                <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {compareList.length} / 3 Items
                </span>
              </div>
              <p className="text-white/40 text-xs mt-0.5">
                Inspect granular hardware specifications, pricing, and AI evaluation side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick add product if less than 3 */}
            {compareList.length < 3 && (
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => handleAddProductFromDropdown(e.target.value)}
                  className="w-full sm:w-60 bg-[#141414] border border-white/15 text-white rounded-xl text-xs py-2 px-3 focus:outline-hidden focus:border-[#C5A059] font-sans cursor-pointer"
                >
                  <option value="">+ Add Product to Compare...</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.brand}] {p.name} - KES {p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {compareList.length > 0 && (
              <button
                type="button"
                onClick={clearCompareList}
                className="text-white/40 hover:text-red-400 text-xs font-mono flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCompareOverlayOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl transition-colors cursor-pointer border border-white/10"
              title="Close Comparison Overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {compareList.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <GitCompare className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-white font-bold text-base">No Products Selected for Comparison</h3>
              <p className="text-white/40 text-xs mt-1 max-w-md mx-auto">
                Select up to 3 items from the catalog or use the dropdown above to populate the specification matrix side-by-side.
              </p>
            </div>
          ) : (
            <>
              {/* Product Cards Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const product = compareList[index];

                  if (!product) {
                    return (
                      <div 
                        key={index} 
                        className="bg-white/[0.01] border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[220px]"
                      >
                        <Plus className="w-8 h-8 text-white/20 mb-2" />
                        <span className="text-white/40 text-xs font-mono">Empty Slot {index + 1}</span>
                        <p className="text-white/30 text-[10px] mt-1">Select a gadget to compare side-by-side</p>
                      </div>
                    );
                  }

                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div 
                      key={product.id} 
                      className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative group hover:border-[#C5A059]/40 transition-all shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        className="absolute top-3 right-3 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/60 p-1.5 rounded-lg transition-colors cursor-pointer z-10"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="space-y-3">
                        <div className="relative h-32 bg-white/[0.02] rounded-xl p-2 flex items-center justify-center overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#C5A059] uppercase block">
                            {product.brand}
                          </span>
                          <h4 className="font-sans font-bold text-sm text-white line-clamp-2 mt-0.5 leading-tight">
                            {product.name}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-mono font-extrabold text-sm text-[#C5A059]">
                              KES {product.price.toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-bold border ${
                              isOutOfStock 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {isOutOfStock ? "Out of Stock" : "In Stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-white/5 flex gap-2">
                        {isOutOfStock ? (
                          <button
                            type="button"
                            onClick={() => setRestockModalProduct(product)}
                            className="w-full bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 font-sans font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Notify Me</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product, 1)}
                            className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Specs Comparison Generator */}
              <div className="bg-gradient-to-r from-[#0F0F0F] via-[#141414] to-[#0F0F0F] border border-[#C5A059]/30 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                      AI Hardware Comparison Synthesizer
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiAnalysis}
                    disabled={isAiLoading || compareList.length < 2}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:opacity-40 text-black font-sans font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Hardware Specs...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate AI Hardware Verdict</span>
                      </>
                    )}
                  </button>
                </div>

                {aiAnalysis && (
                  <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs leading-relaxed text-white/90 font-sans markdown-body">
                    <Markdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-sm font-bold text-white mb-2 mt-3" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xs font-bold text-[#C5A059] mb-1.5 mt-2.5" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-[11px] font-bold text-[#C5A059] mb-1 mt-2" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-white/90" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-white/85" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-white/85" {...props} />,
                        li: ({ node, ...props }) => <li className="text-xs leading-relaxed" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-[#C5A059]" {...props} />,
                      }}
                    >
                      {cleanAiMarkdown(aiAnalysis)}
                    </Markdown>
                  </div>
                )}
              </div>

              {/* Detailed Specs Comparison Matrix Table */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-white/[0.02] border-b border-white/10 p-4 font-sans font-bold text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  <span>Technical Specifications Matrix</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01]">
                        <th className="p-3 sm:p-4 font-mono text-[10px] font-bold text-white/40 uppercase tracking-wider w-1/4">
                          Specification Factor
                        </th>
                        {compareList.map((p) => (
                          <th key={p.id} className="p-3 sm:p-4 font-sans font-bold text-white text-xs border-l border-white/5 bg-[#C5A059]/5">
                            {p.brand} {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {/* Price Row */}
                      <tr className="bg-white/[0.02]">
                        <td className="p-3 sm:p-4 font-mono text-white/60 font-semibold">
                          Price (KES)
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 font-mono font-bold text-[#C5A059] border-l border-white/5">
                            KES {p.price.toLocaleString()}
                          </td>
                        ))}
                      </tr>

                      {/* Category Row */}
                      <tr>
                        <td className="p-3 sm:p-4 font-mono text-white/60 font-semibold">
                          Category
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 text-white/80 border-l border-white/5 font-mono">
                            {p.category}
                          </td>
                        ))}
                      </tr>

                      {/* Stock Status Row */}
                      <tr>
                        <td className="p-3 sm:p-4 font-mono text-white/60 font-semibold">
                          Availability Status
                        </td>
                        {compareList.map((p) => (
                          <td key={p.id} className="p-3 sm:p-4 border-l border-white/5 font-mono">
                            <span className={p.stock > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                              {p.stock > 0 ? `In Stock (${p.stock} units)` : "Out of Stock"}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Dynamic Specs Rows */}
                      {allSpecKeys.map((key) => {
                        const cleanKey = stripMarkdownSymbols(key);
                        const values = compareList.map((p) => p.specifications?.[key] || "—");
                        const areDifferent = new Set(values).size > 1 && values.some(v => v !== "—");

                        return (
                          <tr key={key} className={areDifferent ? "bg-[#C5A059]/5" : ""}>
                            <td className="p-3 sm:p-4 font-mono text-white/60 font-semibold capitalize flex items-center justify-between">
                              <span>{cleanKey}</span>
                              {areDifferent && (
                                <span className="text-[8px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded-sm">
                                  Variant
                                </span>
                              )}
                            </td>
                            {compareList.map((p) => {
                              const rawVal = p.specifications?.[key] || "—";
                              const cleanVal = rawVal === "—" ? "—" : stripMarkdownSymbols(rawVal);
                              return (
                                <td key={p.id} className="p-3 sm:p-4 text-white/90 border-l border-white/5 font-sans leading-relaxed">
                                  {cleanVal}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0F0F0F] border-t border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0">
          <span className="text-white/40 text-xs font-mono">
            Tech Sokoni Kenya • Specification Comparison Tool
          </span>
          <button
            type="button"
            onClick={() => setIsCompareOverlayOpen(false)}
            className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            Close Matrix Overlay
          </button>
        </div>
      </div>

      {/* Restock Prompt Modal inside Overlay if triggered */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-left space-y-4">
            <button
              onClick={() => setRestockModalProduct(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center border border-[#C5A059]/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Notify Me When Restocked</h3>
                <p className="text-white/40 text-xs">{restockModalProduct.name}</p>
              </div>
            </div>

            {restockSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold">✓ Request Submitted!</p>
                <p className="text-white/60">We will alert you on email/WhatsApp immediately when stock is replenished.</p>
              </div>
            ) : (
              <form onSubmit={handleRestockSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-mono text-white/40 block mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={restockEmail}
                    onChange={(e) => setRestockEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 block mb-1">WHATSAPP NUMBER (OPTIONAL)</label>
                  <input
                    type="tel"
                    value={restockPhone}
                    onChange={(e) => setRestockPhone(e.target.value)}
                    placeholder="+254 712 345678"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-bold py-2.5 rounded-xl text-xs"
                >
                  Confirm Restock Notification
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
