import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white/[0.02]">
      {/* Skeleton Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 animate-pulse">
          <Loader2 className="w-5 h-5 text-[#C5A059]/40 animate-spin" />
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
