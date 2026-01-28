export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
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
 * This function was adapted from the one in the Readme of https://github.com/DominicTobias/react-image-crop
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
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // set canvas size to match the bounding box
    canvas.width = Math.ceil(bBoxWidth)
    canvas.height = Math.ceil(bBoxHeight)

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)

    // Translate to center of image position
    ctx.translate(-image.width / 2, -image.height / 2)

    // Apply filters only if needed
    if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`
    }

    // draw rotated image
    ctx.drawImage(image, 0, 0)

    // croppedAreaPixels values are bounding box relative
    const data = ctx.getImageData(
        Math.round(pixelCrop.x),
        Math.round(pixelCrop.y),
        Math.round(pixelCrop.width),
        Math.round(pixelCrop.height)
    )

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = Math.round(pixelCrop.width)
    canvas.height = Math.round(pixelCrop.height)

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0)

    // As a blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            resolve(file)
        }, 'image/png', quality)
    })
}
