export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * Crop and process image using canvas.
 * Uses a two-canvas approach to avoid getImageData artifacts.
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    quality = 0.8,
    filters = { brightness: 100, contrast: 100, saturation: 100 }
): Promise<Blob | null> {
    const image = await createImage(imageSrc)

    // Round all crop values to integers to avoid sub-pixel issues
    const cropX = Math.round(pixelCrop.x)
    const cropY = Math.round(pixelCrop.y)
    const cropWidth = Math.round(pixelCrop.width)
    const cropHeight = Math.round(pixelCrop.height)

    const rotRad = getRadianAngle(rotation)

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // Canvas 1: Draw the rotated/flipped/filtered full image
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    if (!tempCtx) {
        return null
    }

    // Use integer dimensions
    tempCanvas.width = Math.ceil(bBoxWidth)
    tempCanvas.height = Math.ceil(bBoxHeight)

    // Translate to center, apply transformations
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
    tempCtx.rotate(rotRad)
    tempCtx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    tempCtx.translate(-image.width / 2, -image.height / 2)

    // Apply filters only if not default
    if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
        tempCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`
    }

    // Draw the full image
    tempCtx.drawImage(image, 0, 0)

    // Canvas 2: Create final cropped canvas with exact dimensions
    const finalCanvas = document.createElement('canvas')
    const finalCtx = finalCanvas.getContext('2d')

    if (!finalCtx) {
        return null
    }

    // Clamp source coordinates to valid range
    const sourceX = Math.max(0, Math.min(cropX, tempCanvas.width - 1))
    const sourceY = Math.max(0, Math.min(cropY, tempCanvas.height - 1))
    const sourceWidth = Math.min(cropWidth, tempCanvas.width - sourceX)
    const sourceHeight = Math.min(cropHeight, tempCanvas.height - sourceY)

    finalCanvas.width = sourceWidth
    finalCanvas.height = sourceHeight

    // Use drawImage to copy the cropped region (much more reliable than getImageData)
    finalCtx.drawImage(
        tempCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
        0, 0, sourceWidth, sourceHeight               // Destination rectangle
    )

    // Return as blob
    return new Promise((resolve) => {
        finalCanvas.toBlob((blob) => {
            resolve(blob)
        }, 'image/png', quality)
    })
}
