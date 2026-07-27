import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../StoreContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Sparkles, 
  Send, 
  X, 
  MessagesSquare, 
  Bot, 
  User, 
  RotateCcw,
  Loader2,
  HelpCircle,
  Scale,
  Trash2,
  ShoppingCart,
  Check,
  Info,
  Search,
  Plus
} from "lucide-react";
import Markdown from "react-markdown";
import { cleanAiMarkdown } from "../lib/cleanAiMarkdown";

interface SavedConversation {
  id: string;
  title: string;
  timestamp: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

// Interactive Card for recommended items inside the AI Advisor chat
function RecommendedProductCard({ 
  product, 
  onAddToCart, 
  onToggleCompare, 
  isCompared 
}: { 
  product: any; 
  onAddToCart: (p: any) => void; 
  onToggleCompare: (p: any) => void; 
  isCompared: boolean; 
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 hover:border-[#C5A059]/40 rounded-xl p-3 w-[250px] shrink-0 flex flex-col justify-between transition-all shadow-md group select-none">
      <div>
        {/* Top Header */}
        <div className="flex gap-2.5 items-start">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-11 h-11 object-cover rounded-lg border border-white/5 bg-black/40 shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[8px] font-mono text-[#C5A059] uppercase tracking-wider font-semibold block">
              {product.brand}
            </span>
            <h4 className="font-sans font-bold text-[11px] text-white truncate leading-tight mt-0.5 group-hover:text-[#C5A059] transition-colors" title={product.name}>
              {product.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono font-bold text-[#E0E0E0]">
                KES {product.price.toLocaleString()}
              </span>
              {product.stock <= 0 ? (
                <span className="text-[7px] px-1 bg-red-500/10 text-red-400 border border-red-500/10 rounded-sm">Out of Stock</span>
              ) : product.stock <= 2 ? (
                <span className="text-[7px] px-1 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded-sm">Low Stock</span>
              ) : (
                <span className="text-[7px] px-1 bg-green-500/10 text-green-400 border border-green-500/10 rounded-sm">In Stock</span>
              )}
            </div>
          </div>
        </div>

        {/* Short Specs Summary (inline) */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(product.specifications).slice(0, 2).map(([key, value]: [string, any]) => (
              <span key={key} className="text-[7.5px] bg-white/[0.04] px-1.5 py-0.5 rounded-sm text-white/50 font-mono truncate max-w-[105px]" title={`${key}: ${value}`}>
                {value}
              </span>
            ))}
          </div>
        )}

        {/* Detailed Specs Accordion */}
        {showSpecs && product.specifications && (
          <div className="mt-2 pt-2 border-t border-white/5 text-[8.5px] text-white/70 space-y-1 font-sans">
            {Object.entries(product.specifications).map(([key, val]: [string, any]) => (
              <div key={key} className="flex justify-between gap-1 py-0.5 border-b border-white/[0.02]">
                <span className="text-white/40 capitalize shrink-0">{key}:</span>
                <span className="text-white/80 text-right font-medium truncate max-w-[140px]">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-1.5">
        <button
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className={`flex-1 font-sans font-bold text-[9px] py-1 px-2 rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
            added 
              ? "bg-green-600 text-white" 
              : "bg-[#C5A059] hover:bg-[#b08e4d] text-black disabled:bg-white/5 disabled:text-white/20"
          }`}
        >
          {added ? (
            <>
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-2.5 h-2.5" />
              <span>Buy/Add</span>
            </>
          )}
        </button>

        <button
          onClick={() => onToggleCompare(product)}
          className={`p-1 rounded-md border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            isCompared 
              ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" 
              : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/5"
          }`}
          title={isCompared ? "Remove from comparison" : "Add to comparison"}
        >
          <Scale className="w-2.5 h-2.5" />
        </button>

        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className={`p-1 rounded-md border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            showSpecs
              ? "bg-white/15 text-white border-white/25"
              : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/5"
          }`}
          title="Toggle Technical Specs"
        >
          <Info className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

export default function AIAdvisor() {
  const { products, compareList, toggleCompare, clearCompareList, addToCart } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        addDoc(collection(db, "user_activity"), {
          eventType: "open_ai_chat",
          timestamp: serverTimestamp(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Could not log AI Chat event to user_activity:", e);
      }
    }
  }, [isOpen]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hello! I am your Tech Sokoni Kenya AI Advisor. Ask me anything about our live hardware inventory, compare specs, or ask for professional recommendation on buying!"
    }
  ]);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persistent Chat History States
  const [conversations, setConversations] = useState<SavedConversation[]>(() => {
    try {
      const saved = localStorage.getItem("tech_soko_ai_conversations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");

  // Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  // Sync active chat history to localStorage automatically
  useEffect(() => {
    if (chatHistory.length <= 1 && !activeConversationId) return;

    let targetId = activeConversationId;
    let isNew = false;
    if (!targetId) {
      targetId = Date.now().toString();
      isNew = true;
    }

    setConversations((prev) => {
      let updated: SavedConversation[];
      const firstUserMsg = chatHistory.find((m) => m.role === "user")?.content || "Comparison Inquiry";
      const displayTitle = firstUserMsg.slice(0, 35) + (firstUserMsg.length > 35 ? "..." : "");
      
      const existingIdx = prev.findIndex((c) => c.id === targetId);
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages: chatHistory,
          timestamp: new Date().toISOString()
        };
      } else {
        const newConv: SavedConversation = {
          id: targetId!,
          title: displayTitle,
          timestamp: new Date().toISOString(),
          messages: chatHistory
        };
        updated = [newConv, ...prev];
      }

      localStorage.setItem("tech_soko_ai_conversations", JSON.stringify(updated));
      return updated;
    });

    if (isNew) {
      setActiveConversationId(targetId);
    }
  }, [chatHistory, activeConversationId]);

  const handleSendMessage = async (userMsgString: string) => {
    const textToSend = userMsgString || message;
    if (!textToSend.trim()) return;

    if (!userMsgString) {
      setMessage("");
    }

    const updatedHistory = [...chatHistory, { role: "user" as const, content: textToSend }];
    setChatHistory(updatedHistory);
    setLoading(true);

    try {
      let replyText = "";
      let handledByServer = false;

      // 1. First choice: Secure full-stack Server Proxy
      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            history: updatedHistory.slice(0, -1), // Send previous history
            productsContext: products // Dynamically ground in live catalog
          })
        });

        if (response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data.reply) {
              replyText = data.reply;
              handledByServer = true;
            }
          } catch (pe) {
            console.warn("AIAdvisor chat parse failed:", pe);
          }
        }
      } catch (srvErr) {
        console.warn("Express backend endpoint uncontactable, attempting VITE client-side fallback if key is present:", srvErr);
      }

      // 2. Second choice: Dual-mode fallback for static deployments (like Vercel)
      if (!handledByServer) {
        const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (clientApiKey) {
          // Dynamically import the Gemini library on-demand to optimize bundle and avoid side-effects
          const { GoogleGenAI } = await import("@google/genai");
          const clientAi = new GoogleGenAI({ apiKey: clientApiKey });

          const productsInfo = Array.isArray(products) 
            ? products.map(p => `- [${p.brand}] ${p.name} (${p.category}): KES ${p.price.toLocaleString()}. Stock: ${p.stock}. Description: ${p.description}. Specs: ${JSON.stringify(p.specifications || {})}`).join("\n")
            : "No products context available";

          const systemInstruction = `
You are the AI Hardware Specialist for "Tech Sokoni Kenya", an elite authorized electronics distributor in Nairobi, Kenya.
Your job is to assist clients professionally by answering queries about electronics, making product recommendations, comparing hardware side-by-side, and providing technical support.

Guidelines:
1. Always be professional, helpful, and objective.
2. Rely strictly on the following actual live stock database context to answer product, stock, price, and spec queries. Do not make up fake products if they aren't here unless recommending general tech types, but prioritize recommending what we sell:
=== LIVE STOCK CATALOG ===
${productsInfo}
=== END CATALOG ===

3. If users ask to compare products, build a beautifully formatted Markdown table matching their specifications, prices, and suggest the absolute best choice based on their budget and requirements.
4. Keep in mind: Customers pay securely with Safaricom M-Pesa. Standard delivery is immediate to Nairobi and within 24 hours to the rest of Kenya.
5. Do not share raw internal project configurations. Refer to the store pricing in Kenyan Shillings (KES).
6. CRITICAL RECOMMENDATION RULE: When recommending or mentioning specific products from our live catalog above, you MUST append a line formatted exactly like this at the very end of your response, on a brand new line:
[RECOMMENDED_IDS: id_1, id_2]
Where "id_1, id_2" are the raw matching IDs of the products from the live database. Do not recommend more than 4 items. If you do not recommend any specific products from the live catalog, do NOT append this line.
`;

          // Format chat history properly standard
          const formattedContents = updatedHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          }));

          const response = await clientAi.models.generateContent({
            model: "gemini-3.5-flash",
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });

          replyText = response.text || "I couldn't process that recommendation. Please try again!";
        } else {
          // If neither works, produce a descriptive and positive direction card
          throw new Error(
            "Hardware specialist server feed is uncontactable because this application is hosted as a static client on Vercel/Netlify without active server relays.\n\n" +
            "To enable the AI Specialist on your live hosting site in 60 seconds:\n" +
            "1. Access your Vercel Dashboard -> Your Project -> Settings -> Environment Variables\n" +
            "2. Add a new variable with:\n" +
            "   • Key: VITE_GEMINI_API_KEY\n" +
            "   • Value: [Your Gemini API Key]\n" +
            "3. Re-deploy your project on Vercel! Your static client will automatically leverage direct direct browser-to-cloud access to Gemini with your secure key."
          );
        }
      }

