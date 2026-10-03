import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, RefreshCw, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Update State
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const installHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const updateHandler = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', installHandler);
    window.addEventListener('pwa-update-available', updateHandler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler);
      window.removeEventListener('pwa-update-available', updateHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install this app on your phone:\n1. Tap the Share or Menu button in your browser.\n2. Tap "Add to Home Screen" / "Install App".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleApplyUpdate = async () => {
    setUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      window.location.reload();
    }
  };

  return (
    <>
      {/* 1. Update Available Banner (Highest Priority) */}
      {updateAvailable && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-4 py-3 shadow-xl flex items-center justify-between border-b border-purple-500/40 text-xs z-50 sticky top-0 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">New App Version Available!</span>
              <p className="text-[11px] text-purple-200 hidden sm:block">
                A fresh update with new features and fixes is ready. Tap to refresh installed app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
              <span>{updating ? 'Updating App...' : 'Update App Now'}</span>
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Install App Banner (Only if not installed & no update active) */}
      {!isInstalled && showInstallPrompt && !updateAvailable && (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between border-b border-teal-500/30 text-xs z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white">Sirajul Huda Mobile & PC App</span>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Install onto your Phone home screen for fast 1-tap offline access!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
