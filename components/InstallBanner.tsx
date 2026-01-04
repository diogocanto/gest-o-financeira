
import React, { useState, useEffect } from 'react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // If not iOS, listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not standalone, show help banner
    if (isIOSDevice && !(window.navigator as any).standalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in slide-in-from-bottom duration-500">
      <div className="bg-[#4a1d35] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-[#ee2b6c] rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <span className="material-symbols-outlined text-white text-2xl">checkroom</span>
          </div>
          <div>
            <h4 className="text-sm font-bold">Instalar Bico Fino</h4>
            <p className="text-[10px] text-white/60 leading-tight">Acesse mais rápido e use offline na sua tela de início.</p>
          </div>
        </div>
        
        {isIOS ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-[10px] font-bold bg-white/10 px-2 py-1 rounded-lg">
              <span className="material-symbols-outlined text-xs">share</span>
              <span>Compartilhar</span>
            </div>
            <p className="text-[9px] text-white/40 italic">depois "Tela de Início"</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowBanner(false)}
              className="px-3 py-2 text-xs font-bold text-white/40 hover:text-white"
            >
              Agora não
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-[#ee2b6c] px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all"
            >
              Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;
