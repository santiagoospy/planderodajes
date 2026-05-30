/**
 * Department avatar — shows photo or department icon on a colored background.
 * Can be made editable to upload a new photo.
 */

import { useRef } from 'react'
import { Icon } from './Icon'
import { compressImage } from '../../utils/image'

/**
 * @param {{
 *   photo?:       string,   // base64 or URL
 *   icon?:        string,   // Lucide icon name
 *   color?:       string,
 *   size?:        number,
 *   borderRadius?: number,
 *   fontSize?:    number,   // icon size (≈ 0.9 * desired visual size)
 *   editable?:    boolean,
 *   onUpload?:    (base64: string) => void,
 * }} props
 */
export function DeptAvatar({
  photo,
  icon = 'User',
  color = '#888',
  size = 48,
  borderRadius = 14,
  fontSize = 26,
  editable = false,
  onUpload,
}) {
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file, 120, 0.6)
      onUpload?.(compressed)
    } catch (err) {
      console.error('compressImage error', err)
    }
    e.target.value = ''
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {photo
        ? (
          <img
            src={photo}
            alt="avatar"
            className="object-cover"
            style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}44`, display: 'block' }}
          />
        )
        : (
          <div
            className="flex items-center justify-center"
            style={{ width: size, height: size, borderRadius, background: `${color}18` }}
          >
            <Icon name={icon} size={Math.round(fontSize * 0.9)} color={color} />
          </div>
        )
      }

      {editable && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex items-center justify-center cursor-pointer"
            style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: '2px solid var(--bg-primary)' }}
          >
            <Icon name="Camera" size={11} color="#fff" />
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </>
      )}
    </div>
  )
}
