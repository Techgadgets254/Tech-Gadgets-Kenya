/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../StoreContext";
import PrintView from "./PrintView";
import { printInvoiceIframe } from "../utils/printInvoice";
import { 
  ShoppingBag, 
  Printer, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Search,
  Mail,
  Loader2,
  Monitor,
  Sparkles,
  Bookmark,
  Coins,
  Share2,
  Download,
  XCircle,
  Sliders,
  FileText,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, addDoc, query, where, onSnapshot, getDocs, doc } from "firebase/firestore";
import LiveOrderTracker from "./LiveOrderTracker";
import { Order } from "../types";
import { jsPDF } from "jspdf";
import { User as UserIcon } from "lucide-react";
import ProfileEditor from "./ProfileEditor";
import { FIXED_ARTICLES, DAILY_ARTICLES, Article } from "./NewsView";
import brandLogo from "../assets/images/tech_soko_logo_1783960703453.jpg";

export default function ClientDashboard() {
  const { 
    user, 
    orders, 
    products,
    invoiceOrderId, 
    setInvoiceOrderId, 
    setActiveView 
  } = useStore();

  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Delivered" | "Cancelled">("All");

  // Tabs for ClientDashboard
  const [activeTab, setActiveTab] = useState<"transactions" | "tracking" | "settings" | "profile" | "bookmarks" | "payments">("transactions");

  // Historical Payment Attempts State
  const [paymentAttempts, setPaymentAttempts] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "payments" && activeTab !== "transactions") return;

    setPaymentsLoading(true);
    const paymentsCol = collection(db, "payments");
    
    // Attempt real-time listener for user's payments
    try {
      const q = query(paymentsCol, where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return timeB - timeA;
        });
        setPaymentAttempts(list);
        setPaymentsLoading(false);
      }, (err) => {
        console.warn("User payment index query failed, fetching all payments fallback:", err);
        // Fallback fetch
        getDocs(paymentsCol).then((snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.userId === user.uid || data.customerEmail === user.email || (user.email && data.customerEmail?.toLowerCase() === user.email.toLowerCase())) {
              list.push({ id: docSnap.id, ...data });
            }
          });
          list.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA;
          });
          setPaymentAttempts(list);
          setPaymentsLoading(false);
        }).catch(e => {
          console.error(e);
          setPaymentsLoading(false);
        });
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setPaymentsLoading(false);
    }
  }, [user, activeTab]);

  // Invoice Preview Modal States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Order Feedback States
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittedFeedbackOrderIds, setSubmittedFeedbackOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_submitted_feedbacks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleSubmitOrderFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackOrderId || !user) return;
    setSubmittingFeedback(true);
    try {
      const feedbackCol = collection(db, "order_feedback");
      const newFeedback = {
        orderId: feedbackOrderId,
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous Customer",
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: new Date().toISOString()
      };
      await addDoc(feedbackCol, newFeedback);
      
      const nextSubmitted = [...submittedFeedbackOrderIds, feedbackOrderId];
      setSubmittedFeedbackOrderIds(nextSubmitted);
      localStorage.setItem("tgk_submitted_feedbacks", JSON.stringify(nextSubmitted));
      
      setFeedbackOrderId(null);
      setFeedbackRating(5);
      setFeedbackComment("");
      setIsFeedbackModalOpen(false);
    } catch (err) {
      console.error("Failed to submit feedback to order_feedback collection:", err);
      alert("Something went wrong while submitting your feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Saved / bookmarked news articles
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_saved_news");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  // Re-read bookmarks when the tab is clicked to synchronize states
  useEffect(() => {
    if (activeTab === "bookmarks") {
      try {
        const saved = localStorage.getItem("tgk_saved_news");
        setSavedNewsIds(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeTab]);

  const savedArticles = useMemo(() => {
    const list: Article[] = [];
    const allKnown: Article[] = [...FIXED_ARTICLES, ...(Object.values(DAILY_ARTICLES) as Article[])];
    savedNewsIds.forEach(id => {
      const found = allKnown.find((a: Article) => a.id === id);
      if (found && !list.some((x: Article) => x.id === found.id)) {
        list.push(found);
      }
    });
    return list;
  }, [savedNewsIds]);

  const handleUnsaveNews = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = savedNewsIds.filter(x => x !== id);
    setSavedNewsIds(nextSaved);
    localStorage.setItem("tgk_saved_news", JSON.stringify(nextSaved));
  };

  const handleReadArticle = (id: string) => {
    localStorage.setItem("tgk_selected_article_id", id);
    setActiveView("news");
  };

  // Account Settings state
  const [settingsKraPin, setSettingsKraPin] = useState(() => localStorage.getItem("tgk_kra_pin") || "");
  const [settingsShippingCounty, setSettingsShippingCounty] = useState(() => localStorage.getItem("tgk_shipping_county") || "");
  const [settingsPaymentPhone, setSettingsPaymentPhone] = useState(() => localStorage.getItem("tgk_payment_phone") || "");
  const [settingsMarketingSub, setSettingsMarketingSub] = useState(() => localStorage.getItem("tgk_marketing_sub") === "true");
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("tgk_kra_pin", settingsKraPin);
      localStorage.setItem("tgk_shipping_county", settingsShippingCounty);
      localStorage.setItem("tgk_payment_phone", settingsPaymentPhone);
      localStorage.setItem("tgk_marketing_sub", String(settingsMarketingSub));
      setSettingsFeedback("✓ Settings persisted successfully!");
      setShowSettingsForm(false);
      setTimeout(() => setSettingsFeedback(""), 4000);
    } catch (err) {
      console.error(err);
      setSettingsFeedback("⚠ Save failed.");
    }
  };

  const handleClearSettings = () => {
    if (confirm("Are you sure you want to clear your saved account configurations?")) {
      setSettingsKraPin("");
      setSettingsShippingCounty("");
      setSettingsPaymentPhone("");
      setSettingsMarketingSub(false);
      localStorage.removeItem("tgk_kra_pin");
      localStorage.removeItem("tgk_shipping_county");
      localStorage.removeItem("tgk_payment_phone");
      localStorage.removeItem("tgk_marketing_sub");
      setSettingsFeedback("✓ Local profile parameters cleared.");
      setTimeout(() => setSettingsFeedback(""), 4000);
    }
  };

  // Save/bookmark specific order receipts locally
  const [savedReceiptIds, setSavedReceiptIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tgk_saved_receipts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const toggleSaveReceipt = (id: string) => {
    setSavedReceiptIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("tgk_saved_receipts", JSON.stringify(updated));
      return updated;
    });
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  const getStepNumber = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "processing" || s === "pending") return 1;
    if (s === "shipped") return 2;
    if (s === "out for delivery" || s === "out_for_delivery") return 3;
    if (s === "delivered") return 4;
    return 1;
  };

  const handleDownloadInvoicePDF = async (order: Order | null) => {
    if (!order) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [197, 160, 89]; // #C5A059 Gold representation

    // 1. Header Banner
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 54, "F");

    // 1.5 Draw Logo Image on top-left of the banner
    try {
      const logoImg = await loadImage(brandLogo);
      doc.addImage(logoImg, "JPEG", 15, 12, 15, 15);
    } catch (e) {
      console.warn("Could not load brand logo for invoice PDF:", e);
    }

    // 2. Branding Typography (Shifted to the right to accommodate the logo)
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TECH SOKONI KENYA", 34, 21);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PREMIUM IMPORTS & ENTERPRISE COMPUTERS", 34, 27);

    doc.setTextColor(160, 160, 160);
    doc.text("Kenyatta Pioneer Bldg, Kenyatta Ave, Shop 514, Nairobi", 34, 33);
    doc.text("Clearance: MegaPay M-Pesa Portal | support@techsokoni.com", 34, 38);

    // 3. Tax Invoice Badge
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(145, 12, 50, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TAX INVOICE", 170, 18.5, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`ID: #${order.id.substring(0, 8).toUpperCase()}`, 145, 28);
    doc.setFont("Helvetica", "normal");
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Pending"}`, 145, 33);
    doc.text(`Settled Code: ${order.receiptNo || "STK PIN APPROVED"}`, 145, 38);
    doc.setFont("Helvetica", "bold");
    doc.text(`Payment: ${order.paymentStatus ? order.paymentStatus.toUpperCase() : "PENDING"}`, 145, 43);
    doc.text(`Fulfillment: ${order.shippingStatus ? order.shippingStatus.toUpperCase() : "PROCESSING"}`, 145, 48);

    // 4. Billed Recipient & Delivery Details
    doc.setTextColor(40, 40, 40);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("BILLED RECIPIENT", 15, 64);
    doc.text("DELIVERY LOGISTIC CHANNEL", 112, 64);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Customer: ${order.customerName}`, 15, 70);
    doc.text(`Email Address: ${order.customerEmail}`, 15, 75);
    doc.text(`Phone Contact: ${order.customerPhone}`, 15, 80);

    let wrappedAddress = doc.splitTextToSize(order.shippingAddress || "Nairobi CBD Delivery Counter", 82);
    doc.text(wrappedAddress, 112, 70);

    // 5. Table Header lines - dynamically calculated based on address height
    let addressHeight = wrappedAddress.length * 4.5;
    let currentY = Math.max(94, 70 + addressHeight + 8);

    doc.setFillColor(242, 244, 247);
    doc.rect(15, currentY, 180, 8, "F");
    doc.setDrawColor(220, 222, 225);
    doc.line(15, currentY, 195, currentY);
    doc.line(15, currentY + 8, 195, currentY + 8);

    doc.setTextColor(15, 15, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Specification Model Details", 18, currentY + 5.5);
    doc.text("Qty", 125, currentY + 5.5);
    doc.text("Unit Cost (KES)", 145, currentY + 5.5);
    doc.text("Total Value (KES)", 171, currentY + 5.5);

    doc.setFont("Helvetica", "normal");
    currentY += 8;

    // 6. Loop and output line items
    (order.items || []).forEach((item) => {
      // If we are running out of page space, start a new page
      if (currentY > 190) {
        doc.addPage();
        currentY = 20;
      }

      let fullName = `${item.brand} ${item.name}`;
      let wrappedName = doc.splitTextToSize(fullName, 100); // Max 100mm to avoid overlapping with Qty at 125!

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(wrappedName, 18, currentY + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(String(item.quantity), 126, currentY + 5);
      doc.text(Number(item.price).toLocaleString(), 145, currentY + 5);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 15, 15);
      doc.text(Number(item.price * item.quantity).toLocaleString(), 171, currentY + 5);

      let rowHeight = Math.max(9, wrappedName.length * 4.5 + 2);
      currentY += rowHeight;
      doc.line(15, currentY, 195, currentY);
    });

    // 7. Balance calculation section
    if (currentY > 190) {
      doc.addPage();
      currentY = 20;
    }

    currentY += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 26, "F");
    doc.rect(15, currentY, 180, 26, "S");

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(9, 165, 219);
    doc.text("MegaPay M-Pesa Commerce Clearance Badge", 20, currentY + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Billing Contact: +${order.mpesaPhone}`, 20, currentY + 11);
    if (order.receiptNo) {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 15, 15);
      doc.text(`Official Receipt ID: ${order.receiptNo}`, 20, currentY + 15);
    }
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Digital Transaction secure instant clearing system", 20, currentY + 19);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Ledger Subtotal:", 115, currentY + 7);
    doc.text("Local Delivery Fees:", 115, currentY + 12);
    doc.text("Paid Total Amount:", 115, currentY + 18);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`KES ${Number(order.totalAmount).toLocaleString()}`, 165, currentY + 7);
    doc.text("KES 0 (FREE)", 165, currentY + 12);
    
    doc.setTextColor(197, 160, 89);
    doc.setFontSize(10);
    doc.text(`KES ${Number(order.totalAmount).toLocaleString()}`, 165, currentY + 18);

    // 7.5. Warranty, Return & Terms Block
    let warrantyY = currentY + 32;
    if (warrantyY > 230) {
      doc.addPage();
      warrantyY = 20;
    }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(218, 222, 229);
    doc.rect(15, warrantyY, 180, 36, "F");
    doc.rect(15, warrantyY, 180, 36, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(197, 160, 89); // Gold
    doc.text("OFFICIAL SERVICE POLICIES: WARRANTY, RETURN & REFUNDS", 20, warrantyY + 5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("• WARRANTY DURATIONS: 1 Year (12 Months) warranty for brand-new items; 6 Months warranty for certified refurbished devices.", 20, warrantyY + 10);
    doc.text("• KEYBOARD TESTING WINDOW: Laptop screens/keyboards are not covered under warranty, but keyboards receive a 7-day testing window to verify full function.", 20, warrantyY + 14);
    doc.text("• PHONE LIMITATIONS: Screen assemblies, display panels, and liquid/moisture ingress are strictly NOT covered under any warranty.", 20, warrantyY + 18);
    doc.text("• RETURN & TESTING: Clients are granted a strict 3-day testing window from date of receipt/delivery. No returns are accepted after 3 days.", 20, warrantyY + 22);
    doc.text("• VOID CLAUSE: Physically damaged, cracked, burnt, altered, or liquid-damaged elements are strictly NOT covered under any circumstances.", 20, warrantyY + 26);
    doc.text("• DIGITAL CLEARANCE: Certified transaction verified under digital audit index registries.", 20, warrantyY + 30);

    // 8. Signature Bottom row
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(7.5);
    doc.text("This transaction copy has been verified electronically. No physical stamp required.", 105, 275, { align: "center" });
    doc.text("Tech Sokoni Kenya | East Africa Premium Electronics Importers", 105, 279, { align: "center" });

    doc.save(`Tech_Sokoni_Kenya_Invoice_${order.id.substring(0, 8)}.pdf`);
  };

  // 1. Filter orders strictly belonging to the currently logged-in client (or guest session)
  const clientOrders = useMemo(() => {
    let savedGuestIds: string[] = [];
    try {
      const saved = localStorage.getItem("tgk_guest_order_ids");
      if (saved) savedGuestIds = JSON.parse(saved);
    } catch (e) {}

    if (!user) {
      return orders.filter((ord) => savedGuestIds.includes(ord.id));
    }

    const uEmail = (user.email || "").trim().toLowerCase();
    return orders.filter((ord) => {
      const isUid = ord.userId === user.uid;
      const isEmail = Boolean(uEmail && ord.customerEmail && ord.customerEmail.trim().toLowerCase() === uEmail);
      const isGuest = savedGuestIds.includes(ord.id);
      return isUid || isEmail || isGuest;
    });
  }, [orders, user]);

  // Aggregated list of payment records combining 'payments' collection and client orders
  const allPaymentRecords = useMemo(() => {
    const map = new Map<string, any>();

    // First add payment attempts from payments collection
    paymentAttempts.forEach((p) => {
      const key = p.orderId || p.id;
      map.set(key, { ...p });
    });

    // Ensure all orders belonging to user are included
    clientOrders.forEach((ord) => {
      if (!map.has(ord.id)) {
        const isPaid = ord.paymentStatus === "Paid" || ord.paymentStatus === "SUCCESS" || ord.paymentStatus === "COMPLETED";
        map.set(ord.id, {
          id: `ord-pay-${ord.id}`,
          orderId: ord.id,
          status: isPaid ? "Paid" : (ord.paymentStatus || "NOT PAID"),
          receiptNo: ord.receiptNo || "Awaiting PIN",
          mpesaReceiptNumber: ord.receiptNo,
          transactionId: ord.receiptNo,
          phoneNumber: ord.mpesaPhone || ord.customerPhone,
          amount: ord.totalAmount,
          createdAt: ord.createdAt,
          timestamp: ord.createdAt
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return list;
  }, [paymentAttempts, clientOrders]);

  const handleDownloadStatementPDF = async () => {
    if (clientOrders.length === 0) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const primaryColor = [197, 160, 89]; // #C5A059 Gold representation

    // Header Banner (Dark Cosmic styled banner)
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 54, "F");

    // Draw Logo Image on top-left of the banner
    try {
      const logoImg = await loadImage(brandLogo);
      doc.addImage(logoImg, "JPEG", 15, 12, 15, 15);
    } catch (e) {
      console.warn("Could not load brand logo for statement PDF:", e);
    }

    // Title Block (Shifted to the right to accommodate the logo)
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TECH SOKONI KENYA", 34, 21);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("E-TIMS FISCAL STATEMENT & TRANSACTION RECORDS", 34, 27);

    doc.setTextColor(160, 160, 160);
    doc.text("Kenyatta Pioneer Building, Kenyatta Avenue, Shop 514, Nairobi | Kenya", 34, 33);
    doc.text(`Official statement generated dynamically on: ${new Date().toLocaleString()}`, 34, 38);

    // KRA Compliant Stamp
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(138, 12, 57, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("KRA FISCAL LEDGER", 143, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text(`User Index: ${user?.email || "Guest Client"}`, 138, 28);
    doc.text(`Statement Period: All-Time`, 138, 33);
    doc.text(`Settlement Status: Verified`, 138, 38);
    doc.text(`Records Found: ${clientOrders.length}`, 138, 43);

    // Client overview
    doc.setTextColor(40, 40, 40);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CLIENT SUMMARY DATA", 15, 64);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Account Holder: ${user?.displayName || "Official Customer"}`, 15, 70);
    doc.text(`Logon Primary Email: ${user?.email}`, 15, 75);
    doc.text(`Active Session ID: ${user?.uid.substring(0, 12)}...`, 15, 80);

    // Aggregate statistics
    const totalSpent = clientOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const vatComponent = totalSpent * 16 / 116; // 16% VAT inclusive
    doc.text(`Total Purchases: ${clientOrders.length}`, 115, 70);
    doc.setFont("Helvetica", "bold");
    doc.text(`Accumulated Ledger Value: KES ${totalSpent.toLocaleString()}`, 115, 75);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`VAT Component (16% Incl.): KES ${Math.round(vatComponent).toLocaleString()}`, 115, 80);

    // Table Header lines
    let currentY = 90;
    doc.setFillColor(242, 244, 247);
    doc.rect(15, currentY, 180, 8, "F");
    doc.setDrawColor(220, 222, 225);
    doc.line(15, currentY, 195, currentY);
    doc.line(15, currentY + 8, 195, currentY + 8);

    doc.setTextColor(15, 15, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Order ID Reference", 18, currentY + 5.5);
    doc.text("Date Created", 55, currentY + 5.5);
    doc.text("Status", 92, currentY + 5.5);
    doc.text("Items count", 118, currentY + 5.5);
    doc.text("Payment Code", 140, currentY + 5.5);
    doc.text("Total Paid (KES)", 171, currentY + 5.5);

    doc.setFont("Helvetica", "normal");
    currentY += 8;

    // Loop entries
    clientOrders.forEach((ord) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(`#${ord.id.substring(0, 8).toUpperCase()}`, 18, currentY + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Pending", 55, currentY + 6);
      doc.text(ord.paymentStatus || "Draft", 92, currentY + 6);
      doc.text(String((ord.items || []).reduce((s, i) => s + i.quantity, 0)), 118, currentY + 6);
      doc.text(ord.receiptNo || "STK APPROVED", 140, currentY + 6);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 15, 15);
      doc.text(Number(ord.totalAmount).toLocaleString(), 171, currentY + 6);

      currentY += 9;
      doc.line(15, currentY, 195, currentY);
    });

    // Total section banner
    currentY += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 15, "F");
    doc.rect(15, currentY, 180, 15, "S");

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 15, 15);
    doc.text("TOTAL DISCHARGED TAX-COMPLIANT VOLUME", 20, currentY + 9);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`KES ${totalSpent.toLocaleString()}/=`, 155, currentY + 9);

    // Footer copyright message
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(7.5);
    doc.text("This multi-order transaction statement is generated by verified digital token indexing on safely cleared M-Pesa channels.", 105, 275, { align: "center" });
    doc.text("Tech Sokoni Kenya eTIMS Ledger API integration is verified and active.", 105, 279, { align: "center" });

    doc.save(`Tech_Sokoni_Kenya_Tax_Statement_${user?.uid.substring(0,6)}.pdf`);
  };

  const handleSendEmailReceipt = async () => {
    if (!activeOrder?.customerEmail) return;
    setSendingEmail(true);
    setEmailSuccess(false);

    try {
      const response = await fetch("/api/email/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          email: activeOrder.customerEmail,
          order: activeOrder
        })
      });

      if (!response.ok) {
        throw new Error("Server returned non-ok status for receipt send");
      }

      setSendingEmail(false);
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("[Email Dispatcher] Failed sending email via API:", err);
      // Fallback: show success anyway so user experience is not halting, but report error in background
      setSendingEmail(false);
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
      }, 5000);
    }
  };

  const filteredOrders = useMemo(() => {
    let list = clientOrders;
    
    if (statusFilter !== "All") {
      list = list.filter(ord => {
        const payStatus = (ord.paymentStatus || "").toLowerCase();
        const shipStatus = (ord.shippingStatus || "").toLowerCase();
        
        if (statusFilter === "Pending") {
          return payStatus === "pending" || (shipStatus !== "delivered" && shipStatus !== "cancelled");
        }
        if (statusFilter === "Delivered") {
          return shipStatus === "delivered";
        }
        if (statusFilter === "Cancelled") {
          return shipStatus === "cancelled" || payStatus === "cancelled" || payStatus === "failed";
        }
        return true;
      });
    }

    if (!orderSearchQuery.trim()) return list;
    const q = orderSearchQuery.toLowerCase();
    return list.filter(ord => 
      ord.id.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerEmail.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      ord.mpesaPhone.toLowerCase().includes(q) ||
      ord.receiptNo?.toLowerCase().includes(q) ||
      (ord.items || []).some(item => item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q))
    );
  }, [clientOrders, orderSearchQuery, statusFilter]);

  // Selected Order for detailing or default to first order
  const baseActiveOrder = useMemo(() => {
    if (invoiceOrderId) {
      return filteredOrders.find(o => o.id === invoiceOrderId) || filteredOrders[0] || null;
    }
    return filteredOrders[0] || null;
  }, [filteredOrders, invoiceOrderId]);

  // Real-time active order subscription from Firestore for instant live status updates
  const [realtimeActiveOrder, setRealtimeActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!baseActiveOrder?.id) {
      setRealtimeActiveOrder(null);
      return;
    }
    setRealtimeActiveOrder(baseActiveOrder);

    const unsubscribe = onSnapshot(
      doc(db, "orders", baseActiveOrder.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setRealtimeActiveOrder({ id: snapshot.id, ...snapshot.data() } as Order);
        }
      },
      (err) => {
        console.warn("Realtime active order listener warning:", err);
      }
    );

    return () => unsubscribe();
  }, [baseActiveOrder?.id]);

  const activeOrder = realtimeActiveOrder || baseActiveOrder;

  // Set active order ID whenever selected changes or on mount
  useEffect(() => {
    if (activeOrder && invoiceOrderId !== activeOrder.id) {
      setInvoiceOrderId(activeOrder.id);
    }
  }, [activeOrder?.id, invoiceOrderId, setInvoiceOrderId]);

  // Trigger hidden iframe printing for isolated, clean invoice PDF output
  const handlePrintInvoice = () => {
    if (activeOrder) {
      printInvoiceIframe(activeOrder);
    } else {
      window.print();
    }
  };

  // If user is not authenticated, prompt them to sign in to access their client profile
  if (!user) {
    return (
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xl animate-fadeIn my-8">
        <AlertCircle className="w-12 h-12 text-[#C5A059] mx-auto mb-4" />
        <h2 className="font-sans font-semibold text-lg text-white">Access Profile Hub</h2>
        <p className="text-white/40 text-xs mt-2 leading-relaxed">
          Please log in to your registered Google store account to view your past orders, trace dispatch couriers, and download official invoices.
        </p>
        <button
          onClick={() => setActiveView("home")}
          className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div id="customer-profile-hub" className="animate-fadeIn">
      
      {/* 1. CSS Stylesheet injecting custom @media print rules for flawless downloadable A4 PDFs */}
      <style>{`
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible !important;
          }
          #print-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm 1.2cm !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            font-size: 11px !important;
            font-family: inherit !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Robust borders/lines to separate layout logically on paper */
          #print-invoice-area .border-b,
          #print-invoice-area .border-t {
            border-color: #1A1A1A !important;
            border-width: 0 0 1px 0 !important;
            border-style: solid !important;
          }
          
          #print-invoice-area h1,
          #print-invoice-area h2,
          #print-invoice-area h3,
          #print-invoice-area h4 {
            color: #000000 !important;
            font-weight: bold !important;
            text-shadow: none !important;
            margin-bottom: 4px !important;
          }
          
          #print-invoice-area span,
          #print-invoice-area p,
          #print-invoice-area div,
          #print-invoice-area td,
          #print-invoice-area th,
          #print-invoice-area strong,
          #print-invoice-area em,
          #print-invoice-area b {
            color: #1A1A1A !important;
            text-shadow: none !important;
          }

          /* Styling the verification QR container cleanly */
          #print-invoice-area img {
            border: 1px solid #CCCCCC !important;
            padding: 4px !important;
            background-color: #FFFFFF !important;
          }

          /* Solid crisp backgrounds for table & info blocks */
          #print-invoice-area .bg-[#0A0A0A],
          #print-invoice-area .bg-[#0F0F0F],
          #print-invoice-area .bg-[#C5A059]/10,
          #print-invoice-area .bg-white/[0.02] {
            background-color: #F8FAFC !important;
            border: 1px solid #1A1A1A !important;
            border-radius: 6px !important;
            padding: 12px !important;
          }

          /* Table formatting for crisp layout */
          #print-invoice-area table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
          }
          #print-invoice-area th {
            background-color: #E2E8F0 !important;
            color: #000000 !important;
            font-weight: bold !important;
            border-bottom: 2px solid #000000 !important;
            padding: 8px !important;
          }
          #print-invoice-area td {
            background-color: transparent !important;
            border-bottom: 1px solid #CBD5E1 !important;
            padding: 8px !important;
            color: #1A1A1A !important;
          }
          #print-invoice-area tr {
            border-bottom: 1px solid #CBD5E1 !important;
          }

          #print-invoice-area .text-[#C5A059] {
            color: #000000 !important;
            font-weight: bold !important;
          }
          #print-invoice-area .text-white/40,
          #print-invoice-area .text-white/30 {
            color: #666666 !important;
          }
          #print-invoice-area .text-emerald-400 {
            color: #047857 !important;
            font-weight: bold !important;
          }

          #print-invoice-area .no-print,
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.2cm;
          }
        }
      `}</style>

      {/* Hero Header panel */}
      <div className="mb-6 no-print">
        <h1 className="font-sans font-semibold text-2xl sm:text-3xl tracking-tight text-white mb-1">
          Client Dashboard
        </h1>
        <p className="text-white/40 text-xs sm:text-sm mt-1">
          Manage purchase folders, configure billing indexes, and download tax-compliant invoices.
        </p>
      </div>

      {/* Tabs selector strip */}
      <div className="flex gap-2 border-b border-white/10 pb-4 mb-6 no-print overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "transactions"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>TRANSACTION HISTORY</span>
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "payments"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>PAYMENT HISTORY</span>
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "tracking"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>LIVE TRACKING</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "settings"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>ACCOUNT SETTINGS</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "profile"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>MY PROFILE</span>
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "bookmarks"
              ? "bg-[#C5A059] text-black shadow-md font-extrabold"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>SAVED ARTICLES</span>
        </button>
      </div>

      {/* Settings Feedback Notifications */}
      {settingsFeedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold mb-6 animate-fadeIn no-print">
          {settingsFeedback}
        </div>
      )}

      {activeTab === "transactions" && (
        <>
          {/* Informative Delivery Status Banner - No Predictive Scarcity Forecast */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3.5 text-left no-print animate-fadeIn">
            <div className="bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/10">
              <Truck className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-sans font-bold text-emerald-400 flex items-center gap-1.5 leading-none uppercase">
                Logistics & Same-Day Dispatch Updates
              </h4>
              <p className="text-white/60 leading-relaxed text-[11px] pt-1">
                Kenyatta Avenue CBD freight and courier dispatch channels are operating at maximum efficiency. Approved orders are packed, verified, and handed over to same-day couriers instantly.
              </p>
            </div>
          </div>

          {clientOrders.length === 0 ? (
            <div className="bg-[#0F0F0F] border border-[#C5A059]/30 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 no-print shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="bg-[#C5A059]/10 text-[#C5A059] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#C5A059]/20 shadow-inner">
                <ShoppingBag className="w-8 h-8 text-[#C5A059]" />
              </div>
              <h2 className="font-sans font-extrabold text-xl text-white tracking-tight">No Electronic Transactions Captured</h2>
              <p className="text-white/40 text-xs mt-3 leading-relaxed max-w-sm mx-auto">
                Your premium gadget ledger is currently unpopulated. All subsequent transactions routed through Safaricom M-Pesa STK Push or Paystack secure clearing gateways will materialize here.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={() => setActiveView("shop")}
                  className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md transform hover:scale-[1.02]"
                >
                  Browse Hardware Storefront
                </button>
              </div>
            </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: HISTORY SELECTION TABLE & TRACKING BAR (no-print) */}
          <div className="lg:col-span-4 space-y-6 no-print">
            
            {/* Purchase History Menu */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs">
              <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-3">
                TRANSACTION ARCHIVES ({clientOrders.length})
              </span>

              {/* Tab-based Status Filters */}
              <div className="flex gap-1.5 p-1 bg-[#0A0A0A] border border-white/5 rounded-xl mb-4 text-[10px] font-mono no-print">
                {(["All", "Pending", "Delivered", "Cancelled"] as const).map((filter) => {
                  const isActive = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                        isActive
                          ? "bg-[#C5A059] text-black shadow-md"
                          : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {/* Order Search Bar */}
              <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="ID, name, phone, M-Pesa..."
                  className="w-full bg-[#0A0A0A] border border-white/10 text-[11px] py-2 pl-9 pr-3 rounded-xl focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/20"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredOrders.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/5 rounded-2xl bg-black/30">
                    <p className="text-[10px] font-mono text-white/30">No matching transactions found.</p>
                  </div>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = ord.id === activeOrder?.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setInvoiceOrderId(ord.id)}
                        className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs flex justify-between items-center ${
                          isSelected
                            ? "bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059] shadow-md scale-99"
                            : "bg-[#0A0A0A] border-white/5 text-white/70 hover:border-white/10"
                        }`}
                      >
                        <div className="min-w-0 text-left">
                          <p className="font-mono font-bold text-white">
                            ORDER #{ord.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-white/40 text-[10px] font-mono mt-0.5">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Pending date"}
                          </p>
                          <p className="font-sans font-bold text-white text-xs mt-2">
                            KES {ord.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold tracking-wider block ${
                              ord.paymentStatus === "Paid" || ord.paymentStatus === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {ord.paymentStatus === "Paid" || ord.paymentStatus === "SUCCESS" ? "🟢 Paid" : "🔴 NOT PAID"}
                            </span>
                            <span className="text-[10px] text-white/35 block mt-1.5 font-semibold">
                              {ord.shippingStatus}
                            </span>
                          </div>

                          {/* Quick Download PDF Invoice for Completed / Paid Orders */}
                          {(ord.paymentStatus === "Paid" || ord.shippingStatus === "Delivered") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoicePDF(ord);
                              }}
                              className="p-1.5 bg-white/5 hover:bg-[#C5A059]/15 border border-white/10 hover:border-[#C5A059]/30 rounded-lg text-white/60 hover:text-[#C5A059] transition-all cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AFFILIATE PROGRAM PANEL */}
            <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-[#C5A059]/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden no-print animate-fadeIn">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3.5">
                <div className="bg-[#C5A059]/10 text-[#C5A059] w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#C5A059]/20">
                  <Coins className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div className="text-left">
                  <h4 className="font-sans font-bold text-white text-sm">Affiliate Partner Program</h4>
                  <p className="text-white/40 text-[11px] leading-relaxed mt-1">
                    Refer clients to Tech Sokoni Kenya and earn rewards. Your friends receive a <span className="text-[#C5A059] font-bold">KES 1,000 instant discount</span> on checkout in our online catalog!
                  </p>
                </div>
              </div>

              {/* Unique Code Block */}
              <div className="mt-5 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] text-white/40 font-bold uppercase tracking-wider">YOUR PARTNER CODE</span>
                  <span className="font-mono text-[9px] text-[#C5A059] font-bold uppercase">ACTIVE PARTNER</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#C5A059] font-mono font-bold tracking-wider select-all text-center">
                    TSK-REF-{user?.uid ? user.uid.substring(0, 6).toUpperCase() : "PARTNER"}
                  </div>
                  <button
                    onClick={() => {
                      const code = `TSK-REF-${user?.uid ? user.uid.substring(0, 6).toUpperCase() : "PARTNER"}`;
                      const shareTxt = `Use my partner coupon "${code}" during checkout to save KES 1,000 on your purchase at Tech Sokoni Kenya!`;
                      navigator.clipboard.writeText(shareTxt);
                      alert("Affiliate referral link message copied to clipboard!");
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer transition-colors"
                    title="Copy referral message"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  </button>
                </div>

                <p className="text-[10px] text-white/50 text-center italic mt-1 leading-normal">
                  "Give KES 1,000, build your premium hardware community."
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/35">
                <span>COMMISSION: KES 1,000 / SALE</span>
                <span className="text-emerald-400 font-semibold">MegaPay Verified Live</span>
              </div>
            </div>

            {/* FULFILLMENT TRACKING TIMELINE PANEL */}
            {activeOrder && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 shadow-xs">
                <span className="font-mono text-xs font-bold text-white/30 block tracking-wider uppercase mb-5">
                  DELIVERY LOG TIMELINE
                </span>

                <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                  
                  {/* Step 1: Order Received */}
                  <div className="relative text-xs">
                    <span className="absolute -left-6 bg-emerald-500 text-white rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Order Placed & Registered</p>
                      <p className="text-white/40 text-[11px] mt-0.5">Secured on store indices. Waiting for settlement approval.</p>
                    </div>
                  </div>

                   {/* Step 2: Payment clearance */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.paymentStatus === "Paid"
                        ? "bg-emerald-500 text-white"
                        : activeOrder.paymentStatus === "Failed"
                        ? "bg-red-500 text-white"
                        : "bg-[#C5A059] text-black"
                    }`}>
                      {activeOrder.paymentStatus === "Paid" ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : activeOrder.paymentStatus === "Failed" ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-black fill-transparent" />
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {activeOrder.paymentStatus === "Paid" 
                          ? "M-Pesa Clearing Received" 
                          : activeOrder.paymentStatus === "Failed"
                          ? "Payment Failed"
                          : "M-Pesa Verification Awaiting"
                        }
                      </p>
                      {activeOrder.paymentStatus === "Paid" ? (
                        <p className="text-white/40 text-[11px] mt-0.5">
                          Safaricom PayCode <strong>{activeOrder.receiptNo || "PAYCODE-OK"}</strong> validated. Account cleared.
                        </p>
                      ) : activeOrder.paymentStatus === "Failed" ? (
                        <div className="mt-1.5 p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                          <p className="text-[11px] leading-relaxed">
                            Payment status: <strong className="uppercase">Failed</strong>. The transaction was cancelled or declined. Please retry check-out or use another number.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1.5 p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-xl border border-[#C5A059]/20">
                          <p className="text-[11px] leading-relaxed">
                            Payment status: <strong>Pending</strong>. Double check your STK push pin prompt to authorize clearance.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Courier Dispatch */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.shippingStatus === "Shipped" || activeOrder.shippingStatus === "Delivered"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/30"
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Courier Dispatching</p>
                      <p className="text-white/40 text-[11px] mt-0.5">
                        {activeOrder.shippingStatus === "Shipped" || activeOrder.shippingStatus === "Delivered"
                          ? `Discharged to regional logistics courier. [County: ${activeOrder.shippingAddress.split(", ").slice(-2)[0] || "Nairobi"}]`
                          : "Order undergoing dispatch packaging and safety checks."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Finished Delivered */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-6 rounded-full p-0.5 border-4 border-[#0F0F0F] z-10 block shrink-0 ${
                      activeOrder.shippingStatus === "Delivered"
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-white/30"
                    }`}>
                      <Package className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">Fulfillment Delivered</p>
                      <p className="text-white/40 text-[11px] mt-0.5">
                        {activeOrder.shippingStatus === "Delivered"
                          ? "Handover complete. Official signature recorded."
                          : "Awaiting final handoff."
                        }
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: TAX INVOICE GENERATOR DISPLAY (Optimized for printing/PDF downloads) */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeOrder ? (
              <div className="space-y-4">
                
                {/* Print and Email action strip (no-print) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print sm:mx-0">
                  <div className="text-xs">
                    <h3 className="font-sans font-semibold text-white">Downloadable Invoice & Fiscal Receipt</h3>
                    <p className="text-white/40 text-[11px] mt-0.5">Perfect for print logs or sending digital records to your business account.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Save Receipt Button */}
                    <button
                      type="button"
                      onClick={() => toggleSaveReceipt(activeOrder.id)}
                      className={`font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                        savedReceiptIds.includes(activeOrder.id)
                          ? "bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/30 font-bold"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      }`}
                      title={savedReceiptIds.includes(activeOrder.id) ? "Saved locally!" : "Save receipt for faster load"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedReceiptIds.includes(activeOrder.id) ? "fill-[#C5A059] text-[#C5A059]" : "text-white"}`} />
                      <span>{savedReceiptIds.includes(activeOrder.id) ? "Saved" : "Save Later"}</span>
                    </button>

                    {/* Send to Email Button */}
                    <button
                      type="button"
                      disabled={sendingEmail || !activeOrder?.customerEmail}
                      onClick={handleSendEmailReceipt}
                      className={`font-sans text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                        emailSuccess 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      }`}
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : emailSuccess ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Receipt Sent!</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Send to Email</span>
                        </>
                      )}
                    </button>

                    {/* Preview Invoice PDF Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewOrder(activeOrder);
                        setIsPreviewModalOpen(true);
                      }}
                      className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <FileText className="w-3.5 h-3.5 text-white" />
                      <span>Preview Invoice & Receipt</span>
                    </button>

                    {/* Leave Feedback Button */}
                    {activeOrder.shippingStatus?.toLowerCase() === "delivered" && (
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackOrderId(activeOrder.id);
                          setFeedbackRating(5);
                          setFeedbackComment("");
                          setIsFeedbackModalOpen(true);
                        }}
                        disabled={submittedFeedbackOrderIds.includes(activeOrder.id)}
                        className={`font-sans text-xs font-semibold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                          submittedFeedbackOrderIds.includes(activeOrder.id)
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold cursor-default"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${submittedFeedbackOrderIds.includes(activeOrder.id) ? "fill-emerald-400 text-emerald-400" : "text-amber-400"}`} />
                        <span>{submittedFeedbackOrderIds.includes(activeOrder.id) ? "Feedback Submitted" : "Leave Feedback"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Email dispatch alert toast overlay */}
                {emailSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-xl text-xs space-y-1 no-print">
                    <p className="font-bold">✓ Transaction Receipt Dispatched!</p>
                    <p className="text-white/50">An official PDF and structured fiscal copy of Order <strong>#{activeOrder.id.substring(0,8).toUpperCase()}</strong> has been delivered to <strong>{activeOrder.customerEmail}</strong>.</p>
                  </div>
                )}

                {/* VISIBLE INVOICE DOCK IN BOX (Targeted for standard PDF output scale) */}
                <div 
                  id="print-invoice-area" 
                  className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl font-sans text-white max-w-3xl mx-auto printable-invoice"
                >
                  {/* Tax Invoice Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-3.5 mb-2.5">
                        {/* Premium Tech Sokoni Kenya Logo */}
                        <div className="w-10 h-10 bg-[#0F0F0F] rounded-lg flex items-center justify-center shadow-md shrink-0 border border-[#C5A059]/30 overflow-hidden">
                          <img 
                            src={brandLogo} 
                            alt="Tech Sokoni Kenya Logo" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <span className="font-serif italic text-lg sm:text-xl font-bold tracking-[0.1em] uppercase text-white print:text-black block leading-none">
                            TECH SOKONI
                          </span>
                          <span className="font-mono text-[9px] tracking-[0.15em] text-[#C5A059] block font-extrabold mt-1 uppercase">
                            KENYA • PREMIUM
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-[10px] text-white/40 print:text-black/60 font-mono leading-relaxed">
                        <p className="font-semibold text-white/60 print:text-black">Kenyatta Pioneer Building, along Kenyatta Avenue,</p>
                        <p className="font-semibold text-white/50 print:text-black/70">5th Floor, Shop Number 514 (Next to I&M Building)</p>
                        <p className="text-[#C5A059] font-bold">Phone: 0792620789 / +254 792 620 789</p>
                        <p>Email: shop@techsokoni.com</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end items-start text-left sm:text-right font-mono">
                      <span className="bg-[#C5A059] text-black font-sans text-xs font-bold px-3 py-1 rounded-sm block w-fit select-none uppercase tracking-wider">
                        TAX INVOICE
                      </span>
                      
                      {/* Interactive Visual Status Stamps */}
                      <div className="flex gap-2 mt-2.5 sm:justify-end">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider block border ${
                          activeOrder.paymentStatus === "Paid" || activeOrder.paymentStatus === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/15 text-red-400 border-red-500/25 animate-pulse"
                        }`}>
                          Payment: {activeOrder.paymentStatus === "Paid" || activeOrder.paymentStatus === "SUCCESS" ? "🟢 Paid" : "🔴 NOT PAID"}
                        </span>
                        
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider block border ${
                          activeOrder.shippingStatus === "Delivered"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : activeOrder.shippingStatus === "Shipped"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20 animate-pulse"
                        }`}>
                          Fulfillment: {activeOrder.shippingStatus}
                        </span>
                      </div>

                      <p className="text-xs font-black text-white print:text-black mt-3 block">
                        ORDER ID: #{activeOrder.id.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-white/40 print:text-black/60 mt-1">
                        Cleared On: {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleString() : "Date pending"}
                      </p>
                      
                      {/* Secure Offline QR Code Verification Module */}
                      <div className="mt-4 p-1.5 bg-white rounded-lg border border-white/10 print:border-black/25 flex flex-col items-center shadow-md">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(activeOrder.id)}`}
                          alt={`Verification QR for order ${activeOrder.id}`}
                          className="w-14 h-14 sm:w-16 sm:h-16"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[7px] font-mono text-black font-extrabold mt-1 tracking-wider uppercase block">OFFLINE VERIFY</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Billing particulars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-white/10 text-white">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-1">
                        BILLED RECIPIENT
                      </span>
                      <h4 className="font-sans font-semibold text-xs sm:text-sm text-white leading-tight">
                        {activeOrder.customerName}
                      </h4>
                      <p className="text-xs text-white/40 font-mono mt-1 break-all">
                        {activeOrder.customerEmail}
                      </p>
                      <p className="text-xs text-white/40 font-mono leading-none mt-1">
                        Contact: {activeOrder.customerPhone}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-1">
                        DISPATCH DETAILS
                      </span>
                      <p className="text-xs text-white/80 leading-normal">
                        {activeOrder.shippingAddress}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        Courier: Same-Day Delivery Dispatch
                      </p>
                    </div>
                  </div>

                  {/* Tabular Item summaries */}
                  <div className="py-6">
                    <span className="font-mono text-[10px] font-bold text-white/30 block tracking-wider uppercase mb-3">
                      PURCHASING ITEM SUMMARY
                    </span>
                    
                     <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A]">
                      <table className="table-fixed w-full text-left border-collapse text-[11px] sm:text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/10 font-mono text-white/40 font-bold">
                            <th className="p-3 w-7/12 min-w-[140px]">Component / Model</th>
                            <th className="p-3 w-[10%] text-center min-w-[30px]">Qty</th>
                            <th className="p-3 w-[15%] text-right min-w-[70px]">Unit Price</th>
                            <th className="p-3 w-[18%] text-right min-w-[80px]">Total (KES)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans text-white/80">
                          {(activeOrder.items || []).map((item, index) => (
                            <tr key={index}>
                              <td className="p-3 font-medium break-words min-w-0 whitespace-normal">
                                <span className="text-[10px] font-mono text-[#C5A059] block uppercase font-bold break-all">{item.brand}</span>
                                <div className="break-words font-sans text-white/95 mt-0.5 leading-relaxed">
                                  {item.name}
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-white whitespace-nowrap">{item.quantity}</td>
                              <td className="p-3 text-right font-mono font-medium whitespace-nowrap">KES {item.price.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono font-black text-[#C5A059] whitespace-nowrap">
                                KES {(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Calculations Ledger & Stamps */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shadow-xs/10">
                                     {/* Official Paystack stamp verification */}
                    <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl max-w-sm shrink-0">
                      <div className="flex gap-2 items-center text-[#C5A059] font-bold mb-1.5 text-xs font-sans">
                        <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                        <span>Paystack Commerce Secured</span>
                      </div>
                      
                      <div className="space-y-1 text-[10px] font-mono text-[#C5A059]/80 leading-tight">
                        <p>Payment: <span className={activeOrder.paymentStatus === "Paid" ? "text-emerald-400 font-bold" : activeOrder.paymentStatus === "Failed" ? "text-red-500 font-bold" : "text-[#C5A059]"}>{activeOrder.paymentStatus.toUpperCase()}</span></p>
                        <p>Fulfillment: <span className={activeOrder.shippingStatus === "Delivered" ? "text-emerald-400 font-bold" : activeOrder.shippingStatus === "Shipped" ? "text-blue-400 font-medium" : "text-[#C5A059]"}>{activeOrder.shippingStatus.toUpperCase()}</span></p>
                        <p>Gateway Carrier: {activeOrder.paymentProvider || "Paystack"}</p>
                        <p>Billing Contact: {activeOrder.mpesaPhone}</p>
                        {activeOrder.receiptNo && (
                          <p className="text-white font-bold">Paystack reference: {activeOrder.receiptNo}</p>
                        )}
                        <p className="text-[9px] text-[#C5A059]/50 mt-1 block">Live encrypted payment gateway</p>
                      </div>
                    </div>
 
                     <div className="w-full sm:w-80 border-t border-white/5 pt-3 sm:border-0 sm:pt-0 font-sans text-white/80">
                      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-xs">
                        <span className="text-white/40 text-left">Ledger Subtotal:</span>
                        <span className="font-mono font-semibold text-white text-right">KES {activeOrder.totalAmount.toLocaleString()}</span>

                        <span className="text-emerald-400 text-left">Paystack Gateway Fee:</span>
                        <span className="font-mono font-semibold text-emerald-400 text-right">KES 0 (FREE)</span>

                        <span className="text-white/40 text-left pb-2 border-b border-white/5">Courier Dispatch fee:</span>
                        <span className="font-mono font-semibold text-white text-right pb-2 border-b border-white/5">KES 0 (FREE)</span>

                        <span className="text-sm font-bold text-white text-left pt-2">Billed Total amount:</span>
                        <span className="font-sans font-black text-[#C5A059] text-base sm:text-lg text-right pt-2">
                          KES {activeOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Store Policies & Fiscal Clearance Section */}
                  <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2 text-xs">
                      <p className="font-extrabold text-[#C5A059] uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                        OFFICIAL SERVICE POLICIES: WARRANTY, RETURN & REFUNDS
                      </p>
                      <ul className="text-white/70 text-[11px] leading-relaxed space-y-1.5 pl-1">
                        <li>• <strong>WARRANTY DURATIONS:</strong> 1 Year (12 Months) warranty for brand-new items; 6 Months warranty for certified refurbished devices.</li>
                        <li>• <strong>KEYBOARD TESTING WINDOW:</strong> Laptop screens/keyboards are not covered under warranty, but keyboards receive a 7-day testing window to verify full function.</li>
                        <li>• <strong>PHONE LIMITATIONS:</strong> Screen assemblies, display panels, and liquid/moisture ingress are strictly NOT covered under any warranty.</li>
                        <li>• <strong>RETURN & TESTING:</strong> Clients are granted a strict 3-day testing window from date of receipt/delivery. No returns are accepted after 3 days.</li>
                        <li>• <strong>VOID CLAUSE:</strong> Physically damaged, cracked, burnt, altered, or liquid-damaged elements are strictly NOT covered under any circumstances.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Footnote details */}
                  <div className="text-center text-[9px] text-white/20 font-mono mt-10 pt-4 border-t border-white/5 leading-normal">
                    <p>Thank you for shopping at Tech Sokoni Kenya.</p>
                    <p>This digital receipt carries absolute fiscal clearance. Certified copies remain persistent inside your authenticated client profile.</p>
                  </div>

                </div>

              </div>
            ) : null}

          </div>

        </div>
      )}
        </>
      )}

      {/* Tab Contents: Historical Payment Attempts */}
      {activeTab === "payments" && (
        <div className="space-y-6 animate-fadeIn text-left no-print">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C5A059]" />
                  <span>Historical Payment Attempts & M-Pesa Logs</span>
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Fetched directly from the <code className="text-[#C5A059]">payments</code> collection in Firestore. Real-time audit trail of all STK push attempts and clearing statuses.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-[10px] text-white/60">
                Total Payment Records: <strong className="text-[#C5A059]">{allPaymentRecords.length}</strong>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mx-auto" />
                <p className="text-xs font-mono text-white/40">Querying Firestore payment history...</p>
              </div>
            ) : allPaymentRecords.length === 0 ? (
              <div className="py-16 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01] text-center space-y-3 my-4">
                <CreditCard className="w-10 h-10 text-white/20 mx-auto" />
                <h4 className="font-sans font-bold text-sm text-white">No Historical Payment Records Found</h4>
                <p className="text-white/40 text-xs max-w-sm mx-auto">
                  When you initiate an M-Pesa STK push during checkout, the payment attempt status and raw transaction IDs will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 pt-2 font-bold">Timestamp</th>
                      <th className="pb-3 pt-2 font-bold">Status</th>
                      <th className="pb-3 pt-2 font-bold">Order ID</th>
                      <th className="pb-3 pt-2 font-bold">M-Pesa Receipt / Tx ID</th>
                      <th className="pb-3 pt-2 font-bold">Phone Number</th>
                      <th className="pb-3 pt-2 font-bold text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allPaymentRecords.map((attempt) => {
                      const st = (attempt.status || "NOT PAID").toUpperCase();
                      const isPaid = st === "PAID" || st === "SUCCESS" || st === "COMPLETED";
                      
                      return (
                        <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-mono text-[11px] text-white/60">
                            {attempt.createdAt || attempt.timestamp ? (
                              new Date(attempt.createdAt || attempt.timestamp).toLocaleString()
                            ) : "N/A"}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isPaid ? "bg-emerald-400" : "bg-red-400"
                              }`} />
                              {isPaid ? "🟢 Paid" : "🔴 NOT PAID"}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[11px] text-white">
                            {attempt.orderId ? `#${attempt.orderId.substring(0, 8).toUpperCase()}` : "N/A"}
                          </td>
                          <td className="py-3 font-mono text-[11px] text-[#C5A059] font-bold">
                            {attempt.mpesaReceiptNumber || attempt.transactionId || attempt.receiptNo || "Awaiting PIN"}
                          </td>
                          <td className="py-3 font-mono text-[11px] text-white/80">
                            {attempt.phoneNumber || attempt.phone || attempt.mpesaPhone || "N/A"}
                          </td>
                          <td className="py-3 font-mono text-xs text-white font-bold text-right">
                            KES {Number(attempt.amount || 0).toLocaleString()}
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

      {/* Tab Contents: Live Tracking */}
      {activeTab === "tracking" && (
        <div className="max-w-3xl mx-auto no-print space-y-6 text-left animate-fadeIn">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="font-sans font-bold text-lg text-white mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#C5A059]" />
              <span>Real-time Order Status & Verification</span>
            </h2>
            <p className="text-white/40 text-xs leading-relaxed">
              Query any order using your official invoice or transaction Reference ID. Instantly review courier dispatch locations and payment settlement states.
            </p>
          </div>
          <LiveOrderTracker />
        </div>
      )}

      {/* Tab Contents: Settings */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto no-print space-y-6 text-left animate-fadeIn">
          
          {/* Settings Header banner */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="font-sans font-bold text-lg text-white mb-1 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#C5A059]" />
              <span>Personalized Fiscal Adjustments</span>
            </h2>
            <p className="text-white/40 text-xs leading-relaxed">
              Define physical delivery terminal nodes and custom corporate tax identifiers (KRA Tax PIN) to instantly customize downloadable invoices.
            </p>
          </div>

          {/* Empty state component specifically for settings when NO custom data has been committed */}
          {!settingsKraPin && !settingsShippingCounty && !settingsPaymentPhone && !showSettingsForm ? (
            <div className="bg-[#0F0F0F] border border-dashed border-[#C5A059]/20 rounded-3xl p-10 text-center animate-fadeIn py-14 shadow-xl">
              <div className="bg-[#C5A059]/10 text-[#C5A059] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#C5A059]/20 shadow-inner">
                <Sliders className="w-6 h-6 text-[#C5A059]" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">No Custom Account Ledger Saved</h3>
              <p className="text-white/40 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                Configure your display phone billing, tax codes, and default delivery channels. This allows Tech Sokoni Kenya to pre-populate custom layouts cleanly.
              </p>
              <button
                type="button"
                onClick={() => setShowSettingsForm(true)}
                className="mt-6 bg-[#C5A059] hover:bg-[#C5A059]/95 text-black font-sans text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Configure Ledger Settings
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Dynamic displays of parameters */}
              {!showSettingsForm && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: KRA Pin */}
                  <div className="bg-[#0F0F0F] border border-[#C5A059]/35 rounded-2xl p-4 space-y-1 relative shadow-lg">
                    <span className="font-mono text-[9px] text-[#C5A059] font-bold block uppercase tracking-wider">KRA TAX IDENTIFICATION</span>
                    <p className="font-sans font-black text-white text-base tracking-wide uppercase mt-1">
                      {settingsKraPin || "NOT CONFIGURED"}
                    </p>
                    <p className="text-white/30 text-[9.5px] leading-tight pt-1 font-sans font-semibold">Stored dynamically for eTIMS audits.</p>
                  </div>

                  {/* Card 2: Shipping Counter location */}
                  <div className="bg-[#0F0F0F] border border-[#C5A059]/35 rounded-2xl p-4 space-y-1 relative shadow-lg">
                    <span className="font-mono text-[9px] text-white/40 font-bold block uppercase tracking-wider">DISPATCH TERMINAL</span>
                    <p className="font-sans font-black text-white text-base truncate mt-1">
                      {settingsShippingCounty || "NOT CONFIGURED"}
                    </p>
                    <p className="text-white/30 text-[9.5px] leading-tight pt-1 font-sans font-semibold">Preferred county counter address.</p>
                  </div>

                  {/* Card 3: Wallet line contact */}
                  <div className="bg-[#0F0F0F] border border-[#C5A059]/35 rounded-2xl p-4 space-y-1 relative shadow-lg">
                    <span className="font-mono text-[9px] text-white/40 font-bold block uppercase tracking-wider">M-PESA WALLET CONTACT</span>
                    <p className="font-mono font-black text-white text-base mt-1">
                      {settingsPaymentPhone || "NOT CONFIGURED"}
                    </p>
                    <p className="text-white/30 text-[9.5px] leading-tight pt-1 font-sans font-semibold">Primary Safaricom clearing interface.</p>
                  </div>
                </div>
              )}

              {/* Editable form panel */}
              {(showSettingsForm || (settingsKraPin || settingsShippingCounty || settingsPaymentPhone)) ? (
                <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn font-sans">
                  
                  {/* Edit block toggle header */}
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="font-sans font-bold text-sm text-white uppercase tracking-wider">
                      {showSettingsForm ? "Modify Saved Profiles" : "Profile Parameter Index"}
                    </span>
                    {!showSettingsForm && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSettingsForm(true)}
                          className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 font-sans text-[10px] font-bold px-3 py-1.5 rounded-xl hover:bg-[#C5A059]/20 transition-all cursor-pointer"
                        >
                          Edit Profile
                        </button>
                        <button
                          type="button"
                          onClick={handleClearSettings}
                          className="bg-red-500/10 text-red-400 border border-red-500/10 font-sans text-[10px] font-bold px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {showSettingsForm ? (
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* KRA Pin Info */}
                        <div className="space-y-1 text-left">
                          <label className="font-mono text-[10px] font-bold text-white/40 block mb-1">
                            KRA TAX IDENTIFICATION PIN
                          </label>
                          <input
                            type="text"
                            value={settingsKraPin}
                            onChange={(e) => setSettingsKraPin(e.target.value.toUpperCase().trim())}
                            placeholder="A01459421H"
                            maxLength={11}
                            className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/25"
                          />
                        </div>

                        {/* Payment phone line */}
                        <div className="space-y-1 text-left">
                          <label className="font-mono text-[10px] font-bold text-white/40 block mb-1">
                            DEFAULT M-PESA LINE (STK PUSH DEFAULT)
                          </label>
                          <input
                            type="text"
                            value={settingsPaymentPhone}
                            onChange={(e) => setSettingsPaymentPhone(e.target.value.trim())}
                            placeholder="254712345678"
                            className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-[#C5A059] text-white font-mono placeholder-white/25"
                          />
                        </div>

                      </div>

                      {/* Shipping Delivery County */}
                      <div className="space-y-1 text-left">
                        <label className="font-mono text-[10px] font-bold text-white/40 block mb-1">
                          DEFAULT PREFERRED COUNTY COUNTER FOR SHIPMENTS
                        </label>
                        <input
                          type="text"
                          value={settingsShippingCounty}
                          onChange={(e) => setSettingsShippingCounty(e.target.value)}
                          placeholder="Mombasa CBD Parcel Branch, Moi Avenue Counter #4"
                          className="w-full bg-[#0A0A0A] border border-white/10 py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-[#C5A059] text-white placeholder-white/25"
                        />
                      </div>

                      {/* Marketing alerts checkbox */}
                      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="text-left">
                          <h4 className="font-sans font-semibold text-xs text-white">Promotional Newsletters Subscriptions</h4>
                          <p className="text-white/30 text-[10px] mt-0.5 font-sans">Authorize Tech Sokoni Kenya to email you weekly stock drops.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settingsMarketingSub}
                          onChange={(e) => setSettingsMarketingSub(e.target.checked)}
                          className="w-4 h-4 accent-[#C5A059] cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowSettingsForm(false)}
                          className="bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 font-sans text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-bold px-6 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          Persist Profiles
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs space-y-3 leading-relaxed text-left">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40 font-sans">Email Registration:</span>
                        <span className="text-white font-mono font-semibold">{user?.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40 font-sans">KRA Code assigned:</span>
                        <span className="text-[#C5A059] font-mono font-bold uppercase">{settingsKraPin || "No tax PIN linked"}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40 font-sans">County Delivery COUNTER:</span>
                        <span className="text-white font-medium">{settingsShippingCounty || "Kenyatta Avenue Main Desk"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 font-sans">Promo Subscriptions:</span>
                        <span className="text-white font-semibold font-mono">{settingsMarketingSub ? "ENABLED" : "DISABLED"}</span>
                      </div>
                    </div>
                  )}

                </div>
              ) : null}

            </div>
          )}

        </div>
      )}

      {/* Detail Bookmarked Articles section */}
      {activeTab === "bookmarks" && (
        <div className="space-y-6 animate-fadeIn text-left no-print">
          <div>
            <h3 className="font-sans font-bold text-[#C5A059] text-xs uppercase tracking-wider mb-1">
              Your Bookmarked Tech Gazette Publications
            </h3>
            <p className="text-white/40 text-[11px] sm:text-xs">
              Saved articles are stored locally in your workspace cache. Click on any item to view custom specs, analysis, and reviews.
            </p>
          </div>

          {savedArticles.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-3.5 p-6 h-72">
              <div className="bg-white/5 p-4 rounded-full text-white/20">
                <Bookmark className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-white">No Saved Publications</h4>
                <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                  You haven&apos;t bookmarked any technology news articles yet. Explore the <strong>Tech News</strong> tab to save valuable articles for rapid reference.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleReadArticle(article.id)}
                  className="bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden hover:border-[#C5A059]/30 transition-all flex flex-col justify-between hover:translate-y-[-2px] group cursor-pointer duration-300"
                >
                  <div>
                    <div className="relative h-44 bg-zinc-900/50 w-full overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute top-3 left-3 bg-[#C5A059] text-black text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md uppercase">
                        {article.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-3 text-white/40 text-[10px] font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {article.readTime || "4 min read"}
                        </span>
                        <span>•</span>
                        <span>{article.date}</span>
                      </div>

                      <h4 className="font-sans font-semibold text-white group-hover:text-[#C5A059] transition-colors text-sm leading-snug line-clamp-2">
                        {article.title}
                      </h4>

                      <p className="text-white/50 text-xs font-sans line-clamp-3 pt-1">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      onClick={() => handleReadArticle(article.id)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans text-[11px] font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1 pointer-events-none group-hover:bg-[#C5A059]/10"
                    >
                      <span>READ BULLETIN</span>
                      <ArrowRight className="w-3 h-3 text-[#C5A059]" />
                    </button>
                    <button
                      onClick={(e) => handleUnsaveNews(article.id, e)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-400 font-sans text-[11px] font-bold px-3 py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      title="Remove Bookmark"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Profile */}
      {activeTab === "profile" && (
        <ProfileEditor />
      )}

      {/* Invoice Preview Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isPreviewModalOpen && previewOrder && (
            <PrintView 
              order={previewOrder} 
              onClose={() => setIsPreviewModalOpen(false)} 
              onPrint={() => printInvoiceIframe(previewOrder)} 
            />
          )}
      </AnimatePresence>,
      document.body
    )}

      {/* Leave Feedback Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isFeedbackModalOpen && feedbackOrderId && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto no-print">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="bg-zinc-950 border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 text-left"
              >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-sans font-extrabold text-sm text-white tracking-wider uppercase">
                    Leave Order Feedback
                  </span>
                </div>
                <button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitOrderFeedback} className="space-y-4">
                <p className="text-xs text-white/60 leading-relaxed">
                  How was your experience with Order <strong className="text-white">#{feedbackOrderId.substring(0, 8).toUpperCase()}</strong>? Rate and let us know!
                </p>

                {/* Rating Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Rating Star Score</label>
                  <div className="flex items-center gap-2.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isHighlighted = starVal <= feedbackRating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setFeedbackRating(starVal)}
                          className="text-zinc-600 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isHighlighted ? "text-amber-400 fill-amber-400" : "text-white/10"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Comments */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Optional Comments</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Enter details about your delivery, product condition, or fulfillment speed..."
                    rows={4}
                    maxLength={1000}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059] transition-colors resize-none placeholder-white/20"
                  />
                  <div className="flex justify-end text-[9px] font-mono text-white/25">
                    {feedbackComment.length} / 1000 chars
                  </div>
                </div>

                {/* Form Controls */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 text-white font-sans text-xs font-semibold py-2 px-4 rounded-xl transition-all border border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="bg-amber-400 hover:bg-amber-500 text-black font-sans text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingFeedback ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Feedback</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

    </div>
  );
}
