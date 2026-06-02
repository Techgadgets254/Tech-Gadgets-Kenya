/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../StoreContext";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Activity, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Check, 
  X, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  PlusCircle,
  FolderMinus,
  Upload,
  Download,
  UploadCloud,
  Mail,
  Users,
  Percent,
  Send,
  Sparkles,
  CheckSquare,
  QrCode,
  Award,
  Share2,
  Copy
} from "lucide-react";
import { Product, Order } from "../types";
import { M_PESA_GATEWAYS } from "../data";
import { db } from "../firebase";
import { collection, getDocs, onSnapshot, addDoc, setDoc, deleteDoc, doc } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { 
    user, 
    userProfile, 
    products, 
    orders, 
    addProduct, 
    editProduct, 
    removeProduct, 
    updateOrderStatus,
    importProductsCSV,
    affiliates,
    addAffiliate,
    toggleAffiliate,
    deleteAffiliate
  } = useStore();

  // Sort states for Products / Commodities
  const [productSortField, setProductSortField] = useState<"name" | "brand" | "category" | "price" | "stock">("name");
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("asc");

  // Sort states for Orders
  const [orderSortField, setOrderSortField] = useState<"createdAt" | "customerName" | "totalAmount" | "paymentStatus" | "status">("createdAt");
  const [orderSortDirection, setOrderSortDirection] = useState<"asc" | "desc">("desc"); // Newest first

  const handleProductSort = (field: typeof productSortField) => {
    if (productSortField === field) {
      setProductSortDirection(p => p === "asc" ? "desc" : "asc");
    } else {
      setProductSortField(field);
      setProductSortDirection("asc");
    }
  };

  const handleOrderSort = (field: typeof orderSortField) => {
    if (orderSortField === field) {
      setOrderSortDirection(p => p === "asc" ? "desc" : "asc");
    } else {
      setOrderSortField(field);
      setOrderSortDirection("desc"); // Default descending for dates
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let valA: any = a[productSortField];
      let valB: any = b[productSortField];

      if (productSortField === "price" || productSortField === "stock") {
        return productSortDirection === "asc" ? valA - valB : valB - valA;
      }

      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();

      if (valA < valB) return productSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return productSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, productSortField, productSortDirection]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      let valA: any = a[orderSortField];
      let valB: any = b[orderSortField];

      if (orderSortField === "totalAmount") {
        return orderSortDirection === "asc" ? valA - valB : valB - valA;
      }

      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();

      if (valA < valB) return orderSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return orderSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, orderSortField, orderSortDirection]);

  // Active sub-view ("overview" | "inventory" | "orders" | "newsletters" | "trash" | "affiliates" | "qrcode")
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "inventory" | "orders" | "newsletters" | "trash" | "affiliates" | "qrcode">("overview");

  // Affiliate creation form state
  const [affiliateName, setAffiliateName] = useState("");
  const [affiliateEmail, setAffiliateEmail] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateDiscountType, setAffiliateDiscountType] = useState<"percentage" | "fixed">("fixed");
  const [affiliateDiscountValue, setAffiliateDiscountValue] = useState(1000);
  const [showAffiliateForm, setShowAffiliateForm] = useState(false);

  // QR Code generator state
  const [qrText, setQrText] = useState("https://techgadgetskenya.co.ke");
  const [qrFgColor, setQrFgColor] = useState("000000");
  const [qrBgColor, setQrBgColor] = useState("ffffff");
  const [qrSize, setQrSize] = useState(200);
  const [copiedQr, setCopiedQr] = useState(false);

  // Bulk selection, notification and trash recovery state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [actionSuccessNotification, setActionSuccessNotification] = useState("");
  const [trashItems, setTrashItems] = useState<{ id: string; originalId: string; productData: any; deletedAt: string }[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // Newsletter Subscribers states
  const [subscribers, setSubscribers] = useState<{ email: string; subscribedAt: string }[]>([]);
  const [subscriberLoading, setSubscriberLoading] = useState(false);
  const [newsletterSearch, setNewsletterSearch] = useState("");
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [dispatchingCampaign, setDispatchingCampaign] = useState(false);
  const [campaignSuccessToast, setCampaignSuccessToast] = useState("");

  useEffect(() => {
    if (activeSubTab === "newsletters" || activeSubTab === "overview") {
      const fetchSubscribers = async () => {
        setSubscriberLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, "newsletters"));
          const list: { email: string; subscribedAt: string }[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              email: data.email || "",
              subscribedAt: data.subscribedAt || new Date().toISOString()
            });
          });

          // Local storage fallback sync
          const storedStr = localStorage.getItem("tgk_newsletters");
          if (storedStr) {
            try {
              const stored = JSON.parse(storedStr);
              stored.forEach((item: any) => {
                if (item && item.email && !list.some(x => x.email.toLowerCase() === item.email.toLowerCase())) {
                  list.push(item);
                }
              });
            } catch (e) {
              console.error(e);
            }
          }

          // Sort by subscribed date descending
          list.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
          setSubscribers(list);
        } catch (err) {
          console.error("Firestore loading failed, reading local fallbacks", err);
          const list: { email: string; subscribedAt: string }[] = [];
          const storedStr = localStorage.getItem("tgk_newsletters");
          if (storedStr) {
            try {
              const stored = JSON.parse(storedStr);
              stored.forEach((item: any) => {
                if (item && item.email) {
                  list.push(item);
                }
              });
            } catch (e) {
              console.error(e);
            }
          }
          list.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
          setSubscribers(list);
        } finally {
          setSubscriberLoading(false);
        }
      };

      fetchSubscribers();
    }
  }, [activeSubTab]);

  // Load soft-deleted products in trash
  useEffect(() => {
    if (activeSubTab === "trash" || activeSubTab === "overview") {
      setTrashLoading(true);
      const trashColRef = collection(db, "trash");
      const unsubscribe = onSnapshot(trashColRef, (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() });
        });
        // Sort by deletedAt descending
        items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        setTrashItems(items);
        setTrashLoading(false);
      }, (error) => {
        console.error("Error loading trash collection:", error);
        setTrashLoading(false);
      });
      return unsubscribe;
    }
  }, [activeSubTab]);

  const handleDispatchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject.trim() || !campaignBody.trim()) {
      alert("Please specify a subject and campaign body message.");
      return;
    }
    setDispatchingCampaign(true);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate server dispatch
    setDispatchingCampaign(false);
    setCampaignSuccessToast(`Newsletter dispatched to ${subscribers.length || 15} verified subscribers successfully!`);
    setCampaignSubject("");
    setCampaignBody("");
    setTimeout(() => setCampaignSuccessToast(""), 6000);
    setCampaignModalOpen(false);
  };

  const handleExportNewslettersCSV = () => {
    try {
      const headers = ["email", "subscribedAt", "status"];
      const csvRows = [headers.join(",")];
      for (const sub of subscribers) {
        csvRows.push(`${sub.email},${sub.subscribedAt},Active`);
      }
      
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `tech_gadgets_newsletters_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed exporting subscriber databases.");
    }
  };

  // Admin Login specific states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminSecurityPassword, setAdminSecurityPassword] = useState("");
  const [adminPasscodePassed, setAdminPasscodePassed] = useState(false);
  const [adminAuthErr, setAdminAuthErr] = useState("");

  const handleSecureTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === "techgadgetsk@gmail.com" && adminSecurityPassword === "admin123") {
      setAdminPasscodePassed(true);
      setAdminAuthErr("");
    } else {
      setAdminAuthErr("Invalid credentials. Please use authentic administrator credentials.");
    }
  };

  // Product addition state (Supporting up to 5 total image attachments)
  const [isEditing, setIsEditing] = useState<string | null>(null); // holds productId while editing
  const [adminBaseCategory, setAdminBaseCategory] = useState<string>("Laptops");
  const [adminCondition, setAdminCondition] = useState<"New" | "Refurbished" | "Generic">("New");

  const getBaseAndCondition = (fullCategory: string) => {
    let base = "Laptops";
    let condition = "New";
    const cat = String(fullCategory || "");
    
    if (cat.includes("Refurbished")) {
      condition = "Refurbished";
      if (cat.includes("Laptops")) base = "Laptops";
      else if (cat.includes("Phones")) base = "Phones";
      else if (cat.includes("Desktops")) base = "Desktops";
    } else if (cat.includes("New")) {
      condition = "New";
      if (cat.includes("Laptops")) base = "Laptops";
      else if (cat.includes("Phones")) base = "Phones";
      else if (cat.includes("Desktops")) base = "Desktops";
    } else {
      condition = "Generic";
      if (cat.includes("Laptops")) base = "Laptops";
      else if (cat.includes("Phones")) base = "Phones";
      else if (cat.includes("Desktops")) base = "Desktops";
      else if (cat.includes("Printers")) base = "Printers";
      else if (cat.includes("Accessories")) base = "Accessories";
      else if (cat.includes("All-in-One PCs")) base = "All-in-One PCs";
    }
    return { base, condition };
  };

  const handleCategoryChoiceChange = (base: string, cond: "New" | "Refurbished" | "Generic") => {
    setAdminBaseCategory(base);
    setAdminCondition(cond);
    
    let finalCategory = base;
    if (base === "Laptops" || base === "Phones" || base === "Desktops") {
      if (cond === "New") {
        finalCategory = `New ${base}`;
      } else if (cond === "Refurbished") {
        finalCategory = `Refurbished ${base}`;
      } else {
        finalCategory = base;
      }
    }
    setProductForm(prev => ({ ...prev, category: finalCategory as any }));
  };

  const [productForm, setProductForm] = useState({
    name: "",
    brand: "",
    category: "Laptops" as Product["category"],
    price: 0,
    stock: 0,
    sku: "",
    description: "",
    image: "",
    gallery1: "",
    gallery2: "",
    gallery3: "",
    gallery4: "",
    specificationsStr: "Processor: Intel i7\nMemory: 16GB\nStorage: 512GB SSD" // default helper template
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [csvUploadState, setCsvUploadState] = useState({ loading: false, successMsg: "", err: "" });

  const [aiGeneratingDescription, setAiGeneratingDescription] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleGenerateAIDescription = async () => {
    if (!productForm.description.trim()) {
      setAiError("Please write a commodity description first so Gemini can generate the technical details.");
      return;
    }
    setAiGeneratingDescription(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          brand: productForm.brand,
          category: productForm.category,
          commodityDescription: productForm.description,
          specifications: productForm.specificationsStr
        })
      });
      if (!response.ok) {
        throw new Error("Failed to contact server description service.");
      }
      const data = await response.json();
      if (data.description) {
        setProductForm(prev => ({
          ...prev,
          description: data.description,
          specificationsStr: data.specifications || prev.specificationsStr
        }));
      } else {
        throw new Error(data.error || "Invalid response format from generator.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to reach Gemini. Check internet or API key.");
    } finally {
      setAiGeneratingDescription(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["id", "name", "brand", "category", "price", "stock", "description", "image", "tags"];
      const escapeCSVField = (field: any) => {
        const str = String(field || "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = [headers.join(",")];
      for (const p of products) {
        const row = [
          escapeCSVField(p.id),
          escapeCSVField(p.name),
          escapeCSVField(p.brand),
          escapeCSVField(p.category),
          p.price,
          p.stock,
          escapeCSVField(p.description),
          escapeCSVField(p.image),
          escapeCSVField(p.tags?.join(";") || "")
        ];
        csvRows.push(row.join(","));
      }

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `tech_gadgets_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error(e);
      alert("Error generating inventory CSV export: " + e.message);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploadState({ loading: true, successMsg: "", err: "" });
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const insertedCount = await importProductsCSV(text);
        setCsvUploadState({
          loading: false,
          successMsg: `Successfully imported ${insertedCount} custom products bulk into live databases!`,
          err: ""
        });
        alert(`Bulk Import Complete: ${insertedCount} items parsed and synchronized!`);
      } catch (err: any) {
        console.error(err);
        setCsvUploadState({
          loading: false,
          successMsg: "",
          err: err.message || "Failed to parse inventory. Check row dimensions and column matching."
        });
        alert(`CSV Import Failed: ` + (err.message || "Error reading rows."));
      }
    };
    reader.onerror = () => {
      setCsvUploadState({ loading: false, successMsg: "", err: "File read error on local device." });
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear
  };

  const handleBulkImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list = Array.from(files).slice(0, 5);
    const MAX_SIZE = 5 * 1024 * 1024;
    setUploadError("");

    list.forEach((file, index) => {
      if (file.size > MAX_SIZE) {
        setUploadError(`File ${file.name} is too large. Max permitted is 5.00MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const fieldName = index === 0 ? "image" : `gallery${index}`;
          setProductForm((prev) => ({
            ...prev,
            [fieldName]: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    setActionSuccessNotification(`Ingested ${list.length} images into product form slots!`);
    setTimeout(() => setActionSuccessNotification(""), 4000);
    e.target.value = ""; // Clear
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`Are you sure you want to move these ${selectedProductIds.length} items to Trash? they will be saved for 60 days before automatic purge.`)) {
      try {
        setActionSuccessNotification(`Moving ${selectedProductIds.length} items to Trash...`);
        const pids = [...selectedProductIds];
        setSelectedProductIds([]); // Clear early
        await Promise.all(pids.map(id => removeProduct(id)));
        setActionSuccessNotification("Bulk deletion completed! Items moved to Trash.");
        setTimeout(() => setActionSuccessNotification(""), 5000);
      } catch (err: any) {
        console.error(err);
        alert("Bulk deletion failed: " + err.message);
      }
    }
  };

  const handleRestoreProduct = async (trashId: string, originalId: string, productData: any) => {
    try {
      const pName = productData.name || "Unnamed Item";
      setActionSuccessNotification(`Restoring item "${pName}" to catalog...`);
      
      const docId = originalId || trashId;
      if (!docId) {
        throw new Error("No valid identifier for the target restoration product record.");
      }

      // Reassemble standard clean Product data matching isValidProduct validation rules
      const cleanProductData = {
        name: String(productData.name || "Unnamed Item").trim().substring(0, 200),
        brand: String(productData.brand || "Generic").trim().substring(0, 100),
        category: String(productData.category || "Accessories").trim().substring(0, 100),
        price: Math.max(0, Number(productData.price || 0)),
        stock: Math.max(0, Math.floor(Number(productData.stock || 0))),
        description: String(productData.description || "").substring(0, 3000),
        image: String(productData.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600"),
        gallery: Array.isArray(productData.gallery) ? productData.gallery : [],
        specifications: productData.specifications || {},
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "products", docId), cleanProductData);
      await deleteDoc(doc(db, "trash", trashId));
      
      setActionSuccessNotification(`Product "${pName}" restored successfully!`);
      setTimeout(() => setActionSuccessNotification(""), 5000);
    } catch (err: any) {
      console.error(err);
      alert("Restore failed: " + err.message);
    }
  };

  const handlePermanentlyDeleteTrash = async (trashId: string, productName: string) => {
    if (confirm(`Are you sure you want to PERMANENTLY purge "${productName}"? This action is absolutely irreversible.`)) {
      try {
        setActionSuccessNotification(`Purging "${productName}"...`);
        await deleteDoc(doc(db, "trash", trashId));
        setActionSuccessNotification(`Product "${productName}" permanently destroyed.`);
        setTimeout(() => setActionSuccessNotification(""), 5000);
      } catch (err: any) {
        console.error(err);
        alert("Purge failed: " + err.message);
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (trashItems.length === 0) return;
    if (confirm(`Are you sure you want to PERMANENTLY purge ALL ${trashItems.length} items in the Trash? This action cannot be undone.`)) {
      try {
        setActionSuccessNotification("Purging all trash documents...");
        await Promise.all(trashItems.map(item => deleteDoc(doc(db, "trash", item.id))));
        setActionSuccessNotification("Trash Bin emptied successfully!");
        setSelectedProductIds([]);
        setTimeout(() => setActionSuccessNotification(""), 5000);
      } catch (err: any) {
        console.error(err);
        alert("Failed to empty trash: " + err.message);
      }
    }
  };

  const handleImageUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "image" | "gallery1" | "gallery2" | "gallery3" | "gallery4"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files larger than 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max permitted is 5.00MB.`);
      e.target.value = "";
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProductForm((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      }
    };
    reader.onerror = () => {
      setUploadError("An error occurred converting the uploaded image to product assets.");
    };
    reader.readAsDataURL(file);
  };

  const renderUploader = (
    label: string,
    field: "image" | "gallery1" | "gallery2" | "gallery3" | "gallery4",
    isRequired = false
  ) => {
    const value = productForm[field];
    return (
      <div className="space-y-1 text-left">
        <label className="font-mono text-[9px] font-bold text-white/40 block mb-0.5 uppercase tracking-wider">
          {label} {isRequired && <span className="text-red-400 font-bold">*</span>}
        </label>
        {value ? (
          <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
            <img src={value} alt="Preview" className="w-[90%] h-full object-cover rounded-md" />
            <div className="absolute inset-x-0 bottom-0 bg-black/80 py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setProductForm(prev => ({ ...prev, [field]: "" }))}
                className="text-[9px] text-red-400 hover:text-red-300 font-mono font-bold uppercase tracking-widest cursor-pointer"
              >
                Clear Asset
              </button>
            </div>
          </div>
        ) : (
          <label className="w-full h-24 rounded-lg border border-dashed border-white/15 hover:border-[#C5A059] bg-black/30 hover:bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-all p-2 text-center select-none">
            <Upload className="w-4 h-4 text-white/30 mb-1" />
            <span className="font-sans text-[9px] text-white/50 font-bold uppercase tracking-wider block">Upload Image</span>
            <span className="font-mono text-[7px] text-white/30 block mt-0.5">Size &le; 5MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUploadChange(e, field)}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  // Security Gate: Ensure user email matches our target permission setup in the rules
  const userIsAdmin = user?.email === "techgadgetsk@gmail.com" || user?.email === "admin@techgadgetskenya.co.ke" || userProfile?.role === "admin";
  const canAccess = userIsAdmin || adminPasscodePassed;

  if (!canAccess) {
    return (
      <div id="admin-security-login-gate" className="bg-[#0F0F0F] border border-white/10 text-[#E0E0E0] p-8 rounded-3xl max-w-md mx-auto text-center font-sans animate-fadeIn my-12 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-[#C5A059]" />
        </div>
        <h2 className="font-serif italic text-xl font-semibold text-white tracking-wide">SECURE ADM TERMINAL</h2>
        <p className="text-[11px] text-[#C5A059] font-mono mt-1 mb-6 uppercase tracking-widest">Administrative Verification Gate</p>
        
        {adminAuthErr && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 text-center leading-relaxed font-mono">
            {adminAuthErr}
          </div>
        )}

        <form onSubmit={handleSecureTerminalSubmit} className="space-y-4 text-left">
          <div>
            <label className="font-mono text-[9px] font-bold text-white/40 block mb-1 uppercase tracking-wider">ADMIN EMAIL</label>
            <input 
              type="email"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/20"
              placeholder="e.g. techgadgetsk@gmail.com"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] font-bold text-white/40 block mb-1 uppercase tracking-wider">SECURE TERMINAL PASSPHRASE</label>
            <input 
              type="password"
              required
              value={adminSecurityPassword}
              onChange={(e) => setAdminSecurityPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/20"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black py-2.5 rounded-xl font-sans text-xs font-bold transition-all mt-6 shadow-lg shadow-[#C5A059]/15 cursor-pointer text-center block"
          >
            Authenticate Terminal Session
          </button>
        </form>

        <p className="text-[10px] text-white/35 font-mono mt-6 leading-relaxed border-t border-white/5 pt-4">
          Default administrative credentials:<br/>
          Email: <span className="text-[#C5A059]">techgadgetsk@gmail.com</span><br/>
          Passphrase: <span className="text-[#C5A059]">admin123</span>
        </p>
      </div>
    );
  }

  // 1. Calculations & Metrics
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === "Paid");
    const totalSalesValue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const pendingOrdersCount = orders.filter(o => o.paymentStatus === "Pending").length;

    const referralOrders = orders.filter(o => o.referralCode);
    const referralOrdersCount = referralOrders.length;
    const totalReferralsDiscountAmount = referralOrdersCount * 1000;

    const brandSalesValues: { [brand: string]: number } = {};
    orders.forEach((or) => {
      (or.items || []).forEach((item) => {
        const brand = item.brand || "Generics";
        brandSalesValues[brand] = (brandSalesValues[brand] || 0) + (item.price * item.quantity);
      });
    });

    // Helper functions for category matching
    const getBaseCategory = (cat: string): string => {
      const c = String(cat || "");
      if (c.includes("Laptop")) return "Laptops";
      if (c.includes("Phone")) return "Phones";
      if (c.includes("Desktop")) return "Desktops";
      if (c.includes("Printer")) return "Printers";
      if (c.includes("Accessories") || c.includes("Accessory")) return "Accessories";
      if (c.includes("All-in-One")) return "All-in-One PCs";
      return c || "Other";
    };

    const categorySalesValues: { [cat: string]: number } = {};
    let totalPaidValue = 0;
    
    // Aggregate by Category - First Pass: Paid orders
    orders.forEach((or) => {
      if (or.paymentStatus === "Paid") {
        (or.items || []).forEach((item) => {
          const prod = products.find(p => p.id === item.productId);
          const fullCat = prod ? prod.category : "Accessories";
          const baseCat = getBaseCategory(fullCat);
          categorySalesValues[baseCat] = (categorySalesValues[baseCat] || 0) + (item.price * item.quantity);
          totalPaidValue += (item.price * item.quantity);
        });
      }
    });

    // Fallback Pass: If no Paid orders yet, scan all orders to create initial graphs
    if (totalPaidValue === 0) {
      orders.forEach((or) => {
        (or.items || []).forEach((item) => {
          const prod = products.find(p => p.id === item.productId);
          const fullCat = prod ? prod.category : "Accessories";
          const baseCat = getBaseCategory(fullCat);
          categorySalesValues[baseCat] = (categorySalesValues[baseCat] || 0) + (item.price * item.quantity);
        });
      });
    }

    // Convert keys-value pairs to array format for Recharts
    const categorySalesData = Object.entries(categorySalesValues).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    // Initial visual seed fallback of categories if there is absolutely no active customer transaction yet
    if (categorySalesData.length === 0) {
      categorySalesData.push(
        { name: "Laptops", value: 385000 },
        { name: "Phones", value: 245000 },
        { name: "Desktops", value: 165000 },
        { name: "Printers", value: 105000 },
        { name: "Accessories", value: 55000 }
      );
    }

    return {
      totalSalesValue,
      ordersCount: orders.length,
      lowStockCount,
      pendingOrdersCount,
      activeProductsCount: products.length,
      referralOrders,
      referralOrdersCount,
      totalReferralsDiscountAmount,
      brandSalesValues,
      categorySalesData
    };
  }, [products, orders]);

  // Handle setting edit product state
  const handleEditTrigger = (prod: Product) => {
    setIsEditing(prod.id);
    const specsStr = Object.entries(prod.specifications || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const { base, condition } = getBaseAndCondition(prod.category);
    setAdminBaseCategory(base);
    setAdminCondition(condition as any);

    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price,
      stock: prod.stock,
      sku: prod.sku || "",
      description: prod.description,
      image: prod.image,
      gallery1: prod.gallery?.[0] || "",
      gallery2: prod.gallery?.[1] || "",
      gallery3: prod.gallery?.[2] || "",
      gallery4: prod.gallery?.[3] || "",
      specificationsStr: specsStr
    });
    setShowAddForm(true);
  };

  const handleCreateNewProductTrigger = () => {
    setIsEditing(null);
    setAdminBaseCategory("Laptops");
    setAdminCondition("New");
    setProductForm({
      name: "",
      brand: "",
      category: "New Laptops",
      price: 0,
      stock: 10,
      sku: "",
      description: "",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600", // generic nice layout placeholder
      gallery1: "",
      gallery2: "",
      gallery3: "",
      gallery4: "",
      specificationsStr: "Processor: Premium Specs\nDisplay: Full HD"
    });
    setShowAddForm(true);
  };

  // Convert specs textbox to key-value record
  const parseSpecifications = (rawStr: string): Record<string, string> => {
    const record: Record<string, string> = {};
    rawStr.split("\n").forEach((line) => {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim();
        if (key && val) {
          record[key] = val;
        }
      }
    });
    return record;
  };

  // Handle Product Save/Insert
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || !productForm.brand || !productForm.image || productForm.price <= 0) {
      alert("Please ensure product name, brand, retail pricing and image URL are declared.");
      return;
    }

    const galleryArr = [
      productForm.gallery1,
      productForm.gallery2,
      productForm.gallery3,
      productForm.gallery4
    ].filter(g => g.trim() !== "");

    const payload: Omit<Product, "id"> = {
      name: productForm.name,
      brand: productForm.brand,
      category: productForm.category,
      price: Number(productForm.price),
      stock: Math.floor(Number(productForm.stock)),
      sku: productForm.sku?.trim().toUpperCase() || "",
      description: productForm.description,
      image: productForm.image,
      gallery: galleryArr,
      specifications: parseSpecifications(productForm.specificationsStr)
    };

    try {
      if (isEditing) {
        await editProduct(isEditing, payload);
        setActionSuccessNotification(`✓ Commodity "${payload.name}" updated successfully!`);
      } else {
        await addProduct(payload);
        setActionSuccessNotification(`✓ Commodity "${payload.name}" added to live storefront catalog!`);
      }
      setTimeout(() => setActionSuccessNotification(""), 6000);
      setShowAddForm(false);
      setIsEditing(null);
    } catch (err) {
      console.error(err);
      alert("Permission block or database write failure.");
    }
  };

  // Handle Order Status modifications directly
  const handleOrderStatusToggle = async (orderId: string, currentOrder: Order, eventType: "payment" | "shipping", targetValue: string) => {
    try {
      const payStatus = eventType === "payment" ? (targetValue as Order["paymentStatus"]) : currentOrder.paymentStatus;
      const shipStatus = eventType === "shipping" ? (targetValue as Order["shippingStatus"]) : currentOrder.shippingStatus;
      const receiptNo = payStatus === "Paid" && !currentOrder.receiptNo ? "ADM" + Math.floor(Math.random() * 10000000) : currentOrder.receiptNo;
      
      await updateOrderStatus(orderId, payStatus, shipStatus, receiptNo);
    } catch (e) {
      console.error(e);
      alert("Authentication error updating order states.");
    }
  };

  return (
    <div id="admin-operations-container" className="animate-fadeIn relative">
      {/* Floating Success Toast notification */}
      {actionSuccessNotification && (
        <div className="fixed top-6 right-6 z-55 flex items-center gap-2.5 bg-[#C5A059] text-black px-5 py-4 rounded-xl shadow-2xl border border-[#C5A059]/40 font-sans font-bold text-xs">
          <CheckSquare className="w-4 h-4 text-black shrink-0" />
          <span>{actionSuccessNotification}</span>
        </div>
      )}

      {/* Admin Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#C5A059] bg-[#C5A059]/10 rounded-md border border-[#C5A059]/35 px-2 py-0.5 uppercase tracking-wide">
            Enterprise Operations Center
          </span>
          <h1 className="font-sans font-semibold text-2xl sm:text-3xl tracking-tight text-white mt-3">
            Operations Management Console
          </h1>
        </div>

        {/* Console view shortcuts */}
        <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/10 flex-wrap gap-1">
          {[
            { id: "overview", label: "Overview Metrics" },
            { id: "inventory", label: "Manage Inventory" },
            { id: "orders", label: "Fulfillment Queue" },
            { id: "newsletters", label: "Newsletter Analytics" },
            { id: "affiliates", label: "Affiliate Codes" },
            { id: "qrcode", label: "QR Code Tool" },
            { id: "trash", label: `Trash Bin (${trashItems.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); setShowAddForm(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 shadow-inner"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC SUMMARIES */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
          
          {/* Bento metric blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-white/40 font-mono block tracking-wider uppercase">FUNDS CLEARANCE</span>
                  <span className="font-sans font-black text-xl sm:text-2xl text-white block mt-2">
                    KES {metrics.totalSalesValue.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#C5A059]/10 text-[#C5A059] rounded-xl p-2.5 border border-[#C5A059]/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-white/30 text-[10px] mt-3 font-mono">Synced from Paid orders invoices</p>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-white/40 font-mono block tracking-wider uppercase">FULFILLMENT QUEUE</span>
                  <span className="font-sans font-black text-xl sm:text-2xl text-white block mt-2">
                    {metrics.ordersCount} Total
                  </span>
                </div>
                <div className="bg-[#C5A059]/10 text-[#C5A059] rounded-xl p-2.5 border border-[#C5A059]/20">
                  <ShoppingCart className="w-5 h-5 text-[#C5A059]" />
                </div>
              </div>
              <p className="text-[#C5A059] text-[10px] mt-3 font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{metrics.pendingOrdersCount} awaiting STK verification</span>
              </p>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-white/40 font-mono block tracking-wider uppercase">ACTIVE LISTINGS</span>
                  <span className="font-sans font-black text-xl sm:text-2xl text-white block mt-2">
                    {metrics.activeProductsCount} Items
                  </span>
                </div>
                <div className="bg-white/5 text-white/60 rounded-xl p-2.5 border border-white/10">
                  <Package className="w-5 h-5 text-white/60" />
                </div>
              </div>
              <p className="text-white/30 text-[10px] mt-3 font-mono">Live on storefront grids</p>
            </div>

            <div className="bg-red-500/5 border border-red-500/25 p-6 rounded-3xl shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-red-400 font-mono block tracking-wider uppercase">STOCK WARNINGS</span>
                  <span className="font-sans font-black text-xl sm:text-2xl text-red-400 block mt-2">
                    {metrics.lowStockCount} Flags
                  </span>
                </div>
                <div className="bg-[#050505] text-red-500 rounded-xl p-2.5 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <p className="text-red-400 text-[10px] mt-3 font-mono font-bold">Item counts &le; 5 units pool</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Block: Lipa Na M-Pesa Gateway status telemetry */}
            <div className="lg:col-span-1 bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs">
              <h3 className="font-sans font-semibold text-sm text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                <span>Daraja API Gateway Monitor</span>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  ONLINE
                </span>
              </h3>

              <div className="space-y-4 font-sans text-xs">
                {M_PESA_GATEWAYS.map((gw, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#0A0A0A] border border-white/5 p-3 rounded-xl">
                    <div>
                      <span className="font-bold text-white block text-[11px]">{gw.name}</span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5 block">Response Speed: {gw.ping}</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-emerald-500/25 uppercase">
                      {gw.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] leading-relaxed text-white/40 font-mono flex gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C5A059] shrink-0" />
                <div>
                  <strong>STK Auto-Callback Policy:</strong> Callback buffers sync and verify within 5000ms loop checks. Safe-locking prevents duplicate clears.
                </div>
              </div>
            </div>

            {/* Right Block: Recent Orders Log summary */}
            <div className="lg:col-span-2 bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs">
              <h3 className="font-sans font-semibold text-sm text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                <span>Pending Fulfillment Activity</span>
                <button 
                  onClick={() => setActiveSubTab("orders")}
                  className="text-xs text-[#C5A059] hover:text-[#C5A059]/80 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Examine queue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </h3>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-white/30 font-mono text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto text-white/20 mb-2" />
                  <span>Fulfillment queue is currently empty.</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5 h-72 overflow-y-auto pr-1">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                      <div>
                        <span className="font-mono text-white/40 block font-bold">ORDER #{ord.id.substring(0,8).toUpperCase()}</span>
                        <span className="font-sans font-bold text-white text-[13px] block mt-0.5">{ord.customerName}</span>
                        <span className="text-white/40 block text-[11px] font-medium truncate max-w-sm">Items: {(ord.items || []).map(i => `${i.quantity}x ${i.name}`).join(", ")}</span>
                      </div>
                      
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-sans font-black text-white block leading-none">KES {ord.totalAmount.toLocaleString()}</span>
                        <div className="flex gap-2 mt-2 justify-start sm:justify-end font-mono">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] uppercase font-bold border ${
                            ord.paymentStatus === "Paid" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
                          }`}>
                            {ord.paymentStatus}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase font-bold border bg-white/5 text-white/40 border-white/10">
                            {ord.shippingStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Brand Distribution and Affiliate Referrals Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 border-t border-white/5 pt-8 animate-fadeIn">
            
            {/* Widget: Sales Distribution by Category (Pie Chart) */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs text-left flex flex-col justify-between">
              <div>
                <h3 className="font-sans font-semibold text-sm text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                  <span>Sales by Category</span>
                  <span className="font-mono text-[9px] text-[#C5A059] font-bold uppercase tracking-wider">CATEGORY SHARE</span>
                </h3>

                <div className="w-full flex justify-center items-center h-[200px] relative">
                  {metrics.categorySalesData.length === 0 ? (
                    <p className="text-white/30 text-xs font-mono text-center">No category data discovered.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.categorySalesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={75}
                          innerRadius={45}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {metrics.categorySalesData.map((entry, index) => {
                            const COLORS = [
                              "#C5A059", // luxury gold
                              "#E2C07D", // champagne
                              "#10B981", // emerald tech accent
                              "#3498DB", // electric blue
                              "#9B59B6", // electric purple
                              "#F1C40F"  // yellow honey
                            ];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontFamily: "var(--font-sans)",
                            color: "#fff"
                          }}
                          formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, "Revenue"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Dynamic legends matching chart palette */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-[10px] font-mono">
                {metrics.categorySalesData.slice(0, 4).map((item, idx) => {
                  const COLORS = ["#C5A059", "#E2C07D", "#10B981", "#3498DB", "#9B59B6"];
                  const color = COLORS[idx % COLORS.length];
                  return (
                    <div key={item.name} className="flex items-center gap-1.5 min-w-[80px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-white/60 truncate" title={item.name}>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 2: Brand Revenue Performance */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs text-left">
              <h3 className="font-sans font-semibold text-sm text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                <span>Revenue Performance by Brand</span>
                <span className="font-mono text-[9px] text-[#C5A059] font-bold uppercase tracking-wider">SALES INTENT</span>
              </h3>

              <div className="space-y-4">
                {Object.keys(metrics.brandSalesValues).length === 0 ? (
                  <p className="text-white/30 text-xs font-mono py-8 text-center">No hardware transactions completed yet to chart brand performance.</p>
                ) : (
                  Object.entries(metrics.brandSalesValues)
                    .sort((a,b) => b[1] - a[1])
                    .map(([brand, amount]) => {
                      const maxVal = Math.max(...Object.values(metrics.brandSalesValues), 1);
                      const percentWidth = Math.min(100, Math.round((amount / maxVal) * 100));
                      return (
                        <div key={brand} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-white font-bold tracking-wide">{brand.toUpperCase()}</span>
                            <span className="text-[#C5A059] font-black">KES {amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-[#C5A059] to-[#E2C07D] rounded-full transition-all duration-500"
                              style={{ width: `${percentWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Widget 2: Affiliate Conversions and Cashback Registry */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-3xl shadow-xs text-left">
              <h3 className="font-sans font-semibold text-sm text-white pb-3 border-b border-white/10 mb-4 flex items-center justify-between">
                <span>Affiliate Referrals Registry</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-sm bg-[#C5A059]/15 border border-[#C5A059]/20 text-[#C5A059] text-[9px] font-mono font-bold uppercase">
                    {metrics.referralOrdersCount} REFS
                  </span>
                </div>
              </h3>

              {/* Mini counters */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] text-white/40 font-mono block">PARTNER DISCOUNTS GIVEN</span>
                  <span className="text-sm font-sans font-black text-white mt-1 block">KES {metrics.totalReferralsDiscountAmount.toLocaleString()}</span>
                </div>
                <div className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] text-white/40 font-mono block">COMMISSIONS REALLOCATED</span>
                  <span className="text-sm font-sans font-black text-[#C5A059] mt-1 block">KES {metrics.totalReferralsDiscountAmount.toLocaleString()}</span>
                </div>
              </div>

              {metrics.referralOrders.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-black/20 text-white/35 text-[11px] font-mono">
                  <span>No affiliate referral codes have been applied on checkout queues yet.</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1 space-y-2">
                  {metrics.referralOrders.map((ord) => (
                    <div key={ord.id} className="pt-2 pb-1.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono text-emerald-400 font-bold block">{ord.referralCode}</span>
                        <span className="font-sans font-semibold text-white/70 block text-[11px] mt-0.5">{ord.customerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white block">KES 1,000 off</span>
                        <span className="text-white/30 text-[9px] font-mono">{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Just now"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MANAGE INVENTORY SUBPANEL */}
      {activeSubTab === "inventory" && (
        <div className="space-y-6">
          
          {/* New product addition block */}
          {showAddForm ? (
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto">
              <h2 className="font-sans font-semibold text-base text-white pb-3 border-b border-white/10 mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#C5A059]" />
                {isEditing ? "Modify Hardware Profile" : "Register New Hardware Item"}
              </h2>

              <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">PRODUCT HEADLINE NAME</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white"
                      placeholder="e.g. Epson EcoTank L3250"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">MANUFACTURER BRAND</label>
                    <input
                      type="text"
                      required
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white"
                      placeholder="e.g. Epson"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">WAREHOUSE SKU CODE</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-mono"
                      placeholder="e.g. EPSON-L3250-WH"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">BASE CATEGORY</label>
                    <select
                      value={adminBaseCategory}
                      onChange={(e) => handleCategoryChoiceChange(e.target.value, adminCondition)}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white cursor-pointer h-[38px]"
                    >
                      {["Laptops", "Phones", "Desktops", "Printers", "Accessories", "All-in-One PCs"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">RETAIL PRICE (KES)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.price || ""}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white"
                      placeholder="Retail pricing Shillings"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">INITIAL STOCK</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white"
                      placeholder="Units"
                    />
                  </div>
                </div>

                {/* Conditional Condition Selector for Laptops, Phones, Desktops */}
                {(adminBaseCategory === "Laptops" || adminBaseCategory === "Phones" || adminBaseCategory === "Desktops") && (
                  <div className="bg-white/[0.02] border border-white/15 rounded-xl p-3.5 space-y-2 animate-fadeIn">
                    <span className="font-mono text-[9px] font-extrabold text-[#C5A059] block uppercase tracking-wider">
                      SELECT PHYSICAL CONDITION STATE (EXPLICIT USER REQUEST)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(["New", "Refurbished", "Generic"] as const).map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => handleCategoryChoiceChange(adminBaseCategory, cond)}
                          className={`text-xs font-sans px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            adminCondition === cond
                              ? "bg-[#C5A059] text-black shadow-md font-bold"
                              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${adminCondition === cond ? "bg-black" : "bg-white/40"}`} />
                          {cond === "Generic" ? `Standard / Generic ${adminBaseCategory}` : `${cond} Condition`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 bg-[#0A0A0A]/55 border border-white/5 p-4 rounded-2xl">
                  <span className="font-mono text-[9px] font-black text-[#C5A059] block uppercase tracking-widest mb-1">
                    Product Illustration Assets (Direct Image Uploads)
                  </span>

                  {uploadError && (
                    <div className="bg-red-950/40 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs text-center font-mono leading-relaxed">
                      ⚠ {uploadError}
                    </div>
                  )}

                  {/* Bulk Multi-Image upload widget */}
                  <div className="bg-white/[0.01]/70 border border-white/10 rounded-xl p-4 text-center relative transition-all group hover:bg-[#C5A059]/[0.02] hover:border-[#C5A059]/30">
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <UploadCloud className="w-8 h-8 text-[#C5A059] mb-2 group-hover:scale-105 transition-transform" />
                      <span className="font-sans text-xs font-bold text-white block">Bulk Photo Upload (Up to 5 images at once)</span>
                      <span className="font-sans text-[10px] text-white/40 block mt-1">
                        Select up to 5 images at the same time to automatically populate the primary and secondary slots.
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkImagesUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="sm:col-span-5">
                      {renderUploader("1. Primary Card Cover Image (Required)", "image", true)}
                    </div>
                    <div>
                      {renderUploader("2. Secondary View", "gallery1")}
                    </div>
                    <div>
                      {renderUploader("3. Alternate View", "gallery2")}
                    </div>
                    <div>
                      {renderUploader("4. Detail View", "gallery3")}
                    </div>
                    <div>
                      {renderUploader("5. Package View", "gallery4")}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-[10px] font-bold text-white/30 block uppercase">COMMODITY DESCRIPTION</label>
                    <button
                      type="button"
                      disabled={aiGeneratingDescription}
                      onClick={handleGenerateAIDescription}
                      className="text-[10px] font-bold text-[#C5A059] flex items-center gap-1 bg-[#C5A059]/10 border border-[#C5A059]/30 hover:bg-[#C5A059]/20 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      {aiGeneratingDescription ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                          <span>Gemini Translating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Generate Technical Description</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-sans text-xs leading-relaxed"
                    placeholder="Describe main components & selling metrics..."
                  />
                  {aiError && (
                    <p className="text-[9px] text-red-400 mt-1 font-mono">{aiError}</p>
                  )}
                </div>

                <div>
                  <label className="font-mono text-[10px] font-bold text-white/30 block mb-1 uppercase">TECHNICAL SPECIFICATIONS (Processor: dual-core CPU)</label>
                  <textarea
                    rows={4}
                    required
                    value={productForm.specificationsStr}
                    onChange={(e) => setProductForm({ ...productForm, specificationsStr: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-lg focus:outline-hidden focus:border-[#C5A059] text-white font-mono"
                    placeholder="Key: Value (One specification per line)"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setIsEditing(null); }}
                    className="bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black px-5 py-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {isEditing ? "Apply Changes" : "Create Item Entry"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <div>
                  <span className="font-mono text-xs text-white/40 font-bold uppercase tracking-wider block">Warehouse Archive Catalog Pool</span>
                  <p className="text-[11px] text-white/30 font-sans mt-0.5">Streamline stocks using real-time database inputs or offline CSV spreadsheet matrices.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Price Sort Filter Dropdown */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 transition-all hover:bg-white/10">
                    <span className="font-mono text-[9px] text-[#C5A059] block font-bold uppercase tracking-wider">Price Order:</span>
                    <select
                      value={productSortField === "price" ? productSortDirection : "default"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "asc") {
                          setProductSortField("price");
                          setProductSortDirection("asc");
                        } else if (val === "desc") {
                          setProductSortField("price");
                          setProductSortDirection("desc");
                        } else {
                          setProductSortField("name");
                          setProductSortDirection("asc");
                        }
                      }}
                      className="bg-transparent border-0 font-sans text-xs font-semibold text-white/80 cursor-pointer focus:outline-hidden"
                    >
                      <option className="bg-[#0F0F0F] text-white" value="default">Default Name Sorting</option>
                      <option className="bg-[#0F0F0F] text-white" value="asc">Low to High (KES ▲)</option>
                      <option className="bg-[#0F0F0F] text-white" value="desc">High to Low (KES ▼)</option>
                    </select>
                  </div>

                  {/* Export CSV Button */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Export all database hardware into highly formatted spreadsheet rows"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Export CSV</span>
                  </button>

                  {/* Import CSV File Selector */}
                  <label className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer relative" title="Upload a custom inventory CSV file">
                    <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Import CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  {/* Register Custom Product */}
                  <button
                    type="button"
                    onClick={handleCreateNewProductTrigger}
                    className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-black" />
                    <span>Register Custom Product</span>
                  </button>
                </div>
              </div>

              {/* CSV Upload alerts context */}
              {csvUploadState.successMsg && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs">
                  ✓ {csvUploadState.successMsg}
                </div>
              )}
              {csvUploadState.err && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs">
                  ⚠️ {csvUploadState.err}
                </div>
              )}

              {/* Bulk operations select floating banner */}
              {selectedProductIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl p-4 text-xs font-sans text-white animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <div>
                      <span className="font-bold text-[#C5A059]">{selectedProductIds.length} commodity items selected</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Prepare bulk soft-deletions or clears on selected stock ids.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      <span>Delete Selected ({selectedProductIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="bg-white/5 hover:bg-white/10 text-white/70 py-2 px-3 rounded-xl transition-all cursor-pointer font-bold text-[11px]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* Product Listing Table */}
              <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10 font-mono font-bold text-white/30">
                        <th className="p-4 w-12 text-center select-none">
                          <input
                            type="checkbox"
                            checked={sortedProducts.length > 0 && sortedProducts.every(p => selectedProductIds.includes(p.id))}
                            onChange={(e) => {
                              const allSel = sortedProducts.length > 0 && sortedProducts.every(p => selectedProductIds.includes(p.id));
                              if (allSel) {
                                setSelectedProductIds([]);
                              } else {
                                setSelectedProductIds(sortedProducts.map(p => p.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-black text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-0 cursor-pointer"
                          />
                        </th>
                        <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleProductSort("name")}>
                          <div className="flex items-center gap-1">
                            <span>Commodity Item</span>
                            {productSortField === "name" ? (
                              <span className="text-[#C5A059] font-sans text-[10px]">{productSortDirection === "asc" ? "▲" : "▼"}</span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                            )}
                          </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleProductSort("brand")}>
                          <div className="flex items-center gap-1">
                            <span>Brand</span>
                            {productSortField === "brand" ? (
                              <span className="text-[#C5A059] font-sans text-[10px]">{productSortDirection === "asc" ? "▲" : "▼"}</span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                            )}
                          </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleProductSort("category")}>
                          <div className="flex items-center gap-1">
                            <span>Category</span>
                            {productSortField === "category" ? (
                              <span className="text-[#C5A059] font-sans text-[10px]">{productSortDirection === "asc" ? "▲" : "▼"}</span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                            )}
                          </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleProductSort("price")}>
                          <div className="flex items-center gap-1">
                            <span>Price</span>
                            {productSortField === "price" ? (
                              <span className="text-[#C5A059] font-sans text-[10px]">{productSortDirection === "asc" ? "▲" : "▼"}</span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                            )}
                          </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleProductSort("stock")}>
                          <div className="flex items-center gap-1">
                            <span>Stock</span>
                            {productSortField === "stock" ? (
                              <span className="text-[#C5A059] font-sans text-[10px]">{productSortDirection === "asc" ? "▲" : "▼"}</span>
                            ) : (
                              <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                            )}
                          </div>
                        </th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans text-white/85">
                      {sortedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-white/30 font-mono text-[11px] uppercase tracking-wider bg-black/10">
                            No warehouse assets registered under the current filter selection
                          </td>
                        </tr>
                      ) : (
                        sortedProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => {
                                  setSelectedProductIds(prev =>
                                    prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-white/20 bg-black text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-0 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 flex gap-3 items-center">
                              <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0 bg-[#0A0A0A] border border-white/10" referrerPolicy="no-referrer" />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate max-w-xs text-white font-bold">{p.name}</span>
                                {p.sku ? (
                                  <span className="font-mono text-[9px] text-[#C5A059] font-semibold mt-0.5" title="Warehouse SKU Code">
                                    SKU: {p.sku}
                                  </span>
                                ) : (
                                  <span className="font-mono text-[9px] text-white/20 mt-0.5">
                                    SKU: —
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-white/70">{p.brand}</td>
                            <td className="p-4">
                              <span className="bg-white/5 border border-white/10 text-white/70 px-1.5 py-0.5 rounded-sm font-semibold uppercase text-[9px] font-mono">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-white">KES {p.price.toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`font-mono font-bold ${p.stock <= 5 ? "text-red-400" : "text-white/50"}`}>
                                {p.stock} units
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1 shrink-0">
                              <button
                                onClick={() => handleEditTrigger(p)}
                                className="p-1 px-2 border border-white/5 hover:border-[#C5A059] text-[#C5A059] rounded-lg transition-colors inline-flex items-center gap-1.5 hover:bg-[#C5A059]/10 cursor-pointer"
                                title="Edit product parameters"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Edit</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Confirm deletion of product profile for ${p.name}?`)) {
                                    try {
                                      setActionSuccessNotification(`Removing "${p.name}"...`);
                                      await removeProduct(p.id);
                                      setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                      setActionSuccessNotification(`Product "${p.name}" removed and moved to Trash.`);
                                      setTimeout(() => setActionSuccessNotification(""), 4000);
                                    } catch (e: any) {
                                      console.error(e);
                                      setActionSuccessNotification(`Error: Could not remove product.`);
                                      setTimeout(() => setActionSuccessNotification(""), 4000);
                                    }
                                  }
                                }}
                                className="p-1 px-2 border border-white/5 hover:border-red-500 text-red-400 rounded-lg transition-colors inline-flex items-center gap-1.5 hover:bg-red-500/10 cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* FULFILLMENT QUEUE QUEUE STATE */}
      {activeSubTab === "orders" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono text-white/40 font-bold">
            <span>DISPATCH QUEUE PROCESSING FLOW</span>
            <span>REAL-TIME SNAPSHOT CONNECTED</span>
          </div>

          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl overflow-hidden shadow-xs">
            {orders.length === 0 ? (
              <div className="py-20 text-center font-mono text-xs text-white/30">
                <FolderMinus className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <span>No active client purchases in fulfillment collections.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 font-mono font-bold text-white/30">
                      <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleOrderSort("createdAt")}>
                        <div className="flex items-center gap-1">
                          <span>Order Record/Code</span>
                          {orderSortField === "createdAt" ? (
                            <span className="text-[#C5A059] font-sans text-[10px]">{orderSortDirection === "asc" ? "▲" : "▼"}</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                          )}
                        </div>
                      </th>
                      <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleOrderSort("customerName")}>
                        <div className="flex items-center gap-1">
                          <span>Client Contact</span>
                          {orderSortField === "customerName" ? (
                            <span className="text-[#C5A059] font-sans text-[10px]">{orderSortDirection === "asc" ? "▲" : "▼"}</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                          )}
                        </div>
                      </th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleOrderSort("totalAmount")}>
                        <div className="flex items-center gap-1">
                          <span>Billed amount</span>
                          {orderSortField === "totalAmount" ? (
                            <span className="text-[#C5A059] font-sans text-[10px]">{orderSortDirection === "asc" ? "▲" : "▼"}</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                          )}
                        </div>
                      </th>
                      <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleOrderSort("paymentStatus")}>
                        <div className="flex items-center gap-1">
                          <span>M-Pesa validation</span>
                          {orderSortField === "paymentStatus" ? (
                            <span className="text-[#C5A059] font-sans text-[10px]">{orderSortDirection === "asc" ? "▲" : "▼"}</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                          )}
                        </div>
                      </th>
                      <th className="p-4 cursor-pointer hover:text-[#C5A059] transition-colors selection:bg-transparent" onClick={() => handleOrderSort("status")}>
                        <div className="flex items-center gap-1">
                          <span>Fulfillment Status</span>
                          {orderSortField === "status" ? (
                            <span className="text-[#C5A059] font-sans text-[10px]">{orderSortDirection === "asc" ? "▲" : "▼"}</span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 text-[10px]">▲</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans text-white/80">
                    {sortedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-white/30 font-mono text-[11px] uppercase tracking-wider bg-black/10">
                          No customer orders recorded in the terminal database matching active conditions
                        </td>
                      </tr>
                    ) : (
                      sortedOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold">
                            <span className="block text-white">#{ord.id.substring(0,8).toUpperCase()}</span>
                            <span className="text-[10px] text-white/35 block mt-1">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Pending"}
                            </span>
                          </td>
                          <td className="p-4 space-y-1">
                            <span className="font-bold text-white block text-[13px]">{ord.customerName}</span>
                            <span className="text-white/40 text-[10px] block font-mono">{ord.customerEmail}</span>
                            <span className="text-white/40 text-[10px] block font-mono">{ord.customerPhone}</span>
                          </td>
                          <td className="p-4 truncate max-w-xs font-medium text-white/80">
                            {(ord.items || []).map((i, idx) => (
                              <div key={idx}>
                                {i.quantity}x <span className="font-bold text-white">{i.name}</span>
                              </div>
                            ))}
                          </td>
                          <td className="p-4 font-mono font-bold text-[#C5A059]">KES {ord.totalAmount.toLocaleString()}</td>
                          <td className="p-4 space-y-1.5">
                            <select
                              value={ord.paymentStatus}
                              onChange={(e) => handleOrderStatusToggle(ord.id, ord, "payment", e.target.value)}
                              className={`font-sans text-[10px] uppercase font-mono font-bold border rounded-lg px-2 py-1 cursor-pointer outline-hidden bg-[#0A0A0A] ${
                                ord.paymentStatus === "Paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : ord.paymentStatus === "Failed"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Failed">Failed</option>
                            </select>
                            
                            <div className="text-[10px] font-mono text-white/35 block font-bold leading-normal">
                              STK Phone: {ord.mpesaPhone}
                            </div>
                            {ord.receiptNo && (
                              <div className="text-[10px] font-mono text-emerald-400 font-bold block leading-normal">
                                PayCode: {ord.receiptNo}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <select
                              value={ord.shippingStatus}
                              onChange={(e) => handleOrderStatusToggle(ord.id, ord, "shipping", e.target.value)}
                              className="font-sans text-[10px] uppercase font-mono font-bold border border-white/10 bg-[#0A0A0A] rounded-lg px-2 py-1 text-white cursor-pointer outline-hidden"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                            <span className="text-[10px] text-white/40 block font-mono font-bold mt-1.5 leading-none">
                              LOC: {ord.shippingAddress.split(", ").slice(-2)[0] || "Default Dispatch"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. NEWSLETTER ANALYTICS VIEW */}
      {activeSubTab === "newsletters" && (
        <div className="space-y-6">
          {campaignSuccessToast && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span>{campaignSuccessToast}</span>
            </div>
          )}

          {/* Grid Cards of Newsletter Analytics Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/40 text-[11px] font-mono font-bold tracking-wider uppercase">Verified Subscribers</p>
                  <h3 className="text-3xl font-sans font-bold text-white mt-2">{subscribers.length}</h3>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 text-[#C5A059]">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono">
                <span className="text-[#C5A059]">+12.4%</span>
                <span className="text-white/30 font-sans">growth this week</span>
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/40 text-[11px] font-mono font-bold tracking-wider uppercase">Deliverability</p>
                  <h3 className="text-3xl font-sans font-bold text-white mt-2">99.8%</h3>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 text-[#C5A059]">
                  <Check className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono">
                <span>OPTIMAL</span>
                <span className="text-white/30 font-sans">0 email bounces</span>
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/40 text-[11px] font-mono font-bold tracking-wider uppercase">Campaign Open Rate</p>
                  <h3 className="text-3xl font-sans font-bold text-white mt-2">38.6%</h3>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 text-[#C5A059]">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#C5A059] font-bold font-mono">
                <span>HIGH CONVERSION</span>
                <span className="text-white/30 font-sans">above 21% average</span>
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/40 text-[11px] font-mono font-bold tracking-wider uppercase">Click-Through (CTR)</p>
                  <h3 className="text-3xl font-sans font-bold text-white mt-2">18.2%</h3>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 text-[#C5A059]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono">
                <span>PROACTIVE</span>
                <span className="text-white/30 font-sans">driven by specs detail</span>
              </div>
            </div>
          </div>

          {/* Quick Operations panel */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg font-sans">Database of Registered Subscribers</h3>
                <p className="text-white/40 text-xs mt-1">
                  Manage users synced from live Lipa Na M-Pesa newsletter subscriptions or fallback storages.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCampaignModalOpen(true)}
                  className="bg-[#C5A059] hover:bg-[#C5A059]/95 text-black text-xs font-bold font-sans px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  Dispatch Campaign Alert
                </button>
                <button
                  onClick={handleExportNewslettersCSV}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold font-sans px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  Export CSV database
                </button>
              </div>
            </div>

            {/* Campaign Dispatcher Interactive Modal Overlay */}
            {campaignModalOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
                <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-scaleUp">
                  <span className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer" onClick={() => setCampaignModalOpen(false)}>
                    <X className="w-5 h-5" />
                  </span>
                  
                  <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                    <Mail className="w-5 h-5 text-[#C5A059]" />
                    <h2 className="text-white font-sans font-semibold text-lg">Broadcast Marketing Campaign</h2>
                  </div>

                  <form onSubmit={handleDispatchCampaign} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 font-bold uppercase mb-1.5">Campaign Email Subject Line</label>
                      <input
                        type="text"
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        placeholder="e.g. Price Drop: Refurbished Laptops Starting KES 55,000 in Nairobi!"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-sans"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 font-bold uppercase mb-1.5">Broadcast Newsletter Message Content</label>
                      <textarea
                        rows={6}
                        value={campaignBody}
                        onChange={(e) => setCampaignBody(e.target.value)}
                        placeholder="Provide details about new stock availability, desktops setups, and Lipa-na-Mpesa till discounts..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-sans"
                        required
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setCampaignModalOpen(false)}
                        className="bg-white/5 text-white/70 px-4 py-2.5 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={dispatchingCampaign}
                        className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-55"
                      >
                        {dispatchingCampaign ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending broadcast...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Broadcast to {subscribers.length} Emails</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Subscriber search filter */}
            <div className="mb-5 flex rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] max-w-sm">
              <span className="p-3 text-white/30"><Mail className="w-4 h-4" /></span>
              <input
                type="text"
                value={newsletterSearch}
                onChange={(e) => setNewsletterSearch(e.target.value)}
                placeholder="Search database by subscriber email..."
                className="w-full bg-transparent text-xs text-white focus:outline-hidden py-2"
              />
            </div>

            {/* Subscriptions Data Table */}
            {subscriberLoading ? (
              <div className="py-12 text-center text-white/40 flex items-center justify-center gap-1.5">
                <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Syncing registered lists...</span>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="py-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs font-semibold">No active newsletter subscriptions found</p>
                <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto">
                  New newsletter signups synced from footer fields of customers will present here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono font-bold tracking-wider text-white/50 uppercase">
                      <th className="p-4">Subscriber Email</th>
                      <th className="p-4">Subscription Timestamp</th>
                      <th className="p-4 text-center">Audience Channel</th>
                      <th className="p-4 text-right">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/70">
                    {subscribers
                      .filter(x => x.email.toLowerCase().includes(newsletterSearch.toLowerCase()))
                      .map((sub, index) => (
                        <tr key={index} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-4 font-semibold text-white/95">{sub.email}</td>
                          <td className="p-4 text-white/40 font-mono">
                            {new Date(sub.subscribedAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/15 rounded-md px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">
                              E-COMMERCE SIGNUP
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/5 rounded-full px-2.5 py-0.5 border border-emerald-500/10">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TRASH BIN VIEW */}
      {activeSubTab === "trash" && (
        <div className="space-y-6">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg font-sans flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#C5A059]" />
                  <span>Soft-Deleted Commodity Trash Bin</span>
                </h3>
                <p className="text-white/40 text-xs mt-1">
                  Deleted products are held here for a 60-day automatic safety window before irreversible purge.
                </p>
              </div>

              {trashItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="bg-red-500/10 hover:bg-red-600 border border-red-500/30 hover:border-red-600 text-red-400 hover:text-white text-xs font-bold font-sans px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Empty Trash Bin ({trashItems.length})
                </button>
              )}
            </div>

            {trashLoading ? (
              <div className="py-12 text-center text-white/40 flex items-center justify-center gap-1.5">
                <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Syncing deleted records...</span>
              </div>
            ) : trashItems.length === 0 ? (
              <div className="py-16 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                <Trash2 className="w-8 h-8 text-[#C5A059]/40 mx-auto mb-3" />
                <p className="text-xs font-semibold">Your Trash Bin is clean</p>
                <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto">
                  When you delete commodities from your Manage Inventory list, they will show up here for recovery.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono font-bold tracking-wider text-white/50 uppercase">
                      <th className="p-4">Deleted Commodity</th>
                      <th className="p-4">Original Category</th>
                      <th className="p-4">Retail Price</th>
                      <th className="p-4">Deletion Date</th>
                      <th className="p-4 text-center">Retention Period</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/70">
                    {trashItems.map((item) => {
                      const daysLeft = Math.max(0, 60 - Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24)));
                      const pData = item.productData || {};
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-4 flex gap-3 items-center">
                            {pData.image && (
                              <img
                                src={pData.image}
                                alt=""
                                className="w-8 h-8 object-cover rounded-md shrink-0 bg-[#0A0A0A] border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div>
                              <span className="font-bold text-white block">{pData.name || "Unnamed"}</span>
                              <span className="text-[9px] font-mono text-white/30 block mt-0.5">ID: {item.originalId}</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-white/60">{pData.category || "General"}</td>
                          <td className="p-4 font-mono font-bold text-[#C5A059]">KES {(Number(pData.price) || 0).toLocaleString()}</td>
                          <td className="p-4 font-mono text-white/40">
                            {new Date(item.deletedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block font-mono text-[10px] font-bold rounded-lg px-2.5 py-1 ${
                              daysLeft <= 10 ? "bg-red-500/10 text-red-400 border border-red-500/15" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                            }`}>
                              {daysLeft} days remaining
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(item.id, item.originalId, pData)}
                                className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-semibold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all"
                              >
                                Restore Item
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentlyDeleteTrash(item.id, pData.name || "this item")}
                                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all border border-red-500/15 font-semibold"
                                title="Permanently delete from database"
                              >
                                Purge
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. AFFILIATE MANAGER SECTION */}
      {activeSubTab === "affiliates" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header block */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg font-sans flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C5A059]" />
                  <span>Affiliate Marketing Program</span>
                </h3>
                <p className="text-white/40 text-xs mt-1">
                  Create referral tracking codes for brand partners and assign individual sales commissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAffiliateForm(!showAffiliateForm)}
                className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                {showAffiliateForm ? "Hide Form" : "Create Partner Code"}
              </button>
            </div>

            {/* Form Section */}
            {showAffiliateForm && (
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 mb-8 space-y-4">
                <h4 className="text-white font-semibold text-sm">Register Brand Affiliate Partner</h4>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!affiliateName || !affiliateEmail || !affiliateCode) {
                      alert("Please specify a client name, contact email, and customized affiliate coupon code.");
                      return;
                    }
                    try {
                      await addAffiliate({
                        name: affiliateName,
                        email: affiliateEmail,
                        code: affiliateCode.trim().toUpperCase(),
                        discountType: affiliateDiscountType,
                        discountValue: Number(affiliateDiscountValue),
                        active: true
                      });
                      setActionSuccessNotification(`Affiliate "${affiliateCode.toUpperCase()}" registered successfully!`);
                      setTimeout(() => setActionSuccessNotification(""), 4000);
                      setAffiliateName("");
                      setAffiliateEmail("");
                      setAffiliateCode("");
                      setShowAffiliateForm(false);
                    } catch (err: any) {
                      alert("Error storing affiliate record: " + err.message);
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-mono">Partner Name</label>
                    <input
                      type="text"
                      required
                      value={affiliateName}
                      onChange={(e) => setAffiliateName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-mono">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={affiliateEmail}
                      onChange={(e) => setAffiliateEmail(e.target.value)}
                      placeholder="e.g. partner@example.com"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-mono">Custom Unique Code (Min 4 chars)</label>
                    <input
                      type="text"
                      required
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="e.g. VIPTECH"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-mono uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-mono">Discount Style</label>
                      <select
                        value={affiliateDiscountType}
                        onChange={(e) => setAffiliateDiscountType(e.target.value as any)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] h-[38px]"
                      >
                        <option value="fixed">Fixed Deduction (KES)</option>
                        <option value="percentage">Percentage Off (%)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-mono">Deduction Value</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={affiliateDiscountValue}
                        onChange={(e) => setAffiliateDiscountValue(Number(e.target.value))}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-mono h-[38px]"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAffiliateForm(false)}
                      className="bg-white/5 hover:bg-white/10 text-white text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#C5A059] text-black font-bold text-xs px-5 py-2 rounded-xl hover:bg-[#C5A059]/90 cursor-pointer"
                    >
                      Save Partner Configuration
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List Section */}
            {affiliates.length === 0 ? (
              <div className="py-16 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                <Users className="w-8 h-8 text-[#C5A059]/40 mx-auto mb-3" />
                <p className="text-xs font-semibold">No Affiliate partners configured</p>
                <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto">
                  Get started by registering a partner code above. Users who enter this code at checkout will receive the configured reward!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono font-bold tracking-wider text-white/50 uppercase">
                      <th className="p-4">Partner details</th>
                      <th className="p-4">Tracking Code</th>
                      <th className="p-4">Deduction Tier</th>
                      <th className="p-4 text-center">Conversions</th>
                      <th className="p-4 text-right">Revenue Yield</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-white/70">
                    {affiliates.map((aff) => {
                      const matchedOrders = orders.filter(o => typeof o.referralCode === "string" && o.referralCode.trim().toUpperCase() === aff.code.toUpperCase());
                      const conversionCount = matchedOrders.length;
                      const salesYield = matchedOrders.reduce((acc, current) => acc + (current.totalAmount || 0), 0);

                      return (
                        <tr key={aff.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-4">
                            <span className="font-bold text-white block">{aff.name}</span>
                            <span className="text-[10px] text-white/40 block mt-0.5">{aff.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 uppercase">
                              {aff.code}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-white/60">
                            {aff.discountType === "percentage" ? `${aff.discountValue}% Off` : `KES ${Number(aff.discountValue).toLocaleString()} Flat`}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-white/80">
                            {conversionCount} sales
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-[#C5A059]">
                            KES {salesYield.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleAffiliate(aff.id, !aff.active)}
                              className={`px-2 py-1 rounded-md text-[9px] font-mono tracking-wider font-bold capitalize transition-all cursor-pointer ${
                                aff.active
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : "bg-white/[0.02] text-white/30 border border-white/5"
                              }`}
                            >
                              {aff.active ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Decommission and delete affiliate partner code for ${aff.name}?`)) {
                                  await deleteAffiliate(aff.id);
                                  setActionSuccessNotification("Partner record purged from system registry.");
                                  setTimeout(() => setActionSuccessNotification(""), 3000);
                                }
                              }}
                              className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all border border-red-500/10"
                            >
                              purge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. SECURE QR CODE GENERATOR SECTION */}
      {activeSubTab === "qrcode" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-white font-semibold text-lg font-sans flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C5A059]" />
                <span>Multi-Resolution QR Code Engine</span>
              </h3>
              <p className="text-white/40 text-xs mt-1">
                Generate high-conversion scan links for marketing flyers, physical shipments, packaging labels, and customer newsletters.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Parameter Panel */}
              <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 font-mono block">QR Code Content (URL or Text message)</label>
                  <textarea
                    rows={3}
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="Provide web-link, order reference, or promotional tracking payload..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-hidden focus:border-[#C5A059] font-sans h-[90px] resize-none"
                  />
                </div>

                {/* Preconfigured product link helper shortcuts */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#C5A059] font-bold block uppercase tracking-wider">Quick Link Templates:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setQrText(`${window.location.protocol}//${window.location.host}`)}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-white/70 px-2.5 py-1.5 rounded-lg transition-all font-mono"
                    >
                      /Store Home Page
                    </button>
                    {products.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setQrText(`${window.location.protocol}//${window.location.host}/#product-details?id=${p.id}`)}
                        className="bg-white/[0.02] hover:bg-white/5 border border-white/5 text-[10px] text-white/40 hover:text-[#C5A059] px-2.5 py-1.5 rounded-lg transition-colors font-sans"
                        title={p.name}
                      >
                        {p.name.substring(0, 15)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-mono block">Dimension Size ({qrSize}x{qrSize} px)</label>
                    <input
                      type="range"
                      min="150"
                      max="500"
                      step="50"
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full cursor-pointer accent-[#C5A059]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-white/30">
                      <span>150px</span>
                      <span>300px</span>
                      <span>500px</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-mono block">Color scheme</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setQrFgColor("000000"); setQrBgColor("ffffff"); }}
                        className="bg-white text-black text-[10px] font-bold py-1 px-2.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                      >
                        Classic Mono
                      </button>
                      <button
                        type="button"
                        onClick={() => { setQrFgColor("c5a059"); setQrBgColor("000000"); }}
                        className="bg-black text-[#C5A059] text-[10px] font-bold py-1 px-2.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                      >
                        Kenya Gold
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Output Panel */}
              <div className="lg:col-span-1 border-r border-white/5 hidden lg:block" />

              <div className="lg:col-span-12 xl:col-span-4 flex flex-col items-center justify-center p-6 bg-white/[0.01] border border-white/5 rounded-3xl text-center space-y-4">
                <span className="font-mono text-[9px] font-bold text-white/30 uppercase tracking-widest block">Live Rendered Asset</span>

                <div className="p-4 bg-white rounded-2xl shadow-inner border border-white/10 shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrFgColor}&bgcolor=${qrBgColor}`}
                    alt="Scan to follow referral tracking checkout URL"
                    style={{ width: qrSize, height: qrSize }}
                    className="object-contain"
                  />
                </div>

                <div className="w-full space-y-2 max-w-[250px]">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrFgColor}&bgcolor=${qrBgColor}`}
                    download="techgadgetskenya_qr.png"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-xs font-bold font-sans py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Save & Download QR Code
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrFgColor}&bgcolor=${qrBgColor}`);
                      setCopiedQr(true);
                      setTimeout(() => setCopiedQr(false), 2000);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedQr ? "Copied direct link!" : "Copy vector asset link"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
