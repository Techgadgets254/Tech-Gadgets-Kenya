import { useEffect, useState } from "react";
import { Product } from "../types";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface HelmetProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  product?: Product;
}

export function Helmet({ title, description, keywords, image, url, type, product }: HelmetProps) {
  const [googleSiteVerification, setGoogleSiteVerification] = useState("");

  useEffect(() => {
    const fetchSiteMetadata = async () => {
      try {
        const seoRef = doc(db, "seo_metadata", "site");
        const snap = await getDoc(seoRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.googleSiteVerification) {
            setGoogleSiteVerification(data.googleSiteVerification);
          }
        }
      } catch (err) {
        console.error("Error loading verification meta:", err);
      }
    };
    fetchSiteMetadata();
  }, []);

  useEffect(() => {
    const defaultDesc = "Tech Sokoni Kenya provides premium laptops, desktops, and accessories along Kenyatta Avenue, Nairobi with instant Lipa Na M-Pesa delivery.";
    
    // Dynamically derive attributes based on product data if present
    const activeTitle = product ? `${product.name} | Tech Sokoni Kenya` : title;
    const activeDesc = product?.description || description || defaultDesc;
    
    let productImgUrl = "";
    if (product?.image) {
      productImgUrl = product.image.startsWith("http") 
        ? product.image 
        : `https://techsokoni.com${product.image.startsWith("/") ? "" : "/"}${product.image}`;
    }
    const activeImage = productImgUrl || image || "https://techsokoni.com/src/assets/images/tech_soko_logo_1783961449391.jpg";
    const activeUrl = product ? `https://techsokoni.com/product/${product.id}` : (url || window.location.href);
    const activeType = product ? "product" : (type || "website");

    // 1. Update Browser Dynamic Document Title
    document.title = activeTitle;

    // Helper to set or create meta property/name tags
    const setMetaTag = (attributeName: "name" | "property", value: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${value}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    if (googleSiteVerification) {
      setMetaTag("name", "google-site-verification", googleSiteVerification);
    }

    // 2. Standard Description and Keywords
    setMetaTag("name", "description", activeDesc);
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 3. OpenGraph tags (Optimized for WhatsApp, Facebook, LinkedIn previews)
    setMetaTag("property", "og:title", activeTitle);
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("property", "og:image", activeImage);
    setMetaTag("property", "og:image:secure_url", activeImage);
    setMetaTag("property", "og:url", activeUrl);
    setMetaTag("property", "og:type", activeType);
    setMetaTag("property", "og:site_name", "Tech Sokoni Kenya");
    setMetaTag("property", "og:locale", "en_KE");

    // 4. Twitter Card tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", activeTitle);
    setMetaTag("name", "twitter:description", activeDesc);
    setMetaTag("name", "twitter:image", activeImage);
    setMetaTag("name", "twitter:site", "@TechSokoniKE");
    setMetaTag("name", "twitter:creator", "@TechSokoniKE");

    // 5. Dynamic JSON-LD structured data injection for Product Crawling
    if (product) {
      let scriptElement = document.getElementById("helmet-jsonld") as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = "helmet-jsonld";
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }

      const ratingValue = product.rating || 4.8;
      const isRefurbished = product.category?.toLowerCase().includes("refurbished") || product.name?.toLowerCase().includes("refurbished");
      const availability = (product.stock !== undefined && product.stock > 0) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock";

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image ? (product.image.startsWith("http") ? product.image : `https://techsokoni.com${product.image}`) : "https://techsokoni.com/logo.png",
        "description": product.description || `Genuine ${product.name} with local warranty, available at Tech Sokoni Kenya.`,
        "brand": {
          "@type": "Brand",
          "name": product.brand || "Tech Sokoni"
        },
        "sku": product.id,
        "mpn": product.id,
        "offers": {
          "@type": "Offer",
          "url": `https://techsokoni.com/product/${product.id}`,
          "priceCurrency": "KES",
          "price": product.price,
          "priceValidUntil": "2027-12-31",
          "itemCondition": isRefurbished ? "https://schema.org/RefurbishedCondition" : "https://schema.org/NewCondition",
          "availability": availability,
          "seller": {
            "@type": "Organization",
            "name": "Tech Sokoni Kenya",
            "url": "https://techsokoni.com"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingValue,
          "reviewCount": product.reviews?.length || 1,
          "bestRating": "5",
          "worstRating": "1"
        }
      };

      scriptElement.textContent = JSON.stringify(jsonLd);
    } else {
      const existingScript = document.getElementById("helmet-jsonld");
      if (existingScript) {
        existingScript.remove();
      }
    }

    return () => {
      // Cleanup dynamically created script on unmount
      const existingScript = document.getElementById("helmet-jsonld");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, image, url, product, googleSiteVerification]);

  return null;
}
