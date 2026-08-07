import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const aiPanel = document.getElementById("ai-advisor-panel");
      setIsAiPanelOpen(!!aiPanel);

      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    
    // MutationObserver to detect when #ai-advisor-panel is opened or closed
    const observer = new MutationObserver(() => {
      const aiPanel = document.getElementById("ai-advisor-panel");
      setIsAiPanelOpen(!!aiPanel);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Check initial status
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    } catch (err) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  if (isAiPanelOpen) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          id="global-back-to-top-btn"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-36 right-5 sm:bottom-24 sm:right-6 z-40 bg-[#C5A059] hover:bg-[#b08e4d] text-black rounded-full p-3 shadow-2xl border border-white/20 flex items-center justify-center cursor-pointer transition-all group"
          title="Return to Top"
          aria-label="Return to Top"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Return to Top</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
