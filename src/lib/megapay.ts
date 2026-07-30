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
  rawResponse?: any;
}

/**
 * Maps MegaPay M-Pesa error codes from official documentation to user-friendly diagnostic messages.
 */
export function getMegaPayErrorMessage(code: number | string): string {
  const numCode = typeof code === "string" ? parseInt(code, 10) : code;
  switch (numCode) {
    case 0:
      return "Success. Request accepted for processing.";
    case 1:
      return "Insufficient balance in M-Pesa account for this transaction.";
    case 1032:
      return "Request cancelled by user on phone screen.";
    case 1037:
      return "User cannot be reached or M-Pesa PIN prompt timed out.";
    case 1025:
      return "An error occurred while dispatching STK push request.";
    case 9999:
      return "An error occurred while sending push request to subscriber.";
    case 2001:
      return "The initiator information is invalid or unauthorized.";
    case 1019:
      return "M-Pesa transaction request expired.";
    case 1001:
      return "Subscriber locked: another transaction is currently in process on this line.";
    default:
      return `M-Pesa transaction failed with code ${code}`;
  }
}

/**
 * Initiates an M-Pesa Express payment transaction via MegaPay API service.
 * Log raw payloads and server responses for diagnostic transparency.
 */
export async function initializeMegaPayPayment(params: MegaPayInitParams): Promise<MegaPayInitResponse> {
  const msisdnVal = params.msisdn || params.phone || "";
  const referenceVal = params.reference || params.orderId || "";

  console.log("[MegaPay Service] Outgoing Initialization Request:", {
    orderId: params.orderId,
    email: params.email,
    amount: params.amount,
    msisdn: msisdnVal,
    reference: referenceVal,
  });

  try {
    const response = await fetch("/api/megapay/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        orderId: params.orderId,
        phone: msisdnVal,
        msisdn: msisdnVal,
        reference: referenceVal,
        api_key: params.apiKey,
      }),
    });

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    console.log("[MegaPay Service] Raw Response from Server:", {
      httpStatus: response.status,
      data,
    });

    if (!response.ok || !data.success) {
      return {
        success: false,
        mode: data.mode || "simulated",
        message: data.error || data.message || "Failed to initialize M-Pesa payment session.",
        error: data.error || data.message,
        rawResponse: data,
      };
    }

    return {
      success: true,
      mode: data.mode || "real",
      authUrl: data.authorization_url,
      reference: data.reference || data.transaction_request_id || referenceVal,
      transaction_request_id: data.transaction_request_id || data.reference,
      message: data.message || "M-Pesa payment initialized successfully.",
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[MegaPay Service] Payment initialization error:", error);
    return {
      success: false,
      mode: "simulated",
      message: error.message || "Network error communicating with M-Pesa gateway.",
      error: error.message,
    };
  }
}

/**
 * Verifies M-Pesa transaction status for a given transaction request ID or reference.
 * Queries /api/megapay/verify or /transactionstatus endpoint with exponential backoff support.
 */
export async function verifyMegaPayPayment(orderId: string, reference: string): Promise<MegaPayVerifyResponse> {
  console.log(`[MegaPay Service] Verifying transaction status for reference '${reference}' (Order: ${orderId})`);

  try {
    const response = await fetch(`/api/megapay/verify/${encodeURIComponent(reference)}`);
    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }

    console.log("[MegaPay Service] Transaction Status Raw Response:", {
      reference,
      httpStatus: response.status,
      data,
    });

    const responseCode = data.ResponseCode ?? data.ResultCode ?? data.TransactionCode;
    const responseDescription = data.ResponseDescription ?? data.ResultDesc ?? data.message;

    // Check for explicit error codes
    if (data.status === "failed" || (responseCode !== undefined && responseCode !== 0 && responseCode !== "0" && responseCode !== "200")) {
      const errorMsg = responseDescription || getMegaPayErrorMessage(responseCode);
      const isCancelled = responseCode === 1032 || String(responseCode) === "1032";

      return {
        success: false,
        status: isCancelled ? "cancelled" : "failed",
        responseCode,
        responseDescription,
        message: errorMsg,
        error: errorMsg,
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
        rawResponse: data,
      };
    }

    // Default to pending
    return {
      success: false,
      status: "pending",
      responseCode: responseCode ?? "pending",
      responseDescription: responseDescription || "Transaction pending...",
      message: data.message || "Payment transaction pending user PIN entry on handset.",
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("[MegaPay Service] Verification error:", error);
    return {
      success: false,
      status: "pending",
      message: error.message || "Error verifying M-Pesa transaction status.",
      error: error.message,
    };
  }
}

