/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useStore } from "../StoreContext";
import { Clock, Calendar, ArrowRight, Share2, Award, Sparkles, BookOpen, Newspaper, Bookmark } from "lucide-react";
import { motion } from "motion/react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  readTime: string;
  category: "Laptops" | "Market Trends" | "Printers" | "Nairobi Hub" | "AI Hardware";
  isFeatured?: boolean;
}

const ARTICLES_DATA: Article[] = [
  {
    id: "art-1",
    title: "M-Silicon Dominance in Nairobi Tech Hubs: Why Developers are Choosing M3 Pro & Max Arrays",
    excerpt: "From Westlands seed startups to Kilimani development corporations, custom high-bandwidth Apple silicon is shifting the Kenyan computer landscape.",
    content: "With local developer salaries reaching global markets, hardware latency translates directly to currency losses. The Apple M3 Pro and M3 Max SoC architectures provide unprecedented 4.0GHz bandwidth. In local compile runs using Docker, microservices built on localized container clusters finish 45% faster compared to traditional x86 developer packages. In our Kenyatta Avenue shop #514, we configure these setups for local software engineers.",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=700",
    date: "June 2, 2026",
    readTime: "5 min read",
    category: "Laptops",
    isFeatured: true
  },
  {
    id: "art-2",
    title: "EcoTank Printing Evolution: HP Smart Tank vs Epson EcoTank in High-Volume Offices",
    excerpt: "A deep comparative performance matrix mapping local cartridge-free models on Kenya printing paper sizes and speed metrics.",
    content: "SME corporate suites in Nairobi CBD process hundreds of letters daily. EcoTank ink reservoirs save over 90% of printing costs by doing away with traditional premium cartridges. Epson L-series smart pumps deliver robust performance with high-density pigment ink layers that prevent bleeding on local grades of office paper. We evaluate smart network options, maintenance box durability, and local Safaricom STK remote-trigger print modules.",
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?auto=format&fit=crop&q=80&w=600",
    date: "June 1, 2026",
    readTime: "4 min read",
    category: "Printers"
  },
  {
    id: "art-3",
    title: "Safaricom Lipa Na M-Pesa Enforces API Upgrades to Curb Fraudulent Outages",
    excerpt: "E-Commerce portals integrate direct STK callback streams to protect businesses from refund schemes and payment lags.",
    content: "E-Commerce businesses in Kenya are migrating from manual transaction keying to automatic STK callbacks. The security benefits are double: payment references are locked, and invoice generators are printed on real-time callbacks. Tech Gadgets Kenya has pioneered this automated flow inside its client dashboards, ensuring your orders are safely flagged as 'Paid' within 10 seconds of clicking the paybill trigger.",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600",
    date: "May 30, 2026",
    readTime: "3 min read",
    category: "Market Trends"
  },
  {
    id: "art-4",
    title: "Inside the AI Hardware Arms Race: Local Startups Procuring NVIDIA RT-Enabled Workstations",
    excerpt: "Artificial intelligence development surges in East Africa, sparking massive demand for high-VRAM GPU personal workstations.",
    content: "Local tech hubs are adopting advanced model customization. Startups use dedicated NVIDIA workstations equipped with 16GB VRAM configurations to run custom local LLMs behind closed networks. We explore standard hardware options like HP Victus and ASUS ROG Strix developer systems, which maintain high thermodynamic control during deep-learning compilations.",
    imageUrl: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=600",
    date: "May 28, 2026",
    readTime: "6 min read",
    category: "AI Hardware"
  },
  {
    id: "art-5",
    title: "Official Tech Gadgets Store Opens on Kenyatta Avenue, Shop 514",
    excerpt: "Providing Nairobi software engineers with instant physical pickup options for brand-new US and UK-imported laptops.",
    content: "Our highly-anticipated Nairobi boutique store is officially open! Located on the 5th Floor of Kenyatta Pioneer Building, Shop 514 (conveniently right next to the I&M Building, Nairobi CBD), customers can now experience and test premium laptops, phones, and enterprise printers before buying, backed by same-day county shipping guarantees.",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600",
    date: "May 25, 2026",
    readTime: "2 min read",
    category: "Nairobi Hub"
  }
];

