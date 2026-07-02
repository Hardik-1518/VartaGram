export const buildOptimizedVideoUrl = (videoUrl, width = 720) => {
  if (!videoUrl || !videoUrl.includes('cloudinary')) return videoUrl

  const transform = `q_auto,f_auto,vc_auto,w_${width},dpr_auto`
  if (videoUrl.includes(`/upload/${transform}/`)) return videoUrl

  return videoUrl.replace('/upload/', `/upload/${transform}/`)
}

export const buildCloudinaryVideoPoster = (videoUrl, width = 720) => {
  if (!videoUrl || !videoUrl.includes('cloudinary')) return ''

  const optimized = buildOptimizedVideoUrl(videoUrl, width)
  return optimized.replace(/\.(mp4|webm)(\?.*)?$/i, '.jpg')
}
