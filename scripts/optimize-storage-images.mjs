#!/usr/bin/env node
/**
 * One-off migration: re-encode Supabase Storage images into smaller WebP files.
 *
 * Why: the public menu downloads ~8.4 MB of images per fresh visitor, which pushes
 * Cached Egress past the 5 GB free-plan limit. Most files are oversized for the
 * sizes they are actually rendered at (product cards render at 200px CSS width).
 *
 * Safety model:
 *   1. Download the current file, re-encode it, and only continue if it is smaller.
 *   2. Upload under a NEW filename (never overwrite in place: a long cache-control
 *      means the CDN would keep serving the stale copy for up to a year).
 *   3. Update the database row to the new URL.
 *   4. If the update fails, delete the just-uploaded file and leave the row untouched.
 *   5. Original files are NEVER deleted here. Run with --delete-old afterwards,
 *      once the site has been verified.
 *
 * At every point the row either points at the old working file or the new one.
 *
 * Usage:
 *   node scripts/optimize-storage-images.mjs                 # dry run, changes nothing
 *   node scripts/optimize-storage-images.mjs --apply         # perform the migration
 *   node scripts/optimize-storage-images.mjs --delete-old    # delete originals (after verifying)
 *
 * Options:
 *   --only=products|promotions   Restrict the run to a single target.
 *   --product-size=600           Max edge, in px, for product images.
 *   --promo-size=900             Max width, in px, for promo images.
 *   --quality=72                 WebP quality (1-100).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY: the anon key cannot update rows or delete
 * objects under RLS. Read it from the Supabase dashboard under
 * Project Settings -> API -> service_role. Never commit it or ship it to the client.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = resolve(ROOT, 'scripts/.image-migration-report.json');

/* ── CLI ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const flagValue = (name, fallback) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : fallback;
};

const APPLY = hasFlag('apply');
const DELETE_OLD = hasFlag('delete-old');
const ONLY = flagValue('only', null);
const QUALITY = Number(flagValue('quality', 72));
const PRODUCT_SIZE = Number(flagValue('product-size', 600));
const PROMO_SIZE = Number(flagValue('promo-size', 900));

/** Skip the rewrite unless the new file saves at least this fraction of the bytes. */
const MIN_SAVING_RATIO = 0.05;

const TARGETS = [
    {
        table: 'products',
        bucket: 'product-images',
        // Cards render at 200px, the modal larger. 600px covers both at 2x density.
        resize: { width: PRODUCT_SIZE, height: PRODUCT_SIZE, fit: 'cover', position: 'centre' },
    },
    {
        table: 'promotions',
        bucket: 'promo-images',
        // Carousel renders at ~1104px wide; 900px is indistinguishable in practice.
        resize: { width: PROMO_SIZE, height: null, fit: 'inside', withoutEnlargement: true },
    },
];

/* ── Environment ───────────────────────────────────────────────────────── */

function loadEnvFile() {
    for (const name of ['.env.local', '.env']) {
        const path = resolve(ROOT, name);
        if (!existsSync(path)) continue;
        for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const eq = line.indexOf('=');
            if (eq === -1) continue;
            const key = line.slice(0, eq).trim();
            const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!(key in process.env)) process.env[key] = value;
        }
    }
}

loadEnvFile();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// A dry run only reads: public buckets and the same rows the website already fetches,
// so the anon key is enough. Writing rows and deleting objects needs service_role.
const NEEDS_SERVICE_KEY = APPLY || DELETE_OLD;
const KEY = NEEDS_SERVICE_KEY ? SERVICE_KEY : (SERVICE_KEY || ANON_KEY);

