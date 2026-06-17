/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useStore } from "../StoreContext";
import { 
  GitCompare, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Cpu, 
  Layers, 
  DollarSign, 
  ShoppingBag, 
  ChevronRight,
  TrendingUp,
  Flame,
  Search,
  Sparkles,
  Loader2,
  FileText
} from "lucide-react";
import { Product } from "../types";

export default function ProductComparison() {
  const { products, setActiveView, setSelectedProductId, theme } = useStore();

  const [productIdA, setProductIdA] = useState<string>("");
  const [productIdB, setProductIdB] = useState<string>("");

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const isLight = theme === "light";

  // Filter products that have specifications
  const compareCandidates = useMemo(() => {
    return products.filter(p => p.specifications && Object.keys(p.specifications).length > 0);
  }, [products]);

  const productA = useMemo(() => {
    return products.find(p => p.id === productIdA);
  }, [productIdA, products]);

  const productB = useMemo(() => {
    return products.find(p => p.id === productIdB);
  }, [productIdB, products]);

  // Extract all unique specification keys from both products
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    if (productA?.specifications) {
      Object.keys(productA.specifications).forEach(k => keys.add(k));
    }
    if (productB?.specifications) {
      Object.keys(productB.specifications).forEach(k => keys.add(k));
    }
    return Array.from(keys);
  }, [productA, productB]);

  const handleNavigateToDetails = (product: Product) => {
    setSelectedProductId(product.id);
    setActiveView("product-details");
    window.scrollTo(0, 0);
  };

  const handleFetchAiComparison = async () => {
    if (!productA || !productB) return;
    setLoadingAi(true);
    setAiError("");
    setAiAnalysis("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Compare the technical specifications of these two hardware models and summarize which one is best for developers, high-volume offices, or gamers. Use structured bullet points:
          
          Model A: [${productA.brand}] ${productA.name}
          Price A: KES ${productA.price.toLocaleString()}
          Specifications A: ${JSON.stringify(productA.specifications)}
          
          Model B: [${productB.brand}] ${productB.name}
          Price B: KES ${productB.price.toLocaleString()}
          Specifications B: ${JSON.stringify(productB.specifications)}`,
          productsContext: [productA, productB]
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setAiAnalysis(data.reply);
      } else {
        throw new Error(data.error || "Failed to fetch response.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Unable to synthesize comparison at the moment. Please try again.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <section id="tgk-product-comparison-matrix" className="space-y-6 animate-fadeIn text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#C5A059]/10 text-[#C5A059] mb-2.5">
            <GitCompare className="w-3 h-3" /> hardware comparison engine
          </span>
          <h2 className="font-sans font-semibold text-xl sm:text-2xl tracking-tight text-white dark:text-white">
            Interactive Gadget comparison Matrix
          </h2>
          <p className="text-white/50 text-[11px] sm:text-xs">
            Review detailed technical indicators side-by-side to choose the optimal gadget for your Nairobi development node.
          </p>
        </div>
      </div>

      {/* Selectors card block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0F0F0F] rounded-2xl p-5 border border-white/5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase text-[#C5A059] tracking-widest flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#C5A059]" /> Select First gadget (A)
          </label>
          <select
            value={productIdA}
            onChange={(e) => {
              setProductIdA(e.target.value);
              setAiAnalysis("");
            }}
            className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:border-[#C5A059] transition-all cursor-pointer"
          >
            <option value="">-- Choose Hardware Profile --</option>
            {compareCandidates.map(p => (
              <option key={p.id} value={p.id}>
                [{p.brand}] {p.name} — KES {p.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.55">
          <label className="text-[10px] font-mono font-black uppercase text-[#C5A059] tracking-widest flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#C5A059]" /> Select Second Gadget (B)
          </label>
          <select
            value={productIdB}
            onChange={(e) => {
              setProductIdB(e.target.value);
              setAiAnalysis("");
            }}
            className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:border-[#C5A059] transition-all cursor-pointer"
          >
            <option value="">-- Choose Hardware Profile --</option>
            {compareCandidates.map(p => (
              <option key={p.id} value={p.id}>
                [{p.brand}] {p.name} — KES {p.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active comparison Layout */}
      {productA || productB ? (
        <div className="space-y-6">
          {/* Main Visual Side-by-Side Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* PRODUCT A CARD */}
            <div className="bg-[#0F0F0F] rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col justify-between relative group overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/5 border border-white/10 text-white/40 font-mono text-[9px] px-2 py-0.5 rounded-md">
                GADGET A
              </div>
              <div>
                {productA ? (
                  <div className="space-y-3">
                    <img
                      src={productA.image}
                      alt={productA.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-contain rounded-xl bg-white/[0.02] p-2 transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider font-bold">
                        {productA.brand}
                      </span>
                      <h3 className="font-sans font-bold text-sm text-white line-clamp-1 leading-snug">
                        {productA.name}
                      </h3>
                      <p className="text-[#C5A059] font-mono text-xs font-bold pt-1">
                        KES {productA.price.toLocaleString()}/=
                      </p>
                    </div>
                    <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2 pt-1 font-sans">
                      {productA.description.replace(/\*/g, "")}
                    </p>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <HelpCircle className="w-8 h-8 mb-2 text-white/20 animate-pulse" />
                    <span className="text-[11px] font-mono">Select a product for Column A</span>
                  </div>
                )}
              </div>
              {productA && (
                <button
                  onClick={() => handleNavigateToDetails(productA)}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#C5A059]/20"
                >
                  <span>INSPECT SPEC DETAILS</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              )}
            </div>

            {/* PRODUCT B CARD */}
            <div className="bg-[#0F0F0F] rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col justify-between relative group overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/5 border border-white/10 text-white/40 font-mono text-[9px] px-2 py-0.5 rounded-md">
                GADGET B
              </div>
              <div>
                {productB ? (
                  <div className="space-y-3">
                    <img
                      src={productB.image}
                      alt={productB.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-contain rounded-xl bg-white/[0.02] p-2 transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider font-bold">
                        {productB.brand}
                      </span>
                      <h3 className="font-sans font-bold text-sm text-white line-clamp-1 leading-snug">
                        {productB.name}
                      </h3>
                      <p className="text-[#C5A059] font-mono text-xs font-bold pt-1">
                        KES {productB.price.toLocaleString()}/=
                      </p>
                    </div>
                    <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2 pt-1 font-sans">
                      {productB.description.replace(/\*/g, "")}
                    </p>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <HelpCircle className="w-8 h-8 mb-2 text-white/20 animate-pulse" />
                    <span className="text-[11px] font-mono">Select a product for Column B</span>
                  </div>
                )}
              </div>
              {productB && (
                <button
                  onClick={() => handleNavigateToDetails(productB)}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#C5A059]/20"
                >
                  <span>INSPECT SPEC DETAILS</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              )}
            </div>
          </div>

          {/* Sidenote/SEO snippet block */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-yellow-400">
            <TrendingUp className="w-4 h-4 shrink-0 text-[#C5A059] mt-0.5" />
            <div className="space-y-1 text-left">
              <strong className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#C5A059]">SEO organic Search Rank Indexing Indicator:</strong>
              <p className="text-white/60 text-[11px] font-sans pt-0.5">
                Technical tables satisfy search telemetry requirements for high-intent purchase searches (e.g., <em>&quot;{productA?.brand || "BrandX"} vs {productB?.brand || "BrandY"} laptops Nairobi&quot;</em>).
              </p>
            </div>
          </div>

          {/* Technical Spec Matrix Table */}
          {allSpecKeys.length > 0 && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden shadow-md">
              <div className="bg-white/[0.02] border-b border-white/5 p-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-white">
                  Granular Specs Comparative matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.01]">
                      <th className="p-4 font-mono text-[10px] font-bold text-white/40 uppercase tracking-wider w-1/4">Specification Factor</th>
                      <th className="p-4 font-sans font-bold text-white text-xs w-3/8 border-l border-white/5 bg-[#C5A059]/5">
                        {productA ? productA.name : "Model A"}
                      </th>
                      <th className="p-4 font-sans font-bold text-white text-xs w-3/8 border-l border-white/5 bg-white/[0.01]">
                        {productB ? productB.name : "Model B"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allSpecKeys.map((key) => {
                      const valA = productA?.specifications?.[key] || "—";
                      const valB = productB?.specifications?.[key] || "—";
                      return (
                        <tr key={key} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-sans font-semibold text-white/50 bg-[#141414]">{key}</td>
                          <td className="p-4 font-mono text-[11px] text-[#C5A059] border-l border-white/5 bg-[#C5A059]/[0.01] leading-relaxed">
                            {valA}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-white/70 border-l border-white/5 leading-relaxed">
                            {valB}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Advisor Comparative Analytics */}
          {productA && productB && (
            <div className="bg-[#0F0F0F]/80 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#C5A059]/20 text-[#C5A059] p-2 rounded-xl border border-[#C5A059]/10">
                    <Sparkles className="w-4 h-4 text-[#C5A059] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white flex items-center gap-1.5 uppercase tracking-wider">
                      AI Hardware Suitability Assessment
                    </h4>
                    <p className="text-white/40 text-[10px] sm:text-[11px] font-sans">
                      Deep learning synthesis compares architecture limits on developer workflows.
                    </p>
                  </div>
                </div>

                {!aiAnalysis && !loadingAi && (
                  <button
                    onClick={handleFetchAiComparison}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md select-none w-full sm:w-auto justify-center"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>SYNTHESIZE COMPARISON</span>
                  </button>
                )}
              </div>

              {loadingAi && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin" />
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">
                    Synthesizing hardware registers and pipeline benchmarks...
                  </p>
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-left">
                  {aiError}
                </div>
              )}

              {aiAnalysis && (
                <div className="text-white/85 text-xs sm:text-sm leading-relaxed text-left space-y-4 max-w-4xl font-sans animate-fadeIn">
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3 whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                  <div className="text-[10px] font-mono text-white/30 text-right uppercase tracking-[0.1em]">
                    *Grounded to catalog specifications and retail prices
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center space-y-3">
          <GitCompare className="w-10 h-10 text-white/10" />
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-xs text-white/50 uppercase tracking-wider">No Compares Active</h4>
            <p className="text-[11px] text-white/30 max-w-xs mx-auto">
              Select two premium models from the hardware dropdown indices above to trigger the specs matrix.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
