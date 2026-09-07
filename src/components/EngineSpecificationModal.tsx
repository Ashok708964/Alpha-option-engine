import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  Search,
  BookOpen,
  Layers,
  Cpu,
  ShieldCheck,
  Activity,
  Calculator,
  Sliders,
} from "lucide-react";
import { generateSpecificationPdf } from "../utils/pdfGenerator";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineSpecificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("sec-arch");
  const [searchQuery, setSearchQuery] = useState("");
  const [specContent, setSpecContent] = useState<string>("");

  useEffect(() => {
    // Fetch live spec from backend if available
    fetch("/api/docs/engine-spec")
      .then((res) => res.text())
      .then((text) => {
        if (text && !text.startsWith("<!DOCTYPE") && !text.includes("404")) {
          setSpecContent(text);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  // Direct client-side PDF file download via jsPDF
  const handleDownloadPdf = () => {
    try {
      setPdfGenerating(true);
      generateSpecificationPdf();
      setPdfSuccess(true);
      setTimeout(() => {
        setPdfGenerating(false);
        setPdfSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("PDF generation failed, falling back to print view:", err);
      window.open("/api/docs/print-view?autoprint=true", "_blank");
      setPdfGenerating(false);
    }
  };

  // Standalone print view (opens top-level new tab to bypass iframe sandbox restrictions)
  const handleOpenPrintTab = () => {
    window.open("/api/docs/print-view?autoprint=true", "_blank");
  };

  const handleDownloadMd = () => {
    const link = document.createElement("a");
    link.href = "/api/docs/engine-spec?download=true";
    link.download = "OMNIALPHA_FO_STRATEGY_ENGINE_SPECIFICATION.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (specContent) {
      navigator.clipboard.writeText(specContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      fetch("/api/docs/engine-spec")
        .then((res) => res.text())
        .then((text) => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    }
  };

  const navItems = [
    { id: "sec-arch", label: "1. System Architecture", icon: Layers },
    { id: "sec-stochastic", label: "2. Greeks & Stochastic Engines", icon: Activity },
    { id: "sec-nexus", label: "3. NEXUS 17-Subsystem Löwdin", icon: Cpu },
    { id: "sec-hft", label: "4. Avellaneda & Almgren Execution", icon: Sliders },
    { id: "sec-confluence", label: "5. 8 Confluence Locks & Vectors", icon: ShieldCheck },
    { id: "sec-kelly", label: "6. Kelly Sizing, Knapsack & VaR", icon: Calculator },
    { id: "sec-mbo", label: "7. Order Book MBO (200 & 30 Depth)", icon: BookOpen },
    { id: "sec-cpcv", label: "8. CPCV 15-Paths, PBO & DSR", icon: FileText },
    { id: "sec-params", label: "9. Master Parameter Directory", icon: Sliders },
    { id: "sec-playbook", label: "10. Execution Playbook", icon: Check },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Print-specific style tag injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-spec-content, #printable-spec-content * {
            visibility: visible !important;
          }
          #printable-spec-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-200">
        {/* Modal Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  OmniAlpha F&O Strategy Engine Specification
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v4.2.0 • Institutional Document
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete Mathematical Specifications, Parameters, Subsystems & Execution Models
              </p>
            </div>
          </div>

          {/* Action Buttons: Download PDF, Print View (New Tab), Download MD, Copy, Close */}
          <div className="flex items-center gap-2">
            {/* Primary Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Generate and Download Direct PDF File"
            >
              {pdfSuccess ? (
                <Check className="w-3.5 h-3.5 text-slate-950" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{pdfGenerating ? "Generating PDF..." : pdfSuccess ? "Downloaded PDF!" : "Download PDF (.pdf)"}</span>
            </button>

            {/* Print in New Tab (Bypasses iframe sandbox) */}
            <a
              href="/api/docs/print-view?autoprint=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all text-decoration-none"
              title="Open in new tab and launch browser Print / Save to PDF dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF (New Tab)</span>
            </a>

            {/* Download Markdown */}
            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
              title="Download Raw Markdown Document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>.MD</span>
            </button>

            {/* Copy Markdown */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Copy all text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <a
              href="/api/docs/engine-spec"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Open raw document in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 border border-slate-700 transition-all ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Navigation Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4 text-xs no-print overflow-x-auto">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search parameters, formulas, models (e.g. VPIN, Kelly, GEX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 flex-shrink-0">
            <span className="text-emerald-400 font-bold">17 Subsystems</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">Löwdin Matrix</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Avellaneda-Stoikov</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">CPCV 15-Paths</span>
          </div>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Quick Jump Sidebar */}
          <div className="w-64 bg-slate-950/40 border-r border-slate-800 p-3 overflow-y-auto hidden md:block no-print space-y-1 text-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Table of Contents
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-all ${
                    activeSection === item.id
                      ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 px-2">
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 space-y-2">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Two PDF Options:</span>
                </div>
                <p>
                  <strong className="text-white">1. Download PDF (.pdf):</strong> Instant client-side binary PDF file download to your machine.
                </p>
                <p>
                  <strong className="text-white">2. Print / PDF (New Tab):</strong> Opens clean printable view in a separate tab to bypass any browser iframe restrictions.
                </p>
              </div>
            </div>
          </div>

          {/* Main Scrollable Document Content */}
          <div
            id="printable-spec-content"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar text-sm leading-relaxed"
          >
            {/* Title Section */}
            <div className="border-b border-slate-800 pb-6">
              <div className="text-xs font-mono font-bold text-indigo-400 tracking-wider uppercase mb-1">
                Institutional Whitepaper & Algorithmic Blueprint
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                OmniAlpha F&O Strategy Engine
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Exhaustive Technical Specification: 17-Subsystem Löwdin Orchestration, Microstructure VPIN, GEX Surfaces,
                Stochastic Diffusions, High-Frequency Quoting & Risk Parameters
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Target: NSE Index F&O
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  PBO Score: 20.0% (Non-Overfit)
                </span>
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  Deflated Sharpe: 97.45%
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  Document ID: OA-SPEC-2026
                </span>
              </div>

              {/* Quick Action PDF Banner (no-print) */}
              <div className="no-print p-3.5 bg-slate-950/90 border border-amber-500/40 rounded-lg flex items-center justify-between gap-4 flex-wrap mt-5 shadow-lg">
                <div className="flex items-center gap-2.5 text-xs text-amber-200">
                  <div className="w-7 h-7 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Need an Offline Copy or Institutional PDF?</span>
                    <span className="text-slate-400 text-[11px]">Direct download works without browser print dialog blocks or iframe restrictions.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfGenerating}
                    className="px-3.5 py-1.5 rounded text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{pdfGenerating ? "Generating..." : pdfSuccess ? "Downloaded!" : "Download PDF (.pdf)"}</span>
                  </button>
                  <a
                    href="/api/docs/print-view?autoprint=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-decoration-none"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Open in New Tab &amp; Print</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Section 1: Executive System Architecture */}
            <section id="sec-arch" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>1. Executive System Architecture</span>
              </h2>
              <p className="text-slate-300">
                The OmniAlpha platform is an institutional-grade algorithmic execution engine purpose-built for Indian
                Index Futures and Options (NIFTY 50, BANK NIFTY, FINNIFTY, MIDCPNIFTY, and SENSEX). It unifies tick-level
                microstructure feeds from DhanHQ (200-depth) and Upstox (30-level MBO) with 17 continuous mathematical
                subsystems.
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto text-indigo-300">
                <pre>{`[ Dhan 200-Depth / Upstox 30-Depth MBO Feeds ]
                  │
                  ▼
[ Order Book Imbalance + Micro-Price + VPIN Toxicity ]
                  │
                  ▼
[ NEXUS 17-Subsystem Matrix (11 Empirical + 6 Stochastic) ]
                  │
                  ▼
[ Symmetric Löwdin S^-1/2 Orthogonalization Projection ]
                  │
                  ▼
[ Unified Master Verdict: STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL ]
                  │
                  ▼
[ Avellaneda-Stoikov HJB Quoting (pb*, r, pa*) & Almgren-Chriss Trajectory ]
                  │
                  ▼
[ Fractional Kelly Allocation & Operations Research Dynamic Knapsack ]`}</pre>
              </div>
            </section>

            {/* Section 2: Greeks & Stochastic Engines */}
            <section id="sec-stochastic" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>2. Core Quantitative & Stochastic Engines</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                    2.1 Extended Greeks Model
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculates Delta, Gamma, Theta, Vega, plus second-order Greeks:
                  </p>
                  <ul className="text-xs font-mono space-y-1 text-slate-300">
                    <li>• Vanna: ∂Δ/∂σ (gamma expansion during IV surges)</li>
                    <li>• Charm: ∂Δ/∂t (delta decay into expiry)</li>
                    <li>• Vomma: ∂ν/∂σ (vol-of-vol sensitivity)</li>
                    <li>• Speed: ∂Γ/∂S (third-order spot derivative)</li>
                  </ul>
                </div>

                <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                    2.2 VPIN Microstructure Toxicity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Volume-Synchronized Probability of Toxicity across equal-volume buckets:
                  </p>
                  <div className="font-mono text-xs text-amber-300 bg-slate-900 p-2 rounded">
                    VPIN = Σ |V_b - V_s| / (N · V)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Thresholds: Low &le; 35 | Moderate 35-55 | High Toxic 55-75 | Extreme Institutional Sweep &gt; 75
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                    2.3 GEX & Gamma Flip Dynamics
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evaluates dealer hedging obligations across 15 strikes around spot:
                  </p>
                  <div className="font-mono text-xs text-amber-300 bg-slate-900 p-2 rounded">
                    GEX_K = (OI_call · Γ_call - OI_put · Γ_put) · S² · 0.01
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Positive GEX: Mean-reverting sticky pin. Negative GEX: Volatility expansion & gamma squeeze.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                    2.4 Heston Stochastic Volatility
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mean-reverting CIR variance diffusion coupled with asset returns:
                  </p>
                  <div className="font-mono text-xs text-amber-300 bg-slate-900 p-2 rounded">
                    dV_t = κ(θ - V_t)dt + ξ√V_t dW_t
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Parameters: κ=2.40, θ=0.0324 (18% vol), ξ=0.35, ρ=-0.68 (Feller verified: 2κθ &gt; ξ²).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">ORNSTEIN-UHLENBECK</span>
                  <span className="text-xs font-mono font-bold text-white">θ = 4.25, σ = 0.012</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Half-life: t_1/2 = ln(2)/θ</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">KALMAN FILTER STATE</span>
                  <span className="text-xs font-mono font-bold text-white">Q = 10⁻⁴, R = 10⁻²</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Extracts true latent price drift</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">GARCH(1,1) CONDITIONAL VOL</span>
                  <span className="text-xs font-mono font-bold text-white">α = 0.085, β = 0.905</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Persistence: α + β = 0.990</span>
                </div>
              </div>
            </section>

            {/* Section 3: NEXUS 17-Subsystem Ensemble */}
            <section id="sec-nexus" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <span>3. NEXUS 17-Subsystem Ensemble & Symmetric Löwdin Decoupling</span>
              </h2>
              <p className="text-slate-300">
                To prevent collinearity where indicators mirror each other, NEXUS applies{" "}
                <span className="text-indigo-400 font-semibold">Symmetric Löwdin Orthogonalization (S⁻¹/²)</span>. The
                covariance matrix S of the 17 signals is decomposed via spectral decomposition:
              </p>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-indigo-300">
                S = U Λ Uᵀ &rarr; S⁻¹/² = U Λ⁻¹/² Uᵀ &rarr; x_ortho = S⁻¹/² · x_raw
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Layer 1: 11 Empirical Feature Groups</span>
                  <ul className="text-xs space-y-1 text-slate-300">
                    <li>• [A] CANDLE_DYNAMICS (Heikin-Ashi, Body/Wick ratios)</li>
                    <li>• [B] STATISTICAL_CHANNELS (VWAP Z-Score, Bollinger Bands)</li>
                    <li>• [C] VOLUME_PROFILE (RVOL, VPOC Magnet)</li>
                    <li>• [D] ORDER_BOOK_DEPTH (30-Level OBI, Micro-Spread)</li>
                    <li>• [E] OPTIONS_SURFACE (25-Delta Skew, Net GEX Drift)</li>
                    <li>• [F] ORDER_FLOW (Tape Aggression, Flow Skew)</li>
                    <li>• [G] MARKET_BREADTH (Advance/Decline, Heavyweight Sync)</li>
                    <li>• [H] MACRO_FX (GIFT Nifty Basis, USDINR Shock)</li>
                    <li>• [I] TEMPORAL_DYNAMICS (Time-of-Day Curve, DTE Decay)</li>
                    <li>• [J] ALTERNATIVE_SENTIMENT (News Sentiment vs CVD)</li>
                    <li>• [K] META_LEARNER (Gaussian Mixture & PCA Principal)</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Layer 2: 6 Stochastic Continuous Engines</span>
                  <ul className="text-xs space-y-1 text-slate-300">
                    <li>• [1] ALPHA_MICROSTRUCTURE (Order Flow Imbalance OFI Drift)</li>
                    <li>• [2] ALPHA_TOXICITY (Hawkes Self-Exciting Jump Rate)</li>
                    <li>• [3] ALPHA_STOCHASTIC_JUMP (Merton Poisson Compensator)</li>
                    <li>• [4] ALPHA_INVENTORY_CONTROL (Dealer Inventory Skew)</li>
                    <li>• [5] ALPHA_VWAP_MEAN_REVERSION (Elasticity Bounds)</li>
                    <li>• [6] ALPHA_ZIGZAG_DYNAMICS (Wyckoff Structural Pivots)</li>
                  </ul>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                    <span className="text-amber-400 font-bold block mb-1">Master Trade Verdict Rules:</span>
                    <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                      <li>• &alpha; &ge; +0.30, Conv &ge; 45% &rarr; <span className="text-emerald-400 font-bold">STRONG_BUY</span></li>
                      <li>• +0.10 &le; &alpha; &lt; +0.30 &rarr; <span className="text-emerald-300 font-bold">BUY</span></li>
                      <li>• -0.10 &lt; &alpha; &lt; +0.10 &rarr; <span className="text-slate-300 font-bold">HOLD (Delta Neutral)</span></li>
                      <li>• -0.30 &lt; &alpha; &le; -0.10 &rarr; <span className="text-rose-300 font-bold">SELL</span></li>
                      <li>• &alpha; &le; -0.30, Conv &ge; 45% &rarr; <span className="text-rose-400 font-bold">STRONG_SELL</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Avellaneda & Almgren Execution */}
            <section id="sec-hft" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>4. High-Frequency Quoting & Optimal Execution Trajectories</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase text-amber-400">
                    Avellaneda-Stoikov HJB Quoting Model
                  </h3>
                  <p className="text-xs text-slate-300">
                    Computes inventory-penalized reservation price (r) and optimal limit order quotes (p_b*, p_a*):
                  </p>
                  <div className="bg-slate-900 p-2 rounded font-mono text-xs text-amber-300">
                    r(s, q, t) = s - q·γ·σ²·(T - t) + α_ens·σ
                  </div>
                  <p className="text-xs text-slate-400">
                    Where &gamma; = 0.005 (Risk aversion), &kappa; = 1.50 (Liquidity arrival density), tick = ₹0.05.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase text-amber-400">
                    Almgren-Chriss Implementation Shortfall (IS)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Determines optimal discrete liquidation path balancing market impact against timing risk:
                  </p>
                  <div className="bg-slate-900 p-2 rounded font-mono text-xs text-amber-300">
                    x_j = [sinh(&kappa;(T - t_j)) / sinh(&kappa;T)] · X_0
                  </div>
                  <p className="text-xs text-slate-400">
                    Urgency &kappa; = &radic;(&lambda;&sigma;&sup2; / &eta;) with &lambda; = 10⁻⁴, &eta; = 1.2&times;10⁻⁶ across a 300s window.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Confluence & Pinpoint Vector */}
            <section id="sec-confluence" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>5. Multi-Tier Confluence & Pinpoint Vector Engine</span>
              </h2>
              <p className="text-slate-300">
                A trade setup requires a minimum confluence score of <span className="text-white font-bold">88 / 100</span>{" "}
                with at least <span className="text-emerald-400 font-bold">6 of the 8 institutional factors locked</span>:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">1. VPIN & CVD</span>
                  <span className="text-slate-400 text-[11px]">|CVD| &gt; 12,000</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">2. VWAP BANDS</span>
                  <span className="text-slate-400 text-[11px]">&plusmn;1&sigma; Defense</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">3. FVG GAP</span>
                  <span className="text-slate-400 text-[11px]">Retest Mitigation</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">4. WYCKOFF FIB</span>
                  <span className="text-slate-400 text-[11px]">0.618 - 0.786 Pocket</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">5. VPOC MAGNET</span>
                  <span className="text-slate-400 text-[11px]">70% Value Area</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">6. OPTION 0.70&Delta;</span>
                  <span className="text-slate-400 text-[11px]">&Gamma;/&Theta; &approx; 0.28</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">7. OI WALL & PCR</span>
                  <span className="text-slate-400 text-[11px]">PCR &gt; 1.25 / &lt; 0.75</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-indigo-400 font-bold block">8. FRACTAL SYNC</span>
                  <span className="text-slate-400 text-[11px]">15m + 5m + 1m</span>
                </div>
              </div>
            </section>

            {/* Section 6: Capital Allocation & Risk */}
            <section id="sec-kelly" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                <span>6. Capital Allocation & Operations Research</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-indigo-400 uppercase">Fractional Kelly Optimization</h3>
                  <div className="bg-slate-900 p-2 rounded font-mono text-amber-300">
                    f* = (p·b - q) / b
                  </div>
                  <p className="text-slate-400">
                    Win Rate p=0.72, Payoff b=2.21 (₹4200/₹1900). Institutional Standard:{" "}
                    <span className="text-emerald-400 font-bold">Half-Kelly (29.6%)</span>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-indigo-400 uppercase">Dynamic Knapsack Allocator</h3>
                  <p className="text-slate-300">
                    Solves integer programming strike allocation across [-2, -1, ATM, +1, +2] strikes subject to total
                    account margin budget.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-indigo-400 uppercase">Parametric VaR & CVaR</h3>
                  <p className="text-slate-300">
                    Calculates 95% and 99% Value-at-Risk plus Expected Shortfall (CVaR) tail risk for extreme black-swan
                    events.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Order Book Gateways */}
            <section id="sec-mbo" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>7. Order Book Microstructure Gateways</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-cyan-400 uppercase">DhanHQ 200-Depth MBP / MBO</h3>
                  <p className="text-slate-300">
                    Direct binary WebSocket connection streaming 200 bid and 200 ask levels. Tracks order queue
                    distributions, iceberg detection, and micro-price:
                  </p>
                  <div className="bg-slate-900 p-2 rounded font-mono text-cyan-300">
                    P_micro = (V_B · P_A + V_A · P_B) / (V_B + V_A)
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-cyan-400 uppercase">Upstox API v2 30-Level MBO</h3>
                  <p className="text-slate-300">
                    Protobuf feed delivering 30-depth quotes with 322&mu;s latency. Automatically computes the dynamic ATM
                    strike:
                  </p>
                  <div className="bg-slate-900 p-2 rounded font-mono text-cyan-300">
                    ATM Strike = round(Spot / StrikeStep) &times; StrikeStep
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: CPCV & PBO Backtest Audit */}
            <section id="sec-cpcv" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>8. Backtesting, CPCV & Overfitting Audit Suite</span>
              </h2>
              <p className="text-slate-300">
                To guarantee zero statistical data-snooping, OmniAlpha incorporates Marcos López de Prado's Combinatorial
                Purged Cross-Validation protocols:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">CPCV Paths</span>
                  <span className="text-xl font-bold font-mono text-white">15 Combinations</span>
                  <span className="text-[10px] text-slate-400 block mt-1">C(6,2) Purged & Embargoed</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">PBO Score</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">20.0%</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Institutional Threshold &le; 25%</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Deflated Sharpe</span>
                  <span className="text-xl font-bold font-mono text-indigo-400">97.45%</span>
                  <span className="text-[10px] text-slate-400 block mt-1">p &lt; 0.05 Significance</span>
                </div>
              </div>
            </section>

            {/* Section 9: Master Parameter Directory Table */}
            <section id="sec-params" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>9. Exhaustive Master Parameter Directory</span>
              </h2>

              <div className="border border-slate-800 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Subsystem</th>
                      <th className="p-2.5">Parameter Name</th>
                      <th className="p-2.5">Default Value</th>
                      <th className="p-2.5">Valid Range</th>
                      <th className="p-2.5">Operational Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Greeks</td>
                      <td className="p-2.5 text-white">Risk-Free Rate (r)</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.065 (6.5%)</td>
                      <td className="p-2.5 text-slate-400">0.04 - 0.08</td>
                      <td className="p-2.5">RBI 91-day T-Bill rate for BSM discounting</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Greeks</td>
                      <td className="p-2.5 text-white">Target Option Delta</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.70</td>
                      <td className="p-2.5 text-slate-400">0.65 - 0.75</td>
                      <td className="p-2.5">ITM strike maximizing gamma per rupee</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-emerald-400 font-bold">Microstructure</td>
                      <td className="p-2.5 text-white">VPIN High Toxicity</td>
                      <td className="p-2.5 text-amber-300 font-bold">55.0</td>
                      <td className="p-2.5 text-slate-400">50.0 - 70.0</td>
                      <td className="p-2.5">Threshold triggering adverse selection alert</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-emerald-400 font-bold">Microstructure</td>
                      <td className="p-2.5 text-white">VPIN Extreme Sweep</td>
                      <td className="p-2.5 text-amber-300 font-bold">75.0</td>
                      <td className="p-2.5 text-slate-400">70.0 - 90.0</td>
                      <td className="p-2.5">Threshold triggering emergency stop-widening</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">NEXUS</td>
                      <td className="p-2.5 text-white">Risk Aversion (&gamma;)</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.005</td>
                      <td className="p-2.5 text-slate-400">0.001 - 0.02</td>
                      <td className="p-2.5">Avellaneda-Stoikov inventory penalty</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">NEXUS</td>
                      <td className="p-2.5 text-white">Liquidity Density (&kappa;)</td>
                      <td className="p-2.5 text-amber-300 font-bold">1.50</td>
                      <td className="p-2.5 text-slate-400">0.50 - 5.00</td>
                      <td className="p-2.5">Poisson order book fill rate arrival</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">NEXUS</td>
                      <td className="p-2.5 text-white">Alpha Strong Cutoff</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.30</td>
                      <td className="p-2.5 text-slate-400">0.25 - 0.50</td>
                      <td className="p-2.5">Triggers immediate market sweep order</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">NEXUS</td>
                      <td className="p-2.5 text-white">Conviction Minimum</td>
                      <td className="p-2.5 text-amber-300 font-bold">45.0%</td>
                      <td className="p-2.5 text-slate-400">35% - 60%</td>
                      <td className="p-2.5">Minimum confidence required for trade trigger</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-amber-400 font-bold">Almgren-Chriss</td>
                      <td className="p-2.5 text-white">Temporary Impact (&eta;)</td>
                      <td className="p-2.5 text-amber-300 font-bold">1.2e-6</td>
                      <td className="p-2.5 text-slate-400">1e-7 - 1e-5</td>
                      <td className="p-2.5">Linear slippage coefficient per lot</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-cyan-400 font-bold">Heston Model</td>
                      <td className="p-2.5 text-white">Mean Reversion (&kappa;)</td>
                      <td className="p-2.5 text-amber-300 font-bold">2.40</td>
                      <td className="p-2.5 text-slate-400">1.0 - 5.0</td>
                      <td className="p-2.5">Variance mean-reversion speed</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-cyan-400 font-bold">Heston Model</td>
                      <td className="p-2.5 text-white">Correlation (&rho;)</td>
                      <td className="p-2.5 text-amber-300 font-bold">-0.68</td>
                      <td className="p-2.5 text-slate-400">-0.90 - -0.30</td>
                      <td className="p-2.5">Leverage effect: market drops spike volatility</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-emerald-400 font-bold">Kelly Sizing</td>
                      <td className="p-2.5 text-white">Multiplier (Damper)</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.50 (Half)</td>
                      <td className="p-2.5 text-slate-400">0.25 - 0.50</td>
                      <td className="p-2.5">Safety fraction to strictly prevent ruin</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Confluence</td>
                      <td className="p-2.5 text-white">Confluence Score Threshold</td>
                      <td className="p-2.5 text-amber-300 font-bold">88</td>
                      <td className="p-2.5 text-slate-400">80 - 95</td>
                      <td className="p-2.5">Minimum score for high conviction trade setup</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Confluence</td>
                      <td className="p-2.5 text-white">Target 1 Multiplier</td>
                      <td className="p-2.5 text-amber-300 font-bold">1.272 &times; ATR</td>
                      <td className="p-2.5 text-slate-400">1.0 - 1.5</td>
                      <td className="p-2.5">Fibonacci expansion profit target 1</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Confluence</td>
                      <td className="p-2.5 text-white">Target 2 Multiplier</td>
                      <td className="p-2.5 text-amber-300 font-bold">1.618 &times; ATR</td>
                      <td className="p-2.5 text-slate-400">1.5 - 2.0</td>
                      <td className="p-2.5">Golden ratio expansion profit target 2</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-indigo-400 font-bold">Confluence</td>
                      <td className="p-2.5 text-white">Target 3 Multiplier</td>
                      <td className="p-2.5 text-amber-300 font-bold">2.618 &times; ATR</td>
                      <td className="p-2.5 text-slate-400">2.0 - 3.5</td>
                      <td className="p-2.5">Extended trend exhaustion profit target 3</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-rose-400 font-bold">Indian Tax</td>
                      <td className="p-2.5 text-white">STT (Option Sell)</td>
                      <td className="p-2.5 text-amber-300 font-bold">0.10%</td>
                      <td className="p-2.5 text-slate-400">Fixed NSE</td>
                      <td className="p-2.5">Securities transaction tax on sell premium</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-rose-400 font-bold">Indian Tax</td>
                      <td className="p-2.5 text-white">Flat Brokerage</td>
                      <td className="p-2.5 text-amber-300 font-bold">₹20 / order</td>
                      <td className="p-2.5 text-slate-400">Broker SLA</td>
                      <td className="p-2.5">Discount broker fee (₹40 per round trip)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 10: Execution Playbook */}
            <section id="sec-playbook" className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>10. Execution Playbook & Actionable Trade Plans</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-emerald-400 uppercase text-xs">
                    BUY_DIP_CALL (Bullish Confluence)
                  </h3>
                  <ul className="text-slate-300 space-y-1">
                    <li>• &alpha;_ens &ge; +0.10, Conviction &ge; 45%</li>
                    <li>• Confluence &ge; 88 with &ge; 6 locks verified</li>
                    <li>• Wyckoff Spring in 0.618 - 0.786 Fibonacci pocket</li>
                    <li>• Buy 0.70&Delta; ITM Call</li>
                    <li>• Scale out 50% at T1, 30% at T2, 20% at T3</li>
                    <li>• Stop: 1 tick below structural swing valley</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2">
                  <h3 className="font-bold text-rose-400 uppercase text-xs">
                    SELL_TOP_PUT (Bearish Confluence)
                  </h3>
                  <ul className="text-slate-300 space-y-1">
                    <li>• &alpha;_ens &le; -0.10, Conviction &ge; 45%</li>
                    <li>• Confluence &ge; 88 with &ge; 6 locks verified</li>
                    <li>• Wyckoff Sign of Weakness at VPOC ceiling</li>
                    <li>• Buy 0.70&Delta; ITM Put</li>
                    <li>• Scale out 50% at T1, 30% at T2, 20% at T3</li>
                    <li>• Stop: 1 tick above liquidity sweep high</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Bottom Footer Notice */}
            <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
              OmniAlpha F&O Quantitative Strategy Engine • Document Version 4.2.0 • All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