if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) in the environment or .env file.');
    process.exit(1);
}
if (!KEY) {
    console.error(
        NEEDS_SERVICE_KEY
            ? 'Missing SUPABASE_SERVICE_ROLE_KEY. Writing rows and deleting objects require it.\n' +
              'Get it from the Supabase dashboard: Project Settings -> API -> service_role.\n' +
              'Pass it for this run only, without writing it to disk:\n' +
              '  SUPABASE_SERVICE_ROLE_KEY=... node scripts/optimize-storage-images.mjs --apply'
            : 'Missing SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) in the environment or .env file.',
    );
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

/** Extract the object path from a Supabase public URL, or null if it is external. */
function storagePathFromUrl(url, bucket) {
    if (typeof url !== 'string' || !url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const at = url.indexOf(marker);
    if (at === -1) return null;
    return decodeURIComponent(url.slice(at + marker.length).split('?')[0]);
}

function newFilename() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
}

function readReport() {
    if (!existsSync(REPORT_PATH)) return { migrated: [] };
    return JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
}

function writeReport(report) {
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

/* ── Delete pass ───────────────────────────────────────────────────────── */

async function deleteOriginals() {
    const report = readReport();
    const pending = report.migrated.filter((entry) => !entry.oldDeleted);

    if (pending.length === 0) {
        console.log('Nothing to delete: no migrated originals pending removal.');
        return;
    }

    console.log(`Deleting ${pending.length} original file(s)...\n`);

    const byBucket = new Map();
    for (const entry of pending) {
        if (!byBucket.has(entry.bucket)) byBucket.set(entry.bucket, []);
        byBucket.get(entry.bucket).push(entry);
    }

    for (const [bucket, entries] of byBucket) {
        const paths = entries.map((e) => e.oldPath);
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) {
            console.error(`  ${bucket}: FAILED - ${error.message}`);
            continue;
        }
        for (const entry of entries) entry.oldDeleted = true;
        console.log(`  ${bucket}: removed ${paths.length} file(s)`);
    }

    writeReport(report);
    console.log('\nDone. Storage reclaimed; the database already points at the new files.');
}

/* ── Migration pass ────────────────────────────────────────────────────── */

async function migrateTarget(target) {
    const { table, bucket, resize } = target;
    console.log(`\n=== ${table} (bucket: ${bucket}) ===`);

    const { data: rows, error } = await supabase
        .from(table)
        .select('id, image_url')
        .not('image_url', 'is', null);

    if (error) {
        console.error(`  Could not read ${table}: ${error.message}`);
        return { before: 0, after: 0, changed: 0, skipped: 0, failed: 0, entries: [] };
    }

    const stats = { before: 0, after: 0, changed: 0, skipped: 0, failed: 0, entries: [] };

    for (const row of rows) {
        const oldPath = storagePathFromUrl(row.image_url, bucket);
        if (!oldPath) {
            stats.skipped++;
            continue;
        }

        const { data: blob, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(oldPath);

        if (downloadError) {
            console.log(`  ! ${oldPath} - download failed: ${downloadError.message}`);
            stats.failed++;
            continue;
        }

        const original = Buffer.from(await blob.arrayBuffer());

        let optimized;
        try {
            optimized = await sharp(original)
                .rotate() // honour EXIF orientation before dropping the metadata
                .resize(resize)
                .webp({ quality: QUALITY })
                .toBuffer();
        } catch (e) {
            console.log(`  ! ${oldPath} - re-encode failed: ${e.message}`);
            stats.failed++;
            continue;
        }

        stats.before += original.length;

        if (optimized.length > original.length * (1 - MIN_SAVING_RATIO)) {
            console.log(`  = ${oldPath} - already optimal (${kb(original.length)}), left as is`);
            stats.after += original.length;
            stats.skipped++;
            continue;
        }

        const saved = original.length - optimized.length;
        const pct = ((saved / original.length) * 100).toFixed(0);
        console.log(`  > ${oldPath}  ${kb(original.length)} -> ${kb(optimized.length)}  (-${pct}%)`);

        if (!APPLY) {
            stats.after += optimized.length;
            stats.changed++;
            continue;
        }

        const newPath = newFilename();

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(newPath, optimized, {
                contentType: 'image/webp',
                cacheControl: '31536000',
            });

        if (uploadError) {
            console.log(`    upload failed: ${uploadError.message}`);
            stats.after += original.length;
            stats.failed++;
            continue;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(newPath);

        const { error: updateError } = await supabase
            .from(table)
            .update({ image_url: urlData.publicUrl })
            .eq('id', row.id);

        if (updateError) {
            // Roll back the orphan upload so a retry starts from a clean state.
            await supabase.storage.from(bucket).remove([newPath]);
            console.log(`    row update failed, upload rolled back: ${updateError.message}`);
            stats.after += original.length;
            stats.failed++;
            continue;
        }

        stats.after += optimized.length;
        stats.changed++;
        stats.entries.push({
            table,
            bucket,
            rowId: row.id,
            oldPath,
            newPath,
            oldBytes: original.length,
            newBytes: optimized.length,
            oldDeleted: false,
            migratedAt: new Date().toISOString(),
        });
    }

    return stats;
}

async function migrate() {
    const targets = ONLY ? TARGETS.filter((t) => t.table === ONLY) : TARGETS;

    if (targets.length === 0) {
        console.error(`Unknown target "${ONLY}". Valid values: ${TARGETS.map((t) => t.table).join(', ')}`);
        process.exit(1);
    }

    console.log(APPLY ? 'MODE: apply (writing changes)' : 'MODE: dry run (nothing will be modified)');
    console.log(`Product images: max ${PRODUCT_SIZE}px | Promo images: max ${PROMO_SIZE}px | WebP quality ${QUALITY}`);

    let before = 0;
    let after = 0;
    let changed = 0;
    let skipped = 0;
    let failed = 0;
    const entries = [];

    for (const target of targets) {
        const stats = await migrateTarget(target);
        before += stats.before;
        after += stats.after;
        changed += stats.changed;
        skipped += stats.skipped;
        failed += stats.failed;
        entries.push(...stats.entries);
    }

    const saved = before - after;
    const pct = before > 0 ? ((saved / before) * 100).toFixed(0) : '0';

    console.log('\n=== Summary ===');
    console.log(`  Rewritten : ${changed}`);
    console.log(`  Skipped   : ${skipped}`);
    console.log(`  Failed    : ${failed}`);
    console.log(`  Payload   : ${kb(before)} -> ${kb(after)}  (-${pct}%)`);

    if (APPLY && entries.length > 0) {
        const report = readReport();
        report.migrated.push(...entries);
        report.updatedAt = new Date().toISOString();
        writeReport(report);
        console.log(`\n  Report written to ${REPORT_PATH}`);
        console.log('  Originals were kept. Verify the site, then run with --delete-old to reclaim the space.');
    }

    if (!APPLY) {
        console.log('\n  This was a dry run. Re-run with --apply to perform the migration.');
    }
}

/* ── Entry point ───────────────────────────────────────────────────────── */

try {
    if (DELETE_OLD) await deleteOriginals();
    else await migrate();
} catch (e) {
    console.error(`\nUnexpected failure: ${e.message}`);
    process.exit(1);
}
