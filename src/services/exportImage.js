/**
 * exportImage.js — export DOM element to clean PNG (light theme)
 */
export async function exportToPNG(element, filename = 'mentor-stats.png') {
  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      // Remove elements marked data-export-hide
      clonedDoc.querySelectorAll('[data-export-hide]').forEach(el => el.remove())
      // Ensure all CSS variables resolve correctly in clone
      const root = clonedDoc.documentElement
      const theme = document.documentElement.getAttribute('data-theme')
      if (theme) root.setAttribute('data-theme', theme)
      // Pause animations
      clonedDoc.querySelectorAll('[data-export-root] *').forEach(el => {
        el.style.animationPlayState = 'paused'
        el.style.transition = 'none'
      })
    }
  })

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}
