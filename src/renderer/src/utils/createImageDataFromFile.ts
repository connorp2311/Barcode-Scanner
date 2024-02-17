function createImageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    createImageBitmap(file)
      .then((bitmap) => {
        // Successfully created an ImageBitmap, now draw it on canvas
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get 2D context'))
          return
        }

        ctx.drawImage(bitmap, 0, 0)
        resolve(ctx.getImageData(0, 0, bitmap.width, bitmap.height))
      })
      .catch(() => {
        reject(new Error('Failed to load image or create an ImageBitmap'))
      })
  })
}

export default createImageDataFromFile
