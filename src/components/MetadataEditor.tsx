import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Globe, 
  Search, 
  FileText, 
  Tag, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

export default function MetadataEditor() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const seoRef = doc(db, "seo_metadata", "site");
        const snap = await getDoc(seoRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setDescription(data.description || "");
          setKeywords(data.keywords || "");
        } else {
          // Defaults if document doesn't exist yet
          setTitle("Tech Soko Kenya | Authorized Apple, HP & ASUS Dealer");
          setDescription("Premium laptops, custom workstation desktops, and high-tier accessories along Kenyatta Avenue, Nairobi.");
          setKeywords("macbook pro, hp elitebook, asus rog, premium gadgets, nairobi tech store");
        }
      } catch (err: any) {
        console.error("Error loading SEO configuration:", err);
        setErrorMessage("Could not load current SEO settings from Firestore.");
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const seoRef = doc(db, "seo_metadata", "site");
      await setDoc(seoRef, {
        title: title.trim().substring(0, 200),
        description: description.trim().substring(0, 1000),
        keywords: keywords.trim().substring(0, 1000),
        updatedAt: new Date().toISOString()
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      console.error("SEO update error:", err);
      setErrorMessage(err?.message || "Unauthorized or invalid data provided.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 text-center text-white/50 space-y-3 font-mono text-xs">
        <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#C5A059]" />
        <p>Loading site-wide search indexes configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 text-white max-w-2xl mx-auto shadow-2xl">
      {/* Header section */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-5 mb-6">
        <div className="p-2.5 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059]">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-sans font-semibold text-lg tracking-tight text-white uppercase">
            SEO METADATA ENGINE
          </h2>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Optimize search indexing, crawl summaries, and browser dynamic headers globally.
          </p>
        </div>
      </div>

      {/* Save Success / Error banners */}
      {status === "success" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs font-semibold mb-6 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>SEO settings updated successfully! Browser tabs and tag headers refactored in real-time.</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs font-semibold mb-6 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Update rejected: {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-left">
        {/* Title Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#C5A059]" />
              GLOBAL SITE TITLE
            </label>
            <span className={`text-[9px] font-mono ${title.length > 70 ? "text-amber-500" : "text-white/30"}`}>
              {title.length}/70 chars (Target)
            </span>
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tech Soko Kenya | Premium Apple & Dell Laptops Nairobi"
            className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-hidden rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-sans tracking-wide transition-all"
          />
          <p className="text-[10px] text-white/40 mt-1 font-sans">
            The fundamental browser title displayed in tabs and primary SEO search outcome links.
          </p>
        </div>

        {/* Description Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
              META DESCRIPTION BLURB
            </label>
            <span className={`text-[9px] font-mono ${description.length > 160 ? "text-amber-500" : "text-white/30"}`}>
              {description.length}/160 chars (Target)
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a search summary detailing laptop specifications, store address, operating hours, and shipping details..."
            className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-hidden rounded-xl p-4 text-xs text-white placeholder-white/20 font-sans leading-relaxed tracking-wide transition-all resize-none"
          />
          <p className="text-[10px] text-white/40 mt-1 font-sans">
            Summary snippet parsed by Google web crawlers. Best kept under 160 characters for complete display.
          </p>
        </div>

        {/* Keywords Input */}
        <div>
          <label className="block text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
            SEO SEARCH KEYWORDS (COMMA SEPARATED)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. nairobi laptops, genuine macbook kenya, tech soko, waiyaki way gadgets"
            className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-hidden rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-mono transition-all"
          />
          <p className="text-[10px] text-white/40 mt-1 font-sans">
            Separate keywords by commas to guide localized relevance algorithms.
          </p>
        </div>

        {/* Information box */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3">
          <HelpCircle className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <div className="text-[11px] text-white/50 leading-relaxed font-sans">
            <strong className="text-white">Real-Time Event Processing:</strong> When values are locked, browser rendering hooks immediately rewrite meta nodes on active devices. Crawler synchronization schedules depend on direct web platform updates.
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>COMMITING SYSTEM SEO UPDATE...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>PUBLISH DYNAMIC SEO REFACTOR</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
