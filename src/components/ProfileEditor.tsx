import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { User, Phone, MapPin, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function ProfileEditor() {
  const { user, userProfile } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load current values when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setPhone(userProfile.phone || "");
      setAddress(userProfile.address || "");
    }
  }, [userProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to update your profile.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Display name cannot be empty.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updatedAt: new Date().toISOString()
      });
      setSuccessMsg("Profile updated and synchronized successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setErrorMsg("Failed to synchronize changes with Firestore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 text-center text-white/50 font-mono text-xs">
        Please sign in to view and edit your profile.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left animate-fadeIn font-sans" id="profile-editor-module">
      {/* Header Banner */}
      <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="font-sans font-bold text-lg text-white mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-[#C5A059]" />
          <span>Authorized Client Profile</span>
        </h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Update your secure client identifiers. These synchronized credentials will dictate shipping manifests and custom billing registries automatically.
        </p>
      </div>

      <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative text-white">
        {/* Sync Status Feedbacks */}
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/25 rounded-2xl p-4 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-red-300 leading-normal">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/25 rounded-2xl p-4 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-emerald-300 leading-normal">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Email read-only info */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block block mb-1">Registered Email Address</label>
            <input
              type="text"
              readOnly
              value={user.email || ""}
              className="w-full bg-white/[0.02] border border-white/5 py-2.5 px-3 rounded-xl text-xs text-white/40 font-mono focus:outline-none cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Valued Client"
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345678"
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Delivery Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-white/30 absolute left-3 top-3.5" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment/Suite, Street, City, County, Kenya"
                rows={3}
                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#C5A059] text-black hover:bg-[#C5A059]/90 py-3 px-6 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <span>Synchronize Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
