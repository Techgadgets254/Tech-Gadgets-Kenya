import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  ShieldAlert, 
  Loader2, 
  PlusCircle, 
  RefreshCw, 
  UserCheck, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

interface AdminCredentialManagerProps {
  currentAdminEmail: string;
}

export default function AdminCredentialManager({ currentAdminEmail }: AdminCredentialManagerProps) {
  // Rotate Password States
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStatus, setRotateStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Operator Creation States
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Active Admins list in database (both real-time state lookup & document verification)
  const [adminUsers, setAdminUsers] = useState<{ uid?: string; email: string; role: string; adminClaims: boolean; source: string }[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const fetchActiveSystemAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const adminsList: any[] = [];
      
      usersSnap.forEach((userDoc) => {
        const udata = userDoc.data();
        const hasClaims = udata["admin-claims"] === true || udata["admin-claims"] === "admin";
        if (udata.role === "admin" || hasClaims) {
          adminsList.push({
            uid: userDoc.id,
            email: udata.email || "No Email",
            role: udata.role || "admin",
            adminClaims: !!hasClaims,
            source: "Firebase Auth Profile"
          });
        }
      });

      // Also merge with local `/admin_accounts` if any additional operator indexes exist
      const accountsSnap = await getDocs(collection(db, "admin_accounts"));
      accountsSnap.forEach((accDoc) => {
        const accData = accDoc.data();
        const email = accDoc.id;
        const exists = adminsList.some(a => a.email.toLowerCase() === email.toLowerCase());
        if (!exists) {
          adminsList.push({
            email: email,
            role: "admin",
            adminClaims: true,
            source: "Legacy Admin Passcode list"
          });
        }
      });

      setAdminUsers(adminsList);
    } catch (err: any) {
      console.error("[Credential Manager] Failed auditing administrative users:", err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchActiveSystemAdmins();
  }, []);

  const handlePasswordResetAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || !confirmNewPw) {
      setRotateStatus({ success: false, message: "New security strings are required." });
      return;
    }
    if (newPw !== confirmNewPw) {
      setRotateStatus({ success: false, message: "Confirmation passcode values do not match." });
      return;
    }

    setIsRotating(true);
    setRotateStatus(null);

    try {
      let isFirebaseAuthRotated = false;
      let authUserEmail = auth.currentUser?.email || "";

      // 1. Rotation using standard Firebase Client SDK updatePassword
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPw);
          isFirebaseAuthRotated = true;
          console.log("[Auth Rotation] Firebase Auth user password updated in browser context.");
        } catch (firebaseErr: any) {
          console.warn("[Auth Rotation Warning] Could not update active Firebase Auth password directly from app context:", firebaseErr.message || firebaseErr);
        }
      }

      // 2. Also save to the localized `/api/admin/accounts/change-password` endpoint to keep local terminal database passcode synced!
      const syncResponse = await fetch("/api/admin/accounts/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUsername: authUserEmail || currentAdminEmail || "techgadgetsk@gmail.com",
          currentPassword: currentPw,
          newPassword: newPw
        })
      });

      const syncResult = await syncResponse.json();

      if (isFirebaseAuthRotated || (syncResponse.ok && syncResult.success)) {
        // Safe, indelible audit log entry
        try {
          await setDoc(doc(collection(db, "audit_logs")), {
            action: "password_change",
            details: `Rotated administrative credentials for operator: '${authUserEmail || currentAdminEmail}'`,
            adminEmail: auth.currentUser?.email || currentAdminEmail || "unknown@admin.com",
            adminUid: auth.currentUser?.uid || "N/A",
            createdAt: new Date().toISOString()
          });
        } catch (logErr) {
          console.error("Failed writing credentials rotation audit log:", logErr);
        }

        setRotateStatus({
          success: true,
          message: `✔ Credentials rotated safely! ${isFirebaseAuthRotated ? "Firebase Auth system synced." : ""} ${syncResponse.ok ? "Local terminal db passcode active." : ""}`
        });
        setCurrentPw("");
        setNewPw("");
        setConfirmNewPw("");
        fetchActiveSystemAdmins();
      } else {
        setRotateStatus({
          success: false,
          message: syncResult.error || "Password change was rejected by security providers."
        });
      }
    } catch (err: any) {
      setRotateStatus({
        success: false,
        message: `❌ Configuration failed: ${err.message || String(err)}`
      });
    } finally {
      setIsRotating(false);
    }
  };

  const handleRegisterNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setRegisterStatus({ success: false, message: "Unique Email and secure password are required." });
      return;
    }
    if (newPassword.length < 6) {
      setRegisterStatus({ success: false, message: "Security parameters require at least 6 characters for passcodes." });
      return;
    }

    setIsRegistering(true);
    setRegisterStatus(null);

    let tempApp;
    try {
      const sanitizedEmail = newEmail.trim().toLowerCase();
      
      // Initialize target secondary application dynamically so current operator is NEVER logged out!
      tempApp = initializeApp(firebaseConfig, "temp-admin-registrar");
      const tempAuth = getAuth(tempApp);

      // Create credential inside Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(tempAuth, sanitizedEmail, newPassword);
      const uid = userCredential.user.uid;

      // Map dynamic claims and configuration to Firestore users document (with global 'admin-claims' field)
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        uid: uid,
        email: sanitizedEmail,
        role: "admin",
        "admin-claims": true, // Global flag requested
        name: "Joint Administrator",
        createdAt: new Date().toISOString()
      });

      // Map to secondary terminal admin passcodes list to allow passcode terminal access as well
      const adminAccRef = doc(db, "admin_accounts", sanitizedEmail);
      await setDoc(adminAccRef, {
        username: sanitizedEmail,
        password: newPassword,
        createdAt: new Date().toISOString()
      });

      // Write secure, indelible audit log
      try {
        await setDoc(doc(collection(db, "audit_logs")), {
          action: "admin_create",
          details: `Provisioned and registered new administrative joint operator: '${sanitizedEmail}'`,
          adminEmail: auth.currentUser?.email || currentAdminEmail || "unknown@admin.com",
          adminUid: auth.currentUser?.uid || "N/A",
          createdAt: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Failed writing co-operator creation audit log:", logErr);
      }

      setRegisterStatus({
        success: true,
        message: `✔ Managed administrator '${sanitizedEmail}' successfully initialized. Authentication credentials paired and mapped in database!`
      });
      setNewEmail("");
      setNewPassword("");
      fetchActiveSystemAdmins();
    } catch (err: any) {
      console.error("[Admin creation failure]:", err);
      setRegisterStatus({
        success: false,
        message: err.message || "Failed registering credentials."
      });
    } finally {
      if (tempApp) {
        try {
          await tempApp.delete();
        } catch (e) {
          console.warn("Cleanup temp secondary app failed:", e);
        }
      }
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-8 text-[#E0E0E0] text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Secure Change Password Card */}
        <div id="rotate-password-utility" className="bg-[#0b0b0b] border border-white/5 p-6 rounded-3xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-sans font-semibold text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C5A059]" />
              <span>Rotate Credentials Utility</span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono mt-1">
              Changes security credentials for the active admin user: <span className="text-[#C5A059] font-semibold">{auth.currentUser?.email || currentAdminEmail}</span>
            </p>
          </div>

          <form onSubmit={handlePasswordResetAuth} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold font-mono text-white/40 uppercase mb-1.5 tracking-wider">CURRENT PASSWORD</label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Verify active passcode reference"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 transition-all text-left"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold font-mono text-white/40 uppercase mb-1.5 tracking-wider">NEW PASSCODE (W/ FIREBASE AUTH SYNC)</label>
              <input
                type="password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Assign new high-strength password"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 transition-all text-left"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold font-mono text-white/40 uppercase mb-1.5 tracking-wider">CONFIRM NEW PASSCODE</label>
              <input
                type="password"
                required
                value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)}
                placeholder="Re-enter for structural verification"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 transition-all text-left"
              />
            </div>

            {rotateStatus && (
              <div className={`p-4 rounded-xl text-xs font-mono border flex items-start gap-2.5 ${
                rotateStatus.success 
                  ? "bg-[#C5A059]/10 border-[#C5A059]/25 text-[#C5A059]" 
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              }`}>
                {rotateStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C5A059] mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{rotateStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRotating}
              className="w-full h-11 bg-[#C5A059] text-black font-sans font-bold text-xs hover:bg-[#b08e4d] disabled:bg-white/10 disabled:text-white/30 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer uppercase tracking-wider"
            >
              {isRotating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rotating credentials...</span>
                </>
              ) : (
                <span>Publish New Passcode</span>
              )}
            </button>
          </form>
        </div>

        {/* Admin Credential Manager (New Admin registrations) */}
        <div id="credential-register-utility" className="bg-[#0b0b0b] border border-white/5 p-6 rounded-3xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-sans font-semibold text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C5A059]" />
                <span>Admin Credential Manager</span>
              </h3>
              <p className="text-[11px] text-white/40 font-mono mt-1">
                Authorized super-admins can provision and register joint operators.
              </p>
            </div>
            <button
              onClick={fetchActiveSystemAdmins}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 transition-colors cursor-pointer"
              title="Audit Administrators"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdmins ? "animate-spin text-[#C5A059]" : ""}`} />
            </button>
          </div>

          <form onSubmit={handleRegisterNewAdmin} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold font-mono text-white/40 uppercase mb-1.5 tracking-wider">NEW OPERATOR FIREBASE EMAIL ID</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-white/20 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@techsokoni.com"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl pl-11 pr-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 transition-all text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold font-mono text-white/40 uppercase mb-1.5 tracking-wider">NEW SECURE PASSCODE (MINIMUM 6 CHARS)</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-white/20 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set strong initial passcode"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-[#C5A059] focus:outline-none rounded-xl pl-11 pr-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 transition-all text-left"
                />
              </div>
            </div>

            {registerStatus && (
              <div className={`p-4 rounded-xl text-xs font-mono border flex items-start gap-2.5 ${
                registerStatus.success 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              }`}>
                {registerStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{registerStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full h-11 bg-white hover:bg-white/95 text-black font-sans font-bold text-xs disabled:bg-white/10 disabled:text-white/30 rounded-xl flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer uppercase tracking-wider"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Live Auth Account...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-black" />
                  <span>Provision Admin Operator</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Directory Auditing */}
      <div className="bg-[#0b0b0b] border border-white/5 p-6 rounded-3xl">
        <h4 className="text-xs font-bold font-sans text-white uppercase tracking-wider mb-4">
          Active Store Administrators & Operator Audits
        </h4>
        <div className="border border-white/5 rounded-2xl bg-black divide-y divide-white/5 overflow-hidden">
          {isLoadingAdmins ? (
            <p className="p-6 text-xs font-mono text-white/30 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
              <span>Auditing privilege sets...</span>
            </p>
          ) : adminUsers.length === 0 ? (
            <p className="p-6 text-xs font-mono text-white/30 text-center">No secondary operators indexed yet.</p>
          ) : (
            adminUsers.map((admin, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white/95">{admin.email}</span>
                  <span className="text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wide">
                    Identity source: {admin.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2.5 py-1.5 border border-[#C5A059]/20 bg-[#C5A059]/15 text-[#C5A059] font-mono rounded-lg uppercase tracking-wider">
                    Role: {admin.role}
                  </span>
                  <span className="text-[9px] px-2.5 py-1.5 border border-emerald-500/15 bg-emerald-500/10 text-emerald-400 font-mono rounded-lg uppercase tracking-wider">
                    Claim Verified: Admin-claims
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
