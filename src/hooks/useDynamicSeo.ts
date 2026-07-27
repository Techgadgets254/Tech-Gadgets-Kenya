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
 * for social media link sharing previews (WhatsApp, Twitter, Facebook, LinkedIn).
 */
export function useDynamicSeo(
  activeView: string,
  activeProduct: Product | null = null
): SeoData {
  return useMemo(() => {
    const defaultSiteImage = "https://techsokoni.com/src/assets/images/tech_soko_logo_1783961449391.jpg";
    const shopOgImage = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80";
    const checkoutOgImage = "https://images.unsplash.com/photo-1556742049-0a67568d0d9f?w=1200&auto=format&fit=crop&q=80";
    const adminOgImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80";

    if (activeView === "product-details" && activeProduct) {
      const pImage = activeProduct.image || activeProduct.gallery?.[0] || defaultSiteImage;
      return {
        title: `${activeProduct.name} | Tech Sokoni Kenya`,
        description: `Buy ${activeProduct.name} for KES ${activeProduct.price.toLocaleString()} in Nairobi. ${activeProduct.description ? activeProduct.description.slice(0, 140) + "..." : "Genuine imported hardware with Lipa Na M-Pesa."}`,
        keywords: `${activeProduct.name}, ${activeProduct.brand}, buy laptop Nairobi, Tech Sokoni Kenya`,
        image: pImage,
        url: `https://techsokoni.com/product/${activeProduct.id}`,
        type: "product"
      };
    }

    switch (activeView) {
      case "home":
        return {
          title: "Tech Sokoni Kenya | Premium Laptops, Desktops & Enterprise Electronics",
          description: "Discover genuine business laptops, high-performance workstations, and smart gadgets in Nairobi. Instant Safaricom Lipa Na M-Pesa checkout with same-day dispatch.",
          keywords: "Tech Sokoni Kenya, laptops Nairobi, M-Pesa electronics, refurbished laptops Kenya, Dell XPS Nairobi, HP EliteBook Kenya, Lenovo ThinkPad Nairobi",
          image: defaultSiteImage,
          url: "https://techsokoni.com/",
          type: "website"
        };
      case "shop":
        return {
          title: "Browse Electronics & Laptop Inventory | Tech Sokoni Kenya",
          description: "Explore our live inventory of Intel Core i7 & i9 laptops, workstation PCs, graphics tablets, and tech accessories with instant M-Pesa pay option.",
          keywords: "Buy laptops Nairobi, HP EliteBook Kenya, ThinkPad Nairobi, gaming laptops Kenya, refurbished computers Nairobi CBD",
          image: shopOgImage,
          url: "https://techsokoni.com/shop",
          type: "website"
        };
      case "product-details":
        return {
          title: "Detailed Specifications & Live Stock | Tech Sokoni Kenya",
          description: "Inspect component specifications, live local inventory levels, local warranty coverage, and request direct WhatsApp stock alerts instantly.",
          keywords: "Laptop hardware specs Nairobi, computer price drop alert Kenya, Tech Sokoni stock",
          image: defaultSiteImage,
          url: "https://techsokoni.com/product-details",
          type: "product"
        };
      case "checkout":
        return {
          title: "Secure Lipa Na M-Pesa STK Push Checkout | Tech Sokoni Kenya",
          description: "Settle orders safely using Safaricom Daraja M-Pesa STK Push pin prompt with rapid regional courier tracking across all Kenya counties.",
          keywords: "M-Pesa STK push checkout, Pay till number Nairobi, Safaricom Daraja checkout, Tech Sokoni buy",
          image: checkoutOgImage,
          url: "https://techsokoni.com/checkout",
          type: "website"
        };
      case "client-dashboard":
        return {
          title: "Client Portal & Delivery Tracking Hub | Tech Sokoni Kenya",
          description: "Trace live delivery timelines, view order status history, download official tax invoices, and access partner referral reward codes.",
          keywords: "Tech Sokoni order tracking, download invoice Kenya, Nairobi courier delivery, partner rewards",
          image: defaultSiteImage,
          url: "https://techsokoni.com/client-dashboard",
          type: "website"
        };
      case "admin-dashboard":
        return {
          title: "Management Console & Stock Control | Tech Sokoni Kenya",
          description: "Confidential store administration console for managing inventory catalog, CSV imports, and WhatsApp webhook notifications.",
          keywords: "Tech Sokoni admin console, catalog inventory manager, Kenya Daraja API integration",
          image: adminOgImage,
          url: "https://techsokoni.com/admin-dashboard",
          type: "website"
        };
      case "news":
        return {
          title: "Kenya Tech Insights & Hardware News | Tech Sokoni Kenya",
          description: "Stay informed on global computer import trends, KRA customs clearance guidelines, and Nairobi electronics price drop analysis.",
          keywords: "Kenya tech blogs, Nairobi computer market trends, KRA tech import guides, Nairobi gadgets blog",
          image: defaultSiteImage,
          url: "https://techsokoni.com/news",
          type: "article"
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
