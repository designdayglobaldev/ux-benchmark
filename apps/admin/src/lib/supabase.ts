import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', 
  supabaseAnonKey || 'placeholder'
)

async function compressImageToWebP(file: File, targetWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      
      let width = img.width
      let height = img.height
      
      if (width > targetWidth) {
        height = Math.round((height * targetWidth) / width)
        width = targetWidth
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas ctx null'))
      
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        if (blob.type !== 'image/webp') return reject(new Error('WebP not supported by browser'))
        
        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: 'image/webp',
          lastModified: Date.now(),
        })
        resolve(newFile)
      }, 'image/webp', quality)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }
    img.src = objectUrl
  })
}

/**
 * Uploads an image to the 'apps' bucket and returns the public URL.
 */
export async function uploadAppImage(file: File, folder: string = 'general'): Promise<string> {
  let fileToUpload = file
  
  try {
    const webp = await compressImageToWebP(file, 800, 0.8)
    // Only use the webp version if it is actually smaller than the original
    if (webp.size < file.size) {
      fileToUpload = webp
    }
  } catch (err) {
    console.warn('Image compression failed, falling back to original file:', err)
  }

  const fileExt = fileToUpload.name.split('.').pop() || 'png'
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('apps')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  const { data } = supabase.storage
    .from('apps')
    .getPublicUrl(filePath)

  return data.publicUrl
}
