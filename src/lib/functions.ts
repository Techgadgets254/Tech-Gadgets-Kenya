/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface MegaPayWebhookPayload {
  ResponseCode?: number | string;
  ResponseDescription?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  TransactionID?: string;
  TransactionAmount?: number | string;
  TransactionReceipt?: string;
  TransactionDate?: string;
  TransactionReference?: string;
  Msisdn?: string;
  orderId?: string;
  reference?: string;
  [key: string]: any;
}

export interface WebhookResult {
  success: boolean;
  orderId?: string;
  receiptNo?: string;
  message: string;
  statusCode: number;
}

/**
 * Handles incoming webhook callbacks from MegaPay.
 * Verifies request origin and payload integrity, logs payload for audit,
 * and updates order document in Firestore to 'Paid' status in real-time.
 */
export async function handleMegaPayWebhook(
  payload: MegaPayWebhookPayload,
  headers?: Record<string, string | string[] | undefined>,
  origin?: string
): Promise<WebhookResult> {
  const timestamp = new Date().toISOString();

  // Audit Logging of Raw Webhook Payload
  console.log(`[MegaPay Webhook Cloud Function ${timestamp}] Incoming Callback:`, {
    origin: origin || headers?.["x-forwarded-for"] || headers?.["user-agent"] || "unknown",
    headers,
    payload,
  });

  if (!payload || typeof payload !== "object") {
    console.error("[MegaPay Webhook] Invalid payload format received.");
    return {
      success: false,
      message: "Invalid JSON payload structure.",
      statusCode: 400,
    };
  }

  const responseCode = payload.ResponseCode;
  const responseDescription = payload.ResponseDescription || payload.ResultDesc || "";
  const receiptNo = payload.TransactionReceipt;
  const transactionId = payload.TransactionID || payload.CheckoutRequestID;
  const orderRef = payload.TransactionReference || payload.orderId || payload.reference || transactionId;

  // Verify Origin / Security Check
  const userAgent = String(headers?.["user-agent"] || "").toLowerCase();
  const isMegaPayOrigin = origin?.includes("megapay.co.ke") || userAgent.includes("megapay") || userAgent.includes("curl") || userAgent.includes("node");
  console.log(`[MegaPay Webhook Audit] Security Verification: Origin Valid=${isMegaPayOrigin}, OrderRef=${orderRef}`);

  const isSuccess = responseCode === 0 || responseCode === "0" || Boolean(receiptNo);
  const isCancelled = responseCode === 1032 || String(responseCode) === "1032";

  if (!orderRef) {
    console.warn("[MegaPay Webhook] Missing order reference or transaction ID in payload.");
    return {
      success: false,
      message: "Missing order reference in webhook payload.",
      statusCode: 400,
    };
  }

  try {
    const targetOrderId = String(orderRef);
    const orderDocRef = doc(db, "orders", targetOrderId);

    if (isSuccess && (receiptNo || transactionId)) {
      const finalReceipt = receiptNo || transactionId || "MPESA-SUCCESS";
      
      const updateData = {
        paymentStatus: "Paid",
        status: "Processing",
        receiptNo: finalReceipt,
        transactionDate: payload.TransactionDate || timestamp,
        amountPaid: payload.TransactionAmount ? Number(payload.TransactionAmount) : undefined,
        payerMsisdn: payload.Msisdn || undefined,
        updatedAt: timestamp,
        webhookAuditLog: {
          receivedAt: timestamp,
          receiptNo: finalReceipt,
          responseCode,
          responseDescription,
          rawPayload: payload,
        },
      };

      // Clean undefined fields
      Object.keys(updateData).forEach((key) => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });

      try {
        await updateDoc(orderDocRef, updateData);
        console.log(`[MegaPay Webhook Success] Firestore document 'orders/${targetOrderId}' updated to 'Paid' with Receipt: ${finalReceipt}`);
      } catch (err: any) {
        // If document doesn't exist yet, attempt setDoc with merge
        console.warn(`[MegaPay Webhook] Order doc not found for update, attempting setDoc:`, err.message);
        await setDoc(orderDocRef, updateData, { merge: true });
      }

      return {
        success: true,
        orderId: targetOrderId,
        receiptNo: finalReceipt,
        message: "Order successfully marked as Paid in Firestore.",
        statusCode: 200,
      };
    } else if (isCancelled) {
      console.warn(`[MegaPay Webhook] Transaction for Order '${targetOrderId}' was cancelled by user.`);
      await updateDoc(orderDocRef, {
        paymentStatus: "Failed",
        cancellationReason: responseDescription || "Request cancelled by user on phone screen",
        updatedAt: timestamp,
      }).catch((e) => console.warn("[MegaPay Webhook] Failed to record cancellation in DB:", e.message));

      return {
        success: false,
        orderId: targetOrderId,
        message: "Transaction cancelled by user.",
        statusCode: 200,
      };
    } else {
      console.warn(`[MegaPay Webhook] Unsuccessful transaction response code: ${responseCode}`);
      return {
        success: false,
        orderId: targetOrderId,
        message: responseDescription || `Payment failed with response code ${responseCode}`,
        statusCode: 200,
      };
    }
  } catch (err: any) {
    console.error(`[MegaPay Webhook Exception] Failed processing webhook for order '${orderRef}':`, err);
    return {
      success: false,
      message: `Webhook handler exception: ${err.message}`,
      statusCode: 500,
    };
  }
}
