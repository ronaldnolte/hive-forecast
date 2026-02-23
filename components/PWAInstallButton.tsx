'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallButton() {
    const { isInstallable, triggerInstall } = usePWAInstall();
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [isChromium, setIsChromium] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ua = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);

        // Detect Chromium-based browsers (Chrome, Edge, etc.)
        const chromium = /Chrome|Chromium|Edg/.test(ua) && !/OPR/.test(ua);
        setIsChromium(chromium);

        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if permanently dismissed
        if (localStorage.getItem('pwa-install-dismissed') === 'true') {
            setDismissed(true);
        }
    }, []);

    const handleInstallClick = async () => {
        if (isInstallable) {
            // Native install prompt available — use it
            await triggerInstall();
            return;
        }

        // Fallback: show instructions
        setShowTip(!showTip);
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Hide if already installed or permanently dismissed
    if (isStandalone || dismissed) return null;

    // Show on: iOS, Chromium browsers, or if install prompt is ready
    if (!isIOS && !isChromium && !isInstallable) return null;

    return (
        <div className="relative">
            {/* Install Button */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-1.5 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95"
                    title="Install Forecast app to your home screen"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Install App
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                    aria-label="Dismiss install button"
                    title="Don't show again"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Instructions Tooltip */}
            {showTip && (
                <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm text-gray-700">
                    {isIOS ? (
                        <>
                            <div className="font-bold text-[#8B4513] mb-2">Install on iOS</div>
                            <ol className="space-y-2 text-xs list-decimal list-inside">
                                <li>Tap the <strong>Share</strong> button <span className="inline-block text-base leading-none align-middle">⬆️</span> in Safari</li>
                                <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                                <li>Tap <strong>&quot;Add&quot;</strong> to confirm</li>
                            </ol>
                        </>
                    ) : (
                        <>
                            <div className="font-bold text-[#8B4513] mb-2">Install this app</div>
                            <div className="space-y-2 text-xs">
                                <p>Look for the <strong>install icon</strong> in your browser&apos;s address bar:</p>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>Click the install icon in the address bar, or use the browser menu <strong>⋮</strong> → <strong>&quot;Install app&quot;</strong></span>
                                </div>
                            </div>
                        </>
                    )}
                    <button
                        onClick={() => setShowTip(false)}
                        className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
                    >
                        Got it
                    </button>
                    {/* Arrow */}
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
                </div>
            )}
        </div>
    );
}
