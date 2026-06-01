import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../StoreContext";
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
  Trash2
} from "lucide-react";
import Markdown from "react-markdown";

export default function AIAdvisor() {
  const { products, compareList, toggleCompare, clearCompareList } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hello! I am your Tech Gadgets Kenya AI Advisor. Ask me anything about our live hardware inventory, compare specs, or ask for professional recommendation on buying!"
    }
  ]);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

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
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: updatedHistory.slice(0, -1), // Send previous history
          productsContext: products // Dynamically ground in live catalog
        })
      });

      if (!response.ok) {
        throw new Error("Unable to contact hardware specialist server feed.");
      }

      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
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
        content: "Hello! I am your Tech Gadgets Kenya AI Advisor. Ask me anything about our live hardware inventory, compare specs, or ask for professional recommendation on buying!"
      }
    ]);
  };

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
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-br from-[#C5A059] to-[#9E8043] text-black hover:scale-105 active:scale-95 shadow-lg shadow-[#C5A059]/20 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all border border-[#C5A059]"
        title="Consult AI Assistant Advisor"
      >
        {isOpen ? <X className="w-5 h-5 font-bold" /> : <Bot className="w-5 h-5" />}
      </button>

      {/* 3. FLOATING CHAT DRAWER PANEL */}
      {isOpen && (
        <div 
          id="ai-advisor-panel"
          className="fixed bottom-20 right-4 z-40 bg-[#0F0F0F] border border-white/10 rounded-2xl w-[92vw] sm:w-[400px] h-[550px] shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="bg-[#121212] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white font-sans font-bold text-xs">AI Hardware Specialist</h3>
                <span className="text-[9px] font-mono text-[#C5A059] uppercase block tracking-wider font-semibold">Grounded Stock Intelligence</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="w-7 h-7 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#C5A059]" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-[#C5A059] text-black font-medium" 
                    : "bg-white/[0.03] border border-white/5 text-white/90"
                }`}>
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-sm bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white/70" />
                  </div>
                )}
              </div>
            ))}

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
          <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap">
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
              onClick={() => handleSuggestQuery("Do you accept Lipa Na M-Pesa? How long is the delivery?")}
              className="bg-white/[0.02] border border-white/10 hover:border-[#C5A059]/50 text-white/60 hover:text-white text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
            >
              🚀 Delivery & M-Pesa
            </button>
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage("");
            }}
            className="p-3 bg-[#121212] border-t border-white/10 flex gap-2"
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
