import { useEffect } from "react";

interface HelmetProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export function Helmet({ title, description, keywords, image, url }: HelmetProps) {
  useEffect(() => {
    // 1. Update Browser Dynamic Document Title
    document.title = title;

    const defaultDesc = "Tech Sokoni Kenya provides premium laptops, desktops, and accessories along Kenyatta Avenue, Nairobi.";
    const activeDesc = description || defaultDesc;
    const activeImage = image || "https://techsokoni.com/src/assets/images/tech_soko_logo_1783961449391.jpg";
    const activeUrl = url || window.location.href;

    // Helper helper to set or create meta property/name tags
    const setMetaTag = (attributeName: "name" | "property", value: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${value}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Standard Description and Keywords
    setMetaTag("name", "description", activeDesc);
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 3. OpenGraph tags
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("property", "og:image", activeImage);
    setMetaTag("property", "og:url", activeUrl);
    setMetaTag("property", "og:type", "product");

    // 4. Twitter Card tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", activeDesc);
    setMetaTag("name", "twitter:image", activeImage);

  }, [title, description, keywords, image, url]);

  return null;
}
