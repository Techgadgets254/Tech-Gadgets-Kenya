import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate ultra-low resolution thumbnail for progressive blur-up effect
  const lowResSrc = src && src.includes("images.unsplash.com")
    ? src.replace(/w=\d+/, "w=24").replace(/q=\d+/, "q=15")
    : src;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#121212]">
      {/* Blur-up Progressive Placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 overflow-hidden bg-neutral-900">
          {lowResSrc && (
            <img
              src={lowResSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-xl scale-125 opacity-60 transition-opacity duration-500"
            />
          )}
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-tr from-[#C5A059]/10 via-transparent to-white/5"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#C5A059]/50 animate-spin" />
          </div>
        </div>
      )}

      {/* High-Resolution Final Image */}
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{
          opacity: loaded ? 1 : 0,
          filter: loaded ? "blur(0px)" : "blur(10px)"
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`${className}`}
      />
    </div>
  );
}
