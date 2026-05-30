/**
 * Compress an image File to a base64 data URL.
 * @param {File} file
 * @param {number} size  - max dimension in px (default 120)
 * @param {number} quality - JPEG quality 0-1 (default 0.6)
 * @returns {Promise<string>} base64 data URL
 */
export function compressImage(file, size = 120, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const scale = Math.min(size / img.width, size / img.height, 1)
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}
