/**
 * S3/R2 Upload Service
 * Handles file uploads to Cloudflare R2 and image compression
 */

export async function uploadFileToR2(file) {
  const res = await fetch('/.netlify/functions/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export function compressImage(file, maxPx = 800, quality = 0.70) {
  maxPx = maxPx || 800
  quality = quality || 0.70

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        let w = img.width
        let h = img.height

        if (w > maxPx || h > maxPx) {
          if (w > h) {
            h = Math.round(h * maxPx / w)
            w = maxPx
          } else {
            w = Math.round(w * maxPx / h)
            h = maxPx
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        // Convert to JPEG for maximum compression
        resolve(canvas.toDataURL('image/jpeg', quality))
      }

      img.onerror = reject
      img.src = e.target.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function compressImageStrong(file) {
  return compressImage(file, 1000, 0.60)
}
