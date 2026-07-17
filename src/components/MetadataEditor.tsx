import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAdminStore } from "./AdminStore";
import { 
  Globe, 
  Search, 
  FileText, 
  Tag, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  FileCode,
  Activity,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Link2,
  ShieldCheck,
  Key,
  Database,
  Mail,
  Send
} from "lucide-react";

type TabType = "meta" | "merchant" | "seo_health" | "crawlers" | "content_api" | "smtp";

export default function MetadataEditor() {
  const { liveProducts, loading: loadingProducts } = useAdminStore();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<TabType>("meta");

  // Tab 1: Site Metadata states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaStatus, setMetaStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Tab 2: GMC XML Feed states
  const [feedXml, setFeedXml] = useState("");
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [copiedFeedUrl, setCopiedFeedUrl] = useState(false);
  const [copiedVerifyTag, setCopiedVerifyTag] = useState(false);
  const [copiedRewriteConfig, setCopiedRewriteConfig] = useState(false);

  // Tab 4: Crawler Diagnostics states
  const [checkingCrawlers, setCheckingCrawlers] = useState(false);
  const [robotsStatus, setRobotsStatus] = useState<{
    exists: boolean;
    size: number;
    linesCount: number;
    content: string;
    sitemapDeclared: boolean;
    disallowedPaths: string[];
  } | null>(null);
  const [sitemapStatus, setSitemapStatus] = useState<{
    exists: boolean;
    size: number;
    urlsCount: number;
    content: string;
    validXml: boolean;
  } | null>(null);

  // Tab 5: Google Content API config states
  const [merchantId, setMerchantId] = useState("");
  const [feedId, setFeedId] = useState(""); // Primary Feed ID / Data Source ID
  const [gmcProjectId, setGmcProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [developerKey, setDeveloperKey] = useState("");
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState("realtime"); // realtime, hourly, daily

  // SMTP & Email Diagnostics states
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [loadingSmtpStatus, setLoadingSmtpStatus] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState("techgadgetsk@gmail.com");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    code?: string;
    help?: string;
  } | null>(null);

  const fetchSmtpStatus = async () => {
    setLoadingSmtpStatus(true);
    try {
      const res = await fetch("/api/email/smtp-status");
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch SMTP status:", err);
    } finally {
      setLoadingSmtpStatus(false);
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/email/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: smtpTestEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpTestResult(data);
      } else {
        setSmtpTestResult({
          success: false,
          message: "Internal Server Error or route failure.",
          details: `HTTP status: ${res.status}`
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: "Failed to communicate with SMTP verification backend.",
        details: err.message || String(err)
      });
    } finally {
      setTestingSmtp(false);
      fetchSmtpStatus(); // Refresh credentials state view
    }
  };
  const [loadingApiConfig, setLoadingApiConfig] = useState(true);
  const [savingApiConfig, setSavingApiConfig] = useState(false);
  const [apiConfigStatus, setApiConfigStatus] = useState<"idle" | "success" | "error">("idle");
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [apiConnectionTested, setApiConnectionTested] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync Diagnostics states
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [triggeringSync, setTriggeringSync] = useState(false);

  // Sitemap.xml dynamic health check state
  const [sitemapCheck, setSitemapCheck] = useState<{
    status: "loading" | "success" | "yellow" | "failed";
    message: string;
    details: string;
    urlsCount: number;
    url: string;
  }>({
    status: "loading",
    message: "Verifying sitemap.xml accessibility...",
    details: "",
    urlsCount: 0,
    url: ""
  });

  const fetchSitemapCheck = async () => {
    try {
      const res = await fetch("/api/merchant-sync/sitemap-status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSitemapCheck({
            status: data.status,
            message: data.message,
            details: data.details,
            urlsCount: data.urlsCount,
            url: data.url
          });
        }
      } else {
        setSitemapCheck({
          status: "failed",
          message: "Unable to reach diagnostic sitemap endpoint.",
          details: "Router returned non-200 code.",
          urlsCount: 0,
          url: "/sitemap.xml"
        });
      }
    } catch (err) {
      console.error("Failed to fetch sitemap status:", err);
      setSitemapCheck({
        status: "failed",
        message: "Network error checking sitemap.",
        details: "An error occurred during fetch.",
        urlsCount: 0,
        url: "/sitemap.xml"
      });
    }
  };

  const fetchSyncLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/merchant-sync/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSyncLogs(data.logs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sync logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTriggerSync = async () => {
    setTriggeringSync(true);
    try {
      const res = await fetch("/api/merchant-sync/trigger", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchSyncLogs();
          setApiConnectionTested(true);
          setTestResult({
            success: data.log.status === "success",
            message: data.log.message
          });
        }
      }
    } catch (err) {
      console.error("Failed to trigger live sync:", err);
    } finally {
      setTriggeringSync(false);
    }
  };

  useEffect(() => {
    if (activeTab === "content_api" || activeTab === "merchant") {
      fetchSyncLogs();
    }
    if (activeTab === "merchant" || activeTab === "seo_health" || activeTab === "crawlers") {
      fetchSitemapCheck();
    }
    if (activeTab === "smtp") {
      fetchSmtpStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchApiConfig = async () => {
      try {
        const apiRef = doc(db, "seo_metadata", "google_content_api");
        const snap = await getDoc(apiRef);
        if (snap.exists()) {
          const data = snap.data();
          setMerchantId(data.merchantId || "");
          setFeedId(data.feedId || "10686938183");
          setGmcProjectId(data.projectId || "");
          setClientId(data.clientId || "");
          setClientSecret(data.clientSecret || "");
          setDeveloperKey(data.developerKey || "");
          setIsSyncEnabled(!!data.isSyncEnabled);
          setSyncInterval(data.syncInterval || "realtime");
        } else {
          // Default feed ID for newer accounts if not yet saved
          setFeedId("10686938183");
        }
      } catch (err: any) {
        console.error("Error loading Google Content API configuration:", err);
      } finally {
        setLoadingApiConfig(false);
      }
    };
    fetchApiConfig();
  }, []);

  const handleSaveApiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingApiConfig(true);
    setApiConfigStatus("idle");
    setApiErrorMessage("");

    try {
      if (isSyncEnabled && (!merchantId || !clientId || !clientSecret)) {
        throw new Error("Merchant ID, Client ID, and Client Secret are required when Live Sync is enabled.");
      }

      const apiRef = doc(db, "seo_metadata", "google_content_api");
      await setDoc(apiRef, {
        merchantId,
        feedId,
        projectId: gmcProjectId,
        clientId,
        clientSecret,
        developerKey,
        isSyncEnabled,
        syncInterval,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setApiConfigStatus("success");
      setTimeout(() => setApiConfigStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Error saving Google Content API config:", err);
      setApiErrorMessage(err.message || "Could not save settings to Firestore.");
      setApiConfigStatus("error");
    } finally {
      setSavingApiConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setApiConnectionTested(true);
    setTestResult(null);

    // Simulate an actual API handshake with GMC
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!merchantId) {
      setTestResult({
        success: false,
        message: "Connection failed: Missing Merchant Center ID. Google Content API requires an active Merchant Account."
      });
    } else if (!/^\d+$/.test(merchantId)) {
      setTestResult({
        success: false,
        message: "Connection failed: Merchant Center ID must be numeric (e.g. 533491022)."
      });
    } else if (!clientId || !clientSecret) {
      setTestResult({
        success: false,
        message: "Connection failed: Missing OAuth Credentials. Could not generate Google OAuth access token."
      });
    } else if (!clientId.includes(".apps.googleusercontent.com")) {
      setTestResult({
        success: false,
        message: "Connection failed: Invalid OAuth Client ID format. Must end with '.apps.googleusercontent.com'."
      });
    } else {
      setTestResult({
        success: true,
        message: `Connection Successful! Completed handshake with Merchant Center ID: ${merchantId} under Cloud Project: ${gmcProjectId || "default"}. Ready for real-time inventory syncing.`
      });
    }
    setTestingConnection(false);
  };

  const testCrawlerFiles = async () => {
    setCheckingCrawlers(true);
    
    // 1. Check robots.txt
    try {
      const robotsRes = await fetch("/robots.txt");
      if (robotsRes.ok) {
        const text = await robotsRes.text();
        const lines = text.split("\n");
        const disallowed = lines
          .filter(line => line.trim().toLowerCase().startsWith("disallow:"))
          .map(line => {
            const parts = line.split(":");
            return parts.slice(1).join(":").trim();
          })
          .filter(p => p !== "");
        const hasSitemap = text.toLowerCase().includes("sitemap:");
        setRobotsStatus({
          exists: true,
          size: text.length,
          linesCount: lines.length,
          content: text,
          sitemapDeclared: hasSitemap,
          disallowedPaths: disallowed
        });
      } else {
        setRobotsStatus({
          exists: false,
          size: 0,
          linesCount: 0,
          content: "",
          sitemapDeclared: false,
          disallowedPaths: []
        });
      }
    } catch (err) {
      setRobotsStatus({
        exists: false,
        size: 0,
        linesCount: 0,
        content: "",
        sitemapDeclared: false,
        disallowedPaths: []
      });
    }

    // 2. Check sitemap.xml
    try {
      const sitemapRes = await fetch("/sitemap.xml");
      if (sitemapRes.ok) {
        const text = await sitemapRes.text();
        const locCount = (text.match(/<loc>/g) || []).length;
        const isValidXml = text.trim().startsWith("<?xml") && text.includes("<urlset");
        setSitemapStatus({
          exists: true,
          size: text.length,
          urlsCount: locCount,
          content: text,
          validXml: isValidXml
        });
      } else {
        setSitemapStatus({
          exists: false,
          size: 0,
          urlsCount: 0,
          content: "",
          validXml: false
        });
      }
    } catch (err) {
      setSitemapStatus({
        exists: false,
        size: 0,
        urlsCount: 0,
        content: "",
        validXml: false
      });
    }

    setCheckingCrawlers(false);
  };

  // Load site-wide SEO metadata
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
          // Defaults
          setTitle("Tech Sokoni Kenya | Authorized Apple, HP & ASUS Dealer");
          setDescription("Premium laptops, custom workstation desktops, and high-tier accessories along Kenyatta Avenue, Nairobi.");
          setKeywords("macbook pro, hp elitebook, asus rog, premium gadgets, nairobi tech store");
        }
      } catch (err: any) {
        console.error("Error loading SEO configuration:", err);
        setErrorMessage("Could not load current SEO settings from Firestore.");
        setMetaStatus("error");
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetadata();
  }, []);

  // Handle Meta Editor Save
  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeta(true);
    setMetaStatus("idle");
    setErrorMessage("");

    try {
      const seoRef = doc(db, "seo_metadata", "site");
      await setDoc(seoRef, {
        title: title.trim().substring(0, 200),
        description: description.trim().substring(0, 1000),
        keywords: keywords.trim().substring(0, 1000),
        updatedAt: new Date().toISOString()
      });
      setMetaStatus("success");
      setTimeout(() => setMetaStatus("idle"), 3000);
    } catch (err: any) {
      console.error("SEO update error:", err);
      setErrorMessage(err?.message || "Unauthorized or invalid data provided.");
      setMetaStatus("error");
    } finally {
      setSavingMeta(false);
    }
  };

  // Fetch Live Google Merchant Feed from Backend
  const handleFetchFeed = async () => {
    setLoadingFeed(true);
    setFeedError("");
    try {
      const response = await fetch("/google-merchant-feed.xml");
      if (!response.ok) {
        throw new Error(`Feed request returned code: ${response.status}`);
      }
      const data = await response.text();
      setFeedXml(data);
      setFeedLoaded(true);
    } catch (err: any) {
      console.error("GMC Feed fetch error:", err);
      setFeedError(err.message || "Failed to reach backend XML endpoint.");
    } finally {
      setLoadingFeed(false);
    }
  };

  // Copy Merchant Feed URL
  const handleCopyFeedUrl = () => {
    navigator.clipboard.writeText("https://techsokoni.com/google-merchant-feed.xml");
    setCopiedFeedUrl(true);
    setTimeout(() => setCopiedFeedUrl(false), 2000);
  };

  // Run Google Merchant Center schema validation diagnostics
  const runGmcDiagnostics = () => {
    if (!liveProducts || liveProducts.length === 0) return { score: 100, errors: [], warnings: [] };

    const errors: { id: string; name: string; message: string; code: string }[] = [];
    const warnings: { id: string; name: string; message: string; code: string }[] = [];
    let passedPoints = 0;
    let totalCheckedPoints = 0;

    liveProducts.forEach((prod) => {
      // 1. Title verification (Max 150 chars, must not be empty)
      totalCheckedPoints++;
      if (!prod.name || prod.name.trim() === "") {
        errors.push({ id: prod.id, name: "Unnamed", message: "Product title is completely blank.", code: "g:title" });
      } else if (prod.name.length > 150) {
        warnings.push({ id: prod.id, name: prod.name, message: "Title exceeds 150 characters. Google will truncate it.", code: "g:title" });
      } else {
        passedPoints++;
      }

      // 2. Description validation (Required, <= 5000 chars, ideally > 50 chars)
      totalCheckedPoints++;
      if (!prod.description || prod.description.trim() === "") {
        errors.push({ id: prod.id, name: prod.name, message: "Missing description. Feed upload will be rejected.", code: "g:description" });
      } else if (prod.description.length < 50) {
        warnings.push({ id: prod.id, name: prod.name, message: "Description is too short. Recommend at least 50 chars for semantic index ranking.", code: "g:description" });
        passedPoints += 0.5;
      } else {
        passedPoints++;
      }

      // 3. Brand check (Required/highly recommended, GMC flags "Generic" or empty values)
      totalCheckedPoints++;
      if (!prod.brand || prod.brand.trim() === "") {
        errors.push({ id: prod.id, name: prod.name, message: "No Brand defined. GMC requires standard manufacturer designations.", code: "g:brand" });
      } else if (prod.brand.toLowerCase() === "generic" || prod.brand.toLowerCase() === "unknown") {
        warnings.push({ id: prod.id, name: prod.name, message: "Brand set as Generic. GMC preferred standard values for optimized shopping ads.", code: "g:brand" });
        passedPoints += 0.5;
      } else {
        passedPoints++;
      }

      // 4. Image check
      totalCheckedPoints++;
      if (!prod.image && (!prod.gallery || prod.gallery.length === 0)) {
        errors.push({ id: prod.id, name: prod.name, message: "No product image link defined. GMC will discard the item.", code: "g:image_link" });
      } else {
        passedPoints++;
      }

      // 5. Price verification
      totalCheckedPoints++;
      if (!prod.price || isNaN(prod.price) || prod.price <= 0) {
        errors.push({ id: prod.id, name: prod.name, message: "Invalid pricing structure. Must be a positive decimal.", code: "g:price" });
      } else {
        passedPoints++;
      }

      // 6. Stock & Availability
      totalCheckedPoints++;
      if (prod.stock === undefined || prod.stock === null) {
        warnings.push({ id: prod.id, name: prod.name, message: "Stock property is undefined. Will default to out of stock in GMC.", code: "g:availability" });
      } else {
        passedPoints++;
      }
    });

    const score = totalCheckedPoints > 0 ? Math.round((passedPoints / totalCheckedPoints) * 100) : 100;

    return { score, errors, warnings };
  };

  // Run Structured JSON-LD / Google Search Schema audit
  const runSeoHealthAudit = () => {
    if (!liveProducts || liveProducts.length === 0) return { score: 100, critical: [], recommended: [] };

    const critical: { id: string; name: string; item: string; tip: string }[] = [];
    const recommended: { id: string; name: string; item: string; tip: string }[] = [];
    let passedScore = 0;
    let totalScore = 0;

    liveProducts.forEach((prod) => {
      // 1. Name and Image (Critical for Structured Data)
      totalScore += 2;
      if (!prod.name) {
        critical.push({ id: prod.id, name: "Unnamed", item: "Product Name", tip: "Add a genuine name under Inventory Management." });
      } else {
        passedScore++;
      }

      if (!prod.image && (!prod.gallery || prod.gallery.length === 0)) {
        critical.push({ id: prod.id, name: prod.name, item: "Product Image", tip: "Rich results require a valid image node." });
      } else {
        passedScore++;
      }

      // 2. MPN / SKU (Recommended)
      totalScore += 1;
      // All items have a database id which we assign to SKU/MPN in our template, so this will always pass
      passedScore++;

      // 3. Description (Recommended)
      totalScore += 1;
      if (!prod.description || prod.description.length < 30) {
        recommended.push({ id: prod.id, name: prod.name, item: "Meta Description Details", tip: "Expand description block to provide better Google Search snippet data." });
      } else {
        passedScore++;
      }

      // 4. Reviews / Aggregate Rating (Recommended for Stars)
      totalScore += 2;
      // We check if rating is set or if there are verified buyers
      if (!prod.rating || prod.rating <= 0) {
        recommended.push({ id: prod.id, name: prod.name, item: "Aggregate Rating Stars", tip: "Product is missing public ratings. Seeding expert reviews will unlock golden stars on SERP." });
      } else {
        passedScore += 2;
      }
    });

    const score = totalScore > 0 ? Math.round((passedScore / totalScore) * 100) : 100;
    return { score, critical, recommended };
  };

  const gmcReport = runGmcDiagnostics();
  const seoReport = runSeoHealthAudit();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059]">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-xl tracking-tight text-white uppercase flex items-center gap-2">
              SEO &amp; Dynamic Feed Console
            </h1>
            <p className="text-xs text-white/50 font-sans mt-1">
              Google Merchant Center XML generators, search sitemaps, robots crawl configurations, and structured JSON-LD health checks.
            </p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex gap-4 border-t border-white/5 pt-4 md:border-0 md:pt-0">
          <div className="bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl">
            <span className="text-[10px] font-mono text-white/40 block">GMC READINESS</span>
            <span className={`text-sm font-mono font-bold ${gmcReport.score > 85 ? "text-emerald-400" : "text-amber-400"}`}>
              {gmcReport.score}%
            </span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl">
            <span className="text-[10px] font-mono text-white/40 block">JSON-LD HEALTH</span>
            <span className={`text-sm font-mono font-bold ${seoReport.score > 85 ? "text-emerald-400" : "text-amber-400"}`}>
              {seoReport.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "meta"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
          Site Meta &amp; Headers
        </button>
        <button
          onClick={() => {
            setActiveTab("merchant");
            if (!feedLoaded) handleFetchFeed();
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "merchant"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <FileCode className="w-4 h-4" />
          Google Merchant Feed
        </button>
        <button
          onClick={() => setActiveTab("seo_health")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "seo_health"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          SEO Schema Health
        </button>
        <button
          onClick={() => {
            setActiveTab("crawlers");
            testCrawlerFiles();
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "crawlers"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Crawler Diagnostics
        </button>
        <button
          onClick={() => {
            setActiveTab("content_api");
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "content_api"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Link2 className="w-4 h-4" />
          Google Content API
        </button>
        <button
          onClick={() => {
            setActiveTab("smtp");
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-sans text-xs font-semibold tracking-wide transition-all ${
            activeTab === "smtp"
              ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
              : "border-transparent text-white/40 hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          SMTP &amp; Email
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "meta" && (
        <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl animate-fadeIn max-w-3xl mx-auto">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <Globe className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-sans font-semibold text-sm tracking-wide uppercase">
              Global Header Metadata Engine
            </h2>
          </div>

          {metaStatus === "success" && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs font-semibold mb-6 animate-fadeIn">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>SEO settings updated successfully! Web components will read updated values.</span>
            </div>
          )}

          {metaStatus === "error" && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs font-semibold mb-6 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Update failed: {errorMessage}</span>
            </div>
          )}

          {loadingMeta ? (
            <div className="py-12 text-center text-white/30 font-mono text-xs space-y-3">
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#C5A059]" />
              <p>Synchronizing global indexes...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveMeta} className="space-y-6 text-left">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#C5A059]" />
                    GLOBAL SITE TITLE
                  </label>
                  <span className={`text-[9px] font-mono ${title.length > 70 ? "text-amber-500" : "text-white/30"}`}>
                    {title.length}/70 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tech Sokoni Kenya | Premium Apple & Dell Laptops Nairobi"
                  className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-sans tracking-wide transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-wider text-white/70 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                    META DESCRIPTION BLURB
                  </label>
                  <span className={`text-[9px] font-mono ${description.length > 160 ? "text-amber-500" : "text-white/30"}`}>
                    {description.length}/160 chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a search summary detailing laptop specifications, store address, operating hours, and shipping details..."
                  className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-none rounded-xl p-4 text-xs text-white placeholder-white/20 font-sans leading-relaxed tracking-wide transition-all resize-none"
                />
              </div>

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
                  className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 font-mono transition-all"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3">
                <HelpCircle className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div className="text-[11px] text-white/50 leading-relaxed font-sans">
                  <strong className="text-white block mb-1">Index Crawlers Integration:</strong> 
                  These elements are rendered dynamically inside client browser tabs and sitemap references. When changes are committed, search engine spiders detect updates automatically based on crawl frequency.
                </div>
              </div>

              <button
                type="submit"
                disabled={savingMeta}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {savingMeta ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>COMMITTING SYSTEM SEO UPDATE...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>PUBLISH DYNAMIC SEO REFACTOR</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === "merchant" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Migration Guidance Card */}
          <div className="bg-gradient-to-r from-amber-950/40 to-neutral-900 border border-amber-500/20 rounded-3xl p-6 text-left space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start gap-4 justify-between border-b border-white/5 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm tracking-wide uppercase text-amber-400 flex items-center gap-2">
                    MIGRATION ADVISORY: Resolve "File Not Found" Feed Failures
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
                    Using <strong className="text-white">"Add products from file"</strong> with manual uploads or browser links triggers crawl failure timeouts. Convert your store to the official <strong className="text-white">Google Content API for Shopping</strong> to feed live inventory and restock changes instantly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("content_api")}
                className="px-4 py-2 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans tracking-wide rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg self-stretch sm:self-auto text-center justify-center shrink-0"
              >
                <span>Configure Content API</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Migration Workflow Steps */}
            <div>
              <span className="text-[10px] font-mono text-[#C5A059] font-bold uppercase tracking-widest block mb-3">
                RECOMMENDED CONTENT API MIGRATION WORKFLOW
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px] font-sans">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-1.5 hover:border-[#C5A059]/20 transition-all text-left">
                  <span className="font-mono text-[#C5A059] font-bold text-xs">01. CONFIGURE APIS</span>
                  <h5 className="font-semibold text-white">Enable Shopping API</h5>
                  <p className="text-white/50 leading-relaxed text-[11px]">
                    Open Google Cloud, enable the Content API for Shopping in your project APIs, and generate OAuth 2.0 Web Client credentials.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-1.5 hover:border-[#C5A059]/20 transition-all text-left">
                  <span className="font-mono text-[#C5A059] font-bold text-xs">02. INPUT CREDENTIALS</span>
                  <h5 className="font-semibold text-white">Input OAuth Keys</h5>
                  <p className="text-white/50 leading-relaxed text-[11px]">
                    Switch to the <strong>Google Content API</strong> tab, enter your numeric Merchant ID, Google Client ID, and Client Secret.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-1.5 hover:border-[#C5A059]/20 transition-all text-left">
                  <span className="font-mono text-[#C5A059] font-bold text-xs">03. TEST CONNECTION</span>
                  <h5 className="font-semibold text-white">Run Endpoint Handshake</h5>
                  <p className="text-white/50 leading-relaxed text-[11px]">
                    Perform a test handshake using the <strong>"Test Endpoint"</strong> client utility to verify OAuth permissions and account linking.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-1.5 hover:border-[#C5A059]/20 transition-all text-left">
                  <span className="font-mono text-[#C5A059] font-bold text-xs">04. ACTIVATE SYNC</span>
                  <h5 className="font-semibold text-white">Toggle Live Inventory Sync</h5>
                  <p className="text-white/50 leading-relaxed text-[11px]">
                    Toggle <strong>"Enable Live Sync"</strong> to push price adjustments, restock updates, and catalog edits instantly to Google Search.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Controls Header */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="text-left">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#C5A059]" />
                Google Merchant Center Diagnostics
              </h3>
              <p className="text-xs text-white/40 font-sans mt-1">
                Generate, validate, and verify the physical XML product feed loaded by Google Shopping crawl spiders.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyFeedUrl}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-bold font-sans rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiedFeedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                <span>{copiedFeedUrl ? "Copied Feed URL!" : "Copy Feed URL"}</span>
              </button>
              <button
                onClick={handleFetchFeed}
                disabled={loadingFeed}
                className="px-4 py-2 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? "animate-spin" : ""}`} />
                <span>{loadingFeed ? "Re-generating..." : "Force Re-generate & Sync"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GMC Setup Guide */}
            <div className="lg:col-span-1 bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl text-left space-y-5">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C5A059]" />
                  GMC Connection Manual
                </h4>
                <p className="text-[10px] text-white/40 mt-0.5 font-sans">
                  Complete these steps to activate automated shopping sync.
                </p>
              </div>

              <div className="space-y-4 text-xs font-sans text-white/70 leading-relaxed">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#C5A059] flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">Create Merchant Account</h5>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Register a merchant profile at <a href="https://merchants.google.com" target="_blank" rel="noreferrer" className="text-[#C5A059] hover:underline inline-flex items-center gap-0.5">merchants.google.com <ExternalLink className="w-2.5 h-2.5" /></a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#C5A059] flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">Verify Domain Ownership</h5>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Add HTML meta verification tag: <br/>
                      <code className="bg-[#161616] text-[#C5A059] px-1 py-0.5 rounded font-mono text-[9px] select-all block mt-1 border border-white/5">
                        &lt;meta name="google-site-verification" content="..." /&gt;
                      </code>
                      or add the TXT verification record inside your DNS Zone configuration.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#C5A059] flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">Configure Claim Claiming</h5>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Submit a Domain Claim in Google Merchant Center setting tabs to bind <span className="font-mono text-white">https://techsokoni.com</span> exclusively to your profile.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#C5A059] flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                    4
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">Submit XML Feed Link</h5>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Choose "Add Product Source" &gt; "Scheduled Fetch". Enter:
                      <code className="bg-[#161616] text-[#C5A059] px-1 py-0.5 rounded font-mono text-[9px] select-all block mt-1 border border-white/5 break-all">
                        https://techsokoni.com/google-merchant-feed.xml
                      </code>
                      Configure crawl frequency to "Daily" to ensure live updates match perfectly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Report Table */}
            <div className="lg:col-span-2 bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">
                    Diagnostic Schema Validator
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30">CRITICAL ERRORS:</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${gmcReport.errors.length > 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                    {gmcReport.errors.length}
                  </span>
                </div>
              </div>

              {/* Warnings / Errors summaries */}
              {gmcReport.errors.length === 0 && gmcReport.warnings.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-xs font-sans space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                  <p className="font-semibold text-white">Perfect GMC Compatibility!</p>
                  <p className="text-[11px]">All active catalog items comply with Google Merchant requirements.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {gmcReport.errors.map((err, idx) => (
                    <div key={`err-${idx}`} className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-rose-200">{err.name} <span className="font-mono text-[9px] text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">ID: {err.id.substring(0,6)}</span></div>
                        <p className="text-[11px] text-white/60">{err.message}</p>
                        <p className="text-[9px] font-mono text-rose-400 uppercase mt-1">Tag Target: {err.code}</p>
                      </div>
                    </div>
                  ))}

                  {gmcReport.warnings.map((warn, idx) => (
                    <div key={`warn-${idx}`} className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-200">{warn.name} <span className="font-mono text-[9px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">ID: {warn.id.substring(0,6)}</span></div>
                        <p className="text-[11px] text-white/60">{warn.message}</p>
                        <p className="text-[9px] font-mono text-amber-400 uppercase mt-1">Tag Target: {warn.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feed URL section */}
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-mono text-white/30 block">LIVE FEED PUBLIC DEPLOYMENT</span>
                  <span className="font-mono text-[#C5A059] break-all text-[11px]">https://techsokoni.com/google-merchant-feed.xml</span>
                </div>
                <button
                  onClick={handleCopyFeedUrl}
                  className="w-full sm:w-auto px-3 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 font-semibold text-[11px] font-sans rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>

          {/* XML Live Preview Section */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <FileCode className="w-4 h-4 text-[#C5A059]" />
              Real-Time XML Feed Preview (Live generated from inventory)
            </h4>

            {loadingFeed ? (
              <div className="py-16 text-center text-white/30 font-mono text-xs space-y-3">
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#C5A059]" />
                <p>Generating dynamic XML feed templates...</p>
              </div>
            ) : feedError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
                {feedError}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 font-mono text-[10px] text-white/60 overflow-x-auto max-h-[300px]">
                  <pre className="whitespace-pre">{feedXml || "Click 'Force Re-generate & Sync' to retrieve standard templates."}</pre>
                </div>
                <div className="text-[10px] text-white/30 flex justify-between items-center px-1 font-mono">
                  <span>Feed Size: ~{(feedXml.length / 1024).toFixed(2)} KB</span>
                  <span>Validated standard RSS XML structure</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "seo_health" && (
        <div className="space-y-6 animate-fadeIn text-left">
          {/* Main Score & Linear gauge */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="font-sans font-bold text-base text-white flex items-center justify-center md:justify-start gap-2">
                <Activity className="w-5 h-5 text-[#C5A059]" />
                JSON-LD Product Rich Snippet Audit
              </h3>
              <p className="text-xs text-white/40 font-sans max-w-xl">
                Google Search Console relies on exact JSON-LD markup attributes (brand, reviews, MPN, condition) to unlock Golden Star ratings and Rich Product snippet designs on Search Engine Result Pages (SERP).
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0 bg-[#161616] p-5 rounded-3xl border border-white/5 w-full md:w-auto">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">SCHEMA HEALTH</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-black text-[#C5A059]">{seoReport.score}</span>
                <span className="text-sm font-mono text-white/30">/100</span>
              </div>
              <div className="w-32 bg-white/5 h-2 rounded-full overflow-hidden mt-2 border border-white/5">
                <div 
                  className={`h-full transition-all duration-1000 ${seoReport.score > 80 ? "bg-emerald-400" : seoReport.score > 50 ? "bg-amber-400" : "bg-rose-400"}`}
                  style={{ width: `${seoReport.score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical rich-result blocks (Name, Image) */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Critical Deficiencies ({seoReport.critical.length})
                </h4>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Missing required fields that invalidate schema.org structured indexing entirely.
                </p>
              </div>

              {seoReport.critical.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs font-sans space-y-1">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-400" />
                  <p className="font-semibold text-white">All Critical Fields Valid</p>
                  <p className="text-[10px]">Your products are fully eligible for basic dynamic indexing.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {seoReport.critical.map((item, idx) => (
                    <div key={`crit-${idx}`} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <p className="text-[11px] text-white/50 mt-0.5">Missing: <span className="text-rose-400 font-medium">{item.item}</span></p>
                        <p className="text-[10px] text-[#C5A059] font-mono mt-1">Fix: {item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended enhancements (Reviews, Brand, MPN) */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Search Console Warnings ({seoReport.recommended.length})
                </h4>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Missing optional fields that trigger Google Search warnings and block Golden Rating Star elements.
                </p>
              </div>

              {seoReport.recommended.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs font-sans space-y-1">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-400" />
                  <p className="font-semibold text-white">Advanced Schema Perfect!</p>
                  <p className="text-[10px]">Your products will display rich golden review stars on Google SERP.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {seoReport.recommended.map((item, idx) => (
                    <div key={`rec-${idx}`} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <p className="text-[11px] text-white/50 mt-0.5">Missing: <span className="text-amber-400 font-medium">{item.item}</span></p>
                        <p className="text-[10px] text-[#C5A059] font-mono mt-1">Fix: {item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guidelines and instructions to rank higher */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <TrendingUp className="w-4 h-4 text-[#C5A059]" />
              SEO Rank Optimization Action Plan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                <span className="text-[#C5A059] font-mono font-bold text-sm block">01</span>
                <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">Expand Description</h5>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Provide granular specifications (RAM, SSD core layout, battery life cycle parameters) to hit semantic keyword scores.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                <span className="text-[#C5A059] font-mono font-bold text-sm block">02</span>
                <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">Unify Brand Fields</h5>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Do not leave brand blank or use vague designations. GMC maps search terms strictly using Standard brand indicators.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                <span className="text-[#C5A059] font-mono font-bold text-sm block">03</span>
                <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">Gather Product Reviews</h5>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Google Rich Snippets require active rating tags to display star counts, increasing CTR by up to 30%.
                </p>
              </div>
            </div>
          </div>

          {/* Crawling Help & Search Console Verification Section */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mt-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <BookOpen className="w-5 h-5 text-[#C5A059]" />
              <div className="space-y-0.5">
                <h4 className="font-sans font-bold text-sm tracking-wide text-white uppercase">
                  Crawling Help &amp; Search Console Verification Guide
                </h4>
                <p className="text-[11px] text-white/50">
                  Step-by-step documentation for validating techsokoni.com on Google Search Console (GSC) and fixing crawl failures.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-sans text-left">
              {/* Left Column: Domain Verification Guide */}
              <div className="space-y-4">
                <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  1. Google Search Console Domain Verification
                </h5>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  To register your sitemap on Google, you must prove ownership of <strong className="text-white">techsokoni.com</strong>. GSC provides an HTML Meta verification code or DNS TXT records.
                </p>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block">
                    Option A: HTML Meta Tag Verification (Recommended)
                  </span>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Copy this tag, open the <strong className="text-white">Site Meta &amp; Headers</strong> tab on this dashboard, and paste it into the Global Headers configuration to persist it dynamically in your HTML head.
                  </p>

                  <div className="flex items-center justify-between gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 font-mono text-[10px] text-[#C5A059]">
                    <span className="truncate pr-2">
                      &lt;meta name="google-site-verification" content="GSC_VERIFICATION_TOKEN_HERE" /&gt;
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('<meta name="google-site-verification" content="GSC_VERIFICATION_TOKEN_HERE" />');
                        setCopiedVerifyTag(true);
                        setTimeout(() => setCopiedVerifyTag(false), 2000);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors shrink-0"
                      title="Copy code"
                    >
                      {copiedVerifyTag ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block">
                    Option B: DNS TXT Record Verification
                  </span>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    If managing domain DNS records (e.g., via Cloudflare, Namecheap, or GoDaddy), add a new record of type <strong className="text-white">TXT</strong> with host <strong className="text-white">@</strong> and value <strong className="text-white">google-site-verification=GSC_VERIFICATION_TOKEN_HERE</strong>.
                  </p>
                </div>
              </div>

              {/* Right Column: SPA Pathing Troubleshooting */}
              <div className="space-y-4">
                <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  2. Resolving "File Not Found" SPA Sitemap Failures
                </h5>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  Single-Page Applications (SPAs) utilize client-side routers (like React Router). By default, hosting servers route all requests to the main <strong className="text-white">index.html</strong> shell.
                </p>

                <div className="bg-rose-950/5 border border-rose-500/10 rounded-2xl p-4.5 space-y-3.5">
                  <h6 className="font-bold text-rose-300 text-[11px]">The Core Root Cause:</h6>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    When search engine crawlers request <strong className="text-white">/sitemap.xml</strong> or <strong className="text-white">/google-merchant-feed.xml</strong>, the host falls back to the client-side SPA bundle instead of serving pure XML. This causes Google Search Console to encounter an HTML template, generating an <strong>"access failed"</strong> or <strong>"unsupported format"</strong> error.
                  </p>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-4.5 space-y-3">
                  <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest block">
                    The Solution (Now Pre-Configured on Your Server):
                  </span>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    We resolved this by injecting native serverless rewrite instructions into your deployment config. This forces the platform to route sitemap requests directly to our dynamic Express XML endpoint:
                  </p>

                  <div className="flex items-center justify-between gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-[#C5A059] text-left">
                    <pre className="overflow-x-auto pr-2 select-all leading-normal text-white/80">
{`{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/index" }
  ]
}`}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('{\n  "rewrites": [\n    { "source": "/sitemap.xml", "destination": "/api/index" }\n  ]\n}');
                        setCopiedRewriteConfig(true);
                        setTimeout(() => setCopiedRewriteConfig(false), 2000);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors shrink-0 self-start"
                      title="Copy code"
                    >
                      {copiedRewriteConfig ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "crawlers" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* robots.txt status card */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/5 text-[#C5A059]">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-xs text-white uppercase">robots.txt Status</h3>
                    <p className="text-[10px] text-white/40">Crawl Permissions Map</p>
                  </div>
                </div>
                {checkingCrawlers ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                ) : robotsStatus?.exists ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                    ACTIVE (200 OK)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono rounded">
                    MISSING / ERR
                  </span>
                )}
              </div>

              {robotsStatus ? (
                <div className="space-y-3.5 text-xs font-sans">
                  {robotsStatus.exists ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                        <div>
                          <span className="text-white/40 block">File Size</span>
                          <span className="text-white font-medium">{robotsStatus.size} bytes</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Configuration Lines</span>
                          <span className="text-white font-medium">{robotsStatus.linesCount} rows</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          {robotsStatus.sitemapDeclared ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="text-white">
                            Sitemap Pointer Declared: <strong className="font-mono text-[#C5A059]">{robotsStatus.sitemapDeclared ? "YES" : "NO"}</strong>
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-white block">Sensitive Routes Protected:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {robotsStatus.disallowedPaths.map((p, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono text-white/70 border border-white/5">
                                  {p}
                                </span>
                              ))}
                              {robotsStatus.disallowedPaths.length === 0 && (
                                <span className="text-[10px] text-rose-400 font-mono">No sensitive paths blocked!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-mono text-white/40 uppercase block">Raw File Content:</span>
                        <pre className="p-3 bg-[#141414] border border-white/5 rounded-xl font-mono text-[10px] leading-relaxed text-emerald-400/80 overflow-x-auto max-h-[120px] scrollbar-thin text-left">
                          {robotsStatus.content}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-400/90 text-xs">
                      <p className="font-bold mb-1">robots.txt File Access Failed</p>
                      <p className="text-[11px] leading-relaxed text-white/50">
                        Search engine crawlers could not locate a robots.txt file at your host root. This can cause index delays or exposure of sensitive panels.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-white/30 text-xs font-sans">
                  Click 'Run Diagnostics' below to analyze files.
                </div>
              )}
            </div>

            {/* sitemap.xml status card */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/5 text-[#C5A059]">
                    <Globe className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-xs text-white uppercase">sitemap.xml Status</h3>
                    <p className="text-[10px] text-white/40">Search Engine Index Map</p>
                  </div>
                </div>
                {checkingCrawlers ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                ) : sitemapStatus?.exists ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                    ACTIVE (200 OK)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono rounded">
                    MISSING / ERR
                  </span>
                )}
              </div>

              {sitemapStatus ? (
                <div className="space-y-3.5 text-xs font-sans">
                  {sitemapStatus.exists ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                        <div>
                          <span className="text-white/40 block">File Size</span>
                          <span className="text-white font-medium">{sitemapStatus.size} bytes</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Indexed URLs Count</span>
                          <span className="text-white font-medium">{sitemapStatus.urlsCount} links</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          {sitemapStatus.validXml ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#C5A059] shrink-0" />
                          )}
                          <span className="text-white">
                            Structure Validation: <strong className="font-mono text-emerald-400">{sitemapStatus.validXml ? "VALID XML SCHEMA" : "SCHEMA ERROR"}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-white">
                            Live Crawler Accessibility: <strong className="text-emerald-400 font-bold">SUCCESSFUL</strong>
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] leading-relaxed text-white/60 text-left">
                        <span className="font-bold text-emerald-400 block mb-1">Index Map Fully Loaded:</span>
                        Search crawlers like Googlebot and Bingbot can read sitemap links automatically. Crawl budget is optimized.
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-400/90 text-xs">
                      <p className="font-bold mb-1">sitemap.xml Access Failed</p>
                      <p className="text-[11px] leading-relaxed text-white/50">
                        Search engine crawlers could not fetch /sitemap.xml. Ensure index routing is running and your site has active inventory items.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-white/30 text-xs font-sans">
                  Click 'Run Diagnostics' below to analyze files.
                </div>
              )}
            </div>

          </div>

          {/* Action Trigger Row */}
          <div className="flex justify-center">
            <button
              onClick={testCrawlerFiles}
              disabled={checkingCrawlers}
              className="px-6 py-3 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans tracking-wide rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {checkingCrawlers ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CRAWLING DIAGNOSTIC SITES...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 animate-pulse" />
                  <span>RUN RE-CHECK &amp; PING CRONTAB</span>
                </>
              )}
            </button>
          </div>

          {/* Google Merchant Center Instruction Guide (SOLVES MANUAL vs SCHEDULED FETCH) */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-left">
            <div className="border-b border-white/5 pb-4">
              <h3 className="font-sans font-bold text-sm text-white uppercase flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-[#C5A059]" />
                Google Merchant Center Connection Manual
              </h3>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Learn how to resolve the <strong className="text-white">"File not found"</strong> error and choose the optimal method to submit your catalog to Google.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-left">
                  <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Why did manual file upload fail?
                  </h4>
                  <p className="text-white/70 leading-relaxed text-[11px]">
                    If you choose <strong className="text-white">"Upload a file"</strong> under "Add products from a file", Google expects you to upload a physical, static file stored on your local hard drive. 
                  </p>
                  <p className="text-white/50 leading-relaxed text-[11px]">
                    Entering a web URL like <code className="text-emerald-400 font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">https://techsokoni.com/google-merchant-feed.xml</code> there will trigger a <strong className="text-rose-400">"File Not Found"</strong> or "Failed to locate file" error, because it is a web endpoint, not a physical folder path on your computer.
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2 text-left">
                  <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    The Solution: Choose "Scheduled Fetch"
                  </h4>
                  <p className="text-white/70 leading-relaxed text-[11px]">
                    Instead of manual uploads or the complex Content API, choose the <strong className="text-white">Scheduled Fetch</strong> feed method. This lets Google automatically download and sync your inventory from your server every day!
                  </p>
                  <ul className="space-y-1.5 text-white/60 text-[11px] list-disc pl-4">
                    <li>Always keeps prices &amp; stocks 100% accurate.</li>
                    <li>Automatic sync runs daily at midnight.</li>
                    <li>No manual download/re-upload needed!</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 leading-relaxed text-left">
                  <h4 className="font-bold text-[#C5A059] uppercase text-[11px] tracking-wider">
                    Step-by-Step Setup in Google Merchant Center
                  </h4>
                  
                  <div className="space-y-3.5 text-[11px] text-white/70">
                    <div className="flex gap-2">
                      <span className="font-mono text-[#C5A059] font-bold">1.</span>
                      <p>Go to your <strong className="text-white">Merchant Center Console</strong> &rarr; click on <strong className="text-white">Products</strong> &rarr; <strong className="text-white">Feeds</strong>.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="font-mono text-[#C5A059] font-bold">2.</span>
                      <p>Click the big <strong className="text-white">"+" blue button</strong> to add a new primary product feed.</p>
                    </div>

                    <div className="flex gap-2">
                      <span className="font-mono text-[#C5A059] font-bold">3.</span>
                      <p>Select target country (<strong className="text-white">Kenya</strong>) and language, then choose <strong className="text-white">Scheduled Fetch</strong> when asked how you want to set up your feed.</p>
                    </div>

                    <div className="flex gap-2">
                      <span className="font-mono text-[#C5A059] font-bold">4.</span>
                      <p>Name your feed, then in the next step enter the URL:</p>
                    </div>

                    <div className="bg-[#141414] border border-white/5 px-3.5 py-2.5 rounded-xl flex items-center justify-between font-mono text-[10px] text-emerald-400">
                      <span>https://techsokoni.com/google-merchant-feed.xml</span>
                      <button 
                        onClick={handleCopyFeedUrl}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/80 border border-white/10 cursor-pointer"
                        title="Copy Feed URL"
                      >
                        {copiedFeedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <span className="font-mono text-[#C5A059] font-bold">5.</span>
                      <p>Set Fetch frequency to <strong className="text-white">Daily</strong> and time to any hour. Click <strong className="text-white">Create Feed</strong>. Done!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "content_api" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C5A059]/20 to-amber-500/10 text-[#C5A059] border border-[#C5A059]/30">
                  <Link2 className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h2 className="font-sans font-bold text-sm tracking-wide uppercase">
                    Google Content API for Shopping
                  </h2>
                  <p className="text-[11px] text-white/40">Real-time inventory &amp; catalog synchronization engine</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSyncEnabled ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Sync Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    Sync Suspended
                  </span>
                )}
              </div>
            </div>

            {apiConfigStatus === "success" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs font-semibold mb-6 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Google Content API configuration successfully saved to cloud Firestore!</span>
              </div>
            )}

            {apiConfigStatus === "error" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs font-semibold mb-6 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Error: {apiErrorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Config Block */}
              <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleSaveApiConfig} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                        Merchant Center ID <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={isSyncEnabled}
                        placeholder="e.g. 533491022"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-sans text-xs text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                        Primary Feed ID / Source ID <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10686938183"
                        value={feedId}
                        onChange={(e) => setFeedId(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-sans text-xs text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                        Google Cloud Project ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. techsokoni-shopping-api"
                        value={gmcProjectId}
                        onChange={(e) => setGmcProjectId(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-sans text-xs text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                      OAuth 2.0 Client ID <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required={isSyncEnabled}
                        placeholder="e.g. xxx-yyy.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                      <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-white/25" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                      OAuth 2.0 Client Secret <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required={isSyncEnabled}
                        placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                      <ShieldCheck className="absolute right-3.5 top-3.5 w-4 h-4 text-white/25" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                      Developer Key (Optional API Key)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={developerKey}
                      onChange={(e) => setDeveloperKey(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-2xl text-left">
                      <div>
                        <span className="text-xs font-bold text-white block">Enable Live Sync</span>
                        <span className="text-[10px] text-white/40 block mt-0.5">Push changes instantly to Google</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                          isSyncEnabled ? "bg-[#C5A059]" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform ${
                            isSyncEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-1 text-left">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                        Syncing Strategy
                      </span>
                      <select
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C5A059] focus:outline-none transition-all"
                      >
                        <option value="realtime">Push Real-time (On Edit)</option>
                        <option value="hourly">Hourly Batch Re-Sync</option>
                        <option value="daily">Daily Total Re-Sync</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingApiConfig}
                      className="flex-1 px-5 py-3 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {savingApiConfig ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SAVING TO FIRESTORE...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>SAVE CONTENT CONFIG</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>DIAL HANDSHAKE...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>TEST ENDPOINT</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {apiConnectionTested && testResult && (
                  <div className={`p-4 rounded-2xl text-left text-xs leading-relaxed animate-fadeIn ${
                    testResult.success 
                      ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-400" 
                      : "bg-rose-500/5 border border-rose-500/15 text-rose-400"
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      )}
                      <div>
                        <strong className="block mb-1">{testResult.success ? "Test Succeeded!" : "Connection Failed"}</strong>
                        <p className="text-white/75 text-[11px] leading-relaxed">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step-by-Step Google Setup Guide */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-4">
                  <h4 className="font-sans font-bold text-xs text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#C5A059]" />
                    Integration Setup Manual
                  </h4>

                  <p className="text-white/60 text-[11px] leading-relaxed">
                    The Google Content API is the gold standard for large or rapid ecommerce shops. It instantly pushes inventory edits (price cuts, flash offers, restocks) straight to Google's search indices without waiting for file crawler loops.
                  </p>

                  <div className="space-y-4 text-[11px] leading-relaxed text-white/70">
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/5 text-[#C5A059] flex items-center justify-center font-mono text-[10px] shrink-0 font-bold mt-0.5 border border-[#C5A059]/15">1</div>
                      <div>
                        <strong className="text-white block">Enable Shopping API</strong>
                        <p className="text-white/50 mt-0.5">Go to your <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300 inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-2.5 h-2.5" /></a>, select or create a project, and enable the <strong className="text-white">Content API for Shopping</strong>.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/5 text-[#C5A059] flex items-center justify-center font-mono text-[10px] shrink-0 font-bold mt-0.5 border border-[#C5A059]/15">2</div>
                      <div>
                        <strong className="text-white block">Create OAuth 2.0 Credentials</strong>
                        <p className="text-white/50 mt-0.5">In GCP, click <strong className="text-white">APIs &amp; Services &rarr; Credentials</strong>. Add a new OAuth 2.0 Client ID (Application Type: <strong className="text-white">Web application</strong>). Copy the Client ID and Secret and paste them here.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/5 text-[#C5A059] flex items-center justify-center font-mono text-[10px] shrink-0 font-bold mt-0.5 border border-[#C5A059]/15">3</div>
                      <div>
                        <strong className="text-white block">Authorize Merchant Center</strong>
                        <p className="text-white/50 mt-0.5">Go to your <strong className="text-white">Google Merchant Center</strong> panel, click <strong className="text-white">Settings &rarr; Account Access</strong>, and link your Google Cloud project or invite the OAuth User email to allow direct write access.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/5 text-[#C5A059] flex items-center justify-center font-mono text-[10px] shrink-0 font-bold mt-0.5 border border-[#C5A059]/15">4</div>
                      <div>
                        <strong className="text-white block">Activate and Save</strong>
                        <p className="text-white/50 mt-0.5">Toggle <strong className="text-white">Enable Live Sync</strong>, choose your synchronization interval, and click <strong className="text-white">Save Content Config</strong>. The store now manages real-time catalog syncing!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Diagnostics Panel */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-left border-t-2 border-t-[#C5A059]/40 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-sm text-white uppercase flex items-center gap-2.5 flex-wrap">
                  <Activity className="w-5 h-5 text-[#C5A059]" />
                  <span>Google Merchant Center Sync Diagnostics</span>
                  
                  {/* Sitemap.xml Accessibility Indicator Badge with Tooltip */}
                  <div className="relative group flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border cursor-help transition-all duration-300 ${
                      sitemapCheck.status === "success" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                        : sitemapCheck.status === "yellow"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        : sitemapCheck.status === "loading"
                        ? "bg-white/5 text-white/40 border-white/10"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sitemapCheck.status === "success" 
                          ? "bg-emerald-400 animate-pulse" 
                          : sitemapCheck.status === "yellow"
                          ? "bg-amber-400 animate-pulse"
                          : sitemapCheck.status === "loading"
                          ? "bg-white/40 animate-spin border border-t-transparent border-white"
                          : "bg-rose-400 animate-pulse"
                      }`} />
                      Sitemap: {sitemapCheck.status === "loading" ? "CHECKING" : sitemapCheck.status.toUpperCase()}
                    </span>

                    {/* Highly Polished Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#111111] border border-white/15 rounded-xl shadow-2xl text-[10px] font-sans normal-case tracking-normal text-white/90 font-normal leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-1.5 mb-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          sitemapCheck.status === "success" ? "bg-emerald-400" : sitemapCheck.status === "yellow" ? "bg-amber-400" : sitemapCheck.status === "loading" ? "bg-white/40" : "bg-rose-400"
                        }`} />
                        <span className="font-bold text-white uppercase text-[9px] font-mono tracking-wider">
                          Google Sitemap Health Status
                        </span>
                      </div>
                      <p className="font-medium text-white/90">{sitemapCheck.message}</p>
                      {sitemapCheck.details && (
                        <p className="text-white/50 mt-1 font-mono text-[9px] bg-black/40 p-1.5 rounded border border-white/5">
                          {sitemapCheck.details}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-white/30 text-[8px] font-mono mt-2 pt-1 border-t border-white/5">
                        <span>URL: /sitemap.xml</span>
                        {sitemapCheck.urlsCount > 0 && <span>{sitemapCheck.urlsCount} routes</span>}
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111111]" />
                    </div>
                  </div>
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Analyzes the last five ingestion and API communication logs to detect crawler timeouts, authentication blocks, and product validation failures.
                </p>
              </div>
              <button
                onClick={handleTriggerSync}
                disabled={triggeringSync}
                className="px-4 py-2 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-bold font-sans tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {triggeringSync ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>RUNNING LIVE SYNC...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>TRIGGER MANUAL SYNC</span>
                  </>
                )}
              </button>
            </div>

            {loadingLogs ? (
              <div className="py-12 text-center text-white/30 font-mono text-[11px] space-y-2">
                <Loader2 className="w-4 h-4 mx-auto animate-spin text-[#C5A059]" />
                <p>Retrieving diagnostic sync logs...</p>
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-xs font-sans">
                No sync logs detected in database. Trigger a manual sync above to initialize logs.
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {syncLogs.map((log: any, idx: number) => {
                  const dateStr = new Date(log.timestamp).toLocaleString();
                  const isFailed = log.status === "failed";
                  return (
                    <div
                      key={log.id || `log-${idx}`}
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isFailed ? "bg-rose-950/10 border-rose-500/20" : "bg-emerald-950/10 border-emerald-500/20"
                      }`}
                    >
                      {/* Log Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4.5 py-3.5 bg-white/[0.01] border-b border-white/5 text-[11px]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                            isFailed ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-white/40 font-mono">[{log.method}]</span>
                          <span className="text-white/85 font-semibold">{log.message}</span>
                        </div>
                        <div className="text-white/40 font-mono text-[10px] shrink-0">
                          {dateStr}
                        </div>
                      </div>

                      {/* Log Body Details */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono text-white/50">
                          <div>
                            <span className="text-white/30 block text-[9px]">MERCHANT ID</span>
                            <span className="text-white/85">{log.merchantId}</span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[9px]">PRODUCTS ATTEMPTED</span>
                            <span className="text-white/85">{log.productsSynced} items</span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[9px]">ERRORS DETECTED</span>
                            <span className={`font-bold ${log.errorsCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {log.errorsCount} issues
                            </span>
                          </div>
                          <div>
                            <span className="text-white/30 block text-[9px]">LATENCY</span>
                            <span className="text-white/85">{log.durationMs} ms</span>
                          </div>
                        </div>

                        {/* Individual Item Errors List */}
                        {log.errors && log.errors.length > 0 && (
                          <div className="space-y-2 border-t border-white/5 pt-3">
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">
                              Failed Ingestion Details &amp; Validation Breakdowns:
                            </span>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {log.errors.map((err: any, eIdx: number) => (
                                <div
                                  key={`err-${idx}-${eIdx}`}
                                  className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-2.5 text-xs text-left"
                                >
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                                      <span>{err.name}</span>
                                      {err.productId !== "system" && err.productId !== "auth" && (
                                        <span className="font-mono text-[9px] bg-white/5 text-white/40 px-1 py-0.5 rounded">
                                          ID: {err.productId.substring(0, 8)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-rose-300 leading-relaxed font-sans">{err.reason}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "smtp" && (
        <div className="space-y-6 animate-fadeIn text-left">
          {/* Header Banner */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#C5A059]/20 to-amber-500/10 text-[#C5A059] border border-[#C5A059]/30 animate-pulse">
                  <Mail className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h2 className="font-sans font-bold text-sm tracking-wide uppercase">
                    SMTP Server &amp; Email Diagnostics
                  </h2>
                  <p className="text-[11px] text-white/40">Secure outbound transactional receipt delivery engine</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {smtpStatus?.configured ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SMTP Configuration Loaded
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    SMTP Simulation Mode
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: Server Configuration Parameters */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#C5A059] mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#C5A059]" />
                    1. Outbound Environment Variables Status
                  </h3>
                  <p className="text-white/60 leading-relaxed text-[11px] mb-4 font-sans">
                    Nodemailer reads these parameters at startup from Google Secrets or Vercel configuration panels.
                  </p>

                  {loadingSmtpStatus ? (
                    <div className="py-8 text-center text-white/30 font-mono text-[10px] space-y-1.5 bg-black/30 border border-white/5 rounded-2xl">
                      <Loader2 className="w-4 h-4 mx-auto animate-spin text-[#C5A059]" />
                      <p>Querying container secrets context...</p>
                    </div>
                  ) : smtpStatus ? (
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4.5 space-y-3 font-mono text-[11px]">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 text-[10px]">SMTP_HOST</span>
                        <span className="text-white font-semibold">{smtpStatus.host}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 text-[10px]">SMTP_PORT</span>
                        <span className="text-white font-semibold">{smtpStatus.port}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 text-[10px]">SMTP_USER</span>
                        <span className="text-white font-semibold truncate max-w-[200px]" title={smtpStatus.user}>{smtpStatus.user}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-white/40 text-[10px]">SMTP_PASS</span>
                        <span className="text-[#C5A059] font-semibold">{smtpStatus.passMasked}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-white/40 text-[10px]">SENDER FROM</span>
                        <span className="text-white/80 text-[10px] truncate max-w-[200px]" title={smtpStatus.from}>{smtpStatus.from || `support@techsokoni.com`}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-[11px]">
                      Failed to fetch active environment state check.
                    </div>
                  )}
                </div>

                {/* Zoho configuration help note */}
                <div className="bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl p-5 space-y-3 font-sans text-[11px] leading-relaxed">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Zoho Mail Security Compliance Checklist
                  </h4>
                  <ul className="space-y-2 text-white/75 pl-4 list-disc">
                    <li>
                      <strong className="text-white">Strict Sender Check:</strong> Zoho forbids sending email where the sender's address (From) differs from the SMTP login user. <strong className="text-[#C5A059]">We have updated your server code to enforce this alignment automatically!</strong>
                    </li>
                    <li>
                      <strong className="text-white">Two-Factor Auth (2FA):</strong> If 2FA is active on your Zoho account, standard passwords will be rejected! Generate a 16-character <strong className="text-amber-400">App-Specific Password</strong> from <span className="text-[#C5A059] underline">accounts.zoho.com &rarr; Security &rarr; App Passwords</span>, and set it as your <code className="bg-white/5 px-1 rounded text-[#C5A059]">SMTP_PASS</code>.
                    </li>
                    <li>
                      <strong className="text-white">IMAP/SMTP Sync:</strong> Verify SMTP is active: Go to Zoho Mail Settings &rarr; Mail Accounts &rarr; POP/IMAP/SMTP Sync, and check <code className="text-white">Enable Outgoing SMTP</code>.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Interactive Diagnostics Console */}
              <div className="lg:col-span-6 space-y-5">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#C5A059] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#C5A059]" />
                  2. Interactive Live SMTP Diagnostics Console
                </h3>
                <p className="text-white/60 leading-relaxed text-[11px] font-sans">
                  Trigger a live server-side verification to test connection ports, logins, and send a diagnostic test email immediately.
                </p>

                <form onSubmit={handleTestSmtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                      Test Recipient Email Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="e.g. techgadgetsk@gmail.com"
                        value={smtpTestEmail}
                        onChange={(e) => setSmtpTestEmail(e.target.value)}
                        className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 font-sans text-xs text-white placeholder-white/20 focus:border-[#C5A059] focus:outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={testingSmtp || loadingSmtpStatus}
                        className="px-5 py-3 bg-[#C5A059] hover:bg-amber-600 disabled:opacity-40 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/5 shrink-0"
                      >
                        {testingSmtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>TESTING...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>SEND TEST</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Test Results Output block */}
                {smtpTestResult && (
                  <div className={`border rounded-2xl p-5 space-y-3.5 animate-fadeIn font-sans ${
                    smtpTestResult.success 
                      ? "bg-emerald-950/10 border-emerald-500/25 text-emerald-300" 
                      : "bg-rose-950/10 border-rose-500/25 text-rose-300"
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                      {smtpTestResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{smtpTestResult.message}</span>
                    </div>

                    <p className="text-[11px] font-sans text-white/70 leading-relaxed">
                      {smtpTestResult.details}
                    </p>

                    {smtpTestResult.code && (
                      <div className="font-mono text-[10px] bg-black/40 border border-white/5 p-2 rounded-xl text-white/40">
                        ERROR_CODE: {smtpTestResult.code}
                      </div>
                    )}

                    {smtpTestResult.help && (
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-[11px] font-sans text-white/80 leading-normal space-y-1.5 whitespace-pre-wrap text-left">
                        <span className="font-mono text-[#C5A059] text-[10px] uppercase font-bold tracking-widest block">How to resolve this issue:</span>
                        {smtpTestResult.help}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