      setChatHistory((prev) => [...prev, { role: "assistant", content: replyText }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${err.message || "Failed to trigger AI advisor loop."}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerAIComparison = () => {
    if (compareList.length === 0) return;
    setIsOpen(true);
    setCompareModalOpen(false);

    const itemsStr = compareList.map(p => `[${p.brand}] ${p.name} at KES ${p.price.toLocaleString()}`).join(", ");
    const prompt = `Please analyze and compare these products side-by-side: ${itemsStr}. Build a clear comparison table listing their technical specs, prices, stock availability, and give me a clear personalized recommendation on which one is best for developers or professional setups!`;
    
    handleSendMessage(prompt);
  };

  const handleSuggestQuery = (text: string) => {
    setIsOpen(true);
    handleSendMessage(text);
  };

  const resetChat = () => {
    setChatHistory([
      {
        role: "assistant",
        content: "Hello! I am your Tech Sokoni Kenya AI Advisor. Ask me anything about our live hardware inventory, compare specs, or ask for professional recommendation on buying!"
      }
    ]);
  };

  // Chat History Sidebar Operations
  const handleLoadConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveConversationId(id);
      setChatHistory(conv.messages);
      if (window.innerWidth < 640) {
        setShowHistorySidebar(false);
      }
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    localStorage.setItem("tech_soko_ai_conversations", JSON.stringify(updated));

    if (activeConversationId === id) {
      setActiveConversationId(null);
      resetChat();
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    resetChat();
    if (window.innerWidth < 640) {
      setShowHistorySidebar(false);
    }
  };

  const filteredConversations = conversations.filter((c) => 
    c.title.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || 
    c.messages.some((m) => m.content.toLowerCase().includes(searchHistoryQuery.toLowerCase()))
  );

  // Extract all specs keys from compare items for comparison table
  const allSpecKeys = Array.from(
    new Set(compareList.flatMap(p => Object.keys(p.specifications || {})))
  );

  return (
    <>
      {/* 1. COMPARING BOTTOM SLIDE BAR (Fits any active layout) */}
      {compareList.length > 0 && (
        <div id="compare-bar" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-24 z-40 bg-[#0F0F0F] border border-[#C5A059]/40 rounded-2xl p-4 shadow-xl max-w-md w-full animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#C5A059]/20 text-[#C5A059] p-2 rounded-lg border border-[#C5A059]/30">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold font-sans">Comparing Products</h4>
                <p className="text-white/40 text-[10px] font-mono">{compareList.length} items selected (Max 3)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCompareModalOpen(true)}
                className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black text-[11px] font-sans font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Compare Side-by-Side
              </button>
              <button 
                onClick={clearCompareList}
                className="text-white/40 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            {compareList.map(p => (
              <div key={p.id} className="bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white/75 flex items-center gap-1.5 shrink-0">
                <span className="truncate max-w-[80px] font-medium">{p.name}</span>
                <button onClick={() => toggleCompare(p)} className="text-white/30 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CHAT FLYOUT BUBBLE BUTTON */}
      <button
        id="ai-floating-bubble"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-[#C5A059] to-[#9E8043] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#C5A059]/20 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all border border-[#C5A059]"
        title="Consult AI Assistant Advisor"
      >
        {isOpen ? <X className="w-5 h-5 font-bold" /> : <Bot className="w-5 h-5" />}
      </button>

      {/* 3. FLOATING CHAT DRAWER PANEL */}
      {isOpen && (
        <div 
          id="ai-advisor-panel"
          className={`fixed bottom-20 right-4 sm:right-6 z-50 bg-[#0F0F0F] border border-white/10 rounded-2xl h-[550px] shadow-2xl flex overflow-hidden animate-fadeIn transition-all duration-300 ${
            showHistorySidebar ? "w-[92vw] sm:w-[650px]" : "w-[92vw] sm:w-[400px]"
          }`}
        >
          {/* Chat History Sidebar */}
          {showHistorySidebar && (
            <div className="w-[220px] sm:w-[240px] shrink-0 border-r border-white/10 bg-[#070707] flex flex-col h-full animate-slideIn">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/35">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1">
                  <MessagesSquare className="w-3.5 h-3.5" />
                  <span>Past Sessions</span>
                </span>
                <button
                  onClick={handleNewChat}
                  className="p-1 text-white/50 hover:text-[#C5A059] hover:bg-white/5 rounded-md transition-all cursor-pointer"
                  title="Start New Chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sidebar Search Filter */}
              <div className="p-2 border-b border-white/5">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search past chats..."
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-[10px] focus:outline-hidden focus:border-[#C5A059]/50 text-white placeholder-white/20 font-sans"
                  />
                </div>
              </div>

              {/* Sidebar Scroll List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-white/25 text-[10px] font-sans italic px-2">
                    No past sessions found. Start a new topic!
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleLoadConversation(conv.id)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all group relative flex flex-col gap-1 ${
                          isActive
                            ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-white"
                            : "bg-transparent border-transparent hover:bg-white/[0.02] text-white/60 hover:text-white"
                        }`}
                      >
                        <span className="text-[10px] font-sans font-medium line-clamp-2 pr-4 leading-tight">
                          {conv.title}
                        </span>
                        <span className="text-[8px] font-mono text-white/30">
                          {new Date(conv.timestamp).toLocaleDateString()} at {new Date(conv.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 p-0.5 rounded-sm transition-all"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="bg-[#121212] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-sans font-bold text-xs">AI Hardware Specialist</h3>
                  <span className="text-[9px] font-mono text-[#C5A059] uppercase block tracking-wider font-semibold">Grounded Stock Intelligence</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Chat History Sidebar Toggle */}
                <button 
                  onClick={() => setShowHistorySidebar(!showHistorySidebar)} 
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    showHistorySidebar 
                      ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" 
                      : "text-white/40 hover:text-[#C5A059] hover:bg-white/5 border-transparent"
                  }`}
                  title="Toggle Chat History Sessions"
                >
                  <MessagesSquare className="w-3.5 h-3.5" />
                </button>

                {compareList.length > 0 && (
                  <button
                    onClick={() => setCompareModalOpen(true)}
                    className="flex items-center gap-1 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/30 text-[9px] font-mono font-bold uppercase px-2 py-1 rounded-md transition-all cursor-pointer animate-pulse"
                    title="Open side-by-side spec comparison matrix"
                  >
                    <Scale className="w-2.5 h-2.5" />
                    <span>Compare ({compareList.length})</span>
                  </button>
                )}
                <button 
                  onClick={resetChat} 
                  className="text-white/40 hover:text-[#C5A059] p-1 rounded-sm"
                  title="Restart chat history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-white/40 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0B0B]/40 scrollbar-thin scrollbar-thumb-white/5">
              {chatHistory.map((msg, i) => {
                const isUser = msg.role === "user";
                let displayContent = msg.content;
                let recommendedProducts: any[] = [];

                if (!isUser) {
                  const match = msg.content.match(/\[RECOMMENDED_IDS:\s*([^\]]+)\]/i);
                  if (match) {
                    const idsStr = match[1];
                    const ids = idsStr.split(",").map(id => id.trim()).filter(Boolean);
                    recommendedProducts = ids
                    .map(id => products.find(p => p.id === id || p.sku === id))
                    .filter((p): p is any => p !== undefined);
                    
                    displayContent = msg.content.replace(/\[RECOMMENDED_IDS:[^\]]+\]/i, "").trim();
                  }
                }

                return (
                  <div key={i} className="space-y-3">
                    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="w-7 h-7 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-[#C5A059]" />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser 
                          ? "bg-[#C5A059] text-black font-semibold shadow-md" 
                          : "bg-white/[0.02] border border-white/5 text-white/90"
                      }`}>
                        <div className="markdown-body">
                          <Markdown
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="my-3 overflow-x-auto w-full rounded-xl border border-white/10 bg-black/40 scrollbar-thin">
                                  <table className="min-w-full divide-y divide-white/10 text-left text-xs font-sans" {...props} />
                                </div>
                              ),
                              thead: ({ node, ...props }) => <thead className="bg-white/5 font-mono text-[9px] text-[#C5A059] uppercase tracking-wider" {...props} />,
                              tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5 bg-transparent" {...props} />,
                              tr: ({ node, ...props }) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                              th: ({ node, ...props }) => <th className="px-3 py-2 font-semibold text-white/90 border-r border-white/10 last:border-0" {...props} />,
                              td: ({ node, ...props }) => <td className="px-3 py-2 text-white/80 border-r border-white/5 last:border-0 whitespace-normal break-words" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-white/85" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-white/80" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-white/80" {...props} />,
                              li: ({ node, ...props }) => <li className="text-xs" {...props} />,
                              h1: ({ node, ...props }) => <h1 className="text-sm font-bold text-white mb-2 mt-3" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xs font-bold text-white mb-1.5 mt-2.5" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-[11px] font-bold text-[#C5A059] mb-1 mt-2" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-[#C5A059]" {...props} />,
                            }}
                          >
                            {cleanAiMarkdown(displayContent)}
                          </Markdown>
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-sm bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-white/70" />
                        </div>
                      )}
                    </div>

                    {/* Render the recommended product cards horizontally if present */}
                    {recommendedProducts.length > 0 && (
                      <div className="pl-9.5 pr-2 animate-fadeIn">
                        <div className="text-[9px] font-mono text-[#C5A059] uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold select-none">
                          <Sparkles className="w-2.5 h-2.5 text-[#C5A059] animate-pulse" />
                          <span>Interactive Stock Matches ({recommendedProducts.length})</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {recommendedProducts.map((p) => {
                            const isCompared = compareList.some((item) => item.id === p.id);
                            return (
                              <RecommendedProductCard
                                key={p.id}
                                product={p}
                                onAddToCart={addToCart}
                                onToggleCompare={toggleCompare}
                                isCompared={isCompared}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                    <Bot className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white/50 flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing specifications...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Recommendations */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap shrink-0">
              {compareList.length > 0 && (
                <button 
                  onClick={() => setCompareModalOpen(true)}
                  className="bg-[#C5A059]/10 border border-[#C5A059]/30 hover:border-[#C5A059]/50 text-[#C5A059] hover:text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer flex items-center gap-1 transition-colors animate-pulse"
                >
                  <Scale className="w-3 h-3 text-[#C5A059]" />
                  <span>📊 Compare specs ({compareList.length})</span>
                </button>
              )}
              <button 
                onClick={() => handleSuggestQuery("Compare laptop specs and suggest best choice for programming.")}
                className="bg-white/[0.02] border border-white/10 hover:border-[#C5A059]/50 text-white/60 hover:text-white text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer text-ellipsis text-left"
              >
                💻 Code Laptop Guide
              </button>
              <button 
                onClick={() => handleSuggestQuery("Show me smart gadget options under KES 10,000")}
                className="bg-white/[0.02] border border-white/10 hover:border-[#C5A059]/50 text-white/60 hover:text-white text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
              >
                💰 Under KES 10,000
              </button>
              <button 
                onClick={() => handleSuggestQuery("Do you accept Paystack? How long is the delivery?")}
                className="bg-white/[0.02] border border-white/10 hover:border-[#C5A059]/50 text-white/60 hover:text-white text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
              >
                🚀 Delivery & Paystack
              </button>
            </div>

            {/* Input Box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage("");
              }}
              className="p-3 bg-[#121212] border-t border-white/10 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask AI comparison / inquiries..."
                disabled={loading}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-[#C5A059] text-white font-sans placeholder-white/30"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:bg-white/5 disabled:text-white/20 text-black px-3 py-2 rounded-xl flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. SIDE-BY-SIDE MATRIX COMPARE MODAL */}
      {compareModalOpen && (
        <div id="compare-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#0F0F0F] border border-white/10 max-w-4xl w-full max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-[#E0E0E0]">
            {/* Header */}
            <div className="bg-[#121212] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C5A059]" />
                <h2 className="font-sans font-semibold text-lg text-white">Compare Authentic Hardware Specs</h2>
              </div>
              <button 
                onClick={() => setCompareModalOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Scroll Body */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-4 gap-4 min-w-[700px] border-b border-white/5 pb-4">
                {/* Column 1 Placeholder header */}
                <div className="font-mono text-xs text-white/35 font-bold flex items-end">
                  SPECIFICATION FIELD
                </div>

                {/* Column index */}
                {compareList.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-lg border border-white/10 bg-[#1A1A1A]" />
                    <div>
                      <span className="text-[10px] font-mono text-[#C5A059] font-bold block">{p.brand}</span>
                      <h4 className="font-sans font-bold text-xs text-white line-clamp-1 leading-tight">{p.name}</h4>
                      <p className="text-[11px] text-white/50">{p.category}</p>
                    </div>
                  </div>
                ))}

                {/* Fill remaining slots if < 3 */}
                {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, idx) => (
                  <div key={idx} className="border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center py-6 text-center text-white/20 text-[11px]">
                    <HelpCircle className="w-6 h-6 mb-2 text-white/10" />
                    <span>Select product from<br/>storefront to compare</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {/* Price Row */}
                <div className="grid grid-cols-4 gap-4 py-3 text-xs">
                  <div className="font-mono text-white/40 font-bold flex items-center">Store Price</div>
                  {compareList.map(p => (
                    <div key={p.id} className="font-semibold text-white">KES {p.price.toLocaleString()}</div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, idx) => (
                    <div key={idx} />
                  ))}
                </div>

                {/* Stock Row */}
                <div className="grid grid-cols-4 gap-4 py-3 text-xs">
                  <div className="font-mono text-white/40 font-bold flex items-center">Warehouse Stock</div>
                  {compareList.map(p => (
                    <div key={p.id} className={p.stock > 0 ? "text-green-400" : "text-red-400"}>
                      {p.stock > 0 ? `${p.stock} units available` : "Out of Stock"}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, idx) => (
                    <div key={idx} />
                  ))}
                </div>

                {/* Specification Mapping */}
                {allSpecKeys.map((key) => (
                  <div key={key} className="grid grid-cols-4 gap-4 py-3 text-xs">
                    <div className="font-sans font-medium text-white/55 flex items-center capitalize">{key}</div>
                    {compareList.map(p => (
                      <div key={p.id} className="text-white/80 pr-2">
                        {p.specifications?.[key] || "—"}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, idx) => (
                      <div key={idx} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Options */}
            <div className="bg-[#121212] border-t border-white/10 px-6 py-4 flex items-center justify-between">
              <button 
                onClick={clearCompareList}
                className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
              >
                Clear comparison list
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => setCompareModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-sans text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Close matrix
                </button>
                <button 
                  onClick={triggerAIComparison}
                  className="bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-sans text-xs font-extrabold px-4 py-2 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze side-by-side with AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
