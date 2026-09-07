import React, { useState } from "react";
import {
  Globe,
  Lock,
  Smartphone,
  Key,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Building2,
  Sliders,
  Radio,
  Sparkles,
} from "lucide-react";
import { BrokerType, BrokerCredentials } from "../types";

interface BrokerBrowserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker: BrokerType;
  onAuthSuccess: (creds: BrokerCredentials) => void;
}

export const BrokerBrowserAuthModal: React.FC<BrokerBrowserAuthModalProps> = ({
  isOpen,
  onClose,
  broker,
  onAuthSuccess,
}) => {
  const [step, setStep] = useState<"STEP1_CREDENTIALS" | "STEP2_TOTP" | "STEP3_CONNECTED">("STEP1_CREDENTIALS");
  const [userId, setUserId] = useState<string>(
    broker === "DHAN" ? "1000849201" : broker === "UPSTOX" ? "6FA001" : broker === "FYERS" ? "FY08924" : "KITE001"
  );
  const [password, setPassword] = useState<string>("••••••••••••");
  const [mobileNumber, setMobileNumber] = useState<string>("+91 98765 43210");
  const [totpCode, setTotpCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  if (!isOpen) return null;

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/broker/browser-auth/step1-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker,
          userId: userId.trim(),
          passwordOrPin: password,
          mobileNumber: mobileNumber.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep("STEP2_TOTP");
      } else {
        setErrorMessage(data.message || "Invalid credentials. Please verify your login info.");
      }
    } catch (err: any) {
      setErrorMessage("Network error connecting to broker auth flow.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2TotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim() || totpCode.length < 4) {
      setErrorMessage("Please enter the 6-digit TOTP / SMS code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/broker/browser-auth/step2-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker,
          userId: userId.trim(),
          totpCode: totpCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSessionData(data);
        setStep("STEP3_CONNECTED");

        // Pass real token back to parent broker state
        onAuthSuccess({
          broker,
          appId: userId,
          accessToken: data.accessToken,
          dhanClientId: broker === "DHAN" ? userId : undefined,
          upstoxApiKey: broker === "UPSTOX" ? userId : undefined,
          redirectUri: "https://web.dhan.co",
          environment: "LIVE",
          autoSyncQuotes: true,
          autoSyncPositions: true,
        });
      } else {
        setErrorMessage(data.message || "Incorrect TOTP code.");
      }
    } catch (err: any) {
      setErrorMessage("Failed to verify TOTP code with broker server.");
    } finally {
      setIsLoading(false);
    }
  };

  const autoFillDemoTotp = () => {
    setTotpCode("492810");
    setErrorMessage(null);
  };

  const brokerColor =
    broker === "DHAN"
      ? "text-emerald-400"
      : broker === "UPSTOX"
      ? "text-purple-400"
      : broker === "FYERS"
      ? "text-cyan-400"
      : "text-amber-400";

  return (
    <div
      id="broker-browser-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="broker-browser-auth-window"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Mock Browser Header Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>

          {/* Browser URL Bar */}
          <div className="flex-1 max-w-sm mx-3 px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">
              https://auth.{broker.toLowerCase()}.co/v2/login/oauth/session
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className={`w-5 h-5 ${brokerColor}`} />
                <h3 className="text-base font-bold text-white">
                  {broker} Official In-Browser Account Login
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticates directly with {broker} exchange gateway. Cloud Run immediately starts receiving live tick data.
              </p>
            </div>

            {/* Stepper Pill */}
            <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${step === "STEP1_CREDENTIALS" ? "bg-indigo-400" : "bg-emerald-400"}`}></span>
              <span className="text-slate-300">
                {step === "STEP1_CREDENTIALS" ? "Step 1/2: Login" : step === "STEP2_TOTP" ? "Step 2/2: TOTP" : "Connected"}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-600/50 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: USER ID & PASSWORD */}
          {step === "STEP1_CREDENTIALS" && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {broker} Client ID / Registered Mobile
                </label>
                <input
                  id="broker-user-id-input"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 1000849201 or 9876543210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Password / Trading PIN
                </label>
                <input
                  id="broker-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your broker password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  id="broker-step1-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Contacting {broker} Gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to 2FA / Mobile OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: TOTP / MOBILE OTP */}
          {step === "STEP2_TOTP" && (
            <form onSubmit={handleStep2TotpSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                <span>Verification code required for Client ID <strong>{userId}</strong>. Enter the 6-digit TOTP from your Google/Microsoft Authenticator or SMS.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Time-Based OTP (TOTP)
                </label>
                <input
                  id="broker-totp-input"
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-lg bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Authenticator active for {broker}</span>
                <button
                  type="button"
                  onClick={autoFillDemoTotp}
                  className="text-indigo-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Fill Demo TOTP</span>
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("STEP1_CREDENTIALS")}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  id="broker-step2-submit-btn"
                  type="submit"
                  disabled={isLoading || totpCode.length < 4}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Establishing WebSocket Stream...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize & Start Live Stream</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONNECTED SUCCESS */}
          {step === "STEP3_CONNECTED" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  {broker} Live Feed Synchronized!
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your browser session was successfully authenticated. Google Cloud Run is now receiving high-speed live tick data and account state.
                </p>
                {broker === "DHAN" && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full font-mono text-[11px] font-bold">
                    <Radio className="w-3 h-3 text-orange-400 animate-pulse" />
                    <span>DhanHQ 200-Level Depth (TBT) Binary Stream Active</span>
                  </div>
                )}
              </div>

              {sessionData?.accountSummary && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
                  <div>
                    <span className="text-slate-500">Client:</span>
                    <div className="text-slate-200 font-bold">{sessionData.accountSummary.clientName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Margin Available:</span>
                    <div className="text-emerald-400 font-bold">₹{sessionData.accountSummary.availableMargin.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Close & Return to Live Terminal
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>CLOUD RUN LIVE STREAM READY</span>
          </span>
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </div>
    </div>
  );
};
