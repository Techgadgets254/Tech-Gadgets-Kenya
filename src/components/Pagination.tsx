import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion } from "motion/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemNameSingular?: string;
  itemNamePlural?: string;
  scrollToId?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemNameSingular = "item",
  itemNamePlural = "items",
  scrollToId
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
    if (scrollToId) {
      const el = document.getElementById(scrollToId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();
  const startItemIndex = (currentPage - 1) * itemsPerPage + 1;
  const endItemIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 shadow-xl font-mono text-[11px] text-white/50 w-full"
      id="custom-pagination-container"
    >
      <div className="select-none text-center sm:text-left">
        Showing <span className="text-[#C5A059] font-bold">{startItemIndex}</span> to{" "}
        <span className="text-[#C5A059] font-bold">{endItemIndex}</span> of{" "}
        <span className="text-white font-bold">{totalItems}</span> {totalItems === 1 ? itemNameSingular : itemNamePlural}
      </div>
      
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageSelect(1)}
          className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/10 transition-all cursor-pointer bg-[#0F0F0F] text-white active:scale-95 flex items-center justify-center"
          title="First Page"
          id="pagination-first-btn"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageSelect(currentPage - 1)}
          className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/10 transition-all cursor-pointer bg-[#0F0F0F] text-white active:scale-95 flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
          title="Previous Page"
          id="pagination-prev-btn"
        >
          <ChevronLeft className="w-3 h-3" />
          <span className="hidden xs:inline">Prev</span>
        </button>
        
        {/* Page Numbers */}
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="w-7 h-7 flex items-center justify-center text-white/30 select-none font-bold"
              >
                ...
              </span>
            );
          }
          
          const isSelected = currentPage === page;
          return (
            <button
              key={`page-${page}`}
              onClick={() => handlePageSelect(page as number)}
              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all border cursor-pointer active:scale-95 flex items-center justify-center relative ${
                isSelected
                  ? "bg-[#C5A059] text-black border-[#C5A059] font-extrabold shadow-md"
                  : "bg-[#0F0F0F] text-white border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059]"
              }`}
              id={`pagination-page-${page}`}
            >
              {isSelected && (
                <motion.span 
                  layoutId="pagination-active-pill"
                  className="absolute inset-0 bg-[#C5A059] rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={isSelected ? "text-black font-extrabold" : "text-white"}>
                {page}
              </span>
            </button>
          );
        })}

        {/* Next Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageSelect(currentPage + 1)}
          className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/10 transition-all cursor-pointer bg-[#0F0F0F] text-white active:scale-95 flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
          title="Next Page"
          id="pagination-next-btn"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Last Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageSelect(totalPages)}
          className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 hover:text-[#C5A059] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/10 transition-all cursor-pointer bg-[#0F0F0F] text-white active:scale-95 flex items-center justify-center"
          title="Last Page"
          id="pagination-last-btn"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
