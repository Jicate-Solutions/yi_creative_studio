import type * as fabric from 'fabric'

/**
 * Exports the full Fabric canvas as a PNG blob at native design resolution.
 * The multiplier ensures we export at the original resolution even if the
 * canvas was rendered at a scaled-down display size.
 */
export async function exportCanvasAsBlob(
  canvas: fabric.Canvas,
  designWidth: number,
  displayWidth: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const multiplier = designWidth / displayWidth

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier,
      quality: 1,
    })

    fetch(dataUrl)
      .then((res) => res.blob())
      .then(resolve)
      .catch(reject)
  })
}
