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
  orderBy
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { Product, Order, OrderItem, UserProfile, Affiliate, ProductReview } from "./types";
import { DEFAULT_PRODUCTS } from "./data";

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
  userProfile: UserProfile | null;
  authLoading: boolean;
  products: Product[];
  orders: Order[];
  cart: { product: Product; quantity: number }[];
  activeView: "home" | "shop" | "product-details" | "checkout" | "client-dashboard" | "admin-dashboard" | "news";
  selectedProductId: string | null;
  selectedOrder: Order | null;
  invoiceOrderId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setInvoiceOrderId: (id: string | null) => void;
  setActiveView: (view: "home" | "shop" | "product-details" | "checkout" | "client-dashboard" | "admin-dashboard" | "news") => void;
  setSelectedProductId: (id: string | null) => void;
  setSelectedOrder: (order: Order | null) => void;
  
  // Custom interactive lists
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompareList: () => void;
  notifications: ToastNotification[];
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  
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
  initializePaystackTransaction: (orderId: string, email: string, amount: number) => Promise<{ success: boolean; mode: "real" | "simulated"; authUrl?: string; reference?: string; message?: string }>;
  verifyPaystackTransaction: (orderId: string, reference: string) => Promise<{ success: boolean; receiptNo?: string; message: string }>;
  
  // Admin Product Actions
  addProduct: (productData: Omit<Product, "id">) => Promise<void>;
  editProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;

  // Admin Order Actions
  updateOrderStatus: (id: string, paymentStatus: Order["paymentStatus"], shippingStatus: Order["shippingStatus"], receiptNo?: string) => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<boolean>;

  // Affiliate Management
  affiliates: Affiliate[];
  addAffiliate: (data: Omit<Affiliate, "id" | "createdAt">) => Promise<void>;
  toggleAffiliate: (id: string, active: boolean) => Promise<void>;
  deleteAffiliate: (id: string) => Promise<void>;

  // Newly Added Features
  theme: "light" | "dark";
  toggleTheme: () => void;
  submitProductReview: (productId: string, rating: number, comment: string, name: string) => Promise<void>;
  importProductsCSV: (csvContent: string) => Promise<{ addedCount: number; error?: string }>;
  registerPriceAlert: (productId: string, productName: string, email: string, whatsapp: string, targetPrice: number, currentPrice: number) => Promise<boolean>;
  productsLoading: boolean;
  productsLimit: number;
  hasMoreProducts: boolean;
  loadMoreProducts: () => void;
  productReviews: ProductReview[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsLimit, setProductsLimit] = useState(12);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const loadMoreProducts = () => {
    setProductsLimit((prev) => prev + 12);
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [activeView, setActiveView] = useState<StoreContextType["activeView"]>("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);

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
      console.error("Error loading reviews collection:", error);
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
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Keep a ref to track real-time shipping status changes cleanly in firestore listener
  const prevStatusesRef = React.useRef<Record<string, string>>({});
  const isFirstLoadRef = React.useRef(true);

  // Sync Wishlist to localStorage
  useEffect(() => {
    const cachedWish = localStorage.getItem("tech_gadgets_ke_wishlist");
    if (cachedWish) {
      try {
        setWishlist(JSON.parse(cachedWish));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem("tech_gadgets_ke_wishlist", JSON.stringify(updated));
      return updated;
    });
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let profile: UserProfile;
          
          // Kenya Admin bootstrapping helper
          const isAdminEmail = 
            currentUser.email === "techgadgetsk@gmail.com" || 
            currentUser.email === "admin@techgadgetskenya.co.ke";
            
          if (userDocSnap.exists()) {
            profile = userDocSnap.data() as UserProfile;
            // Ensure if current user email is part of admin set, their profile reflects it dynamically
            if (isAdminEmail && profile.role !== "admin") {
              profile.role = "admin";
              await updateDoc(userDocRef, { role: "admin" });
            }
          } else {
            profile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              name: currentUser.displayName || "Valued Client",
              role: isAdminEmail ? "admin" : "customer",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile: ", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return unsubscribe;
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
      console.error("Affiliates Firestore listener failure: ", error);
    });
    return unsubscribe;
  }, []);

  // 2. Load Products and Real-time Snapshot with Auto-Seeding
  useEffect(() => {
    const productsColRef = collection(db, "products");
    setProductsLoading(true);

    let activeUnsubscribe: (() => void) | null = null;

    const setupListener = (useOrdering: boolean) => {
      let productsQuery;
      if (useOrdering) {
        try {
          productsQuery = query(productsColRef, orderBy("createdAt", "desc"), limit(productsLimit));
        } catch (e) {
          console.warn("Could not form sorted query, reverting to unordered:", e);
          productsQuery = query(productsColRef, limit(productsLimit));
        }
      } else {
        productsQuery = query(productsColRef, limit(productsLimit));
      }

      const unsubscribe = onSnapshot(productsQuery, async (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as Product);
        });
        
        // Seed if zero products exist (Dynamic Store Self-Seeding)
        if (items.length === 0) {
          console.log("No products found in Firestore. Seeding premium selection...");
          try {
            for (const item of DEFAULT_PRODUCTS) {
              await addDoc(productsColRef, {
                ...item,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, "products");
          }
        } else {
          // Since we ordered the query, items are already sorted, but let's ensure order
          const sorted = [...items].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setProducts(sorted);
          setHasMoreProducts(snapshot.docs.length >= productsLimit);
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
      const prodId = params.get("product");
      if (prodId) {
        const prodExists = products.some((p) => p.id === prodId);
        if (prodExists) {
          setSelectedProductId(prodId);
          setActiveView("product-details");
        }
      }
    }
  }, [products]);

  // 3. Load Orders Sync with Real-time Snapshots (if signed in)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      prevStatusesRef.current = {};
      isFirstLoadRef.current = true;
      return;
    }

    const userIsAdmin = user.email === "techgadgetsk@gmail.com" || userProfile?.role === "admin";
    
    // Non-admin customer accounts must only retrieve their own orders to conform with security rules
    const targetRef = userIsAdmin
      ? collection(db, "orders")
      : query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(targetRef, (snapshot) => {
      const allOrders: Order[] = [];
      const changedAlerts: ToastNotification[] = [];

      snapshot.forEach((d) => {
        const orderData = { id: d.id, ...d.data() } as Order;
        allOrders.push(orderData);

        // Real-time Shipping Status Change Checker
        const orderId = d.id;
        const currentShippingStatus = orderData.shippingStatus;
        const oldShippingStatus = prevStatusesRef.current[orderId];

        // Ensure we inspect status changes for existing records after we've initialized them once
        if (!isFirstLoadRef.current && oldShippingStatus !== undefined && oldShippingStatus !== currentShippingStatus) {
          changedAlerts.push({
            id: `${orderId}-${Date.now()}-${Math.random()}`,
            orderId,
            customerName: orderData.customerName || "Customer",
            oldStatus: oldShippingStatus,
            newStatus: currentShippingStatus,
            message: `Delivery Update: Your order #${orderId.slice(-6)} shipping status is now updated from "${oldShippingStatus}" to "${currentShippingStatus}"!`,
            timestamp: Date.now()
          });
        }

        // Cache the latest status
        prevStatusesRef.current[orderId] = currentShippingStatus;
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

  // Auth Functions
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Sign in failed:", e);
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
      await signOut(auth);
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

  const getCartTotal = () => {
    return cart.reduce((tot, item) => tot + item.product.price * item.quantity, 0);
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
    if (!user) {
      alert("Please log in to place an order");
      return null;
    }

    if (cart.length === 0) return null;

    const items: OrderItem[] = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity,
    }));

    const orderData: Omit<Order, "id"> = {
      userId: user.uid,
      customerName: details.customerName,
      customerEmail: details.customerEmail,
      customerPhone: details.customerPhone,
      shippingAddress: details.shippingAddress,
      items,
      totalAmount: details.totalAmount !== undefined ? details.totalAmount : getCartTotal(),
      mpesaPhone: details.mpesaPhone,
      paymentStatus: "Pending",
      shippingStatus: "Processing",
      referralCode: details.referralCode || "",
      paymentProvider: details.paymentProvider || "Paystack",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // Update local product inventory stock for realistic ecommerce behavior!
      for (const cartItem of cart) {
        const productRef = doc(db, "products", cartItem.product.id);
        const newStock = Math.max(0, cartItem.product.stock - cartItem.quantity);
        await updateDoc(productRef, { stock: newStock });
      }

      clearCart();
      return { id: docRef.id, ...orderData } as Order;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "orders");
      return null;
    }
  };

  // Paystack transaction initializer
  const initializePaystackTransaction = async (orderId: string, email: string, amount: number) => {
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, orderId })
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.slice(0, 150) || `Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize Paystack checkout.");
      }

      return {
        success: data.success,
        mode: data.mode as "real" | "simulated",
        authUrl: data.authorization_url,
        reference: data.reference,
        message: data.message
      };
    } catch (e: any) {
      console.error("Paystack transaction initialization failure:", e);
      return {
        success: false,
        mode: "simulated" as const,
        message: e.message || "An unexpected error occurred while communicating with Paystack."
      };
    }
  };

  // Paystack transaction verifier
  const verifyPaystackTransaction = async (orderId: string, reference: string) => {
    try {
      const response = await fetch(`/api/paystack/verify/${reference}`);
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.slice(0, 150) || `Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Verification query failed with Paystack.");
      }

      if (data.success && data.status === "success") {
        const receipt = data.reference || "PAYSTACK-OK";
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          paymentStatus: "Paid",
          receiptNo: receipt,
          updatedAt: new Date().toISOString()
        });

        return {
          success: true,
          receiptNo: receipt,
          message: data.message || `Paystack checkout cleared successfully! Reference: ${receipt}`
        };
      } else {
        return {
          success: false,
          message: data.message || "Paystack transaction was not settled successfully."
        };
      }
    } catch (e: any) {
      console.error("Paystack transaction verify failure:", e);
      return {
        success: false,
        message: e.message || "Could not complete transaction status validation."
      };
    }
  };

  // Add Product Form Action
  const addProduct = async (productData: Omit<Product, "id">) => {
    try {
      await addDoc(collection(db, "products"), {
        ...productData,
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
      await updateDoc(productRef, {
        ...productData,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  // Delete Product Action (Soft-deletes to Trash collection for 60 days before purge)
  const removeProduct = async (id: string) => {
    try {
      const matched = products.find(p => p.id === id);
      
      // Update local state immediately for instant, lag-free visual UI feedback
      setProducts(prev => prev.filter(p => p.id !== id));

      if (matched) {
        const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + sixtyDaysMs).toISOString();
        const trashPayload = {
          originalId: id,
          productData: {
            name: matched.name || "Unnamed Item",
            brand: matched.brand || "Generic",
            category: matched.category || "Accessories",
            price: Number(matched.price || 0),
            stock: Number(matched.stock || 0),
            description: matched.description || "",
            image: matched.image || "",
            gallery: matched.gallery || [],
            specifications: matched.specifications || {},
            tags: matched.tags || [],
            rating: matched.rating || 5,
            reviews: matched.reviews || []
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
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
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
    receiptNo?: string
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
      await updateDoc(orderRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${id}`);
    }
  };

  // Newsletter Sign Up Action
  const subscribeNewsletter = async (email: string): Promise<boolean> => {
    try {
      await addDoc(collection(db, "newsletters"), {
        email,
        subscribedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error subscribing to newsletter in firestore:", e);
      try {
        const storedStr = localStorage.getItem("tgk_newsletters") || "[]";
        const stored = JSON.parse(storedStr);
        stored.push({ email, subscribedAt: new Date().toISOString() });
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
  const importProductsCSV = async (csvContent: string): Promise<{ addedCount: number; error?: string }> => {
    try {
      const lines = csvContent.split(/\r?\n/);
      if (lines.length < 2) {
        return { addedCount: 0, error: "Empty CSV file or header-only content provided." };
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

      if (idxName === -1 || idxBrand === -1 || idxCategory === -1 || idxPrice === -1) {
        return { 
          addedCount: 0, 
          error: "Required columns are missing. CSV headers must include 'name', 'brand', 'category', and 'price'." 
        };
      }

      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const row = parseCSVLine(line);
        if (row.length < 4) continue;

        const name = row[idxName];
        if (!name) continue;

        const brand = row[idxBrand] || "Generic";
        const rawCategory = row[idxCategory] || "Laptops";
        
        let category: Product["category"] = "Laptops";
        const valCat = rawCategory.toLowerCase();
        if (valCat.includes("phone")) category = "Phones";
        else if (valCat.includes("print")) category = "Printers";
        else if (valCat.includes("access")) category = "Accessories";
        else if (valCat.includes("one") || valCat.includes("aio") || valCat.includes("computer")) category = "All-in-One PCs";

        const price = parseFloat(row[idxPrice].replace(/[^0-9.]/g, "")) || 0;
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
          specifications: {
            "Origin Info": "Imported Business Stock",
            "Manufacturer Warranty": "12 Months Kenya Service"
          }
        };

        await addProduct(productData);
        added++;
      }

      return { addedCount: added };
    } catch (e: any) {
      console.error("Error importing CSV:", e);
      return { addedCount: 0, error: e.message || "An error occurred during CSV ingestion." };
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

  return (
    <StoreContext.Provider
      value={{
        user,
        userProfile,
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
        setActiveView,
        setSelectedProductId,
        setSelectedOrder,
        wishlist,
        toggleWishlist,
        compareList,
        toggleCompare,
        clearCompareList,
        notifications,
        dismissNotification,
        dismissAllNotifications,
        loginWithGoogle,
        logout,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        getCartTotal,
        createCheckoutOrder,
        initializePaystackTransaction,
        verifyPaystackTransaction,
        addProduct,
        editProduct,
        removeProduct,
        updateOrderStatus,
        subscribeNewsletter,
        theme,
        toggleTheme,
        submitProductReview,
        importProductsCSV,
        registerPriceAlert,
        affiliates,
        addAffiliate,
        toggleAffiliate,
        deleteAffiliate,
        productsLoading,
        productsLimit,
        hasMoreProducts,
        loadMoreProducts,
        productReviews,
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
