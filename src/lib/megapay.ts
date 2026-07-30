export interface MegaPayInitParams {
  orderId: string;
  email: string;
  amount: number;
  phone?: string;
}

export interface MegaPayInitResponse {
  success: boolean;
  mode: "real" | "simulated";
  authUrl?: string;
  reference?: string;
  message?: string;
  error?: string;
}

export interface MegaPayVerifyResponse {
  success: boolean;
  receiptNo?: string;
  message: string;
  status?: string;
  error?: string;
}

/**
 * Initiates an M-Pesa Express payment transaction via MegaPay API endpoint.
 * Utilizes MEGAPAY_API_KEY environment variable defined on the server side.
 */
export async function initializeMegaPayPayment(params: MegaPayInitParams): Promise<MegaPayInitResponse> {
  try {
    const response = await fetch("/api/megapay/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        orderId: params.orderId,
        phone: params.phone || "",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        mode: "simulated",
        message: data.error || data.message || "Failed to initialize M-Pesa payment session.",
      };
    }

    return {
      success: true,
      mode: data.mode || "real",
      authUrl: data.authorization_url,
      reference: data.reference,
      message: data.message || "M-Pesa payment initialized successfully.",
    };
  } catch (error: any) {
    console.error("[MegaPay] Payment initialization error:", error);
    return {
      success: false,
      mode: "simulated",
      message: error.message || "Network error communicating with M-Pesa gateway.",
    };
  }
}

/**
 * Verifies M-Pesa transaction status for a given transaction reference.
 */
export async function verifyMegaPayPayment(orderId: string, reference: string): Promise<MegaPayVerifyResponse> {
  try {
    const response = await fetch(`/api/megapay/verify/${reference}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || data.message || "Failed to verify M-Pesa transaction.",
      };
    }

    if (data.success && (data.status === "success" || data.mode === "simulated")) {
      return {
        success: true,
        receiptNo: data.reference || reference || "MPESA-OK",
        message: data.message || "M-Pesa payment verified successfully!",
      };
    }

    return {
      success: false,
      message: data.message || "Payment transaction pending or incomplete.",
    };
  } catch (error: any) {
    console.error("[MegaPay] Verification error:", error);
    return {
      success: false,
      message: error.message || "Error verifying M-Pesa transaction status.",
    };
  }
}
