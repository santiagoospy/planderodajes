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

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
