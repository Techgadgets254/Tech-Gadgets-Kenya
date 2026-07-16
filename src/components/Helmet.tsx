import { useEffect } from "react";

interface HelmetProps {
  title: string;
  description?: string;
  keywords?: string;
}

export function Helmet({ title, description, keywords }: HelmetProps) {
  useEffect(() => {
    // 1. Update Browser Dynamic Document Title
    document.title = title;

    // 2. Dynamically Inject Meta Description tag for Search Engine crawlers
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute("content", description);
    } else {
      metaDescription.setAttribute("content", "Tech Sokoni Kenya provides premium laptops, desktops, and accessories along Kenyatta Avenue, Nairobi.");
    }

    // 3. Optional SEO keywords tags
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }
  }, [title, description, keywords]);

  return null;
}
