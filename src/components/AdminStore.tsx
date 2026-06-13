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
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && (
    user.email === "techgadgetsk@gmail.com" || 
    userProfile?.role === "admin" ||
    userProfile?.["admin-claims"] === "admin" ||
    userProfile?.["admin-claims"] === true
  );

  useEffect(() => {
    if (!isAdmin) {
      setLiveProducts([]);
      setLiveOrders([]);
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
      setLiveProducts(list);
    }, (error) => {
      console.error("AdminStore products sync error:", error);
    });

    // 2. Real-time orders/transactions sync (no limits, instant synchronization)
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
