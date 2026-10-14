/**
 * Client-side image downscaling and re-encoding for Storage uploads.
 *
 * Two rules drive this module:
 *
 * 1. `canvas.toBlob()` silently falls back to PNG when the browser cannot encode
 *    the requested format (Safari/iOS lacked WebP encoding for a long time). PNG
 *    is lossless, so a photo ends up around 1 MB instead of 30 KB. Never trust the
 *    requested type: always read `blob.type` back and name the file after it.
 *
 * 2. Images must not be larger than the size they are rendered at. Product cards
 *    render around 200px wide and the detail modal around 1100px; promos render
 *    around 1100px. The sizes below cover those at 2x pixel density.
 */

/** Encode a canvas, honouring the format the browser actually produced. */
function encodeCanvas(canvas, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(
            (webpBlob) => {
                // A browser without WebP encoding hands back a PNG here.
                if (webpBlob && webpBlob.type === 'image/webp') {
                    resolve(webpBlob);
                    return;
                }
                // JPEG is universally supported and vastly smaller than PNG for photos.
                canvas.toBlob(
                    (jpegBlob) => resolve(jpegBlob || webpBlob || null),
                    'image/jpeg',
                    quality,
                );
            },
            'image/webp',
            quality,
        );
    });
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen.'));
        };
        img.src = url;
    });
}

/**
 * Downscale and re-encode an image file.
 *
 * @param {File}   file              Source file picked by the user.
 * @param {object} options
 * @param {number} options.maxSize   Max edge length in px.
 * @param {'cover'|'contain'} options.fit  `cover` crops to a centred square.
 * @param {number} options.quality   Encoder quality, 0-1.
 * @param {string} options.prefix    Filename prefix.
 * @returns {Promise<File|null>}     File whose `type` and extension match its bytes.
 */
export async function resizeImage(file, { maxSize, fit, quality, prefix }) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (fit === 'cover') {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        const target = Math.min(maxSize, side);
        canvas.width = target;
        canvas.height = target;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
    } else {
        const scale = Math.min(1, maxSize / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    const blob = await encodeCanvas(canvas, quality);
    if (!blob) return null;

    // Name the file after the bytes we actually got, not the ones we asked for.
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `${prefix}-${Date.now()}.${ext}`, { type: blob.type });
}

/** Product images: centre-cropped square, sized for the detail modal at 2x. */
export function resizeProductImage(file) {
    return resizeImage(file, { maxSize: 600, fit: 'cover', quality: 0.72, prefix: 'product' });
}

/** Promo images: aspect ratio preserved, sized for the carousel at 2x. */
export function resizePromoImage(file) {
    return resizeImage(file, { maxSize: 900, fit: 'contain', quality: 0.72, prefix: 'promo' });
}
