import { useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";

export interface UserActivityEvent {
  eventType: "view_product_details" | "add_to_cart" | "open_ai_chat" | "search_query" | "page_view";
  activeView?: string;
  productId?: string;
  productName?: string;
  productBrand?: string;
  productPrice?: number;
  metadata?: Record<string, any>;
  timestamp?: any;
  userAgent?: string;
}

export function useUserActivityTracker(
  activeView: string,
  activeProduct: Product | null,
  cartCount: number,
  isChatOpen: boolean
) {
  const lastViewedProductId = useRef<string | null>(null);
  const lastChatState = useRef<boolean>(false);
  const lastCartCount = useRef<number>(cartCount);

  // Helper function to log an event to Firestore 'user_activity' collection
  const logActivity = async (event: UserActivityEvent) => {
    try {
      const activityCol = collection(db, "user_activity");
      await addDoc(activityCol, {
        ...event,
        timestamp: serverTimestamp(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        devicePlatform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to record user activity event to Firestore:", err);
    }
  };

  // Track product view changes
  useEffect(() => {
    if (activeView === "product-details" && activeProduct) {
      if (lastViewedProductId.current !== activeProduct.id) {
        lastViewedProductId.current = activeProduct.id;
        logActivity({
          eventType: "view_product_details",
          activeView,
          productId: activeProduct.id,
          productName: activeProduct.name,
          productBrand: activeProduct.brand,
          productPrice: activeProduct.price
        });
      }
    } else {
      lastViewedProductId.current = null;
    }
  }, [activeView, activeProduct]);

  // Track AI chat toggles
  useEffect(() => {
    if (isChatOpen && !lastChatState.current) {
      logActivity({
        eventType: "open_ai_chat",
        activeView,
        metadata: { trigger: "user_opened_chat_assistant" }
      });
    }
    lastChatState.current = isChatOpen;
  }, [isChatOpen, activeView]);

  // Track add to cart increases
  useEffect(() => {
    if (cartCount > lastCartCount.current) {
      logActivity({
        eventType: "add_to_cart",
        activeView,
        metadata: { newCartCount: cartCount, addedCount: cartCount - lastCartCount.current }
      });
    }
    lastCartCount.current = cartCount;
  }, [cartCount, activeView]);

  return { logActivity };
}
