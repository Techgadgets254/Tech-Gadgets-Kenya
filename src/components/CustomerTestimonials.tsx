import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Quote, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  ThumbsUp, 
  MessageSquarePlus, 
  X, 
  Building2, 
  Truck,
  UserCheck,
  ShoppingBag
} from "lucide-react";

export interface Testimonial {
  id: string;
  author: string;
  roleLocation: string;
  city: string;
  avatarBg: string;
  initials: string;
  rating: number;
  productBought: string;
  category: "Laptops" | "Phones" | "Printers" | "Accessories" | "Delivery & Service";
  verifiedBuy: boolean;
  deliveryMethod: string;
  date: string;
  headline: string;
  content: string;
  helpfulCount: number;
}

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    author: "Brian K. Ochieng",
    roleLocation: "Senior Software Engineer",
    city: "Westlands, Nairobi",
    avatarBg: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    initials: "BO",
    rating: 5,
    productBought: "Apple MacBook Pro 16\" M3 Max (32GB / 1TB)",
    category: "Laptops",
    verifiedBuy: true,
    deliveryMethod: "Express Rider (Westlands Office)",
    date: "2 days ago",
    headline: "Delivered to my office within 3 hours. Pristine condition!",
    content: "I needed a high-spec M3 Max for heavy machine learning workflows and couldn't wait weeks for importation. Tech Soko Kenya had it in stock at their Nairobi store. Placed order at 10:15 AM via M-Pesa Buy Goods Till 9309020, and the rider delivered it sealed in box by 1:00 PM with tax invoice.",
    helpfulCount: 34
  },
  {
    id: "t2",
    author: "Mercy Wambui",
    roleLocation: "Operations Director, Apex Financial",
    city: "Kilimani, Nairobi",
    avatarBg: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    initials: "MW",
    rating: 5,
    productBought: "HP EliteBook 840 G8 Intel i7 (Grade A Refurbished)",
    category: "Laptops",
    verifiedBuy: true,
    deliveryMethod: "Same-Day Courier",
    date: "5 days ago",
    headline: "Grade A Refurbished condition exceeded my expectations!",
    content: "Honestly skeptical about refurbished laptops in Nairobi, but Tech Soko proved me wrong. Battery cycle count was under 20, body was scratch-free, and it came with a full 12-month store warranty certificate. Equipped 5 laptops for our team smoothly.",
    helpfulCount: 28
  },
  {
    id: "t3",
    author: "David O. Anyango",
    roleLocation: "Creative Lead / Photographer",
    city: "Mombasa CBD, Coast",
    avatarBg: "bg-sky-600/20 text-sky-400 border-sky-500/30",
    initials: "DA",
    rating: 5,
    productBought: "Epson EcoTank L3250 Wi-Fi All-in-One",
    category: "Printers",
    verifiedBuy: true,
    deliveryMethod: "Fargo Courier Overnight",
    date: "1 week ago",
    headline: "Safe overnight shipping to Coast with tracking updates",
    content: "Ordered from Mombasa on Tuesday afternoon. Received Fargo Courier tracking code on SMS within 45 minutes. Item arrived at Fargo Mombasa depot early Wednesday morning in double-bubble wrapped shock protection. Printing photo proofs seamlessly now.",
    helpfulCount: 19
  },
  {
    id: "t4",
    author: "Dr. Kevin Mutua",
    roleLocation: "Lecturer & AI Researcher",
    city: "Eldoret Town, Uasin Gishu",
    avatarBg: "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30",
    initials: "KM",
    rating: 5,
    productBought: "Dell XPS 15 9530 Core i9 (64GB RAM / 2TB SSD)",
    category: "Laptops",
    verifiedBuy: true,
    deliveryMethod: "EasyCoach Security Parcel",
    date: "2 weeks ago",
    headline: "Unbeatable technical specs & instant WhatsApp support",
    content: "Finding workstation-class laptops with 64GB RAM in Kenya is rare without insane markups. Tech Soko offered competitive KES pricing and verified the exact RAM configuration live via WhatsApp video before dispatch.",
    helpfulCount: 42
  },
  {
    id: "t5",
    author: "Sarah Njeri",
    roleLocation: "Digital Marketing Specialist",
    city: "Nakuru City",
    avatarBg: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    initials: "SN",
    rating: 5,
    productBought: "Samsung Galaxy S24 Ultra 5G (512GB)",
    category: "Phones",
    verifiedBuy: true,
    deliveryMethod: "Direct Store Dispatch",
    date: "3 weeks ago",
    headline: "M-Pesa STK Push payment was 100% secure and smooth",
    content: "The automatic Safaricom STK Push prompt on checkout made payment quick and foolproof. Phone is genuine East Africa official stock with official 24-month Samsung East Africa warranty.",
    helpfulCount: 15
  },
  {
    id: "t6",
    author: "James P. Kipchoge",
    roleLocation: "Managing Partner, Kipchoge & Co. Advocates",
    city: "Upper Hill, Nairobi",
    avatarBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    initials: "JK",
    rating: 5,
    productBought: "Kyocera ECOSYS M2040dn Heavy-Duty Duplex Printer",
    category: "Printers",
    verifiedBuy: true,
    deliveryMethod: "Corporate Office Van",
    date: "1 month ago",
    headline: "Seamless corporate invoicing & VAT tax compliance",
    content: "Our law firm needed high-volume duplex printing. Tech Soko's finance team emailed an official KRA PIN compliant E-TIMS VAT invoice within 10 minutes of payment confirmation. Professional service end-to-end.",
    helpfulCount: 31
  }
];

