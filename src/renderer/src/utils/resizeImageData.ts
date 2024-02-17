function resizeImageData(
  imageData: ImageData,
  newWidth: number,
  newHeight: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    // Create an off-screen canvas for the original ImageData
    const originalCanvas = document.createElement('canvas')
    const originalContext = originalCanvas.getContext('2d')
    originalCanvas.width = imageData.width
    originalCanvas.height = imageData.height

    if (!originalContext) {
      reject(new Error('Unable to get 2D context'))
      return
    }

    // Put the original ImageData onto this canvas
    originalContext.putImageData(imageData, 0, 0)

    // Create another off-screen canvas for resizing
    const resizedCanvas = document.createElement('canvas')
    const resizedContext = resizedCanvas.getContext('2d')
    resizedCanvas.width = newWidth
    resizedCanvas.height = newHeight

    if (!resizedContext) {
      reject(new Error('Unable to get 2D context for resized canvas'))
      return
    }

    // Draw the original canvas onto the resized canvas, effectively resizing the image
    resizedContext.drawImage(originalCanvas, 0, 0, newWidth, newHeight)

    // Extract the resized image's data
    const resizedImageData = resizedContext.getImageData(0, 0, newWidth, newHeight)
    resolve(resizedImageData)
  })
}

export default resizeImageData
