/**
 * S3/R2 Upload Service
 * Handles file uploads to Cloudflare R2.
 * Image compression lives in utils/image.js (single source of truth).
 */
export { compressImage, compressImageStrong } from '../utils/image'
import { Auth } from './auth'

export async function uploadFileToR2(file) {
  const token = await Auth.getToken()
  const res = await fetch('/.netlify/functions/r2-presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: 'upload',
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  })

  if (!res.ok) throw new Error('Presign error: ' + res.status)

  const { uploadUrl, key, serveUrl } = await res.json()

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error('R2 PUT ' + xhr.status))
    xhr.onerror = () => reject(new Error('Error de red al subir'))
    xhr.send(file)
  })

  return { key, url: serveUrl }
}