export default function CustomerTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [helpfulLiked, setHelpfulLiked] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  // New review form fields
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Nairobi");
  const [formRole, setFormRole] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formCategory, setFormCategory] = useState<"Laptops" | "Phones" | "Printers" | "Accessories" | "Delivery & Service">("Laptops");
  const [formRating, setFormRating] = useState(5);
  const [formHeadline, setFormHeadline] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formMpesaCode, setFormMpesaCode] = useState("");

  const categories = ["All", "Laptops", "Phones", "Printers", "Delivery & Service"];

  const filteredTestimonials = testimonials.filter(t => {
    if (selectedCategory === "All") return true;
    return t.category === selectedCategory;
  });

  const handleHelpfulClick = (id: string) => {
    if (helpfulLiked[id]) return;
    setHelpfulLiked(prev => ({ ...prev, [id]: true }));
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, helpfulCount: t.helpfulCount + 1 } : t));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim() || !formProduct.trim()) return;

    const initials = formName.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "TS";
    const colors = [
      "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
      "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30",
      "bg-sky-600/20 text-sky-400 border-sky-500/30",
      "bg-amber-600/20 text-amber-400 border-amber-500/30"
    ];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const newReview: Testimonial = {
      id: "rev-" + Date.now(),
      author: formName.trim(),
      roleLocation: formRole.trim() || "Verified Shopper",
      city: formCity.trim() || "Kenya",
      avatarBg: randomBg,
      initials,
      rating: formRating,
      productBought: formProduct.trim(),
      category: formCategory,
      verifiedBuy: formMpesaCode.trim().length > 3,
      deliveryMethod: "M-Pesa Verified Purchase",
      date: "Just now",
      headline: formHeadline.trim() || "Great purchasing experience!",
      content: formContent.trim(),
      helpfulCount: 1
    };

    setTestimonials([newReview, ...testimonials]);
    setIsModalOpen(false);
    setSubmittedToast(true);

    // Reset form
    setFormName("");
    setFormRole("");
    setFormProduct("");
    setFormHeadline("");
    setFormContent("");
    setFormMpesaCode("");

    setTimeout(() => {
      setSubmittedToast(false);
    }, 6000);
  };

  return (
    <section className="mb-14">
      {/* Toast notification */}
      {createPortal(
        <AnimatePresence>
          {submittedToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 sm:right-8 z-[99999] bg-emerald-950 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs font-sans">
                <p className="font-bold text-white text-sm">Review Published Successfully!</p>
                <p className="text-emerald-300/80">Thank you for sharing your experience with fellow Kenyan shoppers.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Trust & Rating Summary Banner */}
      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                100% Authentic Verified Buyer Reviews
              </span>
            </div>
            <h2 className="font-serif italic text-2xl sm:text-3xl font-light text-white tracking-tight">
              Trusted by 1,850+ Tech Buyers Across Kenya
            </h2>
            <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl font-sans">
              Read real experiences from software developers, corporate buyers, students, and professionals in Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-full lg:w-auto shrink-0">
            <div className="text-center sm:text-left pr-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <span className="text-2xl font-black font-sans text-white">4.9</span>
                <div className="flex text-[#C5A059]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-white/40 font-mono block mt-0.5 text-center sm:text-left">Out of 5.0 (1,850+ Ratings)</span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-sans text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">M-Pesa Till 9309020 Authenticated</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-white/70">
                <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Same-Day Nairobi & Express Countrywide</span>
              </div>
            </div>

            <div className="w-full sm:w-auto flex justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#C5A059]/20"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Write a Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#C5A059] text-black font-bold shadow-md"
                  : "bg-[#0F0F0F] text-white/60 hover:text-white border border-white/10 hover:border-white/20"
              }`}
            >
              {cat === "All" ? "All Customer Reviews" : cat}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-white/40">
          Showing {filteredTestimonials.length} verified reviews
        </span>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTestimonials.map((review) => (
          <div
            key={review.id}
            className="bg-[#0F0F0F] border border-white/10 hover:border-[#C5A059]/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group relative"
          >
            <div>
              {/* Header: User details & Rating */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-sm ${review.avatarBg}`}>
                    {review.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-sans font-bold text-sm text-white group-hover:text-[#C5A059] transition-colors">
                        {review.author}
                      </h4>
                      {review.verifiedBuy && (
                        <span title="M-Pesa Verified Buyer">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-sans">
                      <span className="truncate max-w-[120px]">{review.roleLocation}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-white/60 font-mono text-[10px]">
                        <MapPin className="w-2.5 h-2.5 text-[#C5A059]" />
                        {review.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex text-[#C5A059] shrink-0">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              {/* Purchased Product Badge */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-2.5 py-1.5 mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-white/70 truncate flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3 text-[#C5A059] shrink-0" />
                  {review.productBought}
                </span>
                <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  Verified
                </span>
              </div>

              {/* Review Headline & Content */}
              <h5 className="font-sans font-bold text-xs text-white mb-1.5 leading-snug">
                "{review.headline}"
              </h5>
              <p className="text-white/60 text-xs leading-relaxed font-sans line-clamp-4">
                {review.content}
              </p>
            </div>

            {/* Footer info & Helpful vote */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
              <span>{review.date} via {review.deliveryMethod}</span>

              <button
                onClick={() => handleHelpfulClick(review.id)}
                disabled={helpfulLiked[review.id]}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  helpfulLiked[review.id]
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Helpful ({review.helpfulCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Centered Write a Review Callout */}
      <div className="mt-8 bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 text-center space-y-3 max-w-xl mx-auto shadow-lg">
        <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mx-auto text-[#C5A059]">
          <MessageSquarePlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif italic text-lg text-white">Have you purchased from Tech Soko?</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto mt-1">
            Your honest feedback helps fellow tech shoppers across Nairobi and Kenya make informed decisions.
          </p>
        </div>
        <div className="pt-1 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#C5A059]/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Interactive Review Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div 
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0F0F0F] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative my-auto z-10"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-serif italic text-xl text-white">
                      Submit Your Customer Review
                    </h3>
                    <p className="text-xs text-white/50 font-sans mt-0.5">
                      Share your experience to guide shoppers across Kenya.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="text-center">
                    <label className="block text-[10px] font-mono font-bold text-[#C5A059] uppercase mb-1">
                      YOUR RATING
                    </label>
                    <div className="flex justify-center gap-2 text-[#C5A059]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= formRating ? "fill-current" : "text-white/20"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. John Kamau"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                        CITY / LOCATION *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. Westlands, Nairobi"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                        PRODUCT BOUGHT *
                      </label>
                      <input
                        type="text"
                        required
                        value={formProduct}
                        onChange={(e) => setFormProduct(e.target.value)}
                        placeholder="e.g. HP EliteBook 840 G8"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                        PRODUCT CATEGORY
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                      >
                        <option value="Laptops">Laptops</option>
                        <option value="Phones">Phones</option>
                        <option value="Printers">Printers</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Delivery & Service">Delivery & Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                      REVIEW TITLE / HEADLINE
                    </label>
                    <input
                      type="text"
                      value={formHeadline}
                      onChange={(e) => setFormHeadline(e.target.value)}
                      placeholder="e.g. Fast delivery and genuine device!"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-white/50 uppercase mb-1">
                      YOUR REVIEW *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Describe your purchasing, delivery, or product usage experience..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-white/40 uppercase mb-1">
                      M-PESA RECEIPT CODE (OPTIONAL - FOR VERIFIED BADGE)
                    </label>
                    <input
                      type="text"
                      value={formMpesaCode}
                      onChange={(e) => setFormMpesaCode(e.target.value)}
                      placeholder="e.g. SAK81920XX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-sans font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg"
                    >
                      Publish Review
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
