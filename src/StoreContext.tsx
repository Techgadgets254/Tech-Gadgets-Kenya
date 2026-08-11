/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  limit,
  orderBy,
  documentId,
  or
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { Product, Order, OrderItem, UserProfile, Affiliate, ProductReview, TransactionFeedback, CompanyProfile, CartToast, BrowsingHistoryItem } from "./types";
import { DEFAULT_PRODUCTS } from "./data";
import { normalizeBrandName } from "./lib/brandUtils";

interface ToastNotification {
  id: string;
  orderId: string;
  customerName: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  timestamp: number;
}

interface StoreContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  authLoading: boolean;
  products: Product[];
  orders: Order[];
  cart: { product: Product; quantity: number }[];
  activeView: "home" | "shop" | "product-details" | "checkout" | "client-dashboard" | "admin-dashboard" | "news" | "return-policy";
  selectedProductId: string | null;
  selectedOrder: Order | null;
  invoiceOrderId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setInvoiceOrderId: (id: string | null) => void;
  setActiveView: (view: "home" | "shop" | "product-details" | "checkout" | "client-dashboard" | "admin-dashboard" | "news" | "return-policy") => void;
  setSelectedProductId: (id: string | null) => void;
  setSelectedOrder: (order: Order | null) => void;
  
  // Custom interactive lists
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompareList: () => void;
  isCompareOverlayOpen: boolean;
  setIsCompareOverlayOpen: (open: boolean) => void;
  notifications: ToastNotification[];
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  addCustomNotification: (message: string, orderId?: string) => void;
  cartToasts: CartToast[];
  dismissCartToast: (id: string) => void;
  
  // Auth Functions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Cart Actions
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // Checkout & Simulation Payments
  createCheckoutOrder: (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    mpesaPhone: string;
    totalAmount?: number;
    referralCode?: string;
    paymentProvider?: string;
  }) => Promise<Order | null>;
  initializeMegaPayTransaction: (orderId: string, email: string, amount: number, phone?: string) => Promise<{ success: boolean; mode: "real" | "simulated"; authUrl?: string; reference?: string; message?: string }>;
  verifyMegaPayTransaction: (orderId: string, reference: string) => Promise<{ success: boolean; receiptNo?: string; message: string }>;
  initializePaystackTransaction: (orderId: string, email: string, amount: number, phone?: string) => Promise<{ success: boolean; mode: "real" | "simulated"; authUrl?: string; reference?: string; message?: string }>;
  verifyPaystackTransaction: (orderId: string, reference: string) => Promise<{ success: boolean; receiptNo?: string; message: string }>;
  
  // Admin Product Actions
  addProduct: (productData: Omit<Product, "id">) => Promise<void>;
  editProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  
  // Flash Offer Actions
  addFlashOffer: (productId: string, data: { flashPrice: number; flashStart?: string | null; flashExpiry: string; flashBanner: string }) => Promise<void>;
  removeFlashOffer: (productId: string) => Promise<void>;
  clearAllFlashOffers: () => Promise<void>;

  // Admin Order Actions
  updateOrderStatus: (
    id: string, 
    paymentStatus: Order["paymentStatus"], 
    shippingStatus: Order["shippingStatus"], 
    receiptNo?: string,
    courierDetails?: { courierName?: string; courierWaybill?: string; courierPhone?: string }
  ) => Promise<void>;
  subscribeNewsletter: (email: string, options?: { stockArrivals: boolean; priceDrops: boolean }) => Promise<boolean>;

  // Affiliate Management
  affiliates: Affiliate[];
  addAffiliate: (data: Omit<Affiliate, "id" | "createdAt">) => Promise<void>;
  toggleAffiliate: (id: string, active: boolean) => Promise<void>;
  deleteAffiliate: (id: string) => Promise<void>;

  // Newly Added Features
  theme: "light" | "dark";
  toggleTheme: () => void;
  submitProductReview: (productId: string, rating: number, comment: string, name: string) => Promise<void>;
  importProductsCSV: (csvContent: string, onProgress?: (progress: number) => void) => Promise<{ addedCount: number; logs: any[]; error?: string }>;
  syncInventoryStockCSV: (csvContent: string, onProgress?: (progress: number) => void) => Promise<{ updatedCount: number; addedCount: number; logs: any[]; error?: string }>;
  registerPriceAlert: (productId: string, productName: string, email: string, whatsapp: string, targetPrice: number, currentPrice: number) => Promise<boolean>;
  registerProductRestockRequest: (productId: string, productName: string, productImage: string, email: string, whatsapp: string) => Promise<boolean>;
  productsLoading: boolean;
  productsLimit: number;
  hasMoreProducts: boolean;
  loadMoreProducts: () => void;
  productReviews: ProductReview[];
  transactionFeedback: TransactionFeedback[];
  submitTransactionFeedback: (orderId: string, rating: number, comment: string) => Promise<void>;
  companyProfile: CompanyProfile | null;
  updateCompanyProfile: (data: Omit<CompanyProfile, "id" | "updatedAt">) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: "login" | "signup" | "reset";
  setAuthModalMode: (mode: "login" | "signup" | "reset") => void;
  browsingHistory: BrowsingHistoryItem[];
  recordProductView: (product: Product) => Promise<void>;
  clearBrowsingHistory: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("tsk_products_cache");
      const cacheTime = localStorage.getItem("tsk_products_cache_time");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Loaded products from client-side cache (progressive rendering & offline support)");
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading products cache from localStorage:", e);
    }
    return [];
  });

  const [flashOffers, setFlashOffers] = useState<any[]>([]);

  const products = React.useMemo(() => {
    return dbProducts.map((p) => {
      const offer = flashOffers.find((o) => o.productId === p.id || o.id === p.id);
      if (offer) {
        return {
          ...p,
          flashPrice: offer.flashPrice,
          flashStart: offer.flashStart || null,
          flashExpiry: offer.flashExpiry,
          flashBanner: offer.flashBanner,
        };
      } else {
        return {
          ...p,
          flashPrice: null,
          flashStart: null,
          flashExpiry: null,
          flashBanner: null,
        };
      }
    });
  }, [dbProducts, flashOffers]);

  const [productsLoading, setProductsLoading] = useState(() => {
    try {
      const cacheTime = localStorage.getItem("tsk_products_cache_time");
      if (cacheTime) {
        const parsedTime = parseInt(cacheTime, 10);
        if (Date.now() - parsedTime < 5 * 60 * 1000) {
          return false; // Valid cache, don't trigger loading screen
        }
      }
    } catch (e) {}
    return true;
  });
  const [productsLimit, setProductsLimit] = useState(12);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  // Global Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup" | "reset">("login");

  const loadMoreProducts = () => {
    setProductsLimit((prev) => prev + 12);
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [activeView, setActiveView] = useState<StoreContextType["activeView"]>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === "/return-policy" || path === "/returns" || params.get("view") === "return-policy") {
        return "return-policy";
      }
    }
    return "home";
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [transactionFeedback, setTransactionFeedback] = useState<TransactionFeedback[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  // Real-time live-sync for the new Product Reviews collection
  useEffect(() => {
    const reviewsColRef = collection(db, "reviews");
    const unsubscribe = onSnapshot(reviewsColRef, (snapshot) => {
      const items: ProductReview[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as ProductReview);
      });
      // Sort by createdAt descending (newest reviews first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProductReviews(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "reviews");
    });
    return unsubscribe;
  }, []);

  // Real-time live-sync for transaction feedback
  useEffect(() => {
    const feedbackColRef = collection(db, "transaction_feedback");
    const unsubscribe = onSnapshot(feedbackColRef, (snapshot) => {
      const items: TransactionFeedback[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as TransactionFeedback);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactionFeedback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "transaction_feedback");
    });
    return unsubscribe;
  }, []);

  // Real-time live-sync for company profile settings document
  useEffect(() => {
    const companyProfileDocRef = doc(db, "company_profile", "default");
    const unsubscribe = onSnapshot(companyProfileDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setCompanyProfile({ id: snapshot.id, ...snapshot.data() } as CompanyProfile);
      } else {
        setCompanyProfile(null);
      }
    }, (error) => {
      console.warn("Company profile snapshot listener warning:", error);
    });
    return unsubscribe;
  }, []);

  // Real-time live-sync for site-wide SEO metadata
  useEffect(() => {
    const seoDocRef = doc(db, "seo_metadata", "site");
    const unsubscribe = onSnapshot(seoDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.title) {
          document.title = data.title;
        }
        if (data.description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.setAttribute("name", "description");
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute("content", data.description);
        }
        if (data.keywords) {
          let metaKey = document.querySelector('meta[name="keywords"]');
          if (!metaKey) {
            metaKey = document.createElement("meta");
            metaKey.setAttribute("name", "keywords");
            document.head.appendChild(metaKey);
          }
          metaKey.setAttribute("content", data.keywords);
        }
      }
    }, (error) => {
      console.warn("Seo metadata listener warning:", error);
    });
    return unsubscribe;
  }, []);

  // Lightweight activity logger that tracks page view counts in Firestore
  useEffect(() => {
    const logPageView = async () => {
      try {
        const activityCol = collection(db, "activity_logs");
        await addDoc(activityCol, {
          type: "page_view",
          target: activeView,
          userId: auth.currentUser?.uid || null,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Soft non-blocking warning logging page view:", err);
      }
    };
    logPageView();
  }, [activeView]);

  // Lightweight activity logger that tracks popular search terms (debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    
    const handler = setTimeout(async () => {
      try {
        const activityCol = collection(db, "activity_logs");
        await addDoc(activityCol, {
          type: "search",
          target: searchQuery.trim(),
          userId: auth.currentUser?.uid || null,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Soft non-blocking warning logging search query:", err);
      }

      try {
        const searchQueriesCol = collection(db, "search_queries");
        await addDoc(searchQueriesCol, {
          query: searchQuery.trim(),
          userId: auth.currentUser?.uid || null,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "search_queries");
      }
    }, 1200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Theme state with localstorage sync toggling
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const cached = localStorage.getItem("tgk_active_theme");
    return (cached === "light" || cached === "dark") ? cached : "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("tgk_active_theme", next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Wishlist and Compare States
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOverlayOpen, setIsCompareOverlayOpen] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [cartToasts, setCartToasts] = useState<CartToast[]>([]);

  const dismissCartToast = (id: string) => {
    setCartToasts(prev => prev.filter(t => t.id !== id));
  };

  const showCartToast = (product: Product) => {
    const newToast = {
      id: Math.random().toString(36).substring(2, 9),
      productName: product.name,
      productImage: product.image,
      price: product.price
    };
    setCartToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setCartToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  // Keep a ref to track real-time status changes cleanly in firestore listener
  const prevStatusesRef = React.useRef<Record<string, { shipping: string; payment: string }>>({});
  const isFirstLoadRef = React.useRef(true);

  // Sync Wishlist to localStorage and persistent 'saved_items' collection in Firestore
  useEffect(() => {
    if (!user) {
      const cachedWish = localStorage.getItem("tech_gadgets_ke_wishlist");
      if (cachedWish) {
        try {
          setWishlist(JSON.parse(cachedWish));
        } catch (e) {
          console.error(e);
        }
      } else {
        setWishlist([]);
      }
      return;
    }

    const savedItemsRef = collection(db, "saved_items");
    const q = query(savedItemsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productIds: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.productId) {
          productIds.push(data.productId);
        }
      });
      setWishlist(productIds);
      localStorage.setItem("tech_gadgets_ke_wishlist", JSON.stringify(productIds));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "saved_items");
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    const isSaved = wishlist.includes(productId);
    const updated = isSaved
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];
    
    setWishlist(updated);
    localStorage.setItem("tech_gadgets_ke_wishlist", JSON.stringify(updated));

    if (user) {
      try {
        const savedItemsRef = collection(db, "saved_items");
        if (isSaved) {
          const q = query(savedItemsRef, where("userId", "==", user.uid), where("productId", "==", productId));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        } else {
          const newDocPayload = {
            userId: user.uid,
            productId: productId,
            createdAt: new Date().toISOString()
          };
          await addDoc(savedItemsRef, newDocPayload);
        }

        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { wishlist: updated });
        } catch (err) {
          // Soft non-blocking legacy update fallback
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "saved_items");
      }
    }
  };

  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products side-by-side.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const clearCompareList = () => setCompareList([]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  const addCustomNotification = (message: string, orderId?: string) => {
    const newNotif: ToastNotification = {
      id: `custom-${Date.now()}-${Math.random()}`,
      orderId: orderId || "",
      customerName: userProfile?.name || "Customer",
      oldStatus: "Pending",
      newStatus: "Alert",
      message: message,
      timestamp: Date.now()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Browsing History State and Firestore Synchronization
  const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistoryItem[]>(() => {
    try {
      const cached = localStorage.getItem("tsk_browsing_history_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const getActiveUserId = React.useCallback(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    if (userProfile?.uid) return userProfile.uid;
    let guestId = localStorage.getItem("tsk_guest_id");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("tsk_guest_id", guestId);
    }
    return guestId;
  }, [userProfile]);

  useEffect(() => {
    const currentUid = getActiveUserId();
    const historyColRef = collection(db, "browsing_history");
    const q = query(historyColRef, where("userId", "==", currentUid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BrowsingHistoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as BrowsingHistoryItem);
      });
      items.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
      setBrowsingHistory(items);
      try {
        localStorage.setItem("tsk_browsing_history_cache", JSON.stringify(items));
      } catch (e) {}
    }, (error) => {
      console.warn("Browsing history snapshot listener warning:", error);
    });

    return () => unsubscribe();
  }, [user, userProfile, getActiveUserId]);

  const recordProductView = React.useCallback(async (product: Product) => {
    if (!product || !product.id) return;
    const currentUid = getActiveUserId();
    const nowIso = new Date().toISOString();

    const newItem: BrowsingHistoryItem = {
      userId: currentUid,
      productId: product.id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      viewedAt: nowIso
    };

    // Optimistic local state update with duplicate guard
    setBrowsingHistory((prev) => {
      if (prev.length > 0 && prev[0].productId === product.id) {
        return prev;
      }
      const filtered = prev.filter(item => item.productId !== product.id);
      const updated = [newItem, ...filtered];
      try {
        localStorage.setItem("tsk_browsing_history_cache", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const historyColRef = collection(db, "browsing_history");
      await addDoc(historyColRef, newItem);
    } catch (err) {
      console.warn("Soft non-blocking warning saving browsing history item:", err);
    }
  }, [getActiveUserId]);

  const clearBrowsingHistory = React.useCallback(async () => {
    const currentUid = getActiveUserId();
    setBrowsingHistory([]);
    try {
      localStorage.removeItem("tsk_browsing_history_cache");
      const historyColRef = collection(db, "browsing_history");
      const q = query(historyColRef, where("userId", "==", currentUid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Error clearing browsing history in Firestore:", err);
    }
  }, [getActiveUserId]);

  const handleSetSelectedProductId = React.useCallback((id: string | null) => {
    setSelectedProductId(id);
  }, []);

  const handleSetActiveView = (view: StoreContextType["activeView"]) => {
    if (view === "checkout" && !user) {
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
      addCustomNotification("Please sign in or sign up to finalize your secure checkout!");
      return;
    }
    setActiveView(view);
    if (typeof window !== "undefined" && window.history) {
      if (view === "return-policy") {
        window.history.pushState({}, "", "/return-policy");
      } else if (view === "home") {
        window.history.pushState({}, "", "/");
      } else {
        window.history.pushState({}, "", `/?view=${view}`);
      }
    }
  };

  // Sync browser popstate (back/forward) and direct path updates
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === "/return-policy" || path === "/returns" || params.get("view") === "return-policy") {
        setActiveView("return-policy");
      } else {
        const viewParam = params.get("view");
        if (viewParam && ["shop", "product-details", "checkout", "client-dashboard", "admin-dashboard", "news"].includes(viewParam)) {
          setActiveView(viewParam as any);
        } else if (path === "/") {
          setActiveView("home");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync Cart to localStorage
  useEffect(() => {
    const cachedCart = localStorage.getItem("tech_gadgets_ke_cart");
    if (cachedCart) {
      try {
        setCart(JSON.parse(cachedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tech_gadgets_ke_cart", JSON.stringify(cart));
  }, [cart]);

  // 1. Authentication State Change & Synced User profile creation
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          const isAdminEmail = 
            currentUser.email === "techgadgetsk@gmail.com" || 
            currentUser.email === "admin@techgadgetskenya.co.ke";
            
          let initialProfile: UserProfile;

          if (!userDocSnap.exists()) {
            initialProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              name: currentUser.displayName || "Valued Client",
              role: isAdminEmail ? "admin" : "customer",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          } else {
            initialProfile = userDocSnap.data() as UserProfile;
            if (isAdminEmail && initialProfile.role !== "admin") {
              await updateDoc(userDocRef, { role: "admin" });
              initialProfile.role = "admin";
            }
            setUserProfile(initialProfile);
          }

          // Real-time listener for the user profile document so database role promotion takes effect instantly
          unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            }
          }, (error) => {
            console.error("Real-time profile sync error:", error);
          });

        } catch (error) {
          console.error("Error loading user profile: ", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        const savedCustomUser = localStorage.getItem("tgk_custom_user");
        if (savedCustomUser) {
          try {
            const parsed = JSON.parse(savedCustomUser);
            setUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.name } as any);
            setUserProfile({
              uid: parsed.uid,
              email: parsed.email,
              name: parsed.name,
              role: parsed.role,
              createdAt: parsed.createdAt || new Date().toISOString()
            });
          } catch (e) {
            console.error("Failed to restore custom user:", e);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Real-time Affiliates listener
  useEffect(() => {
    const affiliatesColRef = collection(db, "affiliates");
    const unsubscribe = onSnapshot(affiliatesColRef, (snapshot) => {
      const list: Affiliate[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Affiliate);
      });
      setAffiliates(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "affiliates");
    });
    return unsubscribe;
  }, []);

  // Real-time Flash Offers listener
  useEffect(() => {
    const flashColRef = collection(db, "flash_offers");
    const unsubscribe = onSnapshot(flashColRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setFlashOffers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "flash_offers");
    });
    return unsubscribe;
  }, []);

  // 2. Load Products and Real-time Snapshot with Auto-Seeding
  useEffect(() => {
    const productsColRef = collection(db, "products");
    if (dbProducts.length === 0) {
      setProductsLoading(true);
    }

    let activeUnsubscribe: (() => void) | null = null;

    const setupListener = (useOrdering: boolean) => {
      let productsQuery;
      if (useOrdering) {
        try {
          productsQuery = query(productsColRef, orderBy("createdAt", "desc"));
        } catch (e) {
          console.warn("Could not form sorted query, reverting to unordered:", e);
          productsQuery = query(productsColRef);
        }
      } else {
        productsQuery = query(productsColRef);
      }

      const unsubscribe = onSnapshot(productsQuery, async (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.deleted !== true) {
            items.push({
              id: d.id,
              ...data,
              brand: normalizeBrandName(data.brand || "Generic"),
            } as Product);
          }
        });
        
        // Seed if zero products exist in the entire collection (snapshot is completely empty)
        if (snapshot.empty) {
          console.log("No products found in Firestore. Seeding premium selection...");
          // Fallback to local default products immediately so guests can see products without logging in
          const fallbackProducts = DEFAULT_PRODUCTS.map((item, i) => ({
            id: `default-${i}`,
            ...item,
            brand: normalizeBrandName(item.brand),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })) as Product[];
          setDbProducts(fallbackProducts);
          setProductsLoading(false);

          // Only attempt to seed if current user is admin
          const isAdminUser = 
            user?.email === "techgadgetsk@gmail.com" || 
            userProfile?.role === "admin" ||
            userProfile?.["admin-claims"] === true ||
            userProfile?.["admin-claims"] === "admin";

          if (isAdminUser) {
            try {
              for (const item of DEFAULT_PRODUCTS) {
                await addDoc(productsColRef, {
                  ...item,
                  brand: normalizeBrandName(item.brand),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            } catch (e) {
              console.warn("Could not seed default products to empty Firestore:", e);
            }
          }
        } else {
          // Display strictly the actual inventory items stored in Firestore
          const sorted = [...items].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setDbProducts(sorted);
          try {
            localStorage.setItem("tsk_products_cache", JSON.stringify(sorted));
            localStorage.setItem("tsk_products_cache_time", Date.now().toString());
          } catch (err) {
            console.warn("Failed to write products to localStorage cache:", err);
          }
          setHasMoreProducts(false);
          setProductsLoading(false);
        }
      }, (error) => {
        console.warn("Products onSnapshot failed on ordering:", error);
        if (useOrdering) {
          if (activeUnsubscribe) activeUnsubscribe();
          setupListener(false);
        } else {
          handleFirestoreError(error, OperationType.LIST, "products");
          setProductsLoading(false);
        }
      });

      activeUnsubscribe = unsubscribe;
    };

    setupListener(true);

    return () => {
      if (activeUnsubscribe) {
        activeUnsubscribe();
      }
    };
  }, [productsLimit]);

  // Sync shared links of specific products dynamically to local state on page launch
  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      let prodId = params.get("product");
      
      // Also look for /product/productId pattern in the URL pathname
      if (!prodId) {
        const pathParts = window.location.pathname.split("/");
        // pathParts format: ["", "product", "productId"]
        if (pathParts[1] === "product" && pathParts[2]) {
          prodId = pathParts[2];
        }
      }

      if (prodId) {
        const prodExists = products.some((p) => p.id === prodId);
        if (prodExists) {
          setSelectedProductId(prodId);
          setActiveView("product-details");
        }
      }
    }
  }, [products]);

  // 3. Load Orders Sync with Real-time Snapshots (if signed in or guest with local orders)
  useEffect(() => {
    let targetRef: any = null;
    let guestOrderIds: string[] = [];
    let guestEmail = "";

    try {
      const savedIds = localStorage.getItem("tgk_guest_order_ids");
      if (savedIds) {
        guestOrderIds = JSON.parse(savedIds);
      }
      guestEmail = localStorage.getItem("tgk_guest_email") || "";
    } catch (e) {}

    if (!user) {
      if (guestOrderIds.length === 0 && !guestEmail) {
        setOrders([]);
        prevStatusesRef.current = {};
        isFirstLoadRef.current = true;
        return;
      }

      if (guestOrderIds.length > 0 && guestEmail) {
        targetRef = query(
          collection(db, "orders"),
          or(where(documentId(), "in", guestOrderIds), where("customerEmail", "==", guestEmail.toLowerCase()))
        );
      } else if (guestOrderIds.length > 0) {
        targetRef = query(collection(db, "orders"), where(documentId(), "in", guestOrderIds));
      } else {
        targetRef = query(collection(db, "orders"), where("customerEmail", "==", guestEmail.toLowerCase()));
      }
    } else {
      const userIsAdmin = 
        user.email === "techgadgetsk@gmail.com" || 
        userProfile?.role === "admin" ||
        userProfile?.["admin-claims"] === true ||
        userProfile?.["admin-claims"] === "admin";
      
      // Non-admin customer accounts must only retrieve their own orders or matching their verified email to conform with security rules
      targetRef = userIsAdmin
        ? collection(db, "orders")
        : query(collection(db, "orders"), or(where("userId", "==", user.uid), where("customerEmail", "==", user.email.toLowerCase())));
    }

    const unsubscribe = onSnapshot(targetRef, (snapshot) => {
      const allOrders: Order[] = [];
      const changedAlerts: ToastNotification[] = [];

      snapshot.forEach((d) => {
        const orderData = { id: d.id, ...d.data() } as Order;
        allOrders.push(orderData);

        // Real-time Status Change Checker (Shipping & Payment)
        const orderId = d.id;
        const currentShippingStatus = orderData.shippingStatus || "Processing";
        const currentPaymentStatus = orderData.paymentStatus || "Pending";
        const cached = prevStatusesRef.current[orderId];

        // Ensure we inspect status changes for existing records after we've initialized them once
        if (!isFirstLoadRef.current && cached !== undefined) {
          if (cached.shipping !== currentShippingStatus) {
            changedAlerts.push({
              id: `ship-${orderId}-${Date.now()}-${Math.random()}`,
              orderId,
              customerName: orderData.customerName || "Customer",
              oldStatus: cached.shipping,
              newStatus: currentShippingStatus,
              message: `Delivery Update: Your order #${orderId.slice(-6)} shipping status is now updated from "${cached.shipping}" to "${currentShippingStatus}"!`,
              timestamp: Date.now()
            });
          }
          if (cached.payment !== currentPaymentStatus) {
            let paymentMsg = `Payment Update: Order #${orderId.slice(-6)} database payment status has been set to "${currentPaymentStatus.toUpperCase()}"!`;
            const payUpper = currentPaymentStatus.toUpperCase();
            if (payUpper === "PAID" || payUpper === "SUCCESS" || payUpper === "COMPLETED") {
              const payCodeInfo = orderData.receiptNo ? ` (MPESA REF: ${orderData.receiptNo})` : "";
              paymentMsg = `✓ Lipa Na M-Pesa Cleared! Order #${orderId.slice(-6)} transaction resolved successfully. Cashier Clearance approved${payCodeInfo}.`;
            } else if (payUpper === "FAILED" || payUpper === "CANCELLED" || payUpper === "DECLINED") {
              paymentMsg = `✗ Transaction Alert: Order #${orderId.slice(-6)} payment status was updated to ${payUpper}. Verification declined.`;
            } else if (payUpper === "PENDING" || payUpper === "AWAITING PAYMENT") {
              paymentMsg = `⏳ Settlement Pending: Order #${orderId.slice(-6)} is in transaction processing pipeline.`;
            }

            changedAlerts.push({
              id: `pay-${orderId}-${Date.now()}-${Math.random()}`,
              orderId,
              customerName: orderData.customerName || "Customer",
              oldStatus: cached.payment,
              newStatus: currentPaymentStatus,
              message: paymentMsg,
              timestamp: Date.now()
            });
          }
        }

        // Cache the latest status
        prevStatusesRef.current[orderId] = {
          shipping: currentShippingStatus,
          payment: currentPaymentStatus
        };
      });

      // Mark first load complete once initial state mapping is finished
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }

      // If we flagged any real-time updates, trigger the user notification system toasts
      if (changedAlerts.length > 0) {
        setNotifications((prev) => [...changedAlerts, ...prev]);
      }

      // Sort newest order first
      allOrders.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setOrders(allOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "orders");
    });

    return unsubscribe;
  }, [user, userProfile]);

  // Proactively link/claim any matching guest or email orders to logged-in user
  useEffect(() => {
    if (!user || !user.email) return;

    const claimOrders = async () => {
      try {
        const uEmail = user.email!.trim().toLowerCase();
        let guestIds: string[] = [];
        try {
          const saved = localStorage.getItem("tgk_guest_order_ids");
          if (saved) guestIds = JSON.parse(saved);
        } catch (e) {}

        // Query orders matching user's email
        const emailQuery = query(collection(db, "orders"), where("customerEmail", "==", uEmail));
        const emailSnap = await getDocs(emailQuery);

        emailSnap.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            console.log(`[StoreContext Claimer] Claiming order #${docSnap.id} for user ${user.uid} (${uEmail})`);
            await updateDoc(doc(db, "orders", docSnap.id), {
              userId: user.uid,
              customerEmail: uEmail,
              updatedAt: new Date().toISOString()
            });
          }
        });

        // Query orders matching stored guest IDs
        if (guestIds.length > 0) {
          const guestQuery = query(collection(db, "orders"), where(documentId(), "in", guestIds));
          const guestSnap = await getDocs(guestQuery);

          guestSnap.forEach(async (docSnap) => {
            const data = docSnap.data();
            if (data.userId !== user.uid) {
              console.log(`[StoreContext Claimer] Claiming guest order #${docSnap.id} for user ${user.uid}`);
              await updateDoc(doc(db, "orders", docSnap.id), {
                userId: user.uid,
                customerEmail: uEmail,
                updatedAt: new Date().toISOString()
              });
            }
          });
        }
      } catch (err) {
        console.warn("[StoreContext Claimer] Error claiming user orders:", err);
      }
    };

    claimOrders();
  }, [user]);

  // Auth Functions
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await addDoc(collection(db, "auth_events"), {
          eventType: "google_login",
          status: "success",
          email: result.user.email || "google-user",
          userId: result.user.uid,
          errorMessage: "",
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to write auth event log:", err);
      }
    } catch (e: any) {
      console.error("Sign in failed:", e);
      try {
        await addDoc(collection(db, "auth_events"), {
          eventType: "google_login",
          status: "failed",
          email: "google-handshake",
          userId: "",
          errorMessage: e?.message || e?.code || "Google sign-in popup aborted",
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to write auth event log:", err);
      }
      if (e?.code === "auth/unauthorized-domain") {
        alert(
          "Firebase Authentication Domain Restriction:\n\n" +
          "Your live domain (tech-gadgets-kenya.vercel.app / Netlify) has not been authorized in your Firebase Project Console.\n\n" +
          "To enable logging in:\n" +
          "1. Go to Firebase Console -> Biometrics/Authentication -> Settings -> Authorized Domains\n" +
          "2. Add your live URL (e.g., 'tech-gadgets-kenya.vercel.app' or netlify domain)\n" +
          "3. Try logging in again! It takes a few seconds to take effect."
        );
      } else if (e?.code === "auth/popup-blocked") {
        alert("The sign-in popup was blocked by your browser settings. Please allow popups for this domain and try again.");
      } else if (e?.code === "auth/popup-closed-by-user") {
        // Silent transition or small debug log
        console.warn("User closed the login popup.");
      } else {
        alert(`Google Authentication Failed: ${e?.message || e || "Unknown Error"}`);
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("tgk_custom_user");
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setCart([]);
      setActiveView("home");
      setSelectedProductId(null);
      setSelectedOrder(null);
      setInvoiceOrderId(null);
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  // Cart actions
  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    showCartToast(product);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const isFlashActive = (p: any) => {
    if (!p.flashPrice || !p.flashExpiry) return false;
    const now = new Date();
    const expiryDate = new Date(p.flashExpiry);
    if (now > expiryDate) return false;
    if (p.flashStart) {
      const startDate = new Date(p.flashStart);
      if (now < startDate) return false;
    }
    return true;
  };

  const getCartTotal = () => {
    return cart.reduce((tot, item) => {
      const active = isFlashActive(item.product);
      const price = active ? item.product.flashPrice! : item.product.price;
      return tot + price * item.quantity;
    }, 0);
  };

  // Checkout and place order
  const createCheckoutOrder = async (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    mpesaPhone: string;
    totalAmount?: number;
    referralCode?: string;
    paymentProvider?: string;
  }) => {
    if (!user && !details.customerEmail) {
      alert("Please provide an email address for Guest Checkout");
      return null;
    }

    if (cart.length === 0) return null;

    const items: OrderItem[] = cart.map((item) => {
      const active = isFlashActive(item.product);
      const finalPrice = active ? item.product.flashPrice! : item.product.price;
      return {
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.image,
        price: finalPrice,
        quantity: item.quantity,
      };
    });

    const normalizedEmail = (details.customerEmail || user?.email || "").trim().toLowerCase();
    
    // Determine targetUserId: if current user is admin ordering for a customer, do not attach admin's UID to customer's order
    const userIsAdmin = 
      user?.email === "techgadgetsk@gmail.com" || 
      userProfile?.role === "admin" ||
      userProfile?.["admin-claims"] === true;

    let targetUserId = "cust_guest_" + Math.random().toString(36).substring(2, 11);
    if (user && (!userIsAdmin || user.email?.toLowerCase() === normalizedEmail)) {
      targetUserId = user.uid;
    }

    const orderData: Omit<Order, "id"> = {
      userId: targetUserId,
      customerName: details.customerName,
      customerEmail: normalizedEmail,
      customerPhone: details.customerPhone,
      shippingAddress: details.shippingAddress,
      items,
      totalAmount: details.totalAmount !== undefined ? details.totalAmount : getCartTotal(),
      mpesaPhone: details.mpesaPhone,
      paymentStatus: "Pending",
      shippingStatus: "Processing",
      referralCode: details.referralCode || "",
      paymentProvider: details.paymentProvider || "MegaPay",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // If guest checkout, save details to localStorage
      if (!user) {
        try {
          const savedIds = localStorage.getItem("tgk_guest_order_ids");
          const idsList = savedIds ? JSON.parse(savedIds) : [];
          idsList.push(docRef.id);
          localStorage.setItem("tgk_guest_order_ids", JSON.stringify(idsList));
          
          if (details.customerEmail) {
            localStorage.setItem("tgk_guest_email", details.customerEmail);
          }
        } catch (e) {
          console.error("Failed to save guest order to localStorage:", e);
        }
      }
      
      // Update local product inventory stock for realistic ecommerce behavior!
      try {
        if (userProfile?.role === "admin") {
          for (const cartItem of cart) {
            const productRef = doc(db, "products", cartItem.product.id);
            const newStock = Math.max(0, cartItem.product.stock - cartItem.quantity);
            await updateDoc(productRef, { stock: newStock });
          }
        }
      } catch (stockErr) {
        console.warn("Could not adjust stock directly due to permission limits, skipping local stock adjustment:", stockErr);
      }

      const createdOrder = { id: docRef.id, ...orderData } as Order;

      // Update local state immediately so new order shows up right away
      setOrders(prev => [createdOrder, ...prev]);

      // Trigger instant Email Notification to admin (techgadgetsk@gmail.com)
      try {
        fetch("/api/order/notify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: docRef.id,
            order: createdOrder,
            updateType: "New Order Placed"
          })
        }).catch(err => console.error("Async admin order email notify failed:", err));

        // Background call to WhatsApp API route (which also triggers secondary admin email fallback)
        fetch("/api/whatsapp/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: docRef.id,
            recipient: "0792620789",
            customerName: details.customerName,
            customerPhone: details.customerPhone,
            totalAmount: orderData.totalAmount,
            items: items,
            shippingAddress: details.shippingAddress
          })
        }).catch(err => console.error("Async WhatsApp notify background call failed:", err));
      } catch (notifyErr) {
        console.error("Failed triggering background notification requests:", notifyErr);
      }

      return createdOrder;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "orders");
      return null;
    }
  };

  // MegaPay transaction initializer
  const initializeMegaPayTransaction = async (orderId: string, email: string, amount: number, phone?: string) => {
    try {
      const response = await fetch("/api/megapay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, orderId, phone: phone || "" })
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text.slice(0, 150) || `Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize MegaPay checkout.");
      }

      return {
        success: data.success,
        mode: "real" as const,
        authUrl: data.authorization_url,
        reference: data.reference,
        message: data.message
      };
    } catch (e: any) {
      console.error("MegaPay transaction initialization failure:", e);
      return {
        success: false,
        mode: "real" as const,
        message: e.message || "An unexpected error occurred while communicating with MegaPay."
      };
    }
  };

  // MegaPay transaction verifier
  const verifyMegaPayTransaction = async (orderId: string, reference: string) => {
    try {
      const response = await fetch(`/api/megapay/verify/${reference}`);
      
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text.slice(0, 150) || `Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Verification query failed with MegaPay.");
      }

      if (data.success && data.status === "success" && data.receiptNo) {
        const receipt = data.receiptNo;
        const orderRef = doc(db, "orders", orderId);
        const updateData = {
          paymentStatus: "Paid" as const,
          receiptNo: receipt,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(orderRef, updateData);

        // Update local state immediately for instant UI reflection in fulfillment queue
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));

        // Trigger instant customer receipt email & admin email alert
        const matchedOrder = orders.find(o => o.id === orderId);
        const customerEmail = matchedOrder?.customerEmail || matchedOrder?.email;

        if (customerEmail) {
          fetch("/api/email/send-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              email: customerEmail,
              order: { ...(matchedOrder || {}), id: orderId, paymentStatus: "Paid", receiptNo: receipt }
            })
          }).catch(err => console.warn("Customer receipt email dispatch warning:", err));
        }

        fetch("/api/order/notify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            order: { id: orderId, paymentStatus: "Paid", receiptNo: receipt },
            updateType: `Payment Received: Order #${orderId.substring(0, 8).toUpperCase()} Paid (Ref: ${receipt})`
          })
        }).catch(err => console.error("Admin payment notification email failed:", err));

        return {
          success: true,
          status: "success",
          receiptNo: receipt,
          message: data.message || `MegaPay checkout cleared successfully! Reference: ${receipt}`
        };
      } else if (data.status === "failed" || data.status === "cancelled") {
        const orderRef = doc(db, "orders", orderId);
        const failData = {
          paymentStatus: "Failed" as const,
          cancellationReason: data.error || data.message || "Payment cancelled or failed on mobile handset.",
          updatedAt: new Date().toISOString()
        };
        await updateDoc(orderRef, failData);

        // Update local state immediately
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...failData } : o));

        return {
          success: false,
          status: "failed",
          message: data.error || data.message || "MegaPay transaction failed on mobile handset."
        };
      } else {
        return {
          success: false,
          status: "pending",
          message: data.message || "Awaiting customer M-Pesa PIN entry on phone screen..."
        };
      }
    } catch (e: any) {
      console.error("MegaPay transaction verify failure:", e);
      return {
        success: false,
        message: e.message || "Could not complete transaction status validation."
      };
    }
  };

  // Backward-compatible Paystack aliases pointing to MegaPay engine
  const initializePaystackTransaction = initializeMegaPayTransaction;
  const verifyPaystackTransaction = verifyMegaPayTransaction;

  // Add Product Form Action
  const addProduct = async (productData: Omit<Product, "id">) => {
    try {
      await addDoc(collection(db, "products"), {
        ...productData,
        brand: normalizeBrandName(productData.brand || "Generic"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "products");
    }
  };

  // Edit Product Action
  const editProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const productRef = doc(db, "products", id);
      const updates: any = {
        ...productData,
        updatedAt: new Date().toISOString(),
      };
      if (productData.brand) {
        updates.brand = normalizeBrandName(productData.brand);
      }
      await updateDoc(productRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  // Flash Offer Actions
  const addFlashOffer = async (productId: string, data: { flashPrice: number; flashStart?: string | null; flashExpiry: string; flashBanner: string }) => {
    try {
      const offerRef = doc(db, "flash_offers", productId);
      await setDoc(offerRef, {
        productId,
        flashPrice: Number(data.flashPrice),
        flashStart: data.flashStart || null,
        flashExpiry: data.flashExpiry,
        flashBanner: data.flashBanner,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `flash_offers/${productId}`);
    }
  };

  const removeFlashOffer = async (productId: string) => {
    try {
      const offerRef = doc(db, "flash_offers", productId);
      await deleteDoc(offerRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `flash_offers/${productId}`);
    }
  };

  const clearAllFlashOffers = async () => {
    try {
      const flashColRef = collection(db, "flash_offers");
      const snapshot = await getDocs(flashColRef);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "flash_offers");
    }
  };

  // Delete Product Action (Soft-deletes to Trash collection for 60 days before purge)
  const removeProduct = async (id: string) => {
    try {
      // Update local state immediately for instant, lag-free visual UI feedback
      setDbProducts(prev => prev.filter(p => p.id !== id));

      const productRef = doc(db, "products", id);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const data = productSnap.data();
        const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + sixtyDaysMs).toISOString();
        const trashPayload = {
          originalId: id,
          productData: {
            name: data.name || "Unnamed Item",
            brand: data.brand || "Generic",
            category: data.category || "Accessories",
            price: Number(data.price || 0),
            stock: Number(data.stock || 0),
            description: data.description || "",
            image: data.image || "",
            gallery: data.gallery || [],
            specifications: data.specifications || {},
            tags: data.tags || [],
            rating: data.rating || 5,
            reviews: data.reviews || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          },
          deletedAt: new Date().toISOString(),
          expiresAt // added 60-day explicit retention duration index to record
        };
        try {
          // Add to trash table
          await addDoc(collection(db, "trash"), trashPayload);
        } catch (trashErr) {
          console.error("Warning: Could not create trash log entry:", trashErr);
        }
      }
      
      // Merely update product with deleted: true
      await updateDoc(productRef, {
        deleted: true,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  // Affiliate Action Handlers
  const addAffiliate = async (data: Omit<Affiliate, "id" | "createdAt">) => {
    try {
      await addDoc(collection(db, "affiliates"), {
        ...data,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error writing affiliate to Firestore:", e);
      // Fallback local persistence just in case
      setAffiliates(prev => [
        ...prev,
        {
          id: "local-" + Math.random().toString(36).substring(2, 9),
          ...data,
          createdAt: new Date().toISOString()
        } as Affiliate
      ]);
    }
  };

  const toggleAffiliate = async (id: string, active: boolean) => {
    try {
      const ref = doc(db, "affiliates", id);
      await updateDoc(ref, { active });
    } catch (e) {
      console.error("Error updating affiliate active status in Firestore:", e);
      setAffiliates(prev => prev.map(a => a.id === id ? { ...a, active } : a));
    }
  };

  const deleteAffiliate = async (id: string) => {
    try {
      const ref = doc(db, "affiliates", id);
      await deleteDoc(ref);
    } catch (e) {
      console.error("Error deleting affiliate from Firestore:", e);
      setAffiliates(prev => prev.filter(a => a.id !== id));
    }
  };

  // Update transaction status action (e.g. Paid, processing and Shipping)
  const updateOrderStatus = async (
    id: string, 
    paymentStatus: Order["paymentStatus"], 
    shippingStatus: Order["shippingStatus"],
    receiptNo?: string,
    courierDetails?: { courierName?: string; courierWaybill?: string; courierPhone?: string }
  ) => {
    try {
      const orderRef = doc(db, "orders", id);
      const updates: any = {
        paymentStatus,
        shippingStatus,
        updatedAt: new Date().toISOString(),
      };
      if (receiptNo) {
        updates.receiptNo = receiptNo;
      }
      if (courierDetails) {
        if (courierDetails.courierName !== undefined) updates.courierName = courierDetails.courierName;
        if (courierDetails.courierWaybill !== undefined) updates.courierWaybill = courierDetails.courierWaybill;
        if (courierDetails.courierPhone !== undefined) updates.courierPhone = courierDetails.courierPhone;
      }
      await updateDoc(orderRef, updates);

      // Update local state immediately for instant UI feedback in fulfillment queue
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

      // Dispatch admin email notification on order update
      fetch("/api/order/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          order: { id, paymentStatus, shippingStatus, receiptNo, ...courierDetails },
          updateType: `Order #${id.substring(0, 8).toUpperCase()} Updated (Payment: ${paymentStatus}, Delivery: ${shippingStatus})`
        })
      }).catch(err => console.warn("Admin update email notification failed:", err));

      // Dispatch customer shipping tracking email if order is updated to "Shipped"
      if (shippingStatus === "Shipped") {
        const targetOrder = orders.find(o => o.id === id);
        const recipientEmail = targetOrder?.customerEmail || (targetOrder as any)?.guestEmail || (targetOrder as any)?.email;
        if (recipientEmail) {
          fetch("/api/order/send-shipping-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: recipientEmail,
              orderId: id,
              order: {
                ...targetOrder,
                ...updates,
                courierName: updates.courierName || targetOrder?.courierName || "Fargo Courier / G4S",
                courierWaybill: updates.courierWaybill || targetOrder?.courierWaybill || "",
                courierPhone: updates.courierPhone || targetOrder?.courierPhone || "+254 703 077 000"
              }
            })
          }).catch(err => console.warn("Customer shipping email dispatch failed:", err));
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${id}`);
    }
  };

  // Newsletter Sign Up Action
  const subscribeNewsletter = async (email: string, options?: { stockArrivals: boolean; priceDrops: boolean }): Promise<boolean> => {
    try {
      await addDoc(collection(db, "newsletters"), {
        email,
        subscribedAt: new Date().toISOString(),
        options: options || { stockArrivals: true, priceDrops: true }
      });
      return true;
    } catch (e) {
      console.error("Error subscribing to newsletter in firestore:", e);
      try {
        const storedStr = localStorage.getItem("tgk_newsletters") || "[]";
        const stored = JSON.parse(storedStr);
        stored.push({ 
          email, 
          subscribedAt: new Date().toISOString(),
          options: options || { stockArrivals: true, priceDrops: true }
        });
        localStorage.setItem("tgk_newsletters", JSON.stringify(stored));
      } catch (err) {
        console.error("Newsletter local storage fallback failed:", err);
      }
      return true;
    }
  };

  // Submit Product Review directly to the hard-separated 'reviews' collection
  const submitProductReview = async (productId: string, rating: number, comment: string, name: string) => {
    const userId = auth.currentUser?.uid || "anonymous";
    const userName = name.trim() || auth.currentUser?.displayName || "Anonymous Client";
    const ratingVal = Number(rating);
    const commentVal = comment.trim();

    try {
      const reviewsCol = collection(db, "reviews");
      await addDoc(reviewsCol, {
        productId,
        userId,
        userName,
        rating: ratingVal,
        comment: commentVal,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "reviews");
    }
  };

  // CSV Bulk Ingestion Support
  const importProductsCSV = async (
    csvContent: string,
    onProgress?: (progress: number) => void
  ): Promise<{ addedCount: number; logs: any[]; error?: string }> => {
    const logs: { row: number; itemName?: string; sku?: string; status: "success" | "skipped" | "failed"; message: string }[] = [];
    try {
      const lines = csvContent.split(/\r?\n/);
      if (lines.length < 2) {
        return { addedCount: 0, logs, error: "Empty CSV file or header-only content provided." };
      }

      const parseCSVLine = (text: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const getIndex = (col: string) => headers.findIndex(h => h.toLowerCase().trim() === col.toLowerCase().trim());
      
      const idxName = getIndex("name");
      const idxBrand = getIndex("brand");
      const idxCategory = getIndex("category");
      const idxPrice = getIndex("price");
      const idxStock = getIndex("stock");
      const idxDescription = getIndex("description");
      const idxImage = getIndex("image");
      const idxTags = getIndex("tags");
      const idxSku = getIndex("sku");

      if (idxName === -1 || idxBrand === -1 || idxCategory === -1 || idxPrice === -1) {
        const missingFields = [];
        if (idxName === -1) missingFields.push("name");
        if (idxBrand === -1) missingFields.push("brand");
        if (idxCategory === -1) missingFields.push("category");
        if (idxPrice === -1) missingFields.push("price");
        return { 
          addedCount: 0, 
          logs,
          error: `Required columns are missing. CSV headers must include 'name', 'brand', 'category', and 'price'. Missing: ${missingFields.join(", ")}` 
        };
      }

      let added = 0;
      const totalRows = lines.length - 1;

      for (let i = 1; i < lines.length; i++) {
        if (onProgress) {
          onProgress(Math.round((i / totalRows) * 100));
        }

        const line = lines[i];
        if (!line.trim()) continue;

        const row = parseCSVLine(line);
        
        // 1. Validate Row Dimension
        if (row.length < Math.max(idxName, idxBrand, idxCategory, idxPrice) + 1) {
          logs.push({
            row: i,
            itemName: "N/A",
            status: "failed",
            message: `Row contains too few columns (parsed columns: ${row.length}).`
          });
          continue;
        }

        const name = row[idxName];
        const rawPrice = idxPrice !== -1 ? row[idxPrice] : "";
        const sku = idxSku !== -1 ? row[idxSku] : "";

        // 2. Validate Required Name Field
        if (!name) {
          logs.push({
            row: i,
            itemName: "N/A",
            sku: sku || undefined,
            status: "failed",
            message: "Missing Name field"
          });
          continue;
        }

        // 3. Validate Required/Valid Price Field
        const priceStr = rawPrice.replace(/[^0-9.]/g, "");
        const price = parseFloat(priceStr);
        if (!rawPrice || isNaN(price) || price <= 0) {
          logs.push({
            row: i,
            itemName: name,
            sku: sku || undefined,
            status: "failed",
            message: "Missing Price field"
          });
          continue;
        }

        // 4. Validate SKU Format if present
        if (sku) {
          const skuRegex = /^[A-Za-z0-9\-_]{3,30}$/;
          if (!skuRegex.test(sku)) {
            logs.push({
              row: i,
              itemName: name,
              sku: sku,
              status: "failed",
              message: "Invalid SKU format"
            });
            continue;
          }
        }

        const brand = normalizeBrandName(row[idxBrand] || "Generic");
        const rawCategory = row[idxCategory] || "Laptops";
        
        let category: Product["category"] = "Laptops";
        const valCat = rawCategory.toLowerCase();
        if (valCat.includes("phone")) category = "Phones";
        else if (valCat.includes("print")) category = "Printers";
        else if (valCat.includes("access")) category = "Accessories";
        else if (valCat.includes("one") || valCat.includes("aio") || valCat.includes("computer")) category = "All-in-One PCs";

        const stock = idxStock !== -1 ? parseInt(row[idxStock].replace(/[^0-9]/g, "")) || 0 : 5;
        const description = idxDescription !== -1 ? row[idxDescription] || "Enterprise hardware from direct distributor." : "Premium Tech Hardware.";
        const image = idxImage !== -1 && row[idxImage] ? row[idxImage] : "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=700";
        
        const rawTags = idxTags !== -1 ? row[idxTags] : "";
        const tags = rawTags ? rawTags.split(";").map(t => t.trim()).filter(Boolean) : [];

        const productData: Omit<Product, "id"> = {
          name,
          brand,
          category,
          price,
          stock,
          description,
          image,
          tags,
          sku: sku || undefined,
          specifications: {
            "Origin Info": "Imported Business Stock",
            "Manufacturer Warranty": "12 Months Kenya Service"
          }
        };

        try {
          await addProduct(productData);
          added++;
          logs.push({
            row: i,
            itemName: name,
            sku: sku || undefined,
            status: "success",
            message: `Successfully imported product: '${name}'`
          });
        } catch (dbErr: any) {
          console.error(`Error adding product on row ${i}:`, dbErr);
          logs.push({
            row: i,
            itemName: name,
            sku: sku || undefined,
            status: "failed",
            message: `Database upload failure: ${dbErr.message || dbErr}`
          });
        }
      }

      if (onProgress) {
        onProgress(100);
      }
      return { addedCount: added, logs };
    } catch (e: any) {
      console.error("Error importing CSV:", e);
      return { addedCount: 0, logs, error: e.message || "An error occurred during CSV ingestion." };
    }
  };

  const syncInventoryStockCSV = async (
    csvContent: string,
    onProgress?: (progress: number) => void
  ): Promise<{ updatedCount: number; addedCount: number; logs: any[]; error?: string }> => {
    const logs: { row: number; itemName?: string; sku?: string; status: "success" | "skipped" | "failed"; message: string }[] = [];
    try {
      const lines = csvContent.split(/\r?\n/);
      if (lines.length < 2) {
        return { updatedCount: 0, addedCount: 0, logs, error: "Empty CSV file or header-only content provided." };
      }

      const parseCSVLine = (text: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const getIndex = (col: string) => headers.findIndex(h => h.toLowerCase().trim() === col.toLowerCase().trim());

      const idxName = getIndex("name");
      const idxSku = getIndex("sku");
      const idxStock = getIndex("stock");
      const idxPrice = getIndex("price");

      if (idxName === -1 && idxSku === -1) {
        return {
          updatedCount: 0,
          addedCount: 0,
          logs,
          error: "CSV headers must include at least 'sku' or 'name' column to match inventory items."
        };
      }

      let updated = 0;
      let added = 0;
      const totalRows = lines.length - 1;

      for (let i = 1; i < lines.length; i++) {
        if (onProgress) onProgress(Math.round((i / totalRows) * 100));
        const line = lines[i];
        if (!line.trim()) continue;

        const row = parseCSVLine(line);
        const skuVal = idxSku !== -1 ? row[idxSku] : "";
        const nameVal = idxName !== -1 ? row[idxName] : "";
        const rawStock = idxStock !== -1 ? row[idxStock] : "";
        const rawPrice = idxPrice !== -1 ? row[idxPrice] : "";

        if (!skuVal && !nameVal) continue;

        const stockNum = rawStock !== "" ? parseInt(rawStock.replace(/[^0-9]/g, "")) : NaN;
        const priceNum = rawPrice !== "" ? parseFloat(rawPrice.replace(/[^0-9.]/g, "")) : NaN;

        const match = products.find(p => 
          (skuVal && p.sku && p.sku.toLowerCase() === skuVal.toLowerCase()) ||
          (nameVal && p.name.toLowerCase() === nameVal.toLowerCase())
        );

        if (match) {
          const updates: Partial<Product> = {};
          if (!isNaN(stockNum)) updates.stock = stockNum;
          if (!isNaN(priceNum) && priceNum > 0) updates.price = priceNum;

          if (Object.keys(updates).length > 0) {
            await editProduct(match.id, updates);
            updated++;
            logs.push({
              row: i,
              itemName: match.name,
              sku: match.sku,
              status: "success",
              message: `Updated stock: ${updates.stock !== undefined ? updates.stock : match.stock}${updates.price ? ` | Price: KES ${updates.price}` : ""}`
            });
          }
        } else if (nameVal) {
          const newProduct: Omit<Product, "id"> = {
            name: nameVal,
            brand: "Imported",
            category: "Accessories",
            price: !isNaN(priceNum) && priceNum > 0 ? priceNum : 15000,
            stock: !isNaN(stockNum) ? stockNum : 10,
            description: "Hardware product synchronized via CSV inventory system.",
            image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=700",
            sku: skuVal || undefined,
            specifications: {}
          };
          await addProduct(newProduct);
          added++;
          logs.push({
            row: i,
            itemName: nameVal,
            sku: skuVal,
            status: "success",
            message: `Registered new inventory product via CSV sync.`
          });
        }
      }

      if (onProgress) onProgress(100);
      return { updatedCount: updated, addedCount: added, logs };
    } catch (err: any) {
      console.error("Error in syncInventoryStockCSV:", err);
      return { updatedCount: 0, addedCount: 0, logs, error: err.message || "CSV sync failed." };
    }
  };

  // Register user price drop notifications in Firestore with local fallback backing
  const registerPriceAlert = async (
    productId: string,
    productName: string,
    email: string,
    whatsapp: string,
    targetPrice: number,
    currentPrice: number
  ): Promise<boolean> => {
    try {
      const alertCol = collection(db, "price_alerts");
      await addDoc(alertCol, {
        productId,
        productName,
        email,
        whatsapp,
        targetPrice,
        currentPrice,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error creating price alert:", e);
      try {
        const storedStr = localStorage.getItem("tgk_price_alerts") || "[]";
        const stored = JSON.parse(storedStr);
        stored.push({
          productId,
          productName,
          email,
          whatsapp,
          targetPrice,
          currentPrice,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("tgk_price_alerts", JSON.stringify(stored));
      } catch (err) {
        console.error("Price alert local storage fallback failure:", err);
      }
      return true;
    }
  };

  // Register user restock request for out-of-stock items
  const registerProductRestockRequest = async (
    productId: string,
    productName: string,
    productImage: string,
    email: string,
    whatsapp: string
  ): Promise<boolean> => {
    try {
      const restockCol = collection(db, "product_restock_requests");
      await addDoc(restockCol, {
        productId,
        productName,
        productImage: productImage || "",
        email: email ? email.trim() : "",
        whatsapp: whatsapp ? whatsapp.trim() : "",
        userId: user ? user.uid : null,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error creating restock request:", e);
      try {
        const storedStr = localStorage.getItem("tgk_restock_requests") || "[]";
        const stored = JSON.parse(storedStr);
        stored.push({
          productId,
          productName,
          productImage,
          email,
          whatsapp,
          userId: user ? user.uid : null,
          status: "pending",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("tgk_restock_requests", JSON.stringify(stored));
      } catch (err) {
        console.error("Restock request local storage fallback error:", err);
      }
      return true;
    }
  };

  const submitTransactionFeedback = async (orderId: string, rating: number, comment: string) => {
    if (!user) throw new Error("You must be logged in to submit feedback");
    try {
      const feedbackCol = collection(db, "transaction_feedback");
      const newFeedback: TransactionFeedback = {
        orderId,
        userId: user.uid,
        userName: user.displayName || userProfile?.name || "Anonymous Client",
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(feedbackCol, newFeedback);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "transaction_feedback");
    }
  };

  const updateCompanyProfile = async (data: Omit<CompanyProfile, "id" | "updatedAt">) => {
    try {
      const companyProfileDocRef = doc(db, "company_profile", "default");
      await setDoc(companyProfileDocRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "company_profile");
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        userProfile,
        setUserProfile,
        authLoading,
        products,
        orders,
        cart,
        activeView,
        selectedProductId,
        selectedOrder,
        invoiceOrderId,
        searchQuery,
        setSearchQuery,
        setInvoiceOrderId,
        setActiveView: handleSetActiveView,
        setSelectedProductId: handleSetSelectedProductId,
        setSelectedOrder,
        wishlist,
        toggleWishlist,
        compareList,
        toggleCompare,
        clearCompareList,
        isCompareOverlayOpen,
        setIsCompareOverlayOpen,
        notifications,
        dismissNotification,
        dismissAllNotifications,
        addCustomNotification,
        loginWithGoogle,
        logout,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        getCartTotal,
        createCheckoutOrder,
        initializeMegaPayTransaction,
        verifyMegaPayTransaction,
        initializePaystackTransaction,
        verifyPaystackTransaction,
        addProduct,
        editProduct,
        removeProduct,
        addFlashOffer,
        removeFlashOffer,
        clearAllFlashOffers,
        updateOrderStatus,
        subscribeNewsletter,
        theme,
        toggleTheme,
        cartToasts,
        dismissCartToast,
        submitProductReview,
        importProductsCSV,
        syncInventoryStockCSV,
        registerPriceAlert,
        registerProductRestockRequest,
        affiliates,
        addAffiliate,
        toggleAffiliate,
        deleteAffiliate,
        productsLoading,
        productsLimit,
        hasMoreProducts,
        loadMoreProducts,
        productReviews,
        transactionFeedback,
        submitTransactionFeedback,
        companyProfile,
        updateCompanyProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        browsingHistory,
        recordProductView,
        clearBrowsingHistory,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
