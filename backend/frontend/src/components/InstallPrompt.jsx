import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if user already dismissed
    if (localStorage.getItem('pwa-dismissed')) return

    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <div className="install-banner">
      <div className="install-banner-icon">🌍</div>
      <div className="install-banner-text">
        <strong>Install Green Earth</strong>
        <span>Add to your home screen for quick access</span>
      </div>
      <button className="install-banner-btn" onClick={handleInstall}>Install</button>
      <button className="install-banner-close" onClick={handleDismiss}>✕</button>
    </div>
  )
}
