import { uploadFileToR2 } from '../services/s3-upload'
import { compressImage } from './image'

function dataUrlToFile(dataUrl, fileName) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], fileName, { type: mime })
}

// Compress image then upload to R2. Non-images are uploaded as-is.
export async function compressAndUploadToR2(file, maxSize = 1200, quality = 0.75) {
  let uploadFile = file
  if (file.type.startsWith('image/')) {
    try {
      const dataUrl = await compressImage(file, maxSize, quality)
      uploadFile = dataUrlToFile(dataUrl, file.name.replace(/\.[^.]+$/, '.jpg'))
    } catch { /* use original on compression failure */ }
  }
  return uploadFileToR2(uploadFile)
}

// Upload a canvas/camera base64 dataURL to R2.
export async function uploadDataUrlToR2(dataUrl, fileName = 'photo.jpg') {
  return uploadFileToR2(dataUrlToFile(dataUrl, fileName))
}
