import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Clock,
  User,
  Filter
} from "lucide-react";

interface AuthEvent {
  id: string;
  eventType: string;
  status: "success" | "failed";
  email: string;
  userId?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function AuditLogTable() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchEmail, setSearchEmail] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "auth_events"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AuthEvent[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AuthEvent);
      });
      setEvents(list);
      setLoading(false);
    }, (error) => {
      console.error("Error reading auth events logs:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Filtering logic
  const filteredEvents = events.filter((ev) => {
    const matchesEmail = ev.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesType = typeFilter === "all" || ev.eventType === typeFilter;
    const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
    return matchesEmail && matchesType && matchesStatus;
  });

  // Pagination index builders
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchEmail, typeFilter, statusFilter]);

  return (
    <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
      
      {/* Header section with Shield indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg tracking-tight text-white">
              AUTHENTICATION AUDIT LOGS
            </h2>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Live monitoring of user registry actions, sign-in attempts, and credential resets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono py-1 px-3 bg-white/5 border border-white/10 rounded-xl text-white/60">
          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>REAL-TIME STREAMING ACTIVE</span>
        </div>
      </div>

      {/* Control panel containing Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Search input field */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search auditing events by client email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 hover:border-white/20 focus:border-[#C5A059] focus:outline-hidden rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 transition-all font-sans"
          />
        </div>

        {/* Filter type dropdown */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-hidden focus:border-[#C5A059] transition-all font-sans cursor-pointer"
            >
              <option value="all">Any Security Action</option>
              <option value="login">Account Sign-In (Email)</option>
              <option value="google_login">Google SSO Authentication</option>
              <option value="signup">New Space SignUp</option>
              <option value="password_reset_request_generated">Password Reset Requested (15m Expiry)</option>
              <option value="password_reset_completed">Password Reset Completed</option>
              <option value="password_reset_expired">Password Reset Expired / Blocked</option>
              <option value="auto_logout_inactivity">Auto-Logout (35m Inactivity)</option>
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-hidden focus:border-[#C5A059] transition-all font-sans cursor-pointer"
            >
              <option value="all">Any Status Result</option>
              <option value="success">Success Handshake (✔)</option>
              <option value="failed">Failed/Rejected Attempt (✖)</option>
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto border border-white/10 rounded-2xl bg-[#080808]">
        {loading ? (
          <div className="py-16 text-center text-white/40 space-y-3 font-mono text-xs">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#C5A059]" />
            <p>Gathering authentication event records...</p>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div className="py-16 text-center text-white/40 font-mono text-xs">
            <p>No logged security actions match the filtering parameters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/60 text-[10px] font-mono uppercase tracking-wider">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">ACTION MODULE</th>
                <th className="py-3 px-4">CLIENT IDENTITY</th>
                <th className="py-3 px-4">USER ID</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">HANDSHAKE DETAIL / EXCEPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-sans">
              {paginatedEvents.map((ev) => {
                const isSuccess = ev.status === "success";
                
                // Read format string
                let actionLabel = ev.eventType;
                if (ev.eventType === "login") actionLabel = "Email Sign-In";
                if (ev.eventType === "signup") actionLabel = "New Registration";
                if (ev.eventType === "password_reset" || ev.eventType === "password_reset_direct") actionLabel = "Password Reset Request";
                if (ev.eventType === "password_reset_request_generated" || ev.eventType === "password_reset_email_sent") actionLabel = "Password Reset Email (15m Expiry)";
                if (ev.eventType === "password_reset_completed" || ev.eventType === "password_reset_complete") actionLabel = "Password Reset Completed";
                if (ev.eventType === "password_reset_expired") actionLabel = "Password Reset Expired (>15m)";
                if (ev.eventType === "auto_logout_inactivity") actionLabel = "Auto-Logout (35m Idle)";
                if (ev.eventType === "google_login") actionLabel = "Google SSO Auth";

                return (
                  <tr key={ev.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-white/70 whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString("en-KE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white tracking-wide">
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white/80 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#C5A059]" />
                        {ev.email || "anonymous-attempt"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-white/40 whitespace-nowrap max-w-[120px] truncate">
                      {ev.userId || "—"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-2.5 h-2.5" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-2.5 h-2.5" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-white/50 max-w-xs truncate" title={ev.errorMessage || "Completed successfully"}>
                      {isSuccess ? (
                        <span className="text-emerald-500/70 font-medium">Clear Authorization Handshake</span>
                      ) : (
                        <span className="text-rose-400/80 font-mono text-[11px] font-bold">
                          {ev.errorMessage || "Request Rejected"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer block */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-xs font-sans text-white/50">
          <div>
            Showing <span className="text-white font-mono">{startIndex + 1}</span> to{" "}
            <span className="text-white font-mono">
              {Math.min(startIndex + itemsPerPage, filteredEvents.length)}
            </span>{" "}
            of <span className="text-white font-mono">{filteredEvents.length}</span> security events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 text-white font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREVIOUS</span>
            </button>
            <span className="font-mono text-white/80 py-1 px-2 bg-white/5 rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 text-white font-semibold"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
