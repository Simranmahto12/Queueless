import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Tv,
  Cast,
  Monitor,
  Radio,
  Copy,
  ExternalLink,
  Check,
  X,
  Wifi,
  Sparkles,
  HelpCircle,
  Volume2,
  Eye,
  Sliders,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';

interface TVConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDistanceMode?: boolean;
  onToggleDistanceMode?: (enabled: boolean) => void;
  isWakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
}

export const TVConnectModal: React.FC<TVConnectModalProps> = ({
  isOpen,
  onClose,
  isDistanceMode = false,
  onToggleDistanceMode,
  isWakeLockActive = false,
  onToggleWakeLock,
}) => {
  const [activeTab, setActiveTab] = useState<'cast' | 'browser' | 'hdmi' | 'settings'>('cast');
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [castError, setCastError] = useState<string | null>(null);
  const [castSuccess, setCastSuccess] = useState<boolean>(false);

  // Default LAN IP for Smart TV access
  const [tvHost, setTvHost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.location.host;
      }
    }
    return '192.168.1.197:5175';
  });

  const tvUrl = `${window.location.protocol}//${tvHost}/display`;

  // Generate QR Code for Smart TV browser scan
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(tvUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate TV QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [tvUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tvUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Wireless Cast via Presentation API
  const handleStartCast = async () => {
    setIsCasting(true);
    setCastError(null);
    setCastSuccess(false);

    try {
      // Check for Presentation API (Supported on Chrome, Edge, Android, Opera)
      const nav = navigator as any;
      if (nav.presentation && window.location) {
        const presentationUrl = `${window.location.origin}/display`;
        const request = new nav.PresentationRequest([presentationUrl]);
        const connection = await request.start();
        setCastSuccess(true);
        connection.addEventListener('terminate', () => {
          setCastSuccess(false);
        });
      } else {
        // Fallback instructions if Presentation API receiver is not directly paired
        setCastError('Browser Presentation API prompt opened. If no TV appears, use Google Chrome "Cast..." from the menu.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to wireless display.';
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort')) {
        setCastError('Casting cancelled by user.');
      } else {
        setCastError('To cast directly, click the 3 dots menu in your browser and select "Cast...", then choose your Smart TV.');
      }
    } finally {
      setIsCasting(false);
    }
  };

  // Launch on Connected TV (HDMI / Dual Screen)
  const handleLaunchOnHDMI = async () => {
    try {
      const win = window as any;
      if ('getScreenDetails' in win) {
        const screenDetails = await win.getScreenDetails();
        const externalScreen = screenDetails.screens.find((s: any) => s !== screenDetails.currentScreen);
        if (externalScreen) {
          window.open(
            '/display',
            'QueueLessTVDisplay',
            `left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight},fullscreen=yes`
          );
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Standard borderless popup for second monitor
    window.open(
      '/display',
      'QueueLessTVDisplay',
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg border border-blue-400/40">
              <Tv className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Connect to Television
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  4K / 1080p Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Display the Lobby Queue on any Smart TV, wireless display, or HDMI screen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'cast'
                ? 'border-blue-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cast className="w-4 h-4 text-blue-400" />
            <span>Wireless Cast</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'browser'
                ? 'border-blue-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>Smart TV Browser</span>
          </button>

          <button
            onClick={() => setActiveTab('hdmi')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'hdmi'
                ? 'border-blue-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>HDMI / Cable</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>TV Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: WIRELESS CAST */}
          {activeTab === 'cast' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                    <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>One-Click Wireless Screen Cast</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Stream this queue display to Google TV, Chromecast, Samsung Tizen, LG webOS, or AirPlay.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartCast}
                  disabled={isCasting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-900 flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Cast className="w-4 h-4" />
                  <span>{isCasting ? 'Searching for TV...' : 'Start Cast to TV'}</span>
                </button>
              </div>

              {castSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Successfully connected! Your Lobby TV Display is now casting.</span>
                </div>
              )}

              {castError && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                  {castError}
                </div>
              )}

              {/* Instructions by Device */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Casting Instructions by Device
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      <span>Google Chrome / Android TV</span>
                    </strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Click the <strong>3 vertical dots</strong> in your browser top-right &rarr; click <strong>Cast...</strong> &rarr; select your TV.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      <span>Mac / Apple TV / AirPlay</span>
                    </strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Click <strong>Control Center</strong> on Mac menu bar &rarr; select <strong>Screen Mirroring</strong> &rarr; pick your TV.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      <span>Windows Wireless Display</span>
                    </strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[10px]">Win + K</kbd> to open the Cast panel &rarr; select your Smart TV.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      <span>Samsung & LG Smart TVs</span>
                    </strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Ensure your TV and computer are on the same Wi-Fi network for seamless wireless streaming.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART TV BROWSER */}
          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Left: QR Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-md mb-2">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="TV Display URL QR"
                        width={160}
                        height={160}
                        className="rounded-lg select-none"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Loading QR...
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">
                    Scan with Phone or TV Camera
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Instantly opens the Lobby TV Display
                  </span>
                </div>

                {/* Right: Direct URL & TV PIN */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Type this URL on your Smart TV Browser:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-700 font-mono text-xs text-blue-300 flex-1 truncate select-all">
                        {tvUrl}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                        title="Copy TV URL"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* TV Pairing Code */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      TV Station Quick PIN
                    </span>
                    <div className="font-mono text-2xl font-black text-white tracking-widest mt-0.5">
                      QL-8492
                    </div>
                    <span className="text-[10px] text-emerald-300/80">
                      Auto-syncs live calls without manual login
                    </span>
                  </div>

                  <a
                    href={tvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>Test TV URL in New Window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Steps for Smart TV apps */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-bold text-white block">Compatible Smart TV Browsers:</span>
                <p className="text-[11px]">
                  &bull; <strong>Samsung TV:</strong> Open the "Internet" app from the home menu.<br />
                  &bull; <strong>LG TV:</strong> Open the "Web Browser" app from webOS dashboard.<br />
                  &bull; <strong>Android / Sony / Fire TV:</strong> Open Silk or download "TV Bro" / "Puffin TV".
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HDMI / DUAL MONITOR */}
          {activeTab === 'hdmi' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Physical HDMI / Cable Connection</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    Connect an HDMI cable from your computer to the television. Click below to launch a dedicated fullscreen display window.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLaunchOnHDMI}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950 flex items-center gap-2 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Launch Dedicated TV Screen Window</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                <span className="font-semibold text-white block">HDMI Best Practices for Lobby Displays:</span>
                <p className="text-[11px] text-slate-400">
                  1. In display settings, set mode to <strong>"Extend Desktop"</strong> (not Mirror) so staff can continue working while TV displays the queue.<br />
                  2. Drag the opened TV window onto the TV screen and press <kbd className="px-1 py-0.5 rounded bg-slate-700 font-mono text-[10px]">F11</kbd> to make it full screen.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TV SETTINGS & OPTIMIZATION */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Keep Screen Awake Toggle */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Prevent TV Sleep (Screen Wake Lock)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Keeps the television screen permanently on without turning off or showing a screensaver.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onToggleWakeLock}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                    isWakeLockActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white'
                  }`}
                >
                  {isWakeLockActive ? 'ON (Always Awake)' : 'OFF'}
                </button>
              </div>

              {/* Lobby Distance Mode (Large Fonts) */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white">Lobby Distance Mode (4K / Large Fonts)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Enlarges token numbers and text by 30% for readability from 20-30 feet away in large halls.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleDistanceMode && onToggleDistanceMode(!isDistanceMode)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                    isDistanceMode
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white'
                  }`}
                >
                  {isDistanceMode ? 'ON (High Visibility)' : 'OFF (Standard)'}
                </button>
              </div>

              {/* Wi-Fi Host IP Config */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Local Network IP for Smart TV</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{tvHost}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Ensure your Smart TV is connected to the same Wi-Fi network ({tvHost}) to load the real-time queue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Zero configuration required for modern Smart TVs</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
