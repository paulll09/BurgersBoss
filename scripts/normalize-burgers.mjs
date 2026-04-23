import sharp from 'sharp';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';

const DIR = new URL('../public/images/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT_DIR = new URL('../public/images/normalized/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const EXCLUDE = new Set(['heroBurgers-Boss.jpeg', 'heroBurgers-Boss.webp']);
const SIZE = 600;

await mkdir(OUT_DIR, { recursive: true });

// Bias vertical: 0 = crop centrado, 1 = crop desde el fondo
// 0.72 ubica el plato de la hamburguesa en el centro del cuadrado
const BURGER_BIAS = 0.72;

const files = (await readdir(DIR)).filter(f =>
    !EXCLUDE.has(f) && /\.(webp|jpe?g|png)$/i.test(f)
);

console.log(`Procesando ${files.length} imágenes → ${SIZE}×${SIZE} WebP\n`);

for (const file of files) {
    const inputPath = join(DIR, file);
    const outputName = basename(file, extname(file)) + '.webp';
    const outputPath = join(OUT_DIR, outputName);

    const meta = await sharp(inputPath).metadata();
    const { width: w, height: h } = meta;

    // Crop cuadrado centrado horizontalmente, sesgado hacia abajo (burger)
    const cropSize = Math.min(w, h);
    const left = Math.round((w - cropSize) / 2);
    const maxTop = h - cropSize;
    const top = Math.round(maxTop * BURGER_BIAS);

    // Procesar en memoria para evitar conflictos de archivo bloqueado en Windows
    const buffer = await sharp(inputPath)
        .extract({ left, top, width: cropSize, height: cropSize })
        .resize(SIZE, SIZE, { kernel: sharp.kernel.lanczos3 })
        .webp({ quality: 88 })
        .toBuffer();

    await writeFile(outputPath, buffer);

    const arrow = file === outputName ? '(sobreescrito)' : `→ ${outputName}`;
    console.log(`✓  ${file} [${w}×${h}]  ${arrow}`);
}

console.log(`\nListo. Archivos en: public/images/normalized/`);
console.log('Pará el servidor de dev, copiá los archivos de esa carpeta a public/images/ y volvé a arrancar.');
