import { Product } from "../types";

export interface ShareOptions {
  product: Product;
  platform?: "native" | "facebook" | "twitter" | "instagram" | "whatsapp" | "copy";
  customMessage?: string;
  baseUrl?: string;
}

export interface ShareResult {
  success: boolean;
  platform: string;
  method: "native" | "web_dialog" | "clipboard" | "error";
  message?: string;
}

export class SocialShareManager {
  private static getProductUrl(productId: string, baseUrl?: string): string {
    const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://techsokoni.com");
    return `${origin}/?product=${productId}`;
  }

  private static formatShareText(product: Product, customMessage?: string): string {
    if (customMessage) return customMessage;
    const priceFormatted = `KES ${product.price.toLocaleString()}`;
    return `🔥 Check out the ${product.name} (${product.brand}) on Tech Sokoni Kenya!\nPrice: ${priceFormatted}\nCategory: ${product.category}\n\nGenuine imported electronics with Lipa Na M-Pesa & same-day Nairobi delivery!`;
  }

  /**
   * Primary share method routing to specific platform or Web Share API
   */
  public static async share(options: ShareOptions): Promise<ShareResult> {
    const { product, platform = "native", customMessage, baseUrl } = options;
    const shareUrl = this.getProductUrl(product.id, baseUrl);
    const text = this.formatShareText(product, customMessage);

    // 1. Native Web Share API if platform is native or explicitly requested
    if (platform === "native" && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${product.brand} ${product.name} - Tech Sokoni Kenya`,
          text: text,
          url: shareUrl,
        });
        return { success: true, platform: "native", method: "native" };
      } catch (err: any) {
        if (err.name === "AbortError") {
          return { success: false, platform: "native", method: "native", message: "Share cancelled by user." };
        }
        // Fallthrough to clipboard copy or web dialog if native share failed
      }
    }

    // 2. Specific Platform Handlers
    switch (platform) {
      case "facebook": {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
        if (typeof window !== "undefined") {
          window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
        }
        return { success: true, platform: "facebook", method: "web_dialog" };
      }

      case "twitter": {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=TechSokoni,LaptopsKenya,NairobiTech`;
        if (typeof window !== "undefined") {
          window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=500");
        }
        return { success: true, platform: "twitter", method: "web_dialog" };
      }

      case "whatsapp": {
        const waText = `${text}\n\n👉 View details: ${shareUrl}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        if (typeof window !== "undefined") {
          window.open(waUrl, "_blank", "noopener,noreferrer");
        }
        return { success: true, platform: "whatsapp", method: "web_dialog" };
      }

      case "instagram": {
        // Instagram doesn't support direct URL sharing via query string; copy formatted text & link to clipboard and prompt user
        const igCopyText = `${product.name} (${product.brand}) - ${text}\nLink: ${shareUrl}`;
        const copied = await this.copyToClipboard(igCopyText);
        if (typeof window !== "undefined") {
          window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        }
        return {
          success: copied,
          platform: "instagram",
          method: "clipboard",
          message: "Product details & link copied to clipboard! Opening Instagram..."
        };
      }

      case "copy":
      default: {
        const copySuccess = await this.copyToClipboard(`${text}\n${shareUrl}`);
        return {
          success: copySuccess,
          platform: "copy",
          method: "clipboard",
          message: copySuccess ? "Link & description copied to clipboard!" : "Failed to copy link."
        };
      }
    }
  }

  /**
   * Helper to safely copy text to system clipboard
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        // Fallback for older browsers
      }
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if native Web Share API is available on current device
   */
  public static isNativeShareSupported(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }
}
