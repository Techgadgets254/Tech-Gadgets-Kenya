import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useStore } from "../StoreContext";
import { Product, Order } from "../types";

interface AdminStoreType {
  liveProducts: Product[];
  liveOrders: Order[];
  loading: boolean;
}

const AdminStoreContext = createContext<AdminStoreType | undefined>(undefined);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useStore();
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [flashOffers, setFlashOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && (
    user.email === "techgadgetsk@gmail.com" || 
    userProfile?.role === "admin" ||
    userProfile?.["admin-claims"] === "admin" ||
    userProfile?.["admin-claims"] === true
  );

  const liveProducts = React.useMemo(() => {
    return rawProducts.map((p) => {
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
  }, [rawProducts, flashOffers]);

  useEffect(() => {
    if (!isAdmin) {
      setRawProducts([]);
      setLiveOrders([]);
      setFlashOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Real-time products sync for ALL items (no paging/limits to avoid visual cutoffs)
    const productsCol = collection(db, "products");
    const unsubscribeProducts = onSnapshot(productsCol, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.deleted !== true) {
          list.push({ id: doc.id, ...data } as Product);
        }
      });
      // Sort newest first
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRawProducts(list);
    }, (error) => {
      console.error("AdminStore products sync error:", error);
    });

    // 2. Real-time flash offers sync
    const flashCol = collection(db, "flash_offers");
    const unsubscribeFlash = onSnapshot(flashCol, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setFlashOffers(list);
    }, (error) => {
      console.error("AdminStore flash offers sync error:", error);
    });

    // 3. Real-time orders/transactions sync (no limits, instant synchronization)
    const ordersCol = collection(db, "orders");
    const unsubscribeOrders = onSnapshot(ordersCol, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Order);
      });
      // Sort newest first
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setLiveOrders(list);
      setLoading(false);
    }, (error) => {
      console.error("AdminStore orders sync error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeFlash();
      unsubscribeOrders();
    };
  }, [isAdmin]);

  return (
    <AdminStoreContext.Provider value={{ liveProducts, liveOrders, loading }}>
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (context === undefined) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return context;
}
