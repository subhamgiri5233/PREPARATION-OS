// src/components/InstallAppBanner.jsx
// Prompts users on Mobile Chrome / Android / iOS / Desktop to Install the PWA on Home Screen

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, Bell } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission, sendNativeNotification } from '../services/nativeNotificationService';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    // 1. Check if already installed as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return; // Already installed, no need to show banner
    }

    // 2. Check if dismissed recently in this session
    const dismissed = sessionStorage.getItem('prepos_install_dismissed');

    // 3. Listen for Chrome's native beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice && !dismissed) {
      // Show for iOS users after a brief delay
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // Check notification permission
    setNotifPermission(getNotificationPermission());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.info('[PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('prepos_install_dismissed', 'true');
    setShowBanner(false);
  };

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      await sendNativeNotification({
        title: '🎯 PrepOS Notifications Enabled!',
        body: 'You will receive real-time study reminders, revision alerts, and session updates.',
        url: '/'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <>
      <div
        className="install-banner"
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 24px)',
          maxWidth: 480,
          background: 'linear-gradient(135deg, rgba(30, 30, 54, 0.96), rgba(20, 20, 36, 0.98))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          zIndex: 300,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          📱
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Install PrepOS App</span>
            <span className="badge badge-primary" style={{ fontSize: 9, padding: '1px 5px' }}>PWA</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.3 }}>
            Add shortcut to your phone home screen for 1-tap access and instant study sync!
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleInstallClick}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)' }}
          >
            <Download size={13} /> Install
          </button>
          <button
            onClick={handleDismiss}
            style={{ color: 'var(--text-3)', padding: 4, cursor: 'pointer' }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="modal-backdrop" onClick={() => setShowIOSGuide(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Install on iPhone / iPad</h3>
              <button className="modal-close" onClick={() => setShowIOSGuide(false)}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
              <p style={{ marginBottom: 12 }}>To add Preparation OS to your iOS home screen:</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Tap the <strong>Share</strong> button (📤 icon at the bottom of Safari).</li>
                <li>Scroll down and select <strong>"Add to Home Screen"</strong> (➕).</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ marginTop: 20 }}
              onClick={() => setShowIOSGuide(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
