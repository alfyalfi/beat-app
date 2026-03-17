/**
 * exportImage.js
 * Export a DOM element to a clean PNG using html2canvas.
 * Renders on a dark background matching the app theme.
 */

export async function exportToPNG(element, filename = 'mentor-stats.png') {
  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    backgroundColor: '#050508',
    scale: 2,                    // retina quality
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      // Remove any elements marked data-export-hide
      clonedDoc.querySelectorAll('[data-export-hide]').forEach(el => el.remove())
      // Force full opacity on all children
      clonedDoc.querySelectorAll('[data-export-root] *').forEach(el => {
        el.style.animationPlayState = 'paused'
      })
    }
  })

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
