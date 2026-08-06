import { useMemo } from "react";
import { Product } from "../types";

export interface SeoData {
  title: string;
  description: string;
  keywords: string;
  image: string;
  url: string;
  type: string;
}

/**
 * Custom React Hook that dynamically calculates route-specific SEO and Open Graph (OG) metadata
 * for social media link sharing previews (WhatsApp, Twitter, Facebook, LinkedIn, Instagram).
 * Generates specific, high-resolution OG images (1200x630 format) and tailored descriptions for each page.
 */
export function useDynamicSeo(
  activeView: string,
  activeProduct: Product | null = null
): SeoData {
  return useMemo(() => {
    // High-resolution 1200x630 OG image assets for optimal social sharing cards
    const defaultSiteImage = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=630&auto=format&fit=crop&q=80";
    const shopOgImage = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=630&auto=format&fit=crop&q=80";
    const checkoutOgImage = "https://images.unsplash.com/photo-1556742049-0a67568d0d9f?w=1200&h=630&auto=format&fit=crop&q=80";
    const clientOgImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&auto=format&fit=crop&q=80";
    const adminOgImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&auto=format&fit=crop&q=80";
    const newsOgImage = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&auto=format&fit=crop&q=80";

    // Format product image to ensure high resolution
    const formatHighResImage = (imgUrl?: string) => {
      if (!imgUrl) return defaultSiteImage;
      if (imgUrl.includes("images.unsplash.com")) {
        return imgUrl.replace(/w=\d+/, "w=1200").replace(/q=\d+/, "q=80");
      }
      return imgUrl;
    };

    if (activeView === "product-details" && activeProduct) {
      const pImage = formatHighResImage(activeProduct.image || activeProduct.gallery?.[0]);
      const formattedPrice = `KES ${activeProduct.price.toLocaleString()}`;
      const stockStatus = activeProduct.stock > 0 ? `In Stock (${activeProduct.stock} units)` : "Out of Stock - Request Alert";
      const cleanDesc = activeProduct.description 
        ? activeProduct.description.replace(/\s+/g, " ").slice(0, 150) + "..."
        : `Buy the genuine ${activeProduct.brand} ${activeProduct.name} at Tech Sokoni Kenya in Nairobi.`;

      return {
        title: `${activeProduct.name} (${formattedPrice}) | Tech Sokoni Kenya`,
        description: `Buy ${activeProduct.brand} ${activeProduct.name} for ${formattedPrice} in Nairobi. ${stockStatus}. ${cleanDesc} M-Pesa STK Push accepted.`,
        keywords: `${activeProduct.name}, ${activeProduct.brand}, ${activeProduct.category}, buy laptop Nairobi, Tech Sokoni Kenya, M-Pesa electronics`,
        image: pImage,
        url: `https://techsokoni.com/?product=${activeProduct.id}`,
        type: "product"
      };
    }

    switch (activeView) {
      case "home":
        return {
          title: "Tech Sokoni Kenya | Premium Laptops, Desktops & Enterprise Electronics",
          description: "Discover genuine Apple MacBooks, HP EliteBooks, Dell XPS workstations, and iPhones along Kenyatta Avenue, Nairobi. Instant M-Pesa STK Push checkout with same-day dispatch.",
          keywords: "Tech Sokoni Kenya, laptops Nairobi, M-Pesa electronics, refurbished laptops Kenya, Dell XPS Nairobi, HP EliteBook Kenya, Lenovo ThinkPad Nairobi, Apple MacBook Nairobi",
          image: defaultSiteImage,
          url: "https://techsokoni.com/",
          type: "website"
        };
      case "shop":
        return {
          title: "Live Hardware Catalog & Electronics Store | Tech Sokoni Kenya",
          description: "Browse our live inventory of Intel Core i7/i9 laptops, Apple Silicon M3 MacBooks, workstations, and high-spec phones with instant M-Pesa payment and same-day delivery.",
          keywords: "Buy laptops Nairobi, HP EliteBook Kenya, ThinkPad Nairobi, gaming laptops Kenya, refurbished computers Nairobi CBD, Apple Kenya store",
          image: shopOgImage,
          url: "https://techsokoni.com/?view=shop",
          type: "website"
        };
      case "product-details":
        return {
          title: "Detailed Specifications & Live Stock | Tech Sokoni Kenya",
          description: "Inspect component specifications, live local inventory levels, local warranty coverage, and request direct WhatsApp stock alerts instantly.",
          keywords: "Laptop hardware specs Nairobi, computer price drop alert Kenya, Tech Sokoni stock, Apple specs Nairobi",
          image: shopOgImage,
          url: "https://techsokoni.com/?view=product-details",
          type: "product"
        };
      case "checkout":
        return {
          title: "Secure Lipa Na M-Pesa STK Push Checkout | Tech Sokoni Kenya",
          description: "Settle orders safely using Safaricom Daraja M-Pesa STK Push PIN prompt with rapid regional courier tracking across all 47 Kenya counties.",
          keywords: "M-Pesa STK push checkout, Pay till number Nairobi, Safaricom Daraja checkout, Tech Sokoni buy",
          image: checkoutOgImage,
          url: "https://techsokoni.com/?view=checkout",
          type: "website"
        };
      case "client-dashboard":
        return {
          title: "Client Portal & Delivery Tracking Hub | Tech Sokoni Kenya",
          description: "Trace live delivery timelines, view order status history, download official tax invoices, manage price alerts, and access partner referral reward codes.",
          keywords: "Tech Sokoni order tracking, download invoice Kenya, Nairobi courier delivery, partner rewards",
          image: clientOgImage,
          url: "https://techsokoni.com/?view=client-dashboard",
          type: "website"
        };
      case "admin-dashboard":
        return {
          title: "Management Console & Stock Control | Tech Sokoni Kenya",
          description: "Confidential store administration console for managing inventory catalog, CSV imports, M-Pesa transactions, and WhatsApp webhook notifications.",
          keywords: "Tech Sokoni admin console, catalog inventory manager, Kenya Daraja API integration",
          image: adminOgImage,
          url: "https://techsokoni.com/?view=admin-dashboard",
          type: "website"
        };
      case "news":
        return {
          title: "Kenya Tech Insights & Hardware News | Tech Sokoni Kenya",
          description: "Stay informed on global computer import trends, KRA customs clearance guidelines, Apple Silicon performance benchmarks, and Nairobi electronics market analysis.",
          keywords: "Kenya tech blogs, Nairobi computer market trends, KRA tech import guides, Nairobi gadgets blog",
          image: newsOgImage,
          url: "https://techsokoni.com/?view=news",
          type: "article"
        };
      case "return-policy":
        return {
          title: "Official 30-Day Return & Refund Policy | Tech Sokoni Kenya",
          description: "Tech Sokoni Kenya official 30-day return policy. 100% free returns on defective items, KES 0 restocking fee, same-day M-Pesa refunds within 3-5 business days.",
          keywords: "Tech Sokoni return policy, 30 day return window Kenya, electronics refund Nairobi, M-Pesa refund Kenya, free returns Nairobi CBD",
          image: defaultSiteImage,
          url: "https://techsokoni.com/return-policy",
          type: "website"
        };
      default:
        return {
          title: "Tech Sokoni Kenya | High-Performance Electronics",
          description: "Premium computer imports, enterprise electronics, and accessories along Kenyatta Avenue, Nairobi. Fast Safaricom M-Pesa checkout.",
          keywords: "Tech Sokoni Kenya, laptops Nairobi, M-Pesa electronics",
          image: defaultSiteImage,
          url: "https://techsokoni.com/",
          type: "website"
        };
    }
  }, [activeView, activeProduct]);
}

