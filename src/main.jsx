import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { uploadFileToR2, compressImage, compressImageStrong } from './services/s3-upload'
import { db } from './services/db'

// Make upload functions globally available
window.uploadFileToR2 = uploadFileToR2
window.compressImage = compressImage
window.compressImageStrong = compressImageStrong

// Make database functions globally available for Scouting and Messaging views
window._fb = db

// Register Service Worker for offline support + update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    // Fire 'swUpdated' when a new SW takes control (skipWaiting + clients.claim triggers this)
    let alreadyControlled = !!navigator.serviceWorker.controller
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (alreadyControlled) {
        window.dispatchEvent(new Event('swUpdated'))
      }
      alreadyControlled = true
    })
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
