/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export interface PushNotificationPayload {
  userId: string; // auth uid, 'all', or guest id
  title: string;
  body: string;
  type: "order_update" | "price_drop" | "product_arrival" | "general";
  link?: string;
  read?: boolean;
}

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export async function getFcmMessaging() {
  try {
    const supported = await isSupported();
    if (supported && !messagingInstance) {
      const { initializeApp, getApps } = await import("firebase/app");
      const app = getApps()[0];
      if (app) {
        messagingInstance = getMessaging(app);
      }
    }
  } catch (e) {
    console.warn("FCM Messaging is not supported or failed to initialize in this environment:", e);
  }
  return messagingInstance;
}

/**
 * Request notification permission and save token in Firestore
 */
export async function requestFcmPushPermission(userId: string): Promise<{
  permission: NotificationPermission;
  token: string | null;
  success: boolean; }> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return { permission: "denied", token: null, success: false };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { permission, token: null, success: false };
    }

    let token: string | null = null;
    const messaging = await getFcmMessaging();

    if (messaging) {
      try {
        // Try obtaining real FCM web token if vapidKey is available or fallback
        token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined
        });
      } catch (e) {
        console.warn("FCM getToken failed, generating local fallback device token:", e);
      }
    }

    if (!token) {
      // Fallback persistent device token identifier for web push simulation
      let storedToken = localStorage.getItem("tsk_fcm_device_token");
      if (!storedToken) {
        storedToken = `fcm_web_token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
        localStorage.setItem("tsk_fcm_device_token", storedToken);
      }
      token = storedToken;
    }

    // Register token in Firestore
    const targetUid = userId || `guest_${token.substring(0, 16)}`;
    const tokenDocRef = doc(db, "fcm_tokens", targetUid);
    await setDoc(tokenDocRef, {
      userId: targetUid,
      token,
      platform: "web",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { permission: "granted", token, success: true };
  } catch (err) {
    console.error("Error requesting push notification permission:", err);
    return { permission: Notification.permission || "default", token: null, success: false };
  }
}

/**
 * Send and log a push notification (saves to Firestore + triggers browser notification)
 */
export async function sendFcmPushNotification(payload: PushNotificationPayload) {
  const nowIso = new Date().toISOString();
  
  // 1. Save to Firestore notifications collection
  try {
    await addDoc(collection(db, "notifications"), {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link || "",
      read: false,
      createdAt: nowIso
    });
  } catch (err) {
    console.warn("Failed to store notification in Firestore:", err);
  }

  // 2. Trigger native browser push notification if granted
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(payload.title, {
        body: payload.body,
        icon: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=120&q=80",
        tag: `${payload.type}_${Date.now()}`,
        badge: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=120&q=80"
      });
      n.onclick = () => {
        window.focus();
        if (payload.link) {
          window.location.hash = payload.link;
        }
      };
    } catch (e) {
      console.warn("Failed to trigger native browser notification:", e);
    }
  }
}

/**
 * Dispatch Order Update FCM Push Notification
 */
export async function triggerOrderUpdateNotification(userId: string, orderId: string, status: string) {
  const titles: Record<string, string> = {
    Processing: "📦 Order Processing Update",
    Shipped: "🚚 Order Dispatched & On Its Way!",
    Delivered: "✅ Order Successfully Delivered!",
    Paid: "💳 Payment Verified & Order Confirmed"
  };

  const bodies: Record<string, string> = {
    Processing: `Order #${orderId.substring(0, 8)} is now being prepared in our CBD warehouse.`,
    Shipped: `Order #${orderId.substring(0, 8)} has been dispatched for delivery in Kenya.`,
    Delivered: `Order #${orderId.substring(0, 8)} has been delivered. Thank you for shopping with Tech Sokoni Kenya!`,
    Paid: `Payment for Order #${orderId.substring(0, 8)} was received successfully.`
  };

  await sendFcmPushNotification({
    userId,
    title: titles[status] || `Order #${orderId.substring(0, 8)} Status: ${status}`,
    body: bodies[status] || `Your order status has changed to ${status}.`,
    type: "order_update",
    link: "client-dashboard"
  });
}

/**
 * Dispatch Price Drop FCM Push Notification
 */
export async function triggerPriceDropNotification(
  userId: string, 
  productName: string, 
  oldPrice: number, 
  newPrice: number, 
  productId: string
) {
  const savings = oldPrice - newPrice;
  await sendFcmPushNotification({
    userId: userId || "all",
    title: `🔥 Price Drop Alert: ${productName}`,
    body: `Save KES ${savings.toLocaleString()}! Price dropped from KES ${oldPrice.toLocaleString()} to KES ${newPrice.toLocaleString()}.`,
    type: "price_drop",
    link: `product:${productId}`
  });
}

/**
 * Dispatch New Product Arrival FCM Push Notification
 */
export async function triggerNewProductNotification(
  productName: string, 
  price: number, 
  category: string, 
  productId: string
) {
  await sendFcmPushNotification({
    userId: "all",
    title: `✨ New Stock Arrival: ${productName}`,
    body: `New ${category} now available at Tech Sokoni Kenya for KES ${price.toLocaleString()}.`,
    type: "product_arrival",
    link: `product:${productId}`
  });
}
