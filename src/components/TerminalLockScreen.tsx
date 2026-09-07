import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Send,
} from "lucide-react";
import { AppUserSession } from "../types/authSecurity";
import { googleSignIn, sendEmailViaGmail } from "../lib/googleAuth";

interface TerminalLockScreenProps {
  onUnlockSuccess: (session: AppUserSession) => void;
}

export const TerminalLockScreen: React.FC<TerminalLockScreenProps> = ({ onUnlockSuccess }) => {
  const [authMode, setAuthMode] = useState<"GMAIL_PIN" | "DIRECT_PASSCODE">("GMAIL_PIN");
  
  // Gmail PIN verification state
  const ownerEmail = "roy.ashokk@gmail.com";
  const [emailPin, setEmailPin] = useState("");
  const [isSendingPin, setIsSendingPin] = useState(false);
  const [pinSentNotice, setPinSentNotice] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  
  // Direct Passcode state
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  
  // Global status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  /**
   * Dispatches a fresh 6-digit PIN to roy.ashokk@gmail.com
   */
  const handleSendPinToGmail = async () => {
    setError(null);
    setSuccessNotice(null);
    setIsSendingPin(true);

    try {
      // 1. Get or acquire Google OAuth access token with gmail.send permission
      let token = googleAccessToken;
      if (!token) {
        const authResult = await googleSignIn();
        if (!authResult?.accessToken) {
          throw new Error("Google Workspace authentication cancelled. Please sign in with your Google account.");
        }
        token = authResult.accessToken;
        setGoogleAccessToken(token);
      }

      // 2. Generate a fresh, secure 6-digit PIN on the server
      const pinRes = await fetch("/api/auth/generate-email-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail }),
      });
      const pinData = await pinRes.json();
      if (!pinRes.ok || !pinData.success) {
        throw new Error(pinData.message || "Failed to generate security PIN on server.");
      }

      const generatedPin = pinData.pin;

      // 3. Dispatch official styled email directly to roy.ashokk@gmail.com via Gmail API
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
            .card { max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; }
            .header { text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; }
            .title { font-size: 20px; font-weight: 700; color: #38bdf8; margin: 0; }
            .pin-box { margin: 28px 0; padding: 20px; background: #030712; border: 1px solid #38bdf8; border-radius: 12px; text-align: center; }
            .pin { font-family: monospace; font-size: 34px; letter-spacing: 8px; font-weight: 800; color: #38bdf8; }
            .meta { font-size: 13px; color: #94a3b8; line-height: 1.6; }
            .footer { margin-top: 24px; border-top: 1px solid #1f2937; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2 class="title">Apex Stratos Terminal</h2>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">One-Time Terminal Verification PIN</p>
            </div>
            
            <p class="meta" style="margin-top: 20px;">
              Hello Ashok,
              <br><br>
              A request was made to unlock your <strong>Apex Stratos Quantitative Trading Terminal</strong>. Use the one-time verification PIN below to access your dashboard:
            </p>

            <div class="pin-box">
              <div class="pin">${generatedPin}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 8px;">VALID FOR 10 MINUTES • DO NOT SHARE</div>
            </div>

            <p class="meta">
              If you did not initiate this request, no action is needed. Your terminal remains locked and credentials securely encrypted.
            </p>

            <div class="footer">
              Google Cloud Run Protected • Authorized to ${ownerEmail}
            </div>
          </div>
        </body>
        </html>
      `;

      const sendResult = await sendEmailViaGmail(
        token,
        ownerEmail,
        `Your Apex Stratos Terminal Access PIN: ${generatedPin}`,
        emailHtml
      );

      if (!sendResult.success) {
        throw new Error(sendResult.error || "Failed to deliver email through Gmail API.");
      }

      setPinSentNotice(true);
      setSuccessNotice(`PIN dispatched to ${ownerEmail}. Please check your inbox.`);
      setResendCountdown(60);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send PIN to Gmail. Please try again.");
    } finally {
      setIsSendingPin(false);
    }
  };

  /**
   * Verify the entered Gmail PIN
   */
  const handleVerifyGmailPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPin.trim() || emailPin.trim().length < 4) {
      setError("Please enter the 6-digit PIN sent to your Gmail inbox.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail, pin: emailPin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("apex_auth_token", data.token);
        onUnlockSuccess({
          isAuthenticated: true,
          userEmail: ownerEmail,
          loginMethod: "PASSWORD",
          sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
          token: data.token,
        });
      } else {
        setError(data.message || "Invalid or expired PIN. Please check your Gmail or request a new code.");
      }
    } catch (err: any) {
      setError("Connection error verifying PIN with the server.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Direct Passcode Unlock (Fallback or Custom Admin PIN)
   */
  const handleDirectPasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter your PIN or Passcode.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim(), email: ownerEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("apex_auth_token", data.token);
        onUnlockSuccess({
          isAuthenticated: true,
          userEmail: ownerEmail,
          loginMethod: "PASSWORD",
          sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
          token: data.token,
        });
      } else {
        setError(data.message || "Invalid Passcode. Use the Gmail PIN option above.");
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="terminal-lock-screen-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto"
      style={{
        backgroundImage: `radial-gradient(ellipse at top center, rgba(30, 41, 59, 0.6) 0%, rgba(2, 6, 23, 1) 100%)`,
      }}
    >
      <div
        id="lock-screen-box"
        className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden"
      >
        {/* Glowing Ambient Top Pill */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-b-full"></div>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-3">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Apex Stratos Terminal</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SECURE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private Quantitative Trading Terminal & Execution Gateway
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-indigo-500/30 text-[11px] text-indigo-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Owner: <strong className="text-white font-mono">{ownerEmail}</strong></span>
          </div>
        </div>

        {/* Auth Method Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-5">
          <button
            type="button"
            id="auth-mode-gmail-btn"
            onClick={() => {
              setAuthMode("GMAIL_PIN");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
              authMode === "GMAIL_PIN"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            <span>Send PIN to Gmail</span>
          </button>

          <button
            type="button"
            id="auth-mode-passcode-btn"
            onClick={() => {
              setAuthMode("DIRECT_PASSCODE");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
              authMode === "DIRECT_PASSCODE"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN / Master Pass</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-600/50 rounded-lg text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* GMAIL PIN MODE */}
        {authMode === "GMAIL_PIN" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Registered Gmail Address:</span>
                <span className="text-white font-mono font-medium">{ownerEmail}</span>
              </div>
              
              <button
                type="button"
                id="send-gmail-pin-btn"
                onClick={handleSendPinToGmail}
                disabled={isSendingPin || resendCountdown > 0}
                className="w-full mt-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-indigo-500/30 transition shadow"
              >
                {isSendingPin ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting Gmail & Dispatching PIN...</span>
                  </>
                ) : resendCountdown > 0 ? (
                  <span>Resend PIN in {resendCountdown}s</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{pinSentNotice ? "Resend PIN to Gmail" : "Send One-Time PIN to my Gmail"}</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleVerifyGmailPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Enter 6-Digit Gmail PIN</span>
                  <span className="text-[11px] text-slate-500">Sent to your inbox</span>
                </label>
                <input
                  id="gmail-pin-input"
                  type="text"
                  maxLength={6}
                  value={emailPin}
                  onChange={(e) => setEmailPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-lg bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-cyan-300 font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
                  autoFocus
                />
              </div>

              <button
                id="verify-gmail-pin-btn"
                type="submit"
                disabled={isLoading || emailPin.length < 4}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Live Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* DIRECT PASSCODE MODE */}
        {authMode === "DIRECT_PASSCODE" && (
          <form onSubmit={handleDirectPasscodeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Enter Terminal Passcode</span>
                <span className="text-[11px] text-slate-500 font-mono">Default: 123456</span>
              </label>

              <div className="relative">
                <input
                  id="terminal-passcode-input"
                  type={showPasscode ? "text" : "password"}
                  maxLength={12}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-passcode-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Unlock Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Badges */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Workspace Authenticated</span>
          </span>
          <span>Cloud Run Protected</span>
        </div>
      </div>
    </div>
  );
};