export default function NewsView() {
  const { setActiveView } = useStore();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Load bookmarked saved articles from local storage
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("tgk_saved_news");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleSaveArticle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedArticleIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("tgk_saved_news", JSON.stringify(updated));
      return updated;
    });
  };

  const tags = ["All", "Laptops", "Printers", "Market Trends", "AI Hardware", "Nairobi Hub", "Saved Bulletins"];

  const filteredArticles = useMemo(() => {
    if (selectedTag === "Saved Bulletins") {
      return ARTICLES_DATA.filter(art => savedArticleIds.includes(art.id));
    }
    if (selectedTag === "All") return ARTICLES_DATA;
    return ARTICLES_DATA.filter(art => art.category === selectedTag);
  }, [selectedTag, savedArticleIds]);

  const featuredArticle = useMemo(() => {
    return ARTICLES_DATA.find(art => art.isFeatured);
  }, []);

  return (
    <div id="tech-news-viewport" className="space-y-12 pb-16 font-sans">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2 text-[#C5A059] mb-1">
            <Newspaper className="w-4 h-4 animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest uppercase">DAILY BULLETIN</span>
          </div>
          <h1 className="font-serif italic text-3xl sm:text-4xl text-white font-bold tracking-tight">
            Kenya Tech News & Insights
          </h1>
          <p className="text-xs text-white/40 mt-1 max-w-xl leading-relaxed">
            Curated daily bulletins covering elite laptop computing, safaricom e-commerce payment gateways, smart tank tech, and our flagship boutique announcements.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setExpandedArticle(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold transition-all border cursor-pointer ${
                selectedTag === tag
                  ? "bg-[#C5A059] text-black border-[#C5A059] font-black"
                  : "bg-[#0F0F0F] border-white/5 text-white/60 hover:text-white hover:border-white/15"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Lead Story Row */}
      {selectedTag === "All" && featuredArticle && !expandedArticle && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0D0D0D] border border-[#C5A059]/20 rounded-3xl overflow-hidden shadow-2xl relative group"
        >
          <div className="absolute top-4 left-4 z-10 bg-[#C5A059] text-black font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-black animate-spin" />
            <span>Featured Editorial</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto relative overflow-hidden">
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black via-black/40 to-transparent" />
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center text-left">
              <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                  {featuredArticle.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                  {featuredArticle.readTime}
                </span>
              </div>

              <h2 className="text-white font-serif italic text-xl sm:text-2xl font-bold tracking-normal leading-snug">
                {featuredArticle.title}
              </h2>

              <p className="text-white/45 text-xs sm:text-sm leading-relaxed mt-4">
                {featuredArticle.excerpt}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => setExpandedArticle(featuredArticle.id)}
                  className="bg-white hover:bg-zinc-200 text-black font-sans text-xs font-black px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <span>Read Full Article</span>
                  <BookOpen className="w-4 h-4 text-black" />
                </button>

                <button
                  onClick={(e) => toggleSaveArticle(featuredArticle.id, e)}
                  className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
                    savedArticleIds.includes(featuredArticle.id)
                      ? "bg-[#C5A059]/20 border-[#C5A560] text-[#C5D070]"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                  title={savedArticleIds.includes(featuredArticle.id) ? "Remove from Saved list" : "Save article for later"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(featuredArticle.id) ? "fill-current text-[#C5D070]" : "text-white"}`} />
                  <span>{savedArticleIds.includes(featuredArticle.id) ? "Saved" : "Save Later"}</span>
                </button>

                <button
                  onClick={() => setActiveView("shop")}
                  className="border border-[#C5A059]/20 hover:border-[#C5A059] text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-xl transition-all"
                >
                  Configure Hardware Specs
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded Article Detail view */}
      {expandedArticle ? (
        (() => {
          const art = ARTICLES_DATA.find(a => a.id === expandedArticle);
          if (!art) return null;
          return (
            <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn text-left">
              <button
                onClick={() => setExpandedArticle(null)}
                className="text-[#C5A059] hover:text-white font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer animate-pulse"
              >
                ← Back to Bulletin Board
              </button>

              <div className="max-h-96 w-full rounded-2xl overflow-hidden border border-white/10 h-64 sm:h-80 relative">
                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover animate-fadeIn" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <span className="absolute bottom-4 left-4 bg-black/85 text-[#C5A059] border border-[#C5A059]/30 text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                  {art.category}
                </span>

                {/* Save Toggle on expanded image overlay */}
                <button
                  onClick={(e) => toggleSaveArticle(art.id, e)}
                  className="absolute top-4 right-4 bg-black/80 hover:bg-[#C5A059] text-white hover:text-black p-2.5 rounded-xl border border-white/10 hover:border-transparent transition-all cursor-pointer z-10"
                  title={savedArticleIds.includes(art.id) ? "Remove from saved list" : "Bookmark article"}
                >
                  <Bookmark className={`w-4 h-4 ${savedArticleIds.includes(art.id) ? "fill-current text-[#C5A059]" : ""}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-6 text-[10px] text-white/40 font-mono">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C5A059]" /> {art.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C5A059]" /> {art.readTime}</span>
                </div>
                <h2 className="text-white font-serif italic text-2xl sm:text-3xl font-bold tracking-tight">
                  {art.title}
                </h2>
                <p className="text-[#C5A059] text-xs font-mono font-bold leading-relaxed border-l-2 border-[#C5A059] pl-4 py-1 italic bg-[#C5A059]/5 md:max-w-3xl">
                  "{art.excerpt}"
                </p>
                <div className="text-white/60 text-xs sm:text-sm leading-relaxed space-y-4 pt-4 whitespace-pre-line font-sans">
                  <p>{art.content}</p>
                  <p className="mt-4">
                    As technological requirements rapidly escalate, local businesses are forced to choose systems that offer continuous long-term utility instead of lightweight standard specs. At Tech Gadgets Kenya, we maintain high inventory configurations that bypass standard custom import delays.
                  </p>
                </div>
              </div>

              {/* Related News Bulletins Section */}
              <div className="pt-8 border-t border-white/10 mt-12">
                <h4 className="font-serif italic text-lg sm:text-xl text-white font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059] animate-pulse" />
                  <span>Continue Reading: Related Bulletins</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ARTICLES_DATA
                    .filter(a => a.id !== art.id)
                    .sort((a, b) => (a.category === art.category ? -1 : 1))
                    .slice(0, 2)
                    .map(related => (
                      <div
                        key={related.id}
                        onClick={() => {
                          setExpandedArticle(related.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="bg-white/[0.02] border border-white/5 hover:border-[#C5A059]/30 p-4 rounded-2xl cursor-pointer transition-all flex gap-3 h-full group"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                          <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-left flex flex-col justify-between min-w-0">
                          <div>
                            <span className="font-mono text-[8px] uppercase tracking-wider text-[#C5A059] font-bold block">{related.category}</span>
                            <h5 className="font-sans font-bold text-xs text-white leading-tight mt-1 line-clamp-2 group-hover:text-[#C5A059] transition-colors">{related.title}</h5>
                          </div>
                          <span className="text-[9px] text-white/30 font-mono block mt-1.5">{related.readTime} • {related.date}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-white/5">
                <p className="text-[10px] text-white/30 font-mono">
                  BULLETIN ENTRY {art.id.toUpperCase()} • STOCKED AT KENYATTA AVENUE, SHOP 514
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => toggleSaveArticle(art.id, e)}
                    className={`font-sans text-xs font-semibold py-2 px-3.5 rounded-xl transition-all border flex items-center gap-1.5 cursor-pointer ${
                      savedArticleIds.includes(art.id)
                        ? "bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(art.id) ? "fill-current" : ""}`} />
                    <span>{savedArticleIds.includes(art.id) ? "Saved" : "Save Later"}</span>
                  </button>

                  <button
                    onClick={() => {
                      alert("Article link copied! Share with your developers.");
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white text-xs px-4 py-2 rounded-xl transition-all border border-white/5 cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="w-3 h-3 text-white" />
                    <span>Copy Reference</span>
                  </button>
                  <button
                    onClick={() => setActiveView("shop")}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Browse Matching Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })()
      ) : filteredArticles.length === 0 ? (
        /* Empty Saved News State */
        <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-12 text-center max-w-sm mx-auto my-12 animate-fadeIn">
          <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h4 className="font-sans font-bold text-white text-base">Saved List Is Empty</h4>
          <p className="text-white/40 text-xs mt-2 leading-relaxed">
            Choose "Save Later" on news articles to preserve interesting hardware bulletins and Nairobi tech industry trends here for later references.
          </p>
          <button
            onClick={() => setSelectedTag("All")}
            className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Show All Bulletins
          </button>
        </div>
      ) : (
        /* Regular News Grid with customized entrance motion & save action */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {filteredArticles.map((art, index) => (
            <motion.article
              key={art.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/30 transition-all flex flex-col justify-between group shadow-lg h-full"
            >
              <div className="h-48 overflow-hidden relative border-b border-white/5">
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 bg-black/80 text-[#C5A059] text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                  {art.category}
                </span>

                {/* Save Toggle on card cover overlay */}
                <button
                  onClick={(e) => toggleSaveArticle(art.id, e)}
                  className="absolute top-3 right-3 bg-black/80 hover:bg-[#C5A059] hover:text-black text-[#C5A059] p-2 rounded-lg border border-[#C5A059]/25 hover:border-transparent transition-all cursor-pointer z-15"
                  title={savedArticleIds.includes(art.id) ? "Remove from saved list" : "Save for later"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(art.id) ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#C5A059]" /> {art.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#C5A059]" /> {art.readTime}</span>
                  </div>
                  <h3 className="text-white font-sans text-sm sm:text-base font-bold tracking-tight leading-snug group-hover:text-[#C5A059] transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedArticle(art.id)}
                    className="text-white/70 hover:text-[#C5A059] font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="flex items-center text-emerald-400 gap-1 font-mono text-[9px] uppercase tracking-wide">
                    <Award className="w-3.5 h-3.5" />
                    <span>Verified Insight</span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Nairobi Store Map Promotion Card */}
      <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row gap-8 items-center text-left">
        <div className="flex-1 space-y-4">
          <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-sm inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>Visit Kenya Showroom</span>
          </div>
          <h3 className="text-white font-serif italic text-xl sm:text-2xl font-bold leading-tight">
            Consult With Our Experts In Person At Kenyatta Avenue
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Need elite custom desktop rigs or enterprise paper flow configurations? Skip the online confusion! Talk to our systems architects at <strong className="text-white">Kenyatta Pioneer Building</strong>. We maintain physical stock of rare Developer laptops and high-performance routers with genuine manufacturer warranties.
          </p>
          
          <div className="space-y-2 text-xs pt-2">
            <p className="flex items-center gap-2">
              <span className="text-[#C5A059] font-mono font-black">📍 Hub Location:</span>
              <span className="text-white/70 font-mono">Kenyatta Pioneer Building, Kenyatta Avenue, 5th Floor, Shop 514 (Next to I&M Building)</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-[#C5A059] font-mono font-black">⏰ Store Hours:</span>
              <span className="text-white/70 font-mono">Monday – Saturday: 8:00 AM – 7:30 PM (Closed Sundays & Holidays)</span>
            </p>
          </div>
        </div>

        <div className="w-full lg:w-72 bg-[#0C0C0C] border border-white/5 rounded-2xl p-4 shrink-0 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] font-black tracking-widest text-emerald-400 uppercase">CONTACT WHATSAPP DIRECT</p>
          <span className="font-serif italic text-[#C5A059] font-bold text-3xl block mt-1">+254 792 620789</span>
          <p className="text-[10px] text-white/30 max-w-[200px] leading-relaxed mt-2">Speak immediately to a direct consultant to verify physical stocks in less than 3 minutes.</p>
          <a
            href="https://wa.me/254792620789"
            target="_blank"
            referrerPolicy="no-referrer"
            className="mt-4 bg-[#25D366] hover:bg-[#20ba5a] text-black font-sans font-bold text-xs py-2.5 w-full rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-center"
          >
            <span>Launch Chat Now</span>
          </a>
        </div>
      </div>

    </div>
  );
}
