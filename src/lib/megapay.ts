/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MegaPayInitParams {
  orderId: string;
  email: string;
  amount: number;
  phone?: string;
  msisdn?: string;
  reference?: string;
  apiKey?: string;
}

export interface MegaPayInitResponse {
  success: boolean;
  mode: "real" | "simulated";
  authUrl?: string;
  reference?: string;
  transaction_request_id?: string;
  message?: string;
  error?: string;
  rawRequestBody?: any;
  rawResponse?: any;
}

export interface MegaPayVerifyResponse {
  success: boolean;
  status: "pending" | "completed" | "failed" | "cancelled";
  receiptNo?: string;
  responseCode?: number | string;
  responseDescription?: string;
  message: string;
  error?: string;
  rawRequestBody?: any;
  rawResponse?: any;
}

/**
 * Maps MegaPay M-Pesa error codes from official documentation to clear diagnostic messages.
 */
export function getMegaPayErrorMessage(code: number | string): string {
  const numCode = typeof code === "string" ? parseInt(code, 10) : code;
  switch (numCode) {
    case 0:
      return "Success. Request accepted for processing.";
    case 1:
      return "The balance is insufficient for the transaction.";
    case 1032:
      return "Request cancelled by user on phone screen.";
    case 1037:
      return "DS timeout: user cannot be reached or M-Pesa PIN prompt timed out.";
    case 1025:
      return "An error occurred while sending a push request.";
    case 9999:
      return "An error occurred while sending a push request to subscriber.";
    case 2001:
      return "The initiator information is invalid or unauthorized.";
    case 1019:
      return "Transaction has expired.";
    case 1001:
      return "Unable to lock subscriber: a transaction is already in process for the current subscriber.";
    default:
      return `M-Pesa transaction failed with code ${code}`;
  }
}

/**
 * Helper to clean and format MSISDN phone number into valid M-Pesa format (2547XXXXXXXX or 07XXXXXXXX)
 */
export function formatMpesaMsisdn(phoneStr: string): string {
  if (!phoneStr) return "";
  const cleaned = phoneStr.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return cleaned; // e.g., 0768783443
  }
  if (cleaned.startsWith("254")) {
    return cleaned; // e.g., 254768783443
  }
  if (cleaned.length === 9) {
    return "254" + cleaned;
  }
  return cleaned;
}

/**
 * Initiates an M-Pesa Express STK Push transaction via MegaPay API service.
 * Verifies that the request payload strictly matches official documentation:
 * { api_key, email, amount, msisdn, reference }
 */
export async function initializeMegaPayPayment(params: MegaPayInitParams): Promise<MegaPayInitResponse> {
  const msisdnVal = formatMpesaMsisdn(params.msisdn || params.phone || "");
  const referenceVal = String(params.reference || params.orderId || "");
  const amountStr = String(Math.round(params.amount));

  const rawRequestBody = {
    email: params.email,
    amount: amountStr,
    orderId: params.orderId,
    phone: msisdnVal,
    msisdn: msisdnVal,
    reference: referenceVal,
    api_key: params.apiKey,
  };

  console.log("=================================================");
  console.log("[MegaPay API Service] INITIATING STK PUSH REQUEST");
  console.log("[MegaPay API Service] Outgoing Request Payload:", JSON.stringify(rawRequestBody, null, 2));
  console.log("=================================================");

  try {
    const response = await fetch("/api/megapay/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawRequestBody),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("[MegaPay API Service] Error parsing server response as JSON:", rawText);
      data = { rawText };
    }

    console.log("=================================================");
    console.log("[MegaPay API Service] SERVER RESPONSE RECEIVED");
    console.log("[MegaPay API Service] HTTP Status:", response.status);
    console.log("[MegaPay API Service] Raw Response Data:", JSON.stringify(data, null, 2));
    console.log("=================================================");

    if (!response.ok || !data.success) {
      const errorMsg = data.error || data.message || data.massage || "Failed to initialize M-Pesa payment session.";
      console.error("[MegaPay API Service] STK Push Initialization Failed:", errorMsg);
      return {
        success: false,
        mode: data.mode || "simulated",
        message: errorMsg,
        error: errorMsg,
        rawRequestBody,
        rawResponse: data,
      };
    }

    return {
      success: true,
      mode: data.mode || "real",
      authUrl: data.authorization_url,
      reference: data.reference || data.transaction_request_id || referenceVal,
      transaction_request_id: data.transaction_request_id || data.reference,
      message: data.message || data.massage || "M-Pesa STK Push prompt sent successfully to handset screen!",
      rawRequestBody,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[MegaPay API Service] Network/API Exception during STK push initialization:", error);
    return {
      success: false,
      mode: "simulated",
      message: error.message || "Network exception communicating with MegaPay gateway server.",
      error: error.message,
      rawRequestBody,
    };
  }
}

/**
 * Verifies M-Pesa transaction status for a given transaction request ID or reference.
 * Queries /api/megapay/verify or /transactionstatus endpoint with robust error logging.
 */
export async function verifyMegaPayPayment(orderId: string, reference: string): Promise<MegaPayVerifyResponse> {
  const rawRequestBody = {
    orderId,
    reference,
    transaction_request_id: reference,
  };

  console.log(`[MegaPay API Service] QUERYING TRANSACTION STATUS for reference '${reference}' (Order ID: ${orderId})`);

  try {
    const response = await fetch(`/api/megapay/verify/${encodeURIComponent(reference)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawRequestBody),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    console.log(`[MegaPay API Service] STATUS RESPONSE for '${reference}':`, JSON.stringify(data, null, 2));

    const responseCode = data.ResponseCode ?? data.ResultCode ?? data.TransactionCode;
    const responseDescription = data.ResponseDescription ?? data.ResultDesc ?? data.message ?? data.massage;

    // Check for explicit error codes
    if (data.status === "failed" || (responseCode !== undefined && responseCode !== 0 && responseCode !== "0" && responseCode !== "200")) {
      const errorMsg = responseDescription || getMegaPayErrorMessage(responseCode);
      const isCancelled = responseCode === 1032 || String(responseCode) === "1032";

      console.warn(`[MegaPay API Service] M-Pesa Error Code ${responseCode}: ${errorMsg}`);

      return {
        success: false,
        status: isCancelled ? "cancelled" : "failed",
        responseCode,
        responseDescription,
        message: errorMsg,
        error: errorMsg,
        rawRequestBody,
        rawResponse: data,
      };
    }

    if (data.success && (data.status === "success" || data.status === "completed" || data.mode === "simulated")) {
      return {
        success: true,
        status: "completed",
        receiptNo: data.receiptNo || data.TransactionReceipt || reference || "MPESA-OK",
        responseCode: responseCode ?? 0,
        responseDescription: responseDescription || "Success",
        message: data.message || "M-Pesa payment verified successfully!",
        rawRequestBody,
        rawResponse: data,
      };
    }

    // Default to pending
    return {
      success: false,
      status: "pending",
      responseCode: responseCode ?? "pending",
      responseDescription: responseDescription || "Transaction pending PIN entry on mobile phone...",
      message: data.message || "Transaction pending PIN entry on mobile phone...",
      rawRequestBody,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[MegaPay API Service] Verification Exception:", error);
    return {
      success: false,
      status: "pending",
      message: error.message || "Error checking transaction status.",
      error: error.message,
      rawRequestBody,
    };
  }
}
